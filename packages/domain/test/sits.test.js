import test from "node:test";
import assert from "node:assert/strict";
import { deriveState, makeSit, mergeSits, sitOutcome } from "../src/index.js";

let n = 0;
const sit = (date, door = "HINDUISM", day = 1, extra = {}) =>
  makeSit({ id: `sit_${String(++n).padStart(6, "0")}`, door, day, date, tz: "America/Los_Angeles", at: `${date}T20:00:00.000Z`, ...extra });

test("no sits: day count 0, door on lesson 1, not done", () => {
  const s = deriveState([], { today: "2026-10-18" });
  assert.equal(s.showedUp, 0);
  assert.deepEqual(s.paths, {});
  assert.equal(s.doneToday, false);
});

test("a sit today: count 1, door done on lesson 1; tomorrow: lesson 2, count still 1", () => {
  const log = [sit("2026-10-18")];
  assert.deepEqual(deriveState(log, { today: "2026-10-18" }).paths.HINDUISM, { day: 1, done: true, lastDate: "2026-10-18" });
  const next = deriveState(log, { today: "2026-10-19" });
  assert.deepEqual([next.showedUp, next.paths.HINDUISM.day, next.paths.HINDUISM.done], [1, 2, false]);
});

test("union merge from two devices: same result in any order, duplicates ignored", () => {
  const a = [sit("2026-10-18", "HINDUISM", 1), sit("2026-10-19", "HINDUISM", 2)];
  const b = [sit("2026-10-19", "BUDDHISM", 1), a[0]];
  const one = deriveState(mergeSits(a, b), { today: "2026-10-20" });
  const two = deriveState(mergeSits(b, a), { today: "2026-10-20" });
  assert.deepEqual(one, two);
  assert.equal(one.showedUp, 2, "two devices on the same date count one day");
  assert.equal(mergeSits(a, b).length, 3);
});

test("missed days never reset; welcome back after 2+ missed dates, once", () => {
  const log = [sit("2026-10-18"), sit("2026-10-19", "HINDUISM", 2)];
  const s = deriveState(log, { today: "2026-10-23" });
  assert.equal(s.showedUp, 2);
  assert.equal(s.paths.HINDUISM.day, 3);
  assert.equal(s.welcomeBack, true);
  assert.equal(deriveState(log, { today: "2026-10-23", settings: { welcomedBackOn: "2026-10-23" } }).welcomeBack, false);
});

test("goal counts dates from the day it was set, including that day", () => {
  const log = [sit("2026-10-17"), sit("2026-10-18", "HINDUISM", 2), sit("2026-10-19", "HINDUISM", 3)];
  const s = deriveState(log, { today: "2026-10-19", settings: { goal: { days: 7, setOn: "2026-10-18" } } });
  assert.deepEqual(s.goal, { days: 7, done: 2, reached: false });
});

test("kids move their own hill and never the parent's count", () => {
  const log = [sit("2026-10-18", "JUDAISM", 1, { kidId: "kid_1" })];
  const s = deriveState(log, { today: "2026-10-19", settings: { kids: [{ id: "kid_1", name: "Ria", door: "JUDAISM" }] } });
  assert.equal(s.showedUp, 0);
  assert.deepEqual([s.kids[0].day, s.kids[0].done], [2, false]);
});

test("sitOutcome: new day, milestone at 3, second sit same date adds nothing", () => {
  const log = [sit("2026-10-18"), sit("2026-10-19", "HINDUISM", 2)];
  assert.deepEqual(sitOutcome(log, "2026-10-20"), { isNewDay: true, showedUp: 3, milestone: 3 });
  assert.deepEqual(sitOutcome(log, "2026-10-19"), { isNewDay: false, showedUp: 2, milestone: null });
});

test("junk records are dropped, not trusted", () => {
  const s = deriveState([{ id: "x", door: "", day: 0 }, sit("2026-10-18")], { today: "2026-10-18" });
  assert.equal(s.showedUp, 1);
});
