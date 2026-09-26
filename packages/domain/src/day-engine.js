// day-engine: the one place that decides what a "day" is in infinite hill.
// Pure functions over a plain state object: no React, no browser, no storage. Shared later with the
// Expo app as packages/domain. Rules (BUILD_BRIEF "Position, streak, and the map" + the laws):
//   - A day is earned once per local calendar date, by finishing a sit. More sits that date add nothing.
//   - Missed days never reset anything ("missed days are free"). There is no freeze and no repair.
//   - A door that was finished on an earlier date moves to its next lesson when the app next opens.
//   - The day count starts at 0; the first finished sit makes it 1.

export const STATE_VERSION = 1;
export const MILESTONES = Object.freeze([3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 300, 365]);
export const GOLDEN_WEEK = 7;
export const WELCOME_BACK_AFTER = 2; // missed dates before the "your days came with you" moment
const MAX_DATES = 800;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Local calendar date ("YYYY-MM-DD") for an instant in a time zone. */
export function localDate(now = new Date(), timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Whole days from date a to date b (both "YYYY-MM-DD"); positive when b is later. */
export function daysBetween(a, b) {
  if (!DATE_RE.test(a) || !DATE_RE.test(b)) return 0;
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

export function emptyState() {
  return { v: STATE_VERSION, showedUp: 0, dates: [], paths: {}, kids: [], goal: null, sitsByDate: {} };
}

/** Accepts anything (old saves, junk) and returns a valid state. */
export function normalizeState(raw) {
  const s = raw && typeof raw === "object" ? raw : {};
  const dates = [...new Set((Array.isArray(s.dates) ? s.dates : []).filter((d) => DATE_RE.test(d)))].sort().slice(-MAX_DATES);
  const paths = {};
  for (const [wing, p] of Object.entries(s.paths && typeof s.paths === "object" ? s.paths : {})) {
    if (!p || typeof p !== "object") continue;
    const day = Number.isInteger(p.day) && p.day >= 1 ? p.day : 1;
    paths[wing] = { day, done: p.done === true, ...(DATE_RE.test(p.lastDate) ? { lastDate: p.lastDate } : {}) };
  }
  return {
    ...s,
    v: STATE_VERSION,
    dates,
    // The count is the number of distinct dates shown up, never a free-running counter.
    showedUp: dates.length,
    paths,
    kids: Array.isArray(s.kids) ? s.kids : [],
    goal: s.goal && typeof s.goal === "object" ? s.goal : null,
    sitsByDate: s.sitsByDate && typeof s.sitsByDate === "object" ? s.sitsByDate : {},
  };
}

/** Finish a sit on `door` on local `date`. Returns the next state and what happened. */
export function completeSit(state, { door, date, kidIndex = null }) {
  const s = normalizeState(state);
  if (!DATE_RE.test(date)) throw new Error("completeSit needs a YYYY-MM-DD date");
  if (kidIndex !== null) {
    // A child's sit moves the child's own hill; it never counts toward the parent's days.
    const kids = s.kids.map((k, i) => (i === kidIndex ? { ...k, done: true, lastDate: date } : k));
    return { state: { ...s, kids }, isNewDay: false, showedUp: s.showedUp, milestone: null };
  }
  const isNewDay = !s.dates.includes(date);
  const dates = isNewDay ? [...s.dates, date].sort().slice(-MAX_DATES) : s.dates;
  const prev = s.paths[door] || { day: 1, done: false };
  const sitsByDate = { [date]: (s.sitsByDate[date] || 0) + 1 }; // only today's count is kept
  const next = { ...s, dates, showedUp: dates.length, sitsByDate, paths: { ...s.paths, [door]: { ...prev, done: true, lastDate: date } } };
  const milestone = isNewDay && MILESTONES.includes(next.showedUp) ? next.showedUp : null;
  return { state: next, isNewDay, showedUp: next.showedUp, milestone };
}

/** On open: move every door (and child) finished on an earlier date to its next lesson. */
export function rollover(state, today) {
  const s = normalizeState(state);
  const paths = {};
  for (const [wing, p] of Object.entries(s.paths)) {
    paths[wing] = p.done && p.lastDate && p.lastDate < today ? { day: p.day + 1, done: false, lastDate: p.lastDate } : p;
  }
  const kids = s.kids.map((k) => (k && k.done && k.lastDate && k.lastDate < today ? { ...k, day: (k.day || 1) + 1, done: false } : k));
  const sitsByDate = s.sitsByDate[today] ? { [today]: s.sitsByDate[today] } : {};
  return { ...s, paths, kids, sitsByDate };
}

/** Local dates since the last sit with no sit (0 when they sat today or yesterday). */
export function missedDays(state, today) {
  const s = normalizeState(state);
  const last = s.dates[s.dates.length - 1];
  if (!last) return 0;
  return Math.max(0, daysBetween(last, today) - 1);
}

/** "Your days came with you": shown once on the first open after a gap. */
export function shouldWelcomeBack(state, today) {
  return missedDays(state, today) >= WELCOME_BACK_AFTER && state.welcomedBackOn !== today;
}

/** Consecutive dates ending at the most recent sit (for the golden week; never shown as a loss). */
export function currentRun(state) {
  const s = normalizeState(state);
  let run = 0;
  for (let i = s.dates.length - 1; i >= 0; i--) {
    if (i === s.dates.length - 1 || daysBetween(s.dates[i], s.dates[i + 1]) === 1) run++;
    else break;
  }
  return run;
}

/** Golden weeks earned so far: each block of 7 consecutive dates, counted once. */
export function goldenWeeks(state) {
  const s = normalizeState(state);
  let weeks = 0;
  let run = 0;
  for (let i = 0; i < s.dates.length; i++) {
    run = i > 0 && daysBetween(s.dates[i - 1], s.dates[i]) === 1 ? run + 1 : 1;
    if (run > 0 && run % GOLDEN_WEEK === 0) weeks++;
  }
  return weeks;
}

/** Goal: 3 / 7 / 21 / 100 days, or "not yet". Progress counts days shown up since it was set. */
export function setGoal(state, days, today) {
  const s = normalizeState(state);
  if (days === null || days === "not_yet") return { ...s, goal: { days: null, setOn: today } };
  const n = Number(days);
  if (![3, 7, 21, 100].includes(n)) throw new Error("goal must be 3, 7, 21 or 100");
  // Set right after a sit (the day-1 screen), that day counts toward the goal.
  const startCount = s.showedUp - (s.dates.includes(today) ? 1 : 0);
  return { ...s, goal: { days: n, setOn: today, startCount } };
}

export function goalProgress(state) {
  const s = normalizeState(state);
  if (!s.goal || !s.goal.days) return null;
  const done = Math.max(0, s.showedUp - (s.goal.startCount || 0));
  return { days: s.goal.days, done: Math.min(done, s.goal.days), reached: done >= s.goal.days };
}
