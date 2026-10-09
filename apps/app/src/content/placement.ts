// The stops and questions of the "where are you?" check (welcome/know, rules in lib/placement.ts), by door.
// Stop 0 is camp one's basics: three of the eight words the check has always opened with (data.PLACEMENT). Every stop
// above it, and its questions, comes from the generated bank (content/placement-bank.ts, built from the lesson scripts
// by packages/content/scripts/build-placement.mjs). Nothing here is hand-written. DRAFT: the lessons, and so the
// questions, are pending Keeper review (docs/CONTENT_RELEASE.md). "My own path" has no knowledge check.
import { data } from "@ih/content";
import { BANK_STATUS, PLACEMENT_BANK } from "./placement-bank";
import { CURATED } from "./placement-curated";

export const CONTENT_STATUS = BANK_STATUS;

/** basic: camp one's word ("namaste. what's actually being said?"); fork: a lesson's story question; word: a lesson's
 *  term with three meanings (the screen frames it as "{term} — which fits it best?"). `a`: the right option. */
export type PlaceQ = { kind: "basic" | "fork" | "word"; q: string; term?: string; o: string[]; a: number; day?: number; es?: { q: string; o: string[] } };
export type PlaceStop = { first: number; last: number; camp: string; name: string; qs: PlaceQ[] };

/** A small seeded pick, so a second try at the check sees other basics. */
function pick<T>(xs: T[], n: number, seed: number): T[] {
  const a = xs.slice();
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/** The check's stops for a door (none for "my own path" or a door with no bank). Basics already seen (a restart) go to the back of the pick. */
export function placeStops(door: string, seed = 1, seen: string[] = []): PlaceStop[] {
  const bank = PLACEMENT_BANK[door];
  if (!bank) return [];
  // A door with a hand-checked bank (docs/learning/bank; the Hindu pilot, 2026-10-06) asks those questions at every stop,
  // basics included: three per stop, easiest first, a different three on a restart. They test understanding, and their
  // right answer is no longer usually the longest one.
  const cur = CURATED[door];
  if (cur && cur.length === bank.stops.length) {
    return bank.stops.map((st, i) => {
      const fresh = cur[i].filter((q) => !seen.includes(q.q)), old = cur[i].filter((q) => seen.includes(q.q));
      // every checked question the stop has (the adaptive climb may come back to a stop): unseen ones first, easiest first
      // on a retake, only questions not seen before (the climb skips a stop that has none left); the basics keep three
      const all = (i === 0 ? fresh.length >= 3 : fresh.length >= 1) ? pick(fresh, fresh.length, seed + i).sort((x, y) => x.d - y.d) : i === 0 ? [...pick(fresh, fresh.length, seed + i), ...pick(old, old.length, seed + i)] : [];
      return { first: st.first, last: st.last, camp: st.camp, name: st.name, qs: all.map((q) => ({ kind: "fork" as const, q: q.q, o: q.o, a: q.a, day: q.day, es: q.es })) };
    });
  }
  const basics: PlaceQ[] = ((data?.PLACEMENT?.[door] || []) as { q: string; o: string[]; a: number }[]).map((x) => ({ kind: "basic" as const, ...x }));
  return bank.stops.map((st, i) => ({
    first: st.first, last: st.last, camp: st.camp, name: st.name,
    qs: i === 0 && basics.length >= 3 ? [...pick(basics.filter((q) => !seen.includes(q.q)), 3, seed), ...pick(basics.filter((q) => seen.includes(q.q)), 3, seed)].slice(0, 3) : st.qs.map((q) => (q.kind === "word" ? { kind: "word" as const, q: q.term, term: q.term, o: q.o, a: q.a, day: q.day } : { kind: "fork" as const, q: q.q, o: q.o, a: q.a, day: q.day })),
  }));
}

/** Each stop's first day, in order (what lib/placement and lib/settle work from). */
export const stopFirsts = (door: string): number[] => (PLACEMENT_BANK[door]?.stops || []).map((s) => s.first);

/** The last day with a written lesson on this door: nobody is placed or moved past it. */
export const lastWritten = (door: string): number => PLACEMENT_BANK[door]?.lastWritten ?? 0;

/** The stretches before `start` (all open to catch up), each cut off at the day before it: the trail's catch-up list.
 *  A door without a bank is one stretch, days 1 to start − 1. */
export function stretchesBefore(door: string, start: number): { first: number; last: number; camp: string; name: string }[] {
  if (start <= 1) return [];
  const stops = PLACEMENT_BANK[door]?.stops || [];
  if (!stops.length) return [{ first: 1, last: start - 1, camp: "Camp 1", name: "First steps" }];
  return stops.filter((s) => s.first < start).map((s) => ({ first: s.first, last: Math.min(s.last, start - 1), camp: s.camp, name: s.name }));
}

/** The stop a day falls in, for its name and range ("the stories", days 22–96). */
export function stopAt(door: string, day: number): { first: number; last: number; camp: string; name: string } | null {
  const stops = PLACEMENT_BANK[door]?.stops || [];
  let hit = null;
  for (const s of stops) if (s.first <= day) hit = s;
  return hit ? { first: hit.first, last: hit.last, camp: hit.camp, name: hit.name } : null;
}
