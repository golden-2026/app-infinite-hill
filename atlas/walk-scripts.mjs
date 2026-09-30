// The full lesson scripts, walked on the expo-scripts build (test values only, the clock fixed).
// Run: node serve.mjs expo-scripts 5199 --spa, then node walk-scripts.mjs [scenario,…]
// Each lesson is walked from the bell to the tally: spoken beats are read and "next" is pressed; a game is recorded
// (and screenshotted the first time its kind appears) and then stepped over through the lesson's own resume state.
// Screenshots: img-dev/scripts/. Findings: img-dev/scripts/walk.json.
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const B = process.env.BASE || 'http://127.0.0.1:5199';
const OUT = new URL('./img-dev/scripts/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TODAY = '2026-10-07';
const YESTERDAY = '2026-10-06';
const W = (p, ms = 700) => p.waitForTimeout(ms);
const only = process.argv[2] ? process.argv[2].split(',') : null;
const log = {};
const LESSONS = new URL('./expo-scripts/lessons/', import.meta.url);
const scriptOf = (door, day) => {
  try {
    const m = JSON.parse(readFileSync(new URL('manifest.json', LESSONS), 'utf8'));
    const wk = String(Math.floor((day - 1) / 7) + 1).padStart(3, '0');
    if (!m.doors[door]?.chunks?.[wk]) return null;
    return JSON.parse(readFileSync(new URL(`${door.toLowerCase()}/${wk}.json`, LESSONS), 'utf8')).days[String(day)] || null;
  } catch { return null; }
};

const profile = (door, answers = {}) => ({ v: 1, door, knowledge: 40, commitment: 60, openness: 'stay', answers: { raised: 'yes', practice: 'weekly', hold: 'fully', ...answers }, bridges: {}, lastBridgeOn: null, setOn: '2026-06-01' });
const state = (door, day, settings = {}) => ({
  v: 1, deviceId: 'dev_walk0001', outbox: [], settingsVersion: 1,
  // one sit on day-1 yesterday puts the door at `day` today (day 1: no sits)
  sits: day > 1 ? [{ id: 'sit_walk000001', door, day: day - 1, date: YESTERDAY, tz: 'America/New_York', kidId: null, deviceId: 'dev_walk0001', at: `${YESTERDAY}T14:00:00.000Z` }] : [],
  settings: { onboarded: true, homeWing: door, active: 'home', analytics: 'no', voiceOn: false, unlocksSeen: ['guide', 'together'], book: [], signals: [], kids: [], reminder: { on: false, time: 'sundown' }, profile: profile(door), ...settings },
});
const calm = { v: 1, facts: [], seeded: false, moods: [{ date: TODAY, mood: 'good' }], journal: [], done: [], reflected: [], helpClosedOn: null };

async function open() {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({ viewport: { width: 406, height: 796 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: 'America/New_York' });
  const page = await context.newPage();
  const errors = [];
  const lessonReqs = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  page.on('request', (r) => { if (/\/lessons\//.test(r.url())) lessonReqs.push(r.url().replace(B, '')); });
  await page.clock.setFixedTime(new Date(`${TODAY}T10:00:00-04:00`));
  return { browser, context, page, errors, lessonReqs };
}
async function seed(page, s) {
  await page.goto(B + '/welcome'); await W(page, 1200);
  await page.evaluate(([s, m]) => { localStorage.clear(); localStorage.setItem('ih:app:v1', JSON.stringify(s)); localStorage.setItem('ih:companion', JSON.stringify(m)); }, [s, calm]);
}
const shot = async (o, name) => { await o.page.screenshot({ path: new URL(`${name}.png`, OUT).pathname.slice(1) }); console.log('  shot', name); };
const text = (page) => page.evaluate(() => document.body.innerText);
const visible = async (page, id) => (await page.getByTestId(id).locator('visible=true').count()) > 0;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'step';

/** Steps over the current (non-beat) step by moving the lesson's own resume state one step on, then reloading. */
async function skip(o) {
  const k = await o.page.evaluate(() => {
    const k = Object.keys(localStorage).find((x) => x.startsWith('ih:lesson:'));
    if (!k) return null;
    const r = JSON.parse(localStorage.getItem(k));
    r.qi += 1;
    localStorage.setItem(k, JSON.stringify(r));
    return k;
  });
  if (!k) return null;
  await o.page.reload(); await W(o.page, 3000);
  return k;
}

async function walk(o, name) {
  const L = log[name];
  const seen = new Set();
  for (let i = 0; i < 60; i++) {
    const t = await text(o.page);
    const who = ((t.match(/reads · [^\n]+/i) || [''])[0]).toLowerCase();
    const seg = who.split(' · ').slice(2).join(' · ');
    if (await visible(o.page, 'finish')) {
      L.steps.push('tally');
      await shot(o, `${name}-tally`);
      L.tally = t.slice(0, 600);
      await o.page.getByTestId('finish').locator('visible=true').first().click(); await W(o.page, 2500);
      L.after = o.page.url().replace(B, '').split('?')[0];
      break;
    }
    if (await visible(o.page, 'next') && /hear it again/i.test(t)) {
      // a spoken beat: the bubble's text is the longest leaf text on the screen
      const beat = await o.page.evaluate(() => [...document.querySelectorAll('div')].filter((d) => d.children.length === 0 && d.innerText && d.innerText.length > 20).map((d) => d.innerText).sort((a, b) => b.length - a.length)[0] || '');
      L.beats.push({ seg, text: beat });
      L.steps.push(`beat:${seg}`);
      if (!seen.has(seg)) { seen.add(seg); if (/hook|teach|how it's done|practice/.test(seg)) await shot(o, `${name}-${slug(seg)}`); }
      await o.page.getByTestId('next').locator('visible=true').first().click(); await W(o.page, 700);
      continue;
    }
    if (/the bell$/.test(who)) { L.steps.push('bell'); await W(o.page, 2200); continue; }
    L.steps.push(`step:${seg}`);
    if (!seen.has(seg)) { seen.add(seg); await shot(o, `${name}-${slug(seg)}`); L.screens[seg] = t.slice(0, 900); }
    const k = await skip(o);
    if (!k) { L.stuck = t.slice(0, 400); break; }
    L.resumeKey = k;
  }
}

// compare what was spoken and played with the script
function judge(name, door, day) {
  const L = log[name];
  const s = scriptOf(door, day);
  L.hasScript = !!s;
  if (!s) return;
  const norm = (x) => String(x).toLowerCase().replace(/\s+/g, ' ');
  const spoken = norm(L.beats.map((b) => b.text).join(' '));
  L.scriptSegmentsHeard = Object.fromEntries(s.segments.filter((g) => g.voice).map((g) => [g.type, spoken.includes(norm(g.voice.split(/(?<=[.?!])\s/)[0]).slice(0, 50))]));
  const shown = norm(Object.values(L.screens).join(' '));
  L.matchPairsShown = (s.games.match?.pairs || []).map(([a, b]) => `${a} → ${b}: ${shown.includes(norm(a)) && shown.includes(norm(b))}`);
  for (const g of ['fork', 'myth', 'trapdoor', 'original']) {
    const v = s.games[g];
    if (!v) continue;
    const probe = g === 'fork' ? v.setup : g === 'myth' ? v[0][0] : g === 'trapdoor' ? v[0].replace(/^what you thought:\s*/, '') : v.script;
    L[`${g}FromScript`] = shown.includes(norm(probe).slice(0, 40));
  }
  L.howItsDone = s.howItsDone;
  L.howItsDoneShown = spoken.includes(norm(s.howItsDone).slice(0, 60));
}

const run = async (name, fn) => { if (only && !only.includes(name)) return; console.log(name); const o = await open(); try { await fn(o); } catch (e) { console.log('FAIL', name, e.message.split('\n')[0]); log[name].fail = e.message; } finally { log[name].errors = o.errors.filter((e) => !/play\(\) failed/.test(e)); log[name].lessonRequests = [...new Set(o.lessonReqs)]; await o.browser.close(); } };
const lesson = (name, door, day, { settings = {}, before = null, loadingShot = false } = {}) => run(name, async (o) => {
  log[name] = { door, day, beats: [], steps: [], screens: {}, resumeKey: null };
  await seed(o.page, state(door, day, settings));
  if (before) await before(o);
  const t0 = Date.now();
  await o.page.goto(`${B}/session/${door}/${day}`);
  if (loadingShot) { await W(o.page, 700); await shot(o, `${name}-loading`); log[name].loadingVisible = await visible(o.page, 'lesson-loading'); }
  await o.page.waitForFunction(() => /reads ·/i.test(document.body.innerText), null, { timeout: 15000 });
  log[name].openedAfterMs = Date.now() - t0;
  await W(o.page, 400);
  await walk(o, name);
  judge(name, door, day);
});

await lesson('christianity-1', 'CHRISTIANITY', 1);
await lesson('christianity-29', 'CHRISTIANITY', 29);
await lesson('islam-3', 'ISLAM', 3);
await lesson('spiritual-2', 'SPIRITUAL', 2);
await lesson('hindu-5', 'HINDUISM', 5);
await lesson('christianity-4-learn', 'CHRISTIANITY', 4, { settings: { profile: profile('CHRISTIANITY', { practiceMode: 'learn' }) } });
// the lesson files blocked: the loader gets nothing, and the outline-built lesson plays
await lesson('christianity-2-blocked', 'CHRISTIANITY', 2, { loadingShot: true, before: async (o) => { await o.page.route('**/lessons/**', (r) => r.abort()); } });
// a slow network: lesson files answer after 6 s, so the lesson opens from the outline at about 2.5 s instead of waiting
await lesson('christianity-3-slow', 'CHRISTIANITY', 3, { loadingShot: true, before: async (o) => { await o.page.route('**/lessons/**', async (r) => { await new Promise((ok) => setTimeout(ok, 6000)); await r.continue().catch(() => {}); }); } });

let prev = {};
try { prev = JSON.parse(readFileSync(new URL('walk.json', OUT), 'utf8')); } catch {}
writeFileSync(new URL('walk.json', OUT), JSON.stringify({ ...(only ? prev : {}), ...log }, null, 2));
console.log('done');
