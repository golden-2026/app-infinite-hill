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

function pathFrom(sits, today, start = 1, moved = null) {
  // The furthest lesson finished on this door decides where the door is now. `start`: where placement started them
  // (the start of the highest stretch they showed they know); the door is never behind it, and a lesson caught up
  // from before it (day 3 after starting at 22) doesn't move the door back.
  if (moved) return movedPath(sits, today, moved);
  let top = null;
  for (const s of sits) if (!top || s.day > top.day || (s.day === top.day && s.date > top.date)) top = s;
  if (!top) return { day: start, done: false, lastDate: null };
  if (top.day < start) return { day: start, done: false, lastDate: top.date };
  return top.date >= today ? { day: top.day, done: true, lastDate: top.date } : { day: top.day + 1, done: false, lastDate: top.date };
}

// A door someone chose to move (walked back to the start of an earlier stretch, or jumped to the next one, after
// placement): it stands at `moved.day` from `moved.at` on. Nothing is removed: every sit still counts for the streak
// and the days walked, and only the lessons finished after the move decide where the door goes next. Days already
// finished ahead are stepped over when the walk reaches them again (finished stays finished).
function movedPath(sits, today, moved) {
  let lastDate = null;
  for (const s of sits) if (!lastDate || s.date > lastDate) lastDate = s.date;
  let top = null;
  for (const s of sits) if (s.at > moved.at && s.day >= moved.day && (!top || s.day > top.day || (s.day === top.day && s.date > top.date))) top = s;
  if (!top) return { day: moved.day, done: false, lastDate };
  if (top.date >= today) return { day: top.day, done: true, lastDate };
  const walked = new Set(sits.map((s) => s.day));
  let next = top.day + 1;
  while (walked.has(next)) next++;
  return { day: next, done: false, lastDate };
}

/** Doors moved after placement: { HINDUISM: { day: 157, at: "2026-10-09T08:00:00.000Z" } }. Junk is dropped. */
export function movedTo(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [door, m] of Object.entries(raw)) {
    if (door && m && typeof m === "object" && Number.isInteger(m.day) && m.day >= 1 && m.day <= 2000 && typeof m.at === "string" && !Number.isNaN(Date.parse(m.at))) out[door] = { day: m.day, at: m.at };
  }
  return out;
}

/** Where placement started someone on each door: { HINDUISM: 22 }. Junk and day 1 are dropped. */
export function placedStarts(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [door, day] of Object.entries(raw)) if (typeof door === "string" && door && Number.isInteger(day) && day > 1 && day <= 2000) out[door] = day;
  return out;
}

/**
 * Everything the screens show, from the sit log plus a few settings.
 * settings: { goal: { days, setOn } | null, welcomedBackOn, kids: [{ id, name, door, birthYear? }], placed: { door: startDay } }
 */
export function deriveState(sitLog, { today, settings = {} } = {}) {
  if (!DATE_RE.test(today)) throw new Error("deriveState needs today as YYYY-MM-DD");
  const sits = mergeSits(sitLog);
  const own = sits.filter((s) => !s.kidId);
  const dates = [...new Set(own.map((s) => s.date))].sort();

  const doors = {};
  for (const s of own) (doors[s.door] ||= []).push(s);
  const placed = placedStarts(settings.placed);
  const moved = movedTo(settings.moved);
  const paths = Object.fromEntries(Object.entries(doors).map(([door, list]) => [door, pathFrom(list, today, placed[door], moved[door])]));
  // a door someone was placed on (or moved), with nothing walked yet, already stands at its start
  for (const [door, start] of Object.entries(placed)) if (!paths[door]) paths[door] = pathFrom([], today, start, moved[door]);
  for (const [door, m] of Object.entries(moved)) if (!paths[door] && m.day > 1) paths[door] = pathFrom([], today, 1, m);

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
