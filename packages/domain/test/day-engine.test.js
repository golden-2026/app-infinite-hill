import test from "node:test";
import assert from "node:assert/strict";
import {
  completeSit, currentRun, daysBetween, emptyState, goalProgress, goldenWeeks, localDate,
  missedDays, normalizeState, rollover, setGoal, shouldWelcomeBack,
} from "../src/day-engine.js";

const sit = (s, door, date) => completeSit(s, { door, date });

test("the count starts at 0 and the first sit makes it 1", () => {
  const s = emptyState();
  assert.equal(s.showedUp, 0);
  const r = sit(s, "HINDUISM", "2026-10-18");
  assert.equal(r.showedUp, 1);
  assert.equal(r.isNewDay, true);
});

test("three sits on one date (either door) earn one day; the door still finishes", () => {
  let r = sit(emptyState(), "HINDUISM", "2026-10-18");
  r = sit(r.state, "HINDUISM", "2026-10-18");
  r = sit(r.state, "ISLAM", "2026-10-18");
  assert.equal(r.showedUp, 1);
  assert.equal(r.isNewDay, false);
  assert.equal(r.state.paths.ISLAM.done, true);
  assert.equal(r.state.sitsByDate["2026-10-18"], 3);
});

test("missed days never reset the count, and the door moves on when the app opens", () => {
  let r = sit(emptyState(), "HINDUISM", "2026-10-18");
  let s = rollover(r.state, "2026-10-19");
  assert.deepEqual(s.paths.HINDUISM, { day: 2, done: false, lastDate: "2026-10-18" });
  s = rollover(s, "2026-10-25"); // a week away: nothing changes, nothing lost
  assert.equal(s.paths.HINDUISM.day, 2);
  assert.equal(s.showedUp, 1);
  r = sit(s, "HINDUISM", "2026-10-25");
  assert.equal(r.showedUp, 2);
});

test("rollover on the same date does nothing", () => {
  const r = sit(emptyState(), "HINDUISM", "2026-10-18");
  assert.deepEqual(rollover(r.state, "2026-10-18").paths.HINDUISM.day, 1);
});

test("time zone travel never double-counts a date", () => {
  const la = localDate(new Date("2026-10-19T03:30:00Z"), "America/Los_Angeles"); // 8:30 pm Oct 18 in LA
  const ny = localDate(new Date("2026-10-19T03:30:00Z"), "America/New_York"); // 11:30 pm Oct 18 in NY
  const tokyo = localDate(new Date("2026-10-19T03:30:00Z"), "Asia/Tokyo"); // 12:30 pm Oct 19 in Tokyo
  assert.equal(la, "2026-10-18");
  assert.equal(ny, "2026-10-18");
  assert.equal(tokyo, "2026-10-19");
  let r = sit(emptyState(), "HINDUISM", la);
  r = sit(r.state, "HINDUISM", ny);
  assert.equal(r.showedUp, 1, "same local date after flying LA to NY");
  r = sit(r.state, "HINDUISM", tokyo);
  assert.equal(r.showedUp, 2, "a new local date in Tokyo is a new day");
});

test("DST night: the fall-back date is still one date", () => {
  const before = localDate(new Date("2026-11-01T07:30:00Z"), "America/Los_Angeles"); // 12:30 am PDT
  const after = localDate(new Date("2026-11-01T09:30:00Z"), "America/Los_Angeles"); // 1:30 am PST
  assert.equal(before, after);
  assert.equal(daysBetween("2026-10-31", "2026-11-02"), 2);
});

test("milestones fire once, on the new day that reaches them", () => {
  let s = emptyState();
  const seen = [];
  for (let d = 1; d <= 8; d++) {
    const r = sit(s, "HINDUISM", `2026-10-${String(17 + d).padStart(2, "0")}`);
    if (r.milestone) seen.push(r.milestone);
    s = r.state;
    const again = sit(s, "HINDUISM", `2026-10-${String(17 + d).padStart(2, "0")}`);
    assert.equal(again.milestone, null);
  }
  assert.deepEqual(seen, [3, 7]);
});

test("golden weeks count 7 consecutive dates; a gap starts a new run and takes nothing away", () => {
  let s = emptyState();
  const dates = ["2026-10-18", "2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-26", "2026-10-27"];
  for (const d of dates) s = sit(s, "HINDUISM", d).state;
  assert.equal(goldenWeeks(s), 1);
  assert.equal(currentRun(s), 2);
  assert.equal(s.showedUp, 9);
});

test("welcome back after 2+ missed dates, once per date", () => {
  const s = sit(emptyState(), "HINDUISM", "2026-10-18").state;
  assert.equal(missedDays(s, "2026-10-19"), 0);
  assert.equal(shouldWelcomeBack(s, "2026-10-20"), false, "one missed date is quiet");
  assert.equal(shouldWelcomeBack(s, "2026-10-21"), true);
  assert.equal(shouldWelcomeBack({ ...s, welcomedBackOn: "2026-10-21" }, "2026-10-21"), false);
});

test("a goal set on day 1 counts day 1; not yet is stored; bad values refuse", () => {
  let s = sit(emptyState(), "HINDUISM", "2026-10-18").state;
  s = setGoal(s, 7, "2026-10-18");
  assert.deepEqual(goalProgress(s), { days: 7, done: 1, reached: false });
  for (const d of ["2026-10-19", "2026-10-20", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"]) s = sit(s, "HINDUISM", d).state;
  assert.deepEqual(goalProgress(s), { days: 7, done: 7, reached: true });
  assert.equal(goalProgress(setGoal(s, "not_yet", "2026-10-25")), null);
  assert.throws(() => setGoal(s, 5, "2026-10-25"));
});

test("a child's sit moves the child's hill and never the parent's count", () => {
  const s = { ...emptyState(), kids: [{ name: "Zayn", age: 9, wing: "SIKHISM", day: 1, done: false }] };
  const r = completeSit(s, { door: "SIKHISM", date: "2026-10-18", kidIndex: 0 });
  assert.equal(r.showedUp, 0);
  assert.equal(r.state.kids[0].done, true);
  assert.equal(rollover(r.state, "2026-10-19").kids[0].day, 2);
});

test("normalizeState repairs junk and derives the count from dates", () => {
  const s = normalizeState({ showedUp: 99, dates: ["2026-10-18", "nope", "2026-10-18"], paths: { X: { day: -3, done: "yes" } } });
  assert.equal(s.showedUp, 1);
  assert.deepEqual(s.paths.X, { day: 1, done: false });
  assert.equal(normalizeState(null).showedUp, 0);
});
