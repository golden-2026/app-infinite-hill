// The job 2 checklist, checked by machine (the same answer every time). Reviewers then judge only what a machine
// can't: whether anything was lost or invented.
//   node scripts/learning/style-lint.mjs DOOR FROM TO [--json]
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const [DOOR, FROM, TO] = process.argv.slice(2);
const json = process.argv.includes("--json");
const file = (d) => ["y1", "y2", "y3"].map((y) => `${root}docs/curriculum/${DOOR.toLowerCase()}/scripts/${y}/day-${String(d).padStart(4, "0")}.json`).find(fs.existsSync);
const seg = (s, t) => s.segments.find((g) => g.type === t) || {};
const words = (t) => (String(t || "").match(/[A-Za-zÀ-ÿ'’-]+/g) || []).length;
const sentences = (t) => String(t || "").split(/(?<=[.!?])\s+/).filter((x) => x.trim());
const signoff = (s) => sentences(seg(s, "the carry").voice).at(-1) || "";
const HOMEWORK = /^(today|tonight|this week|try|take|tell|send|call|text|notice|pick|go|find|ask|write|make|do|choose|look for|spend|give|catch|treat|step)\b/i;
const out = [];
for (let d = +FROM; d <= +TO; d++) {
  const f = file(d);
  if (!f) continue;
  const s = JSON.parse(fs.readFileSync(f, "utf8"));
  const p = [];
  const all = s.segments.map((g) => g.voice || "").join(" ");
  if (/the bell holds the time/i.test(all)) p.push("says 'the bell holds the time'");
  const total = words(all);
  if (total < 300 || total > 490) p.push(`spoken words ${total} (aim 300-480)`);
  const carry = seg(s, "the carry").voice || "";
  const after = sentences(carry.replace(/^Your line:[^.!?]*[.!?]\s*/i, "")).slice(0, -1); // minus the sign-off
  if (after.length > 1) p.push(`carry has ${after.length} sentences after the line (max 1, plus the sign-off)`);
  for (const x of after) if (HOMEWORK.test(x.trim())) p.push(`carry gives homework: "${x.trim().slice(0, 70)}"`);
  const review = seg(s, "review").voice || "";
  if (/\bdid you\b|\bwho got\b|\bhow did it go\b/i.test(review)) p.push("review checks up on homework");
  const prac = seg(s, "the practice").voice || "";
  if (sentences(prac).length > 5) p.push(`practice is ${sentences(prac).length} sentences (aim 2-3)`);
  if (/after the bell,? (go|actually|if you can)/i.test(prac)) p.push("practice sends you off to do something");
  const prev = file(d - 1) && d - 1 >= +FROM ? JSON.parse(fs.readFileSync(file(d - 1), "utf8")) : null;
  if (prev && signoff(prev).replace(/\d+|[a-z-]+ty[- ]?\w*/gi, "#") === signoff(s).replace(/\d+|[a-z-]+ty[- ]?\w*/gi, "#") && signoff(s)) p.push(`same sign-off pattern as the day before ("${signoff(s)}")`);
  const g = s.games?.guess;
  if (!Array.isArray(g) || g.length !== 3) p.push("games.guess missing");
  else {
    const [right, ...wrong] = g;
    if (right.length > 1.25 * Math.max(...wrong.map((w) => w.length))) p.push(`guess: the right answer is the longest by far (${right.length} vs ${wrong.map((w) => w.length).join("/")})`);
    const w = String(s.word || "").toLowerCase();
    if (w.length > 3 && wrong.some((x) => x.toLowerCase().includes(w))) p.push("guess: a wrong choice contains today's word");
  }
  if (p.length) out.push({ day: d, problems: p });
}
if (json) console.log(JSON.stringify(out));
else {
  for (const r of out) console.log(`${DOOR}:${r.day}\n  - ${r.problems.join("\n  - ")}`);
  console.log(`${DOOR} ${FROM}-${TO}: ${out.length} lessons with problems`);
}
