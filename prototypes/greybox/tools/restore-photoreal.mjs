// Restores the photoreal ("original") art as the default for every repainted film (owner's cinema standard, 2026-11-08).
//   node tools/restore-photoreal.mjs            dry run: prints what it would do, changes nothing
//   node tools/restore-photoreal.mjs --apply    does it, and writes tools/restore-photoreal.log.json
// For each art/sacred/<id>/ with a pre-repaint/ folder:
//   1. the repaint look comes from films/wave1/repaint-<door>.json (per film; `clips` names the folder when it differs from id)
//   2. repainted clips/*.mp4|webp (those that differ from pre-repaint/) move to looks/<look>/
//   3. pre-repaint/*.mp4|webp copy back into clips/ (.png stills are skipped)
//   4. looks/looks.json gains the look, keeps the others, and gets "default": "original"
// Never touches w1-christianity-1 (deliberate face fix). Skips any film with a file modified in the last 2 minutes (painters).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const GB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SACRED = path.join(GB, "art/sacred"), W1 = path.join(GB, "films/wave1");
const APPLY = process.argv.includes("--apply");
const NEVER = new Set(["w1-christianity-1"]);
const FRESH_MS = 2 * 60 * 1000, now = Date.now();
const MEDIA = /\.(mp4|webp)$/i;

// film folder -> { look, door }
const lookOf = {};
for (const f of fs.readdirSync(W1).filter((f) => /^repaint-.+\.json$/.test(f))) {
  const door = f.slice(8, -5), J = JSON.parse(fs.readFileSync(path.join(W1, f), "utf8"));
  for (const x of J.films || []) {
    const dir = x.clips ? String(x.clips).replace(/\\/g, "/").replace(/\/clips\/?$/, "").split("/").pop() : x.id;
    if (x.look) lookOf[dir] = { look: x.look, door, id: x.id };
  }
}
const md5 = (p) => crypto.createHash("md5").update(fs.readFileSync(p)).digest("hex");
const same = (a, b) => fs.existsSync(a) && fs.existsSync(b) && fs.statSync(a).size === fs.statSync(b).size && md5(a) === md5(b);
function newest(dir) { let t = 0; for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); t = Math.max(t, e.isDirectory() ? newest(p) : fs.statSync(p).mtimeMs); } return t; }

const log = { when: new Date().toISOString(), apply: APPLY, restored: [], unchanged: [], skipped: [] };
for (const id of fs.readdirSync(SACRED).sort()) {
  const F = path.join(SACRED, id), PRE = path.join(F, "pre-repaint"), CL = path.join(F, "clips");
  if (!fs.existsSync(PRE)) continue;
  if (NEVER.has(id)) { log.skipped.push({ id, why: "protected (face fix)" }); continue; }
  const L = lookOf[id];
  if (!L) { log.skipped.push({ id, why: "no repaint look listed in films/wave1/repaint-*.json" }); continue; }
  if (now - newest(F) < FRESH_MS) { log.skipped.push({ id, why: "a file changed in the last 2 minutes (painter may be working)" }); continue; }
  const LD = path.join(F, "looks", L.look);
  const names = [...new Set([...fs.readdirSync(PRE), ...(fs.existsSync(CL) ? fs.readdirSync(CL) : [])].filter((n) => MEDIA.test(n)))].sort();
  const moves = [], restores = [], conflicts = [];
  for (const n of names) {
    const c = path.join(CL, n), p = path.join(PRE, n), l = path.join(LD, n);
    if (fs.existsSync(c) && fs.existsSync(p) && same(c, p)) continue;          // never repainted (or already restored)
    if (fs.existsSync(c)) {
      if (fs.existsSync(l) && !same(c, l)) { conflicts.push(n); continue; }
      moves.push(n);
    }
    if (fs.existsSync(p)) restores.push(n);
  }
  if (conflicts.length) { log.skipped.push({ id, why: "looks/" + L.look + "/ already holds different files: " + conflicts.join(", ") }); continue; }
  const lj = path.join(F, "looks", "looks.json");
  let J = {}; try { if (fs.existsSync(lj)) J = JSON.parse(fs.readFileSync(lj, "utf8")); } catch (e) { log.skipped.push({ id, why: "looks.json unreadable: " + e.message }); continue; }
  // the look is listed only when it is complete (every shot's webp, and its mp4 wherever the shot has one): never a half-finished look.
  // tools/looks-check.mjs applies the same rule to every film.
  const after = new Set([...(fs.existsSync(LD) ? fs.readdirSync(LD) : []), ...moves]);
  const shots = fs.readdirSync(PRE).filter((n) => n.endsWith(".webp")).map((n) => n.slice(0, -5));
  const hasLook = shots.length && shots.every((b) => after.has(b + ".webp") && (!fs.existsSync(path.join(PRE, b + ".mp4")) || after.has(b + ".mp4")));
  const looks = Array.isArray(J.looks) ? J.looks.slice() : [];
  if (hasLook && !looks.includes(L.look)) looks.push(L.look);
  if (!hasLook && looks.includes(L.look)) looks.splice(looks.indexOf(L.look), 1);
  const J2 = Object.assign({}, J, { default: "original", looks });
  const jsonChange = JSON.stringify(J2) !== JSON.stringify(J) && (looks.length || fs.existsSync(lj));
  if (!moves.length && !restores.length && !jsonChange) { log.unchanged.push(id); continue; }
  if (APPLY) {
    if (moves.length) fs.mkdirSync(LD, { recursive: true });
    for (const n of moves) { const c = path.join(CL, n), l = path.join(LD, n); if (fs.existsSync(l)) fs.unlinkSync(c); else fs.renameSync(c, l); }
    fs.mkdirSync(CL, { recursive: true });
    for (const n of restores) fs.copyFileSync(path.join(PRE, n), path.join(CL, n));
    if (jsonChange) { fs.mkdirSync(path.dirname(lj), { recursive: true }); if (fs.existsSync(lj) && !fs.existsSync(lj.replace(/.json$/, ".pre-cinema.json"))) fs.copyFileSync(lj, lj.replace(/.json$/, ".pre-cinema.json")); fs.writeFileSync(lj, JSON.stringify(J2)); }
  }
  log.restored.push({ id, door: L.door, look: L.look, moved: moves.length, restored: restores.length, looks: looks.join(",") });
}
const byDoor = {}; for (const r of log.restored) byDoor[r.door] = (byDoor[r.door] || 0) + 1;
for (const r of log.restored) console.log((APPLY ? "restored " : "would restore ") + r.id.padEnd(22) + " " + r.door.padEnd(13) + " look=" + r.look.padEnd(11) + " moved " + r.moved + ", restored " + r.restored + " -> looks: " + r.looks);
for (const s of log.skipped) console.log("SKIP " + s.id + ": " + s.why);
console.log("unchanged (clips already match pre-repaint): " + log.unchanged.length + (log.unchanged.length ? " (" + log.unchanged.join(", ") + ")" : ""));
console.log("by door: " + JSON.stringify(byDoor) + "  total " + log.restored.length + (APPLY ? "" : "  [dry run, nothing changed]"));
log.byDoor = byDoor;
if (APPLY) fs.writeFileSync(path.join(GB, "tools/restore-photoreal.log.json"), JSON.stringify(log, null, 1));
