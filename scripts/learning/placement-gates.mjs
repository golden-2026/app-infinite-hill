// Placement gates: fake test-takers against the real "where are you?" check (docs/learning/QUESTION_RULES.md §9).
// Runs the app's own climb (apps/app/src/lib/placement.ts) over the app's own question bank (content/placement.ts),
// thousands of times per door, with simulated learners, and says per door whether each gate passes.
//
//   node scripts/learning/placement-gates.mjs [--runs 4000] [--door HINDUISM] [--report docs/learning/placement-gates.md]
//
// Learners: a total beginner ("not sure" every time), a random guesser, someone who always picks the longest option,
// someone who always taps the top option (the screen shuffles, so this should be random), someone who knows exactly
// stops 0..k and guesses above, and the same learner taking the check twice (restart via "back"). The expert-outsider
// gate needs blind-solver answers per item (QUESTION_RULES §7) and is reported as pending until the new bank has them.
// Loaded straight from the app's TypeScript (Node strips types), like tests/features/placement.test.mjs. Exit code 1 if
// any gate fails, so it can sit in CI once the new bank lands.
import fs from "node:fs";
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const src = `${root}apps/app/src/`;
const stub = (code) => `data:text/javascript,${encodeURIComponent(code)}`;
register(stub(`
const SRC = ${JSON.stringify(pathToFileURL(src).href)};
const CONTENT = ${JSON.stringify(pathToFileURL(`${root}packages/content/src/index.js`).href)};
const EXT = ["", ".ts", ".js", "/index.ts"];
export async function resolve(spec, ctx, next) {
  if (spec === "@ih/content") return { url: CONTENT, shortCircuit: true };
  let base = null;
  if (spec.startsWith("@/")) base = new URL(spec.slice(2), SRC).href;
  else if ((spec.startsWith("./") || spec.startsWith("../")) && ctx.parentURL?.startsWith(SRC)) base = new URL(spec, ctx.parentURL).href;
  if (base) { for (const e of EXT) { try { return await next(base + e, ctx); } catch {} } }
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (url.startsWith(SRC) && url.endsWith(".ts")) return next(url, { ...ctx, format: "module-typescript" });
  return next(url, ctx);
}`), import.meta.url);

const P = await import(pathToFileURL(`${src}lib/placement.ts`).href);
const C = await import(pathToFileURL(`${src}content/placement.ts`).href);
const { PLACEMENT_BANK } = await import(pathToFileURL(`${src}content/placement-bank.ts`).href);

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const RUNS = Number(arg("--runs", 4000));
const ONLY = arg("--door", null);
const REPORT = arg("--report", null);
const DOORS = ONLY ? [ONLY] : [...Object.keys(PLACEMENT_BANK), "SPIRITUAL"];

const rnd = (n) => Math.floor(Math.random() * n);
const shuffled = (xs) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** One pass through the check. `pick(q, shown, stopIndex)` returns the index (into q.o) the learner taps, or -1 for "not sure". */
function take(door, pick, seen = []) {
  const stops = C.placeStops(door, rnd(10000) + 1, seen);
  if (!stops.length) return null;
  const firsts = stops.map((s) => s.first);
  const answers = [];
  const asked = [];
  for (let guard = 0; guard < 40; guard++) {
    const climb = { stops: stops.length, answers, declined: false };
    const st = P.climbState(climb);
    if (st.done) return { ...P.placementResult(climb, firsts), asked, stops: stops.length };
    const q = stops[st.probe]?.qs[st.nth];
    if (!q) { answers.push({ stop: st.probe, ok: false }); continue; } // a stop with too few questions counts as a miss
    asked.push(q.q);
    const shown = shuffled(q.o.map((o, k) => ({ o, k }))); // the screen shuffles each question
    const chosen = pick(q, shown, st.probe);
    answers.push({ stop: st.probe, ok: chosen === q.a });
  }
  throw new Error("climb did not finish");
}

const LEARNERS = {
  beginner: () => () => -1,
  random: () => (q) => rnd(q.o.length),
  longest: () => (q) => { const L = q.o.map((o) => o.length); const m = Math.max(...L); const idx = L.map((l, i) => (l === m ? i : -1)).filter((i) => i >= 0); return idx[rnd(idx.length)]; },
  topOption: () => (q, shown) => shown[0].k,
  knows: (k) => (q, shown, stop) => (stop <= k ? q.a : rnd(q.o.length)),
};

function rate(door, make, test) {
  let hit = 0, n = 0;
  for (let r = 0; r < RUNS; r++) { const res = take(door, make()); if (!res) return null; n++; if (test(res)) hit++; }
  return hit / n;
}

const pct = (x) => (x === null ? "n/a" : `${Math.round(x * 100)}%`);
const rows = [];
let failed = 0;
for (const door of DOORS) {
  const probe = take(door, LEARNERS.random());
  if (!probe) { rows.push({ door, gate: "has placement questions", result: "none", pass: false }); failed++; continue; }
  const S = probe.stops;
  const day1 = (res) => res.start === 1;
  const g = [];
  const beg = rate(door, LEARNERS.beginner, day1);
  g.push(["total beginner starts at day 1", pct(beg), beg >= 0.9]);
  const ran = rate(door, LEARNERS.random, day1);
  const ranLow = rate(door, LEARNERS.random, (res) => res.stop <= 1);
  g.push(["random guesser starts at day 1", pct(ran), ran >= 0.9]);
  g.push(["random guesser never past camp 2", pct(ranLow), ranLow >= 0.999]);
  const lon = rate(door, LEARNERS.longest, (res) => !day1(res));
  g.push(["longest-answer picker skips ahead (should match random)", `${pct(lon)} vs ${pct(1 - ran)}`, lon <= (1 - ran) + 0.03]);
  const top = rate(door, LEARNERS.topOption, (res) => !day1(res));
  g.push(["top-option tapper skips ahead (should match random)", `${pct(top)} vs ${pct(1 - ran)}`, top <= (1 - ran) + 0.03]);
  // knows exactly stops 0..k: placed at k or k-1
  const ks = [...new Set([1, Math.floor(S / 3), Math.floor((2 * S) / 3), S - 1])].filter((k) => k >= 1);
  for (const k of ks) {
    const ok = rate(door, () => LEARNERS.knows(k), (res) => res.stop === k || res.stop === k - 1);
    g.push([`knows stops 1–${k + 1} of ${S}: placed there or one below`, pct(ok), ok >= 0.9]);
  }
  // test-retest: same learner twice, the second after "back" (seen items pushed to the back)
  let near = 0, repeats = 0, n2 = 0;
  for (let r = 0; r < Math.min(RUNS, 2000); r++) {
    const k = 1 + rnd(S - 1);
    const a = take(door, LEARNERS.knows(k));
    const b = take(door, LEARNERS.knows(k), a.asked);
    n2++;
    if (Math.abs(a.stop - b.stop) <= 1) near++;
    if (b.asked.some((q) => a.asked.includes(q))) repeats++;
  }
  g.push(["takes it twice: lands within one stop", pct(near / n2), near / n2 >= 0.9]);
  g.push(["takes it twice: sees no question again", `${pct(1 - repeats / n2)} of retakes`, repeats === 0]);
  g.push(["expert outsider placed within one stop", "pending: needs blind-solve answers (rules §7)", null]);
  for (const [gate, result, pass] of g) { rows.push({ door, gate, result, pass }); if (pass === false) failed++; }
}

const mark = (p) => (p === null ? "…" : p ? "pass" : "FAIL");
const lines = [];
let last = null;
for (const r of rows) {
  if (r.door !== last) { lines.push(`\n${r.door}`); last = r.door; }
  lines.push(`  ${mark(r.pass).padEnd(5)} ${r.gate}: ${r.result}`);
}
console.log(lines.join("\n"));
console.log(`\n${failed} gate(s) failed, ${RUNS} runs per learner per door.`);

if (REPORT) {
  const doors = [...new Set(rows.map((r) => r.door))];
  const gates = [...new Set(rows.map((r) => r.gate))];
  const md = [
    `# Placement gates report`,
    ``,
    `Generated by \`scripts/learning/placement-gates.mjs\` (${RUNS} simulated runs per learner per door) against the bank`,
    `the app ships today. Gates are defined in \`docs/learning/QUESTION_RULES.md\` §9. "…" = not measurable yet.`,
    ``,
    `| gate | ${doors.join(" | ")} |`,
    `|---|${doors.map(() => "---").join("|")}|`,
    ...gates.map((gt) => `| ${gt} | ${doors.map((d) => { const r = rows.find((x) => x.door === d && x.gate === gt); return r ? `${mark(r.pass)} ${r.result}` : "—"; }).join(" | ")} |`),
    ``,
    `${failed} gate(s) failed.`,
    ``,
  ].join("\n");
  fs.writeFileSync(REPORT, md);
  console.log(`report -> ${REPORT}`);
}
process.exitCode = failed ? 1 : 0;
