import {
  CAPABILITY_STATE,
  LOCAL_ACCOUNT_KEY,
  LOCAL_APP_STATE_KEY,
  PLATFORM_STORAGE_KEYS,
  parseSnapshot,
  STATE_SCHEMA_VERSION,
  isLocalUserId,
  isRecoveryCredential,
  validateSnapshot,
} from "./schema.js";

export { CAPABILITY_STATE, LOCAL_ACCOUNT_KEY, LOCAL_APP_STATE_KEY, PLATFORM_STORAGE_KEYS, STATE_SCHEMA_VERSION };
export { parseSnapshot as parseLocalSnapshot, validateSnapshot };
export { createSupabaseIdentityClient, getSupabaseAccessToken, getSupabaseIdentityState, IDENTITY_STORAGE_KEY } from "./identity.js";

let memoryAccount = null;
let accountPersistence = "memory-only";

function localStorageOrNull() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

function randomHex(bytes = 32) {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) return null;
  const data = new Uint8Array(bytes);
  cryptoApi.getRandomValues(data);
  return [...data].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function newAccount() {
  const idEntropy = randomHex();
  const credential = randomHex();
  if (!idEntropy || !credential) throw new Error("This browser cannot create secure local sync credentials.");
  const now = new Date().toISOString();
  return {
    userId: `anon_${idEntropy}`,
    createdAt: now,
    profile: { displayName: null, email: null },
    recoveryCredential: credential,
  };
}

export function getLocalAccount() {
  if (memoryAccount) return structuredClone(memoryAccount);
  const storage = localStorageOrNull();
  if (storage) {
    try {
      const saved = JSON.parse(storage.getItem(LOCAL_ACCOUNT_KEY) || "null");
      if (saved && isLocalUserId(saved.userId) && typeof saved.createdAt === "string" && isRecoveryCredential(saved.recoveryCredential)) {
        const profile = saved.profile && typeof saved.profile === "object" && !Array.isArray(saved.profile) ? saved.profile : {};
        memoryAccount = { ...saved, profile: { displayName: null, email: null, ...profile } };
        accountPersistence = "browser-local";
        return structuredClone(memoryAccount);
      }
    } catch {}
  }
  memoryAccount = newAccount();
  try {
    if (storage) {
      storage.setItem(LOCAL_ACCOUNT_KEY, JSON.stringify(memoryAccount));
      accountPersistence = "browser-local";
    }
  } catch { accountPersistence = "memory-only"; }
  return structuredClone(memoryAccount);
}

export function getLocalSession() {
  const account = getLocalAccount();
  return {
    status: CAPABILITY_STATE.DEVICE_LOCAL,
    provider: "anonymous-local",
    authenticated: false,
    userId: account.userId,
    profile: structuredClone(account.profile),
    createdAt: account.createdAt,
    persistence: accountPersistence,
  };
}

export function getPlatformCapabilities() {
  const pending = (detail, source = "not-connected") => ({ state: CAPABILITY_STATE.PENDING, configured: false, connected: false, delivered: false, source, detail });
  const persistence = getLocalSession().persistence;
  return {
    auth: { state: CAPABILITY_STATE.DEVICE_LOCAL, configured: false, connected: false, delivered: false, source: "anonymous-local", detail: persistence === "browser-local" ? "A stable anonymous profile exists only in this browser. There is no sign-in or verified identity." : "Browser storage is unavailable, so this anonymous profile lasts only until the page closes. There is no sign-in or verified identity." },
    sync: pending("A server route must be wired and a successful encrypted upload must be observed before this is connected."),
    payments: pending("Plan prices are prototype content; no payment provider is connected."),
    gifts: pending("Gift choices are prototype flows; no gift has been purchased or delivered."),
    reminders: { state: CAPABILITY_STATE.DEVICE_LOCAL, configured: false, connected: false, delivered: false, source: "local-preference", detail: "The reminder preference can be stored on this device; no notification permission or schedule is configured." },
    celebrityAudio: pending("Displayed voices and portraits do not prove signed audio rights or delivered recordings.", "prototype-content"),
    events: pending("Event cards are prototype content; no event service is connected.", "prototype-content"),
    liveCommunityCounts: pending("Displayed population figures are static prototype values, not live community counts.", "static-prototype-value"),
  };
}

export function getPlatformState() {
  return { session: getLocalSession(), capabilities: getPlatformCapabilities() };
}

function readAppState() {
  const storage = localStorageOrNull();
  try {
    const value = JSON.parse(storage?.getItem(LOCAL_APP_STATE_KEY) || "null");
    if (value && value.version === 1 && value.state && typeof value.state === "object") return value;
  } catch {}
  return null;
}

export function createLocalSnapshot({ includeRecoveryCredential = false, appState = readAppState() } = {}) {
  const account = getLocalAccount();
  const snapshot = {
    schemaVersion: STATE_SCHEMA_VERSION,
    account: { userId: account.userId, createdAt: account.createdAt, profile: account.profile },
    appState,
    exportedAt: new Date().toISOString(),
  };
  if (includeRecoveryCredential) snapshot.recoveryCredential = account.recoveryCredential;
  return parseSnapshot(snapshot);
}

export function exportLocalSnapshot(options) {
  return JSON.stringify(createLocalSnapshot(options), null, 2);
}

export function importLocalSnapshot(input) {
  const snapshot = parseSnapshot(input);
  const current = getLocalAccount();
  const storage = localStorageOrNull();
  if (!storage) throw new Error("Browser storage is unavailable; this snapshot cannot be restored persistently.");
  const restoreIdentity = Boolean(snapshot.recoveryCredential);
  const nextAccount = restoreIdentity
    ? { userId: snapshot.account.userId, createdAt: snapshot.account.createdAt, profile: snapshot.account.profile || { displayName: null, email: null }, recoveryCredential: snapshot.recoveryCredential }
    : { ...current, profile: snapshot.account.profile || current.profile };
  const previousAccount = storage.getItem(LOCAL_ACCOUNT_KEY);
  const previousAppState = storage.getItem(LOCAL_APP_STATE_KEY);
  try {
    storage.setItem(LOCAL_ACCOUNT_KEY, JSON.stringify(nextAccount));
    if (snapshot.appState) storage.setItem(LOCAL_APP_STATE_KEY, JSON.stringify(snapshot.appState));
    else storage.removeItem(LOCAL_APP_STATE_KEY);
  } catch {
    try {
      if (previousAccount === null) storage.removeItem(LOCAL_ACCOUNT_KEY); else storage.setItem(LOCAL_ACCOUNT_KEY, previousAccount);
      if (previousAppState === null) storage.removeItem(LOCAL_APP_STATE_KEY); else storage.setItem(LOCAL_APP_STATE_KEY, previousAppState);
    } catch {}
    throw new Error("Could not restore this snapshot in browser storage.");
  }
  memoryAccount = nextAccount;
  accountPersistence = "browser-local";
  return { status: CAPABILITY_STATE.DEVICE_LOCAL, userId: nextAccount.userId, restoredSyncIdentity: restoreIdentity, restoredAppState: Boolean(snapshot.appState) };
}

function cryptoApi() {
  const api = globalThis.crypto;
  if (!api?.subtle || !api?.getRandomValues) throw new Error("Web Crypto is required for encrypted sync.");
  return api;
}

function credentialBytes(credential) {
  if (!/^[a-f0-9]{64}$/.test(credential || "")) throw new Error("A valid recovery credential is required for sync.");
  return Uint8Array.from(credential.match(/.{2}/g), (pair) => Number.parseInt(pair, 16));
}

function base64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function unbase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function encryptionKey(credential, usage) {
  const api = cryptoApi();
  const baseKey = await api.subtle.importKey("raw", credentialBytes(credential), "HKDF", false, ["deriveKey"]);
  return api.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode("golden-private-beta-state-v1"),
      info: new TextEncoder().encode("aes-gcm-snapshot-key"),
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    [usage],
  );
}

export async function encryptSnapshot(snapshot, credential = getLocalAccount().recoveryCredential) {
  const checked = { ...parseSnapshot(snapshot) };
  delete checked.recoveryCredential;
  const api = cryptoApi();
  const iv = new Uint8Array(12);
  api.getRandomValues(iv);
  const key = await encryptionKey(credential, "encrypt");
  const ciphertext = await api.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(checked)));
  return { schemaVersion: STATE_SCHEMA_VERSION, algorithm: "AES-GCM", iv: base64(iv), ciphertext: base64(new Uint8Array(ciphertext)) };
}

export async function decryptSnapshot(envelope, credential = getLocalAccount().recoveryCredential) {
  if (!envelope || envelope.schemaVersion !== STATE_SCHEMA_VERSION || envelope.algorithm !== "AES-GCM" || typeof envelope.iv !== "string" || typeof envelope.ciphertext !== "string") throw new Error("Remote snapshot envelope is invalid.");
  const api = cryptoApi();
  const key = await encryptionKey(credential, "decrypt");
  try {
    const plaintext = await api.subtle.decrypt({ name: "AES-GCM", iv: unbase64(envelope.iv) }, key, unbase64(envelope.ciphertext));
    return parseSnapshot(new TextDecoder().decode(plaintext));
  } catch {
    throw new Error("This snapshot could not be decrypted with the local recovery credential.");
  }
}

function syncHeaders(account) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${account.recoveryCredential}` };
}

function syncError(errorCode = "state_service_unavailable") {
  return { state: CAPABILITY_STATE.PENDING, configured: false, connected: false, delivered: false, errorCode };
}

export async function fetchRemoteSnapshot({ fetcher = globalThis.fetch, endpoint = "/api/state" } = {}) {
  const account = getLocalAccount();
  try {
    const response = await fetcher(`${endpoint}?userId=${encodeURIComponent(account.userId)}`, { headers: syncHeaders(account) });
    if (!response.ok) return syncError(response.status === 404 ? "remote_state_not_initialized" : "state_service_unavailable");
    const result = await response.json();
    const snapshot = result.snapshot ? await decryptSnapshot(result.snapshot, account.recoveryCredential) : null;
    return { state: CAPABILITY_STATE.CONNECTED, configured: true, connected: true, delivered: false, snapshot, updatedAt: result.updatedAt || null };
  } catch {
    return syncError();
  }
}

export async function saveRemoteSnapshot({ snapshot = createLocalSnapshot(), fetcher = globalThis.fetch, endpoint = "/api/state" } = {}) {
  const account = getLocalAccount();
  try {
    const checked = parseSnapshot(snapshot);
    if (checked.account.userId !== account.userId) return syncError("snapshot_account_mismatch");
    const encrypted = await encryptSnapshot(checked, account.recoveryCredential);
    const response = await fetcher(endpoint, { method: "PUT", headers: syncHeaders(account), body: JSON.stringify({ userId: account.userId, ...encrypted }) });
    if (!response.ok) {
      let code = "state_service_unavailable";
      try { code = (await response.json()).errorCode || code; } catch {}
      return syncError(code);
    }
    const result = await response.json();
    return { state: CAPABILITY_STATE.DELIVERED, configured: true, connected: true, delivered: true, updatedAt: result.updatedAt || null };
  } catch {
    return syncError("state_upload_failed");
  }
}
