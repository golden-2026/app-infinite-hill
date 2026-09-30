// Atlas v9, lane "arrive": the new "learning my partner's or family's faith" answer, the partner door screen, and the
// "try the practices, or just learn?" question, then the first lesson with no breath or sit. Frozen 5182 build.
// Run: node walk9-arrive.mjs [partner,practice]
import { B, W, lane, open, click, has, text } from './_w9.mjs';

const { log, save, shot } = lane('arrive');
const only = process.argv[2] ? process.argv[2].split(',') : ['partner', 'practice'];
const fresh = async () => { const o = await open(); await o.page.goto(B + '/welcome'); await W(o.page, 2500); await o.page.evaluate(() => localStorage.clear()); await o.page.goto(B + '/welcome'); await W(o.page, 2500); return o; };
const ids = (p) => p.evaluate(() => [...document.querySelectorAll('[data-testid]')].filter((e) => e.offsetParent).map((e) => e.dataset.testid));

if (only.includes('partner')) {
  const o = await fresh(); const p = o.page;
  await click(p, 'start-free', 1400);
  await shot(o, 'v9-01-first-question-partner-option', 600);
  log._q1ids = await ids(p);
  await click(p, 'stance-partner', 1200);
  await shot(o, 'v9-02-partner-which-faith', 600);
  log._q2ids = await ids(p);
  await click(p, 'learning-JUDAISM', 1500);
  await shot(o, 'fix-heard-from-question', 600);
  log._heardIds = await ids(p);
  await click(p, 'heardFrom-friend', 1500);
  log._heardSaved = await p.evaluate(() => JSON.parse(localStorage.getItem('ih:app:v1') || '{}').settings?.profile?.answers?.heardFrom);
  await shot(o, 'v9-03-partner-door-screen', 800);
  log._partnerDoorChecked = await p.evaluate(() => [...document.querySelectorAll('[role=radio]')].filter((e) => e.offsetParent).map((e) => [e.getAttribute('aria-label') || e.innerText.slice(0, 30), e.getAttribute('aria-checked')]));
  log._partnerContinue = await p.getByTestId('door-continue').locator('visible=true').first().innerText();
  await p.evaluate(() => { const els = [...document.querySelectorAll('div')].filter((d) => d.scrollHeight > d.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(d).overflowY)); const s = els.sort((a, b) => b.clientHeight - a.clientHeight)[0]; if (s) s.scrollBy(0, 700); else scrollBy(0, 700); });
  await shot(o, 'v9-04-partner-door-screen-lower', 800);
  const jr = p.getByRole('radio', { name: /Judaism/ }).locator('visible=true').first();
  log._jrChecked = await jr.getAttribute('aria-checked').catch(() => null); // not tapped: it should already be chosen
  await W(p, 500);
  await click(p, 'door-continue', 1400);
  await shot(o, 'v9-05-partner-whole-climb', 600);
  await click(p, 'trail-continue', 1200);
  await shot(o, 'v9-06-partner-knowledge-check', 600);
  await p.getByText(/skip this ›/).locator('visible=true').first().click(); await W(p, 1200);
  await shot(o, 'v9-07-partner-first-belief-question', 600);
  log._partnerQs = [];
  for (let i = 0; i < 8; i++) {
    const t = await text(p);
    if (/try the practices, or just learn/i.test(t)) break;
    const opts = (await ids(p)).filter((x) => /^[a-z]+(-[A-Za-z]+)+$/.test(x) && !/continue|back|start/.test(x));
    log._partnerQs.push({ q: t.slice(0, 200), opts });
    if (!opts.length) break;
    await click(p, opts[0], 1000);
    await shot(o, `v9-08-partner-question-${i + 2}`, 500);
  }
  await shot(o, 'v9-09-practices-or-just-learn', 600);
  await click(p, 'practiceMode-learn', 1400);
  log._saved = await p.evaluate(() => JSON.parse(localStorage.getItem('ih:app:v1') || '{}').settings?.profile?.answers);
  await shot(o, 'v9-10-partner-fit', 800);
  save(); await o.close();
}

if (only.includes('practice')) {
  // a practising Hindu: the same question, answered "try them"
  const o = await fresh(); const p = o.page;
  await click(p, 'start-free', 1400);
  await click(p, 'stance-practice', 1000); await click(p, 'raisedIn-HINDUISM', 1400);
  await click(p, 'heardFrom-skip', 1400);
  log._heardSkip = await p.evaluate(() => JSON.parse(localStorage.getItem('ih:app:v1') || '{}').settings?.profile?.answers?.heardFrom);
  await shot(o, 'v9-11-practising-door-screen', 600);
  const hr = p.getByRole('radio', { name: /Hinduism/ }).locator('visible=true').first();
  log._hrChecked = await hr.getAttribute('aria-checked').catch(() => null);
  log._practiceContinue = await p.getByTestId('door-continue').locator('visible=true').first().innerText();
  await W(p, 500);
  await click(p, 'door-continue', 1400); await click(p, 'trail-continue', 1200);
  await p.getByText(/skip this ›/).locator('visible=true').first().click(); await W(p, 1200);
  for (let i = 0; i < 8; i++) {
    const t = await text(p);
    if (/try the practices, or just learn/i.test(t)) break;
    const opts = (await ids(p)).filter((x) => /^[a-z]+(-[A-Za-z]+)+$/.test(x) && !/continue|back|start/.test(x));
    if (!opts.length) break;
    await click(p, opts[0], 1000);
  }
  await shot(o, 'v9-12-practising-practices-question', 600);
  await click(p, 'practiceMode-try', 1400).catch(async () => { const x = (await ids(p)).find((i) => i.startsWith('practiceMode-') && !i.endsWith('learn')); if (x) await click(p, x, 1400); });
  await shot(o, 'v9-13-practising-fit', 800);
  save(); await o.close();
}
save();
console.log(JSON.stringify({ heard: log._heardIds, heardSaved: log._heardSaved, heardSkip: log._heardSkip, pdc: log._partnerDoorChecked, pc: log._partnerContinue, jr: log._jrChecked, hr: log._hrChecked, prc: log._practiceContinue, q1: log._q1ids, q2: log._q2ids, qs: log._partnerQs, saved: log._saved }, null, 1).slice(0, 3000));
