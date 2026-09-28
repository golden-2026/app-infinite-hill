import test from "node:test";
import assert from "node:assert/strict";
import { deeperRound, knownSoFar, planDay, rushStep, syllables, wrongAnswers } from "../src/index.js";

test("syllables keep sh/bh-style sounds together", () => {
  assert.deepEqual(syllables("Ganesha"), ["ga", "ne", "sha"]);
  assert.deepEqual(syllables("bhakti"), ["bhak", "ti"]);
  assert.deepEqual(syllables("om"), ["om"]);
});

test("higher levels pick wrong answers that look like the right one", () => {
  const pool = ["puja", "pujari", "pushpa", "Brahman", "satsang", "moksha", "ahimsa"];
  const close = wrongAnswers("puja", pool, { n: 2, level: 4, seed: 1 });
  assert.ok(close.includes("pujari") && close.includes("pushpa"), close.join(","));
  assert.ok(!close.includes("puja"));
});

test("level 0 leaves a lesson exactly as it was", () => {
  const plain = planDay({ wing: "HINDUISM", day: 8 });
  const zero = planDay({ wing: "HINDUISM", day: 8, level: 0 });
  assert.deepEqual(zero.steps.map((s) => s.type), plain.steps.map((s) => s.type));
});

test("levels change the games: more choices, typing, dragging, the rhythm and the weekly quick round", () => {
  const low = planDay({ wing: "HINDUISM", day: 14, level: 1 }).steps;
  const high = planDay({ wing: "HINDUISM", day: 14, level: 4 }).steps;
  assert.equal(low.find((s) => s.type === "listen").options.length, 3);
  assert.ok(high.some((s) => s.type === "typeit"));
  assert.ok(!high.some((s) => s.type === "order") && high.some((s) => s.type === "scenes"));
  assert.ok(high.some((s) => s.type === "rhythm"));
  assert.ok(high.some((s) => s.type === "rush"), "day 14 is a week's end");
  assert.ok(!planDay({ wing: "HINDUISM", day: 13, level: 4 }).steps.some((s) => s.type === "rush"));
  const ids = high.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, "step ids stay unique");
  assert.equal(high.at(-1).type, "tally");
});

test("children keep the plain lesson", () => {
  const kid = planDay({ wing: "HINDUISM", day: 14, mode: "kid", level: 5 }).steps;
  assert.ok(!kid.some((s) => ["typeit", "rush", "rhythm", "scenes"].includes(s.type)));
});

test("the quick round and go-deeper use only words already met", () => {
  const known = new Set(knownSoFar("HINDUISM", 10).map((k) => k.word));
  const r = rushStep("HINDUISM", 10, 3, 5);
  assert.ok(r.pairs.every(([w]) => known.has(w)));
  const deep = deeperRound("HINDUISM", 10, 2);
  assert.equal(deep.at(-1).type, "tally");
  assert.ok(deep.some((s) => s.type === "typeit"));
});
