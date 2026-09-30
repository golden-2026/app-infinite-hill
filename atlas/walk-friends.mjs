// Friends, walked as two people in two browser contexts against a local server (atlas/friends-server.mjs, which
// mounts api/friends.js with its in-memory store). Progress is seeded (test values only); pairing, check-ins and the
// board go through the real app and the real API. Run: node atlas/friends-server.mjs, then node atlas/walk-friends.mjs
// Screenshots: img-dev/friends/.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const B = process.env.BASE || 'http://127.0.0.1:5198';
const OUT = new URL('./img-dev/friends/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TZ = 'America/New_York';
const TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const day = (k) => { const d = new Date(`${TODAY}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };
const W = (p, ms = 700) => p.waitForTimeout(ms);
const log = { today: TODAY };
const browser = await chromium.launch({ executablePath: CHROME, headless: true });

let n = 0;
const sit = (date, door = 'HINDUISM') => ({ id: `sit_frnd${String(++n).padStart(6, '0')}`, door, day: 1 + (n % 15), date, tz: TZ, kidId: null, deviceId: 'dev_frnd0001', at: `${date}T15:00:00.000Z` });
const calm = { v: 1, facts: [], seeded: false, moods: [{ date: TODAY, mood: 'good' }], journal: [], done: [], reflected: [], helpClosedOn: null };
const state = (sits, settings = {}) => ({ v: 1, deviceId: `dev_frnd${String(++n).padStart(4, '0')}`, sits, outbox: [], settingsVersion: 1, settings: { onboarded: true, homeWing: 'HINDUISM', active: 'home', analytics: 'no', unlocksSeen: ['guide', 'together'], ...settings } });

async function person(name, s, memory = calm) {
  const context = await browser.newContext({ viewport: { width: 406, height: 796 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: TZ, permissions: ['clipboard-read', 'clipboard-write'] });
  await context.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'share', { value: undefined, configurable: true }); } catch {} });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  await page.goto(B + '/welcome'); await W(page, 1200);
  await page.evaluate(([s, m]) => { localStorage.clear(); localStorage.setItem('ih:app:v1', JSON.stringify(s)); localStorage.setItem('ih:companion', JSON.stringify(m)); }, [s, memory]);
  return { name, context, page, errors };
}
async function shot(o, name, wait = 1800) {
  await W(o.page, wait);
  await o.page.screenshot({ path: new URL(`${name}.png`, OUT).pathname.slice(1) });
  log[name] = { who: o.name, url: o.page.url().replace(B, ''), errors: o.errors.slice(), text: (await o.page.evaluate(() => document.body.innerText)).slice(0, 700) };
  console.log('shot', name);
}
const click = async (page, id, wait = 900) => { await page.getByTestId(id).locator('visible=true').first().click({ timeout: 8000 }); await W(page, wait); };
const into = async (page, id) => { const el = page.getByTestId(id).locator('visible=true').first(); if (await el.count()) { await el.scrollIntoViewIfNeeded(); await W(page, 500); return true; } log[`_missing-${id}`] = true; return false; };
/** A direct API call with this person's own token (only for seeding yesterday's check-in, which the app made then). */
const api = (o, kind, body) => o.page.evaluate(async ([kind, body]) => {
  const f = JSON.parse(localStorage.getItem('ih:friends') || '{}');
  const r = await fetch(`/api/friends?kind=${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Friend ${f.friendId}:${f.token}` }, body: JSON.stringify(body) });
  return r.status;
}, [kind, body]);

// ana: 5 days in a row including today, today's three done and her lantern lit
const lit = { glow: { date: TODAY, best: 3, clean: true }, book: [{ line: 'the light in me sees the light in you', door: 'HINDUISM', date: TODAY }], lanternOn: TODAY, runs: [{ date: TODAY, door: 'HINDUISM', day: 5, acc: 1, level: 1 }, { date: day(-1), door: 'HINDUISM', day: 4, acc: 1, level: 1 }] };
const ana = await person('ana', state([-4, -3, -2, -1, 0].map((k) => sit(day(k))), lit));
// ben: 3 days, not done today yet
const ben = await person('ben', state([-3, -2, -1].map((k) => sit(day(k), 'CHRISTIANITY')), { homeWing: 'CHRISTIANITY' }));

// 1 · ana sends her lantern: the link now carries a single-use invite
await ana.page.goto(B + '/lantern'); await W(ana.page, 2500);
await click(ana.page, 'send-lantern', 2500); // the invite is fetched as the sheet opens
await ana.page.getByTestId('send-name').fill('ana');
await shot(ana, '01-ana-send-lantern-with-invite', 400);
await click(ana.page, 'send-link', 1200);
const link = await ana.page.evaluate(() => navigator.clipboard.readText());
log._link = link.replace(/^https?:\/\/[^/]+/, '');
log._linkHasInvite = /[?&]i=[a-z2-9]{10}(&|$)/.test(link);
log._linkHasNoToken = !/token|f_[a-f0-9]{24}/.test(link);

// 2 · ben opens it: "walk with ana" → what should friends call you? → paired
await ben.page.goto(B + log._link); await W(ben.page, 2500);
await shot(ben, '02-ben-opens-lantern-walk-with');
await click(ben.page, 'walk-with', 900);
await shot(ben, '03-ben-nickname-prompt', 500);
await ben.page.getByTestId('nick-input').fill('ben');
await click(ben.page, 'nick-save', 3000);
log._benAfterPair = ben.page.url().replace(B, '');
await shot(ben, '04-ben-together-paired', 1500);

// 3 · both check in. yesterday's check-ins are replayed through the API (both walked yesterday); today ben finishes
//     his lesson (seeded sit), and each app checks in on its own.
log._yesterday = [await api(ana, 'checkin', { date: day(-1), doneToday: true, streak: 4, golden: false, weekLight: 20, nick: 'ana' }), await api(ben, 'checkin', { date: day(-1), doneToday: true, streak: 3, golden: false, weekLight: 10, nick: 'ben' })];
await ben.page.evaluate((s) => { const x = JSON.parse(localStorage.getItem('ih:app:v1')); x.sits.push(s); localStorage.setItem('ih:app:v1', JSON.stringify(x)); }, sit(TODAY, 'CHRISTIANITY'));
await ben.page.goto(B + '/today'); await W(ben.page, 3000);
await ana.page.goto(B + '/together'); await W(ana.page, 3000);
await ben.page.goto(B + '/together'); await W(ben.page, 3000);
await shot(ana, '05-ana-sees-ben-friend-streak');
await shot(ben, '06-ben-sees-ana-friend-streak');
log._anaFriends = await ana.page.evaluate(() => JSON.parse(localStorage.getItem('ih:friends')).friends);

// 4 · the weekly board: off by default; ana joins, then ben; ranked by weekly light, the top gets the sun
await into(ana.page, 'weekly-board');
await shot(ana, '07-board-off-by-default', 500);
log._boardRowsBefore = await ana.page.getByTestId('board-row').count();
await click(ana.page, 'board-toggle', 2500);
await into(ben.page, 'weekly-board');
await click(ben.page, 'board-toggle', 2500);
await ana.page.goto(B + '/together'); await W(ana.page, 3000); await into(ana.page, 'weekly-board');
await shot(ana, '08-board-ana-ranked', 800);
await ben.page.goto(B + '/together'); await W(ben.page, 3000); await into(ben.page, 'weekly-board');
await shot(ben, '09-board-ben-ranked', 800);
log._boardAna = await ana.page.evaluate(() => [...document.querySelectorAll('[data-testid="board-row"]')].map((e) => e.innerText.replace(/\s+/g, ' ')));
log._boardTop = await ana.page.getByTestId('board-top').count();

// 5 · offline: the app works as before, friends show when they were last seen
await ana.context.route('**/api/friends**', (r) => r.abort());
await ana.page.goto(B + '/together'); await W(ana.page, 3000);
await shot(ana, '10-offline-last-seen');
await ana.page.goto(B + '/today'); await W(ana.page, 2500);
await shot(ana, '11-offline-today-still-works');
log._offlineOk = !(await ana.page.evaluate(() => document.body.innerText)).includes('error');
await ana.context.unroute('**/api/friends**');

// 6 · quiet mode: no board on a quiet day
const hard = { door: 'HINDUISM', openness: 'stay', knowledge: 40, commitment: 50, answers: { stance: 'practice', raisedIn: 'HINDUISM', why: 'hard', practice: 'weekly', hold: 'questions', feeling: ['grief'] } };
await ana.page.evaluate((p) => { const x = JSON.parse(localStorage.getItem('ih:app:v1')); x.settings.profile = p; localStorage.setItem('ih:app:v1', JSON.stringify(x)); localStorage.setItem('ih:companion', JSON.stringify({ v: 1, facts: [], seeded: false, moods: [{ date: new Date().toISOString().slice(0, 10), mood: 'heavy' }], journal: [], done: [], reflected: [], helpClosedOn: null })); }, hard);
await ana.page.goto(B + '/together'); await W(ana.page, 3000);
log._quietBoard = await ana.page.getByTestId('weekly-board').count();
await shot(ana, '12-quiet-no-board');

// 7 · a friend-streak milestone and a faded friend, with the friends reply mocked (a real 7 days needs a week)
const cleo = await person('cleo', state([-2, -1, 0].map((k) => sit(day(k))), { goal: { days: 30, setOn: day(-2) } }));
await cleo.page.evaluate(() => localStorage.setItem('ih:friends', JSON.stringify({ friendId: 'f_' + 'a'.repeat(24), token: 'b'.repeat(64), nick: 'cleo', board: false, friends: [], fetchedAt: null, reachable: null })));
await cleo.context.route('**/api/friends?kind=friends**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ me: { nick: 'cleo', board: false }, friends: [
  { id: 'f_' + 'c'.repeat(24), nick: 'maya', streak: 12, doneToday: true, golden: true, together: 7, onBoard: false, weekLight: null, lastSeen: TODAY, faded: false },
  { id: 'f_' + 'd'.repeat(24), nick: 'sam', streak: 0, doneToday: false, golden: false, together: 0, onBoard: false, weekLight: null, lastSeen: day(-9), faded: true },
] }) }));
await cleo.context.route('**/api/friends?kind=checkin**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
await cleo.page.goto(B + '/today'); await W(cleo.page, 3000);
await cleo.page.goto(B + `/done/lit?door=HINDUISM&day=3&right=4&total=5&word=namaste&carry=x&minutes=5&newDay=1&count=3&streak=3&prev=2&milestone=3&restored=`);
await shot(cleo, '13-friend-streak-milestone', 2800);
await cleo.page.goto(B + '/together'); await W(cleo.page, 3000);
await shot(cleo, '14-faded-friend');

// 8 · the site: the privacy page and the Together mockup
const site = await person('site', state([]));
await site.page.goto(B + '/site.html'); await W(site.page, 3000);
log._sitePrivacy = await site.page.evaluate(() => (typeof PAGES !== 'undefined' && PAGES.privacy ? PAGES.privacy[1] : '').includes('<h3>friends</h3>'));
const t = site.page.locator('text=you each see the other').first();
if (await t.count()) { await t.scrollIntoViewIfNeeded(); await W(site.page, 800); }
await shot(site, '15-site-together-mockup', 800);

for (const o of [ana, ben, cleo, site]) log[`_errors-${o.name}`] = o.errors;
writeFileSync(new URL('log.json', OUT), JSON.stringify(log, null, 1));
console.log(JSON.stringify({ link: log._link, invite: log._linkHasInvite, noToken: log._linkHasNoToken, pairedTo: log._benAfterPair, yesterday: log._yesterday, anaFriends: log._anaFriends?.map((f) => [f.nick, f.together, f.doneToday, f.streak]), boardBefore: log._boardRowsBefore, board: log._boardAna, top: log._boardTop, quietBoard: log._quietBoard, privacy: log._sitePrivacy, errors: [ana, ben, cleo, site].map((o) => o.errors.length) }, null, 1));
await browser.close();
