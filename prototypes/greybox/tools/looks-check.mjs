// Keeps every film's looks/looks.json honest, so a player never shows a half-finished look (2026-11-08).
//   node tools/looks-check.mjs            dry run
//   node tools/looks-check.mjs --apply    writes the looks.json changes (old file kept once as looks.pre-cinema.json)
// For each art/sacred/<id>/looks/looks.json:
//   - a look stays listed only if looks/<look>/ has every shot: a .webp for each clips/*.webp, and a .mp4 wherever clips/ has that shot's .mp4
//   - wave-1 new films (w1-*) whose looks/cinema/ is complete get "cinema" listed and made the default (the photoreal cinema art);
//     "original" then means their stylized clips/
//   - if the default look is not complete (or not listed), the default falls back to "original"
// Also moves two known-wrong repainted clips out of looks/ (painter's note): they must never play.
// Skips any film with a file modified in the last 2 minutes (painters may be writing).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GB = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SACRED = path.join(GB, "art/sacred");
const APPLY = process.argv.includes("--apply");
const FRESH_MS = 2 * 60 * 1000, now = Date.now();
const WRONG = [["bud-alms", "BA1-Return-Home"], ["sik-crown", "SC1-Patna-River"]];
function newest(dir) { let t = 0; for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); t = Math.max(t, e.isDirectory() ? newest(p) : fs.statSync(p).mtimeMs); } return t; }
const ls = (d) => (fs.existsSync(d) ? fs.readdirSync(d) : []);

const log = { when: new Date().toISOString(), apply: APPLY, quarantined: [], changed: [], skipped: [] };
// 1. the two wrong clips: out of looks/, into <id>/wrong-repaint/ (kept, never played)
for (const [id, base] of WRONG) {
  const LD = path.join(SACRED, id, "looks");
  for (const look of ls(LD).filter((l) => fs.statSync(path.join(LD, l)).isDirectory())) for (const ext of ["mp4", "webp"]) {
    const p = path.join(LD, look, base + "." + ext); if (!fs.existsSync(p)) continue;
    const pre = path.join(SACRED, id, "pre-repaint", base + "." + ext), clip = path.join(SACRED, id, "clips", base + "." + ext);
    // only the repainted copy is wrong: if the looks/ copy is the old photoreal art it isn't the repaint
    if (fs.existsSync(pre) && fs.statSync(pre).size === fs.statSync(p).size && fs.readFileSync(pre).equals(fs.readFileSync(p))) continue;
    log.quarantined.push(path.relative(GB, p).replace(/\\/g, "/"));
    if (APPLY) { const q = path.join(SACRED, id, "wrong-repaint", look); fs.mkdirSync(q, { recursive: true }); fs.renameSync(p, path.join(q, base + "." + ext)); }
    void clip;
  }
}
// 2. every looks.json
for (const id of fs.readdirSync(SACRED).sort()) {
  const F = path.join(SACRED, id), CL = path.join(F, "clips"), LD = path.join(F, "looks"), lj = path.join(LD, "looks.json");
  if (!fs.existsSync(CL)) continue;
  const hasCinema = id.startsWith("w1-") && fs.existsSync(path.join(LD, "cinema"));
  if (!fs.existsSync(lj) && !hasCinema) continue;
  if (now - newest(F) < FRESH_MS) { log.skipped.push({ id, why: "a file changed in the last 2 minutes" }); continue; }
  let J = {}; try { if (fs.existsSync(lj)) J = JSON.parse(fs.readFileSync(lj, "utf8")); } catch (e) { log.skipped.push({ id, why: "looks.json unreadable" }); continue; }
  const clips = ls(CL), shots = clips.filter((n) => n.endsWith(".webp")).map((n) => n.slice(0, -5));
  if (!shots.length) { log.skipped.push({ id, why: "no original clips yet" }); continue; }
  const missing = (look) => { const have = new Set(ls(path.join(LD, look))); return shots.filter((b) => !have.has(b + ".webp") || (clips.includes(b + ".mp4") && !have.has(b + ".mp4"))); };
  const before = Array.isArray(J.looks) ? J.looks.slice() : [];
  const cand = before.concat(hasCinema && !before.includes("cinema") ? ["cinema"] : []);
  const keep = [], dropped = [];
  for (const l of cand) { const m = missing(l); if (m.length) dropped.push(l + " (missing " + m.join(", ") + ")"); else keep.push(l); }
  let def = J.default || "original";
  if (id.startsWith("w1-") && keep.includes("cinema")) def = "cinema";
  if (def !== "original" && !keep.includes(def)) def = "original";
  const J2 = Object.assign({}, J, { default: def, looks: keep });
  if (JSON.stringify(J2) === JSON.stringify(J)) continue;
  log.changed.push({ id, default: (J.default || "") + " -> " + def, looks: before.join(",") + " -> " + keep.join(","), dropped });
  if (APPLY) {
    fs.mkdirSync(LD, { recursive: true });
    const bak = path.join(LD, "looks.pre-cinema.json"); if (fs.existsSync(lj) && !fs.existsSync(bak)) fs.copyFileSync(lj, bak);
    fs.writeFileSync(lj, JSON.stringify(J2));
  }
}
for (const q of log.quarantined) console.log((APPLY ? "moved out " : "would move out ") + q);
for (const c of log.changed) console.log((APPLY ? "fixed " : "would fix ") + c.id.padEnd(22) + " default " + c.default + " | looks " + c.looks + (c.dropped.length ? "\n    dropped: " + c.dropped.join("; ") : ""));
for (const s of log.skipped) console.log("SKIP " + s.id + ": " + s.why);
console.log((APPLY ? "" : "[dry run] ") + log.changed.length + " looks.json changed, " + log.quarantined.length + " wrong clips moved out");
if (APPLY) fs.writeFileSync(path.join(GB, "tools/looks-check.log.json"), JSON.stringify(log, null, 1));
