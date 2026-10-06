// The offline Guide (no AI key): it may only point at a lesson day when that day's own text covers the question.
import test from "node:test";
import assert from "node:assert/strict";
import { camp1, GUIDE_NO_MATCH, guideFallback, lessonCovers } from "../src/index.js";

const DOORS = ["HINDUISM", "CHRISTIANITY", "CATHOLIC", "ISLAM", "JUDAISM", "BUDDHISM", "SIKHISM", "SPIRITUAL"];

test("a lesson's word alone isn't enough, and the Gayatri now has its own day (3, since the week-one rebuild)", () => {
  const day3 = camp1("HINDUISM").find((d) => d.day === 3);
  assert.equal(day3.word, "Gayatri");
  assert.equal(lessonCovers(day3, "what is the meaning of the Gayatri mantra?"), true);
  assert.match(guideFallback("HINDUISM", "What is the meaning of the Gayatri mantra?"), /that's from day 3./);
  // a question about a word no lesson is named for still gets the honest no-match line
  assert.equal(guideFallback("HINDUISM", "what does mantra actually mean?"), GUIDE_NO_MATCH);
});

test("questions no lesson covers get the honest no-match line, never a day", () => {
  for (const q of ["Why do we observe a barsi / varshi shraddha?", "How is Satyanarayan katha performed?", "what does karma mean in daily life?"]) {
    const a = guideFallback("HINDUISM", q);
    assert.equal(a, GUIDE_NO_MATCH, q);
    assert.doesNotMatch(a, /day \d|no signal/i);
  }
  assert.match(GUIDE_NO_MATCH, /won't guess/);
});

test("every lesson word still answers the app's own chips, in every door", () => {
  for (const wing of DOORS) {
    for (const d of camp1(wing)) {
      for (const q of [`what does ${d.word} actually mean?`, `tell me the story behind ${d.word}`, `¿qué significa ${d.word} en realidad?`]) {
        const a = guideFallback(wing, q);
        assert.notEqual(a, GUIDE_NO_MATCH, `${wing} day ${d.day}: ${q}`);
        assert.match(a, /that's from day \d+\./, `${wing} day ${d.day}: ${q}`);
      }
    }
  }
});

test("a pointer only names a day whose text contains every real term of the question", () => {
  const a = guideFallback("HINDUISM", "why 108 beads in japa?");
  const day = Number(a.match(/that's from day (\d+)/)[1]);
  const text = JSON.stringify(camp1("HINDUISM").find((d) => d.day === day)).toLowerCase();
  for (const term of ["108", "bead", "japa"]) assert.ok(text.includes(term), term);
  // whole words only, as before: "amin" isn't found inside "examine"
  assert.equal(guideFallback("ISLAM", "examine"), GUIDE_NO_MATCH);
});
