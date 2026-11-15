// Builds films.json: which curriculum days play a real film in player.html, and the clips for each.
// Sources: ../../films/wave1/map.json (days that reuse an existing filmed story in ../../lessons/<id>.json)
// and ../../films/wave1/specs/<door>-<day>.json (new wave-1 films painted into ../../art/sacred/w1-<door>-<day>/clips/).
// Re-run any time more clips land:  node films.mjs
// Every planned shot is listed, even unpainted ones; `has` records what existed when this ran.
// The player still checks each file at runtime (mp4, then webp with a slow zoom, else skip the shot).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pickKeyword, namesIn } from "../keyword.mjs";
import { CAPS } from "./caps-week1.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GB = path.resolve(HERE, "../..");
const W1 = path.join(GB, "films/wave1");
const map = JSON.parse(fs.readFileSync(path.join(W1, "map.json"), "utf8"));
const rel = (p) => "../../" + p.replace(/\\/g, "/").replace(/^\/+/, "");
const exists = (p) => fs.existsSync(path.join(GB, p));
const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();

// cinema captions (2026-11-08): each shot gets `hot`, its one lime keyword. Automatic (a name, else the lesson's word, else the
// most important word); a spec shot's own "hot" wins, and so does this list: HOT["<door>-<day>"][<shot number, from 1>] = "word".
const HOT = {
  "christianity-1": { 2: "bread", 4: "remembrance" },
  "christianity-2": { 3: "singular", 6: "one" },
  "christianity-4": { 4: "babies", 5: "faith" },
  "christianity-5": { 5: "quiet" },
  "christianity-6": { 1: "wind", 3: "wind", 5: "language" },
  "christianity-7": { 3: "story" },
  "christianity-8": { 1: "amen" },
  "christianity-9": { 5: "grace" },
  "christianity-10": { 1: "glass" },
  "christianity-11": { 4: "our" },
  "christianity-14": { 6: "first" },
  "christianity-29": { 3: "double", 4: "buries" },
  "christianity-30": { 4: "ease" },
  "catholic-5": { 3: "keys", 4: "honor" },
  "catholic-29": { 3: "three" },
  "judaism-29": { 2: "garments" },
  "judaism-30": { 2: "gift" },
  "hinduism-1": { 1: "first", 3: "name" },
  "hinduism-3": { 1: "king" },
  "hinduism-5": { 2: "being", 4: "grass" },
  "hinduism-6": { 2: "thousand", 4: "six", 5: "one" },
  "spiritual-24": { 1: "enslaved", 4: "nicopolis" },
  "hinduism-11": { 3: "gone", 6: "two" },
  "hinduism-12": { 5: "thousand" },
  "hinduism-23": { 6: "shakti" },
  "hinduism-27": { 3: "everything" },
  "hinduism-29": { 3: "sky" },
  "sikhism-9": { 1: "number", 5: "one", 6: "one" },
  "buddhism-29": { 2: "parasol" },
  "spiritual-29": { 2: "free", 3: "plato", 5: "honestly" },
};
// new opening lines (openings audit, 2026-11-08): the shot-1 lime word, merged into the list above
const OPEN = {
  "christianity-7": "library", "christianity-22": "listen", "christianity-30": "dies", "catholic-29": "gone",
  "islam-29": "calling", "hinduism-6": "gods", "hinduism-8": "rice", "hinduism-20": "cramming", "hinduism-21": "sits",
  "hinduism-22": "made", "hinduism-27": "mouse", "buddhism-29": "pain", "spiritual-29": "everyone",
};
for (const k in OPEN) HOT[k] = Object.assign({}, HOT[k], { 1: OPEN[k] });
// the loudest picture in each film (openings audit): the cold-open cover plays it (player.html?cold=1); otherwise shot 1
const LOUD = {
  "christianity-2": 4, "christianity-6": 4, "christianity-7": 2, "christianity-11": 2, "christianity-14": 3, "christianity-22": 4, "christianity-29": 4,
  "catholic-5": 2, "catholic-23": 2, "catholic-29": 2, "judaism-3": 5, "judaism-29": 4, "hinduism-3": 4, "hinduism-6": 2, "hinduism-14": 3,
  "hinduism-17": 3, "hinduism-19": 3, "hinduism-22": 3, "hinduism-23": 2, "hinduism-27": 3, "hinduism-30": 5, "buddhism-29": 4, "buddhism-30": 2,
  "sikhism-9": 5, "spiritual-30": 3,
};
const keyFor = (door, day, n, cap, names, prefer, own) => {
  const o = (HOT[door + "-" + day] || {})[n] || own;
  if (o && cap.toLowerCase().includes(String(o).toLowerCase())) return String(o);
  return pickKeyword(cap, { names, prefer });
};

const out = { v: 1, made: new Date().toISOString(), doors: {} };
const stats = { days: 0, reuse: 0, fresh: 0, full: 0, partial: 0, empty: 0, shots: 0, painted: 0 };
const rows = [];

for (const door of Object.keys(map)) {
  for (const day of Object.keys(map[door]).sort((a, b) => a - b)) {
    const m = map[door][day];
    let film = null;
    if (m.film) {
      const lf = path.join(GB, "lessons", m.film + ".json");
      if (!fs.existsSync(lf)) { console.warn("missing lesson", m.film); continue; }
      const L = JSON.parse(fs.readFileSync(lf, "utf8"));
      const dir = String(L.clips || "art/sacred/" + m.film + "/clips/").replace(/\/?$/, "/");
      const names = new Set((L.steps || []).flatMap((s) => [...namesIn(s.line)]));
      const recut = CAPS[door + "-" + day], steps = (L.steps || []).filter((s) => s.t === "shot" && s.v);
      if (recut && recut.length !== steps.length) console.warn("week-one recut count mismatch", door, day, recut.length, steps.length);
      const capOf = (s, k) => clean(recut && recut.length === steps.length ? recut[k] : s.line);
      const shots = steps.map((s, k) => ({
        mp4: rel(dir + s.v + ".mp4"), webp: rel(dir + s.v + ".webp"), cap: capOf(s, k), move: "",
        hot: keyFor(door, day, k + 1, capOf(s, k), names, [], s.hot),
        has: [exists(dir + s.v + ".mp4") ? "mp4" : "", exists(dir + s.v + ".webp") ? "webp" : ""].filter(Boolean),
      }));
      film = { kind: "reuse", id: m.film, title: clean(L.title).toLowerCase(), style: "original sacred-art film", told: clean(L.told), shots };
    } else {
      const sf = path.join(W1, "specs", door + "-" + day + ".json");
      if (!fs.existsSync(sf)) continue;   // no film planned: stays type-led
      const S = JSON.parse(fs.readFileSync(sf, "utf8"));
      const id = "w1-" + door + "-" + day, dir = "art/sacred/" + id + "/clips/";
      const names = new Set((S.shots || []).flatMap((s) => [...namesIn(s.prompt), ...namesIn(s.scene)]).concat([...namesIn(S.cast)]));
      const shots = (S.shots || []).map((s, k) => {
        const n = s.n || k + 1, base = dir + id + "-" + n;
        return { mp4: rel(base + ".mp4"), webp: rel(base + ".webp"), cap: clean(s.caption), move: s.move || "",
          hot: keyFor(door, day, n, clean(s.caption), names, [S.lesson && S.lesson.word].filter(Boolean), s.hot), ...(s.sub ? { sub: clean(s.sub) } : {}),
          has: [exists(base + ".mp4") ? "mp4" : "", exists(base + ".webp") ? "webp" : ""].filter(Boolean) };
      });
      film = { kind: "new", id, title: clean(S.title), style: clean(S.styleName || S.style), shots };
    }
    if (!film.shots.length) continue;
    // remix: painted looks (art/sacred/<id>/looks/looks.json) and a holy-day lock, only when they exist
    try {
      const firstMp4 = (film.shots[0] || {}).mp4 || "", lj = firstMp4.replace(/^\.\.\/\.\.\//, "").replace(/\/clips\/[^/]*$/, "/looks/looks.json");
      if (lj.endsWith("looks.json") && exists(lj)) { const J = JSON.parse(fs.readFileSync(path.join(GB, lj), "utf8")); if (Array.isArray(J.looks) && J.looks.length) film.looks = { default: J.default || "", looks: J.looks.filter((x) => typeof x === "string" && /^[a-z0-9-]+$/.test(x)), lock: J.lock || null }; }
    } catch (e) { console.warn("bad looks.json for", film.id, e.message); }
    if (m.holy) film.holy = m.holy;
    if (LOUD[door + "-" + day]) film.loud = LOUD[door + "-" + day];
    const painted = film.shots.filter((s) => s.has.length).length;
    film.painted = painted;
    (out.doors[door] = out.doors[door] || {})[day] = film;
    stats.days++; stats[film.kind === "reuse" ? "reuse" : "fresh"]++;
    stats.shots += film.shots.length; stats.painted += painted;
    const state = painted === film.shots.length ? "full" : painted ? "partial" : "empty";
    stats[state]++;
    rows.push([door, day, film.kind, film.id, painted + "/" + film.shots.length, state].join("\t"));
  }
}
out.stats = stats;
fs.writeFileSync(path.join(HERE, "films.json"), JSON.stringify(out));
console.log(rows.filter((r) => !r.endsWith("full")).join("\n"));
console.log(JSON.stringify(stats));
