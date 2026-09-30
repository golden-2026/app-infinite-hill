// Atlas v9, lane "companion" (recheck only): three "anxious" taps no longer bring the 988 card; the Muslim prayer page
// no longer shows the namaste; the Guide names a prayer line instead of "the Lord's Prayer, line 5". Frozen 5182 build.
// Run: node walk9-companion.mjs
import { B, W, addDays, lane, open, seed, toTop } from './_w9.mjs';

const { log, save, shot } = lane('companion');
const TODAY = '2026-10-07';
let n = 0;
const sit = (date, door) => ({ id: `sit_walk${String(++n).padStart(6, '0')}`, door, day: n, date, tz: 'America/New_York', kidId: null, deviceId: 'dev_walk0001', at: `${date}T14:00:00.000Z` });
const profile = (door, answers = {}) => ({ v: 1, door, knowledge: 40, commitment: 60, openness: 'stay', answers: { stance: 'practice', raised: 'yes', practice: 'weekly', hold: 'fully', ...answers }, bridges: {}, lastBridgeOn: null, setOn: '2026-06-01' });
const state = (door, days, settings = {}) => ({ v: 1, deviceId: 'dev_walk0001', sits: Array.from({ length: days }, (_, i) => sit(addDays(TODAY, i - days), door)), outbox: [], settingsVersion: 1, settings: { onboarded: true, homeWing: door, active: 'home', analytics: 'no', unlocksSeen: ['guide', 'together'], book: [], signals: [], kids: [], reminder: { on: false, time: 'sundown' }, profile: profile(door), ...settings } });
const mem = (moods) => ({ v: 1, facts: [], seeded: false, moods, journal: [], done: [], reflected: [], helpClosedOn: null });

{
  const o = await open({ clock: `${TODAY}T12:30:00-04:00` });
  await seed(o.page, state('CHRISTIANITY', 6), mem([{ date: addDays(TODAY, -4), mood: 'anxious' }, { date: addDays(TODAY, -2), mood: 'anxious' }, { date: TODAY, mood: 'anxious' }]));
  await o.page.goto(B + '/today'); await W(o.page, 3000); await toTop(o.page);
  await shot(o, 'v9-01-three-anxious-taps-today', 800);
  log._has988 = await o.page.evaluate(() => /988/.test(document.body.innerText));
  n = 0;
  await seed(o.page, state('ISLAM', 6), mem([{ date: TODAY, mood: 'good' }]));
  await o.page.goto(B + '/practice/salat-steps'); await W(o.page, 2500);
  await shot(o, 'v9-02-salat-page-pose', 600);
  log._salatImgs = await o.page.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.getAttribute('src')).filter((s) => /mascot|pose|webp|png/.test(s || '')).slice(0, 6));
  n = 0;
  await seed(o.page, state('CHRISTIANITY', 7), mem([{ date: TODAY, mood: 'good' }]));
  await o.page.goto(B + '/guide'); await W(o.page, 3000);
  await shot(o, 'v9-03-guide-prayer-line-day-8', 600);
  const box = o.page.getByRole('textbox').first();
  log._placeholder = await box.getAttribute('placeholder').catch(() => null);
  await box.fill("what does today's word mean?"); await box.press('Enter'); await W(o.page, 3500);
  await shot(o, 'v9-04-guide-answer-prayer-line', 600);
  log._guideText = (await o.page.evaluate(() => document.body.innerText)).slice(-900);
  await o.close();
}
save();
console.log(JSON.stringify({ has988: log._has988, salat: log._salatImgs, ph: log._placeholder, guide: log._guideText }, null, 1));
