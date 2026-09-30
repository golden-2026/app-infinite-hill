// Shape today: the companion's on-device engine. From what someone told us (only the facts they've kept), the time,
// how they said they feel, and how their days have gone, it picks one practice, decides whether the games step back
// ("quiet"), picks a journal prompt, and writes one short note. Deterministic: the same inputs give the same day.
// If the companion's server AI is on (lib/companion-ai.ts), it may choose among the top candidates and write the
// note; otherwise, or if it fails, the phone's own answer stands. It never tells anyone what to believe.
import { useEffect, useState } from "react";
import { PRACTICES, practiceById, type Mood, type Practice } from "@/content/practices";
import { companionAvailable, companionShape, type CompanionContext, type CompanionProfile } from "@/lib/companion-ai";
import { factKeys, MOODS, type Memory, type MoodId } from "@/lib/companion/memory";
import { doable, practiceModeOf } from "@/lib/onboard";
import { depthFor, guideProfile, type Profile } from "@/lib/profile";

export type Persona = "returner" | "deepener" | "seeker" | "bridge" | "parent" | "hard" | "fan" | "steady";
export type Feel = { date: string; feel: "slow" | "right" | "hard" };

export type ShapeInput = {
  door: string;
  profile: Profile | null;
  level: number;
  hour: number;
  /** 0 = Sunday … 5 = Friday. */
  weekday: number;
  today: string;
  showedUp: number;
  missedDays: number;
  doneToday: boolean;
  lesson: number;
  lessonTitle?: string;
  carry?: string;
  feels: Feel[];
  kids: number;
  memory: Memory;
};

export type Shaped = {
  practice: Practice;
  /** The top few, best first: what the server may choose among. */
  candidates: Practice[];
  quiet: boolean;
  persona: Persona;
  prompt: string;
  note: string;
  mood: MoodId | null;
  /** Show the "real help" card (988): only for crisis words in the journal. Never from mood taps alone. */
  help: boolean;
  /** A run of heavy or anxious days (no crisis words): a softer "want to talk to someone?" line, no crisis line. */
  reachOut: boolean;
  /** Practices from another door are only ever offered to people who said they love that. */
  fromNextDoor: boolean;
  /** Shown as "how it's done" (read-only: what it is, when, what it means), never as something to do. Always true for a
   *  taste from next door; in "just learn", for every tradition's practice; otherwise for a prayer the person hasn't
   *  opted into (lib/onboard prayerToDo). */
  howItsDone: boolean;
  /** They're here to learn, not to practice: anything still doable (a walk, three good things) is optional. */
  learn: boolean;
  by: "phone" | "companion";
};

const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0) / 4294967295; };

/** Words that mean someone may be in danger. Not a diagnosis: it only brings up the card with real help. */
const CRISIS = /\b(suicid\w*|kill(ing)? my ?self|end(ing)? (it all|my life)|take my (own )?life|self[- ]?harm\w*|hurt(ing)? my ?self|cut(ting)? my ?self|want(ed)? to die|wish i (was|were) dead|don'?t want to (be here|live|wake up)|no reason to live|better off without me|overdose)\b/i;
export const crisisWords = (text: string) => CRISIS.test(text);

/** Which of the seven people (brand book personas) this looks most like, from the facts they've kept. */
export function personaFor(i: Pick<ShapeInput, "door" | "profile" | "kids" | "memory">): Persona {
  const has = keysFor(i);
  const p = i.profile && i.profile.door === i.door ? i.profile : null;
  if (has("why:hard") || has("feeling:grief") || has("feeling:sick")) return "hard";
  if (has("why:kids") || has("family:kids")) return "parent";
  if (has("stance:unsure") || has("stance:left") || has("why:roots")) return "returner";
  if (p && (has("stance:practice") || has("why:own")) && ((p.commitment ?? 0) >= 67 || depthFor(p) === "deep" || has("practice:daily"))) return "deepener";
  if (has("why:partner")) return "bridge";
  if (i.door === "SPIRITUAL") return "seeker";
  if (has("why:curious") || has("stance:curious")) return "fan";
  return "steady";
}

/** A fact counts only while the person keeps it. Before the facts are first drawn, the answers stand in. */
function keysFor(i: Pick<ShapeInput, "profile" | "memory">) {
  if (i.memory.seeded) { const k = factKeys(i.memory); return (key: string) => k.has(key); }
  const a = i.profile?.answers || {};
  return (key: string) => {
    const [q, v] = key.split(":");
    const x = a[q];
    return Array.isArray(x) ? x.includes(v) : x === v;
  };
}

const PROMPTS: Record<Persona, string[]> = {
  returner: ["what I used to think — and what I think now.", "a story from growing up you only half remember.", "one line from today you'd like to keep, and why.", "what do you miss, if anything?", "what did today's lesson say differently than you remembered?", "who taught you this first?", "what would you tell your younger self about it?"],
  deepener: ["a line from today that's still with you. what does it ask of you?", "a question to bring to the Guide, or to someone who knows.", "where did today's practice meet your actual day?", "what did you notice this time that you'd missed before?", "a verse you'd like to learn by heart.", "what's one small thing you'll do differently tomorrow?", "what did you pray about today, if you prayed?"],
  seeker: ["the evening review: what went well? what would you do differently? what are you grateful for?", "what steadied you today?", "a line of wisdom, from anywhere, that's been in your head.", "where did you feel most like yourself today?", "what are you still curious about?", "what I used to think — and what I think now.", "one thing you'd like tomorrow to hold."],
  bridge: ["something from your partner's or family's tradition you'd like to understand better.", "a question you'd like to ask them, gently.", "one thing your two families share.", "a word you learned today you could use at the next family dinner.", "what surprised you about their tradition?", "what would you like them to understand about yours?", "one small thing to do together this week."],
  parent: ["the family's line of the week: one sentence you want the kids to remember.", "a question one of the kids asked that you couldn't answer.", "a story from today you could tell at bedtime.", "what do you want them to know about where you come from?", "something you learned today alongside them.", "one small ritual your family could keep.", "what did the kids notice that you missed?"],
  hard: ["a note to someone: someone you miss, or someone who'd understand. you don't have to send it.", "what's been heavy today? just name it.", "one small thing that helped, even a little.", "something you remember that made you smile.", "what would you say to them, if you could?", "who could you let in, this week?", "what do you need tonight?"],
  fan: ["one word from today. what does it mean to you?", "what made you try this?", "one line you'd keep, in your own words.", "what surprised you today?", "who would you share today's word with?", "what I used to think — and what I think now.", "one thing you'd like to try tomorrow."],
  steady: ["one line from today you'd like to keep, and why.", "three good things from today.", "what steadied you today?", "what I used to think — and what I think now.", "where did today's lesson meet your day?", "what are you grateful for right now?", "one small thing to carry into tomorrow."],
};

/** The on-device shaped day. */
export function shapeToday(i: ShapeInput): Shaped {
  const has = keysFor(i);
  const p = i.profile && (i.profile.door === i.door || !i.profile.door) ? i.profile : null;
  const openness = p?.openness ?? (i.door === "SPIRITUAL" ? "love" : "stay"); // "stay" is always honored, fact or not
  const persona = personaFor(i);
  const m = i.memory;
  const todayMood = m.moods.find((x) => x.date === i.today)?.mood ?? null;
  const mood: MoodId | null = todayMood && todayMood !== "skip" ? todayMood : null;
  const moodTag = mood ? (MOODS.find((x) => x.id === mood)!.tag as Mood) : null;
  const recent = m.moods.filter((x) => daysBetween(x.date, i.today) <= 6 && daysBetween(x.date, i.today) >= 0);
  const heavyDays = recent.filter((x) => x.mood === "heavy" || x.mood === "anxious").length;
  const lastFeel = [...i.feels].reverse().find((f) => daysBetween(f.date, i.today) <= 2)?.feel ?? null;
  const late = i.hour >= 22 || i.hour < 5;
  const night = i.hour >= 20 || i.hour < 5;
  const evening = i.hour >= 17 || i.hour < 5;
  const morning = i.hour >= 4 && i.hour < 11;

  const quiet = persona === "hard" || mood === "heavy" || heavyDays >= 2 || late || lastFeel === "hard";
  const secular = has("believe:meaning") || has("organized:away");
  // the 988 card only for words that mean danger; a run of heavy or anxious taps gets a softer word instead
  const help = m.helpClosedOn !== i.today && m.journal.some((e) => daysBetween(e.date, i.today) <= 13 && crisisWords(e.text));
  const reachOut = !help && m.helpClosedOn !== i.today && heavyDays >= 3;
  const tired = mood === "tired";
  const lossOk = has("feeling:grief") || has("why:hard") || mood === "heavy";
  // "just learn": no breath, sit or prayer to do; a tradition's practice comes as "how it's done"
  const learn = practiceModeOf(i.profile) === "learn";

  const eligible = PRACTICES.filter((x) => {
    if (learn && !x.door && ["prayer", "sit", "breath"].includes(x.kind)) return false;
    if (x.door && x.door !== i.door) {
      // another tradition's practice: never for "stay" or "sometimes", never one that names God, never the one they left
      if (openness !== "love" || x.theistic) return false;
      const raised = typeof p?.answers.raisedIn === "string" ? p.answers.raisedIn : null;
      if (raised === x.door && (has("stance:left") || has("stance:unsure"))) return false;
    }
    if (x.theistic && secular && x.door !== i.door) return false;
    if (x.when === "friday" && !(i.weekday === 5 && i.hour >= 10 && i.hour < 20)) return false;
    if (x.when === "morning" && !morning) return false;
    if (x.when === "night" && !evening) return false;
    if (quiet && (x.minutes > 6 || x.energy === "high")) return false;
    // tired: short and restful only (no ten-minute walk)
    if (tired && (x.minutes > 4 || x.energy !== "low")) return false;
    // practices for a loss (a letter, saying a name, a prayer for the dead) only when they've told us about one, or said today is heavy
    if (x.loss && !lossOk) return false;
    return true;
  });
  const mealtime = (i.hour >= 11 && i.hour < 14) || (i.hour >= 17 && i.hour < 20);
  // who this is, for the tie-breaks: the same person gets the same day, and different people get different days
  const who = [i.door, persona, typeof p?.answers.why === "string" ? p.answers.why : "", mood ?? "", Math.floor(i.hour / 3)].join("|");

  const since = (id: string) => { const d = m.done.filter((x) => x.id === id).map((x) => daysBetween(x.date, i.today)); return d.length ? Math.min(...d) : 99; };
  const score = (x: Practice) => {
    let s = 0;
    // the mood nudges; it doesn't decide (the person should still show through)
    if (moodTag && x.moods.includes(moodTag)) s += 2;
    if (tired && x.minutes <= 2) s += 1;
    if (has("feeling:grief") && x.moods.includes("grief")) s += 2;
    if ((has("feeling:anxious") || has("feeling:focus")) && x.moods.includes("anxious")) s += 2;
    if (has("feeling:sleep") && evening && x.moods.includes("tired")) s += 1;
    if (has("likes:still") && (x.kind === "breath" || x.kind === "sit")) s += 1;
    if (has("likes:kindness") && (x.kind === "serve" || x.kind === "give")) s += 2;
    if (x.when) s += 2; // it's the right hour (or Friday) for it
    if (x.door === i.door) s += 1;
    if (x.door && x.door !== i.door) s -= 2; // a taste from next door stays occasional
    if (learn && x.door === i.door) s += 2; // here to learn: how their door's people keep it leads
    switch (persona) {
      // unsure where they stand: the old prayers stay on offer, gently, but don't lead most days
      case "returner": if (x.kind === "write") s += 2; if (x.theistic) s -= 1; if (x.door === i.door && x.minutes <= 2) s += 2; break;
      case "deepener": if (x.door === i.door) s += 3; break;
      case "seeker": if (["breath", "walk", "sit", "rest"].includes(x.kind)) s += 2; if (x.door === "SPIRITUAL") s += 1; break;
      // something to do with the kids nearby: the table, a short one
      case "parent": if (x.minutes <= 2) s += 1; if (x.id === "meal-pause" || x.id === "grace" || x.id === "hamotzi") s += 3; if (x.kind === "write") s -= 1; break;
      case "hard": if (x.moods.includes("grief")) s += 3; if (x.minutes <= 3) s += 2; if (x.id === "candle-night" && evening) s += 2; break;
      case "fan": if (x.minutes <= 2) s += 2; if (x.kind === "breath" || x.kind === "sit") s += 2; break;
      // something from the door they're walking, or something to share with the people they love
      case "bridge": if (x.door === i.door) s += 3; if (x.kind === "serve" || x.kind === "give" || x.id === "meal-pause") s += 2; break;
      default: break;
    }
    if (mealtime && (x.id === "meal-pause" || x.id === "grace" || x.id === "hamotzi")) s += 1;
    if (night && x.minutes <= 4) s += 2;
    if (night && x.energy !== "low") s -= 3;
    if (quiet && x.minutes <= 3) s += 1;
    if (i.level >= 3 && x.minutes >= 5 && !quiet) s += 1;
    if (i.showedUp < 3 && x.minutes <= 3) s += 1;
    if (i.missedDays >= 2 && x.minutes <= 2) s += 2;
    const d = since(x.id);
    if (d === 0) s -= 6; else if (d <= 2) s -= 3;
    return s + hash(`${i.today}:${who}:${x.id}`) * 2;
  };
  const ranked = eligible.map((x) => ({ x, s: score(x) })).sort((a, z) => z.s - a.s).map((r) => r.x);
  const practice = ranked[0] || practiceById(learn ? "gratitude" : "breath")!;
  const howItsDone = !doable(practice, i.door, i.profile);

  // the returner's "what I used to think" comes up about once a week; everyone's prompt turns over with their days
  const list = PROMPTS[persona];
  // a hard season: in the evening it's always the note to someone; by day it turns over like everyone's
  const prompt = persona === "hard" && evening ? list[0] : list[i.showedUp % list.length];

  return { practice, candidates: ranked.slice(0, 6), quiet, persona, prompt, note: noteFor({ i, persona, mood, quiet, late, night, practice, howItsDone, learn }), mood, help, reachOut, fromNextDoor: !!practice.door && practice.door !== i.door, howItsDone, learn, by: "phone" };
}

/** The note when today's card is "how it's done": nothing to do, and never an invitation to pray. */
const LEARN_NOTE = "nothing to do today. here's how people keep one practice, if you're curious.";

function noteFor({ i, persona, mood, quiet, late, night, practice, howItsDone, learn }: { i: ShapeInput; persona: Persona; mood: MoodId | null; quiet: boolean; late: boolean; night: boolean; practice: Practice; howItsDone: boolean; learn: boolean }): string {
  const mins = `${practice.minutes} ${practice.minutes === 1 ? "minute" : "minutes"}`;
  if (i.missedDays >= 2 && !i.doneToday) return "you're back. your place on the path is right where you left it. start small.";
  if (mood === "heavy") return howItsDone ? "heavy days are allowed. no lesson needed today." : "heavy days are allowed. no lesson needed today — just this, if you want it.";
  if (persona === "hard" && night) return "it's late. go gently. the games can wait.";
  if (persona === "hard") return howItsDone ? "go gently today. the games can wait." : "go gently today. the games can wait. this is enough.";
  if (howItsDone) return LEARN_NOTE;
  if (learn) return late ? "it's late. something short, if you like, then sleep." : "something small to try, if you like. no need to.";
  if (late) return "it's late. something short, then sleep.";
  if (quiet) return "a quieter day. the practice first, the lesson whenever you're ready.";
  if (mood === "tired") return `tired is allowed. ${mins}, then rest.`;
  if (mood === "anxious") return "a long breath out first. the rest can wait.";
  if (mood === "good") return "a good day. let's keep a little of it.";
  if (i.doneToday) return "lesson's done. one more small thing, if you'd like.";
  switch (persona) {
    case "returner": return practice.theistic ? "one you might remember from growing up. take it or leave it." : "no need to believe anything to do this. try it with fresh eyes.";
    case "deepener": return "you know this one. do it slowly today.";
    case "seeker": return "no beliefs required. just a few steady minutes.";
    case "parent": return "short enough to do with the kids nearby.";
    case "fan": return `${mins}. that's it. you've got this.`;
    case "bridge": return "something small you could share with the people you love.";
    default: return `${mins}, if you have them.`;
  }
}

// ─── the AI half, when it's on ───

/** What the server may know: fixed profile values (minus any the person deleted from their facts), and the facts. */
export function companionProfile(i: Pick<ShapeInput, "door" | "profile" | "memory" | "level">): CompanionProfile {
  const g = guideProfile(i.profile, i.door);
  const has = keysFor(i);
  const out: CompanionProfile = { door: i.door, level: i.level };
  if (g) {
    out.depth = g.depth;
    out.openness = g.openness;
    if (g.commitment) out.commitment = g.commitment;
    if (g.reason && has(`why:${g.reason}`)) out.reason = g.reason;
  }
  // here to learn, not to practice: a fixed value the server maps to a fixed sentence (never invite them to pray)
  if (practiceModeOf(i.profile) === "learn") out.practice = "learn";
  return out;
}
export const memoryLines = (m: Memory) => m.facts.map((f) => f.text).slice(0, 30);

const asked = new Map<string, Promise<Shaped>>();
async function withCompanion(i: ShapeInput, local: Shaped): Promise<Shaped> {
  if (!(await companionAvailable())) return local;
  const ctx: CompanionContext = {
    door: i.door, day: i.lesson, hour: i.hour, lessonTitle: i.lessonTitle, carry: i.carry,
    lastFeel: i.feels.at(-1)?.feel ?? null, mood: local.mood ? MOODS.find((x) => x.id === local.mood)!.tag : null,
  };
  const reply = await companionShape({
    profile: companionProfile(i), memory: memoryLines(i.memory), context: ctx,
    candidates: local.candidates.map((x) => ({ id: x.id, title: x.title, minutes: x.minutes, kind: x.kind, door: x.door })),
  });
  if (!reply) return local;
  const pick = local.candidates.find((x) => x.id === reply.practiceId) || local.practice; // only ever one the phone offered
  const howItsDone = !doable(pick, i.door, i.profile);
  // a "how it's done" card keeps the phone's own note, so nothing ever invites them to do it
  const note = !howItsDone && typeof reply.note === "string" && reply.note.trim() ? reply.note.trim().slice(0, 220) : howItsDone ? LEARN_NOTE : local.note;
  return { ...local, practice: pick, note, quiet: local.quiet || reply.quiet === true, fromNextDoor: !!pick.door && pick.door !== i.door, howItsDone, by: "companion" };
}

/** Today's shape, on the phone at once; replaced by the companion's if its AI is on and answers. */
export function useShapedDay(i: ShapeInput): Shaped {
  const local = shapeToday(i); // cheap and deterministic: recomputed each render so a mood tap shows at once
  const key = `${i.today}|${i.door}|${local.mood}|${local.quiet}|${Math.floor(i.hour / 4)}|${local.learn ? "learn" : i.profile?.answers.practiceMode ?? ""}|${local.candidates.map((x) => x.id).join(",")}`;
  const [ai, setAi] = useState<{ key: string; v: Shaped } | null>(null);
  useEffect(() => {
    let live = true;
    if (!asked.has(key)) asked.set(key, withCompanion(i, local).catch(() => local));
    asked.get(key)!.then((v) => { if (live && v.by === "companion") setAi({ key, v }); });
    return () => { live = false; };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  // keep the phone's current safety answers (help card, quiet) even if a cached AI reply is older
  return ai && ai.key === key ? { ...ai.v, help: local.help, reachOut: local.reachOut, prompt: local.prompt } : local;
}
