// The streak, walked: seeded progress (test values only) on the frozen expo-streak build, the clock fixed.
// Run: node serve.mjs expo-streak 5197 --spa, then node walk-streak.mjs [scenario,…]
// Screenshots: img-dev/streak/. The done screens get the same URL facts a finished lesson passes them.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const B = process.env.BASE || 'http://127.0.0.1:5197';
const OUT = new URL('./img-dev/streak/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TODAY = '2026-10-07'; // a Wednesday
const day = (k) => { const d = new Date(`${TODAY}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };
const W = (p, ms = 700) => p.waitForTimeout(ms);
const only = process.argv[2] ? process.argv[2].split(',') : null;
const log = {};

let n = 0;
const sit = (date, extra = {}) => ({ id: `sit_walk${String(++n).padStart(6, '0')}`, door: 'HINDUISM', day: 1 + (n % 20), date, tz: 'America/New_York', kidId: null, deviceId: 'dev_walk0001', at: `${date}T14:00:00.000Z`, ...extra });
const state = (sits, settings = {}) => ({ v: 1, deviceId: 'dev_walk0001', sits, outbox: [], settingsVersion: 1, settings: { onboarded: true, homeWing: 'HINDUISM', active: 'home', analytics: 'no', unlocksSeen: ['guide', 'together'], ...settings } });
const atRisk = () => [-6, -5, -2, -1].map((k) => sit(day(k))); // -4, -3 spent both rest days: streak 4, none left
const calm = { v: 1, facts: [], seeded: false, moods: [{ date: TODAY, mood: 'good' }], journal: [], done: [], reflected: [], helpClosedOn: null };

async function open(at = '10:00') {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({ viewport: { width: 406, height: 796 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'America/New_York', reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  await page.clock.setFixedTime(new Date(`${TODAY}T${at}:00-04:00`));
  return { browser, page, errors };
}
async function seed(page, s, memory = calm) {
  await page.goto(B + '/welcome'); await W(page, 1200);
  await page.evaluate(([s, m]) => { localStorage.clear(); localStorage.setItem('ih:app:v1', JSON.stringify(s)); localStorage.setItem('ih:companion', JSON.stringify(m)); }, [s, memory]);
}
const lit = (o) => `/done/lit?${new URLSearchParams({ door: 'HINDUISM', day: '3', right: '4', total: '5', word: 'namaste', carry: 'the light in me sees the light in you', minutes: '5', newDay: '1', milestone: '', restored: '', ...o })}`;
async function shot(o, name, wait = 2600) {
  await W(o.page, wait);
  await o.page.screenshot({ path: new URL(`${name}.png`, OUT).pathname.slice(1) });
  log[name] = { url: o.page.url().replace(B, ''), errors: o.errors.slice(), text: (await o.page.evaluate(() => document.body.innerText)).slice(0, 900) };
  console.log('shot', name);
}
const into = async (page, id) => { const el = page.getByTestId(id).locator('visible=true').first(); if (await el.count()) { await el.scrollIntoViewIfNeeded(); await W(page, 400); await page.evaluate(() => { const els = [...document.querySelectorAll('div')].filter((d) => d.scrollHeight > d.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(d).overflowY)); const s = els.sort((a, b) => b.clientHeight - a.clientHeight)[0]; if (s) s.scrollBy(0, 160); }); await W(page, 500); return true; } log['_missing-' + id] = true; return false; };
const click = async (page, id, wait = 900) => { await page.getByTestId(id).locator('visible=true').first().click({ timeout: 8000 }); await W(page, wait); };
const run = async (name, fn, at = "10:00") => { if (only && !only.includes(name)) return; n = 0; const o = await open(at); try { await fn(o); } catch (e) { console.log('FAIL', name, e.message.split('\n')[0]); log[`${name}-fail`] = e.message; } finally { await o.browser.close(); } };

// 1 · day one: the streak screen, then the goal picker (nothing preselected), "not now" → the one 3-day offer
await run('day1', async (o) => {
  await seed(o.page, state([sit(TODAY)]));
  await o.page.goto(B + lit({ day: '1', count: '1', streak: '1', prev: '0' }));
  await shot(o, '01-day1-streak');
  await click(o.page, 'continue', 1200);
  await shot(o, '02-day1-goal-picker', 1200);
  log._goalChecked = await o.page.evaluate(() => [...document.querySelectorAll('[role=radio]')].map((e) => e.getAttribute('aria-checked')));
  await click(o.page, 'goal-later', 1000);
  await shot(o, '03-day1-goal-just-3', 1000);
  await click(o.page, 'goal-3', 1200);
  log._goalSaved = await o.page.evaluate(() => JSON.parse(localStorage.getItem('ih:app:v1')).settings.goal);
});

// 2 · day 2 with a 7-day goal: goal progress on the streak screen, and Today's header
await run('day2', async (o) => {
  await seed(o.page, state([sit(day(-1)), sit(TODAY)], { goal: { days: 7, setOn: day(-1) } }));
  await o.page.goto(B + lit({ count: '2', streak: '2', prev: '1' }));
  await shot(o, '04-day2-streak-goal-progress');
  await o.page.goto(B + '/today');
  await shot(o, '05-day2-today-header', 3000);
});

// 3 · day 3: the first milestone
await run('day3', async (o) => {
  await seed(o.page, state([sit(day(-2)), sit(day(-1)), sit(TODAY)], { goal: { days: 7, setOn: day(-2) } }));
  await o.page.goto(B + lit({ count: '3', streak: '3', prev: '2', milestone: '3' }));
  await shot(o, '06-day3-milestone');
});

// 4 · day 7: a week, golden, the goal reached and the next goal offered
await run('day7', async (o) => {
  await seed(o.page, state([-6, -5, -4, -3, -2, -1, 0].map((k) => sit(day(k))), { goal: { days: 7, setOn: day(-6) } }));
  await o.page.goto(B + lit({ count: '7', streak: '7', prev: '6', milestone: '7' }));
  await shot(o, '07-day7-milestone-golden-goal');
  await click(o.page, 'goal-next', 900);
  await shot(o, '08-day7-next-goal-set', 600);
  log._nextGoal = await o.page.evaluate(() => JSON.parse(localStorage.getItem('ih:app:v1')).settings.goal);
});

// 5 · a missed day spends a rest day: Today before the lesson, then the streak screen with a moon in the week
await run('rest', async (o) => {
  const sits = [-5, -4, -3, -2].map((k) => sit(day(k))); // Fri–Mon, Tuesday missed
  await seed(o.page, state(sits));
  await o.page.goto(B + '/today');
  await W(o.page, 2500); await into(o.page, 'streak-pill');
  await shot(o, '09-rest-day-today', 3200);
  await seed(o.page, state([...sits, sit(TODAY)]));
  await o.page.goto(B + lit({ count: '5', streak: '5', prev: '4' }));
  await shot(o, '10-rest-day-streak-screen');
});

// 6 · a break, then earning it back with two lessons in a day
await run('earnback', async (o) => {
  const sits = [-6, -5, -4].map((k) => sit(day(k))); // Thu–Sat; Sun + Mon rest; Tue breaks it
  await seed(o.page, state(sits));
  await o.page.goto(B + '/today');
  await shot(o, '11-break-today-earn-back-offer', 3200);
  await seed(o.page, state([...sits, sit(TODAY)]));
  await o.page.goto(B + lit({ count: '4', streak: '1', prev: '0' }));
  await shot(o, '12-break-first-lesson-one-more');
  await seed(o.page, state([...sits, sit(TODAY), sit(TODAY)]));
  await o.page.goto(B + lit({ newDay: '0', count: '4', streak: '4', prev: '1', restored: '1' }));
  await shot(o, '13-earned-back');
  await o.page.goto(B + '/today');
  await shot(o, '14-earned-back-today', 3000);
});

// 7 · golden at day 8+: the gold chip on Today and the golden streak screen
await run('golden', async (o) => {
  const sits = [-7, -6, -5, -4, -3, -2, -1].map((k) => sit(day(k)));
  await seed(o.page, state(sits));
  await o.page.goto(B + '/today');
  await shot(o, '15-golden-today', 3200);
  await seed(o.page, state([...sits, sit(TODAY)]));
  await o.page.goto(B + lit({ count: '8', streak: '8', prev: '7' }));
  await shot(o, '16-golden-streak-screen');
});

// 8 · the evening with no rest day left: the only time it's "at stake" (said gently)
await run('evening', async (o) => {
  await seed(o.page, state(atRisk())); // both rest days already spent: tonight it's at stake
  await o.page.goto(B + '/today');
  await W(o.page, 2500); await into(o.page, 'streak-pill');
  await shot(o, '17-evening-at-risk', 3200);
}, "18:30");
// 9 · quiet mode (a hard season, a heavy day): the number stays, the pressure goes
const quiet = { v: 1, facts: [], seeded: false, moods: [{ date: day(-1), mood: 'heavy' }, { date: TODAY, mood: 'heavy' }], journal: [], done: [], reflected: [], helpClosedOn: null };
const hardProfile = { door: 'HINDUISM', openness: 'stay', knowledge: 40, commitment: 50, answers: { stance: 'practice', raisedIn: 'HINDUISM', why: 'hard', practice: 'weekly', hold: 'questions', feeling: ['grief'] } };
await run('quiet', async (o) => {
  await seed(o.page, state(atRisk(), { profile: hardProfile }), quiet); // at risk tonight, but quiet
  await o.page.goto(B + '/today');
  await W(o.page, 2500); await into(o.page, 'top-start');
  log._quietPill = await o.page.getByTestId('streak-pill').count();
  await shot(o, '18-quiet-today-calm', 3500);
  const broken = [-6, -5, -4].map((k) => sit(day(k)));
  await seed(o.page, state(broken, { profile: hardProfile }), quiet);
  await o.page.goto(B + '/today');
  log._quietEarnBack = await o.page.getByTestId('earn-back').count();
  await shot(o, '19-quiet-no-earn-back-pressure', 3500);
}, '18:30');

// 10 · You: days on the hill as the lifetime stat, and "show my streak" on / off
await run('you', async (o) => {
  await seed(o.page, state([-3, -2, -1, 0].map((k) => sit(day(k))), { kids: [{ id: 'kid_walk0001', name: 'Ria', door: 'HINDUISM', birthYear: 2017 }] }));
  await o.page.goto(B + '/you');
  await shot(o, '20-you-lifetime-and-streak', 2500);
  await o.page.getByTestId('row-streak').locator('visible=true').first().scrollIntoViewIfNeeded();
  await shot(o, '21-you-show-my-streak-on', 900);
  await click(o.page, 'row-streak', 700);
  await shot(o, '22-you-show-my-streak-off', 700);
  await o.page.goto(B + '/today');
  await shot(o, '23-today-streak-off', 3000);
});

// 11 · a kid's own streak, kid-sized, and the parent's untouched
await run('kid', async (o) => {
  const kid = 'kid_walk0001';
  await seed(o.page, state([sit(day(-1)), sit(day(-2), { kidId: kid }), sit(day(-1), { kidId: kid }), sit(TODAY, { kidId: kid })], { kids: [{ id: kid, name: 'Ria', door: 'HINDUISM', birthYear: 2017 }] }));
  await o.page.goto(B + `/done/kid?door=HINDUISM&day=3&kid=${kid}&streak=3&prev=2`);
  await shot(o, '24-kid-streak');
  await o.page.goto(B + '/you/table');
  await shot(o, '25-kid-table', 2000);
  await o.page.goto(B + '/today');
  await shot(o, '26-parent-streak-unchanged', 3000);
});

writeFileSync(new URL('log.json', OUT), JSON.stringify(log, null, 1));
console.log('errors:', Object.entries(log).filter(([, v]) => v?.errors?.length).map(([k, v]) => `${k}: ${v.errors.join(' | ').slice(0, 200)}`));
