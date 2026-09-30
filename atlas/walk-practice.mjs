// Practices optional: (a) onboarding as "learning my partner's or family's faith" -> Judaism -> "just learn": the lesson
// has no breath or sit, and Today's practice card is a "how it's done" explainer; (b) a practicing Catholic is offered
// the rosary to do; (c) "not today" on the breath (day 1) and the sit (day 8) skips it and the day still completes.
// Build: apps/app -> npx expo export --platform web --output-dir ..\..\atlas\expo-practice --clear
// Serve: node serve.mjs expo-practice 5196 --spa      Run: node walk-practice.mjs [a,b,c]
process.env.ATLAS_IMG = 'img-dev';
import { shot } from './shoot.mjs';
import { chromium } from 'playwright-core';
import { register } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { planDay } from '../packages/content/src/index.js';

const B = 'http://127.0.0.1:5196';
const only = process.argv[2] || 'a,b,c';
const run = (s) => only.split(',').includes(s);
const W = (p, ms = 700) => p.waitForTimeout(ms);
const results = [];
const check = (what, ok, saw = '') => { results.push({ what, ok }); console.log(ok ? 'PASS' : 'FAIL', what, saw ? '| ' + String(saw).replace(/\n+/g, ' / ').slice(0, 240) : ''); };
const text = (p) => p.evaluate(() => document.body.innerText);
let n = 0;
const S = async (p, slug) => { await shot(p, `practice/${String(++n).padStart(2, '0')}-${slug}`); console.log('SHOT', slug, p.url().replace(B, '')); };

async function open() {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'no-preference', timezoneId: 'America/Los_Angeles' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  return { browser, page, errors, close: () => browser.close() };
}
const tid = async (p, id, wait = 900) => { await p.getByTestId(id).locator('visible=true').first().click({ timeout: 8000 }); await W(p, wait); };
const btn = (p, name) => p.getByRole('button', { name, exact: true }).locator('visible=true').first();
const iso = (k) => { const d = new Date(); d.setDate(d.getDate() - k); return d.toLocaleDateString('en-CA'); };
const settingsOf = (p) => p.evaluate(() => JSON.parse(localStorage.getItem('ih:app:v1') || '{}'));
async function seed(p, { door, days, profile = null }) {
  const sits = Array.from({ length: days }, (_, i) => ({ id: `sit_test${String(i).padStart(4, '0')}`, door, day: i + 1, date: iso(days - i), tz: 'UTC', kidId: null, deviceId: 'dev_test1234', at: new Date(Date.now() - (days + 1 - i) * 86400000).toISOString() }));
  await p.goto(B + '/today'); await W(p, 2000);
  await p.evaluate(([sits, door, profile]) => { localStorage.clear(); localStorage.setItem('ih:app:v1', JSON.stringify({ v: 1, deviceId: 'dev_test1234', sits, outbox: [], settingsVersion: 1, settings: { onboarded: true, homeWing: door, active: 'home', profile, runs: [], voiceOn: false, chime: false, analytics: 'no' } })); }, [sits, door, profile]);
}

// Plays a lesson to the win screen, answering right. Knows day one (beats, call it, the breath) and the steps after a sit.
async function play(p, { door, day, level, skip = true, label }) {
  const steps = planDay({ wing: door, day, mode: 'adult', level }).steps;
  const seen = [];
  for (let g = 0; g < 80; g++) {
    await W(p, 700);
    const t = await text(p);
    if (await p.getByTestId('finish').isVisible().catch(() => false)) { seen.push('tally'); return { seen, tally: t }; }
    if (await p.getByTestId('not-today').isVisible().catch(() => false)) {
      const kind = /start the sit|the sun breathes with you/.test(t) ? 'sit' : 'breath';
      seen.push(kind);
      await S(p, `${label}-${kind}-ready`);
      if (skip) { await tid(p, 'not-today', 1200); seen.push(`${kind}-skipped`); await S(p, `${label}-after-${kind}-skip`); continue; }
    }
    if (/what does it actually mean\?/i.test(t)) { const s = steps.find((x) => x.type === 'bet'); seen.push('bet'); await btn(p, s.answer).click(); await W(p, 600); await btn(p, 'next').click(); continue; }
    if (/tap the words in order|tap what you hear/i.test(t)) {
      const s = steps.find((x) => x.type === 'taphear'); seen.push('taphear');
      for (const w of s.words) { const all = p.getByRole('button', { name: w, exact: true }); for (let i = (await all.count()) - 1; i >= 0; i--) { const el = all.nth(i); if (await el.evaluate((e) => getComputedStyle(e.parentElement).justifyContent === 'center') && await el.isVisible()) { await el.click(); await W(p, 200); break; } } }
      await btn(p, 'check').click(); await W(p, 800); await btn(p, 'next').click().catch(() => btn(p, 'okay, next').click()); continue;
    }
    if (/can't talk right now/i.test(t)) { seen.push('say'); await p.getByText(/can't talk right now/i).locator('visible=true').first().click(); await W(p, 600); }
    if (await btn(p, 'I said it').count()) { seen.push('speak'); await btn(p, 'I said it').click(); await W(p, 1800); continue; }
    if (await p.getByTestId('next').isVisible().catch(() => false)) {
      if (/how it's done/.test(t) && !seen.includes('how-its-done')) { seen.push('how-its-done'); await S(p, `${label}-how-its-done`); }
      seen.push('beat'); await tid(p, 'next', 500); continue;
    }
    if (/^Day \d+\.$/m.test(t)) { await W(p, 1500); continue; }
    if (await btn(p, 'next').count()) { await btn(p, 'next').click(); continue; }
    console.log('STUCK', t.slice(0, 300)); await S(p, `${label}-stuck`); return { seen, stuck: t };
  }
  return { seen };
}
async function finish(p, label) {
  await S(p, `${label}-win`);
  await tid(p, 'finish', 3000);
  await S(p, `${label}-after-finish`);
}

if (run('a')) {
  const o = await open(); const p = o.page;
  await p.goto(B + '/welcome'); await W(p, 2500);
  await p.evaluate(() => localStorage.clear()); await p.goto(B + '/welcome'); await W(p, 2500);
  await tid(p, 'start-free', 1200);
  await tid(p, 'stance-partner'); await tid(p, 'learning-JUDAISM', 1400);
  await S(p, 'a-door');
  const jr = p.getByRole('radio', { name: /Judaism/ }).locator('visible=true').first();
  if (await jr.count() && (await jr.getAttribute('aria-checked')) !== 'true') await jr.click();
  await W(p, 500); await tid(p, 'door-continue', 1400); await tid(p, 'trail-continue', 1200);
  await p.getByText(/skip this ›/).locator('visible=true').first().click(); await W(p, 1200);
  for (const id of ['practice-holidays', 'hold-culture', 'openness-sometimes']) await tid(p, id, 900);
  const q = await text(p);
  check('a: the choice is asked as the last belief question', /Do you want to try the practices, or just learn\?/.test(q) && /change it any time under You/.test(q), q.slice(0, 300));
  await S(p, 'a-practice-mode-question');
  await tid(p, 'practiceMode-learn', 1400);
  const saved = await settingsOf(p);
  check('a: saved as profile.answers.practiceMode = "learn"', saved.settings?.profile?.answers?.practiceMode === 'learn', JSON.stringify(saved.settings?.profile?.answers));
  await tid(p, 'fit-continue', 1200); await tid(p, 'lets-go', 200);
  await p.waitForURL(/session/, { timeout: 10000 }); await W(p, 3000);
  const r = await play(p, { door: 'JUDAISM', day: 1, level: 0, label: 'a-lesson' });
  check('a: the lesson has no breath and no sit', !r.seen.some((x) => x === 'breath' || x === 'sit'), r.seen.join(','));
  check('a: the practice is told as "how it\'s done"', r.seen.includes('how-its-done'), r.seen.join(','));
  check('a: the lesson reaches the win screen', r.seen.includes('tally'));
  await finish(p, 'a-lesson');
  await p.clock.setFixedTime(new Date(`${iso(0)}T12:30:00`));
  await p.goto(B + '/today'); await W(p, 3500);
  const card = p.getByTestId('companion-card').locator('visible=true').first();
  await card.scrollIntoViewIfNeeded(); await W(p, 600);
  const ct = await card.innerText();
  await S(p, 'a-today-card');
  check('a: Today\'s practice card is a "how it\'s done" explainer', /how it's done/i.test(ct), ct);
  await p.getByTestId('companion-practice').locator('visible=true').first().click(); await W(p, 1500);
  const ex = await text(p);
  await S(p, 'a-explainer');
  check('a: the explainer: what it is, when, what it means', /what it is/i.test(ex) && /when people do it/i.test(ex) && /what it means to them/i.test(ex), ex.slice(0, 400));
  check('a: no timer, no start, no "done"', !(await p.getByRole('button', { name: /start|^done/i }).locator('visible=true').count()), ex.slice(0, 200));
  await p.goto(B + '/you'); await W(p, 2500);
  const row = p.getByTestId('row-practices').locator('visible=true').first(); await row.scrollIntoViewIfNeeded(); await W(p, 500);
  check('a: You has "practices: try them / just learn"', /practices[\s\S]*just learn/.test(await row.innerText()), await row.innerText());
  await S(p, 'a-you-practices-row');
  check('a: no page errors', o.errors.length === 0, o.errors.join(' | '));
  await o.close();
}

if (run('b')) {
  // find a Wednesday hour at which the phone picks the rosary for this person, from the app's own shape.ts
  const root = fileURLToPath(new URL('../', import.meta.url)); const src = `${root}apps/app/src/`;
  const stub = (c) => `data:text/javascript,${encodeURIComponent(c)}`;
  register(stub(`const SRC=${JSON.stringify(pathToFileURL(src).href)};const C=${JSON.stringify(pathToFileURL(root + 'packages/content/src/index.js').href)};
const ST={react:${JSON.stringify(stub('export const useEffect=()=>{};export const useState=(x)=>[x,()=>{}];export const useSyncExternalStore=(s,g)=>g();export default {};'))},"expo-crypto":${JSON.stringify(stub('export const randomUUID=()=>globalThis.crypto.randomUUID();'))}};
export async function resolve(s,c,n){if(ST[s])return{url:ST[s],shortCircuit:true};if(s==='@ih/content')return{url:C,shortCircuit:true};let b=null;if(s.startsWith('@/'))b=new URL(s.slice(2),SRC).href;else if((s.startsWith('./')||s.startsWith('../'))&&c.parentURL?.startsWith(SRC))b=new URL(s,c.parentURL).href;if(b)for(const e of['','.ts','.js','/index.ts']){try{return await n(b+e,c)}catch{}}return n(s,c)}
export async function load(u,c,n){if(u.startsWith(SRC)&&u.endsWith('.ts'))return n(u,{...c,format:'module-typescript'});return n(u,c)}`), import.meta.url);
  const { shapeToday } = await import(pathToFileURL(`${src}lib/companion/shape.ts`).href);
  const profile = { v: 1, door: 'CATHOLIC', knowledge: 90, commitment: 90, openness: 'stay', answers: { stance: 'practice', raisedIn: 'CATHOLIC', why: 'own', practice: 'daily', hold: 'fully' }, bridges: {}, lastBridgeOn: null, setOn: iso(8) };
  const today = iso(0); const wd = new Date(`${today}T12:00:00`).getDay();
  let at = null;
  for (let h = 5; h < 22 && !at; h++) {
    const d = shapeToday({ door: 'CATHOLIC', profile, level: 3, hour: h, weekday: wd, today, showedUp: 7, missedDays: 0, doneToday: false, lesson: 8, feels: [], kids: 0, memory: { v: 1, facts: [], seeded: false, moods: [], journal: [], done: [], reflected: [], helpClosedOn: null } });
    if (d.practice.id === 'rosary-decade') at = { h, how: d.howItsDone };
  }
  console.log('rosary hour', at);
  const o = await open(); const p = o.page;
  await seed(p, { door: 'CATHOLIC', days: 7, profile });
  await p.clock.setFixedTime(new Date(`${today}T${String(at ? at.h : 12).padStart(2, '0')}:10:00`));
  await p.goto(B + '/today'); await W(p, 3500);
  const card = p.getByTestId('companion-card').locator('visible=true').first();
  await card.scrollIntoViewIfNeeded(); await W(p, 600);
  const ct = await card.innerText();
  await S(p, 'b-catholic-today-card');
  check('b: a practicing Catholic is offered the rosary to do', /one decade of the rosary/.test(ct) && /today's practice/i.test(ct) && !/how it's done/i.test(ct), ct);
  await p.goto(B + '/practice/rosary-decade'); await W(p, 2000);
  const pt = await text(p);
  await S(p, 'b-rosary-practice');
  check('b: the rosary opens with the steps, a timer and "done"', /pray ten Hail Marys/.test(pt) && await btn(p, 'done').count() > 0, pt.slice(0, 300));
  check('b: no page errors', o.errors.length === 0, o.errors.join(' | '));
  await o.close();
}

if (run('c')) {
  // day one: the breath
  let o = await open(); let p = o.page;
  await seed(p, { door: 'CATHOLIC', days: 0 });
  await p.goto(B + '/session/CATHOLIC/1'); await W(p, 3500);
  let r = await play(p, { door: 'CATHOLIC', day: 1, level: 0, label: 'c-day1' });
  check('c: "not today" on the breath moves the lesson on', r.seen.includes('breath-skipped') && r.seen.includes('tally'), r.seen.join(','));
  const tally1 = r.tally || '';
  await finish(p, 'c-day1');
  let st = await settingsOf(p);
  check('c: day one still completes (a sit is saved)', st.sits?.some((s) => s.door === 'CATHOLIC' && s.day === 1), JSON.stringify(st.sits?.map((s) => s.day)));
  check('c: the win screen still shows the full light', /\+1[5-9]|\+\d\d/.test(tally1), tally1.slice(0, 200));
  await o.close();

  // day eight: the sit (resume the lesson right at the sit, then play it out)
  o = await open(); p = o.page;
  await seed(p, { door: 'CATHOLIC', days: 7 });
  const steps = planDay({ wing: 'CATHOLIC', day: 8, mode: 'adult', level: 1 }).steps;
  // the lesson's own queue from the sit on (the rhythm game left out: it's timing, not what's being checked here)
  const from = steps.findIndex((s) => s.type === 'sit');
  const queue = steps.slice(from).filter((s) => s.type !== 'rhythm').map((s) => s.id);
  await p.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), ['ih:lesson:CATHOLIC:8:me:L1', { date: iso(0), queue, qi: 0, phase: 'play', missed: [], score: { right: 3, asked: 3 }, best: 3 }]);
  await p.goto(B + '/session/CATHOLIC/8'); await W(p, 3500);
  // start the sit, then pass it while it's running
  const t0 = await text(p);
  check('c: day eight opens on the sit', /start the sit|the sun breathes with you/.test(t0), t0.slice(0, 200));
  await S(p, 'c-day8-sit-ready');
  await btn(p, 'start the sit').click(); await W(p, 2500);
  await S(p, 'c-day8-sit-running');
  check('c: "not today" shows while the sit runs', await p.getByTestId('not-today').isVisible().catch(() => false));
  await tid(p, 'not-today', 1200);
  await S(p, 'c-day8-after-sit-skip');
  r = await play(p, { door: 'CATHOLIC', day: 8, level: 1, label: 'c-day8' });
  check('c: after the skipped sit the lesson reaches the win screen', r.seen.includes('tally'), r.seen.join(','));
  const tally8 = r.tally || '';
  const ft = /(\d+)\/(\d+)\s*\n?\s*first try/i.exec(tally8);
  check('c: no miss counted for the skipped sit (first try all right)', !!ft && ft[1] === ft[2], tally8.slice(0, 300));
  await finish(p, 'c-day8');
  st = await settingsOf(p);
  check('c: day eight still completes (a sit is saved)', st.sits?.some((s) => s.door === 'CATHOLIC' && s.day === 8), JSON.stringify(st.sits?.map((s) => s.day)));
  check('c: no page errors', o.errors.length === 0, o.errors.join(' | '));
  await o.close();
}

console.log(`\n${results.filter((r) => r.ok).length}/${results.length} checks passed`);
