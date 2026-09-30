// The weekly reflection: a few warm, true sentences about the last seven days, written on the phone from what
// actually happened (days walked, lines kept, practices done, moods, how lessons felt). No scores, no grades, never
// "you missed". If the companion's AI is on, it may write the reflection instead; this stays as the fallback.
import { practiceById } from "@/content/practices";
import { companionAvailable, companionReflect, type ReflectRequest } from "@/lib/companion-ai";
import { ct, type CKey, type Memory } from "@/lib/companion/memory";
import { getLang } from "@/i18n/core";

const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
const WORD = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const n2w = (n: number) => WORD[n] ?? String(n);
const times = (n: number) => (n === 1 ? "once" : n === 2 ? "twice" : `${n2w(n)} times`);
// Spanish: "un día", "una página", "dos veces"; quotes “así”, with the period after the closing mark.
const WORD_ES = ["ningún", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez"];
const n2wEs = (n: number, fem = false) => (n === 1 && fem ? "una" : WORD_ES[n] ?? String(n));
const timesEs = (n: number) => (n === 1 ? "una vez" : `${n2wEs(n)} veces`);

export type WeekInput = {
  today: string;
  dates: string[]; // every date walked (derived.dates)
  book: { line: string; date: string }[];
  feels: { date: string; feel: "slow" | "right" | "hard" }[];
  memory: Memory;
};
export type Week = { days: number; kept: string[]; practices: string[]; feels: string[]; shared: string[]; text: string[] };

export function weekOf(w: WeekInput): Week {
  // the week: seven days ending today if they've walked today, else ending yesterday (today's check-ins still count)
  const lead = w.dates.includes(w.today) ? 0 : 1;
  const inWeek = (d: string) => { const x = daysBetween(d, w.today); return x >= 0 && x <= 6 + lead; };
  const inWalkWeek = (d: string) => { const x = daysBetween(d, w.today); return x >= lead && x <= 6 + lead; };
  const walked = w.dates.filter(inWalkWeek).sort();
  const kept = w.book.filter((b) => inWeek(b.date)).map((b) => b.line);
  const done = w.memory.done.filter((x) => inWeek(x.date));
  const moods = w.memory.moods.filter((x) => inWeek(x.date) && x.mood !== "skip");
  const feels = w.feels.filter((f) => inWeek(f.date));
  const pages = w.memory.journal.filter((e) => inWeek(e.date));
  const shared = pages.filter((e) => e.shared).map((e) => e.text);

  // a hard day: a lesson that felt hard, or a heavy or anxious check-in. came back: walked again within two days.
  const hardDays = [...new Set([...feels.filter((f) => f.feel === "hard").map((f) => f.date), ...moods.filter((m) => m.mood === "heavy" || m.mood === "anxious").map((m) => m.date)])];
  const comebacks = hardDays.filter((d) => walked.some((x) => daysBetween(d, x) >= 1 && daysBetween(d, x) <= 2)).length;

  const text: string[] = [];
  const es = getLang() === "es";
  const n = walked.length;
  if (n === 0) text.push(ct("companion.reflect.quiet"));
  else if (n === 7) text.push(ct("companion.reflect.everyDay"));
  else text.push(ct("companion.reflect.days", { n: es ? n2wEs(n) : n2w(n), days: n === 1 ? ct("companion.reflect.day") : ct("companion.reflect.daysWord") }));
  if (comebacks > 0) text.push(ct("companion.reflect.comeback", { times: es ? timesEs(comebacks) : times(comebacks) }));

  const count = (id: string) => moods.filter((m) => m.mood === id).length;
  const top = (["heavy", "anxious", "tired", "calm", "good"] as const).map((id) => ({ id, c: count(id) })).sort((a, z) => z.c - a.c)[0];
  if (top && top.c >= 2) {
    text.push(ct(`companion.reflect.${top.id}` as CKey));
  }

  const byId = new Map<string, number>();
  for (const d of done) byId.set(d.id, (byId.get(d.id) || 0) + 1);
  // titles can hold commas ("one breath, all the way down"), so each is quoted and never run into a comma list
  const did = [...byId.entries()].sort((a, z) => z[1] - a[1]).slice(0, 3).map(([id, c]) => ({ t: practiceById(id)?.title, c }));
  const q = (t?: string) => (t ? `“${t}”` : "a practice");
  const withTimes = (d: { t?: string; c: number }) => (d.c > 1 ? `${q(d.t)} ${times(d.c)}` : q(d.t));
  const end = (s: string) => (s.endsWith("”") ? `${s.slice(0, -1)}.”` : `${s}.`); // American style: the period inside the quote
  if (es) text.push(...practicesEs(did));
  else if (did.length === 1) text.push(end(`you made time for ${withTimes(did[0])}`));
  else if (did.length > 1 && did.every((d) => d.c === 1)) {
    // “a,” “b” and “c” (the comma inside the quote, American style)
    const head = did.slice(0, -2).map((d) => (d.t ? `“${d.t},” ` : "a practice, ")).join("");
    text.push(end(`you tried ${n2w(did.length)} practices: ${head}${q(did.at(-2)!.t)} and ${q(did.at(-1)!.t)}`));
  }
  else if (did.length > 1) text.push(`you came back to ${withTimes(did[0])}.`, end(`you also made time for ${did.slice(1).map(withTimes).join(" and ")}`));

  if (es) {
    if (kept.length) text.push(`guardaste ${kept.length === 1 ? "una frase" : `${n2wEs(kept.length, true)} frases`}. la última: “${kept.at(-1)}”`);
    if (feels.filter((f) => f.feel === "hard").length >= 2) text.push(ct("companion.reflect.hardFeels"));
    if (pages.length) text.push(`escribiste ${pages.length === 1 ? "una página" : `${n2wEs(pages.length, true)} páginas`} en tu diario. esas son solo tuyas.`);
    return { days: n, kept, practices: done.map((d) => practiceById(d.id)?.title).filter(Boolean) as string[], feels: feels.map((f) => f.feel), shared, text };
  }
  if (kept.length) text.push(`you kept ${kept.length === 1 ? "a line" : `${n2w(kept.length)} lines`}. the last one: “${kept.at(-1)}”`);
  const hardFeels = feels.filter((f) => f.feel === "hard").length;
  if (hardFeels >= 2) text.push("a few lessons felt hard. you finished them anyway.");
  if (pages.length) text.push(`you wrote ${pages.length === 1 ? "a page" : `${n2w(pages.length)} pages`} in your journal. those stay yours.`);

  return {
    days: n,
    kept,
    practices: done.map((d) => practiceById(d.id)?.title).filter(Boolean) as string[],
    feels: feels.map((f) => f.feel),
    shared,
    text,
  };
}

/** The practices of the week, in Spanish: “título” quoted, the period after the closing mark, "y" before the last. */
function practicesEs(did: { t?: string; c: number }[]): string[] {
  const q = (t?: string) => (t ? `“${t}”` : "una práctica");
  const withTimes = (d: { t?: string; c: number }) => (d.c > 1 ? `${q(d.t)} ${timesEs(d.c)}` : q(d.t));
  const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} y ${xs.at(-1)}` : xs[0]);
  if (did.length === 1) return [`hiciste tiempo para ${withTimes(did[0])}.`];
  if (did.length > 1 && did.every((d) => d.c === 1)) return [`probaste ${n2wEs(did.length, true)} prácticas: ${list(did.map((d) => q(d.t)))}.`];
  if (did.length > 1) return [`volviste a ${withTimes(did[0])}.`, `también hiciste tiempo para ${list(did.slice(1).map(withTimes))}.`];
  return [];
}

/** The companion's reflection, when its AI is on and answers; null otherwise (show the phone's). */
export async function companionWeek(req: Omit<ReflectRequest, "week">, week: Week): Promise<{ text: string; suggestion?: string } | null> {
  if (!(await companionAvailable())) return null;
  const r = await companionReflect({ ...req, week: { kept: week.kept, practices: week.practices, days: week.days, feels: week.feels, shared: week.shared.length ? week.shared : undefined } });
  return r && typeof r.text === "string" && r.text.trim() ? { text: r.text.trim(), suggestion: typeof r.suggestion === "string" ? r.suggestion : undefined } : null;
}
