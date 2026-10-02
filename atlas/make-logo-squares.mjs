// node make-logo-squares.mjs — the approved logo mark (the face in the backwards cap, packages/brand/hires/logo-mark.webp,
// the same art as the website header) fitted into the square images the app shows while it starts:
// public/launch-mark.png (web launch screen) and assets/images/splash-icon.png (native splash).
import sharp from "sharp";
const SRC = "../packages/brand/hires/logo-mark.webp";
const square = async (size, pad, out) => {
  const inner = Math.round(size * (1 - 2 * pad));
  const art = await sharp(SRC).trim({ threshold: 1 }).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: art, gravity: "center" }]).png({ compressionLevel: 9 }).toFile(out);
  console.log(out);
};
await square(360, 0.04, "../apps/app/public/launch-mark.png");
await square(360, 0.04, "../apps/app/assets/images/splash-icon.png");
