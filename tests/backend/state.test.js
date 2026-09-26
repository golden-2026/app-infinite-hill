import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tempDir = mkdtempSync(join(tmpdir(), "golden-backend-tests-"));
const databasePath = join(tempDir, "backend.sqlite");
process.env.TURSO_DATABASE_URL = `file:${databasePath}`;
process.env.TURSO_AUTH_TOKEN = "";

const [{ default: stateHandler }, db, platform] = await Promise.all([
  import("../../api/state.js"),
  import("../../api/_db.js"),
  import("../../src/platform/index.js"),
]);

const storage = new Map();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem(key) { return storage.get(key) ?? null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); },
  },
});

function response() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(body) { this.body = body; },
  };
}

async function callApi(path, { method = "GET", headers = {}, body } = {}) {
  const url = new URL(path, "http://golden.test");
  const req = { method, url: `${url.pathname}${url.search}`, headers };
  if (body !== undefined) req.body = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  const res = response();
  await stateHandler(req, res);
  return {
    status: res.statusCode,
    headers: res.headers,
    body: JSON.parse(res.body || "{}"),
  };
}

const account = platform.getLocalAccount();
const privateMarker = "my-faith-path-must-remain-private-9d38";
const userId = account.userId;
const auth = { Authorization: `Bearer ${account.recoveryCredential}` };
let savedEnvelope;
let persistedEnvelope;

before(async () => {
  const initialized = await db.initDatabase();
  assert.equal(initialized.mode, "local-sqlite");
});

after(async () => {
  await db.closeDatabaseForTests();
  rmSync(tempDir, { recursive: true, force: true });
});

test("initializes the isolated SQLite schema and records its migration", async () => {
  const { client } = await db.initDatabase();
  const migration = await client.execute("SELECT version FROM platform_schema_migrations ORDER BY version");
  const accounts = await client.execute("PRAGMA table_info(anonymous_accounts)");
  const states = await client.execute("PRAGMA table_info(account_state)");
  assert.deepEqual(migration.rows.map((row) => Number(row.version)), [1]);
  assert.ok(accounts.rows.some((row) => row.name === "credential_hash"));
  assert.ok(states.rows.some((row) => row.name === "ciphertext"));
});

test("requires a recovery credential and reports when no remote state exists", async () => {
  const noCredential = await callApi(`/api/state?userId=${userId}`);
  assert.equal(noCredential.status, 401);
  assert.equal(noCredential.body.errorCode, "sync_credential_required");

  const malformedCredential = await callApi(`/api/state?userId=${userId}`, {
    headers: { Authorization: "Bearer short" },
  });
  assert.equal(malformedCredential.status, 401);

  const wrongCredential = await callApi(`/api/state?userId=${userId}`, {
    headers: { Authorization: `Bearer ${"f".repeat(64)}` },
  });
  assert.equal(wrongCredential.status, 404);
  assert.equal(wrongCredential.body.errorCode, "remote_state_not_initialized");
});

test("writes and reads a real encrypted snapshot envelope", async () => {
  const snapshot = platform.createLocalSnapshot({
    includeRecoveryCredential: true,
    appState: { version: 1, state: { privateFaithPath: privateMarker } },
  });
  savedEnvelope = await platform.encryptSnapshot(snapshot, account.recoveryCredential);
  assert.notEqual(Buffer.from(savedEnvelope.ciphertext, "base64").toString("utf8").includes(privateMarker), true);

  const put = await callApi("/api/state", {
    method: "PUT",
    headers: auth,
    body: { userId, ...savedEnvelope },
  });
  assert.equal(put.status, 200, JSON.stringify(put.body));
  assert.equal(put.body.state, "delivered");
  assert.ok(put.body.createdAt);
  assert.ok(put.body.updatedAt);

  const get = await callApi(`/api/state?userId=${encodeURIComponent(userId)}`, { headers: auth });
  assert.equal(get.status, 200, JSON.stringify(get.body));
  assert.equal(get.body.state, "connected");
  assert.deepEqual(get.body.snapshot, savedEnvelope);
  const restored = await platform.decryptSnapshot(get.body.snapshot, account.recoveryCredential);
  assert.equal(restored.appState.state.privateFaithPath, privateMarker);
  assert.equal("recoveryCredential" in restored, false);

  const wrongCredential = await callApi(`/api/state?userId=${userId}`, {
    headers: { Authorization: `Bearer ${"f".repeat(64)}` },
  });
  assert.equal(wrongCredential.status, 401);
  assert.equal(wrongCredential.body.errorCode, "sync_credential_rejected");
});

test("updates an existing envelope while retaining account creation time", async () => {
  const first = await db.readEncryptedState(userId, account.recoveryCredential);
  const nextSnapshot = platform.createLocalSnapshot({
    appState: { version: 1, state: { privateFaithPath: `${privateMarker}-updated` } },
  });
  const nextEnvelope = await platform.encryptSnapshot(nextSnapshot, account.recoveryCredential);
  persistedEnvelope = nextEnvelope;
  const put = await callApi("/api/state", {
    method: "PUT",
    headers: auth,
    body: { userId, ...nextEnvelope },
  });
  assert.equal(put.status, 200);
  const next = await db.readEncryptedState(userId, account.recoveryCredential);
  assert.equal(next.createdAt, first.createdAt);
  assert.deepEqual(next.snapshot, nextEnvelope);
  assert.ok(Date.parse(next.updatedAt) >= Date.parse(first.updatedAt));
});

test("rejects invalid user IDs and malformed encrypted envelopes", async () => {
  const invalidId = await callApi("/api/state", {
    method: "PUT",
    headers: auth,
    body: { userId: "not-an-anonymous-id", schemaVersion: 1, algorithm: "AES-GCM", iv: "AAAAAAAAAAAAAAAA", ciphertext: "AAAAAAAAAAAAAAAAAAAAAA==" },
  });
  assert.equal(invalidId.status, 400);
  assert.equal(invalidId.body.errorCode, "invalid_user_id");

  const invalidEnvelope = await callApi("/api/state", {
    method: "PUT",
    headers: auth,
    body: { userId, schemaVersion: 1, algorithm: "AES-GCM", iv: "bad", ciphertext: "not-base64" },
  });
  assert.equal(invalidEnvelope.status, 400);
  assert.equal(invalidEnvelope.body.errorCode, "invalid_encrypted_snapshot");

  const malformedJson = await callApi("/api/state", { method: "PUT", headers: auth, body: "{" });
  assert.equal(malformedJson.status, 400);
  assert.equal(malformedJson.body.errorCode, "invalid_json");
});

test("enforces encrypted snapshot and request size limits", async () => {
  const overSnapshotLimit = await callApi("/api/state", {
    method: "PUT",
    headers: auth,
    body: {
      userId,
      schemaVersion: 1,
      algorithm: "AES-GCM",
      iv: Buffer.alloc(12).toString("base64"),
      ciphertext: Buffer.alloc(128 * 1024 + 17).toString("base64"),
    },
  });
  assert.equal(overSnapshotLimit.status, 400);
  assert.equal(overSnapshotLimit.body.errorCode, "invalid_encrypted_snapshot");

  const overRequestLimit = await callApi("/api/state", {
    method: "PUT",
    headers: auth,
    body: `{"userId":"${userId}","padding":"${"x".repeat(200 * 1024)}"}`,
  });
  assert.equal(overRequestLimit.status, 413);
  assert.equal(overRequestLimit.body.errorCode, "payload_too_large");
});

test("persists no recovery credential or faith-path plaintext", async () => {
  const { client } = await db.initDatabase();
  const stored = await client.execute({
    sql: `SELECT credential_hash, schema_version, algorithm, iv, ciphertext
      FROM account_state JOIN anonymous_accounts USING (user_id) WHERE user_id = ?`,
    args: [userId],
  });
  assert.equal(stored.rows.length, 1);
  assert.notEqual(String(stored.rows[0].credential_hash), account.recoveryCredential);
  assert.equal(JSON.stringify(stored.rows).includes(privateMarker), false);
  assert.equal(String(stored.rows[0].ciphertext), persistedEnvelope.ciphertext);

  const rawDb = readFileSync(databasePath);
  assert.equal(rawDb.includes(Buffer.from(account.recoveryCredential)), false);
  assert.equal(rawDb.includes(Buffer.from(privateMarker)), false);
});

test("only permits GET and PUT", async () => {
  const result = await callApi("/api/state", { method: "DELETE" });
  assert.equal(result.status, 405);
  assert.equal(result.headers.Allow, "GET, PUT");
});
