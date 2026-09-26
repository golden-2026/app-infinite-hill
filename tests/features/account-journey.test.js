import test from "node:test";
import assert from "node:assert/strict";
import { accountJourneyReducer, compareProgressCopies, createAccountJourneyState, mergeProgressSnapshots, summarizeGuestProgress } from "../../src/features/account-journey.js";

const snapshot = (state, exportedAt = "2026-09-13T10:00:00.000Z") => ({
  schemaVersion: 1,
  account: { userId: "anon_" + "a".repeat(64), createdAt: "2026-09-01T00:00:00.000Z", profile: { displayName: null, email: null } },
  appState: { version: 1, state },
  exportedAt,
});

test("guest conversion review summarizes attached progress without exposing selected Doors or practice text", () => {
  const input = snapshot({
    homeWing: "SIKHISM",
    paths: { SIKHISM: { day: 8, done: true } },
    showedUp: 5,
    showedUpDates: ["2026-09-01", "2026-09-02"],
    completionHistory: [{ id: "secret", door: "SIKHISM", lesson: 3, date: "2026-09-02", word: "private-word" }],
  });
  const summary = summarizeGuestProgress(input);
  assert.deepEqual(summary, { hasProgress: true, completedDays: 5, completedLessons: 1, activePaths: 1, categories: ["learning progress and practice history"] });
  let state = accountJourneyReducer(createAccountJourneyState(), { type: "GUEST_CONVERSION_REVIEWED", snapshot: input });
  assert.equal(state.guestConversion.status, "review");
  assert.equal(JSON.stringify(state).includes("SIKHISM"), false);
  assert.equal(JSON.stringify(state).includes("private-word"), false);
  state = accountJourneyReducer(state, { type: "GUEST_CONVERSION_REQUESTED", emailProvided: true });
  assert.equal(state.guestConversion.status, "requested");
  assert.equal(accountJourneyReducer(state, { type: "GUEST_CONVERSION_CONFIRMED" }).guestConversion.status, "converted");
});

test("email link outcomes require an explicit provider event and never retain the link token", () => {
  let state = accountJourneyReducer(createAccountJourneyState(), { type: "EMAIL_LINK_REQUESTED", flow: "signup-verification", emailProvided: true });
  assert.equal(state.emailLink.status, "requesting");
  state = accountJourneyReducer(state, { type: "EMAIL_LINK_VERIFIED" });
  assert.equal(state.emailLink.status, "verified");
  state = accountJourneyReducer(state, { type: "EMAIL_LINK_REQUESTED", flow: "signup-verification", emailProvided: true });
  state = accountJourneyReducer(state, { type: "EMAIL_LINK_SENT" });
  state = accountJourneyReducer(state, { type: "EMAIL_LINK_EXPIRED", token: "must-not-be-kept" });
  assert.equal(state.emailLink.status, "expired");
  assert.equal(JSON.stringify(state).includes("must-not-be-kept"), false);
  state = accountJourneyReducer(state, { type: "EMAIL_LINK_REQUESTED", flow: "password-reset", emailProvided: true });
  state = accountJourneyReducer(state, { type: "EMAIL_LINK_USED" });
  assert.equal(state.emailLink.status, "used");
});

test("progress comparison presents counts and merge choice previews a deterministic union", () => {
  const local = snapshot({
    paths: { A: { day: 3, done: false } }, showedUpDates: ["2026-09-01"], showedUp: 1,
    completionHistory: [{ id: "A:1", door: "A", lesson: 1, date: "2026-09-01" }],
  });
  const remote = snapshot({
    paths: { A: { day: 5, done: true }, B: { day: 2, done: false } }, showedUpDates: ["2026-09-02"], showedUp: 1,
    completionHistory: [{ id: "B:1", door: "B", lesson: 1, date: "2026-09-02" }],
  }, "2026-09-13T11:00:00.000Z");
  const comparison = compareProgressCopies(local, remote);
  assert.equal(comparison.differs, true);
  assert.equal(JSON.stringify(comparison).includes("A:1"), false);
  assert.equal(JSON.stringify(comparison).includes("B:1"), false);
  let state = accountJourneyReducer(createAccountJourneyState(), { type: "CONFLICT_COMPARISON_OBSERVED", localSnapshot: local, remoteSnapshot: remote });
  assert.equal(JSON.stringify(state).includes("A:1"), false);
  state = accountJourneyReducer(state, { type: "CONFLICT_CHOICE_SELECTED", choice: "merge", localSnapshot: local, remoteSnapshot: remote });
  assert.equal(state.conflict.choice, "merge");
  assert.equal(state.conflict.mergePreview.summary.completedLessons, 2);
  const merged = mergeProgressSnapshots(local, remote).snapshot.appState.state;
  assert.equal(merged.paths.A.day, 5);
  assert.equal(merged.paths.B.day, 2);
  assert.deepEqual(merged.showedUpDates, ["2026-09-01", "2026-09-02"]);
  assert.deepEqual(merged.completionHistory.map((item) => item.id), ["A:1", "B:1"]);
});

test("device rows expose only display metadata and are revoked only after confirmation", () => {
  let state = accountJourneyReducer(createAccountJourneyState(), { type: "DEVICE_LIST_OBSERVED", sessions: [
    { id: "current", label: "This browser", current: true, accessToken: "secret" },
    { id: "other", label: "Tablet", lastActiveAt: "2026-09-12T12:00:00Z", token: "secret" },
  ] });
  assert.equal(JSON.stringify(state).includes("secret"), false);
  state = accountJourneyReducer(state, { type: "DEVICE_REVOCATION_REQUESTED", sessionId: "current" });
  assert.deepEqual(state.devices.revokingSessionIds, []);
  state = accountJourneyReducer(state, { type: "DEVICE_REVOCATION_REQUESTED", sessionId: "other" });
  assert.equal(state.devices.sessions[1].status, "active");
  assert.deepEqual(state.devices.revokingSessionIds, ["other"]);
  state = accountJourneyReducer(state, { type: "DEVICE_REVOCATION_CONFIRMED", sessionId: "other" });
  assert.equal(state.devices.sessions[1].status, "revoked");
});

test("export lifecycle requires a ready downloadable artifact before marking download complete", () => {
  let state = accountJourneyReducer(createAccountJourneyState(), { type: "EXPORT_REQUESTED" });
  assert.equal(state.exportRequest.status, "requested");
  assert.equal(accountJourneyReducer(state, { type: "EXPORT_DOWNLOADED" }).exportRequest.status, "requested");
  state = accountJourneyReducer(state, { type: "EXPORT_PROCESSING" });
  state = accountJourneyReducer(state, { type: "EXPORT_READY", requestId: "exp-1", downloadAvailable: false });
  assert.equal(accountJourneyReducer(state, { type: "EXPORT_DOWNLOADED" }).exportRequest.status, "ready");
  state = accountJourneyReducer(state, { type: "EXPORT_READY", requestId: "exp-1", downloadAvailable: true });
  state = accountJourneyReducer(state, { type: "EXPORT_DOWNLOADED" });
  assert.equal(state.exportRequest.status, "downloaded");
});

test("deletion requires acknowledgement and reauthentication, and completes only on confirmation", () => {
  let state = accountJourneyReducer(createAccountJourneyState(), { type: "DELETION_REVIEW_OPENED" });
  assert.equal(state.deletion.status, "reauthentication-required");
  state = accountJourneyReducer(state, { type: "DELETION_REQUESTED" });
  assert.equal(state.deletion.status, "reauthentication-required");
  state = accountJourneyReducer(state, { type: "DELETION_ACKNOWLEDGED", acknowledged: true });
  state = accountJourneyReducer(state, { type: "DELETION_REQUESTED" });
  assert.equal(state.deletion.status, "reauthentication-required");
  state = accountJourneyReducer(state, { type: "DELETION_REAUTHENTICATED" });
  state = accountJourneyReducer(state, { type: "DELETION_REQUESTED" });
  assert.equal(state.deletion.status, "requested");
  assert.equal(accountJourneyReducer(state, { type: "DELETION_CONFIRMED" }).deletion.status, "completed");
});
