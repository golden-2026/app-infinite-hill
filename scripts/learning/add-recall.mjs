// The new lesson recipe's "old words in the pairs" (games.recall), picked by machine: the two most recent earlier
// words (from a week or more back, so it's real review) whose own lesson gave a short meaning (games.guess[0]).
//   node scripts/learning/add-recall.mjs DOOR FROM TO
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const [DOOR, FROM, TO] = process.argv.slice(2);
const file = (d) => ["y1", "y2", "y3"].map((y) => `${root}docs/curriculum/${DOOR.toLowerCase()}/scripts/${y}/day-${String(d).padStart(4, "0")}.json`).find(fs.existsSync);
const read = (d) => { const f = file(d); return f ? JSON.parse(fs.readFileSync(f, "utf8")) : null; };
const wk = (() => { try { return JSON.parse(fs.readFileSync(`${root}docs/learning/week1/${DOOR}.json`, "utf8")); } catch { return null; } })();
// an earlier word's short meaning: its own guess, else week one's quiz (or day one's bet), else its own pair
const meaningOf = (o) => {
  if (Array.isArray(o.games?.guess)) return o.games.guess[0];
  if (wk && o.day === 1 && wk.bet?.answer) return wk.bet.answer;
  if (wk && wk.quiz?.[o.day]) return wk.quiz[o.day][0];
  const p = (o.games?.match?.pairs || []).find((x) => String(x[0]).toLowerCase() === String(o.word).toLowerCase());
  return p ? p[1] : null;
};
// a meaning that fits a pair tile (42 characters); a clipped clause must not end on a little word ("maps a")
const short = (m) => {
  const x = String(m).trim();
  if (x.length <= 42) return x;
  const y = x.split(/[,;:(]/)[0].trim();
  return y.length >= 10 && y.length <= 42 && !/(a|an|the|of|to|that|and|or|for|with|in|on|by|who|which)$/i.test(y) ? y : null;
};
// a real term, not a lesson's phrase-title ("The leap", "Ravana hears", "Fourteen years")
const isTerm = (w) => !/^[A-Z][a-z]+ [a-z]+$/.test(String(w)) && !/^(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|after|before)/i.test(String(w));
let prev = new Set(); // yesterday's old words: not again today, so the review keeps moving
for (let d = +FROM; d <= +TO; d++) {
  const f = file(d); if (!f) continue;
  const raw = fs.readFileSync(f, "utf8");
  const s = JSON.parse(raw);
  const today = new Set([s.word, ...(s.games.match?.pairs || []).map((p) => p[0])].map((w) => String(w).toLowerCase()));
  const picks = [];
  for (let e = d - 7; e >= 1 && picks.length < 2; e--) {
    const o = read(e);
    const raw0 = o ? meaningOf(o) : null;
    const m = raw0 ? short(raw0) : null;
    if (!m || !isTerm(o.word) || today.has(String(o.word).toLowerCase()) || prev.has(String(o.word).toLowerCase()) || picks.some((p) => p[0].toLowerCase() === String(o.word).toLowerCase())) continue;
    picks.push([o.word, m]);
  }
  if (!picks.length) { console.log(`${DOOR}:${d} no earlier words with a meaning`); continue; }
  s.games.recall = picks;
  prev = new Set(picks.map((p) => String(p[0]).toLowerCase()));
  const indent = /^\{\n( +)/.exec(raw)?.[1].length || 2;
  fs.writeFileSync(f, JSON.stringify(s, null, indent) + "\n");
  console.log(`${DOOR}:${d}`, JSON.stringify(picks));
}
