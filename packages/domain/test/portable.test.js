import test from "node:test";
import assert from "node:assert/strict";
import { deriveState, fromP0, readExport } from "../src/index.js";

let n = 0;
const newId = () => `sit_p0_${String(++n).padStart(6, "0")}`;

test("P0 state keeps the exact day count and each door's lesson", () => {
  const p0 = { v: 1, showedUp: 3, dates: ["2026-09-24", "2026-09-25", "2026-09-27"], paths: { SIKHISM: { day: 3, done: true, lastDate: "2026-09-27" }, BUDDHISM: { day: 1, done: true, lastDate: "2026-09-25" } },
    goal: { days: 21, setOn: "2026-09-24", startCount: 0 }, ui: { onboarded: true, homeWing: "SIKHISM", visitWing: "BUDDHISM", active: "home", book: [{ wing: "SIKHISM", day: 1, word: "seva", carry: "one quiet thing for someone" }] } };
  const m = fromP0(p0, { newId });
  const today = deriveState(m.sits, { today: "2026-09-27", settings: m.settings });
  assert.equal(today.showedUp, 3);
  assert.deepEqual(today.paths.SIKHISM, { day: 3, done: true, lastDate: "2026-09-27" });
  assert.deepEqual(today.paths.BUDDHISM, { day: 2, done: false, lastDate: "2026-09-25" });
  assert.deepEqual(today.goal, { days: 21, done: 3, reached: false });
  assert.equal(m.settings.homeWing, "SIKHISM");
  assert.equal(m.settings.book[0].line, "one quiet thing for someone");
  const tomorrow = deriveState(m.sits, { today: "2026-09-28", settings: m.settings });
  assert.deepEqual([tomorrow.showedUp, tomorrow.paths.SIKHISM.day, tomorrow.paths.SIKHISM.done], [3, 4, false]);
});

test("P0 with a date but an unfinished door still counts the date", () => {
  const m = fromP0({ dates: ["2026-09-20"], paths: { HINDUISM: { day: 2, done: false, lastDate: "2026-09-20" } }, ui: { homeWing: "HINDUISM" } }, { newId });
  const s = deriveState(m.sits, { today: "2026-09-25" });
  assert.equal(s.showedUp, 1);
  assert.equal(s.paths.HINDUISM.day, 2);
});

test("P0 junk or empty gives nothing to import", () => {
  assert.equal(fromP0(null, { newId }), null);
  assert.equal(fromP0({ dates: [] }, { newId }).sits.length, 0);
});

test("an export file round-trips; junk files are refused", () => {
  const file = JSON.stringify({ sits: [{ id: "sit_aaaaaaaa1", door: "HINDUISM", day: 1, date: "2026-10-18", tz: null, kidId: null, deviceId: null, at: "2026-10-18T20:00:00.000Z" }, { id: "x" }], settings: { homeWing: "HINDUISM" }, settingsVersion: 4 });
  const r = readExport(file);
  assert.equal(r.sits.length, 1);
  assert.equal(r.settingsVersion, 4);
  assert.throws(() => readExport("not json"), /isn't an infinite hill export/);
  assert.throws(() => readExport({ hello: 1 }), /isn't an infinite hill export/);
});
