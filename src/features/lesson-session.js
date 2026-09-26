const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const positiveInteger = (value) => Number.isInteger(value) && value > 0;
const positionIndex = (value) => Number.isInteger(value) && value >= 0;

function normalizePosition(value) {
  const saved = isRecord(value) ? value : {};
  return {
    beatIndex: positionIndex(saved.beatIndex) ? saved.beatIndex : 0,
    exerciseIndex: positionIndex(saved.exerciseIndex) ? saved.exerciseIndex : 0,
  };
}

function normalizeAudioOptions(value = {}) {
  const audio = isRecord(value) ? value : {};
  return {
    recorded: audio.recorded === true,
    houseVoice: audio.houseVoice === true,
    transcript: audio.transcript !== false,
  };
}

function chooseAudioMode(options, excluded = []) {
  const unavailable = new Set(excluded);
  for (const mode of ["recorded", "house-voice", "transcript", "silent"]) {
    if (unavailable.has(mode)) continue;
    if (mode === "recorded" && options.recorded) return mode;
    if (mode === "house-voice" && options.houseVoice) return mode;
    if (mode === "transcript" && options.transcript) return mode;
    if (mode === "silent") return mode;
  }
  return "silent";
}

function audioState(options, { failedMode = null, canRetry = false } = {}) {
  const mode = chooseAudioMode(options, failedMode ? [failedMode] : []);
  const fallback = failedMode !== null || mode !== "recorded";
  return {
    status: mode === "silent" ? "unavailable" : "ready",
    mode,
    fallback,
    reason: failedMode ? "playback-failed" : mode === "recorded" ? null : "recording-unavailable",
    canRetry,
    retryMode: canRetry ? failedMode : null,
    available: { ...options },
  };
}

function lessonIdentity(lesson) {
  if (!isRecord(lesson) || typeof lesson.door !== "string" || !lesson.door || !positiveInteger(lesson.lesson)) return null;
  if (typeof lesson.id !== "string" || !lesson.id || typeof lesson.contentRevision !== "string" || !lesson.contentRevision) return null;
  return { door: lesson.door, lesson: lesson.lesson, id: lesson.id, contentRevision: lesson.contentRevision };
}

function resumePosition(savedProgress, identity) {
  if (!isRecord(savedProgress)) return { position: { beatIndex: 0, exerciseIndex: 0 }, mismatch: null };
  if (savedProgress.sessionId !== identity.id || savedProgress.door !== identity.door || savedProgress.lesson !== identity.lesson) {
    return { position: { beatIndex: 0, exerciseIndex: 0 }, mismatch: null };
  }
  if (savedProgress.contentRevision !== identity.contentRevision) {
    return {
      position: { beatIndex: 0, exerciseIndex: 0 },
      mismatch: { savedRevision: savedProgress.contentRevision ?? null, currentRevision: identity.contentRevision },
    };
  }
  return { position: normalizePosition(savedProgress.position), mismatch: null };
}

/** Create a serializable state while lesson, access, audio, and saved position resolve. */
export function createLessonSession({ door, lesson, sessionId = null } = {}) {
  return {
    status: "loading",
    request: { door: typeof door === "string" ? door : null, lesson: positiveInteger(lesson) ? lesson : null, sessionId },
    lesson: null,
    position: { beatIndex: 0, exerciseIndex: 0 },
    contentRevisionMismatch: null,
    playback: { status: "idle", interrupted: false },
    timer: { status: "idle", interrupted: false },
    appState: "active",
    audio: { status: "pending", mode: null, fallback: false, reason: null, canRetry: false, retryMode: null, available: { recorded: false, houseVoice: false, transcript: true } },
    progressRevision: 0,
    save: { status: "clean", pendingRevision: null, persistedRevision: 0, attempt: 0, error: null },
    error: null,
  };
}

function loadSuccess(state, action) {
  const lesson = action.lesson;
  const identity = lessonIdentity(lesson);
  if (!identity || (state.request.door && state.request.door !== identity.door) || (state.request.lesson && state.request.lesson !== identity.lesson) || (state.request.sessionId && state.request.sessionId !== identity.id)) {
    return { ...state, status: "unavailable", error: "lesson-unavailable", audio: { ...state.audio, status: "unavailable", mode: "silent" } };
  }
  // Designed catalog entries have no manuscript and cannot be played as if complete.
  if (lesson.canPreview === false || lesson.authored === false || lesson.status === "designed") {
    return { ...state, status: "unavailable", error: "lesson-not-authored", lesson: identity, audio: { ...state.audio, status: "unavailable", mode: "silent" } };
  }
  const { position, mismatch } = resumePosition(action.savedProgress, identity);
  const options = normalizeAudioOptions(action.audio);
  return {
    ...state,
    status: "ready",
    lesson: identity,
    position,
    contentRevisionMismatch: mismatch,
    audio: audioState(options),
    error: null,
  };
}

function changedPosition(state, position) {
  const progressRevision = state.progressRevision + 1;
  return {
    ...state,
    position: normalizePosition(position),
    progressRevision,
    save: { status: "pending", pendingRevision: progressRevision, persistedRevision: state.save.persistedRevision, attempt: 0, error: null },
  };
}

function fallbackFromAudioFailure(state, failedMode) {
  const mode = failedMode || state.audio.mode;
  return { ...state, audio: audioState(state.audio.available, { failedMode: mode, canRetry: mode === "recorded" || mode === "house-voice" }) };
}

/** Pure transition function for lesson loading, resume, interruption, audio, and local-save status. */
export function lessonSessionReducer(state, action) {
  if (!isRecord(state) || !isRecord(action) || typeof action.type !== "string") return state;
  switch (action.type) {
    case "LOAD_SUCCESS":
      if (state.status !== "loading") return state;
      return loadSuccess(state, action);
    case "LOAD_FAILURE":
      if (state.status !== "loading") return state;
      return { ...state, status: "error", error: "lesson-load-failed", audio: { ...state.audio, status: "unavailable", mode: "silent" } };
    case "SET_POSITION":
      if (state.status !== "ready" || state.contentRevisionMismatch || !isRecord(action.position)) return state;
      return changedPosition(state, action.position);
    case "NEXT_BEAT":
      if (state.status !== "ready" || state.contentRevisionMismatch) return state;
      return changedPosition(state, { beatIndex: state.position.beatIndex + 1, exerciseIndex: 0 });
    case "SET_EXERCISE":
      if (state.status !== "ready" || state.contentRevisionMismatch || !positionIndex(action.exerciseIndex)) return state;
      return changedPosition(state, { ...state.position, exerciseIndex: action.exerciseIndex });
    case "START_PLAYBACK":
      if (state.status !== "ready" || state.appState === "background" || state.contentRevisionMismatch) return state;
      return { ...state, playback: { status: "playing", interrupted: false } };
    case "PAUSE_PLAYBACK":
      if (state.playback.status !== "playing") return state;
      return { ...state, playback: { status: "paused", interrupted: false } };
    case "START_TIMER":
      if (state.status !== "ready" || state.appState === "background") return state;
      return { ...state, timer: { status: "running", interrupted: false } };
    case "PAUSE_TIMER":
      if (state.timer.status !== "running") return state;
      return { ...state, timer: { status: "paused", interrupted: false } };
    case "APP_BACKGROUND": {
      const playbackInterrupted = state.playback.status === "playing";
      const timerInterrupted = state.timer.status === "running";
      return {
        ...state,
        appState: "background",
        playback: playbackInterrupted ? { status: "paused", interrupted: true } : state.playback,
        timer: timerInterrupted ? { status: "paused", interrupted: true } : state.timer,
      };
    }
    case "APP_FOREGROUND":
      // Returning to the app never resumes sound or a timed practice without intent.
      return { ...state, appState: "active" };
    case "AUDIO_FAILED":
      if (state.status !== "ready" || state.audio.mode === "transcript" || state.audio.mode === "silent") return state;
      return fallbackFromAudioFailure(state, action.mode);
    case "AUDIO_RETRY":
      if (!state.audio.canRetry) return state;
      return { ...state, audio: { ...state.audio, status: "pending", canRetry: false, mode: state.audio.retryMode } };
    case "AUDIO_READY": {
      const mode = action.mode || state.audio.mode;
      const availabilityKey = mode === "house-voice" ? "houseVoice" : mode;
      if (!["recorded", "house-voice"].includes(mode) || state.audio.available[availabilityKey] !== true) return state;
      return { ...state, audio: { ...state.audio, status: "ready", mode, fallback: mode !== "recorded", reason: mode === "recorded" ? null : state.audio.reason, canRetry: false, retryMode: null } };
    }
    case "SELECT_AUDIO":
      if (!["recorded", "house-voice", "transcript", "silent"].includes(action.mode)) return state;
      if (action.mode !== "silent" && action.mode !== "transcript" && !state.audio.available[action.mode === "house-voice" ? "houseVoice" : action.mode]) return state;
      return { ...state, audio: { ...state.audio, status: action.mode === "silent" ? "unavailable" : "ready", mode: action.mode, fallback: action.mode !== "recorded", reason: action.mode === "recorded" ? null : "user-selected", canRetry: false, retryMode: null } };
    case "SAVE_STARTED": {
      const revision = Number.isInteger(action.revision) ? action.revision : state.save.pendingRevision;
      if (state.save.pendingRevision == null || revision !== state.save.pendingRevision || revision <= state.save.persistedRevision) return state;
      return { ...state, save: { ...state.save, status: "saving", attempt: state.save.attempt + 1, error: null } };
    }
    case "SAVE_FAILED": {
      if (action.revision !== state.save.pendingRevision || state.save.pendingRevision == null) return state;
      return { ...state, save: { ...state.save, status: "failed", error: "save-failed" } };
    }
    case "RETRY_SAVE":
      if (state.save.status !== "failed" && state.save.status !== "pending") return state;
      if (state.save.pendingRevision == null) return state;
      return { ...state, save: { ...state.save, status: "saving", attempt: state.save.attempt + 1, error: null } };
    case "SAVE_SUCCEEDED": {
      const revision = action.revision;
      if (!Number.isInteger(revision) || revision <= state.save.persistedRevision || revision > state.progressRevision) return state;
      const persistedRevision = Math.max(state.save.persistedRevision, revision);
      const currentPending = state.save.pendingRevision;
      const hasNewerEdits = currentPending !== null && currentPending > revision;
      return {
        ...state,
        save: {
          ...state.save,
          status: hasNewerEdits ? "pending" : "saved",
          pendingRevision: hasNewerEdits ? currentPending : null,
          persistedRevision,
          error: null,
        },
      };
    }
    case "ACK_CONTENT_REVISION":
      if (!state.contentRevisionMismatch || action.currentRevision !== state.contentRevisionMismatch.currentRevision) return state;
      return { ...state, contentRevisionMismatch: null, position: { beatIndex: 0, exerciseIndex: 0 } };
    default:
      return state;
  }
}

/** Make an explicit, serializable resume record for a device-local persistence adapter. */
export function getLessonResumeRecord(state) {
  if (!isRecord(state) || state.status !== "ready" || !state.lesson) return null;
  return {
    sessionId: state.lesson.id,
    door: state.lesson.door,
    lesson: state.lesson.lesson,
    contentRevision: state.lesson.contentRevision,
    position: { ...state.position },
    progressRevision: state.progressRevision,
  };
}
