// The companion's memory. It lives on this phone only (localStorage "ih:companion"), is never synced, never logged,
// and never sent anywhere except: the short facts below (which the person can see, edit and delete under
// You → what the companion knows) and journal entries they explicitly marked "share this with the companion".
// Kept lines stay where they already live (settings.book). Kids' profiles are never part of it.
import { useSyncExternalStore } from "react";
import { label } from "@ih/content";
import { PERSON } from "@/content/intake";
import type { Profile } from "@/lib/profile";
import { randomId } from "@/lib/ids";
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
export function factsFromProfile(p: Profile | null | undefined, o: { kids?: number } = {}): { key: string; text: string }[] {
  if (!p) return [];
  const a = p.answers || {};
  const out: { key: string; text: string }[] = [];
  const add = (key: string, text: string) => out.push({ key, text });
  const one = (id: string) => (typeof a[id] === "string" ? (a[id] as string) : null);
  const many = (id: string) => (Array.isArray(a[id]) ? (a[id] as string[]) : one(id) ? [one(id)!] : []);
  const raisedIn = one("raisedIn");
  const faith = raisedIn && PERSON[raisedIn] ? PERSON[raisedIn] : null;
  const door = p.door && p.door !== "SPIRITUAL" ? label(p.door) : null;

  const stance = one("stance");
  if (stance === "practice") add("stance:practice", door ? `you practice your faith: ${door}.` : "you practice a faith.");
  else if (stance === "unsure") add("stance:unsure", faith ? `you grew up ${faith} and aren't sure what you believe anymore.` : "you grew up in a faith and aren't sure what you believe anymore.");
  else if (stance === "left") add("stance:left", faith ? `you grew up ${faith} and stepped away from it.` : "you grew up in a faith and stepped away from it.");
  else if (stance === "curious") add("stance:curious", "you don't have a religion. you're curious.");
  else if (stance === "many") add("stance:many", "you're exploring more than one tradition.");
  else if (stance === "spiritual") add("stance:spiritual", "you'd call yourself spiritual, not religious.");

  const WHY: Record<string, string> = {
    own: "you want to know your own tradition better.", roots: "you want to reconnect with how you grew up.",
    god: "you're wondering whether you believe in God.", partner: "you came for your partner's or family's faith.",
    kids: "you want to teach your kids where they come from.", calm: "you want a calmer daily habit.",
    hard: "you're going through something hard.", curious: "you came here out of curiosity.",
  };
  const why = one("why");
  if (why && WHY[why]) add(`why:${why}`, WHY[why]);
  const PRACTICE: Record<string, string> = { daily: "your faith is part of most of your days.", weekly: "your faith is part of most of your weeks.", holidays: "your faith shows up at holidays and big moments.", rarely: "your faith isn't much part of your life right now." };
  const pr = one("practice");
  if (pr && PRACTICE[pr] && p.door !== "SPIRITUAL") add(`practice:${pr}`, PRACTICE[pr]);
  const HOLD: Record<string, string> = { fully: "you believe it, fully.", questions: "you believe, with questions.", culture: "for you it's more culture and family.", figuring: "you're still figuring out what you believe." };
  const hold = one("hold");
  if (hold && HOLD[hold]) add(`hold:${hold}`, HOLD[hold]);

  const FEEL: Record<string, string> = { sleep: "sleep has been hard lately.", anxious: "you've been anxious lately.", grief: "you're grieving someone.", sick: "someone you love is sick.", lonely: "you've been lonely lately.", focus: "it's been hard to focus.", grateful: "you've been feeling grateful." };
  for (const f of many("feeling")) if (FEEL[f]) add(`feeling:${f}`, FEEL[f]);
  const LIKES: Record<string, string> = { still: "breathing and stillness appeal to you.", stories: "you like old stories.", words: "you like wise words to carry.", kindness: "you want kindness to be something you practice." };
  for (const f of many("interests")) if (LIKES[f]) add(`likes:${f}`, LIKES[f]);
  const believe = one("believe");
  if (believe === "meaning") add("believe:meaning", "you don't believe in a god, but meaning matters to you.");
  if (one("organized") === "away") add("organized:away", "you'd rather keep away from organized religion.");

  if (p.openness === "stay" && p.door && p.door !== "SPIRITUAL") add("openness:stay", `you'd like to stay on your own path${door ? `, ${door}` : ""}.`);
  if (p.openness === "love") add("openness:love", "you enjoy hearing how other traditions see things.");
  if ((o.kids || 0) > 0) add("family:kids", "you walk with your family at the table.");
  return out;
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
