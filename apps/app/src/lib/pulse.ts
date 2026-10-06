// Anonymous return counts (api/pulse.js). On by default, switched off under You › Your data. Once a day on open, and
// once per finished lesson, the phone sends { cohortDate, daysSince, event } (and a variant label only if this build
// has one; and, for a path's days 1–7, which of the seven). No id, no door, no words. The two dates it works from stay on this phone under "ih:pulse".
import { Platform } from "react-native";
import Constants from "expo-constants";
import { readJSON, remove, writeJSON } from "./storage";
import { afterOpen, lessonPing, openPing, startRec, type Ping, type PulseRec } from "./pulse-plan";

export const PULSE_KEY = "ih:pulse";
const URL = Platform.OS === "web" ? "/api/pulse" : `${(Constants.expoConfig?.extra as any)?.siteUrl ?? "https://golden-house-beta.netlify.app"}/api/pulse`;
/** A build-wide label for comparing two versions later (e.g. EXPO_PUBLIC_PULSE_VARIANT=finish-b). Unset: none sent. */
const VARIANT = process.env.EXPO_PUBLIC_PULSE_VARIANT || null;

/** The person's choice (You › Your data). Default on. */
export function pulseOn(): boolean {
  const s = readJSON<any>("ih:app:v1", null);
  return s?.settings?.pulse !== false;
}

async function send(p: Ping): Promise<boolean> {
  try {
    // no cookies, and no Referer (the page address could name a door)
    const r = await fetch(URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(p), keepalive: true, credentials: "omit", referrerPolicy: "no-referrer" } as RequestInit);
    return r.ok;
  } catch {
    return false;
  }
}

let busy = false;
/** Today's "opened" tick, once a day. Retried on the next open if it didn't land. */
export async function pulseOpen(today: string, earliestSit: string | null) {
  if (busy || !pulseOn()) return;
  const rec = startRec(readJSON<PulseRec | null>(PULSE_KEY, null), today, earliestSit);
  writeJSON(PULSE_KEY, rec);
  const p = openPing(rec, today, VARIANT);
  if (!p) return;
  busy = true;
  try {
    if (await send(p)) writeJSON(PULSE_KEY, afterOpen(startRec(readJSON(PULSE_KEY, null), today, earliestSit), p, today));
  } finally {
    busy = false;
  }
}

/** One finished lesson (your own; not a child's, not the extra round). Best effort, never retried. */
export function pulseLesson(today: string, week?: number | null) {
  if (!pulseOn()) return;
  const rec = readJSON<PulseRec | null>(PULSE_KEY, null);
  if (!rec) return; // no open has been counted on this phone yet
  const p = lessonPing(startRec(rec, today, null), today, VARIANT, week);
  if (p) send(p);
}

/** "Delete everything": the two dates go too. */
export const forgetPulse = () => remove(PULSE_KEY);
