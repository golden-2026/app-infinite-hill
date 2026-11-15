// Infinite Hill: turn the 5-year curriculum scripts into compact episode JSON for c/player.html.
// Reads docs/curriculum/<door>/scripts/y<N>/day-NNNN.json (never writes there), writes c/data/<door>/<day>.json,
// c/data/<door>/index.json (browse page) and c/data/report.json (counts, failures, variety checks).
//   node convert.mjs            all doors
//   node convert.mjs --door islam
// review.status is read only to count it; it never reaches the player.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../../../..");
const CUR = path.join(REPO, "docs/curriculum");
const OUT = path.join(HERE, "data");
const argDoor = (() => { const i = process.argv.indexOf("--door"); return i > 0 ? process.argv[i + 1] : null; })();

// Christian first (owner rule)
export const DOORS = ["christianity", "catholic", "judaism", "islam", "hinduism", "buddhism", "sikhism", "spiritual"];
const DOOR_NAME = { christianity: "christian", catholic: "catholic", judaism: "jewish", islam: "muslim", hinduism: "hindu", buddhism: "buddhist", sikhism: "sikh", spiritual: "my own religion" };

/* ---------- style system ---------- */
const BASE = ["afrobeats", "amapiano", "trap", "house", "drill", "lofi", "dembow", "synthwave", "cinematic", "boombap", "ukg", "ambient", "dnb", "phonk", "jersey"];
const GENRE_SET = {
  christianity: [...BASE, "gospel"], catholic: [...BASE, "gospel"], judaism: BASE, buddhism: BASE,
  hinduism: [...BASE, "bhangra", "bhajanclub"], sikhism: [...BASE, "bhangra"], spiritual: [...BASE, "bhangra", "gospel", "bhajanclub"],
  islam: ["daf", "claps", "march", "heartbeat", "riqq"]          // percussion only
};
// same bpm ranges and scales as GB/episodes/build.mjs (copied)
const G = {
  afrobeats: [100, 112, ["dorian", "minor", "major"]], amapiano: [108, 114, ["minor", "dorian"]], trap: [136, 150, ["harm", "minor"]],
  house: [120, 126, ["minor", "dorian", "major"]], drill: [140, 145, ["phrygian", "harm"]], lofi: [72, 88, ["dorian", "major", "lydian"]],
  dembow: [94, 104, ["minor", "harm"]], bhangra: [94, 110, ["mixo", "major"]], gospel: [84, 100, ["major", "mixo"]], synthwave: [100, 118, ["minor", "dorian"]],
  cinematic: [80, 96, ["harm", "minor", "lydian"]], boombap: [86, 94, ["minor", "dorian"]], ukg: [130, 134, ["minor", "dorian"]],
  ambient: [60, 76, ["pentmin", "pentmaj", "lydian"]], dnb: [170, 174, ["minor", "dorian"]], bhajanclub: [100, 106, ["mixo", "major"]],
  phonk: [130, 145, ["phrygian", "minor"]], jersey: [138, 144, ["dorian", "minor"]],
  daf: [92, 108, null], claps: [96, 112, null], march: [84, 96, null], heartbeat: [60, 72, null], riqq: [104, 118, null]
};
const KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
// 9 opening layouts (9 so that no door's genre count is 2 mod 9, which keeps neighbours apart; checked below)
export const LAYOUTS = ["stack", "giant", "split", "poster", "marquee", "tape", "outline", "type", "stamp"];
const PARTICLES = ["petals", "sparks", "waves", "stars", "lanterns", "confetti", "embers", "snow", "leaves", "bubbles", "rice", "light"];
const TRANS = ["flash", "wipe", "punch", "glitch", "iris", "blinds", "whip"];
// retro type treatment per drop (a drop = one week)
export const TREATMENTS = ["chrome", "varsity", "bubble", "stencil", "vhs", "racing", "extrude", "sticker"];
// palettes copied from GB/episodes/build.mjs, keyed by door
const PAL = {
  christianity: { jordan: ["#2F7BFF", "#5CC8FF", "#FFFFFF", "#19E6D4", "#9B5CFF"], "galilee dawn": ["#FF8A1F", "#FFB23F", "#FF6FA8", "#FFFFFF", "#2F7BFF"],
    "olive grove": ["#19E68C", "#9BD45C", "#F3EFE4", "#FFB23F", "#2F7BFF"], "upper room": ["#FFB23F", "#FF8A1F", "#F3EFE4", "#C21E56", "#FFD36A"],
    "stained glass": ["#2F7BFF", "#C21E56", "#FFD36A", "#19E68C", "#9B5CFF"], "night watch": ["#5CC8FF", "#9B5CFF", "#FFFFFF", "#2F7BFF", "#FF2D8A"],
    fisherman: ["#19E6D4", "#2F7BFF", "#FF8A1F", "#F3EFE4", "#5CC8FF"] },
  catholic: { candle: ["#FFB23F", "#FFD36A", "#FFFFFF", "#C21E56", "#FF8A1F"], rosary: ["#FF2D55", "#FF6FA8", "#F3EFE4", "#9B5CFF", "#FFD36A"],
    "marian blue": ["#2F7BFF", "#5CC8FF", "#FFFFFF", "#FFD36A", "#9B5CFF"], cathedral: ["#C21E56", "#FFD36A", "#2F7BFF", "#9B5CFF", "#FFFFFF"],
    assisi: ["#9BD45C", "#19E68C", "#FFB23F", "#F3EFE4", "#FF8A1F"], guadalupe: ["#19E68C", "#FF2D55", "#FFD36A", "#2F7BFF", "#FFFFFF"],
    advent: ["#9B5CFF", "#FF6FA8", "#FFD36A", "#5CC8FF", "#FFFFFF"] },
  judaism: { shabbat: ["#FFD36A", "#FFFFFF", "#2F7BFF", "#FFB23F", "#5CC8FF"], tekhelet: ["#2F7BFF", "#5CC8FF", "#FFFFFF", "#19E6D4", "#9B5CFF"],
    pomegranate: ["#FF2D55", "#C21E56", "#FF6FA8", "#19E68C", "#FFD36A"], desert: ["#FF8A1F", "#FFB23F", "#F3EFE4", "#C21E56", "#FFD36A"],
    havdalah: ["#9B5CFF", "#FF8A1F", "#FFD36A", "#2F7BFF", "#FFFFFF"], "olive press": ["#9BD45C", "#19E68C", "#FFD36A", "#F3EFE4", "#2F7BFF"] },
  islam: { fajr: ["#5CC8FF", "#9B5CFF", "#FFFFFF", "#FF6FA8", "#2F7BFF"], andalus: ["#19E68C", "#19E6D4", "#FFD36A", "#2F7BFF", "#FFFFFF"],
    lantern: ["#FFB23F", "#FF8A1F", "#FFD36A", "#FFFFFF", "#C21E56"], isfahan: ["#2F7BFF", "#19E6D4", "#FFD36A", "#FFFFFF", "#5CC8FF"],
    "date palm": ["#19E68C", "#FFB23F", "#F3EFE4", "#FF8A1F", "#9BD45C"], maghrib: ["#FF6FA8", "#FF8A1F", "#9B5CFF", "#FFD36A", "#2F7BFF"] },
  hinduism: { holi: ["#FF2D8A", "#19E68C", "#2F7BFF", "#FF8A1F", "#9B5CFF"], marigold: ["#FF8A1F", "#FFB23F", "#FFD36A", "#C21E56", "#FFFFFF"],
    diya: ["#FFB23F", "#FF8A1F", "#FFFFFF", "#FFD36A", "#FF2D55"], peacock: ["#2F7BFF", "#19E6D4", "#19E68C", "#9B5CFF", "#FFD36A"],
    ganga: ["#5CC8FF", "#2F7BFF", "#FFFFFF", "#FFB23F", "#19E6D4"], kumkum: ["#FF2D55", "#C21E56", "#FFD36A", "#FF8A1F", "#FF6FA8"] },
  buddhism: { "saffron robe": ["#FF8A1F", "#FFB23F", "#FFD36A", "#C21E56", "#FFFFFF"], "lotus pond": ["#FF6FA8", "#19E68C", "#F3EFE4", "#19E6D4", "#FFD36A"],
    bodhi: ["#19E68C", "#9BD45C", "#FFD36A", "#F3EFE4", "#2F7BFF"], "temple dusk": ["#9B5CFF", "#FF6FA8", "#FFB23F", "#5CC8FF", "#FFFFFF"],
    moon: ["#FFFFFF", "#5CC8FF", "#2F7BFF", "#F3EFE4", "#9B5CFF"], "prayer flag": ["#2F7BFF", "#FFFFFF", "#FF2D55", "#19E68C", "#FFD36A"] },
  sikhism: { kesri: ["#FF8A1F", "#FFB23F", "#FFD36A", "#2F7BFF", "#FFFFFF"], harmandir: ["#FFD36A", "#FFB23F", "#FFFFFF", "#5CC8FF", "#2F7BFF"],
    nila: ["#2F7BFF", "#5CC8FF", "#FF8A1F", "#FFFFFF", "#9B5CFF"], langar: ["#FFB23F", "#FF8A1F", "#F3EFE4", "#19E68C", "#C21E56"],
    sarovar: ["#5CC8FF", "#19E6D4", "#FFFFFF", "#FFD36A", "#2F7BFF"], vaisakhi: ["#19E68C", "#FFD36A", "#FF8A1F", "#FF2D8A", "#2F7BFF"] },
  spiritual: { festival: ["#FF2D8A", "#19E68C", "#2F7BFF", "#FF8A1F", "#9B5CFF"], forest: ["#19E68C", "#9BD45C", "#FFB23F", "#F3EFE4", "#19E6D4"],
    cosmic: ["#9B5CFF", "#2F7BFF", "#5CC8FF", "#FF2D8A", "#FFFFFF"], sunset: ["#FF8A1F", "#FF2D8A", "#FFB23F", "#9B5CFF", "#FFD36A"],
    ocean: ["#19E6D4", "#2F7BFF", "#5CC8FF", "#FFFFFF", "#19E68C"], "tea house": ["#C21E56", "#FFB23F", "#F3EFE4", "#19E68C", "#FF8A1F"] }
};

function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const shuffle = (list, salt) => list.slice().sort((a, b) => hash(salt + "|" + a) - hash(salt + "|" + b));

// Deterministic style for (door, day). Within each block of G×L days every genre×layout pair appears once:
// genre = r, layout = (r + q) mod L with j = r + G·q. Neighbours always differ in genre and layout as long as G mod L ≠ 2.
export function styleFor(door, day) {
  const genres = shuffle(GENRE_SET[door], door + "g"), layouts = shuffle(LAYOUTS, door + "l");
  const Gn = genres.length, L = layouts.length, i = day - 1, block = Gn * L;
  const j = i % block, r = j % Gn, q = Math.floor(j / Gn), lap = Math.floor(i / block);
  const genre = genres[r], layout = layouts[(r + q) % L];
  const [lo, hi, scales] = G[genre], ds = hash(door) % 997;
  const bpm = lo + ((q * 5 + lap * 3 + ds) % (hi - lo + 1));
  const key = (i * 7 + ds) % 12;
  const pnames = Object.keys(PAL[door]), paletteName = pnames[(i + lap) % pnames.length];
  return {
    genre, key, keyName: KEYS[key], bpm, scale: scales ? scales[(q + lap) % scales.length] : null, drumsOnly: door === "islam",
    layout, particle: PARTICLES[(i * 5 + ds) % PARTICLES.length], trans: TRANS[(i * 3 + ds) % TRANS.length],
    paletteName, palette: PAL[door][paletteName], seed: hash(door + day) % 100000 + 1
  };
}

/* ---------- text helpers ---------- */
// UI word rules: the lesson text is kept, but a few words the brand never shows are swapped for plain equivalents.
const SWAPS = [[/\bfamous\b/gi, "well-known"], [/\bfamously\b/gi, "well known for it,"], [/\bdrafts?\b/gi, m => /s$/i.test(m) ? "versions" : "version"]];
const swapCount = {};
function ui(s) {
  if (s == null) return "";
  let t = String(s);
  for (const [re, rep] of SWAPS) t = t.replace(re, m => { swapCount[re.source] = (swapCount[re.source] || 0) + 1; const out = typeof rep === "function" ? rep(m) : rep; return m[0] === m[0].toUpperCase() && m[0] !== m[0].toLowerCase() ? out[0].toUpperCase() + out.slice(1) : out; });
  return t.replace(/\s+/g, " ").trim();
}
function screens(seg) {
  const out = [];
  for (const raw of seg && seg.screen || []) {
    const re = /(then,\s*large:\s*)?`([^`]+)`/g; let m;
    while ((m = re.exec(raw))) {
      let t = m[2].replace(/\s+—\s+(today's word|your \d+\w* word).*$/i, "").trim();
      if (t) out.push({ t: ui(t), big: !!m[1] });
    }
  }
  return out;
}
function sentences(text) {
  const t = ui(text); if (!t) return [];
  // split at sentence ends, but never inside a quotation (“…” or "…"), so quoted scripture stays whole
  const parts = t.split(/(?<=[.!?…]["”’)]?)\s+(?=["“‘(]?[A-Z0-9¿¡])/), out = [];
  let buf = "";
  const open = s => (s.match(/“/g) || []).length - (s.match(/”/g) || []).length + ((s.match(/"/g) || []).length % 2);
  for (const p of parts) { buf = buf ? buf + " " + p : p; if (open(buf) <= 0) { out.push(buf.trim()); buf = ""; } }
  if (buf) out.push(buf.trim());
  return out.filter(Boolean);
}
// group sentences into short cards (≤ ~220 chars, ≤ 3 sentences) so nothing becomes a wall of text
function cards(sents, max = 220) {
  const out = []; let cur = [];
  for (const s of sents) {
    const len = cur.join(" ").length;
    if (cur.length && (len + s.length > max || cur.length >= 3)) { out.push(cur.join(" ")); cur = []; }
    cur.push(s);
  }
  if (cur.length) out.push(cur.join(" "));
  return out;
}
const words = s => String(s).toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, " ").split(/\s+/).filter(w => w.length > 3);
// align each screen head to the first sentence (in order) that shares the most words with it
function teachChunks(heads, sents) {
  if (!heads.length) return cards(sents).map(b => ({ h: "", b }));
  const idx = []; let from = 0;
  heads.forEach((h, k) => {
    const hw = new Set(words(h.t)); let best = -1, bs = 0;
    const lim = sents.length - (heads.length - 1 - k);
    for (let s = from; s < Math.max(from + 1, lim); s++) { const sc = words(sents[s] || "").filter(w => hw.has(w)).length; if (sc > bs) { bs = sc; best = s; } }
    if (best < 0) best = Math.min(sents.length - 1, Math.max(from, Math.round(k * sents.length / heads.length)));
    if (k === 0) best = 0;
    idx.push(best); from = best + 1;
  });
  const out = [];
  heads.forEach((h, k) => {
    const part = sents.slice(idx[k], k + 1 < heads.length ? idx[k + 1] : sents.length);
    const cs = cards(part);
    if (!cs.length) out.push({ h: h.t, big: h.big, b: "" });
    cs.forEach((b, n) => out.push(n ? { h: "", b } : { h: h.t, big: h.big, b }));
  });
  return out;
}
const shuffleFix = (n, seed) => { const a = [...Array(n).keys()]; let s = seed; for (let i = n - 1; i > 0; i--) { s = (Math.imul(s, 1103515245) + 12345) >>> 0; const j = s % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- games: always guess, match, myth, fork (week-one lessons use their own games as stand-ins) ---------- */
function gamesFor(j, seed) {
  const g = j.games || {}, out = [];
  if (Array.isArray(g.guess) && g.guess.length >= 2) {
    // games.guess = [what the word means, wrong, wrong]; the first is right (packages/content/src/index.js)
    const order = shuffleFix(g.guess.length, seed);
    out.push({ k: "guess", q: "what does “" + ui(j.word).toLowerCase() + "” mean?", o: order.map(i => ui(g.guess[i])), a: order.indexOf(0) });
  } else if (g.chat && Array.isArray(g.chat.options)) {
    out.push({ k: "guess", who: ui(g.chat.who), q: ui(g.chat.says), o: g.chat.options.map(ui), a: g.chat.answer | 0, why: ui(g.chat.meaning), text: true });
  }
  if (g.match && Array.isArray(g.match.pairs) && g.match.pairs.length) out.push({ k: "match", q: ui(g.match.prompt), p: g.match.pairs.map(p => [ui(p[0]), ui(p[1])]) });
  if (Array.isArray(g.myth) && g.myth.length) out.push({ k: "myth", s: g.myth.map(m => [ui(m[0]), !!m[1], ui(m[2])]) });
  else if (g.wrong && g.wrong.myth) out.push({ k: "myth", s: [[ui(g.wrong.myth), false, ui(g.wrong.truth)]] });
  const f = g.fork || g.think;
  if (f && Array.isArray(f.options)) out.push({ k: "fork", q: ui(f.setup), o: f.options.map(ui), a: f.answer | 0, why: ui(f.reveal) });
  if (g.build && Array.isArray(g.build.pieces) && g.build.pieces.length >= 2) out.push({ k: "order", q: ui(g.build.prompt), p: g.build.pieces.map(ui), x: (g.build.decoys || []).map(ui) });
  return out;
}

function convert(j, door, day, year) {
  const seg = t => (j.segments || []).find(s => s.type === t) || null;
  const hook = seg("the hook"), teach = seg("the teach"), practice = seg("the practice"), word = seg("the word"), carry = seg("the carry"), review = seg("review");
  const hookLines = screens(hook).map(s => s.t);
  const style = styleFor(door, day);
  return {
    v: 1, door, day, year, title: ui(j.title), word: ui(j.word), hookLine: ui(j.hook), carry: ui(j.carry), tomorrow: ui(j.tomorrow),
    style,
    last: review ? (screens(review)[0] || {}).t || "" : "",
    hook: { lines: hookLines.length ? hookLines : [ui(j.hook)], cards: cards(sentences(hook && hook.voice)).slice(0, 4) },
    teach: teachChunks(screens(teach), sentences(teach && teach.voice)),
    how: ui(j.howItsDone),
    games: gamesFor(j, style.seed),
    practice: cards(sentences(practice && practice.voice), 230),
    wordCard: { voice: ui(word && word.voice), orig: j.games && j.games.original ? { s: j.games.original.script, say: ui(j.games.original.say), note: ui(j.games.original.note) } : null },
    carryVoice: ui(carry && carry.voice),
    sources: (j.sources || []).map(s => ({ ref: ui(s.ref), work: ui(s.work), tr: s.translation ? ui(s.translation) : "", q: s.quoted ? ui(s.quoted) : "" }))
  };
}

/* ---------- drops: every week of a year is a drop, named from the year outline where it has a heading ---------- */
function outlineFor(door) {
  const files = door === "hinduism"
    ? ["golden_hinduism_year1_camps2-5.md", "golden_hinduism_years2-5.md"].map(f => path.join(CUR, f))
    : [1, 2, 3, 4, 5].map(y => path.join(CUR, door, "y" + y + ".md"));
  const secs = [];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    for (const line of fs.readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = /^#{1,4}\s+(.+?)\s*\(Days?\s+(\d+)(?:\s*[–-]\s*(\d+))?/.exec(line); if (!m) continue;
      let name = m[1].replace(/^.*?\b(week|weeks|camp|block|year)\b[^·]*·\s*/i, "").replace(/\s+—.*$/, "").replace(/[*_`#]/g, "").trim();
      if (!name || /draft|pending|review|signed|famous/i.test(name) || /^(camp|year)\b/i.test(name) || name.length > 42) continue;
      const a = +m[2], b = m[3] ? +m[3] : a;
      secs.push({ a, b, name: name.toLowerCase() });
    }
  }
  return day => { let best = null; for (const s of secs) if (day >= s.a && day <= s.b && (!best || s.b - s.a < best.b - best.a)) best = s; return best && best.name; };
}

/* ---------- main ---------- */
const report = { when: new Date().toISOString(), doors: {}, failed: [], swaps: swapCount, status: {}, checks: {} };
fs.mkdirSync(OUT, { recursive: true });
for (const door of argDoor ? [argDoor] : DOORS) {
  const Gn = GENRE_SET[door].length;
  if (Gn % LAYOUTS.length === 2) throw new Error(door + ": genre count " + Gn + " would let neighbours share a layout");
  const dir = path.join(OUT, door); fs.mkdirSync(dir, { recursive: true });
  const nameOf = outlineFor(door);
  const counts = {}, years = [], days = [], eps = new Map();
  for (let y = 1; y <= 5; y++) {
    const ydir = path.join(CUR, door, "scripts", "y" + y);
    const files = fs.existsSync(ydir) ? fs.readdirSync(ydir).filter(f => /^day-\d+\.json$/.test(f)).sort() : [];
    let ok = 0, lo = Infinity, hi = 0;
    for (const f of files) {
      const day = parseInt(f.slice(4), 10);
      let j;
      try { j = JSON.parse(fs.readFileSync(path.join(ydir, f), "utf8")); } catch (e) { report.failed.push(door + "/y" + y + "/" + f + ": " + e.message); continue; }
      try {
        const ep = convert(j, door, day, y);
        if (!ep.games.length || !ep.teach.length) throw new Error("no games or teach");
        eps.set(day, ep);
        const st = (j.review && j.review.status) || "none"; report.status[st] = (report.status[st] || 0) + 1;
        days.push({ d: day, y, t: ep.title, w: ep.word, g: ep.style.genre, k: ep.style.keyName, b: ep.style.bpm, l: ep.style.layout, c: ep.style.palette[0] });
        ok++; lo = Math.min(lo, day); hi = Math.max(hi, day);
      } catch (e) { report.failed.push(door + "/y" + y + "/" + f + ": " + e.message); }
    }
    counts["y" + y] = ok; if (ok) years.push({ y, a: lo, b: hi });
  }
  days.sort((a, b) => a.d - b.d);
  // drops: weeks counted from each year's first day
  const drops = []; let n = 0;
  for (const Y of years) {
    for (let a = Y.a; a <= Y.b; a += 7) {
      const b = Math.min(Y.b, a + 6), ds = days.filter(x => x.d >= a && x.d <= b);
      if (!ds.length) continue; n++;
      let name = nameOf(a) || ds[0].w.toLowerCase();
      // a long outline section spans several drops: number them like volumes
      const prev = drops[drops.length - 1], base = name;
      if (prev && prev.base === base) name = base + " vol. " + (prev.vol + 1);
      drops.push({ n, y: Y.y, a, b, base, vol: prev && prev.base === base ? prev.vol + 1 : 1, name, tr: TREATMENTS[(n - 1) % TREATMENTS.length], days: ds.map(({ y, ...r }) => r) });
    }
  }
  // the player needs its drop: write a tiny day→drop map into each lesson file
  for (const dp of drops) for (const x of dp.days) {
    const f = path.join(dir, x.d + ".json"), ep = eps.get(x.d);
    ep.drop = { n: dp.n, name: dp.name, tr: dp.tr, of: dp.days.length, pos: dp.days.findIndex(z => z.d === x.d) + 1 };
    ep.next = days.find(z => z.d > x.d) ? days.find(z => z.d > x.d).d : null;
    fs.writeFileSync(f, JSON.stringify(ep));
  }
  fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify({ door, name: DOOR_NAME[door], years, drops: drops.map(({ base, vol, ...d }) => d) }));
  // variety checks
  let sameGenre = 0, sameLayout = 0; const combos = new Set(); let firstRepeat = null;
  for (let k = 0; k < days.length; k++) {
    if (k && days[k].g === days[k - 1].g) sameGenre++;
    if (k && days[k].l === days[k - 1].l) sameLayout++;
    const c = days[k].g + "/" + days[k].l; if (combos.has(c) && firstRepeat == null) firstRepeat = k; combos.add(c);
  }
  report.doors[door] = { ...counts, total: days.length, drops: drops.length, genres: Gn, combos: Gn * LAYOUTS.length, firstRepeatAt: firstRepeat, neighbourSameGenre: sameGenre, neighbourSameLayout: sameLayout,
    namedDrops: drops.filter(d => d.name !== (d.days[0].w || "").toLowerCase()).length };
  console.log(door, JSON.stringify(report.doors[door]));
}
fs.writeFileSync(path.join(OUT, argDoor ? "report-" + argDoor + ".json" : "report.json"), JSON.stringify(report, null, 1));
console.log("failed:", report.failed.length, "status:", JSON.stringify(report.status), "swaps:", JSON.stringify(swapCount));
