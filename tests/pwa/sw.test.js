import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const resource = (status = 200, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  type: "basic",
  headers: new Headers(headers),
  clone() { return resource(status, headers); },
});

async function makeWorker(fetchImpl = async () => resource()) {
  const listeners = new Map();
  const entries = new Map();
  const deleted = [];
  const cacheNames = new Set(["golden-shell-v1", "another-app-cache"]);
  const keyOf = (request) => typeof request === "string" ? request : new URL(request.url).pathname;
  const caches = {
    async open(name) {
      cacheNames.add(name);
      return {
        async addAll(urls) { for (const url of urls) entries.set(url, resource()); },
        async match(request) { return entries.get(keyOf(request)); },
        async put(request, response) { entries.set(keyOf(request), response); },
      };
    },
    async match(request) { return entries.get(keyOf(request)); },
    async keys() { return [...cacheNames]; },
    async delete(name) { deleted.push(name); cacheNames.delete(name); return true; },
  };
  const self = {
    location: { origin: "https://golden.test" },
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
    addEventListener(type, listener) { listeners.set(type, listener); },
  };
  vm.runInNewContext(await readFile(path.join(root, "public/sw.js"), "utf8"), {
    self, caches, fetch: fetchImpl, URL, Response: { error: () => resource(503) },
    Promise, console,
  });
  return { listeners, entries, deleted, cacheNames, caches };
}

async function dispatchLifecycle(worker, type) {
  const pending = [];
  worker.listeners.get(type)({ waitUntil(promise) { pending.push(promise); } });
  await Promise.all(pending);
}

async function dispatchFetch(worker, request) {
  const pending = [];
  let responsePromise;
  worker.listeners.get("fetch")({
    request,
    respondWith(promise) { responsePromise = Promise.resolve(promise); },
    waitUntil(promise) { pending.push(promise); },
  });
  const response = responsePromise && await responsePromise;
  await Promise.all(pending);
  return { response, intercepted: Boolean(responsePromise) };
}

test("manifest points to a present, dimensionally valid icon", async () => {
  const manifest = JSON.parse(await readFile(path.join(root, "public/manifest.webmanifest"), "utf8"));
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.icons.length > 0);

  for (const icon of manifest.icons) {
    assert.equal(icon.type, "image/png");
    const image = await readFile(path.join(root, "public", icon.src.replace(/^\//, "")));
    assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(`${image.readUInt32BE(16)}x${image.readUInt32BE(20)}`, icon.sizes);
  }
});

test("worker precaches the app and marketing shell and removes only Golden caches", async () => {
  const worker = await makeWorker();
  await dispatchLifecycle(worker, "install");
  assert.deepEqual([...worker.entries.keys()].sort(), [
    "/", "/favicon.png", "/icon-192.png", "/icon-512.png", "/manifest.webmanifest", "/site.html",
  ]);

  await dispatchLifecycle(worker, "activate");
  assert.ok(worker.deleted.includes("golden-shell-v1"));
  assert.ok(worker.deleted.every((name) => name !== "another-app-cache"));
});

test("offline navigation falls back to the cached app shell", async () => {
  const worker = await makeWorker(async () => { throw new Error("offline"); });
  await dispatchLifecycle(worker, "install");
  const result = await dispatchFetch(worker, {
    method: "GET", mode: "navigate", url: "https://golden.test/a/deep/link",
  });
  assert.equal(result.intercepted, true);
  assert.ok(result.response);
});

test("API and query-string responses are never intercepted or cached", async () => {
  let networkCalls = 0;
  const worker = await makeWorker(async () => { networkCalls += 1; return resource(); });
  await dispatchLifecycle(worker, "install");
  const api = await dispatchFetch(worker, {
    method: "GET", mode: "cors", url: "https://golden.test/api/state?userId=private",
  });
  const queriedAsset = await dispatchFetch(worker, {
    method: "GET", mode: "cors", url: "https://golden.test/assets/app.js?token=secret",
  });
  assert.equal(api.intercepted, false);
  assert.equal(queriedAsset.intercepted, false);
  assert.equal(networkCalls, 0);
  assert.equal(worker.entries.has("/api/state"), false);
});

test("public build assets cache, while no-store and non-public paths do not", async () => {
  const worker = await makeWorker(async (request) =>
    request.url.endsWith("private.js") ? resource(200, { "cache-control": "private, no-store" }) : resource(),
  );
  const publicAsset = await dispatchFetch(worker, {
    method: "GET", mode: "cors", url: "https://golden.test/assets/app.js",
  });
  const privateResponse = await dispatchFetch(worker, {
    method: "GET", mode: "cors", url: "https://golden.test/assets/private.js",
  });
  const arbitraryJson = await dispatchFetch(worker, {
    method: "GET", mode: "cors", url: "https://golden.test/profile.json",
  });
  assert.ok(publicAsset.response);
  assert.equal(worker.entries.has("/assets/app.js"), true);
  assert.ok(privateResponse.response);
  assert.equal(worker.entries.has("/assets/private.js"), false);
  assert.equal(arbitraryJson.intercepted, false);
});
