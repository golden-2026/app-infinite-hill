// Builds the adaptive "where are you?" question bank (apps/app/src/content/placement-bank.ts) from the written,
// format-checked lesson scripts (docs/curriculum/<door>/scripts/y<N>/day-NNNN.json). Nothing here is hand-written:
// every question is a lesson's own game item, with the answer the lesson itself marks right.
//
//   stops    where the check can place someone: the start of each year-one camp, then each of years two and three cut
//            into four stretches (snapped to the door's own outline sections, so a stretch starts where a block does).
//            Only stops whose first day is written and shipped (apps/app/public/lessons/manifest.json) are kept:
//            nobody is placed past the last written day, and scripts still being written are never used.
//   per stop three questions, spread through the stretch (about a fifth, half and four fifths in):
//              fork   the lesson's "what happens next?" story question (setup, three options, the right one)
//              word   one of the lesson's match pairs: the term, its meaning and two other meanings from that lesson
//            Knowledge only: forks that ask about feelings, opinions, "today's lesson" or what you would choose are
//            left out, and so is anything without a named person, text or place to anchor it.
//
//   node packages/content/scripts/build-placement.mjs [--out <file>] [--check]   (--check: report, write nothing)
// The lessons are DRAFT (Keeper review pending), so the bank is too: it says so in its header.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { checkScript } from "../src/lesson-script.js";
import { OUTLINES, YEAR_ONE, data, lessonInfo } from "../src/index.js";
import { ROOT, listScripts } from "./lesson-files.mjs";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const OUT = arg("--out") || join(ROOT, "apps", "app", "src", "content", "placement-bank.ts");
const check = process.argv.includes("--check");
// what the app actually ships (build-lessons.mjs): the placement never reaches past it
const MANIFEST = arg("--manifest") || join(ROOT, "apps", "app", "public", "lessons", "manifest.json");

export const PLACE_DOORS = ["HINDUISM", "ISLAM", "JUDAISM", "BUDDHISM", "SIKHISM", "CATHOLIC", "CHRISTIANITY"];
const PER_STOP = 3;
const SPREAD = [0.2, 0.5, 0.8];
const KINDS = ["fork", "word", "fork"];

// ── knowledge only ──────────────────────────────────────────────────────────────────────────────────────────────
// Feelings, opinions, advice, "today's lesson", what you'd pick for yourself: not a fact the lesson taught.
const NOT_KNOWLEDGE = /\b(feel|feeling|felt|think|believe|should|ought|would you|you'd|today|yesterday|tomorrow|this lesson|this block|this week|a friend|your friend|your own|favorite|favourite|prefer|suggest|best way|which would|what would|how would|worth|fair|right thing)\b/i;
const ASKS = /\b(what|which|who|where|when|how many|how long)\b/i;
// a named person, text, place or rite (a capital letter after the first word), so the question stands on its own
const NAMED = /\s[A-Z][a-zA-Z'’-]{2,}/;
const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();

// No giveaway by length: the right answer may not stand out as the long, careful one ("name your fear, check your
// heart, then ask about Rama." against "trust him at once."). Too long next to the longest wrong option, and the
// question is skipped for the next one in that stretch. The lesson text itself is never changed.
export const LONGER_BY = 1.6; // right answer at most 1.6x the longest wrong one…
export const LONGER_CHARS = 20; // …and at most 20 characters longer
export function evenLengths(o, a) {
  const right = o[a].length;
  const longestWrong = Math.max(...o.filter((_, i) => i !== a).map((x) => x.length));
  return right <= LONGER_BY * longestWrong && right - longestWrong <= LONGER_CHARS;
}

function forkQ(s) {
  const f = s.games?.fork;
  if (!f || !Array.isArray(f.options) || f.options.length !== 3 || !Number.isInteger(f.answer) || f.answer < 0 || f.answer > 2) return null;
  const q = clean(f.setup);
  const o = f.options.map(clean);
  if (!q || q.length > 230 || !ASKS.test(q) || !NAMED.test(` ${q}`) || NOT_KNOWLEDGE.test(q)) return null;
  if (new Set(o.map((x) => x.toLowerCase())).size !== 3 || o.some((x) => !x || x.length > 110)) return null;
  if (!evenLengths(o, f.answer)) return null;
  return { kind: "fork", q, o, a: f.answer };
}

// A match pair's left side makes a question on its own only when it's a name or a tradition's own word ("abhyasa",
// "Karva Chauth"), not an English phrase lifted from the day's story ("the peak", "if only", "verse forty-four").
const PLAIN_ENGLISH = /\b(the|a|an|of|and|or|if|only|to|in|on|at|by|for|with|from|is|was|be|after|before|beyond|why|how|thee|thou|going|learning|evil|good|love|peace|mercy|justice|truth|light|dark|darkness|king|god|lord|death|life|water|fire|earth|house|son|daughter|mother|father|bread|wine|prayer|song|word|name|heart|mind|soul|body|way|path|law|sin|grace|faith|hope|verse|verses|day|days|night|one|two|three|four|five|six|seven|eight|nine|ten|twelve|forty|fifty|hundred|thousand|first|last)\b|\d/i;
const POSSESSIVE_PHRASE = /['’]s [a-z]/; // "Ravana's dead", "David's widow": a line from the story, not a name
// Words the lessons of four or more doors all use are English, not a tradition's own word ("patience", "west", "hail").
const english = new Set();
const EVERYDAY = 4;
function learnEnglish(byDoor) {
  const seen = new Map();
  for (const [door, scripts] of byDoor) {
    for (const s of scripts.values()) for (const g of s.segments || []) {
      for (const w of String(g.voice || "").toLowerCase().match(/[a-z']+/g) || []) { if (!seen.has(w)) seen.set(w, new Set()); seen.get(w).add(door); }
    }
  }
  english.clear();
  for (const [w, doors] of seen) if (doors.size >= EVERYDAY) english.add(w);
}
const plain = (term) => PLAIN_ENGLISH.test(term) || /ing$/i.test(term) || term.toLowerCase().split(/[^a-z']+/).some((w) => english.has(w));
const standsAlone = (term) => !POSSESSIVE_PHRASE.test(term) && (/^[A-Z]/.test(term) ? !/^(Why|How|What|After|Before)\b/.test(term) : !plain(term) && term.split(/\s+/).length <= 3);

function wordQ(s, salt) {
  const pairs = (s.games?.match?.pairs || []).filter((p) => Array.isArray(p) && p.length === 2).map(([l, r]) => [clean(l), clean(r)]);
  const ok = pairs.filter(([l, r]) => l && r && l.length <= 40 && r.length <= 80 && standsAlone(l) && !r.toLowerCase().includes(l.toLowerCase()));
  if (ok.length < 1 || pairs.length < 3) return null;
  // each usable pair in turn (starting from a different one per day), the first whose options are fair
  for (let k = 0; k < ok.length; k++) {
    const [term, answer] = ok[(salt + k) % ok.length];
    // the other meanings are the wrong options; one that names the term itself would make two answers look right
    const others = pairs.map(([, r]) => r).filter((r) => r && r !== answer && r.length <= 80 && !r.toLowerCase().includes(term.toLowerCase()));
    const o = [answer, ...[...new Set(others)].slice(0, 2)];
    if (o.length !== 3 || new Set(o.map((x) => x.toLowerCase())).size !== 3 || NOT_KNOWLEDGE.test(term) || !evenLengths(o, 0)) continue;
    return { kind: "word", term, o, a: 0 };
  }
  return null;
}

// ── where the check can place someone ───────────────────────────────────────────────────────────────────────────
/** An outline section's name, e.g. "Block B · The Yoga Sutras … · Sadhana Pada (2.1–2.55 · 18 sessions)" → "Sadhana Pada". */
function sectionName(part) {
  const bits = String(part || "").replace(/\s*\([^)]*\)/g, "").split(/\s+·\s+/).map((x) => x.replace(/\s+—\s+.*$/, "").trim()).filter((x) => x && !/^Block [A-Z]$/i.test(x) && !/^Weeks? \d/i.test(x));
  // the block's own name ("The Yoga Sutras of Patanjali"), unless it's only a number ("Surah 9"): then the inner name
  return (/^(Surah|Part|Chapter|Ch)\s*\d+$/i.test(bits[0] || "") ? bits.at(-1) : bits[0]) || "";
}
/** A stretch is named for the section that fills most of its days. */
function stretchName(door, first, last) {
  const count = new Map();
  for (let d = first; d <= last; d++) { const n = sectionName(OUTLINES[door]?.get(d)?.part); if (n) count.set(n, (count.get(n) || 0) + 1); }
  return [...count].sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function yearStops(door, year, lastWritten) {
  const first = YEAR_ONE + 1 + (year - 2) * 365;
  const last = first + 364;
  const outline = OUTLINES[door];
  const key = (d) => String(outline?.get(d)?.part || "").replace(/\s*\([^)]*\)/g, "");
  const bounds = [];
  for (let d = first + 1; d <= last; d++) if (key(d) && key(d) !== key(d - 1)) bounds.push(d);
  const starts = [first];
  for (const k of [1, 2, 3]) {
    const target = first + Math.round((k * 365) / 4);
    const near = bounds.filter((b) => Math.abs(b - target) <= 30 && b - starts.at(-1) >= 45 && last - b >= 45).sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0];
    starts.push(near ?? target);
  }
  return starts.map((s, i) => {
    const end = i < 3 ? starts[i + 1] - 1 : last;
    return { first: s, last: end, camp: `Year ${year}`, name: stretchName(door, s, end) || clean(lessonInfo(door, s)?.title).slice(0, 48) || `year ${year}` };
  }).filter((st) => st.first <= lastWritten);
}

export function stopsFor(door, lastWritten) {
  let acc = 0;
  const camps = data.CAMPS.map(([camp, name, len]) => { const st = { first: acc + 1, last: acc + len, camp, name }; acc += len; return st; });
  const years = [];
  for (let y = 2; YEAR_ONE + 1 + (y - 2) * 365 <= lastWritten; y++) years.push(...yearStops(door, y, lastWritten));
  return [...camps, ...years];
}

// ── the bank ────────────────────────────────────────────────────────────────────────────────────────────────────
export function buildBank({ log = console.log } = {}) {
  const valid = new Map(); // door → Map(day → script)
  for (const f of listScripts({ doors: PLACE_DOORS })) {
    if (!f.script || f.wrongYear) continue;
    const info = lessonInfo(f.door, f.day);
    const r = checkScript(f.script, { index: info ? { title: info.title, word: info.word, carry: info.carry } : null, door: f.door, day: f.day });
    if (r.errors.length) continue;
    if (!valid.has(f.door)) valid.set(f.door, new Map());
    valid.get(f.door).set(f.day, f.script);
  }
  learnEnglish(valid);
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : null;
  const bank = {};
  for (const door of PLACE_DOORS) {
    const scripts = valid.get(door) || new Map();
    // the last day written AND shipped (the built lessons' manifest): scripts still being written never place anyone
    const shipped = manifest?.doors?.[door]?.days ?? 0;
    let lastWritten = 0;
    while (lastWritten < shipped && scripts.has(lastWritten + 1)) lastWritten++;
    const stops = [];
    for (const st of stopsFor(door, lastWritten)) {
      const end = Math.min(st.last, lastWritten);
      const used = new Set();
      const qs = [];
      SPREAD.forEach((f, i) => {
        const target = Math.round(st.first + f * (end - st.first));
        // nearest day to the target that gives this kind (else the other kind), never the same day twice
        for (const kind of [KINDS[i], KINDS[i] === "fork" ? "word" : "fork"]) {
          if (qs.length > i) break;
          for (let off = 0; off <= end - st.first; off++) {
            const hit = [target - off, target + off].find((d) => d >= st.first && d <= end && !used.has(d) && scripts.has(d) && (kind === "fork" ? forkQ(scripts.get(d)) : wordQ(scripts.get(d), d)));
            if (hit) { used.add(hit); qs.push({ day: hit, ...(kind === "fork" ? forkQ(scripts.get(hit)) : wordQ(scripts.get(hit), hit)) }); break; }
          }
        }
      });
      if (qs.length < PER_STOP) { log(`  ${door} ${st.camp} from day ${st.first}: only ${qs.length} questions, left out`); continue; }
      stops.push({ ...st, last: st.last, qs });
    }
    bank[door] = { lastWritten, stops };
    log(`${door}: written to day ${lastWritten}, ${stops.length} stops (${stops.map((s) => s.first).join(", ")})`);
  }
  return bank;
}

export function bankSource(bank) {
  return `// GENERATED by packages/content/scripts/build-placement.mjs from the lesson scripts. Do not edit by hand: change the
// lessons (docs/curriculum) or the script, then run it again.
// DRAFT — NOT KEEPER-REVIEWED: every question is a lesson's own game item, and the lessons are pending Keeper review
// (docs/CONTENT_RELEASE.md). The adaptive "where are you?" check (lib/placement.ts) climbs these stops.
//   stops   where someone can be placed: each year-one camp, then years two and three in four stretches each
//   qs      three knowledge questions per stop (fork: the lesson's story question; word: a match pair, "{term}" and
//           three meanings). \`a\` is the right option's index; the screen shuffles the order.

export const BANK_STATUS = "draft-unreviewed" as const;

export type BankQ = { day: number; kind: "fork"; q: string; o: string[]; a: number } | { day: number; kind: "word"; term: string; o: string[]; a: number };
export type BankStop = { first: number; last: number; camp: string; name: string; qs: BankQ[] };

export const PLACEMENT_BANK: Record<string, { lastWritten: number; stops: BankStop[] }> = {
${Object.entries(bank).map(([door, b]) => `  ${door}: { lastWritten: ${b.lastWritten}, stops: [\n${b.stops.map((st) => `    { first: ${st.first}, last: ${st.last}, camp: ${JSON.stringify(st.camp)}, name: ${JSON.stringify(st.name)}, qs: [\n${st.qs.map((q) => `      ${JSON.stringify(q)},`).join("\n")}\n    ] },`).join("\n")}\n  ] },`).join("\n")}
};
`;
}

if (/build-placement\.mjs$/.test(process.argv[1] || "")) {
  const bank = buildBank();
  if (check) console.log("(check only, nothing written)");
  else { writeFileSync(OUT, bankSource(bank)); console.log(`→ ${OUT}`); }
}
