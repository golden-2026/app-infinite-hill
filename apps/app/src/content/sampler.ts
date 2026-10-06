// The sampler week: "a week of many paths" for seekers. Seven lessons ALREADY WRITTEN in years 1–3, one a day, each
// from a different door, opened ahead of those doors as extras (like content/life-moments.ts): never sits, so no door's
// path moves and no streak changes. Nothing here is new religious content; every pick also sits on a life-moment list.
//
// KEEPER REVIEW REQUIRED: this selection is ours, not a Keeper's. Before public release, each door's Keeper must
// confirm (or replace) the day chosen for their tradition. The titles are the scripts' own, for that review only; the
// app shows the lesson's own title.

type Pick = [door: string, day: number, title: string];

export const SAMPLER_WEEK: readonly Pick[] = Object.freeze([
  ["JUDAISM", 109, "Modeh Ani (the first words on waking)"],
  ["BUDDHISM", 257, "The second arrow (SN 36.6)"],
  ["SIKHISM", 2, "Everyone on the floor, everyone the same meal (langar)"],
  ["HINDUISM", 14, "Why it's said three times (om shanti shanti shanti)"],
  ["ISLAM", 11, "Thank-you as a reflex (alhamdulillah)"],
  ["CHRISTIANITY", 89, "Love is patient (1 Corinthians 13)"],
  ["SPIRITUAL", 20, "Every tradition says it: you can't do this alone"],
]);

/** Where someone is with the week: the date they started it. Kept with the settings. */
export type SamplerState = { on: string } | null | undefined;

const key = (door: string, day: number) => `${door}:${day}`;
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);

/** How many of the seven are open on `today`: one on the first day, one more each day after (missed days catch up). */
export function samplerOpenCount(s: SamplerState, today: string): number {
  if (!s || typeof s.on !== "string") return 0;
  const d = daysBetween(s.on, today);
  if (!Number.isFinite(d)) return 0;
  return Math.max(1, Math.min(SAMPLER_WEEK.length, d + 1));
}

/** May this door's day open ahead of the door, as a sampler extra? Only a day of the week that has opened. */
export function samplerOpens(s: SamplerState, today: string, door: string, day: number): boolean {
  const n = samplerOpenCount(s, today);
  return SAMPLER_WEEK.slice(0, n).some(([d, x]) => d === door && x === day);
}

/** Is this door's day one of the seven (open or not)? */
export const inSampler = (door: string, day: number) => SAMPLER_WEEK.some(([d, x]) => d === door && x === day);

/** The week, each day with where it stands. `walked` says whether a door's day is already read. */
export function samplerDays(s: SamplerState, today: string, walked: (door: string, day: number) => boolean) {
  const n = samplerOpenCount(s, today);
  return SAMPLER_WEEK.map(([door, day], i) => ({ n: i + 1, door, day, open: i < n, done: walked(door, day) }));
}

/** The next day to read (the first open one not yet walked), or null. */
export function samplerNext(s: SamplerState, today: string, walked: (door: string, day: number) => boolean) {
  return samplerDays(s, today, walked).find((x) => x.open && !x.done) ?? null;
}

/** Started, and some day still unread. */
export function samplerActive(s: SamplerState, walked: (door: string, day: number) => boolean): boolean {
  return !!s && typeof s.on === "string" && SAMPLER_WEEK.some(([d, x]) => !walked(d, x));
}

/** Walked: read ahead as an extra ("DOOR:day" in forYouDone), or a sit on that door's day. */
export function walkedFrom(forYouDone: readonly string[] | undefined, sits: readonly { door: string; day: number; kidId?: string | null }[]) {
  const read = new Set(forYouDone || []);
  return (door: string, day: number) => read.has(key(door, day)) || sits.some((x) => !x.kidId && x.door === door && x.day === day);
}
