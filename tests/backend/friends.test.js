import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import friends, { CHEER_STREAKS, MAX_FRIENDS, cheerable, friendStreak, mondayOf, useFriendsStore } from "../../api/friends.js";
import { handler } from "../../netlify/functions/friends.js";

const NOW = new Date("2026-10-07T16:00:00Z"); // a Wednesday
let ip = 0;
function response() {
  return { headers: {}, setHeader(n, v) { this.headers[n] = v; }, end(b) { this.body = b; } };
}
async function call(kind, { method = "POST", body, auth, query = "", addr, now = NOW, contentType = "application/json" } = {}) {
  const res = response();
  const req = {
    method, url: `/api/friends?kind=${kind}${query}`,
    headers: { "content-type": contentType, "x-real-ip": addr || `10.0.0.${++ip % 250}`, ...(auth ? { authorization: `Friend ${auth.friendId}:${auth.token}` } : {}) },
    ...(body === undefined ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
  };
  await friends(req, res, { now });
  return { status: res.statusCode, body: JSON.parse(res.body || "{}") };
}
const join = async () => (await call("join", { body: {} })).body;
const pair = async (a, b) => {
  const { code } = (await call("invite", { auth: a, body: {} })).body;
  return call("accept", { auth: b, body: { code } });
};
const status = (o = {}) => ({ date: "2026-10-07", doneToday: true, streak: 3, golden: false, weekLight: 30, nick: "maya", board: false, ...o });

beforeEach(() => useFriendsStore());

test("join makes an anonymous identity; only a hash of the token is kept", async () => {
  const a = await join();
  assert.match(a.friendId, /^f_[a-f0-9]{24}$/);
  assert.match(a.token, /^[a-f0-9]{64}$/);
  const stored = new Map();
  useFriendsStore({ get: async (k) => stored.get(k) ?? null, set: async (k, v) => { stored.set(k, v); }, delete: async (k) => { stored.delete(k); } });
  const b = await join();
  const doc = stored.get(`me/${b.friendId}`);
  assert.ok(doc.tokenHash && doc.tokenHash !== b.token);
  assert.ok(!JSON.stringify(doc).includes(b.token));
});

test("requests without the right token are refused", async () => {
  const a = await join();
  assert.equal((await call("friends", { method: "GET" })).status, 401);
  assert.equal((await call("friends", { method: "GET", auth: { ...a, token: "0".repeat(64) } })).status, 401);
  assert.equal((await call("friends", { method: "GET", auth: a })).status, 200);
});

test("invite → accept pairs both ways; the code is single use and expires in about 7 days", async () => {
  const a = await join(), b = await join(), c = await join();
  const { code, expires } = (await call("invite", { auth: a, body: {} })).body;
  assert.match(code, /^[a-z2-9]{10}$/);
  assert.ok(Date.parse(expires) - NOW.getTime() >= 6.9 * 86_400_000);
  const ok = await call("accept", { auth: b, body: { code } });
  assert.equal(ok.status, 200);
  assert.equal((await call("accept", { auth: c, body: { code } })).status, 404); // used
  const late = (await call("invite", { auth: a, body: {} })).body.code;
  assert.equal((await call("accept", { auth: c, body: { code: late }, now: new Date(NOW.getTime() + 8 * 86_400_000) })).status, 404);
  const own = (await call("invite", { auth: a, body: {} })).body.code;
  assert.equal((await call("accept", { auth: a, body: { code: own } })).status, 400);
  const la = (await call("friends", { method: "GET", auth: a })).body.friends;
  const lb = (await call("friends", { method: "GET", auth: b })).body.friends;
  assert.deepEqual([la.length, lb.length, la[0].id, lb[0].id], [1, 1, b.friendId, a.friendId]);
});

test("check-in takes only the allowed fields; friends see nickname, streak, today, golden", async () => {
  const a = await join(), b = await join();
  await pair(a, b);
  assert.equal((await call("checkin", { auth: a, body: { ...status(), door: "HINDUISM" } })).status, 400); // no door, ever
  assert.equal((await call("checkin", { auth: a, body: { ...status(), mood: "heavy" } })).status, 400);
  assert.equal((await call("checkin", { auth: a, body: { ...status(), date: "2026-10-20" } })).status, 400); // not today anywhere
  assert.equal((await call("checkin", { auth: a, body: { ...status(), streak: -1 } })).status, 400);
  assert.equal((await call("checkin", { auth: a, body: { ...status(), nick: "<b>maya</b>" } })).status, 200);
  const f = (await call("friends", { method: "GET", auth: b, query: "&date=2026-10-07" })).body.friends[0];
  assert.deepEqual([f.nick, f.streak, f.doneToday, f.golden], ["bmaya/b", 3, true, false]);
  assert.equal(f.weekLight, null); // nobody joined the board
  assert.ok(!("door" in f));
});

test("the friend streak: days both finished; a rest day holds it; today stays open", async () => {
  const a = { days: { "2026-10-03": "L", "2026-10-04": "L", "2026-10-05": "R", "2026-10-06": "L", "2026-10-07": "L" } };
  const b = { days: { "2026-10-03": "L", "2026-10-04": "L", "2026-10-05": "L", "2026-10-06": "L" } };
  assert.equal(friendStreak(a, b, "2026-10-07"), 3); // 3rd, 4th, (5th held), 6th; today open for b
  assert.equal(friendStreak(a, { days: { ...b.days, "2026-10-07": "L" } }, "2026-10-07"), 4);
  assert.equal(friendStreak(a, { days: { "2026-10-06": "L", "2026-10-04": "L" } }, "2026-10-07"), 1); // b missed the 5th
  assert.equal(friendStreak({}, b, "2026-10-07"), 0);
});

test("check-ins build the shared streak end to end, inferring rest days from a surviving streak", async () => {
  const a = await join(), b = await join();
  await pair(a, b);
  const day = (d) => new Date(`${d}T16:00:00Z`);
  for (const [d, sa, sb] of [["2026-10-04", 1, 1], ["2026-10-05", 2, 2], ["2026-10-07", 3, 3]]) {
    await call("checkin", { auth: a, body: status({ date: d, streak: sa }), now: day(d) });
    await call("checkin", { auth: b, body: status({ date: d, streak: sb, nick: "sam" }), now: day(d) });
  }
  // the 6th was missed by both, but both streaks survived (3 on the 7th): rest days, so it holds
  const f = (await call("friends", { method: "GET", auth: a, query: "&date=2026-10-07", now: day("2026-10-07") })).body.friends[0];
  assert.equal(f.together, 3);
  // a fresh start (streak 1 after a gap) is not a survivor: the shared streak starts over
  await call("checkin", { auth: b, body: status({ date: "2026-10-09", streak: 1, nick: "sam" }), now: day("2026-10-09") });
  await call("checkin", { auth: a, body: status({ date: "2026-10-09", streak: 1 }), now: day("2026-10-09") });
  const g = (await call("friends", { method: "GET", auth: a, query: "&date=2026-10-09", now: day("2026-10-09") })).body.friends[0];
  assert.equal(g.together, 1);
});

test("the weekly board: only people who joined see each other's weekly light, and it resets Monday", async () => {
  const a = await join(), b = await join(), c = await join();
  await pair(a, b); await pair(a, c);
  await call("checkin", { auth: a, body: status({ weekLight: 40, board: true, nick: "ana" }) });
  await call("checkin", { auth: b, body: status({ weekLight: 70, board: true, nick: "ben" }) });
  await call("checkin", { auth: c, body: status({ weekLight: 90, board: false, nick: "cy" }) });
  const list = (await call("friends", { method: "GET", auth: a, query: "&date=2026-10-07" })).body.friends;
  assert.deepEqual(list.map((f) => [f.nick, f.weekLight]).sort(), [["ben", 70], ["cy", null]]);
  // c can't see a's light (c didn't join)
  assert.equal((await call("friends", { method: "GET", auth: c, query: "&date=2026-10-07" })).body.friends[0].weekLight, null);
  // next Monday: last week's light doesn't carry over
  const mon = new Date("2026-10-12T16:00:00Z");
  const next = (await call("friends", { method: "GET", auth: a, query: "&date=2026-10-12", now: mon })).body.friends.find((f) => f.nick === "ben");
  assert.equal(next.weekLight, null);
  assert.equal(mondayOf("2026-10-11"), "2026-10-05");
  assert.equal(mondayOf("2026-10-12"), "2026-10-12");
});

test("a friend quiet for 7+ days fades; nobody is pinged", async () => {
  const a = await join(), b = await join();
  await pair(a, b);
  await call("checkin", { auth: b, body: status({ date: "2026-09-29", nick: "sam" }), now: new Date("2026-09-29T16:00:00Z") });
  const f = (await call("friends", { method: "GET", auth: a, query: "&date=2026-10-07" })).body.friends[0];
  assert.equal(f.faded, true);
  assert.equal(f.lastSeen, "2026-09-29");
  assert.equal(f.streak, 0);
});

test("remove un-friends both ways; leave deletes me and my invites everywhere", async () => {
  const a = await join(), b = await join(), c = await join();
  await pair(a, b); await pair(a, c);
  await call("remove", { auth: a, body: { friendId: b.friendId } });
  assert.equal((await call("friends", { method: "GET", auth: b })).body.friends.length, 0);
  const { code } = (await call("invite", { auth: a, body: {} })).body;
  assert.equal((await call("leave", { auth: a, body: {} })).status, 200);
  assert.equal((await call("friends", { method: "GET", auth: a })).status, 401);
  assert.equal((await call("friends", { method: "GET", auth: c })).body.friends.length, 0);
  assert.equal((await call("accept", { auth: b, body: { code } })).status, 404);
});

test("friends are capped at about 30", async () => {
  const a = await join();
  for (let i = 0; i < MAX_FRIENDS; i++) assert.equal((await pair(a, await join())).status, 200);
  assert.equal((await pair(a, await join())).status, 409);
});

test("validation and rate limits", async () => {
  const a = await join();
  assert.equal((await call("nope", { body: {} })).status, 400);
  assert.equal((await call("friends", { method: "POST", auth: a, body: {} })).status, 405);
  assert.equal((await call("checkin", { auth: a, body: status(), contentType: "text/plain" })).status, 415);
  assert.equal((await call("checkin", { auth: a, body: "x".repeat(3000) })).status, 413);
  assert.equal((await call("checkin", { auth: a, body: "{nope" })).status, 400);
  assert.equal((await call("accept", { auth: a, body: { code: "../../me" } })).status, 400);
  let refused = 0;
  for (let i = 0; i < 130; i++) if ((await call("friends", { method: "GET", auth: a, addr: "10.9.9.9" })).status === 429) refused++;
  assert.ok(refused >= 10);
  let joins = 0;
  for (let i = 0; i < 102; i++) if ((await call("join", { body: {}, addr: "10.8.8.8" })).status === 200) joins++;
  assert.equal(joins, 100);
});

test("nothing is logged", async () => {
  const seen = [];
  const orig = { log: console.log, error: console.error, warn: console.warn };
  console.log = console.error = console.warn = (...a) => seen.push(a.join(" "));
  try {
    const a = await join();
    await call("checkin", { auth: a, body: status() });
    await call("checkin", { auth: a, body: "{bad" });
  } finally { Object.assign(console, orig); }
  assert.deepEqual(seen, []);
});

test("the Netlify function answers through the adapter", async () => {
  const r = await handler({ httpMethod: "POST", rawUrl: "https://example.test/api/friends?kind=join", headers: { "content-type": "application/json" }, body: "{}" }, {});
  assert.equal(r.statusCode, 200);
  const body = JSON.parse(r.isBase64Encoded ? Buffer.from(r.body, "base64").toString("utf8") : r.body);
  assert.match(body.friendId, /^f_/);
});

// ---------- cheers ----------
const friendsOf = async (who, date = "2026-10-07") => (await call("friends", { method: "GET", auth: who, query: `&date=${date}`, now: new Date(`${date}T16:00:00Z`) })).body;

test("a friend's 30-day streak can be cheered once; they see who cheered it next time they look", async () => {
  const a = await join(), b = await join();
  await pair(a, b);
  await call("checkin", { auth: a, body: status({ nick: "maya" }) });
  await call("checkin", { auth: b, body: status({ nick: "sam", streak: 30 }) });
  const seen = (await friendsOf(a)).friends[0];
  assert.deepEqual(seen.cheer, [{ kind: "streak", n: 30, cheered: false }]);
  const r = await call("cheer", { auth: a, body: { friendId: b.friendId, kind: "streak", n: 30, date: "2026-10-07" } });
  assert.equal(r.status, 200);
  assert.deepEqual((await friendsOf(a)).friends[0].cheer, [{ kind: "streak", n: 30, cheered: true }]);
  // once per friend per milestone: a second tap changes nothing
  const again = await call("cheer", { auth: a, body: { friendId: b.friendId, kind: "streak", n: 30, date: "2026-10-07" } });
  assert.equal(again.status, 200);
  assert.equal(again.body.already, true);
  const mine = await friendsOf(b);
  assert.deepEqual(mine.cheers, [{ nick: "maya", kind: "streak", n: 30, on: "2026-10-07" }]);
});

test("only a milestone reached in the last few days, and only a friend's, can be cheered", async () => {
  const a = await join(), b = await join(), stranger = await join();
  await pair(a, b);
  await call("checkin", { auth: b, body: status({ streak: 12 }) }); // 12: past 7 by five days, not yet 14
  assert.deepEqual((await friendsOf(a)).friends[0].cheer, []);
  assert.equal((await call("cheer", { auth: a, body: { friendId: b.friendId, kind: "streak", n: 7 } })).status, 409);
  assert.equal((await call("cheer", { auth: a, body: { friendId: b.friendId, kind: "streak", n: 12 } })).status, 409);
  await call("checkin", { auth: stranger, body: status({ streak: 30 }) });
  assert.equal((await call("cheer", { auth: a, body: { friendId: stranger.friendId, kind: "streak", n: 30 } })).status, 404);
  assert.equal((await call("cheer", { body: { friendId: b.friendId, kind: "streak", n: 7 } })).status, 401);
  // milestones: the app's own streak milestones; the day after still counts, two days after doesn't
  assert.deepEqual([...CHEER_STREAKS], [3, 7, 14, 30, 50, 100, 365]);
  const st = (streak, date = "2026-10-07") => ({ status: { date, streak } });
  assert.deepEqual(cheerable(st(15), "2026-10-07"), [{ kind: "streak", n: 14 }]);
  assert.deepEqual(cheerable(st(16), "2026-10-07"), []);
  assert.deepEqual(cheerable(st(30, "2026-10-01"), "2026-10-07"), [], "an old check-in isn't a streak now");
});

test("a cheer has no text: anything but the fixed fields is refused", async () => {
  const a = await join(), b = await join();
  await pair(a, b);
  await call("checkin", { auth: b, body: status({ streak: 7 }) });
  const base = { friendId: b.friendId, kind: "streak", n: 7 };
  assert.equal((await call("cheer", { auth: a, body: { ...base, message: "go you!" } })).status, 400);
  assert.equal((await call("cheer", { auth: a, body: { ...base, kind: "hug" } })).status, 400);
  assert.equal((await call("cheer", { auth: a, body: { ...base, n: "7" } })).status, 400);
  assert.equal((await call("cheer", { auth: a, body: { ...base, friendId: "../me" } })).status, 400);
  assert.equal((await call("cheer", { auth: a, body: base })).status, 200);
});

test("a finished season quest is cheered by count only, never by name", async () => {
  const a = await join(), b = await join();
  await pair(a, b);
  await call("checkin", { auth: b, body: status({ quests: 0, date: "2026-10-06" }), now: new Date("2026-10-06T16:00:00Z") });
  await call("checkin", { auth: b, body: status({ quests: 1 }) });
  assert.equal((await call("checkin", { auth: b, body: status({ quests: "lent-2027" }) })).status, 400);
  const seen = (await friendsOf(a)).friends[0];
  assert.deepEqual(seen.cheer.filter((c) => c.kind === "quest"), [{ kind: "quest", n: 1, cheered: false }]);
  assert.equal((await call("cheer", { auth: a, body: { friendId: b.friendId, kind: "quest", n: 1 } })).status, 200);
  assert.deepEqual((await friendsOf(b)).cheers.map((c) => c.kind), ["quest"]);
  // a week later the quest is old news: nothing to cheer
  const later = (await friendsOf(a, "2026-10-14")).friends[0];
  assert.deepEqual(later.cheer.filter((c) => c.kind === "quest"), []);
});

test("cheers go when the friendship does", async () => {
  const a = await join(), b = await join();
  await pair(a, b);
  await call("checkin", { auth: b, body: status({ streak: 7 }) });
  await call("cheer", { auth: a, body: { friendId: b.friendId, kind: "streak", n: 7 } });
  assert.equal((await friendsOf(b)).cheers.length, 1);
  await call("remove", { auth: a, body: { friendId: b.friendId } });
  assert.deepEqual((await friendsOf(b)).cheers, []);
});
