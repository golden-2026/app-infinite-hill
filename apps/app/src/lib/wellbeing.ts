// The 30-second check-in: the WHO-5 Well-Being Index (five statements about the last two weeks, each 0–5; the raw
// 0–25 is ×4 for a 0–100 score). Pure and import-free, so plain Node can test it. This file decides WHEN the app
// asks and HOW it scores; the screen (app/wellbeing.tsx) is thin.
//
// When: once right after onboarding (milestone 1, before the first lesson), then when a lesson brings the days
// walked to 21, 50 and 100, and every 30 days after that (130, 160 …). Each milestone is offered once, answered or
// skipped, never again. A milestone that was passed without being offered (a phone from before the check-in
// existed) is let go: the answer would be about a different place on the path than its bucket says.
//
// What stays on the phone: every score with its milestone and date (settings.wellbeing, so it rides in the export
// and in a synced snapshot like every other setting). What leaves the phone, only if the anonymous counts are on:
// { door, bucket, score } (lib/wellbeing-send.ts, api/wellbeing.js), never the five answers.

export type Check = { m: number; date: string; score: number };
export type Wellbeing = { checks: Check[]; offered: number[] };

/** The five statements, in WHO-5 order (keys into the strings; the official wording lives in i18n). */
export const WHO5_ITEMS = ["cheerful", "calm", "active", "rested", "interest"] as const;
/** Answer values, 5 = "all of the time" down to 0 = "at no time". */
export const WHO5_SCALE = [5, 4, 3, 2, 1, 0] as const;
/** WHO-5's own note: a score under this suggests talking to a clinician. The app shows one gentle line, no more. */
export const WHO5_HELP_UNDER = 28;
/** A move of this many points is the one WHO-5 treats as meaningful. Smaller moves read as "about the same". */
export const MEANINGFUL = 10;
/** Only a milestone reached this recently is still asked about (bucket honesty). */
const WINDOW_DAYS = 7;

export const emptyWellbeing = (): Wellbeing => ({ checks: [], offered: [] });

/** Whatever was saved, well-formed: a list of scores (0–100) with their milestone and date, and the milestones offered. */
export function cleanWellbeing(raw: unknown): Wellbeing {
  const r = raw as Partial<Wellbeing> | null;
  if (!r || typeof r !== "object") return emptyWellbeing();
  const checks = (Array.isArray(r.checks) ? r.checks : [])
    .filter((c: any) => c && Number.isInteger(c.m) && c.m >= 1 && typeof c.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c.date) && Number.isInteger(c.score) && c.score >= 0 && c.score <= 100)
    .map((c: any) => ({ m: c.m, date: c.date, score: c.score }));
  const offered = (Array.isArray(r.offered) ? r.offered : []).filter((m: any) => Number.isInteger(m) && m >= 1);
  return { checks, offered: [...new Set([...offered, ...checks.map((c) => c.m)])] };
}

/** The WHO-5 score for five answers (each 0–5), or null if any is missing or out of range. */
export function who5Score(answers: (number | null | undefined)[]): number | null {
  if (answers.length !== 5) return null;
  let raw = 0;
  for (const a of answers) {
    if (!Number.isInteger(a) || (a as number) < 0 || (a as number) > 5) return null;
    raw += a as number;
  }
  return raw * 4;
}

/** The milestone a count of days walked belongs to: 1, 21, 50, 100, then every 30 days (130, 160 …). */
export function milestoneFor(days: number): number {
  if (days < 21) return 1;
  if (days < 50) return 21;
  if (days < 100) return 50;
  return 100 + 30 * Math.floor((days - 100) / 30);
}

/** The anonymous bucket a milestone is counted under on the server. */
export function bucketOf(m: number): "1" | "21" | "50" | "100" | "100+" {
  if (m <= 1) return "1";
  if (m <= 21) return "21";
  if (m <= 50) return "50";
  if (m <= 100) return "100";
  return "100+";
}

/** Right after onboarding: the baseline, if it hasn't been offered (someone who imported a file with checks has it). */
export function dueAtStart(wb: Wellbeing): number | null {
  return wb.offered.includes(1) || wb.checks.length ? null : 1;
}

/** The baseline deferred to the third day (lib/lane.ts baselineAtStart false: someone who came grieving, frightened,
 *  low, carrying a hurt, or sent by their parents): due once they've come on two earlier days (a first-week lesson
 *  counts as a day) and are starting a lesson on a third. Same once-only rule as dueAtStart. */
export function dueOnThirdDay(daysBefore: number, wb: Wellbeing): number | null {
  return daysBefore >= 2 ? dueAtStart(wb) : null;
}

/**
 * After a lesson: the milestone the days walked just reached, if it is 21 or later, hasn't been offered, and was
 * reached within the last week (so a 60-day phone isn't asked the "day 50" question).
 */
export function dueAfterLesson(daysWalked: number, wb: Wellbeing): number | null {
  const m = milestoneFor(daysWalked);
  if (m < 21 || wb.offered.includes(m) || daysWalked >= m + WINDOW_DAYS) return null;
  return m;
}

/** Mark a milestone as offered; with a score, keep the check too. */
export function noteCheck(wb: Wellbeing, m: number, score: number | null, date: string): Wellbeing {
  const offered = wb.offered.includes(m) ? wb.offered : [...wb.offered, m];
  if (score === null) return { ...wb, offered };
  const checks = [...wb.checks.filter((c) => c.m !== m), { m, date, score }].sort((a, b) => a.m - b.m);
  return { checks, offered };
}

export type Change = { first: Check; latest: Check; delta: number; read: "up" | "steady" | "softer"; help: boolean };

/** The card's facts once there are two checks: the first against the latest. Null before the second check-in. */
export function change(wb: Wellbeing): Change | null {
  if (wb.checks.length < 2) return null;
  const first = wb.checks[0];
  const latest = wb.checks[wb.checks.length - 1];
  const delta = latest.score - first.score;
  const read = delta >= MEANINGFUL ? "up" : delta <= -MEANINGFUL ? "softer" : "steady";
  return { first, latest, delta, read, help: latest.score < WHO5_HELP_UNDER };
}
