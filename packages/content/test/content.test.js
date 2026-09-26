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
