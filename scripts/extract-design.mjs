#!/usr/bin/env node
// extract-design: turns a published one-file build (design/infinitehill_vNNN.jsx) into the Expo app's inputs.
//   packages/content/generated/data.js     the build's content and tokens, images replaced by "art:<key>"
//   packages/content/generated/logic.js    the build's pure lesson functions, verbatim (compiled JSX-free)
//   packages/brand/art/<key>.<ext>         every image the app uses, decoded from base64
//   packages/brand/art/index.js            art key → require() map for React Native / web
// Usage: node scripts/extract-design.mjs [design/infinitehill_v175.jsx]
// Fails loudly when a listed name is missing or a "pure" function uses JSX or the browser.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transformWithOxc } from "vite";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, process.argv[2] || "design/infinitehill_v175.jsx");
const CONTENT = join(ROOT, "packages/content/generated");
const ART = join(ROOT, "packages/brand/art");

// Content and tokens. Fake numbers (DOORS counts, STATS) are stripped below.
export const DATA = [
  "C", "F", "DUSK", "eyebrow", "h1", "body", "BIO", "ICONS", "DOORS", "CAMPS", "SHARED", "DAY1", "CAMP1_HIN", "CAMP1_ALL", "LATER",
  "HEARD", "WHYS", "KNOW", "QUOTES", "FOCUS", "MOMENTS", "LESSONS", "PLACE_ALL", "PLACEMENT", "NICE", "MISS", "WELCOME", "ADULT",
  "EXPLAIN", "NATIVE", "SCRIPT_OF", "STRAND_WORDS", "REVIEW_Q", "SUN_NOTES", "GUIDE_TEXTS",
  // art sets the app renders (SEEK, CREATORS, STUDIO are never rendered in v175 and are left out)
  "PHOTOS", "SUN_IMG", "GUY", "LOGO_MARK", "KEEPERS", "HILL_FACES",
];
// Pure functions the app reuses as-is.
export const LOGIC = ["pos", "label", "icon", "iconsShared", "camp1", "lessonInfo", "parseDur", "splitBeats", "screenLines", "shuffleSeed", "strip", "buildDay", "native", "skyFor", "faceFor", "trailX", "placeFromScore", "guideFallback"];
// Array literals declared inside components (e.g. the legal pages inside You).
export const INNER_LITERALS = ["LEGAL"];
const FORBIDDEN = /\bjsx\(|\bjsxs\(|React\.|document\.|window\.|localStorage|speechSynthesis|navigator\.|fetch\(/;

async function load(source) {
  const code = readFileSync(source, "utf8");
  const { code: js } = await transformWithOxc(code, basename(source), { lang: "jsx", jsx: { runtime: "automatic" } });
  const names = [...DATA, ...LOGIC];
  const tmp = join(ROOT, ".cache", `design-${Date.now()}.mjs`);
  mkdirSync(dirname(tmp), { recursive: true });
  writeFileSync(tmp, `${js}\nexport { ${names.join(", ")} };\n`);
  try {
    return await import(pathToFileURL(tmp).href);
  } finally {
    rmSync(tmp, { force: true });
  }
}

const EXT = { "image/webp": "webp", "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png" };

/** Pixel size from the file header (PNG, JPEG, WebP), so layouts keep each image's shape. */
export function imageSize(b) {
  if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i < b.length - 9; ) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (kind === "VP8L") { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
    if (kind === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  throw new Error("unknown image format");
}
function artWriter() {
  const seen = new Map(); // sha → key, so one image used twice is written once
  const files = [];
  return {
    files,
    put(dataUri, hint) {
      const m = /^data:(image\/[a-z]+);base64,(.+)$/s.exec(dataUri);
      if (!m) throw new Error(`unsupported data URI at ${hint}`);
      const bytes = Buffer.from(m[2], "base64");
      const sha = createHash("sha1").update(bytes).digest("hex").slice(0, 10);
      if (seen.has(sha)) return seen.get(sha);
      const key = hint.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const file = `${key}.${EXT[m[1]] || "bin"}`;
      writeFileSync(join(ART, file), bytes);
      files.push({ key, file, bytes: bytes.length, ...imageSize(bytes) });
      seen.set(sha, key);
      return key;
    },
  };
}

const REGEXPS = []; // RegExp values survive as real regexes in data.js (JSON would turn them into {})
function swapArt(value, hint, art) {
  if (typeof value === "string") return value.startsWith("data:image/") ? `art:${art.put(value, hint)}` : value;
  if (value instanceof RegExp) { REGEXPS.push(value); return `__RE_${REGEXPS.length - 1}__`; }
  if (value && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`${hint} is a ${value.constructor?.name}; extend extract-design to carry it`);
  if (Array.isArray(value)) return value.map((v, i) => swapArt(v, `${hint}-${i}`, art));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, swapArt(v, `${hint}-${k}`, art)]));
  if (typeof value === "function") throw new Error(`${hint} is a function inside data; list it under LOGIC instead`);
  return value;
}

export async function extract(source = SOURCE) {
  const mod = await load(source);
  rmSync(ART, { recursive: true, force: true });
  mkdirSync(ART, { recursive: true });
  mkdirSync(CONTENT, { recursive: true });
  const art = artWriter();

  const data = {};
  const fnNames = [...LOGIC];
  for (const name of DATA) {
    if (mod[name] === undefined) throw new Error(`design build has no ${name}`);
    if (typeof mod[name] === "function") { fnNames.unshift(name); continue; } // a helper that builds data (e.g. KNOW)
    data[name] = swapArt(mod[name], name, art);
  }
  // Literals that live inside components (not importable): lifted by text, evaluated as plain data.
  const src = readFileSync(source, "utf8");
  for (const name of INNER_LITERALS) {
    const m = new RegExp(`const ${name} = (\\[[\\s\\S]*?\\]);`).exec(src);
    if (!m) throw new Error(`design build has no inner literal ${name}`);
    data[name] = Function(`"use strict"; return (${m[1]});`)();
  }
  // No fake counts: DOORS rows are [label, key, count]; keep label + key only.
  data.DOORS = data.DOORS.map(([l, w]) => [l, w]);
  const dataNames = Object.keys(data);

  const logic = [];
  for (const name of fnNames) {
    const fn = mod[name];
    if (typeof fn !== "function") throw new Error(`design build has no function ${name}`);
    const src = fn.toString();
    if (FORBIDDEN.test(src)) throw new Error(`${name} is not pure (JSX or browser API): cannot extract`);
    logic.push(src.startsWith("function") ? src : `const ${name} = ${src};`);
  }

  const version = basename(source).replace(/\.jsx$/, "");
  rmSync(join(CONTENT, "data.json"), { force: true });
  const json = JSON.stringify({ version, ...data }).replace(/"__RE_(\d+)__"/g, (_, i) => `new RegExp(${JSON.stringify(REGEXPS[i].source)}, ${JSON.stringify(REGEXPS[i].flags)})`);
  writeFileSync(join(CONTENT, "data.js"), `// GENERATED by scripts/extract-design.mjs from design/${basename(source)}. Do not edit.\nexport default ${json};\n`);
  writeFileSync(join(CONTENT, "logic.js"), [
    `// GENERATED by scripts/extract-design.mjs from design/${basename(source)}. Do not edit.`,
    `// The build's own pure lesson functions, verbatim. Data comes from data.json with the same names.`,
    `import data from "./data.js";`,
    `const { ${dataNames.join(", ")} } = data;`,
    ...logic,
    `export { ${fnNames.join(", ")} };`,
    "",
  ].join("\n"));
  writeFileSync(join(ART, "index.js"), [
    `// GENERATED by scripts/extract-design.mjs from design/${basename(source)}. Do not edit.`,
    "export const ART = {",
    ...art.files.map((f) => `  ${JSON.stringify(f.key)}: { src: require("./${f.file}"), w: ${f.w}, h: ${f.h} },`),
    "};",
    "",
  ].join("\n"));

  // Hi-res overrides (packages/brand/hires/<key>.<ext>) replace the embedded image of the same key.
  const HIRES = join(ROOT, "packages/brand/hires");
  for (const f of art.files) {
    for (const ext of ["webp", "png", "jpg"]) {
      const o = join(HIRES, `${f.key}.${ext}`);
      if (!existsSync(o)) continue;
      const b = readFileSync(o);
      rmSync(join(ART, f.file), { force: true });
      f.file = `${f.key}.${ext}`;
      writeFileSync(join(ART, f.file), b);
      Object.assign(f, imageSize(b), { bytes: b.length, hires: true });
    }
  }
  writeFileSync(join(ART, "index.js"), [
    `// GENERATED by scripts/extract-design.mjs from design/${basename(source)}. Do not edit.`,
    "export const ART = {",
    ...art.files.map((f) => `  ${JSON.stringify(f.key)}: { src: require("./${f.file}"), w: ${f.w}, h: ${f.h} },`),
    "};",
    "",
  ].join("\n"));
  const bytes = art.files.reduce((a, f) => a + f.bytes, 0);
  return { version, data: DATA.length, logic: fnNames.length, images: art.files.length, hires: art.files.filter((f) => f.hires).map((f) => f.key), megabytes: +(bytes / 1e6).toFixed(2) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  extract().then((r) => console.log("extract-design:", JSON.stringify(r)), (e) => { console.error("extract-design failed:", e.message); process.exit(1); });
}
