/**
 * Authenticated Table API client boundary.
 *
 * This client deliberately does not use Golden's anonymous recovery credential,
 * read localStorage, cache Table data, or invent a local shared Table. It only
 * sends a bearer access token from a separately authenticated session. Until an
 * authenticated Table service is connected, the API reports that it is
 * unavailable and this repository returns that state to its caller.
 */

export class TableRepositoryError extends Error {
  constructor(message, { status = 0, code = "table_service_unavailable", state = "pending" } = {}) {
    super(message);
    this.name = "TableRepositoryError";
    this.status = status;
    this.code = code;
    this.state = state;
  }
}

function requiredId(value, label) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${label} is required.`);
  return value.trim();
}

function requiredAccessToken(session) {
  if (!session?.authenticated || typeof session.accessToken !== "string" || !session.accessToken.trim()) {
    throw new TableRepositoryError("An authenticated account is required to use a Table.", {
      status: 401,
      code: "authentication_required",
    });
  }
  return session.accessToken.trim();
}

function safeBody(body) {
  if (body == null) return undefined;
  return JSON.stringify(body);
}

export function createTableRepository({
  fetchImpl = globalThis.fetch,
  getSession,
  basePath = "/api/table",
} = {}) {
  if (typeof fetchImpl !== "function") throw new TypeError("A Fetch implementation is required.");
  if (typeof getSession !== "function") throw new TypeError("An authenticated session provider is required.");

  async function request(path = "", { method = "GET", body } = {}) {
    const session = await getSession();
    const accessToken = requiredAccessToken(session);
    let response;
    try {
      response = await fetchImpl(`${basePath}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(body == null ? {} : { "Content-Type": "application/json" }),
        },
        ...(body == null ? {} : { body: safeBody(body) }),
        cache: "no-store",
      });
    } catch {
      throw new TableRepositoryError("The Table service could not be reached.");
    }

    let result = {};
    try { result = await response.json(); } catch {}
    if (!response.ok) {
      throw new TableRepositoryError(
        result.message || "The Table service is unavailable.",
        { status: response.status, code: result.errorCode || "table_service_unavailable", state: result.state || "pending" },
      );
    }
    return result;
  }

  const tablePath = (tableId) => `/${encodeURIComponent(requiredId(tableId, "Table id"))}`;
  return Object.freeze({
    list: () => request(),
    get: (tableId) => request(tablePath(tableId)),
    create: (name) => request("", { method: "POST", body: { name } }),
    rename: (tableId, name) => request(tablePath(tableId), { method: "PATCH", body: { name } }),
    createInvite: (tableId, expiresInSeconds) => request(`${tablePath(tableId)}/invites`, {
      method: "POST", body: expiresInSeconds == null ? {} : { expiresInSeconds },
    }),
    acceptInvite: (token) => request("/invites/accept", { method: "POST", body: { token } }),
    revokeInvite: (tableId, inviteId) => request(`${tablePath(tableId)}/invites/${encodeURIComponent(requiredId(inviteId, "Invite id"))}`, { method: "DELETE" }),
    leave: (tableId) => request(`${tablePath(tableId)}/leave`, { method: "POST", body: {} }),
    recordActivity: (tableId, date) => request(`${tablePath(tableId)}/activity`, {
      method: "POST", body: { date, signal: "showed-up" },
    }),
    getActivity: (tableId) => request(`${tablePath(tableId)}/activity`),
  });
}
