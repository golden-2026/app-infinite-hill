// Merge the weekly "same idea, another door" parts (docs/curriculum/neighbors/parts/*.json, written and fact-checked by
// the neighbors workflow) into one file per door: docs/curriculum/neighbors/<door>.json and apps/app/public/neighbors/.
//   node scripts/learning/merge-neighbors.mjs
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
const root = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const parts = join(root, "docs/curriculum/neighbors/parts");
const out = join(root, "docs/curriculum/neighbors"), pub = join(root, "apps/app/public/neighbors");
mkdirSync(pub, { recursive: true });
const byDoor = {};
for (const f of existsSync(parts) ? readdirSync(parts) : []) {
  if (!f.endsWith(".json")) continue;
  const j = JSON.parse(readFileSync(join(parts, f), "utf8"));
  (byDoor[j.door] ??= []).push(...(j.items || []).filter((i) => Number.isInteger(i.day) && Array.isArray(i.neighbors) && i.neighbors.length));
}
for (const [door, items] of Object.entries(byDoor)) {
  items.sort((a, b) => a.day - b.day);
  const data = JSON.stringify({ door, items }, null, 1) + "\n";
  writeFileSync(join(out, `${door.toLowerCase()}.json`), data);
  writeFileSync(join(pub, `${door.toLowerCase()}.json`), data);
  console.log(door, items.length, "weeks");
}
