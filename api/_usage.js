// How much AI the Guide and companion use: a daily limit per person, a daily limit for the whole site, and a tally
// of answers that worked or failed each hour (the outage watcher in api/ai-watch.js reads it).
// Privacy: a person is counted by a one-way code made from their connection address, today's date and a server secret,
// so the stored code can't be turned back into an address and changes every day. Nothing else about them is stored:
// no questions, no answers, no raw address. Every count is a number.
// Storage: Netlify Blobs in production (the function wrappers call useStore); a Map in tests and local development.
// If storage ever fails, the AI stays on (fail open): the limits protect the budget, and Anthropic's own monthly
// spending limit is the hard stop behind them.
import { createHash } from "node:crypto";

const num = (v, fallback) => {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};
/** AI answers one person can get per day (Guide + companion together). Override with AI_DAILY_PER_PERSON. */
export const personLimit = () => num(process.env.AI_DAILY_PER_PERSON, 60);
/** AI answers the whole site can give per day. Override with AI_DAILY_SITE. */
export const siteLimit = () => num(process.env.AI_DAILY_SITE, 2_000);

function memoryStore() {
  const map = new Map();
  return {
    async get(key) { return map.has(key) ? structuredClone(map.get(key)) : null; },
    async set(key, value) { map.set(key, structuredClone(value)); },
  };
}
let store = memoryStore();
/** Swap the storage (Netlify Blobs in production, a fresh Map in tests). It needs get(key) → object|null and set(key, object). */
export function useStore(next) { store = next || memoryStore(); }
export const currentStore = () => store;

export const dayOf = (now = new Date()) => now.toISOString().slice(0, 10);
export const hourOf = (now = new Date()) => now.toISOString().slice(0, 13);

function clientAddress(req) {
  const h = req.headers || {};
  const direct = h["x-nf-client-connection-ip"] || h["x-real-ip"];
  const forwarded = typeof h["x-forwarded-for"] === "string" ? h["x-forwarded-for"].split(",")[0] : "";
  return String(direct || forwarded || "unknown").trim().slice(0, 64);
}
function personCode(req, day, secret) {
  return createHash("sha256").update(`infinite-hill-usage|${secret}|${day}|${clientAddress(req)}`).digest("hex").slice(0, 32);
}

async function bump(key, field, by = 1) {
  const doc = (await store.get(key)) || {};
  doc[field] = (Number(doc[field]) || 0) + by;
  await store.set(key, doc);
  return doc;
}

/**
 * Call before asking the AI. Returns { ok: true } and counts the answer, or { ok: false, who: "person" | "site" }
 * when today's limit is used up. `secret` is a server-only value (the provider key) so codes can't be recomputed.
 */
export async function takeTurn(req, secret, now = new Date()) {
  try {
    const day = dayOf(now);
    const personKey = `day/${day}/person/${personCode(req, day, secret)}`;
    const siteKey = `day/${day}/site`;
    const [person, site] = await Promise.all([store.get(personKey), store.get(siteKey)]);
    if ((Number(site?.used) || 0) >= siteLimit()) {
      await bump(siteKey, "refused");
      return { ok: false, who: "site" };
    }
    if ((Number(person?.used) || 0) >= personLimit()) {
      await bump(siteKey, "refusedPerson");
      return { ok: false, who: "person" };
    }
    await Promise.all([bump(personKey, "used"), bump(siteKey, "used")]);
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

/** Call after the AI answered (ok) or failed (not ok), so the watcher can spot an outage. */
export async function recordOutcome(ok, now = new Date()) {
  try {
    await bump(`hour/${hourOf(now)}`, ok ? "ok" : "failed");
  } catch {
    // counts are best-effort; never let them break an answer
  }
}

/** Today's totals and the last two hours' outcomes, for the watcher and the owner's health check. Numbers only. */
export async function snapshot(now = new Date()) {
  const lastHour = new Date(now.getTime() - 3_600_000);
  const [site, thisHour, prevHour] = await Promise.all([
    store.get(`day/${dayOf(now)}/site`), store.get(`hour/${hourOf(now)}`), store.get(`hour/${hourOf(lastHour)}`),
  ]);
  const n = (d, f) => Number(d?.[f]) || 0;
  return {
    day: dayOf(now),
    used: n(site, "used"),
    siteLimit: siteLimit(),
    personLimit: personLimit(),
    refusedSite: n(site, "refused"),
    refusedPerson: n(site, "refusedPerson"),
    lastHours: { ok: n(thisHour, "ok") + n(prevHour, "ok"), failed: n(thisHour, "failed") + n(prevHour, "failed") },
  };
}
