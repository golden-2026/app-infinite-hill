import assert from "node:assert/strict";
import test from "node:test";
import { adaptVercelHandler } from "../../netlify/_shared/vercel-adapter.js";
import tableHandler, { createTableHandler } from "../../api/table.js";
import { createTableRepository, TableRepositoryError } from "../../src/platform/table-repository.js";

const OWNER = "58e339e1-5aef-4b06-9772-f95eb4e98957";
const MEMBER = "c80dd973-5392-44d4-9887-6ed4fd8d0800";
const NON_MEMBER = "e4ce2c37-36c9-4313-baa1-175dc1e1f481";
const TABLE = "b91b8ac9-474d-4fd2-96ba-53196b776cf6";
const INVITE = "c80dd973-5392-44d4-9887-6ed4fd8d0801";
const INVITE_TOKEN = "a".repeat(64);
const OWNER_TOKEN = "owner-access-token-value-123456";
const MEMBER_TOKEN = "member-access-token-value-123456";
const UNKNOWN_TOKEN = "unknown-access-token-value-123456";
const ENV = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_ANON_KEY: "anon-public-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
};

function response() {
  return { headers: {}, setHeader(name, value) { this.headers[name] = value; }, end(body) { this.body = body; } };
}

async function invoke(handler, { method = "GET", url = "/api/table", body, token = OWNER_TOKEN } = {}) {
  const res = response();
  const req = { method, url, headers: token ? { authorization: `Bearer ${token}` } : {} };
  if (body !== undefined) req.body = body;
  await handler(req, res);
  return { status: res.statusCode, headers: res.headers, body: JSON.parse(res.body || "{}") };
}

function database({ memberships = [], tables = [], activities = [] } = {}) {
  const calls = [];
  const state = {
    memberships: structuredClone(memberships),
    tables: structuredClone(tables),
    activities: structuredClone(activities),
    invites: [],
  };
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    const parsed = new URL(String(url));
    if (parsed.pathname.endsWith("/auth/v1/user")) {
      const id = options.headers.Authorization === `Bearer ${OWNER_TOKEN}` ? OWNER
        : options.headers.Authorization === `Bearer ${MEMBER_TOKEN}` ? MEMBER : null;
      return { ok: Boolean(id), status: id ? 200 : 401, json: async () => id ? { id } : { message: "bad token" } };
    }
    assert.equal(options.headers.apikey, ENV.SUPABASE_SERVICE_ROLE_KEY, "database calls use the server service key");
    assert.equal(options.headers.Authorization, `Bearer ${ENV.SUPABASE_SERVICE_ROLE_KEY}`);
    const route = parsed.pathname.split("/rest/v1/")[1];
    const q = parsed.searchParams;
    const body = options.body ? JSON.parse(options.body) : null;
    const ok = (data = null, status = 200) => ({ ok: true, status, json: async () => data });
    const fail = (status, code) => ({ ok: false, status, json: async () => ({ code }) });

    if (route === "table_members" && options.method === "GET") {
      let rows = state.memberships;
      if (q.has("user_id")) rows = rows.filter((row) => row.user_id === q.get("user_id").slice(3));
      if (q.has("table_id") && q.get("table_id").startsWith("eq.")) rows = rows.filter((row) => row.table_id === q.get("table_id").slice(3));
      if (q.has("table_id") && q.get("table_id").startsWith("in.")) {
        const ids = q.get("table_id").slice(4, -1).split(",");
        rows = rows.filter((row) => ids.includes(row.table_id));
      }
      if (q.has("user_id") && q.has("table_id") && q.get("table_id").startsWith("eq.")) rows = rows.filter((row) => row.user_id === q.get("user_id").slice(3));
      if (q.has("limit")) rows = rows.slice(0, Number(q.get("limit")));
      return ok(rows.map((row) => Object.fromEntries((q.get("select") || "").split(",").map((key) => [key, row[key]]))));
    }
    if (route === "community_tables" && options.method === "GET") {
      let rows = state.tables;
      if (q.has("id") && q.get("id").startsWith("eq.")) rows = rows.filter((row) => row.id === q.get("id").slice(3));
      if (q.has("id") && q.get("id").startsWith("in.")) {
        const ids = q.get("id").slice(4, -1).split(",");
        rows = rows.filter((row) => ids.includes(row.id));
      }
      if (q.has("limit")) rows = rows.slice(0, Number(q.get("limit")));
      return ok(rows);
    }
    if (route === "community_tables" && options.method === "POST") {
      const row = { id: TABLE, name: body[0].name, created_by: body[0].created_by, created_at: "2026-09-13T10:00:00.000Z", updated_at: "2026-09-13T10:00:00.000Z" };
      state.tables.push(row);
      state.memberships.push({ table_id: TABLE, user_id: OWNER, role: "owner", joined_at: row.created_at });
      return ok([row], 201);
    }
    if (route === "community_tables" && options.method === "PATCH") {
      const row = state.tables.find((item) => item.id === q.get("id").slice(3));
      if (!row) return ok([]);
      row.name = body.name;
      row.updated_at = "2026-09-13T11:00:00.000Z";
      return ok([row]);
    }
    if (route === "rpc/create_table_invite_for_user" && options.method === "POST") {
      const role = state.memberships.find((item) => item.table_id === body.p_table_id && item.user_id === body.p_actor_id)?.role;
      if (!role || !["owner", "admin"].includes(role)) return fail(403, "42501");
      state.invites.push({ id: INVITE, token: INVITE_TOKEN, table_id: body.p_table_id, created_by: body.p_actor_id });
      return ok([{ invite_id: INVITE, invite_token: INVITE_TOKEN, expires_at: "2026-09-20T10:00:00.000Z" }]);
    }
    if (route === "rpc/accept_table_invite_for_user" && options.method === "POST") {
      const invite = state.invites.find((item) => item.token === body.p_token);
      if (!invite) return fail(409, "22023");
      if (!state.memberships.some((item) => item.table_id === invite.table_id && item.user_id === body.p_actor_id)) {
        state.memberships.push({ table_id: invite.table_id, user_id: body.p_actor_id, role: "member", joined_at: "2026-09-13T12:00:00.000Z" });
      }
      state.invites = state.invites.filter((item) => item !== invite);
      return ok(invite.table_id);
    }
    if (route === "rpc/revoke_table_invite_for_user" && options.method === "POST") {
      const invite = state.invites.find((item) => item.id === body.p_invite_id);
      const admin = state.memberships.some((item) => item.table_id === invite?.table_id && item.user_id === body.p_actor_id && ["owner", "admin"].includes(item.role));
      if (!invite || !admin) return fail(403, "42501");
      state.invites = state.invites.filter((item) => item !== invite);
      return ok(null);
    }
    if (route === "rpc/leave_table_for_user" && options.method === "POST") {
      const membership = state.memberships.find((item) => item.table_id === body.p_table_id && item.user_id === body.p_actor_id);
      if (!membership || membership.role === "owner") return fail(403, "42501");
      state.memberships = state.memberships.filter((item) => item !== membership);
      return ok(null);
    }
    if (route === "rpc/record_table_showed_up" && options.method === "POST") {
      const member = state.memberships.some((item) => item.table_id === body.p_table_id && item.user_id === body.p_actor_id);
      if (!member) return fail(403, "42501");
      if (!state.activities.some((item) => item.table_id === body.p_table_id && item.member_id === body.p_actor_id && item.activity_date === body.p_activity_date)) {
        state.activities.push({ table_id: body.p_table_id, member_id: body.p_actor_id, activity_date: body.p_activity_date, signal: "showed-up" });
      }
      return ok(true);
    }
    if (route === "table_activity" && options.method === "GET") {
      return ok(state.activities.filter((item) => item.table_id === q.get("table_id").slice(3) && item.activity_date >= q.get("activity_date").slice(3)));
    }
    throw new Error(`Unexpected Supabase request: ${options.method} ${parsed.pathname}`);
  };
  return { fetchImpl, calls, state };
}

const initial = {
  tables: [{ id: TABLE, name: "Morning Table", created_at: "2026-09-12T10:00:00.000Z", updated_at: "2026-09-12T10:00:00.000Z" }],
  memberships: [
    { table_id: TABLE, user_id: OWNER, role: "owner", joined_at: "2026-09-12T10:00:00.000Z" },
    { table_id: TABLE, user_id: MEMBER, role: "member", joined_at: "2026-09-12T11:00:00.000Z" },
  ],
  activities: [],
};

test("Table backend remains unavailable without Supabase server credentials", async () => {
  let calls = 0;
  const handler = createTableHandler({ env: {}, fetchImpl: async () => { calls += 1; } });
  const result = await invoke(handler);
  assert.equal(result.status, 503);
  assert.equal(result.body.errorCode, "table_backend_not_configured");
  assert.equal(result.body.configured, false);
  assert.equal(calls, 0);
});

test("repository requires a distinct authenticated session, never the local anonymous account", async () => {
  let requests = 0;
  const repository = createTableRepository({ fetchImpl: async () => { requests += 1; }, getSession: () => ({ authenticated: false, userId: "anon_local" }) });
  await assert.rejects(repository.list(), (error) => error instanceof TableRepositoryError && error.code === "authentication_required");
  assert.equal(requests, 0);
});

test("Table CRUD uses verified Supabase identity and returns only Table-safe fields", async () => {
  const db = database();
  const handler = createTableHandler({ env: ENV, fetchImpl: db.fetchImpl });
  const created = await invoke(handler, { method: "POST", body: { name: "Quiet Practice" } });
  assert.equal(created.status, 201);
  assert.equal(created.body.table.role, "owner");
  assert.equal(created.body.table.memberCount, 1);
  assert.equal(created.body.table.name, "Quiet Practice");
  assert.equal(created.body.table.created_by, undefined);

  const listed = await invoke(handler);
  assert.equal(listed.status, 200);
  assert.equal(listed.body.tables[0].id, TABLE);
  assert.equal(listed.body.tables[0].role, "owner");
  assert.equal(JSON.stringify(listed.body).includes(OWNER), false);

  const renamed = await invoke(handler, { method: "PATCH", url: `/api/table/${TABLE}`, body: { name: "Morning Practice" } });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.body.table.name, "Morning Practice");
  assert.ok(db.calls.some((call) => call.url.endsWith("/auth/v1/user")));
  assert.ok(db.calls.filter((call) => call.url.includes("/rest/v1/")).every((call) => call.options.headers.apikey === ENV.SUPABASE_SERVICE_ROLE_KEY));
});

test("member-scoped reads hide Tables from nonmembers and members cannot rename or invite", async () => {
  const db = database(initial);
  const handler = createTableHandler({ env: ENV, fetchImpl: db.fetchImpl });
  const outsider = await invoke(handler, { url: `/api/table/${TABLE}`, token: UNKNOWN_TOKEN });
  assert.equal(outsider.status, 401);
  const hidden = await invoke(handler, { url: `/api/table/${TABLE}`, token: MEMBER_TOKEN });
  assert.equal(hidden.status, 200);
  assert.equal(hidden.body.table.role, "member");
  const rename = await invoke(handler, { method: "PATCH", url: `/api/table/${TABLE}`, token: MEMBER_TOKEN, body: { name: "Changed" } });
  assert.equal(rename.status, 403);
  assert.equal(rename.body.errorCode, "table_admin_required");
  const invite = await invoke(handler, { method: "POST", url: `/api/table/${TABLE}/invites`, token: MEMBER_TOKEN, body: {} });
  assert.equal(invite.status, 403);
});

test("invite creation returns the raw token once; acceptance and revoke use actor-checked RPCs", async () => {
  const db = database({ tables: initial.tables, memberships: initial.memberships.filter((item) => item.user_id === OWNER) });
  const handler = createTableHandler({ env: ENV, fetchImpl: db.fetchImpl });
  const created = await invoke(handler, { method: "POST", url: `/api/table/${TABLE}/invites`, body: { expiresInSeconds: 3600 } });
  assert.equal(created.status, 201);
  assert.deepEqual(created.body.invite, { id: INVITE, token: INVITE_TOKEN, expiresAt: "2026-09-20T10:00:00.000Z" });
  assert.equal(JSON.stringify(created.body).includes("token_hash"), false);
  assert.ok(db.calls.some((call) => call.url.endsWith("/rpc/create_table_invite_for_user")));

  const accepted = await invoke(handler, { method: "POST", url: "/api/table/invites/accept", body: { token: INVITE_TOKEN }, token: MEMBER_TOKEN });
  assert.equal(accepted.status, 200);
  assert.equal(accepted.body.table.role, "member");
  await invoke(handler, { method: "POST", url: `/api/table/${TABLE}/invites`, body: {} });
  const revoked = await invoke(handler, { method: "DELETE", url: `/api/table/${TABLE}/invites/${INVITE}` });
  assert.equal(revoked.status, 200);
  assert.ok(db.calls.some((call) => call.url.endsWith("/rpc/accept_table_invite_for_user")));
  assert.ok(db.calls.some((call) => call.url.endsWith("/rpc/revoke_table_invite_for_user")));
});

test("leave rejects owners and removes only a non-owner's own membership", async () => {
  const db = database(initial);
  const handler = createTableHandler({ env: ENV, fetchImpl: db.fetchImpl });
  const owner = await invoke(handler, { method: "POST", url: `/api/table/${TABLE}/leave` });
  assert.equal(owner.status, 403);
  const member = await invoke(handler, { method: "POST", url: `/api/table/${TABLE}/leave`, token: MEMBER_TOKEN });
  assert.equal(member.status, 200);
  assert.equal(db.state.memberships.some((item) => item.user_id === MEMBER), false);
});

test("activity shares only daily counts and the caller's own showed-up status", async () => {
  const db = database({ ...initial, activities: [
    { table_id: TABLE, member_id: MEMBER, activity_date: "2026-09-12", signal: "showed-up" },
    { table_id: TABLE, member_id: OWNER, activity_date: "2026-09-12", signal: "showed-up" },
    { table_id: TABLE, member_id: MEMBER, activity_date: "2026-09-13", signal: "showed-up" },
  ] });
  const handler = createTableHandler({ env: ENV, fetchImpl: db.fetchImpl, now: () => Date.parse("2026-09-13T12:00:00.000Z") });
  const result = await invoke(handler, { url: `/api/table/${TABLE}/activity` });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body.activity, [
    { date: "2026-09-12", memberCount: 2, showedUpByMe: true },
    { date: "2026-09-13", memberCount: 1, showedUpByMe: false },
  ]);
  assert.equal(JSON.stringify(result.body).includes(OWNER), false);
  assert.equal(JSON.stringify(result.body).includes(MEMBER), false);

  const record = await invoke(handler, { method: "POST", url: `/api/table/${TABLE}/activity`, body: { date: "2026-09-13", signal: "showed-up" } });
  assert.equal(record.status, 201);
  assert.deepEqual(record.body.activity, { date: "2026-09-13", signal: "showed-up" });
  const stored = db.calls.find((call) => call.url.endsWith("/rpc/record_table_showed_up"));
  assert.deepEqual(JSON.parse(stored.options.body), { p_table_id: TABLE, p_actor_id: OWNER, p_activity_date: "2026-09-13" });
});

test("activity rejects belief content, malformed dates, and unverified bearer tokens", async () => {
  const db = database(initial);
  const handler = createTableHandler({ env: ENV, fetchImpl: db.fetchImpl });
  const extra = await invoke(handler, { method: "POST", url: `/api/table/${TABLE}/activity`, body: { date: "2026-09-13", signal: "showed-up", door: "ISLAM", reflection: "private" } });
  assert.equal(extra.status, 400);
  const badDate = await invoke(handler, { method: "POST", url: `/api/table/${TABLE}/activity`, body: { date: "2026-02-30", signal: "showed-up" } });
  assert.equal(badDate.status, 400);
  const badToken = await invoke(handler, { token: UNKNOWN_TOKEN });
  assert.equal(badToken.status, 401);
  assert.equal(badToken.body.tables, undefined);
});

test("Table API bounds malformed JSON, methods, and adapter responses", async () => {
  const handler = createTableHandler({ env: ENV, fetchImpl: database().fetchImpl });
  const malformed = await invoke(handler, { method: "POST", body: "{" });
  assert.equal(malformed.status, 400);
  const method = await invoke(handler, { method: "PUT" });
  assert.equal(method.status, 405);
  assert.equal(method.headers.Allow, "GET, POST, PATCH, DELETE");

  const adapted = await adaptVercelHandler(tableHandler)({ httpMethod: "GET", path: "/api/table", headers: {} });
  assert.equal(adapted.statusCode, 503);
  const output = Buffer.from(adapted.body, adapted.isBase64Encoded ? "base64" : "utf8").toString("utf8");
  assert.equal(JSON.parse(output).errorCode, "table_backend_not_configured");
});
