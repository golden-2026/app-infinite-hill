// The check-in's anonymous aggregate (api/wellbeing.js): after an answer, and only while the anonymous counts are
// on (the same switch as the return counts, You › Your data), the phone sends { door, bucket, score } once. No id,
// no date, no lesson, and never the five answers themselves. Best effort, never retried.
import { Platform } from "react-native";
import Constants from "expo-constants";
import { pulseOn } from "./pulse";
import { bucketOf } from "./wellbeing";

const URL = Platform.OS === "web" ? "/api/wellbeing" : `${(Constants.expoConfig?.extra as any)?.siteUrl ?? "https://golden-house-beta.netlify.app"}/api/wellbeing`;

export function sendWellbeing(door: string, m: number, score: number) {
  if (!pulseOn()) return;
  const body = JSON.stringify({ door, bucket: bucketOf(m), score });
  try {
    // no cookies, and no Referer (the page address could name a door and a day)
    fetch(URL, { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true, credentials: "omit", referrerPolicy: "no-referrer" } as RequestInit).catch(() => {});
  } catch {
    // offline or no fetch: the score stays on the phone only
  }
}
