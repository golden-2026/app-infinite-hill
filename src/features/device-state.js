/**
 * Pure device/PWA view-state helpers.
 *
 * These helpers only describe evidence supplied by the caller. They do not
 * install the app, request permissions, schedule reminders, download content,
 * delete storage, or run background sync.
 */

const byteCount = (value) => Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
const validDate = (value) => {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString() : null;
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

export const INSTALL_STATES = Object.freeze({
  installed: "installed",
  installable: "installable",
  manualInstructions: "manual-instructions",
  unsupported: "unsupported",
});

export function getInstallEligibility({ standalone = false, promptAvailable = false, userAgent = "" } = {}) {
  if (standalone) return { status: INSTALL_STATES.installed, canPrompt: false, instructions: null };
  if (promptAvailable) return { status: INSTALL_STATES.installable, canPrompt: true, instructions: null };
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return {
      status: INSTALL_STATES.manualInstructions,
      canPrompt: false,
      instructions: "In Safari, tap Share, then Add to Home Screen.",
    };
  }
  if (/android/i.test(userAgent)) {
    return {
      status: INSTALL_STATES.manualInstructions,
      canPrompt: false,
      instructions: "In your browser menu, choose Install app or Add to Home screen.",
    };
  }
  return { status: INSTALL_STATES.unsupported, canPrompt: false, instructions: null };
}

/** accepted means the browser accepted the prompt, not that install completed. */
export function getInstallResult({ outcome, standalone = false } = {}) {
  if (standalone) return { status: "installed", installed: true };
  if (outcome === "accepted") return { status: "accepted", installed: false };
  if (outcome === "dismissed") return { status: "dismissed", installed: false };
  if (outcome === "unsupported") return { status: "unsupported", installed: false };
  if (outcome === "failed") return { status: "failed", installed: false };
  return { status: "not-started", installed: false };
}

const PERMISSIONS = new Set(["granted", "denied", "default"]);

export function getNotificationPermissionState({ supported = true, permission = "default", requestResult } = {}) {
  if (!supported) return { status: "unsupported", recovery: null };
  if (permission === "denied" || requestResult === "denied") {
    return { status: "denied", recovery: "browser-settings" };
  }
  if (permission === "granted" || requestResult === "granted") {
    return { status: "granted", recovery: null };
  }
  if (!PERMISSIONS.has(permission) || (requestResult != null && !PERMISSIONS.has(requestResult))) {
    return { status: "unsupported", recovery: null };
  }
  if (requestResult === "default") return { status: "dismissed", recovery: "browser-settings" };
  return { status: "not-requested", recovery: null };
}

/**
 * A reminder is only called scheduled when a scheduler explicitly accepted it
 * and a concrete future nextAt was supplied. Permission/preferences alone are
 * never treated as delivery evidence.
 */
export function getScheduledReminderOverview({
  preference = {}, permission = "default", schedulerStatus = "unavailable",
  nextAt = null, timezone = preference.timezone ?? null, paused = false,
  deliveryHealth = "unknown", now = new Date(),
} = {}) {
  const next = validDate(nextAt);
  const nowTime = now instanceof Date ? now.getTime() : new Date(now).getTime();
  let status = "pending-provider";
  if (preference.enabled !== true) status = "disabled";
  else if (permission === "denied") status = "permission-denied";
  else if (permission !== "granted") status = "permission-required";
  else if (paused) status = "paused";
  else if (schedulerStatus === "failed") status = "failed";
  else if (schedulerStatus === "scheduled" && next && Date.parse(next) > nowTime) status = "scheduled";

  const health = new Set(["unknown", "healthy", "delivered", "failed"]).has(deliveryHealth)
    ? deliveryHealth : "unknown";
  return {
    status,
    enabled: preference.enabled === true,
    paused: paused === true,
    timezone: typeof timezone === "string" && timezone ? timezone : null,
    nextAt: status === "scheduled" ? next : null,
    deliveryHealth: status === "scheduled" ? health : "unknown",
    canEdit: true,
  };
}

export function normalizeOfflineLibrary(items = []) {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => item && typeof item === "object").map((item) => ({
    id: typeof item.id === "string" ? item.id : null,
    title: typeof item.title === "string" ? item.title : "Untitled item",
    kind: item.kind === "audio" ? "audio" : "lesson",
    revision: typeof item.revision === "string" ? item.revision : null,
    sizeBytes: byteCount(item.sizeBytes),
    lastUpdated: validDate(item.lastUpdated),
    availableOffline: item.availableOffline === true,
  }));
}

export function getOfflineStorageState({ usedBytes, quotaBytes, requiredBytes = 0, items = [] } = {}) {
  const used = byteCount(usedBytes);
  const quota = byteCount(quotaBytes);
  const required = byteCount(requiredBytes) ?? 0;
  const remaining = used !== null && quota !== null ? Math.max(0, quota - used) : null;
  let status = "unknown";
  if (remaining !== null) status = remaining < required ? "insufficient-space" : "available";
  const library = normalizeOfflineLibrary(items);
  return {
    status,
    usedBytes: used,
    quotaBytes: quota,
    remainingBytes: remaining,
    requiredBytes: required,
    usagePercent: used !== null && quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : null,
    itemCount: library.filter((item) => item.availableOffline).length,
    items: library,
  };
}

export function getStorageOperationResult({ operation, success, insufficientSpace = false } = {}) {
  if (insufficientSpace) return { status: "insufficient-space", operation: operation ?? null };
  if (success === true) return { status: "complete", operation: operation ?? null };
  if (success === false) return { status: "failed", operation: operation ?? null };
  return { status: "not-started", operation: operation ?? null };
}

/** Hold a downloaded revision while its lesson is actively in progress. */
export function getContentRevisionState({
  currentRevision = null, availableRevision = null, downloadState = "idle",
  lessonInProgress = false,
} = {}) {
  if (downloadState === "failed") return { status: "failed", currentRevision, availableRevision };
  if (downloadState === "downloading") return { status: "downloading", currentRevision, availableRevision };
  if (currentRevision && availableRevision && currentRevision === availableRevision) {
    return { status: "current", currentRevision, availableRevision };
  }
  if (!availableRevision || availableRevision === currentRevision) {
    return { status: "current", currentRevision, availableRevision: currentRevision };
  }
  if (downloadState !== "ready") return { status: "update-available", currentRevision, availableRevision };
  if (lessonInProgress) return { status: "deferred-in-progress", currentRevision, availableRevision };
  return { status: "ready-to-apply", currentRevision, availableRevision };
}

const SYNC_STATES = new Set(["pending", "syncing", "synced", "failed", "conflict", "signed-out"]);

export function getBackgroundSyncState({ status = "pending", signedIn = true, error = null } = {}) {
  if (!signedIn) return { status: "signed-out", error: null };
  // The platform currently exposes connected after a successful read and
  // delivered after a successful write. Both are observed remote responses.
  if (status === "connected" || status === "delivered") status = "synced";
  const normalized = SYNC_STATES.has(status) ? status : "pending";
  return { status: normalized, error: normalized === "failed" && typeof error === "string" ? error : null };
}
