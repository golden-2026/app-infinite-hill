// The missed-words review (apps/app/src/lib/missed.ts), loaded straight from the app's TypeScript: a word that slips
// comes back tomorrow, then 3, 7 and 14 days apart while it keeps coming back right; a wrong answer starts it again.
import test from "node:test";
import assert from "node:assert/strict";

const { INTERVALS, addDays, cleanCards, dueCards, noteRecall, noteSlips, slipsFor } = await import(new URL("../../apps/app/src/lib/missed.ts", import.meta.url).href);

const D = "ISLAM";
const slip = { word: "tawhid", carry: "one", day: 10 };

test("intervals are 1, 3, 7, 14 days", () => {
  assert.deepEqual([...INTERVALS], [1, 3, 7, 14]);
  assert.equal(addDays("2026-09-30", 1), "2026-10-01");
  assert.equal(addDays("2026-12-31", 14), "2027-01-14");
});

test("a slip is due tomorrow, not today", () => {
  const cards = noteSlips([], D, [slip], "2026-09-30");
  assert.equal(cards.length, 1);
  assert.equal(cards[0].due, "2026-10-01");
  assert.equal(cards[0].box, 0);
  assert.deepEqual(dueCards(cards, D, "2026-09-30"), []);
  assert.equal(dueCards(cards, D, "2026-10-01")[0].word, "tawhid");
  assert.deepEqual(dueCards(cards, "HINDUISM", "2026-10-01"), [], "another door's words stay on that door");
});

test("right moves it further out (1 → 3 → 7 → 14 → done); wrong starts again tomorrow", () => {
  let cards = noteSlips([], D, [slip], "2026-09-30");
  let day = "2026-10-01";
  for (const gap of [3, 7, 14]) {
    cards = noteRecall(cards, D, [{ word: "tawhid", ok: true }], day);
    assert.equal(cards[0].due, addDays(day, gap));
    day = cards[0].due;
  }
  cards = noteRecall(cards, D, [{ word: "tawhid", ok: true }], day);
  assert.deepEqual(cards, [], "after the last interval, it's done");

  cards = noteSlips([], D, [slip], "2026-09-30");
  cards = noteRecall(cards, D, [{ word: "tawhid", ok: true }], "2026-10-01");
  cards = noteRecall(cards, D, [{ word: "tawhid", ok: false }], "2026-10-04");
  assert.equal(cards[0].box, 0);
  assert.equal(cards[0].due, "2026-10-05");
  assert.equal(cards[0].misses, 2);
});

test("slipping again resets the word; one card per word per door", () => {
  let cards = noteSlips([], D, [slip], "2026-09-30");
  cards = noteRecall(cards, D, [{ word: "tawhid", ok: true }], "2026-10-01");
  cards = noteSlips(cards, D, [{ ...slip, word: "Tawhid" }], "2026-10-02");
  assert.equal(cards.length, 1);
  assert.equal(cards[0].due, "2026-10-03");
  assert.equal(cards[0].box, 0);
});

test("due order: soonest first, at most n, never a skipped word", () => {
  let cards = noteSlips([], D, [slip, { word: "salat", carry: "the body prays too", day: 14 }, { word: "wudu", carry: "rinse the day off", day: 13 }], "2026-09-28");
  cards = noteSlips(cards, D, [{ word: "wudu", carry: "rinse the day off", day: 13 }], "2026-09-29");
  const due = dueCards(cards, D, "2026-10-01", { n: 2, skip: ["salat"] });
  assert.deepEqual(due.map((c) => c.word), ["tawhid", "wudu"]);
});

test("saved lists are cleaned, and a long list stays small", () => {
  assert.deepEqual(cleanCards(null), []);
  assert.deepEqual(cleanCards([{ door: D }, null, { door: D, word: "x", carry: "y", due: "soon" }]), []);
  const many = noteSlips([], D, Array.from({ length: 120 }, (_, k) => ({ word: `w${k}`, carry: "c", day: 1 })), "2026-09-30");
  assert.ok(many.length <= 80);
});

test("which words a missed step was about", () => {
  assert.deepEqual(slipsFor({ type: "listen", answer: "rahma" }, "tawhid"), ["rahma"]);
  assert.deepEqual(slipsFor({ type: "typeit", answer: "rahma" }, "tawhid"), ["rahma"]);
  assert.deepEqual(slipsFor({ type: "taphear" }, "tawhid"), ["tawhid"]);
  assert.deepEqual(slipsFor({ type: "match" }, "tawhid", ["wudu"]), ["wudu"]);
  assert.deepEqual(slipsFor({ type: "rhythm" }, "tawhid"), [], "the rhythm is timing, not a word");
});
