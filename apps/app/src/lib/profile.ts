// Who someone is on their path: how much they know, how much the tradition is part of their life, and how
// open they are to hearing how other traditions see the same thing. Scored on the device from their own
// answers, kept in settings (so it syncs owner-only when signed in, never readable by anyone else), and used
// to pace lessons, decide whether other traditions ever come up, and set the Guide's depth and tone.
// Belief data is sensitive: it is never logged or sent to analytics.
import { BRIDGES, INTAKE_TAGS, type Bridge } from "@/content/intake";
import { WHY_KEYS } from "@/lib/why-param";

export type Openness = "stay" | "sometimes" | "love";

export type Profile = {
  v: 1;
  door: string;
  /** 0–100 from the "what's underneath it?" check; null if they skipped it (treated as new). */
  knowledge: number | null;
  /** 0–100: how much the tradition is part of their life (practice, belief, identity). Null on "my own path". */
  commitment: number | null;
  /** Whether other traditions' takes ever come up. They can change it any time, and "stay" is always honored. */
  openness: Openness;
  /** Raw answers by question id, so wording can improve without losing what someone told us. */
  answers: Record<string, string | string[]>;
  /** Bridges already shown (by id) and what they said to each. */
  bridges: Record<string, "more" | "later" | "stay">;
  lastBridgeOn: string | null;
  setOn: string;
};

export const emptyProfile = (door: string, today: string): Profile => ({
  v: 1, door, knowledge: null, commitment: null, openness: door === "SPIRITUAL" ? "love" : "stay",
  answers: {}, bridges: {}, lastBridgeOn: null, setOn: today,
});

const OPENNESS: Openness[] = ["stay", "sometimes", "love"];
/** Whatever was saved or synced, screens get a well-formed profile (or none). */
export function cleanProfile(raw: any): Profile | null {
  if (!raw || typeof raw !== "object" || typeof raw.door !== "string") return null;
  const pct = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x >= 0 ? Math.min(100, Math.round(x)) : null);
  return {
    v: 1,
    door: raw.door,
    knowledge: pct(raw.knowledge),
    commitment: pct(raw.commitment),
    openness: OPENNESS.includes(raw.openness) ? raw.openness : raw.door === "SPIRITUAL" ? "love" : "stay",
    answers: raw.answers && typeof raw.answers === "object" && !Array.isArray(raw.answers) ? raw.answers : {},
    bridges: raw.bridges && typeof raw.bridges === "object" && !Array.isArray(raw.bridges) ? raw.bridges : {},
    lastBridgeOn: typeof raw.lastBridgeOn === "string" ? raw.lastBridgeOn : null,
    setOn: typeof raw.setOn === "string" ? raw.setOn : "",
  };
}

/** The knowledge check: share of "what's underneath it?" answered right, 0–100. */
export const knowledgeScore = (right: number, total: number) => (total > 0 ? Math.round((100 * right) / total) : 0);

// Commitment: each answer carries points; the score is the share of the maximum. Kept simple and visible
// so the team can reason about it (and change the weights) without a model.
const POINTS: Record<string, Record<string, number>> = {
  raised: { yes: 3, later: 3, exploring: 1, family: 1 },
  practice: { daily: 3, weekly: 2, holidays: 1, rarely: 0 },
  hold: { fully: 3, questions: 2, culture: 1, figuring: 1 },
};
export function commitmentScore(answers: Profile["answers"]): number {
  let got = 0, max = 0;
  for (const [q, table] of Object.entries(POINTS)) {
    const a = answers[q];
    if (typeof a !== "string" || !(a in table)) continue;
    got += table[a];
    max += Math.max(...Object.values(table));
  }
  return max ? Math.round((100 * got) / max) : 0;
}

/** Where to start and how deep to go, in words the person sees (never the numbers). */
export function depthFor(p: Profile): "new" | "some" | "deep" {
  const k = p.knowledge ?? 0;
  return k >= 75 ? "deep" : k >= 38 ? "some" : "new";
}

/** What the Guide is told about the person: fixed values only (api/guide.js maps each to a fixed sentence). No raw answers. */
export function guideProfile(p: Profile | null, door: string): { depth: string; openness: Openness; commitment?: "high" | "mid" | "low"; reason?: string; practice?: "learn" } | undefined {
  if (!p || p.door !== door) return undefined;
  const out: { depth: string; openness: Openness; commitment?: "high" | "mid" | "low"; reason?: string; practice?: "learn" } = { depth: door === "SPIRITUAL" ? "some" : depthFor(p), openness: p.openness };
  // "just learn": the Guide describes how practices are done and never invites them to pray or practice
  if (p.answers.practiceMode === "learn") out.practice = "learn";
  if (door !== "SPIRITUAL" && p.commitment != null) out.commitment = p.commitment >= 67 ? "high" : p.commitment >= 34 ? "mid" : "low";
  const why = p.answers.why;
  if (typeof why === "string" && (WHY_KEYS as readonly string[]).includes(why)) out.reason = why;
  return out;
}

// ---------- bridges: "this tradition has a word for something similar" ----------

/** Whether a bridge may be offered today after finishing this door + word. Never on "stay"; "sometimes" is at most weekly. */
export function bridgeFor(p: Profile | null, door: string, word: string, today: string): { bridge: Bridge; from: string; others: { door: string; word: string; gloss: string }[] } | null {
  if (!p || p.openness === "stay") return null;
  if (p.openness === "sometimes" && p.lastBridgeOn && daysBetween(p.lastBridgeOn, today) < 7) return null;
  const b = BRIDGES.find((x) => x.members.some((m) => m.door === door && m.word.toLowerCase() === word.toLowerCase()) && !p.bridges[x.id]);
  if (!b) return null;
  const raised = typeof p.answers.raised === "string" ? p.answers.raised : null;
  const leftIt = p.answers.feelNow === "left" || p.answers.feelNow === "never";
  const avoid = raised && leftIt ? (raised === "CATHOLIC" || raised === "CHRISTIANITY" ? ["CATHOLIC", "CHRISTIANITY"] : [raised]) : [];
  const secularOnly = p.answers.believe === "meaning" || p.answers.organized === "away";
  const others = b.members
    .filter((m) => m.door !== door && !avoid.includes(m.door) && !(secularOnly && /\b(God|Lord|he|him|his|prayers?|the Name)\b/.test(m.glossEn ?? m.gloss)))
    .slice(0, 3);
  return others.length ? { bridge: b, from: door, others } : null;
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);

// ---------- "my own path": what to offer from each tradition ----------

export type Suggestion = { door: string; word: string; day: number; gloss: string; why: string; bridge: string };

/** Picks a few things from different traditions that fit what someone told us. Never their "left" tradition unless they loved something in it. */
export function suggestFor(answers: Profile["answers"], limit = 4): Suggestion[] {
  const list = (id: string) => (Array.isArray(answers[id]) ? (answers[id] as string[]) : typeof answers[id] === "string" ? [answers[id] as string] : []);
  const wants = new Map<string, number>();
  const add = (tag: string, w: number) => wants.set(tag, (wants.get(tag) || 0) + w);
  for (const a of [...list("feeling"), ...list("interests"), ...list("loved")]) for (const t of INTAKE_TAGS[a] || []) add(t, 2);
  for (const a of list("believe")) for (const t of INTAKE_TAGS[a] || []) add(t, 1);
  if (!wants.size) ["stillness", "kindness", "gratitude"].forEach((t) => add(t, 1));

  // Never offer back a tradition someone left or that never clicked (Catholic and Christian count as one family),
  // and no God-language for people who said "no god" or want to keep away from organized religion.
  const raised = typeof answers.raised === "string" ? answers.raised : null;
  const leftIt = answers.feelNow === "left" || answers.feelNow === "never";
  const family = (d: string) => (d === "CATHOLIC" || d === "CHRISTIANITY" ? ["CATHOLIC", "CHRISTIANITY"] : [d]);
  const avoid = new Set<string>(raised && leftIt ? family(raised) : []);
  const secularOnly = answers.believe === "meaning" || answers.organized === "away";
  const theistic = (gloss: string) => /\b(God|Lord|he|him|his|prayers?|the Name)\b/.test(gloss);

  const scored = BRIDGES.map((b) => ({ b, s: b.tags.reduce((n, t) => n + (wants.get(t) || 0), 0) })).filter((x) => x.s > 0).sort((a, z) => z.s - a.s);
  const out: Suggestion[] = [];
  const usedDoors = new Set<string>();
  for (const { b } of scored) {
    const m = b.members.find((x) => x.door !== "SPIRITUAL" && !avoid.has(x.door) && !usedDoors.has(x.door) && x.day && !(secularOnly && theistic(x.glossEn ?? x.gloss)));
    if (!m) continue;
    usedDoors.add(m.door);
    out.push({ door: m.door, word: m.word, day: m.day!, gloss: m.gloss, why: b.why, bridge: b.idea });
    if (out.length >= limit) break;
  }
  return out;
}
