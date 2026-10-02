// The companion's memory. It lives on this phone only (localStorage "ih:companion"), is never synced, never logged,
// and never sent anywhere except: the short facts below (which the person can see, edit and delete under
// You → what the companion knows) and journal entries they explicitly marked "share this with the companion".
// Kept lines stay where they already live (settings.book). Kids' profiles are never part of it.
import { useSyncExternalStore } from "react";
import { label } from "@ih/content";
import { getLang, render, type Lang, type Vars } from "@/i18n/core";
import * as commonStrings from "@/i18n/strings/common";
import * as companionStrings from "@/i18n/strings/companion";
import type { Profile } from "@/lib/profile";
import { randomId } from "@/lib/ids";
import { WHY_KEYS } from "@/lib/why-param";
import { readJSON, remove, writeJSON } from "@/lib/storage";

export const COMPANION_KEY = "ih:companion";

/** A short sentence the person can read. `key` ties it to a signal the day is shaped by (deleting it drops that signal). */
export type Fact = { id: string; key: string | null; text: string; from: "answers" | "you"; on: string };
export type MoodId = "good" | "calm" | "tired" | "anxious" | "heavy";
export type Checkin = { date: string; mood: MoodId | "skip" };
export type Entry = { id: string; date: string; prompt: string; text: string; shared: boolean };
export type DonePractice = { date: string; id: string };
export type Memory = {
  v: 1;
  facts: Fact[];
  /** Facts were drawn from the onboarding answers once; after that only the person changes them. */
  seeded: boolean;
  moods: Checkin[];
  journal: Entry[];
  done: DonePractice[];
  /** Weekly reflections already opened or dismissed (week numbers: 1 = days 1–7). */
  reflected: number[];
  /** The day the "real help" card was last closed. */
  helpClosedOn: string | null;
};

export const MOODS: { id: MoodId; label: string; tag: string }[] = [
  { id: "good", label: "good", tag: "joyful" },
  { id: "calm", label: "calm", tag: "calm" },
  { id: "tired", label: "tired", tag: "tired" },
  { id: "anxious", label: "anxious", tag: "anxious" },
  { id: "heavy", label: "heavy", tag: "grief" },
];

// The companion's words for modules the unit tests load from Node: only the import-free language core and the two
// string tables (never "@/i18n", which pulls in React Native). ct("companion.…") is t() for these files.
const DICTS = { en: { ...commonStrings.en, ...companionStrings.en }, es: { ...commonStrings.es, ...companionStrings.es } } as { en: Record<string, any>; es: Record<string, any> };
export type CKey = keyof typeof companionStrings.en | keyof typeof commonStrings.en;
export const ct = (key: CKey, vars?: Vars, lang: Lang = getLang()) => render(DICTS, key, vars, lang);
/** A mood's word on screen ("tired" / "sin energía"). MOODS[].label stays English: it's what the server is sent. */
export const moodLabel = (id: MoodId) => ct(`companion.mood.${id}` as CKey);

const empty = (): Memory => ({ v: 1, facts: [], seeded: false, moods: [], journal: [], done: [], reflected: [], helpClosedOn: null });

function clean(raw: any): Memory {
  const m = empty();
  if (!raw || typeof raw !== "object") return m;
  const arr = (x: unknown) => (Array.isArray(x) ? x : []);
  const str = (x: unknown) => typeof x === "string";
  return {
    v: 1,
    facts: arr(raw.facts).filter((f: any) => f && str(f.id) && str(f.text)).map((f: any) => ({ id: f.id, key: str(f.key) ? f.key : null, text: f.text, from: f.from === "you" ? "you" : "answers", on: str(f.on) ? f.on : "" })),
    seeded: raw.seeded === true,
    moods: arr(raw.moods).filter((x: any) => x && str(x.date) && str(x.mood)).slice(-120),
    journal: arr(raw.journal).filter((x: any) => x && str(x.id) && str(x.text)).map((x: any) => ({ id: x.id, date: str(x.date) ? x.date : "", prompt: str(x.prompt) ? x.prompt : "", text: x.text, shared: x.shared === true })),
    done: arr(raw.done).filter((x: any) => x && str(x.date) && str(x.id)).slice(-200),
    reflected: arr(raw.reflected).filter((x: any) => typeof x === "number"),
    helpClosedOn: str(raw.helpClosedOn) ? raw.helpClosedOn : null,
  };
}

// ─── a tiny store: every screen reads the same memory and re-renders when it changes ───
let cache: Memory | null = null;
const listeners = new Set<() => void>();
export function getMemory(): Memory {
  cache ??= clean(readJSON(COMPANION_KEY, null));
  return cache;
}
function set(next: Memory) {
  cache = next;
  writeJSON(COMPANION_KEY, next);
  listeners.forEach((l) => l());
}
const change = (fn: (m: Memory) => Memory) => set(fn(getMemory()));
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
export const useMemory = () => useSyncExternalStore(subscribe, getMemory, getMemory);

// ─── facts ───
/** What someone told us in onboarding, said back in plain words. Only answers they gave; nothing guessed. */
export function factsFromProfile(p: Profile | null | undefined, o: { kids?: number } = {}, lang: Lang = getLang()): { key: string; text: string }[] {
  if (!p) return [];
  const T = (key: CKey, vars?: Vars) => ct(key, vars, lang);
  const a = p.answers || {};
  const out: { key: string; text: string }[] = [];
  const add = (key: string, text: string) => out.push({ key, text });
  const one = (id: string) => (typeof a[id] === "string" ? (a[id] as string) : null);
  const many = (id: string) => (Array.isArray(a[id]) ? (a[id] as string[]) : one(id) ? [one(id)!] : []);
  const raisedIn = one("raisedIn");
  // "Catholic" in English, "el catolicismo" in Spanish ("you grew up Catholic" / "creciste en el catolicismo")
  const faithKey = `companion.raised.${raisedIn}`;
  const faith = raisedIn && faithKey in companionStrings.en ? T(faithKey as CKey) : null;
  const doorName = (w: string) => (lang === "es" && `door.${w}` in commonStrings.es ? T(`door.${w}` as CKey) : label(w));
  const door = p.door && p.door !== "SPIRITUAL" ? doorName(p.door) : null;
  // Spanish names a religion with its article mid-sentence ("el hinduismo")
  const theDoor = door ? T("companion.fact.theDoor", { door }) : null;

  const stance = one("stance");
  if (stance === "practice") add("stance:practice", door ? T("companion.fact.stance.practiceDoor", { door }) : T("companion.fact.stance.practice"));
  else if (stance === "unsure") add("stance:unsure", faith ? T("companion.fact.stance.unsureFaith", { faith }) : T("companion.fact.stance.unsure"));
  else if (stance === "left") add("stance:left", faith ? T("companion.fact.stance.leftFaith", { faith }) : T("companion.fact.stance.left"));
  else if (stance === "curious") add("stance:curious", T("companion.fact.stance.curious"));
  else if (stance === "many") add("stance:many", T("companion.fact.stance.many"));
  else if (stance === "spiritual") add("stance:spiritual", T("companion.fact.stance.spiritual"));

  const WHY = new Set<string>(WHY_KEYS);
  const why = one("why");
  // Picked "learning my partner's or family's faith" on the first step: one line naming the faith they're learning.
  if (why === "partner" && stance === "partner" && door) add("why:partner", T("companion.fact.why.partnerDoor", { door, theDoor }));
  else if (why && WHY.has(why)) add(`why:${why}`, T(`companion.fact.why.${why}` as CKey));
  // "your faith" only for someone who told us they have one; otherwise name the door they're walking (or say nothing)
  const ownFaith = stance === "practice" || (!stance && one("raised") === "yes");
  const it = ownFaith ? T("companion.fact.yourFaith") : lang === "es" ? theDoor : door;
  const PRACTICE = new Set(["daily", "weekly", "holidays", "rarely"]);
  const pr = one("practice");
  // someone with no religion who's just starting: "not much part of your life" tells them nothing, so leave it out
  const obvious = pr === "rarely" && !ownFaith && (stance === "curious" || stance === "spiritual");
  if (it && pr && PRACTICE.has(pr) && p.door !== "SPIRITUAL" && !obvious) add(`practice:${pr}`, T(`companion.fact.practice.${pr}` as CKey, { it }));
  const HOLD = new Set(["fully", "questions", "culture", "figuring"]);
  const hold = one("hold");
  if (hold && HOLD.has(hold)) add(`hold:${hold}`, T(`companion.fact.hold.${hold}` as CKey));

  const FEEL = new Set(["sleep", "anxious", "grief", "sick", "lonely", "focus", "grateful"]);
  for (const f of many("feeling")) if (FEEL.has(f)) add(`feeling:${f}`, T(`companion.fact.feeling.${f}` as CKey));
  const LIKES = new Set(["still", "stories", "words", "kindness"]);
  for (const f of many("interests")) if (LIKES.has(f)) add(`likes:${f}`, T(`companion.fact.likes.${f}` as CKey));
  const believe = one("believe");
  if (believe === "meaning") add("believe:meaning", T("companion.fact.believe.meaning"));
  if (one("organized") === "away") add("organized:away", T("companion.fact.organized.away"));

  if (one("practiceMode") === "learn") add(LEARN_KEY, T("companion.fact.learn"));
  if (p.openness === "stay" && p.door && p.door !== "SPIRITUAL") add("openness:stay", T("companion.fact.stay", { door: door ? `, ${lang === "es" ? theDoor : door}` : "" }));
  if (p.openness === "love") add("openness:love", T("companion.fact.love"));
  if ((o.kids || 0) > 0) add("family:kids", T("companion.fact.kids"));
  return out;
}

/**
 * A fact as it reads in the current language. Facts drawn from the answers are stored in the language they were
 * drawn in; until the person edits one, it's shown in today's language. Edited and added facts show as written.
 */
export function factText(f: Fact, p: Profile | null | undefined, o: { kids?: number } = {}): string {
  if (f.from !== "answers" || !f.key) return f.text;
  if (f.key === LEARN_KEY) return f.text === ct("companion.fact.learn", undefined, "en") || f.text === ct("companion.fact.learn", undefined, "es") ? ct("companion.fact.learn") : f.text;
  const lang = getLang();
  const mine = factsFromProfile(p, o, lang).find((x) => x.key === f.key)?.text;
  const other = factsFromProfile(p, o, lang === "es" ? "en" : "es").find((x) => x.key === f.key)?.text;
  return mine && (f.text === mine || f.text === other) ? mine : f.text;
}

const LEARN_KEY = "mode:learn";
const LEARN_FACT = { key: LEARN_KEY, get text() { return ct("companion.fact.learn"); } };
/** "practices: try them / just learn" changed under You: the line in "what the companion knows" follows it. */
export function setLearnFact(learn: boolean, today: string) {
  const m = getMemory();
  const has = m.facts.some((f) => f.key === LEARN_FACT.key);
  if (!m.seeded || learn === has) return; // not drawn yet: seedFacts will read it from the profile
  set({ ...m, facts: learn ? [...m.facts, { id: randomId("fact_"), key: LEARN_FACT.key, text: LEARN_FACT.text, from: "answers", on: today }] : m.facts.filter((f) => f.key !== LEARN_FACT.key) });
}

/** Draw the first facts from what they told us, once. After "forget everything" it doesn't come back on its own. */
export function seedFacts(p: Profile | null | undefined, today: string, o: { kids?: number } = {}) {
  const m = getMemory();
  if (m.seeded || !p || !p.door) return;
  const facts = factsFromProfile(p, o).map((f) => ({ id: randomId("fact_"), key: f.key, text: f.text, from: "answers" as const, on: today }));
  set({ ...m, facts: [...m.facts, ...facts], seeded: true });
}
export const addFact = (text: string, today: string) => { const t = text.trim().slice(0, 160); if (t) change((m) => ({ ...m, facts: [...m.facts, { id: randomId("fact_"), key: null, text: t, from: "you", on: today }] })); };
export const editFact = (id: string, text: string) => { const t = text.trim().slice(0, 160); change((m) => ({ ...m, facts: t ? m.facts.map((f) => (f.id === id ? { ...f, text: t } : f)) : m.facts.filter((f) => f.id !== id) })); };
export const deleteFact = (id: string) => change((m) => ({ ...m, facts: m.facts.filter((f) => f.id !== id) }));
/** Everything the companion kept, gone from this phone. Facts are not re-drawn from the answers afterward. */
export const forgetEverything = () => set({ ...empty(), seeded: true });
/** Used by "erase everything" in You → your data: the companion starts over like a fresh install. */
export function eraseCompanion() { remove(COMPANION_KEY); cache = empty(); listeners.forEach((l) => l()); }
/** The fact keys still present: the engine only uses signals whose fact the person has kept. */
export const factKeys = (m: Memory) => new Set(m.facts.map((f) => f.key).filter(Boolean) as string[]);

// ─── moods, journal, practices, reflections ───
export const checkIn = (date: string, mood: MoodId | "skip") => change((m) => ({ ...m, moods: [...m.moods.filter((x) => x.date !== date), { date, mood }].slice(-120) }));
export const clearCheckIn = (date: string) => change((m) => ({ ...m, moods: m.moods.filter((x) => x.date !== date) }));
export const moodOn =(m: Memory, date: string) => m.moods.find((x) => x.date === date)?.mood ?? null;

export const saveEntry = (e: { date: string; prompt: string; text: string; shared: boolean }) => {
  const text = e.text.trim().slice(0, 4000);
  if (!text) return null;
  const id = randomId("jr_");
  change((m) => ({ ...m, journal: [...m.journal, { id, date: e.date, prompt: e.prompt, text, shared: e.shared }] }));
  return id;
};
export const setShared = (id: string, shared: boolean) => change((m) => ({ ...m, journal: m.journal.map((x) => (x.id === id ? { ...x, shared } : x)) }));
export const deleteEntry = (id: string) => change((m) => ({ ...m, journal: m.journal.filter((x) => x.id !== id) }));
export const markDone = (id: string, date: string) => change((m) => ({ ...m, done: [...m.done, { id, date }].slice(-200) }));
export const markReflected = (week: number) => change((m) => (m.reflected.includes(week) ? m : { ...m, reflected: [...m.reflected, week] }));
export const closeHelp = (date: string) => change((m) => ({ ...m, helpClosedOn: date }));
