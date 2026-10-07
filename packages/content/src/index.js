// @ih/content: the published design build's content and lesson logic (generated/ comes from
// scripts/extract-design.mjs), plus the one piece of lesson assembly that lived inside v175's Session.
import { composeV2, isV2 } from "./v2.js";
import data from "../generated/data.js";
import * as logic from "../generated/logic.js";
import { BET, QUIZ as WEEK_QUIZ, WEEK_INDEX } from "./week1-data.js";

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

// Each path's rebuilt first week (owner, 2026-10-06; docs/learning/week1/<DOOR>.json, built by scripts/learning/
// build-week1.mjs into week1-data.js): days 1–21 of the camp-one index follow the new order, day one's opening
// question matches it, and the "what do you think it means?" answers follow the days.
for (const [door, days] of Object.entries(WEEK_INDEX)) {
  const table = door === "HINDUISM" ? data.CAMP1_HIN : data.CAMP1_ALL?.[door];
  for (const [day, e] of Object.entries(days)) {
    const at = (table || []).findIndex((x) => x.day === +day);
    if (at >= 0) Object.assign(table[at], e);
  }
  if (BET[door] && data.ADULT?.[door]) { data.ADULT[door].word = BET[door].word; data.ADULT[door].bet = { options: BET[door].options, answer: BET[door].answer, reveal: BET[door].reveal }; }
  if (WEEK_QUIZ[door] && QUIZ[door]) Object.assign(QUIZ[door], WEEK_QUIZ[door]);
}

// The pilot has no accounts and a different analytics list than the design build assumed; say what's true.
if (Array.isArray(data.LEGAL) && data.LEGAL[1]?.[0] === "Privacy") {
  data.LEGAL[1] = ["Privacy", "we assume some of you are under eighteen. no ad identifiers, no third-party trackers, no selling data. in the pilot there are no accounts: your days, answers and book stay on your phone. if you turn on reminders, your reminder time and time zone go to our server so it can ring. anonymous usage (which screens you reach, never your answers, words or door) is collected only if you say yes. separately, the app counts that it was opened on a day and that a lesson was finished, with no id at all: only the day you started and how many days since. you can switch that off in you › your data."];
}

// The welcome promised "nobody here will ever ask what you believe" — but onboarding now asks, gently and
// optionally, how someone holds their faith. The true promise is that nobody tells you what to believe.
(function fixPromise(o) {
  for (const k of Object.keys(o || {})) {
    const v = o[k];
    if (typeof v === "string" && /nobody here will ever ask what you believe|NOBODY ASKS WHAT YOU BELIEVE/.test(v)) o[k] = v.replace("nobody here will ever ask what you believe", "nobody here will ever tell you what to believe").replace("NOBODY ASKS WHAT YOU BELIEVE", "NOBODY TELLS YOU WHAT TO BELIEVE");
    else if (v && typeof v === "object") fixPromise(v);
  }
})(data);

// Sources that aren't what they claim (script pilot, 2026-09-30). The design build quoted Pascal's popular modern
// paraphrase as his words, quoted Coleman Barks's copyrighted Rumi (not public domain), and told a story about the
// Prophet ﷺ (a neighbor's rubbish at his door) that has no source in the major hadith collections.
const PASCAL_POP = /all of humanity['’]s problems stem from man['’]s inability to sit quietly in a room alone/g;
const PASCAL_PD = "all the unhappiness of men arises from one single fact, that they cannot stay quietly in their own chamber (Pensées 139, Trotter's 1910 translation)";
const BARKS = /["“]out beyond ideas of wrongdoing and rightdoing there is a field["”]/g;
const RUMI_PD = "Rumi's field beyond our ideas of right and wrong (a paraphrase; the well-known wording is a modern, copyrighted version)";
(function fixSources(o) {
  for (const k of Object.keys(o || {})) {
    const v = o[k];
    if (typeof v === "string") o[k] = v.replace(PASCAL_POP, PASCAL_PD).replace(BARKS, RUMI_PD);
    else if (v && typeof v === "object") fixSources(v);
  }
})(data);
// the voices' own words for the two paths that had none yet (owner-supplied, 2026-10-01)
data.QUOTES = {
  ...data.QUOTES,
  SIKHISM: "Maharaj made us Sikh, and I will continue following Sikhi all my life.",
  SPIRITUAL: "God meets me every morning with forgiveness and love that I truly don’t deserve.",
};
{
  const pascal = (data.CAMP1_ALL?.SPIRITUAL || []).find((d) => d.day === 2);
  if (pascal && /humanity/.test(pascal.title)) pascal.title = "pascal: the quiet room";
  if (data.ADULT?.ISLAM?.fork && /rubbish/.test(data.ADULT.ISLAM.fork.setup)) {
    data.ADULT.ISLAM.fork = {
      setup: "a funeral procession passes the Prophet ﷺ and his companions, and he stands. someone tells him it's a Jewish man's funeral. what does he do?",
      options: ["sits back down.", "says it's not their concern.", "stays standing: was it not a soul?"],
      answer: 2,
      reveal: "he stayed standing, and said, in effect: was it not a soul? (Sahih al-Bukhari 1312; Sahih Muslim 961). the peace of salaam is owed to every person.",
    };
  }
  // The Lord's Prayer days (Christianity 4–8) had "the Lord's Prayer, line N" as the day's word; each gets a real word.
  const LP = { 1: "Father", 2: "kingdom", 3: "daily bread", 4: "forgive", 5: "deliver" };
  (function lordsPrayer(o) {
    for (const k of Object.keys(o || {})) {
      const v = o[k];
      if (typeof v === "string") o[k] = v.replace(/the Lord's Prayer, line (\d)/g, (m, n) => LP[n] || m).replace(/THE LORD'S PRAYER, LINE (\d)/g, (m, n) => (LP[n] ? LP[n].toUpperCase() : m));
      else if (v && typeof v === "object") lordsPrayer(v);
    }
  })(data);
  // The Catholic Mass days (3–5) had "the Mass, scene N" as the day's word; each gets a real word. Day 6's title said
  // "a teenage girl": Luke gives Mary no age (owner, 2026-09-30).
  const MASS = { 1: "the Gospel", 2: "the sign of peace", 3: "the Eucharist" };
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  (function massWords(o) {
    for (const k of Object.keys(o || {})) {
      const v = o[k];
      if (typeof v === "string") {
        o[k] = v
          .replace(/the Mass, scene (\d)/g, (m, n) => MASS[n] || m)
          .replace(/The Mass, scene (\d)/g, (m, n) => (MASS[n] ? cap(MASS[n]) : m))
          .replace(/THE MASS, SCENE (\d)/g, (m, n) => (MASS[n] ? MASS[n].toUpperCase() : m))
          .replace(/teenage girl/g, "young woman").replace(/Teenage girl/g, "Young woman").replace(/TEENAGE GIRL/g, "YOUNG WOMAN");
      } else if (v && typeof v === "object") massWords(v);
    }
  })(data);
  rebuildIslamCamp1();
  const golden = (data.CAMP1_ALL?.SPIRITUAL || []).find((d) => d.day === 4);
  if (golden && /arrived at it on its own/.test(golden.title)) {
    golden.title = "the rule that keeps turning up";
    golden.hook = "traditions far apart, over thousands of years, taught some version of it";
  }
}

// Islam camp one, re-ordered (owner, 2026-09-30). The design build squeezed al-Fatiha into three "lines" (days 6–8),
// so verse 5 had no day. Now each of its seven verses (Pickthall 1930 numbering, bismillah as verse 1) gets a day,
// 6–12, titled in Pickthall's words; verse 5 is tawhid's day. Wudu → the Prophet ﷺ follow on 13–20 (dhikr absorbs
// muraqaba); Yusuf and sabr leave camp one (they're taught on days 55–68 and 58). Day 21 stays. Moved topics keep
// their entries (word, hook, carry); every day's shell segments are rebuilt so reviews and day numbers follow the
// new order, and the placement quiz is re-drawn from it.
function rebuildIslamCamp1() {
  const old = data.CAMP1_ALL?.ISLAM;
  if (!Array.isArray(old) || old.length !== 21 || old[5]?.word !== "al-Fatiha, line 1") return;
  const byWord = (w) => old.find((d) => d.word === w);
  const verse = (title, word, hook, carry) => ({ title: `"${title}"`, word, hook, length: "8:00", carry });
  const tawhid = byWord("tawhid");
  const dhikr = byWord("dhikr");
  const order = [
    ...old.slice(0, 5),
    verse("In the name of Allah, the Beneficent, the Merciful", "al-Fatiha", "the opening — seven verses said seventeen times a day, and the first is a name", "in the name of the merciful"),
    verse("Praise be to Allah, Lord of the Worlds", "Rabb", "the lord who raises and tends every world, not just yours", "every world is tended"),
    verse("The Beneficent, the Merciful", "rahma", "mercy, named twice, before the word judgment ever appears", "mercy twice before anything else"),
    verse("Owner of the Day of Judgment", "yawm ad-din", "a day when every account is settled, held by the one just named merciful", "the account is in kind hands"),
    { ...tawhid, title: "\"Thee (alone) we worship; Thee (alone) we ask for help\"", hook: "the hinge of the prayer: it turns from talking about God to talking to God, and it says one" },
    verse("Show us the straight path", "as-sirat al-mustaqim", "the whole prayer is a request for directions", "show us the way"),
    verse("The path of those whom Thou hast favoured; Not (the path) of those who earn Thine anger nor of those who go astray", "amin", "the road described by the people on it, and the word said when the prayer ends", "walk with the ones who walked it well"),
    byWord("wudu"), byWord("salat"), byWord("the adhan"), byWord("Jumu'ah"),
    { ...dhikr, hook: "remembrance; a word repeated on the fingers, and the still watching (muraqaba) that sits beside it" },
    byWord("Ramadan"), byWord("zakat"), byWord("the Prophet ﷺ"), byWord("juz' 'amma"),
  ];
  if (order.some((d) => !d)) return;
  const N = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "twenty-one"];
  const ord = (n) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;
  const up = (s) => s.toUpperCase();
  const capF = (s) => s[0].toUpperCase() + s.slice(1);
  const plain = (s) => s.replace(/^"|"$/g, "");
  const days = order.map((e, i) => {
    const day = i + 1;
    if (day <= 5) return e;
    const prev = order[i - 1];
    const hook = plain(e.hook);
    return {
      ...e, day,
      segments: [
        { type: "the bell", duration: null, voice: "", screen: [`\`DAY ${up(N[day])}.\``] },
        { type: "review", duration: "15 sec", voice: `Yesterday: ${prev.word}. ${capF(prev.carry)}. Did it come up? Doesn't matter. Day ${N[day]}.`, screen: [`\`${up(prev.word)} ✓\` → \`DAY ${day}.\``] },
        { type: "the hook", duration: "40 sec", voice: `${capF(hook)}. That's today.`, screen: [`\`${up(e.word)}.\``, `\`${up(hook)}\``] },
        { type: "the teach", duration: "1 min 30", voice: `Here's the word: ${e.word}. ${capF(hook)}. Sit with that for a second — not the definition, the picture.`, screen: [`\`${up(e.word)}\``, `then, large: \`${up(e.carry)}\``] },
        { type: "the practice", duration: "1 min 30", voice: `One minute. Eyes open or closed, your call. Breathe once. Now say the word to yourself — ${e.word} — and let the picture come back. When your mind wanders, and it will, come back to the word. That's the whole practice.`, screen: ["sky only, halo pulsing. Bell returns at 1:00."] },
        { type: "the word", duration: "20 sec", voice: `${capF(e.word)}. Day ${N[day]}. It's yours now — it clicks onto the strand.`, screen: [`\`${up(e.word)} — your ${ord(day)} word\` → clicks onto the strand.`] },
        { type: "the carry", duration: "15 sec", voice: `Your line to carry: ${e.carry}. That's day ${N[day]}. You showed up.`, screen: [up(e.carry)] },
        { type: "the close", duration: null, voice: "", screen: [] },
      ],
    };
  });
  data.CAMP1_ALL.ISLAM = days;
  // the "what do you already know?" quiz samples camp-one words; re-draw it from the new order (same days as before)
  const pick = [1, 2, 3, 4, 6, 9, 13, 18].map((n) => days[n - 1]);
  const quiz = pick.map((d) => ({
    q: `${d.word} — what's underneath it?`,
    o: [d.carry, days[(d.day + 6) % 21].carry, days[(d.day + 13) % 21].carry],
    a: 0,
  }));
  if (data.PLACEMENT) data.PLACEMENT.ISLAM = quiz;
  if (data.PLACE_ALL) data.PLACE_ALL.ISLAM = quiz.map((x) => ({ ...x, o: [...x.o] }));
}

export { data };
export const { buildDay, icon, label, camp1, native, skyFor, faceFor, trailX, placeFromScore, iconsShared, splitBeats, screenLines, parseDur } = logic;
// The design build's offline Guide matched a lesson's word anywhere inside the question ("amin" in "examine",
// "al-Amin"). Match whole words only. And a word alone isn't enough (2026-10-01): "what is the Gayatri mantra?" hit
// day 7 ("mantra") though day 7 never mentions the Gayatri. A lesson answers only when its own text covers every
// other real term in the question; otherwise the Guide says plainly that the lessons don't cover it.
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** What the offline Guide says when no lesson covers the question (the app swaps in its own, translated wording). */
export const GUIDE_NO_MATCH = "None of the lessons covers that, and the live Guide isn't answering right now, so I won't guess. Ask me about one of your words, or ask someone who teaches in your tradition.";
// Question framing that says nothing about the topic (English and Spanish), so it needn't appear in the lesson.
const FRAME = new Set(`a about actually all also am an and any are as at be been behind but by can could did do does doing done each else
explain explained for from get give go had has have he her him his how i if in into is it its just know learn like me mean meaning
meanings means more most much my no not of on one or our out please really say says said she should so some story stories tell than
that the their them then there these they thing things this those to today todays up us was we were what whats when where which who
whom whose why will with word words would you your yours lesson lessons line idea ideas significance purpose origin role
al como cómo cual cuál cuales cuáles cuéntame cuentame de del detras detrás dia día el en es esa ese eso esta este esto historia hoy
la las lo los me mi mis para pero por porque que qué quien quién realidad realmente se significa significado sobre su sus te tu tus un una
uno unos y`.split(/\s+/));
const TOKEN = /[\p{L}\p{N}]+/gu;
const stem = (w) => (w.length > 4 ? w.replace(/(ing|ed|es|s)$/u, "") : w);
/** Every word of a lesson a person hears or reads: title, word, hook, carry, and each segment's voice and screen. */
function lessonText(d) {
  const parts = [d.title, d.word, d.hook, d.carry];
  for (const g of d.segments || []) parts.push(g?.voice, ...(Array.isArray(g?.screen) ? g.screen : []));
  return parts.filter((x) => typeof x === "string").join(" ").toLowerCase().normalize("NFC");
}
/** True when lesson d's own text covers the question: every real term in it, not just the lesson's word. */
export function lessonCovers(d, q) {
  const text = lessonText(d);
  const own = new Set(logic.strip(d?.word).normalize("NFC").match(TOKEN) || []);
  const terms = (logic.strip(q).normalize("NFC").match(TOKEN) || []).filter((w) => w.length > 2 && !FRAME.has(w) && !own.has(w));
  return terms.every((w) => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(stem(w))}`, "u").test(text));
}
export function guideFallback(wing, q) {
  const ql = logic.strip(q);
  const hit = logic.camp1(wing).find((d) => {
    const w = d.word && logic.strip(d.word);
    return w && new RegExp(`(^|[^\\p{L}\\p{N}'-])${escapeRe(w)}($|[^\\p{L}\\p{N}'-])`, "u").test(ql) && lessonCovers(d, q);
  });
  if (hit) {
    const teach = (hit.segments || []).find((g) => /teach/.test(g.type));
    const first = teach ? logic.splitBeats(teach.voice, 40, 99)[0] : null;
    return `${hit.word} — ${hit.carry}. ${first || ""} (that's from day ${hit.day}. I'm offline right now, so that's the lesson talking, not me.)`;
  }
  return GUIDE_NO_MATCH;
}

// ─── the five-year path ─────────────────────────────────────────────────────
// Year one is the five camps (331 days); years two to five follow, 365 days each. The owner's Hinduism plan
// (docs/curriculum, imported to generated/outline-hinduism.js) outlines every session from day 22 on; those days
// show the plan's own title, story, practice and carry, clearly marked as an outline until the full script exists.
import OUTLINE_HINDUISM from "../generated/outline-hinduism.js";
// every other path's five-year plan (docs/curriculum/<door>/y1–y5.md → scripts/import-paths.mjs). DRAFT outlines.
import OUTLINE_CHRISTIANITY from "../generated/outline-christianity.js";
import OUTLINE_CATHOLIC from "../generated/outline-catholic.js";
import OUTLINE_JUDAISM from "../generated/outline-judaism.js";
import OUTLINE_ISLAM from "../generated/outline-islam.js";
import OUTLINE_BUDDHISM from "../generated/outline-buddhism.js";
import OUTLINE_SIKHISM from "../generated/outline-sikhism.js";
import OUTLINE_SPIRITUAL from "../generated/outline-spiritual.js";
const asMap = (o) => new Map(o.sessions.map((s) => [s.day, s]));
export const OUTLINES = Object.freeze({
  HINDUISM: asMap(OUTLINE_HINDUISM), CHRISTIANITY: asMap(OUTLINE_CHRISTIANITY), CATHOLIC: asMap(OUTLINE_CATHOLIC), JUDAISM: asMap(OUTLINE_JUDAISM),
  ISLAM: asMap(OUTLINE_ISLAM), BUDDHISM: asMap(OUTLINE_BUDDHISM), SIKHISM: asMap(OUTLINE_SIKHISM), SPIRITUAL: asMap(OUTLINE_SPIRITUAL),
});
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
/** A day with no outline word takes the head of its title: whole up to 40 characters, otherwise cut at a word
 *  boundary (never mid-word) and never left hanging on a small joining word. */
export function titleHead(title) {
  const head = title.split(/[;:(—–,·]/)[0].trim();
  if (head.length <= 40) return head;
  let cut = head.slice(0, 41).replace(/\s\S*$/, "").trim();
  while (/\s(of|the|a|an|and|in|to|is|was|are|who|as|for|on|at|by|with|from)$/i.test(cut)) cut = cut.replace(/\s\S+$/, "");
  return cut;
}
function outlineLesson(wing, day, s) {
  const p = pos(day);
  const title = s.title.length > 90 ? `${s.title.slice(0, 88).replace(/\s\S*$/, "")}…` : s.title;
  const word = s.word && !NO_WORD.test(s.word) ? s.word : titleHead(title);
  const carry = s.carry || title;
  const part = (s.part || "").replace(/\s*\((?:Days )?\d+[–-]\d+[^)]*\)/g, "").replace(/\s+—\s+.*$/, "");
  return {
    day, title, word, carry, hook: s.hook || title, camp: p, later: true, outline: true, part,
    segments: [
      { type: "the bell", duration: null, voice: "", screen: [`DAY ${day}.`] },
      { type: "the hook", duration: "30 sec", voice: `${part ? `${part}. ` : ""}${title}.${s.hook ? ` ${s.hook}.` : ""}`, screen: [part.toUpperCase() || p.name.toUpperCase(), title.toUpperCase()] },
      { type: "the teach", duration: "1 min", voice: `Today, in short: ${title}.${s.hook ? ` ${s.hook}.` : ""}`, screen: ["TODAY, IN SHORT"] },
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
// the design build's "missed yesterday" note predates rest days; the rest stay verbatim
export const SUN_NOTES = (wing, short, word) => logic.SUN_NOTES(wing, short, word).map(([t, m]) => (t === "missed yesterday" ? ["missed yesterday", "a rest day covered yesterday. your streak's safe, and today's right where you left it."] : [t, m]));
export const STRAND_WORDS = logic.STRAND_WORDS;
export const DOORS = data.DOORS; // [label, key]; the design build's fake counts are removed at extraction

// Day one's welcome: v175's first-person WELCOME from each door's voice (the owner's design, restored 2026-09-28).
// HOUSE_WELCOME is the unnamed alternative, used only when a caller passes named: false.
const HOUSE_WELCOME = "Hey. Day one. Before anything else, three promises. It's a few minutes a day. Rest days are built in, so a missed day never costs you your place. And nobody here will tell you what to believe. One word, one breath, one line to carry. Let's begin.";

/** The day's segments, exactly as v175 Session assembled them (welcome inserted on day 1). */
export function segmentsFor(wing, day, lesson = day, { named = true, info: given = null } = {}) {
  const ic = icon(wing);
  const info = given || lessonInfo(wing, lesson);
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
  const segs = day === 1 ? [base[0], welcome, ...base.slice(1)] : base;
  return { info, d1, segs: segs.flatMap(splitPromises) };
}

// Day one's "three promises" welcome has three labels but only two pages of voice, so the third promise showed under
// the second promise's label. Give each promise its own page, under its own label (the intro rides with promise one).
function splitPromises(g) {
  if (!/^(a )?welcome/.test(g.type || "")) return [g];
  const heads = screenLines(g.screen);
  if (heads.length < 2) return [g];
  const parts = g.voice.split(/\s+(?=(?:One|Two|Three|Four|Five) — )/);
  if (parts.length === heads.length + 1) parts.splice(0, 2, `${parts[0]} ${parts[1]}`);
  if (parts.length !== heads.length) return [g];
  return parts.map((voice, k) => ({ ...g, voice, screen: [`\`${heads[k]}.\``] }));
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

// A full script's own games, as steps (see lesson-script.js and docs/curriculum/SCRIPT_GUIDE.md).
function scriptStep(info, type) {
  const G = info?.games || {};
  if (type === "myth" && G.myth) return { type: "myth", items: G.myth };
  if (type === "fork" && G.fork) return { type: "fork", ...G.fork };
  if (type === "original" && G.original) return { type: "original", ...G.original };
  if (type === "trapdoor" && G.trapdoor) return { type: "trapdoor", word: info.word, floors: G.trapdoor };
  return null;
}

// With a script, the day's pairs come from today's teaching, and the practice is the script's own words from day one
// (the design build replaced days 1–7 with one fixed line because the thin templates had nothing to say there).
function withScript(steps, info, day) {
  const match = info.games?.match;
  let out = steps.map((s) => (s.type === "match" && match ? { ...s, prompt: match.prompt, pairs: match.pairs } : s));
  if (day <= 7) {
    const practice = info.segments.find((g) => /^the practice/.test(g.type));
    const at = out.findIndex((s) => s.type === "beat" && /^the practice/.test(String(s.seg || "")));
    if (practice && at >= 0) {
      let id = Math.max(...out.map((s) => s.id)) + 1;
      const beats = splitBeats(practice.voice, 45, 2).map((text) => ({ type: "beat", seg: practice.type, text, head: null, id: id++ }));
      out = [...out.slice(0, at), ...beats, ...out.slice(at).filter((s) => !(s.type === "beat" && /^the practice/.test(String(s.seg || ""))))];
    }
  }
  return out;
}

// On a script day the guess ("talent — what do you think it means?") took the carry line ("fear buries things") as the
// meaning (QA atlas v9). The script says what the word means in its "the word" segment ("Talent. A large weight of
// silver, entrusted to a servant."): that's the answer; the wrong guesses are the script's own "what you thought"
// (trapdoor) and things from inside the story (its match pairs). Without a clear meaning the guess stays as it was.
const SENTENCES = /(?<=[.!?])\s+/;
const bare = (s) => String(s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const asOption = (s) => { const t = String(s || "").trim().replace(/[.!]+$/, ""); return t ? t[0].toLowerCase() + t.slice(1) : ""; };
function scriptMeaning(info) {
  const seg = (info.segments || []).find((g) => /^the word/.test(g.type || ""));
  const [first, second, third] = String(seg?.voice || "").split(SENTENCES);
  const w = bare(info.word);
  if (!w || !second || !bare(first).endsWith(w)) return null;
  let m = asOption(second);
  // "Yisrael. Israel. One who strives with God…": a one- or two-word gloss carries on into the next sentence
  if (bare(m).split(" ").length < 3 && third) m = `${m}: ${asOption(third)}`;
  return m.length >= 6 && m.length <= 90 ? m : null;
}
// When "the word" segment doesn't open with a gloss (the Lord's Prayer days: "Line one of the Lord's Prayer. Our
// Father…"), the script's trapdoor still says it plainly: "what it means: …". Its first sentence is the answer.
const MEANS = /^what it means:\s*/i;
function trapdoorMeaning(info) {
  const floor = (info.games?.trapdoor || [])[1];
  if (typeof floor !== "string" || !MEANS.test(floor)) return null;
  const m = asOption(floor.replace(MEANS, "").split(SENTENCES)[0]);
  return m.length >= 6 && m.length <= 90 ? m : null;
}
// A match pair's right side is often another true gloss of the word ("grace" → "a gift, a favor, freely given"),
// which made two answers right. A wrong answer may not share a content word with the right one.
const STOP = new Set(["the", "and", "that", "this", "with", "from", "for", "not", "but", "its", "it's", "you", "your", "are", "was", "who", "one", "all", "every", "into", "than", "what", "when", "they", "them", "said", "says"]);
const content = (s, skip) => new Set(bare(s).split(" ").filter((w) => w.length >= 3 && !STOP.has(w) && !skip.has(w)));
function overlaps(a, b, word) {
  const skip = new Set(bare(word).split(" "));
  const A = content(a, skip);
  for (const w of content(b, skip)) if (A.has(w) || [...A].some((x) => x.length >= 5 && w.length >= 5 && (x.startsWith(w) || w.startsWith(x)))) return true;
  return false;
}
/** The guess for a day: { answer, wrong: [..] } from the camp-one quiz table, else the script, else null. */
export function guessFor(wing, lesson, info) {
  const fixed = lesson <= 21 ? QUIZ[wing]?.[lesson] : null;
  if (fixed) return { answer: fixed[0], wrong: fixed.slice(1) };
  if (!info?.script) return null;
  // the script's own choices (games.guess: [what the word means, wrong, wrong]), written for the lesson (2026-10 style pass)
  const own = info.games?.guess;
  if (Array.isArray(own) && own.length === 3 && own.every((x) => typeof x === "string" && x.trim())) return { answer: own[0], wrong: own.slice(1) };
  const meaning = scriptMeaning(info) || trapdoorMeaning(info);
  if (!meaning) return null;
  const seen = new Set([bare(meaning), bare(info.word)]);
  const wrong = [];
  const add = (t) => {
    const o = asOption(t);
    if (o && o.length <= 90 && !seen.has(bare(o)) && !/^(why|how|who|what|when|where)\b/i.test(o) && !overlaps(meaning, o, info.word)) { seen.add(bare(o)); wrong.push(o); }
  };
  const thought = (info.games?.trapdoor || [])[0];
  if (typeof thought === "string" && /^what you thought:/i.test(thought)) add(thought.replace(/^what you thought:\s*/i, ""));
  for (const [left, right] of info.games?.match?.pairs || []) if (bare(left) !== bare(info.word) && !bare(left).endsWith(` ${bare(info.word)}`)) add(right);
  return wrong.length >= 2 ? { answer: meaning, wrong } : null;
}
function applyGuess(steps, wing, lesson, info, n = 2) {
  const g = guessFor(wing, lesson, info);
  if (!g) return steps;
  const options = [g.answer, ...g.wrong.slice(0, n)];
  const turn = (lesson || 0) % options.length; // same order every time for a day, answer not always first
  return steps.map((s) => (s.type === "guess" ? { ...s, options: [...options.slice(turn), ...options.slice(0, turn)], answer: g.answer } : s));
}

/**
 * Everything a session screen needs: ordered steps, the word and the carry line. Real sit times.
 * `script` (optional): the day's full script from lessonScript(); without one, the lesson is built exactly as before.
 */
export function planDay({ wing, day, lesson = day, mode = "adult", named = true, level = 0, script = null }) {
  const given = script && script.day === lesson ? lessonFromScript(script, pos(lesson)) : null;
  const { info, d1, segs } = segmentsFor(wing, day, lesson, { named, info: given });
  const R = buildDay({ wing, day, lesson, data: info, d1, segs, demoFast: false, mode });
  let steps = given ? withScript(R.steps, given, day) : R.steps;
  if (mode === "adult") {
    if (day === 1) steps = steps.filter((s) => !PACED[s.type]);
    // day one kept its games for later and read like a run of "next" screens (2026-10-03 review). With a script, it
    // gets the lesson's own pairs right after the teaching: one quick, hands-on check of the four ideas it just met.
    const pairs = given?.games?.match;
    if (day === 1 && pairs && !steps.some((s) => s.type === "match")) {
      const lastTeach = steps.map((s) => s.type === "beat" && /^the teach/.test(String(s.seg || ""))).lastIndexOf(true);
      if (lastTeach >= 0) {
        const nextId = Math.max(...steps.map((s) => s.id)) + 1;
        steps = [...steps.slice(0, lastTeach + 1), { type: "match", prompt: pairs.prompt, pairs: pairs.pairs, id: nextId }, ...steps.slice(lastTeach + 1)];
      }
    }
    const paced = Object.keys(PACED).find((k) => PACED[k] === day);
    // days 2–5 introduce one game each (about today's word when there's a script); from day 6 a script plays one more
    const type = paced || (given && day > 5 ? featureFor(day, given.games) : null);
    const extra = type ? (given && scriptStep(given, type)) || (paced ? pacedStep(wing, type) : null) : null;
    if (extra) {
      const nextId = Math.max(...steps.map((s) => s.id)) + 1;
      const tally = steps.length - 1; // just before the tally
      steps = [...steps.slice(0, tally), { ...extra, id: nextId, newToday: !!paced }, ...steps.slice(tally)];
    }
  }
  if (!named) {
    // v175 prompts address the proposed voice by name ("say it back to Priyanka"); without a license, address nobody.
    const short = icon(wing).short;
    const unname = (t) => (typeof t === "string" ? t.replace(`${short}'s ideas`, "the ideas").replace(` back to ${short}`, " back") : t);
    steps = steps.map((s) => ({ ...s, prompt: unname(s.prompt), hint: unname(s.hint) }));
  }
  // Rising challenge (level 1–5; 0 = the plain lesson, as before). Children keep the plain lesson.
  if (level && mode === "adult") steps = levelUp(steps, { wing, day, level });
  // tap what you hear: a one- or two-word line gets the day's word in front, and tiles keep their apostrophes
  steps = steps.map((s) => (s.type === "taphear" ? { ...s, ...tapRound({ word: R.word, carry: R.carry, hook: info?.hook, wing, level: mode === "adult" ? level : 0, seed: lesson * 11 + 9 }) } : s));
  // the guess answers with what the word means, not the day's carry line (after the level's own guess, which reaches
  // for carry lines): camp one's quiz table first, then the script's own gloss
  steps = applyGuess(steps, wing, lesson, given || info, level >= 3 && mode === "adult" ? 3 : 2);
  if (mode === "adult" && given?.games?.build) steps = upgradeWeek(steps, given, wing, day);
  // the new recipe (v2.js), for a script that carries its data
  if (mode === "adult" && script && script.day === lesson && isV2(script)) steps = composeV2(steps, script, day);
  return { steps, word: R.word, carry: R.carry, title: info?.title || d1.title || "", info };
}

export const GRADED = Object.freeze(["chat", "order", "match", "listen", "taphear", "bet", "myth", "scenes", "typeit", "rush", "rhythm", "build", "lookback", "think", "checkin"]);

// The upgraded first week (week.js; owner, 2026-10-06). Shorter bubbles; fewer, better games (build the word, a look
// back past yesterday, a last thinking question; on day 7 a check-in on the week instead of the quick round); what most
// people get wrong, and the story behind it as an optional card, right after the teaching.
const SHORT = /^(review|the hook|the teach|the practice|the word|the carry|a welcome)/;
const DROP = new Set(["listen", "say", "rhythm", "scenes", "rush"]);
const seeded = (arr, seed) => arr.map((v, i) => [Math.sin(seed * 7.13 + i * 3.7), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
function upgradeWeek(steps0, info, wing, day) {
  const G = info.games;
  let id = Math.max(...steps0.map((s) => s.id)) + 1;
  const steps = [];
  for (const s of steps0) {
    if (DROP.has(s.type)) continue;
    if (s.type === "beat" && SHORT.test(String(s.seg || "")) && s.text.split(/\s+/).length > 46) {
      splitBeats(s.text, 38, 99).forEach((text, k) => steps.push({ ...s, text, head: k ? null : s.head, id: k ? id++ : s.id }));
    } else steps.push(s);
  }
  // a head stays only over the bubble that says it (re-splitting left heads over the wrong lines); the opener's answer
  // can be the script's own, plainer reveal
  const shares = (head, text) => String(head || "").toLowerCase().split(/[^\p{L}]+/u).some((w) => w.length >= 4 && String(text).toLowerCase().includes(w));
  for (const s of steps) {
    if (s.type === "beat" && s.head && /^the teach/.test(String(s.seg || "")) && !shares(s.head, s.text)) s.head = null;
    if (s.type === "bet" && G.betReveal) s.reveal = G.betReveal;
  }
  const at = (pred) => steps.reduce((last, s, k) => (pred(s) ? k : last), -1);
  const put = (k, add) => steps.splice(k, 0, ...add.filter(Boolean).map((s) => ({ ...s, id: id++ })));
  // after the teaching: what most people get wrong, the story (optional), then build the word right after the pairs
  const teach = at((s) => s.type === "beat" && /^the teach/.test(String(s.seg || "")));
  if (teach >= 0) put(teach + 1, [G.wrong && { type: "wrong", ...G.wrong }, G.story && { type: "story", ...G.story }]);
  const match = at((s) => s.type === "match");
  const build = G.build && { type: "build", prompt: G.build.prompt, pieces: G.build.pieces, decoys: G.build.decoys || [], word: G.build.word };
  // build the word goes inside the teaching, as soon as every piece has been said (it breaks up a long run of reading)
  if (build) {
    let said = "", k0 = -1;
    const has = (p) => new RegExp(`(^|[^\\p{L}])${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "iu").test(said);
    for (let k = 0; k < steps.length && k0 < 0; k++) {
      const s = steps[k];
      if (s.type === "beat" && /^the teach/.test(String(s.seg || ""))) { said += ` ${s.text}`; if (build.pieces.every(has)) k0 = k; }
    }
    const lastTeach = at((s) => s.type === "beat" && /^the teach/.test(String(s.seg || "")));
    put(k0 >= 0 && k0 < lastTeach - 1 ? k0 + 1 : match >= 0 ? match + 1 : lastTeach + 1, [build]);
  }
  // a long stretch of teaching left (six bubbles or more) gets "what most people get wrong" in its middle instead
  const isTeach = (s) => s?.type === "beat" && /^the teach/.test(String(s.seg || ""));
  let run = [0, 0];
  for (let k = 0, start = -1; k <= steps.length; k++) {
    if (isTeach(steps[k])) { if (start < 0) start = k; } else if (start >= 0) { if (k - start > run[1] - run[0]) run = [start, k]; start = -1; }
  }
  const wrongAt = steps.findIndex((s) => s.type === "wrong");
  if (wrongAt >= 0 && run[1] - run[0] >= 6) {
    const [w] = steps.splice(wrongAt, 1);
    steps.splice(run[0] + Math.ceil((run[1] - run[0]) / 2), 0, w);
  }
  // a look back past yesterday, right after the review
  const back = lookBack(wing, day);
  if (back) {
    const review = at((s) => s.type === "beat" && /^review/.test(String(s.seg || "")));
    const options = seeded(back.options, day * 13 + 5);
    put(review >= 0 ? review + 1 : 1, [{ type: "lookback", graded: true, word: back.word, from: back.day, prompt: back.q, options, answer: back.options[back.answer] }]);
  }
  // the last thinking question and, at the end of the week, the check-in, just before the tally
  const tally = steps.length - 1;
  const week = WEEK_ONE[wing];
  const checkin = week && day === week.length && { type: "checkin", items: week.map((x, k) => ({ ...x, options: seeded(x.options, day * 31 + k), answer: x.options[x.answer] })) };
  put(tally, [G.think && { type: "think", ...G.think }, checkin]);
  return steps;
}

import { levelUp, tapRound } from "./level.js";
import { QUIZ } from "./quiz.js";
import { WEEK_ONE, lookBack } from "./week.js";
export { SAY_IT, WEEK_ONE, lookBack, sayable } from "./week.js";
export { composeV2, glossIn, isV2 } from "./v2.js";
import { featureFor, lessonFromScript } from "./lesson-script.js";
export { FORMAT as SCRIPT_FORMAT, checkScript, chunkOf, chunkPath, compileScript, featureFor, lessonFromScript, lessonScript, orderIdeas, resetLessonCache, spoken } from "./lesson-script.js";
export { LEVELS, clampLevel, deeperRound, knownSoFar, levelUp, likeness, rushStep, syllables, tapRound, tile, tileKey, wrongAnswers } from "./level.js";
export { KIDS_PER_DOOR, KID_BREATHS, KID_DOORS, kidLesson, kidLessonIndex, kidPlan } from "./kids.js";
