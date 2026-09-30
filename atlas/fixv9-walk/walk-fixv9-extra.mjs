// Fix v9 re-walk, the findings the walk9 helpers don't reach: the Guide on "today's word", the lantern answering a
// friend (Maya) all the way to the send sheet, the whole-climb year promises, and the site's sheet icons.
// Test data only. Run with BASE=http://127.0.0.1:5184 node walk-fixv9-extra.mjs
import { B, W, lane, open, seed, calm, click, into, text } from './_w9.mjs';

const { log, save, shot } = lane('extra');
const TODAY = '2026-10-07';
let n = 0;
const sit = (date, door = 'HINDUISM') => ({ id: `sit_xtra${String(++n).padStart(6, '0')}`, door, day: n, date, tz: 'America/New_York', kidId: null, deviceId: 'dev_xtra0001', at: `${date}T14:00:00.000Z` });
const state = (sits, settings = {}) => ({ v: 1, deviceId: 'dev_xtra0001', sits, outbox: [], settingsVersion: 1, settings: { onboarded: true, homeWing: 'HINDUISM', active: 'home', analytics: 'no', unlocksSeen: ['guide', 'together'], ...settings } });

// the Guide, before today's lesson (day 5), then on an outline day (day 40)
for (const [k, days] of [['day5', 4], ['day40', 39]]) {
  n = 0;
  const o = await open({ clock: `${TODAY}T10:00:00-04:00` });
  await seed(o.page, state(Array.from({ length: days }, (_, i) => sit(`2026-${String(8 + Math.floor(i / 28)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`))), calm(TODAY));
  await o.page.goto(B + '/guide'); await W(o.page, 3000);
  const box = o.page.locator('input[type=text], textarea, input:not([type])').locator('visible=true').first();
  await box.fill("what does today's word mean?"); await box.press('Enter'); await W(o.page, 2500);
  await shot(o, `guide-todays-word-${k}`, 500);
  const t = await text(o.page);
  log[`_guide-${k}`] = t.slice(t.indexOf("what does today's word mean?"), t.indexOf("what does today's word mean?") + 500);
  await o.close();
}

// the lantern, answering Maya, with today's three already done
{
  const o = await open({ clock: `${TODAY}T10:00:00-04:00` });
  const lit = { glow: { date: TODAY, best: 3, clean: true }, book: [{ line: 'the light in me sees the light in you', door: 'HINDUISM', date: TODAY }], runs: [{ date: TODAY, door: 'HINDUISM', day: 5, acc: 1, level: 1 }] };
  await seed(o.page, state([sit('2026-10-05'), sit('2026-10-06'), sit(TODAY)], lit), calm(TODAY));
  await o.page.goto(B + '/lantern?to=Maya'); await W(o.page, 2500);
  await shot(o, 'lantern-to-maya-before-lighting', 500);
  log._lanternBefore = (await text(o.page)).slice(0, 300);
  await o.page.getByRole('button', { name: /light your lantern/ }).first().click(); await W(o.page, 2000);
  await shot(o, 'lantern-to-maya-lit', 500);
  await into(o.page, 'send-lantern');
  log._sendButton = await o.page.getByTestId('send-lantern').locator('visible=true').first().innerText();
  await click(o.page, 'send-lantern', 1500);
  await shot(o, 'lantern-to-maya-send-sheet', 500);
  log._sheet = (await text(o.page)).match(/light one for[^\n]*\n[^\n]*/)?.[0];
  await o.close();
}

// the whole climb: years two to five as promises
for (const door of ['CHRISTIANITY', 'ISLAM', 'SPIRITUAL']) {
  const o = await open({ clock: `${TODAY}T10:00:00-04:00` });
  await seed(o.page, state([sit(TODAY, door)], { homeWing: door }), calm(TODAY));
  await o.page.goto(B + `/trail?door=${door}`); await W(o.page, 3000);
  const t = await text(o.page);
  log[`_trail-${door}`] = (t.match(/YEAR [2-5][\s\S]{0,260}/gi) || []).map((x) => x.replace(/\s+/g, ' ').slice(0, 260));
  const y = o.page.getByText(/^year 3 · 365 days$/i).locator('visible=true').first();
  if (await y.count()) { await y.scrollIntoViewIfNeeded(); await W(o.page, 600); }
  await shot(o, `trail-${door.toLowerCase()}-years`, 600);
  await o.close();
}

// the site's sheet icons: every 40px row icon the same size
{
  const o = await open();
  await o.page.goto(B + '/'); await W(o.page, 2500);
  for (const k of ['science', 'schools']) {
    await o.page.evaluate((k) => pageOpen(k), k); await W(o.page, 1000);
    log[`_icons-${k}`] = await o.page.evaluate(() => [...document.querySelectorAll('#gpage-body svg[width="40"]')].map((s) => Math.round(s.getBoundingClientRect().width)));
    const first = o.page.locator('#gpage-body svg[width="40"]').first();
    if (await first.count()) { await first.scrollIntoViewIfNeeded(); await W(o.page, 500); }
    await shot(o, `site-${k}-icons`, 400);
    await o.page.evaluate(() => pageClose()); await W(o.page, 500);
  }
  await o.close();
}
save();
console.log(JSON.stringify(Object.fromEntries(Object.entries(log).filter(([k]) => k.startsWith('_'))), null, 1));
