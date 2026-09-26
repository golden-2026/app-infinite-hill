import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { createCommerceHandler } from "../../api/commerce.js";
import { createStripeWebhookHandler } from "../../api/stripe-webhook.js";
import { normalizeCheckoutStatus, normalizeEntitlement } from "../../src/features/entitlements.js";

const accountId = "9b7f4154-d74b-4d18-a881-c5f7b10cd4fe";
const accessToken = "user-access-token.very-long-for-fixture";
const env = {
  STRIPE_SECRET_KEY: "sk_test_only",
  STRIPE_WEBHOOK_SECRET: "whsec_test_only",
  STRIPE_PRICE_PLUS: "price_plus_server",
  GOLDEN_PUBLIC_URL: "https://golden.example",
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_ANON_KEY: "anon_test_only",
  SUPABASE_SERVICE_ROLE_KEY: "service_test_only",
};

function response() {
  return { headers: {}, setHeader(name, value) { this.headers[name] = value; }, end(body) { this.body = body; return body; } };
}
async function invoke(handler, { method = "GET", body, headers = {} } = {}) {
  const res = response();
  await handler({ method, body, headers }, res);
  return { statusCode: res.statusCode, headers: res.headers, body: res.body ? JSON.parse(res.body) : null };
}
function authFetch(routes) {
  return async (url, options) => {
    if (url.endsWith("/auth/v1/user")) return { ok: options.headers.Authorization === `Bearer ${accessToken}`, json: async () => ({ id: accountId }) };
    return routes(url, options);
  };
}

test("commerce remains disabled until Stripe, Supabase identity, webhook, URL, and service credentials are set", async () => {
  const result = await invoke(createCommerceHandler({ env: {}, fetchImpl: async () => { throw new Error("unexpected provider call"); } }));
  assert.equal(result.body.state, "provider_not_configured");
  assert.equal(result.body.configured, false);
});

test("checkout requires a verified Supabase identity and uses only the server price and account reference", async () => {
  let stripeRequest;
  const handler = createCommerceHandler({ env, fetchImpl: authFetch(async (url, options) => {
    stripeRequest = { url, options };
    return { ok: true, json: async () => ({ id: "cs_test_12345678", url: "https://checkout.stripe.com/c/pay/cs_test_12345678" }) };
  }) });
  const noAuth = await invoke(handler, { method: "POST", body: { action: "checkout", planId: "plus" } });
  assert.equal(noAuth.statusCode, 401);
  const result = await invoke(handler, { method: "POST", headers: { authorization: `Bearer ${accessToken}` }, body: { action: "checkout", planId: "plus" } });
  assert.equal(result.statusCode, 201);
  const params = new URLSearchParams(stripeRequest.options.body);
  assert.equal(params.get("line_items[0][price]"), "price_plus_server");
  assert.equal(params.get("client_reference_id"), accountId);
  assert.equal(params.get("metadata[account_id]"), accountId);
  assert.equal(params.get("subscription_data[metadata][account_id]"), accountId);
  assert.equal(params.get("success_url"), "https://golden.example/?commerce=success&session_id={CHECKOUT_SESSION_ID}");
  assert.equal(stripeRequest.options.headers.Authorization, "Bearer sk_test_only");
});

test("checkout rejects browser price and redirect values", async () => {
  let stripeCalls = 0;
  const handler = createCommerceHandler({ env, fetchImpl: authFetch(async () => { stripeCalls += 1; }) });
  for (const body of [
    { action: "checkout", planId: "plus", priceId: "price_attacker" },
    { action: "checkout", planId: "plus", successUrl: "https://evil.example" },
  ]) {
    const result = await invoke(handler, { method: "POST", headers: { authorization: `Bearer ${accessToken}` }, body });
    assert.equal(result.statusCode, 400);
  }
  assert.equal(stripeCalls, 0);
});

test("checkout return verifies the Stripe session belongs to the caller and waits for webhook entitlement", async () => {
  const handler = createCommerceHandler({ env, fetchImpl: authFetch(async (url) => {
    if (url.includes("/checkout/sessions/")) return { ok: true, json: async () => ({ client_reference_id: accountId, payment_status: "paid", metadata: { product_id: "plus" } }) };
    if (url.includes("/rest/v1/entitlements")) return { ok: true, json: async () => [] };
    throw new Error(`Unexpected request ${url}`);
  }) });
  const result = await invoke(handler, { method: "POST", headers: { authorization: `Bearer ${accessToken}` }, body: { action: "status", sessionId: "cs_test_12345678" } });
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, { state: "processing", verified: true, activated: false });
});

test("checkout status does not disclose a session belonging to another account", async () => {
  const handler = createCommerceHandler({ env, fetchImpl: authFetch(async () => ({ ok: true, json: async () => ({ client_reference_id: "6a7f4154-d74b-4d18-a881-c5f7b10cd4fe" }) })) });
  const result = await invoke(handler, { method: "POST", headers: { authorization: `Bearer ${accessToken}` }, body: { action: "status", sessionId: "cs_test_12345678" } });
  assert.equal(result.statusCode, 404);
  assert.equal(result.body.verified, false);
});

test("Stripe webhook signature verification and entitlement upsert are idempotent", async () => {
  const event = { id: "evt_test_1", type: "checkout.session.completed", created: 1790000000, data: { object: { id: "cs_test_1", mode: "subscription", payment_status: "paid", client_reference_id: accountId, subscription: "sub_test_1", metadata: { product_id: "plus" } } } };
  const payload = Buffer.from(JSON.stringify(event));
  const timestamp = Math.floor(Date.now() / 1000);
  const sig = createHmac("sha256", env.STRIPE_WEBHOOK_SECRET).update(`${timestamp}.`).update(payload).digest("hex");
  const calls = [];
  const handler = createStripeWebhookHandler({ env, fetchImpl: async (url, options) => { calls.push({ url, options }); return { ok: true }; } });
  const request = { method: "POST", body: payload, headers: { "stripe-signature": `t=${timestamp},v1=${sig}` } };
  assert.equal((await invoke(handler, request)).statusCode, 200);
  assert.equal((await invoke(handler, request)).statusCode, 200);
  assert.equal(calls.filter(({ url }) => url.includes("/entitlements?")).length, 2);
  const row = JSON.parse(calls[0].options.body)[0];
  assert.equal(row.user_id, accountId);
  assert.equal(row.product_key, "plus");
  assert.equal(row.status, "active");
  assert.equal(row.external_ref, "sub_test_1");
  assert.equal(calls[0].options.headers.Prefer, "resolution=merge-duplicates,return=minimal");
  assert.match(calls[1].url, /webhook_events\?on_conflict=provider,event_id$/);
  assert.equal(JSON.parse(calls[1].options.body)[0].event_id, event.id);
});

test("Stripe webhook confirms a paid gift against server-owned metadata", async () => {
  const giftId = "123e4567-e89b-42d3-a456-426614174001";
  const event = { id: "evt_gift_1", type: "checkout.session.completed", created: 1790000000, data: { object: { id: "cs_gift_1", mode: "payment", payment_status: "paid", client_reference_id: accountId, metadata: { product_kind: "gift", product_id: "year", gift_id: giftId, purchaser_id: accountId } } } };
  const payload = Buffer.from(JSON.stringify(event));
  const timestamp = Math.floor(Date.now() / 1000);
  const sig = createHmac("sha256", env.STRIPE_WEBHOOK_SECRET).update(`${timestamp}.`).update(payload).digest("hex");
  const calls = [];
  const handler = createStripeWebhookHandler({ env, fetchImpl: async (url, options) => { calls.push({ url, options }); return { ok: true }; } });
  const result = await invoke(handler, { method: "POST", body: payload, headers: { "stripe-signature": `t=${timestamp},v1=${sig}` } });
  assert.equal(result.statusCode, 200);
  const giftWrite = calls.find(({ url }) => url.includes("/rest/v1/gifts?"));
  assert.ok(giftWrite);
  assert.equal(giftWrite.options.method, "PATCH");
  assert.match(giftWrite.url, new RegExp(`id=eq\\.${giftId}`));
  assert.equal(JSON.parse(giftWrite.options.body).purchased_at, "2026-09-21T14:13:20.000Z");
});

test("webhook rejects unsigned or stale requests before writing", async () => {
  let writes = 0;
  const handler = createStripeWebhookHandler({ env, fetchImpl: async () => { writes += 1; return { ok: true }; } });
  const result = await invoke(handler, { method: "POST", body: Buffer.from("{}"), headers: { "stripe-signature": "t=1,v1=deadbeef" } });
  assert.equal(result.statusCode, 400);
  assert.equal(result.body.errorCode, "invalid_signature");
  assert.equal(writes, 0);
});

test("client entitlement helpers accept only verified server response shapes", () => {
  assert.equal(normalizeEntitlement({ product_key: "plus", status: "active", starts_at: "2026-09-13T00:00:00Z" }).productKey, "plus");
  assert.equal(normalizeEntitlement({ product_key: "plus", status: "paid" }), null);
  assert.deepEqual(normalizeCheckoutStatus({ state: "entitled", verified: true, activated: true, productId: "plus" }), { state: "entitled", verified: true, activated: true, productId: "plus" });
  assert.deepEqual(normalizeCheckoutStatus({ state: "entitled", verified: false, activated: true, productId: "plus" }), { state: "unverified", verified: false, activated: false });
});
