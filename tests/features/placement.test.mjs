// Placement: the "where are you?" check (apps/app/src/lib/placement.ts, content/placement.ts) and where it starts
// someone (@ih/domain deriveState with settings.placed). Loaded straight from the app's TypeScript (Node strips types).
import test from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const src = `${root}apps/app/src/`;
const stub = (code) => `data:text/javascript,${encodeURIComponent(code)}`;
const hooks = `
const SRC = ${JSON.stringify(pathToFileURL(src).href)};
const CONTENT = ${JSON.stringify(pathToFileURL(`${root}packages/content/src/index.js`).href)};
const EXT = ["", ".ts", ".js", "/index.ts"];
export async function resolve(spec, ctx, next) {
  if (spec === "@ih/content") return { url: CONTENT, shortCircuit: true };
  let base = null;
  if (spec.startsWith("@/")) base = new URL(spec.slice(2), SRC).href;
  else if ((spec.startsWith("./") || spec.startsWith("../")) && ctx.parentURL?.startsWith(SRC)) base = new URL(spec, ctx.parentURL).href;
  if (base) {
    for (const e of EXT) { try { return await next(base + e, ctx); } catch {} }
  }
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (url.startsWith(SRC) && url.endsWith(".ts")) return next(url, { ...ctx, format: "module-typescript" });
  return next(url, ctx);
}`;
register(stub(hooks), import.meta.url);

const P = await import(pathToFileURL(`${src}lib/placement.ts`).href);
const { advancedFor, ADVANCED_EN } = await import(pathToFileURL(`${src}content/placement.ts`).href);
const { PLACEMENT_ES } = await import(pathToFileURL(`${src}i18n/strings/onboarding-placement.ts`).href);
const { setLangState } = await import(pathToFileURL(`${src}i18n/core.ts`).href);
const { data, OUTLINES, camp1, pos } = await import(pathToFileURL(`${root}packages/content/src/index.js`).href);
const { deriveState, makeSit } = await import(pathToFileURL(`${root}packages/domain/src/index.js`).href);

const TRADITIONS = ["HINDUISM", "ISLAM", "JUDAISM", "BUDDHISM", "SIKHISM", "CATHOLIC", "CHRISTIANITY"];
const check = (o) => ({ connected: false, basics: [], advanced: [], basicsTotal: 8, advancedTotal: 6, ...o });
/** Plays the check to the end: answers come from the two lists, in order, for as long as the check keeps asking. */
function play(o, basicAnswers, advancedAnswers, { decline = false } = {}) {
  const c = check({ ...o, declined: decline });
  let guard = 0;
  for (let phase = P.nextPhase(c); phase !== "done" && guard++ < 40; phase = P.nextPhase(c)) {
    if (phase === "basics") c.basics.push(basicAnswers[c.basics.length]);
    else c.advanced.push(advancedAnswers[c.advanced.length]);
  }
  return { c, r: P.placementResult(c) };
}
const all = (n, v) => Array(n).fill(v);

test("camp one ends at day 21 on every door, so a skip starts at day 22, the first day of camp two", () => {
  assert.equal(P.campOneEnd(), 21);
  assert.equal(P.skipDay(), 22);
  assert.deepEqual(data.CAMPS[0].slice(0, 1), ["Camp 1"]);
  for (const d of TRADITIONS) {
    assert.equal(camp1(d).length, 21, `${d}: camp one has 21 days`);
    assert.ok(OUTLINES[d].get(22), `${d}: day 22 is planned`);
    assert.equal(pos(22).camp, "Camp 2", `${d}: day 22 opens camp two`);
    assert.equal(pos(22).lesson, 1);
  }
});

test("an expert at home in the tradition: four basics straight, then the harder ones; 6 of 6 offers the skip to day 22", () => {
  const { c, r } = play({ connected: true }, all(8, true), all(6, true));
  assert.equal(c.basics.length, 4, "fast-tracked after four straight");
  assert.equal(c.advanced.length, 6);
  assert.deepEqual([r.outcome, r.start, r.knowledge], ["skip", 22, 100]);
});

test("a beginner who gets everything wrong stops after four questions and starts at day 1, from the beginning", () => {
  const { c, r } = play({}, all(8, false), []);
  assert.equal(c.basics.length, P.BASICS_STOP_AFTER);
  assert.equal(c.advanced.length, 0);
  assert.deepEqual([r.outcome, r.start, r.knowledge], ["new", 1, 0]);
  // same for someone who grew up in it but doesn't know these yet
  assert.deepEqual(play({ connected: true }, all(8, false), []).r.outcome, "new");
});

test("expert and beginner no longer start in the same place", () => {
  assert.notEqual(play({ connected: true }, all(8, true), all(6, true)).r.start, play({}, all(8, false), []).r.start);
});

test("a mid score starts at day 1 at the deeper level; it never sees the harder questions", () => {
  const mid = play({}, [true, true, false, true, true, false, true, false], []);
  assert.equal(mid.c.advanced.length, 0);
  assert.deepEqual([mid.r.outcome, mid.r.start], ["some", 1]);
  const six = play({}, [true, true, true, false, true, true, true, false], []);
  assert.deepEqual([six.r.outcome, six.r.start, six.r.knowledge], ["deep", 1, 75]);
});

test("7 of 8 basics earns the harder questions for anyone; declining them starts at day 1, deep", () => {
  const basics = [true, true, true, true, true, true, false, true];
  assert.equal(P.nextPhase(check({ basics })), "advanced");
  const no = play({}, basics, [], { decline: true });
  assert.deepEqual([no.r.outcome, no.r.start, no.c.advanced.length], ["deep", 1, 0]);
});

test("the harder questions stop after three misses; under four right is no skip", () => {
  const { c, r } = play({ connected: true }, all(8, true), [true, false, true, false, false, true]);
  assert.equal(c.advanced.length, 5, "stopped on the third miss");
  assert.equal(r.outcome, "deep");
  assert.equal(r.start, 1);
  const four = play({ connected: true }, all(8, true), [true, false, true, true, false, true]);
  assert.deepEqual([four.r.outcome, four.r.start], ["skip", 22]);
  assert.ok(four.r.knowledge >= 75);
});

test("falling short on the harder ones: the tally is shown and 'skip to day 22 anyway' is offered, at the score they earned", () => {
  const short = play({ connected: true }, all(8, true), [true, false, true, false, true, false]);
  assert.deepEqual([short.r.outcome, short.r.start, short.r.asked, short.r.got, short.r.skipAnyway], ["deep", 1, 6, 3, true]);
  const anyway = P.skipAnyway(short.c);
  assert.deepEqual(anyway, { knowledge: short.r.knowledge, start: 22 }, "same start as a pass, knowledge not raised");
  assert.deepEqual(P.withStart(undefined, "ISLAM", anyway.start), { ISLAM: 22 }, "saved like a pass, so camp one is catch-up");
  // a pass doesn't offer it (it's already the primary choice), and nobody who never took the harder ones sees it
  const pass = play({ connected: true }, all(8, true), [true, true, true, true, false, false]);
  assert.deepEqual([pass.r.outcome, pass.r.got, pass.r.skipAnyway], ["skip", 4, false]);
  const declined = play({}, [true, true, true, true, true, true, false, true], [], { decline: true });
  assert.deepEqual([declined.r.asked, declined.r.skipAnyway], [0, false]);
  assert.equal(play({}, all(8, false), []).r.skipAnyway, false);
});

test("a connected person who misses early gets the full basics, not the fast track", () => {
  const { c } = play({ connected: true }, [true, false, true, true, true, true, true, true], all(6, true));
  assert.equal(c.basics.length, 8);
  assert.equal(c.advanced.length, 6, "7 of 8 still earns the harder ones");
});

test("who counts as at home in a tradition (first step answers)", () => {
  assert.equal(P.atHome({ stance: "practice", raisedIn: "HINDUISM", learning: null }, "HINDUISM"), true);
  assert.equal(P.atHome({ stance: "practice", raisedIn: "CATHOLIC", learning: null }, "CHRISTIANITY"), true, "one family");
  assert.equal(P.atHome({ stance: "left", raisedIn: "ISLAM", learning: null }, "ISLAM"), true);
  assert.equal(P.atHome({ stance: "partner", raisedIn: null, learning: "JUDAISM" }, "JUDAISM"), true);
  assert.equal(P.atHome({ stance: "curious", raisedIn: "none", learning: null }, "ISLAM"), false);
  assert.equal(P.atHome({ stance: "practice", raisedIn: "SIKHISM", learning: null }, "HINDUISM"), false);
  assert.equal(P.atHome({ stance: null, raisedIn: null, learning: null }, "HINDUISM"), false);
});

test("withStart sets a skip and clears it on 'from the beginning'", () => {
  assert.deepEqual(P.withStart(undefined, "HINDUISM", 22), { HINDUISM: 22 });
  assert.deepEqual(P.withStart({ HINDUISM: 22, ISLAM: 22 }, "HINDUISM", 1), { ISLAM: 22 });
});

test("every tradition door has six harder questions: three distinct options, the right one first, a curriculum day, Spanish for each", () => {
  for (const d of TRADITIONS) {
    const qs = ADVANCED_EN[d];
    assert.equal(qs.length, 6, d);
    assert.equal(data.PLACEMENT[d].length, 8, `${d} basics`);
    for (const q of qs) {
      assert.equal(q.o.length, 3, q.q);
      assert.equal(new Set(q.o).size, 3, q.q);
      assert.equal(q.a, 0, q.q);
      assert.ok(Number.isInteger(q.day) && q.day >= 1 && q.day <= 331, `${q.q}: taught in year one`);
      assert.doesNotMatch(q.q, /\b(believe|should you|true faith)\b/i, "knowledge, never belief");
    }
    const es = PLACEMENT_ES[d];
    assert.equal(es.length, qs.length, `${d} Spanish`);
    es.forEach((x, i) => { assert.equal(x.o.length, 3, x.q); assert.equal(new Set(x.o).size, 3, x.q); assert.ok(x.q && x.q !== qs[i].q, `${d} ${i}: translated`); });
  }
  assert.deepEqual(ADVANCED_EN.SPIRITUAL, undefined, "my own path has no knowledge check");
});

test("the screen gets the questions in the current language", () => {
  setLangState("es");
  try {
    assert.equal(advancedFor("HINDUISM")[0].q, PLACEMENT_ES.HINDUISM[0].q);
    assert.equal(advancedFor("HINDUISM")[0].a, 0);
  } finally { setLangState("en"); }
  assert.equal(advancedFor("HINDUISM")[0].q, ADVANCED_EN.HINDUISM[0].q);
  assert.deepEqual(advancedFor("SPIRITUAL"), []);
});

test("starting at 22 works end to end: today's lesson, streak, catch-up days, and the next day", () => {
  let n = 0;
  const sit = (date, day) => makeSit({ id: `sit_${String(++n).padStart(6, "0")}`, door: "ISLAM", day, date, tz: "UTC", at: `${date}T12:00:00.000Z` });
  const settings = { placed: P.withStart({}, "ISLAM", P.skipDay()) };
  const s0 = deriveState([], { today: "2026-10-01", settings });
  assert.deepEqual([s0.paths.ISLAM.day, s0.paths.ISLAM.done, s0.streak.streak], [22, false, 0]);
  const log = [sit("2026-10-01", 22)];
  const s1 = deriveState(log, { today: "2026-10-01", settings });
  assert.deepEqual([s1.paths.ISLAM.day, s1.paths.ISLAM.done, s1.streak.streak, s1.showedUp], [22, true, 1, 1]);
  log.push(sit("2026-10-02", 4)); // a catch-up day: counts for the streak, doesn't move the door
  const s2 = deriveState(log, { today: "2026-10-02", settings });
  assert.deepEqual([s2.paths.ISLAM.day, s2.streak.streak], [23, 2]);
  assert.equal(deriveState(log, { today: "2026-10-03", settings }).paths.ISLAM.day, 23);
});
