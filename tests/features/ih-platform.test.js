import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createIH, STORAGE_KEY } from "../../src/platform/ih.js";
import { applyPlatformPatch, EDITS, SOURCE } from "../../scripts/apply-platform-patch.mjs";

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
}
const at = (iso) => () => new Date(iso);
const LA = "America/Los_Angeles";

test("a fresh device has nothing saved; a finished sit survives a reload", () => {
  const storage = memoryStorage();
  const ih = createIH({ storage, now: at("2026-10-18T20:00:00-07:00"), timeZone: LA, search: "" });
  assert.equal(ih.load(), null);
  ih.save({ onboarded: true, homeWing: "BUDDHISM" });
  const r = ih.completeSit({ door: "BUDDHISM" });
  assert.equal(r.showedUp, 1);
  const again = createIH({ storage, now: at("2026-10-18T21:00:00-07:00"), timeZone: LA, search: "" }).load();
  assert.equal(again.showedUp, 1);
  assert.equal(again.ui.onboarded, true);
  assert.equal(again.ui.homeWing, "BUDDHISM");
  assert.equal(again.paths.BUDDHISM.done, true, "same evening: still done");
});

test("next morning the door is on day 2 and the count is untouched until the next sit", () => {
  const storage = memoryStorage();
  createIH({ storage, now: at("2026-10-18T20:00:00-07:00"), timeZone: LA }).completeSit({ door: "HINDUISM" });
  const ih = createIH({ storage, now: at("2026-10-19T07:00:00-07:00"), timeZone: LA });
  const s = ih.load();
  assert.deepEqual([s.paths.HINDUISM.day, s.paths.HINDUISM.done, s.showedUp], [2, false, 1]);
  assert.equal(ih.completeSit({ door: "HINDUISM" }).showedUp, 2);
});

test("the UI cannot overwrite the day count", () => {
  const storage = memoryStorage();
  const ih = createIH({ storage, now: at("2026-10-18T20:00:00-07:00"), timeZone: LA });
  ih.completeSit({ door: "HINDUISM" });
  ih.save({ showedUp: 50, dates: [], paths: { HINDUISM: { day: 1, done: true } } });
  const s = JSON.parse(storage.getItem(STORAGE_KEY));
  assert.equal(s.showedUp, 1);
  assert.equal(s.dates.length, 1);
  assert.equal(s.paths.HINDUISM.lastDate, "2026-10-18", "UI saves keep the engine's lastDate");
});

test("goal, welcome back, flags, demo and honest voice labels", () => {
  const storage = memoryStorage();
  let ih = createIH({ storage, now: at("2026-10-18T20:00:00-07:00"), timeZone: LA, search: "?flags=guide-live,accounts&demo=1" });
  ih.completeSit({ door: "HINDUISM" });
  ih.setGoal(7);
  assert.deepEqual(ih.goalProgress(), { days: 7, done: 1, reached: false });
  assert.equal(ih.flag("guide-live"), true);
  assert.equal(ih.flag("nope"), false);
  assert.equal(ih.demo, true);
  const v = ih.voiceLabel("BUDDHISM", "Orlando");
  assert.equal(v.licensed, false);
  assert.equal(v.short, "the house voice");
  assert.doesNotMatch(v.claim, /licensed voice, used with their permission/);
  ih = createIH({ storage, now: at("2026-10-22T20:00:00-07:00"), timeZone: LA, search: "" });
  assert.equal(ih.demo, false);
  assert.equal(ih.welcomeBack(), true);
  ih.markWelcomedBack();
  assert.equal(ih.welcomeBack(), false);
});

test("blocked storage keeps the app running from memory", () => {
  const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() {} };
  const ih = createIH({ storage: blocked, now: at("2026-10-18T20:00:00-07:00"), timeZone: LA });
  assert.equal(ih.completeSit({ door: "HINDUISM" }).showedUp, 1);
});

test("the platform patch applies cleanly to the published build and every hook is guarded", () => {
  const out = applyPlatformPatch(readFileSync(SOURCE, "utf8"));
  assert.ok(out.startsWith("// GENERATED"));
  assert.ok(EDITS.length >= 20);
  assert.match(out, /const IH = typeof window !== "undefined" \? window\.IH \|\| null : null;/);
  assert.match(out, /useState\(IH \? \(\(saved && saved\.showedUp\) \|\| 0\) : 1\)/);
  const count = (s) => out.split(s).length - 1;
  assert.equal(count("Demo: skip to tomorrow"), 2);
  assert.equal(count('window.IH.demo) && <Btn kind="light" onClick={onNext}>Demo: skip to tomorrow'), 2, "both demo buttons are gated");
  assert.equal(count("It's a licensed voice, used with their permission"), 1, "the claim survives only in the no-IH fallback");
  assert.equal(count("<TableCard wing={wing} day={day} />}"), 1, "made-up table members are gated");
  assert.equal(count('window.IH.flag("live-read")'), 1);
  assert.equal(count('window.IH.flag("events")'), 1);
  assert.equal(count("· read by {(typeof window"), 2, "pick card and Together door card");
});
