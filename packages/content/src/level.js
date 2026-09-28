// Rising challenge. A lesson is built the same way every day (generated/logic.js); `levelUp` then tunes it to
// the person's level (1–5): closer wrong answers, more choices, fewer replays, typing instead of tapping, a
// longer line to say, more scenes to order — plus the physical games (drag the scenes, say it, tap the rhythm)
// and, once a week, a quick timed round across everything learned so far. "Go deeper" is the same thing two
// levels up, as an optional extra round after the lesson.
import { camp1, lessonInfo } from "./index.js";

export const LEVELS = Object.freeze(["", "first steps", "steady", "deeper", "sure-footed", "keeper-level"]);
export const clampLevel = (n) => Math.max(1, Math.min(5, Math.round(Number(n) || 1)));

const strip = (s) => String(s || "").replace(/[.!?,;:"“”'’—–-]/g, " ").replace(/\s+/g, " ").toLowerCase().trim();

// A seeded shuffle so the same lesson looks the same after a reload.
function rng(seed) {
  let x = (seed >>> 0) || 1;
  return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function shuffle(a, seed) {
  const r = rng(seed);
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

// How alike two strings are (0–1): shared letter pairs (Dice), a nudge for the same first letter and length.
function bigrams(s) {
  const t = strip(s).replace(/ /g, "");
  const out = [];
  for (let i = 0; i < t.length - 1; i++) out.push(t.slice(i, i + 2));
  return out;
}
export function likeness(a, b) {
  const A = bigrams(a), B = bigrams(b);
  if (!A.length || !B.length) return 0;
  const pool = [...B];
  let hit = 0;
  for (const g of A) { const k = pool.indexOf(g); if (k >= 0) { hit++; pool.splice(k, 1); } }
  const dice = (2 * hit) / (A.length + B.length);
  const first = strip(a)[0] === strip(b)[0] ? 0.15 : 0;
  const len = 0.1 * (1 - Math.min(1, Math.abs(strip(a).length - strip(b).length) / 8));
  return dice + first + len;
}
// Meanings are alike when they share words (not letters).
function meaningLikeness(a, b) {
  const stop = new Set(["the", "a", "an", "to", "of", "is", "in", "and", "you", "your", "it", "what", "that", "then", "for", "with", "be", "on"]);
  const A = new Set(strip(a).split(" ").filter((w) => w && !stop.has(w)));
  const B = new Set(strip(b).split(" ").filter((w) => w && !stop.has(w)));
  let hit = 0;
  for (const w of A) if (B.has(w)) hit++;
  return hit / Math.max(1, Math.min(A.size, B.size)) + 0.05 * (1 - Math.min(1, Math.abs(a.length - b.length) / 30));
}

/** The words and lines someone has met so far on this door (for review, the timed round and close wrong answers). */
export function knownSoFar(wing, day) {
  const seen = new Map();
  for (const d of camp1(wing) || []) if (d.day <= day && d.word && d.carry) seen.set(strip(d.word), { word: d.word, carry: d.carry.replace(/[.!]$/, ""), day: d.day });
  for (let k = 22; k <= Math.min(day, 400); k++) {
    const d = lessonInfo(wing, k);
    if (d?.word && d?.carry && !/being planned/.test(d.hook || "")) seen.set(strip(d.word), { word: d.word, carry: String(d.carry).replace(/[.!]$/, ""), day: k });
  }
  return [...seen.values()];
}

// The whole door's vocabulary, used as a pool of possible wrong answers (never the answer itself).
function pool(wing) {
  return knownSoFar(wing, 400);
}

/** Wrong answers for `answer`: random ones at level 1, the closest-looking (or closest-meaning) as the level rises. */
export function wrongAnswers(answer, candidates, { n, level, seed, meaning = false }) {
  const others = [...new Set(candidates.filter((c) => c && strip(c) !== strip(answer)))];
  if (level <= 1) return shuffle(others, seed).slice(0, n);
  const score = meaning ? meaningLikeness : likeness;
  const ranked = others.map((c) => [c, score(answer, c)]).sort((x, y) => y[1] - x[1]).map(([c]) => c);
  // level 2 mixes one close and one random; level 3+ are all close
  if (level === 2) {
    const close = ranked.slice(0, 1);
    return [...close, ...shuffle(ranked.slice(1), seed).slice(0, n - close.length)];
  }
  return ranked.slice(0, n);
}

/** Split a word into rough syllables for the rhythm game ("namaste" → na·ma·ste). */
export function syllables(word) {
  // sh, ch, th, ph and the aspirated bh/dh/gh/kh/jh count as one sound; a lone consonant between vowels starts
  // the next syllable (na·ma), a pair splits (bhak·ti)
  const DI = ["sh", "ch", "th", "ph", "bh", "dh", "gh", "kh", "jh"];
  const w = DI.reduce((t, d, k) => t.split(d).join(String.fromCharCode(0xe000 + k)), strip(word).replace(/ /g, ""));
  const C = "[^aeiouy]";
  const parts = w.match(new RegExp(`${C}*[aeiouy]+(?:${C}(?=${C}[aeiouy]|${C}$))?`, "g")) || [w];
  const joined = parts.join("");
  if (joined.length < w.length) parts[parts.length - 1] += w.slice(joined.length);
  return parts.filter(Boolean).map((p) => p.replace(/[-]/g, (c) => DI[c.charCodeAt(0) - 0xe000]));
}

const RUSH_SECS = [0, 45, 40, 35, 30, 25];

/** The timed round: match each word to its line against the clock. */
export function rushStep(wing, day, level, seed, { n } = {}) {
  const known = knownSoFar(wing, day);
  if (known.length < 3) return null;
  const count = n || Math.min(known.length, 4 + Math.floor(level / 2));
  const picks = shuffle(known, seed).slice(0, count);
  return {
    type: "rush",
    prompt: "quick round — match every word to its line.",
    secs: RUSH_SECS[clampLevel(level)],
    pairs: picks.map((p) => [p.word, p.carry]),
  };
}

/** Tune one day's steps to a level. `deep` is the optional harder round (a short, all-game set). */
export function levelUp(steps, { wing, day, level = 1, seed = day * 7 + 3 }) {
  const L = clampLevel(level);
  const vocab = pool(wing);
  const known = knownSoFar(wing, day);
  const words = vocab.map((v) => v.word);
  const lines = vocab.map((v) => v.carry);
  let id = Math.max(0, ...steps.map((s) => s.id)) + 1;
  const out = [];
  for (const s of steps) {
    switch (s.type) {
      case "guess": {
        // (ungraded: the lesson is about to teach it) closer wrong meanings make the guess worth thinking about
        const n = L >= 3 ? 3 : 2;
        out.push({ ...s, options: shuffle([s.answer, ...wrongAnswers(s.answer, lines, { n, level: L, seed, meaning: true })], seed + 1), level: L });
        break;
      }
      case "listen": {
        if (L >= 4) {
          // no choices at all: hear it, type it
          out.push({ ...s, type: "typeit", prompt: "type the word you hear.", answer: s.answer, replays: 2, level: L });
          break;
        }
        const n = L >= 3 ? 3 : 2;
        out.push({ ...s, options: shuffle([s.answer, ...wrongAnswers(s.answer, words, { n, level: L, seed: seed + 2 })], seed + 3), replays: L >= 3 ? 1 : 99, level: L });
        break;
      }
      case "match": {
        if (L >= 3 && s.pairs.length < 4) {
          const have = new Set(s.pairs.map((p) => strip(p[0])));
          const more = shuffle(known.filter((k) => !have.has(strip(k.word))), seed + 4).slice(0, 4 - s.pairs.length);
          out.push({ ...s, pairs: [...s.pairs, ...more.map((k) => [k.word, k.carry])], level: L });
        } else out.push({ ...s, level: L });
        break;
      }
      case "order": {
        // tapping in order becomes dragging the story's scenes into place
        out.push({ ...s, type: "scenes", prompt: s.prompt.replace(/^put /, "drag ").replace(/ back in order\.?$/, " into the order they came."), items: s.items.slice(0, L >= 3 ? 5 : 4), level: L });
        break;
      }
      case "taphear": {
        const extraN = L >= 3 ? 5 : L === 2 ? 4 : 3;
        const have = new Set(s.words.map(strip));
        const spare = [...new Set(lines.join(" ").split(/\s+/).map(strip).filter((w) => w && !have.has(w)))];
        const decoys = wrongAnswers(s.words.join(" "), spare, { n: extraN, level: L >= 3 ? 1 : 1, seed: seed + 5 });
        out.push({ ...s, bank: shuffle([...s.words, ...decoys], seed + 6), replays: L >= 4 ? 1 : 99, level: L });
        break;
      }
      case "speak": {
        // say it into the microphone (when there is one); from level 3 it's the whole carry line, not just the word
        const carry = steps.find((x) => x.type === "taphear")?.speak;
        out.push({ ...s, type: "say", say: L >= 3 && carry ? carry : s.say, word: s.say, level: L });
        // then the word's rhythm, from the first week on
        if (day >= 3) {
          const syl = syllables(s.say);
          if (syl.length >= 2 && syl.length <= 6) out.push({ type: "rhythm", id: id++, word: s.say, syllables: syl, rounds: L >= 3 ? 3 : 2, bpm: [0, 76, 84, 92, 100, 108][L], level: L, newToday: day === 3 });
        }
        break;
      }
      case "tally": {
        // once a week: the quick timed round across everything so far, just before the tally
        if (day >= 7 && day % 7 === 0) {
          const r = rushStep(wing, day, L, seed + 7);
          if (r) out.push({ ...r, id: id++, newToday: day === 7, seg: "the week, quick" });
        }
        out.push(s);
        break;
      }
      default:
        out.push(s);
    }
  }
  return out;
}

/** "Go deeper": a short extra round, two levels up, all games — no story, no sit. */
export function deeperRound(wing, day, level) {
  const L = clampLevel(level + 2);
  const known = knownSoFar(wing, day);
  const today = known.find((k) => k.day === day) || known[known.length - 1];
  if (!today) return [];
  const seed = day * 13 + 5;
  const vocab = pool(wing);
  let id = 0;
  const steps = [];
  steps.push({ id: id++, type: "typeit", prompt: "type the word you hear.", speak: today.word, answer: today.word, replays: 1, level: L });
  steps.push({ id: id++, type: "guess", graded: true, prompt: `${today.word} — which line is it?`, options: shuffle([today.carry, ...wrongAnswers(today.carry, vocab.map((v) => v.carry), { n: 3, level: 5, seed, meaning: true })], seed), answer: today.carry, level: L });
  const r = rushStep(wing, day, L, seed + 1, { n: Math.min(6, Math.max(3, known.length)) });
  if (r) steps.push({ ...r, id: id++ });
  steps.push({ id: id++, type: "say", say: today.carry, word: today.word, level: L });
  steps.push({ id: id++, type: "tally", deep: true });
  return steps;
}
