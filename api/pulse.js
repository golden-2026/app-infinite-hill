// Pulse: anonymous return counts. The only question it answers is "of the people who first opened the app on a given
// day, how many came back one, seven and thirty days later?", plus how many lessons were finished each day.
//
//   POST /api/pulse            { cohortDate, daysSince, event, variant? } → 204
//        cohortDate  the phone's own local date of its first open (YYYY-MM-DD)
//        daysSince   whole days from cohortDate to today on that phone (0 on the first day)
//        event       "first" (the very first open, daysSince 0) | "open" (the first open of a later day) | "lesson"
//        variant     optional short label for comparing two versions later (e.g. "finish-b"); nothing by default
//   GET  /api/pulse?from=YYYY-MM-DD&to=YYYY-MM-DD   (Authorization: Bearer <PULSE_READ_KEY>) → the counts as JSON
//
// What is stored: counters only. Per cohort day: how many first opens, and how many opens on day 1…30 after it. Per
// calendar day: first opens, opens, lessons finished. Each per variant. There is no identifier of any kind in the
// request or in storage: no install id, no account, no door or religion, no lesson, no Guide text. The IP address and
// user agent are never read and never stored. Nothing is logged. The phone decides "already pinged today" itself.
// Storage: Netlify Blobs in production (netlify/_shared/pulse-store.js); a Map in tests and local development.
import { timingSafeEqual } from "node:crypto";

export const EVENTS = Object.freeze(["first", "open", "lesson"]);
/** Return days kept per cohort (the report shows 1, 7 and 30). */
export const BACK_DAYS = 30;
export const MAX_VARIANTS = 12;
const NO_VARIANT = "-";
const MAX_BODY_BYTES = 512;
const MAX_DAYS_SINCE = 3650;
const EARLIEST = "2026-01-01";
const READ_MAX_DAYS = 120;
const READ_DEFAULT_DAYS = 45;
const PER_MINUTE = 1200; // per running instance, across everyone (no per-person counting: there is no person)
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VARIANT_RE = /^[a-z0-9][a-z0-9-]{0,23}$/;

// ---------- storage ----------
/** get(key) → object|null; bump(key, fn): read, change, write (retrying when someone else wrote in between). */
export function memoryPulseStore() {
  const map = new Map();
  return {
    async get(key) { return map.has(key) ? structuredClone(map.get(key)) : null; },
    async bump(key, fn) { map.set(key, fn(map.has(key) ? structuredClone(map.get(key)) : null)); },
  };
}
let store = memoryPulseStore();
/** Swap the storage. No argument: a fresh Map (tests). */
export function usePulseStore(next) { store = next || memoryPulseStore(); }

// ---------- helpers ----------
const isObject = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const validDate = (s) => typeof s === "string" && DATE_RE.test(s) && !Number.isNaN(Date.parse(`${s}T12:00:00Z`)) && new Date(`${s}T12:00:00Z`).toISOString().slice(0, 10) === s;
export const addDays = (date, n) => { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
/** A phone's local date is within a day and a half of the server's clock (every time zone fits; old replays don't). */
const plausible = (date, now) => Math.abs(Date.parse(`${date}T12:00:00Z`) - now.getTime()) <= 50 * 3_600_000;

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  if (payload === undefined) return res.end();
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
  try { const v = JSON.parse(raw); if (!isObject(v)) throw 0; return v; } catch { throw fail(400); }
}

function query(req) {
  try { return new URL(req.url || "/", "http://localhost").searchParams; } catch { return new URLSearchParams(); }
}

// A rough brake against flooding, kept in this instance's memory only. It counts requests, not people.
let minute = { slot: "", n: 0 };
function underLimit(now) {
  const slot = now.toISOString().slice(0, 16);
  if (minute.slot !== slot) minute = { slot, n: 0 };
  minute.n += 1;
  return minute.n <= PER_MINUTE;
}
/** Tests: start the per-minute brake from zero. */
export function resetPulseLimit() { minute = { slot: "", n: 0 }; }

/** The ping, checked: only these four fields, each in range, and dated today somewhere on Earth. */
export function cleanPing(body, now) {
  if (!isObject(body)) return null;
  const allowed = ["cohortDate", "daysSince", "event", "variant"];
  if (!Object.keys(body).every((k) => allowed.includes(k))) return null;
  const { cohortDate, daysSince, event } = body;
  if (!validDate(cohortDate) || cohortDate < EARLIEST) return null;
  if (!Number.isInteger(daysSince) || daysSince < 0 || daysSince > MAX_DAYS_SINCE) return null;
  if (!EVENTS.includes(event)) return null;
  if (event === "first" && daysSince !== 0) return null;
  if (event === "open" && daysSince === 0) return null; // day 0's open is the "first" ping
  let variant = NO_VARIANT;
  if (body.variant !== undefined && body.variant !== null) {
    if (typeof body.variant !== "string" || !VARIANT_RE.test(body.variant)) return null;
    variant = body.variant;
  }
  const date = addDays(cohortDate, daysSince);
  if (!plausible(date, now)) return null;
  return { cohortDate, daysSince, event, variant, date };
}

const inc = (o, k) => { o[k] = (o[k] || 0) + 1; };

/** Count one ping. Only counters change; the ping itself is not kept. */
export async function countPing(p) {
  if (p.variant !== NO_VARIANT) {
    const known = (await store.get("variants"))?.list || [];
    if (!known.includes(p.variant)) {
      if (known.length >= MAX_VARIANTS) throw fail(400);
      await store.bump("variants", (doc) => {
        const list = doc?.list || [];
        return { list: list.includes(p.variant) || list.length >= MAX_VARIANTS ? list : [...list, p.variant] };
      });
    }
  }
  const dayKey = `day/${p.variant}/${p.date}`;
  if (p.event === "first") {
    await store.bump(`cohort/${p.variant}/${p.cohortDate}`, (doc) => { const d = doc || { installs: 0, back: {} }; inc(d, "installs"); return d; });
    await store.bump(dayKey, (doc) => { const d = doc || {}; inc(d, "first"); inc(d, "opens"); return d; });
  } else if (p.event === "open") {
    if (p.daysSince <= BACK_DAYS) {
      await store.bump(`cohort/${p.variant}/${p.cohortDate}`, (doc) => { const d = doc || { installs: 0, back: {} }; d.back = d.back || {}; inc(d.back, String(p.daysSince)); return d; });
    }
    await store.bump(dayKey, (doc) => { const d = doc || {}; inc(d, "opens"); return d; });
  } else {
    await store.bump(dayKey, (doc) => { const d = doc || {}; inc(d, "lessons"); return d; });
  }
}

/** The owner's read: every cohort and every day in [from, to], per variant. */
export async function readCounts({ from, to }) {
  const variants = [NO_VARIANT, ...((await store.get("variants"))?.list || [])];
  const cohorts = [];
  const days = [];
  for (const v of variants) {
    for (let date = from; date <= to; date = addDays(date, 1)) {
      const c = await store.get(`cohort/${v}/${date}`);
      if (c) cohorts.push({ date, variant: v === NO_VARIANT ? null : v, installs: c.installs || 0, back: c.back || {} });
      const d = await store.get(`day/${v}/${date}`);
      if (d) days.push({ date, variant: v === NO_VARIANT ? null : v, first: d.first || 0, opens: d.opens || 0, lessons: d.lessons || 0 });
    }
  }
  return { from, to, cohorts, days };
}

function readKeyMatches(header) {
  const want = process.env.PULSE_READ_KEY;
  const m = /^Bearer (.{16,256})$/.exec(String(header || ""));
  if (!want || !m) return false;
  const a = Buffer.from(m[1]);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function pulse(req, res, { now = new Date() } = {}) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "GET") {
    // Reading is off unless the owner set PULSE_READ_KEY on the server. The key never goes in the app.
    if (!process.env.PULSE_READ_KEY || String(process.env.PULSE_READ_KEY).length < 16) return json(res, 404, { error: "Not found" });
    if (!readKeyMatches(req.headers?.authorization)) return json(res, 401, { error: "Not allowed" });
    const q = query(req);
    const today = now.toISOString().slice(0, 10);
    const to = q.get("to") || today;
    const from = q.get("from") || addDays(to, -(READ_DEFAULT_DAYS - 1));
    if (!validDate(from) || !validDate(to) || from > to || daysBetween(from, to) >= READ_MAX_DAYS) return json(res, 400, { error: `Pick a range of at most ${READ_MAX_DAYS} days` });
    try { return json(res, 200, await readCounts({ from, to })); } catch { return json(res, 500, { error: "Could not read the counts" }); }
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Method not allowed" });
  }
  if (!underLimit(now)) return json(res, 429, { error: "Slow down" });
  const type = String(req.headers?.["content-type"] || "").split(";")[0].trim().toLowerCase();
  if (type !== "application/json") return json(res, 415, { error: "Expected JSON request" });
  let body;
  try { body = await readBody(req); } catch (e) { return json(res, e.statusCode || 400, { error: "Invalid ping" }); }
  const p = cleanPing(body, now);
  if (!p) return json(res, 400, { error: "Invalid ping" });
  try {
    await countPing(p);
  } catch (e) {
    return json(res, e.statusCode === 400 ? 400 : 500, { error: e.statusCode === 400 ? "Invalid ping" : "Could not count" });
  }
  return json(res, 204);
}
