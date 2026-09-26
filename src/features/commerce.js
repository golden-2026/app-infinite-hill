export const PLAN_CATALOG = Object.freeze([
  Object.freeze({
    id: "house",
    name: "The House",
    billing: "free",
    availability: "beta_preview",
    checkoutAvailable: false,
  }),
  Object.freeze({
    id: "plus",
    name: "Golden Plus",
    billing: "subscription",
    availability: "planned",
    checkoutAvailable: false,
  }),
  Object.freeze({
    id: "table",
    name: "The Table",
    billing: "subscription",
    availability: "planned",
    checkoutAvailable: false,
  }),
]);

export const GIFT_SKUS = Object.freeze([
  Object.freeze({ id: "first_100_days", name: "The first 100 days", billing: "one_time" }),
  Object.freeze({ id: "year", name: "A year", billing: "one_time" }),
  Object.freeze({ id: "table", name: "The Table", billing: "one_time" }),
]);

export const GIFT_DRAFT_STORAGE_KEY = "golden:beta:gift-draft";
export const GIFT_DRAFT_STATES = Object.freeze(["draft", "ready", "abandoned"]);

const GIFT_IDS = new Set(GIFT_SKUS.map(({ id }) => id));

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export function getPlan(planId) {
  return PLAN_CATALOG.find((plan) => plan.id === planId) || null;
}

export function createGiftDraft({ recipient = "", relationship = "", giftSku = "first_100_days", now = new Date(), id = makeId() } = {}) {
  if (!GIFT_IDS.has(giftSku)) throw new TypeError("Unknown gift selection");
  return Object.freeze({
    id,
    giftSku,
    recipient: cleanText(recipient, 80),
    relationship: cleanText(relationship, 40),
    status: "draft",
    createdAt: toIso(now),
    updatedAt: toIso(now),
  });
}

export function updateGiftDraft(draft, changes = {}, now = new Date()) {
  assertDraft(draft);
  if (draft.status === "abandoned") throw new TypeError("An abandoned gift draft cannot be edited");
  const nextSku = changes.giftSku ?? draft.giftSku;
  if (!GIFT_IDS.has(nextSku)) throw new TypeError("Unknown gift selection");
  return Object.freeze({
    ...draft,
    giftSku: nextSku,
    recipient: changes.recipient === undefined ? draft.recipient : cleanText(changes.recipient, 80),
    relationship: changes.relationship === undefined ? draft.relationship : cleanText(changes.relationship, 40),
    status: "draft",
    updatedAt: toIso(now),
  });
}

export function markGiftDraftReady(draft, now = new Date()) {
  assertDraft(draft);
  if (draft.status === "abandoned") throw new TypeError("An abandoned gift draft cannot be reopened");
  return Object.freeze({ ...draft, status: "ready", updatedAt: toIso(now) });
}

export function abandonGiftDraft(draft, now = new Date()) {
  assertDraft(draft);
  return Object.freeze({ ...draft, status: "abandoned", updatedAt: toIso(now) });
}

export function saveGiftDraft(storage, draft) {
  assertDraft(draft);
  storage.setItem(GIFT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  return draft;
}

export function loadGiftDraft(storage) {
  const raw = storage.getItem(GIFT_DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw);
    if (!isGiftDraft(draft)) return null;
    return Object.freeze(draft);
  } catch {
    return null;
  }
}

export function isGiftDraft(value) {
  return Boolean(
    value && typeof value === "object" && typeof value.id === "string" && GIFT_IDS.has(value.giftSku) &&
    GIFT_DRAFT_STATES.includes(value.status) && typeof value.createdAt === "string" && typeof value.updatedAt === "string" &&
    typeof value.recipient === "string" && typeof value.relationship === "string",
  );
}

function assertDraft(draft) {
  if (!isGiftDraft(draft)) throw new TypeError("Invalid gift draft");
}

function toIso(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError("Invalid timestamp");
  return date.toISOString();
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `gift_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}
