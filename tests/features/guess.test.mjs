// "What do you think it means?" after week one: a script's own games.guess ([right, wrong, wrong]) wins over choices
// borrowed from other lines (owner, 2026-10-06: the borrowed ones read oddly). The validator checks its shape.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { planDay } from "../../packages/content/src/index.js";
import { checkScript } from "../../packages/content/src/lesson-script.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const script = () => JSON.parse(readFileSync(`${root}docs/curriculum/sikhism/scripts/y1/day-0139.json`, "utf8"));

test("a script's own guess choices are used, answer included", () => {
  const s = script();
  s.games.guess = ["the Sikh way, a path you walk", "a badge for the initiated", "the Punjabi language"];
  const g = planDay({ wing: "SIKHISM", day: 139, script: s, level: 2 }).steps.find((x) => x.type === "guess");
  assert.equal(g.answer, "the Sikh way, a path you walk");
  assert.deepEqual([...g.options].sort(), [...s.games.guess].sort());
});

test("the validator checks games.guess", () => {
  const s = script();
  s.games.guess = ["a", "a", "b"];
  assert.ok(checkScript(s).errors.some((e) => /repeated/.test(e)));
  s.games.guess = [s.carry, "one", "two"];
  assert.ok(checkScript(s).errors.some((e) => /differ from the carry/.test(e)));
  s.games.guess = ["the Sikh way", "a badge"];
  assert.ok(checkScript(s).errors.some((e) => /3 short strings/.test(e)));
});
