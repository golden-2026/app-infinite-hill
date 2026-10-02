// Wellbeing: the anonymous aggregate of the 30-second check-in (the WHO-5 Well-Being Index, scored 0–100 on the
// phone, apps/app/src/lib/wellbeing.ts). It exists so the website's 100-day promises can be shown as numbers.
//
//   POST /api/wellbeing   { door, bucket, score } → 204
//        door    one of the eight doors (the person's home door)
//        bucket  how far along they were when they answered: "1" (before the first lesson), "21", "50", "100", "100+"
//        score   the WHO-5 score, 0–100 in steps of 4
//   GET  /api/wellbeing   → { threshold, doors: [{ door, bucket, n, mean }], all: [{ bucket, n, mean }] }
//        Public. A door×bucket (or a bucket across doors) is listed only once it has at least THRESHOLD answers.
//
// What is stored: per door×bucket, how many answered and the sum of their scores. Nothing else: no row per answer,
// no date (not even the day), no identifier, no cohort, no lesson, no answer to any of the five statements. The IP
// address and user agent are never read. Nothing is logged. Anyone can post a well-formed score, so the numbers
// are for direction, not accounting (as with api/pulse.js).
// Storage: Netlify Blobs in production (netlify/_shared/wellbeing-store.js); a Map in tests and local development.

export const DOORS = Object.freeze(["CHRISTIANITY", "CATHOLIC", "HINDUISM", "ISLAM", "JUDAISM", "BUDDHISM", "SIKHISM", "SPIRITUAL"]);
export const BUCKETS = Object.freeze(["1", "21", "50", "100", "100+"]);
/** A door×bucket is published only once this many people have answered. */
export const THRESHOLD = 25;
const MAX_BODY_BYTES = 256;
const PER_MINUTE = 600; // per running instance, across everyone (there is no person to count)

// ---------- storage ----------
export function memoryWellbeingStore() {
  const map = new Map();
  return {
    async get(key) { return map.has(key) ? structuredClone(map.get(key)) : null; },
    async bump(key, fn) { map.set(key, fn(map.has(key) ? structuredClone(map.get(key)) : null)); },
  };
}
let store = memoryWellbeingStore();
/** Swap the storage. No argument: a fresh Map (tests). */
export function useWellbeingStore(next) { store = next || memoryWellbeingStore(); }

// ---------- helpers ----------
const isObject = (v) => !!v && typeof v === "object" && !Array.isArray(v);
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

// The same flood brake as pulse: requests per minute in this instance's memory. It counts requests, not people.
let minute = { slot: "", n: 0 };
function underLimit(now) {
  const slot = now.toISOString().slice(0, 16);
  if (minute.slot !== slot) minute = { slot, n: 0 };
  minute.n += 1;
  return minute.n <= PER_MINUTE;
}
/** Tests: start the per-minute brake from zero. */
export function resetWellbeingLimit() { minute = { slot: "", n: 0 }; }

/** The answer, checked: exactly these three fields, each one of the allowed values. */
export function cleanScore(body) {
  if (!isObject(body)) return null;
  const keys = Object.keys(body);
  if (keys.length !== 3 || !keys.every((k) => ["door", "bucket", "score"].includes(k))) return null;
  const { door, bucket, score } = body;
  if (!DOORS.includes(door) || !BUCKETS.includes(bucket)) return null;
  if (!Number.isInteger(score) || score < 0 || score > 100 || score % 4 !== 0) return null;
  return { door, bucket, score };
}

/** Count one answer: n and the sum move; the answer itself is not kept. */
export async function countScore({ door, bucket, score }) {
  await store.bump(`wellbeing/${door}/${bucket}`, (doc) => {
    const d = doc && Number.isInteger(doc.n) ? doc : { n: 0, sum: 0 };
    return { n: d.n + 1, sum: (d.sum || 0) + score };
  });
}

const mean = (sum, n) => Math.round((sum / n) * 10) / 10;

/** The published aggregate: only door×buckets (and buckets across doors) with at least THRESHOLD answers. */
export async function readAggregate() {
  const doors = [];
  const totals = {};
  for (const door of DOORS) {
    for (const bucket of BUCKETS) {
      const d = await store.get(`wellbeing/${door}/${bucket}`);
      if (!d || !d.n) continue;
      const tot = totals[bucket] || (totals[bucket] = { n: 0, sum: 0 });
      tot.n += d.n;
      tot.sum += d.sum;
      if (d.n >= THRESHOLD) doors.push({ door, bucket, n: d.n, mean: mean(d.sum, d.n) });
    }
  }
  const all = BUCKETS.filter((b) => totals[b] && totals[b].n >= THRESHOLD).map((b) => ({ bucket: b, n: totals[b].n, mean: mean(totals[b].sum, totals[b].n) }));
  return { threshold: THRESHOLD, doors, all };
}

export default async function wellbeing(req, res, { now = new Date() } = {}) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "GET") {
    try { return json(res, 200, await readAggregate()); } catch { return json(res, 500, { error: "Could not read the numbers" }); }
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return json(res, 405, { error: "Method not allowed" });
  }
  if (!underLimit(now)) return json(res, 429, { error: "Slow down" });
  const type = String(req.headers?.["content-type"] || "").split(";")[0].trim().toLowerCase();
  if (type !== "application/json") return json(res, 415, { error: "Expected JSON request" });
  let body;
  try { body = await readBody(req); } catch (e) { return json(res, e.statusCode || 400, { error: "Invalid answer" }); }
  const s = cleanScore(body);
  if (!s) return json(res, 400, { error: "Invalid answer" });
  try { await countScore(s); } catch { return json(res, 500, { error: "Could not count" }); }
  return json(res, 204);
}
