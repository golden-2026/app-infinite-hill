// Shared bits for the v9 walkers (walk9-*.mjs): a phone-sized Chrome with motion on, the clock fixed when asked,
// seeded progress (test values only), and shots into img9/<lane>/ with the page text kept in data9/<lane>-raw9.json.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const B = process.env.BASE || 'http://127.0.0.1:5182';
const here = dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
export const W = (p, ms = 700) => p.waitForTimeout(ms);
export const addDays = (date, k) => { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };

export function lane(name) {
  const log = {};
  const save = () => writeFileSync(join(here, '..', 'img-dev', 'fixv9', `${name}-raw.json`), JSON.stringify(log, null, 1));
  async function shot(o, slug, wait = 1500, { fullPage = false } = {}) {
    await W(o.page, wait);
    const png = join(here, '..', 'img-dev', 'fixv9', name, `${slug}.png`);
    mkdirSync(dirname(png), { recursive: true });
    await o.page.screenshot({ path: png, fullPage });
    await o.page.screenshot({ path: png.replace(/\.png$/, '-t.jpg'), type: 'jpeg', quality: 70, scale: 'css' });
    log[slug] = { url: o.page.url().replace(B, ''), errors: o.errors.slice(), text: (await o.page.evaluate(() => document.body.innerText)).slice(0, 1500) };
    console.log('shot', slug, log[slug].url);
    save();
  }
  return { log, save, shot };
}

export async function open({ clock = null, tz = 'America/New_York', width = 390, height = 844, browser = null, share = false } = {}) {
  const own = !browser;
  browser = browser || await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: tz, reducedMotion: 'no-preference', permissions: ['clipboard-read', 'clipboard-write'] });
  if (!share) await context.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'share', { value: undefined, configurable: true }); } catch {} });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  if (clock) await page.clock.setFixedTime(new Date(clock));
  return { browser, context, page, errors, close: () => (own ? browser.close() : context.close()) };
}

export const calm = (date) => ({ v: 1, facts: [], seeded: false, moods: [{ date, mood: 'good' }], journal: [], done: [], reflected: [], helpClosedOn: null });
export async function seed(page, state, memory) {
  await page.goto(B + '/welcome'); await W(page, 1200);
  await page.evaluate(([s, m]) => { localStorage.clear(); localStorage.setItem('ih:app:v1', JSON.stringify(s)); if (m) localStorage.setItem('ih:companion', JSON.stringify(m)); }, [state, memory || null]);
}
export const click = async (page, id, wait = 900) => { await page.getByTestId(id).locator('visible=true').first().click({ timeout: 8000 }); await W(page, wait); };
export const has = async (page, id) => (await page.getByTestId(id).locator('visible=true').count()) > 0;
export const into = async (page, id, extra = 0) => {
  const el = page.getByTestId(id).locator('visible=true').first();
  if (!(await el.count())) return false;
  await el.scrollIntoViewIfNeeded(); await W(page, 400);
  if (extra) await page.evaluate((dy) => { const els = [...document.querySelectorAll('div')].filter((d) => d.scrollHeight > d.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(d).overflowY)); const s = els.sort((a, b) => b.clientHeight - a.clientHeight)[0]; if (s) s.scrollBy(0, dy); }, extra);
  await W(page, 400);
  return true;
};
export const toTop = (page) => page.evaluate(() => { scrollTo(0, 0); document.querySelectorAll('div').forEach((d) => { if (d.scrollTop) d.scrollTop = 0; }); });
export const text = (page) => page.evaluate(() => document.body.innerText);
