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
  const a = sitOutcome(log, "2026-10-20");
  assert.deepEqual({ ...a, streak: undefined }, { isNewDay: true, showedUp: 3, milestone: 3, streak: undefined });
  assert.deepEqual([a.streak.before, a.streak.after, a.streak.milestone], [2, 3, 3]);
  const b = sitOutcome(log, "2026-10-19");
  assert.deepEqual({ ...b, streak: undefined }, { isNewDay: false, showedUp: 2, milestone: null, streak: undefined });
  assert.equal(b.streak.grew, false);
});

test("junk records are dropped, not trusted", () => {
  const s = deriveState([{ id: "x", door: "", day: 0 }, sit("2026-10-18")], { today: "2026-10-18" });
  assert.equal(s.showedUp, 1);
});

test("placement: a door placed at 22 stands there before anything is walked; catch-up lessons never move it back", () => {
  const settings = { placed: { HINDUISM: 22 } };
  const empty = deriveState([], { today: "2026-10-18", settings });
  assert.deepEqual(empty.paths.HINDUISM, { day: 22, done: false, lastDate: null });
  assert.equal(empty.showedUp, 0);
  // day 22 today: done there; tomorrow: 23
  const log = [sit("2026-10-18", "HINDUISM", 22)];
  assert.deepEqual(deriveState(log, { today: "2026-10-18", settings }).paths.HINDUISM, { day: 22, done: true, lastDate: "2026-10-18" });
  assert.equal(deriveState(log, { today: "2026-10-19", settings }).paths.HINDUISM.day, 23);
  // catching up day 3 first: the door stays at 22 (not done), and the day still counts for the streak
  const catchUp = deriveState([sit("2026-10-18", "HINDUISM", 3)], { today: "2026-10-18", settings });
  assert.deepEqual(catchUp.paths.HINDUISM, { day: 22, done: false, lastDate: "2026-10-18" });
  assert.equal(catchUp.streak.streak, 1);
  assert.equal(catchUp.showedUp, 1);
  // walked 22 and 23, then caught up day 5: still on 24 tomorrow
  const later = [sit("2026-10-18", "HINDUISM", 22), sit("2026-10-19", "HINDUISM", 23), sit("2026-10-20", "HINDUISM", 5)];
  assert.equal(deriveState(later, { today: "2026-10-21", settings }).paths.HINDUISM.day, 24);
  // other doors are untouched; junk placements are ignored
  assert.equal(deriveState([], { today: "2026-10-18", settings: { placed: { ISLAM: "22", JUDAISM: 1, X: -4 } } }).paths.ISLAM, undefined);
  assert.deepEqual(deriveState([], { today: "2026-10-18", settings: { placed: null } }).paths, {});
});
