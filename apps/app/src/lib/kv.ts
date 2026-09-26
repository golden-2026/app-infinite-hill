// One key-value API on every platform (web localStorage; native gets Expo SQLite localStorage first).
// installs Expo SQLite's localStorage first, so the same calls work on iPhone.
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // full or blocked: the app keeps running from memory
  }
}

export function remove(key: string) {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {}
}
