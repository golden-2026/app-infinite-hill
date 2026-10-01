// Friends: the small shared piece behind friend streaks and the friends-only weekly board.
// GET/POST /api/friends?kind=join|invite|accept|checkin|friends|cheer|leave|remove
//   join     POST            → { friendId, token }: an anonymous friend identity. No email, no account. Only a hash
//                              of the token is stored; the phone keeps the token.
//   invite   POST (auth)     → { code, expires }: a random single-use code (about 7 days) that rides on a lantern link.
//   accept   POST (auth)     { code } → both people become friends (a mutual edge).
//   checkin  POST (auth)     { date, doneToday, streak, golden, weekLight, nick, board, quests } → today's status.
//                              quests is only a count of season quests finished (never which one: a quest names a
//                              tradition's season).
//   friends  GET  (auth)     ?date=YYYY-MM-DD → each friend's nickname, streak, today, golden, weekly light (board
//                              members only), last seen, the shared friend streak, and the milestone you can cheer;
//                              plus the cheers your friends sent you in the last two weeks.
//   cheer    POST (auth)     { friendId, kind: "streak"|"quest", n, date } → one fixed cheer for a friend's milestone
//                              they reached in the last few days. No text at all (nothing to moderate). Once per
//                              friend per milestone.
//   remove   POST (auth)     { friendId } → un-friend, both sides.   leave POST (auth) → delete me everywhere.
// What is stored per person: a nickname they chose, the numbers above, which dates had a lesson (or a rest day, as
// inferred from their own streak surviving a gap), their friend list, how many season quests they finished (a count),
// and cheers: which friend cheered which milestone and when, and which ones they cheered. Never a door, an answer, a journal line, a
// mood or anything about belief — the request is refused if it carries anything else. Nothing is ever logged.
// Storage: Netlify Blobs in production (netlify/_shared/friends-store.js); a Map in tests and local development.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const MAX_FRIENDS = 30;
export const INVITE_DAYS = 7;
const MAX_BODY_BYTES = 2 * 1024;
const HISTORY_DAYS = 400;
const NICK_MAX = 24;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ID_RE = /^f_[a-f0-9]{24}$/;
const CODE_RE = /^[a-z2-9]{10}$/;
const LIMIT = { perMinute: 60, joinsPerHour: 10, invitesPerDay: 40, cheersPerHour: 60 };
/** The streak lengths worth a cheer (the app's own streak milestones, @ih/domain STREAK_MILESTONES). */
export const CHEER_STREAKS = Object.freeze([3, 7, 14, 30, 50, 100, 365]);
/** A milestone can be cheered on the day it's reached and the day after; cheers show for two weeks. */
export const CHEER_DAYS = 2;
const CHEERS_SHOWN_DAYS = 14;

// ---------- storage ----------
function memoryStore() {
  const map = new Map();
  return {
    async get(key) { return map.has(key) ? structuredClone(map.get(key)) : null; },
    async set(key, value) { map.set(key, structuredClone(value)); },
    async delete(key) { map.delete(key); },
  };
}
let store = memoryStore();
/** Swap the storage: get(key) → object|null, set(key, object), delete(key). No argument: a fresh Map (tests). */
export function useFriendsStore(next) { store = next || memoryStore(); }

// ---------- small helpers ----------
const sha = (s) => createHash("sha256").update(s).digest("hex");
const isObject = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const onlyKeys = (v, allowed) => Object.keys(v).every((k) => allowed.includes(k));
const addDays = (date, n) => { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
/** The Monday that starts the week holding `date` (the board resets every Monday, in each person's own dates). */
export const mondayOf = (date) => addDays(date, -((new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7));
const validDate = (s) => typeof s === "string" && DATE_RE.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`));
/** A local date must be within a day and a half of the server's clock (every time zone fits; replays don't). */
const plausible = (date, now) => validDate(date) && Math.abs(Date.parse(`${date}T12:00:00Z`) - now.getTime()) <= 50 * 3_600_000;
function cleanNick(v) {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001F\u007F<>{}​-‏‪-‮⁦-⁩]/g, "").replace(/\s+/g, " ").trim().slice(0, NICK_MAX).trim();
  return s || null;
}
const CODE_CHARS = "abcdefghjkmnpqrstuvwxyz23456789";
const newCode = () => [...randomBytes(10)].map((b) => CODE_CHARS[b % CODE_CHARS.length]).join("");

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.end(JSON.stringify(payload));
}
const fail = (statusCode) => Object.assign(new Error("bad request"), { statusCode });

async function readBody(req) {
  let raw;
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) raw = req.body.toString("utf8");
    else if (typeof req.body === "string") raw = req.body;
    else if (isObject(req.body)) raw = JSON.stringify(req.body);
    else throw fail(400);
  } else {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += b.byteLength;
      if (size > MAX_BODY_BYTES) throw fail(413);
      chunks.push(b);
    }
    raw = Buffer.concat(chunks).toString("utf8");
  }
  if (Buffer.byteLength(raw || "") > MAX_BODY_BYTES) throw fail(413);
  if (!raw) return {};
  try { const v = JSON.parse(raw); if (!isObject(v)) throw 0; return v; } catch { throw fail(400); }
}

function query(req) {
  try { return new URL(req.url || "/", "http://localhost").searchParams; } catch { return new URLSearchParams(); }
}

function clientAddress(req) {
  const h = req.headers || {};
  const direct = h["x-nf-client-connection-ip"] || h["x-real-ip"];
  const forwarded = typeof h["x-forwarded-for"] === "string" ? h["x-forwarded-for"].split(",")[0] : "";
  return String(direct || forwarded || "unknown").trim().slice(0, 64);
}

/** Counts per connection (a one-way code that changes every hour), so nobody can hammer the store. Fails open. */
async function allowed(req, bucket, limit, now) {
  try {
    const hour = now.toISOString().slice(0, 13);
    const who = sha(`friends|${process.env.FRIENDS_SALT || "ih"}|${hour}|${clientAddress(req)}`).slice(0, 24);
    const slot = bucket === "minute" ? now.toISOString().slice(0, 16) : hour;
    const key = `rate/${bucket}/${slot}/${who}`;
    const doc = (await store.get(key)) || { n: 0 };
    if (doc.n >= limit) return false;
    await store.set(key, { n: doc.n + 1 });
    return true;
  } catch {
    return true;
  }
}

/** "Authorization: Friend f_…:token". Returns the person's record, or null. Constant-time token check. */
async function authed(req) {
  const h = String(req.headers?.authorization || "");
  const m = /^Friend (f_[a-f0-9]{24}):([a-f0-9]{64})$/.exec(h);
  if (!m) return null;
  const me = await store.get(`me/${m[1]}`);
  if (!me?.tokenHash) return null;
  const a = Buffer.from(me.tokenHash, "hex");
  const b = Buffer.from(sha(m[2]), "hex");
  return a.length === b.length && timingSafeEqual(a, b) ? { id: m[1], ...me } : null;
}
/** Circles (api/circles.js) sign people in with the same anonymous friend identity: { id, nick } or null. */
export async function friendFromRequest(req) {
  try { const me = await authed(req); return me ? { id: me.id, nick: me.nick || null } : null; } catch { return null; }
}
const save = (id, me) => { const { id: _drop, ...rest } = me; return store.set(`me/${id}`, rest); };

// ---------- the shared friend streak ----------
/**
 * Consecutive dates on which BOTH friends finished a lesson, counted back from `today`. A date where one or both
 * spent a rest day (their own streak survived the gap) holds the shared streak: it neither adds nor breaks it.
 * Today, while either one hasn't finished yet, is still open and never breaks it.
 */
export function friendStreak(a, b, today) {
  const ha = a?.days || {};
  const hb = b?.days || {};
  let n = 0;
  for (let k = 0; k < HISTORY_DAYS; k++) {
    const d = addDays(today, -k);
    const x = ha[d], y = hb[d];
    if (x === "L" && y === "L") { n++; continue; }
    if (k === 0) continue; // today still open
    if ((x === "L" || x === "R") && (y === "L" || y === "R")) continue; // a rest day on either side holds it
    break;
  }
  return n;
}

/** Record a check-in into the person's day history: today's lesson, and any gap their own streak survived (rest). */
function remember(me, c) {
  const days = { ...(me.days || {}) };
  const lastLesson = Object.keys(days).filter((d) => days[d] === "L" && d < c.date).sort().pop() || null;
  if (c.doneToday) days[c.date] = "L";
  // their streak is still alive today, so the dates since their last lesson (before today) were rest days
  const survived = c.doneToday ? c.streak > 1 : c.streak > 0; // a streak of 1 on a lesson day is a fresh start, not a survivor
  if (lastLesson && survived) {
    for (let d = addDays(lastLesson, 1); d < c.date && daysBetween(lastLesson, d) <= 10; d = addDays(d, 1)) if (!days[d]) days[d] = "R";
  }
  const cutoff = addDays(c.date, -HISTORY_DAYS);
  for (const d of Object.keys(days)) if (d < cutoff) delete days[d];
  return days;
}

// ---------- the requests ----------
function readCheckin(v, now) {
  if (!isObject(v) || !onlyKeys(v, ["date", "doneToday", "streak", "golden", "weekLight", "nick", "board", "quests"])) return null;
  if (v.quests !== undefined && (!Number.isInteger(v.quests) || v.quests < 0 || v.quests > 1000)) return null;
  if (!plausible(v.date, now) || typeof v.doneToday !== "boolean" || typeof v.golden !== "boolean") return null;
  if (!Number.isInteger(v.streak) || v.streak < 0 || v.streak > 20_000) return null;
  if (!Number.isInteger(v.weekLight) || v.weekLight < 0 || v.weekLight > 10_000) return null;
  if (v.board !== undefined && typeof v.board !== "boolean") return null;
  const nick = v.nick === undefined || v.nick === null ? null : cleanNick(v.nick);
  if (v.nick !== undefined && v.nick !== null && !nick) return null;
  return { date: v.date, doneToday: v.doneToday, streak: v.streak, golden: v.golden, weekLight: v.weekLight, nick, board: v.board, quests: v.quests };
}

/**
 * What a friend has reached lately that can be cheered: a streak milestone (reached in the last CHEER_DAYS days, and
 * still going) and a season quest they finished in that time. Only their own numbers decide it.
 */
export function cheerable(f, today) {
  const out = [];
  const st = f.status || null;
  if (st?.date && daysBetween(st.date, today) <= 1) {
    // the streak on the day they last checked in; the milestone is the largest one it passed at most CHEER_DAYS ago
    const m = [...CHEER_STREAKS].reverse().find((x) => st.streak >= x);
    if (m && st.streak - m < CHEER_DAYS) out.push({ kind: "streak", n: m });
  }
  if (f.quests > 0 && f.questAt && daysBetween(f.questAt, today) < CHEER_DAYS && daysBetween(f.questAt, today) >= -1) out.push({ kind: "quest", n: f.quests });
  return out;
}
const cheerKey = (friendId, c) => `${friendId}|${c.kind}:${c.n}`;

function view(me, f, today) {
  const st = f.status || null;
  const date = st?.date || null;
  const stale = !f.seen || daysBetween(f.seen.slice(0, 10), today) >= 7;
  const thisWeek = !!date && mondayOf(date) === mondayOf(today);
  const current = !!date && daysBetween(date, today) <= 1;
  return {
    id: f.id,
    nick: f.nick || "a friend",
    streak: current ? st.streak : 0,
    doneToday: !!st && date === today && st.doneToday,
    golden: current ? !!st.golden : false,
    together: friendStreak(me, f, today),
    onBoard: !!f.board,
    weekLight: me.board && f.board && thisWeek ? st.weekLight : null,
    lastSeen: f.seen ? f.seen.slice(0, 10) : null,
    faded: stale,
    cheer: stale ? [] : cheerable(f, today).map((c) => ({ ...c, cheered: (me.cheered || []).includes(cheerKey(f.id, c)) })),
  };
}

export default async function friends(req, res, { now = new Date() } = {}) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const q = query(req);
  const kind = q.get("kind");
  const KINDS = { join: "POST", invite: "POST", accept: "POST", checkin: "POST", friends: "GET", cheer: "POST", leave: "POST", remove: "POST" };
  if (!kind || !Object.hasOwn(KINDS, kind)) return json(res, 400, { error: "Unknown friends request" });
  if (req.method !== KINDS[kind]) {
    res.setHeader("Allow", KINDS[kind]);
    return json(res, 405, { error: "Method not allowed" });
  }
  if (!(await allowed(req, "minute", LIMIT.perMinute, now))) return json(res, 429, { error: "Slow down" });

  let body = {};
  if (req.method === "POST") {
    const type = String(req.headers?.["content-type"] || "").split(";")[0].trim().toLowerCase();
    if (type !== "application/json") return json(res, 415, { error: "Expected JSON request" });
    try { body = await readBody(req); } catch (e) { return json(res, e.statusCode || 400, { error: e.statusCode === 413 ? "Request body too large" : "Invalid friends request" }); }
  }

  try {
    if (kind === "join") {
      if (Object.keys(body).length) return json(res, 400, { error: "Invalid friends request" });
      if (!(await allowed(req, "join", LIMIT.joinsPerHour, now))) return json(res, 429, { error: "Slow down" });
      const friendId = `f_${randomBytes(12).toString("hex")}`;
      const token = randomBytes(32).toString("hex");
      await store.set(`me/${friendId}`, { tokenHash: sha(token), nick: null, friends: [], days: {}, status: null, board: false, seen: now.toISOString(), invites: [] });
      return json(res, 200, { friendId, token });
    }

    const me = await authed(req);
    if (!me) return json(res, 401, { error: "Not signed in to friends" });

    if (kind === "invite") {
      if (Object.keys(body).length) return json(res, 400, { error: "Invalid friends request" });
      if (!(await allowed(req, "invite", LIMIT.invitesPerDay, now))) return json(res, 429, { error: "Slow down" });
      const code = newCode();
      const expires = new Date(now.getTime() + INVITE_DAYS * 86_400_000).toISOString();
      await store.set(`invite/${code}`, { from: me.id, expires });
      // keep only this person's recent codes, so leaving can take them all down
      me.invites = [...(me.invites || []), code].slice(-20);
      await save(me.id, me);
      return json(res, 200, { code, expires });
    }

    if (kind === "accept") {
      if (!onlyKeys(body, ["code"]) || typeof body.code !== "string" || !CODE_RE.test(body.code)) return json(res, 400, { error: "Invalid friends request" });
      const inv = await store.get(`invite/${body.code}`);
      if (!inv || Date.parse(inv.expires) < now.getTime()) {
        if (inv) await store.delete(`invite/${body.code}`);
        return json(res, 404, { error: "That invite has expired" });
      }
      if (inv.from === me.id) return json(res, 400, { error: "That's your own invite" });
      const them = await store.get(`me/${inv.from}`);
      if (!them) { await store.delete(`invite/${body.code}`); return json(res, 404, { error: "That invite has expired" }); }
      const mine = new Set(me.friends || []);
      const theirs = new Set(them.friends || []);
      if (!mine.has(inv.from) && (mine.size >= MAX_FRIENDS || theirs.size >= MAX_FRIENDS)) return json(res, 409, { error: "Friend list is full" });
      mine.add(inv.from);
      theirs.add(me.id);
      await store.delete(`invite/${body.code}`); // single use
      await save(me.id, { ...me, friends: [...mine] });
      await store.set(`me/${inv.from}`, { ...them, friends: [...theirs] });
      return json(res, 200, { ok: true, friend: { id: inv.from, nick: them.nick || "a friend" } });
    }

    if (kind === "checkin") {
      const c = readCheckin(body, now);
      if (!c) return json(res, 400, { error: "Invalid friends request" });
      const next = { ...me, status: { date: c.date, doneToday: c.doneToday, streak: c.streak, golden: c.golden, weekLight: c.weekLight }, days: remember(me, c), seen: now.toISOString() };
      if (c.nick) next.nick = c.nick;
      if (c.board !== undefined) next.board = c.board;
      if (c.quests !== undefined) {
        if (c.quests > (me.quests || 0)) next.questAt = c.date; // a quest finished since the last check-in
        next.quests = c.quests;
      }
      await save(me.id, next);
      return json(res, 200, { ok: true });
    }

    if (kind === "friends") {
      const date = q.get("date");
      const today = date && plausible(date, now) ? date : me.status?.date || now.toISOString().slice(0, 10);
      const list = [];
      for (const id of (me.friends || []).slice(0, MAX_FRIENDS)) {
        const f = await store.get(`me/${id}`);
        if (f) list.push(view(me, { id, ...f }, today));
      }
      // cheers sent to me lately, from people who are still my friends (their nickname as it is now)
      const since = addDays(today, -CHEERS_SHOWN_DAYS);
      const nicks = new Map(list.map((f) => [f.id, f.nick]));
      const cheers = (me.cheers || []).filter((c) => nicks.has(c.from) && c.at.slice(0, 10) >= since).reverse().slice(0, 5)
        .map((c) => ({ nick: nicks.get(c.from), kind: c.kind, n: c.n, on: c.at.slice(0, 10) }));
      return json(res, 200, { me: { nick: me.nick || null, board: !!me.board }, friends: list, cheers });
    }

    if (kind === "cheer") {
      const b = body;
      if (!onlyKeys(b, ["friendId", "kind", "n", "date"]) || typeof b.friendId !== "string" || !ID_RE.test(b.friendId) || !["streak", "quest"].includes(b.kind) || !Number.isInteger(b.n) || b.n < 1 || b.n > 20_000) return json(res, 400, { error: "Invalid friends request" });
      if (b.date !== undefined && !plausible(b.date, now)) return json(res, 400, { error: "Invalid friends request" });
      if (!(me.friends || []).includes(b.friendId)) return json(res, 404, { error: "Not a friend" });
      const them = await store.get(`me/${b.friendId}`);
      if (!them) return json(res, 404, { error: "Not a friend" });
      const today = b.date || me.status?.date || now.toISOString().slice(0, 10);
      const c = { kind: b.kind, n: b.n };
      // only what they've actually reached lately; anything else is refused
      if (!cheerable(them, today).some((x) => x.kind === c.kind && x.n === c.n)) return json(res, 409, { error: "Nothing to cheer" });
      const key = cheerKey(b.friendId, c);
      if ((me.cheered || []).includes(key)) return json(res, 200, { ok: true, already: true }); // once per friend per milestone
      if (!(await allowed(req, "cheer", LIMIT.cheersPerHour, now))) return json(res, 429, { error: "Slow down" });
      await store.set(`me/${b.friendId}`, { ...them, cheers: [...(them.cheers || []), { from: me.id, kind: c.kind, n: c.n, at: now.toISOString() }].slice(-30) });
      await save(me.id, { ...me, cheered: [...(me.cheered || []), key].slice(-300) });
      return json(res, 200, { ok: true });
    }

    if (kind === "remove") {
      if (!onlyKeys(body, ["friendId"]) || typeof body.friendId !== "string" || !ID_RE.test(body.friendId)) return json(res, 400, { error: "Invalid friends request" });
      await save(me.id, { ...me, friends: (me.friends || []).filter((x) => x !== body.friendId) });
      const them = await store.get(`me/${body.friendId}`);
      if (them) await store.set(`me/${body.friendId}`, { ...them, friends: (them.friends || []).filter((x) => x !== me.id), cheers: (them.cheers || []).filter((c) => c.from !== me.id) });
      return json(res, 200, { ok: true });
    }

    if (kind === "leave") {
      if (Object.keys(body).length) return json(res, 400, { error: "Invalid friends request" });
      for (const id of me.friends || []) {
        const them = await store.get(`me/${id}`);
        if (them) await store.set(`me/${id}`, { ...them, friends: (them.friends || []).filter((x) => x !== me.id), cheers: (them.cheers || []).filter((c) => c.from !== me.id) });
      }
      for (const code of me.invites || []) await store.delete(`invite/${code}`);
      await store.delete(`me/${me.id}`);
      return json(res, 200, { ok: true });
    }
  } catch {
    // Never log: bodies carry nicknames and tokens ride in headers.
    return json(res, 503, { error: "Friends are unavailable right now" });
  }
  return json(res, 400, { error: "Unknown friends request" });
}

