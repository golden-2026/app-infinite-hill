// @ih/content: the published design build's content and lesson logic (generated/ comes from
// scripts/extract-design.mjs), plus the one piece of lesson assembly that lived inside v175's Session.
import data from "../generated/data.js";
import * as logic from "../generated/logic.js";

export { data };
export const { lessonInfo, buildDay, icon, label, pos, camp1, native, skyFor, faceFor, trailX, placeFromScore, guideFallback, iconsShared, splitBeats, screenLines, parseDur } = logic;
export const KNOW = logic.KNOW;
export const SUN_NOTES = logic.SUN_NOTES;
export const STRAND_WORDS = logic.STRAND_WORDS;
export const DOORS = data.DOORS; // [label, key]; the design build's fake counts are removed at extraction

/** The day's segments, exactly as v175 Session assembled them (welcome inserted on day 1). */
export function segmentsFor(wing, day, lesson = day) {
  const ic = icon(wing);
  const info = lessonInfo(wing, lesson);
  const d1 = data.DAY1[wing] || data.DAY1.SPIRITUAL;
  const welcome = { type: "a welcome", duration: "30 sec", voice: data.WELCOME[wing] || data.WELCOME.SPIRITUAL, screen: [`A WELCOME FROM ${ic.name.toUpperCase()}`] };
  const base = info ? info.segments : [
    { type: "the bell", duration: "2 sec", voice: "", screen: ["DAY ONE."] },
    { type: "the hook", duration: "20 sec", voice: d1.hook.join(" "), screen: d1.hook.map((t) => t.toUpperCase()) },
    { type: "the teach", duration: "25 sec", voice: d1.teach.join(" "), screen: d1.teach.map((t) => t.toUpperCase()) },
    { type: "the practice", duration: "1 min", voice: "Sit however you're sitting. One hand on your chest, if you want. Someone is in there. Say hi.", screen: [] },
    { type: "the word", duration: "20 sec", voice: `${d1.word}. Your first word.`, screen: [`${d1.word.toUpperCase()} — your 1st word`] },
    { type: "the carry", duration: "15 sec", voice: `Your line to carry: ${d1.carry.replace(/[.!]$/, "")}. That's day ${day}. You showed up.`, screen: [d1.carry.toUpperCase()] },
    { type: "the close", duration: "2 sec", voice: "", screen: [] },
  ];
  return { info, d1, segs: day === 1 ? [base[0], welcome, ...base.slice(1)] : base };
}

// Pacing (approved 2026-09-25): v175 put five exercise types into day one. Day one keeps "call it";
// the other four arrive one a day, marked "new today", all about the first word so the week deepens it.
// Nothing is removed: every exercise still appears, on its own day.
export const PACED = Object.freeze({ myth: 2, fork: 3, original: 4, trapdoor: 5 });

function pacedStep(wing, type) {
  const A = data.ADULT[wing];
  if (!A) return null;
  if (type === "myth" && A.myth) return { type: "myth", items: A.myth };
  if (type === "fork" && A.fork) return { type: "fork", ...A.fork };
  if (type === "original" && A.original) return { type: "original", ...A.original };
  if (type === "trapdoor" && A.trapdoor) return { type: "trapdoor", word: A.word, floors: A.trapdoor };
  return null;
}

/** Everything a session screen needs: ordered steps, the word and the carry line. Real sit times. */
export function planDay({ wing, day, lesson = day, mode = "adult" }) {
  const { info, d1, segs } = segmentsFor(wing, day, lesson);
  const R = buildDay({ wing, day, lesson, data: info, d1, segs, demoFast: false, mode });
  let steps = R.steps;
  if (mode === "adult") {
    if (day === 1) steps = steps.filter((s) => !PACED[s.type]);
    const type = Object.keys(PACED).find((k) => PACED[k] === day);
    const extra = type ? pacedStep(wing, type) : null;
    if (extra) {
      const nextId = Math.max(...steps.map((s) => s.id)) + 1;
      const tally = steps.length - 1; // just before the tally
      steps = [...steps.slice(0, tally), { ...extra, id: nextId, newToday: true }, ...steps.slice(tally)];
    }
  }
  return { steps, word: R.word, carry: R.carry, title: info?.title || d1.title || "", info };
}

export const GRADED = Object.freeze(["order", "match", "listen", "taphear", "bet", "myth"]);
