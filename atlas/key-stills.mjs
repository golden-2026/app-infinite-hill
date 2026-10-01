// Keys the pure-green (#00FF00) background out of still mascot poses and writes trimmed, transparent WebP + PNG.
// Soft edge from "greenness" (how far G exceeds max(R,B)), green spill pulled back toward neutral on the edge pixels.
// node key-stills.mjs <inDir> <outDir> [size=720]
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const [inDir, outDir, sizeArg] = process.argv.slice(2);
const SIZE = Number(sizeArg || 720);
fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(inDir).filter((x) => /\.(png|jpe?g|webp)$/i.test(x)).sort()) {
  const { data, info } = await sharp(path.join(inDir, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const green = g - Math.max(r, b); // 0 for neutral/yellow/white, large for the screen
    // fully transparent above 90, fully opaque below 25, smooth between
    const a = green >= 90 ? 0 : green <= 25 ? 255 : Math.round(255 * (90 - green) / 65);
    data[i + 3] = Math.min(data[i + 3], a);
    if (green > 0 && a > 0) data[i + 1] = Math.max(r, b) + Math.round(green * 0.15); // despill
  }
  const keyed = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } });
  const trimmed = await keyed.png().toBuffer().then((b) => sharp(b).trim({ threshold: 1 }).toBuffer());
  // fit inside a square with even padding so nothing touches the edges
  const pad = Math.round(SIZE * 0.06);
  const inner = await sharp(trimmed).resize(SIZE - 2 * pad, SIZE - 2 * pad, { fit: "inside" }).toBuffer();
  const sq = sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: inner, gravity: "center" }]);
  const base = path.join(outDir, f.replace(/^\d+_/, "").replace(/\.\w+$/, ""));
  const png = await sq.png().toBuffer();
  fs.writeFileSync(base + ".png", png);
  await sharp(png).webp({ quality: 88, alphaQuality: 100 }).toFile(base + ".webp");
  console.log("keyed", path.basename(base));
}
