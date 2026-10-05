// Make a lesson's story pictures with OpenAI's image model, using the house character sheet as a reference so Nani,
// Anika and Dev stay the same from panel to panel (docs/learning/ART_DIRECTION.md).
//
//   node scripts/learning/make-panels.mjs <panels.json> [--only p3,p5] [--dry]
//
// panels.json: { "out": "docs/learning/sample-day3/img", "refs": ["docs/learning/art/cast.png"],
//                "style": "…house style line…", "panels": [ { "name": "hook", "prompt": "…" }, … ] }
// Each panel is saved as <out>/<name>.webp (900px wide). Existing files are kept unless named in --only.
// The key is read from the OPENAI_API_KEY environment variable only. It is never printed, logged or written anywhere.
// Optional: OPENAI_IMAGE_MODEL (default gpt-image-1). Check OpenAI's current price list; a week is about 50 images.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require(path.resolve("C:/Users/shset/code/golden-app/atlas/node_modules/sharp"));

const [file] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const only = (process.argv.find((a) => a.startsWith("--only=")) || (process.argv.includes("--only") ? "--only=" + process.argv[process.argv.indexOf("--only") + 1] : "")).replace("--only=", "").split(",").filter(Boolean);
const dry = process.argv.includes("--dry");
if (!file) { console.error("usage: node scripts/learning/make-panels.mjs <panels.json> [--only p3,p5] [--dry]"); process.exit(2); }
const job = JSON.parse(fs.readFileSync(file, "utf8"));
const key = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
if (!key && !dry) { console.error("OPENAI_API_KEY is not set on this computer. See docs/learning/ART_DIRECTION.md (image key)."); process.exit(1); }
fs.mkdirSync(job.out, { recursive: true });

const rules = "No text, letters, numbers or logos anywhere in the image. Plain clothes and shoes with no brand marks. Modest clothing.";
async function one(p) {
  const target = path.join(job.out, `${p.name}.webp`);
  if (fs.existsSync(target) && !only.includes(p.name)) { console.log(`skip ${p.name} (exists)`); return; }
  if (only.length && !only.includes(p.name)) return;
  const prompt = [job.style, p.prompt, rules].filter(Boolean).join("\n");
  if (dry) { console.log(`would make ${p.name}: ${prompt.slice(0, 90)}…`); return; }
  const form = new FormData();
  form.append("model", model);
  form.append("prompt", prompt);
  form.append("size", "1024x1536");
  for (const r of job.refs || []) form.append("image[]", new Blob([fs.readFileSync(r)], { type: "image/png" }), path.basename(r));
  const url = (job.refs || []).length ? "https://api.openai.com/v1/images/edits" : "https://api.openai.com/v1/images/generations";
  const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: (job.refs || []).length ? form : JSON.stringify({ model, prompt, size: "1024x1536" }), ...((job.refs || []).length ? {} : { headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } }) });
  if (!res.ok) { const t = await res.text(); throw new Error(`${p.name}: ${res.status} ${t.slice(0, 300)}`); }
  const b64 = (await res.json()).data?.[0]?.b64_json;
  if (!b64) throw new Error(`${p.name}: no image in the response`);
  await sharp(Buffer.from(b64, "base64")).resize({ width: 900 }).webp({ quality: 82 }).toFile(target);
  console.log(`made ${p.name}`);
}
for (const p of job.panels) {
  try { await one(p); } catch (e) { console.error(String(e.message || e)); process.exitCode = 1; }
}
