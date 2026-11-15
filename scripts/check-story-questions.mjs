// Checks the machine-checkable parts of docs/curriculum/QUESTION_RULES.md for the playable story lessons.
// Usage: node scripts/check-story-questions.mjs [lessonsDir]   (exits 1 on any problem)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const norm = (s) => String(s).toLowerCase().replace(/[“”"‘’'.,!?…:;()]/g, "").replace(/\s+/g, " ").trim();

export function checkLesson(L) {
  const out = [];
  if (!Array.isArray(L.steps)) return []; // not a lesson (places.json is the map)
  const steps = L.steps;
  const qs = steps.filter((s) => s.t === "ask" || s.t === "fill" || s.t === "match");
  if (!steps.some((s) => s.predict)) out.push("no 'what happens next?' question");
  if (steps.filter((s) => s.t === "fill").length > 1) out.push("more than one fill-in");
  if (steps.filter((s) => s.t === "match").length > 1) out.push("more than one matching game");
  steps.forEach((s, i) => {
    if (!qs.includes(s)) return;
    const at = `step ${i} (${s.t})`;
    if (!s.why || s.why.trim().length < 30) out.push(`${at}: the 'why' is missing or too thin`);
    const asks = s.t === "fill" ? s.pre : s.q;
    if (typeof asks !== "string" || asks.trim().length < 8 || /undefined|null/.test(asks)) out.push(`${at}: the question text is missing`);
    if (typeof s.eb !== "string" || !s.eb.trim()) out.push(`${at}: the eyebrow label is missing`);
    if ((s.o || []).some((o) => typeof o !== "string" || !o.trim() || /^(undefined|null)$/.test(o))) out.push(`${at}: an option is empty`);
    if (s.t === "match") {
      if (!Array.isArray(s.pairs) || s.pairs.length < 3) out.push(`${at}: matching needs 3+ pairs`);
      return;
    }
    if (!Array.isArray(s.o) || s.o.length !== 3) { out.push(`${at}: needs exactly 3 options`); return; }
    if (!(s.a >= 0 && s.a < 3)) { out.push(`${at}: answer index out of range`); return; }
    const right = norm(s.o[s.a]);
    const lens = s.o.map((o) => norm(o).length);
    const others = lens.filter((_, k) => k !== s.a);
    if (lens[s.a] > 1.8 * Math.max(...others) && lens[s.a] > 25) out.push(`${at}: the right answer is much longer than the others`);
    if (new Set(s.o.map(norm)).size !== 3) out.push(`${at}: duplicate options`);
    // echo: the right answer was just shown on screen
    const before = steps.slice(Math.max(0, i - 2), i).filter((x) => x.t === "shot").map((x) => norm(x.line || "")).join(" ");
    if (!s.predict && right.length > 12 && before.includes(right)) out.push(`${at}: the answer was just on screen`);
    // a guess the lesson's own title already answers ("No effort is ever lost" → "No good effort is ever lost")
    const tw = norm(L.title || "").split(" ").filter((w) => w.length > 3);
    if (s.predict && tw.length >= 2 && tw.filter((w) => right.includes(w)).length / tw.length >= 0.6) out.push(`${at}: the title gives the answer away`);
    if (s.t === "fill") {
      const tail = norm(s.pre || "").split(" ").slice(-6).join(" ");
      if (/lost and is$/.test(tail)) out.push(`${at}: gimme fill-in`);
    }
  });
  const pos = qs.filter((s) => s.t !== "match" && s.a != null).map((s) => s.a);
  if (pos.length >= 4 && new Set(pos).size === 1) out.push("the right answer is always in the same position");
  return out;
}

export function checkDir(dir) {
  const res = {};
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
    const p = checkLesson(JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
    if (p.length) res[f] = p;
  }
  return res;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), "../prototypes/greybox/lessons");
  const res = checkDir(dir);
  const n = Object.values(res).reduce((a, b) => a + b.length, 0);
  for (const [f, p] of Object.entries(res)) console.log(f + "\n  " + p.join("\n  "));
  console.log(`${Object.keys(res).length} lessons, ${n} problems`);
  process.exit(n ? 1 : 0);
}
