// Atlas v9, lane "lessons": full lesson scripts. Christianity day 29 (a script) next to Hindu day 5 (manuscript) and
// Buddhism day 60 (no script yet: the outline fallback); "just learn" on a script day; "not today ›" on the breath
// (day 1) and on the sit (day 8). Frozen 5182 build, seeded progress (test data only).
// Spoken beats are read and "next" pressed; a game is photographed the first time its kind appears and then stepped
// over through the lesson's own resume state (forced), as walk-scripts.mjs did.
// Run: node walk9-lessons.mjs [c29,h5,b60,learn,breath,sit]
import { B, W, lane, open, seed, calm, click, has, text } from './_w9.mjs';
import { planDay } from '../../packages/content/src/index.js';

const { log, save, shot } = lane('lessons');
const only = process.argv[2] ? process.argv[2].split(',') : null;
const TODAY = '2026-10-07';
const YESTERDAY = '2026-10-06';
const iso = (k) => { const d = new Date(`${TODAY}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - k); return d.toISOString().slice(0, 10); };
const profile = (door, answers = {}) => ({ v: 1, door, knowledge: 40, commitment: 60, openness: 'stay', answers: { raised: 'yes', practice: 'weekly', hold: 'fully', ...answers }, bridges: {}, lastBridgeOn: null, setOn: '2026-06-01' });
const state = (door, day, settings = {}) => ({
  v: 1, deviceId: 'dev_walk0001', outbox: [], settingsVersion: 1,
  sits: day > 1 ? [{ id: 'sit_walk000001', door, day: day - 1, date: YESTERDAY, tz: 'America/New_York', kidId: null, deviceId: 'dev_walk0001', at: `${YESTERDAY}T14:00:00.000Z` }] : [],
  settings: { onboarded: true, homeWing: door, active: 'home', analytics: 'no', voiceOn: false, unlocksSeen: ['guide', 'together'], book: [], signals: [], kids: [], reminder: { on: false, time: 'sundown' }, profile: profile(door), ...settings },
});
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'step';

async function skipStep(o) {
  const k = await o.page.evaluate(() => {
    const k = Object.keys(localStorage).find((x) => x.startsWith('ih:lesson:'));
    if (!k) return null;
    const r = JSON.parse(localStorage.getItem(k)); r.qi += 1; localStorage.setItem(k, JSON.stringify(r)); return k;
  });
  if (!k) return null;
  await o.page.reload(); await W(o.page, 3000);
  return k;
}

async function walk(o, name, { maxShots = 14 } = {}) {
  const L = log[`_${name}`] = { steps: [], beats: [] };
  const seen = new Set(); let shots = 0;
  const S = async (seg) => { if (shots >= maxShots) return; shots++; await shot(o, `${name}-${String(shots).padStart(2, '0')}-${slug(seg)}`, 500); };
  for (let i = 0; i < 70; i++) {
    const t = await text(o.page);
    const who = ((t.match(/reads · [^\n]+/i) || [''])[0]).toLowerCase();
    const seg = who.split(' · ').slice(2).join(' · ') || 'step';
    if (await has(o.page, 'finish')) { L.steps.push('tally'); await S('win'); L.tally = t.slice(0, 500); break; }
    if (await has(o.page, 'not-today')) {
      const kind = /start the sit|the sun breathes with you/.test(t) ? 'sit' : 'breath';
      L.steps.push(kind); await S(`${kind}-not-today`);
      await click(o.page, 'not-today', 1400); L.steps.push(`${kind}-skipped`); await S(`after-${kind}-skip`);
      continue;
    }
    if (await has(o.page, 'next') && /hear it again/i.test(t)) {
      const beat = await o.page.evaluate(() => [...document.querySelectorAll('div')].filter((d) => d.children.length === 0 && d.innerText && d.innerText.length > 20).map((d) => d.innerText).sort((a, b) => b.length - a.length)[0] || '');
      L.beats.push({ seg, text: beat.slice(0, 300) }); L.steps.push(`beat:${seg}`);
      if (!seen.has(seg)) { seen.add(seg); await S(seg); }
      await click(o.page, 'next', 700);
      continue;
    }
    if (/the bell$/.test(who)) { L.steps.push('bell'); if (!seen.has('bell')) { seen.add('bell'); await S('bell'); } await W(o.page, 2200); continue; }
    L.steps.push(`step:${seg}`);
    if (!seen.has(seg)) { seen.add(seg); await S(seg); }
    if (!(await skipStep(o))) { L.stuck = t.slice(0, 300); break; }
  }
  save();
}

const run = async (name, fn) => { if (only && !only.includes(name)) return; const o = await open({ clock: `${TODAY}T10:00:00-04:00` }); try { await fn(o); } catch (e) { console.log('FAIL', name, e.message.split('\n')[0]); log[`_fail-${name}`] = e.message.slice(0, 400); save(); } finally { log[`_errors-${name}`] = o.errors.filter((e) => !/play\(\) failed/.test(e)); save(); await o.close(); } };
const lesson = (name, door, day, settings = {}, opts) => run(name, async (o) => {
  await seed(o.page, state(door, day, settings), calm(TODAY));
  await o.page.goto(`${B}/session/${door}/${day}`);
  await o.page.waitForFunction(() => /reads ·/i.test(document.body.innerText), null, { timeout: 15000 });
  await W(o.page, 500);
  await walk(o, name, opts);
});

await lesson('c29', 'CHRISTIANITY', 29);
await lesson('h5', 'HINDUISM', 5);
await lesson('b60', 'BUDDHISM', 60);
await lesson('learn', 'CHRISTIANITY', 4, { profile: profile('CHRISTIANITY', { practiceMode: 'learn' }) });
await lesson('breath', 'CHRISTIANITY', 1, {}, { maxShots: 8 });
// day 8's sit: open the lesson at the sit through its own resume state (forced), as walk-practice.mjs did
await run('sit', async (o) => {
  const door = 'CATHOLIC';
  const sits = Array.from({ length: 7 }, (_, i) => ({ id: `sit_test${String(i).padStart(4, '0')}`, door, day: i + 1, date: iso(7 - i), tz: 'America/New_York', kidId: null, deviceId: 'dev_test1234', at: `${iso(7 - i)}T14:00:00.000Z` }));
  await seed(o.page, { v: 1, deviceId: 'dev_test1234', sits, outbox: [], settingsVersion: 1, settings: { onboarded: true, homeWing: door, active: 'home', profile: null, runs: [], voiceOn: false, chime: false, analytics: 'no' } }, calm(TODAY));
  const steps = planDay({ wing: door, day: 8, mode: 'adult', level: 1 }).steps;
  const from = steps.findIndex((s) => s.type === 'sit');
  const queue = steps.slice(from).filter((s) => s.type !== 'rhythm').map((s) => s.id);
  await o.page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [`ih:lesson:${door}:8:me:L1`, { date: TODAY, queue, qi: 0, phase: 'play', missed: [], score: { right: 3, asked: 3 }, best: 3 }]);
  await o.page.goto(`${B}/session/${door}/8`); await W(o.page, 3500);
  await shot(o, 'sit-01-ready', 500);
  await o.page.getByRole('button', { name: 'start the sit', exact: true }).locator('visible=true').first().click().catch(() => {}); await W(o.page, 2500);
  await shot(o, 'sit-02-running-not-today', 300);
  log._sitNotTodayWhileRunning = await has(o.page, 'not-today');
  if (log._sitNotTodayWhileRunning) { await click(o.page, 'not-today', 1400); await shot(o, 'sit-03-after-skip', 500); }
});
save();
console.log('DONE');
