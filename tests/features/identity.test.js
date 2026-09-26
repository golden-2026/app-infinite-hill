import assert from "node:assert/strict";
import test from "node:test";
import { createSupabaseIdentityClient, IDENTITY_STORAGE_KEY } from "../../src/platform/identity.js";

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(body) };
}

const config = { url: "https://project.supabase.co/", anonKey: "public-anon-key" };

test("missing Supabase browser config is explicitly unconfigured and makes no requests", async () => {
  let requests = 0;
  const client = createSupabaseIdentityClient({ url: "", anonKey: "", fetcher: async () => { requests += 1; } });
  assert.equal(client.getState().status, "unconfigured");
  assert.equal(client.getState().errorCode, "supabase_auth_not_configured");
  assert.equal((await client.signIn({ email: "a@example.com", password: "secret" })).status, "unconfigured");
  assert.equal((await client.signUp({ email: "a@example.com", password: "secret" })).status, "unconfigured");
  assert.equal(requests, 0);
});

test("sign up can return confirmation-required state without inventing a session", async () => {
  const calls = [];
  const client = createSupabaseIdentityClient({ ...config, storage: memoryStorage(), fetcher: async (url, init) => {
    calls.push({ url, init });
    return response({ user: { id: "user-1", email: "ari@example.com" }, session: null });
  } });
  const result = await client.signUp({ email: " ari@example.com ", password: "long-secret", redirectTo: "https://golden.example/auth/callback" });
  assert.equal(result.ok, true);
  assert.equal(result.status, "anonymous");
  assert.equal(result.confirmationRequired, true);
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/signup?redirect_to=https%3A%2F%2Fgolden.example%2Fauth%2Fcallback");
  const signupBody = JSON.parse(calls[0].init.body);
  assert.equal(signupBody.email, "ari@example.com");
  assert.equal(signupBody.password, "long-secret");
  assert.equal(signupBody.code_challenge_method, "s256");
  assert.match(signupBody.code_challenge, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(calls[0].init.headers.apikey, "public-anon-key");
  assert.equal(calls[0].init.headers.Authorization, undefined);
});

test("email sign-in stores only the returned Supabase session and publishes state changes", async () => {
  const storage = memoryStorage();
  const calls = [];
  const client = createSupabaseIdentityClient({ ...config, storage, fetcher: async (url, init) => {
    calls.push({ url, init });
    return response({
      access_token: "access-secret",
      refresh_token: "refresh-secret",
      token_type: "bearer",
      expires_in: 3600,
      user: { id: "user-1", email: "ari@example.com", email_confirmed_at: "2026-09-13T10:00:00Z" },
    });
  } });
  const events = [];
  const subscription = client.onAuthStateChange((event, state) => events.push([event, state.status]));

  const result = await client.signIn({ email: "ari@example.com", password: "long-secret" });
  assert.equal(result.ok, true);
  assert.equal(result.status, "authenticated");
  assert.equal(result.user.id, "user-1");
  assert.equal(result.user.emailConfirmedAt, "2026-09-13T10:00:00Z");
  assert.match(calls[0].url, /\/auth\/v1\/token\?grant_type=password$/);
  assert.deepEqual(JSON.parse(calls[0].init.body), { email: "ari@example.com", password: "long-secret" });
  assert.equal(client.getSession().refresh_token, "refresh-secret");
  assert.equal(JSON.parse(storage.getItem(IDENTITY_STORAGE_KEY)).access_token, "access-secret");
  assert.deepEqual(events, [["session_changed", "authenticated"]]);

  subscription.data.subscription.unsubscribe();
  await client.signOut();
  assert.equal(events.length, 1);
});

test("restored session is available without network and sign-out clears local tokens", async () => {
  const saved = {
    access_token: "old-access",
    refresh_token: "old-refresh",
    user: { id: "user-2", email: "bea@example.com" },
  };
  const storage = memoryStorage({ [IDENTITY_STORAGE_KEY]: JSON.stringify(saved) });
  let request;
  const client = createSupabaseIdentityClient({ ...config, storage, fetcher: async (url, init) => {
    request = { url, init };
    return response({});
  } });
  assert.equal(client.getState().status, "authenticated");
  const result = await client.signOut();
  assert.equal(result.status, "anonymous");
  assert.equal(result.remoteRevoked, true);
  assert.equal(storage.getItem(IDENTITY_STORAGE_KEY), null);
  assert.equal(request.url, "https://project.supabase.co/auth/v1/logout");
  assert.equal(request.init.headers.Authorization, "Bearer old-access");
});

test("refresh session rotates persisted Supabase tokens", async () => {
  const storage = memoryStorage({ [IDENTITY_STORAGE_KEY]: JSON.stringify({
    access_token: "old-access", refresh_token: "old-refresh", user: { id: "user-2", email: "bea@example.com" },
  }) });
  let call;
  const client = createSupabaseIdentityClient({ ...config, storage, fetcher: async (url, init) => {
    call = { url, init };
    return response({ access_token: "new-access", refresh_token: "new-refresh", user: { id: "user-2", email: "bea@example.com" } });
  } });
  const result = await client.refreshSession();
  assert.equal(result.ok, true);
  assert.equal(result.session.access_token, "new-access");
  assert.deepEqual(JSON.parse(call.init.body), { refresh_token: "old-refresh" });
  assert.equal(call.url, "https://project.supabase.co/auth/v1/token?grant_type=refresh_token");
  assert.equal(JSON.parse(storage.getItem(IDENTITY_STORAGE_KEY)).refresh_token, "new-refresh");
});

test("password recovery requests a PKCE email without creating a session", async () => {
  const storage = memoryStorage();
  let call;
  const client = createSupabaseIdentityClient({ ...config, storage, fetcher: async (url, init) => {
    call = { url, init };
    return response({});
  } });
  const result = await client.requestPasswordReset({ email: " ari@example.com ", redirectTo: "https://golden.example/?view=account&flow=recovery" });
  assert.equal(result.ok, true);
  assert.equal(result.status, "anonymous");
  assert.equal(result.deliveryAccepted, true);
  assert.match(call.url, /\/auth\/v1\/recover\?redirect_to=/);
  const body = JSON.parse(call.init.body);
  assert.equal(body.email, "ari@example.com");
  assert.equal(body.code_challenge_method, "s256");
  assert.match(body.code_challenge, /^[A-Za-z0-9_-]{43}$/);
});

test("an authenticated recovery session can update its password", async () => {
  const storage = memoryStorage({ [IDENTITY_STORAGE_KEY]: JSON.stringify({
    access_token: "recovery-access", refresh_token: "recovery-refresh", user: { id: "user-4", email: "ari@example.com" },
  }) });
  let call;
  const client = createSupabaseIdentityClient({ ...config, storage, fetcher: async (url, init) => {
    call = { url, init };
    return response({ id: "user-4", email: "ari@example.com" });
  } });
  const result = await client.updatePassword({ password: "new-long-secret" });
  assert.equal(result.ok, true);
  assert.equal(call.url, "https://project.supabase.co/auth/v1/user");
  assert.equal(call.init.method, "PUT");
  assert.equal(call.init.headers.Authorization, "Bearer recovery-access");
  assert.deepEqual(JSON.parse(call.init.body), { password: "new-long-secret" });
});

test("sign-out clears local tokens when remote revocation is unavailable", async () => {
  const storage = memoryStorage({ [IDENTITY_STORAGE_KEY]: JSON.stringify({ access_token: "a", refresh_token: "r" }) });
  const client = createSupabaseIdentityClient({ ...config, storage, fetcher: async () => { throw new Error("offline"); } });
  const result = await client.signOut();
  assert.equal(result.status, "anonymous");
  assert.equal(result.ok, false);
  assert.equal(result.errorCode, "auth_network_unavailable");
  assert.equal(storage.getItem(IDENTITY_STORAGE_KEY), null);
});

test("auth callback accepts returned session tokens, fetches the user, and handles provider errors", async () => {
  const storage = memoryStorage();
  const calls = [];
  const client = createSupabaseIdentityClient({ ...config, storage, fetcher: async (url, init) => {
    calls.push({ url, init });
    return response({ id: "callback-user", email: "callback@example.com" });
  } });
  const result = await client.handleAuthCallback("https://golden.example/#access_token=callback-access&refresh_token=callback-refresh&expires_in=3600&token_type=bearer");
  assert.equal(result.ok, true);
  assert.equal(result.status, "authenticated");
  assert.equal(result.user.id, "callback-user");
  assert.equal(calls[0].url, "https://project.supabase.co/auth/v1/user");
  assert.equal(calls[0].init.headers.Authorization, "Bearer callback-access");

  const failed = await client.handleAuthCallback("https://golden.example/#error=access_denied&error_description=User%20cancelled");
  assert.equal(failed.ok, false);
  assert.equal(failed.errorCode, "access_denied");
});

test("sign-up PKCE callback exchanges its one-time code and stores the resulting session", async () => {
  const storage = memoryStorage();
  const calls = [];
  const client = createSupabaseIdentityClient({ ...config, storage, fetcher: async (url, init) => {
    calls.push({ url, init });
    if (url.includes("/signup")) return response({ user: { id: "user-3", email: "rae@example.com" }, session: null });
    return response({ access_token: "pkce-access", refresh_token: "pkce-refresh", user: { id: "user-3", email: "rae@example.com" } });
  } });
  const signup = await client.signUp({ email: "rae@example.com", password: "long-secret" });
  assert.equal(signup.confirmationRequired, true);
  const verifier = storage.getItem("golden:platform:supabase-pkce-verifier:v1");
  assert.match(verifier, /^[A-Za-z0-9_-]{43}$/);
  const callback = await client.handleAuthCallback("https://golden.example/auth/callback?code=authorization-code");
  assert.equal(callback.ok, true);
  assert.equal(callback.status, "authenticated");
  assert.equal(callback.user.id, "user-3");
  assert.equal(calls[1].url, "https://project.supabase.co/auth/v1/token?grant_type=pkce");
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    auth_code: "authorization-code",
    code_verifier: verifier,
  });
  assert.equal(storage.getItem("golden:platform:supabase-pkce-verifier:v1"), null);
});

test("identity adapter never reads or mutates anonymous snapshot storage", async () => {
  const touched = [];
  const storage = {
    getItem(key) { touched.push(["get", key]); return null; },
    setItem(key) { touched.push(["set", key]); },
    removeItem(key) { touched.push(["remove", key]); },
  };
  const client = createSupabaseIdentityClient({ ...config, storage, fetcher: async () => response({}) });
  assert.equal(client.getState().status, "anonymous");
  assert.ok(touched.length > 0);
  assert.ok(touched.every(([, key]) => key === IDENTITY_STORAGE_KEY));
});
