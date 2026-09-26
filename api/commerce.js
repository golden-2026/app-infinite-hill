const MAX_BODY_BYTES = 8 * 1024;
const STRIPE_API = "https://api.stripe.com/v1";
const PLAN_OFFERS = Object.freeze({
  plus: { priceEnv: "STRIPE_PRICE_PLUS", mode: "subscription" },
  table: { priceEnv: "STRIPE_PRICE_TABLE", mode: "subscription" },
});
const GIFT_OFFERS = Object.freeze({
  first_100_days: { priceEnv: "STRIPE_GIFT_PRICE_100_DAYS", mode: "payment" },
  year: { priceEnv: "STRIPE_GIFT_PRICE_YEAR", mode: "payment" },
  table: { priceEnv: "STRIPE_GIFT_PRICE_TABLE", mode: "payment" },
});

function respond(res, statusCode, value) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.end(JSON.stringify(value));
}

export async function readRequestBody(req) {
  if (req.body !== undefined) {
    const raw = typeof req.body === "string" || Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) throw Object.assign(new Error("too_large"), { statusCode: 413 });
    return typeof req.body === "object" && !Buffer.isBuffer(req.body) ? req.body : JSON.parse(raw || "{}");
  }
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) throw Object.assign(new Error("too_large"), { statusCode: 413 });
  }
  return JSON.parse(raw || "{}");
}

export function hasSafePublicUrl(value) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

function supabaseConfig(env) {
  const url = typeof env.SUPABASE_URL === "string" ? env.SUPABASE_URL.replace(/\/$/, "") : "";
  return { url, anonKey: env.SUPABASE_ANON_KEY, serviceKey: env.SUPABASE_SERVICE_ROLE_KEY };
}

export function commerceStatus(env) {
  const supabase = supabaseConfig(env);
  const configured = Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && hasSafePublicUrl(env.GOLDEN_PUBLIC_URL) && supabase.url && supabase.anonKey && supabase.serviceKey);
  const offers = {};
  for (const [id, offer] of Object.entries(PLAN_OFFERS)) offers[`plan:${id}`] = { configured: Boolean(env[offer.priceEnv]) };
  for (const [id, offer] of Object.entries(GIFT_OFFERS)) offers[`gift:${id}`] = { configured: Boolean(env[offer.priceEnv]) };
  return { provider: "stripe", configured, state: configured ? "configured" : "provider_not_configured", offers };
}

function requestedOffer(body, env) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  if (Object.keys(body).some((key) => !["action", "planId", "giftSku", "sessionId"].includes(key))) return null;
  if (body.action !== "checkout" || typeof body.sessionId === "string") return null;
  const plan = typeof body.planId === "string" ? PLAN_OFFERS[body.planId] : null;
  const gift = typeof body.giftSku === "string" ? GIFT_OFFERS[body.giftSku] : null;
  if (Boolean(plan) === Boolean(gift)) return null;
  const selected = plan || gift;
  return { kind: plan ? "plan" : "gift", productId: plan ? body.planId : body.giftSku, mode: selected.mode, priceId: env[selected.priceEnv] };
}

function bearerToken(req) {
  const value = req.headers?.authorization || req.headers?.Authorization || "";
  const match = /^Bearer ([A-Za-z0-9._~-]{20,4096})$/.exec(value);
  return match?.[1] || null;
}

export async function authenticatedAccount(req, env, fetchImpl) {
  const token = bearerToken(req);
  const { url, anonKey } = supabaseConfig(env);
  if (!token || !url || !anonKey) return null;
  const response = await fetchImpl(`${url}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } });
  if (!response.ok) return null;
  const user = await response.json();
  return typeof user?.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id) ? { id: user.id, token } : null;
}

async function retrieveCheckoutSession(sessionId, env, fetchImpl) {
  if (!/^cs_[A-Za-z0-9_]{8,200}$/.test(sessionId)) return null;
  const response = await fetchImpl(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } });
  if (!response.ok) return null;
  return response.json();
}

async function currentEntitlements(account, env, fetchImpl) {
  const { url, anonKey } = supabaseConfig(env);
  const query = new URLSearchParams({ select: "product_key,status,starts_at,ends_at", user_id: `eq.${account.id}`, status: "in.(active,grace)" });
  const response = await fetchImpl(`${url}/rest/v1/entitlements?${query}`, { headers: { apikey: anonKey, Authorization: `Bearer ${account.token}` } });
  if (!response.ok) return null;
  const rows = await response.json();
  return Array.isArray(rows) ? rows : null;
}

async function checkoutReturn(account, sessionId, env, fetchImpl, res) {
  if (typeof sessionId !== "string") return respond(res, 400, { state: "rejected", errorCode: "invalid_session_id" });
  const session = await retrieveCheckoutSession(sessionId, env, fetchImpl);
  const sessionAccount = session?.client_reference_id || session?.metadata?.account_id;
  if (!session || sessionAccount !== account.id) return respond(res, 404, { state: "unverified", verified: false, errorCode: "checkout_not_found" });
  const entitlements = await currentEntitlements(account, env, fetchImpl);
  if (!entitlements) return respond(res, 503, { state: "unavailable", verified: false, errorCode: "entitlement_status_unavailable" });
  const productId = session.metadata?.product_id;
  const activated = session.payment_status === "paid" && entitlements.some((item) => item.product_key === productId && item.status === "active");
  return respond(res, 200, { state: activated ? "entitled" : "processing", verified: true, activated, productId: activated ? productId : undefined });
}

export function createCommerceHandler({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  return async function commerceHandler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method === "GET") return respond(res, 200, commerceStatus(env));
    if (req.method !== "POST") { res.setHeader("Allow", "GET, POST"); return respond(res, 405, { state: "provider_not_configured", errorCode: "method_not_allowed" }); }
    let body;
    try { body = await readRequestBody(req); } catch (error) { return respond(res, error.statusCode || 400, { state: "rejected", errorCode: error.statusCode === 413 ? "payload_too_large" : "invalid_json" }); }
    if (body?.action === "status" && Object.keys(body).every((key) => ["action", "sessionId"].includes(key))) {
      if (!commerceStatus(env).configured) return respond(res, 503, { state: "provider_not_configured", errorCode: "provider_not_configured" });
      if (!fetchImpl) return respond(res, 503, { state: "provider_not_configured", errorCode: "provider_not_configured" });
      const account = await authenticatedAccount(req, env, fetchImpl).catch(() => null);
      if (!account) return respond(res, 401, { state: "unauthenticated", errorCode: "account_authentication_required" });
      return checkoutReturn(account, body.sessionId, env, fetchImpl, res);
    }
    const offer = requestedOffer(body, env);
    const status = commerceStatus(env);
    if (!offer) return respond(res, 400, { state: "rejected", errorCode: "invalid_checkout_request" });
    if (!status.configured || !offer.priceId) return respond(res, 503, { state: "provider_not_configured", errorCode: "provider_not_configured", configured: status.configured });
    if (!fetchImpl) return respond(res, 503, { state: "provider_not_configured", errorCode: "provider_not_configured", configured: false });
    const account = await authenticatedAccount(req, env, fetchImpl).catch(() => null);
    if (!account) return respond(res, 401, { state: "unauthenticated", errorCode: "account_authentication_required" });

    const publicUrl = env.GOLDEN_PUBLIC_URL.replace(/\/$/, "");
    const params = new URLSearchParams({
      mode: offer.mode,
      success_url: `${publicUrl}/?commerce=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${publicUrl}/?commerce=cancelled`,
      "line_items[0][price]": offer.priceId,
      "line_items[0][quantity]": "1",
      client_reference_id: account.id,
      "metadata[account_id]": account.id,
      "metadata[product_kind]": offer.kind,
      "metadata[product_id]": offer.productId,
    });
    if (offer.mode === "subscription") {
      params.set("subscription_data[metadata][account_id]", account.id);
      params.set("subscription_data[metadata][product_kind]", offer.kind);
      params.set("subscription_data[metadata][product_id]", offer.productId);
    }
    try {
      const upstream = await fetchImpl(`${STRIPE_API}/checkout/sessions`, { method: "POST", headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString() });
      if (!upstream.ok) return respond(res, 502, { state: "unavailable", errorCode: "checkout_unavailable" });
      const session = await upstream.json();
      if (typeof session?.id !== "string" || typeof session?.url !== "string" || !hasSafePublicUrl(session.url)) return respond(res, 502, { state: "unavailable", errorCode: "invalid_checkout_response" });
      return respond(res, 201, { state: "checkout_ready", checkoutUrl: session.url, sessionId: session.id });
    } catch { return respond(res, 502, { state: "unavailable", errorCode: "checkout_unavailable" }); }
  };
}

export default createCommerceHandler();
