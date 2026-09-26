import assert from "node:assert/strict";
import test from "node:test";
import {
  getBackgroundSyncState,
  getContentRevisionState,
  getInstallEligibility,
  getInstallResult,
  getNotificationPermissionState,
  getOfflineStorageState,
  getScheduledReminderOverview,
  getStorageOperationResult,
} from "../../src/features/device-state.js";

test("install eligibility separates installed, browser prompt, manual iOS, and unsupported", () => {
  assert.equal(getInstallEligibility({ standalone: true }).status, "installed");
  assert.deepEqual(getInstallEligibility({ promptAvailable: true }), {
    status: "installable", canPrompt: true, instructions: null,
  });
  assert.match(getInstallEligibility({ userAgent: "iPhone" }).instructions, /Safari/);
  assert.equal(getInstallEligibility({ userAgent: "Desktop" }).status, "unsupported");
});

test("install prompt acceptance is not reported as completed installation", () => {
  assert.deepEqual(getInstallResult({ outcome: "accepted" }), { status: "accepted", installed: false });
  assert.deepEqual(getInstallResult({ outcome: "dismissed" }), { status: "dismissed", installed: false });
  assert.deepEqual(getInstallResult({ outcome: "accepted", standalone: true }), { status: "installed", installed: true });
});

test("notification permission preserves dismissal, denial recovery, and unsupported states", () => {
  assert.deepEqual(getNotificationPermissionState({ permission: "granted" }), { status: "granted", recovery: null });
  assert.deepEqual(getNotificationPermissionState({ permission: "default", requestResult: "default" }), {
    status: "dismissed", recovery: "browser-settings",
  });
  assert.deepEqual(getNotificationPermissionState({ permission: "denied" }), {
    status: "denied", recovery: "browser-settings",
  });
  assert.equal(getNotificationPermissionState({ supported: false }).status, "unsupported");
});

test("reminder overview requires a scheduler-confirmed future event", () => {
  const base = { preference: { enabled: true, timezone: "UTC" }, permission: "granted", now: new Date("2026-09-13T10:00:00Z") };
  assert.equal(getScheduledReminderOverview(base).status, "pending-provider");
  const scheduled = getScheduledReminderOverview({
    ...base, schedulerStatus: "scheduled", nextAt: "2026-09-13T19:00:00Z", deliveryHealth: "healthy",
  });
  assert.equal(scheduled.status, "scheduled");
  assert.equal(scheduled.nextAt, "2026-09-13T19:00:00.000Z");
  assert.equal(scheduled.deliveryHealth, "healthy");
  assert.equal(getScheduledReminderOverview({
    ...base, schedulerStatus: "scheduled", nextAt: "2026-09-13T09:00:00Z",
  }).status, "pending-provider");
  assert.equal(getScheduledReminderOverview({ ...base, paused: true }).status, "paused");
});

test("offline library and storage report only supplied downloads and capacity", () => {
  const storage = getOfflineStorageState({
    usedBytes: 900, quotaBytes: 1_000, requiredBytes: 101,
    items: [
      { id: "lesson-1", title: "A lesson", revision: "r2", sizeBytes: 400, lastUpdated: "2026-09-12", availableOffline: true },
      { id: "audio-1", title: "Audio", kind: "audio", sizeBytes: 500, availableOffline: true },
      { id: "lesson-2", title: "Not saved", availableOffline: false },
    ],
  });
  assert.equal(storage.status, "insufficient-space");
  assert.equal(storage.itemCount, 2);
  assert.equal(storage.remainingBytes, 100);
  assert.equal(storage.items[0].lastUpdated, "2026-09-12T00:00:00.000Z");
  assert.equal(getOfflineStorageState({ usedBytes: 20, quotaBytes: 100 }).status, "available");
  assert.equal(getStorageOperationResult({ operation: "clear", success: true }).status, "complete");
});

test("content updates are deferred during an active lesson and surfaced after download", () => {
  const proposed = { currentRevision: "r1", availableRevision: "r2" };
  assert.equal(getContentRevisionState(proposed).status, "update-available");
  assert.equal(getContentRevisionState({ ...proposed, downloadState: "downloading" }).status, "downloading");
  assert.equal(getContentRevisionState({
    ...proposed, downloadState: "ready", lessonInProgress: true,
  }).status, "deferred-in-progress");
  assert.equal(getContentRevisionState({ ...proposed, downloadState: "ready" }).status, "ready-to-apply");
  assert.equal(getContentRevisionState({ ...proposed, downloadState: "failed" }).status, "failed");
});

test("background sync distinguishes pending, success, failure, conflict, and signed-out", () => {
  assert.equal(getBackgroundSyncState().status, "pending");
  assert.equal(getBackgroundSyncState({ status: "syncing" }).status, "syncing");
  assert.equal(getBackgroundSyncState({ status: "delivered" }).status, "synced");
  assert.deepEqual(getBackgroundSyncState({ status: "failed", error: "offline" }), {
    status: "failed", error: "offline",
  });
  assert.equal(getBackgroundSyncState({ status: "conflict" }).status, "conflict");
  assert.deepEqual(getBackgroundSyncState({ status: "synced", signedIn: false }), {
    status: "signed-out", error: null,
  });
});
