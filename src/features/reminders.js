/** Device-local reminder preferences and scheduling helpers for Golden.
 *
 * This module never asks for location or looks up sunrise/sunset. An optional
 * adapter supplies event times for local calendar dates. Browser notification
 * permission is requested only by an explicit call to requestReminderPermission.
 */

export const REMINDER_STORAGE_KEY = 'golden:reminder:v1';

const VALID_EVENTS = new Set(['sunrise', 'sunset']);
const CLOCK_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeReminderPreference(value = {}) {
  const event = VALID_EVENTS.has(value.event) ? value.event : 'sunset';
  const timezone = isValidTimeZone(value.timezone) ? value.timezone : null;
  const quietHours = value.quietHours && typeof value.quietHours === 'object'
    ? {
        start: CLOCK_RE.test(value.quietHours.start || '') ? value.quietHours.start : null,
        end: CLOCK_RE.test(value.quietHours.end || '') ? value.quietHours.end : null,
      }
    : { start: null, end: null };

  return {
    enabled: value.enabled === true,
    event,
    timezone,
    quietHours,
  };
}

export function loadReminderPreference(storage = globalThis.localStorage) {
  if (!storage || typeof storage.getItem !== 'function') return normalizeReminderPreference();
  try {
    const raw = storage.getItem(REMINDER_STORAGE_KEY);
    return raw ? normalizeReminderPreference(JSON.parse(raw)) : normalizeReminderPreference();
  } catch {
    return normalizeReminderPreference();
  }
}

export function saveReminderPreference(value, storage = globalThis.localStorage) {
  const preference = normalizeReminderPreference(value);
  if (!storage || typeof storage.setItem !== 'function') return { saved: false, preference };
  try {
    storage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(preference));
    return { saved: true, preference };
  } catch {
    return { saved: false, preference };
  }
}

/** Call only from a user-initiated action. This function does not schedule. */
export async function requestReminderPermission(notificationApi = globalThis.Notification) {
  if (!notificationApi || typeof notificationApi.requestPermission !== 'function') {
    return { state: 'unsupported', permission: 'unsupported' };
  }
  try {
    const permission = await notificationApi.requestPermission();
    if (permission === 'granted') return { state: 'granted', permission };
    if (permission === 'denied') return { state: 'denied', permission };
    return { state: 'permission-required', permission: 'default' };
  } catch {
    return { state: 'unsupported', permission: 'unsupported' };
  }
}

/**
 * Describe only the capability actually established by the caller's adapters.
 * `pending-provider` means permission/preferences exist but no local scheduler
 * accepted the reminder; it must not be presented as a scheduled notification.
 */
export function getReminderStatus({
  enabled = false,
  permission = 'default',
  notificationSupported = true,
  localSchedulerAvailable = false,
  scheduled = false,
} = {}) {
  if (!notificationSupported) return 'unsupported';
  if (permission === 'denied') return 'denied';
  if (!enabled) return 'disabled';
  if (permission !== 'granted') return 'permission-required';
  if (scheduled && localSchedulerAvailable) return 'scheduled-local';
  return 'pending-provider';
}

/**
 * Convert adapter-provided event times into a safe next occurrence. `eventTimes`
 * is an array like [{ date: '2026-09-13', sunrise: '06:42', sunset: '19:11' }]
 * covering the dates the adapter can support. No astronomical/location work is
 * performed here. An absent or invalid time yields no candidate.
 */
export function getNextReminder({
  now = new Date(),
  timezone,
  event = 'sunset',
  eventTimes = [],
  quietHours = null,
} = {}) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime()) || !isValidTimeZone(timezone)) return null;
  if (!VALID_EVENTS.has(event) || !Array.isArray(eventTimes)) return null;

  const candidates = [];
  for (const day of eventTimes) {
    if (!day || !DATE_RE.test(day.date || '') || !isValidDateKey(day.date)) continue;
    const eventTime = day[event];
    if (typeof eventTime !== 'string' || !CLOCK_RE.test(eventTime)) continue;
    let at = localDateTimeToDate(day.date, eventTime, timezone);
    if (!at || at <= now) continue;

    if (isInQuietHours(at, timezone, quietHours)) {
      const quietEnd = quietHoursEndAfter(at, timezone, quietHours);
      if (!quietEnd || quietEnd <= at) continue;
      at = quietEnd;
    }
    if (at > now) candidates.push(at);
  }
  candidates.sort((a, b) => a.getTime() - b.getTime());
  return candidates[0] || null;
}

/** Schedule only after explicit permission; scheduler is an injected local adapter. */
export async function scheduleLocalReminder({
  preference,
  permission = 'default',
  notificationSupported = true,
  eventTimes = [],
  now = new Date(),
  scheduler,
} = {}) {
  const normalized = normalizeReminderPreference(preference);
  const next = getNextReminder({
    now,
    timezone: normalized.timezone,
    event: normalized.event,
    eventTimes,
    quietHours: normalized.quietHours,
  });
  const available = typeof scheduler === 'function';
  const initialStatus = getReminderStatus({
    enabled: normalized.enabled,
    permission,
    notificationSupported,
    localSchedulerAvailable: available,
  });
  if (!normalized.enabled || initialStatus !== 'pending-provider' || !next) {
    return { status: initialStatus, nextAt: next, scheduled: false };
  }
  try {
    const result = await scheduler({ at: next, event: normalized.event, timezone: normalized.timezone });
    const accepted = result === true || result?.scheduled === true;
    return {
      status: accepted ? 'scheduled-local' : 'pending-provider',
      nextAt: next,
      scheduled: accepted,
    };
  } catch {
    return { status: 'pending-provider', nextAt: next, scheduled: false };
  }
}

export function isValidTimeZone(timezone) {
  if (typeof timezone !== 'string' || !timezone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date(0));
    return true;
  } catch {
    return false;
  }
}

function isValidDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function zonedParts(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  return Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]));
}

function localDateKey(date, timezone) {
  const p = zonedParts(date, timezone);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

function localDateTimeToDate(dateKey, clock, timezone) {
  if (!isValidDateKey(dateKey) || !CLOCK_RE.test(clock)) return null;
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = clock.split(':').map(Number);
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute);

  // Sample possible zone offsets around the target. This handles DST folds by
  // choosing the earlier matching instant, and rejects nonexistent spring times.
  const offsets = new Set();
  for (const delta of [-36, -12, 0, 12, 36]) {
    const sample = new Date(targetUtc + delta * 60 * 60 * 1000);
    const p = zonedParts(sample, timezone);
    const represented = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    offsets.add(represented - sample.getTime());
  }
  const matches = [];
  for (const offset of offsets) {
    const candidate = new Date(targetUtc - offset);
    const p = zonedParts(candidate, timezone);
    if (p.year === year && p.month === month && p.day === day && p.hour === hour && p.minute === minute && p.second === 0) {
      matches.push(candidate);
    }
  }
  matches.sort((a, b) => a - b);
  return matches[0] || null;
}

function parseQuietHours(quietHours) {
  if (!quietHours || !CLOCK_RE.test(quietHours.start || '') || !CLOCK_RE.test(quietHours.end || '') || quietHours.start === quietHours.end) return null;
  const [sh, sm] = quietHours.start.split(':').map(Number);
  const [eh, em] = quietHours.end.split(':').map(Number);
  return { start: sh * 60 + sm, end: eh * 60 + em };
}

function isInQuietHours(date, timezone, quietHours) {
  const q = parseQuietHours(quietHours);
  if (!q) return false;
  const p = zonedParts(date, timezone);
  const minute = p.hour * 60 + p.minute;
  return q.start < q.end ? minute >= q.start && minute < q.end : minute >= q.start || minute < q.end;
}

function quietHoursEndAfter(date, timezone, quietHours) {
  const q = parseQuietHours(quietHours);
  if (!q) return null;
  const p = zonedParts(date, timezone);
  const today = localDateKey(date, timezone);
  const minute = p.hour * 60 + p.minute;
  const overnight = q.start > q.end;
  const endDate = overnight && minute >= q.start ? addDays(today, 1) : today;
  return localDateTimeToDate(endDate, quietHours.end, timezone);
}

function addDays(dateKey, n) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + n));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}
