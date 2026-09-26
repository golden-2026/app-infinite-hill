import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { DOOR_CATALOG, getSession, getSessionAvailability, getPracticeRung } from "../../src/content/catalog.js";
import { advanceLesson, completeLesson, dueReviews } from "../../src/features/progression.js";

const app = await readFile(new URL("../../src/Golden.jsx", import.meta.url), "utf8");
const catalogSource = await readFile(new URL("../../src/content/catalog.js", import.meta.url), "utf8");
const account = await readFile(new URL("../../src/components/AccountScreen.jsx", import.meta.url), "utf8");
const site = await readFile(new URL("../../public/site.html", import.meta.url), "utf8");
const productSpec = await readFile(new URL("../../docs/PRODUCT_SPEC.md", import.meta.url), "utf8");

function section(source, start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `source should contain ${start}`);
  const to = end ? source.indexOf(end, from + start.length) : source.length;
  assert.ok(!end || to !== -1, `source should contain end marker ${end}`);
  return source.slice(from, end ? to : undefined);
}

function expectPattern(source, pattern, message = `expected source to match ${pattern}`) {
  assert.ok(pattern.test(source), message);
}

test("first run offers onboarding, all eight Doors, and a direct or placement start", () => {
  const welcome = section(app, "function Welcome(", "function Placement(");
  expectPattern(welcome, /How did you hear about golden\?/);
  expectPattern(welcome, /What brought you here\?/);
  expectPattern(welcome, /Which door is yours\?/);
  expectPattern(welcome, /How well do you know/);
  expectPattern(welcome, /start from the top/i);
  expectPattern(welcome, /find where I am/i);
  assert.equal(DOOR_CATALOG.length, 8);
  assert.deepEqual(DOOR_CATALOG.map((door) => door.id), [
    "CHRISTIANITY", "CATHOLIC", "HINDUISM", "ISLAM", "JUDAISM", "BUDDHISM", "SIKHISM", "SPIRITUAL",
  ]);
  expectPattern(app, /if \(find\) setPlacing\(true\)/);
  expectPattern(app, /getSessionAvailability\(door, 1\)\.canPreview/);
});

test("lesson contract has eight beats, a word, a carry line, and local completion", () => {
  const expectedBeats = ["the bell", "review", "the hook", "the teach", "the practice", "the word", "the carry", "the close"];
  const beatDeclaration = catalogSource.match(/const SCRIPT_BEATS = \[(.*?)\];/s)?.[1];
  assert.ok(beatDeclaration, "catalog should define the authored lesson beat contract");
  assert.deepEqual([...beatDeclaration.matchAll(/'([^']+)'/g)].map((match) => match[1]), expectedBeats);

  const session = section(app, "function Session(", "function Review(");
  for (const beat of ["the bell", "the hook", "the teach", "the practice", "the word", "the carry", "the close"]) {
    assert.ok(session.includes(`type: "${beat}"`), `player should include ${beat}`);
  }
  expectPattern(session, /Your line to carry/);
  expectPattern(session, /Your first word/);
  expectPattern(session, /word: R\.word/);
  expectPattern(app, /finishDay\(\); setPost\(true\)/);
  assert.ok(getSession("HINDUISM", 1)?.segments.length === 8, "authored preview should supply all eight beats");
  assert.equal(getPracticeRung(1).n, 1, "first two lessons use one breath");
  assert.equal(getSessionAvailability("HINDUISM", 1).publishable, false, "preview authorship does not imply approval");
});

test("completion earns at most one showed-up day per local date", () => {
  const initial = { showedUp: 2, showedUpDates: ["2026-09-12"], lastCompletedDate: "2026-09-12", paths: { HINDUISM: { day: 1, done: false }, BUDDHISM: { day: 1, done: false } } };
  const first = completeLesson(initial, { door: "HINDUISM", lesson: 1, date: "2026-09-13", word: "namaste", carry: "the light in me sees the light in you" });
  const second = completeLesson(first, { door: "BUDDHISM", lesson: 1, date: "2026-09-13", word: "metta", carry: "may you be at ease" });
  assert.equal(first.showedUp, 3);
  assert.equal(second.showedUp, 3, "a second Door on the same local date does not add another day");
  assert.equal(second.paths.HINDUISM.done, true);
  assert.equal(second.paths.BUDDHISM.done, true);
  assert.equal(second.completionHistory.find((item) => item.id === "HINDUISM:1").word, "namaste");
  assert.equal(second.completionHistory.find((item) => item.id === "BUDDHISM:1").carry, "may you be at ease");
  expectPattern(app, /completeLesson\(/);
});

test("a visiting Door keeps its own path while both Doors share the daily credit", () => {
  expectPattern(app, /const \[homeWing, setHomeWing\]/);
  expectPattern(app, /const \[visitWing, setVisitWing\]/);
  expectPattern(app, /paths\[wing\]/);
  expectPattern(app, /DOORS\.filter\(\(\[l, w\]\) => w !== wing\)/);
  expectPattern(app, /Two doors, never one soup/);
  expectPattern(app, /day counts once/i);
  const completed = completeLesson({ paths: { HINDUISM: { day: 2, done: false }, BUDDHISM: { day: 4, done: false } } }, { door: "BUDDHISM", lesson: 4, date: "2026-09-13" });
  const advanced = advanceLesson(completed, "BUDDHISM");
  assert.equal(advanced.paths.BUDDHISM.day, 5);
  assert.equal(advanced.paths.HINDUISM.day, 2, "advancing the visit leaves the home Door position intact");
});

test("Today, review, Together, Guide, plans, gift, profile, and account are routed", () => {
  const review = section(app, "function Review(", "function WidgetStep(");
  const today = section(app, "function PathHome(", "function Together(");
  const together = section(app, "function Together(", "function askGuide(");
  for (const [name, source] of [["review", review], ["Today", today], ["Together", together]]) {
    assert.ok(source.length > 100, `${name} should have an implemented screen`);
  }
  expectPattern(review, /review \{items\.length\}/);
  expectPattern(review, /your strand/);
  const earned = completeLesson({}, { door: "HINDUISM", lesson: 1, date: "2026-09-12", word: "namaste" });
  assert.equal(dueReviews(earned, "2026-09-12").length, 0, "a newly earned word is not immediately due");
  assert.equal(dueReviews(earned, "2026-09-13")[0]?.word, "namaste", "earned words become reviewable when due");
  expectPattern(today, /Today|today/);
  expectPattern(today, /onReview/);
  expectPattern(together, /<TableCard/);
  expectPattern(together, /A Table shares attendance counts only/);
  assert.doesNotMatch(together, /Open the full Table|sample listing|community preview/);
  expectPattern(app, /if \(tab === "today"\) return <PathHome/);
  expectPattern(app, /if \(tab === "together"\) return <Together/);
  expectPattern(app, /if \(tab === "guide"\) return <Guide/);
  expectPattern(app, /if \(tab === "plans"\) return <Plans/);
  expectPattern(app, /if \(tab === "gift"\) return <Gift/);
  expectPattern(app, /if \(tab === "account"\) return <AccountScreen/);
});

test("Guide identifies the lesson-based offline fallback", () => {
  const guide = section(app, "const guideFallback =", "function Guide(");
  expectPattern(guide, /listDoorSessions\(wing, \{ camp: 1, authoredOnly: true \}\)/);
  expectPattern(guide, /that's the lesson talking, not me/);
  expectPattern(guide, /no signal/);
  expectPattern(productSpec, /The Guide falls back honestly when its server model\s+is\s+not configured/);
});

test("plans and gifts are drafts until checkout and delivery providers exist", () => {
  const plans = section(app, "function Plans(", "function You(");
  const gift = section(app, "function Gift(", "function You(");
  expectPattern(plans, /Payments are not connected/);
  expectPattern(plans, /planned ·/);
  expectPattern(plans, /checkout and delivery pending/);
  expectPattern(gift, /checkout is not connected/);
  expectPattern(gift, /Nothing was charged or delivered/);
  expectPattern(gift, /saveGiftDraft/);
});

test("account keeps a device-local recovery path and reports sync from observed requests", () => {
  expectPattern(account, /Your anonymous account and progress are stored in this browser/);
  expectPattern(account, /There is no sign-in or verified identity/);
  expectPattern(account, /Download backup file/);
  expectPattern(account, /Import recovery file/);
  expectPattern(account, /Encrypted backup is enabled for this browser\. Nothing has been uploaded\./);
  expectPattern(account, /uploadBackup/);
  expectPattern(account, /result\.status|syncStatus/);
});

test("marketing website Start free opens the current app in embedded mode", () => {
  expectPattern(site, /window\.goldenOpen\s*=\s*function/);
  expectPattern(site, /embed/);
  expectPattern(site, /params\.set\('door', door\)/);
  expectPattern(site, /Start free/i);
  assert.equal([...site.matchAll(/window\.goldenOpen\s*=/g)].length, 1);
});
