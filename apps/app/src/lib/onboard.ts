// The first onboarding step ("where are you with religion right now?", welcome/you) is asked before anyone has a
// door, so its answers live on a pending profile (door "") and are carried into whichever door they then pick.
// They also pre-answer questions later steps would otherwise repeat:
//   stance    practice | unsure | left | partner | curious | many | spiritual
//   raisedIn  a door id, "mixed", "other" or "none" (same ids as the "my own path" intake's `raised`)
//   learning  (stance "partner" only) the door of the partner's or family's faith they're learning, or "other"
// On a tradition door, `raised` keeps its belief-question meaning (yes/later/exploring/family); on "my own path"
// it keeps the intake meaning (which tradition). Belief data is sensitive: never logged or sent to analytics.
import { DOORS } from "@ih/content";
import { emptyProfile, type Profile } from "@/lib/profile";

export type Stance = "practice" | "unsure" | "left" | "partner" | "curious" | "many" | "spiritual";
export const STANCES: Stance[] = ["practice", "unsure", "left", "partner", "curious", "many", "spiritual"];
const YOU_KEYS = ["stance", "raisedIn", "learning"] as const;

export const isDoor = (d: unknown): d is string => typeof d === "string" && d !== "SPIRITUAL" && DOORS.some(([, w]: [string, string]) => w === d);

/** What someone told us on the first step, from whatever profile is saved (pending or a door's). */
export function youAnswers(p: Profile | null | undefined): { stance: Stance | null; raisedIn: string | null; learning: string | null } {
  const s = p?.answers.stance;
  const r = p?.answers.raisedIn;
  const l = p?.answers.learning;
  return {
    stance: STANCES.includes(s as Stance) ? (s as Stance) : null,
    raisedIn: typeof r === "string" ? r : null,
    learning: typeof l === "string" ? l : null,
  };
}

/** Did they grow up in this tradition but step back from believing it? Then it's walked "with fresh eyes". */
export const freshEyes = (stance: Stance | null, raisedIn: string | null, door: string) => (stance === "unsure" || stance === "left") && raisedIn === door;

/** A pending profile holding only the first step's answers (no door yet; other traditions never come up from it). */
export function pendingProfile(today: string, stance: Stance | null, raisedIn: string | null, learning: string | null = null): Profile {
  const answers: Profile["answers"] = {};
  if (stance) answers.stance = stance;
  if (raisedIn) answers.raisedIn = raisedIn;
  if (learning) answers.learning = learning;
  return { ...emptyProfile("", today), openness: "stay", answers };
}

/** The profile for a door: the saved one if it's this door's, else a fresh one that carries the first step's answers
 *  and pre-answers what they already told us. */
export function profileFor(p: Profile | null | undefined, door: string, today: string): Profile {
  if (p && p.door === door) return p;
  const carried: Profile["answers"] = {};
  if (p) for (const k of YOU_KEYS) if (p.answers[k] != null) carried[k] = p.answers[k];
  const { stance, raisedIn, learning } = youAnswers(p);
  const seed: Profile["answers"] = {};
  if (door === "SPIRITUAL") {
    if (raisedIn) seed.raised = raisedIn;
    const feel = stance === "practice" ? "part" : stance === "unsure" ? "complicated" : stance === "left" ? "left" : null;
    if (feel && raisedIn && raisedIn !== "none" && raisedIn !== "other") seed.feelNow = feel;
  } else if (stance === "partner" && learning === door) {
    // Learning a partner's or family's faith: "what brings you" and "were you raised" are already answered.
    seed.why = "partner";
    seed.raised = "family";
  } else if (raisedIn === door) {
    // "which one do you practice?" doesn't say whether they grew up in it, so only the "grew up in" answers count
    if (stance !== "practice") seed.raised = "yes";
    if (freshEyes(stance, raisedIn, door)) seed.lens = "fresh";
  }
  return { ...emptyProfile(door, today), answers: { ...carried, ...seed } };
}
