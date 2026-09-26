// When the sun should find someone. Pure: the next `days` reminder instants, local time, never on a day
// they've already sat, never in quiet hours. v175 "sundown" was a fixed 7:02 pm; here it's 7:00 pm unless
// they pick a time. (Real sunset needs location; not asked in the pilot.)
export const SUNDOWN = "19:00";
export const QUIET = { from: 22, to: 7 }; // no reminders 10 pm – 7 am

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
