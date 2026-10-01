// Checks the kids' track files (packages/content/kids/<door>.json, format "ih-kids/1"; docs/curriculum/KIDS_GUIDE.md).
//   node packages/content/scripts/validate-kids.mjs [DOOR] [--quiet]
// Exits 1 when any file has an error. Warnings never fail.
import { existsSync, readFileSync } from "node:fs";
import { DOOR_KEYS } from "../src/lesson-script.js";
import { checkKids } from "../src/kids.js";

const only = process.argv.find((a) => DOOR_KEYS.includes(a));
const quiet = process.argv.includes("--quiet");
let bad = 0, warned = 0, lessons = 0;
for (const door of only ? [only] : DOOR_KEYS) {
  const url = new URL(`../kids/${door.toLowerCase()}.json`, import.meta.url);
  if (!existsSync(url)) { console.log(`${door}: no kids' file yet`); bad++; continue; }
  let file;
  try { file = JSON.parse(readFileSync(url, "utf8")); } catch (e) { console.log(`${door}: not valid JSON: ${e.message}`); bad++; continue; }
  const { errors, warnings } = checkKids(file, door);
  lessons += Array.isArray(file.lessons) ? file.lessons.length : 0;
  if (errors.length) bad++;
  warned += warnings.length;
  console.log(`${door}: ${errors.length ? `${errors.length} error(s)` : "ok"}${warnings.length ? `, ${warnings.length} warning(s)` : ""}`);
  for (const m of errors) console.log(`  ERROR ${m}`);
  if (!quiet) for (const m of warnings) console.log(`  warn  ${m}`);
}
console.log(`\n${lessons} kids' lessons checked · ${bad} file(s) with errors · ${warned} warning(s)`);
process.exit(bad ? 1 : 0);
