import { track } from "./analytics";
// Web reminders: web push through the reminders Edge Function, keyed by this browser's device id and a
// device secret only this browser holds (pilot has no accounts). iPhone Safari needs "Add to Home Screen".
import { readJSON, writeJSON } from "./storage";
import { timeZone, today } from "./time";

type StoreLike = { saved: { deviceId: string; settings: { reminder: { on: boolean; time: string } } }; derived: { doneToday: boolean }; update: (p: any) => void };

// No server configured (local/static builds): no URL, so nothing is sent to "undefined/functions/v1/reminders".
const FN = process.env.EXPO_PUBLIC_SUPABASE_URL ? `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/reminders` : null;
const SECRET_KEY = "ih:device-secret";

function deviceSecret(): string {
  let s = readJSON<string | null>(SECRET_KEY, null);
  if (!s || !/^[a-f0-9]{64}$/.test(s)) {
    const b = new Uint8Array(32);
    crypto.getRandomValues(b);
    s = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
    writeJSON(SECRET_KEY, s);
  }
  return s;
}

function env() {
  const w: any = typeof window !== "undefined" ? window : {};
  const ios = /iPhone|iPad|iPod/.test(w.navigator?.userAgent || "");
  const standalone = w.navigator?.standalone === true || w.matchMedia?.("(display-mode: standalone)")?.matches;
  return { hasNotification: "Notification" in w, hasPush: "PushManager" in w && "serviceWorker" in (w.navigator || {}), ios, standalone };
}

export function reminderSupport() {
  const e = env();
  if (e.ios && !e.standalone) return { can: false, note: "on iPhone, add infinite hill to your Home Screen first (share › add to home screen), then turn reminders on there." };
  if (!e.hasNotification || !e.hasPush) return { can: false, note: "this browser can't send reminders. today will still be waiting in the app." };
  return { can: true, note: null as string | null };
}

export async function registerWorker() {
  if (!env().hasPush) return null;
  try { return await navigator.serviceWorker.register("/sw.js"); } catch { return null; }
}

const b64ToBytes = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

async function post(body: object) {
  if (!FN) return false;
  const res = await fetch(FN, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return res.ok;
}

async function subscription(create: boolean) {
  const reg = (await navigator.serviceWorker.getRegistration()) || (await registerWorker());
  if (!reg) return null;
  const existing = await reg.pushManager.getSubscription();
  if (existing || !create || !FN) return existing;
  const { publicKey } = await (await fetch(FN)).json();
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) });
}

/** Tell the server the current time and whether today is done. Called on open, on changes, after a sit. */
export async function syncReminders(store: StoreLike) {
  const { reminder } = store.saved.settings;
  if (!reminder.on || !env().hasPush || (globalThis as any).Notification?.permission !== "granted") return;
  try {
    const sub = await subscription(false);
    if (!sub) return;
    await post({ op: "subscribe", device_id: store.saved.deviceId, device_secret: deviceSecret(), subscription: sub.toJSON(), tz: timeZone(), reminder_time: reminder.time, ...(store.derived.doneToday ? { last_sat_date: today() } : {}) });
  } catch {}
}

export async function enableReminders(store: StoreLike) {
  if (!FN) return { ok: false, message: "reminders aren't switched on in this version yet." };
  const s = reminderSupport();
  if (!s.can) return { ok: false, message: s.note! };
  const N = (window as any).Notification;
  if (N.permission === "denied") return { ok: false, message: "notifications are blocked for this site. allow them in your browser's site settings, then turn this on again." };
  const perm = await N.requestPermission();
  if (perm !== "granted") return { ok: false, message: perm === "denied" ? "notifications are blocked for this site. allow them in your browser's site settings, then turn this on again." : "no problem. turn it on whenever you like." };
  try {
    const sub = await subscription(true);
    if (!sub) throw new Error("no subscription");
    const ok = await post({ op: "subscribe", device_id: store.saved.deviceId, device_secret: deviceSecret(), subscription: sub.toJSON(), tz: timeZone(), reminder_time: store.saved.settings.reminder.time, ...(store.derived.doneToday ? { last_sat_date: today() } : {}) });
    if (!ok) throw new Error("server");
  } catch {
    return { ok: false, message: "couldn't set that up right now. try again in a minute." };
  }
  store.update({ reminder: { ...store.saved.settings.reminder, on: true } });
  track("reminder_on", {});
  return { ok: true, message: "on. the sun will find you at sunset." };
}

export async function disableReminders(store: StoreLike) {
  store.update({ reminder: { ...store.saved.settings.reminder, on: false } });
  try {
    const sub = await subscription(false);
    await sub?.unsubscribe();
    await post({ op: "unsubscribe", device_id: store.saved.deviceId, device_secret: deviceSecret() });
  } catch {}
}

export function reminderStatus(on: boolean) {
  if (!on) return "off";
  const perm = typeof window !== "undefined" && "Notification" in window ? (window as any).Notification.permission : "default";
  return perm === "granted" ? "on · this browser" : "on, but this browser blocked notifications";
}
