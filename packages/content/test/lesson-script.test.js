import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { checkScript, chunkOf, chunkPath, compileScript, featureFor, lessonScript, planDay, resetLessonCache } from "../src/index.js";
import { lessonInfo } from "../src/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const EXAMPLE = join(here, "..", "..", "..", "docs", "curriculum", "christianity", "scripts", "y1", "day-0001.json");
const example = () => JSON.parse(readFileSync(EXAMPLE, "utf8"));
// a lesson without the week-one upgrade (amen moved from day 1 to day 8 on 2026-10-06), for the plain planDay path
const PLAIN = join(here, "..", "..", "..", "docs", "curriculum", "christianity", "scripts", "y1", "day-0008.json");
const plainScript = () => JSON.parse(readFileSync(PLAIN, "utf8"));
const indexOf = (door, day) => { const i = lessonInfo(door, day); return { title: i.title, word: i.word, carry: i.carry }; };

test("the example script passes the format check", () => {
  const r = checkScript(example(), { index: indexOf("CHRISTIANITY", 1), door: "CHRISTIANITY", day: 1 });
  assert.deepEqual(r.errors, []);
  // within the validator's aim (WORDS.total 280–640; the floors came down for the rebuilt first week, 2026-10-06)
  assert.ok(r.stats.total >= 280 && r.stats.total <= 640, `spoken words ${r.stats.total}`);
});

test("the format check catches filler, missing segments, a changed word, non-public-domain quotes and British spelling", () => {
  const errs = (mut) => { const s = example(); mut(s); return checkScript(s, { index: indexOf("CHRISTIANITY", 1) }).errors.join("\n"); };
  assert.match(errs((s) => { s.segments[2].voice += " Most people in Christianity never had anyone explain it to them like this."; }), /template filler/);
  assert.match(errs((s) => { s.segments = s.segments.filter((g) => g.type !== "the practice"); }), /segments must be/);
  assert.match(errs((s) => { s.word = "hallelujah"; }), /doesn't match the index/);
  assert.match(errs((s) => { s.sources[0].translation = "NIV"; }), /public-domain list/);
  assert.match(errs((s) => { s.segments[2].voice = s.segments[2].voice.replace("Here's the surprise", "Here's the honour of it"); }), /British spelling/);
  assert.match(errs((s) => { s.segments[2].voice += " You must believe this."; }), /tells people what to believe/);
  assert.match(errs((s) => { s.review.status = "approved"; }), /pending/);
  assert.match(errs((s) => { s.games.match.pairs = s.games.match.pairs.slice(0, 2); }), /3–4 pairs/);
  // quoted scripture keeps its own spelling
  assert.doesNotMatch(errs((s) => { s.segments[2].voice += " \"Thou shalt love thy neighbour as thyself.\""; }), /British/);
});

test("feature games follow the design's pacing, then rotate, skipping a missing original", () => {
  const all = { myth: 1, fork: 1, original: 1, trapdoor: 1 };
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map((d) => featureFor(d, all)), [null, "myth", "fork", "original", "trapdoor", "myth", "fork"]);
  assert.equal(featureFor(8, { ...all, original: null }), "trapdoor");
});

test("planDay with a script: today's pairs, the script's practice, one feature game, unique ids, the tally last", () => {
  const s = { ...plainScript(), day: 9 };
  s.segments = s.segments.filter((g) => g.type !== "review").map((g) => (g.type === "the bell" ? { ...g, screen: ["`DAY NINE.`"] } : g));
  s.segments.splice(1, 0, { type: "review", duration: "20 sec", voice: "Yesterday: deliver us. You can ask. Day nine.", screen: [] });
  const plain = planDay({ wing: "CHRISTIANITY", day: 9 });
  const p = planDay({ wing: "CHRISTIANITY", day: 9, script: s });
  assert.equal(p.info.script, true);
  assert.deepEqual(p.steps.find((x) => x.type === "match").pairs, s.games.match.pairs);
  assert.ok(p.steps.some((x) => x.type === "order"), "the teach heads make the order game");
  assert.equal(p.steps.filter((x) => ["myth", "fork", "original", "trapdoor"].includes(x.type)).length, 1);
  assert.equal(p.steps.at(-1).type, "tally");
  assert.equal(new Set(p.steps.map((x) => x.id)).size, p.steps.length);
  assert.ok(p.steps.some((x) => x.type === "beat" && /yesterday: deliver us/i.test(x.text)));
  // without a script, nothing changes
  assert.deepEqual(planDay({ wing: "CHRISTIANITY", day: 9, script: null }).steps, plain.steps);
  // a script for a different day is ignored
  assert.deepEqual(planDay({ wing: "CHRISTIANITY", day: 9, script: example() }).steps, plain.steps);
  // levels still apply on top
  const hi = planDay({ wing: "CHRISTIANITY", day: 9, script: s, level: 4 });
  assert.ok(hi.steps.some((x) => x.type === "scenes") && hi.steps.at(-1).type === "tally");
});

test("planDay with a script on days 1–7 speaks the script's practice, not the fixed line", () => {
  const p = planDay({ wing: "CHRISTIANITY", day: 1, script: example() });
  const practice = p.steps.filter((x) => x.type === "beat" && /practice/.test(x.seg)).map((x) => x.text).join(" ");
  assert.match(practice, /One breath with the bell/);
  assert.ok(p.steps.some((x) => x.type === "breath"));
  assert.ok(p.steps.some((x) => x.type === "bet"), "day one keeps its bet");
});

// ─── the loader ─────────────────────────────────────────────────────────────
function fakeServer(files) {
  const calls = [];
  const fetch = async (url) => {
    calls.push(url);
    const path = url.replace(/^\/lessons\//, "").replace(/\?.*$/, "");
    if (!(path in files)) return { ok: false, json: async () => null };
    return { ok: true, json: async () => JSON.parse(JSON.stringify(files[path])) };
  };
  return { fetch, calls };
}
const week = (hash, days) => ({ format: "ih-lesson/1", door: "CHRISTIANITY", chunk: "001", hash, days });
const manifest = (hash) => ({ format: "ih-lesson/1", doors: { CHRISTIANITY: { days: 1, chunks: { "001": hash } } } });
const memStore = () => { const m = new Map(); return { m, get: async (k) => m.get(k) ?? null, set: async (k, v) => { m.set(k, v); } }; };

test("week files: days 1–7 are 001, 8–14 are 002, day 1791 is 256", () => {
  assert.equal(chunkOf(1), "001");
  assert.equal(chunkOf(7), "001");
  assert.equal(chunkOf(8), "002");
  assert.equal(chunkOf(1791), "256");
  assert.equal(chunkPath("CHRISTIANITY", 22), "christianity/004.json");
});

test("lessonScript fetches the week once, returns the day, and null for a day with no script", async () => {
  resetLessonCache();
  const s = compileScript(example());
  const { fetch, calls } = fakeServer({ "manifest.json": manifest("abc"), "christianity/001.json": week("abc", { 1: s }) });
  const got = await lessonScript("christianity", 1, { fetch });
  assert.equal(got.word, "communion");
  assert.equal(got.door, "CHRISTIANITY");
  assert.equal(await lessonScript("CHRISTIANITY", 2, { fetch }), null, "same week, no script for day 2");
  assert.equal(calls.filter((u) => u.includes("001.json")).length, 1, "the week is fetched once");
  assert.equal(await lessonScript("CHRISTIANITY", 30, { fetch }), null, "no week file at all");
  assert.equal(await lessonScript("NOPE", 1, { fetch }), null);
  assert.equal(await lessonScript("CHRISTIANITY", 0, { fetch }), null);
});

test("lessonScript works offline from what it kept, and never throws", async () => {
  resetLessonCache();
  const s = compileScript(example());
  const store = memStore();
  const online = fakeServer({ "manifest.json": manifest("abc"), "christianity/001.json": week("abc", { 1: s }) });
  assert.ok(await lessonScript("CHRISTIANITY", 1, { fetch: online.fetch, store }));
  assert.equal(store.m.size, 1, "the week is kept");
  resetLessonCache(); // a new app session, no network
  const offline = async () => { throw new Error("offline"); };
  assert.equal((await lessonScript("CHRISTIANITY", 1, { fetch: offline, store }))?.word, "communion");
  resetLessonCache();
  assert.equal(await lessonScript("CHRISTIANITY", 1, { fetch: offline }), null, "nothing kept: the outline lesson");
  resetLessonCache();
  const broken = async () => ({ ok: true, json: async () => { throw new Error("bad json"); } });
  assert.equal(await lessonScript("CHRISTIANITY", 1, { fetch: broken }), null);
});

test("lessonScript replaces a kept week when the manifest says it changed", async () => {
  resetLessonCache();
  const store = memStore();
  const s = compileScript(example());
  store.m.set("ih:lessons:CHRISTIANITY:001", week("old", { 1: { ...s, carry: "old line" } }));
  const { fetch, calls } = fakeServer({ "manifest.json": manifest("new"), "christianity/001.json": week("new", { 1: s }) });
  assert.equal((await lessonScript("CHRISTIANITY", 1, { fetch, store })).carry, "a meal is a memory");
  assert.ok(calls.some((u) => u === "/lessons/christianity/001.json?v=new"), "cache-busted by hash");
  assert.equal(store.m.get("ih:lessons:CHRISTIANITY:001").hash, "new");
});

test("the build compiles passing scripts into week files and a manifest, without review notes", async () => {
  const { build } = await import("../scripts/build-lessons.mjs");
  const out = mkdtempSync(join(tmpdir(), "ih-lessons-"));
  try {
    const r = build({ out, log: () => {} });
    assert.ok(r.days >= 1);
    const m = JSON.parse(readFileSync(join(out, "manifest.json"), "utf8"));
    assert.ok(m.doors.CHRISTIANITY.chunks["001"]);
    const w = JSON.parse(readFileSync(join(out, "christianity", "001.json"), "utf8"));
    assert.equal(w.hash, m.doors.CHRISTIANITY.chunks["001"]);
    assert.equal(w.days["1"].word, "communion");
    assert.equal(w.days["1"].review, "pending");
    assert.ok(!JSON.stringify(w).includes("\"notes\""), "review notes stay in docs/");
    assert.ok(readdirSync(join(out, "christianity")).every((f) => /^\d{3}\.json$/.test(f)));
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
