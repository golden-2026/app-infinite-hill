import { createHash, randomBytes, randomUUID } from "node:crypto";

const MAX_BODY_BYTES = 8 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CLAIM_TOKEN = /^[A-Za-z0-9_-]{32,128}$/;
const GIFT_OFFERS = Object.freeze({
  first_100_days: "STRIPE_GIFT_PRICE_100_DAYS",
  year: "STRIPE_GIFT_PRICE_YEAR",
  table: "STRIPE_GIFT_PRICE_TABLE",
});
const METHODS = "GET, POST";

function json(res, statusCode, value) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  return res.end(JSON.stringify(value));
}

function configured(env, fetchImpl) {
  return typeof fetchImpl === "function" && isHttps(env.SUPABASE_URL) &&
    typeof env.SUPABASE_ANON_KEY === "string" && env.SUPABASE_ANON_KEY.length > 0 &&
    typeof env.SUPABASE_SERVICE_ROLE_KEY === "string" && env.SUPABASE_SERVICE_ROLE_KEY.length > 0 &&
    typeof env.STRIPE_SECRET_KEY === "string" && env.STRIPE_SECRET_KEY.length > 0 &&
    isHttps(env.GOLDEN_PUBLIC_URL);
}

function isHttps(value) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

async function readBody(req) {
  if (req.body !== undefined) {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) throw Object.assign(new Error(), { statusCode: 413 });
    return typeof req.body === "object" && !Buffer.isBuffer(req.body) ? req.body : JSON.parse(raw || "{}");
  }
  let raw = "";
  if (typeof req[Symbol.asyncIterator] !== "function") return {};
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) throw Object.assign(new Error(), { statusCode: 413 });
  }
  return JSON.parse(raw || "{}");
}

function authToken(req) {
  const authorization = req.headers?.authorization || req.headers?.Authorization || "";
  const match = /^Bearer ([A-Za-z0-9._~-]{16,4096})$/.exec(authorization);
  return match?.[1] || null;
}

function route(req) {
  const url = new URL(req.url || "/api/gifts", "http://localhost");
  if (url.pathname !== "/api/gifts" && !url.pathname.startsWith("/api/gifts/")) return null;
  const tail = url.pathname.slice("/api/gifts".length).split("/").filter(Boolean);
  if (tail.length > 1) return null;
  let giftId = null;
  if (tail.length) {
    try { giftId = decodeURIComponent(tail[0]); } catch { return null; }
  }
  return { giftId, search: url.searchParams };
}

function exactKeys(body, keys) {
  return Object.keys(body).every((key) => keys.includes(key));
}

function validCreate(body) {
  return body?.action === "create" && exactKeys(body, ["action", "productKey"]) && Object.hasOwn(GIFT_OFFERS, body.productKey);
}

function validAction(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  switch (body.action) {
    case "create": return validCreate(body);
    case "create-checkout": return UUID.test(body.giftId || "") && exactKeys(body, ["action", "giftId"]);
    case "status": return UUID.test(body.giftId || "") && exactKeys(body, ["action", "giftId"]);
    case "check-claim":
    case "claim": return typeof body.claimToken === "string" && CLAIM_TOKEN.test(body.claimToken) && exactKeys(body, ["action", "claimToken"]);
    case "schedule-delivery": return UUID.test(body.giftId || "") && exactKeys(body, ["action", "giftId", "delivery"]) && validDeliveryRequest(body.delivery);
    case "retry-delivery": return UUID.test(body.giftId || "") && exactKeys(body, ["action", "giftId"]);
    // These outcomes can only be generated from verified provider callbacks.
    case "record-opened":
    case "record-delivered": return UUID.test(body.giftId || "") && exactKeys(body, ["action", "giftId"]);
    default: return false;
  }
}

function validDeliveryRequest(value) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    exactKeys(value, ["method", "scheduledAt"]) && ["email", "link"].includes(value.method) &&
    (value.scheduledAt === undefined || (typeof value.scheduledAt === "string" && !Number.isNaN(Date.parse(value.scheduledAt))));
}

function dbHeaders(env, prefer = "return=representation") {
  return { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json", Prefer: prefer };
}

function dbUrl(env, table, query = "") {
  return `${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${table}${query ? `?${query}` : ""}`;
}

async function authenticate(token, env, fetchImpl) {
  const response = await fetchImpl(`${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`, {
    method: "GET", headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const user = await safeJson(response);
  return UUID.test(user?.id || "") ? user : null;
}

async function safeJson(response) {
  try { return await response.json(); } catch { return null; }
}

async function dbRequest(env, fetchImpl, table, { method = "GET", query = "", body, prefer } = {}) {
  const response = await fetchImpl(dbUrl(env, table, query), {
    method, headers: dbHeaders(env, prefer),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const parsed = await safeJson(response);
  return { ok: response.ok, status: response.status, data: parsed };
}

function safeGift(row, evidence = null) {
  if (!row || !UUID.test(row.id || "") || typeof row.product_key !== "string") throw new Error("invalid_gift_record");
  let state;
  if (row.status === "claimed") state = "claimed";
  else if (row.status === "expired") state = "expired";
  else if (row.status === "pending") state = row.purchased_at ? "paid-confirmed" : row.external_ref ? "checkout-pending" : "draft";
  else throw new Error("gift_unavailable");
  return {
    id: row.id,
    productKey: row.product_key,
    state,
    createdAt: row.created_at,
    updatedAt: row.claimed_at || row.purchased_at || row.created_at,
    purchasedAt: row.purchased_at || null,
    claimedAt: row.claimed_at || null,
    expiresAt: row.expires_at || null,
    evidence: state === "checkout-pending" ? { provider: "stripe-checkout", eventId: row.external_ref, verified: true }
      : state === "paid-confirmed" ? { provider: "stripe-webhook", eventId: row.external_ref || row.id, verified: true }
      : state === "expired" ? { provider: "gift-service", eventId: `expired:${row.id}`, verified: true }
      : { provider: "gift-service", eventId: `claimed:${row.id}`, verified: true },
    ...(evidence ? { evidence } : {}),
  };
}

function secretToken() { return randomBytes(32).toString("base64url"); }
function tokenHash(token) { return `\\x${createHash("sha256").update(token).digest("hex")}`; }
function utcNow(now) { return new Date(now()).toISOString(); }

function oneGiftQuery(filters) {
  const params = new URLSearchParams({ select: "id,purchaser_id,recipient_user_id,product_key,status,external_ref,purchased_at,claimed_at,expires_at,created_at", ...filters, limit: "1" });
  return params.toString();
}

async function readOwnedGift(giftId, userId, env, fetchImpl) {
  const query = oneGiftQuery({ id: `eq.${giftId}` });
  const result = await dbRequest(env, fetchImpl, "gifts", { query });
  if (!result.ok || !Array.isArray(result.data)) throw new Error("gift_read_failed");
  const row = result.data[0];
  if (!row || (row.purchaser_id !== userId && row.recipient_user_id !== userId)) return null;
  return row;
}

async function createGift(body, user, env, fetchImpl, now) {
  const claimToken = secretToken();
  const expiresAt = new Date(now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const result = await dbRequest(env, fetchImpl, "gifts", {
    method: "POST", query: "select=id,purchaser_id,recipient_user_id,product_key,status,external_ref,purchased_at,claimed_at,expires_at,created_at",
    body: [{ purchaser_id: user.id, product_key: body.productKey, status: "pending", claim_token_hash: tokenHash(claimToken), expires_at: expiresAt }],
  });
  const row = Array.isArray(result.data) ? result.data[0] : null;
  if (!result.ok || !row) throw new Error("gift_create_failed");
  return { gift: { id: row.id, productKey: row.product_key, state: "draft", createdAt: row.created_at, updatedAt: row.created_at, evidence: null }, claimToken };
}

async function stripeCheckout(row, user, env, fetchImpl) {
  const priceEnv = GIFT_OFFERS[row.product_key];
  if (!priceEnv || !env[priceEnv]) throw new Error("gift_offer_unavailable");
  const base = env.GOLDEN_PUBLIC_URL.replace(/\/$/, "");
  const params = new URLSearchParams({
    mode: "payment",
    success_url: `${base}/?gift=checkout-return`,
    cancel_url: `${base}/?gift=checkout-canceled`,
    "line_items[0][price]": env[priceEnv],
    "line_items[0][quantity]": "1",
    client_reference_id: user.id,
    "metadata[product_kind]": "gift",
    "metadata[product_id]": row.product_key,
    "metadata[gift_id]": row.id,
    "metadata[purchaser_id]": user.id,
  });
  const response = await fetchImpl("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": `golden-gift-${row.id}` },
    body: params.toString(),
  });
  const session = await safeJson(response);
  if (!response.ok || typeof session?.id !== "string" || !isHttps(session.url)) throw new Error("checkout_unavailable");
  return session;
}

async function findClaim(claimToken, env, fetchImpl) {
  const query = oneGiftQuery({ claim_token_hash: `eq.${tokenHash(claimToken)}` });
  const result = await dbRequest(env, fetchImpl, "gifts", { query });
  if (!result.ok || !Array.isArray(result.data)) throw new Error("gift_read_failed");
  return result.data[0] || null;
}

function claimLookup(state) {
  return { gift: { id: state.id || "unknown", state, evidence: { provider: "gift-service", eventId: `lookup:${state.id || "unknown"}`, verified: true } } };
}

async function claimOutcome(row, env, fetchImpl, now) {
  if (!row) return claimLookup("invalid");
  if (row.status === "claimed") return claimLookup("already-claimed");
  if (row.status === "expired" || (row.expires_at && Date.parse(row.expires_at) <= now())) {
    if (row.status !== "expired") await dbRequest(env, fetchImpl, "gifts", { method: "PATCH", query: `id=eq.${row.id}&status=eq.pending`, body: { status: "expired" } });
    return claimLookup("expired");
  }
  if (row.status !== "pending" || !row.purchased_at) throw Object.assign(new Error("gift_not_paid"), { publicCode: "gift_not_ready" });
  return { id: row.id, row };
}

async function claimGift(token, user, env, fetchImpl, now) {
  const row = await findClaim(token, env, fetchImpl);
  const outcome = await claimOutcome(row, env, fetchImpl, now);
  if (outcome.gift) return outcome;
  const claimedAt = utcNow(now);
  const update = await dbRequest(env, fetchImpl, "gifts", {
    method: "PATCH",
    query: `id=eq.${outcome.id}&status=eq.pending&recipient_user_id=is.null&purchased_at=not.is.null&claim_token_hash=eq.${encodeURIComponent(tokenHash(token))}`,
    body: { status: "claimed", recipient_user_id: user.id, claimed_at: claimedAt },
  });
  const claimed = Array.isArray(update.data) ? update.data[0] : null;
  if (!update.ok) throw new Error("gift_claim_failed");
  if (!claimed) return claimLookup("already-claimed");

  const entitlement = await dbRequest(env, fetchImpl, "entitlements", {
    method: "POST", query: "on_conflict=source,external_ref", prefer: "resolution=ignore-duplicates,return=representation",
    body: [{ user_id: user.id, product_key: claimed.product_key, status: "active", source: "gift", external_ref: `gift:${claimed.id}`, starts_at: claimedAt }],
  });
  if (!entitlement.ok) {
    // Compensate only our exact claim write; if rollback fails, report unavailable
    // and keep the row hidden from success responses for manual reconciliation.
    await dbRequest(env, fetchImpl, "gifts", {
      method: "PATCH", query: `id=eq.${claimed.id}&status=eq.claimed&recipient_user_id=eq.${user.id}&claimed_at=eq.${encodeURIComponent(claimedAt)}`,
      body: { status: "pending", recipient_user_id: null, claimed_at: null },
    });
    throw new Error("gift_entitlement_write_failed");
  }
  return { gift: { id: claimed.id, productKey: claimed.product_key, state: "claimed", createdAt: claimed.created_at, updatedAt: claimedAt, claimedAt, evidence: { provider: "gift-service", eventId: randomUUID(), verified: true } } };
}

function responseForError(error) {
  const code = error.publicCode || error.message;
  if (code === "gift_not_ready") return [409, { state: "pending", errorCode: "gift_not_ready" }];
  if (code === "gift_offer_unavailable") return [503, { state: "pending", errorCode: code }];
  if (code === "checkout_unavailable") return [502, { state: "pending", errorCode: code }];
  if (["gift_create_failed", "gift_read_failed", "gift_claim_failed", "gift_entitlement_write_failed"].includes(code)) return [503, { state: "pending", errorCode: code }];
  return [503, { state: "pending", errorCode: "gift_service_unavailable" }];
}

export function createGiftsHandler({ env = process.env, fetchImpl = globalThis.fetch, now = () => Date.now() } = {}) {
  return async function giftsHandler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (!configured(env, fetchImpl)) return json(res, 503, { state: "pending", configured: false, connected: false, errorCode: "provider_not_configured" });
    if (req.method !== "GET" && req.method !== "POST") { res.setHeader("Allow", METHODS); return json(res, 405, { state: "pending", configured: true, connected: false, errorCode: "method_not_allowed" }); }
    let body = {};
    if (req.method === "POST") {
      try { body = await readBody(req); } catch (error) { return json(res, error.statusCode === 413 ? 413 : 400, { state: "pending", errorCode: error.statusCode === 413 ? "payload_too_large" : "invalid_json" }); }
      if (!body || typeof body !== "object" || Array.isArray(body) || !validAction(body)) return json(res, 400, { state: "pending", errorCode: "invalid_request" });
    }
    let parsedRoute;
    try { parsedRoute = route(req); } catch { return json(res, 400, { state: "pending", errorCode: "invalid_route" }); }
    if (!parsedRoute) return json(res, 400, { state: "pending", errorCode: "invalid_route" });

    const action = req.method === "GET" ? "status" : body.action;
    if ((action === "status" && !(parsedRoute.giftId || UUID.test(body.giftId || ""))) || (req.method === "GET" && parsedRoute.search.size > 0)) {
      return json(res, 400, { state: "pending", errorCode: "invalid_request" });
    }
    if (["record-opened", "record-delivered"].includes(body.action)) return json(res, 400, { state: "pending", errorCode: "provider_event_required" });
    if (["schedule-delivery", "retry-delivery"].includes(action)) return json(res, 503, { state: "pending", errorCode: "delivery_provider_not_configured" });

    const token = authToken(req);
    // Claim-link lookup is authenticated by its high-entropy token. Every other
    // operation needs a verified Supabase Auth identity.
    const publicClaimLookup = action === "check-claim";
    if (!publicClaimLookup && !token) return json(res, 401, { state: "pending", errorCode: "authentication_required" });
    let user = null;
    if (token) {
      try { user = await authenticate(token, env, fetchImpl); } catch { return json(res, 503, { state: "pending", errorCode: "authentication_unavailable" }); }
      if (!user) return json(res, 401, { state: "pending", errorCode: "authentication_required" });
    }

    try {
      if (action === "create") return json(res, 201, await createGift(body, user, env, fetchImpl, now));
      if (action === "create-checkout") {
        const row = await readOwnedGift(body.giftId, user.id, env, fetchImpl);
        if (!row || row.status !== "pending" || row.purchased_at) return json(res, 404, { state: "pending", errorCode: "gift_unavailable" });
        const session = row.external_ref
          ? await fetchStripeSession(row.external_ref, env, fetchImpl)
          : await stripeCheckout(row, user, env, fetchImpl);
        if (!row.external_ref) {
          const saved = await dbRequest(env, fetchImpl, "gifts", { method: "PATCH", query: `id=eq.${row.id}&purchaser_id=eq.${user.id}&status=eq.pending&external_ref=is.null`, body: { external_ref: session.id } });
          if (!saved.ok) return json(res, 503, { state: "pending", errorCode: "gift_checkout_link_failed" });
        }
        return json(res, 201, { gift: { id: row.id, productKey: row.product_key, state: "checkout-pending", createdAt: row.created_at, updatedAt: row.created_at, evidence: { provider: "stripe-checkout", eventId: session.id, verified: true } }, checkoutUrl: session.url, sessionId: session.id });
      }
      if (action === "check-claim") {
        const row = await findClaim(body.claimToken, env, fetchImpl);
        const result = await claimOutcome(row, env, fetchImpl, now);
        if (result.gift) return json(res, 200, result);
        // Until a delivery service can confirm a claim-ready link, avoid implying
        // delivery. The status endpoint still exposes paid-confirmed to its owner.
        return json(res, 409, { state: "pending", errorCode: "gift_delivery_not_configured" });
      }
      if (action === "claim") {
        if (!user) return json(res, 401, { state: "pending", errorCode: "authentication_required" });
        const result = await claimGift(body.claimToken, user, env, fetchImpl, now);
        return json(res, 200, result);
      }
      if (action === "status") {
        const giftId = parsedRoute.giftId || body.giftId;
        let row = await readOwnedGift(giftId, user.id, env, fetchImpl);
        if (!row) return json(res, 404, { state: "pending", errorCode: "gift_unavailable" });
        if (row.status === "pending" && row.expires_at && Date.parse(row.expires_at) <= now()) {
          const expired = await dbRequest(env, fetchImpl, "gifts", { method: "PATCH", query: `id=eq.${row.id}&status=eq.pending`, body: { status: "expired" } });
          if (!expired.ok) return json(res, 503, { state: "pending", errorCode: "gift_status_unavailable" });
          row = { ...row, status: "expired" };
        }
        return json(res, 200, { gift: safeGift(row) });
      }
      return json(res, 503, { state: "pending", errorCode: "gift_action_not_configured" });
    } catch (error) {
      const [status, value] = responseForError(error);
      return json(res, status, value);
    }
  };
}

async function fetchStripeSession(sessionId, env, fetchImpl) {
  const response = await fetchImpl(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } });
  const session = await safeJson(response);
  if (!response.ok || session?.id !== sessionId || !isHttps(session.url)) throw new Error("checkout_unavailable");
  return session;
}

export default createGiftsHandler();
