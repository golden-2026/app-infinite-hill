// Builds every Infinite Hill episode that has a writer config.
//   node episodes/build.mjs                  uses episodes/configs/
//   node episodes/build.mjs --configs configs-test   uses another config folder (relative to episodes/)
//   node episodes/build.mjs --only bud-alms,isl-crow
// Writes: episodes/<id>/index.html, episodes/styles.json, episodes/list.json, episodes/index.html (library).
// Re-runnable. Style assignment is deterministic and covers all 226 lessons, so an episode keeps its look and
// sound as more configs arrive (it only changes if its own config changes energy).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pickKeyword } from "./keyword.mjs";

const EP = path.dirname(fileURLToPath(import.meta.url));
const GB = path.dirname(EP);
// Finn art lives in episodes/assets/ (finn-*.webp). To pull in new Finn art from another folder, set FINN_ASSETS to it:
//   FINN_ASSETS=path/to/folder node episodes/build.mjs   (copies finn-*.webp that episodes/assets/ does not have yet)
const FINN_SRC = process.env.FINN_ASSETS ? path.resolve(process.env.FINN_ASSETS) : "";
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const CONFIGS = path.resolve(EP, arg("--configs", "configs"));
const ONLY = arg("--only", "") ? new Set(arg("--only").split(",")) : null;

/* ---------- faiths (real lesson `home` values) ---------- */
const FAITHS = [
  { key: "olive", name: "christian" }, { key: "angelus", name: "catholic" }, { key: "pomegranate", name: "jewish" },
  { key: "datepalm", name: "muslim" }, { key: "marigold", name: "hindu" }, { key: "lotus", name: "buddhist" },
  { key: "nectar", name: "sikh" }, { key: "wild", name: "my own religion" }];
const FAITH = Object.fromEntries(FAITHS.map(f => [f.key, f]));
// the celebrity guide of each path asks the questions and says the scripted lines (owner, 2026-11-14)
const GUIDE_NAME = { Denzel: "Denzel Washington", Nicole: "Nicole Kidman", Natalie: "Natalie Portman", Mahershala: "Mahershala Ali",
  Priyanka: "Priyanka Chopra", Orlando: "Orlando Bloom", Diljit: "Diljit Dosanjh", Justin: "Justin Bieber" };
const guideOf = L => L.guide && L.guide.photo ? { name: GUIDE_NAME[L.guide.name] || L.guide.name, photo: L.guide.photo } : null;

/* ---------- curated palettes: five colours each; the engine always adds lime ---------- */
const PALETTES = {
  olive: { jordan: ["#2F7BFF", "#5CC8FF", "#FFFFFF", "#19E6D4", "#9B5CFF"], "galilee dawn": ["#FF8A1F", "#FFB23F", "#FF6FA8", "#FFFFFF", "#2F7BFF"],
    "olive grove": ["#19E68C", "#9BD45C", "#F3EFE4", "#FFB23F", "#2F7BFF"], "upper room": ["#FFB23F", "#FF8A1F", "#F3EFE4", "#C21E56", "#FFD36A"],
    "stained glass": ["#2F7BFF", "#C21E56", "#FFD36A", "#19E68C", "#9B5CFF"], "night watch": ["#5CC8FF", "#9B5CFF", "#FFFFFF", "#2F7BFF", "#FF2D8A"],
    fisherman: ["#19E6D4", "#2F7BFF", "#FF8A1F", "#F3EFE4", "#5CC8FF"] },
  angelus: { candle: ["#FFB23F", "#FFD36A", "#FFFFFF", "#C21E56", "#FF8A1F"], rosary: ["#FF2D55", "#FF6FA8", "#F3EFE4", "#9B5CFF", "#FFD36A"],
    "marian blue": ["#2F7BFF", "#5CC8FF", "#FFFFFF", "#FFD36A", "#9B5CFF"], cathedral: ["#C21E56", "#FFD36A", "#2F7BFF", "#9B5CFF", "#FFFFFF"],
    assisi: ["#9BD45C", "#19E68C", "#FFB23F", "#F3EFE4", "#FF8A1F"], guadalupe: ["#19E68C", "#FF2D55", "#FFD36A", "#2F7BFF", "#FFFFFF"],
    advent: ["#9B5CFF", "#FF6FA8", "#FFD36A", "#5CC8FF", "#FFFFFF"] },
  pomegranate: { shabbat: ["#FFD36A", "#FFFFFF", "#2F7BFF", "#FFB23F", "#5CC8FF"], tekhelet: ["#2F7BFF", "#5CC8FF", "#FFFFFF", "#19E6D4", "#9B5CFF"],
    pomegranate: ["#FF2D55", "#C21E56", "#FF6FA8", "#19E68C", "#FFD36A"], desert: ["#FF8A1F", "#FFB23F", "#F3EFE4", "#C21E56", "#FFD36A"],
    havdalah: ["#9B5CFF", "#FF8A1F", "#FFD36A", "#2F7BFF", "#FFFFFF"], "olive press": ["#9BD45C", "#19E68C", "#FFD36A", "#F3EFE4", "#2F7BFF"] },
  datepalm: { fajr: ["#5CC8FF", "#9B5CFF", "#FFFFFF", "#FF6FA8", "#2F7BFF"], andalus: ["#19E68C", "#19E6D4", "#FFD36A", "#2F7BFF", "#FFFFFF"],
    lantern: ["#FFB23F", "#FF8A1F", "#FFD36A", "#FFFFFF", "#C21E56"], isfahan: ["#2F7BFF", "#19E6D4", "#FFD36A", "#FFFFFF", "#5CC8FF"],
    "date palm": ["#19E68C", "#FFB23F", "#F3EFE4", "#FF8A1F", "#9BD45C"], maghrib: ["#FF6FA8", "#FF8A1F", "#9B5CFF", "#FFD36A", "#2F7BFF"] },
  marigold: { holi: ["#FF2D8A", "#19E68C", "#2F7BFF", "#FF8A1F", "#9B5CFF"], marigold: ["#FF8A1F", "#FFB23F", "#FFD36A", "#C21E56", "#FFFFFF"],
    diya: ["#FFB23F", "#FF8A1F", "#FFFFFF", "#FFD36A", "#FF2D55"], peacock: ["#2F7BFF", "#19E6D4", "#19E68C", "#9B5CFF", "#FFD36A"],
    ganga: ["#5CC8FF", "#2F7BFF", "#FFFFFF", "#FFB23F", "#19E6D4"], kumkum: ["#FF2D55", "#C21E56", "#FFD36A", "#FF8A1F", "#FF6FA8"] },
  lotus: { "saffron robe": ["#FF8A1F", "#FFB23F", "#FFD36A", "#C21E56", "#FFFFFF"], "lotus pond": ["#FF6FA8", "#19E68C", "#F3EFE4", "#19E6D4", "#FFD36A"],
    bodhi: ["#19E68C", "#9BD45C", "#FFD36A", "#F3EFE4", "#2F7BFF"], "temple dusk": ["#9B5CFF", "#FF6FA8", "#FFB23F", "#5CC8FF", "#FFFFFF"],
    moon: ["#FFFFFF", "#5CC8FF", "#2F7BFF", "#F3EFE4", "#9B5CFF"], "prayer flag": ["#2F7BFF", "#FFFFFF", "#FF2D55", "#19E68C", "#FFD36A"] },
  nectar: { kesri: ["#FF8A1F", "#FFB23F", "#FFD36A", "#2F7BFF", "#FFFFFF"], harmandir: ["#FFD36A", "#FFB23F", "#FFFFFF", "#5CC8FF", "#2F7BFF"],
    nila: ["#2F7BFF", "#5CC8FF", "#FF8A1F", "#FFFFFF", "#9B5CFF"], langar: ["#FFB23F", "#FF8A1F", "#F3EFE4", "#19E68C", "#C21E56"],
    sarovar: ["#5CC8FF", "#19E6D4", "#FFFFFF", "#FFD36A", "#2F7BFF"], vaisakhi: ["#19E68C", "#FFD36A", "#FF8A1F", "#FF2D8A", "#2F7BFF"] },
  wild: { festival: ["#FF2D8A", "#19E68C", "#2F7BFF", "#FF8A1F", "#9B5CFF"], forest: ["#19E68C", "#9BD45C", "#FFB23F", "#F3EFE4", "#19E6D4"],
    cosmic: ["#9B5CFF", "#2F7BFF", "#5CC8FF", "#FF2D8A", "#FFFFFF"], sunset: ["#FF8A1F", "#FF2D8A", "#FFB23F", "#9B5CFF", "#FFD36A"],
    ocean: ["#19E6D4", "#2F7BFF", "#5CC8FF", "#FFFFFF", "#19E68C"], "tea house": ["#C21E56", "#FFB23F", "#F3EFE4", "#19E68C", "#FF8A1F"] }
};

/* ---------- music: genre metadata (the sound itself lives in engine.html) ---------- */
const GENRES = {
  afrobeats: { bpm: [100, 112], swing: 0.1, scales: ["dorian", "minor", "major"] },
  amapiano: { bpm: [108, 114], swing: 0.14, scales: ["minor", "dorian"] },
  trap: { bpm: [136, 150], swing: 0, scales: ["harm", "minor"] },
  house: { bpm: [120, 126], swing: 0.04, scales: ["minor", "dorian", "major"] },
  drill: { bpm: [140, 145], swing: 0, scales: ["phrygian", "harm"] },
  lofi: { bpm: [72, 88], swing: 0.24, scales: ["dorian", "major", "lydian"] },
  dembow: { bpm: [94, 104], swing: 0, scales: ["minor", "harm"] },
  bhangra: { bpm: [94, 110], swing: 0.08, scales: ["mixo", "major"], faiths: ["marigold", "nectar", "wild"] },
  gospel: { bpm: [84, 100], swing: 0.2, scales: ["major", "mixo"], faiths: ["olive", "angelus", "wild"] },
  synthwave: { bpm: [100, 118], swing: 0, scales: ["minor", "dorian"] },
  cinematic: { bpm: [80, 96], swing: 0, scales: ["harm", "minor", "lydian"] },
  boombap: { bpm: [86, 94], swing: 0.16, scales: ["minor", "dorian"] },
  ukg: { bpm: [130, 134], swing: 0.22, scales: ["minor", "dorian"] },
  ambient: { bpm: [60, 76], swing: 0, scales: ["pentmin", "pentmaj", "lydian"] },
  dnb: { bpm: [170, 174], swing: 0, scales: ["minor", "dorian"] },
  bhajanclub: { bpm: [100, 106], swing: 0, scales: ["mixo", "major"], faiths: ["marigold", "wild"] },
  phonk: { bpm: [130, 145], swing: 0, scales: ["phrygian", "minor"] },
  jersey: { bpm: [138, 144], swing: 0, scales: ["dorian", "minor"] },
  // percussion only (datepalm): frame drum, claps, shaker
  daf: { bpm: [92, 108], swing: 0.08, perc: true }, claps: { bpm: [96, 112], swing: 0.06, perc: true }, march: { bpm: [84, 96], swing: 0, perc: true },
  heartbeat: { bpm: [60, 72], swing: 0, perc: true }, riqq: { bpm: [104, 118], swing: 0.1, perc: true }
};
const ENERGY_GENRES = {
  hype: ["trap", "drill", "afrobeats", "dembow", "house", "dnb", "bhangra", "phonk", "jersey"],
  warm: ["afrobeats", "gospel", "lofi", "boombap", "amapiano", "bhajanclub", "ukg"],
  eerie: ["drill", "ambient", "synthwave", "cinematic", "phonk", "trap"],
  triumphant: ["cinematic", "gospel", "house", "bhangra", "synthwave", "dnb"],
  tender: ["lofi", "ambient", "boombap", "gospel", "ukg", "amapiano"],
  epic: ["cinematic", "dnb", "drill", "synthwave", "trap", "bhangra"],
  playful: ["dembow", "afrobeats", "ukg", "house", "amapiano", "bhangra", "jersey", "boombap"],
  mystic: ["ambient", "bhajanclub", "lofi", "cinematic", "synthwave", "amapiano"]
};
const PERC_ENERGY = { hype: ["riqq", "claps", "daf"], warm: ["daf", "claps", "heartbeat"], eerie: ["heartbeat", "march"], triumphant: ["march", "claps", "daf"],
  tender: ["heartbeat", "daf"], epic: ["march", "riqq"], playful: ["claps", "riqq", "daf"], mystic: ["heartbeat", "daf", "march"] };
const KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const OPENS = ["lime", "stack", "word", "split", "giant", "type", "marquee", "tape", "outline"];
const TRANS = ["flash", "wipe", "punch", "glitch", "iris", "blinds", "whip", "brand"];
const CAPS = ["slam", "boxed", "tilt", "ticker"];
const ENDS = ["drop", "sticker", "poster", "ticket", "block"];
const STAGES = ["beams", "lasers", "bars", "halo", "crowd"];
const GRADES = ["contrast(1.08) saturate(1.15)", "contrast(1.18) saturate(.85) sepia(.12)", "contrast(1.25) brightness(.92)", "saturate(1.35) contrast(1.05)",
  "grayscale(.3) contrast(1.2)", "contrast(1.12) brightness(1.04) saturate(1.05)"];
const PARTICLES = ["petals", "sparks", "waves", "stars", "lanterns", "confetti", "embers", "snow", "leaves", "bubbles", "rice", "light"];
const ENERGIES = Object.keys(ENERGY_GENRES);

/* ---------- helpers ---------- */
function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
const byHash = (list, salt) => list.slice().sort((a, b) => hash(salt + "|" + a) - hash(salt + "|" + b));
const clean = w => String(w).toLowerCase().replace(/[^\p{L}\p{N}’']/gu, "");
const words = line => String(line).split(/\s+/).map(clean).filter(Boolean);
function hasPhrase(line, phrase) { const L = words(line), P = words(phrase); if (!P.length) return false;
  for (let i = 0; i + P.length <= L.length; i++) if (P.every((w, k) => L[i + k] === w)) return true; return false; }
function workName(src) {
  if (!src) return "";
  let s = String(src).split(/ \(|;| — | – |: /)[0].trim();
  return s.replace(/[.,]$/, "");
}
const readJSON = f => JSON.parse(fs.readFileSync(f, "utf8"));

/* ---------- inputs ---------- */
const lessons = {};
for (const f of fs.readdirSync(path.join(GB, "lessons"))) {
  if (!f.endsWith(".json")) continue;
  try { const L = readJSON(path.join(GB, "lessons", f)); if (L && L.id && L.home && Array.isArray(L.steps)) lessons[L.id] = L; } catch (e) { console.log("! bad lesson", f, e.message); }
}
// the app's own order per home (hill-app.html) decides who the neighbours are
let ORDER = {};
try { const m = fs.readFileSync(path.join(GB, "hill-app.html"), "utf8").match(/\}\)\((\{"marigold":\[.*?\]\})\);/); if (m) ORDER = JSON.parse(m[1]); } catch (e) {}
const ordered = {};
for (const F of FAITHS) {
  const inHome = Object.values(lessons).filter(L => L.home === F.key).map(L => L.id);
  const o = (ORDER[F.key] || []).filter(id => lessons[id]);
  ordered[F.key] = o.concat(inHome.filter(id => !o.includes(id)).sort());
}
const configs = {};
const problems = [];
if (fs.existsSync(CONFIGS)) for (const f of fs.readdirSync(CONFIGS)) {
  if (!f.endsWith(".json") || f.replace(/\.json$/, "").includes(".")) continue;   // skip writers' backups like x.pre-b8.json
  try { const c = readJSON(path.join(CONFIGS, f)); const id = c.id || f.replace(/\.json$/, ""); configs[id] = c; if (c.id && c.id !== f.replace(/\.json$/, "")) problems.push([id, "file name and id differ: " + f]); }
  catch (e) { problems.push([f, "config is not valid JSON: " + e.message]); }
}

/* ---------- validation (prints, never crashes) ---------- */
function validate(id, c, L) {
  const P = m => problems.push([id, m]);
  if (!L) { P("no lesson with this id"); return; }
  const shots = L.steps.filter(s => s.t === "shot"), asks = L.steps.filter(s => s.t === "ask");
  for (const k of ["open", "open2"]) if (!Array.isArray(c[k]) || !c[k].length) P(k + " missing or not a list");
  if (c.particle && !PARTICLES.includes(c.particle)) P("unknown particle: " + c.particle);
  if (c.energy && !ENERGIES.includes(c.energy)) P("unknown energy: " + c.energy);
  for (const [k, map] of Object.entries(c.hot || {})) {
    const sh = shots[+k]; if (!sh) { P(`hot: shot ${k} doesn't exist (${shots.length} shots)`); continue; }
    for (const w of Object.keys(map || {})) if (!hasPhrase(sh.line, w)) P(`hot: "${w}" not in shot ${k} line`);
  }
  if (c.drop != null && !(c.drop >= 0 && c.drop < shots.length)) P(`drop ${c.drop} is outside 0–${shots.length - 1}`);
  const h = c.end && c.end.h;
  if (!Array.isArray(h) || h.length !== 3) P("end.h must be exactly 3 words");
  else h.forEach(w => { if (String(w).length > 9) P(`end.h word "${w}" is over 9 characters`); if (/\s/.test(String(w).trim())) P(`end.h "${w}" is more than one word`); });
  const g = c.game;
  if (g) {
    const yes = (g.opts || []).filter(o => o[0] === "yes").length;
    if (yes !== 1) P(`game has ${yes} "yes" answers (needs exactly 1)`);
    if ((g.opts || []).length !== 3) P(`game has ${(g.opts || []).length} options (expected 3)`);
    if (!(g.ask >= 0 && g.ask < asks.length)) P(`game.ask ${g.ask} is outside 0–${asks.length - 1}`);
    for (const o of g.opts || []) if (o[0] !== "yes" && !(g.wrong || {})[o[0]]) P(`game: no wrong reply for "${o[0]}"`);
  } else P("no game");
  if (!c.cliff || !c.cliff.tmr) P("cliff.tmr missing");
  if (!c.teachH) P("teachH missing");
}

/* ---------- style assignment over all lessons (deterministic) ---------- */
const styles = {}, used = new Set(), useLook = new Set();
for (const F of FAITHS) {
  const perc = F.key === "datepalm";
  const genreCount = {};
  let prev = null, prev2 = null;
  for (const id of ordered[F.key]) {
    const c = configs[id] || {};
    const energy = ENERGIES.includes(c.energy) ? c.energy : byHash(ENERGIES, id)[0];
    const faithOK = g => (GENRES[g].faiths ? GENRES[g].faiths.includes(F.key) : true) && !!GENRES[g].perc === perc;
    let pool = (perc ? PERC_ENERGY[energy] : ENERGY_GENRES[energy]).filter(faithOK);
    const all = Object.keys(GENRES).filter(faithOK);
    const notNeighbour = g => !prev || (g !== prev.genre && (!prev2 || g !== prev2.genre || all.length < 4));
    let cand = pool.filter(notNeighbour); if (!cand.length) cand = all.filter(notNeighbour); if (!cand.length) cand = all;
    cand = byHash(cand, id).sort((a, b) => (genreCount[a] || 0) - (genreCount[b] || 0));
    let genre = cand[0], key = 0, bpm = 0;
    // unique genre + key + bpm across every episode
    outer: for (const gname of cand) {
      const G = GENRES[gname], bpms = []; for (let b = G.bpm[0]; b <= G.bpm[1]; b++) bpms.push(b);
      for (const k of byHash(KEYS.map((_, i) => i), id + gname)) for (const b of byHash(bpms, id + k)) {
        if (!used.has(gname + k + "@" + b)) { genre = gname; key = k; bpm = b; break outer; }
      }
    }
    used.add(genre + key + "@" + bpm); genreCount[genre] = (genreCount[genre] || 0) + 1;
    const G = GENRES[genre];
    const pick = (list, salt, avoid) => { const l = byHash(list, id + salt).filter(x => x !== avoid); return l[0] || list[0]; };
    let open = pick(OPENS, "open", prev && prev.open), trans, cap, endL, look;
    // the visual combination is unique across all episodes
    for (let n = 0; n < 60; n++) {
      trans = pick(TRANS, "tr" + n, prev && prev.trans); cap = pick(CAPS, "cap" + n, prev && prev.cap); endL = pick(ENDS, "end" + n, prev && prev.endL);
      look = [open, trans, cap, endL].join("/"); if (!useLook.has(look)) break;
    }
    useLook.add(look);
    const pnames = Object.keys(PALETTES[F.key]);
    const paletteName = pick(pnames, "pal", prev && prev.paletteName);
    const particle = PARTICLES.includes(c.particle) ? c.particle : pick(PARTICLES, "pt", prev && prev.particle);
    const s = {
      genre, key, keyName: KEYS[key], bpm, swing: G.swing, scale: G.scales ? byHash(G.scales, id)[0] : null, drumsOnly: perc, energy,
      open, trans, trans2: pick(TRANS, "tr2", trans), cap, endL, stage: pick(STAGES, "st", prev && prev.stage), grade: GRADES[hash(id + "g") % GRADES.length],
      paletteName, palette: PALETTES[F.key][paletteName], particle, seed: hash(id) % 100000 + 1, configured: !!configs[id]
    };
    styles[id] = s; prev2 = prev; prev = s;
  }
}

/* ---------- compose one episode CFG ---------- */
function compose(id, c, L) {
  const F = FAITH[L.home], shots = L.steps.filter(s => s.t === "shot");
  const n = shots.length, drop = (c.drop >= 0 && c.drop < n) ? c.drop : Math.max(1, Math.round(n * 0.6));
  const soft = ["tender", "mystic"].includes(styles[id].energy);
  const seq = []; let si = 0, ai = 0, teach = null, match = null;
  for (const st of L.steps) {
    if (st.t === "shot") {
      const k = si++, hot = {};
      for (const [w, col] of Object.entries((c.hot || {})[k] || {})) if (hasPhrase(st.line, w)) hot[w] = col === "rb" ? "y" : col;
      let mood = k < Math.ceil(drop / 2) ? 1 : 2; if (k > drop) mood = soft ? 1 : 2;
      const item = { k: "clip", n: k, v: st.v, line: st.line, vo: st.vo || [], hot, mood };
      if (k === drop - 1) item.build = true;
      if (k === drop) {
        item.drop = true;
        const hw = Object.keys(hot).map(w => words(w)).flat();
        const lw = words(st.line);
        item.dropWord = hw.find(w => lw.includes(w)) || lw.slice(Math.floor(lw.length / 2)).sort((a, b) => b.length - a.length)[0];
      }
      // cinema captions: the one lime keyword. the writer's hot words first (in line order), else the drop word, else an automatic pick
      const lw = words(st.line), hk = Object.keys(hot).map(w => ({ w, at: lw.indexOf(words(w)[0]) })).filter(x => x.at >= 0).sort((a, b) => a.at - b.at);
      item.key = hk.length ? words(hk[0].w) : item.dropWord ? [item.dropWord] : words(pickKeyword(st.line));
      if (k === n - 1 && k !== drop) { item.party = true; item.mood = 3; }
      seq.push(item);
    } else if (st.t === "ask") {
      const k = ai++, g = c.game;
      if (g && g.ask === k && (g.opts || []).filter(o => o[0] === "yes").length === 1) seq.push({ k: "game", v: st.v, game: g });
      else seq.push({ k: "quiz", v: st.v, blur: !!st.blur, eb: st.eb, q: st.q, o: st.o, a: st.a, why: st.why });
    } else if (st.t === "fill") seq.push({ k: "quiz", fill: true, v: st.v, eb: st.eb || "finish the line", pre: st.pre, post: st.post, o: st.o, a: st.a, why: st.why });
    else if (st.t === "teach") teach = st;
    else if (st.t === "match" && !match) match = st;
  }
  if (teach) seq.push({ k: "teach", v: teach.v, h: c.teachH || null, say: teach.say || [], src: workName((L.card && L.card.sources || [])[0]) });
  if (match) seq.push({ k: "match", v: match.v, q: match.q, pairs: match.pairs, why: match.why });
  if (L.today) seq.push({ k: "today", v: L.today.v, say: L.today.say, options: L.today.options || [] });
  seq.push({ k: "end" }, { k: "cliff" });
  const tm = L.tomorrow || {};
  const cliff = Object.assign({ s1: "that’s the story.", s2: tm.line || "", tmr: tm.title ? "tomorrow: " + tm.title.toLowerCase() : "tomorrow: a new story." }, c.cliff || {});
  const endH = (c.end && Array.isArray(c.end.h) && c.end.h.length === 3) ? c.end.h : null;
  const end = Object.assign({}, c.end || {}, { h: endH || fallbackH(L), eyebrow: F.name + " · " + String(L.told || "").toLowerCase() });
  if (!end.line) end.line = (L.title || "").toLowerCase() + ".";
  const posterShot = shots[drop] || shots[n - 1] || shots[0];
  // remix: painted looks (art/sacred/<id>/looks/looks.json) and a holy-day lock, only when they exist
  const extra = {};
  try {
    const lf = path.join(GB, String(L.clips || "").replace(/clips\/?$/, "looks/"), "looks.json");
    if (L.clips && fs.existsSync(lf)) { const J = readJSON(lf); if (Array.isArray(J.looks) && J.looks.length) extra.looks = { default: J.default || "", looks: J.looks.filter(x => typeof x === "string" && /^[a-z0-9-]+$/.test(x)), lock: J.lock || null }; }
  } catch (e) { problems.push([id, "looks.json is not valid JSON: " + e.message]); }
  if (c.holy || L.holy) extra.holy = c.holy || L.holy;
  return Object.assign({
    id, title: L.title, told: L.told, home: L.home, faithName: F.name, tag: F.name + " · " + String(L.told || "").toLowerCase(),
    ep: ordered[L.home].indexOf(id) + 1, base: "../../", assets: "../assets/", clips: L.clips, voice: L.voice || "", guide: guideOf(L), poster: posterShot && posterShot.v,
    open: c.open, open2: c.open2, hint: c.hint || "tap anywhere", particle: styles[id].particle, energy: styles[id].energy,
    seq, end, cliff, share: c.share || (L.title || "").toLowerCase() + ". the story on infinite hill", style: styles[id]
  }, extra);
}
function fallbackH(L) { const w = String(L.title || "").toLowerCase().replace(/[^\p{L}\s’']/gu, "").split(/\s+/).filter(x => x && x.length <= 9);
  return w.length >= 3 ? w.slice(-3) : ["step", "in.", "live it."]; }

/* ---------- lowercase UI: which words the whole library writes in lowercase ---------- */
// the engine lowers a sentence-start word in answers/chips/questions only if it's an ordinary word. A word counts as ordinary
// when the lessons and configs use it in lowercase at least twice as often as capitalised mid-sentence (so "stays", "many",
// "tradition" lower; "Luke", "Korah", "Jibril" keep their capital). Only prose strings count (no ids, paths or ALL CAPS).
const LOWC = {}, CAPC = {};
{
  const strs = (o, out) => { if (typeof o === "string") out.push(o); else if (Array.isArray(o)) o.forEach(x => strs(x, out)); else if (o && typeof o === "object") Object.values(o).forEach(x => strs(x, out)); return out; };
  const corpus = []; for (const L of Object.values(lessons)) strs(L, corpus); for (const c of Object.values(configs)) strs(c, corpus);
  const strip = w => w.replace(/^[^\p{L}]+|[^\p{L}’']+$/gu, "").replace(/[’']s$/, "");
  corpus.filter(t => / /.test(t) && !/[\/_]/.test(t) && t !== t.toUpperCase()).forEach(t => t.split(/[.!?:;“”"—–()]\s*/).forEach(sen => sen.trim().split(/\s+/).forEach((w, k) => {
    w = strip(w); if (!w) return;
    if (/^[\p{Ll}’']+$/u.test(w)) LOWC[w] = (LOWC[w] || 0) + 1; else if (k && /^\p{Lu}[\p{Ll}’']*$/u.test(w)) { const l = w.toLowerCase(); CAPC[l] = (CAPC[l] || 0) + 1; } })));
}
function glow(cfg) {
  const T = []; for (const s of cfg.seq) { if (s.k === "quiz") T.push(s.q, s.pre, s.post, s.why, s.eb, ...(s.o || [])); if (s.k === "today") (s.options || []).forEach(o => T.push(...[].concat(o))); if (s.k === "match") (s.pairs || []).forEach(p => T.push(p[0], p[1])); if (s.k === "game") ((s.game || {}).opts || []).forEach(o => T.push(o[1])); }
  const out = new Set();
  T.forEach(t => { if (t && typeof t === "string") t.split(/[.!?…]["”’)]*\s+/).forEach(p => { const m = /^[^\p{L}]*(\p{Lu}[\p{Ll}’']*)/u.exec(p); if (!m) return;
    const lw = m[1].toLowerCase(), b = lw.replace(/[’']s$/, ""); if ((LOWC[b] || 0) > 0 && (LOWC[b] || 0) >= 2 * (CAPC[b] || 0)) out.add(lw); }); });
  return [...out].sort();
}

/* ---------- build ---------- */
const tpl = fs.readFileSync(path.join(EP, "engine.html"), "utf8");
for (const g of Object.keys(GENRES)) if (!new RegExp("\\b" + g + ": \\{").test(tpl)) console.log("! engine has no genre", g);
fs.mkdirSync(path.join(EP, "assets"), { recursive: true });
for (const f of FINN_SRC && fs.existsSync(FINN_SRC) ? fs.readdirSync(FINN_SRC) : []) {
  if (f.startsWith("finn-") && f.endsWith(".webp") && !fs.existsSync(path.join(EP, "assets", f))) fs.copyFileSync(path.join(FINN_SRC, f), path.join(EP, "assets", f));
}
const built = [], skipped = [];
for (const F of FAITHS) for (const id of ordered[F.key]) {
  if (ONLY && !ONLY.has(id)) continue;
  const c = configs[id]; if (!c) { skipped.push(id); continue; }
  const L = lessons[id];
  validate(id, c, L);
  try {
    const cfg = compose(id, c, L);
    const html = tpl.replace("__TITLE__", (L.title || id).replace(/</g, "&lt;") + " · infinite hill").replace("/*CFG*/null", () => JSON.stringify(cfg).replace(/<\/script/gi, "<\\/script")).replace("/*GLOW*/[]", () => JSON.stringify(glow(cfg)));
    fs.mkdirSync(path.join(EP, id), { recursive: true });
    fs.writeFileSync(path.join(EP, id, "index.html"), html);
    built.push(id);
  } catch (e) { problems.push([id, "build failed: " + e.message]); }
}
for (const id of Object.keys(configs)) if (!lessons[id]) validate(id, configs[id], null);

// when building a subset, keep the earlier list entries
let list = built;
if (ONLY && fs.existsSync(path.join(EP, "list.json"))) { const old = readJSON(path.join(EP, "list.json")); list = [...new Set(old.concat(built))]; }
list = FAITHS.flatMap(F => ordered[F.key].filter(id => list.includes(id) && fs.existsSync(path.join(EP, id, "index.html"))));
fs.writeFileSync(path.join(EP, "list.json"), JSON.stringify(list, null, 1));
fs.writeFileSync(path.join(EP, "styles.json"), JSON.stringify(styles, null, 1));

/* ---------- library page ---------- */
const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const sections = FAITHS.map(F => {
  const ids = list.filter(id => lessons[id] && lessons[id].home === F.key); if (!ids.length) return "";
  return `<section><h2>${esc(F.name)} <span>${ids.length}</span></h2><div class="grid">` + ids.map(id => {
    const L = lessons[id], shots = L.steps.filter(s => s.t === "shot"), c = configs[id] || {}, st = styles[id];
    const sh = shots[(c.drop >= 0 && c.drop < shots.length) ? c.drop : Math.round(shots.length * 0.6)] || shots[0];
    return `<a class="ep" href="${esc(id)}/index.html"><img loading="lazy" src="../${esc(L.clips + sh.v)}.webp" alt=""><div class="meta"><b>${esc(L.title)}</b><small>${esc(st.genre)} · ${esc(st.keyName)} · ${st.bpm}</small></div></a>`;
  }).join("") + `</div></section>`;
}).join("");
// episodes/index.html was replaced by a hand-made page ("Infinite Hill Drops"); only write the library when the file is
// missing or is still the generated library, so a rebuild never wipes that page
const LIB = path.join(EP, "index.html"), libOK = !fs.existsSync(LIB) || fs.readFileSync(LIB, "utf8").includes("<title>episodes · infinite hill</title>");
if (libOK) fs.writeFileSync(LIB, `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>episodes · infinite hill</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@500;700;800&display=swap">
<style>
:root { --ink: #0A0A0A; --night: #0A0A0A; --cream: #F3EFE4; --y: #EEFF6A; color-scheme: dark; }
body { margin: 0; background: var(--night); color: var(--cream); font: 500 16px/1.4 Manrope, system-ui, sans-serif; }
header { padding: 28px 16px 8px; max-width: 1100px; margin: 0 auto; }
header small { font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: rgba(243,239,228,.6); font-size: 12px; }
h1 { margin: 8px 0 6px; font: 400 64px/.9 Anton, Impact, sans-serif; text-transform: uppercase; }
h1 em { font-style: normal; color: var(--y); }
header p { margin: 0; font-weight: 700; color: rgba(243,239,228,.75); max-width: 40ch; }
main { max-width: 1100px; margin: 0 auto; padding: 0 16px 60px; }
section h2 { font: 400 34px/1 Anton, Impact, sans-serif; text-transform: uppercase; margin: 34px 0 12px; display: flex; align-items: center; gap: 10px; }
section h2 span { font: 800 13px Manrope, sans-serif; background: var(--y); color: var(--ink); border-radius: 999px; padding: 3px 9px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.ep { position: relative; display: block; aspect-ratio: 9 / 14; border-radius: 16px; overflow: hidden; background: #1c1c1c; color: var(--cream); text-decoration: none; }
.ep img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .3s; }
.ep:hover img { transform: scale(1.05); }
.ep .meta { position: absolute; left: 0; right: 0; bottom: 0; padding: 30px 10px 10px; background: linear-gradient(transparent, rgba(10,10,10,.92)); }
.ep b { display: block; font: 400 20px/1 Anton, Impact, sans-serif; text-transform: uppercase; }
.ep small { font-weight: 700; font-size: 11px; color: rgba(243,239,228,.65); }
.ep:focus-visible { outline: 3px solid var(--y); outline-offset: 3px; }
</style></head><body>
<header><small>infinite hill · episodes</small><h1>because you gotta <em>have faith.</em></h1><p>religion, reimagined. every story, its own sound.</p></header>
<main>${sections || "<p>no episodes built yet.</p>"}</main></body></html>
`);

/* ---------- report ---------- */
console.log(`built ${built.length} episode(s) from ${path.relative(EP, CONFIGS) || "."}; ${skipped.length} lesson(s) have no config yet; list.json has ${list.length}.`);
const combos = new Set(list.map(id => styles[id].genre + "/" + styles[id].keyName + "/" + styles[id].bpm));
console.log(`unique genre+key+bpm among built: ${combos.size}/${list.length}`);
if (problems.length) { console.log(`\n${problems.length} config problem(s):`); for (const [id, m] of problems) console.log("  " + id + ": " + m); }
else console.log("no config problems.");
