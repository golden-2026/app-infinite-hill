import test from "node:test";
import assert from "node:assert/strict";
import { deeperRound, knownSoFar, planDay, rushStep, syllables, tapRound, wrongAnswers } from "../src/index.js";

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

// The rhythm game split "sign of peace" into sig·nof·pea·ce and "kingdom" into ki·ngdom (atlas, 2026-09-30).
test("syllables stay inside their word and split sensibly", () => {
  assert.deepEqual(syllables("the sign of peace"), ["sign", "of", "peace"]);
  assert.deepEqual(syllables("kingdom"), ["king", "dom"]);
  assert.deepEqual(syllables("yawm ad-din"), ["yawm", "ad", "din"], "a hyphen is a word boundary too");
  assert.deepEqual(syllables("forgive"), ["for", "give"], "a final e after one consonant is silent");
  assert.deepEqual(syllables("grace"), ["grace"]);
  assert.deepEqual(syllables("mantra"), ["man", "tra"]);
  assert.deepEqual(syllables("Abraham"), ["a", "bra", "ham"]);
  assert.deepEqual(syllables("candles"), ["can", "dles"]);
  assert.deepEqual(syllables("walking"), ["walk", "ing"]);
  assert.deepEqual(syllables("tawhid"), ["taw", "hid"]);
  assert.deepEqual(syllables("Mary"), ["ma", "ry"]);
  assert.deepEqual(syllables("Teresa of Ávila"), ["te", "re", "sa", "of", "a", "vi", "la"], "accents fold, words stay apart");
  assert.deepEqual(syllables("isn't"), ["isn't"], "an apostrophe stays inside its word");
  assert.deepEqual(syllables("the Prophet ﷺ"), ["pro", "phet"]);
  for (const w of ["the Good Samaritan", "as-sirat al-mustaqim", "alhamdulillah", "the sign of peace"]) {
    assert.equal(syllables(w).join(""), w.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/^the /, "").replace(/[^a-z']/g, ""), `${w}: every letter kept, in order`);
  }
});

test("the rhythm never gets a one-tap round: a one-syllable word is tapped with its line", () => {
  for (const wing of ["HINDUISM", "CHRISTIANITY", "CATHOLIC", "JUDAISM", "ISLAM", "BUDDHISM", "SIKHISM", "SPIRITUAL"]) {
    for (let day = 3; day <= 60; day++) {
      const r = planDay({ wing, day, level: 2 }).steps.find((s) => s.type === "rhythm");
      if (r) assert.ok(r.syllables.length >= 2 && r.syllables.length <= 6, `${wing} ${day}: ${r.syllables.join("·")}`);
    }
  }
  const dhikr = planDay({ wing: "ISLAM", day: 17, level: 2 }).steps.find((s) => s.type === "rhythm");
  assert.ok(dhikr && dhikr.syllables[0] === "dhikr" && dhikr.syllables.length > 1);
});

test("tap what you hear: a short line still makes a round, and tiles keep their apostrophes", () => {
  // Islam day 10's line is one word ("one"): the round was a single tap
  const tap = planDay({ wing: "ISLAM", day: 10 }).steps.find((s) => s.type === "taphear");
  assert.equal(tap.speak, "tawhid, one");
  assert.deepEqual(tap.words, ["tawhid", "one"]);
  assert.equal(tap.answer, "tawhid one");
  assert.ok(tap.bank.length >= 5);
  for (const wing of ["HINDUISM", "CHRISTIANITY", "CATHOLIC", "JUDAISM", "ISLAM", "BUDDHISM", "SIKHISM", "SPIRITUAL"]) {
    for (let day = 1; day <= 30; day++) {
      for (const level of [0, 1, 3]) {
        const t = planDay({ wing, day, level }).steps.find((s) => s.type === "taphear");
        if (!t) continue;
        assert.ok(t.words.length >= 2, `${wing} ${day}: at least two taps`);
        for (const w of t.words) assert.ok(t.bank.includes(w), `${wing} ${day}: ${w} is in the bank`);
        for (const b of t.bank) assert.doesNotMatch(b, /^\w+ \w$|^[^\p{L}\p{N}]|[^\p{L}\p{N}]$/u, `${wing} ${day}: tile "${b}" is a clean word`);
        const extra = [...t.bank]; for (const w of t.words) extra.splice(extra.indexOf(w), 1);
        const keys = extra.map((b) => b.toLowerCase().replace(/'/g, ""));
        assert.equal(new Set(keys).size, keys.length, `${wing} ${day}: no repeated wrong tiles`);
        for (const k of keys) assert.ok(!t.words.some((w) => w.toLowerCase().replace(/'/g, "") === k), `${wing} ${day}: a wrong tile "${k}" is also in the line`);
      }
    }
  }
  const r = tapRound({ word: "x", carry: "it isn't far, is it?", wing: "SPIRITUAL" });
  assert.ok(r.words.includes("isn't"));
  assert.equal(r.answer, "it isnt far is it");
});
