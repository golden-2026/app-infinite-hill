// The lesson screen's script wiring (apps/app/src/app/session/[door]/[day].tsx): the day's script is fetched with a
// 2.5 s cap (apps/app/src/session/script-load.ts), handed to planDay, and "just learn" tells the script's own
// "how it's done". Loaded straight from the app's TypeScript (Node strips the types); the week files are the built ones
// in apps/app/public/lessons, served by a fake fetch. Nothing here renders.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { lessonScript, planDay, resetLessonCache } from "../../packages/content/src/index.js";

const root = fileURLToPath(new URL("../../", import.meta.url));
const src = `${root}apps/app/src/`;
const LESSONS = `${root}apps/app/public/lessons`;
const { scriptWithin, makeLessonStore, weeksToKeep, SCRIPT_WAIT_MS } = await import(pathToFileURL(`${src}session/script-load.ts`).href);
const { learnSteps, HOW_ITS_DONE } = await import(pathToFileURL(`${src}session/learn.ts`).href);

const built = existsSync(`${LESSONS}/manifest.json`);
// a fetch that serves the built lessons folder the way the web export does ("/lessons/…")
const served = (log = []) => async (url) => {
  log.push(url);
  const path = String(url).replace(/^\/lessons/, LESSONS).replace(/\?.*$/, "");
  if (!existsSync(path)) return { ok: false, json: async () => null };
  return { ok: true, json: async () => JSON.parse(readFileSync(path, "utf8")) };
};
const offline = async () => { throw new TypeError("Failed to fetch"); };
const load = (door, day, fetch, store = null) => scriptWithin(() => lessonScript(door, day, { base: "/lessons", fetch, store }));
const beats = (p) => p.steps.filter((s) => s.type === "beat").map((s) => s.text).join(" ");

test("the wait: a script that arrives is used, a slow one, a failure or a miss falls back to null", async () => {
  assert.equal(SCRIPT_WAIT_MS, 2500);
  assert.deepEqual(await scriptWithin(async () => ({ day: 1 }), 50), { day: 1 });
  const t = Date.now();
  assert.equal(await scriptWithin(() => new Promise(() => {}), 60), null); // never answers: the lesson opens anyway
  assert.ok(Date.now() - t < 1000);
  assert.equal(await scriptWithin(async () => { throw new Error("x"); }, 50), null);
  assert.equal(await scriptWithin(() => { throw new Error("sync"); }, 50), null);
  assert.equal(await scriptWithin(async () => undefined, 50), null);
});

test("the store keeps at most 3 weeks per door, and other doors' weeks alone", () => {
  assert.deepEqual([...weeksToKeep("005")].sort(), ["004", "005", "006"]);
  const m = new Map([["ih:lessons:CHRISTIANITY:001", 1], ["ih:lessons:CHRISTIANITY:002", 2], ["ih:lessons:CHRISTIANITY:003", 3], ["ih:lessons:CHRISTIANITY:009", 9], ["ih:lessons:ISLAM:001", 1], ["ih:lesson:CHRISTIANITY:5:me:L1", "resume"]]);
  const store = makeLessonStore({ read: (k) => m.get(k) ?? null, write: (k, v) => m.set(k, v), remove: (k) => m.delete(k), keys: () => [...m.keys()] });
  store.set("ih:lessons:CHRISTIANITY:004", 4);
  const kept = [...m.keys()].filter((k) => k.startsWith("ih:lessons:CHRISTIANITY:")).sort();
  assert.deepEqual(kept, ["ih:lessons:CHRISTIANITY:003", "ih:lessons:CHRISTIANITY:004"]);
  assert.ok(m.has("ih:lessons:ISLAM:001") && m.has("ih:lesson:CHRISTIANITY:5:me:L1"));
  assert.equal(store.get("ih:lessons:CHRISTIANITY:004"), 4);
});

test("a script day plays the script: its spoken text and its games", { skip: !built && "run build-lessons first" }, async () => {
  resetLessonCache();
  for (const [door, day] of [["CHRISTIANITY", 1], ["CHRISTIANITY", 29], ["ISLAM", 3], ["SPIRITUAL", 2]]) {
    const s = await load(door, day, served());
    assert.ok(s && s.day === day && s.door === door, `${door} ${day} has a script`);
    const p = planDay({ wing: door, day, mode: "adult", level: 1, script: s });
    const plain = planDay({ wing: door, day, mode: "adult", level: 1 });
    assert.equal(p.info.script, true);
    const hook = s.segments.find((g) => g.type === "the hook").voice;
    assert.ok(beats(p).includes(hook.split(/(?<=[.?!])\s/)[0]), `${door} ${day}: the hook's first sentence is spoken`);
    assert.notEqual(beats(p), beats(plain));
    const match = p.steps.find((x) => x.type === "match");
    if (match) assert.deepEqual(match.pairs, s.games.match.pairs);
    if (day === 3) assert.equal(p.steps.find((x) => x.type === "fork")?.setup, s.games.fork.setup);
  }
});

test("no script, no network, or a door with none: the lesson is exactly the one built before", { skip: !built && "run build-lessons first" }, async () => {
  resetLessonCache();
  for (const [door, day] of [["HINDUISM", 3], ["CATHOLIC", 1], ["CHRISTIANITY", 400]]) {
    const s = await load(door, day, served());
    assert.equal(s, null, `${door} ${day}`);
    assert.deepEqual(planDay({ wing: door, day, mode: "adult", level: 1, script: s }), planDay({ wing: door, day, mode: "adult", level: 1 }));
  }
  resetLessonCache();
  assert.equal(await load("CHRISTIANITY", 2, offline), null); // offline with nothing kept
  // a week kept from an earlier visit still opens offline
  resetLessonCache();
  const m = new Map();
  const store = makeLessonStore({ read: (k) => m.get(k) ?? null, write: (k, v) => m.set(k, v), remove: (k) => m.delete(k), keys: () => [...m.keys()] });
  assert.ok(await load("ISLAM", 3, served(), store));
  resetLessonCache();
  assert.equal((await load("ISLAM", 3, offline, store))?.day, 3);
});

test("just learn with a script: no breath or sit, and the practice is the script's own how-it's-done", { skip: !built && "run build-lessons first" }, async () => {
  resetLessonCache();
  for (const day of [1, 29]) {
    const s = await load("CHRISTIANITY", day, served());
    const p = planDay({ wing: "CHRISTIANITY", day, mode: "adult", level: 1, script: s });
    const out = learnSteps(p.steps, p.info?.script ? p.info.howItsDone : null);
    assert.ok(!out.some((x) => x.type === "breath" || x.type === "sit"));
    const told = out.filter((x) => x.seg === HOW_ITS_DONE);
    assert.equal(told.length, 1);
    assert.equal(told[0].text, s.howItsDone);
    assert.ok(!out.some((x) => x.type === "beat" && /^the practice/.test(String(x.seg || ""))));
  }
  // without a script the generic line stays
  const plain = planDay({ wing: "HINDUISM", day: 3, mode: "adult", level: 1 });
  assert.match(learnSteps(plain.steps, null).find((x) => x.seg === HOW_ITS_DONE).text, /how it's done|practice/i);
});
