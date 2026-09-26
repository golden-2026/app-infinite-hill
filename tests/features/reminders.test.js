import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REMINDER_STORAGE_KEY,
  getNextReminder,
  getReminderStatus,
  loadReminderPreference,
  normalizeReminderPreference,
  requestReminderPermission,
  saveReminderPreference,
  scheduleLocalReminder,
} from '../../src/features/reminders.js';

const date = value => new Date(value);

test('preferences are normalized and kept under a device-local storage key', () => {
  const memory = new Map();
  const storage = {
    getItem: key => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
  };
  const saved = saveReminderPreference({
    enabled: true, event: 'sunset', timezone: 'America/New_York',
    quietHours: { start: '22:00', end: '07:00' }, extra: 'discard me',
  }, storage);

  assert.equal(saved.saved, true);
  assert.deepEqual(loadReminderPreference(storage), {
    enabled: true, event: 'sunset', timezone: 'America/New_York',
    quietHours: { start: '22:00', end: '07:00' },
  });
  assert.equal(memory.has(REMINDER_STORAGE_KEY), true);
  assert.deepEqual(normalizeReminderPreference({ enabled: 1, event: 'midnight', timezone: 'Mars/Olympus' }), {
    enabled: false, event: 'sunset', timezone: null, quietHours: { start: null, end: null },
  });
});

test('permission is requested only by the explicit permission function', async () => {
  let calls = 0;
  const api = { requestPermission: async () => { calls += 1; return 'granted'; } };
  assert.equal(calls, 0);
  assert.deepEqual(await requestReminderPermission(api), { state: 'granted', permission: 'granted' });
  assert.equal(calls, 1);
  assert.deepEqual(await requestReminderPermission({ requestPermission: async () => 'default' }), {
    state: 'permission-required', permission: 'default',
  });
  assert.deepEqual(await requestReminderPermission(null), { state: 'unsupported', permission: 'unsupported' });
  assert.deepEqual(await requestReminderPermission({ requestPermission: async () => { throw new Error('blocked'); } }), {
    state: 'unsupported', permission: 'unsupported',
  });
});

test('status labels distinguish unsupported, denied, locally scheduled, and unconnected provider', () => {
  assert.equal(getReminderStatus({ enabled: true, notificationSupported: false, permission: 'granted' }), 'unsupported');
  assert.equal(getReminderStatus({ enabled: true, permission: 'denied' }), 'denied');
  assert.equal(getReminderStatus({ enabled: true, permission: 'default' }), 'permission-required');
  assert.equal(getReminderStatus({ enabled: true, permission: 'granted' }), 'pending-provider');
  assert.equal(getReminderStatus({ enabled: true, permission: 'granted', localSchedulerAvailable: true, scheduled: true }), 'scheduled-local');
  assert.equal(getReminderStatus({ enabled: false, permission: 'granted' }), 'disabled');
});

test('next event uses adapter-supplied sunset time in the requested timezone', () => {
  const result = getNextReminder({
    now: date('2026-09-13T23:30:00.000Z'),
    timezone: 'America/New_York',
    event: 'sunset',
    eventTimes: [
      { date: '2026-09-13', sunrise: '06:30', sunset: '19:10' },
      { date: '2026-09-14', sunrise: '06:31', sunset: '19:08' },
    ],
  });
  assert.equal(result?.toISOString(), '2026-09-14T23:08:00.000Z');
});

test('quiet hours defer overnight and daytime events to their local quiet-end time', () => {
  const overnight = getNextReminder({
    now: date('2026-09-14T02:00:00.000Z'),
    timezone: 'America/New_York', event: 'sunset',
    eventTimes: [{ date: '2026-09-13', sunset: '23:30' }],
    quietHours: { start: '22:00', end: '07:00' },
  });
  assert.equal(overnight?.toISOString(), '2026-09-14T11:00:00.000Z');

  const daytime = getNextReminder({
    now: date('2026-09-14T10:00:00.000Z'),
    timezone: 'America/New_York', event: 'sunrise',
    eventTimes: [{ date: '2026-09-14', sunrise: '06:30' }],
    quietHours: { start: '22:00', end: '07:00' },
  });
  assert.equal(daytime?.toISOString(), '2026-09-14T11:00:00.000Z');
});

test('quiet hours crossing midnight honor a same-day end and disabled equal endpoints', () => {
  const result = getNextReminder({
    now: date('2026-09-14T10:00:00.000Z'),
    timezone: 'America/New_York', event: 'sunrise',
    eventTimes: [{ date: '2026-09-14', sunrise: '06:30' }],
    quietHours: { start: '05:00', end: '07:00' },
  });
  assert.equal(result?.toISOString(), '2026-09-14T11:00:00.000Z');
  const noQuiet = getNextReminder({
    now: date('2026-09-14T10:00:00.000Z'), timezone: 'America/New_York', event: 'sunrise',
    eventTimes: [{ date: '2026-09-14', sunrise: '06:30' }],
    quietHours: { start: '07:00', end: '07:00' },
  });
  assert.equal(noQuiet?.toISOString(), '2026-09-14T10:30:00.000Z');
});

test('DST gaps are skipped, and ambiguous fall-back times choose the earlier valid instant', () => {
  const nonexistent = getNextReminder({
    now: date('2026-03-08T05:00:00.000Z'), timezone: 'America/New_York', event: 'sunrise',
    eventTimes: [{ date: '2026-03-08', sunrise: '02:30' }, { date: '2026-03-09', sunrise: '06:30' }],
  });
  assert.equal(nonexistent?.toISOString(), '2026-03-09T10:30:00.000Z');

  const ambiguous = getNextReminder({
    now: date('2026-11-01T04:00:00.000Z'), timezone: 'America/New_York', event: 'sunrise',
    eventTimes: [{ date: '2026-11-01', sunrise: '01:30' }],
  });
  assert.equal(ambiguous?.toISOString(), '2026-11-01T05:30:00.000Z');
});

test('invalid, past, and missing adapter values fail safely without guessing', () => {
  assert.equal(getNextReminder({ now: date('2026-09-13T00:00Z'), timezone: 'Local/Unknown', eventTimes: [] }), null);
  assert.equal(getNextReminder({ now: date('2026-09-13T00:00Z'), timezone: 'UTC', event: 'moonrise', eventTimes: [] }), null);
  assert.equal(getNextReminder({
    now: date('2026-09-13T20:00:00Z'), timezone: 'UTC', event: 'sunset',
    eventTimes: [
      { date: '2026-02-30', sunset: '21:00' },
      { date: '2026-09-13', sunset: '19:00' },
      { date: '2026-09-14', sunset: 'twilight' },
    ],
  }), null);
});

test('scheduler reports pending until its local adapter accepts; it never claims on permission alone', async () => {
  const preference = { enabled: true, event: 'sunset', timezone: 'UTC' };
  const eventTimes = [{ date: '2026-09-13', sunset: '19:00' }];
  const now = date('2026-09-13T17:00:00Z');
  const pending = await scheduleLocalReminder({ preference, permission: 'granted', eventTimes, now });
  assert.equal(pending.status, 'pending-provider');
  assert.equal(pending.scheduled, false);

  let request;
  const scheduled = await scheduleLocalReminder({
    preference, permission: 'granted', eventTimes, now,
    scheduler: async value => { request = value; return { scheduled: true }; },
  });
  assert.equal(scheduled.status, 'scheduled-local');
  assert.equal(scheduled.scheduled, true);
  assert.equal(request.at.toISOString(), '2026-09-13T19:00:00.000Z');

  const denied = await scheduleLocalReminder({
    preference, permission: 'denied', notificationSupported: true, eventTimes, now,
    scheduler: async () => { throw new Error('must not run'); },
  });
  assert.equal(denied.status, 'denied');
  assert.equal(denied.scheduled, false);
});
