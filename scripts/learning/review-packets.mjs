// One scholar review packet per path: every lesson written or rebuilt on 2026-10-06 (the first week from the audience
// research, and job 1 from the five-year map), with its title, word, line and the writer's own "please confirm" notes.
//   node scripts/learning/review-packets.mjs   → docs/review/<PATH>.md
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const NAMES = { hinduism: "Hinduism", buddhism: "Buddhism", christianity: "Christianity", catholic: "Catholicism", judaism: "Judaism", islam: "Islam", sikhism: "Sikhism", spiritual: "Simply Spiritual (my own path)" };
const NEW = /Week one rebuilt 2026-10-06|Rewritten 2026-10-06|Added 2026-10-06|2026-10-06 from the five-year map/i;
fs.mkdirSync(`${root}docs/review`, { recursive: true });
for (const [door, name] of Object.entries(NAMES)) {
  const rows = [];
  for (const y of ["y1", "y2", "y3"]) {
    const dir = `${root}docs/curriculum/${door}/scripts/${y}`;
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).sort()) {
      const s = JSON.parse(fs.readFileSync(`${dir}/${f}`, "utf8"));
      const notes = (s.review?.notes || []).map(String);
      if (!notes.some((n) => NEW.test(n))) continue;
      rows.push({ day: s.day, title: s.title, word: s.word, carry: s.carry, notes, sources: s.sources || [] });
    }
  }
  const md = [`# ${name}: lessons to review`, "",
    `For the Keeper. ${rows.length} lessons were written or changed on 2026-10-06, from audience research (Reddit, YouTube, app reviews) and a five-year map. Each lists what the writer asks you to confirm. Nothing here is final until you sign off; mark any line you'd change.`,
    "", "How to read it: **day · title** — today's word / the line people carry. Then the writer's notes, then the sources.", ""];
  for (const r of rows.sort((a, b) => a.day - b.day)) {
    md.push(`## Day ${r.day} · ${r.title}`, `Word: **${r.word}** · Line: *${r.carry}*`, "");
    for (const n of r.notes) md.push(`- ${n}`);
    const src = r.sources.map((x) => (typeof x === "string" ? x : x.ref || x.cite || x.title || JSON.stringify(x)));
    if (src.length) md.push("", `Sources: ${src.join("; ")}`);
    md.push("");
  }
  fs.writeFileSync(`${root}docs/review/${door.toUpperCase()}.md`, md.join("\n"));
  console.log(door, rows.length, "lessons");
}
