import assert from "node:assert/strict";
import { test, beforeEach, afterEach } from "node:test";
import pulse, { BACK_DAYS, MAX_VARIANTS, cleanPing, countPing, readCounts, resetPulseLimit, usePulseStore } from "../../api/pulse.js";
import { handler } from "../../netlify/functions/pulse.js";

const NOW = new Date("2026-10-07T16:00:00Z");
const KEY = "k".repeat(32);
function response() {
  return { headers: {}, setHeader(n, v) { this.headers[n] = v; }, end(b) { this.body = b; } };
}
async function call({ method = "POST", body, query = "", auth, now = NOW, contentType = "application/json", headers = {} } = {}) {
  const res = response();
  const req = {
    method, url: `/api/pulse${query}`,
    headers: { "content-type": contentType, ...(auth ? { authorization: `Bearer ${auth}` } : {}), ...headers },
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  };
  await pulse(req, res, { now });
  return { status: res.statusCode, body: res.body ? JSON.parse(res.body) : null };
}
const ping = (o, now) => call({ body: o, now });
const read = (query = "?from=2026-09-01&to=2026-10-07") => call({ method: "GET", query, auth: KEY });

beforeEach(() => { usePulseStore(); resetPulseLimit(); process.env.PULSE_READ_KEY = KEY; });
afterEach(() => { delete process.env.PULSE_READ_KEY; });

test("a first open, a day-1 return, a day-7 return and lessons become counters, nothing else", async () => {
  const stored = new Map();
  usePulseStore({ get: async (k) => stored.get(k) ?? null, bump: async (k, fn) => { stored.set(k, fn(stored.get(k) ?? null)); } });
  assert.equal((await ping({ cohortDate: "2026-10-07", daysSince: 0, event: "first" })).status, 204);
  assert.equal((await ping({ cohortDate: "2026-10-07", daysSince: 0, event: "lesson" })).status, 204);
  assert.equal((await ping({ cohortDate: "2026-10-06", daysSince: 1, event: "open" })).status, 204);
  assert.equal((await ping({ cohortDate: "2026-09-30", daysSince: 7, event: "open" })).status, 204);
  assert.equal((await ping({ cohortDate: "2026-09-30", daysSince: 7, event: "lesson" })).status, 204);
  assert.deepEqual(Object.fromEntries(stored), {
    "cohort/-/2026-10-07": { installs: 1, back: {} },
    "day/-/2026-10-07": { first: 1, opens: 3, lessons: 2 },
    "cohort/-/2026-10-06": { installs: 0, back: { 1: 1 } },
    "cohort/-/2026-09-30": { installs: 0, back: { 7: 1 } },
  });
  // nothing that could tell one phone from another is anywhere in storage
  assert.doesNotMatch(JSON.stringify([...stored]), /10\.0\.|Mozilla|dev_|ip|agent/i);
});

test("only the four allowed fields, in range: a door, an id or a lesson is refused", async () => {
  const ok = { cohortDate: "2026-10-07", daysSince: 0, event: "first" };
  for (const extra of [{ door: "ISLAM" }, { id: "dev_123" }, { lesson: 3 }, { question: "why" }, { tz: "America/New_York" }]) {
    assert.equal((await ping({ ...ok, ...extra })).status, 400, JSON.stringify(extra));
  }
  assert.equal((await ping({ ...ok, event: "click" })).status, 400);
  assert.equal((await ping({ ...ok, daysSince: 1 })).status, 400); // a "first" is always day 0
  assert.equal((await ping({ cohortDate: "2026-10-07", daysSince: 0, event: "open" })).status, 400); // day 0's open is "first"
  assert.equal((await ping({ ...ok, daysSince: -1, event: "lesson" })).status, 400);
  assert.equal((await ping({ ...ok, daysSince: 1.5, event: "lesson" })).status, 400);
  assert.equal((await ping({ ...ok, cohortDate: "2026-02-30" })).status, 400);
  assert.equal((await ping({ ...ok, cohortDate: "2025-12-31", daysSince: 280, event: "open" })).status, 400); // before the app
  assert.equal((await ping({ ...ok, variant: "Finish B" })).status, 400);
  assert.equal((await call({ body: ok, contentType: "text/plain" })).status, 415);
  assert.equal((await call({ body: "x".repeat(600) })).status, 413);
  assert.equal((await call({ body: "[1]" })).status, 400);
  assert.equal((await call({ method: "PUT", body: ok })).status, 405);
});

test("the date has to be today somewhere on Earth (no replays, no future)", async () => {
  assert.equal((await ping({ cohortDate: "2026-10-01", daysSince: 1, event: "open" })).status, 400); // that's Oct 2
  assert.equal((await ping({ cohortDate: "2026-10-08", daysSince: 0, event: "first" })).status, 204); // already tomorrow in Kiribati
  assert.equal((await ping({ cohortDate: "2026-10-10", daysSince: 0, event: "first" })).status, 400);
  assert.equal((await ping({ cohortDate: "2026-10-06", daysSince: 0, event: "first" })).status, 204); // still yesterday in Hawaii
});

test("returns are kept for days 1 to 30 per cohort; later opens still count as opens", async () => {
  const late = new Date("2026-11-20T16:00:00Z");
  assert.equal((await ping({ cohortDate: "2026-10-07", daysSince: 44, event: "open" }, late)).status, 204);
  assert.equal((await ping({ cohortDate: "2026-10-21", daysSince: BACK_DAYS, event: "open" }, late)).status, 204);
  const r = await call({ method: "GET", query: "?from=2026-10-01&to=2026-11-20", auth: KEY, now: late });
  assert.deepEqual(r.body.cohorts, [{ date: "2026-10-21", variant: null, installs: 0, back: { 30: 1 } }]);
  assert.deepEqual(r.body.days, [{ date: "2026-11-20", variant: null, first: 0, opens: 2, lessons: 0, week: {} }]);
});

test("variants are counted apart, and there can only be a few", async () => {
  await ping({ cohortDate: "2026-10-07", daysSince: 0, event: "first", variant: "finish-b" });
  await ping({ cohortDate: "2026-10-07", daysSince: 0, event: "first" });
  await ping({ cohortDate: "2026-10-07", daysSince: 0, event: "first", variant: "finish-b" });
  const r = await read();
  assert.deepEqual(r.body.cohorts.map((c) => [c.variant, c.installs]), [[null, 1], ["finish-b", 2]]);
  for (let i = 0; i < MAX_VARIANTS - 1; i++) assert.equal((await ping({ cohortDate: "2026-10-07", daysSince: 0, event: "lesson", variant: `v${i}` })).status, 204);
  assert.equal((await ping({ cohortDate: "2026-10-07", daysSince: 0, event: "lesson", variant: "one-too-many" })).status, 400);
});

test("reading needs the server's key; without PULSE_READ_KEY reading is simply off", async () => {
  await ping({ cohortDate: "2026-10-07", daysSince: 0, event: "first" });
  assert.equal((await call({ method: "GET" })).status, 401);
  assert.equal((await call({ method: "GET", auth: "w".repeat(32) })).status, 401);
  assert.equal((await call({ method: "GET", auth: KEY.slice(0, 31) })).status, 401);
  const ok = await call({ method: "GET", auth: KEY });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.from, "2026-08-24"); // the last 45 days by default
  assert.equal(ok.body.cohorts[0].installs, 1);
  assert.equal((await read("?from=2026-01-01&to=2026-10-07")).status, 400); // too long a range
  assert.equal((await read("?from=2026-10-07&to=2026-10-01")).status, 400);
  delete process.env.PULSE_READ_KEY;
  assert.equal((await call({ method: "GET", auth: KEY })).status, 404);
  process.env.PULSE_READ_KEY = "short";
  assert.equal((await call({ method: "GET", auth: "short" })).status, 404); // a weak key doesn't switch reading on
});

test("the IP address and user agent are never read", async () => {
  const headers = new Proxy({ "content-type": "application/json" }, {
    get(target, name) {
      if (/ip|forwarded|agent|client/i.test(String(name))) throw new Error(`read ${String(name)}`);
      return target[name];
    },
  });
  const res = response();
  await pulse({ method: "POST", url: "/api/pulse", headers, body: JSON.stringify({ cohortDate: "2026-10-07", daysSince: 0, event: "first" }) }, res, { now: NOW });
  assert.equal(res.statusCode, 204);
});

test("a flood is slowed down", async () => {
  let last;
  for (let i = 0; i < 1201; i++) last = await ping({ cohortDate: "2026-10-07", daysSince: 0, event: "lesson" });
  assert.equal(last.status, 429);
});

test("cleanPing works out the event's date from the phone's own numbers", () => {
  assert.deepEqual(cleanPing({ cohortDate: "2026-09-30", daysSince: 7, event: "open" }, NOW), { cohortDate: "2026-09-30", daysSince: 7, event: "open", variant: "-", date: "2026-10-07", week: null });
  assert.equal(cleanPing(null, NOW), null);
});

test("the Netlify function answers through the adapter (in memory without Blobs)", async () => {
  const r = await handler({ httpMethod: "POST", rawUrl: "https://example.test/api/pulse", headers: { "content-type": "application/json" }, body: JSON.stringify({ cohortDate: new Date().toISOString().slice(0, 10), daysSince: 0, event: "first" }) });
  assert.equal(r.statusCode, 204);
  const bad = await handler({ httpMethod: "POST", rawUrl: "https://example.test/api/pulse", headers: { "content-type": "application/json" }, body: JSON.stringify({ door: "ISLAM" }) });
  assert.equal(bad.statusCode, 400);
});

test("a week-one lesson says which of days 1–7 it was, and nothing else; other events can't carry it", async () => {
  usePulseStore();
  resetPulseLimit();
  assert.equal(cleanPing({ cohortDate: "2026-10-05", daysSince: 2, event: "lesson", week: 3 }, NOW).week, 3);
  assert.equal(cleanPing({ cohortDate: "2026-10-05", daysSince: 2, event: "open", week: 3 }, NOW), null);
  assert.equal(cleanPing({ cohortDate: "2026-10-05", daysSince: 2, event: "lesson", week: 8 }, NOW), null);
  await countPing(cleanPing({ cohortDate: "2026-10-05", daysSince: 2, event: "lesson", week: 3 }, NOW));
  await countPing(cleanPing({ cohortDate: "2026-10-05", daysSince: 2, event: "lesson" }, NOW));
  const r = await readCounts({ from: "2026-10-07", to: "2026-10-07" });
  assert.deepEqual(r.days.map((d) => [d.lessons, d.week]), [[2, { 3: 1 }]]);
});
