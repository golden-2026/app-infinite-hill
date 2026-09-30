// What a script writer needs for a run of days: each day's index line (the fields a script must keep), the outline's
// camp, part, hook and practice, the sit the day gets, which feature game it plays, and whether a script exists.
//   node packages/content/scripts/script-brief.mjs DOOR FROM [TO]
import { existsSync } from "node:fs";
import { OUTLINES, lessonInfo } from "../src/index.js";
import { DOOR_KEYS, featureFor } from "../src/lesson-script.js";
import { fileFor } from "./lesson-files.mjs";

const [door, a, b] = process.argv.slice(2);
if (!DOOR_KEYS.includes(door) || !Number(a)) {
  console.log("usage: node packages/content/scripts/script-brief.mjs DOOR FROM [TO]");
  process.exit(1);
}
const sit = (d) => (d <= 2 ? "one breath with the bell" : d <= 7 ? "three breaths with the bell" : d <= 14 ? "a 45-second sit" : d <= 21 ? "a 75-second sit" : "a 2-minute sit");
const ALL = { myth: 1, fork: 1, original: 1, trapdoor: 1 };
for (let d = Number(a); d <= Number(b || a); d++) {
  const i = lessonInfo(door, d);
  const o = OUTLINES[door]?.get(d);
  const has = existsSync(fileFor(door, d));
  console.log(`\n── day ${d}${has ? "  (script exists)" : ""}`);
  console.log(`  title:  ${i?.title}`);
  console.log(`  word:   ${i?.word}${o && !o.word && d > 21 ? "   (outline has no word: this is the title's head; keep it exactly)" : ""}`);
  console.log(`  hook:   ${i?.hook}`);
  console.log(`  carry:  ${i?.carry}`);
  if (o) {
    console.log(`  camp:   ${o.camp}`);
    console.log(`  part:   ${o.part}`);
    console.log(`  practice (outline): ${o.practice || "—"}`);
  }
  console.log(`  sit:    ${sit(d)} · feature game: ${featureFor(d, ALL) || "none (day one keeps its bet)"}`);
}
