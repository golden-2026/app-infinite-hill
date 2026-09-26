// Opt-in measurement (approved journey 2026-09-25). Off unless the person turns it on in You › Your data,
// and inert until EXPO_PUBLIC_POSTHOG_KEY is set. Sends only event names, small numbers and a door CODE
// (d1–d8) — never lesson text, answers, names or which faith by name.
import { readJSON } from "./storage";

const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const DOOR_CODE: Record<string, string> = { CHRISTIANITY: "d1", CATHOLIC: "d2", HINDUISM: "d3", ISLAM: "d4", JUDAISM: "d5", BUDDHISM: "d6", SIKHISM: "d7", SPIRITUAL: "d8" };
export type EventName = "onboard_step" | "lesson_step" | "lesson_done" | "reminder_on" | "day_returned" | "milestone" | "goal_set" | "unlock_seen";

type Props = Record<string, string | number | boolean | null | undefined> & { door?: string };

function consent(): { on: boolean; id: string | null } {
  const s = readJSON<any>("ih:app:v1", null);
  return { on: s?.settings?.analytics === "yes", id: typeof s?.deviceId === "string" ? s.deviceId : null };
}

export function track(event: EventName, props: Props = {}) {
  if (!KEY) return;
  const c = consent();
  if (!c.on || !c.id) return;
  const { door, ...rest } = props;
  const properties = { ...rest, ...(door ? { door: DOOR_CODE[door] || "d0" } : {}), $process_person_profile: false };
  fetch(`${HOST}/capture/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: KEY, event, distinct_id: c.id, properties }), keepalive: true }).catch(() => {});
}

export const analyticsAvailable = () => !!KEY;
