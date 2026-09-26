import test from "node:test";
import assert from "node:assert/strict";
import { advanceLesson, completeLesson, completeReview, derivePathProgress, deriveReviewState, deriveStrand, dueReviews, lessonPosition, normalizeProgression, recordReview, setProgressGoal } from "../../src/features/progression.js";

test("normalization preserves legacy progress and adds safe progression defaults", () => {
  const state = normalizeProgression({ homeWing: "BUDDHISM", showedUp: 4, paths: { BUDDHISM: { day: 8, done: true } }, offsets: { BUDDHISM: 2 } });
  assert.equal(state.homeWing, "BUDDHISM");
  assert.equal(state.showedUp, 4);
  assert.equal(lessonPosition(state, "BUDDHISM"), 10);
  assert.equal(state.goal, 7);
});

test("home and visiting doors advance independently", () => {
  let state = { homeWing: "HINDUISM", visitWing: "BUDDHISM", paths: { HINDUISM: { day: 4, done: true }, BUDDHISM: { day: 9, done: true } } };
  state = advanceLesson(state, "BUDDHISM");
  assert.equal(lessonPosition(state, "HINDUISM"), 4);
  assert.equal(lessonPosition(state, "BUDDHISM"), 10);
  assert.equal(state.paths.HINDUISM.done, true);
  assert.equal(state.paths.BUDDHISM.done, false);
});

test("completing home and visit on one local date credits one showed-up day", () => {
  let state = completeLesson({}, { door: "HINDUISM", lesson: 1, date: "2026-09-13", word: "dharma" });
  state = completeLesson(state, { door: "BUDDHISM", lesson: 3, date: "2026-09-13", word: "sati" });
  assert.equal(state.showedUp, 1);
  assert.equal(state.lastCompletedDate, "2026-09-13");
  assert.equal(state.completionHistory.length, 2);
  assert.deepEqual(state.reviews.map((item) => item.id), ["HINDUISM:1", "BUDDHISM:3"]);
  const tomorrow = completeLesson(state, { door: "HINDUISM", lesson: 2, date: "2026-09-14" });
  assert.equal(tomorrow.showedUp, 2);
});

test("replaying a completed lesson updates its record without duplicating history or credit", () => {
  const first = completeLesson({}, { door: "SIKHISM", lesson: 1, date: "2026-09-13", word: "seva" });
  const replay = completeLesson(first, { door: "SIKHISM", lesson: 1, date: "2026-09-13", word: "seva", carry: "serve with love" });
  assert.equal(replay.showedUp, 1);
  assert.equal(replay.completionHistory.length, 1);
  assert.equal(replay.completionHistory[0].carry, "serve with love");
});

test("goals are restricted to the three product choices", () => {
  for (const goal of [7, 21, 100]) assert.equal(setProgressGoal({}, goal).goal, goal);
  assert.throws(() => setProgressGoal({}, 30), /goal must be/);
});

test("due reviews are deterministic, capped, and rescheduled from the local date", () => {
  let state = {};
  for (const [door, lesson, word] of [["Z", 2, "z"], ["A", 3, "a3"], ["A", 1, "a1"], ["B", 1, "b" ]]) {
    state = completeLesson(state, { door, lesson, date: "2026-09-01", word });
  }
  assert.deepEqual(dueReviews(state, "2026-09-02").map((item) => item.id), ["A:1", "A:3", "B:1"]);
  state = recordReview(state, { id: "A:1", date: "2026-09-02", remembered: true });
  assert.equal(dueReviews(state, "2026-09-02").some((item) => item.id === "A:1"), false);
  assert.equal(dueReviews(state, "2026-09-05", 10).find((item) => item.id === "A:1").dueDate, "2026-09-05");
  state = recordReview(state, { id: "A:1", date: "2026-09-05", remembered: false });
  assert.equal(dueReviews(state, "2026-09-06", 10).find((item) => item.id === "A:1").reviewCount, 0);
});

test("path progress derives completed stops and camp arrival from saved history", () => {
  const firstPath = derivePathProgress({}, "HINDUISM");
  assert.equal(firstPath.camps[0].arrived, true);
  assert.equal(firstPath.camps[1].state, "locked");
  const state = completeLesson({}, { door: "HINDUISM", lesson: 1, date: "2026-09-13", word: "namaste" });
  const path = derivePathProgress(state, "HINDUISM");
  assert.equal(path.completedCount, 1);
  assert.equal(path.currentLesson, 2);
  assert.equal(path.stops.find((item) => item.lesson === 1).state, "completed");
  assert.equal(path.stops.find((item) => item.lesson === 2).state, "current");
  assert.equal(path.stops.find((item) => item.lesson === 22).state, "locked");
  assert.equal(path.camps[0].state, "in-progress");

  let completedCamp = {};
  for (let lesson = 1; lesson <= 21; lesson += 1) {
    completedCamp = completeLesson(completedCamp, { door: "HINDUISM", lesson, date: "2026-09-13" });
  }
  const nextPath = derivePathProgress(completedCamp, "HINDUISM");
  assert.equal(nextPath.camps[0].complete, true);
  assert.equal(nextPath.camps[1].arrived, true);
  assert.equal(nextPath.camps[1].nextSession.lesson, 22);
});

test("strand contains only completed history words and preserves earned order", () => {
  const state = completeLesson({}, { door: "HINDUISM", lesson: 1, date: "2026-09-13", word: "namaste", carry: "light to light" });
  const withSecond = completeLesson(state, { door: "BUDDHISM", lesson: 1, date: "2026-09-14", word: "metta" });
  const strand = deriveStrand(withSecond);
  assert.deepEqual(strand.map((item) => [item.door, item.word]), [["HINDUISM", "namaste"], ["BUDDHISM", "metta"]]);
  assert.equal(strand[0].carry, "light to light");
  assert.deepEqual(deriveStrand({ completionHistory: [{ door: "HINDUISM", lesson: 1, date: "2026-09-13" }] }), []);
});

test("review state is due or empty from the saved schedule and reports its next date", () => {
  let state = completeLesson({}, { door: "HINDUISM", lesson: 1, date: "2026-09-01", word: "namaste" });
  assert.equal(deriveReviewState(state, "2026-09-01").status, "empty");
  assert.equal(deriveReviewState(state, "2026-09-01").nextDate, "2026-09-02");
  const due = deriveReviewState(state, "2026-09-02");
  assert.equal(due.status, "due");
  assert.equal(due.cards[0].id, "HINDUISM:1");
  assert.equal(due.cards[0].word, "namaste");
});

test("review completion persists answer quality and returns the resulting schedule", () => {
  const state = completeLesson({}, { door: "HINDUISM", lesson: 1, date: "2026-09-01", word: "namaste" });
  const review = completeReview(state, { date: "2026-09-02", answers: [{ id: "HINDUISM:1", remembered: true }] });
  assert.equal(review.result.remembered, 1);
  assert.equal(review.result.total, 1);
  assert.equal(review.result.items[0].dueDate, "2026-09-05");
  assert.equal(review.state.reviews[0].reviewCount, 1);
  assert.equal(deriveReviewState(review.state, "2026-09-02").status, "empty");
  assert.throws(() => completeReview(state, { date: "2026-09-02", answers: [{ id: "unknown", remembered: true }] }), /only due review cards/);
});
