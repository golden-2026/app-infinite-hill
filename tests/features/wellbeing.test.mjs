// The 30-second check-in's logic (apps/app/src/lib/wellbeing.ts), loaded straight from TypeScript: when it asks, how
// it scores, what the You card says.
import test from "node:test";
import assert from "node:assert/strict";

const { who5Score, milestoneFor, bucketOf, dueAtStart, dueAfterLesson, noteCheck, change, cleanWellbeing, emptyWellbeing, WHO5_ITEMS, WHO5_HELP_UNDER } = await import(new URL("../../apps/app/src/lib/wellbeing.ts", import.meta.url).href);

test("WHO-5: five answers 0–5, raw ×4; anything missing or out of range scores nothing", () => {
  assert.equal(WHO5_ITEMS.length, 5);
  assert.equal(who5Score([5, 5, 5, 5, 5]), 100);
  assert.equal(who5Score([0, 0, 0, 0, 0]), 0);
  assert.equal(who5Score([3, 2, 4, 1, 1]), 44);
  assert.equal(who5Score([3, 2, 4, 1, null]), null);
  assert.equal(who5Score([3, 2, 4, 1]), null);
  assert.equal(who5Score([6, 2, 4, 1, 1]), null);
  assert.equal(who5Score([2.5, 2, 4, 1, 1]), null);
});

test("milestones: 1, 21, 50, 100, then every 30 days; buckets follow", () => {
  assert.deepEqual([0, 1, 5, 20, 21, 30, 49, 50, 99, 100, 129, 130, 160, 400].map(milestoneFor), [1, 1, 1, 1, 21, 21, 21, 50, 50, 100, 100, 130, 160, 400]);
  assert.deepEqual([1, 21, 50, 100, 130, 400].map(bucketOf), ["1", "21", "50", "100", "100+", "100+"]);
});

test("the baseline is asked once, right after onboarding, and never once a check exists", () => {
  const wb = emptyWellbeing();
  assert.equal(dueAtStart(wb), 1);
  assert.equal(dueAtStart(noteCheck(wb, 1, null, "2026-10-02")), null); // skipped: not again
  assert.equal(dueAtStart(noteCheck(wb, 1, 44, "2026-10-02")), null);
  assert.equal(dueAtStart(noteCheck(wb, 21, 60, "2026-10-23")), null); // an imported file with a later check: no baseline
});

test("after a lesson: asked at day 21, 50, 100, 130 …, each once, and only within a week of reaching it", () => {
  let wb = noteCheck(emptyWellbeing(), 1, 44, "2026-10-02");
  for (const d of [1, 2, 7, 20]) assert.equal(dueAfterLesson(d, wb), null, `day ${d}`);
  assert.equal(dueAfterLesson(21, wb), 21);
  assert.equal(dueAfterLesson(24, wb), 21); // missed it on the day (closed the app): still asked a few days later
  assert.equal(dueAfterLesson(28, wb), null); // too late: the bucket would lie
  wb = noteCheck(wb, 21, null, "2026-10-23"); // skipped on day 21
  assert.equal(dueAfterLesson(21, wb), null); // never nags twice
  assert.equal(dueAfterLesson(22, wb), null);
  assert.equal(dueAfterLesson(49, wb), null);
  assert.equal(dueAfterLesson(50, wb), 50);
  wb = noteCheck(wb, 50, 60, "2026-11-21");
  assert.equal(dueAfterLesson(50, wb), null);
  assert.equal(dueAfterLesson(100, wb), 100);
  wb = noteCheck(wb, 100, 64, "2027-01-10");
  assert.equal(dueAfterLesson(129, wb), null);
  assert.equal(dueAfterLesson(130, wb), 130);
  assert.equal(dueAfterLesson(160, noteCheck(wb, 130, 70, "2027-02-09")), 160);
});

test("a phone that passed a milestone before the check-in existed is not asked that milestone's question", () => {
  assert.equal(dueAfterLesson(60, emptyWellbeing()), null); // 50 was more than a week ago
  assert.equal(dueAfterLesson(100, emptyWellbeing()), 100); // the next one is asked as usual
});

test("the card: first against latest, once there are two; a meaningful move is 10 points; one gentle line under 28", () => {
  let wb = noteCheck(emptyWellbeing(), 1, 44, "2026-10-02");
  assert.equal(change(wb), null);
  wb = noteCheck(wb, 21, 60, "2026-10-23");
  assert.deepEqual(change(wb), { first: { m: 1, date: "2026-10-02", score: 44 }, latest: { m: 21, date: "2026-10-23", score: 60 }, delta: 16, read: "up", help: false });
  assert.equal(change(noteCheck(wb, 50, 52, "2026-11-21")).read, "steady"); // 44 → 52: about the same
  assert.equal(change(noteCheck(wb, 50, 52, "2026-11-21")).latest.m, 50);
  const low = change(noteCheck(wb, 50, 24, "2026-11-21"));
  assert.equal(low.read, "softer");
  assert.equal(low.help, true);
  assert.equal(WHO5_HELP_UNDER, 28);
  assert.equal(change(noteCheck(wb, 50, 28, "2026-11-21")).help, false);
});

test("answering a milestone again replaces that check; whatever was saved comes back well-formed", () => {
  const wb = noteCheck(noteCheck(emptyWellbeing(), 21, 40, "2026-10-23"), 21, 48, "2026-10-24");
  assert.deepEqual(wb.checks, [{ m: 21, date: "2026-10-24", score: 48 }]);
  assert.deepEqual(cleanWellbeing(null), { checks: [], offered: [] });
  assert.deepEqual(cleanWellbeing({ checks: [{ m: 1, date: "2026-10-02", score: 44 }, { m: "x", date: "2026-10-02", score: 44 }, { m: 21, date: "bad", score: 44 }, { m: 50, date: "2026-11-21", score: 101 }], offered: [21, "no"] }),
    { checks: [{ m: 1, date: "2026-10-02", score: 44 }], offered: [21, 1] });
});
