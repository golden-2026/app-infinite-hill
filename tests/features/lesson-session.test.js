import test from "node:test";
import assert from "node:assert/strict";
import { createLessonSession, getLessonResumeRecord, lessonSessionReducer } from "../../src/features/lesson-session.js";

const lesson = (overrides = {}) => ({
  id: "HIN-Y1-C1-D001", door: "HINDUISM", lesson: 1, contentRevision: "rev-1",
  canPreview: true, authored: true, status: "scripted", ...overrides,
});
const reduce = (state, action) => lessonSessionReducer(state, action);

test("lesson loads only after identity and saved position resolve, then resumes exact beat and exercise", () => {
  const loading = createLessonSession({ door: "HINDUISM", lesson: 1 });
  assert.equal(loading.status, "loading");
  const ready = reduce(loading, {
    type: "LOAD_SUCCESS", lesson: lesson(), audio: { recorded: true, houseVoice: true },
    savedProgress: { sessionId: "HIN-Y1-C1-D001", door: "HINDUISM", lesson: 1, contentRevision: "rev-1", position: { beatIndex: 4, exerciseIndex: 2 } },
  });
  assert.equal(ready.status, "ready");
  assert.deepEqual(ready.position, { beatIndex: 4, exerciseIndex: 2 });
  assert.equal(ready.audio.mode, "recorded");
  assert.deepEqual(getLessonResumeRecord(ready), {
    sessionId: "HIN-Y1-C1-D001", door: "HINDUISM", lesson: 1, contentRevision: "rev-1",
    position: { beatIndex: 4, exerciseIndex: 2 }, progressRevision: 0,
  });
});

test("loading rejects mismatched identity and designed sessions without pretending they are playable", () => {
  const state = createLessonSession({ door: "HINDUISM", lesson: 1 });
  assert.equal(reduce(state, { type: "LOAD_SUCCESS", lesson: lesson({ door: "ISLAM" }) }).status, "unavailable");
  const designed = reduce(state, { type: "LOAD_SUCCESS", lesson: lesson({ status: "designed", authored: false, canPreview: false }) });
  assert.equal(designed.status, "unavailable");
  assert.equal(designed.error, "lesson-not-authored");
  assert.equal(reduce(state, { type: "LOAD_FAILURE" }).error, "lesson-load-failed");
});

test("revision mismatch prevents replaying a stale position until explicitly acknowledged", () => {
  const loaded = reduce(createLessonSession({ door: "HINDUISM", lesson: 1 }), {
    type: "LOAD_SUCCESS", lesson: lesson({ contentRevision: "rev-2" }), audio: {},
    savedProgress: { sessionId: "HIN-Y1-C1-D001", door: "HINDUISM", lesson: 1, contentRevision: "rev-1", position: { beatIndex: 5, exerciseIndex: 1 } },
  });
  assert.deepEqual(loaded.position, { beatIndex: 0, exerciseIndex: 0 });
  assert.deepEqual(loaded.contentRevisionMismatch, { savedRevision: "rev-1", currentRevision: "rev-2" });
  assert.equal(reduce(loaded, { type: "SET_POSITION", position: { beatIndex: 2, exerciseIndex: 0 } }), loaded);
  const acknowledged = reduce(loaded, { type: "ACK_CONTENT_REVISION", currentRevision: "rev-2" });
  assert.equal(acknowledged.contentRevisionMismatch, null);
  assert.deepEqual(acknowledged.position, { beatIndex: 0, exerciseIndex: 0 });
});

test("app background pauses playback and timer; foreground waits for deliberate resume", () => {
  let state = reduce(createLessonSession({ door: "HINDUISM", lesson: 1 }), { type: "LOAD_SUCCESS", lesson: lesson(), audio: { recorded: true } });
  state = reduce(state, { type: "START_PLAYBACK" });
  state = reduce(state, { type: "START_TIMER" });
  state = reduce(state, { type: "APP_BACKGROUND" });
  assert.deepEqual(state.playback, { status: "paused", interrupted: true });
  assert.deepEqual(state.timer, { status: "paused", interrupted: true });
  state = reduce(state, { type: "APP_FOREGROUND" });
  assert.equal(state.appState, "active");
  assert.equal(state.playback.status, "paused");
  assert.equal(state.timer.status, "paused");
  state = reduce(state, { type: "START_PLAYBACK" });
  assert.deepEqual(state.playback, { status: "playing", interrupted: false });
});

test("missing or failed audio falls back honestly and permits transcript or silent continuation", () => {
  let state = reduce(createLessonSession({ door: "HINDUISM", lesson: 1 }), { type: "LOAD_SUCCESS", lesson: lesson(), audio: {} });
  assert.equal(state.audio.mode, "transcript");
  assert.equal(state.audio.fallback, true);
  state = reduce(state, { type: "SELECT_AUDIO", mode: "silent" });
  assert.equal(state.audio.status, "unavailable");
  assert.equal(state.audio.mode, "silent");

  state = reduce(createLessonSession({ door: "HINDUISM", lesson: 1 }), { type: "LOAD_SUCCESS", lesson: lesson(), audio: { recorded: true, houseVoice: true } });
  state = reduce(state, { type: "AUDIO_FAILED", mode: "recorded" });
  assert.equal(state.audio.mode, "house-voice");
  assert.equal(state.audio.reason, "playback-failed");
  assert.equal(state.audio.canRetry, true);
  state = reduce(state, { type: "AUDIO_RETRY" });
  assert.equal(state.audio.status, "pending");
  assert.equal(state.audio.mode, "recorded");
  state = reduce(state, { type: "AUDIO_READY", mode: "recorded" });
  assert.equal(state.audio.status, "ready");
  assert.equal(state.audio.mode, "recorded");
});

test("save failures retain the latest local progress and retries are revision scoped", () => {
  let state = reduce(createLessonSession({ door: "HINDUISM", lesson: 1 }), { type: "LOAD_SUCCESS", lesson: lesson(), audio: {} });
  state = reduce(state, { type: "SET_POSITION", position: { beatIndex: 1, exerciseIndex: 0 } });
  const firstRevision = state.save.pendingRevision;
  state = reduce(state, { type: "SAVE_STARTED", revision: firstRevision });
  state = reduce(state, { type: "SAVE_FAILED", revision: firstRevision });
  assert.equal(state.save.status, "failed");
  assert.deepEqual(state.position, { beatIndex: 1, exerciseIndex: 0 });
  state = reduce(state, { type: "SET_EXERCISE", exerciseIndex: 3 });
  const latestRevision = state.save.pendingRevision;
  assert.ok(latestRevision > firstRevision);
  state = reduce(state, { type: "RETRY_SAVE" });
  assert.equal(state.save.status, "saving");
  state = reduce(state, { type: "SAVE_SUCCEEDED", revision: firstRevision });
  assert.equal(state.save.status, "pending");
  assert.equal(state.save.pendingRevision, latestRevision);
  state = reduce(state, { type: "SAVE_STARTED", revision: latestRevision });
  state = reduce(state, { type: "SAVE_SUCCEEDED", revision: latestRevision });
  assert.equal(state.save.status, "saved");
  assert.equal(state.save.persistedRevision, latestRevision);
  assert.equal(state.save.pendingRevision, null);
});

test("load and position actions leave input objects unchanged and invalid positions normalize safely", () => {
  const input = { beatIndex: -2, exerciseIndex: 1.5 };
  const state = reduce(createLessonSession({ door: "HINDUISM", lesson: 1 }), { type: "LOAD_SUCCESS", lesson: lesson(), audio: {}, savedProgress: { sessionId: "HIN-Y1-C1-D001", door: "HINDUISM", lesson: 1, contentRevision: "rev-1", position: input } });
  assert.deepEqual(state.position, { beatIndex: 0, exerciseIndex: 0 });
  assert.deepEqual(input, { beatIndex: -2, exerciseIndex: 1.5 });
});
