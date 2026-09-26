import assert from "node:assert/strict";
import test from "node:test";
import {
  abandonGiftDraft,
  createGiftDraft,
  getPlan,
  loadGiftDraft,
  markGiftDraftReady,
  saveGiftDraft,
  updateGiftDraft,
} from "../../src/features/commerce.js";
import { createCommerceHandler } from "../../api/commerce.js";

function response() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(body) { this.body = body; return body; },
  };
}

const accountId = "9b7f4154-d74b-4d18-a881-c5f7b10cd4fe";
const accessToken = "test-access-token-long-enough-to-parse";
function configuredEnv(extra = {}) {
  return {
    STRIPE_SECRET_KEY: "sk_test_server_only",
    STRIPE_WEBHOOK_SECRET: "whsec_test_only",
    GOLDEN_PUBLIC_URL: "https://golden.example",
    SUPABASE_URL: "https://golden.supabase.co",
    SUPABASE_ANON_KEY: "anon_test",
    SUPABASE_SERVICE_ROLE_KEY: "service_test",
    ...extra,
  };
}
function withAuth(fetchStripe) {
  return async (url, options) => {
    if (url.endsWith("/auth/v1/user")) return { ok: options.headers.Authorization === `Bearer ${accessToken}`, json: async () => ({ id: accountId }) };
    return fetchStripe(url, options);
  };
}

async function invoke(handler, { method = "GET", body, headers = {} } = {}) {
  const res = response();
  await handler({ method, body, headers }, res);
  return { statusCode: res.statusCode, headers: res.headers, body: JSON.parse(res.body) };
}

test("plan catalog represents House, Plus, and Table without invented price or entitlement", () => {
  assert.equal(getPlan("house").billing, "free");
  assert.equal(getPlan("plus").availability, "planned");
  assert.equal(getPlan("table").checkoutAvailable, false);
  for (const id of ["house", "plus", "table"]) {
    const plan = getPlan(id);
    assert.equal("price" in plan, false);
    assert.equal("entitlement" in plan, false);
  }
  assert.equal(getPlan("unknown"), null);
});

test("gift draft stays local and follows draft, ready, edit, and abandoned states", () => {
  const draft = createGiftDraft({ recipient: "  Sam  ", relationship: "friend", now: "2026-09-13T12:00:00Z", id: "gift-1" });
  const ready = markGiftDraftReady(draft, "2026-09-13T12:01:00Z");
  assert.equal(ready.status, "ready");
  assert.equal(updateGiftDraft(ready, { giftSku: "year" }, "2026-09-13T12:02:00Z").status, "draft");
  const abandoned = abandonGiftDraft(ready, "2026-09-13T12:03:00Z");
  assert.equal(abandoned.status, "abandoned");
  assert.throws(() => updateGiftDraft(abandoned, { recipient: "Alex" }), /abandoned/);
  const storage = new Map();
  const localStorage = { setItem: (key, value) => storage.set(key, value), getItem: (key) => storage.get(key) ?? null };
  saveGiftDraft(localStorage, draft);
  assert.deepEqual(loadGiftDraft(localStorage), draft);
});

test("local commerce API exposes unavailable provider status and never fabricates checkout", async () => {
  const handler = createCommerceHandler({ env: {}, fetchImpl: async () => { throw new Error("must not call provider"); } });
  const status = await invoke(handler);
  assert.equal(status.statusCode, 200);
  assert.equal(status.body.state, "provider_not_configured");
  const checkout = await invoke(handler, { method: "POST", body: { action: "checkout", planId: "plus" } });
  assert.equal(checkout.statusCode, 503);
  assert.equal(checkout.body.errorCode, "provider_not_configured");
  assert.equal(checkout.headers["Cache-Control"], "no-store");
});

test("checkout rejects browser price, entitlement, or redirect fields", async () => {
  let calls = 0;
  const env = configuredEnv({ STRIPE_PRICE_PLUS: "price_server" });
  const handler = createCommerceHandler({ env, fetchImpl: async () => { calls += 1; } });
  for (const body of [
    { action: "checkout", planId: "plus", priceId: "price_browser" },
    { action: "checkout", planId: "plus", entitlement: "premium" },
    { action: "checkout", planId: "plus", successUrl: "https://evil.example" },
  ]) {
    const result = await invoke(handler, { method: "POST", body });
    assert.equal(result.statusCode, 400);
    assert.equal(result.body.errorCode, "invalid_checkout_request");
  }
  assert.equal(calls, 0);
});

test("configured checkout uses server-owned Stripe price and accepts only observed session response", async () => {
  let sent;
  const env = configuredEnv({ STRIPE_PRICE_PLUS: "price_from_server" });
  const handler = createCommerceHandler({
    env,
    fetchImpl: withAuth(async (url, options) => {
      sent = { url, options };
      return { ok: true, json: async () => ({ id: "cs_test_123", url: "https://checkout.stripe.com/c/pay/cs_test_123" }) };
    }),
  });
  const result = await invoke(handler, { method: "POST", headers: { authorization: `Bearer ${accessToken}` }, body: { action: "checkout", planId: "plus" } });
  assert.equal(result.statusCode, 201);
  assert.equal(result.body.state, "checkout_ready");
  assert.equal(result.body.sessionId, "cs_test_123");
  assert.equal(sent.url, "https://api.stripe.com/v1/checkout/sessions");
  const params = new URLSearchParams(sent.options.body);
  assert.equal(params.get("line_items[0][price]"), "price_from_server");
  assert.equal(params.get("mode"), "subscription");
  assert.match(sent.options.headers.Authorization, /^Bearer sk_test_server_only$/);
});

test("configured checkout reports provider failure instead of claiming success", async () => {
  const env = configuredEnv({ STRIPE_PRICE_PLUS: "price_from_server" });
  const handler = createCommerceHandler({ env, fetchImpl: withAuth(async () => ({ ok: false, json: async () => ({}) })) });
  const result = await invoke(handler, { method: "POST", headers: { authorization: `Bearer ${accessToken}` }, body: { action: "checkout", planId: "plus" } });
  assert.equal(result.statusCode, 502);
  assert.equal(result.body.errorCode, "checkout_unavailable");
});
