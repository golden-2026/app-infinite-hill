// The one lime word in a "cinema" caption (owner's standard, 2026-11-08). Shared by episodes/build.mjs and episodes/c/films.mjs.
//   pickKeyword(text, { names, prefer }) -> the word as written in the text (punctuation trimmed), or "" when nothing fits
// Order: a proper noun (a name: Jesus, Moses, Guru Nanak…) > a preferred word (the lesson's own word) > the most important noun
// (longest content word that isn't a stopword or an obvious verb). Never a stopword.
const STOP = new Set(("a an the and or but nor so yet for of to in on at by with from into onto upon over under about above below after before " +
  "since until till than then that this these those there here where when what which who whom whose why how it its it's itself " +
  "i me my mine we us our ours you your yours he him his she her hers they them their theirs one ones some any all each every both " +
  "no not none nothing never ever just only also too very really still even again once more most much many few less least other another " +
  "such same own is am are was were be been being have has had having do does did doing done will would shall should can could may might must " +
  "say says said tell told ask asked go goes went gone come came comes get got make made take took give gave see saw know knew let lets " +
  "like as if because though although while out up down off back away now today tonight yes yeah okay ok oh well thing things way ways " +
  "something someone anyone everyone everything anything somebody nobody every day days time times year years new old good great little big " +
  "first last next long right left whole kind sort lot lots bit put keep kept turn turned look looked looks call called asks says tells " +
  "goes going comes coming means meant mean want wanted wants need needs needed feel felt try tried seem seemed became become becomes " +
  "himself herself themselves yourself myself ourselves together around through across against between among without within along toward towards " +
  "ago already always often almost enough quite rather maybe perhaps instead later soon nearby near far young two three four five six seven " +
  "eight nine ten hundred thousand brought bring brings began begin begins answered replied stood sat ran walked").split(/\s+/));
// names that should win even in an all-lowercase caption
const NAMES = ["god", "jesus", "christ", "mary", "joseph", "peter", "paul", "john", "moses", "abraham", "abram", "sarah", "sarai", "isaac", "jacob",
  "david", "solomon", "noah", "ruth", "esther", "jonah", "elijah", "miriam", "aaron", "hannah", "hillel", "torah", "shabbat", "sinai", "israel",
  "allah", "muhammad", "ibrahim", "musa", "isa", "maryam", "yusuf", "nuh", "mecca", "makkah", "medina", "quran", "ramadan", "eid", "kaaba",
  "buddha", "siddhartha", "ananda", "ashoka", "dharma", "krishna", "rama", "sita", "hanuman", "shiva", "parvati", "ganesha", "vishnu", "lakshmi",
  "durga", "arjuna", "ravana", "valmiki", "narada", "ganga", "nanak", "gobind", "angad", "arjan", "tegh", "khalsa", "amritsar", "bethlehem",
  "nazareth", "galilee", "jerusalem", "jordan", "egypt", "pharaoh", "francis", "assisi", "guadalupe", "teresa", "patrick", "rome", "babylon"];
// places and holy things lose to people: the lime word should be who the line is about (owner, 2026-11-08)
const PLACES = new Set(("sinai israel mecca makkah medina kaaba amritsar bethlehem nazareth galilee jerusalem jordan egypt assisi rome babylon " +
  "italy india punjab anandpur patna canaan lumbini kerala ayodhya lanka varanasi kashi benares bodh gaya kurukshetra mathura vrindavan " +
  "greccio mexico france spain ireland poland judea samaria nineveh tarsus damascus corinth antioch ephesus kartarpur talwandi lahore delhi " +
  "tibet nepal japan china thailand temple church mosque gurdwara synagogue torah quran shabbat ramadan eid dharma khalsa").split(/\s+/));
const PRIO = (c) => PLACES.has(c) ? 2 : c === "god" || c === "allah" ? 1 : 0;
export const clean = (w) => String(w || "").toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").replace(/['’]s$/, "");
const trim = (w) => String(w || "").replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").replace(/['’]s$/, "");
const verbish = (w) => /(ed|ing|ly|est)$/.test(w) && w.length > 4;
// capitalised but not a name: titles, directions and faith/people words (they'd light up in almost every line)
const NOT_NAMES = new Set(("guru rabbi lord king queen saint st bhai prophet angel sir mr mrs north south east west today long once " +
  "jewish jews christian christians muslim muslims sikh sikhs hindu hindus buddhist buddhists catholic catholics chinese indian arab arabs " +
  "roman romans greek greeks egyptian egyptians persian african american english spirit teacher").split(/\s+/));
const DET = new Set("the a an his her their my your our its this that these those every each one".split(" "));
// capitalised words that are not at the start of a sentence: real names in any written text (prompts, story lines)
export function namesIn(text) {
  const out = new Set(), ws = String(text || "").split(/\s+/);
  ws.forEach((w, i) => {
    const prev = ws[i - 1] || "", start = !i || /[.?!:;]["”’)]?$/.test(prev) || /^["“‘(]/.test(w);
    const c = clean(w); if (!start && /^[^\p{L}]*\p{Lu}/u.test(w) && c.length > 2 && !STOP.has(c) && !NOT_NAMES.has(c) && !/['’]/.test(c)) out.add(c);
  });
  return out;
}
export function pickKeyword(text, opt = {}) {
  const ws = String(text || "").split(/\s+/).filter(Boolean), names = new Set([...NAMES, ...(opt.names || [])].map(clean));
  for (const w of namesIn(text)) names.add(w);
  const ok = (w) => { const c = clean(w); return c.length > 2 && !STOP.has(c) && !/['’]/.test(c) && !/^\d+$/.test(c); };
  const cands = ws.filter((w) => ok(w) && names.has(clean(w)) && !NOT_NAMES.has(clean(w)));
  const name = cands.slice().sort((a, b) => PRIO(clean(a)) - PRIO(clean(b)))[0];
  if (name) return trim(name);
  for (const p of opt.prefer || []) { const hit = ws.find((w) => ok(w) && clean(w) === clean(p)); if (hit) return trim(hit); }
  let best = "", score = 0;
  // a word right after "the / a / his…" is almost always a noun, so it gets a head start
  ws.forEach((w, i) => { if (!ok(w)) return; const c = clean(w), noun = DET.has(clean(ws[i - 1])) ? 4 : 0, sc = c.replace(/-/g, "").length + noun - (verbish(c) ? 4 : 0); if (sc > score) { score = sc; best = w; } });
  return trim(best);
}
