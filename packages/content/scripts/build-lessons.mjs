// Compiles the full lesson scripts (docs/curriculum/<door>/scripts/y<N>/day-NNNN.json) into what the app fetches:
//   apps/app/public/lessons/manifest.json           which weeks exist per door, each with a content hash
//   apps/app/public/lessons/<door>/<week>.json      one week of one door (days 1–7 → 001.json, 8–14 → 002.json …)
// Only scripts that pass the format check ship; the rest are listed and left out (their days keep the outline-built
// lesson). Review notes and writer metadata stay in docs/ and never ship.
//   node packages/content/scripts/build-lessons.mjs [--out <dir>] [--check]    (--check: report, write nothing)
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CHUNK_DAYS, FORMAT, checkScript, chunkOf, compileScript } from "../src/lesson-script.js";
import { lessonInfo } from "../src/index.js";
import { ROOT, listScripts } from "./lesson-files.mjs";

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const OUT = arg("--out") || join(ROOT, "apps", "app", "public", "lessons");
const check = process.argv.includes("--check");

export function build({ out = OUT, write = true, log = console.log } = {}) {
  const chunks = new Map(); // "DOOR/001" → { door, chunk, days: {} }
  const skipped = [];
  for (const f of listScripts()) {
    if (!f.script) { skipped.push(`${f.rel}: ${f.parseError}`); continue; }
    const info = lessonInfo(f.door, f.day);
    const r = checkScript(f.script, { index: info ? { title: info.title, word: info.word, carry: info.carry } : null, door: f.door, day: f.day });
    if (r.errors.length || f.wrongYear) { skipped.push(`${f.rel}: ${r.errors[0] || "wrong year folder"}`); continue; }
    const key = `${f.door}/${chunkOf(f.day)}`;
    if (!chunks.has(key)) chunks.set(key, { door: f.door, chunk: chunkOf(f.day), days: {} });
    chunks.get(key).days[String(f.day)] = compileScript(f.script);
  }
  const manifest = { format: FORMAT, chunkDays: CHUNK_DAYS, built: new Date().toISOString().slice(0, 10), doors: {} };
  let bytes = 0, files = 0, days = 0;
  if (write) {
    // a clean folder each build, so a deleted script never lingers
    if (existsSync(out)) for (const d of readdirSync(out)) rmSync(join(out, d), { recursive: true, force: true });
    mkdirSync(out, { recursive: true });
  }
  for (const c of [...chunks.values()].sort((a, b) => (a.door + a.chunk).localeCompare(b.door + b.chunk))) {
    const body = { format: FORMAT, door: c.door, chunk: c.chunk, days: c.days };
    const text = JSON.stringify(body);
    const hash = createHash("sha1").update(text).digest("hex").slice(0, 10);
    const final = JSON.stringify({ ...body, hash });
    const d = (manifest.doors[c.door] ||= { days: 0, chunks: {} });
    d.chunks[c.chunk] = hash;
    d.days += Object.keys(c.days).length;
    days += Object.keys(c.days).length;
    bytes += Buffer.byteLength(final);
    files++;
    if (write) {
      mkdirSync(join(out, c.door.toLowerCase()), { recursive: true });
      writeFileSync(join(out, c.door.toLowerCase(), `${c.chunk}.json`), final);
    }
  }
  if (write) writeFileSync(join(out, "manifest.json"), JSON.stringify(manifest));
  log(`${days} lessons in ${files} week files, ${(bytes / 1024).toFixed(0)} KB${write ? ` → ${out}` : " (check only)"}`);
  for (const [door, d] of Object.entries(manifest.doors)) log(`  ${door}: ${d.days} days, weeks ${Object.keys(d.chunks).join(", ")}`);
  if (skipped.length) { log(`left out ${skipped.length} (they keep the outline-built lesson):`); for (const s of skipped) log(`  ${s}`); }
  return { manifest, days, files, bytes, skipped };
}

if (/build-lessons\.mjs$/.test(process.argv[1] || "")) build({ write: !check });
