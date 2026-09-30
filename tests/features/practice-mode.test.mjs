// "Try the practices, or just learn?": the companion's selection (apps/app/src/lib/companion/shape.ts) and the
// lesson filter (apps/app/src/session/learn.ts), loaded straight from the app's TypeScript (Node strips the types).
// React and Expo are stubbed; nothing here renders.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const src = `${root}apps/app/src/`;
const stub = (code) => `data:text/javascript,${encodeURIComponent(code)}`;
const hooks = `
const SRC = ${JSON.stringify(pathToFileURL(src).href)};
const CONTENT = ${JSON.stringify(pathToFileURL(`${root}packages/content/src/index.js`).href)};
const STUBS = {
  react: ${JSON.stringify(stub("export const useEffect = () => {}; export const useState = (x) => [typeof x === 'function' ? x() : x, () => {}]; export const useSyncExternalStore = (s, g) => g(); export default {};"))},
  "expo-crypto": ${JSON.stringify(stub("export const randomUUID = () => globalThis.crypto.randomUUID();"))},
};
const EXT = ["", ".ts", ".js", "/index.ts"];
export async function resolve(spec, ctx, next) {
  if (STUBS[spec]) return { url: STUBS[spec], shortCircuit: true };
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

const { shapeToday } = await import(pathToFileURL(`${src}lib/companion/shape.ts`).href);
const { doable, prayerToDo } = await import(pathToFileURL(`${src}lib/onboard.ts`).href);
const { PRACTICES } = await import(pathToFileURL(`${src}content/practices.ts`).href);
const { learnSteps } = await import(pathToFileURL(`${src}session/learn.ts`).href);
const { planDay } = await import(pathToFileURL(`${root}packages/content/src/index.js`).href);
assert.ok(existsSync(`${src}lib/companion/shape.ts`));

const memory = (moods = []) => ({ v: 1, facts: [], seeded: false, moods, journal: [], done: [], reflected: [], helpClosedOn: null });
const profile = (door, answers, openness = "stay") => ({ v: 1, door, knowledge: null, commitment: null, openness, answers, bridges: {}, lastBridgeOn: null, setOn: "2026-09-01" });
const input = (door, p, o = {}) => ({
  door, profile: p, level: 2, hour: 12, weekday: 3, today: "2026-09-30", showedUp: 5, missedDays: 0, doneToday: false,
  lesson: 5, feels: [], kids: 0, memory: memory(), ...o,
});
const date = (k) => new Date(Date.UTC(2026, 8, 1 + k)).toISOString().slice(0, 10);
// Every hour, every weekday, a month of days and each mood: the whole range the selection can see.
function* days(door, p) {
  for (let k = 0; k < 30; k++) for (const hour of [6, 9, 12, 15, 18, 21, 23]) for (const mood of [null, "good", "calm", "tired", "anxious", "heavy"]) {
    const today = date(k);
    yield shapeToday(input(door, p, { hour, today, weekday: new Date(`${today}T12:00:00Z`).getUTCDay(), memory: memory(mood ? [{ date: today, mood }] : []) }));
  }
}
const TO_DO_NEVER = new Set(["prayer", "sit", "breath"]);

test("just learn never offers a prayer, a sit or a breath as something to do", () => {
  const learner = profile("JUDAISM", { stance: "partner", learning: "JUDAISM", why: "partner", raised: "family", practiceMode: "learn" }, "love");
  let explained = 0;
  for (const day of days("JUDAISM", learner)) {
    assert.equal(day.learn, true);
    if (TO_DO_NEVER.has(day.practice.kind) || day.practice.door) assert.equal(day.howItsDone, true, `${day.practice.id} offered to do`);
    if (day.howItsDone) { explained++; assert.doesNotMatch(day.note, /\b(do it|pray|try it)\b/i); }
    for (const c of day.candidates) assert.ok(c.door || !TO_DO_NEVER.has(c.kind), `${c.id}: a general breath or sit reached a learner`);
  }
  assert.ok(explained > 0, "the tradition's practice shows up as how it's done");
});

test("a practicing Catholic is still offered the rosary to do", () => {
  const catholic = profile("CATHOLIC", { stance: "practice", raisedIn: "CATHOLIC", why: "own", practice: "daily", hold: "fully" });
  assert.equal(prayerToDo(catholic, "CATHOLIC"), true);
  const rosary = PRACTICES.find((x) => x.id === "rosary-decade");
  assert.equal(doable(rosary, "CATHOLIC", catholic), true);
  const offered = [...days("CATHOLIC", catholic)].filter((d) => d.practice.id === "rosary-decade");
  assert.ok(offered.length > 0, "the rosary comes up");
  assert.ok(offered.every((d) => !d.howItsDone), "and always as something to do");
});

test("prayers to do only for people who practice that faith, walk their own, or chose try them", () => {
  const prayer = PRACTICES.find((x) => x.id === "shema-bedtime");
  const curious = profile("JUDAISM", { stance: "curious", why: "curious" });
  assert.equal(doable(prayer, "JUDAISM", curious), false, "curious, never asked: how it's done");
  assert.equal(doable(prayer, "JUDAISM", profile("JUDAISM", { stance: "curious", why: "curious", practiceMode: "practice" })), true, "chose try them");
  assert.equal(doable(prayer, "JUDAISM", profile("JUDAISM", { why: "roots" })), true, "their own roots");
  assert.equal(doable(prayer, "JUDAISM", profile("JUDAISM", { stance: "practice", raisedIn: "CATHOLIC" })), false, "someone else's faith");
  assert.equal(doable(prayer, "JUDAISM", profile("JUDAISM", { stance: "practice", raisedIn: "JUDAISM", practiceMode: "learn" })), false, "just learn wins");
  for (const d of days("JUDAISM", curious)) if (d.practice.kind === "prayer") assert.equal(d.howItsDone, true);
});

test("another tradition's practice is learning only, even for someone who practices", () => {
  const catholic = profile("CATHOLIC", { stance: "practice", raisedIn: "CATHOLIC", practiceMode: "practice" }, "love");
  for (const x of PRACTICES.filter((x) => x.door && x.door !== "CATHOLIC")) assert.equal(doable(x, "CATHOLIC", catholic), false, x.id);
  for (const d of days("CATHOLIC", catholic)) if (d.fromNextDoor) assert.equal(d.howItsDone, true);
});

test("every tradition practice has a how-it's-done line, and the day stays deterministic", () => {
  for (const x of PRACTICES.filter((x) => x.door)) assert.ok(x.about && !/\b(you|your)\b/i.test(x.about), `${x.id}: about is third person`);
  const p = profile("ISLAM", { stance: "many", practiceMode: "learn" });
  assert.deepEqual(shapeToday(input("ISLAM", p)), shapeToday(input("ISLAM", p)));
});

test("just learn: no breath or sit in a lesson, and the practice is told, never asked", () => {
  for (const [door, day] of [["JUDAISM", 1], ["JUDAISM", 5], ["CATHOLIC", 12], ["HINDUISM", 20], ["JUDAISM", 25], ["CATHOLIC", 40]]) {
    const plan = planDay({ wing: door, day, mode: "adult" });
    const steps = learnSteps(plan.steps);
    assert.ok(plan.steps.some((s) => s.type === "breath" || s.type === "sit"), "the lesson had one");
    assert.ok(!steps.some((s) => s.type === "breath" || s.type === "sit"), `${door} ${day}: no breath or sit`);
    const told = steps.filter((s) => s.type === "beat" && s.seg === "how it's done");
    assert.equal(told.length, 1);
    assert.doesNotMatch(told[0].text, /^try this/i);
    assert.match(told[0].text, /how it's done/);
    assert.ok(!steps.some((s) => /^the practice/.test(s.seg || "")), "no practice script left");
    assert.equal(steps.at(-1).type, "tally", "the day still finishes");
  }
});
