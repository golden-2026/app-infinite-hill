// The kids' track: every door's file parses and passes the format check, the bundled copy is in step with the files,
// and a child's lesson is built only from the kids' set (never from the grown-up path's text).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DOOR_KEYS } from "../src/lesson-script.js";
import { KIDS_PER_DOOR, KID_BREATHS, KID_DOORS, checkKids, compileKids, kidLesson, kidLessonIndex, kidPlan } from "../src/kids.js";
import { data, planDay } from "../src/index.js";
import KIDS from "../generated/kids.js";

const file = (door) => JSON.parse(readFileSync(new URL(`../kids/${door.toLowerCase()}.json`, import.meta.url), "utf8"));
const KID_STEP_TYPES = new Set(["bell", "beat", "order", "match", "myth", "breath", "tally"]);

test("every door has a kids' file that parses and passes the check, with 21 lessons in both languages", () => {
  for (const door of DOOR_KEYS) {
    const f = file(door);
    const { errors } = checkKids(f, door);
    assert.deepEqual(errors, [], `${door}: ${errors.slice(0, 5).join(" | ")}`);
    assert.equal(f.lessons.length, KIDS_PER_DOOR);
    assert.equal(f.review.status, "pending", `${door}: nothing is Keeper-approved yet`);
    for (const L of f.lessons) for (const lang of ["en", "es"]) assert.equal(L[lang].story.length, 4, `${door} ${L.day} ${lang}`);
  }
});

test("the bundled kids' set is exactly the files, without review notes", () => {
  assert.deepEqual([...KID_DOORS].sort(), [...DOOR_KEYS].sort());
  for (const door of DOOR_KEYS) {
    assert.deepEqual(KIDS[door], JSON.parse(JSON.stringify(compileKids(file(door)))), `${door}: run node packages/content/scripts/build-kids.mjs`);
    assert.ok(!JSON.stringify(KIDS[door]).includes('"notes"'), `${door}: review notes never ship`);
    assert.ok(!("review" in KIDS[door]));
  }
});

test("a child's day maps onto the set, and starts it again after day 21", () => {
  assert.equal(kidLessonIndex(1), 1);
  assert.equal(kidLessonIndex(21), 21);
  assert.equal(kidLessonIndex(22), 1);
  assert.equal(kidLessonIndex(43), 1);
  assert.equal(kidLessonIndex(0), 1);
  assert.equal(kidLesson("HINDUISM", 22).key, kidLesson("HINDUISM", 1).key);
  assert.equal(kidLesson("NOPE", 1), null);
  assert.equal(kidPlan({ door: "NOPE", day: 1 }), null);
});

// Every line of the grown-up path a child could have heard before (camp one's segments, the day-one welcomes and the
// built lesson text), to prove none of it reaches a kids' lesson.
function adultLines() {
  const lines = new Set();
  const add = (s) => { const x = String(s || "").trim(); if (x.length >= 24) lines.add(x); };
  for (const door of DOOR_KEYS) {
    for (let day = 1; day <= 21; day++) {
      for (const mode of ["adult", "kid"]) for (const s of planDay({ wing: door, day, mode }).steps) { add(s.text); add(s.prompt); }
    }
    add(data.WELCOME?.[door]);
  }
  return lines;
}
const ADULT_PHRASES = /follower count|mid-scroll|\b1 ?am\b|\b2 ?am\b|yoga class|together tab|community and events|the guide\b|celebrit|group chat/i;

test("kid mode never serves the grown-up lesson: every step comes from the kids' set, in English and Spanish", () => {
  const adult = adultLines();
  assert.ok(adult.size > 500, `${adult.size} grown-up lines collected`);
  for (const door of DOOR_KEYS) {
    for (let day = 1; day <= 42; day++) {
      for (const lang of ["en", "es"]) {
        const p = kidPlan({ door, day, lang });
        const L = kidLesson(door, day)[lang];
        assert.ok(p, `${door} ${day}`);
        assert.equal(p.info, null, "no grown-up lesson info rides along");
        assert.equal(p.word, L.word);
        for (const s of p.steps) {
          assert.ok(KID_STEP_TYPES.has(s.type), `${door} ${day}: no grown-up step type (${s.type})`);
          for (const k of ["text", "prompt"]) {
            if (typeof s[k] !== "string") continue;
            assert.ok(!adult.has(s[k].trim()), `${door} ${day} ${lang}: grown-up text in a kids' lesson: ${s[k].slice(0, 60)}`);
            assert.ok(!ADULT_PHRASES.test(s[k]), `${door} ${day} ${lang}: ${s[k].match(ADULT_PHRASES)?.[0]}`);
          }
        }
        // the story's four beats, in order, then the order game built from their heads
        const beats = p.steps.filter((s) => s.type === "beat" && s.seg === "the story").map((s) => s.text);
        assert.deepEqual(beats, L.story.map((b) => b.text));
        assert.deepEqual(p.steps.find((s) => s.type === "order").items, L.story.map((b) => b.head));
        assert.equal(p.steps.filter((s) => s.type === "match" || s.type === "myth").length, 1, "one game besides the order");
        assert.equal(p.steps.find((s) => s.type === "breath").n, KID_BREATHS);
        assert.equal(p.steps.at(-1).type, "tally");
        assert.ok(p.kid.grownups.source && /\?$/.test(p.kid.grownups.ask.trim()), "the grown-ups' note");
      }
    }
  }
});

test("the Spanish lesson is the Spanish text, with the same answers", () => {
  for (const door of DOOR_KEYS) {
    for (let day = 1; day <= 21; day++) {
      const en = kidPlan({ door, day, lang: "en" });
      const es = kidPlan({ door, day, lang: "es" });
      assert.equal(en.steps.length, es.steps.length);
      assert.notEqual(en.steps.find((s) => s.type === "beat").text, es.steps.find((s) => s.type === "beat").text, `${door} ${day}: es is translated`);
      const myth = (p) => p.steps.find((s) => s.type === "myth");
      if (myth(en)) assert.deepEqual(myth(en).items.map((x) => x[1]), myth(es).items.map((x) => x[1]));
    }
  }
});

test("the labels around the story come from the caller (the app's t()), and the templates are filled", () => {
  const p = kidPlan({ door: "HINDUISM", day: 1, lang: "en", labels: { bell: "story 1", word: "today's word: {word}. {means}.", carry: "your line: {carry}. try it today.", order: "ORDER" } });
  assert.equal(p.steps[0].text, "story 1");
  assert.equal(p.steps.find((s) => s.type === "order").prompt, "ORDER");
  const word = p.steps.find((s) => s.seg === "the word").text;
  assert.ok(word.startsWith(`today's word: ${p.word}.`) && !word.includes("{"), word);
  assert.ok(!p.steps.find((s) => s.seg === "the carry").text.includes("{"));
});
