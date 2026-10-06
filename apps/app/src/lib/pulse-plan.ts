// The anonymous return counts, the phone's side (pure, import-free so plain Node can test it). The phone keeps two
// dates to itself: the day it was first opened and the last day it said "opened today". From those it works out the
// whole ping, so the server never needs an identifier: { cohortDate, daysSince, event, variant? }. See api/pulse.js.

export type PulseEvent = "first" | "open" | "lesson";
export type Ping = { cohortDate: string; daysSince: number; event: PulseEvent; variant?: string; week?: number };
/** first: the first-open date (the cohort). firstSent: its "first" ping landed (or it was never due). opened: the last
 *  date an open landed. */
export type PulseRec = { first: string; firstSent: boolean; opened: string | null };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VARIANT_RE = /^[a-z0-9][a-z0-9-]{0,23}$/;
export const daysFrom = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);

/**
 * The record to work from. A phone that already has lessons from before the counts existed joins its cohort at its
 * first lesson's date, and never sends a "first" (it wasn't a first open today, and the count would be wrong).
 */
export function startRec(rec: unknown, today: string, earliestSit: string | null): PulseRec {
  const r = rec as Partial<PulseRec> | null;
  if (r && typeof r.first === "string" && DATE_RE.test(r.first)) return { first: r.first, firstSent: r.firstSent === true, opened: typeof r.opened === "string" ? r.opened : null };
  const legacy = !!earliestSit && DATE_RE.test(earliestSit) && earliestSit < today;
  return { first: legacy ? earliestSit! : today, firstSent: legacy, opened: null };
}

const withVariant = (p: Ping, variant?: string | null): Ping => (variant && VARIANT_RE.test(variant) ? { ...p, variant } : p);

/** Today's open ping, or null (already sent today; the clock went backwards; day 0's "first" already landed). */
export function openPing(rec: PulseRec, today: string, variant?: string | null): Ping | null {
  if (rec.opened === today) return null;
  const d = daysFrom(rec.first, today);
  if (d < 0) return null;
  if (d === 0) return rec.firstSent ? null : withVariant({ cohortDate: rec.first, daysSince: 0, event: "first" }, variant);
  return withVariant({ cohortDate: rec.first, daysSince: d, event: "open" }, variant);
}

/** After a ping landed: remember it so today's open isn't sent twice. */
export function afterOpen(rec: PulseRec, ping: Ping, today: string): PulseRec {
  return { ...rec, opened: today, firstSent: rec.firstSent || ping.event === "first" };
}

/** A finished lesson; week: 1–7 when it was day 1–7 of a path (the first-week funnel), else left out. */
export function lessonPing(rec: PulseRec, today: string, variant?: string | null, week?: number | null): Ping | null {
  const d = daysFrom(rec.first, today);
  if (d < 0) return null;
  const p = withVariant({ cohortDate: rec.first, daysSince: d, event: "lesson" }, variant);
  return Number.isInteger(week) && week! >= 1 && week! <= 7 ? { ...p, week: week! } : p;
}
