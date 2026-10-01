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
