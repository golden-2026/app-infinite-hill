// The streak reminders (apps/app/src/lib/reminder-plan.ts), loaded straight from the app's TypeScript (Node strips
// the types): the daily note about 23.5 hours after the last lesson unless a time is set, the one 8 pm streak saver
// only when no rest day is left, the last note after 7 quiet days, quiet hours and quiet mode.
process.env.TZ = "America/New_York"; // the plan works in the phone's local time
import test from "node:test";
import assert from "node:assert/strict";

const { planReminders, NOTE } = await import(new URL("../../apps/app/src/lib/reminder-plan.ts", import.meta.url).href);

const local = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min);
const hm = (d) => `${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const base = { time: "sundown", set: false, doneToday: true, streak: 5, rest: 2, quiet: false };

test("daily note ~23.5 hours after the last lesson, then one last note on day 7, then nothing", () => {
  const last = local(2026, 10, 5, 8, 0);
  const plan = planReminders({ ...base, now: last, lastLessonAt: last });
  const daily = plan.filter((p) => p.kind === "daily");
  assert.equal(hm(daily[0].at), "6 07:30"); // 23.5 h after 8:00 am
  assert.equal(hm(daily[1].at), "7 07:30");
  const lastNote = plan.filter((p) => p.kind === "last");
  assert.equal(lastNote.length, 1);
  assert.equal(hm(lastNote[0].at), "12 07:30");
  assert.equal(lastNote[0].body, "we'll stop reminding you for now. your hill will be right here.");
  assert.ok(plan.every((p) => p.at <= lastNote[0].at)); // quiet after the last note
  // opened again after the last note: nothing left to send
  assert.deepEqual(planReminders({ ...base, now: local(2026, 10, 13, 9), lastLessonAt: last, doneToday: false }), []);
});

test("a set time wins over the rhythm", () => {
  const last = local(2026, 10, 5, 8, 0);
  const plan = planReminders({ ...base, now: last, lastLessonAt: last, time: "12:00", set: true });
  assert.equal(hm(plan.find((p) => p.kind === "daily").at), "6 12:00");
});

test("quiet hours: a late lesson's reminder comes forward to 9:30 pm, an early one waits till 7:30 am", () => {
  const late = local(2026, 10, 5, 23, 10);
  assert.equal(hm(planReminders({ ...base, now: late, lastLessonAt: late })[0].at), "6 21:30");
  const early = local(2026, 10, 5, 6, 0); // 23.5 h later is 5:30 am
  assert.equal(hm(planReminders({ ...base, now: early, lastLessonAt: early })[0].at), "6 07:30");
  for (const p of planReminders({ ...base, now: late, lastLessonAt: late })) assert.ok(p.at.getHours() < 22 && p.at.getHours() >= 7);
});

test("the streak saver: one 8 pm note, only on the day missing would break a 2+ streak", () => {
  const last = local(2026, 10, 5, 8, 0);
  const savers = (o) => planReminders({ ...base, now: last, lastLessonAt: last, ...o }).filter((p) => p.kind === "saver");
  // 2 rest days banked: day 1 and 2 are covered, day 3 is the one at stake
  assert.deepEqual(savers({}).map((p) => hm(p.at)), ["8 20:00"]);
  assert.equal(savers({})[0].body, NOTE.saver(5));
  assert.deepEqual(savers({ rest: 0 }).map((p) => hm(p.at)), ["6 20:00"]);
  assert.deepEqual(savers({ streak: 1 }), []); // a 1-day streak gets no saver
  assert.deepEqual(savers({ quiet: true }), []); // quiet mode: hard persona, heavy mood
  assert.deepEqual(savers({ streakOn: false }), []); // streak hidden: no streak talk at all
});

test("never two notes the same evening, never on a day already done", () => {
  const last = local(2026, 10, 5, 20, 15); // the rhythm lands at 7:45 pm, right by the 8 pm saver
  const plan = planReminders({ ...base, now: last, lastLessonAt: last, rest: 0 });
  const day6 = plan.filter((p) => p.at.getDate() === 6);
  assert.deepEqual(day6.map((p) => p.kind), ["saver"]);
  // lesson done today: nothing today even if the plan would have had something
  const now = local(2026, 10, 6, 9, 0);
  const plan2 = planReminders({ ...base, now, lastLessonAt: local(2026, 10, 6, 8, 0), rest: 0 });
  assert.ok(plan2.every((p) => p.at.getDate() !== 6));
});

test("the copy is warm and never guilt-trips", () => {
  const all = [...NOTE.daily, NOTE.saver(9), NOTE.last].join(" ");
  assert.doesNotMatch(all, /lose|lost|broke|fail|disappoint|sad|miss(ed)? you|don't let/i);
});

test("no lesson yet: falls back to one note a day at their time", () => {
  const now = local(2026, 10, 5, 9, 0);
  const plan = planReminders({ ...base, now, lastLessonAt: null, doneToday: false });
  assert.equal(hm(plan[0].at), "5 19:00");
  assert.ok(plan.every((p) => p.kind === "daily"));
});
