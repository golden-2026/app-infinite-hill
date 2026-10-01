// Circles: a teacher, pandit, rabbi, imam, priest, granthi or a temple/synagogue/mosque/church leader brings their
// people in as a group. People sign in with the same anonymous friend identity as api/friends.js (no email, no account).
// GET/POST /api/circles?kind=peek|create|join|mine|walked|show|note|leave|forget
//   peek    GET  ?code=XXXXXX   → { name, door, leaderName, welcome, count }: the join preview behind a share link. No sign-in.
//   create  POST (auth)  { name, door, leaderName, welcome?, note? } → the new circle (you lead it) with its short code.
//   join    POST (auth)  { code, nick?, family? } → the circle. nick: appear by this nickname (opt-in; otherwise you're
//                         only counted). family: a parent joining on the family's behalf (one membership).
//   mine    GET  (auth)  ?date=YYYY-MM-DD → your circles: name, leader, the leader's note, how many people, how many
//                         walked on that date, and the nicknames of members who chose to appear.
//   walked  POST (auth)  { date } → "I walked today": only the date is kept, in each of your circles.
//   show    POST (auth)  { circleId, nick } → appear by a nickname in that circle (nick null: counted only).
//   note    POST (auth)  { circleId, note } → the leader's one pinned note (text only, at most 280 characters; "" clears).
//   leave   POST (auth)  { circleId } → leave. When the leader leaves, the circle closes for everyone.
//   forget  POST (auth)  {} → leave every circle (used when someone leaves friends altogether).
// What is stored: per circle its id, short code, name, door, the leader's display name, welcome and note, and per member their
// pseudonymous friend id, a nickname only if they chose to appear, whether it's a family membership, and the date they
// last walked. Per person: which circles they're in. Never a lesson, an answer, a journal line, a mood or a Guide
// question. The leader sees exactly what members see (counts and opted-in nicknames), nothing more. Nothing is logged.
// Storage: Netlify Blobs in production (netlify/_shared/circles-store.js); a Map in tests and local development.
// A circle is one record changed with a conditional write (bump), so a whole congregation joining at once all count.
import { createHash, randomBytes } from "node:crypto";
import { friendFromRequest } from "./friends.js";

export const MAX_MEMBERS = 1000;
export const MAX_CIRCLES = 5; // circles one person can be in (leading counts)
export const NOTE_MAX = 280;
export const NAME_MAX = 48;
export const LEADER_MAX = 32;
const NICK_MAX = 24;
const MAX_BODY_BYTES = 4 * 1024;
export const DOORS = Object.freeze(["CHRISTIANITY", "CATHOLIC", "HINDUISM", "ISLAM", "JUDAISM", "BUDDHISM", "SIKHISM", "SPIRITUAL"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CID_RE = /^c_[a-f0-9]{16}$/;
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I, L, O, 0 or 1: easy to read out loud from a pulpit
export const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;
// joins and peeks are generous: a whole congregation on one church wifi shares one address
const LIMIT = { perMinute: 120, createsPerDay: 5, joinsPerHour: 300, peeksPerHour: 600, notesPerHour: 20 };

// ---------- storage ----------
function memoryStore() {
  const map = new Map();
  return {
    async get(key) { return map.has(key) ? structuredClone(map.get(key)) : null; },
    async set(key, value) { map.set(key, structuredClone(value)); },
    async delete(key) { map.delete(key); },
    /** Change one record in place: fn(current|null) → next, or null to delete it. */
    async bump(key, fn) {
      const next = fn(map.has(key) ? structuredClone(map.get(key)) : null);
      if (next === null) map.delete(key); else map.set(key, structuredClone(next));
      return next;
    },
  };
}
let store = memoryStore();
/** Swap the storage: get, set, delete, bump(key, fn). No argument: a fresh Map (tests). */
export function useCirclesStore(next) { store = next || memoryStore(); }

// ---------- small helpers ----------
const sha = (s) => createHash("sha256").update(s).digest("hex");
const isObject = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const onlyKeys = (v, allowed) => Object.keys(v).every((k) => allowed.includes(k));
const validDate = (s) => typeof s === "string" && DATE_RE.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`));
/** A local date must be within a day and a half of the server's clock (every time zone fits; replays don't). */
const plausible = (date, now) => validDate(date) && Math.abs(Date.parse(`${date}T12:00:00Z`) - now.getTime()) <= 50 * 3_600_000;
/** Plain text only: no control or direction-changing characters, no markup brackets, single spaces, trimmed. */
export function cleanText(v, max) {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001F\u007F<>{}​-‏‪-‮⁦-⁩]/g, "").replace(/\s+/g, " ").trim();
  return s ? [...s].slice(0, max).join("").trim() : "";
}
/** The note keeps its line breaks (at most two in a row); everything else as cleanText. */
function cleanNote(v) {
  if (typeof v !== "string") return null;
  const s = v.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F<>{}​-‏‪-‮⁦-⁩]/g, "")
    .split("\n").map((l) => l.replace(/\s+/g, " ").trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return s;
}
export const normalizeCode = (v) => (typeof v === "string" ? v.toUpperCase().replace(/[\s-]/g, "") : "");
const newCode = () => [...randomBytes(6)].map((b) => CODE_CHARS[b % CODE_CHARS.length]).join("");

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
    const who = sha(`circles|${process.env.FRIENDS_SALT || "ih"}|${hour}|${clientAddress(req)}`).slice(0, 24);
    const slot = bucket === "minute" ? now.toISOString().slice(0, 16) : bucket === "create" ? now.toISOString().slice(0, 10) : hour;
    const key = `rate/${bucket}/${slot}/${who}`;
    const doc = (await store.get(key)) || { n: 0 };
    if (doc.n >= limit) return false;
    await store.set(key, { n: doc.n + 1 });
    return true;
  } catch {
    return true;
  }
}

// ---------- what a member sees (the leader sees exactly the same) ----------
export function view(id, c, me, today) {
  const members = Object.entries(c.members || {});
  const mine = c.members?.[me] || null;
  return {
    id,
    code: c.code,
    name: c.name,
    door: c.door,
    leaderName: c.leaderName,
    welcome: c.welcome || null,
    isLeader: c.leader === me,
    note: c.note?.text || null,
    noteOn: c.note?.on || null,
    count: members.length,
    walkedToday: members.filter(([, m]) => m.l === today).length,
    // only members who chose to appear, by the nickname they chose; never their id
    members: members.filter(([, m]) => m.n).map(([fid, m]) => ({ nick: m.n, family: !!m.f, walked: m.l === today, me: fid === me }))
      .sort((a, b) => (a.me ? -1 : b.me ? 1 : a.nick.localeCompare(b.nick))),
    me: { nick: mine?.n || null, family: !!mine?.f },
  };
}

const myList = async (fid) => (await store.get(`mine/${fid}`))?.circles || [];
const setMyList = (fid, list) => (list.length ? store.set(`mine/${fid}`, { circles: list }) : store.delete(`mine/${fid}`));

/** Take one person out of one circle; the leader leaving closes it (and frees the code). */
async function leaveOne(fid, cid) {
  let closed = null;
  await store.bump(`circle/${cid}`, (c) => {
    if (!c) return null;
    if (c.leader === fid) { closed = c.code; return null; }
    if (c.members?.[fid]) delete c.members[fid];
    return c;
  });
  if (closed) await store.delete(`code/${closed}`);
}

export default async function circles(req, res, { now = new Date() } = {}) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const q = query(req);
  const kind = q.get("kind");
  const KINDS = { peek: "GET", create: "POST", join: "POST", mine: "GET", walked: "POST", show: "POST", note: "POST", leave: "POST", forget: "POST" };
  if (!kind || !Object.hasOwn(KINDS, kind)) return json(res, 400, { error: "Unknown circles request" });
  if (req.method !== KINDS[kind]) {
    res.setHeader("Allow", KINDS[kind]);
    return json(res, 405, { error: "Method not allowed" });
  }
  if (!(await allowed(req, "minute", LIMIT.perMinute, now))) return json(res, 429, { error: "Slow down" });

  let body = {};
  if (req.method === "POST") {
    const type = String(req.headers?.["content-type"] || "").split(";")[0].trim().toLowerCase();
    if (type !== "application/json") return json(res, 415, { error: "Expected JSON request" });
    try { body = await readBody(req); } catch (e) { return json(res, e.statusCode || 400, { error: e.statusCode === 413 ? "Request body too large" : "Invalid circles request" }); }
  }
  const bad = () => json(res, 400, { error: "Invalid circles request" });

  try {
    if (kind === "peek") {
      const code = normalizeCode(q.get("code"));
      if (!CODE_RE.test(code)) return bad();
      if (!(await allowed(req, "peek", LIMIT.peeksPerHour, now))) return json(res, 429, { error: "Slow down" });
      const ref = await store.get(`code/${code}`);
      const c = ref ? await store.get(`circle/${ref.id}`) : null;
      if (!c) return json(res, 404, { error: "No circle with that code" });
      return json(res, 200, { name: c.name, door: c.door, leaderName: c.leaderName, welcome: c.welcome || null, count: Object.keys(c.members || {}).length });
    }

    const me = await friendFromRequest(req);
    if (!me) return json(res, 401, { error: "Not signed in to friends" });
    const today = () => {
      const d = q.get("date") || body.date;
      return d && plausible(d, now) ? d : now.toISOString().slice(0, 10);
    };

    if (kind === "create") {
      if (!onlyKeys(body, ["name", "door", "leaderName", "welcome", "note"])) return bad();
      const name = cleanText(body.name, NAME_MAX);
      const leaderName = cleanText(body.leaderName, LEADER_MAX);
      const note = body.note === undefined || body.note === null ? "" : cleanNote(body.note);
      const welcome = body.welcome === undefined || body.welcome === null ? "" : cleanNote(body.welcome);
      if (!name || !leaderName || !DOORS.includes(body.door) || note === null || [...note].length > NOTE_MAX || welcome === null || [...welcome].length > NOTE_MAX) return bad();
      const list = await myList(me.id);
      if (list.length >= MAX_CIRCLES) return json(res, 409, { error: "Too many circles" });
      if (!(await allowed(req, "create", LIMIT.createsPerDay, now))) return json(res, 429, { error: "Slow down" });
      const id = `c_${randomBytes(8).toString("hex")}`;
      let code = null;
      for (let i = 0; i < 8 && !code; i++) { const c = newCode(); if (!(await store.get(`code/${c}`))) code = c; }
      if (!code) return json(res, 503, { error: "Circles are unavailable right now" });
      const doc = {
        name, door: body.door, leaderName, welcome: welcome || null, leader: me.id, code, created: now.toISOString(),
        note: note ? { text: note, on: now.toISOString().slice(0, 10) } : null,
        members: { [me.id]: { n: null, l: null, f: false } },
      };
      await store.set(`circle/${id}`, doc);
      await store.set(`code/${code}`, { id });
      await setMyList(me.id, [...list, id]);
      return json(res, 200, { circle: view(id, doc, me.id, today()) });
    }

    if (kind === "join") {
      if (!onlyKeys(body, ["code", "nick", "family"])) return bad();
      const code = normalizeCode(body.code);
      const nick = body.nick === undefined || body.nick === null ? null : cleanText(body.nick, NICK_MAX);
      if (!CODE_RE.test(code) || (body.nick != null && !nick) || (body.family !== undefined && typeof body.family !== "boolean")) return bad();
      if (!(await allowed(req, "join", LIMIT.joinsPerHour, now))) return json(res, 429, { error: "Slow down" });
      const ref = await store.get(`code/${code}`);
      if (!ref) return json(res, 404, { error: "No circle with that code" });
      const list = await myList(me.id);
      if (!list.includes(ref.id) && list.length >= MAX_CIRCLES) return json(res, 409, { error: "Too many circles" });
      let full = false;
      const doc = await store.bump(`circle/${ref.id}`, (c) => {
        if (!c) return null;
        const members = c.members || {};
        if (!members[me.id] && Object.keys(members).length >= MAX_MEMBERS) { full = true; return c; }
        members[me.id] = { n: nick, l: members[me.id]?.l || null, f: !!body.family };
        return { ...c, members };
      });
      if (!doc) { await store.delete(`code/${code}`); return json(res, 404, { error: "No circle with that code" }); }
      if (full) return json(res, 409, { error: "That circle is full" });
      if (!list.includes(ref.id)) await setMyList(me.id, [...list, ref.id]);
      return json(res, 200, { circle: view(ref.id, doc, me.id, today()) });
    }

    if (kind === "mine") {
      const date = today();
      const list = await myList(me.id);
      const out = [];
      const keep = [];
      for (const id of list) {
        const c = await store.get(`circle/${id}`);
        if (!c || !c.members?.[me.id]) continue; // closed by its leader, or no longer a member
        keep.push(id);
        out.push(view(id, c, me.id, date));
      }
      if (keep.length !== list.length) await setMyList(me.id, keep);
      return json(res, 200, { circles: out });
    }

    if (kind === "walked") {
      if (!onlyKeys(body, ["date"]) || !plausible(body.date, now)) return bad();
      for (const id of await myList(me.id)) {
        await store.bump(`circle/${id}`, (c) => {
          if (!c) return null;
          const m = c.members?.[me.id];
          if (m && (!m.l || m.l < body.date)) m.l = body.date;
          return c;
        });
      }
      return json(res, 200, { ok: true });
    }

    if (kind === "show" || kind === "note" || kind === "leave") {
      const keys = kind === "show" ? ["circleId", "nick"] : kind === "note" ? ["circleId", "note"] : ["circleId"];
      if (!onlyKeys(body, keys) || typeof body.circleId !== "string" || !CID_RE.test(body.circleId)) return bad();
      if (!(await myList(me.id)).includes(body.circleId)) return json(res, 404, { error: "Not in that circle" });

      if (kind === "leave") {
        await leaveOne(me.id, body.circleId);
        await setMyList(me.id, (await myList(me.id)).filter((x) => x !== body.circleId));
        return json(res, 200, { ok: true });
      }

      if (kind === "show") {
        const nick = body.nick === null ? null : cleanText(body.nick, NICK_MAX);
        if (nick === "" || (body.nick !== null && nick === null)) return bad();
        let found = false;
        await store.bump(`circle/${body.circleId}`, (c) => {
          if (!c) return null;
          if (c.members?.[me.id]) { c.members[me.id].n = nick; found = true; }
          return c;
        });
        return found ? json(res, 200, { ok: true }) : json(res, 404, { error: "Not in that circle" });
      }

      // note: the leader's one pinned note, text only
      const note = cleanNote(body.note);
      if (note === null || [...note].length > NOTE_MAX) return bad();
      if (!(await allowed(req, "note", LIMIT.notesPerHour, now))) return json(res, 429, { error: "Slow down" });
      let status = 200;
      await store.bump(`circle/${body.circleId}`, (c) => {
        if (!c) { status = 404; return null; }
        if (c.leader !== me.id) { status = 403; return c; }
        c.note = note ? { text: note, on: today() } : null;
        return c;
      });
      return status === 200 ? json(res, 200, { ok: true }) : json(res, status, { error: status === 403 ? "Only the leader can post the note" : "Not in that circle" });
    }

    if (kind === "forget") {
      if (Object.keys(body).length) return bad();
      for (const id of await myList(me.id)) await leaveOne(me.id, id);
      await store.delete(`mine/${me.id}`);
      return json(res, 200, { ok: true });
    }
  } catch {
    // Never log: bodies carry nicknames and notes, and tokens ride in headers.
    return json(res, 503, { error: "Circles are unavailable right now" });
  }
  return json(res, 400, { error: "Unknown circles request" });
}
