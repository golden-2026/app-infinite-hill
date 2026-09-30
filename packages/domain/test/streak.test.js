// The streak: consecutive days with a finished lesson, rest days built in, an earn-back, golden, and kids apart.
import test from "node:test";
import assert from "node:assert/strict";
import { addDays, deriveState, lessonCounts, localDate, makeSit, nextGoal, sitOutcome, streakFrom, streakOutcome, streakWeek } from "../src/index.js";

const D0 = "2026-10-05"; // a Monday
const d = (n) => addDays(D0, n);
/** counts from day offsets: run(0,1,2) = one lesson on each of the first three days */
const run = (...offsets) => Object.fromEntries(offsets.map((o) => [d(o), 1]));
const span = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

test("no lessons: no streak", () => {
  const s = streakFrom({}, D0);
  assert.equal(s.streak, 0);
  assert.equal(s.golden, false);
  assert.equal(s.earnBack, null);
});

test("consecutive days grow it by one; more lessons on a date add nothing", () => {
  assert.equal(streakFrom(run(0), d(0)).streak, 1);
  assert.equal(streakFrom(run(0, 1, 2), d(2)).streak, 3);
  assert.equal(streakFrom({ [d(0)]: 1, [d(1)]: 4, [d(2)]: 2 }, d(2)).streak, 3);
});

test("today still open is never a miss: yesterday's streak holds, nothing spent", () => {
  const s = streakFrom(run(0, 1, 2), d(3));
  assert.equal(s.streak, 3);
  assert.equal(s.doneToday, false);
  assert.equal(s.rest, 2);
  assert.equal(s.atRisk, false); // rest days banked: nothing at stake
});

test("a new streak starts with 2 rest days; a missed day spends one automatically and keeps the count", () => {
  const s = streakFrom(run(0, 1, 3), d(3));
  assert.equal(s.streak, 3);
  assert.equal(s.rest, 1);
  assert.equal(s.days[d(2)], "rest");
  const two = streakFrom(run(0, 1, 4), d(4));
  assert.equal(two.streak, 3);
  assert.equal(two.rest, 0);
  assert.deepEqual([two.days[d(2)], two.days[d(3)]], ["rest", "rest"]);
  assert.equal(streakFrom(run(0, 1, 4), d(5)).atRisk, true); // no rest left and today open: the one time it's at stake
});

test("with no rest day left, a missed day breaks it", () => {
  const s = streakFrom(run(0, 1, 5), d(5)); // missed d2, d3 (rest), d4 (break)
  assert.equal(s.streak, 1);
  assert.equal(s.rest, 2); // the new streak starts with its own two
});

test("hold at most 2, and earn one back every 7 days of streak", () => {
  // spend both early, then 7 lesson days in the streak earns one back
  const c = run(0, 3, ...span(4, 8)); // d1, d2 rest; streak day 7 lands on d8
  const s = streakFrom(c, d(8));
  assert.equal(s.streak, 7);
  assert.equal(s.rest, 1);
  // the cap: a full bank stays at 2 through day 7 and 14
  assert.equal(streakFrom(run(...span(0, 13)), d(13)).rest, 2);
  // a spent day then 14 days: back to 2, never 3
  const long = streakFrom(run(0, ...span(2, 14)), d(14)); // d1 rest; streak 14 on d14
  assert.equal(long.streak, 14);
  assert.equal(long.rest, 2);
});

test("earn it back: 2 lessons in one day within 3 days of the break restores it", () => {
  const broken = streakFrom(run(...span(0, 9)), d(13)); // 10-day streak; d10, d11 rest; d12 breaks; today d13
  assert.equal(broken.streak, 0);
  assert.deepEqual([broken.earnBack.lost, broken.earnBack.brokeOn, broken.earnBack.need], [10, d(12), 2]);
  const back = streakFrom({ ...run(...span(0, 9)), [d(13)]: 2 }, d(13));
  assert.equal(back.streak, 11);
  assert.equal(back.restoredToday, true);
  assert.equal(back.days[d(12)], "restored");
  assert.equal(back.earnBack, null);
  // the offer lasts 3 days after the break (d13, d14, d15); one lesson a day restarts at 1 and keeps the offer open
  const later = streakFrom({ ...run(...span(0, 9)), [d(14)]: 1 }, d(14));
  assert.equal(later.streak, 1);
  assert.equal(later.earnBack.lessonsToday, 1);
  const lastDay = streakFrom({ ...run(...span(0, 9)), [d(14)]: 1, [d(15)]: 2 }, d(15));
  assert.equal(lastDay.streak, 12); // 10 kept + d14 + d15
  assert.equal(lastDay.days[d(13)], "restored");
  // after the window: gone, and 2 lessons don't restore anything
  const tooLate = streakFrom({ ...run(...span(0, 9)), [d(16)]: 2 }, d(16));
  assert.equal(tooLate.streak, 1);
  assert.equal(tooLate.earnBack, null);
});

test("streakOutcome: milestones at 3, 7, 14, 30, 50, 100, 365 and the earn-back moment", () => {
  assert.equal(streakOutcome(run(0, 1), d(2)).milestone, 3);
  assert.equal(streakOutcome(run(...span(0, 5)), d(6)).milestone, 7);
  assert.equal(streakOutcome(run(...span(0, 6)), d(7)).milestone, null);
  assert.equal(streakOutcome(run(0), d(0)).grew, false); // second lesson the same day
  const o = streakOutcome({ ...run(...span(0, 9)), [d(13)]: 1 }, d(13));
  assert.deepEqual([o.before, o.after, o.restored, o.milestone], [1, 11, true, null]);
  const big = streakOutcome({ ...run(...span(0, 28)), [d(32)]: 1 }, d(32)); // 29 kept, earned back to 30
  assert.equal(big.milestone, 30);
});

test("golden: 7+ lesson days with no rest day spent", () => {
  assert.equal(streakFrom(run(...span(0, 5)), d(5)).golden, false);
  assert.equal(streakFrom(run(...span(0, 6)), d(6)).golden, true);
  assert.equal(streakFrom(run(...span(0, 6)), d(7)).golden, true); // today still open keeps it
  const rested = streakFrom(run(...span(0, 4), ...span(6, 10)), d(10)); // d5 rest: streak 10, clean 5
  assert.deepEqual([rested.streak, rested.golden], [10, false]);
  assert.equal(streakFrom(run(...span(0, 4), ...span(6, 12)), d(12)).golden, true); // 7 clean again
  assert.equal(streakOutcome(run(...span(0, 5)), d(6)).becameGolden, true);
});

test("a kid's streak is their own: it never extends or breaks the parent's", () => {
  let n = 0;
  const sit = (date, kidId = null) => makeSit({ id: `sit_${String(++n).padStart(6, "0")}`, door: "HINDUISM", day: 1, date, tz: "UTC", kidId, at: `${date}T15:00:00.000Z` });
  const log = [sit(d(0)), sit(d(1)), sit(d(2), "kid_ria"), sit(d(3), "kid_ria"), sit(d(4), "kid_ria"), sit(d(4))];
  const s = deriveState(log, { today: d(4), settings: { kids: [{ id: "kid_ria", name: "Ria", door: "HINDUISM" }] } });
  assert.equal(s.streak.streak, 3); // d0, d1, (d2, d3 rest), d4: the kid's days never filled the parent's gap
  assert.equal(s.streak.rest, 0);
  assert.equal(s.kids[0].streak.streak, 3);
  assert.deepEqual(lessonCounts(log, "kid_ria"), { [d(2)]: 1, [d(3)]: 1, [d(4)]: 1 });
  // the kid's outcome counts only the kid; the parent's only the parent
  assert.equal(sitOutcome(log, d(5), "kid_ria").streak.after, 4);
  assert.equal(sitOutcome(log, d(5)).streak.after, 4);
  const kidOnly = [sit(d(0), "kid_ria"), sit(d(1), "kid_ria")];
  assert.equal(deriveState(kidOnly, { today: d(1) }).streak.streak, 0);
});

test("time zones: the lesson's own local date counts, across midnight, DST and the new year", () => {
  // 11:30 pm in New York is already tomorrow in UTC, but it is that evening's day
  const late = new Date("2026-10-06T03:30:00Z");
  assert.equal(localDate(late, "America/New_York"), "2026-10-05");
  assert.equal(localDate(late, "UTC"), "2026-10-06");
  const c = { "2026-10-04": 1, [localDate(late, "America/New_York")]: 1 };
  assert.equal(streakFrom(c, "2026-10-05").streak, 2);
  // US daylight saving ends 2026-11-01: still one day apart
  assert.equal(streakFrom({ "2026-10-31": 1, "2026-11-01": 1, "2026-11-02": 1 }, "2026-11-02").streak, 3);
  // Europe's spring change and a leap day
  assert.equal(streakFrom({ "2028-02-28": 1, "2028-02-29": 1, "2028-03-01": 1 }, "2028-03-01").streak, 3);
  assert.equal(streakFrom({ "2026-12-31": 1, "2027-01-01": 1 }, "2027-01-01").streak, 2);
  // a date from a phone set ahead (travel east) is not counted before its day arrives
  assert.equal(streakFrom({ "2026-10-05": 1, "2026-10-06": 1 }, "2026-10-05").streak, 1);
  assert.equal(addDays("2026-03-08", 1), "2026-03-09");
});

test("the week row runs Monday to Sunday with lessons, rest days and today", () => {
  const s = streakFrom(run(0, 1, 3), d(3)); // Mon, Tue lesson, Wed rest, Thu lesson (today)
  const w = streakWeek(s, d(3));
  assert.deepEqual(w.map((x) => x.label), ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]);
  assert.deepEqual(w.map((x) => x.kind), ["lesson", "lesson", "rest", "lesson", "later", "later", "later"]);
  const open = streakWeek(streakFrom(run(0), d(1)), d(1));
  assert.equal(open[1].kind, "today");
  // Sunday belongs to the week that started the Monday before
  assert.equal(streakWeek(streakFrom(run(6), d(6)), d(6))[0].date, D0);
});

test("goals step up 7 → 14 → 30 → 50 → 100 → 365", () => {
  assert.deepEqual([nextGoal(3), nextGoal(7), nextGoal(14), nextGoal(30), nextGoal(365)], [7, 14, 30, 50, null]);
});
