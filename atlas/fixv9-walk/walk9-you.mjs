// Atlas v9, lanes "daily" and "you": what changed on Today (the streak header, the Today quest card, streak off) and
// in You (hours learned, practices try/learn, show my streak). Frozen 5182 build, clock fixed, test data only.
// Run: node walk9-you.mjs [daily,you]
import { B, W, addDays, lane, open, seed, calm, click, into, toTop } from './_w9.mjs';

const only = process.argv[2] ? process.argv[2].split(',') : ['daily', 'you'];
const TODAY = '2026-10-07';
let n = 0;
const sit = (date, door = 'HINDUISM', day) => ({ id: `sit_walk${String(++n).padStart(6, '0')}`, door, day: day ?? n, date, tz: 'America/New_York', kidId: null, deviceId: 'dev_walk0001', at: `${date}T14:00:00.000Z` });
const profile = (door, answers = {}) => ({ v: 1, door, knowledge: 40, commitment: 60, openness: 'sometimes', answers: { raised: 'yes', practice: 'weekly', hold: 'fully', ...answers }, bridges: {}, lastBridgeOn: null, setOn: '2026-06-01' });
const state = (sits, settings = {}) => ({ v: 1, deviceId: 'dev_walk0001', sits, outbox: [], settingsVersion: 1, settings: { onboarded: true, homeWing: 'HINDUISM', active: 'home', analytics: 'no', unlocksSeen: ['guide', 'together'], book: [], signals: [], kids: [], reminder: { on: false, time: 'sundown' }, profile: profile('HINDUISM'), ...settings } });
const days = (k0, door) => Array.from({ length: k0 }, (_, i) => sit(addDays(TODAY, i - k0), door, i + 1));

if (only.includes('daily')) {
  const { save, shot } = lane('daily');
  const o = await open({ clock: `${TODAY}T09:30:00-04:00` });
  await seed(o.page, state(days(5)), calm(TODAY));
  await o.page.goto(B + '/today'); await W(o.page, 3000);
  await shot(o, 'v9-01-today-streak-header', 800);
  await into(o.page, 'streak-pill', 120);
  await shot(o, 'v9-02-today-streak-pill', 600);
  await o.close();
  // Advent, a Christian door that joined: the quest card on Today
  n = 0;
  const q = await open({ clock: '2026-12-03T09:30:00-05:00' });
  const qs = Array.from({ length: 12 }, (_, i) => sit(addDays('2026-12-03', i - 12), 'CHRISTIANITY', 30 + i));
  await seed(q.page, state(qs, { homeWing: 'CHRISTIANITY', profile: profile('CHRISTIANITY', {}), quests: { 'advent-2026': { joined: '2026-11-25' } } }), calm('2026-12-03'));
  await q.page.goto(B + '/today'); await W(q.page, 3000);
  await toTop(q.page);
  await shot(q, 'v9-03-today-top-during-advent', 800);
  await into(q.page, 'quest-card');
  await shot(q, 'v9-04-today-quest-card', 800);
  await q.close();
  save();
}

if (only.includes('you')) {
  const { log, save, shot } = lane('you');
  n = 0;
  const o = await open({ clock: `${TODAY}T09:30:00-04:00` });
  const s = days(40);
  const timed = Object.fromEntries(s.slice(-10).map((x) => [x.date, { m: 6, n: 1 }]));
  await seed(o.page, state(s, { timed }), calm(TODAY));
  await o.page.goto(B + '/you'); await W(o.page, 3000);
  await shot(o, 'v9-01-you-top-hours-learned', 800);
  log._hours = await o.page.getByTestId('hours-learned').locator('visible=true').first().innerText().catch(() => null);
  await into(o.page, 'row-practices');
  await shot(o, 'v9-02-you-practices-try-them', 600);
  await click(o.page, 'row-practices', 1200);
  await shot(o, 'v9-03-you-practices-tapped', 800);
  log._afterTap = await o.page.evaluate(() => JSON.parse(localStorage.getItem('ih:app:v1')).settings.profile?.answers?.practiceMode);
  await o.page.goto(B + '/you'); await W(o.page, 2500); await into(o.page, 'row-practices');
  await shot(o, 'v9-04-you-practices-just-learn', 600);
  await o.page.goto(B + '/today'); await W(o.page, 3000);
  if (await into(o.page, 'companion-card')) await shot(o, 'v9-05-today-practice-card-just-learn', 800);
  await o.page.goto(B + '/you'); await W(o.page, 2500); await into(o.page, 'row-streak');
  await shot(o, 'v9-06-you-show-my-streak', 600);
  await click(o.page, 'row-streak', 800);
  await shot(o, 'v9-07-you-show-my-streak-off', 600);
  await into(o.page, 'row-year');
  await shot(o, 'v9-08-you-year-so-far-row', 600);
  await o.close();
  save();
  console.log(JSON.stringify(log));
}
