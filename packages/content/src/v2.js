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
    // whole words, accented letters included (taṇhā, Ávila)
    const re = new RegExp(`(?<![\\p{L}\\p{M}])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{M}])`, "iu");
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

  if (script.shape && SHAPES[script.shape]) {
    // recipe v3 (docs/curriculum/RECIPE_V3.md): the day's shape sets the order and the lead game; five games at most
    // the lead game, from the planned steps or else straight from the script (planDay keeps only the day's feature game)
    const fromScript = (t) => (t === "myth" && g.myth ? { type: "myth", items: g.myth } : t === "fork" && g.fork ? { type: "fork", ...g.fork }
      : t === "original" && g.original && g.original.script ? { type: "original", ...g.original } : t === "trapdoor" && g.trapdoor ? { type: "trapdoor", word: script.word, floors: g.trapdoor } : null);
    const lead = (t) => { const s = of(t) || fromScript(t); return s ? [s.id != null ? s : { ...s, id: id++ }] : []; };
    const recall6 = (g.recall || []).filter((p) => Array.isArray(p) && p.length === 2).slice(0, 6);
    const reviewPairs = recall6.length >= 3 && match ? [{ ...match, pairs: recall6, review: recall6.map((p) => p[0]), tag: "reviewRound" }] : pairs;
    const parts = { bell, review, hook, newWord, teachA: teach.slice(0, half), teachB: teach.slice(half), rotating, chat, practice, word, pairs,
      reviewPairs, sound, carry, challenge, tally, fork: lead("fork"), myth: lead("myth"), trapdoor: lead("trapdoor"), original: lead("original") };
    const out = SHAPES[script.shape].flatMap((k) => parts[k] || []);
    // the cap: keep the first five graded games in order, drop the rest (the challenge and tally always stay)
    let games = 0;
    return out.filter((s) => { if (!GAMES.has(s.type) || s.tag === "challenge") return true; games += 1; return games <= 5; })
      .map((s) => (s.type === "bell" ? { ...s, shape: script.shape } : s));
  }
  return [...bell, ...review, ...hook, ...newWord, ...teach.slice(0, half), ...rotating, ...teach.slice(half), ...chat,
    ...practice, ...word, ...pairs, ...sound, ...carry, ...challenge, ...tally];
}

const GAMES = new Set(["guess", "chat", "match", "listen", "say", "rhythm", "myth", "fork", "trapdoor", "original", "scenes", "rush", "order", "taphear"]);

// Recipe v3's weekly rhythm: the same frame, a different inside. Each shape puts its lead beat where it does the work.
const SHAPES = {
  story: ["bell", "review", "hook", "newWord", "teachA", "fork", "teachB", "chat", "practice", "word", "pairs", "carry", "challenge", "tally"],
  puzzle: ["bell", "review", "hook", "myth", "newWord", "teachA", "teachB", "chat", "practice", "word", "pairs", "carry", "challenge", "tally"],
  debate: ["bell", "review", "hook", "newWord", "teachA", "teachB", "fork", "chat", "practice", "word", "carry", "challenge", "tally"],
  senses: ["bell", "review", "hook", "practice", "newWord", "teachA", "teachB", "original", "chat", "word", "sound", "carry", "challenge", "tally"],
  life: ["bell", "review", "hook", "chat", "newWord", "teachA", "teachB", "rotating", "practice", "word", "carry", "challenge", "tally"],
  wisdom: ["bell", "review", "hook", "newWord", "teachA", "teachB", "trapdoor", "chat", "practice", "word", "pairs", "carry", "challenge", "tally"],
  review: ["bell", "review", "reviewPairs", "hook", "teachA", "teachB", "chat", "myth", "practice", "word", "carry", "challenge", "tally"],
};
