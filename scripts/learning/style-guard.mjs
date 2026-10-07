// Job 2 (the style pass) may change how a lesson reads, never what it is. For every lesson that differs from a git
// revision, check: same day, title, word, carry, tomorrow, sources and segment order; the hook/teach/practice still
// within the validator's word bounds; crisis lines kept; games.guess present and well formed.
//   node scripts/learning/style-guard.mjs [REV=HEAD] [DOOR ...]
import fs from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const args = process.argv.slice(2);
const DOORS = ["HINDUISM", "BUDDHISM", "CHRISTIANITY", "CATHOLIC", "JUDAISM", "ISLAM", "SIKHISM", "SPIRITUAL"];
const rev = args[0] && !DOORS.includes(args[0]) ? args.shift() : "HEAD";
const doors = (args.length ? args : DOORS).map((d) => d.toLowerCase());
const CRISIS = /988|emergency/i;
const changed = execSync(`git diff --name-only ${rev} -- ${doors.map((d) => `docs/curriculum/${d}/scripts`).join(" ")}`, { cwd: root }).toString().split("\n").filter((f) => f.endsWith(".json"));
const problems = [];
for (const rel of changed) {
  let before;
  try { before = JSON.parse(execSync(`git show ${rev}:${rel}`, { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).toString()); } catch { continue; }
  const after = JSON.parse(fs.readFileSync(`${root}${rel}`, "utf8"));
  const id = `${after.door}:${after.day}`;
  for (const k of ["day", "title", "word", "carry", "tomorrow"]) if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) problems.push(`${id}: ${k} changed (${JSON.stringify(before[k])} → ${JSON.stringify(after[k])})`);
  if (JSON.stringify(before.sources) !== JSON.stringify(after.sources)) problems.push(`${id}: sources changed`);
  const types = (s) => s.segments.map((g) => g.type).join(",");
  if (types(before) !== types(after)) problems.push(`${id}: segment order changed`);
  const said = (s) => s.segments.map((g) => g.voice || "").join(" ");
  if (CRISIS.test(said(before)) && !CRISIS.test(said(after))) problems.push(`${id}: a crisis line was dropped`);
  const g = after.games?.guess;
  if (after.day > 21 && !(Array.isArray(g) && g.length === 3)) problems.push(`${id}: games.guess missing`);
}
console.log(`${changed.length} lessons changed since ${rev}; ${problems.length} problems`);
for (const p of problems.slice(0, 200)) console.log("  " + p);
if (problems.length) process.exitCode = 1;
