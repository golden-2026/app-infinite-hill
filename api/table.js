const MAX_REQUEST_BYTES = 16 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INVITE_TOKEN = /^[a-f0-9]{64}$/;
const METHODS = "GET, POST, PATCH, DELETE";
const ACTIVITY_DAYS = 90;

function json(res, statusCode, value) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  return res.end(JSON.stringify(value));
}

function safeSupabaseUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname));
  } catch { return false; }
}

function configured(env, fetchImpl) {
  return typeof fetchImpl === "function" && safeSupabaseUrl(env.SUPABASE_URL)
    && typeof env.SUPABASE_ANON_KEY === "string" && env.SUPABASE_ANON_KEY.length > 0
    && typeof env.SUPABASE_SERVICE_ROLE_KEY === "string" && env.SUPABASE_SERVICE_ROLE_KEY.length > 0;
}

function authToken(req) {
  const value = req.headers?.authorization || req.headers?.Authorization || "";
  return /^Bearer ([A-Za-z0-9._~-]{16,4096})$/.exec(value)?.[1] || null;
}

async function safeJson(response) {
  try { return await response.json(); } catch { return null; }
}

async function readBody(req) {
  if (req.body !== undefined) {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > MAX_REQUEST_BYTES) throw Object.assign(new Error(), { statusCode: 413 });
    return typeof req.body === "object" && !Buffer.isBuffer(req.body) ? req.body : JSON.parse(raw || "{}");
  }
  let raw = "";
  if (typeof req[Symbol.asyncIterator] !== "function") return {};
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > MAX_REQUEST_BYTES) throw Object.assign(new Error(), { statusCode: 413 });
  }
  return JSON.parse(raw || "{}");
}

function route(req) {
  const url = new URL(req.url || "/api/table", "http://localhost");
  if (url.pathname !== "/api/table" && !url.pathname.startsWith("/api/table/")) return null;
  let path;
  try { path = url.pathname.slice("/api/table".length).split("/").filter(Boolean).map(decodeURIComponent); }
  catch { return null; }
  return { path, search: url.searchParams };
}

function validName(value) { return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 80; }
function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}
function exactKeys(body, keys) { return Object.keys(body).every((key) => keys.includes(key)); }

function validRoute(method, parsed, body) {
  if (!parsed) return false;
  const { path, search } = parsed;
  if (!path.length) return (method === "GET" && search.size === 0)
    || (method === "POST" && validName(body?.name) && exactKeys(body, ["name"]));
  if (path[0] === "invites" && path.length === 2 && path[1] === "accept") {
    return method === "POST" && INVITE_TOKEN.test(body?.token || "") && exactKeys(body, ["token"]);
  }
  if (!UUID.test(path[0])) return false;
  if (path.length === 1) return (method === "GET" && search.size === 0)
    || (method === "PATCH" && validName(body?.name) && exactKeys(body, ["name"]));
  if (path.length === 2 && path[1] === "invites") return method === "POST"
    && (Object.keys(body).length === 0 || (exactKeys(body, ["expiresInSeconds"])
      && Number.isInteger(body.expiresInSeconds) && body.expiresInSeconds >= 1 && body.expiresInSeconds <= 2592000));
  if (path.length === 3 && path[1] === "invites") return method === "DELETE" && UUID.test(path[2]);
  if (path.length === 2 && path[1] === "leave") return method === "POST" && Object.keys(body).length === 0;
  if (path.length === 2 && path[1] === "activity") return (method === "GET" && search.size === 0)
    || (method === "POST" && validDate(body?.date) && body?.signal === "showed-up" && exactKeys(body, ["date", "signal"]));
  return false;
}

function serviceHeaders(env, prefer = "return=representation") {
  return { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": "application/json", Prefer: prefer };
}
function serviceUrl(env, table, query = "") {
  return `${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${table}${query ? `?${query}` : ""}`;
}

async function authenticate(token, env, fetchImpl) {
  const result = await fetchImpl(`${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`, {
    method: "GET", headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  });
  if (!result.ok) return null;
  const user = await safeJson(result);
  return UUID.test(user?.id || "") ? user.id : null;
}

async function serviceRequest(env, fetchImpl, tableOrRpc, { method = "GET", query = "", body, rpc = false, prefer = "return=representation" } = {}) {
  const path = rpc ? `rpc/${tableOrRpc}` : tableOrRpc;
  const response = await fetchImpl(serviceUrl(env, path, query), {
    method, headers: serviceHeaders(env, prefer),
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { ok: response.ok, status: response.status, data: await safeJson(response) };
}

function queryString(values) { return new URLSearchParams(values).toString(); }
function publicTable(row, role, memberCount) {
  if (!row || !UUID.test(row.id || "") || !validName(row.name)) throw new Error("invalid_table_record");
  return { id: row.id, name: row.name, role, memberCount, createdAt: row.created_at, updatedAt: row.updated_at };
}

async function memberRole(tableId, userId, env, fetchImpl) {
  const query = queryString({ select: "role", table_id: `eq.${tableId}`, user_id: `eq.${userId}`, limit: "1" });
  const result = await serviceRequest(env, fetchImpl, "table_members", { query });
  if (!result.ok || !Array.isArray(result.data)) throw new Error("table_read_failed");
  return result.data[0]?.role || null;
}

async function tableRecord(tableId, env, fetchImpl) {
  const query = queryString({ select: "id,name,created_at,updated_at", id: `eq.${tableId}`, limit: "1" });
  const result = await serviceRequest(env, fetchImpl, "community_tables", { query });
  if (!result.ok || !Array.isArray(result.data)) throw new Error("table_read_failed");
  return result.data[0] || null;
}

async function memberCount(tableId, env, fetchImpl) {
  const query = queryString({ select: "user_id", table_id: `eq.${tableId}` });
  const result = await serviceRequest(env, fetchImpl, "table_members", { query });
  if (!result.ok || !Array.isArray(result.data)) throw new Error("table_read_failed");
  return result.data.length;
}

async function oneTable(tableId, userId, env, fetchImpl) {
  const role = await memberRole(tableId, userId, env, fetchImpl);
  if (!role) return null;
  const [row, count] = await Promise.all([tableRecord(tableId, env, fetchImpl), memberCount(tableId, env, fetchImpl)]);
  return row ? publicTable(row, role, count) : null;
}

async function listTables(userId, env, fetchImpl) {
  const mine = await serviceRequest(env, fetchImpl, "table_members", {
    query: queryString({ select: "table_id,role", user_id: `eq.${userId}` }),
  });
  if (!mine.ok || !Array.isArray(mine.data)) throw new Error("table_read_failed");
  if (!mine.data.length) return [];
  const ids = mine.data.map((item) => item.table_id).filter((id) => UUID.test(id || ""));
  if (!ids.length) return [];
  const [rowsResult, membersResult] = await Promise.all([
    serviceRequest(env, fetchImpl, "community_tables", { query: queryString({ select: "id,name,created_at,updated_at", id: `in.(${ids.join(",")})` }) }),
    serviceRequest(env, fetchImpl, "table_members", { query: queryString({ select: "table_id", table_id: `in.(${ids.join(",")})` }) }),
  ]);
  if (!rowsResult.ok || !Array.isArray(rowsResult.data) || !membersResult.ok || !Array.isArray(membersResult.data)) throw new Error("table_read_failed");
  return rowsResult.data.map((row) => publicTable(row, mine.data.find((item) => item.table_id === row.id)?.role || "member", membersResult.data.filter((item) => item.table_id === row.id).length));
}

async function createTable(name, userId, env, fetchImpl) {
  const result = await serviceRequest(env, fetchImpl, "community_tables", {
    method: "POST", query: queryString({ select: "id,name,created_at,updated_at" }),
    body: [{ name: name.trim(), created_by: userId }],
  });
  const row = Array.isArray(result.data) ? result.data[0] : null;
  if (!result.ok || !row) throw new Error("table_create_failed");
  return publicTable(row, "owner", 1);
}

async function renameTable(tableId, name, userId, env, fetchImpl) {
  const role = await memberRole(tableId, userId, env, fetchImpl);
  if (!role) return null;
  if (role !== "owner" && role !== "admin") throw Object.assign(new Error(), { publicCode: "table_admin_required", statusCode: 403 });
  const query = queryString({ id: `eq.${tableId}`, select: "id,name,created_at,updated_at" });
  const result = await serviceRequest(env, fetchImpl, "community_tables", { method: "PATCH", query, body: { name: name.trim() } });
  const row = Array.isArray(result.data) ? result.data[0] : null;
  if (!result.ok || !row) throw new Error("table_update_failed");
  return publicTable(row, role, await memberCount(tableId, env, fetchImpl));
}

function rpcError(result, genericCode, { permission = "table_admin_required", conflict = "table_action_unavailable" } = {}) {
  if (result.status === 401 || result.status === 403 || result.data?.code === "42501") throw Object.assign(new Error(), { publicCode: permission, statusCode: 403 });
  if (result.status === 409 || ["23505", "23514", "22023"].includes(result.data?.code)) throw Object.assign(new Error(), { publicCode: conflict, statusCode: 409 });
  throw Object.assign(new Error(), { publicCode: genericCode, statusCode: 503 });
}

async function createInvite(tableId, userId, expiresInSeconds, env, fetchImpl) {
  const result = await serviceRequest(env, fetchImpl, "create_table_invite_for_user", {
    method: "POST", rpc: true,
    body: { p_table_id: tableId, p_actor_id: userId, p_expires_in_seconds: expiresInSeconds ?? 604800 },
  });
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!result.ok || !row || !UUID.test(row.invite_id || "") || !INVITE_TOKEN.test(row.invite_token || "") || typeof row.expires_at !== "string") rpcError(result, "table_invite_create_failed");
  return { id: row.invite_id, token: row.invite_token, expiresAt: row.expires_at };
}

async function acceptInvite(token, userId, env, fetchImpl) {
  const result = await serviceRequest(env, fetchImpl, "accept_table_invite_for_user", {
    method: "POST", rpc: true, body: { p_token: token, p_actor_id: userId },
  });
  const tableId = typeof result.data === "string" ? result.data : result.data?.accept_table_invite_for_user;
  if (!result.ok || !UUID.test(tableId || "")) rpcError(result, "table_invite_accept_failed", { permission: "table_invite_unavailable", conflict: "table_invite_unavailable" });
  return tableId;
}

async function simpleRpc(name, body, env, fetchImpl, errorCode, options) {
  const result = await serviceRequest(env, fetchImpl, name, { method: "POST", rpc: true, body });
  if (!result.ok) rpcError(result, errorCode, options);
}

async function activitySummary(tableId, userId, env, fetchImpl, now) {
  const cutoff = new Date(now() - ACTIVITY_DAYS * 86400000).toISOString().slice(0, 10);
  const query = queryString({ select: "activity_date,member_id", table_id: `eq.${tableId}`, activity_date: `gte.${cutoff}`, order: "activity_date.asc", limit: "1000" });
  const result = await serviceRequest(env, fetchImpl, "table_activity", { query });
  if (!result.ok || !Array.isArray(result.data)) throw new Error("table_activity_read_failed");
  const days = new Map();
  for (const row of result.data) {
    if (!validDate(row.activity_date) || !UUID.test(row.member_id || "")) continue;
    const day = days.get(row.activity_date) || { date: row.activity_date, memberCount: 0, showedUpByMe: false };
    day.memberCount += 1;
    if (row.member_id === userId) day.showedUpByMe = true;
    days.set(row.activity_date, day);
  }
  return [...days.values()];
}

function responseError(error) {
  const code = error.publicCode || error.message;
  if (error.statusCode === 403) return [403, { state: "rejected", errorCode: code }];
  if (error.statusCode === 409) return [409, { state: "rejected", errorCode: code }];
  if (["table_not_found", "table_invite_unavailable"].includes(code)) return [404, { state: "rejected", errorCode: code }];
  if (["table_read_failed", "table_create_failed", "table_update_failed", "table_invite_create_failed", "table_invite_accept_failed", "table_invite_revoke_failed", "table_leave_failed", "table_activity_write_failed", "table_activity_read_failed"].includes(code)) return [503, { state: "pending", errorCode: code }];
  return [503, { state: "pending", errorCode: "table_service_unavailable" }];
}

export function createTableHandler({ env = process.env, fetchImpl = globalThis.fetch, now = () => Date.now() } = {}) {
  return async function tableHandler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (!["GET", "POST", "PATCH", "DELETE"].includes(req.method)) { res.setHeader("Allow", METHODS); return json(res, 405, { state: "pending", errorCode: "method_not_allowed" }); }
    let body = {};
    if (req.method !== "GET") {
      try { body = await readBody(req); } catch (error) { return json(res, error.statusCode === 413 ? 413 : 400, { state: "rejected", errorCode: error.statusCode === 413 ? "payload_too_large" : "invalid_json" }); }
      if (!body || typeof body !== "object" || Array.isArray(body)) return json(res, 400, { state: "rejected", errorCode: "invalid_request" });
    }
    let parsed;
    try { parsed = route(req); } catch { parsed = null; }
    if (!validRoute(req.method, parsed, body)) return json(res, 400, { state: "rejected", errorCode: "invalid_request" });
    if (!configured(env, fetchImpl)) return json(res, 503, { state: "pending", configured: false, connected: false, errorCode: "table_backend_not_configured" });
    const token = authToken(req);
    if (!token) return json(res, 401, { state: "rejected", errorCode: "authentication_required" });
    let userId;
    try { userId = await authenticate(token, env, fetchImpl); }
    catch { return json(res, 503, { state: "pending", errorCode: "authentication_unavailable" }); }
    if (!userId) return json(res, 401, { state: "rejected", errorCode: "authentication_required" });

    const { path } = parsed;
    const tableId = path[0];
    try {
      if (!path.length && req.method === "GET") return json(res, 200, { state: "connected", tables: await listTables(userId, env, fetchImpl) });
      if (!path.length && req.method === "POST") return json(res, 201, { state: "connected", table: await createTable(body.name, userId, env, fetchImpl) });
      if (path[0] === "invites") {
        const joinedTableId = await acceptInvite(body.token, userId, env, fetchImpl);
        const table = await oneTable(joinedTableId, userId, env, fetchImpl);
        if (!table) throw Object.assign(new Error(), { publicCode: "table_invite_unavailable", statusCode: 404 });
        return json(res, 200, { state: "connected", table });
      }
      if (path.length === 1 && req.method === "GET") {
        const table = await oneTable(tableId, userId, env, fetchImpl);
        return table ? json(res, 200, { state: "connected", table }) : json(res, 404, { state: "rejected", errorCode: "table_not_found" });
      }
      if (path.length === 1 && req.method === "PATCH") {
        const table = await renameTable(tableId, body.name, userId, env, fetchImpl);
        return table ? json(res, 200, { state: "connected", table }) : json(res, 404, { state: "rejected", errorCode: "table_not_found" });
      }
      if (path.length === 2 && path[1] === "invites" && req.method === "POST") {
        const invite = await createInvite(tableId, userId, body.expiresInSeconds, env, fetchImpl);
        return json(res, 201, { state: "connected", invite });
      }
      if (path.length === 3 && path[1] === "invites" && req.method === "DELETE") {
        await simpleRpc("revoke_table_invite_for_user", { p_invite_id: path[2], p_actor_id: userId }, env, fetchImpl, "table_invite_revoke_failed");
        return json(res, 200, { state: "connected", revoked: true });
      }
      if (path.length === 2 && path[1] === "leave" && req.method === "POST") {
        await simpleRpc("leave_table_for_user", { p_table_id: tableId, p_actor_id: userId }, env, fetchImpl, "table_leave_failed");
        return json(res, 200, { state: "connected", left: true });
      }
      if (path.length === 2 && path[1] === "activity" && req.method === "POST") {
        await simpleRpc("record_table_showed_up", { p_table_id: tableId, p_actor_id: userId, p_activity_date: body.date }, env, fetchImpl, "table_activity_write_failed", { permission: "table_member_required", conflict: "table_activity_unavailable" });
        return json(res, 201, { state: "connected", activity: { date: body.date, signal: "showed-up" } });
      }
      if (path.length === 2 && path[1] === "activity" && req.method === "GET") {
        if (!await memberRole(tableId, userId, env, fetchImpl)) return json(res, 404, { state: "rejected", errorCode: "table_not_found" });
        return json(res, 200, { state: "connected", activity: await activitySummary(tableId, userId, env, fetchImpl, now) });
      }
      throw new Error("invalid_request");
    } catch (error) {
      if (error.publicCode === "table_admin_required" || error.publicCode === "table_member_required") return json(res, 403, { state: "rejected", errorCode: error.publicCode });
      if (error.publicCode === "table_invite_unavailable" || error.publicCode === "table_not_found") return json(res, 404, { state: "rejected", errorCode: error.publicCode });
      const [status, value] = responseError(error);
      return json(res, status, value);
    }
  };
}

export default createTableHandler();
