// Onboarding typography walk (2026-10-01): every onboarding screen at 390x844, English and Spanish, after the one-style
// pass (ui ChoiceRow, type.bubble / type.choice, lowercase bubbles), the start-to-summit "whole climb" and the clearer
// placement result. Three fresh phones per language (test values only; nothing seeded but the language):
//   islam   practises Islam; basics right, 3 of the 6 harder ones (a miss); takes "skip to day 22 anyway"; about you; fit
//   hindu   practises Hinduism; aces both tiers (the pass screen)
//   own     no religion, my own path: getting to know you (pick-one and pick-several rows), suggestions, voice, ready
// Run: node atlas/serve.mjs expo-dev-type 5240 --spa, then node atlas/walk-type.mjs [en|es]
// Shots: img-dev/type/<lang>/, plus welcome-trail-full-<lang>.png (the whole scroll) and onboarding-sheet-<lang>.png.
import { chromium } from 'playwright-core';
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { data } from '../packages/content/src/index.js';

const B = process.env.BASE || 'http://127.0.0.1:5240';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const W = (p, ms = 700) => p.waitForTimeout(ms);
const langs = process.argv[2] ? [process.argv[2]] : ['en', 'es'];
const ROOT = new URL('./img-dev/type/', import.meta.url);

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

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const fsPath = (u) => decodeURIComponent(u.pathname).replace(/^\/([A-Za-z]:)/, '$1');

for (const lang of langs) {
  const OUT = new URL(`./${lang}/`, ROOT);
  mkdirSync(OUT, { recursive: true });
  const log = { lang, shots: [], errors: [] };
  let n = 0;

  const run = async (who, body) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.on('pageerror', (e) => log.errors.push(`${who}: ${String(e.message || e)}`));
    const vis = (id) => page.getByTestId(id).locator('visible=true');
    const has = async (id) => (await vis(id).count()) > 0;
    const tap = async (id, wait = 800) => { await vis(id).first().click(); await W(page, wait); };
    const path = () => new URL(page.url()).pathname;
    const overflow = () => page.evaluate(() => {
      const out = [];
      if (document.documentElement.scrollWidth > innerWidth + 1) out.push(`page scrolls sideways: ${document.documentElement.scrollWidth}px`);
      for (const el of document.querySelectorAll('div, span')) {
        if (!el.innerText || el.children.length) continue;
        const r = el.getBoundingClientRect();
        if (r.width && r.height && (el.scrollWidth > el.clientWidth + 2 || r.right > innerWidth + 1 || r.left < -1) && getComputedStyle(el).overflowX !== 'auto' && getComputedStyle(el).textOverflow !== 'ellipsis') out.push(el.innerText.slice(0, 50));
      }
      return out.slice(0, 8);
    });
    const shot = async (name, wait = 700) => {
      await W(page, wait);
      const file = `${String(++n).padStart(2, '0')}-${who}-${name}.png`;
      await page.screenshot({ path: fsPath(new URL(file, OUT)) });
      const ov = await overflow();
      log.shots.push({ file, label: `${who} · ${name}`, url: page.url().replace(B, ''), overflow: ov });
      console.log(lang, file, ov.length ? `OVERFLOW ${ov.join(' | ')}` : '');
    };
    /** The whole scroll of the current screen, as one tall image: the viewport grows by what the inner scroll hides. */
    const full = async (file) => {
      const extra = await page.evaluate(() => {
        const els = [...document.querySelectorAll('div')].filter((d) => d.scrollHeight > d.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(d).overflowY));
        const el = els.sort((a, b) => b.clientHeight - a.clientHeight)[0];
        return el ? el.scrollHeight - el.clientHeight : 0;
      });
      await page.setViewportSize({ width: 390, height: 844 + extra });
      await W(page, 1200);
      await page.screenshot({ path: fsPath(new URL(file, ROOT)) });
      await page.setViewportSize({ width: 390, height: 844 });
      await W(page, 600);
      console.log(lang, file, `full scroll, +${extra}px`);
    };
    const knowLoop = async (pattern) => {
      let hard = 0;
      for (let g = 0; g < 30 && path() === '/welcome/know'; g++) {
        if (await has('know-harder')) { await shot('know-offer'); await tap('know-harder', 900); continue; }
        if (await has('place-skip') || await has('place-continue')) return;
        const names = (await page.getByRole('radio').locator('visible=true').allInnerTexts()).map((x) => x.split('\n')[0].trim());
        const q = BANK.find((x) => x.o.every((o) => names.includes(o)));
        if (!q) { log.errors.push(`${who}: no bank match for ${names.join(' / ')}`); return; }
        const eyebrow = (await page.evaluate(() => document.body.innerText)).split('\n').find((l) => /\d+ (of|de) \d+/i.test(l)) || '';
        const harder = /^(harder|más difícil)/i.test(eyebrow.trim());
        const right = harder ? pattern[hard++] : true;
        if (g === 0) await shot('know-basic-q');
        if (harder && hard === 1) await shot('know-harder-q');
        await page.getByRole('radio', { name: right ? q.o[0] : q.o[1], exact: true }).locator('visible=true').first().click();
        if (g === 0) await shot('know-basic-answered', 250);
        await W(page, 900);
      }
    };
    try {
      await page.goto(`${B}/icon-192.png`);
      await page.evaluate((lang) => { localStorage.clear(); localStorage.setItem('ih:lang', JSON.stringify(lang)); }, lang);
      await page.goto(`${B}/welcome`); await W(page, 2500);
      await body({ page, shot, tap, has, path, full, knowLoop });
    } catch (e) {
      log.errors.push(`${who}: ${String(e.message || e).split('\n')[0]}`);
      await shot('error');
    }
    await context.close();
  };

  await run('islam', async ({ page, shot, tap, has, path, full, knowLoop }) => {
    await shot('splash');
    await tap('start-free', 1200);
    await shot('you-q1');
    await tap('stance-practice'); await shot('you-q2');
    await tap('raisedIn-ISLAM', 1200);
    await shot('heard');
    await tap('heardFrom-tiktok', 1200);
    await shot('door');
    await tap('door-continue', 1500);
    await shot('trail');
    await full(`welcome-trail-full-${lang}.png`);
    await tap('trail-continue', 1200);
    await shot('know-intro');
    await tap('know-start', 900);
    await knowLoop([true, false, true, false, true, false]); // 3 of 6
    await shot('know-result-short');
    await tap('place-skip-anyway', 1200);
    for (let g = 0; g < 12 && path() === '/welcome/belief'; g++) {
      if (g < 6) await shot(`belief-${g + 1}`);
      await page.locator('[role="radio"][data-testid]').locator('visible=true').first().click(); await W(page, 700);
    }
    await shot('fit');
    await tap('fit-continue', 1200);
    await shot('voice');
    await tap('lets-go', 600);
    await shot('ready', 200);
  });

  await run('hindu', async ({ tap, shot, knowLoop }) => {
    await tap('start-free', 1200);
    await tap('stance-practice'); await tap('raisedIn-HINDUISM', 1200);
    await tap('heardFrom-skip', 1200);
    await shot('door');
    await tap('door-continue', 1500);
    await shot('trail');
    await tap('trail-continue', 1200);
    await tap('know-start', 900);
    await knowLoop([true, true, true, true, true, true]);
    await shot('know-result-pass');
  });

  await run('own', async ({ page, tap, has, shot, path, full }) => {
    await tap('start-free', 1200);
    await tap('stance-curious'); await shot('you-q2');
    await tap('raisedIn-none', 1200);
    await tap('heardFrom-skip', 1200);
    await shot('door');
    await page.getByRole('radio', { name: lang === 'es' ? /mi propio camino/i : /my own path/i }).locator('visible=true').first().click(); await W(page, 500);
    await tap('door-continue', 1500);
    await shot('trail');
    await full(`welcome-trail-full-own-${lang}.png`);
    await tap('trail-continue', 1200);
    for (let g = 0; g < 14 && path() === '/welcome/intake'; g++) {
      const multi = await page.getByRole('checkbox').locator('visible=true').count();
      if (multi) {
        const boxes = page.getByRole('checkbox').locator('visible=true');
        await boxes.nth(0).click(); await W(page, 250); await boxes.nth(1).click(); await W(page, 250);
        await shot(`intake-${g + 1}-multi`);
        await page.getByRole('button', { name: lang === 'es' ? /así soy/i : /that's me/i }).locator('visible=true').first().click(); await W(page, 900);
      } else {
        await shot(`intake-${g + 1}`);
        await page.getByRole('radio').locator('visible=true').first().click(); await W(page, 900);
      }
    }
    await W(page, 800);
    await shot('suggest');
    if (await has('suggest-continue')) await tap('suggest-continue', 1200);
    await shot('voice');
  });

  writeFileSync(fsPath(new URL('walk.json', OUT)), JSON.stringify(log, null, 1));

  // the contact sheet: every shot, in walk order, labelled
  const files = readdirSync(fsPath(OUT)).filter((f) => /^\d\d-.*\.png$/.test(f)).sort();
  const imgs = files.map((f) => `<figure><img src="data:image/png;base64,${readFileSync(fsPath(new URL(f, OUT))).toString('base64')}"><figcaption>${f.replace(/\.png$/, '')}</figcaption></figure>`).join('');
  const sheet = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await sheet.setContent(`<style>body{margin:16px;background:#F7F7F5;font:12px Inter,system-ui,sans-serif;color:#0A0A0A}h1{font:800 22px system-ui;margin:0 0 12px}div{display:grid;grid-template-columns:repeat(8,1fr);gap:12px}figure{margin:0}img{width:100%;border:1px solid #E3E3DE;border-radius:10px;display:block}figcaption{margin-top:4px;color:#6b6b6b}</style><h1>onboarding · ${lang} · 390x844 · ${files.length} screens</h1><div>${imgs}</div>`);
  await sheet.waitForTimeout(800);
  await sheet.screenshot({ path: fsPath(new URL(`onboarding-sheet-${lang}.png`, ROOT)), fullPage: true });
  await sheet.close();
  console.log(lang, 'errors:', log.errors.length ? log.errors : 'none');
}
await browser.close();
