// The streak, as the screens say it. The math lives in @ih/domain (streak.js); this is the voice and the settings.
// We score learning, never faith: the streak counts finished lessons, nothing else. Never guilt, never red.
import type { Streak } from "@ih/domain";

/** The eight-ish words that explain it, everywhere it's explained. */
export const STREAK_RULE = "one lesson a day grows it. rest days protect it.";
export const STREAK_WHY = "a streak that grows one lesson a day, with rest days built in, because every tradition knows rest.";

export const MILESTONE_WORDS: Record<number, string> = {
  3: "three days in a row. it's turning into a rhythm.",
  7: "a whole week. that's a practice now.",
  14: "two weeks straight. the hill knows your footsteps.",
  30: "a month of days. look at that trail behind you.",
  50: "fifty days. i made you a tiny banner.",
  100: "a hundred days. we're throwing you a small parade.",
  365: "a whole year of days. thank you for walking it.",
};

/** The streak goal as a streak length: progress is the current streak, capped at the goal. */
export function goalView(goal: { days: number | null } | null | undefined, s: Pick<Streak, "streak">) {
  if (!goal || !goal.days) return null;
  return { days: goal.days, done: Math.min(s.streak, goal.days), reached: s.streak >= goal.days };
}

const WEEKDAY = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
export const weekdayOf = (date: string) => WEEKDAY[new Date(`${date}T12:00:00Z`).getUTCDay()];
