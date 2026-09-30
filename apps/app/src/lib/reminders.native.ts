import { track } from "./analytics";
// iPhone: local notifications scheduled on the device. No server. Re-planned on every open and every sit, so a
// finished lesson cancels that evening's notes and a new time zone re-plans in the phone's own local time.
import { lessonCounts, streakFrom } from "@ih/domain";
import * as Notifications from "expo-notifications";
import { planReminders } from "./reminder-plan";
import { t } from "@/i18n";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

export const reminderSupport = () => ({ can: true, note: null as string | null });

type StoreLike = {
  saved: { sits?: { date: string; at: string; kidId: string | null }[]; settings: { reminder: { on: boolean; time: string; set?: boolean }; homeWing: string; streakOn?: boolean } };
  derived: { doneToday: boolean };
  update: (p: any) => void;
  /** quiet mode (hard persona, heavy mood): no streak saver */
  quiet?: boolean;
};

export async function syncReminders(store: StoreLike) {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  const { reminder, streakOn } = store.saved.settings;
  if (!reminder.on) return;
  // the streak as of the last lesson (a kid's lessons never count here)
  const own = (store.saved.sits || []).filter((s) => !s.kidId);
  const last = own.at(-1) || null;
  const s = last ? streakFrom(lessonCounts(own as any), last.date) : null;
  const plan = planReminders({
    now: new Date(), lastLessonAt: last ? new Date(last.at) : null, time: reminder.time, set: reminder.set === true,
    doneToday: store.derived.doneToday, streak: s?.streak ?? 0, rest: s?.rest ?? 0, quiet: !!store.quiet, streakOn: streakOn !== false,
  });
  for (const p of plan) {
    await Notifications.scheduleNotificationAsync({
      content: { title: "infinite hill", body: p.body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.at },
    }).catch(() => {});
  }
}
export async function enableReminders(store: StoreLike) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return { ok: false, message: t("companion.rem.noProblemPhone") };
  store.update({ reminder: { ...store.saved.settings.reminder, on: true } });
  await syncReminders({ ...store, saved: { ...store.saved, settings: { ...store.saved.settings, reminder: { ...store.saved.settings.reminder, on: true } } } });
  track("reminder_on", {});
  return { ok: true, message: t("companion.rem.onPhone") };
}

export async function disableReminders(store: StoreLike) {
  store.update({ reminder: { ...store.saved.settings.reminder, on: false } });
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

export const reminderStatus = (on: boolean) => (on ? t("companion.rem.statusPhone") : t("companion.rem.statusOff"));

export async function registerWorker() { return null; }
