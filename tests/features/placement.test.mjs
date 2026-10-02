// Placement: the adaptive "where are you?" check (apps/app/src/lib/placement.ts), its question bank (content/placement.ts
// over the generated content/placement-bank.ts) and where it starts someone (@ih/domain deriveState with settings.placed).
// Loaded straight from the app's TypeScript (Node strips types).
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
const C = await import(pathToFileURL(`${src}content/placement.ts`).href);
const { PLACEMENT_BANK } = await import(pathToFileURL(`${src}content/placement-bank.ts`).href);
const { EN, ES } = await import(pathToFileURL(`${src}i18n/strings/index.ts`).href);
const { data, OUTLINES, camp1, pos } = await import(pathToFileURL(`${root}packages/content/src/index.js`).href);
const { deriveState, makeSit } = await import(pathToFileURL(`${root}packages/domain/src/index.js`).href);

const TRADITIONS = ["HINDUISM", "ISLAM", "JUDAISM", "BUDDHISM", "SIKHISM", "CATHOLIC", "CHRISTIANITY"];
const FIRSTS = C.stopFirsts("HINDUISM");

/** Plays the check: `knows(stop, nth)` says whether this person gets that question right. */
function play(firsts, knows, { decline = false } = {}) {
  const c = { stops: firsts.length, answers: [], declined: false };
  for (let guard = 0; guard < 60; guard++) {
    if (decline && P.atOffer(c)) c.declined = true;
    const s = P.climbState(c);
    if (s.done) break;
    c.answers.push({ stop: s.probe, ok: !!knows(s.probe, s.nth) });
  }
  const s = P.climbState(c);
  return { c, s, r: P.placementResult(c, firsts), probes: [...new Set(c.answers.map((a) => a.stop))] };
}
/** Someone who knows every stop up to `k` (and none above it). */
const upTo = (k) => (stop) => stop <= k;

test("camp one still ends at day 21, so the first skip is still day 22", () => {
  assert.equal(P.campOneEnd(), 21);
  assert.equal(P.skipDay(), 22);
  for (const d of TRADITIONS) {
    assert.equal(camp1(d).length, 21, `${d}: camp one has 21 days`);
    assert.ok(OUTLINES[d].get(22), `${d}: day 22 is planned`);
    assert.equal(pos(22).camp, "Camp 2");
  }
});

test("the bank: every tradition door has stops from day 1 through year three, each at a camp or stretch start, never past the last written day", () => {
  let acc = 0;
  const campStarts = data.CAMPS.map(([, , len]) => { const f = acc + 1; acc += len; return f; });
  for (const d of TRADITIONS) {
    const b = PLACEMENT_BANK[d];
    assert.ok(b, d);
    assert.ok(b.lastWritten >= 1061, `${d}: years one to three are written`);
    const firsts = b.stops.map((s) => s.first);
    assert.deepEqual(firsts.slice(0, 5), campStarts, `${d}: the five year-one camps`);
    assert.ok(firsts.some((f) => f > 331 && f <= 696) && firsts.some((f) => f >= 697), `${d}: stops in years two and three`);
    assert.ok(firsts.every((f, i) => i === 0 || f > firsts[i - 1]), `${d}: in order`);
    assert.ok(firsts.every((f) => f <= b.lastWritten), `${d}: never past the last written day`);
    for (const st of b.stops) {
      assert.ok(st.last >= st.first && st.name, `${d} ${st.first}`);
      assert.equal(st.qs.length, P.PER_STOP, `${d} ${st.first}: three questions`);
      for (const q of st.qs) {
        assert.ok(q.day >= st.first && q.day <= Math.min(st.last, b.lastWritten), `${d}: question from the stop's own lessons (day ${q.day})`);
        assert.equal(q.o.length, 3);
        assert.equal(new Set(q.o).size, 3, `${d} day ${q.day}: three different options`);
        assert.ok(Number.isInteger(q.a) && q.o[q.a], `${d} day ${q.day}: a right answer`);
        const text = q.kind === "fork" ? q.q : q.term;
        assert.ok(text, `${d} day ${q.day}`);
        assert.doesNotMatch(text, /\b(believe|should you|feel|true faith|would you)\b/i, `${d} day ${q.day}: knowledge, never belief`);
      }
    }
  }
  assert.equal(PLACEMENT_BANK.SPIRITUAL, undefined, "my own path has no knowledge check");
  assert.deepEqual(C.placeStops("SPIRITUAL"), []);
});

test("the bank's questions are the lessons' own: each one matches its day's script", async () => {
  const { readFileSync } = await import("node:fs");
  const file = (door, day) => `${root}docs/curriculum/${door.toLowerCase()}/scripts/y${day <= 331 ? 1 : 2 + Math.floor((day - 332) / 365)}/day-${String(day).padStart(4, "0")}.json`;
  for (const d of ["HINDUISM", "ISLAM", "CATHOLIC"]) {
    for (const st of PLACEMENT_BANK[d].stops.filter((_, i) => i % 3 === 1)) {
      const q = st.qs[0];
      const s = JSON.parse(readFileSync(file(d, q.day), "utf8"));
      if (q.kind === "fork") { assert.equal(q.q, s.games.fork.setup.replace(/\s+/g, " ").trim()); assert.equal(q.o[q.a], s.games.fork.options[s.games.fork.answer].replace(/\s+/g, " ").trim()); }
      else assert.ok(s.games.match.pairs.some(([l, r]) => l.trim() === q.term && r.trim() === q.o[q.a]), `${d} ${q.day}`);
    }
  }
});

test("stop 0 is camp one's basics; the screen gets three of them, and the lessons' questions above", () => {
  const stops = C.placeStops("HINDUISM", 7);
  assert.equal(stops[0].first, 1);
  assert.equal(stops[0].qs.length, 3);
  assert.ok(stops[0].qs.every((q) => q.kind === "basic" && data.PLACEMENT.HINDUISM.some((b) => b.q === q.q)));
  assert.ok(stops.slice(1).every((s) => s.qs.every((q) => q.kind === "fork" || (q.kind === "word" && q.term))));
});

test("every level lands at the start of the highest stretch they know, in 14 questions or fewer", () => {
  for (const d of TRADITIONS) {
    const firsts = C.stopFirsts(d);
    for (let k = -1; k < firsts.length; k++) {
      const { r, c } = play(firsts, upTo(k));
      assert.ok(c.answers.length <= P.MAX_QUESTIONS, `${d} k=${k}: ${c.answers.length} questions`);
      assert.equal(r.start, k >= 1 ? firsts[k] : 1, `${d} k=${k}`);
      assert.equal(r.stop, k, `${d} k=${k}`);
    }
  }
});

test("a beginner stops after two misses and starts at day 1 from the very beginning", () => {
  const { r, c } = play(FIRSTS, () => false);
  assert.equal(c.answers.length, 2);
  assert.deepEqual([r.outcome, r.start, r.knowledge, r.anyway], ["new", 1, 0, null]);
});

test("the climb gallops up on what they know and halves back down on a miss", () => {
  // knows everything: basics, then camp two, a third of the way, two thirds, and the top; two questions each
  const top = play(FIRSTS, () => true);
  assert.deepEqual(top.probes, [0, 1, 4, 8, FIRSTS.length - 1]);
  assert.equal(top.c.answers.length, 10);
  assert.equal(top.r.start, FIRSTS.at(-1));
  // knows up to stop 5: gallops to 8, misses, halves down to 6, misses, then 5
  const mid = play(FIRSTS, upTo(5));
  assert.deepEqual(mid.probes, [0, 1, 4, 8, 6, 5]);
  assert.equal(mid.r.start, FIRSTS[5]);
});

test("one slip inside a stretch they know doesn't drop them (2 of 3), and one lucky guess above doesn't lift them", () => {
  // knows up to stop 2, but misses the first question of every probe
  const slip = play(FIRSTS, (stop, nth) => stop <= 2 && nth > 0);
  assert.equal(slip.r.start, FIRSTS[2]);
  assert.ok(slip.c.answers.length <= P.MAX_QUESTIONS);
  // slipping all the way up the path never runs past 14 questions, and never places them above what they know
  for (let k = 0; k < FIRSTS.length; k++) {
    const p = play(FIRSTS, (stop, nth) => stop <= k && nth > 0);
    assert.ok(p.c.answers.length <= P.MAX_QUESTIONS && p.r.stop <= k, `k=${k}`);
  }
  // knows up to stop 2, and guesses the first question above right every time
  const lucky = play(FIRSTS, (stop, nth) => stop <= 2 || nth === 0);
  assert.equal(lucky.r.start, FIRSTS[2]);
  assert.ok(lucky.c.answers.length <= P.MAX_QUESTIONS);
});

test("knowing the basics but not camp two starts at day 1, deeper, with day 22 offered anyway", () => {
  const { r } = play(FIRSTS, upTo(0));
  assert.deepEqual([r.outcome, r.start, r.knowledge, r.anyway], ["deep", 1, 100, 22]);
  // placed in year two: the next stretch was mixed, so "start at it anyway" is offered there too
  const y2 = play(FIRSTS, upTo(6));
  assert.equal(y2.r.outcome, "skip");
  assert.ok(y2.r.start > 331 && y2.r.start <= 696, "year two");
  assert.equal(y2.r.anyway, FIRSTS[7]);
  assert.ok(y2.r.knowledge >= 75, "placed past day 1 is the deep level");
});

test("after the basics the rest is offered, never sprung: 'no thanks' starts at day 1", () => {
  const c = { stops: FIRSTS.length, answers: [{ stop: 0, ok: true }, { stop: 0, ok: true }] };
  assert.equal(P.atOffer(c), true);
  assert.equal(P.atOffer({ ...c, answers: [...c.answers, { stop: 1, ok: true }] }), false);
  const no = play(FIRSTS, () => true, { decline: true });
  assert.equal(no.c.answers.length, 2);
  assert.deepEqual([no.r.outcome, no.r.start, no.r.anyway], ["deep", 1, null]);
});

test("missing the basics never shows the offer; the knowledge score keeps its old scale for lesson depth", () => {
  assert.equal(P.atOffer({ stops: 13, answers: [{ stop: 0, ok: false }, { stop: 0, ok: false }] }), false);
  const some = play(FIRSTS, (stop, nth) => stop === 0 && nth !== 1); // 2 of 3 basics, nothing above
  assert.equal(some.r.start, 1);
  assert.ok(some.r.knowledge >= 38 && some.r.knowledge < 75, `some: ${some.r.knowledge}`);
  assert.equal(some.r.outcome, "some");
});

test("who counts as at home in a tradition (first step answers)", () => {
  assert.equal(P.atHome({ stance: "practice", raisedIn: "HINDUISM", learning: null }, "HINDUISM"), true);
  assert.equal(P.atHome({ stance: "practice", raisedIn: "CATHOLIC", learning: null }, "CHRISTIANITY"), true, "one family");
  assert.equal(P.atHome({ stance: "partner", raisedIn: null, learning: "JUDAISM" }, "JUDAISM"), true);
  assert.equal(P.atHome({ stance: "curious", raisedIn: "none", learning: null }, "ISLAM"), false);
});

test("withStart sets a start past day 1 and clears it on 'from the beginning'; stopOf finds a day's stretch", () => {
  assert.deepEqual(P.withStart(undefined, "HINDUISM", 421), { HINDUISM: 421 });
  assert.deepEqual(P.withStart({ HINDUISM: 22, ISLAM: 22 }, "HINDUISM", 1), { ISLAM: 22 });
  assert.equal(P.stopOf(FIRSTS, 1), 0);
  assert.equal(P.stopOf(FIRSTS, 100), 2);
  assert.equal(P.stopOf(FIRSTS, 1061), FIRSTS.length - 1);
});

test("the trail's catch-up list: one stretch for day 22, every stretch below for a year-two start", () => {
  assert.deepEqual(C.stretchesBefore("ISLAM", 22).map((s) => [s.first, s.last]), [[1, 21]]);
  const y2 = C.stretchesBefore("ISLAM", C.stopFirsts("ISLAM")[6]);
  assert.equal(y2.length, 6);
  assert.deepEqual([y2[0].first, y2.at(-1).last], [1, C.stopFirsts("ISLAM")[6] - 1]);
  assert.deepEqual(C.stretchesBefore("ISLAM", 1), []);
});

test("every new placement and settling-in string has Spanish", () => {
  for (const k of ["onboarding.know.fits", "onboarding.know.step", "onboarding.know.placedHost", "onboarding.know.mixedHost", "onboarding.know.mixedNext", "home.settle.back", "home.settle.backGo", "home.settle.stay", "home.settle.ahead", "home.settle.aheadGo", "home.trail.catchUpAll", "home.trail.groupWalked"]) {
    assert.ok(EN[k] && ES[k] && EN[k] !== ES[k], k);
  }
  assert.match(EN["home.settle.back"], /leans on a few stories from \{camp\}/);
  for (const k of Object.keys(EN).filter((x) => x.startsWith("home.settle."))) assert.doesNotMatch(EN[k], /\b(fail|failed|wrong level|demot|too hard|behind)\b/i, k);
});

test("starting in year two works end to end: today's lesson, streak, catch-up days, and the next day", () => {
  let n = 0;
  const start = C.stopFirsts("ISLAM")[6];
  const sit = (date, day) => makeSit({ id: `sit_${String(++n).padStart(6, "0")}`, door: "ISLAM", day, date, tz: "UTC", at: `${date}T12:00:00.000Z` });
  const settings = { placed: P.withStart({}, "ISLAM", start) };
  const s0 = deriveState([], { today: "2026-10-01", settings });
  assert.deepEqual([s0.paths.ISLAM.day, s0.paths.ISLAM.done, s0.streak.streak], [start, false, 0]);
  const log = [sit("2026-10-01", start)];
  assert.deepEqual([deriveState(log, { today: "2026-10-01", settings }).paths.ISLAM.day, deriveState(log, { today: "2026-10-01", settings }).paths.ISLAM.done], [start, true]);
  log.push(sit("2026-10-02", 40)); // a catch-up day from camp two: counts for the streak, doesn't move the door
  const s2 = deriveState(log, { today: "2026-10-02", settings });
  assert.deepEqual([s2.paths.ISLAM.day, s2.streak.streak], [start + 1, 2]);
});

test("no giveaway by length: no right answer is more than 1.6x (or 20 characters) longer than the longest wrong one", () => {
  for (const d of TRADITIONS) {
    for (const st of PLACEMENT_BANK[d].stops) {
      for (const q of st.qs) {
        const right = q.o[q.a].length;
        const longestWrong = Math.max(...q.o.filter((_, i) => i !== q.a).map((x) => x.length));
        assert.ok(right <= 1.6 * longestWrong && right - longestWrong <= 20, `${d} day ${q.day}: "${q.o[q.a]}" vs ${longestWrong} chars`);
      }
    }
  }
});

test("the result is said warmly: no score, no counts, no failure words, in either language", () => {
  assert.equal(EN["onboarding.know.tally"], undefined);
  for (const k of ["onboarding.know.placedHost", "onboarding.know.mixedNext", "onboarding.know.mixedHost", "onboarding.know.deepHost", "onboarding.know.someHost", "onboarding.know.newHost"]) {
    for (const s of [EN[k], ES[k]]) {
      assert.doesNotMatch(s, /\{got\}|\{asked\}|\bof \d|\bde \d|\byou got\b|acertaste/i, k);
      assert.doesNotMatch(s, /\b(fail|failed|wrong|mixed|demot\w*|too hard|behind|a medias|fallaste)\b/i, k);
    }
  }
  assert.equal(EN["onboarding.know.mixedNext"], "{camp} is next.");
});
