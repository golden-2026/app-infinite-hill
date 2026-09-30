// Finding and reading the full lesson scripts: docs/curriculum/<door>/scripts/y<N>/day-NNNN.json.
// Shared by validate-scripts.mjs and build-lessons.mjs.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { DOOR_KEYS } from "../src/lesson-script.js";

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(here, "..", "..", "..");
export const CURRICULUM = join(ROOT, "docs", "curriculum");
export const YEAR_OF = (d) => (d <= 331 ? 1 : 2 + Math.floor((d - 332) / 365));
export const fileFor = (door, day) => join(CURRICULUM, door.toLowerCase(), "scripts", `y${YEAR_OF(day)}`, `day-${String(day).padStart(4, "0")}.json`);

/** Every script file on disk: [{ door, day, file, rel, script | null, parseError | null }], sorted by door then day. */
export function listScripts({ doors = DOOR_KEYS } = {}) {
  const out = [];
  for (const door of doors) {
    const dir = join(CURRICULUM, door.toLowerCase(), "scripts");
    if (!existsSync(dir)) continue;
    for (const y of readdirSync(dir).filter((n) => /^y[1-5]$/.test(n)).sort()) {
      for (const f of readdirSync(join(dir, y)).filter((n) => /^day-\d{4}\.json$/.test(n)).sort()) {
        const file = join(dir, y, f);
        const day = Number(f.slice(4, 8));
        let script = null, parseError = null;
        try { script = JSON.parse(readFileSync(file, "utf8")); } catch (e) { parseError = e.message; }
        const expectedYear = `y${YEAR_OF(day)}`;
        out.push({ door, day, file, rel: relative(ROOT, file).replace(/\\/g, "/"), script, parseError, wrongYear: y !== expectedYear ? expectedYear : null });
      }
    }
  }
  return out.sort((a, b) => (a.door === b.door ? a.day - b.day : a.door.localeCompare(b.door)));
}
