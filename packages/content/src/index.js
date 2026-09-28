// @ih/content: the published design build's content and lesson logic (generated/ comes from
// scripts/extract-design.mjs), plus the one piece of lesson assembly that lived inside v175's Session.
import data from "../generated/data.js";
import * as logic from "../generated/logic.js";

// Camps 2–5 are outline titles lifted from the design doc; a few are editing notes, not titles ("as in the Catholic
// lane above" ×38, "public-domain translation"). Shown to people as "tomorrow: as in the Catholic lane above", so
// until those camps are written, a scrap falls back to the camp's own name (e.g. "the stories").
const OUTLINE_SCRAP = /\blane above\b|^public-domain translation$|^one verse carried per day/i;
for (const camps of Object.values(data.LATER || {})) {
  for (const [camp, titles] of Object.entries(camps)) {
    const name = (data.CAMPS.find(([c]) => c === camp) || [])[1];
    if (name && Array.isArray(titles)) camps[camp] = titles.map((t) => (typeof t === "string" && OUTLINE_SCRAP.test(t.trim()) ? name.toLowerCase() : t));
  }
}

// The pilot has no accounts and a different analytics list than the design build assumed; say what's true.
if (Array.isArray(data.LEGAL) && data.LEGAL[1]?.[0] === "Privacy") {
  data.LEGAL[1] = ["Privacy", "we assume some of you are under eighteen. no ad identifiers, no third-party trackers, no selling data. in the pilot there are no accounts: your days, answers and book stay on your phone. if you turn on reminders, your reminder time and time zone go to our server so it can ring. anonymous usage (which screens you reach, never your answers, words or door) is collected only if you say yes."];
}

// The welcome promised "nobody here will ever ask what you believe" — but onboarding now asks, gently and
// optionally, how someone holds their faith. The true promise is that nobody tells you what to believe.
(function fixPromise(o) {
  for (const k of Object.keys(o || {})) {
    const v = o[k];
    if (typeof v === "string" && v.includes("nobody here will ever ask what you believe")) o[k] = v.replace("nobody here will ever ask what you believe", "nobody here will ever tell you what to believe");
    else if (v && typeof v === "object") fixPromise(v);
  }
})(data);

export { data };
export const { buildDay, icon, label, camp1, native, skyFor, faceFor, trailX, placeFromScore, guideFallback, iconsShared, splitBeats, screenLines, parseDur } = logic;

// ─── the five-year path ─────────────────────────────────────────────────────
// Year one is the five camps (331 days); years two to five follow, 365 days each. The owner's Hinduism plan
// (docs/curriculum, imported to generated/outline-hinduism.js) outlines every session from day 22 on; those days
// show the plan's own title, story, practice and carry, clearly marked as an outline until the full script exists.
import OUTLINE_HINDUISM from "../generated/outline-hinduism.js";
export const OUTLINES = Object.freeze({ HINDUISM: new Map(OUTLINE_HINDUISM.sessions.map((s) => [s.day, s])) });
export const YEAR_ONE = data.CAMPS.reduce((n, c) => n + c[2], 0); // 331

/** Where a day sits on the path: its camp (or year), that part's name, the lesson within it, and the day it starts. */
export function pos(day) {
  if (day <= YEAR_ONE) {
    const p = logic.pos(day);
    const start = data.CAMPS.slice(0, data.CAMPS.findIndex(([c]) => c === p.camp)).reduce((n, c) => n + c[2], 0) + 1;
    return { ...p, start };
  }
  const year = 2 + Math.floor((day - YEAR_ONE - 1) / 365);
  const start = YEAR_ONE + 1 + (year - 2) * 365;
  return { camp: `Year ${year}`, name: "the ranges", lesson: day - start + 1, of: 365, start };
}

const NO_WORD = /^[\s—–-]*$/;
function outlineLesson(wing, day, s) {
  const p = pos(day);
  const title = s.title.length > 90 ? `${s.title.slice(0, 88).replace(/\s\S*$/, "")}…` : s.title;
  const word = s.word && !NO_WORD.test(s.word) ? s.word : title.split(/[;:(—–,·]/)[0].trim().slice(0, 32);
  const carry = s.carry || title;
  const part = (s.part || "").replace(/\s*\((?:Days )?\d+[–-]\d+[^)]*\)/g, "").replace(/\s+—\s+.*$/, "");
  return {
    day, title, word, carry, hook: s.hook || title, camp: p, later: true, outline: true, part,
    segments: [
      { type: "the bell", duration: null, voice: "", screen: [`DAY ${day}.`] },
      { type: "the hook", duration: "30 sec", voice: `${part ? `${part}. ` : ""}${title}.${s.hook ? ` ${s.hook}.` : ""}`, screen: [part.toUpperCase() || p.name.toUpperCase(), title.toUpperCase()] },
      { type: "the teach", duration: "1 min", voice: `This is today's outline — the full script is being written, and a Keeper will check it before it's recorded. Today: ${title}.${s.hook ? ` ${s.hook}.` : ""}`, screen: ["OUTLINE · FULL SCRIPT COMING"] },
      { type: "the practice", duration: "1 min", voice: s.practice ? `Try this: ${s.practice}.` : "One minute. Breathe. Hold today's idea, and let the rest go.", screen: [] },
      { type: "the carry", duration: "15 sec", voice: `Your line to carry: ${carry}. Day ${day}. You showed up.`, screen: [carry.toUpperCase()] },
      { type: "the close", duration: null, voice: "", screen: [] },
    ],
  };
}

/** A day's lesson: the written script (camp one), the owner's outline where one exists, else the generated shell. */
export function lessonInfo(wing, lesson) {
  const s = OUTLINES[wing]?.get(lesson);
  if (s && lesson > 21) return outlineLesson(wing, lesson, s);
  if (lesson > YEAR_ONE) {
    // No plan for this door past year one yet: an honest shell instead of "Lesson 101 of 100".
    const p = pos(lesson);
    return outlineLesson(wing, lesson, { title: `${p.camp.toLowerCase()} · the ranges`, hook: "this part of the path is still being planned", part: p.camp });
  }
  return logic.lessonInfo(wing, lesson);
}
export const KNOW = logic.KNOW;
export const SUN_NOTES = logic.SUN_NOTES;
export const STRAND_WORDS = logic.STRAND_WORDS;
export const DOORS = data.DOORS; // [label, key]; the design build's fake counts are removed at extraction

// Day one's welcome: v175's first-person WELCOME from each door's voice (the owner's design, restored 2026-09-28).
// HOUSE_WELCOME is the unnamed alternative, used only when a caller passes named: false.
const HOUSE_WELCOME = "Hey. Day one. Before anything else, three promises. It's a few minutes a day. A missed day never costs you anything. And nobody here will tell you what to believe. One word, one breath, one line to carry. Let's begin.";

/** The day's segments, exactly as v175 Session assembled them (welcome inserted on day 1). */
export function segmentsFor(wing, day, lesson = day, { named = true } = {}) {
  const ic = icon(wing);
  const info = lessonInfo(wing, lesson);
  const d1 = data.DAY1[wing] || data.DAY1.SPIRITUAL;
  const welcome = named
    ? { type: "a welcome", duration: "30 sec", voice: data.WELCOME[wing] || data.WELCOME.SPIRITUAL, screen: [`A WELCOME FROM ${ic.name.toUpperCase()}`] }
    : { type: "a welcome", duration: "30 sec", voice: HOUSE_WELCOME, screen: ["A WELCOME"] };
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
export function planDay({ wing, day, lesson = day, mode = "adult", named = true, level = 0 }) {
  const { info, d1, segs } = segmentsFor(wing, day, lesson, { named });
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
  if (!named) {
    // v175 prompts address the proposed voice by name ("say it back to Priyanka"); without a licence, address nobody.
    const short = icon(wing).short;
    const unname = (t) => (typeof t === "string" ? t.replace(`${short}'s ideas`, "the ideas").replace(` back to ${short}`, " back") : t);
    steps = steps.map((s) => ({ ...s, prompt: unname(s.prompt), hint: unname(s.hint) }));
  }
  // Rising challenge (level 1–5; 0 = the plain lesson, as before). Children keep the plain lesson.
  if (level && mode === "adult") steps = levelUp(steps, { wing, day, level });
  return { steps, word: R.word, carry: R.carry, title: info?.title || d1.title || "", info };
}

export const GRADED = Object.freeze(["order", "match", "listen", "taphear", "bet", "myth", "scenes", "typeit", "rush", "rhythm"]);

import { levelUp } from "./level.js";
export { LEVELS, clampLevel, deeperRound, knownSoFar, levelUp, likeness, rushStep, syllables, wrongAnswers } from "./level.js";
