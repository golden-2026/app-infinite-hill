// Replace off-model mascot stills in packages/brand/art with new on-model pictures.
// Removes the plain white background by flood-filling from the edges (so white inside him — gloves, hoodie — stays),
// trims, and fits each into the same 706x720 box the site and app already use.
// node swap-stills.mjs <map.json>   where map.json is [["C:/path/new.webp", "dog"], ...]
import sharp from "sharp";
import fs from "node:fs";

const map = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const W = 706, H = 720;
for (const [src, name] of map) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const white = (i) => data[i] > 232 && data[i + 1] > 232 && data[i + 2] > 232;
  const seen = new Uint8Array(w * h), stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    if (!white(p * 4)) continue;
    data[p * 4 + 3] = 0;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) stack.push(p - 1); if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w); if (y < h - 1) stack.push(p + w);
  }
  // soften the 1px fringe: edge pixels next to cleared ones get partial alpha
  for (let p = 0; p < w * h; p++) {
    if (data[p * 4 + 3] === 0) continue;
    const x = p % w, y = (p / w) | 0;
    let n = 0; for (const q of [p - 1, p + 1, p - w, p + w]) if (q >= 0 && q < w * h && data[q * 4 + 3] === 0 && Math.abs((q % w) - x) <= 1) n++;
    if (n && data[p * 4] > 215 && data[p * 4 + 1] > 215 && data[p * 4 + 2] > 215) data[p * 4 + 3] = 140;
  }
  const keyed = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  const trimmed = await sharp(keyed).trim({ threshold: 1 }).toBuffer();
  const fit = await sharp(trimmed).resize(W - 20, H - 20, { fit: "inside" }).toBuffer();
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: fit, gravity: "south" }]).webp({ quality: 88, alphaQuality: 100 })
    .toFile(`../packages/brand/art/guy-${name}.webp`);
  console.log("swapped", name);
}
