// "Your year on the hill": the recap's numbers, derived from what's already on the phone (the sit log, the book,
// the minutes each lesson took). Pure, no imports, so the unit tests load it straight from Node.
// Minutes: lessons finished since this build are timed (start to finish, capped so a phone left open doesn't count);
// older lessons have no timing, so they're estimated at the length of a day's lesson and the screen says so.

export const EST_LESSON_MIN = 5; // "a day is about five minutes" (the site and the start button say the same)
export const MAX_LESSON_MIN = 20; // one lesson never counts for more than this
export const YEAR_DAYS = 365;

export type Timed = Record<string, { m: number; n: number }>; // by date: minutes timed, lessons timed
type SitLike = { date: string; door: string; day: number; kidId?: string | null };

const addDays = (date: string, n: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Adds one finished lesson's minutes to the date's total (capped), keeping only the last ~800 dates. */
export function addMinutes(timed: Timed | undefined, date: string, minutes: number): Timed {
  const m = Math.max(1, Math.min(MAX_LESSON_MIN, Math.round(Number(minutes) || 0)));
  const prev = timed?.[date] || { m: 0, n: 0 };
  const next: Timed = { ...(timed || {}), [date]: { m: prev.m + m, n: prev.n + 1 } };
  const keys = Object.keys(next).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - 800))) delete next[k];
  return next;
}

/** Minutes learned over a set of own sits: timed where we have it, estimated otherwise. */
export function minutesLearned(sits: SitLike[], timed: Timed | undefined): { minutes: number; timedLessons: number; estimatedLessons: number } {
  const perDate: Record<string, number> = {};
  for (const s of sits) perDate[s.date] = (perDate[s.date] || 0) + 1;
  let minutes = 0, timedLessons = 0, estimatedLessons = 0;
  for (const [date, n] of Object.entries(perDate)) {
    const t = timed?.[date];
    const k = t ? Math.min(t.n, n) : 0;
    if (k) { minutes += t!.n > n ? Math.round((t!.m * n) / t!.n) : t!.m; timedLessons += k; }
    estimatedLessons += n - k;
    minutes += (n - k) * EST_LESSON_MIN;
  }
  return { minutes, timedLessons, estimatedLessons };
}

// Spanish without imports (the tests load this file straight from Node): the language is on globalThis.__ihLang.
const es = () => (globalThis as { __ihLang?: string }).__ihLang === "es";

/** "about 3.5 hours", "40 minutes" (Spanish: "3.5 horas", "40 minutos", numbers as the app writes them, es-419). */
export function hoursWords(minutes: number): string {
  if (minutes < 60) return es() ? `${minutes} ${minutes === 1 ? "minuto" : "minutos"}` : `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  const h = Math.round((minutes / 60) * 10) / 10;
  if (es()) {
    let n = h % 1 === 0 ? h.toFixed(0) : h.toFixed(1);
    try { n = new Intl.NumberFormat("es-419", { minimumFractionDigits: h % 1 === 0 ? 0 : 1, maximumFractionDigits: 1, useGrouping: h >= 10000 }).format(h); } catch {}
    return `${n} ${h === 1 ? "hora" : "horas"}`;
  }
  return `${h % 1 === 0 ? h.toFixed(0) : h.toFixed(1)} ${h === 1 ? "hour" : "hours"}`;
}

export type Recap = {
  from: string; to: string;
  days: number; lessons: number; minutes: number; timedLessons: number; estimatedLessons: number;
  words: number; wordList: string[]; kept: number; longest: number; friends: number; quests: number;
  doorWords: { known: number; of: number } | null;
};

/**
 * The recap over the last 365 days up to `today` (or since the first day on the hill, if that's later).
 * wordOf(door, day) is the lesson's word. longest is the longest streak in the window (computed by the caller with
 * the streak rules). campWords: the home door's first-camp words, for "how well you know your door".
 */
export function yearRecap(o: {
  sits: SitLike[]; today: string; timed?: Timed; book?: { date: string }[]; longest: number; friends: number;
  questsDone?: { on: string }[]; wordOf: (door: string, day: number) => string | null | undefined;
  home?: string; campWords?: { day: number; word: string }[];
}): Recap {
  const since = addDays(o.today, -(YEAR_DAYS - 1));
  const own = o.sits.filter((s) => !s.kidId && s.date >= since && s.date <= o.today);
  const first = own.reduce<string | null>((a, s) => (!a || s.date < a ? s.date : a), null);
  const dates = new Set(own.map((s) => s.date));
  const words = new Map<string, string>();
  for (const s of own) {
    const w = (o.wordOf(s.door, s.day) || "").trim();
    if (w && !words.has(w.toLowerCase())) words.set(w.toLowerCase(), w);
  }
  const mins = minutesLearned(own, o.timed);
  let doorWords: Recap["doorWords"] = null;
  if (o.home && o.campWords?.length) {
    const done = new Set(own.filter((s) => s.door === o.home).map((s) => s.day));
    doorWords = { known: o.campWords.filter((c) => done.has(c.day)).length, of: o.campWords.length };
  }
  return {
    from: first || o.today, to: o.today,
    days: dates.size,
    lessons: own.length,
    ...mins,
    words: words.size,
    wordList: [...words.values()],
    kept: (o.book || []).filter((b) => b.date >= since && b.date <= o.today).length,
    longest: o.longest,
    friends: o.friends,
    quests: (o.questsDone || []).filter((q) => q.on >= since && q.on <= o.today).length,
    doorWords,
  };
}
