// The kids' track (ages 6–12): a child under 13 sitting at the family table gets these story lessons instead of the
// grown-up path. Each door has its own first set of 21, written in English and Spanish, in
// packages/content/kids/<door>.json (format "ih-kids/1", see docs/curriculum/KIDS_GUIDE.md). The build
// (scripts/build-kids.mjs) copies them, without review notes, into generated/kids.js, which this module reads.
//
// A kid's lesson is short and always the same shape: the story in four pictures, "put the story in order", one game
// (match on odd days, "in the story?" on even days), the day's word, a 30-second breath (four slow breaths), the line to
// carry, and the tally, where the grown-up holding the phone sees a "for grown-ups" note (where the story comes from,
// and a question to ask together). No Guide, no welcome from a voice, no community line, no level-ups.
import KIDS from "../generated/kids.js";
import { DOOR_KEYS, FORBIDDEN, BRITISH, PD_TRANSLATIONS } from "./lesson-script.js";

export const KIDS_FORMAT = "ih-kids/1";
export const KIDS_PER_DOOR = 21;
export const KID_BREATHS = 4; // 4 slow breaths, 4 s in and 4 s out: about 30 seconds
export const KID_LANGS = Object.freeze(["en", "es"]);

/** The kids' lesson for a child's day on a door: days past the set start the set again (day 22 is story 1). */
export function kidLessonIndex(day) {
  const d = Number.isInteger(day) && day > 0 ? day : 1;
  return ((d - 1) % KIDS_PER_DOOR) + 1;
}

/** The whole lesson (both languages) for a door and a child's day, or null if the door has no kids' set. */
export function kidLesson(door, day) {
  const set = KIDS[String(door || "").toUpperCase()];
  if (!set) return null;
  const n = kidLessonIndex(day);
  return set.lessons.find((l) => l.day === n) || null;
}

/** Every door with a kids' set. */
export const KID_DOORS = Object.freeze(Object.keys(KIDS));

/**
 * The steps of a child's lesson, ready for the session screen. `lang` picks the language ("en" | "es"); `labels` are
 * the app's own words around the story (from t(), so the app stays the one place UI strings live):
 *   { bell, order, truthQ, truthKicker, yes, no, yesDot, noDot, word, breath, carry, story, game, wordSeg, breathSeg, lineSeg }
 * Returns { steps, word, carry, title, kid: { grownups, sources, heads, key } } or null when there's no kids' lesson.
 */
export function kidPlan({ door, day, lang = "en", labels = {} }) {
  const L = kidLesson(door, day);
  if (!L) return null;
  const c = L[lang === "es" ? "es" : "en"];
  const lb = (k, fb) => (typeof labels[k] === "string" ? labels[k] : fb);
  const steps = [];
  let id = 0;
  const push = (s) => steps.push({ ...s, id: id++ });
  push({ type: "bell", text: lb("bell", c.title) });
  c.story.forEach((b) => push({ type: "beat", seg: "the story", label: lb("story", "the story"), head: b.head.toUpperCase(), text: b.text }));
  push({ type: "order", label: lb("game", "the game"), prompt: lb("order", "put the story back in order."), items: c.story.map((b) => b.head) });
  if (L.game === "match") push({ type: "match", label: lb("game", "the game"), prompt: c.game.prompt, pairs: c.game.pairs });
  else push({ type: "myth", label: lb("game", "the game"), kicker: lb("truthKicker", "in the story?"), q: lb("truthQ", "did it happen in the story?"), yes: lb("yes", "in the story"), no: lb("no", "not in it"), yesDot: lb("yesDot", "in the story."), noDot: lb("noDot", "not in it."), items: c.game.items });
  push({ type: "beat", seg: "the word", label: lb("wordSeg", "the word"), head: c.word.toUpperCase(), text: fill(lb("word", "today's word: {word}. {means}."), { word: c.word, means: c.means }) });
  push({ type: "beat", seg: "the breath", label: lb("breathSeg", "the breath"), head: null, text: c.breath });
  push({ type: "breath", n: KID_BREATHS, label: lb("breathSeg", "the breath") });
  push({ type: "beat", seg: "the carry", label: lb("lineSeg", "your line"), head: null, text: fill(lb("carry", "your line: {carry}"), { carry: c.carry }) });
  push({ type: "tally" });
  return { steps, word: c.word, carry: c.carry.replace(/[.!]$/, ""), title: c.title, info: null, kid: { grownups: c.grownups, sources: L.sources || [], heads: c.story.map((b) => b.head), key: L.key, day: L.day } };
}

const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (v[k] == null ? m : String(v[k]).replace(/[.!?]$/, "")));

// ─── the format check (used by scripts/validate-kids.mjs and the tests) ─────────────────────────────────────────────

// Kids' sources may also name these public-domain translations (Aesop, the Jataka).
export const KIDS_PD = Object.freeze([...PD_TRANSLATIONS, /^Townsend 1867\b/, /^Cowell 1895\b/, /^Jacobs 1894\b/]);
// Words that don't belong in a story for a six-year-old (fear, gore, guilt), and the grown-up feed the kids' track replaced.
export const KIDS_FORBIDDEN = Object.freeze([
  [/\b(bloody|bloodied|gore|kill(s|ed|ing)?|murder(ed|s)?|slaughter(ed)?|behead(ed)?|corpse|torture[ds]?|hell ?fire|damn(ed|ation)?|matar(on|ó)?|asesin\w*|infierno)\b/i, "too frightening or violent for the kids' track"],
  [/\b(follower count|mid-scroll|doomscroll\w*|scrolling|1 ?am|2 ?am|group chat|yoga class|instagram|tiktok|together tab|community and events)\b/i, "grown-up lesson text"],
  [/\b(shame on|bad (boy|girl|kid)|you should feel|naughty)\b/i, "guilt"],
  [/\b(ask the guide|the guide tab|celebrity|famous voice)\b/i, "the Guide or a voice has no place in kid mode"],
]);
const W = (s) => (String(s || "").trim().match(/\S+/g) || []).length;
const LOWER_OK = /^[^A-Z]*$|[A-Z]/; // names may be capitalized; checked loosely below

/** Checks one door's kids' file. Returns { errors, warnings }. */
export function checkKids(file, door) {
  const errors = [], warnings = [];
  const err = (m) => errors.push(m), warn = (m) => warnings.push(m);
  if (!file || typeof file !== "object") return { errors: ["not an object"], warnings };
  if (file.format !== KIDS_FORMAT) err(`format must be "${KIDS_FORMAT}"`);
  if (door && file.door !== door) err(`door must be "${door}"`);
  if (!DOOR_KEYS.includes(file.door)) err(`unknown door "${file.door}"`);
  if (!file.review || file.review.status !== "pending") err(`review.status must stay "pending" until a Keeper signs off`);
  const lessons = Array.isArray(file.lessons) ? file.lessons : [];
  if (lessons.length !== KIDS_PER_DOOR) err(`needs exactly ${KIDS_PER_DOOR} lessons (has ${lessons.length})`);
  const keys = new Set();
  lessons.forEach((L, i) => {
    const at = `day ${L?.day ?? i + 1}`;
    const e = (m) => err(`${at}: ${m}`), w = (m) => warn(`${at}: ${m}`);
    if (L.day !== i + 1) e(`day must be ${i + 1}`);
    if (typeof L.key !== "string" || !/^[a-z0-9-]{3,40}$/.test(L.key)) e(`key must be a short slug`);
    else if (keys.has(L.key)) e(`key "${L.key}" repeats`); else keys.add(L.key);
    const wantGame = L.day % 2 === 1 ? "match" : "truth";
    if (L.game !== wantGame) e(`game must be "${wantGame}" (match on odd days, truth on even days)`);
    if (!Array.isArray(L.sources) || !L.sources.length) e(`needs at least one source`);
    for (const s of L.sources || []) {
      if (!s || typeof s.ref !== "string" || !s.ref || typeof s.work !== "string" || !s.work) e(`each source needs ref and work`);
      else if (s.quoted != null) {
        if (typeof s.quoted !== "string" || !s.quoted.trim()) e(`source ${s.ref}: quoted must be the exact words or null`);
        if (typeof s.translation !== "string" || !KIDS_PD.some((re) => re.test(s.translation))) e(`source ${s.ref}: quoted from "${s.translation}", which isn't on the public-domain list`);
      }
    }
    if (L.notes != null && !Array.isArray(L.notes)) e(`notes must be a list`);
    const shape = {};
    for (const lang of KID_LANGS) {
      const c = L[lang];
      const el = (m) => e(`${lang}: ${m}`), wl = (m) => w(`${lang}: ${m}`);
      if (!c || typeof c !== "object") { el(`missing`); continue; }
      for (const k of ["title", "word", "means", "carry", "breath"]) if (typeof c[k] !== "string" || !c[k].trim()) el(`${k} is missing`);
      if (W(c.title) > 9) wl(`title is long (${W(c.title)} words)`);
      if (String(c.means || "").length > 70) el(`means is over 70 characters`);
      if (W(c.carry) > 12) el(`carry is over 12 words`);
      if (W(c.breath) < 8 || W(c.breath) > 40) el(`breath should be 8–40 words (has ${W(c.breath)})`);
      if (!Array.isArray(c.story) || c.story.length !== 4) el(`story needs exactly 4 beats`);
      else {
        const heads = new Set();
        c.story.forEach((b, k) => {
          if (!b || typeof b.head !== "string" || typeof b.text !== "string") return el(`beat ${k + 1} needs head and text`);
          if (b.head.length > 40) el(`beat ${k + 1} head is over 40 characters`);
          if (/^(then|and|y|luego|después)\b/i.test(b.head)) el(`beat ${k + 1} head starts with a joining word`);
          if (heads.has(b.head.toLowerCase())) el(`beat heads repeat`); heads.add(b.head.toLowerCase());
          const n = W(b.text);
          if (n < 18 || n > 70) el(`beat ${k + 1} is ${n} words (18–70)`);
        });
        const total = c.story.reduce((n, b) => n + W(b?.text), 0);
        if (total < 100 || total > 240) el(`story is ${total} words (100–240)`);
      }
      const g = c.game || {};
      if (L.game === "match") {
        if (typeof g.prompt !== "string" || !g.prompt) el(`match needs a prompt`);
        if (!Array.isArray(g.pairs) || g.pairs.length !== 3) el(`match needs exactly 3 pairs`);
        else {
          const ls = new Set(), rs = new Set();
          g.pairs.forEach((p, k) => {
            if (!Array.isArray(p) || p.length !== 2 || p.some((x) => typeof x !== "string" || !x.trim())) return el(`pair ${k + 1} must be two strings`);
            if (p.some((x) => x.length > 34)) el(`pair ${k + 1} has a side over 34 characters`);
            ls.add(p[0].toLowerCase()); rs.add(p[1].toLowerCase());
          });
          if (ls.size !== 3 || rs.size !== 3) el(`match sides must all differ`);
        }
        shape.pairs = (shape.pairs || []).concat([g.pairs?.length]);
      } else if (L.game === "truth") {
        if (!Array.isArray(g.items) || g.items.length !== 3) el(`truth needs exactly 3 items`);
        else {
          g.items.forEach((x, k) => {
            if (!Array.isArray(x) || x.length !== 3 || typeof x[0] !== "string" || typeof x[1] !== "boolean" || typeof x[2] !== "string") return el(`truth item ${k + 1} must be [claim, true|false, reveal]`);
            if (x[0].length > 110) el(`truth item ${k + 1} claim is over 110 characters`);
            if (x[2].length > 130) el(`truth item ${k + 1} reveal is over 130 characters`);
          });
          const v = g.items.map((x) => x?.[1]);
          if (!v.includes(true) || !v.includes(false)) el(`truth needs at least one "in the story" and one "not in it"`);
          shape[lang] = v.join(",");
        }
      }
      const gr = c.grownups || {};
      if (typeof gr.source !== "string" || W(gr.source) < 6 || W(gr.source) > 60) el(`grownups.source should be 6–60 words`);
      if (typeof gr.ask !== "string" || !/\?\s*$/.test(gr.ask.trim()) || W(gr.ask) > 30) el(`grownups.ask must be one question of 30 words or fewer`);
      const text = JSON.stringify(c);
      for (const [re, why] of [...FORBIDDEN, ...KIDS_FORBIDDEN]) if (re.test(text)) el(`${why} — "${text.match(re)[0]}"`);
      if (lang === "en") { const b = text.replace(/“[^”]*”|\\"[^"]*\\"/g, " ").match(BRITISH); if (b) wl(`British spelling "${b[0]}"`); }
    }
    if (L.game === "truth" && shape.en && shape.es && shape.en !== shape.es) e(`es truth answers must match en (${shape.en} vs ${shape.es})`);
    if (L.en?.story && L.es?.story && L.en.story.length !== L.es.story.length) e(`es story must have the same beats as en`);
  });
  void LOWER_OK;
  return { errors, warnings };
}

/** The file as the app ships it: no review block, no notes. */
export function compileKids(file) {
  return { format: file.format, door: file.door, lessons: file.lessons.map(({ notes, ...l }) => l) };
}
