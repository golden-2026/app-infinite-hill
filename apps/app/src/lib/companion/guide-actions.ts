// What the Guide can offer as a tap, under an answer (docs/GUIDE_PLAYBOOK.md, rule 5 "always leave a next step"):
//  - "switch to my own path": moment B (grew up in a door and moved on, "stop talking about X", "move me") or when the
//    answer itself points to my own path. It moves their door the same way You › your path does (switchHome).
//  - "try a week of many paths" (content/sampler.ts): for a seeker ("which path is for me?", "build me a path",
//    "i'm not religious, where do i start?").
// And the tidier "remember this" offers: at most two, never one already kept, each short enough for a chip.
// Pure, so tests/features/guide-actions.test.mjs can check it. Nothing here is sent anywhere.

export type GuideAction = "ownPath" | "sampler";

// moment B, in English and Spanish
const FAITHS = "(it|religion|faith|god|church|islam|muslims?|christian\\w*|catholic\\w*|hindu\\w*|jew\\w*|juda\\w*|buddhis\\w*|sikh\\w*)";
const MOVED = new RegExp([
  "stop (talking|telling) (to )?(me )?about",
  `don.?t care (about|for) ${FAITHS}\\b`,
  "grew up\\b[^.?!]*\\b(but|and)\\b[^.?!]*\\b(don.?t|not|no longer|done|left|stopped)",
  "raised (as )?(a )?[a-z]+ (and|but)", "(i.?m|i am) done with",
  "move me", "transfer me", "switch me", "take me (somewhere|to)",
  "(another|different) (religion|door|path|faith|tradition)", "isn.?t for me", "not for me anymore",
  "left the (church|faith|religion|mosque|temple|synagogue)",
].join("|"), "i");
const MOVED_ES = /(deja de hablarme de|ya no me importa|me cri[eé] (en|como)|crec[ií] (en|como)|ya termin[eé] con|ya acab[eé] con|c[aá]mbiame|ll[eé]vame a otr|otra (religi[oó]n|puerta|tradici[oó]n|fe)|otro camino|ya no es para m[ií])/i;
// moment A, in English and Spanish
const SEEKER = /\b(which (path|religion|door|faith|tradition)|what (path|religion|faith|tradition) (is|fits|should|would)|(path|religion) (is )?(for|right for) me|(build|create|make|design) (me )?(a |my )?(spiritual )?path|not (very |at all )?religious|no religion|(where|how) (do|should|can) i (even )?(start|begin)|many (paths|traditions|religions)|all (the )?(religions|traditions)|spiritual but|explore (other |different )?(religions|traditions|paths))/i;
const SEEKER_ES = /(qu[eé] (camino|religi[oó]n|puerta|tradici[oó]n|fe)|(cr[eé]a|hazme|arma|dise[nñ]a)(me)? un camino|no soy (muy )?religios|sin religi[oó]n|por d[oó]nde (empiezo|empezar|comienzo)|muchos caminos|todas las (religiones|tradiciones)|explorar (otras )?(religiones|tradiciones))/i;
const OWN_PATH = /\bmy own path\b|\bmi propio camino\b/i;

export const movedOn = (q: string) => MOVED.test(q) || MOVED_ES.test(q);
export const seeking = (q: string) => SEEKER.test(q) || SEEKER_ES.test(q);

/**
 * The taps to offer under one answer. `door` is the door on screen; `samplerStarted`: the week is already under way
 * (or done), so it isn't offered again.
 */
export function guideActions(o: { question: string; answer?: string | null; door: string; samplerStarted?: boolean }): GuideAction[] {
  const q = o.question || "";
  const out: GuideAction[] = [];
  if (o.door !== "SPIRITUAL" && (movedOn(q) || OWN_PATH.test(o.answer || ""))) out.push("ownPath");
  if (!o.samplerStarted && seeking(q)) out.push("sampler");
  return out;
}

/** Where someone's doors stand (the three settings a path change touches). */
export type DoorSpot = { homeWing: string; visitWing: string | null; active: "home" | "visit" };

/** Make `door` their path, exactly as You › your path does: a door they were visiting stops being a visit. Every day
 *  walked stays (days are sits, kept by door), so their days come with them, and switching back finds them again. */
export function switchHome(st: DoorSpot, door: string): DoorSpot {
  return { homeWing: door, visitWing: st.visitWing === door ? null : st.visitWing, active: "home" };
}

/** What to restore on "undo". */
export const spotOf = (st: DoorSpot): DoorSpot => ({ homeWing: st.homeWing, visitWing: st.visitWing ?? null, active: st.active === "visit" ? "visit" : "home" });

/** The companion's "remember" offers, tidied: trimmed, no repeats, nothing already kept, at most `max`. */
export function rememberOffers(offers: readonly unknown[] | null | undefined, kept: ReadonlySet<string>, max = 2): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const f of offers || []) {
    if (typeof f !== "string") continue;
    const text = f.trim().replace(/\s+/g, " ");
    const k = text.toLowerCase().replace(/[.!]+$/, "");
    if (!text || seen.has(k) || kept.has(k) || kept.has(text.toLowerCase())) continue;
    seen.add(k);
    out.push(text);
    if (out.length >= max) break;
  }
  return out;
}

/** A fact as a chip: no closing period, and cut at a word near `max` characters (the full fact stays in the a11y label). */
export function shortFact(f: string, max = 38): string {
  const s = f.trim().replace(/[.!]+$/, "");
  if (s.length <= max) return s;
  const cut = s.slice(0, max + 1);
  const at = cut.lastIndexOf(" ");
  return `${(at > max * 0.5 ? cut.slice(0, at) : s.slice(0, max)).replace(/[,;:\s]+$/, "")}…`;
}
