// "Today's three": three small goals a day that light a lantern. Derived from what actually happened today
// (a finished lesson, the day's best glow, a line kept in the book), so nothing can be claimed that wasn't done.
import { camp1, lessonInfo } from "@ih/content";

export type Three = { items: { id: string; label: string; done: boolean }[]; count: number; all: boolean; opened: boolean };

export function todaysThree(o: { doneToday: boolean; glow?: { date: string; best: number; clean?: boolean } | null; book: { date: string }[]; lanternOn?: string | null; today: string }): Three {
  const best = o.glow?.date === o.today ? o.glow.best : 0;
  const items = [
    { id: "lesson", label: "finish today's lesson", done: o.doneToday },
    { id: "glow", label: "a clean run — or glow ×3 in a row", done: best >= 3 || (o.glow?.date === o.today && !!o.glow.clean) },
    { id: "keep", label: "keep a line in your book", done: o.book.some((b) => b.date === o.today) },
  ];
  const count = items.filter((i) => i.done).length;
  return { items, count, all: count === 3, opened: o.lanternOn === o.today };
}

/** What the lantern holds: a carry line from a lesson you've already walked, chosen by the date (same all day). */
export function lanternLine(door: string, upTo: number, today: string): { line: string; word: string; day: number } | null {
  const days = Math.max(1, Math.min(upTo, 21));
  const pool = camp1(door).filter((d: any) => d.day <= days && d.carry);
  const extra = upTo > 21 ? Array.from({ length: Math.min(upTo, 400) - 21 }, (_, k) => lessonInfo(door, 22 + k)).filter((d: any) => d?.carry && !/being planned/.test(d.hook || "")) : [];
  const all = [...pool, ...extra];
  if (!all.length) return null;
  const h = [...today].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
  const d = all[h % all.length];
  return { line: d.carry, word: d.word, day: d.day };
}

export const LANTERN_LIGHT = 10;
