// Atlas v9, lane "site": the first paint (no old header flashing), the phone mockups in "what a day looks like",
// the rest-days copy (FAQ and pricing), the sticky close on pop-up pages, and no "draft" labels. Frozen 5182 build.
// Run: node walk9-site.mjs
import { B, W, lane, open } from './_w9.mjs';

const { log, save, shot } = lane('site');
const scrollTo = (page, sel, dy = -80) => page.evaluate(([sel, dy]) => { const e = typeof sel === 'string' && sel.startsWith('text=') ? [...document.querySelectorAll('*')].find((x) => x.children.length === 0 && x.textContent.trim() === sel.slice(5)) : document.querySelector(sel); if (!e) return false; window.scrollTo({ top: e.getBoundingClientRect().top + scrollY + dy, behavior: 'instant' }); return true; }, [sel, dy]);

// 1 · first paint on a phone: shots as the page arrives, then settled
{
  const o = await open();
  await o.page.goto(B + '/', { waitUntil: 'commit' });
  await o.page.waitForTimeout(120);
  await o.page.screenshot({ path: 'img9/site/v9-01-first-paint-120ms.png' });
  await o.page.screenshot({ path: 'img9/site/v9-01-first-paint-120ms-t.jpg', type: 'jpeg', quality: 70, scale: 'css' });
  log['v9-01-first-paint-120ms'] = { url: '/', text: (await o.page.evaluate(() => document.body ? document.body.innerText.slice(0, 300) : '')) };
  await o.page.waitForTimeout(300);
  await shot(o, 'v9-02-first-paint-450ms', 0);
  await o.page.waitForLoadState('networkidle'); await W(o.page, 800);
  await shot(o, 'v9-03-phone-hero-settled', 400);
  log._draftCount = await o.page.evaluate(() => (document.documentElement.innerHTML.match(/draft/gi) || []).length);
  log._oldHeader = await o.page.evaluate(() => [...document.querySelectorAll('header')].map((h) => h.className));
  // 2 · the phone mockups
  let k = 4;
  for (const eb of ['00 · Your voice', '01 · The lesson', '02 · The voices', '03 · Together']) {
    const ok = await scrollTo(o.page, `text=${eb}`, -470);
    if (!ok) { log['_missing-' + eb] = true; continue; }
    await W(o.page, 1200);
    await shot(o, `v9-${String(k++).padStart(2, '0')}-phone-mockup-${eb.slice(0, 2)}`, 300);
  }
  // 3 · the looping phone demo
  if (await scrollTo(o.page, '#playdemo', 0)) { await W(o.page, 2500); await shot(o, 'v9-08-phone-play-demo', 0); await W(o.page, 3000); await shot(o, 'v9-09-phone-play-demo-later', 0); }
  // 4 · rest-days copy: pricing and the FAQ
  if (await scrollTo(o.page, '#plans', 0)) { await W(o.page, 1000); const li = o.page.getByText(/rest days protect your streak/i).first(); if (await li.count()) { await li.scrollIntoViewIfNeeded(); await o.page.evaluate(() => scrollBy(0, 200)); } await shot(o, 'v9-10-pricing-rest-days', 600); }
  const q = o.page.locator('summary', { hasText: /miss a day/i }).first();
  if (await q.count()) { await q.scrollIntoViewIfNeeded(); await q.click(); await o.page.evaluate(() => scrollBy(0, 150)); await shot(o, 'v9-11-faq-miss-a-day', 800); log._faqMiss = await q.evaluate((e) => e.parentElement.innerText); }
  log._restMentions = await o.page.evaluate(() => (document.body.innerText.match(/[^.]*rest day[^.]*\./gi) || []).slice(0, 8));
  log._minutes = await o.page.evaluate(() => (document.body.innerText.match(/[^.\n]*\b(\d+|three|five) min(ute)?s?\b[^.\n]*/gi) || []).slice(0, 12));
  // 5 · a pop-up page: the close button stays while you scroll
  await o.page.goto(B + '/#p/about', { waitUntil: 'networkidle' }); await W(o.page, 1200);
  await shot(o, 'v9-12-popup-about-top', 300);
  await o.page.evaluate(() => { const s = document.querySelector('#gpage .sheet'); if (s) s.scrollTop = s.scrollHeight / 2; }); await W(o.page, 700);
  await shot(o, 'v9-13-popup-about-scrolled-close-stays', 300);
  log._closeBox = await o.page.evaluate(() => { const c = [...document.querySelectorAll('#gpage button, #gpage .x, #gpage [aria-label]')].filter((e) => /close|×|✕/i.test(e.getAttribute('aria-label') || e.textContent)).map((e) => { const b = e.getBoundingClientRect(); return { label: e.getAttribute('aria-label') || e.textContent.trim(), top: Math.round(b.top), vis: b.top >= 0 && b.top < innerHeight }; }); return c; });
  await o.page.goto(B + '/#p/privacy', { waitUntil: 'networkidle' }); await W(o.page, 1200);
  await o.page.evaluate(() => { const s = document.querySelector('#gpage .sheet'); if (s) s.scrollTop = s.scrollHeight * 0.6; }); await W(o.page, 700);
  await shot(o, 'v9-14-popup-privacy-scrolled', 300);
  log._errors = o.errors;
  await o.close();
}
// 6 · a computer: first paint and the mockups
{
  const o = await open({ width: 1440, height: 900 });
  await o.context.close();
  const { chromium } = await import('playwright-core');
  const ctx = await o.browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  const page = await ctx.newPage(); const d = { page, errors: [] };
  await page.goto(B + '/', { waitUntil: 'commit' }); await page.waitForTimeout(150);
  await shot(d, 'v9-15-desktop-first-paint-150ms', 0);
  await page.waitForLoadState('networkidle'); await W(page, 800);
  await shot(d, 'v9-16-desktop-hero', 300);
  if (await scrollTo(page, '#what', 0)) { await W(page, 1500); await shot(d, 'v9-17-desktop-what-a-day', 300); await page.evaluate(() => scrollBy(0, 800)); await W(page, 1200); await shot(d, 'v9-18-desktop-what-a-day-2', 300); await page.evaluate(() => scrollBy(0, 800)); await W(page, 1200); await shot(d, 'v9-19-desktop-what-a-day-3', 300); }
  await page.goto(B + '/#p/about', { waitUntil: 'networkidle' }); await W(page, 1000);
  await page.evaluate(() => { const s = document.querySelector('#gpage .sheet'); if (s) s.scrollTop = s.scrollHeight / 2; }); await W(page, 600);
  await shot(d, 'v9-20-desktop-popup-scrolled', 300);
  await o.browser.close();
}
save();
console.log(JSON.stringify({ draft: log._draftCount, header: log._oldHeader, close: log._closeBox, faq: log._faqMiss, rest: log._restMentions, min: log._minutes, errors: log._errors }, null, 1));
