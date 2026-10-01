// The streak reminders (apps/app/src/lib/reminder-plan.ts), loaded straight from the app's TypeScript (Node strips
// the types): the daily note about 23.5 hours after the last lesson unless a time is set, the one 8 pm streak saver
// only when no rest day is left, the last note after 5 quiet days (then nothing until the next lesson), quiet hours and
// quiet mode. The same "we'll stop" rule for web push (supabase/functions/reminders/quiet.ts).
process.env.TZ = "America/New_York"; // the plan works in the phone's local time
import test from "node:test";
import assert from "node:assert/strict";

const { planReminders, NOTE } = await import(new URL("../../apps/app/src/lib/reminder-plan.ts", import.meta.url).href);

const local = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min);
const hm = (d) => `${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
const base = { time: "sundown", set: false, doneToday: true, streak: 5, rest: 2, quiet: false };

test("daily note ~23.5 hours after the last lesson, then one last note on day 5, then nothing", () => {
  const last = local(2026, 10, 5, 8, 0);
  const plan = planReminders({ ...base, now: last, lastLessonAt: last });
  const daily = plan.filter((p) => p.kind === "daily");
  assert.equal(hm(daily[0].at), "6 07:30"); // 23.5 h after 8:00 am
  assert.equal(hm(daily[1].at), "7 07:30");
  const lastNote = plan.filter((p) => p.kind === "last");
  assert.equal(lastNote.length, 1);
  assert.equal(hm(lastNote[0].at), "10 07:30");
  assert.equal(lastNote[0].body, "i'll stop nudging for now. the door stays open, whenever you're ready.");
  assert.equal(daily.length, 4); // days 1 to 4, then the goodbye on day 5
  assert.ok(plan.every((p) => p.at <= lastNote[0].at)); // quiet after the last note
  // opened again after the last note: nothing left to send
  assert.deepEqual(planReminders({ ...base, now: local(2026, 10, 11, 9), lastLessonAt: last, doneToday: false }), []);
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

// ── the "we'll stop" note, on a fake clock: the phone re-plans on every open and after every lesson, as
// lib/reminders.native.ts does, and we watch which notes would actually ring each day.
const { NOTE_ES } = await import(new URL("../../apps/app/src/lib/reminder-plan.ts", import.meta.url).href);
const { webNote, GO_QUIET_AFTER: WEB_QUIET, LAST_NOTE } = await import(new URL("../../supabase/functions/reminders/quiet.ts", import.meta.url).href);

test("fake clock: 5 quiet days → one goodbye, then silence; one lesson later, reminders come back", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: local(2026, 10, 5, 8, 0) });
  let lastLessonAt = new Date(); // a lesson right now, Monday Oct 5, 8:00 am
  let scheduled = planReminders({ ...base, now: new Date(), lastLessonAt, rest: 0, streak: 1 });
  const rang = [];
  const live = (until) => { // let the clock run; whatever was scheduled before `until` rings
    for (const p of scheduled) if (p.at > new Date() && p.at <= until) rang.push(`${hm(p.at)} ${p.kind}`);
    t.mock.timers.setTime(until.getTime());
  };
  live(local(2026, 10, 19, 9, 0)); // two weeks pass with the app closed
  assert.deepEqual(rang, ["6 07:30 daily", "7 07:30 daily", "8 07:30 daily", "9 07:30 daily", "10 07:30 last"]);
  // they open the app on the 19th without doing a lesson: nothing new is planned
  scheduled = planReminders({ ...base, now: new Date(), lastLessonAt, doneToday: false, rest: 0, streak: 0 });
  assert.deepEqual(scheduled, []);
  // they do a lesson at 9:30: the plan starts over, the next note is tomorrow
  t.mock.timers.setTime(local(2026, 10, 19, 9, 30).getTime());
  lastLessonAt = new Date();
  scheduled = planReminders({ ...base, now: new Date(), lastLessonAt, rest: 0, streak: 1 });
  assert.equal(`${hm(scheduled[0].at)} ${scheduled[0].kind}`, "20 09:00 daily");
  assert.equal(scheduled.filter((p) => p.kind === "last").length, 1);
  assert.equal(hm(scheduled.find((p) => p.kind === "last").at), "24 09:00");
});

test("fake clock: opening the app on quiet days never brings the reminders back by itself", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: local(2026, 10, 5, 19, 0) });
  const lastLessonAt = new Date();
  for (let day = 6; day <= 15; day++) {
    t.mock.timers.setTime(local(2026, 10, day, 12, 0).getTime());
    const plan = planReminders({ ...base, now: new Date(), lastLessonAt, doneToday: false, rest: 0, streak: 0 });
    if (day < 10) assert.ok(plan.some((p) => p.kind === "last"), `day ${day}: the goodbye is still ahead`);
    if (day >= 10) assert.ok(plan.every((p) => p.at.getDate() <= 10), `day ${day}: nothing after the goodbye`);
    if (day > 10) assert.deepEqual(plan, [], `day ${day}`);
  }
});

test("the goodbye in Spanish, and it's warm in both languages", () => {
  assert.equal(NOTE_ES.last, "dejo de recordarte por ahora. la puerta sigue abierta, cuando quieras.");
  globalThis.__ihLang = "es";
  try {
    const last = local(2026, 10, 5, 8, 0);
    const plan = planReminders({ ...base, now: last, lastLessonAt: last });
    assert.equal(plan.find((p) => p.kind === "last").body, NOTE_ES.last);
  } finally { delete globalThis.__ihLang; }
  assert.doesNotMatch(`${NOTE.last} ${NOTE_ES.last}`, /lose|lost|broke|fail|disappoint|sad|miss(ed)? you|perd|fall|triste|culpa/i);
});

test("web push follows the same rule: daily, the goodbye on day 5, then quiet until the next lesson", () => {
  assert.equal(WEB_QUIET, 5);
  assert.equal(LAST_NOTE, NOTE.last);
  assert.equal(webNote("2026-10-06", "2026-10-05"), "daily");
  assert.equal(webNote("2026-10-09", "2026-10-05"), "daily");
  assert.equal(webNote("2026-10-10", "2026-10-05"), "last");
  assert.equal(webNote("2026-10-11", "2026-10-05"), "quiet");
  assert.equal(webNote("2026-11-30", "2026-10-05"), "quiet");
  assert.equal(webNote("2026-11-30", "2026-11-29"), "daily"); // practiced again: back to normal
  assert.equal(webNote("2026-10-10", null), "daily"); // no lesson known yet: unchanged
});

test("fourteen daily lines take turns by calendar day: none repeats within two weeks, even when the plan is re-made", async () => {
  const { dailyLine } = await import(new URL("../../apps/app/src/lib/reminder-plan.ts", import.meta.url).href);
  const web = await import(new URL("../../supabase/functions/reminders/quiet.ts", import.meta.url).href);
  assert.equal(NOTE.daily.length, 14);
  assert.equal(NOTE_ES.daily.length, 14);
  assert.deepEqual(web.DAILY, NOTE.daily); // web push speaks the same lines
  const two = Array.from({ length: 14 }, (_, k) => dailyLine(local(2026, 10, 5 + k, 9)));
  assert.equal(new Set(two).size, 14);
  assert.equal(new Set(Array.from({ length: 14 }, (_, k) => web.dailyLine(`2026-10-${String(5 + k).padStart(2, "0")}`))).size, 14);
  // a lesson every few days re-makes the plan; the day decides the line, so day 1 of each plan isn't always the same
  const firsts = [5, 8, 11, 14].map((d) => planReminders({ ...base, now: local(2026, 10, d, 8), lastLessonAt: local(2026, 10, d, 8) })[0].body);
  assert.equal(new Set(firsts).size, 4);
  for (let k = 0; k < 20; k++) assert.equal(dailyLine(local(2026, 10, 5 + k, 9)), dailyLine(local(2026, 10, 5 + k + 14, 18))); // two weeks later, its turn again
  assert.doesNotMatch([...NOTE.daily, ...NOTE_ES.daily].join(" "), /lose|lost|broke|fail|disappoint|sad|miss(ed)? you|don't let|perd|triste|culpa/i);
});
