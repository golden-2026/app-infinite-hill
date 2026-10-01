// node site-swap.mjs name1 name2 ... — replace any copy of the old still (from mascot3/backup-art) embedded in site.html
import fs from "node:fs";
const p = "../apps/app/public/site.html";
let site = fs.readFileSync(p, "utf8");
for (const n of process.argv.slice(2)) {
  const old = fs.readFileSync(`mascot3/backup-art/guy-${n}.webp`).toString("base64");
  const neu = fs.readFileSync(`../packages/brand/art/guy-${n}.webp`).toString("base64");
  const c = site.split(old).length - 1;
  if (c) { site = site.split(old).join(neu); console.log(n, "replaced", c); }
}
fs.writeFileSync(p, site);
