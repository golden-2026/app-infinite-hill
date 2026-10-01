// The phone's side of the anonymous return counts (apps/app/src/lib/pulse-plan.ts), loaded straight from TypeScript.
import test from "node:test";
import assert from "node:assert/strict";

const { startRec, openPing, afterOpen, lessonPing } = await import(new URL("../../apps/app/src/lib/pulse-plan.ts", import.meta.url).href);

test("a new phone: a 'first' on day 0, once; then one 'open' a day with how many days it's been", () => {
  let rec = startRec(null, "2026-10-07", null);
  assert.deepEqual(rec, { first: "2026-10-07", firstSent: false, opened: null });
  const p0 = openPing(rec, "2026-10-07");
  assert.deepEqual(p0, { cohortDate: "2026-10-07", daysSince: 0, event: "first" });
  rec = afterOpen(rec, p0, "2026-10-07");
  assert.equal(openPing(rec, "2026-10-07"), null); // already said today
  const p1 = openPing(rec, "2026-10-08");
  assert.deepEqual(p1, { cohortDate: "2026-10-07", daysSince: 1, event: "open" });
  rec = afterOpen(rec, p1, "2026-10-08");
  assert.deepEqual(openPing(rec, "2026-10-14"), { cohortDate: "2026-10-07", daysSince: 7, event: "open" });
  assert.deepEqual(openPing(rec, "2026-11-06"), { cohortDate: "2026-10-07", daysSince: 30, event: "open" });
});

test("a ping that didn't land is tried again on the next open, the same day", () => {
  const rec = startRec(null, "2026-10-07", null);
  assert.equal(openPing(rec, "2026-10-07").event, "first"); // (send failed, nothing remembered)
  assert.equal(openPing(startRec(rec, "2026-10-07", null), "2026-10-07").event, "first");
});

test("a phone with lessons from before the counts existed joins at its first lesson and never sends 'first'", () => {
  const rec = startRec(null, "2026-10-07", "2026-09-20");
  assert.deepEqual(rec, { first: "2026-09-20", firstSent: true, opened: null });
  assert.deepEqual(openPing(rec, "2026-10-07"), { cohortDate: "2026-09-20", daysSince: 17, event: "open" });
});

test("lessons carry the same two numbers; a clock set backwards sends nothing", () => {
  const rec = startRec(null, "2026-10-07", null);
  assert.deepEqual(lessonPing(rec, "2026-10-09"), { cohortDate: "2026-10-07", daysSince: 2, event: "lesson" });
  assert.equal(lessonPing(rec, "2026-10-01"), null);
  assert.equal(openPing(rec, "2026-10-01"), null);
});

test("only a tidy variant label rides along, and nothing else ever does", () => {
  const rec = startRec(null, "2026-10-07", null);
  assert.deepEqual(openPing(rec, "2026-10-07", "finish-b"), { cohortDate: "2026-10-07", daysSince: 0, event: "first", variant: "finish-b" });
  assert.equal("variant" in openPing(rec, "2026-10-07", "Not OK!"), false);
  for (const p of [openPing(rec, "2026-10-07"), lessonPing(rec, "2026-10-08")]) assert.deepEqual(Object.keys(p).sort(), ["cohortDate", "daysSince", "event"]);
});
