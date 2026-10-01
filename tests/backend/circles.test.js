import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import friends, { useFriendsStore } from "../../api/friends.js";
import circles, { MAX_CIRCLES, NOTE_MAX, normalizeCode, useCirclesStore } from "../../api/circles.js";
import { handler } from "../../netlify/functions/circles.js";

const NOW = new Date("2026-10-07T16:00:00Z");
const TODAY = "2026-10-07";
let ip = 0;
function response() {
  return { headers: {}, setHeader(n, v) { this.headers[n] = v; }, end(b) { this.body = b; } };
}
async function hit(fn, path, kind, { method = "POST", body, auth, query = "", addr, now = NOW } = {}) {
  const res = response();
  const req = {
    method, url: `/api/${path}?kind=${kind}${query}`,
    headers: { "content-type": "application/json", "x-real-ip": addr || `10.1.0.${++ip % 250}`, ...(auth ? { authorization: `Friend ${auth.friendId}:${auth.token}` } : {}) },
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  };
  await fn(req, res, { now });
  return { status: res.statusCode, body: JSON.parse(res.body || "{}") };
}
const call = (kind, o) => hit(circles, "circles", kind, o);
const person = async () => (await hit(friends, "friends", "join", { body: {} })).body;
const make = (auth, o = {}, opts = {}) => call("create", { ...opts, auth, body: { name: "Tuesday Gita circle", door: "HINDUISM", leaderName: "Pandit Ravi", welcome: "Welcome, all.", ...o } });
const mine = async (auth, date = TODAY) => (await call("mine", { method: "GET", auth, query: `&date=${date}` })).body.circles;

let stored;
beforeEach(() => {
  useFriendsStore();
  stored = new Map();
  useCirclesStore({
    get: async (k) => (stored.has(k) ? structuredClone(stored.get(k)) : null),
    set: async (k, v) => { stored.set(k, structuredClone(v)); },
    delete: async (k) => { stored.delete(k); },
    bump: async (k, fn) => { const n = fn(stored.has(k) ? structuredClone(stored.get(k)) : null); if (n === null) stored.delete(k); else stored.set(k, structuredClone(n)); return n; },
  });
});

test("a leader creates a circle and gets a short code that's easy to read out", async () => {
  const lead = await person();
  const r = await make(lead);
  assert.equal(r.status, 200);
  const c = r.body.circle;
  assert.match(c.code, /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
  assert.deepEqual([c.name, c.door, c.leaderName, c.welcome, c.note, c.isLeader, c.count, c.walkedToday], ["Tuesday Gita circle", "HINDUISM", "Pandit Ravi", "Welcome, all.", null, true, 1, 0]);
  assert.equal(normalizeCode(` ${c.code.slice(0, 3).toLowerCase()}-${c.code.slice(3)} `), c.code);
});

test("only signed-in friends can create or join; anyone with the code can peek", async () => {
  const lead = await person();
  assert.equal((await make(null)).status, 401);
  const { code } = (await make(lead)).body.circle;
  const peek = await call("peek", { method: "GET", query: `&code=${code.toLowerCase()}` });
  assert.equal(peek.status, 200);
  assert.deepEqual(peek.body, { name: "Tuesday Gita circle", door: "HINDUISM", leaderName: "Pandit Ravi", welcome: "Welcome, all.", count: 1 });
  assert.equal((await call("peek", { method: "GET", query: "&code=ZZZZZZ" })).status, 404);
  assert.equal((await call("peek", { method: "GET", query: "&code=bad" })).status, 400);
  assert.equal((await call("join", { body: { code } })).status, 401);
});

test("join by code: real counts, nicknames only for members who chose to appear", async () => {
  const lead = await person(), a = await person(), b = await person(), c = await person();
  const { code } = (await make(lead)).body.circle;
  assert.equal((await call("join", { auth: a, body: { code, nick: "Meera" } })).status, 200);
  assert.equal((await call("join", { auth: b, body: { code } })).status, 200); // counted only
  assert.equal((await call("join", { auth: c, body: { code: code.toLowerCase(), nick: "the Shah family", family: true } })).status, 200);
  const seen = (await mine(b))[0];
  assert.equal(seen.count, 4);
  assert.deepEqual(seen.members.map((m) => [m.nick, m.family]).sort(), [["Meera", false], ["the Shah family", true]]);
  assert.ok(!JSON.stringify(seen).includes(a.friendId) && !JSON.stringify(seen).includes(b.friendId)); // never an id
  // the leader sees exactly the same members and counts
  const led = (await mine(lead))[0];
  assert.deepEqual([led.count, led.members.length, led.isLeader], [4, 2, true]);
  assert.equal(seen.isLeader, false);
  // joining again changes nothing in the count
  await call("join", { auth: a, body: { code, nick: "Meera" } });
  assert.equal((await mine(a))[0].count, 4);
});

test("walked today counts members whose last walk is today; only the date is kept", async () => {
  const lead = await person(), a = await person(), b = await person();
  const { id, code } = (await make(lead)).body.circle;
  await call("join", { auth: a, body: { code, nick: "Meera" } });
  await call("join", { auth: b, body: { code } });
  assert.equal((await call("walked", { auth: a, body: { date: TODAY } })).status, 200);
  assert.equal((await call("walked", { auth: b, body: { date: TODAY } })).status, 200);
  assert.equal((await call("walked", { auth: b, body: { date: TODAY, lesson: 4 } })).status, 400); // nothing but the date
  assert.equal((await call("walked", { auth: b, body: { date: "2026-11-20" } })).status, 400); // not today anywhere
  const v = (await mine(lead))[0];
  assert.deepEqual([v.count, v.walkedToday], [3, 2]);
  assert.equal(v.members.find((m) => m.nick === "Meera").walked, true);
  assert.equal((await mine(lead, "2026-10-08"))[0].walkedToday, 0); // a new day starts at zero
  const doc = stored.get(`circle/${id}`);
  assert.deepEqual(Object.keys(doc).sort(), ["code", "created", "door", "leader", "leaderName", "members", "name", "note", "welcome"]);
  assert.deepEqual(Object.keys(doc.members[a.friendId]).sort(), ["f", "l", "n"]);
});

test("only the leader posts the one pinned note; text only, at most 280 characters", async () => {
  const lead = await person(), a = await person();
  const { id, code } = (await make(lead)).body.circle;
  await call("join", { auth: a, body: { code } });
  assert.equal((await call("note", { auth: a, body: { circleId: id, note: "hello" } })).status, 403);
  assert.equal((await call("note", { auth: lead, body: { circleId: id, note: "x".repeat(NOTE_MAX + 1) } })).status, 400);
  assert.equal((await call("note", { auth: lead, body: { circleId: id, note: "Read <b>chapter 2</b>‮ before Sunday" } })).status, 200);
  assert.equal((await mine(a))[0].note, "Read bchapter 2/b before Sunday");
  assert.equal((await call("note", { auth: lead, body: { circleId: id, note: "" } })).status, 200);
  assert.equal((await mine(a))[0].note, null);
});

test("show by nickname can be turned on and off", async () => {
  const lead = await person(), a = await person();
  const { id, code } = (await make(lead)).body.circle;
  await call("join", { auth: a, body: { code } });
  assert.equal((await mine(lead))[0].members.length, 0);
  await call("show", { auth: a, body: { circleId: id, nick: "Meera" } });
  assert.deepEqual((await mine(lead))[0].members.map((m) => m.nick), ["Meera"]);
  await call("show", { auth: a, body: { circleId: id, nick: null } });
  assert.equal((await mine(lead))[0].members.length, 0);
  assert.equal((await mine(lead))[0].count, 2);
});

test("leave anytime; when the leader leaves, the circle closes and its code stops working", async () => {
  const lead = await person(), a = await person(), b = await person();
  const { id, code } = (await make(lead)).body.circle;
  await call("join", { auth: a, body: { code } });
  await call("join", { auth: b, body: { code } });
  assert.equal((await call("leave", { auth: a, body: { circleId: id } })).status, 200);
  assert.equal((await mine(a)).length, 0);
  assert.equal((await mine(lead))[0].count, 2);
  assert.equal((await call("leave", { auth: lead, body: { circleId: id } })).status, 200);
  assert.equal((await mine(b)).length, 0);
  assert.equal((await call("peek", { method: "GET", query: `&code=${code}` })).status, 404);
  assert.ok(!stored.has(`circle/${id}`));
});

test("forget leaves every circle", async () => {
  const lead = await person(), a = await person();
  const one = (await make(lead)).body.circle;
  const two = (await make(lead, { name: "Sunday kids' parents", door: "SIKHISM", leaderName: "Bhai Ji" })).body.circle;
  await call("join", { auth: a, body: { code: one.code } });
  await call("join", { auth: a, body: { code: two.code } });
  assert.equal((await mine(a)).length, 2);
  assert.equal((await call("forget", { auth: a, body: {} })).status, 200);
  assert.equal((await mine(a)).length, 0);
  assert.equal((await mine(lead)).every((c) => c.count === 1), true);
});

test("validation: no door outside the eight, no extra fields, caps on circles", async () => {
  const lead = await person();
  assert.equal((await make(lead, { door: "PASTAFARIAN" })).status, 400);
  assert.equal((await make(lead, { name: "   " })).status, 400);
  assert.equal((await make(lead, { leaderName: "" })).status, 400);
  assert.equal((await make(lead, { lesson: 3 })).status, 400);
  const a = await person();
  const { code } = (await make(lead)).body.circle;
  assert.equal((await call("join", { auth: a, body: { code, journal: "x" } })).status, 400);
  assert.equal((await call("join", { auth: a, body: { code, nick: 5 } })).status, 400);
  const many = await person();
  for (let i = 0; i < MAX_CIRCLES; i++) assert.equal((await make(many, {}, { addr: `10.9.${i}.1` })).status, 200);
  assert.equal((await make(many)).status, 409);
});

test("rate limits: creating a circle is capped per connection per day", async () => {
  const addr = "10.5.5.5";
  let last;
  for (let i = 0; i < 6; i++) { const p = await person(); last = await call("create", { auth: p, addr, body: { name: `c${i}`, door: "ISLAM", leaderName: "Imam" } }); }
  assert.equal(last.status, 429);
});

test("nothing is logged", async () => {
  const seen = [];
  const orig = { log: console.log, error: console.error, warn: console.warn };
  console.log = console.error = console.warn = (...a) => seen.push(a.join(" "));
  try {
    const lead = await person();
    const { code } = (await make(lead)).body.circle;
    await call("join", { auth: lead, body: "{bad" });
    await call("join", { auth: lead, body: { code } });
  } finally { Object.assign(console, orig); }
  assert.deepEqual(seen, []);
});

test("the Netlify function answers through the adapter", async () => {
  const r = await handler({ httpMethod: "GET", rawUrl: "https://example.test/api/circles?kind=mine", headers: {} }, {});
  assert.equal(r.statusCode, 401);
});
