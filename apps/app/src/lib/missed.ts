// Words that slipped, brought back gently (light spaced repetition, owner 2026-09-30).
//
// When a first try at a word goes wrong in a lesson (which word did you hear, type it, tap your line, a pair), the word
// and its line are kept here. Each one comes back when it's due: as a "one from before" question inside a later
// lesson, and in the review round. Right moves it further out (1, 3, 7, 14 days, then it's done); wrong starts it
// again tomorrow. Kept on this phone only, in the app's saved state next to the sit log: never logged, never sent,
// never synced (sync pushes sits and settings, and this lives in neither). Pure functions, so Node tests load it as is.

export const INTERVALS = [1, 3, 7, 14] as const;
const MAX_CARDS = 80; // a long-lost list stays small: the ones due soonest are kept

export type Card = { door: string; word: string; carry: string; day: number; box: number; due: string; misses: number };
export type Slip = { word: string; carry: string; day: number };

/** YYYY-MM-DD plus n days (calendar days, no time zone involved). */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const same = (c: Card, door: string, word: string) => c.door === door && c.word.toLowerCase() === word.toLowerCase();
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Whatever was saved, a clean list (bad rows dropped). */
export function cleanCards(raw: unknown): Card[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((c: any) => c && typeof c.door === "string" && typeof c.word === "string" && c.word && typeof c.carry === "string" && typeof c.due === "string" && DATE.test(c.due))
    .map((c: any) => ({
      door: c.door, word: c.word, carry: c.carry, due: c.due,
      day: Number.isInteger(c.day) ? c.day : 1,
      box: Math.max(0, Math.min(INTERVALS.length - 1, Number.isInteger(c.box) ? c.box : 0)),
      misses: Number.isInteger(c.misses) && c.misses > 0 ? c.misses : 1,
    }))
    .slice(-MAX_CARDS);
}

/** A first try that slipped: the word starts again, due tomorrow. */
export function noteSlips(cards: Card[], door: string, slips: Slip[], today: string): Card[] {
  let out = [...cards];
  for (const s of slips) {
    if (!s.word || !s.carry) continue;
    const had = out.find((c) => same(c, door, s.word));
    const card: Card = { door, word: s.word, carry: s.carry, day: s.day, box: 0, due: addDays(today, INTERVALS[0]), misses: (had?.misses || 0) + 1 };
    out = [...out.filter((c) => !same(c, door, s.word)), card];
  }
  // too many: keep the ones due soonest
  if (out.length > MAX_CARDS) out = [...out].sort((a, b) => a.due.localeCompare(b.due)).slice(0, MAX_CARDS);
  return out;
}

/** A due word came back. Right: further out (after the last interval, it's done). Wrong: again tomorrow. */
export function noteRecall(cards: Card[], door: string, results: { word: string; ok: boolean }[], today: string): Card[] {
  let out = [...cards];
  for (const r of results) {
    const c = out.find((x) => same(x, door, r.word));
    if (!c) continue;
    if (!r.ok) {
      out = out.map((x) => (x === c ? { ...c, box: 0, due: addDays(today, INTERVALS[0]), misses: c.misses + 1 } : x));
      continue;
    }
    const box = c.box + 1;
    out = box >= INTERVALS.length ? out.filter((x) => x !== c) : out.map((x) => (x === c ? { ...c, box, due: addDays(today, INTERVALS[box]) } : x));
  }
  return out;
}

/** The door's words due today (soonest first, then the ones that slipped most), at most n, never the ones in `skip`. */
export function dueCards(cards: Card[], door: string, today: string, { n = 5, skip = [] as string[] } = {}): Card[] {
  const no = new Set(skip.map((w) => w.toLowerCase()));
  return cards
    .filter((c) => c.door === door && c.due <= today && !no.has(c.word.toLowerCase()))
    .sort((a, b) => a.due.localeCompare(b.due) || b.misses - a.misses || a.day - b.day)
    .slice(0, n);
}

/** Which words a missed step was about (only the door's own words, which have a line to come back with). */
export function slipsFor(step: { type: string; answer?: unknown; pairs?: unknown }, lessonWord: string, extra: string[] = []): string[] {
  if (step.type === "listen" || step.type === "typeit") return typeof step.answer === "string" ? [step.answer] : [];
  if (step.type === "taphear") return lessonWord ? [lessonWord] : [];
  if (step.type === "match" || step.type === "rush") return extra;
  return [];
}
