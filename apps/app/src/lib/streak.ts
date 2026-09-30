// The streak, as the screens say it. The math lives in @ih/domain (streak.js); this is the voice and the settings.
// We score learning, never faith: the streak counts finished lessons, nothing else. Never guilt, never red.
import type { Streak } from "@ih/domain";
import { date, getLang, t, type Key } from "@/i18n";

/** The eight-ish words that explain it, everywhere it's explained (in the current language, read at render). */
export const streakRule = () => t("home.streak.rule");
export const streakWhy = () => t("home.streak.why");
/** Kept for older callers: fixed at load, in the language the app opened in. Prefer streakRule() / streakWhy(). */
export const STREAK_RULE = streakRule();
export const STREAK_WHY = streakWhy();

const MILESTONES = [3, 7, 14, 30, 50, 100, 365] as const;
/** Milestone lines by streak length; each read at the moment it is shown, so a language switch shows at once. */
export const MILESTONE_WORDS: Record<number, string> = Object.defineProperties(
  {},
  Object.fromEntries(MILESTONES.map((n) => [n, { enumerable: true, get: () => t(`home.streak.m${n}` as Key) }])),
);

/** The streak goal as a streak length: progress is the current streak, capped at the goal. */
export function goalView(goal: { days: number | null } | null | undefined, s: Pick<Streak, "streak">) {
  if (!goal || !goal.days) return null;
  return { days: goal.days, done: Math.min(s.streak, goal.days), reached: s.streak >= goal.days };
}

const WEEKDAY = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
/** "wednesday" / "miércoles". */
export const weekdayOf = (d: string) =>
  getLang() === "es" ? date(new Date(`${d}T12:00:00Z`), { weekday: "long", timeZone: "UTC" }).toLowerCase() : WEEKDAY[new Date(`${d}T12:00:00Z`).getUTCDay()];
