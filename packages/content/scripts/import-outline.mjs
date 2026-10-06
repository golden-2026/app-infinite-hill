// Turns the owner's Hinduism curriculum plan (docs/curriculum/*.md) into generated/outline-hinduism.js:
// one entry per session from day 22 on. Year one and year two are planned session by session; years three to
// five are planned week by week, so each block's topics are spread across its days.
//   node packages/content/scripts/import-outline.mjs
// These are OUTLINES (title, hook, practice, carry) — the full scripts come after Keeper review.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");
const read = (f) => readFileSync(join(root, "docs", "curriculum", f), "utf8").replace(/\r/g, "");

const clean = (s) => s.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
const unstar = (s) => s.replace(/^\*|\*$/g, "").trim();
const sessions = new Map(); // day -> session
const add = (day, s) => { if (!sessions.has(day)) sessions.set(day, { day, ...s }); };

// A numbered session line, in either of the plan's two styles:
//   22. **The boy at the door** · — · Parvati makes a son… · sit: guarding your own door · *some things need a guard*
//   157. The armies; the conch shells (1.1–1.19) · *the field*
function parseLine(text) {
  const parts = text.split(" · ").map((p) => p.trim());
  const carryPart = parts.length > 1 && /^\*.*\*$/.test(parts[parts.length - 1]) ? unstar(parts.pop()) : null;
  if (/^\*\*/.test(parts[0])) {
    const [title, word, hook, practice] = parts;
    return { title: clean(title), word: word && word !== "—" ? clean(word) : null, hook: hook ? clean(hook) : null, practice: practice ? clean(practice) : null, carry: carryPart };
  }
  const title = clean(parts.join(" · "));
  return { title, word: null, hook: null, practice: null, carry: carryPart };
}

// Spread a list of topics evenly over days from..to (used for bullet ranges and the weekly tables).
function spread(from, to, topics, base) {
  const count = to - from + 1;
  for (let k = 0; k < count; k++) {
    const topic = topics[Math.floor((k * topics.length) / count)] || base.part;
    add(from + k, { ...base, title: topic, word: null, hook: null, practice: null, carry: null });
  }
}
const topicsOf = (s) => s.split(/ · |; /).map(clean).filter(Boolean);
// Festival sessions: each gets its own title, word, story line, practice and carry (DRAFT outline, Keeper review
// pending), so a buffer day never reads as a placeholder like "festival session: Holi".
const FESTIVALS = [
  { title: "Janmashtami: the night Krishna was born", word: "Janmashtami", hook: "a prison at midnight, a river that parts, and a baby carried across it to safety", practice: "sit in the dark a moment and wait for something good", carry: "the good arrives at midnight" },
  { title: "Ganesh Chaturthi: welcoming Ganesha home", word: "Ganesh Chaturthi", hook: "clay Ganeshas are carried home with drums, kept for days, then given back to the water", practice: "hold something you love, then set it down gently", carry: "welcome it, then let it go" },
  { title: "Navaratri: nine nights of the Goddess", word: "Navaratri", hook: "Durga meets the buffalo demon; nine nights of dancing, and on the tenth day the good wins", practice: "name one small thing you won't let win tonight", carry: "nine nights, then the dawn" },
  { title: "Diwali: the row of lamps", word: "Diwali", hook: "Rama comes home after fourteen years, and a whole city lights lamps to show him the way", practice: "light one light and think of who you'd guide home", carry: "light the way home" },
  { title: "Holi: the festival of colors", word: "Holi", hook: "Prahlad walks out of the fire unharmed; the next morning everyone throws color and nobody is a stranger", practice: "let go of one small grudge today", carry: "everyone's the same color today" },
  { title: "Maha Shivaratri: the great night of Shiva", word: "Shivaratri", hook: "a night kept awake, water poured over the lingam, Om Namah Shivaya until dawn", practice: "stay with your breath three breaths longer than you want to", carry: "stay awake for what matters" },
  { title: "Raksha Bandhan: the thread of protection", word: "rakhi", hook: "a sister ties a thread on her brother's wrist, and he promises to look after her", practice: "name one person you'd protect, and tell them", carry: "a thread can hold a promise" },
];
const festival = (k) => ({ ...FESTIVALS[k % FESTIVALS.length], festival: true });

function parseNumbered(md, year) {
  let camp = null, part = null, sub = null;
  for (const line of md.split("\n")) {
    const h1 = line.match(/^# (.+)$/); if (h1) { camp = clean(h1[1]); part = sub = null; continue; }
    const h2 = line.match(/^## (.+)$/); if (h2) { part = clean(h2[1]); sub = null; continue; }
    const h3 = line.match(/^### (.+)$/); if (h3) { sub = clean(h3[1]); continue; }
    // "*Days 78–96: **the festival buffer** — …*": sessions that fire on the festival calendar
    const buf = line.match(/^\*Days (\d+)[–-](\d+): \*\*the festival buffer\*\*/i);
    if (buf) {
      const [from, to] = [Number(buf[1]), Number(buf[2])];
      for (let d = from; d <= to; d++) add(d, { year, camp, part: "Festival buffer — fires when the festival's date arrives", ...festival(d - from) });
      continue;
    }
    // "*Calendar-fired when possible; otherwise taught in sequence:* Diwali (…) · Holi (…) · … · **Camp 3 close** (156): …"
    if (/^\*Calendar-fired/i.test(line)) {
      const r = (part || "").match(/\((\d+)[–-](\d+)\)/);
      if (r) {
        const items = line.replace(/^\*[^*]+\*\s*/, "").split(" · ").map(clean);
        const close = items.findIndex((t) => /close/i.test(t));
        const last = Number(r[2]);
        spread(Number(r[1]), close >= 0 ? last - 1 : last, items.filter((_, k) => k !== close), { year, camp, part, festival: true });
        if (close >= 0) add(last, { year, camp, part, title: items[close].replace(/\s*\(\d+\):.*$/, ""), word: null, hook: items[close].replace(/^.*?:\s*/, ""), practice: null, carry: null });
      }
      continue;
    }
    // "- Festival sessions fire on the calendar all year (~20); this block holds …" (year two, Block D)
    if (/^- Festival sessions fire on the calendar/i.test(line)) {
      const r = (part || "").match(/Days (\d+)[–-](\d+)/);
      if (r) for (let d = Number(r[1]); d <= Number(r[1]) + 19; d++) add(d, { year, camp, part, ...festival(d - Number(r[1])) });
      continue;
    }
    // "- **Bala Kanda** (490–513, 24 sessions): topic; topic; …"  (also "… (604–633, 30 sessions) — *read whole*: …")
    const range = line.match(/^- \*\*(.+?)\*\*[^(]*\((\d+)[–-](\d+)[^)]*\)[^:]*:\s*(.+)$/);
    if (range) {
      spread(Number(range[2]), Number(range[3]), topicsOf(range[4]), { year, camp, part: `${part} · ${clean(range[1])}` });
      continue;
    }
    // "- 690–696. **Lineage track, year two** (7 sessions): …" and "- 696. **Year two close** · *…*"
    const bullet = line.match(/^- (\d+)(?:[–-](\d+))?\.\s+(.+)$/);
    if (bullet) {
      const from = Number(bullet[1]), to = Number(bullet[2] || bullet[1]);
      const text = bullet[3];
      const colon = text.match(/^\*\*(.+?)\*\*[^:]*:\s*(.+)$/);
      if (colon && to > from) spread(from, to, topicsOf(colon[2]), { year, camp, part: `${part} · ${clean(colon[1])}` });
      else { sessions.delete(from); add(from, { year, camp, part, ...parseLine(text) }); }
      continue;
    }
    const m = line.match(/^(\d+)(?:[–-](\d+))?\.\s+(.+)$/);
    if (!m) continue;
    const from = Number(m[1]), to = Number(m[2] || m[1]);
    if (from < 22 || /^Open for the Keeper/i.test(part || "")) continue; // skip the Keeper's open-questions list
    const s = parseLine(m[3]);
    for (let d = from; d <= to; d++) add(d, { year, camp, part: sub ? `${part} · ${sub}` : part, ...s, ...(to > from ? { title: `${s.title} (${d - from + 1} of ${to - from + 1})` } : {}) });
  }
}

// Years 3–5: | Weeks | Block | Content | tables. Topics are the content split on " · "; spread over 7 days a week.
function parseWeekly(md) {
  const years = [...md.matchAll(/^# YEAR (THREE|FOUR|FIVE)[^\n]*\n([\s\S]*?)(?=^# |$(?![\s\S]))/gm)];
  const n = { THREE: 3, FOUR: 4, FIVE: 5 };
  for (const [, word, body] of years) {
    const year = n[word];
    const yearStart = 332 + 365 * (year - 2); // year 2 starts at day 332
    const heading = clean(body.split("\n")[0] ? `Year ${year}` : `Year ${year}`);
    for (const row of body.split("\n").filter((l) => /^\|\s*\d/.test(l))) {
      const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length < 3) continue;
      const [weeks, blockRaw, content] = cells;
      const [w1, w2 = w1] = weeks.split(/[–-]/).map(Number);
      const block = clean(blockRaw).replace(/\s*\(\d+[^)]*\)\s*$/, "");
      const firstDay = yearStart + (w1 - 1) * 7;
      const count = (w2 - w1 + 1) * 7;
      // finer topics when the block lists them with commas ("the birth, the crossing of the Yamuna, Putana, …")
      let topics = topicsOf(content);
      if (topics.length < count / 3) topics = topics.flatMap((t) => (t.length > 60 ? t.split(/, (?![^(]*\))/).map(clean) : [t]));
      spread(firstDay, firstDay + count - 1, topics, { year, camp: `Year ${year}`, part: block, weekly: true });
    }
    void heading;
  }
}

// Year one's lineage track (302–322): the person picks karma, bhakti or jnana; each day shows the three side by side.
function parseTracks(md) {
  const sec = md.match(/^## (Weeks [^\n]*Lineage track \((\d+)[–-](\d+)\)[^\n]*)\n([\s\S]*?)(?=^## )/m);
  if (!sec) return;
  const [, heading, a, b, body] = sec;
  const from = Number(a), to = Number(b), count = to - from + 1;
  const tracks = [...body.matchAll(/^- \*\*(\w+) track:\*\*\s*(.+)$/gm)].map(([, name, list]) => [name.toLowerCase(), topicsOf(list)]);
  for (let k = 0; k < count; k++) {
    const title = tracks.map(([name, t]) => `${name}: ${t[Math.floor((k * t.length) / count)]}`).join(" · ");
    add(from + k, { year: 1, camp: "CAMP 5 · THE DEPTHS", part: clean(heading), title, word: null, hook: "you pick one track: karma (action), bhakti (devotion) or jnana (knowledge)", practice: null, carry: null });
  }
}

parseNumbered(read("golden_hinduism_year1_camps2-5.md"), 1);
parseTracks(read("golden_hinduism_year1_camps2-5.md"));
parseNumbered(read("golden_hinduism_years2-5.md"), 2);
parseWeekly(read("golden_hinduism_years2-5.md"));

// The weekly tables cover 52 weeks (364 days); a year's 365th day becomes its close.
const lastDay = Math.max(...sessions.keys());
for (let d = 23; d <= lastDay; d++) {
  const prev = sessions.get(d - 1);
  if (!sessions.has(d) && prev) add(d, { ...prev, title: `${prev.camp}: year close`, hook: "the summit sit — look back over the year", practice: null, carry: null, weekly: false });
}

// index fixes: a day's word or carry corrected over the plan (docs/curriculum/index-fixes/hinduism.json, {day: {word, carry}})
const fixFile = join(root, "docs", "curriculum", "index-fixes", "hinduism.json");
if (existsSync(fixFile)) for (const [day, fix] of Object.entries(JSON.parse(readFileSync(fixFile, "utf8")))) { const s = sessions.get(Number(day)); if (s) Object.assign(s, fix); }
const list = [...sessions.values()].sort((a, b) => a.day - b.day);
const days = list.map((s) => s.day);
const gaps = [];
for (let d = 22; d <= days[days.length - 1]; d++) if (!sessions.has(d)) gaps.push(d);
const out = `// GENERATED by packages/content/scripts/import-outline.mjs from docs/curriculum/*.md — do not edit by hand.
// The owner's Hinduism plan, days 22 on: OUTLINES (title, hook, practice, carry), not scripts. Not Keeper-reviewed.
export default ${JSON.stringify({ door: "HINDUISM", status: "outline-draft", sessions: list })};
`;
writeFileSync(join(here, "..", "generated", "outline-hinduism.js"), out);
const byYear = list.reduce((a, s) => ((a[s.year] = (a[s.year] || 0) + 1), a), {});
console.log(`outline: ${list.length} sessions, days ${days[0]}–${days[days.length - 1]}, by year ${JSON.stringify(byYear)}, gaps ${gaps.length ? `${gaps.length} (${gaps.slice(0, 12).join(",")}${gaps.length > 12 ? "…" : ""})` : "none"}`);
