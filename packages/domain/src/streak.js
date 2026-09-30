// streak: consecutive local dates with at least one finished lesson, with rest days built in.
// Pure: a map of lessons per local date in, the streak out. Dates are the sit's own local date ("YYYY-MM-DD",
// written when the lesson finished, in the phone's time zone), so travel and daylight saving never move a day.
// Rules (owner brief 2026-09-30, after Duolingo's retention work, made faith-appropriate):
//   - One finished lesson on a date extends the streak by one. More that date add nothing to the count.
//   - Rest days are the streak freeze: a new streak starts with 2 banked, never more than 2, and every
//     7 days of streak earns one back. A missed day spends one automatically and keeps the streak (the day is
//     shown as rest, never red). Today is never "missed" until it is over.
//   - With no rest day left, a missed day breaks the streak. For 3 days after that day, finishing 2 lessons on
//     one date earns it back: the missed days become rest days and the count carries on. Never paid.
//   - Golden: 7+ lesson days in a row with no rest day spent.
import { daysBetween } from "./day-engine.js";

export const STREAK_MILESTONES = Object.freeze([3, 7, 14, 30, 50, 100, 365]);
export const STREAK_GOALS = Object.freeze([7, 14, 30, 50, 100, 365]);
export const REST_START = 2;
export const REST_MAX = 2;
export const REST_EVERY = 7;
export const EARN_BACK_DAYS = 3;
export const EARN_BACK_LESSONS = 2;
export const GOLDEN_AFTER = 7;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_WALK = 20_000; // days; a bad date in the log can't make the walk run forever

/** The date n days after `date` (n may be negative). Calendar math, independent of any time zone. */
export function addDays(date, n) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Lessons per date, from sit records (a kid's sits only when kidId is given; otherwise only the adult's own). */
export function lessonCounts(sits, kidId = null) {
  const out = {};
  for (const s of Array.isArray(sits) ? sits : []) {
    if (!s || !DATE_RE.test(s.date)) continue;
    if ((s.kidId || null) !== (kidId || null)) continue;
    out[s.date] = (out[s.date] || 0) + 1;
  }
  return out;
}

const none = (today) => ({
  streak: 0, rest: 0, clean: 0, golden: false, doneToday: false, lessonsToday: 0, atRisk: false, longest: 0,
  startedOn: null, lastLessonDate: null, days: {}, earnBack: null, restoredToday: false, restedYesterday: false, today,
});

/**
 * The streak as of `today`. `counts` is { date: lessons } (see lessonCounts).
 * days: { date: "lesson" | "rest" | "restored" } for dates inside streaks (missed days outside one are absent).
 * earnBack: { lost, brokeOn, lastDay, lessonsToday, need } while the 3-day offer is open, else null.
 */
export function streakFrom(counts, today) {
  if (!DATE_RE.test(today)) throw new Error("streakFrom needs today as YYYY-MM-DD");
  const c = counts || {};
  const dates = Object.keys(c).filter((d) => DATE_RE.test(d) && d <= today && c[d] > 0).sort();
  if (!dates.length) return none(today);
  let first = dates[0];
  if (daysBetween(first, today) > MAX_WALK) first = addDays(today, -MAX_WALK);

  let streak = 0, rest = 0, clean = 0, longest = 0, startedOn = null;
  let broke = null; // the latest break: { on, lost, startedOn, rest, gap: [dates], restored: date | null }
  const days = {};
  for (let d = first; d <= today; d = addDays(d, 1)) {
    const n = c[d] || 0;
    if (n > 0) {
      if (streak === 0) { rest = REST_START; clean = 0; startedOn = d; }
      streak++;
      clean++;
      days[d] = "lesson";
      if (streak % REST_EVERY === 0) rest = Math.min(REST_MAX, rest + 1);
      if (broke && !broke.restored) {
        const since = daysBetween(broke.on, d);
        if (since > EARN_BACK_DAYS) broke = null;
        else if (n >= EARN_BACK_LESSONS) {
          // earned back: the missed days become rest days and the old count carries on under the new days
          for (const g of broke.gap) days[g] = "restored";
          streak = broke.lost + streak;
          startedOn = broke.startedOn;
          broke.restored = d; // the rest days banked since the restart stay banked
        }
      }
    } else if (d === today) {
      // today is still open: nothing is missed yet
    } else if (streak > 0) {
      if (rest > 0) {
        rest--;
        clean = 0;
        days[d] = "rest";
      } else {
        broke = { on: d, lost: streak, startedOn, gap: [d], restored: null };
        streak = 0;
        clean = 0;
        startedOn = null;
      }
    } else if (broke && !broke.restored) {
      broke.gap.push(d);
    }
    longest = Math.max(longest, streak);
  }

  const lessonsToday = c[today] || 0;
  const doneToday = lessonsToday > 0;
  const since = broke && !broke.restored ? daysBetween(broke.on, today) : null;
  const earnBack = since !== null && since >= 1 && since <= EARN_BACK_DAYS && lessonsToday < EARN_BACK_LESSONS
    ? { lost: broke.lost, brokeOn: broke.on, lastDay: addDays(broke.on, EARN_BACK_DAYS), lessonsToday, need: EARN_BACK_LESSONS }
    : null;
  return {
    streak,
    rest: streak > 0 ? rest : 0,
    clean,
    golden: streak >= GOLDEN_AFTER && clean >= GOLDEN_AFTER,
    doneToday,
    lessonsToday,
    // missing today would break it (no rest day left): the only time anything is "at stake"
    atRisk: streak > 0 && !doneToday && rest === 0,
    longest,
    startedOn,
    lastLessonDate: dates[dates.length - 1],
    days,
    earnBack,
    restoredToday: !!broke && broke.restored === today,
    restedYesterday: days[addDays(today, -1)] === "rest",
    today,
  };
}

/** What finishing one more lesson today would do to the streak: before/after, a milestone, an earn-back. */
export function streakOutcome(counts, today) {
  const before = streakFrom(counts, today);
  const after = streakFrom({ ...counts, [today]: (counts?.[today] || 0) + 1 }, today);
  const grew = after.streak > before.streak;
  return {
    before: before.streak,
    after: after.streak,
    grew,
    restored: after.restoredToday && !before.restoredToday,
    milestone: grew && STREAK_MILESTONES.includes(after.streak) ? after.streak : null,
    rest: after.rest,
    golden: after.golden,
    becameGolden: after.golden && !before.golden,
  };
}

/** The Monday-to-Sunday week holding `today`: each date and what it was. */
export function streakWeek(s, today) {
  const dow = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7; // 0 = Monday
  const monday = addDays(today, -dow);
  return ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((label, i) => {
    const date = addDays(monday, i);
    const kind = s.days[date] || null;
    return { date, label, kind: date > today ? "later" : kind === "lesson" ? "lesson" : kind === "rest" || kind === "restored" ? "rest" : date === today ? "today" : "empty" };
  });
}

/** The next goal after one is reached (7 → 14 → 30 → 50 → 100 → 365). */
export function nextGoal(days) {
  return STREAK_GOALS.find((g) => g > (days || 0)) ?? null;
}
