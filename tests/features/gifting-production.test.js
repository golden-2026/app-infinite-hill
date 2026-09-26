import assert from "node:assert/strict";
import test from "node:test";
import {
  GIFT_LIFECYCLE_STATES,
  GiftLifecycleError,
  createGift,
  projectSupabaseGift,
  transitionGift,
} from "../../src/features/gifting.js";
import { createGiftRepository, GIFT_SERVICE_ENDPOINT } from "../../src/platform/gift-repository.js";

const at = "2026-09-13T12:00:00.000Z";
const proof = (provider, eventId) => ({ provider, eventId, verified: true, observedAt: at });
const draft = () => createGift({ id: "gift-1", productKey: "golden_year", recipientName: "Sam", now: at });

test("lifecycle vocabulary covers purchase, delivery, claim, and safe failure outcomes", () => {
  assert.deepEqual(GIFT_LIFECYCLE_STATES, [
    "draft", "checkout-pending", "paid-confirmed", "scheduled", "delivered", "opened", "claimed",
    "expired", "invalid", "already-claimed", "failed-delivery",
  ]);
});

test("verified events are required for every provider-backed transition", () => {
  assert.throws(() => transitionGift(draft(), "checkout-pending"), { code: "evidence_required" });
  assert.throws(() => transitionGift(draft(), "checkout-pending", { evidence: proof("stripe-webhook", "evt-1") }), { code: "evidence_required" });
  const checkout = transitionGift(draft(), "checkout-pending", { evidence: proof("stripe-checkout", "cs_1"), now: at });
  assert.equal(checkout.state, "checkout-pending");
  assert.equal(checkout.evidence.eventId, "cs_1");
  assert.throws(() => transitionGift(checkout, "paid-confirmed", { evidence: proof("stripe-checkout", "cs_1") }), { code: "evidence_required" });
  assert.equal(transitionGift(checkout, "paid-confirmed", { evidence: proof("stripe-webhook", "evt_paid") }).state, "paid-confirmed");
});

test("provider-confirmed lifecycle reaches delivered, opened, and claimed; invalid transitions fail closed", () => {
  let gift = transitionGift(draft(), "checkout-pending", { evidence: proof("stripe-checkout", "cs_1") });
  gift = transitionGift(gift, "paid-confirmed", { evidence: proof("stripe-webhook", "evt_paid") });
  gift = transitionGift(gift, "scheduled", { evidence: proof("delivery-service", "schedule_1") });
  gift = transitionGift(gift, "delivered", { evidence: proof("delivery-service", "delivery_1") });
  gift = transitionGift(gift, "opened", { evidence: proof("gift-service", "open_1") });
  gift = transitionGift(gift, "claimed", { evidence: proof("gift-service", "claim_1") });
  assert.equal(gift.state, "claimed");
  assert.throws(() => transitionGift(gift, "expired", { evidence: proof("gift-service", "expire_1") }), { code: "invalid_transition" });
});

test("failed delivery can return to scheduled only after an observed retry acceptance", () => {
  let gift = transitionGift(draft(), "checkout-pending", { evidence: proof("stripe-checkout", "cs_1") });
  gift = transitionGift(gift, "paid-confirmed", { evidence: proof("stripe-webhook", "evt_paid") });
  gift = transitionGift(gift, "scheduled", { evidence: proof("delivery-service", "schedule_1") });
  gift = transitionGift(gift, "failed-delivery", { evidence: proof("delivery-service", "delivery_failed_1") });
  assert.equal(gift.state, "failed-delivery");
  assert.throws(() => transitionGift(gift, "scheduled"), { code: "evidence_required" });
  assert.equal(transitionGift(gift, "scheduled", { evidence: proof("delivery-service", "retry_accepted_1") }).state, "scheduled");
});

test("Supabase row projection respects the current SQL contract and requires server evidence for delivery extensions", () => {
  const row = { id: "gift-1", product_key: "golden_year", status: "pending", purchased_at: at, created_at: at };
  assert.equal(projectSupabaseGift(row).state, "paid-confirmed");
  assert.throws(() => projectSupabaseGift({ ...row, status: "claimed", purchased_at: null }), { code: "invalid_gift_record" });
  assert.throws(() => projectSupabaseGift(row, { lifecycleState: "delivered" }), { code: "evidence_required" });
  assert.equal(projectSupabaseGift(row, { lifecycleState: "delivered", evidence: proof("delivery-service", "delivery_1") }).state, "delivered");
  assert.throws(() => projectSupabaseGift({ ...row, status: "refunded" }), { code: "gift_unavailable" });
});

test("repository accepts only a server-confirmed checkout and rejects fake success", async () => {
  let call;
  const repository = createGiftRepository({ request: async (...args) => {
    call = args;
    return { gift: { id: "gift-1", state: "checkout-pending", evidence: proof("stripe-checkout", "cs_1") }, checkoutUrl: "https://checkout.stripe.com/c/pay/cs_1", sessionId: "cs_1" };
  } });
  const result = await repository.createCheckout("gift-1");
  assert.deepEqual(call, ["create-checkout", { giftId: "gift-1" }]);
  assert.equal(result.gift.state, "checkout-pending");
  assert.equal(result.checkoutUrl, "https://checkout.stripe.com/c/pay/cs_1");

  const fakeSuccess = createGiftRepository({ request: async () => ({ gift: { id: "gift-1", state: "paid-confirmed" } }) });
  await assert.rejects(fakeSuccess.getStatus("gift-1"), { code: "evidence_required" });
  const wrongUrl = createGiftRepository({ request: async () => ({ gift: { id: "gift-1", state: "checkout-pending", evidence: proof("stripe-checkout", "cs_1") }, checkoutUrl: "http://evil.example" }) });
  await assert.rejects(wrongUrl.createCheckout("gift-1"), { code: "invalid_checkout_response" });
});

test("claim outcomes distinguish invalid, expired, already claimed, and claimed results", async () => {
  const outcomes = ["invalid", "expired", "already-claimed", "claimed"];
  const repository = createGiftRepository({ request: async (_action, { claimToken }) => {
    assert.equal(claimToken, "opaque-one-time-claim-token");
    const state = outcomes.shift();
    return { gift: { id: "gift-1", state, evidence: proof("gift-service", `event-${state}`) } };
  } });
  assert.equal((await repository.checkClaim("opaque-one-time-claim-token")).state, "invalid");
  assert.equal((await repository.checkClaim("opaque-one-time-claim-token")).state, "expired");
  assert.equal((await repository.checkClaim("opaque-one-time-claim-token")).state, "already-claimed");
  assert.equal((await repository.claim("opaque-one-time-claim-token")).state, "claimed");
  await assert.rejects(repository.claim("short"), { code: "invalid_claim_token" });
});

test("HTTP repository uses no-store same-origin requests and leaves provider outages pending", async () => {
  let request;
  const repository = createGiftRepository({ fetchImpl: async (...args) => {
    request = args;
    return { ok: true, json: async () => ({ gift: { id: "gift-1", state: "checkout-pending", evidence: proof("stripe-checkout", "cs_1") }, sessionId: "cs_1", checkoutUrl: "https://checkout.stripe.com/c/pay/cs_1" }) };
  } });
  assert.equal((await repository.createCheckout("gift-1")).gift.state, "checkout-pending");
  assert.equal(request[0], GIFT_SERVICE_ENDPOINT);
  assert.equal(request[1].credentials, "same-origin");
  assert.equal(request[1].cache, "no-store");
  assert.equal(JSON.parse(request[1].body).action, "create-checkout");

  const unavailable = createGiftRepository({ fetchImpl: async () => { throw new Error("offline"); } });
  await assert.rejects(unavailable.getStatus("gift-1"), (error) => error instanceof GiftLifecycleError && error.code === "provider_unavailable");
});

test("repository persists a server gift before checkout and attaches authenticated identity", async () => {
  const calls = [];
  const repository = createGiftRepository({
    getAccessToken: () => "signed-in-access-token",
    fetchImpl: async (_url, options) => {
      calls.push(options);
      return { ok: true, json: async () => ({ gift: { id: "gift-1", productKey: "year", state: "draft", evidence: null }, claimToken: "opaque-one-time-claim-token-123456789" }) };
    },
  });
  const created = await repository.persistDraft("year");
  assert.equal(created.gift.state, "draft");
  assert.equal(created.claimToken.length >= 32, true);
  assert.equal(calls[0].headers.Authorization, "Bearer signed-in-access-token");
  assert.deepEqual(JSON.parse(calls[0].body), { action: "create", productKey: "year" });
});
