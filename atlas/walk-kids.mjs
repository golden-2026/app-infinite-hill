// Kids' track walk (2026-10-01): a grandparent's phone, at 390x844, English and Spanish. Two children are added at
// You → your table through the screen itself (test names only): Asha, 7, on the Hindu path, and Yusuf, 9, on the Islam
// path. Each plays three lessons in full, one per day (the clock moves a day between rounds): every story beat, the
// order game, the match or "in the story?" game, the word, the four-breath breath, the line, and the tally with the
// "for grown-ups" note. Every page's text is checked for grown-up lesson text.
// Run: node atlas/serve.mjs expo-dev-kids 5240 --spa, then node atlas/walk-kids.mjs [en|es]
// Shots: img-dev/kids/<lang>/. Log: img-dev/kids/<lang>/walk.json.
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { kidLesson } from '../packages/content/src/kids.js';
import * as S from '../apps/app/src/i18n/strings/kids.ts';

const B = process.env.BASE || 'http://127.0.0.1:5240';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TZ = 'America/New_York';
const DAY0 = '2026-10-05';
const W = (p, ms = 700) => p.waitForTimeout(ms);
const langs = process.argv[2] ? [process.argv[2]] : ['en', 'es'];
const at = (k) => { const d = new Date(`${DAY0}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return new Date(`${d.toISOString().slice(0, 10)}T10:00:00-04:00`); };
const ADULT = /follower count|mid-scroll|\b1 ?am\b|\b2 ?am\b|yoga class|together tab|community and events|comunidad y eventos|\bthe guide\b|\bla guía\b|reads ·|lee ·|lessons are still in english|en inglés/i;

const L = {
  en: { next: 'next', okayNext: 'okay, next', start: 'start', sitAs: (n) => `sit as ${n}`, add: (n) => `add ${n}`, plusAdd: '+ add a child', door: { HINDUISM: 'Hinduism', ISLAM: 'Islam' } },
  es: { next: 'siguiente', okayNext: 'bueno, siguiente', start: 'empezar', sitAs: (n) => `sesión como ${n}`, add: (n) => `agregar a ${n}`, plusAdd: '+ agregar a un niño o niña', door: { HINDUISM: 'hinduismo', ISLAM: 'islam' } },
};
const KIDS = [{ name: 'Asha', age: 7, door: 'HINDUISM' }, { name: 'Yusuf', age: 9, door: 'ISLAM' }];

const profile = (door) => ({ v: 1, door, knowledge: 40, commitment: 60, openness: 'stay', answers: { raised: 'yes', practice: 'weekly', hold: 'fully' }, bridges: {}, lastBridgeOn: null, setOn: '2026-06-01' });
const state = (door) => ({
  v: 1, deviceId: 'dev_walk0001', outbox: [], settingsVersion: 1, sits: [],
  settings: { onboarded: true, homeWing: door, active: 'home', analytics: 'no', voiceOn: false, unlocksSeen: ['guide', 'together'], book: [], signals: [], kids: [], reminder: { on: false, time: 'sundown' }, profile: profile(door) },
});

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
for (const lang of langs) {
  const T = L[lang];
  const D = lang === 'es' ? S.es : S.en;
  const OUT = new URL(`./img-dev/kids/${lang}/`, import.meta.url);
  mkdirSync(OUT, { recursive: true });
  const log = { lang, shots: [], lessons: [], errors: [], adultText: [], overflow: [] };
  const save = () => writeFileSync(new URL('walk.json', OUT), JSON.stringify(log, null, 1));
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: TZ });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', (e) => log.errors.push(String(e.message || e)));
  let n = 0;
  const shot = async (name, wait = 600) => {
    await W(page, wait);
    const file = `${String(++n).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: fileURLToPath(new URL(file, OUT)) });
    const text = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
    const side = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (ADULT.test(text)) log.adultText.push({ file, hit: text.match(ADULT)[0] });
    if (side > 1) log.overflow.push({ file, side });
    log.shots.push({ file, path: new URL(page.url()).pathname, text: text.slice(0, 400) });
    console.log(lang, file, side > 1 ? `SIDEWAYS ${side}` : '', ADULT.test(text) ? `ADULT TEXT: ${text.match(ADULT)[0]}` : '');
    save();
  };
  const btn = (name) => page.getByRole('button', { name, exact: true }).locator('visible=true');
  const visible = async (loc) => (await loc.count()) > 0;

  await page.clock.setFixedTime(at(0));
  await page.goto(`${B}/welcome?lang=${lang}`); await W(page, 1500);
  await page.evaluate(([s, lang]) => { localStorage.clear(); localStorage.setItem('ih:app:v1', JSON.stringify(s)); localStorage.setItem('ih:lang', JSON.stringify(lang)); localStorage.setItem('ih:analytics-asked', 'true'); }, [state('HINDUISM'), lang]);
  await page.goto(`${B}/you/table?lang=${lang}`); await W(page, 2500);
  await shot('table-empty');

  // add the two children through the screen, as a parent would
  for (const [k, kid] of KIDS.entries()) {
    if (k > 0) { await page.getByText(T.plusAdd, { exact: true }).click(); await W(page, 500); }
    await page.getByRole('textbox').first().fill(kid.name);
    await page.getByRole('radio', { name: String(kid.age), exact: true }).click();
    await page.getByRole('radio', { name: T.door[kid.door], exact: true }).click();
    await shot(`add-${kid.name.toLowerCase()}`, 300);
    await btn(T.add(kid.name)).click(); await W(page, 900);
  }
  await shot('table-two-kids');

  async function play(kid, round) {
    const lesson = kidLesson(kid.door, round + 1);
    const c = lesson[lang];
    const rec = { kid: kid.name, door: kid.door, day: round + 1, key: lesson.key, title: c.title, played: [] };
    log.lessons.push(rec);
    const tag = `${kid.name.toLowerCase()}-d${round + 1}`;
    await btn(T.sitAs(kid.name)).click(); await W(page, 2200);
    const shotAt = new Set();
    const once = async (what, wait) => { if (!shotAt.has(what)) { shotAt.add(what); await shot(`${tag}-${what}`, wait); } };
    for (let guard = 0; guard < 80; guard++) {
      if (await visible(page.getByTestId('finish').locator('visible=true'))) {
        const g = page.getByTestId('kid-grownups').locator('visible=true');
        rec.grownups = (await visible(g)) ? (await g.first().innerText()).replace(/\s+/g, ' ') : null;
        await shot(`${tag}-tally`, 1500);
        if (await visible(g)) { await g.first().scrollIntoViewIfNeeded(); await shot(`${tag}-grownups`, 300); }
        await page.getByTestId('finish').locator('visible=true').first().click(); await W(page, 1500);
        rec.played.push('tally');
        if (await visible(page.getByTestId('kid-back').locator('visible=true'))) {
          await shot(`${tag}-streak`, 800);
          await page.getByTestId('kid-back').locator('visible=true').first().click(); await W(page, 1200);
        }
        break;
      }
      // the order game: tap the story's pictures in order
      if (await visible(btn(c.story[0].head)) && await visible(btn(c.story[3].head))) {
        await once('order', 300);
        for (const b of c.story) { await btn(b.head).first().click(); await W(page, 250); }
        await once('order-done', 500);
        rec.played.push('order');
        await btn(T.next).first().click(); await W(page, 700);
        continue;
      }
      // match: tap a left, then its right
      if (lesson.game === 'match' && await visible(btn(c.game.pairs[0][0]))) {
        await once('match', 300);
        for (const [l, r] of c.game.pairs) { await btn(l).first().click(); await W(page, 200); await btn(r).last().click(); await W(page, 300); }
        await once('match-done', 500);
        rec.played.push('match');
        await btn(T.next).first().click(); await W(page, 700);
        continue;
      }
      // "in the story?": answer each one
      if (lesson.game === 'truth' && await visible(btn(`${D['kids.truth.yes']}: ${c.game.items[0][0]}`))) {
        await once('truth', 300);
        for (const [claim, v] of c.game.items) { await btn(`${v ? D['kids.truth.yes'] : D['kids.truth.no']}: ${claim}`).first().click(); await W(page, 300); }
        await once('truth-done', 500);
        rec.played.push('truth');
        await btn(T.next).first().click(); await W(page, 700);
        continue;
      }
      // the breath: four slow breaths, sat through
      if (await visible(btn(T.start))) {
        await once('breath', 300);
        await btn(T.start).first().click();
        await W(page, 20000); await once('breath-mid', 0);
        await W(page, 15000);
        rec.played.push('breath');
        continue;
      }
      if (await visible(page.getByTestId('next').locator('visible=true'))) {
        const said = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
        const beat = c.story.findIndex((b) => said.includes(b.text.slice(0, 40)));
        if (beat === 0) await once('story-1', 400);
        else if (beat === 3) await once('story-4', 400);
        else if (said.includes(c.means.slice(0, 20))) await once('word', 400);
        else if (said.includes(c.breath.slice(0, 30))) await once('breath-intro', 400);
        else if (said.includes(c.carry.slice(0, 20))) await once('line', 400);
        rec.played.push(beat >= 0 ? `story ${beat + 1}` : 'beat');
        await page.getByTestId('next').locator('visible=true').first().click(); await W(page, 500);
        continue;
      }
      if (guard === 0) await once('bell', 0);
      await W(page, 700);
    }
    rec.done = rec.played.includes('tally');
    console.log(lang, tag, rec.done ? 'played:' : 'STUCK:', rec.played.join(', '));
    save();
  }

  for (let round = 0; round < 3; round++) {
    if (round > 0) { await page.clock.setFixedTime(at(round)); await page.goto(`${B}/you/table?lang=${lang}`); await W(page, 2500); await shot(`table-day${round + 1}`); }
    for (const kid of KIDS) {
      if (!new URL(page.url()).pathname.endsWith('/you/table')) { await page.goto(`${B}/you/table?lang=${lang}`); await W(page, 2000); }
      await play(kid, round);
    }
  }
  await page.goto(`${B}/you/table?lang=${lang}`); await W(page, 2000);
  await shot('table-after');
  // a child's days stay off the grown-up's own path
  log.state = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('ih:app:v1')); return { sits: s.sits.map((x) => ({ door: x.door, day: x.day, date: x.date, kid: !!x.kidId })) }; });
  save();
  await context.close();
}
await browser.close();
