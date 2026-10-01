// The Today redesign, walked at 390x844 in English and Spanish: a brand-new day-1 user before the lesson, the same
// user after finishing day 1, and a returning day-6 user with a friend and a review due. Test values only; the clock
// is fixed to today 10 am New York. No network beyond the static build.
// Run:
//   node atlas/serve.mjs expo-live42 5231 --spa        (before)
//   node atlas/serve.mjs expo-dev-today 5232 --spa     (after)
//   BASE=http://127.0.0.1:5231 SET=before node atlas/walk-today.mjs
//   BASE=http://127.0.0.1:5232 SET=after  node atlas/walk-today.mjs
//   node atlas/walk-today.mjs sheet                    (img-dev/today/today-before-after.png)
// Screenshots: img-dev/today/<set>/<lang>-<scenario>[-full].png
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('./img-dev/today/', import.meta.url);
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
const day = (k) => { const d = new Date(`${TODAY}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };
const DOOR = 'CATHOLIC';
const SCEN = ['d1-before', 'd1-done', 'd6-return'];

if (process.argv[2] === 'sheet') {
  const sharp = (await import('sharp')).default;
  const W = 300, H = 650, gap = 10, label = 34;
  const cols = [['before', 'en'], ['after', 'en'], ['before', 'es'], ['after', 'es']];
  const tiles = [];
  for (const [r, sc] of SCEN.entries()) for (const [c, [set, lang]] of cols.entries()) {
    const f = fileURLToPath(new URL(`${set}/${lang}-${sc}.png`, ROOT));
    if (!existsSync(f)) continue;
    tiles.push({ input: await sharp(f).resize(W, H, { fit: 'contain', background: '#fff' }).toBuffer(), left: gap + c * (W + gap) + (c >= 2 ? 24 : 0), top: label + gap + r * (H + label + gap) });
    const svg = `<svg width="${W}" height="${label}" xmlns="http://www.w3.org/2000/svg"><text x="0" y="24" font-family="Arial" font-weight="700" font-size="18" fill="${set === 'after' ? '#0A0A0A' : '#6b6b6b'}">${set} · ${lang} · ${sc}</text></svg>`;
    tiles.push({ input: Buffer.from(svg), left: gap + c * (W + gap) + (c >= 2 ? 24 : 0), top: gap + r * (H + label + gap) });
  }
  await sharp({ create: { width: gap + 4 * (W + gap) + 24, height: gap + SCEN.length * (H + label + gap), channels: 3, background: '#E3E3DE' } })
    .composite(tiles).png().toFile(fileURLToPath(new URL('today-before-after.png', ROOT)));
  console.log('sheet written');
  process.exit(0);
}

const BASE = process.env.BASE || 'http://127.0.0.1:5232';
const SET = process.env.SET || 'after';
const OUT = new URL(`${SET}/`, ROOT);
mkdirSync(OUT, { recursive: true });

const profile = { v: 1, door: DOOR, knowledge: 40, commitment: 60, openness: 'stay', answers: { raised: 'yes', practice: 'weekly', hold: 'fully' }, bridges: {}, lastBridgeOn: null, setOn: day(-6) };
let n = 0;
const sit = (dayN, date) => ({ id: `sit_walk${String(++n).padStart(6, '0')}`, door: DOOR, day: dayN, date, tz: 'America/New_York', kidId: null, deviceId: 'dev_walk0001', at: `${date}T14:00:00.000Z` });
const state = (sits, settings = {}) => ({
  v: 1, deviceId: 'dev_walk0001', outbox: [], settingsVersion: 1, sits,
  settings: { onboarded: true, homeWing: DOOR, active: 'home', analytics: 'no', voiceOn: false, book: [], signals: [], kids: [], reminder: { on: false, time: 'sundown' }, profile, ...settings },
});
const memory = (moods = []) => ({ v: 1, facts: [], seeded: false, moods, journal: [], done: [], reflected: [], helpClosedOn: null });

const scenarios = {
  // brand new: onboarded a minute ago, nothing done, no mood answered
  'd1-before': () => ({ s: state([]), m: memory() }),
  // the same person after day 1: one lesson, two right in a row, no line saved yet
  'd1-done': () => ({ s: state([sit(1, TODAY)], { glow: { date: TODAY, best: 2, clean: false }, light: 12 }), m: memory() }),
  // day 6: five days in a row, a friend, strand words due for review, mood not answered yet today
  'd6-return': () => ({
    s: state([1, 2, 3, 4, 5].map((k) => sit(k, day(k - 6))), { unlocksSeen: ['guide'], light: 64, book: [{ line: 'peace be with you', door: DOOR, date: day(-2) }] }),
    m: memory([{ date: day(-1), mood: 'calm' }]),
    friends: { friendId: 'f_' + 'a'.repeat(24), token: 'b'.repeat(64), nick: 'sam', board: false, fetchedAt: `${TODAY}T13:00:00.000Z`, reachable: true, cheers: [],
      friends: [{ id: 'f_' + 'c'.repeat(24), nick: 'ana', streak: 12, doneToday: true, golden: true, together: 4, onBoard: false, weekLight: null, lastSeen: TODAY, faded: false }] },
  }),
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const only = process.argv[2] ? process.argv[2].split(',') : null;
const report = [];
for (const lang of ['en', 'es']) for (const name of SCEN) {
  if (only && !only.includes(name)) continue;
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'America/New_York' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  await context.route('**/api/**', (r) => r.fulfill({ status: 503, body: '{}' })); // no server in a static build: stay offline
  await page.clock.setFixedTime(new Date(`${TODAY}T10:00:00-04:00`));
  const sc = scenarios[name]();
  await page.goto(`${BASE}/icon-192.png`);
  await page.evaluate(([s, m, lang, f]) => {
    localStorage.clear();
    localStorage.setItem('ih:app:v1', JSON.stringify(s));
    localStorage.setItem('ih:companion', JSON.stringify(m));
    localStorage.setItem('ih:lang', JSON.stringify(lang));
    if (f) localStorage.setItem('ih:friends', JSON.stringify(f));
  }, [sc.s, sc.m, lang, sc.friends || null]);
  await page.goto(`${BASE}/today`);
  await page.waitForTimeout(3500);
  const file = (x) => fileURLToPath(new URL(`${lang}-${name}${x}.png`, OUT));
  await page.screenshot({ path: file('') });
  // the whole screen: grow the window to the scroller's height
  const h = await page.evaluate(() => Math.max(...[...document.querySelectorAll('*')].filter((e) => e.scrollHeight > e.clientHeight + 40 && getComputedStyle(e).overflowY !== 'visible').map((e) => e.scrollHeight - e.clientHeight), 0));
  if (h > 0) { await page.setViewportSize({ width: 390, height: 844 + h }); await page.waitForTimeout(1200); await page.screenshot({ path: file('-full') }); }
  const sideways = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  report.push({ lang, name, errors, sideways, text: (await page.evaluate(() => document.body.innerText)).slice(0, 900) });
  console.log(lang, name, 'errors', errors.length, 'sideways', sideways);
  await context.close();
}
await browser.close();
writeFileSync(new URL('walk.json', OUT), JSON.stringify(report, null, 1));
