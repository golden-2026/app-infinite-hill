// The language core: pure, no imports, so the unit tests (and the app's other import-free modules) can load it
// straight from Node. It holds which language is on (English or Spanish), picks it the first time (a ?lang= link,
// then the person's own choice, then the phone's language), and turns a message into text: {name} slots, plurals
// by Intl.PluralRules, and numbers written the way each language writes them.
//
// The current language also lives on globalThis.__ihLang, so a module that must stay import-free (seasons.ts,
// year.ts, reminder-plan.ts …) can ask `(globalThis as { __ihLang?: string }).__ihLang === "es"` without importing.

export type Lang = "en" | "es";
export const LANGS: readonly Lang[] = ["en", "es"];
export const isLang = (x: unknown): x is Lang => x === "en" || x === "es";

/** A message with plural forms, chosen by Intl.PluralRules (Spanish uses one / many / other; missing forms use other). */
export type Plural = { one: string; other: string; zero?: string; two?: string; few?: string; many?: string };
export type Msg = string | Plural;
/** The Spanish dictionary must have every English key, with the same shape (plain text or plural forms). */
export type Dict<E> = { [K in keyof E]: E[K] extends string ? string : Plural };
export type Vars = Record<string, string | number | null | undefined>;

/** "es", "es-MX", "es_419" → Spanish; anything else (or nothing) → English. */
export function langFromTag(tag: string | null | undefined): Lang {
  return typeof tag === "string" && /^es(?:$|[-_])/i.test(tag.trim()) ? "es" : "en";
}

/**
 * Which language to open in: a ?lang= link wins (the website's "Start free" in Spanish), then what the person chose
 * under You, then the phone's first preferred language. Only es-* goes to Spanish; everything else stays English.
 */
export function chooseLang(o: { url?: string | null; saved?: unknown; device?: readonly (string | null | undefined)[] | string | null }): Lang {
  const url = typeof o.url === "string" ? o.url.trim().toLowerCase().slice(0, 2) : null;
  if (isLang(url)) return url;
  if (isLang(o.saved)) return o.saved;
  const first = Array.isArray(o.device) ? o.device[0] : o.device;
  return langFromTag(typeof first === "string" ? first : null);
}

// ---------- the current language (one per app) ----------

const G = globalThis as { __ihLang?: Lang };
const subs = new Set<() => void>();
export const getLang = (): Lang => (G.__ihLang === "es" ? "es" : "en");
export function setLangState(l: Lang) {
  const next: Lang = isLang(l) ? l : "en";
  const changed = next !== G.__ihLang;
  G.__ihLang = next;
  if (changed) subs.forEach((f) => f());
}
export function subscribeLang(f: () => void) {
  subs.add(f);
  return () => { subs.delete(f); };
}

// ---------- numbers, plurals, slots ----------

const locale = (lang: Lang) => (lang === "es" ? "es-419" : "en-US");

/** A number the way the language writes it. Four-digit numbers (years, 1200) are never grouped, as Spanish style asks. */
export function formatNumber(n: number, lang: Lang = getLang(), opts: Intl.NumberFormatOptions = {}): string {
  if (!Number.isFinite(n)) return String(n);
  try {
    return new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 1, useGrouping: Math.abs(n) >= 10000, ...opts }).format(n);
  } catch {
    return String(n);
  }
}

export function pluralForm(msg: Plural, n: number, lang: Lang = getLang()): string {
  let cat: string = n === 1 ? "one" : "other";
  try { cat = new Intl.PluralRules(locale(lang)).select(n); } catch {}
  return (msg as Record<string, string | undefined>)[cat] ?? msg.other;
}

/** Fills {slot}s. Numbers are written for the language; a missing slot is left as is so it shows up in review. */
export function fill(s: string, vars?: Vars, lang: Lang = getLang()): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, k: string) => {
    const v = vars[k];
    if (v === undefined || v === null) return m;
    return typeof v === "number" ? formatNumber(v, lang) : v;
  });
}

/** One message in one language: the Spanish if there is one, else the English, else the key itself. */
export function render(dicts: { en: Record<string, Msg>; es: Record<string, Msg> }, key: string, vars?: Vars, lang: Lang = getLang()): string {
  const m = dicts[lang][key] ?? dicts.en[key];
  if (m === undefined) return key;
  if (typeof m === "string") return fill(m, vars, lang);
  const n = typeof vars?.count === "number" ? vars.count : Number(vars?.count ?? 0);
  return fill(pluralForm(m, n, lang), vars, lang);
}

/** Dates the language's way (weekday and month names). */
export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions, lang: Lang = getLang()): string {
  const date = typeof d === "string" ? new Date(`${d}T12:00:00`) : d;
  try {
    return new Intl.DateTimeFormat(locale(lang), opts).format(date);
  } catch {
    return date.toDateString();
  }
}

/** The keys one dictionary has and the other lacks (the tests use it to keep Spanish complete). */
export function missingKeys(en: Record<string, Msg>, es: Record<string, Msg>): { missing: string[]; extra: string[]; shape: string[] } {
  const missing = Object.keys(en).filter((k) => !(k in es));
  const extra = Object.keys(es).filter((k) => !(k in en));
  const shape = Object.keys(en).filter((k) => k in es && typeof en[k] !== typeof es[k]);
  return { missing, extra, shape };
}
