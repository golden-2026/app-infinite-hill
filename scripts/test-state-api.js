import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tempDir = mkdtempSync(join(tmpdir(), "golden-state-test-"));
const databasePath = join(tempDir, "isolated.db");
process.env.TURSO_DATABASE_URL = `file:${databasePath}`;
process.env.TURSO_AUTH_TOKEN = "";

const { default: handler } = await import("../api/state.js");
const db = await import("../api/_db.js");
const platform = await import("../src/platform/index.js");

const values = new Map();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, String(value)); },
  },
});

function apiResponse() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(body) { this.body = body; },
  };
}

async function callApi(input, options = {}) {
  const url = new URL(String(input), "http://golden.test");
  const req = {
    method: options.method || "GET",
    url: `${url.pathname}${url.search}`,
    headers: options.headers || {},
  };
  if (options.body) req.body = typeof options.body === "string" ? JSON.parse(options.body) : options.body;
  const res = apiResponse();
  await handler(req, res);
  const body = JSON.parse(res.body || "{}");
  return { status: res.statusCode, statusCode: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 300, body, headers: res.headers, json: async () => body };
}

try {
  const account = platform.getLocalAccount();
  assert.equal(platform.getLocalAccount().userId, account.userId);
  assert.equal(platform.getLocalSession().authenticated, false);
  assert.equal(platform.getPlatformCapabilities().auth.state, "device-local");
  assert.equal(platform.getPlatformCapabilities().payments.state, "pending");
  assert.equal("recoveryCredential" in platform.createLocalSnapshot(), false);
  assert.equal("recoveryCredential" in platform.createLocalSnapshot({ includeRecoveryCredential: true }), true);
  const snapshot = platform.createLocalSnapshot({
    includeRecoveryCredential: true,
    appState: { version: 1, state: { privateMarker: "faith-and-practice-state" } },
  });
  const saved = await platform.saveRemoteSnapshot({
    snapshot,
    fetcher: callApi,
  });
  assert.equal(saved.state, "delivered", JSON.stringify(saved));
  assert.equal(saved.connected, true);
  assert.equal(saved.delivered, true);

  const fetched = await platform.fetchRemoteSnapshot({ fetcher: callApi });
  assert.equal(fetched.state, "connected");
  assert.equal(fetched.snapshot.account.userId, account.userId);
  assert.equal(fetched.snapshot.appState.state.privateMarker, "faith-and-practice-state");
  assert.equal("recoveryCredential" in fetched.snapshot, false);

  const publicIdOnly = await callApi(`/api/state?userId=${encodeURIComponent(account.userId)}`);
  assert.equal(publicIdOnly.status, 401);
  const wrongCredential = await callApi(`/api/state?userId=${encodeURIComponent(account.userId)}`, {
    headers: { Authorization: `Bearer ${"f".repeat(64)}` },
  });
  assert.equal(wrongCredential.status, 401);
  const tooLarge = await callApi("/api/state", {
    method: "PUT",
    headers: { Authorization: `Bearer ${account.recoveryCredential}` },
    body: { userId: account.userId, schemaVersion: 1, algorithm: "AES-GCM", iv: Buffer.alloc(12).toString("base64"), ciphertext: Buffer.alloc(200 * 1024).toString("base64") },
  });
  assert.equal(tooLarge.status, 413);

  const { client, mode } = await db.initDatabase();
  assert.equal(mode, "local-sqlite");
  const stored = await client.execute({
    sql: "SELECT credential_hash, ciphertext FROM account_state JOIN anonymous_accounts USING (user_id) WHERE user_id = ?",
    args: [account.userId],
  });
  assert.equal(stored.rows.length, 1);
  assert.notEqual(String(stored.rows[0].credential_hash), account.recoveryCredential);
  assert.equal(String(stored.rows[0].ciphertext).includes("faith-and-practice-state"), false);

  await db.closeDatabaseForTests();
  const rawDb = readFileSync(databasePath);
  assert.equal(rawDb.includes(Buffer.from(account.recoveryCredential)), false);
  assert.equal(rawDb.includes(Buffer.from("faith-and-practice-state")), false);
  console.log("State API tests passed: isolated SQLite, encrypted round-trip, credential rejection, and payload limit.");
} finally {
  await db.closeDatabaseForTests();
  rmSync(tempDir, { recursive: true, force: true });
}
