// The automatic form check for the placement question bank (docs/learning/QUESTION_RULES.md §5 and §7.3): the same
// answer every time, so blind solvers and reviewers only judge what a machine can't.
//   node scripts/learning/bank-check.mjs DOOR [FROM_STOP TO_STOP] [--json]
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const [DOOR, A, B] = process.argv.slice(2).filter((x) => !x.startsWith("--"));
const json = process.argv.includes("--json");
const dir = `${root}docs/learning/bank/${DOOR.toLowerCase()}`;
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^stop-\d+\.json$/.test(f)).sort() : [];
const LEVELS = ["recognize", "understand", "apply"];
const out = [];
const all = [];
for (const f of files) {
  const n = Number(f.match(/\d+/)[0]);
  if (A !== undefined && (n < Number(A) || n > Number(B))) continue;
  let items;
  try { items = JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8")); } catch (e) { out.push({ stop: n, problems: [`not valid JSON: ${e.message}`] }); continue; }
  const p = [];
  if (!Array.isArray(items)) { out.push({ stop: n, problems: ["not an array"] }); continue; }
  const choice = items.filter((x) => x.kind === "choice");
  if (choice.length < 6) p.push(`${choice.length} choice items (need 6)`);
  if (items.filter((x) => x.kind === "explain").length < 2) p.push("fewer than 2 explain items");
  const lv = (l) => choice.filter((x) => x.level === l).length;
  if (lv("recognize") < 2 || lv("understand") < 3 || lv("apply") < 1) p.push(`level mix ${LEVELS.map(lv).join("/")} (need ≥2 recognize, ≥3 understand, ≥1 apply)`);
  const days = {};
  for (const x of items) {
    const id = `${x.id}`;
    if (!new RegExp(`^${DOOR}-s${String(n).padStart(2, "0")}-\\d{2}$`).test(id)) p.push(`${id}: id should be ${DOOR}-s${String(n).padStart(2, "0")}-NN`);
    if (x.door !== DOOR || x.stop !== n) p.push(`${id}: door/stop fields don't match the file`);
    if (!Number.isInteger(x.day)) p.push(`${id}: day missing`);
    days[x.day] = (days[x.day] || 0) + 1;
    if (!x.stem || !x.why || !x.source) p.push(`${id}: stem, why or source missing`);
    if (/\b(NOT|EXCEPT)\b/.test(x.stem || "") || /which of (these|the following) (is|was|does|did) not\b/i.test(x.stem || "")) p.push(`${id}: negative stem`);
    if (/today'?s lesson|in the lesson|would you/i.test(x.stem || "")) p.push(`${id}: stem leans on our lesson or asks what you'd do`);
    if (!x.es || !x.es.stem) p.push(`${id}: Spanish twin missing`);
    if (x.kind === "choice") {
      if (!Array.isArray(x.options) || x.options.length !== 4) { p.push(`${id}: needs 4 options`); continue; }
      if (!Number.isInteger(x.answer) || x.answer < 0 || x.answer > 3) p.push(`${id}: answer index`);
      if (new Set(x.options.map((o) => o.toLowerCase())).size < 4) p.push(`${id}: duplicate options`);
      if (/all of the above|none of the above/i.test(x.options.join(" "))) p.push(`${id}: all/none of the above`);
      if (!x.es?.options || x.es.options.length !== 4) p.push(`${id}: Spanish options missing`);
      const L = x.options.map((o) => o.length);
      if (Math.max(...L) > 1.6 * Math.min(...L) && Math.max(...L) - Math.min(...L) > 12) p.push(`${id}: option lengths uneven (${L.join("/")})`);
      all.push(x);
    } else if (x.kind === "explain") {
      if (!Array.isArray(x.rubric) || x.rubric.length < 2) p.push(`${id}: explain item needs a rubric of 2-4 points`);
    } else p.push(`${id}: kind must be choice or explain`);
  }
  for (const [d, c] of Object.entries(days)) if (c > 2) p.push(`day ${d} used ${c} times (max 2)`);
  if (p.length) out.push({ stop: n, problems: p });
}
// door-wide form: the right answer is the longest in no more than a quarter; positions spread evenly
const longest = all.filter((x) => x.options[x.answer].length === Math.max(...x.options.map((o) => o.length))).length;
const pos = [0, 1, 2, 3].map((i) => all.filter((x) => x.answer === i).length);
const door = [];
if (all.length && longest / all.length > 0.25) door.push(`right answer is the longest in ${Math.round((100 * longest) / all.length)}% (max 25%)`);
if (all.length >= 12 && Math.max(...pos) > 0.4 * all.length) door.push(`answer positions uneven (${pos.join("/")})`);
const stems = new Map();
for (const x of all) { const k = x.stem.toLowerCase().replace(/\W+/g, " ").trim(); if (stems.has(k)) door.push(`duplicate stem: ${x.id} and ${stems.get(k)}`); stems.set(k, x.id); }
if (json) console.log(JSON.stringify({ stops: out, door }));
else {
  for (const r of out) console.log(`${DOOR} stop ${r.stop}\n  - ${r.problems.join("\n  - ")}`);
  if (door.length) console.log(`${DOOR} (whole bank)\n  - ${door.join("\n  - ")}`);
  console.log(`${DOOR}: ${all.length} choice items checked; ${out.length} stops with problems; ${door.length} bank-wide problems`);
}
