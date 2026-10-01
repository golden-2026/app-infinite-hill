// Circles walk (2026-10-01): a leader starts a Hindu circle; three people join by its link (one while signing up, one
// for their family); two walk a lesson; the leader pins a note; the counts update. English and Spanish, 390x844.
// Everything goes through the real local server (api/circles.js + api/friends.js, in memory). Test values only.
// Run: node atlas/friends-server.mjs expo-dev-circles 5199, then BASE=http://127.0.0.1:5199 node atlas/walk-circles.mjs [en|es]
// Shots: img-dev/circles/<lang>/, page text, overflow and errors: img-dev/circles/<lang>/walk.json.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const B = process.env.BASE || 'http://127.0.0.1:5199';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TZ = 'America/New_York';
const TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const addDays = (date, k) => { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };
const W = (p, ms = 700) => p.waitForTimeout(ms);
const langs = process.argv[2] ? [process.argv[2]] : ['en', 'es'];
const browser = await chromium.launch({ executablePath: CHROME, headless: true });

const profile = (door) => ({ v: 1, door, knowledge: 40, commitment: 60, openness: 'stay', answers: { raised: 'yes', practice: 'weekly', hold: 'fully' }, bridges: {}, lastBridgeOn: null, setOn: '2026-06-01' });
let n = 0;
const sit = (door, day, date, kidId = null) => ({ id: `sit_circle${String(++n).padStart(6, '0')}`, door, day, date, tz: TZ, kidId, deviceId: 'dev_circle001', at: `${date}T14:00:00.000Z` });
const state = (door, day, { kids = [] } = {}) => ({
  v: 1, deviceId: 'dev_circle001', outbox: [], settingsVersion: 1,
  sits: Array.from({ length: Math.max(1, day - 1) }, (_, k) => sit(door, Math.max(1, day - 1 - k), addDays(TODAY, -1 - k))),
  missed: [],
  settings: { onboarded: true, homeWing: door, active: 'home', analytics: 'no', voiceOn: false, unlocksSeen: ['guide', 'together'], book: [], signals: [], kids, reminder: { on: false, time: 'sundown' }, profile: profile(door), pulse: false },
});
const calm = { v: 1, facts: [], seeded: false, moods: [{ date: TODAY, mood: 'good' }], journal: [], done: [], reflected: [], helpClosedOn: null };

for (const lang of langs) {
  const es = lang === 'es';
  const OUT = new URL(`./img-dev/circles/${lang}/`, import.meta.url);
  mkdirSync(OUT, { recursive: true });
  const log = { today: TODAY, lang, shots: [], checks: {} };
  const save = () => writeFileSync(new URL('walk.json', OUT), JSON.stringify(log, null, 1));
  const overflow = (page) => page.evaluate(() => {
    const out = [];
    if (document.documentElement.scrollWidth > innerWidth + 1) out.push(`page scrolls sideways: ${document.documentElement.scrollWidth}px`);
    for (const el of document.querySelectorAll('div, span')) {
      if (!el.innerText || el.children.length) continue;
      const r = el.getBoundingClientRect();
      if (r.width && r.height && (el.scrollWidth > el.clientWidth + 2 || r.right > innerWidth + 1 || r.left < -1) && getComputedStyle(el).overflowX !== 'auto' && getComputedStyle(el).textOverflow !== 'ellipsis') out.push(`${el.innerText.slice(0, 50)} (${Math.round(r.left)}–${Math.round(r.right)}, text ${el.scrollWidth} in ${el.clientWidth})`);
    }
    return out.slice(0, 8);
  });
  let shotN = 0;

  async function person(who, seed) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: TZ });
    await context.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'share', { value: undefined, configurable: true }); } catch {} });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message || e)));
    await page.goto(`${B}/favicon.ico`);
    await page.evaluate(([s, m, lang]) => {
      localStorage.clear();
      if (s) { localStorage.setItem('ih:app:v1', JSON.stringify(s)); localStorage.setItem('ih:companion', JSON.stringify(m)); }
      localStorage.setItem('ih:lang', JSON.stringify(lang));
      localStorage.setItem('ih:es-lesson-note', 'true');
    }, [seed, calm, lang]);
    const vis = (id) => page.getByTestId(id).locator('visible=true');
    const o = {
      who, page, errors, vis,
      has: async (id) => (await vis(id).count()) > 0,
      tap: async (id, wait = 900) => { await vis(id).first().click(); await W(page, wait); },
      text: () => page.evaluate(() => document.body.innerText),
      shot: async (name, wait = 900) => {
        await W(page, wait);
        const file = `${String(++shotN).padStart(2, '0')}-${who}-${name}.png`;
        await page.screenshot({ path: new URL(file, OUT).pathname.slice(1) });
        const entry = { file, url: page.url().replace(B, ''), overflow: await overflow(page), errors: errors.filter((e) => !/play\(\) failed/.test(e)), text: (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 700) };
        log.shots.push(entry);
        console.log(lang, file, entry.overflow.length ? `OVERFLOW ${entry.overflow.join(' | ')}` : '', entry.errors.length ? `ERRORS ${entry.errors.join(' | ')}` : '');
        save();
      },
      close: () => context.close(),
    };
    return o;
  }
  /** Scroll the circles card into view, then photograph it. */
  async function together(o, name) {
    await o.page.goto(`${B}/together`); await W(o.page, 3000);
    const card = o.vis('circles-card').first();
    if (await card.count()) await card.scrollIntoViewIfNeeded();
    await o.shot(name, 600);
    const c = o.vis('circle').first();
    if (await c.count()) {
      return {
        count: (await o.vis('circle-count').first().innerText()).trim(),
        walked: (await o.vis('circle-walked').first().innerText()).trim(),
        members: await o.vis('circle-member').allInnerTexts(),
        note: (await o.vis('circle-note').count()) ? (await o.vis('circle-note').first().innerText()).replace(/\s+/g, ' ') : null,
      };
    }
    return null;
  }
  /** Walk today's lesson to its end (each step moved on, as walk-queue does), then finish it. */
  async function walkLesson(o, door, day) {
    if (!/\/session\//.test(o.page.url())) await o.page.goto(`${B}/session/${door}/${day}`);
    await o.page.waitForFunction(() => !document.querySelector('[data-testid="lesson-loading"]'), null, { timeout: 20000 });
    await W(o.page, 1500);
    if (await o.has('es-lesson-note-ok')) await o.tap('es-lesson-note-ok', 500);
    let shotLesson = false;
    for (let i = 0; i < 120; i++) {
      if (await o.has('finish')) { await o.shot('lesson-end', 600); await o.tap('finish', 2000); return true; }
      if (!shotLesson) { await o.shot('lesson', 300); shotLesson = true; }
      if (await o.has('not-today')) { await o.tap('not-today', 1200); continue; }
      if (await o.has('next')) { await o.tap('next', 500); continue; }
      const moved = await o.page.evaluate(() => {
        const k = Object.keys(localStorage).find((x) => x.startsWith('ih:lesson:'));
        if (!k) return false;
        const r = JSON.parse(localStorage.getItem(k)); r.qi += 1; localStorage.setItem(k, JSON.stringify(r)); return true;
      });
      if (!moved) { await W(o.page, 2000); continue; }
      await o.page.reload(); await W(o.page, 2500);
    }
    return false;
  }

  try {
    // 1. the leader starts a Hindu circle from Together
    const lead = await person('leader', state('HINDUISM', 12));
    await together(lead, 'together-before');
    await lead.tap('circle-start', 1500);
    await lead.page.getByTestId('circle-new-name').fill(es ? 'Círculo del Gita de los martes' : 'Tuesday Gita circle');
    await lead.page.getByRole('radio', { name: es ? /^hinduismo$/i : /^hinduism$/i }).first().click();
    await lead.page.getByTestId('circle-new-leader').fill('Pandit Ravi');
    await lead.page.getByTestId('circle-new-welcome').fill(es ? 'Bienvenidos. Caminemos juntos un poco cada día, y nos vemos el martes.' : 'Welcome, all. A few minutes a day together, and we meet on Tuesday.');
    await lead.shot('start-form', 400);
    await lead.tap('circle-new-go', 2500);
    await lead.shot('start-ready');
    const code = (await lead.vis('circle-new-code').first().innerText()).replace('-', '').trim();
    log.checks.code = code;
    await lead.tap('circle-new-done', 1500);
    log.checks.leaderAlone = await together(lead, 'together-leader-new');

    const link = `${B}/circle?c=${code}${es ? '&lang=es' : ''}`;
    // 2. Meera (signed up already) joins by the link, showing a nickname
    const meera = await person('meera', state('HINDUISM', 5));
    await meera.page.goto(link); await W(meera.page, 2500);
    await meera.shot('join-preview');
    await meera.tap('circle-join-nick', 400);
    await meera.page.getByTestId('circle-join-nick-input').fill('Meera');
    await meera.shot('join-nick', 300);
    await meera.tap('circle-join-go', 2500);
    log.checks.meeraJoined = await together(meera, 'together-joined');

    // 3. a parent with a child at the family table joins for the family, by nickname
    const fam = await person('family', state('HINDUISM', 8, { kids: [{ id: 'kid_circle01', name: 'Arjun', door: 'HINDUISM', birthYear: 2018 }] }));
    await fam.page.goto(link); await W(fam.page, 2500);
    await fam.tap('circle-join-nick', 400);
    await fam.page.getByTestId('circle-join-nick-input').fill(es ? 'familia Shah' : 'the Shah family');
    await fam.tap('circle-join-family', 400);
    await fam.shot('join-family', 300);
    await fam.tap('circle-join-go', 2500);
    log.checks.familyJoined = await together(fam, 'together-family');

    // 4. someone new opens the link before signing up: "you're joining … with …", then straight on to the Hindu door
    const fresh = await person('new', null);
    await fresh.page.goto(link); await W(fresh.page, 3000);
    await fresh.shot('join-onboarding');
    await fresh.tap('circle-join-go', 2500);
    log.checks.onboardingLanded = fresh.page.url().replace(B, '');
    await fresh.shot('onboarding-trail');
    // through the rest of sign-up: the first choice each time, the check skipped where it can be
    for (let g = 0; g < 60 && !/\/session\//.test(fresh.page.url()); g++) {
      if (await fresh.has('know-harder')) { await fresh.tap('know-harder', 800); continue; }
      let tapped = false;
      for (const id of ['place-skip', 'place-continue', 'trail-continue', 'know-start', 'fit-continue', 'lets-go']) {
        if (await fresh.has(id)) { await fresh.tap(id, 1200); tapped = true; break; }
      }
      if (tapped) continue;
      const radio = fresh.page.getByRole('radio').locator('visible=true').first();
      if (await radio.count()) { await radio.click(); await W(fresh.page, 900); continue; }
      const any = fresh.page.locator('[data-testid$="-continue"]').locator('visible=true').first();
      if (await any.count()) { await any.click(); await W(fresh.page, 1200); continue; }
      await W(fresh.page, 1000);
    }
    log.checks.onboardingLesson = fresh.page.url().replace(B, '');
    // walk 1: the newcomer's first lesson
    log.checks.newWalked = await walkLesson(fresh, 'HINDUISM', 1);
    log.checks.newTogether = await together(fresh, 'together-new');

    // walk 2: Meera walks today's lesson
    log.checks.meeraWalked = await walkLesson(meera, 'HINDUISM', 5);
    log.checks.meeraAfter = await together(meera, 'together-meera-walked');

    // 5. the leader pins a note; everyone sees it with the counts
    await lead.page.goto(`${B}/together`); await W(lead.page, 3000);
    await lead.vis('circle').first().scrollIntoViewIfNeeded();
    await lead.page.getByRole('link', { name: es ? /publicar una nota/i : /post a note/i }).first().click(); await W(lead.page, 600);
    await lead.page.getByTestId('circle-note-input').fill(es ? 'Esta semana: capítulo 2 del Gita. El martes a las 7 lo comentamos juntos.' : 'This week: Gita chapter 2. We talk it through together on Tuesday at 7.');
    await lead.vis('circle-note-input').first().scrollIntoViewIfNeeded();
    await lead.shot('note-write', 300);
    await lead.tap('circle-note-save', 2000);
    log.checks.leaderAfter = await together(lead, 'together-leader-counts');
    log.checks.meeraSeesNote = await together(meera, 'together-meera-note');
    log.checks.familySees = await together(fam, 'together-family-later');

    // the leader sees no more than members do: compare the two cards' counts and names
    log.checks.sameView = log.checks.leaderAfter?.count === log.checks.meeraSeesNote?.count && log.checks.leaderAfter?.walked === log.checks.meeraSeesNote?.walked && log.checks.leaderAfter?.members?.length === log.checks.meeraSeesNote?.members?.length;
    // and the server never sent ids
    log.checks.apiMine = await meera.page.evaluate(async () => {
      const f = JSON.parse(localStorage.getItem('ih:friends'));
      const today = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const r = await fetch(`/api/circles?kind=mine&date=${today}`, { headers: { authorization: `Friend ${f.friendId}:${f.token}` } });
      const j = await r.json();
      return { status: r.status, hasIds: JSON.stringify(j).includes('f_'), counts: j.circles.map((c) => [c.count, c.walkedToday]) };
    });
    save();
    for (const o of [lead, meera, fam, fresh]) await o.close();
  } catch (e) {
    log.error = String(e.stack || e);
    console.error(lang, e);
    save();
  }
}
await browser.close();
