// Seasonal quests, the year recap and the milestone share card, walked on the frozen expo-quests build with the
// clock fixed per scenario and seeded progress (test values only). 390x844.
// Run: node serve.mjs expo-quests 5198 --spa, then node walk-quests.mjs [scenario,…]. Screenshots: img-dev/quests/.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const B = process.env.BASE || 'http://127.0.0.1:5198';
const OUT = new URL('./img-dev/quests/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const W = (p, ms = 700) => p.waitForTimeout(ms);
const only = process.argv[2] ? process.argv[2].split(',') : null;
const log = {};
const add = (date, k) => { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };

let n = 0;
const sit = (date, door, day) => ({ id: `sit_walk${String(++n).padStart(6, '0')}`, door, day: day ?? n, date, tz: 'America/New_York', kidId: null, deviceId: 'dev_walk0001', at: `${date}T14:00:00.000Z` });
const profile = (door, openness = 'stay', answers = {}) => ({ v: 1, door, knowledge: 40, commitment: 60, openness, answers: { raised: 'yes', practice: 'weekly', hold: 'fully', ...answers }, bridges: {}, lastBridgeOn: null, setOn: '2026-06-01' });
const state = (sits, settings = {}) => ({ v: 1, deviceId: 'dev_walk0001', sits, outbox: [], settingsVersion: 1, settings: { onboarded: true, homeWing: 'HINDUISM', active: 'home', analytics: 'no', unlocksSeen: ['guide', 'together'], book: [], signals: [], kids: [], reminder: { on: false, time: 'sundown' }, ...settings } });
const calm = (today) => ({ v: 1, facts: [], seeded: false, moods: [{ date: today, mood: 'good' }], journal: [], done: [], reflected: [], helpClosedOn: null });

async function open(today, at = '10:00') {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'America/New_York', reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  await page.clock.setFixedTime(new Date(`${today}T${at}:00-05:00`));
  return { browser, page, errors, today };
}
async function seed(o, s) {
  await o.page.goto(B + '/welcome'); await W(o.page, 1200);
  await o.page.evaluate(([s, m]) => { localStorage.clear(); localStorage.setItem('ih:app:v1', JSON.stringify(s)); localStorage.setItem('ih:companion', JSON.stringify(m)); }, [s, calm(o.today)]);
}
async function shot(o, name, wait = 2400) {
  await W(o.page, wait);
  await o.page.screenshot({ path: new URL(`${name}.png`, OUT).pathname.slice(1) });
  log[name] = { url: o.page.url().replace(B, ''), errors: o.errors.slice(), text: (await o.page.evaluate(() => document.body.innerText)).slice(0, 1200) };
  console.log('shot', name);
}
const count = (page, id) => page.getByTestId(id).locator('visible=true').count();
const into = async (page, id) => { const el = page.getByTestId(id).locator('visible=true').first(); if (await el.count()) { await el.scrollIntoViewIfNeeded(); await W(page, 500); return true; } log['_missing-' + id] = true; return false; };
const click = async (page, id, wait = 900) => { await page.getByTestId(id).locator('visible=true').first().click({ timeout: 8000 }); await W(page, wait); };
const run = async (name, today, fn, at) => { if (only && !only.includes(name)) return; n = 0; const o = await open(today, at); try { await fn(o); } catch (e) { console.log('FAIL', name, e.message.split('\n')[0]); log[`${name}-fail`] = e.message; } finally { await o.browser.close(); } };

const christian = (sits, extra = {}) => state(sits, { homeWing: 'CHRISTIANITY', profile: profile('CHRISTIANITY'), ...extra });

// 1 · a Christian door five days before Advent 2026 (Nov 29): the offer on Today, then joining it
await run('advent-offer', '2026-11-24', async (o) => {
  const sits = [-4, -3, -2, -1].map((k) => sit(add(o.today, k), 'CHRISTIANITY'));
  await seed(o, christian(sits));
  await o.page.goto(B + '/today');
  await W(o.page, 2500); await into(o.page, 'quest-offer');
  await shot(o, '01-christian-advent-offer', 1200);
  await click(o.page, 'quest-join', 1200);
  log._joined = await o.page.evaluate(() => JSON.parse(localStorage.getItem('ih:app:v1')).settings.quests);
  await shot(o, '02-christian-advent-joined', 800);
  await o.page.goto(B + '/quest?id=advent-2026');
  await shot(o, '03-advent-quest-before-it-starts', 2500);
});

// 2 · day 3 of Advent: three stones lit, today's question
await run('advent-day3', '2026-12-01', async (o) => {
  const sits = [-6, -5, -4, -3, -2, -1, 0].map((k) => sit(add(o.today, k), 'CHRISTIANITY'));
  await seed(o, christian(sits, { quests: { 'advent-2026': { joined: '2026-11-24' } } }));
  await o.page.goto(B + '/today');
  await W(o.page, 2500); await into(o.page, 'quest-card');
  await shot(o, '04-advent-day3-today-card', 1200);
  await o.page.goto(B + '/quest?id=advent-2026');
  await shot(o, '05-advent-day3-path-of-stones', 2500);
});

// 2b · a missed day (no rest day left) later in Advent: "you can still finish"
await run('advent-missed', '2026-12-08', async (o) => {
  const days = [-12, -11, -10, -9, -8, -7, -6, -5, 0]; // 12-04, 12-05 rest days, 12-06 and 12-07 missed
  const sits = days.map((k) => sit(add(o.today, k), 'CHRISTIANITY'));
  await seed(o, christian(sits, { quests: { 'advent-2026': { joined: '2026-11-24' } } }));
  await o.page.goto(B + '/quest?id=advent-2026');
  await shot(o, '06-advent-you-can-still-finish', 2500);
  await into(o.page, 'quest-still');
  await shot(o, '06b-advent-still-finish-line', 600);
});

// 3 · a Muslim door before Ramadan 2027 (Feb 8), and the quest page in "just learn" mode
await run('ramadan', '2027-02-03', async (o) => {
  const sits = [-3, -2, -1].map((k) => sit(add(o.today, k), 'ISLAM'));
  await seed(o, state(sits, { homeWing: 'ISLAM', profile: profile('ISLAM') }));
  await o.page.goto(B + '/today');
  await W(o.page, 2500); await into(o.page, 'quest-offer');
  await shot(o, '07-muslim-ramadan-2027-offer', 1200);
  await seed(o, state(sits, { homeWing: 'ISLAM', profile: profile('ISLAM', 'stay', { practiceMode: 'learn' }) }));
  await o.page.goto(B + '/quest?id=ramadan-2027');
  await shot(o, '08-ramadan-quest-learn-mode', 2500);
});

// 4 · openness "stay": a Hindu door during Lent and Ramadan 2027 with lines kept from both — nothing shown.
//     The same phone set to "love" does see them (a taste they chose), for contrast.
await run('stay', '2027-02-12', async (o) => {
  const sits = [-3, -2, -1].map((k) => sit(add(o.today, k), 'HINDUISM'));
  const book = [{ line: 'peace be upon you', door: 'ISLAM', date: '2027-01-20' }, { line: 'love your neighbor', door: 'CHRISTIANITY', date: '2027-01-22' }];
  await seed(o, state(sits, { profile: profile('HINDUISM', 'stay'), book }));
  await o.page.goto(B + '/today');
  await W(o.page, 3000);
  log._stayQuestCards = (await count(o.page, 'quest-offer')) + (await count(o.page, 'quest-card'));
  log._stayMentions = await o.page.evaluate(() => /ramadan|lent/i.test(document.body.innerText));
  await o.page.evaluate(() => document.querySelectorAll('div').forEach((d) => { if (d.scrollTop > 0) d.scrollTop = 0; }));
  await shot(o, '09-stay-hindu-no-other-seasons', 900);
  await o.page.goto(B + '/quest?id=ramadan-2027'); // even a direct link shows nothing
  await shot(o, '10-stay-direct-link-refused', 1800);
  await seed(o, state(sits, { profile: profile('HINDUISM', 'love'), book }));
  await o.page.goto(B + '/today');
  await W(o.page, 2500); await into(o.page, 'quest-offer');
  log._loveQuestText = (await o.page.getByTestId('quest-offer').locator('visible=true').first().innerText().catch(() => '')).slice(0, 200);
  await shot(o, '11-love-sees-a-tasted-season', 800);
});

// 5 · the year recap at Diwali (the Hindu new year): the offer on Today, the story, the summary, You's hours line
await run('year', '2026-11-09', async (o) => {
  const dates = [];
  for (let k = -300; k <= -200; k += 3) dates.push(add(o.today, k));
  for (let k = -45; k <= 0; k++) dates.push(add(o.today, k));
  const sits = dates.map((d, i) => sit(d, 'HINDUISM', i + 1));
  const timed = Object.fromEntries(dates.slice(-20).map((d) => [d, { m: 6, n: 1 }]));
  const book = [0, 1, 2, 3, 4].map((i) => ({ line: `a kept line ${i}`, door: 'HINDUISM', date: add(o.today, -i * 20) }));
  await seed(o, state(sits, { profile: profile('HINDUISM'), timed, book, quests: { 'navratri-2026': { joined: '2026-10-05' } } }));
  await o.page.goto(B + '/today');
  await W(o.page, 2500); await into(o.page, 'year-offer');
  await shot(o, '12-diwali-year-offer', 800);
  await click(o.page, 'year-offer', 300).catch(() => {});
  await o.page.goto(B + '/year');
  await shot(o, '13-year-intro', 1800);
  await click(o.page, 'year-next', 300);
  await shot(o, '14-year-days', 1600);
  await click(o.page, 'year-next', 300);
  await shot(o, '15-year-hours', 1600);
  await click(o.page, 'year-next', 300); await click(o.page, 'year-next', 300);
  await shot(o, '16-year-words', 1600);
  for (let i = 0; i < 8 && !(await count(o.page, 'year-summary')); i++) await click(o.page, 'year-next', 300);
  await shot(o, '17-year-summary', 1500);
  await click(o.page, 'share-year', 2500);
  await shot(o, '18-year-share-card', 800);
  await o.page.goto(B + '/you');
  await shot(o, '19-you-hours-and-year-so-far', 2500);
  await into(o.page, 'row-year');
  await shot(o, '20-you-year-row', 600);
});

// 6 · the 30-day streak screen with its share card
await run('share30', '2026-10-07', async (o) => {
  const sits = Array.from({ length: 30 }, (_, i) => sit(add(o.today, i - 29), 'HINDUISM', i + 1));
  await seed(o, state(sits, { profile: profile('HINDUISM') }));
  const q = new URLSearchParams({ door: 'HINDUISM', day: '30', right: '4', total: '5', word: 'seva', carry: 'service', minutes: '5', newDay: '1', count: '30', streak: '30', prev: '29', milestone: '30', restored: '' });
  await o.page.goto(B + '/done/lit?' + q);
  await shot(o, '21-streak-30-share-offer', 3000);
  await click(o.page, 'share-milestone', 2500);
  await shot(o, '22-streak-30-share-card', 800);
  const img = await o.page.getByTestId('share-preview').locator('visible=true').first().evaluate((el) => (el.querySelector('img') || el).getAttribute('src') || getComputedStyle(el).backgroundImage).catch(() => null);
  if (img && img.includes('data:image/png;base64,')) {
    const b64 = img.slice(img.indexOf('base64,') + 7).replace(/["')]+$/, '');
    writeFileSync(new URL('23-streak-30-card-image.png', OUT), Buffer.from(b64, 'base64'));
    console.log('shot 23-streak-30-card-image (the shared image itself)');
  } else log._noPreviewImage = true;
});

writeFileSync(new URL('log.json', OUT), JSON.stringify(log, null, 1));
console.log('errors:', Object.entries(log).filter(([, v]) => v?.errors?.length).map(([k, v]) => `${k}: ${v.errors.join(' | ').slice(0, 200)}`));
console.log('stay cards:', log._stayQuestCards, 'stay mentions:', log._stayMentions, 'love:', log._loveQuestText, 'joined:', JSON.stringify(log._joined));
