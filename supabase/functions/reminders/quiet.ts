// The "we'll stop" rule for web push, kept free of imports so it can be tested in plain Node
// (tests/features/streak-reminders.test.mjs). Same rule as the phone's own plan (apps/app/src/lib/reminder-plan.ts):
// daily notes after the last lesson, one last gentle note on the 5th day without one, then nothing at all until the
// next lesson (the app posts that day as last_sat_date, which starts everything over).
export const GO_QUIET_AFTER = 5;
export const LAST_NOTE = "i'll stop nudging for now. the door stays open, whenever you're ready.";

const days = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);

/** For a device's local date and its last lesson date: "daily", "last" (the one goodbye) or "quiet" (send nothing). */
export function webNote(today: string, lastSat: string | null): "daily" | "last" | "quiet" {
  if (!lastSat || !/^\d{4}-\d{2}-\d{2}$/.test(lastSat)) return "daily"; // no lesson known yet: the old one-a-day
  const d = days(lastSat, today);
  if (d < GO_QUIET_AFTER) return "daily";
  return d === GO_QUIET_AFTER ? "last" : "quiet";
}

/** The same fourteen daily lines as the phone (apps/app/src/lib/reminder-plan.ts NOTE.daily), one per calendar day in turn,
 *  so none repeats within two weeks. English only: the server is not told the person's language. */
export const DAILY = [
  "your hill's ready when you are. one lesson, about five minutes.",
  "hey, it's me. today's lesson is waiting. no rush.",
  "a few quiet minutes? i saved you a spot on the hill.",
  "i've got the kettle on. one lesson whenever you're ready.",
  "today's word is waiting for you. five minutes, then it's yours.",
  "the trail's quiet today. a good time for a few steps.",
  "i found a good one for today. come see?",
  "a small lesson, a big sky. ready when you are.",
  "just stopping by. your spot by the fire is free.",
  "one breath, one word, one line to carry. that's today.",
  "the sun's up on your hill. care to join me?",
  "five minutes for you and nobody else. today's lesson is here.",
  "i kept today's page open for you.",
  "a little step today is still a step. i'm here.",
];

/** The line for a device's local date (YYYY-MM-DD). */
export function dailyLine(date: string): string {
  const day = Math.round(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
  return DAILY[((day % DAILY.length) + DAILY.length) % DAILY.length];
}
