// Placement: where someone starts on a door, from the "where are you?" check (welcome/know).
// The path is cut into stops (content/placement-bank.ts, generated from the lessons): the start of each year-one camp,
// then years two and three in four stretches each, up to the last written day. The check climbs them:
//
//   probe     up to 3 questions from one stop. 2 right: they know it. 2 missed: they don't. (So most probes are 2.)
//   climb     the basics first (stop 0). Know them, and it gallops up the path (camp two, then a third of the way,
//             two thirds, the top); the first stop they don't know turns it into a halving search between the highest
//             stop known and the lowest not known. Wrong steps down, right jumps up.
//   stop      when the gap closes (the level is clear), or at 14 questions: a probe starts only with room for its
//             first two, and a stretch still split at the 14th counts as not clearly known.
//   place     the START of the highest stop they clearly know (never the middle of a camp). Knowing only the basics, or
//             not even those, is day 1; there the knowledge score (0–100) sets how deep lessons go, as before:
//             75+ deep, 38+ past the basics, else from the very beginning.
//   anyway    knew some stop but not the next: "start at day N anyway" (the next stop) is offered, at the score earned.
// "start from the beginning anyway" is always offered. Knowledge only, never belief. Pure: no React, no storage, so the
// unit tests run it straight from Node.
import { data } from "@ih/content";

export const PER_STOP = 3; // questions a probe can ask
export const NEED = 2; // right (of 3) to know a stop; the same number missed means they don't
export const MAX_QUESTIONS = 14; // never more than this
/** Where the climb jumps while every stretch so far is known, as a share of the path: a camp-one-only beginner is done
 *  after two short probes, and anyone else is found in at most seven (simulated over every level). */
const GALLOP = [1 / 12, 1 / 3, 2 / 3, 1];

/** Camp one's last day (21 on every door) and the first day after it. */
export function campOneEnd(): number {
  const first = (data?.CAMPS || [])[0];
  return typeof first?.[2] === "number" ? first[2] : 21;
}
export const skipDay = () => campOneEnd() + 1;

/** Catholic and Christian are one family (as in bridges and the door screen). */
const family = (d: string) => (d === "CATHOLIC" || d === "CHRISTIANITY" ? ["CATHOLIC", "CHRISTIANITY"] : [d]);

/** Practises this tradition, grew up in it, or is learning it at home (first-step answers). */
export function atHome(o: { stance: string | null; raisedIn: string | null; learning: string | null }, door: string): boolean {
  if (o.stance === "partner") return !!o.learning && family(door).includes(o.learning);
  if (o.stance === "practice" || o.stance === "unsure" || o.stance === "left") return !!o.raisedIn && family(door).includes(o.raisedIn);
  return !!o.raisedIn && o.raisedIn === door;
}

/** One answer: which stop it was from, and whether it was right ("not sure" is a miss). */
export type Answer = { stop: number; ok: boolean };
/** The check so far: how many stops the door has, the answers in order, and whether they stopped after the basics. */
export type Climb = { stops: number; answers: Answer[]; declined?: boolean; /** questions available per stop (default PER_STOP) */ per?: number[] };
export type ClimbState = {
  /** the highest stop known (-1: not even the basics yet) and the lowest stop known not to be known (`stops`: none) */
  lo: number; hi: number;
  /** the stop being asked now, and which of its questions is next (0–2); null when the check is over */
  probe: number | null; nth: number;
  asked: number; done: boolean;
};

const right = (xs: Answer[]) => xs.filter((x) => x.ok).length;

// The adaptive climb (docs/learning/QUESTION_RULES.md §10), after the basics: a running estimate of the highest stop
// someone knows, updated after every answer. Knowing a stop, they get its questions right unless they slip; above it,
// only a lucky guess. The next question comes from the stop the estimate is least sure about, and the check ends when
// one place (that stop or the one above it) is very likely, or at MAX_ADAPTIVE questions. Never more than that.
export const SLIP = 0.1; // a question missed from a stop they know
export const GUESS = 0.4; // a question right from a stop they don't: set above the real 1-in-3 or 1-in-4, so luck never places anyone high
export const SURE = 0.85; // how likely the place must be to stop asking
export const MAX_ADAPTIVE = 12; // after up to 3 basics: never more than 15 in all (QUESTION_RULES §10)
const CAUTIOUS = 0.75; // the place: the highest stop they know with at least this likelihood (never a lucky guess's best case)
const PRIOR = 0.95; // each stop up is a little less likely before any answer: most people start near the beginning

/** How likely each level is (index = highest stop known, 0 to n-1), from the answers above the basics. */
export function posterior(n: number, answers: Answer[]): number[] {
  const p = Array.from({ length: n }, (_, L) => Math.pow(PRIOR, L));
  for (const a of answers) {
    if (a.stop < 1) continue;
    for (let L = 0; L < n; L++) {
      const knows = a.stop <= L;
      p[L] *= a.ok ? (knows ? 1 - SLIP : GUESS) : knows ? SLIP : 1 - GUESS;
    }
  }
  const sum = p.reduce((x, y) => x + y, 0) || 1;
  return p.map((x) => x / sum);
}

/** The place the estimate is most sure of: the stop p with the most likelihood on "p or p+1" (placed there or one
 *  below), and how sure. */
export function bestPlace(post: number[]): { at: number; sure: number } {
  let at = 0, sure = -1;
  for (let k = 0; k < post.length; k++) {
    const s = post[k] + (post[k + 1] ?? 0);
    if (s > sure + 1e-12) { at = k; sure = s; }
  }
  return { at, sure };
}

/** Replays the answers: where the climb stands and what to ask next. */
export function climbState(c: Climb): ClimbState {
  const n = Math.max(0, c.stops);
  // the basics first, as before: 2 right of up to 3 to know them, 2 missed to start from day 1
  const basics: Answer[] = [];
  let i = 0;
  for (; i < c.answers.length; i++) {
    const a = c.answers[i];
    basics.push(a);
    const r = right(basics), w = basics.length - r;
    if (r >= NEED || w > PER_STOP - NEED) { i++; break; }
  }
  const r0 = right(basics), w0 = basics.length - r0;
  const basicsDone = r0 >= NEED || w0 > PER_STOP - NEED;
  if (!n) return { lo: -1, hi: 0, probe: null, nth: 0, asked: c.answers.length, done: true };
  if (!basicsDone) return { lo: -1, hi: n, probe: 0, nth: basics.length, asked: c.answers.length, done: false };
  if (r0 < NEED) return { lo: -1, hi: 0, probe: null, nth: 0, asked: c.answers.length, done: true };
  if (c.declined || n === 1) return { lo: 0, hi: n, probe: null, nth: 0, asked: c.answers.length, done: true };
  const rest = c.answers.slice(i);
  const per = c.per || [];
  const asked = new Map<number, number>();
  for (const a of rest) asked.set(a.stop, (asked.get(a.stop) || 0) + 1);
  const post = posterior(n, rest);
  const best = bestPlace(post);
  const left = (s: number) => (per[s] ?? PER_STOP) - (asked.get(s) || 0);
  // the stop to ask next: the one whose answer, right or wrong, is expected to teach the most about where they are
  // (the largest expected drop in uncertainty), among stops with questions left; an answer they'd surely get right
  // teaches nothing, so it's never asked just to fill time
  const H = (q: number[]) => -q.reduce((x, v) => x + (v > 0 ? v * Math.log(v) : 0), 0);
  const now = H(post);
  let probe: number | null = null, gain = 1e-6;
  for (let s = 1; s < n; s++) {
    if (left(s) <= 0) continue;
    const pRight = post.reduce((x, v, L) => x + v * (s <= L ? 1 - SLIP : GUESS), 0);
    const g = now - (pRight * H(posterior(n, [...rest, { stop: s, ok: true }])) + (1 - pRight) * H(posterior(n, [...rest, { stop: s, ok: false }])));
    if (g > gain) { gain = g; probe = s; }
  }
  const done = best.sure >= SURE || rest.length >= MAX_ADAPTIVE || probe === null;
  // out of questions and still unsure: the cautious side of the estimate (the highest stop they very likely know),
  // never a lucky guess's best case. Placing a little low is kind; the settling-in offers move them on up.
  let at = best.at;
  if (done) {
    let c = 0;
    for (let L = n - 1; L >= 0; L--) { c += post[L]; if (c >= CAUTIOUS) { at = Math.min(at, L); break; } }
  }
  return { lo: at, hi: Math.min(n, at + 1), probe: done ? null : probe, nth: done || probe === null ? 0 : asked.get(probe) || 0, asked: c.answers.length, done };
}

/** The old fixed climb (probe 3 per stop, gallop, then halve), kept for comparison in the simulator. */
export function climbStateFixed(c: Climb): ClimbState {
  const n = Math.max(0, c.stops);
  let lo = -1, hi = n, step = 1, probe: number | null = n ? 0 : null;
  let tally: Answer[] = [];
  let asked = 0;
  const nextProbe = (): number | null => {
    if (hi - lo <= 1 || lo >= n - 1) return null;
    if (asked + NEED > MAX_QUESTIONS) return null;
    // still climbing: gallop up (stops 1, 4, 8, then the top, on a 13-stop path), never repeating one already known
    if (hi === n && step <= GALLOP.length) { const p = Math.max(lo + 1, Math.min(n - 1, Math.round((n - 1) * GALLOP[step - 1]))); step++; return p; }
    return Math.floor((lo + hi) / 2); // found a ceiling: halve the gap
  };
  for (const a of c.answers) {
    if (probe === null) break;
    tally.push(a);
    asked++;
    const r = right(tally), w = tally.length - r;
    // out of questions on a split: not clearly known (the settling-in offers catch anything this undersells)
    const outOfRoom = asked >= MAX_QUESTIONS && r < NEED;
    if (r >= NEED || w > PER_STOP - NEED || outOfRoom) {
      if (r >= NEED) lo = probe; else hi = probe;
      tally = [];
      // after the basics, someone can stop and start at day 1 (the "no thanks" on the offer)
      probe = probe === 0 && c.declined ? null : nextProbe();
    }
  }
  return { lo, hi, probe, nth: tally.length, asked, done: probe === null };
}

/** Just after the basics were passed and before anything else was asked: the moment to offer the rest of the climb. */
export function atOffer(c: Climb): boolean {
  const s = climbState({ ...c, declined: false });
  return !c.declined && !s.done && s.lo === 0 && s.nth === 0 && c.answers.every((a) => a.stop === 0);
}

export type Outcome = "skip" | "deep" | "some" | "new";
/** The result: the knowledge score (lesson depth), where they start, and the "anyway" start one stop up, if offered. */
export type Result = { knowledge: number; outcome: Outcome; start: number; stop: number; anyway: number | null; asked: number; got: number };

/** `firsts`: each stop's first day, in order (stop 0 is day 1). */
export function placementResult(c: Climb, firsts: number[]): Result {
  const s = climbState(c);
  const pct = (xs: Answer[]) => (xs.length ? Math.round((100 * right(xs)) / xs.length) : 0);
  const basics = c.answers.filter((a) => a.stop === 0);
  // trying further up never costs anything: the better of the basics alone and everything together
  let knowledge = Math.max(pct(basics), pct(c.answers));
  const stop = s.lo;
  const start = stop >= 1 ? firsts[stop] ?? 1 : 1;
  if (stop >= 1) knowledge = Math.max(knowledge, 75);
  const outcome: Outcome = stop >= 1 ? "skip" : knowledge >= 75 ? "deep" : knowledge >= 38 ? "some" : "new";
  const anyway = stop >= 0 && s.hi < firsts.length && s.hi === stop + 1 && firsts[s.hi] > start ? firsts[s.hi] : null;
  return { knowledge, outcome, start, stop, anyway, asked: c.answers.length, got: right(c.answers) };
}

/** The placement map with this door's start set (past day 1) or cleared (from the beginning). */
export function withStart(placed: Record<string, number> | undefined, door: string, start: number): Record<string, number> {
  const next = { ...(placed || {}) };
  if (start > 1) next[door] = start;
  else delete next[door];
  return next;
}

/** The stop a day sits in (the last stop whose first day is at or before it); -1 before the first. */
export function stopOf(firsts: number[], day: number): number {
  let k = -1;
  firsts.forEach((f, i) => { if (f <= day) k = i; });
  return k;
}
