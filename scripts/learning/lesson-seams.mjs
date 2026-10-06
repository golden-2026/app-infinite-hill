// Lesson seams: writing-process leftovers in the lesson scripts (docs/review-kit/claude-baseline.md §5).
// Lists every lesson in years 1–3 whose "line to carry" just repeats the title or the word, or is an outline label,
// and every lesson whose "today's word" is a phrase of three or more words or an outline label, with counts per door
// and year. Writes a report (default docs/learning/lesson-seams.md).
//
//   node scripts/learning/lesson-seams.mjs [--report docs/learning/lesson-seams.md] [--door HINDUISM] [--json out.json] [--quiet]
//
// What counts (tuned on the review kit's examples, so real short words like "om" and real two-word terms like
// "bhakti yoga" pass, and an outline label does not):
//   carry seams
//     carry=title     the carry is the title (or the title's head, before a colon, dash or bracket)
//     carry=word      the carry is the word
//     label           the carry reads like an outline label: brackets, verse or chapter numbers, "(6 sessions)",
//                     "complete", "close", "part 2", "(3 of 7)"
//   word seams
//     3+ words        three or more words ("the four noble truths"): the strand stops being words
//     label           a verse/chapter reference ("Patanjali 1.1", "Psalm 23"), an outline tag ("Rehras close",
//                     "Meditations close", "part two", "review"), brackets, or a numbered/session label
// Exit code is 0; this is a report, not a gate.
import fs from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listScripts } from "../../packages/content/scripts/lesson-files.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const reportPath = arg("--report", "docs/learning/lesson-seams.md");
const jsonPath = arg("--json", null);
const onlyDoor = arg("--door", null);
const quiet = process.argv.includes("--quiet");
const baselinePath = arg("--baseline", "docs/learning/lesson-seams-baseline.json"); // counts before the fix, for before → after
const saveBaseline = process.argv.includes("--save-baseline");
const LAST_DAY = 1061; // years 1–3

const YEAR = (d) => (d <= 331 ? 1 : 2 + Math.floor((d - 332) / 365));
export const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, "'")
  .replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
// words are split on spaces only, so a hyphenated term ("yawm ad-din", "ahl al-bayt") counts as what it is
const words = (s) => String(s || "").trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
// the title's head: before a colon, semicolon, dash, bracket or comma (how the outline builds a word from a title)
const head = (s) => norm(String(s || "").split(/[;:(—–·]/)[0]);

// Outline tags that leak from the plan: "Rehras close", "Meditations close", "the Ashtavakra Gita complete",
// "Bhishma Parva (... 6 sessions)", "part 2", "(3 of 7)", "review", "week 4", "begins", "continued".
const LABEL_TAG = /\b(close|closes|complete|completed|continued|cont|begins|opening|ends|concluded|recap|review|part \d+|part (one|two|three|four|five|six)|week \d+|session|sessions|day \d+|block|overview|intro|introduction)\s*$/i;
const CARRY_TAG = /\b(complete|continued|cont|recap|overview|intro|introduction|part \d+|week \d+|sessions?)\s*$/i;
const NUMBERED =/\b\d+\s*(of|\/)\s*\d+\b|\bsessions?\b|\bpart\s+\d\b/i;
const VERSE_REF = /\b\d+[.:]\d+|\b(chapter|ch\.?|canto|book|psalm|psalms|surah|sura|ang|verse|verses|parva|kanda|sutra|sutta|mandala|pauri|salok|shlok|sloka|section)\s+\d+/i;

export function carrySeam(s) {
  const c = norm(s.carry), t = norm(s.title), w = norm(s.word);
  if (!c) return null;
  if (c === t) return "carry=title";
  if (c === head(s.title) && words(c).length >= 1 && c.length > 2) return "carry=title";
  if (w && c === w) return "carry=word";
  const raw = String(s.carry);
  if (/[()[\]]/.test(raw)) return "label";
  if (VERSE_REF.test(raw) || /\b\d+\s*[–-]\s*\d+\b/.test(raw)) return "label";
  if (NUMBERED.test(raw)) return "label";
  if (/…$|\s—\s/.test(raw)) return "label";
  // a carry may honestly say "it ends" or "the play begins"; only the plan's own bookkeeping words count here
  if (CARRY_TAG.test(raw.trim())) return "label";
  return null;
}

export function wordSeam(s) {
  const raw = String(s.word || "").trim();
  if (!raw) return null;
  if (/[()[\]]/.test(raw)) return "label";
  // a bare small number can be a real word (108, the mala's count); a year or a verse number is a label
  if (VERSE_REF.test(raw) || /\d/.test(raw.replace(/^\d{1,3}$/, ""))) return "label";
  if (NUMBERED.test(raw)) return "label";
  if (LABEL_TAG.test(raw)) return "label";
  if (words(raw).length >= 3) return "3+ words";
  return null;
}

const main = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (main) report();

function report() {
const files = listScripts().filter((f) => f.script && f.day <= LAST_DAY && (!onlyDoor || f.door === onlyDoor));
const rows = [];
const counts = {}; // door -> year -> {n, carry, word}
for (const f of files) {
  const s = f.script;
  const c = carrySeam(s), w = wordSeam(s);
  const y = YEAR(f.day);
  const k = ((counts[f.door] ||= {})[y] ||= { n: 0, carry: 0, word: 0, either: 0 });
  k.n++;
  if (c) k.carry++;
  if (w) k.word++;
  if (c || w) { k.either++; rows.push({ door: f.door, day: f.day, year: y, rel: f.rel, title: s.title, word: s.word, carry: s.carry, carrySeam: c, wordSeam: w }); }
}

const total = { n: 0, carry: 0, word: 0, either: 0 };
for (const d of Object.values(counts)) for (const k of Object.values(d)) for (const x of Object.keys(total)) total[x] += k[x];
const basePath = join(root, baselinePath);
if (saveBaseline) fs.writeFileSync(basePath, JSON.stringify({ date: new Date().toISOString().slice(0, 10), total, counts }, null, 1) + "\n");
const base = fs.existsSync(basePath) ? JSON.parse(fs.readFileSync(basePath, "utf8")) : null;
const was = (door, y, k) => (base?.counts?.[door]?.[y] ? `${base.counts[door][y][k]} → ` : "");
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : "–");

const md = [];
md.push("# Lesson seams (years 1–3)", "");
md.push(`Generated by \`node scripts/learning/lesson-seams.mjs\` on ${new Date().toISOString().slice(0, 10)}. Writing-process leftovers in the lesson scripts (review kit, \`docs/review-kit/claude-baseline.md\` §5): a "line to carry" that repeats the title or the word or reads like an outline label, and a "today's word" that is a phrase of three or more words or an outline label.`, "");
if (base) md.push(`Before the fix (${base.date}): ${base.total.carry} seam carries, ${base.total.word} seam words, ${base.total.either} lessons with either.`, "");
md.push("Camp one (days 1–21) takes its word and line from the owner's camp-one design data, not the outline, so it is listed but was left alone.", "");
md.push(`**Now: ${total.n} lessons · ${total.carry} seam carries (${pct(total.carry, total.n)}) · ${total.word} seam words (${pct(total.word, total.n)}) · ${total.either} lessons with either.**`, "");
md.push(base ? "| door | year | lessons | seam carries (before → now) | seam words (before → now) |" : "| door | year | lessons | seam carries | seam words |", "|---|---|---|---|---|");
for (const door of Object.keys(counts).sort()) for (const y of Object.keys(counts[door]).sort()) {
  const k = counts[door][y];
  md.push(`| ${door} | ${y} | ${k.n} | ${was(door, y, "carry")}${k.carry} | ${was(door, y, "word")}${k.word} |`);
}
md.push("", "## Every flagged lesson", "", "| door | day | title | word | carry | seam |", "|---|---|---|---|---|---|");
const cell = (s) => String(s ?? "").replace(/\|/g, "\\|");
for (const r of rows) md.push(`| ${r.door} | ${r.day} | ${cell(r.title)} | ${cell(r.word)} | ${cell(r.carry)} | ${[r.day <= 21 && "camp one", r.carrySeam && `carry: ${r.carrySeam}`, r.wordSeam && `word: ${r.wordSeam}`].filter(Boolean).join("; ")} |`);
md.push("");
fs.mkdirSync(dirname(join(root, reportPath)), { recursive: true });
fs.writeFileSync(join(root, reportPath), md.join("\n"));
if (jsonPath) fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 1));

if (!quiet) {
  console.log("door          year  lessons  carry  word");
  for (const door of Object.keys(counts).sort()) for (const y of Object.keys(counts[door]).sort()) {
    const k = counts[door][y];
    console.log(`${door.padEnd(13)} ${y}     ${String(k.n).padStart(5)}  ${String(k.carry).padStart(5)}  ${String(k.word).padStart(4)}`);
  }
}
console.log(`${total.n} lessons · ${total.carry} seam carries · ${total.word} seam words · ${total.either} lessons with either → ${reportPath}`);
}
