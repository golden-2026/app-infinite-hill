// Placement: where someone starts on a door, from the "where are you?" check (welcome/know).
// Two tiers. The basics are camp one's words (data.PLACEMENT, eight questions). Someone who gets them (7 of 8, or the
// first 4 straight for someone who practises or grew up in this tradition) is offered six harder questions from
// further up the path (content/placement.ts). Missing the basics stops the check early (no one sits through eight
// questions they can't answer). Pure: no React, no storage, so the unit tests run it straight from Node.
//
//   skip   basics + 4 of 6 harder: they may start at the first day after camp one (day 22), or from the beginning
//   deep   75%+ overall: day 1, at the deeper level        some   38%+: day 1, past the basics
//   new    day 1, from the very beginning
// It only ever tests knowledge, never belief, and "start from the beginning anyway" is always offered.
import { data } from "@ih/content";

export const BASICS_STOP_AFTER = 4; // misses that end the basics early
export const ADVANCED_GATE = 7; // basics right (of 8) to be offered the harder questions
export const FAST_TRACK = 4; // someone at home in the tradition: this many straight right goes straight to the harder ones
export const ADVANCED_STOP_AFTER = 3; // misses that end the harder questions (4 of 6 can't be reached any more)
export const STRONG = 4; // harder questions right (of 6) to be offered the skip

export type Phase = "basics" | "advanced" | "done";
export type Outcome = "skip" | "deep" | "some" | "new";
export type Check = { connected: boolean; basics: boolean[]; advanced: boolean[]; basicsTotal: number; advancedTotal: number; declined?: boolean };

/** The first day after camp one (the camps are the same length on every door: 21 days, so day 22). */
export function campOneEnd(): number {
  const first = (data?.CAMPS || [])[0];
  return typeof first?.[2] === "number" ? first[2] : 21;
}
export const skipDay = () => campOneEnd() + 1;

/** Catholic and Christian are one family (as in bridges and the door screen). */
const family = (d: string) => (d === "CATHOLIC" || d === "CHRISTIANITY" ? ["CATHOLIC", "CHRISTIANITY"] : [d]);

/** Practises this tradition, grew up in it, or is learning it at home: they're asked fewer basics before the harder ones. */
export function atHome(o: { stance: string | null; raisedIn: string | null; learning: string | null }, door: string): boolean {
  if (o.stance === "partner") return !!o.learning && family(door).includes(o.learning);
  if (o.stance === "practice" || o.stance === "unsure" || o.stance === "left") return !!o.raisedIn && family(door).includes(o.raisedIn);
  return !!o.raisedIn && o.raisedIn === door;
}

const right = (xs: boolean[]) => xs.filter(Boolean).length;
const misses = (xs: boolean[]) => xs.length - right(xs);
/** Someone at home in the tradition who got the first few straight: the rest of the basics are taken as known. */
const fastTracked = (c: Check) => c.connected && c.basics.length === FAST_TRACK && c.basics.length < c.basicsTotal && right(c.basics) === FAST_TRACK;

/** Whether the basics earned the harder questions. */
export function earnedAdvanced(c: Check): boolean {
  if (!c.advancedTotal) return false;
  return fastTracked(c) || (c.basics.length >= c.basicsTotal && right(c.basics) >= Math.min(ADVANCED_GATE, c.basicsTotal));
}

/** What comes next: another basic, another harder one, or the result. */
export function nextPhase(c: Check): Phase {
  const basicsOver = c.basics.length >= c.basicsTotal || misses(c.basics) >= BASICS_STOP_AFTER || fastTracked(c);
  if (!basicsOver) return "basics";
  if (c.declined || !earnedAdvanced(c)) return "done";
  if (c.advanced.length >= c.advancedTotal || misses(c.advanced) >= ADVANCED_STOP_AFTER) return "done";
  return "advanced";
}

/** The result: a 0–100 knowledge score (it sets how deep lessons and the Guide go) and where they may start. */
export function placementResult(c: Check, skip = skipDay()): { knowledge: number; outcome: Outcome; start: number } {
  // basics not asked because they were fast-tracked count as known; basics cut short by misses count as missed
  const basicsRight = right(c.basics) + (fastTracked(c) ? c.basicsTotal - c.basics.length : 0);
  const advRight = right(c.advanced);
  const tookAdvanced = c.advanced.length > 0;
  const pct = (got: number, of: number) => (of > 0 ? Math.round((100 * got) / of) : 0);
  // trying the harder ones never costs anything: the score is the better of the basics alone and both together
  const knowledge = Math.max(pct(basicsRight, c.basicsTotal), tookAdvanced ? pct(basicsRight + advRight, c.basicsTotal + c.advancedTotal) : 0);
  if (tookAdvanced && advRight >= Math.min(STRONG, c.advancedTotal)) return { knowledge: Math.max(knowledge, 75), outcome: "skip", start: skip };
  return { knowledge, outcome: knowledge >= 75 ? "deep" : knowledge >= 38 ? "some" : "new", start: 1 };
}

/** The placement map with this door's start set (a skip) or cleared (from the beginning). */
export function withStart(placed: Record<string, number> | undefined, door: string, start: number): Record<string, number> {
  const next = { ...(placed || {}) };
  if (start > 1) next[door] = start;
  else delete next[door];
  return next;
}
