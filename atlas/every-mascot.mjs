// node every-mascot.mjs — one contact sheet of every mascot and logo image in use (website, footer pages, app, icons),
// on a dark grey so halos show. Run audit-mascots.mjs first (it extracts the website's embedded images).
// Writes audit-shots/every-mascot.png.
import fs from "node:fs";
import sharp from "sharp";

const R = "../";
const groups = [];
const add = (title, items) => groups.push({ title, items: items.filter((i) => fs.existsSync(i.f)) });
const emb = JSON.parse(fs.readFileSync("audit-shots/embedded.json", "utf8")).filter((r) => r.ext !== "jpg");
add("website (site.html, site-es.html, sources*.html): embedded", emb.map((r) => ({ f: `audit-shots/embedded/${r.hash}.${r.ext}`, l: (r.exact[0] || "").replace(/^approved:|\.webp$/g, "") || (r.ext === "png" ? "favicon" : r.hash === "74a87e9c7a" ? "header logo" : "panel (anim frame)") })));
add("footer pages + site files (apps/app/public/site-art)", fs.readdirSync(R + "apps/app/public/site-art").filter((f) => /^(guy-|logo|favicon)/.test(f)).map((f) => ({ f: R + "apps/app/public/site-art/" + f, l: f })));
add("app: animated mascot (public/mascot = assets/mascot)", fs.readdirSync(R + "apps/app/public/mascot").map((f) => ({ f: R + "apps/app/public/mascot/" + f, l: f.replace(".webp", ""), anim: true })));
add("app: stills (packages/brand/art) + logo + the sun", [...fs.readdirSync(R + "packages/brand/art").filter((f) => /^guy-/.test(f)).map((f) => ({ f: R + "packages/brand/art/" + f, l: f.replace(/\.webp$/, "") })), { f: R + "packages/brand/art/logo-mark.webp", l: "logo-mark (Logo)" }, { f: R + "packages/brand/art/sun-img.png", l: "sun-img (the Sun)" }]);
add("icons, launch and splash", [
  ["apps/app/public/launch-mark.png", "web launch screen"], ["apps/app/assets/images/splash-icon.png", "native splash"],
  ["apps/app/public/icon-192.png", "PWA 192"], ["apps/app/public/icon-512.png", "PWA 512"], ["apps/app/public/apple-touch-icon.png", "apple touch"],
  ["apps/app/assets/images/icon.png", "app icon"], ["apps/app/assets/images/favicon.png", "app favicon"],
  ["apps/app/assets/images/android-icon-foreground.png", "android fg"], ["apps/app/assets/images/android-icon-monochrome.png", "android mono"],
].map(([f, l]) => ({ f: R + f, l })));
add("website: real app screens (site-art/day-*)", fs.readdirSync(R + "apps/app/public/site-art").filter((f) => /^day-/.test(f)).map((f) => ({ f: R + "apps/app/public/site-art/" + f, l: f.replace(".webp", "") })));

const T = 150, L = 22, C = 12, H = 34, W = T * C, BG = "#2b2b2b";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const comps = [];
let y = 0;
for (const g of groups) {
  comps.push({ input: Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#EEFF6A"/><text x="10" y="23" font-size="17" font-weight="700" font-family="Arial">${esc(g.title)} (${g.items.length})</text></svg>`), left: 0, top: y });
  y += H;
  for (let k = 0; k < g.items.length; k++) {
    const it = g.items[k];
    const m = await sharp(it.f).metadata();
    const tile = await sharp(it.f, it.anim ? { page: Math.floor((m.pages || 1) / 2) } : {}).resize(T - 8, T - 8, { fit: "contain", background: BG }).flatten({ background: BG }).png().toBuffer();
    const x = (k % C) * T, yy = y + Math.floor(k / C) * (T + L);
    comps.push({ input: tile, left: x + 4, top: yy + 4 });
    comps.push({ input: Buffer.from(`<svg width="${T}" height="${L}" xmlns="http://www.w3.org/2000/svg"><text x="${T / 2}" y="15" text-anchor="middle" font-size="11" fill="#eee" font-family="Arial">${esc(it.l.slice(0, 24))}</text></svg>`), left: x, top: yy + T });
  }
  y += Math.ceil(g.items.length / C) * (T + L) + 8;
}
await sharp({ create: { width: W, height: y, channels: 3, background: BG } }).composite(comps).png().toFile("audit-shots/every-mascot.png");
console.log("audit-shots/every-mascot.png", W + "x" + y, groups.map((g) => g.items.length).join("+"));
