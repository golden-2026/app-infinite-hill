// window.IH: the platform the infinite hill UI calls (docs/PLATFORM_CONTRACT.md).
// The UI file stays the published build; this owns saved progress, real calendar days, honest labels,
// flags, and (later) reminders and opt-in analytics. Pure day rules live in day-engine.js.
import * as engine from "../../packages/domain/src/day-engine.js";

export const STORAGE_KEY = "ih:v1";
export const CONTRACT_VERSION = 1;

// Voices with a signed licence and biometric consent on file. Empty until a contract is signed
// (BUILD_BRIEF, "Voice, disclosure and legal"). Add a door code here only with the signed paper.
export const LICENSED_VOICES = Object.freeze({});

function safeStorage(storage) {
  try {
    const probe = "ih:probe";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    const mem = new Map();
    return { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  }
}

export function createIH({
  storage = typeof window !== "undefined" ? window.localStorage : undefined,
  now = () => new Date(),
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  search = typeof window !== "undefined" ? window.location.search : "",
} = {}) {
  const store = safeStorage(storage || { getItem: () => null, setItem() {}, removeItem() {} });
  const params = new URLSearchParams(search);
  const flagSet = new Set(
    [...(params.get("flags") || "").split(","), ...readJSON("ih:flags", [])].map((f) => f.trim()).filter(Boolean),
  );
  const demo = params.has("demo") || flagSet.has("demo");

  function readJSON(key, fallback) {
    try {
      const raw = store.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function readState() {
    const raw = readJSON(STORAGE_KEY, null);
    return raw ? { ...engine.normalizeState(raw), ui: raw.ui && typeof raw.ui === "object" ? raw.ui : {} } : null;
  }

  function writeState(state) {
    try {
      store.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked: keep running from memory; the day still counts this session.
    }
  }

  const today = () => {
    const t = now();
    return { date: engine.localDate(t, timeZone), tz: timeZone, hour: Number(new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(t)) };
  };

  const current = () => readState() || { ...engine.emptyState(), ui: {} };

  return {
    version: CONTRACT_VERSION,
    demo,
    today,

    /** Saved state after moving finished doors to their next lesson; null on a fresh device. */
    load() {
      const s = readState();
      if (!s) return null;
      const rolled = { ...engine.rollover(s, today().date), ui: s.ui };
      writeState(rolled);
      return rolled;
    },

    /** The UI's own fields. Day counting fields (dates, showedUp) are owned here and never overwritten. */
    save(ui) {
      const s = current();
      const paths = { ...s.paths };
      for (const [wing, p] of Object.entries((ui && ui.paths) || {})) paths[wing] = { ...(s.paths[wing] || {}), ...p };
      const { paths: _p, kids, ...rest } = ui || {};
      writeState({ ...s, paths, kids: Array.isArray(kids) ? kids : s.kids, ui: { ...s.ui, ...rest } });
    },

    completeSit({ door, kidIndex = null }) {
      const r = engine.completeSit(current(), { door, date: today().date, kidIndex });
      writeState({ ...r.state, ui: current().ui });
      return r;
    },

    setGoal(days) {
      const s = current();
      writeState({ ...engine.setGoal(s, days, today().date), ui: s.ui });
    },
    goalProgress: () => engine.goalProgress(current()),
    goldenWeeks: () => engine.goldenWeeks(current()),
    currentRun: () => engine.currentRun(current()),
    welcomeBack: () => engine.shouldWelcomeBack(current(), today().date),
    markWelcomedBack() {
      writeState({ ...current(), welcomedBackOn: today().date });
    },

    /** Truthful disclosure: a named voice only when its licence is signed. */
    voiceLabel(door, name) {
      if (LICENSED_VOICES[door]) return { licensed: true, short: name, claim: `${name} reads every lesson. It's a licensed voice, used with their permission.` };
      return {
        licensed: false,
        short: "the house voice",
        claim: `${name} will read these lessons once they record. For now it's the house voice, reading lines that are still drafts, waiting on a Keeper's review.`,
      };
    },

    flag: (name) => flagSet.has(name),

    // P1 wires delivery; until then the status is honest.
    reminders: { status: () => "in-app-only" },

    // P2 wires opt-in analytics; until then nothing leaves the device.
    track() {},

    /** Export and wipe (privacy: the user owns their data). */
    exportData: () => JSON.stringify(current()),
    reset() {
      store.removeItem(STORAGE_KEY);
    },
  };
}

export function installIH(options) {
  const ih = createIH(options);
  if (typeof window !== "undefined") window.IH = ih;
  return ih;
}
