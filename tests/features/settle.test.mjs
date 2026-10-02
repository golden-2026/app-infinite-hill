// Settling in after placement (apps/app/src/lib/settle.ts): the gentle walk-back and jump-ahead offers, and what a move
// does to the door (@ih/domain deriveState with settings.moved). Loaded straight from the app's TypeScript.
import test from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const src = `${root}apps/app/src/`;
const stub = (code) => `data:text/javascript,${encodeURIComponent(code)}`;
register(stub(`
const SRC = ${JSON.stringify(pathToFileURL(src).href)};
const CONTENT = ${JSON.stringify(pathToFileURL(`${root}packages/content/src/index.js`).href)};
export async function resolve(spec, ctx, next) {
  if (spec === "@ih/content") return { url: CONTENT, shortCircuit: true };
  let base = null;
  if (spec.startsWith("@/")) base = new URL(spec.slice(2), SRC).href;
  else if ((spec.startsWith("./") || spec.startsWith("../")) && ctx.parentURL?.startsWith(SRC)) base = new URL(spec, ctx.parentURL).href;
  if (base) for (const e of ["", ".ts", ".js", "/index.ts"]) { try { return await next(base + e, ctx); } catch {} }
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (url.startsWith(SRC) && url.endsWith(".ts")) return next(url, { ...ctx, format: "module-typescript" });
  return next(url, ctx);
}`), import.meta.url);

const S = await import(pathToFileURL(`${src}lib/settle.ts`).href);
const C = await import(pathToFileURL(`${src}content/placement.ts`).href);
const { deriveState, makeSit, movedTo } = await import(pathToFileURL(`${root}packages/domain/src/index.js`).href);

const DOOR = "HINDUISM";
const FIRSTS = C.stopFirsts(DOOR); // 1, 22, 97, 157, 232, 332, â€¦
const START = 232; // placed at camp five
const LAST = C.lastWritten(DOOR);
const date = (n) => `2026-10-${String(n).padStart(2, "0")}`;
/** Runs at the new spot, one a day from Oct 1, with these accuracies. */
const runs = (accs, { from = 1, day = START } = {}) => accs.map((acc, i) => ({ date: date(from + i), door: DOOR, day: day + i, acc, at: `${date(from + i)}T12:00:00.000Z` }));
const offer = (o) => S.settleOffer({ door: DOOR, start: START, day: START + 5, firsts: FIRSTS, last: LAST, today: date(20), moved: null, memo: null, ...o });

test("struggling over three lessons on different days offers a walk back to the start of the stretch before", () => {
  const o = offer({ runs: runs([0.3, 0.4, 0.2]) });
  assert.equal(o.kind, "back");
  assert.equal(o.to, 157, "the start of camp four, never the middle of a camp");
  assert.equal(o.stop, 3);
  assert.ok(o.mean < 0.5);
});

test("never from one bad day: one rough lesson, two lessons, or three on the same date offer nothing", () => {
  assert.equal(offer({ runs: runs([1, 1, 0]) }), null, "one miss among good ones");
  assert.equal(offer({ runs: runs([0.2, 0.2]) }), null, "only two lessons");
  const sameDay = runs([0.2, 0.3, 0.2]).map((r) => ({ ...r, date: date(3), at: `${date(3)}T1${r.day % 10}:00:00.000Z` }));
  assert.equal(offer({ runs: sameDay }), null, "all on one date");
  assert.equal(offer({ runs: runs([0.6, 0.2, 0.6]) }), null, "only one under half");
});

test("only for someone placed past day 1, and only on lessons at the new spot (catch-up days don't count)", () => {
  assert.equal(offer({ start: 1, runs: runs([0.1, 0.1, 0.1], { day: 1 }) }), null);
  const catchUp = runs([0.1, 0.1, 0.1], { day: 30 });
  assert.equal(offer({ runs: catchUp }), null);
  assert.equal(offer({ runs: runs([0.1, 0.1, 0.1]).map((r) => ({ ...r, door: "ISLAM" })) }), null, "another door");
});

test("after the first seven lessons, only a clearly harder run (all three under half, under 40% together)", () => {
  const good = Array(8).fill(0.9);
  assert.equal(offer({ runs: runs([...good, 0.45, 0.45, 0.35]) }), null, "a dip, not a run");
  const o = offer({ runs: runs([...good, 0.3, 0.35, 0.3]) });
  assert.equal(o?.kind, "back");
});

test("'keep going here' is respected: nothing for a week, and then only a clearly worse run after it", () => {
  const first = offer({ runs: runs([0.4, 0.4, 0.4]) });
  const memo = S.declineOffer(undefined, DOOR, first, date(3))[DOOR];
  // the same run, or a similar one in the next days: quiet
  assert.equal(offer({ runs: runs([0.4, 0.4, 0.4]), memo, today: date(4) }), null);
  assert.equal(offer({ runs: runs([0.4, 0.4, 0.4, 0.45, 0.35, 0.4]), memo, today: date(12) }), null, "a week on, but no worse");
  assert.equal(offer({ runs: runs([0.4, 0.4, 0.4, 0.2, 0.2, 0.2]), memo, today: date(7) }), null, "worse, but within the week");
  const again = offer({ runs: runs([0.4, 0.4, 0.4, 0.2, 0.2, 0.2]), memo, today: date(10) });
  assert.equal(again?.kind, "back", "a week later and clearly worse");
});

test("the mirror: acing the first lessons offers the next stretch; once declined it isn't offered again", () => {
  const o = offer({ runs: runs([1, 1, 0.95, 1, 1]) });
  assert.deepEqual([o.kind, o.to], ["ahead", 332]);
  assert.equal(offer({ runs: runs([1, 1, 0.85, 1, 1]) }), null, "one lesson under 90%");
  assert.equal(offer({ runs: runs([1, 1, 1, 1]) }), null, "four lessons is too soon");
  assert.equal(offer({ runs: runs(Array(8).fill(1)) }), null, "only in the first lessons");
  const memo = S.declineOffer(undefined, DOOR, o, date(6))[DOOR];
  assert.equal(offer({ runs: runs([1, 1, 1, 1, 1]), memo }), null);
  // never past the last written day
  const top = FIRSTS.at(-1);
  assert.equal(S.settleOffer({ door: DOOR, start: top, day: top + 5, firsts: FIRSTS, last: LAST, today: date(20), runs: runs([1, 1, 1, 1, 1], { day: top }) }), null);
});

test("after a move, only lessons since the move count (a fresh start at the new spot)", () => {
  const moved = { day: 157, at: `${date(4)}T18:00:00.000Z` };
  const before = runs([0.2, 0.2, 0.2]); // Oct 1â€“3, at 232: these led to the move
  assert.equal(S.settleOffer({ door: DOOR, start: 157, day: 157, firsts: FIRSTS, last: LAST, today: date(5), runs: before, moved }), null);
  const after = [...before, ...runs([0.3, 0.3, 0.3], { from: 5, day: 157 })];
  const again = S.settleOffer({ door: DOOR, start: 157, day: 160, firsts: FIRSTS, last: LAST, today: date(8), runs: after, moved });
  assert.deepEqual([again?.kind, again?.to], ["back", 97], "still finding it hard: one more stretch back, gently");
});

test("walking back keeps the streak, light, finished days and history; the door goes on from the earlier start", () => {
  let n = 0;
  const sit = (d, day) => makeSit({ id: `sit_${String(++n).padStart(6, "0")}`, door: DOOR, day, date: date(d), tz: "UTC", at: `${date(d)}T12:00:00.000Z` });
  const log = [sit(1, 232), sit(2, 233), sit(3, 234)];
  const light = 120;
  const s0 = { placed: { [DOOR]: 232 }, light };
  const before = deriveState(log, { today: date(3), settings: s0 });
  assert.deepEqual([before.paths[DOOR].day, before.paths[DOOR].done, before.streak.streak], [234, true, 3]);

  const patch = S.moveTo(s0, DOOR, 157, `${date(3)}T20:00:00.000Z`);
  assert.deepEqual(patch.placed, { [DOOR]: 157 });
  const s1 = { ...s0, ...patch };
  const moved = deriveState(log, { today: date(3), settings: s1 });
  assert.deepEqual([moved.paths[DOOR].day, moved.paths[DOOR].done], [157, false], "the door stands at the earlier start");
  assert.equal(moved.streak.streak, 3, "the streak stays");
  assert.equal(moved.showedUp, 3, "every day walked stays");
  assert.equal(s1.light, light, "light stays");

  // the next day, day 157; and when the walk reaches 232 again, the finished days are stepped over
  log.push(sit(4, 157));
  const next = deriveState(log, { today: date(5), settings: s1 });
  assert.deepEqual([next.paths[DOOR].day, next.streak.streak], [158, 4]);
  for (let d = 158, k = 5; d <= 231; d++, k++) log.push(makeSit({ id: `sit_${String(++n).padStart(6, "0")}`, door: DOOR, day: d, date: "2026-12-01", tz: "UTC", at: `2026-12-01T12:${String(k % 60).padStart(2, "0")}:00.000Z` }));
  const caughtUp = deriveState(log, { today: "2026-12-02", settings: s1 });
  assert.equal(caughtUp.paths[DOOR].day, 235, "232â€“234 were already finished, so the walk goes on at 235");
});

test("jumping ahead and walking back to day 1 both work, and junk moves are dropped", () => {
  let n = 0;
  const sit = (d, day) => makeSit({ id: `sit_${String(++n).padStart(6, "0")}`, door: DOOR, day, date: date(d), tz: "UTC", at: `${date(d)}T12:00:00.000Z` });
  const log = [sit(1, 232), sit(2, 233)];
  const ahead = { ...S.moveTo({ placed: { [DOOR]: 232 } }, DOOR, 332, `${date(2)}T20:00:00.000Z`) };
  assert.equal(deriveState(log, { today: date(3), settings: ahead }).paths[DOOR].day, 332);
  const home = S.moveTo({ placed: { [DOOR]: 22 } }, DOOR, 1, `${date(2)}T20:00:00.000Z`);
  assert.deepEqual(home.placed, {}, "back at the beginning: no start past day 1");
  assert.equal(deriveState([sit(1, 22), sit(2, 23)], { today: date(3), settings: home }).paths[DOOR].day, 1);
  assert.deepEqual(movedTo({ A: { day: 0, at: "x" }, B: { day: 40, at: "nope" }, C: "x", D: { day: 50, at: "2026-10-01T00:00:00Z" } }), { D: { day: 50, at: "2026-10-01T00:00:00Z" } });
});

test("the offer's wording stays gentle and keeps everything", async () => {
  const { EN, ES } = await import(pathToFileURL(`${src}i18n/strings/index.ts`).href);
  assert.equal(EN["home.settle.back"], "this stretch leans on a few stories from {camp}. want to walk back and pick them up? everything you've done stays with you.");
  assert.equal(EN["home.settle.backGo"], "Walk back");
  assert.equal(EN["home.settle.stay"], "Keep going here");
  for (const k of Object.keys(EN).filter((x) => x.startsWith("home.settle."))) {
    assert.ok(ES[k] && ES[k] !== EN[k], `${k}: Spanish`);
    assert.doesNotMatch(`${EN[k]} ${ES[k]}`, /\b(fail|failed|wrong level|demot\w*|too hard|behind|fallaste|atrasad\w*|difÃ­cil)\b/i, k);
  }
});
