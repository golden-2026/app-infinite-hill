// After a path's first camp is reordered (docs/learning/week1), lessons after day 21 that cite a camp-one day by number
// ("on day fourteen, arti was…") must follow the move. The map lives in docs/learning/week1/<DOOR>.json as
// "moved": { "<old day>": <new day>, … } (days that didn't move can be left out; a cut day maps to null and is only
// reported). Rewrites the number words in place, keeping the case; prints every change.
//   node scripts/learning/fix-day-refs.mjs DOOR [--dry]
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const DOOR = process.argv[2];
const dry = process.argv.includes("--dry");
const spec = JSON.parse(fs.readFileSync(`${root}docs/learning/week1/${DOOR}.json`, "utf8"));
const moved = spec.moved || {};
const W = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "twenty-one"];
const num = (w) => (/^\d+$/.test(w) ? +w : W.indexOf(w.toLowerCase()));
// only real citations: "on day nine", "remember day six", "back to day three" (never "day three of Diwali")
const re = new RegExp(String.raw`(?<=\b(?:[Oo]n|[Rr]emember|to|[Ss]ince|[Ff]rom) )([Dd]ay) (${W.slice(1).sort((a, b) => b.length - a.length).join("|")}|1[0-9]|2[01]|[1-9])\b(?![- ]?(?:one|two|three|four|five|six|seven|eight|nine|hundred|thousand|\d))`, "g");
let changes = 0;
const cut = [];
for (const y of ["y1", "y2", "y3"]) {
  const dir = `${root}docs/curriculum/${DOOR.toLowerCase()}/scripts/${y}`;
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    const day = +f.match(/\d+/)[0];
    if (day <= 21) continue;
    const path = `${dir}/${f}`;
    const raw = fs.readFileSync(path, "utf8");
    const s = JSON.parse(raw);
    let touched = false;
    for (const g of s.segments) {
      if (!g.voice) continue;
      g.voice = g.voice.replace(re, (m, d, w) => {
        const old = num(w);
        // "day one" usually means "the very first day" ("day one of this whole path"), so it is never rewritten
        if (old === 1 || !(String(old) in moved)) return m;
        const to = moved[String(old)];
        if (to === null) { cut.push(`${DOOR}:${day} ${g.type}: "${m}" points at a day that was cut`); return m; }
        if (to === old) return m;
        const word = /^\d+$/.test(w) ? String(to) : w[0] === w[0].toUpperCase() ? W[to][0].toUpperCase() + W[to].slice(1) : W[to];
        console.log(`${DOOR}:${day} ${g.type}: ${m} → ${d} ${word}`);
        changes++; touched = true;
        return `${d} ${word}`;
      });
    }
    if (touched && !dry) fs.writeFileSync(path, JSON.stringify(s, null, 2) + "\n");
  }
}
for (const c of cut) console.log("CHECK", c);
console.log(`${DOOR}: ${changes} citation${changes === 1 ? "" : "s"} ${dry ? "would change" : "changed"}, ${cut.length} to check by hand`);
