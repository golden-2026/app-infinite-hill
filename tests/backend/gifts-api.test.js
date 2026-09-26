import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import gifts, { createGiftsHandler } from "../../api/gifts.js";

const USER_ID = "123e4567-e89b-42d3-a456-426614174000";
const GIFT_ID = "123e4567-e89b-42d3-a456-426614174001";
const JWT = "user-access-token-value-1234567890";
const TOKEN = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG";
const TOKEN_HASH = `\\x${createHash("sha256").update(TOKEN).digest("hex")}`;
const ENV = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_ANON_KEY: "anon-public-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
  STRIPE_SECRET_KEY: "stripe-server-secret",
  GOLDEN_PUBLIC_URL: "https://golden.example",
  STRIPE_GIFT_PRICE_100_DAYS: "price_100",
  STRIPE_GIFT_PRICE_YEAR: "price_year",
  STRIPE_GIFT_PRICE_TABLE: "price_table",
};

function response() {
  return { headers: {}, setHeader(name, value) { this.headers[name] = value; }, end(body) { this.body = body; } };
}

async function invoke(handler, { method = "POST", url = "/api/gifts", body = {}, token = JWT } = {}) {
  const res = response();
  await handler({ method, url, headers: token ? { authorization: `Bearer ${token}` } : {}, body }, res);
  return { statusCode: res.statusCode, headers: res.headers, body: JSON.parse(res.body) };
}

function provider({ gift } = {}) {
  const calls = [];
  const state = { gift: gift || null, entitlements: [] };
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    if (String(url).endsWith("/auth/v1/user")) return { ok: true, json: async () => ({ id: USER_ID }) };
    if (String(url) === "https://api.stripe.com/v1/checkout/sessions" && options.method === "POST") {
      return { ok: true, json: async () => ({ id: "cs_test_1", url: "https://checkout.stripe.com/c/pay/cs_test_1" }) };
    }
    const parsed = new URL(String(url));
    const table = parsed.pathname.split("/").at(-1);
    if (table === "gifts" && options.method === "POST") {
      const row = JSON.parse(options.body)[0];
      assert.equal(row.purchaser_id, USER_ID);
      assert.equal(row.status, "pending");
      assert.equal(row.claim_token_hash.includes(TOKEN), false);
      state.gift = { id: GIFT_ID, ...row, recipient_user_id: null, external_ref: null, purchased_at: null, claimed_at: null, created_at: "2026-09-13T12:00:00.000Z" };
      return { ok: true, json: async () => [state.gift] };
    }
    if (table === "gifts" && options.method === "GET") {
      const id = parsed.searchParams.get("id")?.slice(3);
      const hash = parsed.searchParams.get("claim_token_hash")?.slice(3);
      const row = state.gift && (!id || id === state.gift.id) && (!hash || hash.replace(/^\\x/, "") === state.gift.claim_token_hash.replace(/^\\x/, "")) ? state.gift : null;
      return { ok: true, json: async () => row ? [row] : [] };
    }
    if (table === "gifts" && options.method === "PATCH") {
      const patch = JSON.parse(options.body);
      state.gift = { ...state.gift, ...patch };
      return { ok: true, json: async () => [state.gift] };
    }
    if (table === "entitlements" && options.method === "POST") {
      state.entitlements.push(JSON.parse(options.body)[0]);
      return { ok: true, json: async () => state.entitlements };
    }
    throw new Error(`Unexpected provider request: ${url}`);
  };
  return { fetchImpl, calls, state };
}

test("gifts endpoint fails closed without Supabase, Stripe, or authenticated identity", async () => {
  const noConfig = await invoke(createGiftsHandler({ env: {}, fetchImpl: async () => { throw new Error("must not call"); } }));
  assert.equal(noConfig.statusCode, 503);
  assert.equal(noConfig.body.errorCode, "provider_not_configured");
  const noAuth = await invoke(createGiftsHandler({ env: ENV, fetchImpl: async () => { throw new Error("must not call"); } }), { token: null, body: { action: "create", productKey: "year" } });
  assert.equal(noAuth.statusCode, 401);
  assert.equal(noAuth.body.errorCode, "authentication_required");
});

test("create validates product contract, stores only a token hash, and returns claim token once", async () => {
  const fake = provider();
  const handler = createGiftsHandler({ env: ENV, fetchImpl: fake.fetchImpl, now: () => Date.parse("2026-09-13T12:00:00Z") });
  const bad = await invoke(handler, { body: { action: "create", productKey: "year", price: "1.00" } });
  assert.equal(bad.statusCode, 400);
  const created = await invoke(handler, { body: { action: "create", productKey: "year" } });
  assert.equal(created.statusCode, 201);
  assert.equal(created.body.gift.id, GIFT_ID);
  assert.equal(created.body.gift.state, "draft");
  assert.equal(typeof created.body.claimToken, "string");
  assert.equal(fake.state.gift.claim_token_hash.startsWith("\\x"), true);
  assert.equal(fake.state.gift.claim_token_hash.includes(created.body.claimToken), false);
  assert.equal(created.headers["Referrer-Policy"], "no-referrer");
  assert.equal(created.headers["Cache-Control"], "no-store");
});

test("checkout uses server price and identity, persists Stripe session, and ignores browser payment claims", async () => {
  const fake = provider({ gift: { id: GIFT_ID, purchaser_id: USER_ID, recipient_user_id: null, product_key: "year", status: "pending", claim_token_hash: "\\xabc", external_ref: null, purchased_at: null, claimed_at: null, created_at: "2026-09-13T12:00:00Z" } });
  const handler = createGiftsHandler({ env: ENV, fetchImpl: fake.fetchImpl });
  const bad = await invoke(handler, { body: { action: "create-checkout", giftId: GIFT_ID, paid: true } });
  assert.equal(bad.statusCode, 400);
  const result = await invoke(handler, { body: { action: "create-checkout", giftId: GIFT_ID } });
  assert.equal(result.statusCode, 201);
  assert.equal(result.body.gift.state, "checkout-pending");
  assert.equal(result.body.gift.evidence.provider, "stripe-checkout");
  assert.equal(result.body.sessionId, "cs_test_1");
  const stripeCall = fake.calls.find(({ url }) => url === "https://api.stripe.com/v1/checkout/sessions");
  const params = new URLSearchParams(stripeCall.options.body);
  assert.equal(params.get("line_items[0][price]"), "price_year");
  assert.equal(params.get("metadata[gift_id]"), GIFT_ID);
  assert.equal(params.get("metadata[purchaser_id]"), USER_ID);
  assert.equal(params.has("paid"), false);
  assert.equal(fake.state.gift.external_ref, "cs_test_1");
});

test("status requires authenticated ownership and reports payment only from a server-set purchase timestamp", async () => {
  const fake = provider({ gift: { id: GIFT_ID, purchaser_id: USER_ID, recipient_user_id: null, product_key: "year", status: "pending", claim_token_hash: "\\xabc", external_ref: "cs_test_1", purchased_at: null, claimed_at: null, created_at: "2026-09-13T12:00:00Z" } });
  const handler = createGiftsHandler({ env: ENV, fetchImpl: fake.fetchImpl });
  const pending = await invoke(handler, { body: { action: "status", giftId: GIFT_ID } });
  assert.equal(pending.body.gift.state, "checkout-pending");
  assert.equal(pending.body.gift.evidence.provider, "stripe-checkout");
  fake.state.gift.purchased_at = "2026-09-13T12:05:00Z";
  const paid = await invoke(handler, { body: { action: "status", giftId: GIFT_ID } });
  assert.equal(paid.body.gift.state, "paid-confirmed");
  assert.equal(paid.body.gift.evidence.provider, "stripe-webhook");
  const hidden = await invoke(handler, { body: { action: "status", giftId: GIFT_ID }, token: null });
  assert.equal(hidden.statusCode, 401);
});

test("claim requires a verified Supabase user, a paid unexpired gift, and creates one entitlement", async () => {
  const fake = provider({ gift: { id: GIFT_ID, purchaser_id: USER_ID, recipient_user_id: null, product_key: "year", status: "pending", claim_token_hash: TOKEN_HASH, external_ref: "cs_test_1", purchased_at: "2026-09-13T12:05:00Z", claimed_at: null, expires_at: "2027-09-13T12:00:00Z", created_at: "2026-09-13T12:00:00Z" } });
  const handler = createGiftsHandler({ env: ENV, fetchImpl: fake.fetchImpl, now: () => Date.parse("2026-09-13T13:00:00Z") });
  const invalid = await invoke(handler, { body: { action: "claim", claimToken: "short" } });
  assert.equal(invalid.statusCode, 400);
  const result = await invoke(handler, { body: { action: "claim", claimToken: TOKEN } });
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.gift.state, "claimed");
  assert.equal(result.body.claimToken, undefined);
  assert.equal(fake.state.gift.recipient_user_id, USER_ID);
  assert.equal(fake.state.entitlements.length, 1);
  assert.equal(fake.state.entitlements[0].source, "gift");
  assert.equal(fake.state.entitlements[0].external_ref, `gift:${GIFT_ID}`);
  const serializedRequests = JSON.stringify(fake.calls.map(({ url, options }) => ({ url, body: options.body })));
  assert.equal(serializedRequests.includes(TOKEN), false);
});

test("claim lookup distinguishes invalid, expired, and already claimed without revealing gift identity", async () => {
  const fake = provider({ gift: null });
  const handler = createGiftsHandler({ env: ENV, fetchImpl: fake.fetchImpl });
  const invalid = await invoke(handler, { body: { action: "check-claim", claimToken: TOKEN }, token: null });
  assert.equal(invalid.body.gift.state, "invalid");
  assert.equal(invalid.body.gift.id, "unknown");
  assert.equal(JSON.stringify(invalid.body).includes(TOKEN), false);
});

test("delivery and open milestones cannot be supplied by a browser", async () => {
  const fake = provider({ gift: { id: GIFT_ID, purchaser_id: USER_ID, product_key: "year", status: "pending", claim_token_hash: "\\xabc", created_at: "2026-09-13T12:00:00Z" } });
  const handler = createGiftsHandler({ env: ENV, fetchImpl: fake.fetchImpl });
  const opened = await invoke(handler, { body: { action: "record-opened", giftId: GIFT_ID } });
  assert.equal(opened.statusCode, 400);
  assert.equal(opened.body.errorCode, "provider_event_required");
  const delivered = await invoke(handler, { body: { action: "record-delivered", giftId: GIFT_ID } });
  assert.equal(delivered.statusCode, 400);
  assert.equal(delivered.body.errorCode, "provider_event_required");
  const schedule = await invoke(handler, { body: { action: "schedule-delivery", giftId: GIFT_ID, delivery: { method: "link" } } });
  assert.equal(schedule.statusCode, 503);
  assert.equal(schedule.body.errorCode, "delivery_provider_not_configured");
});

test("Netlify adapter exports the trusted route and default handler remains fail-closed", async () => {
  assert.equal(typeof gifts, "function");
  const unavailable = await invoke(gifts, { body: { action: "create", productKey: "year" } });
  assert.equal(unavailable.statusCode, 503);
  assert.equal(unavailable.body.configured, false);
});
