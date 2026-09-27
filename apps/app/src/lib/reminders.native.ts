import { track } from "./analytics";
// iPhone: local notifications scheduled on the device. No server. Re-planned on every open and every sit.
import { SUN_NOTES, icon } from "@ih/content";
import * as Notifications from "expo-notifications";
import { reminderTimes } from "./reminder-plan";
import { voiceLabel } from "./voice";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export const reminderSupport = () => ({ can: true, note: null as string | null });

type StoreLike = { saved: { settings: { reminder: { on: boolean; time: string }; homeWing: string } }; derived: { doneToday: boolean }; update: (p: any) => void };

export async function syncReminders(store: StoreLike) {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  const { reminder, homeWing } = store.saved.settings;
  if (!reminder.on) return;
  const ic = icon(homeWing);
  const note = SUN_NOTES(homeWing, voiceLabel(homeWing, ic.short).short, "")?.[0];
  for (const date of reminderTimes({ time: reminder.time, now: new Date(), doneToday: store.derived.doneToday })) {
    await Notifications.scheduleNotificationAsync({
      content: { title: "infinite hill", body: note?.[1] || "it's golden hour. a few minutes for you." },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    }).catch(() => {});
  }
}

export async function enableReminders(store: StoreLike) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return { ok: false, message: "no problem. you can turn this on any time in you › reminders." };
  store.update({ reminder: { ...store.saved.settings.reminder, on: true } });
  await syncReminders({ ...store, saved: { settings: { ...store.saved.settings, reminder: { ...store.saved.settings.reminder, on: true } } } });
  track("reminder_on", {});
  return { ok: true, message: "on. the sun will find you at sunset." };
}

export async function disableReminders(store: StoreLike) {
  store.update({ reminder: { ...store.saved.settings.reminder, on: false } });
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

export const reminderStatus = (on: boolean) => (on ? "on · this phone" : "off");

export async function registerWorker() { return null; }
