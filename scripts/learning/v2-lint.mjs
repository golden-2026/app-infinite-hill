// Job 3's machine checklist for the new lesson recipe (docs/learning/map/V2_BRIEF.md): the same answer every time, so
// reviewers only judge what a machine can't (is the right reply right, is the meaning true, is the spelling standard).
//   node scripts/learning/v2-lint.mjs DOOR FROM TO [--json]
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const [DOOR, FROM, TO] = process.argv.slice(2);
const json = process.argv.includes("--json");
const file = (d) => ["y1", "y2", "y3"].map((y) => `${root}docs/curriculum/${DOOR.toLowerCase()}/scripts/${y}/day-${String(d).padStart(4, "0")}.json`).find(fs.existsSync);
const words = (t) => (String(t || "").match(/\S+/g) || []).length;
// the original scripts each path may use; anything else in `script` is a slip
const SCRIPTS = {
  HINDUISM: /^[ऀ-ॿ\s]+$/, BUDDHISM: /^[ऀ-ॿ\s]+$/, SIKHISM: /^[਀-੿\s]+$/,
  JUDAISM: /^[֐-׿\s'"״׳-]+$/, ISLAM: /^[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿\s]+$/,
  CHRISTIANITY: /^[Ͱ-Ͽἀ-῿A-Za-z\s]+$/, CATHOLIC: /^[Ͱ-Ͽἀ-῿A-Za-z\s]+$/, SPIRITUAL: /./,
};
const out = [];
for (let d = +FROM; d <= +TO; d++) {
  const f = file(d);
  if (!f) continue;
  const s = JSON.parse(fs.readFileSync(f, "utf8"));
  const g = s.games || {};
  const p = [];
  const voice = s.segments.map((x) => x.voice || "").join(" ");
  const c = g.chat;
  if (!c) p.push("games.chat missing");
  else {
    if (!c.who || /\b(rabbi|priest|imam|pastor|swami|monk|nun|granthi|pandit)\b/i.test(c.who)) p.push(`chat.who "${c.who}" (an ordinary person, not clergy)`);
    if (words(c.says) > 20) p.push(`chat.says is ${words(c.says)} words (max 20)`);
    if (!Array.isArray(c.options) || c.options.length !== 3) p.push("chat needs 3 options");
    else {
      if (c.answer !== 0) p.push("chat: put the right reply first (answer 0)");
      for (const o of c.options) if (words(o) > 22) p.push(`chat option over 22 words: "${o.slice(0, 50)}"`);
      const [right, ...wrong] = c.options;
      if (right.length > 1.25 * Math.max(...wrong.map((w) => w.length))) p.push(`chat: the right reply is the longest by far (${right.length} vs ${wrong.map((w) => w.length).join("/")})`);
      if (new Set(c.options.map((o) => o.toLowerCase())).size < 3) p.push("chat: two options are the same");
    }
    if (!c.meaning || words(c.meaning) > 30) p.push(`chat.meaning missing or over 30 words`);
  }
  const gl = g.gloss || {};
  const terms = Object.keys(gl);
  if (terms.length < 3 || terms.length > 6) p.push(`gloss has ${terms.length} terms (3-6)`);
  for (const t of terms) {
    const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (!re.test(voice)) p.push(`gloss "${t}" isn't in the spoken text`);
    const e = gl[t] || {};
    if (!e.meaning || words(e.meaning) > 14) p.push(`gloss "${t}": meaning missing or over 14 words`);
    if (e.script && !SCRIPTS[DOOR].test(e.script)) p.push(`gloss "${t}": script "${e.script}" isn't this path's original script`);
    if (e.say && !/^[A-Za-z' -]+$/.test(e.say)) p.push(`gloss "${t}": say "${e.say}" should be a plain sound-out`);
  }
  const rc = g.recall || [];
  for (const [w, m] of rc) if (String(m).length > 42) p.push(`recall "${w}": meaning over 42 characters`);
  if (!(s.review?.notes || []).some((n) => /job 3|new lesson recipe/.test(n))) p.push("review note for job 3 missing");
  if (p.length) out.push({ day: d, problems: p });
}
if (json) console.log(JSON.stringify(out));
else {
  for (const r of out) console.log(`${DOOR}:${r.day}\n  - ${r.problems.join("\n  - ")}`);
  console.log(`${DOOR} ${FROM}-${TO}: ${out.length} lessons with problems`);
}
