// Builds places/map-index.json for map.html from:
//   places/class/<door>.json  (class places: ~500 parents, one real spot per lesson)
//   places/places.json        (the first 100-per-path list; its meditate / music / reflect places become quiet places)
//   places/lesson-index/<door>.txt  ("year | day | title | word | hook", for lesson titles on the cards)
//   places/worlds.json        (places that already have a walkable 3D world and a trip page)
// node places/build-index.cjs   (run from prototypes/greybox)
const fs = require("fs"), path = require("path");
const D = __dirname;
const DOORS = ["christianity", "catholic", "hinduism", "judaism", "islam", "buddhism", "sikhism", "spiritual"];
const QUIET = new Set(["meditate", "music", "reflect", "prayer-optional"]);
const read = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null);
const worlds = read(path.join(D, "worlds.json")) || [];
// a place gets a trip only on its own path, matched on whole words of its name
const tripFor = (p, door) => { const w = worlds.find((w) => w.door === door && new RegExp("\\b(" + w.match + ")\\b", "i").test(p.name)); return w ? w.trip : undefined; };
const r4 = (n) => Math.round(n * 1e4) / 1e4;
// a place's painting: its own (art/trip/<place id>.webp) or the painting of the 3D world it links to
const ART = path.join(D, "..", "art", "trip");
// places/paints.json links paintings made before a place list existed (art key, path, name words)
const paints = read(path.join(D, "paints.json")) || [];
const imgFor = (p, door, trip) => {
  if (fs.existsSync(path.join(ART, p.id + ".webp"))) return "art/trip/" + p.id + ".webp";
  const w = trip && worlds.find((w) => w.trip === trip);
  if (w) return "art/trip/" + w.world + ".webp";
  const m = paints.find((x) => x.door === door && new RegExp("\\b(" + x.match + ")", "i").test(p.name));
  return m ? "art/trip/" + m.art + ".webp" : undefined;
};

const out = [];
const report = {};
for (const door of DOORS) {
  const titles = {};
  const idx = path.join(D, "lesson-index", door + ".txt");
  if (fs.existsSync(idx)) for (const line of fs.readFileSync(idx, "utf8").split("\n")) {
    const [, day, title] = line.split(" | ");
    if (day) titles[+day] = title;
  }
  const cls = read(path.join(D, "class", door + ".json"));
  let n = 0, spots = 0;
  if (cls) for (const p of cls.places) {
    const sp = (p.spots || []).slice().sort((a, b) => a.lesson[1] - b.lesson[1]);
    const lessons = sp.length ? sp.map((s) => ({ day: s.lesson[1], spot: s.name, title: titles[s.lesson[1]] }))
      : (p.lessons || []).map((l) => ({ day: l[1], spot: p.name, title: titles[l[1]] })).sort((a, b) => a.day - b.day);
    out.push({ id: p.id, door, kind: "class", name: p.name, country: p.country, lat: r4(p.lat), lon: r4(p.lon),
      unlock: p.unlock || "open", why: p.why, realVisit: p.realVisit, spots: lessons.length, first: lessons.length ? lessons[0].day : null,
      lessons, trip: tripFor(p, door) });
    out[out.length - 1].img = imgFor(p, door, out[out.length - 1].trip);
    n++; spots += lessons.length;
  }
  report[door] = { classPlaces: n, spots };
}
const first = read(path.join(D, "places.json")) || [];
for (const p of first) {
  const door = p.path === "catholicism" ? "catholic" : p.path;
  if (!DOORS.includes(door) || !QUIET.has(p.activity)) continue;
  out.push({ id: "q-" + p.id, door, kind: "practice", name: p.name, country: p.country, lat: r4(p.lat), lon: r4(p.lon),
    unlock: p.unlock || "open", why: p.story, activity: p.activity, realVisit: p.realVisit, trip: tripFor(p, door) });
  out[out.length - 1].img = imgFor(p, door, out[out.length - 1].trip);
  report[door].quiet = (report[door].quiet || 0) + 1;
}
fs.writeFileSync(path.join(D, "map-index.json"), JSON.stringify({ built: new Date().toISOString(), places: out }));
console.log(JSON.stringify(report), (fs.statSync(path.join(D, "map-index.json")).size / 1e6).toFixed(2) + " MB");
