// When the sun should find someone. Pure: reminder instants in local time, never on a day they've already sat,
// never in quiet hours. Two shapes:
//   reminderTimes: the old fixed-time plan (one a day at their time, 7 pm "sundown" by default).
//   planReminders: the streak plan (owner brief 2026-09-30, the Duolingo way, made gentle):
//     - daily: about 23.5 hours after the last lesson (roughly when they did it yesterday), or at the time they set;
//     - streak saver: one note at 8 pm, only on a day when missing would break a streak of 2+ (no rest day left),
//       never in quiet mode (hard persona, heavy mood, bedtime);
//     - after 5 days without a lesson: one last gentle note ("i'll stop nudging …"), then nothing at all until the
//       next lesson, which re-plans from scratch (the Duolingo "we'll stop" note, in our own voice).
// Only the iPhone build schedules these today (local notifications, lib/reminders.native.ts). Web push goes through
// the reminders Edge Function, which only knows one fixed time a day and isn't switched on in this build.
export const SUNDOWN = "19:00";
export const QUIET = { from: 22, to: 7 }; // no reminders 10 pm – 7 am
export const SAVER_AT = 20; // 8 pm local
export const DAILY_AFTER_MIN = 23.5 * 60;
export const GO_QUIET_AFTER = 5; // the last note goes out on the 5th day after the last lesson; then quiet

export function reminderTimes({ time, now, doneToday, days = 7 }: { time: string; now: Date; doneToday: boolean; days?: number }): Date[] {
  const hhmm = time === "sundown" ? SUNDOWN : time;
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return [];
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (h >= QUIET.from || h < QUIET.to) h = 19; // quiet hours win
  const out: Date[] = [];
  for (let k = 0; out.length < days && k < days + 1; k++) {
    const d = new Date(now);
    d.setDate(d.getDate() + k);
    d.setHours(h, min, 0, 0);
    if (d <= now) continue;
    if (k === 0 && doneToday) continue;
    out.push(d);
  }
  return out;
}

export type Planned = { at: Date; kind: "daily" | "saver" | "last"; body: string };

/** The mascot's words. Warm, a little playful, never a guilt trip. Fourteen daily lines, one per calendar day in turn
 *  (dailyLine), so the same line never comes back within two weeks, however often the plan is re-made. */
export const NOTE = {
  daily: [
    "your hill's ready when you are. one lesson, about five minutes.",
    "hey, it's me. today's lesson is waiting. no rush.",
    "a few quiet minutes? i saved you a spot on the hill.",
    "i've got the kettle on. one lesson whenever you're ready.",
    "today's word is waiting for you. five minutes, then it's yours.",
    "the trail's quiet today. a good time for a few steps.",
    "i found a good one for today. come see?",
    "a small lesson, a big sky. ready when you are.",
    "just stopping by. your spot by the fire is free.",
    "one breath, one word, one line to carry. that's today.",
    "the sun's up on your hill. care to join me?",
    "five minutes for you and nobody else. today's lesson is here.",
    "i kept today's page open for you.",
    "a little step today is still a step. i'm here.",
  ],
  saver: (n: number) => `your ${n}-day streak would love one lesson tonight. i'll keep the lantern on.`,
  last: "i'll stop nudging for now. the door stays open, whenever you're ready.",
};
/** The same words in Spanish (picked from globalThis.__ihLang: this file stays import-free for the tests). */
export const NOTE_ES: typeof NOTE = {
  daily: [
    "tu colina está lista cuando tú lo estés. una lección, unos cinco minutos.",
    "hola, soy yo. la lección de hoy te espera. sin prisa.",
    "¿unos minutos de calma? te guardé un lugar en la colina.",
    "ya puse el agua para el té. una lección, cuando quieras.",
    "la palabra de hoy te espera. cinco minutos y ya es tuya.",
    "el sendero está tranquilo hoy. buen momento para unos pasos.",
    "encontré algo bonito para hoy. ¿vienes a ver?",
    "una lección pequeña, un cielo grande. cuando quieras.",
    "solo paso a saludar. tu lugar junto al fuego está libre.",
    "una respiración, una palabra, una frase para llevar. eso es hoy.",
    "ya salió el sol en tu colina. ¿me acompañas?",
    "cinco minutos para ti y para nadie más. la lección de hoy está aquí.",
    "te dejé abierta la página de hoy.",
    "un pasito hoy sigue siendo un paso. aquí estoy.",
  ],
  saver: (n: number) => `tu racha de ${n} días agradecería una lección esta noche. yo dejo el farol encendido.`,
  last: "dejo de recordarte por ahora. la puerta sigue abierta, cuando quieras.",
};
const note = () => ((globalThis as { __ihLang?: string }).__ihLang === "es" ? NOTE_ES : NOTE);

/** The daily line for a local date: the lines take turns by calendar day, so none repeats within NOTE.daily.length days. */
export function dailyLine(at: Date): string {
  const lines = note().daily;
  const day = Math.round(Date.UTC(at.getFullYear(), at.getMonth(), at.getDate()) / 86_400_000);
  return lines[((day % lines.length) + lines.length) % lines.length];
}

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const dayAt = (base: Date, k: number, h: number, m = 0) => { const d = new Date(base); d.setDate(d.getDate() + k); d.setHours(h, m, 0, 0); return d; };
/** Out of quiet hours: late evening comes forward to 9:30 pm, early morning moves to 7:30 am. */
function outOfQuiet(d: Date): Date {
  const h = d.getHours();
  if (h >= QUIET.from) { const x = new Date(d); x.setHours(21, 30, 0, 0); return x; }
  if (h < QUIET.to) { const x = new Date(d); x.setHours(7, 30, 0, 0); return x; }
  return d;
}

/**
 * The streak plan from the last finished lesson. `set` is false while they haven't picked a time (then the daily
 * note follows their own rhythm). `streak`/`rest` are as of the last lesson; `quiet` turns the saver off.
 * Everything is in the phone's local time (Date's own local fields), so a time-zone change re-plans naturally.
 */
export function planReminders(o: {
  now: Date; lastLessonAt: Date | null; time: string; set: boolean; doneToday: boolean;
  streak: number; rest: number; quiet: boolean; streakOn?: boolean;
}): Planned[] {
  const { now, lastLessonAt: last } = o;
  if (!last) return reminderTimes({ time: o.time, now, doneToday: o.doneToday, days: GO_QUIET_AFTER }).map((at) => ({ at, kind: "daily" as const, body: dailyLine(at) }));
  const hhmm = /^(\d{1,2}):(\d{2})$/.exec(o.time === "sundown" ? SUNDOWN : o.time);
  const out: Planned[] = [];
  for (let k = 1; k <= GO_QUIET_AFTER; k++) {
    let at: Date;
    if (o.set && hhmm) at = outOfQuiet(dayAt(last, k, Number(hhmm[1]), Number(hhmm[2])));
    else at = outOfQuiet(new Date(last.getTime() + (DAILY_AFTER_MIN + (k - 1) * 24 * 60) * 60_000));
    if (k === GO_QUIET_AFTER) { out.push({ at, kind: "last", body: note().last }); break; }
    // the saver: the one evening when missing would break the streak (every rest day already spent)
    const saverDay = dayAt(last, k, SAVER_AT);
    const atRisk = o.streakOn !== false && !o.quiet && o.streak >= 2 && k - 1 === o.rest;
    if (atRisk) {
      out.push({ at: saverDay, kind: "saver", body: note().saver(o.streak) });
      // one note that evening, not two: a daily that lands within 90 minutes of the saver steps aside
      if (sameDay(at, saverDay) && Math.abs(at.getTime() - saverDay.getTime()) < 90 * 60_000) continue;
    }
    out.push({ at, kind: "daily", body: dailyLine(at) });
  }
  return out
    .filter((p) => p.at > now && !(o.doneToday && sameDay(p.at, now)))
    .sort((a, b) => a.at.getTime() - b.at.getTime());
}
