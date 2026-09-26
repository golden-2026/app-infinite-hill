import { getDoor, getSession, listDoorSessions } from "../content/catalog.js";

const VALID_GOALS = new Set([7, 21, 100]);
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];

const record = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const positiveInteger = (value, fallback = 1) => Number.isInteger(value) && value > 0 ? value : fallback;
const dateKey = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
const dayAfter = (date, days) => {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return `${result.getUTCFullYear()}-${String(result.getUTCMonth() + 1).padStart(2, "0")}-${String(result.getUTCDate()).padStart(2, "0")}`;
};

/** Normalize new progression fields while retaining the v150 app's legacy shape. */
export function normalizeProgression(state = {}) {
  const value = record(state);
  const paths = Object.fromEntries(Object.entries(record(value.paths)).map(([door, path]) => {
    const saved = record(path);
    return [door, { ...saved, day: positiveInteger(saved.day), done: saved.done === true }];
  }));
  const history = Array.isArray(value.completionHistory) ? value.completionHistory.filter((item) => {
    return item && typeof item.door === "string" && positiveInteger(item.lesson, 0) > 0 && dateKey(item.date);
  }).map((item) => ({ ...item, lesson: positiveInteger(item.lesson), date: dateKey(item.date) })) : [];
  const reviews = Array.isArray(value.reviews) ? value.reviews.filter((item) => item && typeof item.id === "string" && typeof item.door === "string" && typeof item.word === "string" && dateKey(item.dueDate)).map((item) => ({
    ...item,
    reviewCount: Number.isInteger(item.reviewCount) && item.reviewCount > 0 ? item.reviewCount : 0,
  })) : [];
  return {
    ...value,
    paths,
    showedUp: Number.isFinite(value.showedUp) ? Math.max(0, value.showedUp) : 0,
    lastCompletedDate: dateKey(value.lastCompletedDate),
    showedUpDates: Array.isArray(value.showedUpDates) ? [...new Set(value.showedUpDates.filter(dateKey))] : [],
    completionHistory: history,
    reviews,
    goal: VALID_GOALS.has(value.goal) ? value.goal : 7,
  };
}

/** Return the saved lesson position for a door, including its placement offset. */
export function lessonPosition(state, door) {
  const value = record(state);
  const path = record(record(value.paths)[door]);
  const offset = record(value.offsets)[door];
  return positiveInteger(path.day) + (Number.isInteger(offset) && offset > 0 ? offset : 0);
}

/** Mark a lesson complete and credit at most one showed-up day for a local date. */
export function completeLesson(state, { door, lesson, date, word = null, carry = null } = {}) {
  if (typeof door !== "string" || !door || !positiveInteger(lesson, 0) || !dateKey(date)) {
    throw new TypeError("door, positive lesson number, and YYYY-MM-DD local date are required");
  }
  const next = normalizeProgression(state);
  const key = `${door}:${lesson}`;
  const previous = next.completionHistory.find((item) => item.id === key);
  const historyItem = {
    ...(previous || {}), id: key, door, lesson, date,
    ...(typeof word === "string" && word.trim() ? { word: word.trim() } : {}),
    ...(typeof carry === "string" && carry.trim() ? { carry: carry.trim() } : {}),
  };
  if (previous) next.completionHistory = next.completionHistory.map((item) => item.id === key ? historyItem : item);
  else next.completionHistory = [...next.completionHistory, historyItem];

  const alreadyCredited = next.showedUpDates.includes(date) || next.lastCompletedDate === date;
  if (!alreadyCredited) {
    next.showedUp += 1;
    next.showedUpDates.push(date);
  }
  // Keep the legacy field as the most recently credited local date.
  if (!alreadyCredited || next.lastCompletedDate == null) next.lastCompletedDate = date;
  next.paths[door] = { ...(next.paths[door] || { day: 1, done: false }), done: true };

  if (typeof historyItem.word === "string" && !next.reviews.some((item) => item.id === key)) {
    next.reviews.push({ id: key, door, lesson, word: historyItem.word, dueDate: dayAfter(date, 1), reviewCount: 0 });
  }
  return next;
}

/** Advance one door only; the visiting door never moves the home door's position. */
export function advanceLesson(state, door) {
  if (typeof door !== "string" || !door) throw new TypeError("door is required");
  const next = normalizeProgression(state);
  const path = next.paths[door] || { day: 1, done: false };
  if (path.done) next.paths[door] = { ...path, day: path.day + 1, done: false };
  return next;
}

export function setProgressGoal(state, goal) {
  if (!VALID_GOALS.has(goal)) throw new RangeError("goal must be 7, 21, or 100");
  return { ...normalizeProgression(state), goal };
}

/** Return up to three due review cards in stable, repeatable order. */
export function dueReviews(state, date, limit = 3) {
  if (!dateKey(date)) throw new TypeError("YYYY-MM-DD local date is required");
  const count = Number.isInteger(limit) ? Math.max(0, limit) : 3;
  return normalizeProgression(state).reviews
    .filter((item) => item.dueDate <= date)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.door.localeCompare(b.door) || a.lesson - b.lesson || a.id.localeCompare(b.id))
    .slice(0, count);
}

/** Schedule the next deterministic review after a card is practiced. */
export function recordReview(state, { id, date, remembered } = {}) {
  if (typeof id !== "string" || !dateKey(date) || typeof remembered !== "boolean") {
    throw new TypeError("review id, YYYY-MM-DD local date, and remembered result are required");
  }
  const next = normalizeProgression(state);
  next.reviews = next.reviews.map((item) => {
    if (item.id !== id) return item;
    const reviewCount = remembered ? item.reviewCount + 1 : 0;
    const interval = remembered ? REVIEW_INTERVALS[Math.min(reviewCount, REVIEW_INTERVALS.length - 1)] : 1;
    return { ...item, reviewCount, dueDate: dayAfter(date, interval), lastReviewedDate: date };
  });
  return next;
}

const completionId = (door, lesson) => `${door}:${lesson}`;

/** Build a path map from the lessons the person actually completed. */
export function derivePathProgress(state, door) {
  const normalized = normalizeProgression(state);
  const catalogDoor = getDoor(door);
  if (!catalogDoor) return { door, label: "Your door", currentLesson: null, completedCount: 0, mappedCount: 0, camps: [], stops: [] };

  const sessions = listDoorSessions(door);
  const completed = new Set(normalized.completionHistory.filter((item) => item.door === door).map((item) => item.lesson));
  const position = lessonPosition(normalized, door);
  let currentLesson = sessions.some((item) => item.lesson === position) ? position : null;
  if (currentLesson != null && completed.has(currentLesson)) {
    currentLesson = sessions.find((item) => item.lesson >= currentLesson && !completed.has(item.lesson))?.lesson
      ?? sessions.find((item) => !completed.has(item.lesson))?.lesson
      ?? null;
  }
  const stops = sessions.map((session) => {
    const isComplete = completed.has(session.lesson);
    const isCurrent = !isComplete && session.lesson === currentLesson;
    return {
      ...session,
      completed: isComplete,
      current: isCurrent,
      locked: !isComplete && currentLesson != null && session.lesson > currentLesson,
      state: isComplete ? "completed" : isCurrent ? (session.canPreview ? "current" : "current-coming") : currentLesson != null && session.lesson > currentLesson ? "locked" : session.canPreview ? "available" : "coming",
    };
  });
  const camps = catalogDoor.camps.map((camp) => {
    const campStops = stops.filter((session) => session.camp === camp.camp);
    const completedInCamp = campStops.filter((session) => session.completed).length;
    const firstIncomplete = campStops.find((session) => !session.completed) || null;
    const priorComplete = camp.camp === 1 || catalogDoor.camps
      .filter((prior) => prior.camp < camp.camp)
      .every((prior) => {
        const priorStops = stops.filter((session) => session.camp === prior.camp);
        return priorStops.length > 0 && priorStops.every((session) => session.completed);
      });
    const arrived = Boolean(firstIncomplete && firstIncomplete.lesson === currentLesson && priorComplete && completedInCamp === 0);
    return {
      ...camp,
      stops: campStops,
      completedCount: completedInCamp,
      mappedCount: campStops.length,
      authoredCount: campStops.filter((session) => session.canPreview).length,
      availableCount: campStops.filter((session) => session.state === "available").length,
      lockedCount: campStops.filter((session) => session.locked).length,
      comingCount: campStops.filter((session) => session.state === "coming" || session.state === "current-coming").length,
      complete: campStops.length > 0 && completedInCamp === campStops.length,
      arrived,
      locked: Boolean(firstIncomplete && firstIncomplete.lesson > (currentLesson ?? Infinity)),
      nextSession: firstIncomplete,
      state: campStops.length > 0 && completedInCamp === campStops.length ? "completed" : arrived ? "arrival" : firstIncomplete?.lesson === currentLesson ? "in-progress" : firstIncomplete && currentLesson != null && firstIncomplete.lesson > currentLesson ? "locked" : "coming",
    };
  });
  return {
    door,
    label: catalogDoor.label,
    currentLesson,
    completedCount: stops.filter((session) => session.completed).length,
    mappedCount: sessions.length,
    camps,
    stops,
  };
}

/** Return only words attached to a real completed lesson, in earned order. */
export function deriveStrand(state, door = null) {
  const normalized = normalizeProgression(state);
  return normalized.completionHistory
    .filter((item) => door == null || item.door === door)
    .map((item) => {
      const session = getSession(item.door, item.lesson);
      const word = typeof item.word === "string" && item.word.trim() ? item.word.trim() : "";
      if (!word) return null;
      return {
        id: item.id || completionId(item.door, item.lesson),
        door: item.door,
        doorLabel: getDoor(item.door)?.label || "Your door",
        lesson: item.lesson,
        date: item.date,
        word,
        carry: typeof item.carry === "string" ? item.carry : session?.carry || "",
        title: session?.title || `Lesson ${item.lesson}`,
        camp: session?.camp || null,
        dueDate: normalized.reviews.find((review) => review.id === (item.id || completionId(item.door, item.lesson)))?.dueDate || null,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date) || a.door.localeCompare(b.door) || a.lesson - b.lesson);
}

/** Derive a due or empty review state from the actual spaced-review queue. */
export function deriveReviewState(state, date, limit = 3) {
  const normalized = normalizeProgression(state);
  const due = dueReviews(normalized, date, limit).map((item) => {
    const session = getSession(item.door, item.lesson);
    return {
      ...item,
      doorLabel: getDoor(item.door)?.label || "Your door",
      title: session?.title || `Lesson ${item.lesson}`,
      carry: session?.carry || "",
      camp: session?.camp || null,
    };
  });
  const nextDate = normalized.reviews.map((item) => item.dueDate).filter((value) => value > date).sort()[0] || null;
  return { date, status: due.length ? "due" : "empty", cards: due, count: due.length, nextDate };
}

/** Persist review answers and return the real schedule written for each card. */
export function completeReview(state, { date, answers } = {}) {
  if (!dateKey(date) || !Array.isArray(answers) || answers.some((answer) => !answer || typeof answer.id !== "string" || typeof answer.remembered !== "boolean")) {
    throw new TypeError("YYYY-MM-DD local date and review answers are required");
  }
  const dueIds = new Set(dueReviews(state, date, Number.MAX_SAFE_INTEGER).map((item) => item.id));
  const unique = [...new Map(answers.map((answer) => [answer.id, answer])).values()];
  if (unique.some((answer) => !dueIds.has(answer.id))) throw new RangeError("only due review cards can be completed");
  let next = normalizeProgression(state);
  for (const answer of unique) next = recordReview(next, { id: answer.id, date, remembered: answer.remembered });
  const items = unique.map((answer) => next.reviews.find((item) => item.id === answer.id)).filter(Boolean);
  const remembered = unique.filter((answer) => answer.remembered).length;
  return { state: next, result: { date, remembered, total: unique.length, items } };
}
