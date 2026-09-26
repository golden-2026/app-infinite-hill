import { createHash, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const MIGRATIONS = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS anonymous_accounts (
        user_id TEXT PRIMARY KEY,
        credential_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS account_state (
        user_id TEXT PRIMARY KEY,
        schema_version INTEGER NOT NULL,
        algorithm TEXT NOT NULL,
        iv TEXT NOT NULL,
        ciphertext TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES anonymous_accounts(user_id)
      )`,
    ],
  },
];

let clientPromise;
let migrationPromise;
let dbMode;

function usesNetlifyBlobs() {
  return process.env.GOLDEN_STORAGE_BACKEND === "netlify-blobs" && !process.env.TURSO_DATABASE_URL;
}

async function netlifyStore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore("golden-private-state");
}

async function readBlobAccount(userId) {
  const store = await netlifyStore();
  return store.get(`accounts/${userId}`, { type: "json" });
}

export class StateAuthError extends Error {
  constructor() {
    super("State credential rejected");
    this.name = "StateAuthError";
  }
}

export function hashSyncCredential(credential) {
  return createHash("sha256").update(credential, "utf8").digest("hex");
}

function secureHashMatch(expectedHash, presentedCredential) {
  const expected = Buffer.from(expectedHash, "hex");
  const actual = Buffer.from(hashSyncCredential(presentedCredential), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function databaseClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const libsqlPackage = "@libsql/" + "client";
      const { createClient } = await import(libsqlPackage);
      const configuredUrl = process.env.TURSO_DATABASE_URL;
      const url = configuredUrl || `file:${resolve(process.cwd(), ".data/golden.db")}`;
      const hosted = !url.startsWith("file:");
      if (!hosted) {
        const path = url.slice("file:".length);
        mkdirSync(dirname(resolve(path)), { recursive: true });
      }
      dbMode = hosted ? "turso" : "local-sqlite";
      const authToken = hosted ? process.env.TURSO_AUTH_TOKEN : undefined;
      return createClient({ url, ...(authToken ? { authToken } : {}) });
    })();
  }
  return clientPromise;
}

export async function initDatabase() {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const client = await databaseClient();
      await client.execute(`CREATE TABLE IF NOT EXISTS platform_schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TEXT NOT NULL
      )`);
      for (const migration of MIGRATIONS) {
        const result = await client.execute({
          sql: "SELECT version FROM platform_schema_migrations WHERE version = ?",
          args: [migration.version],
        });
        if (result.rows.length) continue;
        for (const statement of migration.statements) await client.execute(statement);
        await client.execute({
          sql: "INSERT INTO platform_schema_migrations (version, applied_at) VALUES (?, ?)",
          args: [migration.version, new Date().toISOString()],
        });
      }
      return { client, mode: dbMode };
    })();
  }
  try {
    return await migrationPromise;
  } catch (error) {
    migrationPromise = undefined;
    throw error;
  }
}

export async function getDatabaseMode() {
  if (usesNetlifyBlobs()) return "netlify-blobs";
  if (!clientPromise) {
    const url = process.env.TURSO_DATABASE_URL || "";
    return url && !url.startsWith("file:") ? "turso" : "local-sqlite";
  }
  await clientPromise;
  return dbMode;
}

async function getAccount(client, userId) {
  const result = await client.execute({
    sql: "SELECT credential_hash, created_at FROM anonymous_accounts WHERE user_id = ?",
    args: [userId],
  });
  return result.rows[0] || null;
}

function assertCredential(account, credential) {
  if (!account || !secureHashMatch(String(account.credential_hash), credential)) throw new StateAuthError();
}

export async function readEncryptedState(userId, credential) {
  if (usesNetlifyBlobs()) {
    const account = await readBlobAccount(userId);
    if (!account) return null;
    if (!secureHashMatch(String(account.credentialHash), credential)) throw new StateAuthError();
    return {
      snapshot: account.snapshot || null,
      createdAt: String(account.createdAt),
      updatedAt: account.updatedAt ? String(account.updatedAt) : null,
    };
  }
  const { client } = await initDatabase();
  const account = await getAccount(client, userId);
  if (!account) return null;
  assertCredential(account, credential);
  const result = await client.execute({
    sql: "SELECT schema_version, algorithm, iv, ciphertext, created_at, updated_at FROM account_state WHERE user_id = ?",
    args: [userId],
  });
  const row = result.rows[0];
  if (!row) return { snapshot: null, createdAt: account.created_at, updatedAt: null };
  return {
    snapshot: {
      schemaVersion: Number(row.schema_version),
      algorithm: String(row.algorithm),
      iv: String(row.iv),
      ciphertext: String(row.ciphertext),
    },
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function writeEncryptedState({ userId, credential, schemaVersion, algorithm, iv, ciphertext }) {
  if (usesNetlifyBlobs()) {
    const store = await netlifyStore();
    const existing = await readBlobAccount(userId);
    const credentialHash = hashSyncCredential(credential);
    if (existing && !secureHashMatch(String(existing.credentialHash), credential)) throw new StateAuthError();
    const now = new Date().toISOString();
    const createdAt = existing?.createdAt || now;
    await store.setJSON(`accounts/${userId}`, {
      credentialHash,
      createdAt,
      updatedAt: now,
      snapshot: { schemaVersion, algorithm, iv, ciphertext },
    });
    return { createdAt, updatedAt: now };
  }
  const { client } = await initDatabase();
  const credentialHash = hashSyncCredential(credential);
  let account = await getAccount(client, userId);
  if (!account) {
    try {
      await client.execute({
        sql: "INSERT INTO anonymous_accounts (user_id, credential_hash, created_at) VALUES (?, ?, ?)",
        args: [userId, credentialHash, new Date().toISOString()],
      });
    } catch {
      // A concurrent first write may have created the account; re-read and verify it below.
    }
    account = await getAccount(client, userId);
  }
  assertCredential(account, credential);
  const now = new Date().toISOString();
  await client.execute({
    sql: `INSERT INTO account_state (user_id, schema_version, algorithm, iv, ciphertext, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET schema_version = excluded.schema_version, algorithm = excluded.algorithm,
        iv = excluded.iv, ciphertext = excluded.ciphertext, updated_at = excluded.updated_at`,
    args: [userId, schemaVersion, algorithm, iv, ciphertext, now, now],
  });
  return { createdAt: String(account.created_at), updatedAt: now };
}

export async function closeDatabaseForTests() {
  if (!clientPromise) return;
  const client = await clientPromise;
  client.close();
  clientPromise = undefined;
  migrationPromise = undefined;
  dbMode = undefined;
}
