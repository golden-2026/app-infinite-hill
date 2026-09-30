// Atlas v9, lane "quests": seasonal quests (Advent offer with the clock at 23 Nov 2026, joining, day 3, a missed day,
// Ramadan 2027 on the Islam door, a "stay" person seeing no other season), the year recap card by card and the
// 30-day share card. Frozen 5182 build, clock fixed per scenario, seeded progress (test data only).
// Run: node walk9-quests.mjs [advent,day3,missed,ramadan,stay,year,share30]
import { B, W, addDays, lane, open, seed, calm, click, has, into, toTop } from './_w9.mjs';

const { log, save, shot } = lane('quests');
const only = process.argv[2] ? process.argv[2].split(',') : null;
let n = 0;
const sit = (date, door, day) => ({ id: `sit_walk${String(++n).padStart(6, '0')}`, door, day: day ?? n, date, tz: 'America/New_York', kidId: null, deviceId: 'dev_walk0001', at: `${date}T14:00:00.000Z` });
const profile = (door, openness = 'stay', answers = {}) => ({ v: 1, door, knowledge: 40, commitment: 60, openness, answers: { raised: 'yes', practice: 'weekly', hold: 'fully', ...answers }, bridges: {}, lastBridgeOn: null, setOn: '2026-06-01' });
const state = (sits, settings = {}) => ({ v: 1, deviceId: 'dev_walk0001', sits, outbox: [], settingsVersion: 1, settings: { onboarded: true, homeWing: 'HINDUISM', active: 'home', analytics: 'no', unlocksSeen: ['guide', 'together'], book: [], signals: [], kids: [], reminder: { on: false, time: 'sundown' }, ...settings } });
const christian = (sits, extra = {}) => state(sits, { homeWing: 'CHRISTIANITY', profile: profile('CHRISTIANITY'), ...extra });
const run = async (name, today, fn, at = '10:00') => {
  if (only && !only.includes(name)) return;
  n = 0;
  const o = await open({ clock: `${today}T${at}:00-05:00` });
  o.today = today;
  try { await fn(o); } catch (e) { console.log('FAIL', name, e.message.split('\n')[0]); log[`_fail-${name}`] = e.message.slice(0, 400); save(); } finally { await o.close(); }
};

await run('advent', '2026-11-23', async (o) => {
  const sits = [-4, -3, -2, -1].map((k) => sit(addDays(o.today, k), 'CHRISTIANITY', 20 + k));
  await seed(o.page, christian(sits), calm(o.today));
  await o.page.goto(B + '/today'); await W(o.page, 2500);
  await shot(o, '01-advent-today-top', 800);
  await into(o.page, 'quest-offer');
  await shot(o, '02-advent-offer-card', 800);
  await o.page.getByText(/how it works/i).locator('visible=true').first().click().catch(() => {}); await W(o.page, 1500);
  await shot(o, '03-advent-how-it-works', 1000);
  await o.page.goto(B + '/today'); await W(o.page, 2500); await into(o.page, 'quest-offer');
  await click(o.page, 'quest-join', 1500);
  log._joined = await o.page.evaluate(() => JSON.parse(localStorage.getItem('ih:app:v1')).settings.quests);
  await shot(o, '04-advent-joined-today', 800);
  await o.page.goto(B + '/quest?id=advent-2026');
  await shot(o, '05-advent-quest-before-it-starts', 2500);
});

await run('day3', '2026-12-01', async (o) => {
  const sits = [-6, -5, -4, -3, -2, -1, 0].map((k) => sit(addDays(o.today, k), 'CHRISTIANITY', 30 + k));
  await seed(o.page, christian(sits, { quests: { 'advent-2026': { joined: '2026-11-23' } } }), calm(o.today));
  await o.page.goto(B + '/today'); await W(o.page, 2500);
  await into(o.page, 'quest-card');
  await shot(o, '06-advent-day3-today-card', 1000);
  await o.page.goto(B + '/quest?id=advent-2026');
  await shot(o, '07-advent-day3-path-of-stones', 2500);
  await o.page.evaluate(() => { const els = [...document.querySelectorAll('div')].filter((d) => d.scrollHeight > d.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(d).overflowY)); const s = els.sort((a, b) => b.clientHeight - a.clientHeight)[0]; if (s) s.scrollBy(0, 700); else scrollBy(0, 700); });
  await shot(o, '08-advent-day3-path-lower', 1000);
});

await run('missed', '2026-12-08', async (o) => {
  const sits = [-12, -11, -10, -9, -8, -7, -6, -5, 0].map((k) => sit(addDays(o.today, k), 'CHRISTIANITY', 40 + k));
  await seed(o.page, christian(sits, { quests: { 'advent-2026': { joined: '2026-11-23' } } }), calm(o.today));
  await o.page.goto(B + '/quest?id=advent-2026');
  await shot(o, '09-advent-missed-day-quest', 2500);
  await into(o.page, 'quest-still');
  await shot(o, '10-advent-you-can-still-finish', 600);
  await o.page.goto(B + '/today'); await W(o.page, 2500); await into(o.page, 'quest-card');
  await shot(o, '11-advent-missed-today-card', 800);
});

await run('ramadan', '2027-02-03', async (o) => {
  const sits = [-3, -2, -1].map((k) => sit(addDays(o.today, k), 'ISLAM', 10 + k));
  await seed(o.page, state(sits, { homeWing: 'ISLAM', profile: profile('ISLAM') }), calm(o.today));
  await o.page.goto(B + '/today'); await W(o.page, 2500); await into(o.page, 'quest-offer');
  await shot(o, '12-islam-ramadan-2027-offer', 1000);
  await click(o.page, 'quest-join', 1500);
  await o.page.goto(B + '/quest?id=ramadan-2027');
  await shot(o, '13-ramadan-quest-page', 2500);
});

await run('stay', '2027-02-12', async (o) => {
  const sits = [-3, -2, -1].map((k) => sit(addDays(o.today, k), 'HINDUISM', 10 + k));
  const book = [{ line: 'peace be upon you', door: 'ISLAM', date: '2027-01-20' }, { line: 'love your neighbor', door: 'CHRISTIANITY', date: '2027-01-22' }];
  await seed(o.page, state(sits, { profile: profile('HINDUISM', 'stay'), book }), calm(o.today));
  await o.page.goto(B + '/today'); await W(o.page, 3000);
  log._stayCards = (await o.page.getByTestId('quest-offer').count()) + (await o.page.getByTestId('quest-card').count());
  log._stayMentions = await o.page.evaluate(() => (document.body.innerText.match(/ramadan|lent|advent|christ|islam|muslim/ig) || []));
  await toTop(o.page);
  await shot(o, '14-stay-hindu-today-top', 900);
  await o.page.evaluate(() => { const els = [...document.querySelectorAll('div')].filter((d) => d.scrollHeight > d.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(d).overflowY)); const s = els.sort((a, b) => b.clientHeight - a.clientHeight)[0]; if (s) s.scrollBy(0, 1400); });
  await shot(o, '15-stay-hindu-today-lower', 900);
  await o.page.goto(B + '/quest?id=ramadan-2027');
  await shot(o, '16-stay-direct-link', 2000);
});

await run('year', '2026-11-09', async (o) => {
  const dates = [];
  for (let k = -300; k <= -200; k += 3) dates.push(addDays(o.today, k));
  for (let k = -45; k <= 0; k++) dates.push(addDays(o.today, k));
  const sits = dates.map((d, i) => sit(d, 'HINDUISM', i + 1));
  const timed = Object.fromEntries(dates.slice(-20).map((d) => [d, { m: 6, n: 1 }]));
  const book = [0, 1, 2, 3, 4].map((i) => ({ line: ['clear the road, then begin', 'the light in me sees the light in you', 'attention is an offering', 'bow to what came before you', 'work without clutching the fruit'][i], door: 'HINDUISM', date: addDays(o.today, -i * 20) }));
  await seed(o.page, state(sits, { profile: profile('HINDUISM'), timed, book, quests: { 'navratri-2026': { joined: '2026-10-05' } } }), calm(o.today));
  await o.page.goto(B + '/today'); await W(o.page, 2500);
  if (await into(o.page, 'year-offer')) await shot(o, '17-year-offer-on-today', 800);
  await o.page.goto(B + '/year');
  await shot(o, '19-year-card-01', 2000);
  for (let i = 2; i <= 12; i++) {
    if (await has(o.page, 'year-summary')) break;
    if (!(await has(o.page, 'year-next'))) break;
    await click(o.page, 'year-next', 300);
    await shot(o, `19-year-card-${String(i).padStart(2, '0')}`, 1700);
  }
  if (await has(o.page, 'year-summary')) {
    await shot(o, '20-year-summary', 800);
    await click(o.page, 'share-year', 2500);
    await shot(o, '21-year-share-card', 800);
  }
});

await run('share30', '2026-10-07', async (o) => {
  const sits = Array.from({ length: 30 }, (_, i) => sit(addDays(o.today, i - 29), 'HINDUISM', i + 1));
  await seed(o.page, state(sits, { profile: profile('HINDUISM') }), calm(o.today));
  const q = new URLSearchParams({ door: 'HINDUISM', day: '30', right: '4', total: '5', word: 'seva', carry: 'service', minutes: '5', newDay: '1', count: '30', streak: '30', prev: '29', milestone: '30', restored: '' });
  await o.page.goto(B + '/done/lit?' + q);
  await shot(o, '22-streak-30-share-offer', 3000);
  await click(o.page, 'share-milestone', 2500);
  await shot(o, '23-streak-30-share-card', 800);
});
save();
console.log('stay cards', log._stayCards, 'mentions', JSON.stringify(log._stayMentions), 'joined', JSON.stringify(log._joined));
