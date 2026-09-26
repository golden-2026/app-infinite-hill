/**
 * Gift lifecycle domain model.
 *
 * The browser may create a draft and request provider actions, but only the
 * trusted gift service can advance a gift beyond draft. Every transition is
 * tied to a provider/service event so a return URL or UI action cannot imply
 * payment, delivery, opening, or a claim.
 */

export const GIFT_LIFECYCLE_STATES = Object.freeze([
  "draft",
  "checkout-pending",
  "paid-confirmed",
  "scheduled",
  "delivered",
  "opened",
  "claimed",
  "expired",
  "invalid",
  "already-claimed",
  "failed-delivery",
]);

const STATE_SET = new Set(GIFT_LIFECYCLE_STATES);
const TRANSITIONS = Object.freeze({
  draft: ["checkout-pending"],
  "checkout-pending": ["paid-confirmed"],
  "paid-confirmed": ["scheduled", "expired"],
  scheduled: ["delivered", "failed-delivery", "claimed", "expired"],
  delivered: ["opened", "claimed", "expired"],
  opened: ["claimed", "expired"],
  "failed-delivery": ["scheduled", "expired"],
  claimed: [],
  expired: [],
  invalid: [],
  "already-claimed": [],
});

const EVIDENCE_PROVIDER = Object.freeze({
  "checkout-pending": new Set(["stripe-checkout"]),
  "paid-confirmed": new Set(["stripe-webhook"]),
  scheduled: new Set(["delivery-service"]),
  delivered: new Set(["delivery-service"]),
  opened: new Set(["gift-service"]),
  claimed: new Set(["gift-service"]),
  expired: new Set(["gift-service"]),
  invalid: new Set(["gift-service"]),
  "already-claimed": new Set(["gift-service"]),
  "failed-delivery": new Set(["delivery-service"]),
});

export class GiftLifecycleError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "GiftLifecycleError";
    this.code = code;
  }
}

export function createGift({ id, productKey, recipientName = "", message = "", now = new Date() } = {}) {
  if (typeof id !== "string" || !id.trim()) throw new GiftLifecycleError("invalid_gift_id", "A gift id is required.");
  if (typeof productKey !== "string" || !productKey.trim()) throw new GiftLifecycleError("invalid_product_key", "A gift product is required.");
  const createdAt = iso(now);
  return Object.freeze({
    id: id.trim(),
    productKey: productKey.trim(),
    recipientName: clean(recipientName, 80),
    message: clean(message, 240),
    state: "draft",
    createdAt,
    updatedAt: createdAt,
    evidence: null,
  });
}

/** Apply a confirmed event. `evidence` is metadata only; never include tokens or payloads. */
export function transitionGift(gift, nextState, { evidence, now = new Date() } = {}) {
  assertGift(gift);
  if (!STATE_SET.has(nextState)) throw new GiftLifecycleError("unknown_state", `Unknown gift state: ${nextState}`);
  if (!TRANSITIONS[gift.state].includes(nextState)) {
    throw new GiftLifecycleError("invalid_transition", `Gift cannot move from ${gift.state} to ${nextState}.`);
  }
  const confirmedEvidence = validateEvidence(nextState, evidence);
  return Object.freeze({
    ...gift,
    state: nextState,
    updatedAt: iso(now),
    evidence: confirmedEvidence,
  });
}

/**
 * Convert the existing Supabase row into the customer lifecycle vocabulary.
 * The SQL row alone cannot prove delivery or opening. A server response must
 * supply its lifecycle state and verified evidence for those milestones.
 */
export function projectSupabaseGift(row, { lifecycleState, evidence } = {}) {
  if (!row || typeof row !== "object" || typeof row.id !== "string" || typeof row.product_key !== "string") {
    throw new GiftLifecycleError("invalid_gift_record", "Gift record is malformed.");
  }
  const sqlStatus = row.status;
  let state;
  if (sqlStatus === "expired") state = "expired";
  else if (sqlStatus === "claimed") {
    if (!row.claimed_at) throw new GiftLifecycleError("invalid_gift_record", "Claimed gifts require a recorded claim time.");
    state = "claimed";
  }
  else if (["refunded", "revoked"].includes(sqlStatus)) {
    throw new GiftLifecycleError("gift_unavailable", `Gift is ${sqlStatus}.`);
  } else if (sqlStatus === "pending") {
    state = row.purchased_at ? "paid-confirmed" : "checkout-pending";
  } else {
    throw new GiftLifecycleError("invalid_gift_record", "Gift has an unsupported stored status.");
  }

  // Delivery states come only from the trusted server's lifecycle projection.
  if (lifecycleState !== undefined) {
    if (!STATE_SET.has(lifecycleState)) throw new GiftLifecycleError("invalid_gift_record", "Gift lifecycle state is unsupported.");
    if (lifecycleState === "delivered" || lifecycleState === "opened" || lifecycleState === "failed-delivery" || lifecycleState === "scheduled") {
      validateEvidence(lifecycleState, evidence);
      state = lifecycleState;
    } else if (lifecycleState !== state) {
      throw new GiftLifecycleError("state_mismatch", "Gift lifecycle state conflicts with the stored record.");
    }
  }

  const createdAt = iso(row.created_at || new Date());
  const updatedAt = iso(row.updated_at || row.claimed_at || row.purchased_at || row.created_at || new Date());
  return Object.freeze({
    id: row.id,
    productKey: row.product_key,
    recipientUserId: row.recipient_user_id || null,
    state,
    createdAt,
    updatedAt,
    purchasedAt: nullableIso(row.purchased_at),
    claimedAt: nullableIso(row.claimed_at),
    expiresAt: nullableIso(row.expires_at),
    externalRef: typeof row.external_ref === "string" ? row.external_ref : null,
    evidence: evidence ? validateEvidence(state, evidence) : null,
  });
}

function validateEvidence(state, evidence) {
  const providers = EVIDENCE_PROVIDER[state];
  if (!providers) return null;
  if (!evidence || evidence.verified !== true || !providers.has(evidence.provider) || typeof evidence.eventId !== "string" || !evidence.eventId.trim()) {
    throw new GiftLifecycleError("evidence_required", `${state} requires a verified event from its trusted provider.`);
  }
  return Object.freeze({
    provider: evidence.provider,
    eventId: evidence.eventId.trim(),
    verified: true,
    observedAt: iso(evidence.observedAt || new Date()),
  });
}

function assertGift(gift) {
  if (!gift || typeof gift !== "object" || typeof gift.id !== "string" || !STATE_SET.has(gift.state)) {
    throw new GiftLifecycleError("invalid_gift", "Gift lifecycle record is malformed.");
  }
}

function clean(value, max) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function iso(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new GiftLifecycleError("invalid_timestamp", "Gift timestamp is invalid.");
  return date.toISOString();
}

function nullableIso(value) {
  return value == null ? null : iso(value);
}
