// "Your year on the hill" (apps/app/src/lib/year.ts), loaded straight from the app's TypeScript: the recap's numbers
// from the sit log, timed minutes with honest estimates, words learned, the book, quests, and "how well you know
// your door".
import test from "node:test";
import assert from "node:assert/strict";

const { yearRecap, minutesLearned, addMinutes, hoursWords, EST_LESSON_MIN, MAX_LESSON_MIN } = await import(new URL("../../apps/app/src/lib/year.ts", import.meta.url).href);

let n = 0;
const sit = (date, door = "HINDUISM", day = 1, kidId = null) => ({ id: `sit_t${++n}`, date, door, day, kidId });
const WORDS = { "HINDUISM:1": "namaste", "HINDUISM:2": "dharma", "HINDUISM:3": "karma", "ISLAM:1": "salaam" };
const wordOf = (door, day) => WORDS[`${door}:${day}`];

test("minutes: timed where timed, estimated at 5 min otherwise, one lesson capped", () => {
  let t = addMinutes(undefined, "2026-09-01", 4);
  t = addMinutes(t, "2026-09-01", 6);
  t = addMinutes(t, "2026-09-02", 300); // a phone left open
  assert.deepEqual(t["2026-09-01"], { m: 10, n: 2 });
  assert.deepEqual(t["2026-09-02"], { m: MAX_LESSON_MIN, n: 1 });
  const sits = [sit("2026-09-01"), sit("2026-09-01"), sit("2026-09-02"), sit("2026-08-01"), sit("2026-08-02")];
  const m = minutesLearned(sits, t);
  assert.equal(m.timedLessons, 3);
  assert.equal(m.estimatedLessons, 2);
  assert.equal(m.minutes, 10 + MAX_LESSON_MIN + 2 * EST_LESSON_MIN);
  assert.equal(hoursWords(45), "45 minutes");
  assert.equal(hoursWords(60), "1 hour");
  assert.equal(hoursWords(210), "3.5 hours");
});

test("the recap: days, lessons, unique words, kept lines, quests; kids' days and anything older than a year left out", () => {
  const today = "2026-09-30";
  const sits = [
    sit("2026-09-28", "HINDUISM", 1), sit("2026-09-29", "HINDUISM", 2), sit("2026-09-29", "ISLAM", 1),
    sit("2026-09-30", "HINDUISM", 2), // a repeat: same word
    sit("2026-09-30", "HINDUISM", 3, "kid_1"), // a child's lesson: not yours
    sit("2025-09-30", "HINDUISM", 3), // 366 days ago: outside the year
  ];
  const r = yearRecap({
    sits, today, longest: 3, friends: 2, wordOf,
    book: [{ date: "2026-09-29" }, { date: "2025-01-01" }],
    questsDone: [{ on: "2026-04-14" }, { on: "2025-04-14" }],
    home: "HINDUISM", campWords: [{ day: 1, word: "namaste" }, { day: 2, word: "dharma" }, { day: 3, word: "karma" }],
  });
  assert.equal(r.days, 3);
  assert.equal(r.lessons, 4);
  assert.equal(r.words, 3); // namaste, dharma, salaam
  assert.deepEqual(r.wordList.sort(), ["dharma", "namaste", "salaam"]);
  assert.equal(r.kept, 1);
  assert.equal(r.quests, 1);
  assert.equal(r.longest, 3);
  assert.equal(r.friends, 2);
  assert.equal(r.from, "2026-09-28");
  assert.equal(r.minutes, 4 * EST_LESSON_MIN); // nothing timed: all estimated
  assert.equal(r.estimatedLessons, 4);
  assert.deepEqual(r.doorWords, { known: 2, of: 3 });
});

test("an empty year is all zeros, never an error", () => {
  const r = yearRecap({ sits: [], today: "2026-09-30", longest: 0, friends: 0, wordOf });
  assert.equal(r.days, 0);
  assert.equal(r.minutes, 0);
  assert.equal(r.doorWords, null);
});
