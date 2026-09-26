import { isLocalUserId, isRecoveryCredential, STATE_SCHEMA_VERSION, SNAPSHOT_MAX_BYTES } from "../src/platform/schema.js";
import { readEncryptedState, StateAuthError, writeEncryptedState } from "./_db.js";

const MAX_REQUEST_BYTES = 192 * 1024;
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

function json(res, statusCode, value) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.end(JSON.stringify(value));
}

function credentialFrom(req) {
  const value = req.headers?.authorization || req.headers?.Authorization || "";
  const match = /^Bearer ([a-f0-9]{64})$/.exec(value);
  return match && isRecoveryCredential(match[1]) ? match[1] : null;
}

function requestedUserId(req) {
  if (req.query?.userId) return String(req.query.userId);
  const url = new URL(req.url || "/", "http://localhost");
  return url.searchParams.get("userId");
}

async function requestBody(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    if (Buffer.byteLength(JSON.stringify(req.body)) > MAX_REQUEST_BYTES) throw Object.assign(new Error("too_large"), { statusCode: 413 });
    return req.body;
  }
  if (Buffer.isBuffer(req.body)) {
    if (req.body.byteLength > MAX_REQUEST_BYTES) throw Object.assign(new Error("too_large"), { statusCode: 413 });
    return JSON.parse(req.body.toString("utf8") || "{}");
  }
  if (typeof req.body === "string") {
    if (Buffer.byteLength(req.body) > MAX_REQUEST_BYTES) throw Object.assign(new Error("too_large"), { statusCode: 413 });
    return JSON.parse(req.body || "{}");
  }
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > MAX_REQUEST_BYTES) throw Object.assign(new Error("too_large"), { statusCode: 413 });
  }
  return JSON.parse(raw || "{}");
}

function validEncryptedEnvelope(body) {
  if (!body || body.schemaVersion !== STATE_SCHEMA_VERSION || body.algorithm !== "AES-GCM") return false;
  if (typeof body.iv !== "string" || !BASE64_PATTERN.test(body.iv) || Buffer.from(body.iv, "base64").byteLength !== 12) return false;
  if (typeof body.ciphertext !== "string" || !BASE64_PATTERN.test(body.ciphertext)) return false;
  const size = Buffer.from(body.ciphertext, "base64").byteLength;
  return size >= 16 && size <= SNAPSHOT_MAX_BYTES + 16 && size <= MAX_REQUEST_BYTES;
}

export default async function stateHandler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET" && req.method !== "PUT") {
    res.setHeader("Allow", "GET, PUT");
    return json(res, 405, { state: "pending", errorCode: "method_not_allowed" });
  }

  const userId = req.method === "GET" ? requestedUserId(req) : null;
  let body;
  try {
    if (req.method === "PUT") body = await requestBody(req);
  } catch (error) {
    return json(res, error.statusCode || 400, { state: "pending", errorCode: error.statusCode === 413 ? "payload_too_large" : "invalid_json" });
  }
  const targetUserId = userId || body?.userId;
  const credential = credentialFrom(req);
  if (!isLocalUserId(targetUserId)) return json(res, 400, { state: "pending", errorCode: "invalid_user_id" });
  if (!credential) return json(res, 401, { state: "pending", errorCode: "sync_credential_required" });
  if (req.method === "PUT" && !validEncryptedEnvelope(body)) return json(res, 400, { state: "pending", errorCode: "invalid_encrypted_snapshot" });

  try {
    if (req.method === "GET") {
      const result = await readEncryptedState(targetUserId, credential);
      if (!result) return json(res, 404, { state: "pending", errorCode: "remote_state_not_initialized" });
      return json(res, 200, { state: "connected", configured: true, connected: true, snapshot: result.snapshot, createdAt: result.createdAt, updatedAt: result.updatedAt });
    }
    const result = await writeEncryptedState({ userId: targetUserId, credential, schemaVersion: body.schemaVersion, algorithm: body.algorithm, iv: body.iv, ciphertext: body.ciphertext });
    return json(res, 200, { state: "delivered", configured: true, connected: true, delivered: true, createdAt: result.createdAt, updatedAt: result.updatedAt });
  } catch (error) {
    if (error instanceof StateAuthError) return json(res, 401, { state: "pending", errorCode: "sync_credential_rejected" });
    return json(res, 503, { state: "pending", errorCode: "state_service_unavailable" });
  }
}
