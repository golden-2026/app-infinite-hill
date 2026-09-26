const ENTITLEMENT_STATES = new Set(["active", "grace", "expired", "revoked"]);
const RETURN_STATES = new Set(["entitled", "processing", "unverified", "unavailable"]);

/** Normalize only a server-verified entitlement response; URL parameters are never input here. */
export function normalizeEntitlement(value) {
  if (!value || typeof value !== "object" || typeof value.product_key !== "string" || !ENTITLEMENT_STATES.has(value.status)) return null;
  return Object.freeze({
    productKey: value.product_key,
    status: value.status,
    startsAt: typeof value.starts_at === "string" ? value.starts_at : null,
    endsAt: typeof value.ends_at === "string" ? value.ends_at : null,
  });
}

export function normalizeCheckoutStatus(value) {
  if (!value || value.verified !== true || !RETURN_STATES.has(value.state)) return Object.freeze({ state: "unverified", verified: false, activated: false });
  const activated = value.state === "entitled" && value.activated === true && typeof value.productId === "string";
  return Object.freeze({ state: activated ? "entitled" : value.state, verified: true, activated, ...(activated ? { productId: value.productId } : {}) });
}
