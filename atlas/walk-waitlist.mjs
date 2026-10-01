// Invite-only launch walk (2026-10-01), 390x844, English and Spanish, against the real local server (api/waitlist.js,
// in memory). Test values only (example.com addresses).
//   ON:  site form → real place → share link → a friend joins with it → the first moves up → the owner releases invites
//        → the invited person comes in with the code → as a member they see 3 invites → a friend comes in on one,
//        showing a nickname → the member sees it. The app's own waitlist screen for a new person.
//   OFF: the site's "Start free" and the app's welcome are unchanged; no invites card.
// Run (two terminals):
//   $env:INVITE_ONLY="on"; $env:WAITLIST_ADMIN_KEY="walk-admin-key-0123456789"; node atlas/friends-server.mjs expo-dev-waitlist 5201
//   node atlas/friends-server.mjs expo-dev-waitlist 5202          (a terminal where INVITE_ONLY is not set)
//   node atlas/walk-waitlist.mjs [en|es]
// Shots and checks: img-dev/waitlist/<lang>/ (walk.json holds the checks, page errors and sideways overflow).
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync } from 'node:fs';

const ON = process.env.ON_BASE || 'http://127.0.0.1:5201';
const OFF = process.env.OFF_BASE || 'http://127.0.0.1:5202';
const ADMIN = process.env.WAITLIST_ADMIN_KEY || 'walk-admin-key-0123456789';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const TZ = 'America/New_York';
const TODAY = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const W = (p, ms = 700) => p.waitForTimeout(ms);
const langs = process.argv[2] ? [process.argv[2]] : ['en', 'es'];
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
let ipN = 0;
const nextIp = () => `10.42.${Math.floor(++ipN / 250)}.${ipN % 250}`;

const onboarded = (door) => ({
  v: 1, deviceId: 'dev_wait00001', outbox: [], settingsVersion: 1, sits: [], missed: [],
  settings: { onboarded: true, homeWing: door, active: 'home', analytics: 'no', voiceOn: false, unlocksSeen: ['guide', 'together'], book: [], signals: [], kids: [], reminder: { on: false, time: 'sundown' }, pulse: false },
});

async function api(base, kind, { body, auth, ip } = {}) {
  const res = await fetch(`${base}/api/waitlist?kind=${kind}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(auth ? { authorization: auth } : {}), 'x-real-ip': ip || nextIp() },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

for (const lang of langs) {
  const es = lang === 'es';
  const SITE = es ? 'site-es.html' : 'site.html';
  const OUT = new URL(`./img-dev/waitlist/${lang}/`, import.meta.url);
  mkdirSync(OUT, { recursive: true });
  const log = { today: TODAY, lang, checks: {}, shots: [], errors: {}, overflow: {} };
  const save = () => writeFileSync(new URL('walk.json', OUT), JSON.stringify(log, null, 1));
  let shotN = 0;
  const overflow = (page) => page.evaluate(() => (document.documentElement.scrollWidth > innerWidth + 1 ? [`page scrolls sideways: ${document.documentElement.scrollWidth}px`] : []));
  async function shot(page, name) {
    await W(page, 600);
    const file = `${String(++shotN).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: new URL(file, OUT).pathname.replace(/^\/([A-Z]:)/, '$1'), animations: 'disabled' });
    log.shots.push(file);
    const o = await overflow(page);
    if (o.length) log.overflow[file] = o;
  }
  async function person(who, seed = null) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, timezoneId: TZ, reducedMotion: 'reduce', extraHTTPHeaders: { 'x-real-ip': nextIp() } });
    await context.addInitScript(() => { try { Object.defineProperty(Navigator.prototype, 'share', { value: undefined, configurable: true }); } catch {} });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message || e)));
    log.errors[who] = errors;
    for (const base of [ON, OFF]) {
      await page.goto(`${base}/favicon.ico`);
      await page.evaluate(([s, lang]) => { localStorage.clear(); if (s) localStorage.setItem('ih:app:v1', JSON.stringify(s)); localStorage.setItem('ih:lang', JSON.stringify(lang)); localStorage.setItem('ih:es-lesson-note', 'true'); }, [seed, lang]);
    }
    return { page, context };
  }
  const cta = (page) => page.locator('a.btn[href^="/welcome"]:visible').first();

  // ---------------- ON ----------------
  // five people already in the Islam line before Ana (joined straight through the API, each from its own address)
  for (let i = 0; i < 5; i++) await api(ON, 'join', { body: { email: `early${i}.${lang}@example.com`, door: 'ISLAM' } });

  const ana = await person('ana');
  await ana.page.goto(`${ON}/${SITE}`);
  await W(ana.page, 2500);
  log.checks.onCtaText = (await cta(ana.page).innerText()).trim();
  await shot(ana.page, 'on-site-cta');
  await cta(ana.page).click();
  await ana.page.waitForSelector('#wlform');
  await shot(ana.page, 'on-site-form');
  await ana.page.fill('#wle', `ana.${lang}@example.com`);
  await ana.page.selectOption('#wld', 'ISLAM');
  await ana.page.fill('#wln', 'Ana');
  await ana.page.click('#wlgo');
  await ana.page.waitForSelector('#wllink');
  log.checks.anaFirst = await ana.page.locator('#wlh').innerText();
  const anaLink = await ana.page.locator('#wllink').inputValue();
  log.checks.anaLink = anaLink;
  await shot(ana.page, 'on-site-position');

  // a friend opens Ana's link: the form opens on its own, saying a friend sent it
  const bea = await person('bea');
  await bea.page.goto(anaLink);
  await bea.page.waitForSelector('#wlform');
  log.checks.refNote = await bea.page.locator('.wl-p').first().innerText();
  await shot(bea.page, 'on-friend-link');
  await bea.page.fill('#wle', `bea.${lang}@example.com`);
  await bea.page.selectOption('#wld', 'ISLAM');
  await bea.page.click('#wlgo');
  await bea.page.waitForSelector('#wllink');
  log.checks.beaPosition = await bea.page.locator('#wlh').innerText();
  await shot(bea.page, 'on-friend-position');

  // Ana comes back: she moved up
  await ana.page.goto(`${ON}/${SITE}`);
  await W(ana.page, 2000);
  await cta(ana.page).click();
  await ana.page.waitForSelector('#wllink');
  log.checks.anaAfterFriend = await ana.page.locator('#wlh').innerText();
  log.checks.anaRefs = await ana.page.locator('#wlrefs').innerText();
  await shot(ana.page, 'on-site-moved-up');

  // the owner releases 1 invite for the Islam door (the admin desk does the same call)
  const rel = await api(ON, 'admin-release', { body: { n: 1, door: 'ISLAM', lang }, auth: `Bearer ${ADMIN}` });
  log.checks.released = rel.json ? { released: rel.json.released, to: rel.json.invited.map((x) => x.email), delivery: rel.json.delivery } : rel.status;

  // Ana reopens the page: her door is open; "come in" takes her into the app with her code
  await ana.page.goto(`${ON}/${SITE}`);
  await W(ana.page, 2000);
  await cta(ana.page).click();
  await ana.page.waitForSelector('#wlin');
  await shot(ana.page, 'on-site-invited');
  await ana.page.click('#wlin');
  await ana.page.waitForSelector('[data-testid="redeem"]');
  await W(ana.page, 1500);
  await shot(ana.page, 'on-app-invite');
  await ana.page.click('[data-testid="redeem"]');
  await ana.page.waitForURL(/\/welcome\/you/);
  await W(ana.page, 1200);
  log.checks.anaAfterRedeem = new URL(ana.page.url()).pathname;
  await shot(ana.page, 'on-app-onboarding-after-code');
  // (onboarding itself is unchanged; skip ahead to a finished one, keeping her member identity)
  await ana.page.evaluate((s) => localStorage.setItem('ih:app:v1', JSON.stringify(s)), onboarded('ISLAM'));
  await ana.page.goto(`${ON}/you`);
  await ana.page.waitForSelector('[data-testid="invites-card"]');
  await W(ana.page, 1500);
  await ana.page.locator('[data-testid="invites-card"]').scrollIntoViewIfNeeded();
  log.checks.anaInvites = await ana.page.locator('[data-testid="invites-card"]').innerText();
  await shot(ana.page, 'on-app-member-invites');

  // a friend comes in on one of Ana's links and chooses to show a nickname
  const inv = await api(ON, 'invites', { auth: `Member ${await ana.page.evaluate(() => { const s = JSON.parse(localStorage.getItem('ih:invite')); return `${s.member.memberId}:${s.member.token}`; })}` });
  const cami = await person('cami');
  await cami.page.goto(inv.json.invites[0].link.replace(/^https?:\/\/[^/]+/, ON));
  await cami.page.waitForSelector('[data-testid="show-nick"]');
  await cami.page.click('[data-testid="show-nick"]');
  await cami.page.fill('[data-testid="invite-nick"]', 'cami');
  await shot(cami.page, 'on-app-friend-code-nick');
  await cami.page.click('[data-testid="redeem"]');
  await cami.page.waitForURL(/\/welcome\/you/);
  await ana.page.reload();
  await ana.page.waitForSelector('[data-testid="invite-row"]');
  await W(ana.page, 1500);
  await ana.page.locator('[data-testid="invites-card"]').scrollIntoViewIfNeeded();
  log.checks.anaInvitesAfter = await ana.page.locator('[data-testid="invites-card"]').innerText();
  await shot(ana.page, 'on-app-member-sees-nick');

  // the app's own waitlist screen, for a new person who came to the app first
  const dev = await person('dev');
  await dev.page.goto(`${ON}/`);
  await dev.page.waitForURL(/\/waitlist/, { timeout: 15000 });
  await W(dev.page, 1500);
  log.checks.appGate = new URL(dev.page.url()).pathname;
  await shot(dev.page, 'on-app-waitlist-form');
  await dev.page.fill('[data-testid="waitlist-email"]', `dev.${lang}@example.com`);
  await dev.page.click('[data-testid="waitlist-door-HINDUISM"]');
  await dev.page.click('[data-testid="join-waitlist"]');
  await dev.page.waitForSelector('[data-testid="waitlist-position"]');
  log.checks.appPosition = await dev.page.locator('[data-testid="waitlist-position"]').innerText();
  log.checks.appLink = await dev.page.locator('[data-testid="waitlist-link"]').innerText();
  await shot(dev.page, 'on-app-waitlist-position');
  log.checks.adminStats = (await api(ON, 'admin-stats', { auth: `Bearer ${ADMIN}` })).json;

  // ---------------- OFF ----------------
  const off = await person('off');
  await off.page.goto(`${OFF}/${SITE}`);
  await W(off.page, 2500);
  log.checks.offCtaText = (await cta(off.page).innerText()).trim();
  log.checks.offModal = await off.page.evaluate(() => document.getElementById('wlback')?.classList.contains('on') || false);
  await shot(off.page, 'off-site-cta');
  await cta(off.page).click();
  await off.page.waitForURL(/\/welcome\/you/);
  await W(off.page, 1500);
  log.checks.offCtaGoes = new URL(off.page.url()).pathname;
  await shot(off.page, 'off-app-welcome');
  await off.page.goto(`${OFF}/`);
  await W(off.page, 2500);
  log.checks.offAppFront = new URL(off.page.url()).pathname;
  await off.page.evaluate((s) => localStorage.setItem('ih:app:v1', JSON.stringify(s)), onboarded('ISLAM'));
  await off.page.goto(`${OFF}/you`);
  await W(off.page, 2000);
  log.checks.offInvitesCard = await off.page.locator('[data-testid="invites-card"]').count();
  log.checks.offStatus = (await api(OFF, 'status')).json;
  log.checks.offJoin = (await api(OFF, 'join', { body: { email: 'x@example.com', door: 'ISLAM' } })).status;

  for (const p of [ana, bea, cami, dev, off]) await p.context.close();
  save();
  console.log(lang, JSON.stringify(log.checks, null, 1));
  console.log('errors', JSON.stringify(log.errors), 'overflow', JSON.stringify(log.overflow));
}
await browser.close();
