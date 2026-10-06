// Full lesson scripts: the format, its checks, and the lazy loader.
//
// A script is one day of one door, written in full (docs/curriculum/<door>/scripts/y<N>/day-NNNN.json, the format is
// described in docs/curriculum/SCRIPT_GUIDE.md). scripts/build-lessons.mjs compiles them into small week files under
// apps/app/public/lessons/, and `lessonScript(door, day)` fetches one when a lesson opens, keeps it, and returns null
// when there is no script (or no network and nothing kept), so the caller falls back to the outline-built lesson.
//
// This file imports nothing: the app can load it without pulling in the 435KB design data.

export const FORMAT = "ih-lesson/1";
export const CHUNK_DAYS = 7; // one file per door per week of the path: days 1–7 → 001.json, 8–14 → 002.json …
export const LAST_DAY = 1791;
export const DOOR_KEYS = Object.freeze(["HINDUISM", "CHRISTIANITY", "CATHOLIC", "JUDAISM", "ISLAM", "BUDDHISM", "SIKHISM", "SPIRITUAL"]);

// The segments a day is made of, in order. "review" is every day but day one (day one gets the welcome instead,
// which planDay inserts; a script never carries it).
export const SEGMENTS = Object.freeze(["the bell", "review", "the hook", "the teach", "the practice", "the word", "the carry", "the close"]);
export const FEATURES = Object.freeze(["myth", "fork", "original", "trapdoor"]);

// Spoken length. People hear about 150 words a minute; a day is 2–4 spoken minutes, so with the games and the sit the
// whole session runs about five. Bounds are [error below, warn below, warn above, error above]. (2026-10-06, owner: adults
// get it the first time, so a tightened lesson may say it once: the floors came down for the upgraded first week.)
export const WORDS = Object.freeze({
  total: [280, 290, 640, 700],
  review: [8, 12, 60, 80],
  "the hook": [35, 45, 150, 180],
  "the teach": [130, 140, 330, 380],
  "the practice": [35, 45, 150, 180],
  "the word": [6, 10, 45, 60],
  "the carry": [12, 18, 70, 90],
});

// Things a script must never say. Each entry: [pattern, why]. Quoted scripture is exempt only from the spelling rule.
export const FORBIDDEN = Object.freeze([
  [/most people in [a-z]+ never had anyone explain/i, "template filler from the thin Camp 1"],
  [/now you've got it\b/i, "template filler"],
  [/\bin short:/i, "outline filler (\"Today, in short\")"],
  [/\b(the (one )?true (religion|faith|path)|the only (true )?way to god|false (religion|gods?)|superior to|inferior to)\b/i, "ranks or judges a tradition"],
  [/\bunlike (hindus|muslims|jews|christians|catholics|protestants|buddhists|sikhs|atheists)\b/i, "compares traditions"],
  [/\b(better|truer|deeper|purer) than (hinduism|islam|judaism|christianity|buddhism|sikhism|catholicism|other (faiths|religions|traditions))/i, "ranks traditions"],
  [/\byou (must|have to|need to|should) (believe|accept|convert|repent)\b/i, "tells people what to believe"],
  [/\bgod wants you to\b/i, "speaks for God"],
  [/\b(the jews|jewish people) (killed|murdered|crucified) (jesus|christ)\b/i, "deicide framing (Rome executed Jesus)"],
  [/\b(i'm|i am) (a )?(christian|muslim|hindu|jew|jewish|buddhist|sikh|catholic)\b/i, "a voice claiming a faith (voices are not signed; scripts are voice-neutral)"],
  [/\b(denzel|washington|mahershala|bieber|priyanka|wahlberg|portman|orlando bloom|dosanjh)\b/i, "names a proposed voice"],
  [/\bscience (proves|has proven)\b/i, "claims science proves faith"],
  [/\b(sahih international|niv|esv|nrsv|nasb|new king james|nkjv|the message (?:bible|translation|paraphrase|version)|eugene peterson|coleman barks|muhsin khan|gopal singh|manmohan singh|yusuf ali)\b/i, "names a translation that is not public domain (Yusuf Ali 1934 stays protected in the US until 2030)"],
  [/\b(keeper[- ]approved|approved by (a|our) keeper|reviewed by (a|our) keeper)\b/i, "claims a review that has not happened"],
  [/\b(amazing!!|you failed|you missed a day)\b/i, "guilt or hype"],
]);
// British spellings (checked outside quotation marks: quoted scripture keeps its translation's spelling).
export const BRITISH = /\b(colour|honour|favour|behaviour|neighbour|labour|centre|theatre|realise|recognise|organise|apologise|practise|judgement|travelled|travelling|cancelled|grey|mum|whilst|amongst)\w*\b/i;

// Public-domain translations a source may name. Anything else must be marked "paraphrase" (quoted: null).
export const PD_TRANSLATIONS = Object.freeze([
  /^KJV\b/, /^Douay-Rheims\b/, /^JPS 1917\b/, /^Book of Common Prayer 1662\b/, /^Pickthall 1930\b/, /^Rodwell 1861\b/, /^Palmer 1880\b/,
  /^Max M(ü|u)ller 1881\b/, /^Rhys Davids\b/, /^Macauliffe 1909\b/, /^Legge 18\d\d\b/, /^Long 1862\b/, /^Trotter 1910\b/, /^Emerson\b/, /^Thoreau\b/,
  /^William James 1890\b/, /^Lao-tzu, Legge 1891\b/, /^Nicholson 1898\b/, /^Whinfield 1898\b/, /^Arnold 1885\b/, /^Warrack 1901\b/, /^Pusey 1838\b/,
  /^Schaff\b/, /^Lightfoot\b/, /^Rodkinson 1903\b/, /^Soncino/, /^Gibran 1923\b/, /^Epictetus, Long 1877\b/, /^Seneca, Gummere 19(17|20|25)\b/,
  /^public domain \(original\)/,
]);

const words = (s) => (String(s || "").trim().match(/\S+/g) || []).length;
const unquoted = (s) => String(s || "").replace(/“[^”]*”|"[^"]*"|‘[^’]*’(?=\W|$)/g, " ");
const ORDINAL = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"}`;

/** Which feature game a day plays (the design's pacing puts myth on day 2, fork 3, original 4, trapdoor 5; then it rotates). */
export function featureFor(day, games = {}) {
  if (day <= 1) return null;
  const order = FEATURES;
  for (let k = 0; k < order.length; k++) {
    const t = order[(day - 2 + k) % order.length];
    if (games[t]) return t;
  }
  return null;
}

/** The teach's screen heads the "order" game is built from (the same rule generated/logic.js uses). */
export function orderIdeas(screen) {
  const heads = [];
  for (const s of screen || []) {
    const m = [...String(s).matchAll(/`([^`]+)`/g)].map((x) => x[1]);
    heads.push(...m);
  }
  return heads.map((x) => x.replace(/\.$/, "")).filter((x) => x.length > 2 && !/^DAY /.test(x)).filter((h) => h.length <= 46 && !/^(THEN|AND)\b/.test(h)).slice(0, 4);
}

/** Spoken words per segment and in total (bell and close are silent). */
export function spoken(script) {
  const per = {};
  let total = 0;
  for (const g of script?.segments || []) {
    const n = words(g.voice);
    per[g.type] = (per[g.type] || 0) + n;
    total += n;
  }
  return { per, total, minutes: Math.round((total / 150) * 10) / 10 };
}

/**
 * Check one script. `index` is the day's line in the path's index (camp 1 data or the outline): the script's word and
 * carry must match it, because the strand, review, lantern and quick rounds read the index, not the script.
 * Returns { errors: string[], warnings: string[], stats }.
 */
export function checkScript(s, { index = null, door = null, day = null } = {}) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);
  if (!s || typeof s !== "object") return { errors: ["not an object"], warnings, stats: null };
  if (s.format !== FORMAT) err(`format must be "${FORMAT}"`);
  if (!DOOR_KEYS.includes(s.door)) err(`door "${s.door}" is not one of ${DOOR_KEYS.join(", ")}`);
  if (door && s.door !== door) err(`door is ${s.door}, but the file sits under ${door}`);
  if (!Number.isInteger(s.day) || s.day < 1 || s.day > LAST_DAY) err(`day must be 1–${LAST_DAY}`);
  if (day && s.day !== day) err(`day is ${s.day}, but the file is named for day ${day}`);
  for (const k of ["title", "word", "hook", "carry", "howItsDone"]) if (typeof s[k] !== "string" || !s[k].trim()) err(`${k} is missing`);
  if (s.carry && /[A-Z]/.test(s.carry.replace(/\b(I|I'm|I'll|I've|God|Lord|Jesus|Christ|Allah|Muhammad|Mary|Rumi|Tao)\b/g, ""))) warn("carry has capitals (carries are lowercase)");
  if (s.carry && words(s.carry) > 12) warn(`carry is ${words(s.carry)} words (keep it under 10)`);
  if (index) {
    const norm = (x) => String(x || "").replace(/[.!]$/, "").trim().toLowerCase();
    if (index.word && norm(s.word) !== norm(index.word)) err(`word "${s.word}" doesn't match the index ("${index.word}")`);
    if (index.carry && norm(s.carry) !== norm(index.carry)) err(`carry "${s.carry}" doesn't match the index ("${index.carry}")`);
    // a camp-one index title cut short with "…" may be written out in full; otherwise keep the index's title
    const cut = /…$/.test(index.title || "") ? norm(index.title).replace(/…$/, "").replace(/[’']/g, "'") : null;
    const same = norm(s.title) === norm(index.title) || (cut && norm(s.title).replace(/[’']/g, "'").startsWith(cut.replace(/,$/, "")));
    if (index.title && !same) warn(`title differs from the index ("${index.title}")`);
  }

  // segments: the fixed order, every one present (review only after day one), durations and screens
  const segs = Array.isArray(s.segments) ? s.segments : [];
  const want = SEGMENTS.filter((t) => !(t === "review" && s.day === 1));
  const types = segs.map((g) => g?.type);
  if (types.join("|") !== want.join("|")) err(`segments must be, in order: ${want.join(", ")} (got ${types.join(", ") || "none"})`);
  for (const g of segs) {
    if (!g || typeof g !== "object") continue;
    if (!Array.isArray(g.screen)) err(`${g.type}: screen must be an array`);
    if (typeof g.voice !== "string") err(`${g.type}: voice must be a string`);
    const silent = g.type === "the bell" || g.type === "the close";
    if (silent && g.voice) err(`${g.type} is silent (voice must be "")`);
    if (!silent && !String(g.voice || "").trim()) err(`${g.type} has no voice`);
    if (!silent && !/^\d+ (sec|min)( \d+)?$/.test(String(g.duration || ""))) err(`${g.type}: duration like "45 sec", "2 min" or "2 min 30"`);
    const b = WORDS[g.type];
    if (b) {
      const n = words(g.voice);
      if (n < b[0] || n > b[3]) err(`${g.type}: ${n} words (must be ${b[0]}–${b[3]})`);
      else if (n < b[1] || n > b[2]) warn(`${g.type}: ${n} words (aim for ${b[1]}–${b[2]})`);
    }
    const text = `${g.voice || ""} ${(g.screen || []).join(" ")}`;
    for (const [re, why] of FORBIDDEN) if (re.test(text)) err(`${g.type}: ${why} — "${text.match(re)[0]}"`);
    const brit = unquoted(text).match(BRITISH);
    if (brit) err(`${g.type}: British spelling "${brit[0]}" (American spelling outside quotations)`);
  }
  const bell = segs.find((g) => g?.type === "the bell");
  if (bell && !/^`DAY [A-Z-]+\.`$/.test(String(bell.screen?.[0] || ""))) err('the bell screen must be ["`DAY FIVE.`"] (the day in capital words)');
  const teach = segs.find((g) => g?.type === "the teach");
  if (teach && orderIdeas(teach.screen).length < 3) err("the teach screen needs 3–4 backticked heads of 46 characters or fewer, in the order taught (they become the order game)");
  const hook = segs.find((g) => g?.type === "the hook");
  if (hook && !(hook.screen || []).some((x) => /`[^`]+`/.test(x))) err("the hook screen needs backticked heads");
  const wordSeg = segs.find((g) => g?.type === "the word");
  if (wordSeg && s.day <= 21 && !new RegExp(`your ${ORDINAL(s.day)} word`, "i").test((wordSeg.screen || []).join(" "))) warn(`camp one's word screen says "your ${ORDINAL(s.day)} word"`);
  const stats = spoken(s);
  const b = WORDS.total;
  if (stats.total < b[0] || stats.total > b[3]) err(`spoken total ${stats.total} words (must be ${b[0]}–${b[3]}: 3–4 minutes)`);
  else if (stats.total < b[1] || stats.total > b[2]) warn(`spoken total ${stats.total} words (aim for ${b[1]}–${b[2]})`);
  for (const [re, why] of FORBIDDEN) for (const k of ["title", "hook", "carry", "howItsDone"]) if (re.test(s[k] || "")) err(`${k}: ${why}`);

  // games: all drawn from today's teaching
  const G = s.games || {};
  const m = G.match;
  if (!m || !Array.isArray(m.pairs) || m.pairs.length < 3 || m.pairs.length > 4) err("games.match needs 3–4 pairs");
  else {
    if (typeof m.prompt !== "string" || !m.prompt) err("games.match.prompt is missing");
    for (const p of m.pairs) if (!Array.isArray(p) || p.length !== 2 || !p.every((x) => typeof x === "string" && x.trim() && x.length <= 48)) err(`games.match pair ${JSON.stringify(p)} must be two short strings (48 characters or fewer)`);
    const left = m.pairs.map((p) => String(p[0]).toLowerCase());
    if (new Set(left).size !== left.length) err("games.match has a repeated left side");
  }
  if (!Array.isArray(G.myth) || G.myth.length < 2 || G.myth.length > 3) err("games.myth needs 2–3 items");
  else {
    for (const it of G.myth) if (!Array.isArray(it) || it.length !== 3 || typeof it[0] !== "string" || typeof it[1] !== "boolean" || typeof it[2] !== "string") err(`games.myth item ${JSON.stringify(it)} must be [statement, true|false, reveal]`);
    if (G.myth.every((it) => it?.[1] === true) || G.myth.every((it) => it?.[1] === false)) warn("games.myth: mix true and myth");
  }
  const f = G.fork;
  if (!f || typeof f.setup !== "string" || !Array.isArray(f.options) || f.options.length !== 3 || !Number.isInteger(f.answer) || f.answer < 0 || f.answer > 2 || typeof f.reveal !== "string") err("games.fork needs setup, 3 options, answer 0–2 and reveal");
  if (G.original !== null && G.original !== undefined) {
    const o = G.original;
    if (typeof o.script !== "string" || typeof o.say !== "string" || typeof o.note !== "string") err("games.original needs script, say and note (or null when there's no original-language word)");
    else if (/^[\x00-\x7F]*$/.test(o.script) && !/latin/i.test(o.note)) warn("games.original.script is plain ASCII (use the original script, or say it's Latin)");
  } else if (!("original" in G)) err("games.original must be present (null when there's no original-language word)");
  if (!Array.isArray(G.trapdoor) || G.trapdoor.length !== 3 || !G.trapdoor.every((x) => typeof x === "string")) err("games.trapdoor needs 3 floors");
  else {
    const want3 = [/^what you thought:/, /^what it means:/, /^what a scholar hears:/];
    G.trapdoor.forEach((x, k) => { if (!want3[k].test(x)) err(`games.trapdoor floor ${k + 1} starts "${want3[k].source.slice(1, -1)}"`); });
  }
  for (const [re, why] of FORBIDDEN) if (re.test(JSON.stringify(G))) err(`games: ${why}`);
  const brit = unquoted(JSON.stringify(G)).match(BRITISH);
  if (brit) err(`games: British spelling "${brit[0]}"`);

  // sources: every quotation cited to a public-domain translation; paraphrases cited too
  const src = s.sources;
  if (!Array.isArray(src) || !src.length) err("sources must list at least one text (the day's teaching comes from somewhere)");
  else for (const r of src) {
    if (!r || typeof r.ref !== "string" || !r.ref.trim()) { err(`source ${JSON.stringify(r)} needs a ref (book chapter:verse or equivalent)`); continue; }
    if (typeof r.work !== "string" || !r.work) err(`source ${r.ref}: work is missing`);
    if (r.quoted) {
      if (typeof r.translation !== "string" || !PD_TRANSLATIONS.some((re) => re.test(r.translation))) err(`source ${r.ref}: quoted from "${r.translation}", which isn't on the public-domain list`);
      const said = segs.map((g) => `${g.voice} ${(g.screen || []).join(" ")}`).join(" ") + JSON.stringify(G);
      const norm = (x) => String(x).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      const firstWords = norm(r.quoted).split(" ").slice(0, 5).join(" ");
      if (firstWords && !norm(said).includes(firstWords)) warn(`source ${r.ref}: the quotation doesn't appear in the script`);
    } else if (r.quoted !== null && r.quoted !== undefined && r.quoted !== false) err(`source ${r.ref}: quoted must be the exact quoted words, or null for a paraphrase`);
  }
  // quotation marks in the voice with no quoted source at all is a smell
  const voiceAll = segs.map((g) => g.voice || "").join(" ");
  if (/[“"][A-Z][^”"]{25,}[”"]/.test(voiceAll) && !(src || []).some((r) => r?.quoted)) warn("the voice quotes something, but no source has quoted text");

  const rv = s.review;
  if (!rv || rv.status !== "pending") err('review.status must be "pending" (only a Keeper changes it)');
  return { errors, warnings, stats };
}

/** A script as the lesson object planDay expects (the same shape lessonInfo returns), marked as a script. */
export function lessonFromScript(s, camp = null) {
  return {
    day: s.day, title: s.title, word: s.word, carry: s.carry, hook: s.hook, length: s.length, camp,
    later: s.day > 21, script: true, review: s.review?.status || "pending", howItsDone: s.howItsDone,
    segments: s.segments.map((g) => ({ type: g.type, duration: g.duration ?? null, voice: g.voice || "", screen: g.screen || [] })),
    games: s.games || {}, sources: s.sources || [],
  };
}

/** The compiled form: what ships in public/lessons (no review notes, no writer meta). */
export function compileScript(s) {
  return {
    day: s.day, title: s.title, word: s.word, hook: s.hook, carry: s.carry, length: s.length || null, tomorrow: s.tomorrow || null,
    howItsDone: s.howItsDone, segments: s.segments, games: s.games,
    sources: (s.sources || []).map((r) => ({ ref: r.ref, work: r.work, translation: r.translation || null, quoted: !!r.quoted })),
    review: s.review?.status || "pending",
  };
}

// ─── the loader ─────────────────────────────────────────────────────────────
export const chunkOf = (day) => String(Math.floor((day - 1) / CHUNK_DAYS) + 1).padStart(3, "0");
export const chunkPath = (door, day) => `${String(door).toLowerCase()}/${chunkOf(day)}.json`;

const memo = new Map(); // `${base}|${door}/${chunk}` → Promise<chunk | null>
let manifestMemo = null; // { base, promise }

/** Forget everything loaded in memory (tests; a new build). */
export function resetLessonCache() {
  memo.clear();
  manifestMemo = null;
}

async function getJSON(fetchImpl, url) {
  const r = await fetchImpl(url);
  if (!r || !r.ok) return null;
  return r.json();
}

/**
 * The full script for a door's day, or null (no script written yet, or offline with nothing kept).
 * Options:
 *   base   where the compiled lessons live: "/lessons" on the web; an absolute URL on native.
 *   fetch  a fetch implementation (default: globalThis.fetch).
 *   store  optional persistent cache { get(key) → value|null|Promise, set(key, value) } (the app's kv). A kept week
 *          is used when the network is down, and replaced when the manifest says it changed.
 * Never throws: every failure is a null, and the caller keeps the outline-built lesson.
 */
export async function lessonScript(door, day, { base = "/lessons", fetch: fetchImpl = globalThis.fetch, store = null } = {}) {
  const D = String(door || "").toUpperCase();
  if (!DOOR_KEYS.includes(D) || !Number.isInteger(day) || day < 1 || day > LAST_DAY) return null;
  const chunk = chunkOf(day);
  const key = `${base}|${D}/${chunk}`;
  const storeKey = `ih:lessons:${D}:${chunk}`;
  if (!memo.has(key)) {
    memo.set(key, (async () => {
      let kept = null;
      try { kept = store ? await store.get(storeKey) : null; } catch { kept = null; }
      let manifest = null;
      try {
        if (typeof fetchImpl === "function") {
          if (!manifestMemo || manifestMemo.base !== base) manifestMemo = { base, promise: getJSON(fetchImpl, `${base}/manifest.json`).catch(() => null) };
          manifest = await manifestMemo.promise;
          if (!manifest) manifestMemo = null; // try again next time
        }
      } catch { manifest = null; }
      if (!manifest) return kept; // offline (or no build yet): whatever we kept, else nothing
      const want = manifest.doors?.[D]?.chunks?.[chunk];
      if (!want) return null; // no scripts in this week for this door
      if (kept && kept.hash === want) return kept;
      try {
        const fresh = await getJSON(fetchImpl, `${base}/${chunkPath(D, day)}?v=${want}`);
        if (!fresh || fresh.door !== D) return kept;
        if (store) try { await store.set(storeKey, fresh); } catch { /* full or unavailable: memory is enough */ }
        return fresh;
      } catch {
        return kept;
      }
    })());
  }
  const c = await memo.get(key);
  if (!c) memo.delete(key); // a miss isn't remembered: the next open tries again
  const s = c?.days?.[String(day)] || null;
  return s ? { ...s, door: D } : null;
}
