// verify-clips.cjs: compares each saved clip's first frame with the picture it should come from (small grey thumbnails)
const { execFileSync } = require("child_process"), fs = require("fs"), path = require("path");
const IN = process.argv[2] || path.join(__dirname, "..", "repaint2", "in"); // folder with the pictures (.png) and clips (k-<id>.mp4)
const thumb = (f, ss) => execFileSync("ffmpeg", ["-v", "error", ...(ss ? ["-ss", ss] : []), "-i", f, "-frames:v", "1", "-vf", "scale=32:56,format=gray", "-f", "rawvideo", "-"]);
const pics = fs.readdirSync(IN).filter((f) => /\.png$/.test(f) && !/house-ref|old/.test(f));
const PT = {}; for (const p of pics) { try { PT[p] = thumb(path.join(IN, p)); } catch (e) {} }
const mse = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2; return s / a.length; };
const out = [];
for (const c of fs.readdirSync(IN).filter((f) => /^k-.*\.mp4$/.test(f))) {
  const id = c.slice(2, -4); const want = (id.startsWith("hinduism-") ? id.slice(9) : id).replace(/^d2-1$/, "d2-1") + ".png";
  const t = thumb(path.join(IN, c), "0.05"); let best = null, bv = 1e9;
  for (const p in PT) { const v = mse(t, PT[p]); if (v < bv) { bv = v; best = p; } }
  const wv = PT[want] ? mse(t, PT[want]) : -1;
  out.push({ clip: c, want, best, ok: best === want, wantErr: Math.round(wv), bestErr: Math.round(bv) });
}
for (const o of out) console.log((o.ok ? "ok  " : "BAD ") + o.clip + " -> best " + o.best + " (" + o.bestErr + ") want " + o.want + " (" + o.wantErr + ")");
