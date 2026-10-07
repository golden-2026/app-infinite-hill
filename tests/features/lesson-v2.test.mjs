// The new lesson recipe (owner, 2026-10-07): a script with games.chat gets teaching broken up by questions, a "new word"
// opener, complete-the-chat, old words in the pairs, a challenge finale. Every other script is built as before.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { planDay, isV2, glossIn } from "../../packages/content/src/index.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (p) => JSON.parse(readFileSync(`${root}docs/curriculum/${p}`, "utf8"));

test("Hindu day 30 is built in the new order", () => {
  const script = read("hinduism/scripts/y1/day-0030.json");
  assert.ok(isV2(script));
  const { steps } = planDay({ wing: "HINDUISM", day: 30, mode: "adult", script });
  const types = steps.map((s) => s.type);
  const at = (t) => types.indexOf(t);
  assert.equal(types[0], "bell");
  assert.equal(types.at(-1), "tally");
  assert.equal(steps[at("guess")].tag, "newWord");
  assert.ok(at("guess") < at("chat") && at("chat") < at("match") && at("match") < at("taphear"));
  assert.equal(steps[at("taphear")].tag, "challenge");
  const chat = steps[at("chat")];
  assert.ok(chat.graded && chat.options.includes(chat.answer));
  assert.ok(steps[at("match")].review.includes("prasad"));
  assert.ok(steps.some((s) => s.type === "beat" && s.gloss && s.gloss.Hanuman));
  assert.equal(new Set(steps.map((s) => s.id)).size, steps.length, "ids are unique");
});

test("a script without games.chat is untouched", () => {
  const script = read("hinduism/scripts/y1/day-0010.json");
  assert.ok(!isV2(script));
  assert.ok(!planDay({ wing: "HINDUISM", day: 10, mode: "adult", script }).steps.some((s) => s.type === "chat"));
});

test("glossIn matches whole words only", () => {
  const g = { Lanka: { meaning: "an island" } };
  assert.ok(glossIn(g, "He leapt to Lanka."));
  assert.equal(glossIn(g, "Lankan shores"), null);
  assert.ok(glossIn({ "taṇhā": { meaning: "craving" } }, "the Pali is taṇhā."));
});
