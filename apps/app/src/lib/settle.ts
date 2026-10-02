// Settling in after placement: someone the check placed past day 1 is watched, gently, in their first lessons at the
// new spot. If the lessons there clearly lean on stories they haven't walked yet, the mascot offers to walk back to the
// start of the stretch before it; if they ace everything, it offers the next stretch up. Pure: no React, no storage.
//
//   watched   the lessons on this door at or past where they were placed (or last moved), since that move. Catch-up
//             days before it don't count, and neither do "go deeper" rounds.
//   window    the first 7 lessons there (WINDOW). A walk-back is offered when the last 3 average under 50% of the
//             graded questions, at least 2 of the 3 were under half, and they fell on at least 2 different dates
//             (one bad day is never enough).
//   later     after the window, only a clearly harder run: the last 3 all under half, averaging under 40%.
//   ahead     inside the window: the last 5 all 90%+, averaging 95%+, over at least 2 dates. Offers the next stretch.
//   declined  "keep going here": no walk-back offer again for at least 7 days, and only on a run clearly worse than the
//             one they turned down (10 points lower), all of it after the "no". A declined jump ahead isn't offered again.
//   moving    keeps everything: the streak, light, every finished day and all history. Only where the door stands
//             changes (lib/store `placed` and `moved`, read by @ih/domain); the days ahead stay open.
const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const WINDOW = 7;
export const BACK_RUN = 3;
export const BACK_BELOW = 0.5;
export const LATER_BELOW = 0.4;
export const AHEAD_RUN = 5;
export const AHEAD_EACH = 0.9;
export const AHEAD_MEAN = 0.95;
export const QUIET_DAYS = 7;
export const WORSE_BY = 0.1;

export type Run = { date: string; door: string; day: number; acc: number; at?: string };
export type Moved = { day: number; at: string };
/** What they said to earlier offers on this door. */
export type SettleMemo = { back?: { on: string; mean: number }; ahead?: string };
export type Offer = { kind: "back" | "ahead"; to: number; stop: number; mean: number };

const mean = (xs: Run[]) => (xs.length ? xs.reduce((s, r) => s + r.acc, 0) / xs.length : 0);
const dates = (xs: Run[]) => new Set(xs.map((r) => r.date)).size;

/** The lessons that count at the current spot, oldest first. */
export function watched(o: { door: string; start: number; runs: Run[]; moved?: Moved | null }): Run[] {
  const since = o.moved?.at || "";
  const sinceDate = since.slice(0, 10);
  return (o.runs || []).filter((r) => r.door === o.door && r.day >= o.start && (!since || (r.at ? r.at > since : r.date > sinceDate)));
}

/**
 * Whether to offer a walk back (or a jump ahead) today. `firsts`: the door's stop starts (content/placement), `start`:
 * where they were placed or last moved to, `day`: where the door is now, `last`: the last written day.
 */
export function settleOffer(o: { door: string; start: number; day: number; runs: Run[]; firsts: number[]; last: number; today: string; moved?: Moved | null; memo?: SettleMemo | null }): Offer | null {
  if (o.start <= 1 || !o.firsts.length) return null; // only someone the check (or a move) placed past day 1
  const here = watched(o);
  let at = -1;
  o.firsts.forEach((f, i) => { if (f <= o.start) at = i; });
  if (at < 0) return null;
  const memo = o.memo || {};

  // a walk back: the last three lessons here, never one bad day
  const last3 = here.slice(-BACK_RUN);
  if (at >= 1 && last3.length === BACK_RUN && dates(last3) >= 2) {
    const m = mean(last3);
    const under = last3.filter((r) => r.acc < BACK_BELOW).length;
    const inWindow = here.length - BACK_RUN < WINDOW;
    const struggling = inWindow ? m < BACK_BELOW && under >= 2 : m < LATER_BELOW && under === BACK_RUN;
    const quietOver = !memo.back || (o.today >= addDays(memo.back.on, QUIET_DAYS) && m <= memo.back.mean - WORSE_BY && last3.every((r) => r.date > memo.back!.on));
    if (struggling && quietOver) return { kind: "back", to: o.firsts[at - 1], stop: at - 1, mean: m };
  }

  // the mirror: acing everything in the first lessons here
  const next = o.firsts[at + 1];
  const last5 = here.slice(-AHEAD_RUN);
  if (!memo.ahead && next && next <= o.last && next > o.day && here.length <= WINDOW && last5.length === AHEAD_RUN && dates(last5) >= 2
    && last5.every((r) => r.acc >= AHEAD_EACH) && mean(last5) >= AHEAD_MEAN) {
    return { kind: "ahead", to: next, stop: at + 1, mean: mean(last5) };
  }
  return null;
}

/** "Walk back" / "Jump ahead": the settings that move the door (the start, and when it moved). Nothing else changes. */
export function moveTo(s: { placed?: Record<string, number>; moved?: Record<string, Moved> }, door: string, to: number, at: string): { placed: Record<string, number>; moved: Record<string, Moved> } {
  const placed = { ...(s.placed || {}) };
  if (to > 1) placed[door] = to; else delete placed[door];
  return { placed, moved: { ...(s.moved || {}), [door]: { day: Math.max(1, Math.floor(to)), at } } };
}

/** "Keep going here": remembered, so the offer stays quiet (lib comment above). */
export function declineOffer(memo: Record<string, SettleMemo> | undefined, door: string, offer: Offer, today: string): Record<string, SettleMemo> {
  const cur = { ...(memo?.[door] || {}) };
  if (offer.kind === "back") cur.back = { on: today, mean: offer.mean };
  else cur.ahead = today;
  return { ...(memo || {}), [door]: cur };
}
