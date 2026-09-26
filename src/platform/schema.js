export const STATE_SCHEMA_VERSION = 1;
export const LOCAL_ACCOUNT_KEY = "golden:platform:account:v1";
export const LOCAL_APP_STATE_KEY = "golden:v150:state";
export const PLATFORM_STORAGE_KEYS = Object.freeze({ account: LOCAL_ACCOUNT_KEY, appState: LOCAL_APP_STATE_KEY });
export const SNAPSHOT_MAX_BYTES = 128 * 1024;

export const CAPABILITY_STATE = Object.freeze({
  DEVICE_LOCAL: "device-local",
  CONFIGURED: "configured",
  PENDING: "pending",
  CONNECTED: "connected",
  DELIVERED: "delivered",
});

const LOCAL_ID_PATTERN = /^anon_[a-f0-9]{64}$/;
const RECOVERY_CREDENTIAL_PATTERN = /^[a-f0-9]{64}$/;

export function isLocalUserId(value) {
  return typeof value === "string" && LOCAL_ID_PATTERN.test(value);
}

export function isRecoveryCredential(value) {
  return typeof value === "string" && RECOVERY_CREDENTIAL_PATTERN.test(value);
}

export function validateSnapshot(snapshot, { allowRecoveryCredential = true } = {}) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return { ok: false, error: "snapshot_not_object" };
  if (snapshot.schemaVersion !== STATE_SCHEMA_VERSION) return { ok: false, error: "unsupported_schema_version" };
  if (!snapshot.account || typeof snapshot.account !== "object" || !isLocalUserId(snapshot.account.userId)) return { ok: false, error: "invalid_account" };
  if (typeof snapshot.account.createdAt !== "string" || Number.isNaN(Date.parse(snapshot.account.createdAt))) return { ok: false, error: "invalid_account_timestamp" };
  if (snapshot.account.profile !== undefined && (!snapshot.account.profile || typeof snapshot.account.profile !== "object" || Array.isArray(snapshot.account.profile))) return { ok: false, error: "invalid_profile" };
  if (snapshot.appState !== null && (!snapshot.appState || typeof snapshot.appState !== "object" || snapshot.appState.version !== 1 || !snapshot.appState.state || typeof snapshot.appState.state !== "object" || Array.isArray(snapshot.appState.state))) return { ok: false, error: "invalid_app_state" };
  if (typeof snapshot.exportedAt !== "string" || Number.isNaN(Date.parse(snapshot.exportedAt))) return { ok: false, error: "invalid_export_timestamp" };
  if (snapshot.recoveryCredential !== undefined && (!allowRecoveryCredential || !isRecoveryCredential(snapshot.recoveryCredential))) return { ok: false, error: "invalid_recovery_credential" };
  let byteLength;
  try { byteLength = new TextEncoder().encode(JSON.stringify(snapshot)).byteLength; } catch { return { ok: false, error: "snapshot_not_serializable" }; }
  if (byteLength > SNAPSHOT_MAX_BYTES) return { ok: false, error: "snapshot_too_large" };
  return { ok: true, error: null };
}

export function parseSnapshot(input, options) {
  let snapshot = input;
  if (typeof input === "string") {
    if (new TextEncoder().encode(input).byteLength > SNAPSHOT_MAX_BYTES) throw new Error("Snapshot is larger than the 128 KiB limit.");
    try { snapshot = JSON.parse(input); } catch { throw new Error("Snapshot is not valid JSON."); }
  }
  const result = validateSnapshot(snapshot, options);
  if (!result.ok) throw new Error(`Snapshot rejected: ${result.error}.`);
  return snapshot;
}
