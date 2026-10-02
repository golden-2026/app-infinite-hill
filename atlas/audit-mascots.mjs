// node audit-mascots.mjs — find every image embedded in the public web pages and every logo/icon file, say which
// approved still (packages/brand/art) or old pre-redraw still (mascot3/backup-art) each one is, and draw contact sheets.
// Writes audit-shots/embedded/*.{webp,png,jpg}, audit-shots/embedded.json and audit-shots/sheet-*.png.
import fs from "node:fs";
import crypto from "node:crypto";
import sharp from "sharp";

const PUB = "../apps/app/public/";
const OUT = "audit-shots/";
fs.mkdirSync(OUT + "embedded", { recursive: true });
const md5 = (b) => crypto.createHash("md5").update(b).digest("hex").slice(0, 10);

// reference sets
const ref = []; // {set, name, buf}
for (const [set, dir] of [["approved", "../packages/brand/art"], ["OLD", "mascot3/backup-art"], ["anim", "../apps/app/public/mascot"]]) {
  for (const f of fs.readdirSync(dir)) if (/\.(webp|png|jpg)$/.test(f)) ref.push({ set, name: f, buf: fs.readFileSync(`${dir}/${f}`) });
}
const byHash = new Map();
for (const r of ref) byHash.set(md5(r.buf) + r.set, r);
const fp = async (buf) => {
  // alpha-aware 24x24 fingerprint on magenta
  const { data } = await sharp(buf, { animated: false }).resize(24, 24, { fit: "contain", background: "#ff00ff" }).flatten({ background: "#ff00ff" }).raw().toBuffer({ resolveWithObject: true });
  return data;
};
const dist = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };
const refFp = [];
for (const r of ref) if (r.set !== "anim") try { refFp.push({ ...r, fp: await fp(r.buf) }); } catch {}

const files = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(PUB).filter((f) => f.endsWith(".html"));
const seen = new Map(); // hash -> record
const tag = (s) => s.replace(/data:image\/[a-z+]+;base64,([A-Za-z0-9+/=]+)/g, (m, b) => "IMG_" + md5(Buffer.from(b, "base64")));
for (const f of files) {
  const s = fs.readFileSync(PUB + f, "utf8");
  for (const m of s.matchAll(/data:image\/([a-z+]+);base64,([A-Za-z0-9+/=]+)/g)) {
    const buf = Buffer.from(m[2], "base64");
    const h = md5(buf);
    const ctx = (() => { const t = tag(s.slice(Math.max(0, m.index - 4000), m.index)); return t.slice(-110).replace(/\s+/g, " "); })();
    if (!seen.has(h)) {
      const ext = m[1] === "jpeg" ? "jpg" : m[1].replace("svg+xml", "svg");
      fs.writeFileSync(`${OUT}embedded/${h}.${ext}`, buf);
      let exact = ref.filter((r) => md5(r.buf) === h).map((r) => r.set + ":" + r.name);
      let near = "";
      if (ext !== "svg") try {
        const p = await fp(buf);
        const best = refFp.map((r) => ({ r, d: dist(p, r.fp) })).sort((a, b) => a.d - b.d).slice(0, 2);
        near = best.map((b) => `${b.r.set}:${b.r.name}~${b.d.toFixed(1)}`).join(" ");
      } catch {}
      seen.set(h, { hash: h, ext, bytes: buf.length, exact, near, uses: [] });
    }
    seen.get(h).uses.push(`${f}: ${ctx}`);
  }
}
const recs = [...seen.values()];
fs.writeFileSync(OUT + "embedded.json", JSON.stringify(recs, null, 1));
for (const r of recs) console.log(r.hash, r.ext, r.bytes, "| exact:", r.exact.join(",") || "-", "| near:", r.near, "| uses:", r.uses.length, "|", r.uses[0]);

// contact sheet: every embedded non-photo image (webp/png), labelled
const T = 180, L = 34;
const imgs = recs.filter((r) => r.ext === "webp" || r.ext === "png");
const cols = 8, rows = Math.ceil(imgs.length / cols);
const comps = [];
for (let k = 0; k < imgs.length; k++) {
  const r = imgs[k];
  const tile = await sharp(`${OUT}embedded/${r.hash}.${r.ext}`).resize(T, T, { fit: "contain", background: "#2a2a2a" }).flatten({ background: "#2a2a2a" }).png().toBuffer();
  const lab = `${r.hash} ${(r.exact[0] || "?" ).replace(/\.webp|\.png/, "")}`;
  const svg = Buffer.from(`<svg width="${T}" height="${L}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fff"/><text x="4" y="14" font-size="11" font-family="Arial">${lab.slice(0, 30)}</text><text x="4" y="28" font-size="10" font-family="Arial" fill="#a00">${(r.near.split(" ")[0] || "").slice(0, 32)}</text></svg>`);
  comps.push({ input: tile, left: (k % cols) * T, top: Math.floor(k / cols) * (T + L) }, { input: svg, left: (k % cols) * T, top: Math.floor(k / cols) * (T + L) + T });
}
if (imgs.length) await sharp({ create: { width: cols * T, height: rows * (T + L), channels: 3, background: "#ffffff" } }).composite(comps).png().toFile(OUT + "sheet-embedded.png");
