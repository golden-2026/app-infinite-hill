// Moves the app's own links to camp-one days (sampler, life moments, intake words) after a path's first camp is
// reordered, using "moved" in docs/learning/week1/<DOOR>.json. Links to a cut day are listed for a person to fix.
//   node scripts/learning/fix-app-days.mjs DOOR [--dry]
import fs from "node:fs";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
const DOOR = process.argv[2];
const dry = process.argv.includes("--dry");
const moved = JSON.parse(fs.readFileSync(`${root}docs/learning/week1/${DOOR}.json`, "utf8")).moved || {};
const files = ["apps/app/src/content/sampler.ts", "apps/app/src/content/life-moments.ts", "apps/app/src/content/intake.ts"];
for (const rel of files) {
  const path = `${root}${rel}`;
  let s = fs.readFileSync(path, "utf8");
  const before = s;
  // ["DOOR", 7, "…"] tuples and  DOOR: [[7, "…"], …] lists, and { door: "DOOR", …, day: 7, … } objects
  s = s.replace(new RegExp(String.raw`(\["${DOOR}", )(\d+)(,)`, "g"), (m, a, d, b) => fix(rel, m, a, d, b));
  s = s.replace(new RegExp(String.raw`(${DOOR}: \[)([^\n]*)`, "g"), (m, a, rest) => a + rest.replace(/(\[)(\d+)(, ")/g, (mm, x, d, y) => fix(rel, mm, x, d, y)));
  s = s.replace(new RegExp(String.raw`(\{ door: "${DOOR}"[^}]*?day: )(\d+)(,)`, "g"), (m, a, d, b) => fix(rel, m, a, d, b));
  if (s !== before && !dry) fs.writeFileSync(path, s);
}
function fix(rel, m, a, d, b) {
  if (+d > 21 || !(d in moved)) return m;
  const to = moved[d];
  if (to === null) { console.log(`CHECK ${rel}: ${DOOR} day ${d} was cut from camp one`); return m; }
  if (to === +d) return m;
  console.log(`${rel}: ${DOOR} ${d} → ${to}`);
  return `${a}${to}${b}`;
}
