// node check-stills.mjs out.png name1 name2 ...  — contact sheet of brand stills on magenta, to check cut-outs
import sharp from "sharp";
const [out, ...names] = process.argv.slice(2);
const T = 200;
const tiles = await Promise.all(names.map((n) => sharp(`../packages/brand/art/guy-${n}.webp`).resize(T, T, { fit: "contain", background: "#ff00ff" }).flatten({ background: "#ff00ff" }).png().toBuffer()));
await sharp({ create: { width: T * names.length, height: T, channels: 3, background: "#ff00ff" } })
  .composite(tiles.map((b, k) => ({ input: b, left: k * T, top: 0 }))).png().toFile(out);
