// Atlas v9, lane "streak": streaks (day 1 goal picker, milestones, rest day, break + earn-back, golden, quiet, kid, off)
// and friends (lantern invite pairing, days together, the weekly board, leave and delete).
// Streaks on the frozen 5182 build with the clock fixed; friends on atlas/friends-server.mjs serving expo-v9 on 5193
// (the friends server isn't part of the frozen copy). Seeded progress is test data only.
// Run: node friends-server.mjs expo-v9 5193   then   node walk9-streak.mjs [streak,friends]
import { B, W, addDays, lane, open, seed, calm, click, has, into, toTop, text } from './_w9.mjs';

const { log, save, shot } = lane('streak');
const only = process.argv[2] ? process.argv[2].split(',') : ['streak', 'friends'];
const TODAY = '2026-10-07'; // a Wednesday
const day = (k) => addDays(TODAY, k);
let n = 0;
const sit = (date, extra = {}) => ({ id: `sit_walk${String(++n).padStart(6, '0')}`, door: 'HINDUISM', day: 1 + (n % 20), date, tz: 'America/New_York', kidId: null, deviceId: 'dev_walk0001', at: `${date}T14:00:00.000Z`, ...extra });
const state = (sits, settings = {}) => ({ v: 1, deviceId: 'dev_walk0001', sits, outbox: [], settingsVersion: 1, settings: { onboarded: true, homeWing: 'HINDUISM', active: 'home', analytics: 'no', unlocksSeen: ['guide', 'together'], ...settings } });
const lit = (o) => `/done/lit?${new URLSearchParams({ door: 'HINDUISM', day: '3', right: '4', total: '5', word: 'namaste', carry: 'the light in me sees the light in you', minutes: '5', newDay: '1', milestone: '', restored: '', ...o })}`;
const run = async (name, fn, at = '10:00') => {
  n = 0;
  const o = await open({ clock: `${TODAY}T${at}:00-04:00` });
  try { await fn(o); } catch (e) { console.log('FAIL', name, e.message.split('\n')[0]); log[`_fail-${name}`] = e.message.slice(0, 400); save(); } finally { await o.close(); }
};

if (only.includes('streak')) {
  await run('day1', async (o) => {
    await seed(o.page, state([sit(TODAY)]), calm(TODAY));
    await o.page.goto(B + lit({ day: '1', count: '1', streak: '1', prev: '0' }));
    await shot(o, '01-day1-streak', 2600);
    await click(o.page, 'continue', 1200);
    await shot(o, '02-day1-goal-picker', 1200);
    log._goalChecked = await o.page.evaluate(() => [...document.querySelectorAll('[role=radio]')].map((e) => e.getAttribute('aria-checked')));
    await click(o.page, 'goal-later', 1000);
    await shot(o, '03-day1-goal-not-now-3-day-offer', 1000);
  });
  await run('day2', async (o) => {
    await seed(o.page, state([sit(day(-1)), sit(TODAY)], { goal: { days: 7, setOn: day(-1) } }), calm(TODAY));
    await o.page.goto(B + lit({ count: '2', streak: '2', prev: '1' }));
    await shot(o, '04-day2-streak-goal-progress', 2600);
  });
  await run('day3', async (o) => {
    await seed(o.page, state([sit(day(-2)), sit(day(-1)), sit(TODAY)], { goal: { days: 7, setOn: day(-2) } }), calm(TODAY));
    await o.page.goto(B + lit({ count: '3', streak: '3', prev: '2', milestone: '3' }));
    await shot(o, '05-day3-milestone', 2600);
  });
  await run('day7', async (o) => {
    await seed(o.page, state([-6, -5, -4, -3, -2, -1, 0].map((k) => sit(day(k))), { goal: { days: 7, setOn: day(-6) } }), calm(TODAY));
    await o.page.goto(B + lit({ count: '7', streak: '7', prev: '6', milestone: '7' }));
    await shot(o, '06-day7-milestone-goal-reached', 2600);
  });
  await run('rest', async (o) => {
    const sits = [-5, -4, -3, -2].map((k) => sit(day(k)));
    await seed(o.page, state(sits), calm(TODAY));
    await o.page.goto(B + '/today'); await W(o.page, 2500); await into(o.page, 'streak-pill');
    await shot(o, '07-rest-day-today', 2500);
    await seed(o.page, state([...sits, sit(TODAY)]), calm(TODAY));
    await o.page.goto(B + lit({ count: '5', streak: '5', prev: '4' }));
    await shot(o, '08-rest-day-moon-in-week', 2600);
  });
  await run('earnback', async (o) => {
    const sits = [-6, -5, -4].map((k) => sit(day(k)));
    await seed(o.page, state(sits), calm(TODAY));
    await o.page.goto(B + '/today');
    await shot(o, '09-break-today-earn-back-offer', 3200);
    log._earnBackShown = await has(o.page, 'earn-back');
    await seed(o.page, state([...sits, sit(TODAY)]), calm(TODAY));
    await o.page.goto(B + lit({ count: '4', streak: '1', prev: '0' }));
    await shot(o, '10-break-first-lesson-one-more', 2600);
    await seed(o.page, state([...sits, sit(TODAY), sit(TODAY)]), calm(TODAY));
    await o.page.goto(B + lit({ newDay: '0', count: '4', streak: '4', prev: '1', restored: '1' }));
    await shot(o, '11-earned-back', 2600);
    await o.page.goto(B + '/today');
    await shot(o, '12-earned-back-today', 3000);
  });
  await run('golden', async (o) => {
    const sits = [-7, -6, -5, -4, -3, -2, -1].map((k) => sit(day(k)));
    await seed(o.page, state(sits), calm(TODAY));
    await o.page.goto(B + '/today');
    await shot(o, '13-golden-today-header', 3200);
    await seed(o.page, state([...sits, sit(TODAY)]), calm(TODAY));
    await o.page.goto(B + lit({ count: '8', streak: '8', prev: '7' }));
    await shot(o, '14-golden-streak-screen', 2600);
  });
  await run('evening', async (o) => {
    await seed(o.page, state([-6, -5, -2, -1].map((k) => sit(day(k)))), calm(TODAY));
    await o.page.goto(B + '/today'); await W(o.page, 2500); await into(o.page, 'streak-pill');
    await shot(o, '15-evening-no-rest-day-left', 2500);
  }, '18:30');
  const quiet = { v: 1, facts: [], seeded: false, moods: [{ date: day(-1), mood: 'heavy' }, { date: TODAY, mood: 'heavy' }], journal: [], done: [], reflected: [], helpClosedOn: null };
  const hard = { v: 1, door: 'HINDUISM', openness: 'stay', knowledge: 40, commitment: 50, answers: { stance: 'practice', raisedIn: 'HINDUISM', why: 'hard', practice: 'weekly', hold: 'questions', feeling: ['grief'] }, bridges: {}, lastBridgeOn: null };
  await run('quiet', async (o) => {
    await seed(o.page, state([-6, -5, -2, -1].map((k) => sit(day(k))), { profile: hard }), quiet);
    await o.page.goto(B + '/today'); await W(o.page, 3000);
    log._quietPill = await has(o.page, 'streak-pill');
    await shot(o, '16-quiet-today-top', 1500);
    await into(o.page, 'top-start');
    await shot(o, '17-quiet-today-calm', 1200);
    await seed(o.page, state([-6, -5, -4].map((k) => sit(day(k))), { profile: hard }), quiet);
    await o.page.goto(B + '/today');
    await shot(o, '18-quiet-after-a-break', 3500);
    log._quietEarnBack = await has(o.page, 'earn-back');
  }, '18:30');
  await run('kid', async (o) => {
    const kid = 'kid_walk0001';
    await seed(o.page, state([sit(day(-1)), sit(day(-2), { kidId: kid }), sit(day(-1), { kidId: kid }), sit(TODAY, { kidId: kid })], { kids: [{ id: kid, name: 'Ria', door: 'HINDUISM', birthYear: 2017 }] }), calm(TODAY));
    await o.page.goto(B + `/done/kid?door=HINDUISM&day=3&kid=${kid}&streak=3&prev=2`);
    await shot(o, '19-kid-streak', 2600);
    await o.page.goto(B + '/today');
    await shot(o, '20-parent-streak-unchanged', 3000);
  });
  await run('off', async (o) => {
    await seed(o.page, state([-3, -2, -1, 0].map((k) => sit(day(k)))), calm(TODAY));
    await o.page.goto(B + '/you'); await W(o.page, 2500);
    await into(o.page, 'row-streak');
    await shot(o, '21-you-show-my-streak-on', 900);
    await click(o.page, 'row-streak', 800);
    await shot(o, '22-you-show-my-streak-off', 700);
    await o.page.goto(B + '/today');
    await shot(o, '23-today-streak-off', 3000);
    await o.page.goto(B + lit({ count: '5', streak: '5', prev: '4' }));
    await shot(o, '24-done-screen-streak-off', 2600);
  });
}

if (only.includes('friends')) {
  const F = process.env.FRIENDS || 'http://127.0.0.1:5193';
  const TZ = 'America/New_York';
  const T = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const d = (k) => addDays(T, k);
  const fsit = (date, door = 'HINDUISM') => ({ id: `sit_frnd${String(++n).padStart(6, '0')}`, door, day: 1 + (n % 15), date, tz: TZ, kidId: null, deviceId: 'dev_frnd0001', at: `${date}T15:00:00.000Z` });
  const fstate = (sits, settings = {}) => ({ v: 1, deviceId: `dev_frnd${String(++n).padStart(4, '0')}`, sits, outbox: [], settingsVersion: 1, settings: { onboarded: true, homeWing: 'HINDUISM', active: 'home', analytics: 'no', unlocksSeen: ['guide', 'together'], ...settings } });
  const base = await open();
  const person = async (name, s) => {
    const o = await open({ browser: base.browser });
    o.name = name;
    await o.page.goto(F + '/welcome'); await W(o.page, 1200);
    await o.page.evaluate(([s, m]) => { localStorage.clear(); localStorage.setItem('ih:app:v1', JSON.stringify(s)); localStorage.setItem('ih:companion', JSON.stringify(m)); }, [s, calm(T)]);
    return o;
  };
  const api = (o, kind, body) => o.page.evaluate(async ([kind, body]) => {
    const f = JSON.parse(localStorage.getItem('ih:friends') || '{}');
    const r = await fetch(`/api/friends?kind=${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Friend ${f.friendId}:${f.token}` }, body: JSON.stringify(body) });
    return r.status;
  }, [kind, body]);
  try {
    const litS = { glow: { date: T, best: 3, clean: true }, book: [{ line: 'the light in me sees the light in you', door: 'HINDUISM', date: T }], lanternOn: T, runs: [{ date: T, door: 'HINDUISM', day: 5, acc: 1, level: 1 }] };
    const ana = await person('ana', fstate([-4, -3, -2, -1, 0].map((k) => fsit(d(k))), litS));
    const ben = await person('ben', fstate([-3, -2, -1].map((k) => fsit(d(k), 'CHRISTIANITY')), { homeWing: 'CHRISTIANITY' }));
    await ana.page.goto(F + '/lantern'); await W(ana.page, 2500);
    await shot(ana, '30-friends-ana-lantern', 500);
    await click(ana.page, 'send-lantern', 2500);
    await ana.page.getByTestId('send-name').fill('ana');
    await shot(ana, '31-friends-send-lantern-invite', 500);
    await click(ana.page, 'send-link', 1200);
    const link = (await ana.page.evaluate(() => navigator.clipboard.readText())).replace(/^https?:\/\/[^/]+/, '');
    log._link = link; log._linkHasInvite = /[?&]i=/.test(link);
    await ben.page.goto(F + link); await W(ben.page, 2500);
    await shot(ben, '32-friends-ben-opens-lantern', 500);
    await click(ben.page, 'walk-with', 900);
    await shot(ben, '33-friends-nickname', 500);
    await ben.page.getByTestId('nick-input').fill('ben');
    await click(ben.page, 'nick-save', 3000);
    await shot(ben, '34-friends-paired', 1500);
    log._yesterday = [await api(ana, 'checkin', { date: d(-1), doneToday: true, streak: 4, golden: false, weekLight: 20, nick: 'ana' }), await api(ben, 'checkin', { date: d(-1), doneToday: true, streak: 3, golden: false, weekLight: 10, nick: 'ben' })];
    await ben.page.evaluate((s) => { const x = JSON.parse(localStorage.getItem('ih:app:v1')); x.sits.push(s); localStorage.setItem('ih:app:v1', JSON.stringify(x)); }, fsit(T, 'CHRISTIANITY'));
    await ben.page.goto(F + '/today'); await W(ben.page, 3000);
    await ana.page.goto(F + '/together'); await W(ana.page, 3000);
    await shot(ana, '35-friends-days-together-ana', 800);
    await ben.page.goto(F + '/together'); await W(ben.page, 3000);
    await shot(ben, '36-friends-days-together-ben', 800);
    await into(ana.page, 'weekly-board');
    await shot(ana, '37-friends-board-off', 500);
    log._boardRowsBefore = await ana.page.getByTestId('board-row').count();
    await click(ana.page, 'board-toggle', 2500);
    await into(ben.page, 'weekly-board'); await click(ben.page, 'board-toggle', 2500);
    await ana.page.goto(F + '/together'); await W(ana.page, 3000); await into(ana.page, 'weekly-board');
    await shot(ana, '38-friends-board-on-ranked', 800);
    log._board = await ana.page.evaluate(() => [...document.querySelectorAll('[data-testid="board-row"]')].map((e) => e.innerText.replace(/\s+/g, ' ')));
    // leave and delete (ben)
    await ben.page.goto(F + '/together'); await W(ben.page, 3000);
    const leave = ben.page.getByText(/leave friends · delete my friend data/).locator('visible=true').first();
    await leave.scrollIntoViewIfNeeded(); await W(ben.page, 500);
    await shot(ben, '39-friends-leave-link', 400);
    await leave.click(); await W(ben.page, 900);
    await shot(ben, '40-friends-leave-confirm', 500);
    await ben.page.getByText(/^leave and delete$/i).locator('visible=true').last().click(); await W(ben.page, 2000);
    await shot(ben, '41-friends-after-leave', 400);
    log._benFriendsAfter = await ben.page.evaluate(() => localStorage.getItem('ih:friends'));
    await ana.page.goto(F + '/together'); await W(ana.page, 3500);
    await shot(ana, '42-friends-ana-after-ben-left', 800);
    for (const o of [ana, ben]) log[`_errors-${o.name}`] = o.errors;
  } catch (e) { console.log('FAIL friends', e.message.split('\n')[0]); log._failFriends = e.message.slice(0, 400); }
  save();
  await base.close();
}
save();
console.log('DONE');
