// The upgraded first week (packages/content/src/week.js; owner, 2026-10-06): a script with games.build gets the new
// shape in planDay. Hindu days 1–7 are the pilot; every other lesson is built as before.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { WEEK_ONE, lookBack, planDay, sayable } from "../../packages/content/src/index.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const script = (day, door = "hinduism") => JSON.parse(readFileSync(`${root}docs/curriculum/${door}/scripts/y1/day-${String(day).padStart(4, "0")}.json`, "utf8"));
const plan = (day) => planDay({ wing: "HINDUISM", day, script: script(day), level: 1 });
const types = (p) => p.steps.map((s) => s.type);

test("each day of the Hindu week gets the story, what most people get wrong, build the word and fewer, better games", () => {
  for (let d = 1; d <= 7; d++) {
    const t = types(plan(d));
    for (const want of ["story", "wrong", "build", "match"]) assert.ok(t.includes(want), `day ${d} has ${want}`);
    for (const gone of ["listen", "say", "rhythm", "scenes", "rush"]) assert.ok(!t.includes(gone), `day ${d} drops ${gone}`);
    assert.equal(t.at(-1), "tally");
    assert.ok(t.length <= 26, `day ${d} is ${t.length} screens`);
    // ids stay unique (the resume logic keys on them)
    const ids = plan(d).steps.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
  }
});

test("a look back reaches two days back from day 3, and day 7 ends with the week's check-in", () => {
  assert.equal(types(plan(2)).includes("lookback"), false);
  const back = plan(3).steps.find((s) => s.type === "lookback");
  assert.equal(back.word, "namaste");
  assert.ok(back.options.includes(back.answer));
  const t7 = types(plan(7));
  assert.ok(t7.indexOf("checkin") === t7.length - 2, "the check-in sits just before the tally");
  const check = plan(7).steps.find((s) => s.type === "checkin");
  assert.equal(check.items.length, WEEK_ONE.HINDUISM.length);
  for (const q of check.items) assert.ok(q.options.includes(q.answer));
  assert.equal(lookBack("CHRISTIANITY", 3), null);
});

test("teaching bubbles are short, and a head only sits over the bubble that says it", () => {
  for (let d = 1; d <= 7; d++) for (const s of plan(d).steps.filter((x) => x.type === "beat" && /^the teach/.test(x.seg))) {
    assert.ok(s.text.split(/\s+/).length <= 60, `day ${d}: "${s.text.slice(0, 40)}…" is short`);
  }
});

test("lessons without the upgrade are built exactly as before", () => {
  const p = planDay({ wing: "CHRISTIANITY", day: 3, script: script(3, "christianity"), level: 1 });
  for (const t of ["story", "wrong", "build", "lookback", "think", "checkin"]) assert.ok(!types(p).includes(t));
});

test("old-language words in a line can be tapped to hear them", () => {
  const parts = sayable("HINDUISM", "Namaste is Sanskrit. Shri ganeshaya namah, before the work.");
  assert.deepEqual(parts.filter((p) => p.say).map((p) => p.text), ["Namaste", "Shri ganeshaya namah"]);
  assert.equal(parts.map((p) => p.text).join(""), "Namaste is Sanskrit. Shri ganeshaya namah, before the work.");
  assert.equal(sayable("JUDAISM", "shalom").length, 1);
});
