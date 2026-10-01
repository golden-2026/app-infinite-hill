// The You tab, before and after the 2026-10 cleanup, at 390x844: a day-1 user and a day-30 user with a friend and a
// circle, in English and Spanish. Full-scroll screenshots (the viewport grows to the page's height) plus a sheet.
// Test values only. Run (two terminals):
//   node atlas/serve.mjs expo-live42 5231 --spa      (before)
//   node atlas/serve.mjs expo-dev-you 5232 --spa     (after)
//   node atlas/walk-you.mjs
// Screenshots: img-dev/you/. Sheet: img-dev/you/you-before-after.png.
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const BUILDS = { before: process.env.BEFORE || 'http://127.0.0.1:5231', after: process.env.AFTER || 'http://127.0.0.1:5232' };
const OUT = new URL('./img-dev/you/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TZ = 'America/New_York';
const TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
const day = (k) => { const d = new Date(`${TODAY}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };
const W = (p, ms = 700) => p.waitForTimeout(ms);
const log = { today: TODAY, shots: {} };

let n = 0;
const sit = (door, dayN, date) => ({ id: `sit_you${String(++n).padStart(7, '0')}`, door, day: dayN, date, tz: TZ, kidId: null, deviceId: 'dev_you00001', at: `${date}T14:00:00.000Z`, seconds: 300 });
const profile = (door) => ({ v: 1, door, knowledge: 40, commitment: 60, openness: 'stay', answers: { raised: 'yes', practice: 'weekly', hold: 'fully' }, bridges: {}, lastBridgeOn: null, setOn: day(-40) });
const state = (door, sits, settings = {}) => ({
  v: 1, deviceId: 'dev_you00001', outbox: [], settingsVersion: 1, sits,
  settings: { onboarded: true, homeWing: door, active: 'home', analytics: 'no', voiceOn: false, unlocksSeen: ['guide', 'together'], book: [], signals: [], kids: [], reminder: { on: false, time: 'sundown' }, profile: profile(door), ...settings },
});
const calm = { v: 1, facts: [], seeded: false, moods: [{ date: TODAY, mood: 'good' }], journal: [], done: [], reflected: [], helpClosedOn: null };

const USERS = {
  // day 1: just onboarded, no lesson yet
  day1: { app: state('ISLAM', []), friends: null },
  // day 30: thirty days in a row through today, three lines kept, one friend, one circle
  day30: {
    app: state('ISLAM', Array.from({ length: 30 }, (_, i) => sit('ISLAM', i + 1, day(i - 29))), {
      book: [{ line: 'peace be upon you', door: 'ISLAM', date: day(-20) }, { line: 'in the name of god', door: 'ISLAM', date: day(-10) }, { line: 'the mercy that comes first', door: 'ISLAM', date: TODAY }],
    }),
    friends: { friendId: 'f_' + 'a'.repeat(24), token: 'b'.repeat(64), nick: 'sara', board: false, friends: [{ id: 'f_' + 'c'.repeat(24), nick: 'maya', streak: 12, doneToday: true, golden: true, together: 7, onBoard: false, weekLight: null, lastSeen: TODAY, faded: false }], fetchedAt: null, reachable: true, cheers: [] },
    circles: { circles: [{ id: 'c1', code: 'K7M2QX', name: 'thursday circle', door: 'ISLAM', leaderName: 'amina', welcome: null, isLeader: false, note: null, noteOn: null, count: 4, walkedToday: 2, members: [], me: { nick: 'sara', family: false } }], fetchedAt: null, reachable: true, walked: null, pending: null },
  },
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
async function walk(build, user, lang) {
  const base = BUILDS[build];
  const u = USERS[user];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: TZ });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  if (u.friends) {
    await context.route('**/api/friends?kind=friends**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ me: { nick: 'sara', board: false }, friends: u.friends.friends, cheers: [] }) }));
    await context.route('**/api/friends?kind=checkin**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
    await context.route('**/api/circles**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ circles: u.circles.circles }) }));
  }
  await page.goto(base + '/welcome'); await W(page, 1200);
  await page.evaluate(([s, m, f, c, l]) => {
    localStorage.clear();
    localStorage.setItem('ih:app:v1', JSON.stringify(s));
    localStorage.setItem('ih:companion', JSON.stringify(m));
    localStorage.setItem('ih:lang', JSON.stringify(l));
    if (f) localStorage.setItem('ih:friends', JSON.stringify(f));
    if (c) localStorage.setItem('ih:circles', JSON.stringify(c));
  }, [u.app, calm, u.friends, u.circles || null, lang]);
  await page.goto(base + '/you'); await W(page, 3500);
  // grow the viewport to the scroller's full height, so one screenshot holds the whole page
  const h = await page.evaluate(() => {
    const els = [...document.querySelectorAll('div')].filter((d) => d.scrollHeight > d.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(d).overflowY));
    const s = els.sort((a, b) => b.clientHeight - a.clientHeight)[0];
    return s ? document.documentElement.clientHeight + (s.scrollHeight - s.clientHeight) : document.body.scrollHeight;
  });
  const name = `${build}-${user}-${lang}`;
  const top = fileURLToPath(new URL(`${name}-top.png`, OUT));
  await page.screenshot({ path: top });
  await page.setViewportSize({ width: 390, height: Math.min(h, 6000) }); await W(page, 1500);
  const full = fileURLToPath(new URL(`${name}.png`, OUT));
  await page.screenshot({ path: full });
  log.shots[name] = { height: h, errors, text: (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 900) };
  console.log('shot', name, h, errors.length ? errors : '');
  await context.close();
  return full;
}

const shots = {};
const only = process.argv[2] ? process.argv[2].split(',') : ['before', 'after'];
for (const build of only) for (const user of ['day1', 'day30']) for (const lang of ['en', 'es']) shots[`${build}-${user}-${lang}`] = await walk(build, user, lang);
writeFileSync(new URL('walk.json', OUT), JSON.stringify(log, null, 1));
await browser.close();

// the sheet: before | after for each user (English), then the Spanish afters. Each column scaled to one width.
if (only.includes('before') && only.includes('after')) {
  const COL = 300, GAP = 24, LABEL = 44;
  const cols = [['before-day1-en', 'before · day 1'], ['after-day1-en', 'after · day 1'], ['before-day30-en', 'before · day 30 + friend'], ['after-day30-en', 'after · day 30 + friend'], ['after-day1-es', 'after · day 1 · ES'], ['after-day30-es', 'after · day 30 · ES']];
  const imgs = await Promise.all(cols.map(async ([k]) => { const b = await sharp(shots[k]).resize({ width: COL }).png().toBuffer(); const m = await sharp(b).metadata(); return { b, h: m.height }; }));
  const H = Math.max(...imgs.map((x) => x.h)) + LABEL + GAP;
  const Wd = cols.length * (COL + GAP) + GAP;
  const labels = cols.map(([, l], i) => `<text x="${GAP + i * (COL + GAP) + COL / 2}" y="30" font-family="Arial" font-size="18" font-weight="700" text-anchor="middle" fill="#0A0A0A">${l}</text>`).join('');
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${LABEL}">${labels}</svg>`);
  await sharp({ create: { width: Wd, height: H, channels: 3, background: '#E3E3DE' } })
    .composite([{ input: svg, left: 0, top: 0 }, ...imgs.map((x, i) => ({ input: x.b, left: GAP + i * (COL + GAP), top: LABEL }))])
    .png().toFile(fileURLToPath(new URL('you-before-after.png', OUT)));
  console.log('sheet', fileURLToPath(new URL('you-before-after.png', OUT)));
}
