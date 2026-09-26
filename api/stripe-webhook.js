import { createHmac, timingSafeEqual, createHash } from "node:crypto";

const MAX_WEBHOOK_BYTES = 512 * 1024;
const PRODUCT_KEYS = new Set(["plus", "table"]);
const GIFT_PRODUCT_KEYS = new Set(["first_100_days", "year", "table"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(res, code, value) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.end(JSON.stringify(value));
}

async function rawBody(req) {
  if (Buffer.isBuffer(req.body)) {
    if (req.body.byteLength > MAX_WEBHOOK_BYTES) throw Object.assign(new Error("too_large"), { statusCode: 413 });
    return req.body;
  }
  if (typeof req.body === "string") {
    if (Buffer.byteLength(req.body) > MAX_WEBHOOK_BYTES) throw Object.assign(new Error("too_large"), { statusCode: 413 });
    return Buffer.from(req.body);
  }
  let chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_WEBHOOK_BYTES) throw Object.assign(new Error("too_large"), { statusCode: 413 });
    chunks.push(bytes);
  }
  return Buffer.concat(chunks);
}

export function verifyStripeSignature(payload, signatureHeader, secret, now = Date.now(), toleranceSeconds = 300) {
  if (!Buffer.isBuffer(payload) || typeof signatureHeader !== "string" || !secret) return false;
  const parts = signatureHeader.split(",").map((part) => part.split("=", 2));
  const timestamps = parts.filter(([key]) => key === "t").map(([, value]) => value);
  const signatures = parts.filter(([key]) => key === "v1").map(([, value]) => value);
  if (timestamps.length !== 1 || !/^\d{1,12}$/.test(timestamps[0]) || !signatures.length) return false;
  const timestamp = Number(timestamps[0]);
  if (!Number.isSafeInteger(timestamp) || Math.abs(Math.floor(now / 1000) - timestamp) > toleranceSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.`).update(payload).digest();
  return signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const candidate = Buffer.from(signature, "hex");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}

function subscriptionEntitlement(event) {
  const object = event.data?.object;
  let accountId;
  let productId;
  let externalRef;
  let status;
  let endsAt = null;
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    if (object?.mode !== "subscription" || object?.payment_status !== "paid") return null;
    accountId = object.client_reference_id || object.metadata?.account_id;
    productId = object.metadata?.product_id;
    externalRef = object.subscription || object.id;
    status = "active";
  } else if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    accountId = object?.metadata?.account_id;
    productId = object?.metadata?.product_id;
    externalRef = object?.id;
    status = event.type === "customer.subscription.deleted" || object?.status === "canceled" || object?.status === "unpaid" || object?.status === "incomplete_expired" ? "expired"
      : object?.status === "past_due" ? "grace"
      : object?.status === "active" || object?.status === "trialing" ? "active" : null;
    if (Number.isSafeInteger(object?.current_period_end) && object.current_period_end * 1000 > Date.now()) endsAt = new Date(object.current_period_end * 1000).toISOString();
  } else return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(accountId || "") || !PRODUCT_KEYS.has(productId) || !externalRef || !status) return null;
  return { user_id: accountId, product_key: productId, status, source: "purchase", external_ref: externalRef, starts_at: new Date((event.created || Math.floor(Date.now() / 1000)) * 1000).toISOString(), ends_at: status === "expired" ? null : endsAt };
}

function serviceHeaders(env, prefer = "return=minimal") {
  return { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json", Prefer: prefer };
}

async function writeEntitlement(entitlement, env, fetchImpl) {
  const base = env.SUPABASE_URL.replace(/\/$/, "");
  const response = await fetchImpl(`${base}/rest/v1/entitlements?on_conflict=source,external_ref`, {
    method: "POST", headers: serviceHeaders(env, "resolution=merge-duplicates,return=minimal"), body: JSON.stringify([entitlement]),
  });
  return response.ok;
}

async function confirmGiftPayment(event, env, fetchImpl) {
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) return true;
  const object = event.data?.object;
  if (object?.mode !== "payment" || object?.payment_status !== "paid" || object?.metadata?.product_kind !== "gift") return true;
  const giftId = object.metadata?.gift_id;
  const purchaserId = object.metadata?.purchaser_id;
  const productId = object.metadata?.product_id;
  const accountId = object.client_reference_id;
  if (!UUID.test(giftId || "") || !UUID.test(purchaserId || "") || purchaserId !== accountId || !GIFT_PRODUCT_KEYS.has(productId) || typeof object.id !== "string") return false;
  const base = env.SUPABASE_URL.replace(/\/$/, "");
  const query = new URLSearchParams({ id: `eq.${giftId}`, purchaser_id: `eq.${purchaserId}`, product_key: `eq.${productId}`, status: "eq.pending", external_ref: `eq.${object.id}`, purchased_at: "is.null" });
  const purchasedAt = new Date((event.created || Math.floor(Date.now() / 1000)) * 1000).toISOString();
  const response = await fetchImpl(`${base}/rest/v1/gifts?${query}`, {
    method: "PATCH", headers: serviceHeaders(env), body: JSON.stringify({ purchased_at: purchasedAt }),
  });
  return response.ok;
}

async function recordEvent(event, payload, env, fetchImpl) {
  const base = env.SUPABASE_URL.replace(/\/$/, "");
  const digest = createHash("sha256").update(payload).digest("hex");
  const response = await fetchImpl(`${base}/rest/v1/webhook_events?on_conflict=provider,event_id`, {
    method: "POST", headers: serviceHeaders(env, "resolution=ignore-duplicates,return=minimal"),
    body: JSON.stringify([{ provider: "stripe", event_id: event.id, payload_sha256: `\\x${digest}`, status: "processed", attempts: 1, processed_at: new Date().toISOString() }]),
  });
  return response.ok;
}

export function createStripeWebhookHandler({ env = process.env, fetchImpl = globalThis.fetch, now = () => Date.now() } = {}) {
  return async function stripeWebhookHandler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return json(res, 405, { errorCode: "method_not_allowed" }); }
    if (!env.STRIPE_WEBHOOK_SECRET || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || typeof fetchImpl !== "function") return json(res, 503, { errorCode: "provider_not_configured" });
    let payload;
    try { payload = await rawBody(req); } catch (error) { return json(res, error.statusCode || 400, { errorCode: error.statusCode === 413 ? "payload_too_large" : "invalid_payload" }); }
    const signature = req.headers?.["stripe-signature"] || req.headers?.["Stripe-Signature"];
    if (!verifyStripeSignature(payload, signature, env.STRIPE_WEBHOOK_SECRET, now())) return json(res, 400, { errorCode: "invalid_signature" });
    let event;
    try { event = JSON.parse(payload.toString("utf8")); } catch { return json(res, 400, { errorCode: "invalid_payload" }); }
    if (typeof event?.id !== "string" || typeof event.type !== "string" || !event.data?.object) return json(res, 400, { errorCode: "invalid_event" });
    try {
      const entitlement = subscriptionEntitlement(event);
      if (entitlement && !await writeEntitlement(entitlement, env, fetchImpl)) return json(res, 503, { errorCode: "entitlement_write_failed" });
      if (!await confirmGiftPayment(event, env, fetchImpl)) return json(res, 503, { errorCode: "gift_payment_write_failed" });
      if (!await recordEvent(event, payload, env, fetchImpl)) return json(res, 503, { errorCode: "event_record_failed" });
      return json(res, 200, { received: true });
    } catch { return json(res, 503, { errorCode: "webhook_processing_failed" }); }
  };
}

export default createStripeWebhookHandler();
