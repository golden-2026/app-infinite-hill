const FLOWS = new Set(["signup-verification", "magic-link", "password-reset"]);

const object = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const array = (value) => Array.isArray(value) ? value : [];
const dateValue = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null;
const nonnegative = (value) => Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
const clone = (value) => structuredClone(value);

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function unwrapSnapshot(value) {
  const snapshot = object(value);
  const appState = object(snapshot.appState);
  return {
    snapshot,
    appState: object(appState.state),
    hasAppState: appState.version === 1 && Object.keys(object(appState.state)).length > 0,
  };
}

/** Summarize what guest progress contains without exposing Door choices or practice text. */
export function summarizeGuestProgress(snapshot) {
  const { snapshot: source, appState, hasAppState } = unwrapSnapshot(snapshot);
  const paths = object(appState.paths);
  const history = array(appState.completionHistory);
  const completedDays = new Set([
    ...array(appState.showedUpDates).filter((item) => typeof item === "string"),
    ...(dateValue(appState.lastCompletedDate) ? [appState.lastCompletedDate] : []),
  ]).size;
  const lessons = new Set(history.filter((item) => typeof object(item).id === "string").map((item) => item.id));
  const activePaths = Object.values(paths).filter((path) => nonnegative(object(path).day) > 1 || object(path).done === true).length;
  const profile = object(object(source.account).profile);
  const categories = [];
  if (hasAppState && (Object.keys(paths).length || history.length || completedDays || appState.showedUp)) categories.push("learning progress and practice history");
  if (hasAppState && (appState.preferences || appState.settings || appState.chime !== undefined || appState.voice !== undefined)) categories.push("practice preferences");
  if (hasAppState && categories.length === 0 && Object.keys(appState).length > 0) categories.push("saved app state");
  if (profile.displayName || profile.email) categories.push("profile details");
  return {
    hasProgress: categories.length > 0,
    completedDays: Math.max(completedDays, nonnegative(appState.showedUp)),
    completedLessons: lessons.size || history.length,
    activePaths,
    categories,
  };
}

function compareSnapshot(snapshot) {
  const { snapshot: source, appState } = unwrapSnapshot(snapshot);
  if (object(source.appState).version !== 1 || !source.appState.state || typeof source.appState.state !== "object" || Array.isArray(source.appState.state)) {
    throw new TypeError("A versioned progress copy is required for comparison.");
  }
  return {
    exportedAt: dateValue(source.exportedAt),
    summary: summarizeGuestProgress(snapshot),
    state: clone(appState),
  };
}

/** Compare two snapshots using only review-safe counts and timestamps. */
export function compareProgressCopies(localSnapshot, remoteSnapshot) {
  const local = compareSnapshot(localSnapshot);
  const remote = compareSnapshot(remoteSnapshot);
  const equal = stableStringify(local.state) === stableStringify(remote.state);
  return {
    local: { exportedAt: local.exportedAt, summary: local.summary },
    remote: { exportedAt: remote.exportedAt, summary: remote.summary },
    equal,
    differs: !equal,
    mergeAvailable: Boolean(localSnapshot?.appState?.version === 1 && remoteSnapshot?.appState?.version === 1),
  };
}

/** Build a review-only merge preview. No storage or network writes are performed. */
export function mergeProgressSnapshots(localSnapshot, remoteSnapshot) {
  const local = object(object(localSnapshot).appState).state;
  const remote = object(object(remoteSnapshot).appState).state;
  if (!local || !remote || object(localSnapshot.appState).version !== 1 || object(remoteSnapshot.appState).version !== 1) {
    throw new TypeError("Both copies need versioned app progress before a merge can be previewed.");
  }
  const left = object(local);
  const right = object(remote);
  const localPaths = object(left.paths);
  const remotePaths = object(right.paths);
  const paths = { ...clone(localPaths) };
  for (const [door, remoteValue] of Object.entries(remotePaths)) {
    const current = object(paths[door]);
    const candidate = object(remoteValue);
    if (!paths[door] || nonnegative(candidate.day) > nonnegative(current.day)) paths[door] = clone(candidate);
    else if (nonnegative(candidate.day) === nonnegative(current.day)) paths[door] = { ...current, done: current.done === true || candidate.done === true };
  }
  const historyById = new Map();
  for (const item of [...array(left.completionHistory), ...array(right.completionHistory)]) {
    const record = object(item);
    const id = typeof record.id === "string" ? record.id : null;
    if (!id) continue;
    const previous = historyById.get(id);
    if (!previous || (dateValue(record.date) || "") > (dateValue(previous.date) || "")) historyById.set(id, clone(record));
  }
  const dates = [...new Set([
    ...array(left.showedUpDates), ...array(right.showedUpDates),
    ...(dateValue(left.lastCompletedDate) ? [left.lastCompletedDate] : []),
    ...(dateValue(right.lastCompletedDate) ? [right.lastCompletedDate] : []),
  ].filter((item) => typeof item === "string"))].sort();
  const reviewsById = new Map();
  for (const item of [...array(left.reviews), ...array(right.reviews)]) {
    const record = object(item);
    if (typeof record.id !== "string") continue;
    const previous = reviewsById.get(record.id);
    if (!previous || nonnegative(record.reviewCount) > nonnegative(previous.reviewCount)) reviewsById.set(record.id, clone(record));
  }
  const state = {
    ...clone(left),
    paths,
    completionHistory: [...historyById.values()].sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || a.id.localeCompare(b.id)),
    showedUpDates: dates,
    showedUp: Math.max(dates.length, nonnegative(left.showedUp), nonnegative(right.showedUp)),
    reviews: [...reviewsById.values()],
  };
  const appState = { version: 1, state };
  return {
    snapshot: { ...clone(object(localSnapshot)), appState },
    summary: summarizeGuestProgress({ ...clone(object(localSnapshot)), appState }),
  };
}

function initialEmailLink() { return { flow: null, status: "idle", emailProvided: false, error: null }; }
function initialState() {
  return {
    guestConversion: { status: "idle", progress: null, emailProvided: false, error: null },
    emailLink: initialEmailLink(),
    conflict: { status: "idle", comparison: null, choice: null, mergePreview: null, error: null },
    devices: { status: "idle", sessions: [], revokingSessionIds: [], error: null },
    exportRequest: { status: "idle", requestId: null, downloadAvailable: false, error: null },
    deletion: { status: "idle", requiresReauthentication: true, acknowledged: false, error: null },
  };
}

function validFlow(flow) { return FLOWS.has(flow); }
function safeSession(session) {
  const value = object(session);
  if (typeof value.id !== "string" || !value.id) return null;
  return {
    id: value.id,
    label: typeof value.label === "string" ? value.label : "Device",
    current: value.current === true,
    status: value.status === "revoked" ? "revoked" : "active",
    lastActiveAt: dateValue(value.lastActiveAt),
    revocable: value.current !== true && value.revocable !== false,
  };
}

/** Pure account-screen state reducer. `*_CONFIRMED` actions require observed results from an integration. */
export function accountJourneyReducer(currentState, action) {
  const state = { ...initialState(), ...object(currentState) };
  const event = object(action);
  switch (event.type) {
    case "GUEST_CONVERSION_REVIEWED":
      return { ...state, guestConversion: { status: "review", progress: summarizeGuestProgress(event.snapshot), emailProvided: false, error: null } };
    case "GUEST_CONVERSION_REQUESTED":
      if (state.guestConversion.status !== "review") return state;
      return { ...state, guestConversion: { ...state.guestConversion, status: "requested", emailProvided: event.emailProvided === true, error: null } };
    case "GUEST_CONVERSION_CONFIRMED":
      if (state.guestConversion.status !== "requested") return state;
      return { ...state, guestConversion: { ...state.guestConversion, status: "converted", error: null } };
    case "GUEST_CONVERSION_FAILED":
      if (state.guestConversion.status !== "requested") return state;
      return { ...state, guestConversion: { ...state.guestConversion, status: "failed", error: typeof event.error === "string" ? event.error : "conversion_failed" } };
    case "EMAIL_LINK_REQUESTED":
      if (!validFlow(event.flow)) return state;
      return { ...state, emailLink: { flow: event.flow, status: "requesting", emailProvided: event.emailProvided === true, error: null } };
    case "EMAIL_LINK_SENT":
      if (state.emailLink.status !== "requesting") return state;
      return { ...state, emailLink: { ...state.emailLink, status: "sent", error: null } };
    case "EMAIL_LINK_VERIFIED":
      if (!validFlow(state.emailLink.flow) || !["requesting", "sent"].includes(state.emailLink.status)) return state;
      return { ...state, emailLink: { ...state.emailLink, status: "verified", error: null } };
    case "EMAIL_LINK_EXPIRED":
    case "EMAIL_LINK_USED":
      if (!validFlow(state.emailLink.flow)) return state;
      return { ...state, emailLink: { ...state.emailLink, status: event.type === "EMAIL_LINK_EXPIRED" ? "expired" : "used", error: null } };
    case "EMAIL_LINK_FAILED":
      if (state.emailLink.status !== "requesting") return state;
      return { ...state, emailLink: { ...state.emailLink, status: "failed", error: typeof event.error === "string" ? event.error : "email_link_failed" } };
    case "CONFLICT_COMPARISON_REQUESTED":
      return { ...state, conflict: { status: "comparing", comparison: null, choice: null, mergePreview: null, error: null } };
    case "CONFLICT_COMPARISON_OBSERVED": {
      try {
        const comparison = compareProgressCopies(event.localSnapshot, event.remoteSnapshot);
        return { ...state, conflict: { status: "ready", comparison, choice: null, mergePreview: null, error: null } };
      } catch (error) {
        return { ...state, conflict: { status: "failed", comparison: null, choice: null, mergePreview: null, error: error.message } };
      }
    }
    case "CONFLICT_COMPARISON_FAILED":
      return { ...state, conflict: { ...state.conflict, status: "failed", error: typeof event.error === "string" ? event.error : "comparison_failed" } };
    case "CONFLICT_CHOICE_SELECTED": {
      if (state.conflict.status !== "ready" || !["local", "remote", "merge"].includes(event.choice)) return state;
      if (event.choice === "merge") {
        if (!state.conflict.comparison?.mergeAvailable) return state;
        try {
          const preview = mergeProgressSnapshots(event.localSnapshot, event.remoteSnapshot);
          return { ...state, conflict: { ...state.conflict, choice: "merge", mergePreview: { summary: preview.summary }, error: null } };
        } catch (error) {
          return { ...state, conflict: { ...state.conflict, error: error.message } };
        }
      }
      return { ...state, conflict: { ...state.conflict, choice: event.choice, mergePreview: null, error: null } };
    }
    case "DEVICE_LIST_REQUESTED":
      return { ...state, devices: { ...state.devices, status: "loading", error: null } };
    case "DEVICE_LIST_OBSERVED":
      return { ...state, devices: { status: "loaded", sessions: array(event.sessions).map(safeSession).filter(Boolean), revokingSessionIds: [], error: null } };
    case "DEVICE_LIST_FAILED":
      return { ...state, devices: { ...state.devices, status: "failed", error: typeof event.error === "string" ? event.error : "device_list_failed" } };
    case "DEVICE_REVOCATION_REQUESTED": {
      const session = state.devices.sessions.find((item) => item.id === event.sessionId);
      if (!session || !session.revocable || session.status !== "active") return state;
      return { ...state, devices: { ...state.devices, revokingSessionIds: [...new Set([...state.devices.revokingSessionIds, session.id])] } };
    }
    case "DEVICE_REVOCATION_CONFIRMED":
      return { ...state, devices: { ...state.devices, sessions: state.devices.sessions.map((item) => item.id === event.sessionId ? { ...item, status: "revoked" } : item), revokingSessionIds: state.devices.revokingSessionIds.filter((id) => id !== event.sessionId), error: null } };
    case "DEVICE_REVOCATION_FAILED":
      return { ...state, devices: { ...state.devices, revokingSessionIds: state.devices.revokingSessionIds.filter((id) => id !== event.sessionId), error: typeof event.error === "string" ? event.error : "device_revocation_failed" } };
    case "EXPORT_REQUESTED":
      return { ...state, exportRequest: { status: "requested", requestId: null, downloadAvailable: false, error: null } };
    case "EXPORT_PROCESSING":
      if (state.exportRequest.status !== "requested") return state;
      return { ...state, exportRequest: { ...state.exportRequest, status: "processing" } };
    case "EXPORT_READY":
      if (!['requested', 'processing', 'ready'].includes(state.exportRequest.status)) return state;
      return { ...state, exportRequest: { status: "ready", requestId: typeof event.requestId === "string" ? event.requestId : null, downloadAvailable: event.downloadAvailable === true, error: null } };
    case "EXPORT_DOWNLOADED":
      if (state.exportRequest.status !== "ready" || !state.exportRequest.downloadAvailable) return state;
      return { ...state, exportRequest: { ...state.exportRequest, status: "downloaded" } };
    case "EXPORT_FAILED":
      if (!['requested', 'processing'].includes(state.exportRequest.status)) return state;
      return { ...state, exportRequest: { ...state.exportRequest, status: "failed", error: typeof event.error === "string" ? event.error : "export_failed" } };
    case "DELETION_REVIEW_OPENED": {
      const requiresReauthentication = event.requiresReauthentication !== false;
      return { ...state, deletion: { status: requiresReauthentication ? "reauthentication-required" : "review", requiresReauthentication, acknowledged: false, error: null } };
    }
    case "DELETION_ACKNOWLEDGED":
      if (!['review', 'reauthentication-required'].includes(state.deletion.status)) return state;
      return { ...state, deletion: { ...state.deletion, acknowledged: event.acknowledged === true } };
    case "DELETION_REAUTHENTICATED":
      if (state.deletion.status !== "reauthentication-required" || !state.deletion.acknowledged) return state;
      return { ...state, deletion: { ...state.deletion, status: "ready", error: null } };
    case "DELETION_REQUESTED":
      if (!state.deletion.acknowledged || (state.deletion.requiresReauthentication && state.deletion.status !== "ready")) return state;
      return { ...state, deletion: { ...state.deletion, status: "requested", error: null } };
    case "DELETION_PROCESSING":
      if (state.deletion.status !== "requested") return state;
      return { ...state, deletion: { ...state.deletion, status: "processing" } };
    case "DELETION_CONFIRMED":
      if (!['requested', 'processing'].includes(state.deletion.status)) return state;
      return { ...state, deletion: { ...state.deletion, status: "completed", error: null } };
    case "DELETION_FAILED":
      if (!['requested', 'processing'].includes(state.deletion.status)) return state;
      return { ...state, deletion: { ...state.deletion, status: "failed", error: typeof event.error === "string" ? event.error : "deletion_failed" } };
    default:
      return state;
  }
}

export function createAccountJourneyState() { return initialState(); }

export const ACCOUNT_JOURNEY_ACTIONS = Object.freeze({
  GUEST_CONVERSION_REVIEWED: "GUEST_CONVERSION_REVIEWED",
  GUEST_CONVERSION_REQUESTED: "GUEST_CONVERSION_REQUESTED",
  GUEST_CONVERSION_CONFIRMED: "GUEST_CONVERSION_CONFIRMED",
  GUEST_CONVERSION_FAILED: "GUEST_CONVERSION_FAILED",
  EMAIL_LINK_REQUESTED: "EMAIL_LINK_REQUESTED",
  EMAIL_LINK_SENT: "EMAIL_LINK_SENT",
  EMAIL_LINK_VERIFIED: "EMAIL_LINK_VERIFIED",
  EMAIL_LINK_EXPIRED: "EMAIL_LINK_EXPIRED",
  EMAIL_LINK_USED: "EMAIL_LINK_USED",
  EMAIL_LINK_FAILED: "EMAIL_LINK_FAILED",
  CONFLICT_COMPARISON_REQUESTED: "CONFLICT_COMPARISON_REQUESTED",
  CONFLICT_COMPARISON_OBSERVED: "CONFLICT_COMPARISON_OBSERVED",
  CONFLICT_COMPARISON_FAILED: "CONFLICT_COMPARISON_FAILED",
  CONFLICT_CHOICE_SELECTED: "CONFLICT_CHOICE_SELECTED",
  DEVICE_LIST_REQUESTED: "DEVICE_LIST_REQUESTED",
  DEVICE_LIST_OBSERVED: "DEVICE_LIST_OBSERVED",
  DEVICE_LIST_FAILED: "DEVICE_LIST_FAILED",
  DEVICE_REVOCATION_REQUESTED: "DEVICE_REVOCATION_REQUESTED",
  DEVICE_REVOCATION_CONFIRMED: "DEVICE_REVOCATION_CONFIRMED",
  DEVICE_REVOCATION_FAILED: "DEVICE_REVOCATION_FAILED",
  EXPORT_REQUESTED: "EXPORT_REQUESTED",
  EXPORT_PROCESSING: "EXPORT_PROCESSING",
  EXPORT_READY: "EXPORT_READY",
  EXPORT_DOWNLOADED: "EXPORT_DOWNLOADED",
  EXPORT_FAILED: "EXPORT_FAILED",
  DELETION_REVIEW_OPENED: "DELETION_REVIEW_OPENED",
  DELETION_ACKNOWLEDGED: "DELETION_ACKNOWLEDGED",
  DELETION_REAUTHENTICATED: "DELETION_REAUTHENTICATED",
  DELETION_REQUESTED: "DELETION_REQUESTED",
  DELETION_PROCESSING: "DELETION_PROCESSING",
  DELETION_CONFIRMED: "DELETION_CONFIRMED",
  DELETION_FAILED: "DELETION_FAILED",
});
