// The ways in that keep the homepage's promise (apps/app/src/lib/lane.ts): someone grieving, frightened by health
// news, low, or carrying a hurt walks a gentle lane (no "how did you hear", no five-year map, no placement quiz, no
// profile summary, no voice intro; their first lesson is their first-week lesson; the check-in waits for day three);
// a baby, a wedding, belonging and gratitude walk a light one; a teen sent by their parents a quick one.
// Loaded straight from the app's TypeScript (Node strips the types), like why-param.test.mjs.
import test from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const src = `${root}apps/app/src/`;
const stub = (code) => `data:text/javascript,${encodeURIComponent(code)}`;
const hooks = `
const SRC = ${JSON.stringify(pathToFileURL(src).href)};
const CONTENT = ${JSON.stringify(pathToFileURL(`${root}packages/content/src/index.js`).href)};
const EXT = ["", ".ts", ".js", "/index.ts"];
export async function resolve(spec, ctx, next) {
  if (spec === "@ih/content") return { url: CONTENT, shortCircuit: true };
  let base = null;
  if (spec.startsWith("@/")) base = new URL(spec.slice(2), SRC).href;
  else if ((spec.startsWith("./") || spec.startsWith("../")) && ctx.parentURL?.startsWith(SRC)) base = new URL(spec, ctx.parentURL).href;
  if (base) {
    for (const e of EXT) { try { return await next(base + e, ctx); } catch {} }
  }
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (url.startsWith(SRC) && url.endsWith(".ts")) return next(url, { ...ctx, format: "module-typescript" });
  return next(url, ctx);
}`;
register(stub(hooks), import.meta.url);

const lane = await import(pathToFileURL(`${src}lib/lane.ts`).href);
const { WHY_KEYS } = await import(pathToFileURL(`${src}lib/why-param.ts`).href);
const { firstWeekFor, gentleStart, FIRST_WEEK } = await import(pathToFileURL(`${src}content/life-moments.ts`).href);
const { dueOnThirdDay, dueAtStart, noteCheck, emptyWellbeing } = await import(pathToFileURL(`${src}lib/wellbeing.ts`).href);
const strings = await import(pathToFileURL(`${src}i18n/strings/gentle.ts`).href);
const read = (p) => readFileSync(`${src}${p}`, "utf8");
const DOORS = ["HINDUISM", "BUDDHISM", "CHRISTIANITY", "CATHOLIC", "JUDAISM", "ISLAM", "SIKHISM", "SPIRITUAL"];

/** The welcome screens someone walks, by the routing rules the screens use (welcome/you → door → …), up to the first lesson. */
function journey(why, door) {
  const steps = ["you"];
  steps.push("door");
  const after = lane.afterDoor(why);
  if (after === "check") steps.push(...(door === "SPIRITUAL" ? ["intake", "suggest"] : ["know", "belief", "fit"]), "voice");
  else if (after === "voice") steps.push("voice");
  if (lane.baselineAtStart(why)) steps.push("wellbeing");
  steps.push(`lesson ${lane.firstLesson(why, door, 1)}`);
  return steps;
}

test("every reason has a lane: gentle, light, quick or the full welcome", () => {
  const want = { grief: "gentle", diagnosis: "gentle", hard: "gentle", forgiveness: "gentle", baby: "light", wedding: "light", belonging: "light", gratitude: "light", sent: "quick" };
  for (const k of WHY_KEYS) assert.equal(lane.laneFor(k), want[k] || "full", k);
  assert.equal(lane.laneFor(null), "full"); // no reason, or "spiritual" (a stance, not a why)
  for (const k of ["grief", "diagnosis", "hard", "forgiveness"]) assert.equal(gentleStart(k), true, k);
});

test("no one is asked how they heard about us, or shown the five-year map, before their first lesson; heard comes after it", () => {
  for (const why of [null, "kids", "baby", "own", "sent", "grief"]) for (const door of DOORS) {
    const steps = journey(why, door);
    assert.ok(!steps.includes("heard") && !steps.includes("trail"), `${why} ${door}`);
  }
  assert.equal(lane.askHeard("kids", undefined), true);
  assert.equal(lane.askHeard(null, undefined), true);
  assert.equal(lane.askHeard("kids", "skip"), false); // answered or skipped: never again
  assert.equal(lane.askHeard("grief", undefined), false); // never on the gentle lane
  assert.equal(lane.askHeard("sent", undefined), false); // nor for a teen sent by their parents
});

test("the gentle lane: stance and door, then straight into the first-week lesson (no heard, map, quiz, fit, voice or check-in)", () => {
  assert.deepEqual(journey("grief", "HINDUISM"), ["you", "door", "lesson 162"]);
  assert.deepEqual(journey("diagnosis", "CHRISTIANITY"), ["you", "door", "lesson 175"]);
  assert.deepEqual(journey("forgiveness", "JUDAISM"), ["you", "door", "lesson 19"]); // teshuvah (day 17 is the minyan)
  // something hard: the homepage promises the door's own day one ("a breath, a story, one line to carry")
  assert.deepEqual(journey("hard", "ISLAM"), ["you", "door", "lesson 1"]);
  for (const why of ["grief", "diagnosis", "forgiveness"]) for (const door of DOORS) {
    const steps = journey(why, door);
    for (const s of ["heard", "trail", "know", "belief", "fit", "voice", "intake", "wellbeing"]) assert.ok(!steps.includes(s), `${why} ${door}: ${s}`);
    assert.equal(steps.at(-1), `lesson ${firstWeekFor(why, door)[0]}`, `${why} ${door} opens with its first-week lesson`);
  }
});

test("the light lane leads with the first week and no quiz; a teen's is quick; everyone else keeps the full welcome", () => {
  assert.deepEqual(journey("baby", "BUDDHISM"), ["you", "door", "voice", "wellbeing", "lesson 23"]);
  assert.deepEqual(journey("wedding", "SIKHISM"), ["you", "door", "voice", "wellbeing", "lesson 56"]);
  assert.deepEqual(journey("sent", "CATHOLIC"), ["you", "door", "voice", "lesson 1"]);
  assert.deepEqual(journey("kids", "JUDAISM"), ["you", "door", "know", "belief", "fit", "voice", "wellbeing", "lesson 1"]);
  assert.deepEqual(journey(null, "SPIRITUAL"), ["you", "door", "intake", "suggest", "voice", "wellbeing", "lesson 1"]);
  // placement still sets where the full welcome starts; a week-first lane opens its week first
  assert.equal(lane.firstLesson("own", "HINDUISM", 22), 22);
  assert.equal(lane.firstLesson("grief", "HINDUISM", 22), 162);
});

test("the week goes on, one lesson at a time, then hands over to the path", () => {
  const list = FIRST_WEEK.grief.JUDAISM.map(([d]) => d);
  const walked = new Set();
  const seen = [];
  for (let n = lane.nextWeekDay("grief", "JUDAISM", (d) => walked.has(d)); n !== null; n = lane.nextWeekDay("grief", "JUDAISM", (d) => walked.has(d))) { seen.push(n); walked.add(n); }
  assert.deepEqual(seen, list);
  assert.equal(lane.nextWeekDay("own", "JUDAISM", () => false), null); // no week on the full welcome
  assert.equal(lane.nextWeekDay("hard", "JUDAISM", () => false), null); // hard has no list: the path leads
});

test("the check-in waits for the third day on the gentle and quick lanes, and is still asked only once", () => {
  for (const k of ["grief", "diagnosis", "hard", "forgiveness", "sent"]) assert.equal(lane.baselineAtStart(k), false, k);
  for (const k of ["baby", "own", null]) assert.equal(lane.baselineAtStart(k), true, String(k));
  const wb = emptyWellbeing();
  assert.equal(dueOnThirdDay(0, wb), null); // day one
  assert.equal(dueOnThirdDay(1, wb), null); // day two
  assert.equal(dueOnThirdDay(2, wb), 1); // day three
  assert.equal(dueOnThirdDay(5, noteCheck(wb, 1, null, "2026-10-03")), null); // skipped once: never again
  assert.equal(dueAtStart(wb), 1);
  // a first-week lesson (never a sit) counts as a day someone came
  assert.deepEqual(lane.daysCome(["2026-10-03"], ["2026-10-01", "2026-10-03"]), ["2026-10-01", "2026-10-03"]);
});

test("the screens use the lane: you, door, ready, Today, the session's extras and the after-lesson Guide offer", () => {
  assert.match(read("app/welcome/you.tsx"), /afterYou\(fromSite\.why/);
  assert.match(read("app/welcome/you.tsx"), /why === "partner" \? "partner"/); // partner: their faith asked first
  assert.match(read("app/welcome/door.tsx"), /afterDoor\(why\)/);
  assert.match(read("app/welcome/ready.tsx"), /firstLesson\(why, door/);
  assert.match(read("app/welcome/ready.tsx"), /baselineAtStart\(why\)/);
  assert.match(read("app/(tabs)/today.tsx"), /dueOnThirdDay\(/);
  const session = read("app/session/[door]/[day].tsx");
  assert.match(session, /pathname: "\/done\/week"/);
  assert.match(session, /forYouOn:/);
  assert.doesNotMatch(session.slice(session.indexOf("if (extra) {"), session.indexOf("if (deep) {")), /onFinish\(|completeSit/); // never a sit
  assert.match(read("app/done/week.tsx"), /gentle\.after\.guide/);
  assert.match(read("app/welcome/_layout.tsx"), /later === "1"/); // placement offered later, from Today
});

test("the mascot meets each reason warmly first, in his own voice", () => {
  const { en, es } = strings;
  assert.equal(en["gentle.hello.grief"], "i'm so sorry. let's take this slowly, together.");
  assert.equal(en["gentle.hello.diagnosis"], "i'm so sorry. let's take this slowly, together.");
  assert.equal(en["gentle.after.guide"], "want to talk about it? i'm here.");
  for (const k of WHY_KEYS) assert.ok(en[`gentle.hello.${k}`] && es[`gentle.hello.${k}`], k);
  assert.ok(en["gentle.hello.spiritual"]);
  for (const [k, v] of Object.entries(en)) {
    assert.doesNotMatch(v, /\bwe\b|\bwe'/i, `${k}: "we" is only the company`);
    assert.equal(v, v.toLowerCase(), `${k}: lowercase`);
  }
  for (const k of ["grief", "diagnosis", "hard", "forgiveness"]) assert.doesNotMatch(en[`gentle.hello.${k}`], /!|\p{Extended_Pictographic}/u, `${k}: no joy marks in a hard moment`);
});
