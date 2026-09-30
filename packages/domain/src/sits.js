// sits: the event log that the whole app state is derived from.
// One record per finished sit. Devices sync by set union (by id), so the same sits in any order, from any
// number of devices, always derive the same state. Nothing is ever overwritten, so nothing conflicts.
import { currentRun, daysBetween, goldenWeeks, missedDays, MILESTONES, WELCOME_BACK_AFTER } from "./day-engine.js";
import { lessonCounts, streakFrom, streakOutcome } from "./streak.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

/** A new sit record. `id` must be unique (a random id from the caller). */
export function makeSit({ id, door, day, date, tz, kidId = null, deviceId = null, at }) {
  const sit = { id, door, day, date, tz: tz || null, kidId, deviceId, at };
  const problem = invalidSit(sit);
  if (problem) throw new Error(`makeSit: ${problem}`);
  return sit;
}

export function invalidSit(s) {
  if (!s || typeof s !== "object") return "not an object";
  if (!ID_RE.test(String(s.id))) return "bad id";
  if (typeof s.door !== "string" || !s.door) return "bad door";
  if (!Number.isInteger(s.day) || s.day < 1) return "bad day";
  if (!DATE_RE.test(s.date)) return "bad date";
  if (typeof s.at !== "string" || Number.isNaN(Date.parse(s.at))) return "bad at";
  return null;
}

/** Union of sit logs by id. Invalid records are dropped. Output is sorted by time, then id. */
export function mergeSits(...logs) {
  const byId = new Map();
  for (const log of logs) for (const s of Array.isArray(log) ? log : []) if (!invalidSit(s) && !byId.has(s.id)) byId.set(s.id, s);
  return [...byId.values()].sort((a, b) => (a.at === b.at ? (a.id < b.id ? -1 : 1) : a.at < b.at ? -1 : 1));
}

function pathFrom(sits, today) {
  // The furthest lesson finished on this door decides where the door is now.
  let top = null;
  for (const s of sits) if (!top || s.day > top.day || (s.day === top.day && s.date > top.date)) top = s;
  if (!top) return { day: 1, done: false, lastDate: null };
  return top.date >= today ? { day: top.day, done: true, lastDate: top.date } : { day: top.day + 1, done: false, lastDate: top.date };
}

/**
 * Everything the screens show, from the sit log plus a few settings.
 * settings: { goal: { days, setOn } | null, welcomedBackOn, kids: [{ id, name, door, birthYear? }] }
 */
export function deriveState(sitLog, { today, settings = {} } = {}) {
  if (!DATE_RE.test(today)) throw new Error("deriveState needs today as YYYY-MM-DD");
  const sits = mergeSits(sitLog);
  const own = sits.filter((s) => !s.kidId);
  const dates = [...new Set(own.map((s) => s.date))].sort();

  const doors = {};
  for (const s of own) (doors[s.door] ||= []).push(s);
  const paths = Object.fromEntries(Object.entries(doors).map(([door, list]) => [door, pathFrom(list, today)]));

  const kids = (settings.kids || []).map((k) => {
    const p = pathFrom(sits.filter((s) => s.kidId === k.id), today);
    // a child's streak is their own: their sits never extend or break the parent's, and the parent's never touch theirs
    return { ...k, day: p.day, done: p.done, lastDate: p.lastDate, streak: streakFrom(lessonCounts(sits, k.id), today) };
  });

  const view = { dates, showedUp: dates.length, welcomedBackOn: settings.welcomedBackOn || null };
  const goal = settings.goal && settings.goal.days ? settings.goal : null;
  const goalDone = goal ? dates.filter((d) => d >= goal.setOn).length : 0;

  return {
    showedUp: dates.length,
    dates,
    paths,
    kids,
    sitsToday: own.filter((s) => s.date === today).length,
    doneToday: dates.includes(today),
    goal: goal ? { days: goal.days, done: Math.min(goalDone, goal.days), reached: goalDone >= goal.days } : null,
    goldenWeeks: goldenWeeks(view),
    currentRun: currentRun(view),
    streak: streakFrom(lessonCounts(own), today),
    missedDays: missedDays(view, today),
    welcomeBack: missedDays(view, today) >= WELCOME_BACK_AFTER && view.welcomedBackOn !== today,
  };
}

/** What finishing one more sit on `date` would mean: a new day? a milestone? */
export function sitOutcome(sitLog, date, kidId = null) {
  const sits = mergeSits(sitLog);
  const dates = new Set(sits.filter((s) => !s.kidId).map((s) => s.date));
  const isNewDay = !dates.has(date);
  const showedUp = dates.size + (isNewDay ? 1 : 0);
  return { isNewDay, showedUp, milestone: isNewDay && MILESTONES.includes(showedUp) ? showedUp : null, streak: streakOutcome(lessonCounts(sits, kidId), date) };
}

export { daysBetween };
