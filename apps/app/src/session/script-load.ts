// The lesson screen's side of the full lesson scripts (docs/curriculum/LESSON_LOADER.md), kept free of React and Expo
// so it can be tested in plain Node: how long a lesson waits for its script, and which kept weeks a device holds on to.

// Never hold a lesson longer than this waiting for its script; after it, the outline-built lesson plays.
export const SCRIPT_WAIT_MS = 2500;

type KV = { read: (k: string) => any; write: (k: string, v: unknown) => unknown; remove: (k: string) => void; keys: () => string[] };

const KEY = /^ih:lessons:([A-Z]+):(\d{3})$/;
const pad = (n: number) => String(n).padStart(3, "0");

/** The weeks to keep for a door when `week` is written: that week and its neighbors (at most 3 per door). */
export function weeksToKeep(week: string): Set<string> {
  const n = Number(week);
  return new Set([pad(n), pad(n - 1), pad(n + 1)]);
}

/** A store for lessonScript: kept weeks persist, at most 3 per door (web localStorage is about 5 MB). */
export function makeLessonStore(kv: KV) {
  return {
    get: (k: string) => kv.read(k),
    set: (k: string, v: unknown) => {
      const m = KEY.exec(k);
      if (m) {
        const keep = weeksToKeep(m[2]);
        for (const key of kv.keys()) {
          const x = KEY.exec(key);
          if (x && x[1] === m[1] && !keep.has(x[2])) kv.remove(key);
        }
      }
      kv.write(k, v);
    },
  };
}

/** The day's script, or null if none arrives within `wait` ms (or loading fails). Always resolves, never rejects. */
export function scriptWithin<T>(load: () => Promise<T | null | undefined>, wait: number = SCRIPT_WAIT_MS): Promise<T | null> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), wait);
    Promise.resolve()
      .then(load)
      .then((s) => resolve(s ?? null), () => resolve(null))
      .finally(() => clearTimeout(t));
  });
}
