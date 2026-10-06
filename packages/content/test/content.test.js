import test from "node:test";
import assert from "node:assert/strict";
import { data, DOORS, planDay, lessonInfo, icon } from "../src/index.js";

const WINGS = DOORS.map(([, w]) => w);

test("eight doors, no fake counts left in the data", () => {
  assert.equal(WINGS.length, 8);
  assert.ok(DOORS.every((row) => row.length === 2));
  assert.doesNotMatch(JSON.stringify(data), /data:image\//, "no inline images remain");
});

test("every door builds all 21 Camp 1 days with a tally and real sit times", () => {
  for (const wing of WINGS) {
    for (let day = 1; day <= 21; day++) {
      const p = planDay({ wing, day });
      assert.ok(p.steps.length >= 5, `${wing} day ${day} has steps`);
      assert.equal(p.steps.at(-1).type, "tally", `${wing} day ${day} ends on the tally`);
      assert.ok(p.word, `${wing} day ${day} has a word`);
      for (const s of p.steps.filter((x) => x.type === "sit")) assert.ok(s.secs >= 45, "no demo-speed sits");
    }
  }
});

test("pacing: day one keeps call it; the other four arrive on days 2-5, marked new, nothing lost", () => {
  for (const wing of WINGS) {
    const d1 = planDay({ wing, day: 1 }).steps.map((s) => s.type);
    for (const t of ["myth", "fork", "original", "trapdoor"]) assert.ok(!d1.includes(t), `${wing} day 1 has no ${t}`);
  }
  const seen = new Set();
  for (let day = 2; day <= 5; day++) for (const s of planDay({ wing: "HINDUISM", day }).steps) if (s.newToday) seen.add(`${day}:${s.type}`);
  assert.deepEqual([...seen].sort(), ["2:myth", "3:fork", "4:original", "5:trapdoor"]);
  const d2 = planDay({ wing: "HINDUISM", day: 2 }).steps;
  assert.equal(d2.at(-1).type, "tally");
  assert.equal(new Set(d2.map((s) => s.id)).size, d2.length, "ids stay unique");
  assert.ok(planDay({ wing: "HINDUISM", day: 1 }).steps.some((s) => s.type === "bet"), "call it stays on day one");
});

test("day 1 opens with the welcome; later camps still build", () => {
  const d1 = planDay({ wing: "SIKHISM", day: 1 });
  assert.ok(d1.steps.some((s) => s.seg === "a welcome"));
  assert.ok(lessonInfo("BUDDHISM", 40).later);
  assert.equal(planDay({ wing: "BUDDHISM", day: 40 }).steps.at(-1).type, "tally");
});

test("icons point at extracted art, not base64", () => {
  for (const wing of WINGS) assert.match(JSON.stringify(icon(wing)), /art:|^\{/);
});

test("original-script detectors survive extraction (native words show on the strand)", () => {
  assert.ok(data.SCRIPT_OF.HINDUISM instanceof RegExp);
  assert.doesNotThrow(() => planDay({ wing: "HINDUISM", day: 3 }));
});

// Camp one's guess answers with what the word means, never the day's carry line, and exactly one choice is right
// (owner, 2026-09-30: "Father → you're not addressing a stranger", al-Fatiha with no right choice at all).
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
const LESSONS = fileURLToPath(new URL("../../../apps/app/public/lessons/", import.meta.url));
function scriptFor(wing, day) {
  const f = `${LESSONS}${wing.toLowerCase()}/${String(Math.floor((day - 1) / 7) + 1).padStart(3, "0")}.json`;
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")).days?.[String(day)] || null : null;
}
const bareText = (s) => String(s || "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

test("camp one's guess: one right, specific answer (not the carry line) and distinct wrong ones, script or not", () => {
  for (const wing of WINGS) {
    for (let day = 2; day <= 21; day++) {
      for (const script of [null, scriptFor(wing, day)]) {
        for (const level of [0, 1, 3, 5]) {
          const p = planDay({ wing, day, script, level });
          const g = p.steps.find((s) => s.type === "guess");
          if (!g) continue;
          const where = `${wing} day ${day} level ${level}${script ? " (script)" : ""}`;
          assert.notEqual(bareText(g.answer), bareText(p.carry), `${where}: the answer is the carry line`);
          assert.equal(g.options.filter((o) => o === g.answer).length, 1, `${where}: exactly one right answer`);
          assert.ok(g.options.length >= 3, `${where}: at least three choices`);
          assert.equal(new Set(g.options.map(bareText)).size, g.options.length, `${where}: choices are distinct`);
        }
      }
    }
  }
});

test("the named quizzes: Father, grace and al-Fatiha answer with their meaning", () => {
  const guess = (wing, day) => planDay({ wing, day, script: scriptFor(wing, day) }).steps.find((s) => s.type === "guess");
  // first camp reordered 2026-10-06: the Lord's Prayer is Christianity day 11, al-Fatiha Islam day 2; kingdom left camp one
  assert.match(guess("CHRISTIANITY", 11).answer, /opening with Father/);
  assert.match(guess("CHRISTIANITY", 9).answer, /gift you didn't earn/);
  assert.match(guess("ISLAM", 2).answer, /^the opening/);
  assert.ok(!guess("ISLAM", 2).options.includes("in the name of the merciful"));
});
