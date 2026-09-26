const IDENTITY_STORAGE_KEY = "golden:platform:supabase-session:v1";
const PKCE_VERIFIER_STORAGE_KEY = "golden:platform:supabase-pkce-verifier:v1";

function browserConfig() {
  // The publishable/anon key is designed for browser use with RLS. Never read a
  // service-role key here; server credentials belong in server-only functions.
  const env = import.meta.env || {};
  return {
    url: env.VITE_SUPABASE_URL || "",
    anonKey: env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || "",
  };
}

function normalizedUrl(value) {
  return typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
}

function publicUser(user) {
  if (!user || typeof user.id !== "string") return null;
  return {
    id: user.id,
    email: typeof user.email === "string" ? user.email : null,
    emailConfirmedAt: user.email_confirmed_at || user.confirmed_at || null,
  };
}

function safeSession(value) {
  if (!value || typeof value !== "object" || typeof value.access_token !== "string" || typeof value.refresh_token !== "string") return null;
  return {
    access_token: value.access_token,
    refresh_token: value.refresh_token,
    token_type: value.token_type || "bearer",
    expires_in: Number.isFinite(value.expires_in) ? value.expires_in : null,
    expires_at: Number.isFinite(value.expires_at) ? value.expires_at : null,
    user: publicUser(value.user),
  };
}

function parseResponseBody(text) {
  try { return text ? JSON.parse(text) : {}; } catch { return {}; }
}

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createPkcePair() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues || !cryptoApi?.subtle) throw new Error("auth_pkce_unavailable");
  const bytes = new Uint8Array(32);
  cryptoApi.getRandomValues(bytes);
  const verifier = base64Url(bytes);
  const digest = await cryptoApi.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64Url(new Uint8Array(digest)) };
}

/**
 * Create a browser-safe Supabase Auth REST adapter.
 *
 * The returned client handles identity only. It deliberately does not import,
 * upload, merge, or delete Golden's existing anonymous snapshot/recovery data.
 * Callers must implement and review that migration as a separate user action.
 */
export function createSupabaseIdentityClient(options = {}) {
  const defaults = browserConfig();
  const url = normalizedUrl(options.url ?? defaults.url);
  const anonKey = typeof (options.anonKey ?? defaults.anonKey) === "string" ? (options.anonKey ?? defaults.anonKey).trim() : "";
  const fetcher = options.fetcher ?? globalThis.fetch;
  const storage = options.storage === undefined ? (() => {
    try { return globalThis.localStorage || null; } catch { return null; }
  })() : options.storage;
  const configured = Boolean(url && anonKey && typeof fetcher === "function");
  let session = null;
  let listeners = new Set();

  function readStoredSession() {
    try {
      const parsed = JSON.parse(storage?.getItem(IDENTITY_STORAGE_KEY) || "null");
      return safeSession(parsed);
    } catch { return null; }
  }

  function persistSession(next) {
    session = safeSession(next);
    try {
      if (session) storage?.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(session));
      else storage?.removeItem(IDENTITY_STORAGE_KEY);
    } catch {
      // The current page can still use an in-memory session when browser storage
      // is disabled. The returned state makes persistence status observable.
    }
    emit("session_changed");
    return session;
  }

  function persistence() {
    try { return storage && storage.getItem(IDENTITY_STORAGE_KEY) !== null ? "browser-local" : storage ? "browser-local" : "memory-only"; }
    catch { return "memory-only"; }
  }

  function getState() {
    if (!configured) return { status: "unconfigured", configured: false, authenticated: false, provider: "supabase", session: null, user: null, persistence: "none", errorCode: "supabase_auth_not_configured" };
    if (!session) session = readStoredSession();
    if (!session) return { status: "anonymous", configured: true, authenticated: false, provider: "supabase", session: null, user: null, persistence: persistence(), errorCode: null };
    return { status: "authenticated", configured: true, authenticated: true, provider: "supabase", session: structuredClone(session), user: session.user, persistence: persistence(), errorCode: null };
  }

  function emit(event) {
    const state = getState();
    for (const listener of listeners) {
      try { listener(event, structuredClone(state)); } catch { /* Consumers cannot interrupt auth state changes. */ }
    }
  }

  async function request(path, { method = "GET", body, accessToken } = {}) {
    const headers = { apikey: anonKey, "Content-Type": "application/json" };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    let response;
    try {
      response = await fetcher(`${url}/auth/v1${path}`, {
        method,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      return { ok: false, errorCode: "auth_network_unavailable", body: {} };
    }
    const responseBody = parseResponseBody(await response.text().catch(() => ""));
    if (!response.ok) return { ok: false, errorCode: responseBody.error_code || responseBody.code || responseBody.msg || "auth_request_failed", body: responseBody };
    return { ok: true, body: responseBody };
  }

  function unconfiguredResult() {
    return { ...getState(), ok: false, errorCode: "supabase_auth_not_configured" };
  }

  async function signUp({ email, password, redirectTo } = {}) {
    if (!configured) return unconfiguredResult();
    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) return { ...getState(), ok: false, errorCode: "email_and_password_required" };
    let pkce;
    try { pkce = await createPkcePair(); }
    catch { return { ...getState(), ok: false, errorCode: "auth_pkce_unavailable" }; }
    try { storage?.setItem(PKCE_VERIFIER_STORAGE_KEY, pkce.verifier); } catch {}
    const query = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : "";
    const result = await request(`/signup${query}`, { method: "POST", body: { email: email.trim(), password, code_challenge: pkce.challenge, code_challenge_method: "s256" } });
    if (!result.ok) {
      try { storage?.removeItem(PKCE_VERIFIER_STORAGE_KEY); } catch {}
      return { ...getState(), ok: false, errorCode: result.errorCode };
    }
    const next = persistSession(result.body);
    if (next) { try { storage?.removeItem(PKCE_VERIFIER_STORAGE_KEY); } catch {} }
    return { ...getState(), ok: true, confirmationRequired: !next, errorCode: null };
  }

  async function signIn({ email, password } = {}) {
    if (!configured) return unconfiguredResult();
    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) return { ...getState(), ok: false, errorCode: "email_and_password_required" };
    const result = await request("/token?grant_type=password", { method: "POST", body: { email: email.trim(), password } });
    if (!result.ok) return { ...getState(), ok: false, errorCode: result.errorCode };
    const next = persistSession(result.body);
    if (!next) return { ...getState(), ok: false, errorCode: "auth_session_missing" };
    return { ...getState(), ok: true, errorCode: null };
  }

  async function requestPasswordReset({ email, redirectTo } = {}) {
    if (!configured) return unconfiguredResult();
    if (typeof email !== "string" || !email.trim()) return { ...getState(), ok: false, errorCode: "email_required" };
    let pkce;
    try { pkce = await createPkcePair(); }
    catch { return { ...getState(), ok: false, errorCode: "auth_pkce_unavailable" }; }
    try { storage?.setItem(PKCE_VERIFIER_STORAGE_KEY, pkce.verifier); } catch {}
    const query = redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : "";
    const result = await request(`/recover${query}`, {
      method: "POST",
      body: { email: email.trim(), code_challenge: pkce.challenge, code_challenge_method: "s256" },
    });
    if (!result.ok) {
      try { storage?.removeItem(PKCE_VERIFIER_STORAGE_KEY); } catch {}
      return { ...getState(), ok: false, errorCode: result.errorCode };
    }
    return { ...getState(), ok: true, deliveryAccepted: true, errorCode: null };
  }

  async function updatePassword({ password } = {}) {
    if (!configured) return unconfiguredResult();
    const active = session || readStoredSession();
    if (!active?.access_token) return { ...getState(), ok: false, errorCode: "auth_session_missing" };
    if (typeof password !== "string" || !password) return { ...getState(), ok: false, errorCode: "password_required" };
    const result = await request("/user", { method: "PUT", accessToken: active.access_token, body: { password } });
    if (!result.ok) return { ...getState(), ok: false, errorCode: result.errorCode };
    if (result.body && typeof result.body === "object") persistSession({ ...active, user: result.body });
    return { ...getState(), ok: true, errorCode: null };
  }

  async function refreshSession() {
    if (!configured) return unconfiguredResult();
    const active = session || readStoredSession();
    if (!active?.refresh_token) return { ...getState(), ok: false, errorCode: "auth_refresh_token_missing" };
    const result = await request("/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: active.refresh_token } });
    if (!result.ok) return { ...getState(), ok: false, errorCode: result.errorCode };
    const next = persistSession(result.body);
    if (!next) return { ...getState(), ok: false, errorCode: "auth_session_missing" };
    return { ...getState(), ok: true, errorCode: null };
  }

  async function signOut() {
    if (!configured) return unconfiguredResult();
    const active = session || readStoredSession();
    if (!active) return { ...getState(), ok: true, errorCode: null };
    const result = await request("/logout", { method: "POST", accessToken: active.access_token });
    // A local sign-out must clear this browser's bearer tokens even when the
    // remote revocation endpoint is unreachable. Remote revocation is reported.
    persistSession(null);
    return { ...getState(), ok: result.ok, errorCode: result.ok ? null : result.errorCode, remoteRevoked: result.ok };
  }

  async function handleAuthCallback(callbackUrl = globalThis.location?.href || "") {
    if (!configured) return unconfiguredResult();
    let parsed;
    try { parsed = new URL(callbackUrl, globalThis.location?.origin || "http://localhost"); }
    catch { return { ...getState(), ok: false, errorCode: "invalid_auth_callback" }; }
    const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ""));
    const hasFragmentAuthResult = ["access_token", "error", "error_code", "error_description"].some((key) => fragment.has(key));
    const params = hasFragmentAuthResult ? fragment : parsed.searchParams;
    const providerError = params.get("error_description") || params.get("error") || params.get("error_code");
    if (providerError) return { ...getState(), ok: false, errorCode: params.get("error_code") || params.get("error") || "auth_callback_rejected" };
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (!accessToken || !refreshToken) {
      const code = parsed.searchParams.get("code");
      if (!code) return { ...getState(), ok: false, errorCode: "auth_callback_session_missing" };
      let verifier = null;
      try { verifier = storage?.getItem(PKCE_VERIFIER_STORAGE_KEY) || null; } catch {}
      if (!verifier) return { ...getState(), ok: false, errorCode: "auth_pkce_verifier_missing" };
      const exchange = await request("/token?grant_type=pkce", { method: "POST", body: { auth_code: code, code_verifier: verifier } });
      if (!exchange.ok) return { ...getState(), ok: false, errorCode: exchange.errorCode };
      try { storage?.removeItem(PKCE_VERIFIER_STORAGE_KEY); } catch {}
      const exchanged = persistSession(exchange.body);
      if (!exchanged) return { ...getState(), ok: false, errorCode: "auth_session_missing" };
      return { ...getState(), ok: true, errorCode: null };
    }
    const expiresIn = Number(params.get("expires_in"));
    const next = persistSession({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: params.get("token_type") || "bearer",
      expires_in: Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : undefined,
      expires_at: Number(params.get("expires_at")) || undefined,
      user: readStoredSession()?.user || null,
    });
    const userResult = await request("/user", { accessToken: next.access_token });
    if (userResult.ok) persistSession({ ...next, user: userResult.body });
    return { ...getState(), ok: true, errorCode: null };
  }

  function onAuthStateChange(listener) {
    if (typeof listener !== "function") throw new TypeError("Auth state listener must be a function.");
    listeners.add(listener);
    return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
  }

  if (configured) session = readStoredSession();
  return Object.freeze({
    getState,
    getSession: () => getState().session,
    signUp,
    signIn,
    requestPasswordReset,
    updatePassword,
    refreshSession,
    signOut,
    handleAuthCallback,
    onAuthStateChange,
    storageKey: IDENTITY_STORAGE_KEY,
  });
}

/** Read the current browser identity without making a network request. */
export function getSupabaseIdentityState() {
  return createSupabaseIdentityClient().getState();
}

/** Return the current bearer token only when Supabase has authenticated it. */
export function getSupabaseAccessToken() {
  const state = getSupabaseIdentityState();
  return state.authenticated ? state.session?.access_token || null : null;
}

export { IDENTITY_STORAGE_KEY };
