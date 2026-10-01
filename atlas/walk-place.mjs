// Placement walk (2026-10-01): the "where are you?" check, from the first screen to the end of the first placed lesson,
// at 390x844, English and Spanish. Three people, each a fresh phone (test values only, nothing seeded but the language):
//   expert-hindu  practises Hinduism; aces the basics and the harder ones; takes the skip to day 22
//   beginner      no religion, picks Hinduism; misses everything; starts at day 1
//   expert-islam  practises Islam; aces both; takes the skip to day 22
// Every game step of the first lesson is PLAYED (answers tapped, pairs matched, words typed, rhythm tapped, the breath and
// the sit sat through), never stepped over. After the expert Hindu lesson: Today, the trail (catch-up), You, a catch-up
// lesson opening, and the review.
// Run: node atlas/serve.mjs expo-dev-place 5230 --spa, then node atlas/walk-place.mjs [en|es] [expert-hindu,beginner,expert-islam]
// Shots: img-dev/place/<lang>/. Log (page text, overflow, errors, steps played): img-dev/place/<lang>/walk.json.
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { data } from '../packages/content/src/index.js';

const B = process.env.BASE || 'http://127.0.0.1:5230';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TZ = 'America/New_York';
const W = (p, ms = 700) => p.waitForTimeout(ms);
const langs = process.argv[2] ? [process.argv[2]] : ['en', 'es'];
const people = process.argv[3] ? process.argv[3].split(',') : ['expert-hindu', 'beginner', 'expert-islam'];

// the right answer is always listed first in the sources; the screen shuffles
const parseQs = (file) => {
  const src = readFileSync(new URL(file, import.meta.url), 'utf8');
  const out = [];
  for (const m of src.matchAll(/q: "((?:[^"\\]|\\.)*)", o: \[((?:"(?:[^"\\]|\\.)*"(?:, )?)+)\]/g)) out.push({ q: JSON.parse(`"${m[1]}"`), o: JSON.parse(`[${m[2]}]`) });
  return out;
};
const BANK = [
  ...Object.values(data.PLACEMENT).flat().map((x) => ({ q: x.q, o: x.o })),
  ...parseQs('../apps/app/src/content/placement.ts'),
  ...parseQs('../apps/app/src/i18n/strings/onboarding-placement.ts'),
];

const L = {
  en: { next: 'next', okayNext: 'okay, next', check: 'check', saidIt: 'I said it', cantTalk: "can't talk right now ›", listen: 'listen', go: 'go!', tapBeat: 'tap on the beat', rushGo: 'go', take: 'take it', start: 'start', sitStart: 'start the sit', sitDone: "I'm done ›", tru: 'true', myth: 'myth', down: 'go down', more: 'one more', up: (x) => `move up: ${x}`, answer: 'your answer', fix: 'one more time', unsure: 'not sure', hindu: /^hinduism$/i },
  es: { next: 'siguiente', okayNext: 'bueno, siguiente', check: 'comprobar', saidIt: 'Ya lo dije', cantTalk: 'ahora no puedo hablar ›', listen: 'escuchar', go: '¡ya!', tapBeat: 'toca al compás', rushGo: 'vamos', take: 'vamos', start: 'empezar', sitStart: 'empezar la quietud', sitDone: 'ya terminé ›', tru: 'verdad', myth: 'mito', down: 'bajar', more: 'uno más', up: (x) => `subir: ${x}`, answer: 'tu respuesta', fix: 'otra vuelta', unsure: 'no sé', hindu: /^hinduismo$/i },
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
for (const lang of langs) {
  const T = L[lang];
  const OUT = new URL(`./img-dev/place/${lang}/`, import.meta.url);
  mkdirSync(OUT, { recursive: true });
  const log = { lang, runs: {} };
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

  for (const who of people) {
    const run = (log.runs[who] = { shots: [], steps: [], belief: [], know: [], errors: [] });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: TZ });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.on('pageerror', (e) => run.errors.push(String(e.message || e)));
    let shotN = 0;
    const shot = async (name, wait = 700) => {
      await W(page, wait);
      const file = `${who}-${String(++shotN).padStart(2, '0')}-${name}.png`;
      await page.screenshot({ path: new URL(file, OUT).pathname.slice(1) });
      run.shots.push({ file, url: page.url().replace(B, ''), overflow: await overflow(page), text: (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 500) });
      console.log(lang, who, file, run.shots.at(-1).overflow.length ? `OVERFLOW ${run.shots.at(-1).overflow.join(' | ')}` : '');
      save();
    };
    const vis = (id) => page.getByTestId(id).locator('visible=true');
    const has = async (id) => (await vis(id).count()) > 0;
    const tap = async (id, wait = 800) => { await vis(id).first().click(); await W(page, wait); };
    const btn = (name) => page.getByRole('button', { name, exact: true }).locator('visible=true');
    const path = () => new URL(page.url()).pathname;

    try {
      // a fresh phone in this language
      await page.goto(`${B}/icon-192.png`);
      await page.evaluate((lang) => { localStorage.clear(); localStorage.setItem('ih:lang', JSON.stringify(lang)); }, lang);
      await page.goto(`${B}/welcome`); await W(page, 2500);
      await shot('splash');
      await tap('start-free', 1200);
      const door = who === 'expert-islam' ? 'ISLAM' : 'HINDUISM';
      if (who === 'beginner') { await tap('stance-curious'); await shot('you-grew-up'); await tap('raisedIn-none', 1200); }
      else { await tap('stance-practice'); await shot('you-which-one'); await tap(`raisedIn-${door}`, 1200); }
      if (await has('heardFrom-skip')) await tap('heardFrom-skip', 1200);
      await shot('door');
      if (who === 'beginner') { await page.getByRole('radio', { name: T.hindu }).locator('visible=true').first().click(); await W(page, 500); }
      await tap('door-continue', 1500);
      await shot('trail');
      await tap('trail-continue', 1200);

      // the check
      await shot('know-intro');
      await tap('know-start', 900);
      for (let g = 0; g < 30 && path() === '/welcome/know'; g++) {
        if (await has('know-harder')) { run.know.push('offer'); await shot('know-offer'); await tap('know-harder', 900); continue; }
        if (await has('place-skip') || await has('place-continue')) {
          await shot('know-result');
          run.result = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 400);
          await tap(await has('place-skip') ? 'place-skip' : 'place-continue', 1200);
          break;
        }
        const radios = page.getByRole('radio').locator('visible=true');
        const names = (await radios.allInnerTexts()).map((x) => x.split('\n')[0].trim());
        const q = BANK.find((x) => x.o.every((o) => names.includes(o)));
        if (!q) { run.know.push(`no match for ${names.join(' / ')}`); await shot('know-unknown'); break; }
        const eyebrow = (await page.evaluate(() => document.body.innerText)).split('\n').find((l) => /\d+ (of|de) \d+/i.test(l)) || '';
        const pick = who === 'beginner' ? q.o[1] : q.o[0];
        run.know.push(`${eyebrow.trim()} · ${who === 'beginner' ? 'wrong' : 'right'}`);
        if (g === 0 || /^(harder|más difícil) · 1 /i.test(eyebrow.trim())) await shot(`know-q-${g + 1}`);
        await page.getByRole('radio', { name: pick, exact: true }).locator('visible=true').first().click();
        if (g === 0 || /^(harder|más difícil) · 1 /i.test(eyebrow.trim())) await shot(`know-q-${g + 1}-answered`, 250);
        await W(page, 900);
      }

      // about you: the first choice each time (recording which questions came up)
      for (let g = 0; g < 12 && path() === '/welcome/belief'; g++) {
        const first = page.locator('[role="radio"][data-testid]').locator('visible=true').first();
        const id = await first.getAttribute('data-testid');
        run.belief.push(id.replace(/-[^-]+$/, ''));
        if (g === 0) await shot('belief-first');
        await first.click(); await W(page, 700);
      }
      await shot('fit');
      await tap('fit-continue', 1200);
      await tap('lets-go', 900);
      await shot('ready', 300);
      await page.waitForURL(/\/session\//, { timeout: 10000 });
      run.lessonUrl = path();
      await page.waitForFunction(() => !document.querySelector('[data-testid="lesson-loading"]'), null, { timeout: 20000 });
      await W(page, 1200);
      if (await has('es-lesson-note-ok')) { await shot('lesson-es-note'); await tap('es-lesson-note-ok', 500); }

      // the lesson, every step played
      const seen = new Set();
      const stepNow = () => page.evaluate(() => {
        for (const el of document.querySelectorAll('*')) {
          const key = Object.keys(el).find((k) => k.startsWith('__reactFiber'));
          let f = key && el[key];
          for (let i = 0; f && i < 4; i++, f = f.return) {
            const p = f.memoizedProps || {};
            if (p.step && typeof p.step.type === 'string') return p.step;
            if (typeof p.n === 'number' && typeof p.onDone === 'function') return { type: 'breath', n: p.n };
            if (typeof p.secs === 'number' && typeof p.onDone === 'function' && !p.step) return { type: 'sit', secs: p.secs };
          }
        }
        return null;
      });
      const verdictNext = async () => {
        for (let i = 0; i < 25; i++) {
          for (const nm of [T.next, T.okayNext]) { const b = btn(nm); if (await b.count()) { await b.last().click(); await W(page, 800); return; } }
          await W(page, 200);
        }
        throw new Error('no next after a verdict');
      };
      const bankWord = async (w) => {
        const all = btn(w); const c = await all.count();
        for (let i = c - 1; i >= 0; i--) { const el = all.nth(i); if (await el.evaluate((e) => getComputedStyle(e.parentElement).justifyContent === 'center')) { await el.click(); await W(page, 200); return; } }
        throw new Error(`bank word missing: ${w}`);
      };
      let lastId = null;
      for (let g = 0; g < 160; g++) {
        if (await has('finish')) {
          run.steps.push('tally');
          await shot('lesson-tally', 1500);
          run.tally = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 300);
          await tap('finish', 1500);
          break;
        }
        // spoken beats (and the bell) are drawn by the lesson itself; the games are their own components with a `step`
        if (await has('next')) {
          const text = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
          const seg = (text.match(/(?:READS|LEE) · [^·]+ · (.+?) (?=HEAR IT AGAIN|ESCÚCHALO|ESCUCHAR|[A-Z][a-z'])/) || [])[1] || '';
          run.steps.push(`beat${seg ? `(${seg.toLowerCase().slice(0, 30)})` : ''}`);
          const n = run.steps.filter((x) => x.startsWith('beat')).length;
          if (n <= 3 || /welcome|bienvenida|review|repaso/i.test(seg)) await shot(`lesson-beat-${n}`, 300);
          (run.beats ||= []).push(text.slice(0, 260));
          await tap('next', 600); continue;
        }
        const s = await stepNow();
        if (!s) { await W(page, 600); continue; }
        const key = `${s.type}:${s.id ?? ''}`;
        if (key === lastId && !['bell', 'breath', 'sit'].includes(s.type)) { await W(page, 500); }
        lastId = key;
        const first = !seen.has(s.type); seen.add(s.type);
        run.steps.push(s.type + (s.seg ? `(${s.seg})` : ''));
        const snap = async (suffix = '', wait = 400) => { if (first) await shot(`lesson-${s.type}${suffix}`, wait); };
        switch (s.type) {
          case 'bell': await snap(); await W(page, 2200); break;
          case 'beat': {
            if (first || /welcome|bienvenida/i.test(s.seg || '') || /review|repaso/i.test(s.seg || '')) await shot(`lesson-beat-${run.steps.length}`, 300);
            if (/review/.test(s.seg || '')) run.reviewBeat = s.text;
            if (/welcome/.test(s.seg || '')) (run.welcomeBeats ||= []).push(s.text);
            await tap('next', 600); break;
          }
          case 'bet': await snap(); await btn(s.answer).first().click(); await snap('-answered', 300); await verdictNext(); break;
          case 'myth': await snap(); for (const [claim, v] of s.items) { await btn(`${v ? T.tru : T.myth}: ${claim}`).first().click(); await W(page, 250); } await snap('-answered', 300); await verdictNext(); break;
          case 'fork': await snap(); await btn(s.options[s.answer]).first().click(); await snap('-answered', 300); await verdictNext(); break;
          case 'original': await snap(); await btn(T.saidIt).first().click(); await W(page, 1600); break;
          case 'trapdoor': await snap(); await btn(T.down).first().click(); await W(page, 500); await btn(T.more).first().click(); await W(page, 500); await snap('-floor3', 200); await btn(T.next).last().click(); await W(page, 800); break;
          case 'guess': case 'recall': case 'listen':
            await snap(); await btn(s.answer).first().click(); await snap('-answered', 300); await verdictNext(); break;
          case 'order':
            await snap(); for (const it of s.items) { await btn(it).last().click(); await W(page, 250); } await snap('-placed', 300); await verdictNext(); break;
          case 'match':
            await snap(); for (const [l, r] of s.pairs) { await btn(l).first().click(); await W(page, 150); await btn(r).last().click(); await W(page, 250); } await snap('-matched', 300); await verdictNext(); break;
          case 'taphear':
            await snap(); for (const w of s.words) await bankWord(w); await snap('-filled', 200); await btn(T.check).last().click(); await W(page, 700); await verdictNext(); break;
          case 'scenes': {
            await snap();
            for (let i = 0; i < s.items.length; i++) for (let k = 0; k < 10; k++) {
              const ys = []; for (const it of s.items) { const b = await btn(T.up(it)).first().boundingBox(); ys.push(b ? b.y : 1e9); }
              const rank = [...ys].sort((a, b) => a - b).indexOf(ys[i]);
              if (rank <= i) break;
              await btn(T.up(s.items[i])).first().click(); await W(page, 300);
            }
            await snap('-sorted', 300); await btn(T.check).last().click(); await W(page, 700); await verdictNext(); break;
          }
          case 'say':
            await snap(); if (await btn(T.cantTalk).count()) { await btn(T.cantTalk).first().click(); await W(page, 400); }
            await btn(T.saidIt).first().click(); await W(page, 1500); break;
          case 'speak': await snap(); await btn(T.saidIt).first().click(); await W(page, 1800); break;
          case 'rhythm': {
            await snap();
            await btn(T.listen).last().click();
            await page.waitForFunction((go) => document.body.innerText.includes(go), T.go, { timeout: 20000, polling: 10 });
            const gap = 60000 / s.bpm; const total = s.syllables.length * s.rounds;
            const box = await page.getByRole('button', { name: T.tapBeat }).first().boundingBox();
            await W(page, gap - 40); const t0 = Date.now();
            for (let k = 0; k < total; k++) { const wt = t0 + k * gap - Date.now(); if (wt > 0) await W(page, wt); await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); }
            await W(page, gap + 900);
            run.rhythm = ((await page.evaluate(() => document.body.innerText)).match(/\d+ (of|de) \d+[^\n]*/) || [''])[0];
            await snap('-result', 200); await verdictNext(); break;
          }
          case 'typeit':
            await snap(); await page.getByLabel(T.answer).fill(s.answer); await W(page, 200); await snap('-typed', 100); await btn(T.check).last().click(); await W(page, 700); await verdictNext(); break;
          case 'rush':
            await snap(); await btn(T.rushGo).last().click(); await W(page, 600);
            for (const [l, r] of s.pairs) { await btn(l).first().click(); await W(page, 120); await btn(r).last().click(); await W(page, 200); }
            await snap('-done', 600); await verdictNext(); break;
          case 'breath':
            await snap(); await btn(s.n === 1 ? T.take : T.start).last().click();
            await W(page, 4500); await snap('-in', 0);
            await W(page, s.n * 8000 - 4500 + 2200); break;
          case 'sit':
            await snap(); await btn(T.sitStart).last().click(); await W(page, 3000); await snap('-sitting', 0);
            await btn(T.sitDone).first().waitFor({ timeout: 40000 }); await btn(T.sitDone).first().click(); await W(page, 1800); break;
          case 'fixintro': await snap(); await btn(T.fix).last().click(); await W(page, 800); break;
          case 'tally': break;
          default: run.steps.push(`UNKNOWN ${s.type}`); await shot(`lesson-unknown-${s.type}`); throw new Error(`unknown step ${s.type}`);
        }
      }

      // after the lesson: every screen to Today
      for (let g = 0; g < 14 && !/\/today$/.test(path()); g++) {
        await shot(`after-${path().split('/').filter(Boolean).join('-') || 'root'}`, 1200);
        if (await has('light-day')) { await tap('light-day', 2600); continue; }
        if (await has('goal-later')) { await tap('goal-later', 1000); continue; }
        if (await has('goal-no')) { await tap('goal-no', 1000); continue; }
        if (await has('see-you')) { await tap('see-you', 1500); continue; }
        if (await has('continue')) { await tap('continue', 1200); continue; }
        await W(page, 1200);
      }
      await shot('today', 2500);
      run.store = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('ih:app:v1')); return { placed: s.settings.placed, knowledge: s.settings.profile?.knowledge, sits: s.sits.map((x) => `${x.door}:${x.day}:${x.date}`), raised: s.settings.profile?.answers?.raised ?? null }; });

      if (who === 'expert-hindu') {
        // Today, scrolled to the hill and the trail link
        await page.mouse.move(195, 600); await page.mouse.wheel(0, 2200);
        await shot('today-bottom', 800);
        await page.goto(`${B}/trail?door=${door}`); await W(page, 2500);
        await shot('trail-catch-up');
        await page.mouse.move(195, 600); for (let k = 0; k < 12; k++) { await page.mouse.wheel(0, 3000); await W(page, 150); } await page.mouse.wheel(0, -1250);
        await shot('trail-camp-one', 800);
        await page.goto(`${B}/you`); await W(page, 2500);
        await shot('you');
        await page.goto(`${B}/trail?door=${door}`); await W(page, 2000);
        await tap('catch-up-3', 2500);
        run.catchUpUrl = path();
        await page.waitForFunction(() => !document.querySelector('[data-testid="lesson-loading"]'), null, { timeout: 20000 }).catch(() => {});
        await shot('catch-up-day-3-opens', 1500);
        await page.goto(`${B}/review`); await W(page, 2000);
        await shot('review');
      }
    } catch (e) {
      run.stopped = String(e.message || e).slice(0, 300);
      console.log('STOPPED', lang, who, run.stopped);
      await shot('stopped', 200).catch(() => {});
    } finally { save(); await context.close(); }
  }
}
await browser.close();
