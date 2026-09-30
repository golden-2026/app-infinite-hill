// Checks every full lesson script against the format (docs/curriculum/SCRIPT_GUIDE.md):
// schema, required segments in order, spoken word counts, games, sources on the public-domain list, forbidden
// phrases, British spelling, and that the word and carry match the path's index (camp 1 data or the outline).
// Also checks neighbors: a day's review should pick up the day before.
//   node packages/content/scripts/validate-scripts.mjs [DOOR] [--quiet] [--stats]
// Exits 1 when any script has an error. Warnings never fail.
import { statSync } from "node:fs";
import { checkScript, DOOR_KEYS } from "../src/lesson-script.js";
import { lessonInfo } from "../src/index.js";
import { listScripts } from "./lesson-files.mjs";

const only = process.argv.find((a) => DOOR_KEYS.includes(a));
const quiet = process.argv.includes("--quiet");
const files = listScripts({ doors: only ? [only] : DOOR_KEYS });
const byKey = new Map(files.map((f) => [`${f.door}:${f.day}`, f]));
let bad = 0, warned = 0;
const totals = { words: 0, bytes: 0, n: 0, sources: 0, quoted: 0 };
const perDoor = {};
const strip = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9' ]+/g, " ");

for (const f of files) {
  const errors = [], warnings = [];
  if (f.parseError) errors.push(`not valid JSON: ${f.parseError}`);
  if (f.wrongYear) errors.push(`sits in the wrong year folder (day ${f.day} belongs in ${f.wrongYear})`);
  let stats = null;
  if (f.script) {
    const info = lessonInfo(f.door, f.day);
    const index = info ? { title: info.title, word: info.word, carry: info.carry } : null;
    const r = checkScript(f.script, { index, door: f.door, day: f.day });
    errors.push(...r.errors);
    warnings.push(...r.warnings);
    stats = r.stats;
    // neighbors: the review should pick up yesterday (its word or its line)
    if (f.day > 1) {
      const prev = byKey.get(`${f.door}:${f.day - 1}`)?.script || lessonInfo(f.door, f.day - 1);
      const review = (f.script.segments || []).find((g) => g.type === "review")?.voice || "";
      const hits = [prev?.word, prev?.carry].filter(Boolean).some((t) => strip(review).includes(strip(t).trim().split(/\s+/).slice(0, 3).join(" ")));
      if (prev && !hits) warnings.push(`review doesn't mention yesterday's word ("${prev.word}") or line ("${prev.carry}")`);
    }
  }
  const d = (perDoor[f.door] ||= { n: 0, bad: 0, words: 0 });
  d.n++;
  if (stats) {
    totals.words += stats.total; totals.n++; d.words += stats.total;
    totals.bytes += statSync(f.file).size;
    totals.sources += (f.script.sources || []).length;
    totals.quoted += (f.script.sources || []).filter((r) => r.quoted).length;
  }
  if (errors.length) { bad++; d.bad++; }
  if (warnings.length) warned++;
  if (errors.length || (!quiet && warnings.length)) {
    console.log(`${f.rel}${stats ? ` · ${stats.total} words · ${stats.minutes} min spoken` : ""}`);
    for (const e of errors) console.log(`  ERROR  ${e}`);
    if (!quiet) for (const w of warnings) console.log(`  warn   ${w}`);
  }
}

console.log("");
for (const [door, d] of Object.entries(perDoor)) console.log(`${door}: ${d.n} scripts, ${d.n - d.bad} clean${d.bad ? `, ${d.bad} with errors` : ""}, ${Math.round(d.words / Math.max(1, d.n))} spoken words on average`);
console.log(`${files.length} scripts · ${files.length - bad} pass · ${bad} fail · ${warned} with warnings`);
if (totals.n) console.log(`average: ${Math.round(totals.words / totals.n)} spoken words (${(totals.words / totals.n / 150).toFixed(1)} min), ${Math.round(totals.bytes / totals.n)} bytes on disk, ${(totals.sources / totals.n).toFixed(1)} sources (${totals.quoted} quoted in all)`);
process.exit(bad ? 1 : 0);
