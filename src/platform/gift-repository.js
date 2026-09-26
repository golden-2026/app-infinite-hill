import { GiftLifecycleError, createGift, projectSupabaseGift } from "../features/gifting.js";

const DEFAULT_ENDPOINT = "/api/gifts";
const CLAIM_OUTCOMES = new Set(["invalid", "already-claimed", "expired", "claimed", "scheduled", "delivered", "opened"]);
const STATE_PROVIDERS = Object.freeze({
  "checkout-pending": "stripe-checkout",
  "paid-confirmed": "stripe-webhook",
  scheduled: "delivery-service",
  delivered: "delivery-service",
  opened: "gift-service",
  claimed: "gift-service",
  expired: "gift-service",
  invalid: "gift-service",
  "already-claimed": "gift-service",
  "failed-delivery": "delivery-service",
});

/**
 * Server-backed gift repository boundary.
 *
 * The current Supabase contract grants clients read-only access to gifts and
 * has no checkout, schedule, delivery, open, or claim RPC. Mutations therefore
 * go through a trusted same-origin gift service; this adapter never writes
 * directly to Supabase or upgrades a request into a confirmed lifecycle state.
 */
export function createGiftRepository({ fetchImpl = globalThis.fetch, endpoint = DEFAULT_ENDPOINT, request, getAccessToken } = {}) {
  const send = request || createHttpRequest(fetchImpl, endpoint, getAccessToken);
  return Object.freeze({
    createDraft: (details) => createGift(details),
    persistDraft: async (productKey) => {
      const response = await send("create", { productKey });
      const gift = readGiftResponse(response);
      if (gift.state !== "draft" || typeof response.claimToken !== "string" || response.claimToken.length < 32) {
        throw new GiftLifecycleError("invalid_create_response", "Gift service did not return a draft and one-time claim token.");
      }
      return Object.freeze({ gift, claimToken: response.claimToken });
    },
    createCheckout: async (giftId) => {
      const result = await invoke(send, "create-checkout", { giftId }, "checkout-pending");
      if (!result.checkoutUrl || !result.sessionId || result.gift.evidence.eventId !== result.sessionId) {
        throw new GiftLifecycleError("invalid_checkout_response", "Gift service did not return a verified checkout session.");
      }
      return result;
    },
    getStatus: (giftId) => invoke(send, "status", { giftId }),
    scheduleDelivery: (giftId, delivery) => invoke(send, "schedule-delivery", { giftId, delivery }, "scheduled"),
    checkClaim: (claimToken) => lookupClaim(send, "check-claim", claimToken),
    claim: (claimToken) => lookupClaim(send, "claim", claimToken),
    recordOpened: (giftId) => invoke(send, "record-opened", { giftId }, "opened"),
    retryDelivery: (giftId) => invoke(send, "retry-delivery", { giftId }, "scheduled"),
    projectSupabaseGift,
  });
}

async function invoke(send, action, input, expectedState) {
  const response = await send(action, input);
  const gift = readGiftResponse(response);
  if (expectedState && gift.state !== expectedState) {
    throw new GiftLifecycleError("unexpected_provider_state", `Gift service returned ${gift.state}; expected ${expectedState}.`);
  }
  return Object.freeze({ gift, checkoutUrl: safeCheckoutUrl(response.checkoutUrl), sessionId: optionalString(response.sessionId) });
}

async function lookupClaim(send, action, claimToken) {
  if (typeof claimToken !== "string" || claimToken.length < 16 || claimToken.length > 512) {
    throw new GiftLifecycleError("invalid_claim_token", "A valid gift claim token is required.");
  }
  const response = await send(action, { claimToken });
  const gift = readGiftResponse(response);
  if (!CLAIM_OUTCOMES.has(gift.state)) throw new GiftLifecycleError("unexpected_claim_state", "Gift service returned an invalid claim result.");
  return gift;
}

function readGiftResponse(response) {
  const value = response?.gift || response;
  if (!value || typeof value !== "object" || typeof value.id !== "string" || typeof value.state !== "string") {
    throw new GiftLifecycleError("invalid_service_response", "Gift service did not return a lifecycle record.");
  }
  const { state, evidence } = value;
  const knownStates = new Set(["draft", "checkout-pending", "paid-confirmed", "scheduled", "delivered", "opened", "claimed", "expired", "invalid", "already-claimed", "failed-delivery"]);
  if (!knownStates.has(state)) throw new GiftLifecycleError("invalid_service_response", "Gift service returned an unknown lifecycle state.");
  const requiresEvidence = new Set(["checkout-pending", "paid-confirmed", "scheduled", "delivered", "opened", "claimed", "expired", "invalid", "already-claimed", "failed-delivery"]);
  if (requiresEvidence.has(state) && (!isVerifiedEvidence(evidence) || evidence.provider !== STATE_PROVIDERS[state])) {
    throw new GiftLifecycleError("evidence_required", `Gift service must return verified evidence for ${state}.`);
  }
  return Object.freeze({ ...value, evidence: evidence ? Object.freeze({ ...evidence }) : null });
}

function isVerifiedEvidence(value) {
  return value?.verified === true && typeof value.provider === "string" && typeof value.eventId === "string" && value.eventId.length > 0;
}

function safeCheckoutUrl(value) {
  if (value == null) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function optionalString(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function createHttpRequest(fetchImpl, endpoint, getAccessToken) {
  return async (action, payload) => {
    if (typeof fetchImpl !== "function") throw new GiftLifecycleError("provider_unavailable", "Gift service is not configured.");
    let response;
    try {
      const accessToken = typeof getAccessToken === "function" ? await getAccessToken() : null;
      response = await fetchImpl(endpoint, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json", ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ action, ...payload }),
      });
    } catch {
      throw new GiftLifecycleError("provider_unavailable", "Gift service could not be reached.");
    }
    let body;
    try { body = await response.json(); } catch {
      throw new GiftLifecycleError("invalid_service_response", "Gift service returned an unreadable response.");
    }
    if (!response.ok) {
      const error = new GiftLifecycleError(body?.errorCode || "provider_unavailable", "Gift service did not complete the request.");
      error.statusCode = response.status;
      throw error;
    }
    return body;
  };
}

export { DEFAULT_ENDPOINT as GIFT_SERVICE_ENDPOINT };
