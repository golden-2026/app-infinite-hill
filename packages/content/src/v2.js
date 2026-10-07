// The new lesson recipe (owner, 2026-10-07, after studying Duolingo): teaching broken up by questions, fewer and
// varied games, old words mixed back in, one sound game only for a word from another language, a challenge to finish.
// It applies to a script that carries the new data (games.chat), so every other lesson is built exactly as before.
//
//   games.chat    { who, says, options: [3], answer: 0-2, meaning }   "complete the chat": pick the best reply
//   games.gloss   { "<term>": { meaning, script?, say? } }            tap a word in the teaching to see what it means
//   games.recall  [["<old word>", "<its meaning>"], …]                 earlier words mixed into today's pairs
//
// Order: bell · review · hook · NEW WORD (the guess) · first half of the teaching · one rotating game (myth / fork /
// trapdoor, by day) · rest of the teaching · the chat · practice · word · pairs (today's + old words) · one sound game
// (only when today's word has an original-language form) · carry · the challenge (build today's line) · tally.

const ROTATE = ["myth", "fork", "trapdoor"];
const SOUND = ["listen", "say", "rhythm"];

/** True when a script carries the new recipe's data. */
export const isV2 = (script) => !!(script && script.games && script.games.chat && Array.isArray(script.games.chat.options));

/** Terms from games.gloss that appear in a line, longest first (so "Lanka" never steals from "Lankan"). */
export function glossIn(gloss, text) {
  if (!gloss || !text) return null;
  const found = {};
  for (const term of Object.keys(gloss).sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(text)) found[term] = gloss[term];
  }
  return Object.keys(found).length ? found : null;
}

/** Rebuild a planned lesson (planDay's steps) in the new order. `steps` keep their ids; new steps get fresh ones. */
export function composeV2(steps, script, day) {
  if (!isV2(script)) return steps;
  const g = script.games;
  let id = Math.max(...steps.map((s) => s.id)) + 1;
  const of = (type) => steps.find((s) => s.type === type);
  const beats = (seg) => steps.filter((s) => s.type === "beat" && new RegExp(`^${seg}`).test(String(s.seg || "")));
  const withGloss = (b) => ({ ...b, gloss: glossIn(g.gloss, b.text) });

  const bell = steps.filter((s) => s.type === "bell");
  const review = beats("review").map(withGloss);
  const hook = beats("the hook").map(withGloss);
  const teach = beats("the teach").map(withGloss);
  const half = Math.ceil(teach.length / 2);
  const practice = steps.filter((s) => (s.type === "beat" && /^the practice/.test(String(s.seg || ""))) || s.type === "sit" || s.type === "breath");
  const word = beats("the word").map(withGloss);
  const carry = beats("the carry");
  const tally = steps.filter((s) => s.type === "tally");

  // the day's word, met first as a question (Duolingo's "new word"); the answer's meaning shows in the banner
  const guess = of("guess");
  const newWord = guess ? [{ ...guess, tag: "newWord", meaning: guess.answer }] : [];
  // one rotating game after the first half of the teaching, so no two days in a row feel the same
  const pick = ROTATE.map((_, k) => ROTATE[(day + k) % ROTATE.length]).find((t) => of(t));
  const rotating = pick ? [of(pick)] : [];
  const chat = [{ type: "chat", graded: true, who: g.chat.who, says: g.chat.says, options: g.chat.options, answer: g.chat.options[g.chat.answer], meaning: g.chat.meaning || null, id: id++ }];
  // today's pairs plus up to two earlier words (built-in review); five pairs at most
  const match = of("match");
  const recall = (g.recall || []).filter((p) => Array.isArray(p) && p.length === 2).slice(0, 2);
  const pairs = match ? [{ ...match, pairs: [...match.pairs.slice(0, 5 - recall.length), ...recall], review: recall.map((p) => p[0]) }] : [];
  // one sound game, only for a word with an original-language form, rotating hear / say / rhythm
  const hasOriginal = !!(g.original && g.original.script);
  const sound = hasOriginal ? [SOUND[day % SOUND.length]].map((t) => of(t)).filter(Boolean) : [];
  // the finale: build today's line from tiles
  const tap = of("taphear");
  const challenge = tap ? [{ ...tap, tag: "challenge" }] : [];

  return [...bell, ...review, ...hook, ...newWord, ...teach.slice(0, half), ...rotating, ...teach.slice(half), ...chat,
    ...practice, ...word, ...pairs, ...sound, ...carry, ...challenge, ...tally];
}
