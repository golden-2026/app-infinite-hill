import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import wellbeing, { THRESHOLD, cleanScore, resetWellbeingLimit, useWellbeingStore } from "../../api/wellbeing.js";
import { handler } from "../../netlify/functions/wellbeing.js";

const NOW = new Date("2026-10-07T16:00:00Z");
function response() {
  return { headers: {}, setHeader(n, v) { this.headers[n] = v; }, end(b) { this.body = b; } };
}
async function call({ method = "POST", body, now = NOW, contentType = "application/json", headers = {} } = {}) {
  const res = response();
  const req = { method, url: "/api/wellbeing", headers: { "content-type": contentType, ...headers }, ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }) };
  await wellbeing(req, res, { now });
  return { status: res.statusCode, body: res.body ? JSON.parse(res.body) : null, headers: res.headers };
}
const post = (o) => call({ body: o });
const read = () => call({ method: "GET" });
const stored = new Map();
const mapStore = { get: async (k) => stored.get(k) ?? null, bump: async (k, fn) => { stored.set(k, fn(stored.get(k) ?? null)); } };

beforeEach(() => { stored.clear(); useWellbeingStore(mapStore); resetWellbeingLimit(); });

test("an answer becomes a count and a sum per door and bucket; no row, no date, nothing else", async () => {
  assert.equal((await post({ door: "HINDUISM", bucket: "1", score: 44 })).status, 204);
  assert.equal((await post({ door: "HINDUISM", bucket: "1", score: 60 })).status, 204);
  assert.equal((await post({ door: "HINDUISM", bucket: "21", score: 72 })).status, 204);
  assert.equal((await post({ door: "ISLAM", bucket: "100+", score: 0 })).status, 204);
  assert.deepEqual(Object.fromEntries(stored), {
    "wellbeing/HINDUISM/1": { n: 2, sum: 104 },
    "wellbeing/HINDUISM/21": { n: 1, sum: 72 },
    "wellbeing/ISLAM/100+": { n: 1, sum: 0 },
  });
  // no raw answers anywhere: two answers of 44 and 60 leave only "2" and "104"
  const flat = JSON.stringify([...stored]);
  assert.doesNotMatch(flat, /2026|T\d\d:|Mozilla|dev_|ip|agent/i);
  assert.ok(!flat.includes("44") && !flat.includes("60"));
});

test("only the three fields, each one of the allowed values; nothing with an id, a date or an answer gets in", async () => {
  const ok = { door: "JUDAISM", bucket: "50", score: 56 };
  for (const extra of [{ id: "dev_1" }, { date: "2026-10-07" }, { answers: [3, 2, 4, 1, 4] }, { day: 50 }, { cohortDate: "2026-09-01" }]) {
    assert.equal((await post({ ...extra, ...ok })).status, 400, JSON.stringify(extra));
  }
  assert.equal((await post({ door: "ATHEISM", bucket: "50", score: 56 })).status, 400);
  assert.equal((await post({ door: "JUDAISM", bucket: "7", score: 56 })).status, 400);
  assert.equal((await post({ door: "JUDAISM", bucket: 50, score: 56 })).status, 400);
  assert.equal((await post({ ...ok, score: 57 })).status, 400); // WHO-5 scores are multiples of 4
  assert.equal((await post({ ...ok, score: 104 })).status, 400);
  assert.equal((await post({ ...ok, score: -4 })).status, 400);
  assert.equal((await post({ ...ok, score: "56" })).status, 400);
  assert.equal((await post({ door: "JUDAISM", bucket: "50" })).status, 400);
  assert.equal((await call({ body: ok, contentType: "text/plain" })).status, 415);
  assert.equal((await call({ body: "x".repeat(300) })).status, 413);
  assert.equal((await call({ body: "[1]" })).status, 400);
  assert.equal((await call({ method: "PUT", body: ok })).status, 405);
  assert.equal(stored.size, 0);
  assert.deepEqual(cleanScore({ door: "SIKHISM", bucket: "100", score: 100 }), { door: "SIKHISM", bucket: "100", score: 100 });
  assert.equal(cleanScore(null), null);
});

test(`the aggregate is public but a door×bucket shows only once ${THRESHOLD} people have answered`, async () => {
  for (let i = 0; i < THRESHOLD - 1; i++) await post({ door: "BUDDHISM", bucket: "21", score: 60 });
  let r = await read();
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { threshold: THRESHOLD, doors: [], all: [] });
  await post({ door: "BUDDHISM", bucket: "21", score: 80 });
  r = await read();
  assert.deepEqual(r.body.doors, [{ door: "BUDDHISM", bucket: "21", n: THRESHOLD, mean: 60.8 }]);
  assert.deepEqual(r.body.all, [{ bucket: "21", n: THRESHOLD, mean: 60.8 }]);
  // across doors a bucket can reach the line while no single door has: only "all" lists it
  for (let i = 0; i < 13; i++) await post({ door: "CATHOLIC", bucket: "1", score: 40 });
  for (let i = 0; i < 12; i++) assert.equal((await post({ door: "CHRISTIANITY", bucket: "1", score: 52 })).status, 204);
  r = await read();
  assert.deepEqual(r.body.doors.map((d) => d.bucket), ["21"]);
  assert.deepEqual(r.body.all, [{ bucket: "1", n: 25, mean: 45.8 }, { bucket: "21", n: THRESHOLD, mean: 60.8 }]);
  assert.equal(r.headers["Cache-Control"], "no-store");
  // nothing per person ever comes back
  assert.doesNotMatch(JSON.stringify(r.body), /date|id|answers|rows/i);
});

test("the IP address and user agent are never read", async () => {
  const headers = new Proxy({ "content-type": "application/json" }, {
    get(target, name) {
      if (/ip|forwarded|agent|client/i.test(String(name))) throw new Error(`read ${String(name)}`);
      return target[name];
    },
  });
  const res = response();
  await wellbeing({ method: "POST", url: "/api/wellbeing", headers, body: JSON.stringify({ door: "SPIRITUAL", bucket: "1", score: 48 }) }, res, { now: NOW });
  assert.equal(res.statusCode, 204);
});

test("a flood is slowed down, and nothing is logged on the way", async () => {
  const seen = [];
  const orig = { log: console.log, info: console.info, warn: console.warn, error: console.error };
  for (const k of Object.keys(orig)) console[k] = (...a) => seen.push(a);
  try {
    let last;
    for (let i = 0; i < 601; i++) last = await post({ door: "SPIRITUAL", bucket: "1", score: 48 });
    assert.equal(last.status, 429);
    await post({ door: "SPIRITUAL", bucket: "1", score: 49 }); // refused, quietly
  } finally {
    Object.assign(console, orig);
  }
  assert.deepEqual(seen, []);
});

test("the Netlify function answers through the adapter (in memory without Blobs)", async () => {
  const r = await handler({ httpMethod: "POST", rawUrl: "https://example.test/api/wellbeing", headers: { "content-type": "application/json" }, body: JSON.stringify({ door: "ISLAM", bucket: "1", score: 52 }) });
  assert.equal(r.statusCode, 204);
  const bad = await handler({ httpMethod: "POST", rawUrl: "https://example.test/api/wellbeing", headers: { "content-type": "application/json" }, body: JSON.stringify({ door: "ISLAM", bucket: "1", score: 52, id: "x" }) });
  assert.equal(bad.statusCode, 400);
  const agg = await handler({ httpMethod: "GET", rawUrl: "https://example.test/api/wellbeing", headers: {} });
  assert.equal(agg.statusCode, 200);
  const body = JSON.parse(agg.isBase64Encoded ? Buffer.from(agg.body, "base64").toString("utf8") : agg.body);
  assert.deepEqual(body.doors, []); // one answer is far under the line
});
