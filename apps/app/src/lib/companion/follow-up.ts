// "Tell me about today" (owner, 2026-11-05): after a lesson the companion asks one gentle question about the day, and
// the next time they open Today it picks that back up. The answer is a journal page (kind "today") that stays on this
// phone; nothing is sent anywhere unless they choose to talk it through in the Guide.
// Pure, so tests/features/follow-up.test.mjs can check it.

export type TodayEntry = { id: string; date: string; text: string; kind?: string; closed?: boolean };

/** How many days a told-about day waits for its follow-up before it quietly lapses. */
export const FOLLOW_UP_DAYS = 3;

const dayNumber = (d: string) => Math.round(Date.parse(`${d}T12:00:00Z`) / 86_400_000);

/** Whether they already told the companion about today. */
export const toldToday = (journal: TodayEntry[], today: string) => journal.some((e) => e.kind === "today" && e.date === today);

/** The newest "tell me about today" page from the last few days (never today's), still open; else null. */
export function followUpFor(journal: TodayEntry[], today: string): { entry: TodayEntry; daysAgo: number } | null {
  const now = dayNumber(today);
  for (let i = journal.length - 1; i >= 0; i--) {
    const e = journal[i];
    if (e.kind !== "today" || !e.date) continue;
    const daysAgo = now - dayNumber(e.date);
    if (daysAgo < 1) continue;
    // only the newest one counts: once it's closed or too old, nothing older comes back
    return !e.closed && daysAgo <= FOLLOW_UP_DAYS ? { entry: e, daysAgo } : null;
  }
  return null;
}

/** A short quote of what they wrote, for the card and the Guide question (whole words, at most `max` characters). */
export function quote(text: string, max = 140): string {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > max / 2 ? cut.slice(0, sp) : cut).replace(/[,;:.\s]+$/, "")}…`;
}
