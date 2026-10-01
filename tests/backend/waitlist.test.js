import assert from "node:assert/strict";
import { test, beforeEach, afterEach } from "node:test";
import waitlist, { REF_PLACES, REF_CAP, MEMBER_INVITES, grantInvites, placeIn, rankOf, useWaitlistStore } from "../../api/waitlist.js";
import { handler } from "../../netlify/functions/waitlist.js";

const NOW = new Date("2026-10-07T16:00:00Z");
const ADMIN = "test-admin-key-0123456789";
let ip = 0;
function response() {
  return { headers: {}, setHeader(n, v) { this.headers[n] = v; }, end(b) { this.body = b; } };
}
async function call(kind, { method = "POST", body, auth, query = "", addr, now = NOW, contentType = "application/json", host = "127.0.0.1:5198" } = {}) {
  const res = response();
  const req = {
    method, url: `/api/waitlist?kind=${kind}${query}`,
    headers: { host, "content-type": contentType, "x-real-ip": addr || `10.1.${Math.floor(++ip / 250)}.${ip % 250}`, ...(auth ? { authorization: auth } : {}) },
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  };
  await waitlist(req, res, { now });
  return { status: res.statusCode, body: JSON.parse(res.body || "{}") };
}
const join = (o = {}) => call("join", { body: { email: `p${++ip}@example.com`, door: "ISLAM", ...o } });
const admin = (kind, body, method = "POST") => call(kind, { method, body, auth: `Bearer ${ADMIN}` });

let saved;
beforeEach(() => {
  saved = { INVITE_ONLY: process.env.INVITE_ONLY, WAITLIST_ADMIN_KEY: process.env.WAITLIST_ADMIN_KEY, WAITLIST_FOUNDING_CAP: process.env.WAITLIST_FOUNDING_CAP, WAITLIST_SITE_URL: process.env.WAITLIST_SITE_URL };
  process.env.INVITE_ONLY = "on";
  process.env.WAITLIST_ADMIN_KEY = ADMIN;
  delete process.env.WAITLIST_FOUNDING_CAP;
  delete process.env.WAITLIST_SITE_URL;
  useWaitlistStore();
});
afterEach(() => { for (const [k, v] of Object.entries(saved)) if (v === undefined) delete process.env[k]; else process.env[k] = v; });

test("switch off (the default): status says so, the public parts are closed, nothing is stored", async () => {
  delete process.env.INVITE_ONLY;
  assert.deepEqual((await call("status", { method: "GET" })).body, { inviteOnly: false });
  assert.equal((await join()).status, 404);
  assert.equal((await call("redeem", { body: { code: "abcdefgh" } })).status, 404);
  process.env.INVITE_ONLY = "off";
  assert.equal((await call("status", { method: "GET" })).body.inviteOnly, false);
  process.env.INVITE_ONLY = "on";
  const s = (await call("status", { method: "GET" })).body;
  assert.equal(s.inviteOnly, true);
  assert.equal(s.foundingCap, 10_000);
});

test("join: a real place in the door's line, a share link, a private key; places count per door", async () => {
  const a = await join({ email: "Ana@Example.com", name: "Ana" });
  assert.equal(a.status, 200);
  assert.equal(a.body.position, 1);
  assert.equal(a.body.waiting, 1);
  assert.equal(a.body.door, "ISLAM");
  assert.match(a.body.code, /^[a-z2-9]{8}$/);
  assert.equal(a.body.link, `http://127.0.0.1:5198/site.html?ref=${a.body.code}`);
  assert.match(a.body.key, /^[a-f0-9]{64}$/);
  assert.deepEqual(a.body.rule, { places: REF_PLACES, cap: REF_CAP });
  const b = await join();
  assert.equal(b.body.position, 2);
  const c = await join({ door: "JUDAISM", lang: "es" });
  assert.equal(c.body.position, 1); // a different door has its own line
  assert.match(c.body.link, /\/site-es\.html\?ref=/);
  const me = await call("me", { method: "GET", auth: `Waitlist ${a.body.key}` });
  assert.equal(me.body.state, "waiting");
  assert.equal(me.body.position, 1);
  assert.equal(me.body.waiting, 2);
});

test("join refuses bad email, unknown door, extra fields and duplicates (any case)", async () => {
  assert.equal((await join({ email: "nope" })).status, 400);
  assert.equal((await join({ email: "a@b" })).status, 400);
  assert.equal((await join({ email: "x".repeat(250) + "@example.com" })).status, 400);
  assert.equal((await join({ door: "MARS" })).status, 400);
  assert.equal((await join({ email: "ok@example.com", extra: 1 })).status, 400);
  assert.equal((await join({ email: "dup@example.com" })).status, 200);
  const again = await join({ email: "  DUP@example.com " });
  assert.equal(again.status, 409);
  assert.equal(again.body.already, true);
  assert.equal(again.body.position, undefined); // nothing about the existing entry is given back
});

test("the honeypot: a filled hidden field gets a bare ok and nothing is stored", async () => {
  const stored = new Map();
  useWaitlistStore({ get: async (k) => stored.get(k) ?? null, set: async (k, v) => { stored.set(k, v); }, delete: async (k) => { stored.delete(k); }, bump: async (k, fn) => { const n = fn(stored.get(k) ?? null); stored.set(k, n); return n; } });
  const r = await join({ website: "http://spam.example" });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { ok: true });
  assert.equal([...stored.keys()].filter((k) => !k.startsWith("rate/")).length, 0);
});

test("referrals: each friend who joins with your link moves you up to 100 places, 10 friends at most", async () => {
  const first = await join(); // #1
  const ids = [];
  for (let i = 0; i < 150; i++) ids.push(await join());
  const me = await join(); // #152
  assert.equal(me.body.position, 152);
  await join({ ref: me.body.code });
  let now = (await call("me", { method: "GET", auth: `Waitlist ${me.body.key}` })).body;
  assert.equal(now.refs, 1);
  assert.equal(now.position, 52); // up exactly 100 places
  await join({ ref: me.body.code });
  now = (await call("me", { method: "GET", auth: `Waitlist ${me.body.key}` })).body;
  assert.equal(now.position, 1); // never past the front
  const f = (await call("me", { method: "GET", auth: `Waitlist ${first.body.key}` })).body;
  assert.equal(f.position, 2);
  // the cap
  assert.equal(rankOf(1000, 50), rankOf(1000, REF_CAP));
  // a code that isn't anyone's is simply ignored
  assert.equal((await join({ ref: "zzzzzzzz" })).status, 200);
});

test("placeIn counts only people waiting for the same door", () => {
  const line = { seq: 4, members: 0, claims: 0, rows: { a: ["ISLAM", 1, 0, "w"], b: ["ISLAM", 2, 0, "i"], c: ["HINDUISM", 3, 0, "w"], d: ["ISLAM", 4, 0, "w"] } };
  assert.deepEqual(placeIn(line, "d"), { position: 2, waiting: 2, refs: 0, door: "ISLAM" });
});

test("delete me: everything goes, the friend who referred you loses that credit, the key stops working", async () => {
  const stored = new Map();
  useWaitlistStore({ get: async (k) => structuredClone(stored.get(k) ?? null), set: async (k, v) => { stored.set(k, structuredClone(v)); }, delete: async (k) => { stored.delete(k); }, bump: async (k, fn) => { const n = fn(structuredClone(stored.get(k) ?? null)); if (n === null) stored.delete(k); else stored.set(k, structuredClone(n)); return n; } });
  const a = await join();
  const b = await join({ email: "gone@example.com", ref: a.body.code, name: "Bea" });
  assert.equal((await call("me", { method: "GET", auth: `Waitlist ${a.body.key}` })).body.refs, 1);
  assert.ok(JSON.stringify([...stored.values()]).includes("gone@example.com"));
  assert.equal((await call("leave", { auth: `Waitlist ${b.body.key}`, body: {} })).status, 200);
  assert.ok(!JSON.stringify([...stored.values()]).includes("gone@example.com"));
  assert.ok(!JSON.stringify([...stored.values()]).includes("Bea"));
  assert.equal((await call("me", { method: "GET", auth: `Waitlist ${b.body.key}` })).status, 401);
  assert.equal((await call("me", { method: "GET", auth: `Waitlist ${a.body.key}` })).body.refs, 0);
  assert.equal((await join({ email: "gone@example.com" })).status, 200); // free to come back
  assert.equal((await call("leave", { auth: `Waitlist ${"0".repeat(64)}`, body: {} })).status, 401);
});

test("admin: without the key (or a short one) it doesn't exist; with it, counts by door", async () => {
  assert.equal((await call("admin-stats", { method: "GET" })).status, 404);
  assert.equal((await call("admin-stats", { method: "GET", auth: "Bearer wrong-key-wrong-key" })).status, 404);
  process.env.WAITLIST_ADMIN_KEY = "short";
  assert.equal((await call("admin-stats", { method: "GET", auth: "Bearer short" })).status, 404);
  process.env.WAITLIST_ADMIN_KEY = ADMIN;
  await join(); await join(); await join({ door: "SIKHISM" });
  const s = (await admin("admin-stats", undefined, "GET")).body;
  assert.equal(s.waiting.ISLAM, 2);
  assert.equal(s.waiting.SIKHISM, 1);
  assert.equal(s.members, 0);
  // admin works with the switch off too (so codes can be prepared before launch)
  delete process.env.INVITE_ONLY;
  assert.equal((await admin("admin-stats", undefined, "GET")).status, 200);
});

test("release → the invited person sees their code → redeems it → a member with 3 invites; their email is gone", async () => {
  const stored = new Map();
  useWaitlistStore({ get: async (k) => structuredClone(stored.get(k) ?? null), set: async (k, v) => { stored.set(k, structuredClone(v)); }, delete: async (k) => { stored.delete(k); }, bump: async (k, fn) => { const n = fn(structuredClone(stored.get(k) ?? null)); if (n === null) stored.delete(k); else stored.set(k, structuredClone(n)); return n; } });
  const a = await join({ email: "first@example.com", name: "Ana" });
  const b = await join({ email: "second@example.com" });
  const c = await join({ email: "third@example.com", door: "HINDUISM" });
  await join({ ref: b.body.code }); // b moves ahead of a
  const r = (await admin("admin-release", { n: 1, door: "ISLAM" })).body;
  assert.equal(r.released, 1);
  assert.equal(r.invited[0].email, "second@example.com");
  assert.match(r.invited[0].link, /\/invite\?code=[a-z2-9]{8}$/);
  assert.equal(r.delivery.sent, 0); // no email provider: nothing pretends to be sent
  const me = (await call("me", { method: "GET", auth: `Waitlist ${b.body.key}` })).body;
  assert.equal(me.state, "invited");
  assert.equal(me.inviteCode, r.invited[0].code);
  // a is now first in the ISLAM line; c's HINDUISM line is untouched
  assert.equal((await call("me", { method: "GET", auth: `Waitlist ${a.body.key}` })).body.position, 1);
  assert.equal((await call("me", { method: "GET", auth: `Waitlist ${c.body.key}` })).body.position, 1);
  assert.equal((await call("check", { method: "GET", query: `&code=${me.inviteCode}` })).body.kind, "waitlist");
  const m = await call("redeem", { body: { code: me.inviteCode.toUpperCase() } });
  assert.equal(m.status, 200);
  assert.match(m.body.memberId, /^m_[a-f0-9]{24}$/);
  assert.equal(m.body.invites, MEMBER_INVITES);
  assert.equal((await call("redeem", { body: { code: me.inviteCode } })).status, 404); // single use
  assert.ok(!JSON.stringify([...stored.values()]).includes("second@example.com"));
  const inv = (await call("invites", { method: "GET", auth: `Member ${m.body.memberId}:${m.body.token}` })).body;
  assert.equal(inv.invites.length, 3);
  assert.equal(inv.left, 3);
  // a friend comes in on one of them and chooses to show a nickname
  const friend = await call("redeem", { body: { code: inv.invites[0].code, nick: "maya", showNick: true } });
  assert.equal(friend.status, 200);
  const other = await call("redeem", { body: { code: inv.invites[1].code, nick: "hidden", showNick: false } });
  assert.equal(other.status, 200);
  const after = (await call("invites", { method: "GET", auth: `Member ${m.body.memberId}:${m.body.token}` })).body;
  assert.equal(after.left, 1);
  assert.equal(after.invites[0].nick, "maya");
  assert.equal(after.invites[1].used, true);
  assert.equal(after.invites[1].nick, null); // not shown unless they chose to
  assert.ok(!JSON.stringify([...stored.values()]).includes("hidden"));
  assert.equal((await call("invites", { method: "GET", auth: `Member ${m.body.memberId}:${"0".repeat(64)}` })).status, 401);
  assert.equal((await admin("admin-stats", undefined, "GET")).body.members, 3);
});

test("admin codes (multi-use for Keepers) and grants; grantInvites can be called by other server code", async () => {
  const codes = (await admin("admin-codes", { n: 2, uses: 3, label: "keeper: Dr. Rahman" })).body.codes;
  assert.equal(codes.length, 2);
  const used = [];
  for (let i = 0; i < 3; i++) used.push((await call("redeem", { body: { code: codes[0].code } })).status);
  assert.deepEqual(used, [200, 200, 200]);
  assert.equal((await call("redeem", { body: { code: codes[0].code } })).status, 404);
  const m = (await call("redeem", { body: { code: codes[1].code } })).body;
  const g = (await admin("admin-grant", { memberId: m.memberId, n: 5 })).body;
  assert.equal(g.granted, 5);
  assert.equal((await call("invites", { method: "GET", auth: `Member ${m.memberId}:${m.token}` })).body.left, 8);
  assert.equal((await grantInvites(m.memberId, 2)).length, 2);
  assert.equal(await grantInvites("m_nope", 2), null);
  assert.equal(await grantInvites(m.memberId, 0), null);
  assert.equal((await admin("admin-grant", { memberId: "m_" + "0".repeat(24), n: 1 })).status, 404);
});

test("the founding cap holds: releases stop at it and codes stop working once it's full", async () => {
  process.env.WAITLIST_FOUNDING_CAP = "2";
  for (let i = 0; i < 4; i++) await join();
  const r = (await admin("admin-release", { n: 4 })).body;
  assert.equal(r.released, 2);
  assert.equal(r.capped, true);
  for (const x of r.invited) assert.equal((await call("redeem", { body: { code: x.code } })).status, 200);
  const extra = (await admin("admin-codes", { n: 1 })).body.codes[0].code;
  const full = await call("redeem", { body: { code: extra } });
  assert.equal(full.status, 409);
  assert.equal(full.body.full, true);
  assert.equal((await call("status", { method: "GET" })).body.full, true);
});

test("beta members already in before the switch can claim one member identity (limited per connection)", async () => {
  const a = await call("claim", { body: {}, addr: "10.9.9.9" });
  assert.equal(a.status, 200);
  assert.equal(a.body.invites, MEMBER_INVITES);
  assert.equal((await call("claim", { body: {}, addr: "10.9.9.9" })).status, 200);
  assert.equal((await call("claim", { body: {}, addr: "10.9.9.9" })).status, 429);
  process.env.WAITLIST_BETA_CLAIMS = "2";
  assert.equal((await call("claim", { body: {}, addr: "10.9.9.10" })).status, 409);
  delete process.env.WAITLIST_BETA_CLAIMS;
  assert.equal((await call("member-leave", { auth: `Member ${a.body.memberId}:${a.body.token}`, body: {} })).status, 200);
  assert.equal((await call("invites", { method: "GET", auth: `Member ${a.body.memberId}:${a.body.token}` })).status, 401);
});

test("rate limits: 5 joins an hour from one connection, and a per-minute brake on everything", async () => {
  const one = [];
  for (let i = 0; i < 6; i++) one.push((await call("join", { body: { email: `same${i}@example.com`, door: "ISLAM" }, addr: "10.7.7.7" })).status);
  assert.deepEqual(one, [200, 200, 200, 200, 200, 429]);
  const later = await call("join", { body: { email: "same9@example.com", door: "ISLAM" }, addr: "10.7.7.7", now: new Date(NOW.getTime() + 3_600_000) });
  assert.equal(later.status, 200);
  const brake = [];
  for (let i = 0; i < 31; i++) brake.push((await call("status", { method: "GET", addr: "10.8.8.8" })).status);
  assert.equal(brake.at(-1), 429);
});

test("method, content type and body size are checked; unknown kinds refused", async () => {
  assert.equal((await call("join", { method: "GET" })).status, 405);
  assert.equal((await call("join", { body: { email: "a@b.co", door: "ISLAM" }, contentType: "text/plain" })).status, 415);
  assert.equal((await call("join", { body: "x".repeat(3000) })).status, 413);
  assert.equal((await call("nope", { method: "GET" })).status, 400);
});

test("WAITLIST_SITE_URL fixes the link's address; otherwise https for a real host", async () => {
  const a = await call("join", { body: { email: "h@example.com", door: "ISLAM" }, host: "golden-house-beta.netlify.app" });
  assert.match(a.body.link, /^https:\/\/golden-house-beta\.netlify\.app\/site\.html\?ref=/);
  process.env.WAITLIST_SITE_URL = "https://infinitehill.example";
  const b = await join();
  assert.match(b.body.link, /^https:\/\/infinitehill\.example\/site\.html\?ref=/);
});

test("the Netlify function answers through the adapter", async () => {
  delete process.env.INVITE_ONLY;
  const r = await handler({ httpMethod: "GET", rawUrl: "https://example.test/api/waitlist?kind=status", headers: {} });
  assert.equal(r.statusCode, 200);
  const body = JSON.parse(r.isBase64Encoded ? Buffer.from(r.body, "base64").toString("utf8") : r.body);
  assert.deepEqual(body, { inviteOnly: false });
});
