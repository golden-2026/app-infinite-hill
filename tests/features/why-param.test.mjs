// ?why= from the website picker: lib/why-param.ts and how onboarding keeps it (lib/onboard.ts pendingProfile and
// profileFor), loaded straight from the app's TypeScript (Node strips the types). React and Expo are stubbed.
import test from "node:test";
import assert from "node:assert/strict";
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

const { pendingProfile, profileFor } = await import(pathToFileURL(`${src}lib/onboard.ts`).href);
const { whyParam, WHY_KEYS } = await import(pathToFileURL(`${src}lib/why-param.ts`).href);
const { BELIEF_QUESTIONS, STANCE_Q } = await import(pathToFileURL(`${src}content/intake.ts`).href);
const { FIRST_WEEK, LIFE_MOMENTS, firstWeekFor, opensAhead, gentleStart } = await import(pathToFileURL(`${src}content/life-moments.ts`).href);
const { guideProfile } = await import(pathToFileURL(`${src}lib/profile.ts`).href);
const { personaFor } = await import(pathToFileURL(`${src}lib/companion/shape.ts`).href);
const { buildSystemPrompt } = await import(pathToFileURL(`${root}api/guide.js`).href);
const { existsSync } = await import("node:fs");
const { readFileSync } = await import("node:fs");

test("the website's keys are exactly the onboarding's 'what brings you' answers, plus the first step's 'spiritual'", () => {
  const why = BELIEF_QUESTIONS.find((q) => q.id === "why");
  assert.deepEqual([...WHY_KEYS].sort(), why.choices.map((c) => c.id).sort());
  assert.ok(STANCE_Q.choices.some((c) => c.id === "spiritual"));
});

test("whyParam reads a key, preselects the spiritual stance, and ignores anything else", () => {
  assert.deepEqual(whyParam("roots"), { why: "roots", stance: null });
  assert.deepEqual(whyParam(["Kids"]), { why: "kids", stance: null });
  assert.deepEqual(whyParam("spiritual"), { why: null, stance: "spiritual" });
  for (const bad of [undefined, null, "", "practice", "<script>", 3]) assert.deepEqual(whyParam(bad), { why: null, stance: null });
});

test("a why from the website rides the pending profile to the first tradition door, never to my own path", () => {
  const p = pendingProfile("2026-10-01", "curious", "none", null, "skip", "kids");
  assert.equal(p.answers.why, "kids");
  assert.equal(profileFor(p, "JUDAISM", "2026-10-01").answers.why, "kids");
  assert.equal(profileFor(p, "SPIRITUAL", "2026-10-01").answers.why, undefined);
  // learning a partner's faith keeps its own seed
  const partner = pendingProfile("2026-10-01", "partner", null, "ISLAM", null, "kids");
  assert.equal(profileFor(partner, "ISLAM", "2026-10-01").answers.why, "partner");
  // no website answer: nothing changes
  assert.equal(profileFor(pendingProfile("2026-10-01", "curious", null), "ISLAM", "2026-10-01").answers.why, undefined);
});

// ---------- life moments: grief, a new baby, scary health news ----------

test("the three life moments are website keys and onboarding answers", () => {
  for (const k of ["grief", "baby", "diagnosis"]) {
    assert.ok(WHY_KEYS.includes(k));
    assert.deepEqual(whyParam(k), { why: k, stance: null });
  }
  assert.deepEqual(whyParam(" Grief "), { why: "grief", stance: null });
  assert.deepEqual([...LIFE_MOMENTS].sort(), ["baby", "belonging", "diagnosis", "forgiveness", "gratitude", "grief", "wedding"]);
});

test("a life moment from the website carries to my own path too; other whys still don't", () => {
  const p = pendingProfile("2026-10-01", "curious", "none", null, null, "grief");
  assert.equal(profileFor(p, "SPIRITUAL", "2026-10-01").answers.why, "grief");
  assert.equal(profileFor(p, "ISLAM", "2026-10-01").answers.why, "grief");
  assert.equal(profileFor(pendingProfile("2026-10-01", "curious", "none", null, null, "calm"), "SPIRITUAL", "2026-10-01").answers.why, undefined);
});

test("every door has a first-week list for every life moment, made only of written year 1-3 lessons", () => {
  const doors = ["HINDUISM", "BUDDHISM", "CHRISTIANITY", "CATHOLIC", "JUDAISM", "ISLAM", "SIKHISM", "SPIRITUAL"];
  for (const m of LIFE_MOMENTS) for (const door of doors) {
    const days = firstWeekFor(m, door);
    assert.ok(days.length >= 1 && days.length <= 5, `${m} ${door}`);
    assert.equal(new Set(days).size, days.length, `${m} ${door} repeats a day`);
    for (const d of days) {
      const file = (y) => `${root}docs/curriculum/${door.toLowerCase()}/scripts/${y}/day-${String(d).padStart(4, "0")}.json`;
      assert.ok(["y1", "y2", "y3"].some((y) => existsSync(file(y))), `${m} ${door} day ${d} has no written script in years 1-3`);
    }
  }
  assert.deepEqual(firstWeekFor("grief", "NOWHERE"), [1]); // a door with nothing fitting starts at its day 1
  assert.equal(firstWeekFor("calm", "HINDUISM"), null);
  assert.equal(firstWeekFor(undefined, "HINDUISM"), null);
  assert.ok(FIRST_WEEK.grief.JUDAISM.some(([d]) => d === 317)); // Psalm 23
});

test("a first-week day opens ahead of the path only on the person's own door and list", () => {
  const p = { door: "JUDAISM", answers: { why: "grief" } };
  assert.equal(opensAhead(p, "JUDAISM", 317), true);
  assert.equal(opensAhead(p, "JUDAISM", 318), false);
  assert.equal(opensAhead(p, "ISLAM", 348), false);
  assert.equal(opensAhead({ door: "JUDAISM", answers: { why: "calm" } }, "JUDAISM", 317), false);
  assert.equal(opensAhead(null, "JUDAISM", 317), false);
});

test("grief and scary health news start gently, are the companion's hard persona, and reach the Guide", () => {
  assert.equal(gentleStart("grief"), true);
  assert.equal(gentleStart("diagnosis"), true);
  assert.equal(gentleStart("hard"), true); // something hard walks the gentle lane too (lib/lane.ts)
  assert.equal(gentleStart("baby"), false);
  const prof = (why) => ({ v: 1, door: "CATHOLIC", knowledge: 10, commitment: 50, openness: "stay", answers: { why }, bridges: {}, lastBridgeOn: null, setOn: "2026-10-01" });
  const mem = { v: 1, facts: [], seeded: false, moods: [], journal: [], done: [], reflected: [], helpClosedOn: null };
  assert.equal(personaFor({ door: "CATHOLIC", profile: prof("grief"), kids: 0, memory: mem }), "hard");
  assert.equal(personaFor({ door: "CATHOLIC", profile: prof("diagnosis"), kids: 0, memory: mem }), "hard");
  assert.equal(personaFor({ door: "CATHOLIC", profile: prof("baby"), kids: 0, memory: mem }), "parent");
  for (const why of WHY_KEYS) {
    const g = guideProfile(prof(why), "CATHOLIC");
    assert.equal(g.reason, why);
    assert.ok(buildSystemPrompt("Catholicism", { depth: g.depth, openness: g.openness, reason: why }).length > 0);
  }
  assert.match(buildSystemPrompt("Catholicism", { depth: "new", openness: "stay", reason: "diagnosis" }), /never diagnose/);
  assert.match(buildSystemPrompt("Catholicism", { depth: "new", openness: "stay", reason: "grief" }), /never as a promise/);
});

// ---------- four more: belonging, forgiveness, a wedding, gratitude (15 picker cards in all) ----------

test("all fifteen website keys: one per picker card, and each one an onboarding answer", () => {
  assert.equal(WHY_KEYS.length, 16); // + "sent": my parents told me to come here
  assert.equal(new Set(WHY_KEYS).size, 16);
  for (const k of ["belonging", "forgiveness", "wedding", "gratitude"]) {
    assert.ok(LIFE_MOMENTS.includes(k), k);
    assert.deepEqual(whyParam(k), { why: k, stance: null });
  }
  // the website picker (owner, 2026-10-05): the eight most pressing reasons only; the others stay sign-up answers.
  // Each "start here" carries its key, and every card is a real sign-up answer.
  for (const file of ["site.html", "site-es.html"]) {
    const html = readFileSync(`${root}apps/app/public/${file}`, "utf8");
    const keys = [...html.matchAll(/id="pkt-([a-z]+)"/g)].map((m) => m[1]);
    assert.deepEqual([...keys].sort(), ["kids", "grief", "partner", "hard", "own", "god", "diagnosis", "sent"].sort(), file);
    for (const k of keys) assert.ok(WHY_KEYS.includes(k), `${file}: ${k} is a sign-up answer`);
    for (const k of keys) assert.match(html, new RegExp(`welcome/you\\?(lang=es&)?why=${k}"`), `${file}: ${k} start here`);
  }
});

test("every life-moment list names only days that exist as written year 1-3 scripts", () => {
  const doors = ["HINDUISM", "BUDDHISM", "CHRISTIANITY", "CATHOLIC", "JUDAISM", "ISLAM", "SIKHISM", "SPIRITUAL"];
  for (const m of LIFE_MOMENTS) {
    assert.deepEqual(Object.keys(FIRST_WEEK[m]).sort(), [...doors].sort(), `${m} covers every door`);
    for (const door of doors) for (const [d, title] of FIRST_WEEK[m][door]) {
      assert.ok(Number.isInteger(d) && d >= 1 && title, `${m} ${door} ${d}`);
      const file = (y) => `${root}docs/curriculum/${door.toLowerCase()}/scripts/${y}/day-${String(d).padStart(4, "0")}.json`;
      assert.ok(["y1", "y2", "y3"].some((y) => existsSync(file(y))), `${m} ${door} day ${d} has no written script in years 1-3`);
    }
  }
});

test("forgiveness starts gently; belonging, a wedding and gratitude keep the normal streak words; the Guide hears each", () => {
  assert.equal(gentleStart("forgiveness"), true);
  for (const k of ["belonging", "wedding", "gratitude"]) assert.equal(gentleStart(k), false, k);
  const prof = (why) => ({ v: 1, door: "SIKHISM", knowledge: 10, commitment: 50, openness: "stay", answers: { why }, bridges: {}, lastBridgeOn: null, setOn: "2026-10-01" });
  const mem = { v: 1, facts: [], seeded: false, moods: [], journal: [], done: [], reflected: [], helpClosedOn: null };
  assert.equal(personaFor({ door: "SIKHISM", profile: prof("wedding"), kids: 0, memory: mem }), "bridge");
  assert.match(buildSystemPrompt("Sikhism", { depth: "new", openness: "stay", reason: "forgiveness" }), /never tell them they must reconcile/);
  assert.match(buildSystemPrompt("Sikhism", { depth: "new", openness: "stay", reason: "belonging" }), /does not/);
  assert.match(buildSystemPrompt("Sikhism", { depth: "new", openness: "stay", reason: "wedding" }), /convert/);
  assert.match(buildSystemPrompt("Sikhism", { depth: "new", openness: "stay", reason: "gratitude" }), /thanksgiving/);
  assert.ok(opensAhead({ door: "SIKHISM", answers: { why: "wedding" } }, "SIKHISM", 56));
});
