// The app serves lessons from the compiled week files (apps/app/public/lessons/<door>/NNN.json), not from the scripts.
// A script edited without re-shipping its week leaves the app on the old lesson (it happened on 2026-10-06: four
// paths still served their old day one). Every compiled day must match its script word for word.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const DOORS = ["hinduism", "buddhism", "christianity", "catholic", "judaism", "islam", "sikhism", "spiritual"];

for (const door of DOORS) {
  test(`${door}: compiled week files match the scripts`, () => {
    const dir = `${root}apps/app/public/lessons/${door}`;
    const stale = [];
    for (const f of readdirSync(dir).filter((x) => /^\d+\.json$/.test(x))) {
      const week = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
      for (const [day, v] of Object.entries(week.days)) {
        const path = ["y1", "y2", "y3", "y4", "y5"].map((y) => `${root}docs/curriculum/${door}/scripts/${y}/day-${day.padStart(4, "0")}.json`).find(existsSync);
        if (!path) continue;
        const s = JSON.parse(readFileSync(path, "utf8"));
        if (s.word !== v.word || JSON.stringify(s.segments) !== JSON.stringify(v.segments)) stale.push(day);
      }
    }
    assert.deepEqual(stale, [], `re-ship ${door}: these days changed since the week files were built`);
  });
}
