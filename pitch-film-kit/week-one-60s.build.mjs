// week-one-60s.build.mjs: Infinite Hill's 60-second film, cut from the week-one lesson films.
// Usage (from the repo root):  node pitch-film-kit/week-one-60s.build.mjs [workDir]
// Needs ffmpeg/ffprobe on the PATH and apps/app/node_modules (Anton + Manrope fonts).
// Writes pitch-film-kit/Infinite-Hill-Week-One-60s-Vertical.mp4 (1080x1920) and ...-60s-Wide.mp4 (1920x1080).
// Audio: each moment keeps its own film's narration + score (loudness-matched); title cards get a synthesized
// impact hit; the end card gets a synthesized swell. No outside music.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const KIT = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(KIT, "..");
const LESSONS = path.join(ROOT, "prototypes/greybox/art/lessons");
const WORK = path.resolve(process.argv[2] || path.join(os.tmpdir(), "ih-week-one-60s"));
fs.mkdirSync(WORK, { recursive: true });
const FONTS = path.join(ROOT, "apps/app/node_modules/@expo-google-fonts");
fs.copyFileSync(path.join(FONTS, "anton/400Regular/Anton_400Regular.ttf"), path.join(WORK, "anton.ttf"));
fs.copyFileSync(path.join(FONTS, "manrope/800ExtraBold/Manrope_800ExtraBold.ttf"), path.join(WORK, "manrope.ttf"));

const W = 1080, H = 1920, FPS = 30, SR = 48000, LIME = "0xEEFF6A";
const TARGET_LUFS = -15; // each moment matched to this before the mix

// The cut. Moments: [door, day, start, end, tag]. Times are the films' own caption boundaries (edit-*.json).
const NAMES = { christianity: "CHRISTIANITY", catholic: "CATHOLICISM", judaism: "JUDAISM", islam: "ISLAM", buddhism: "BUDDHISM", sikhism: "SIKHISM", spiritual: "MY OWN RELIGION", hinduism: "HINDUISM" };
const M = (door, day, a, b) => ({ kind: "clip", door, day, a, b });
const C = (d, lines, opt = {}) => ({ kind: "card", d, lines, ...opt });
const SHOTS = [
  // cold open: Christianity, the Last Supper
  M("christianity", 1, 0.0, 1.80),      // "he shared bread with his betrayer."
  M("christianity", 1, 14.79, 18.96),   // "He took the bread anyway. He gave thanks. He broke it."
  C(1.5, [["EVERY PATH", 170], ["HAS ITS STORY.", 170]]),
  M("christianity", 6, 13.61, 17.66),   // "Then a sound came from the sky, like a rushing wind."
  M("judaism", 5, 20.57, 25.84),        // "worth a fortune, and smashes it, right in front of them. Silence."
  M("sikhism", 5, 14.16, 19.08),        // "Then he kneels by a wounded enemy soldier. And gives him water too."
  C(1.2, [["THE FAITH'S", 170], ["REAL TEACHING.", 170]]),
  M("islam", 1, 29.94, 34.96),          // "It opened: in the name of God, the Beneficent, the Merciful."
  M("catholic", 5, 36.36, 41.56),       // "A saint isn't someone who never fell. It's someone who kept getting up."
  M("hinduism", 2, 32.60, 35.85),       // (this film runs later than its edit file) "So Death gave him one word: om."
  C(1.2, [["YOUR LIFE", 190], ["TODAY.", 190]]),
  M("christianity", 1, 40.80, 45.33),   // "So when that tray comes down the row at church, it's carrying more than bread."
  M("spiritual", 2, 46.62, 50.56),      // "Your mind wanders twenty times in a minute? That's twenty reps."
  M("buddhism", 1, 46.16, 50.16),       // "their words are theirs. What you do next is yours."
  M("judaism", 4, 48.72, 51.55),        // "It's not their story. It's yours."
  C(1.3, [["FIVE MINUTES.", 170], ["EVERY DAY.", 170]], { bed: true }),
  C(1.6, [["BECAUSE YOU", 150], ["GOTTA HAVE FAITH.", 150]]),
  C(3.6, [["INFINITE HILL", 190, "white"]], { sub: "making religion yours again.", swell: true }),
];

const sh = (cmd, args, opt = {}) => {
  const r = spawnSync(cmd, args, { cwd: WORK, encoding: "utf8", maxBuffer: 1 << 28, ...opt });
  if (r.status !== 0) { console.error(cmd, args.join(" "), "\n", r.stderr?.slice(-3000)); process.exit(1); }
  return r;
};
const ff = (args) => sh("ffmpeg", ["-hide_banner", "-v", "error", "-y", ...args]);
const txt = (name, s) => { fs.writeFileSync(path.join(WORK, name), s); return name; };
const VENC = ["-c:v", "libx264", "-preset", "slow", "-crf", "15", "-pix_fmt", "yuv420p", "-r", String(FPS)];

function lufs(file) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128", "-f", "null", "-"], { cwd: WORK, encoding: "utf8", maxBuffer: 1 << 28 });
  const m = [...r.stderr.matchAll(/I:\s+(-?[\d.]+) LUFS/g)].pop();
  return m ? +m[1] : -70;
}

// ---- segments
const list = [], alist = [], marks = [];
let t = 0;
SHOTS.forEach((s, i) => {
  const n = String(i).padStart(2, "0"), v = `v${n}.mp4`, a = `a${n}.wav`;
  if (s.kind === "clip") {
    const src = path.join(LESSONS, s.door, `${s.day}.mp4`), d = +(s.b - s.a).toFixed(3);
    s.d = d;
    const tag = txt(`tag${n}.txt`, `${NAMES[s.door]}  ·  DAY ${s.day}`);
    ff(["-ss", String(s.a), "-t", String(d), "-i", src, "-an", "-vf",
      `scale=${W}:${H}:flags=lanczos,setsar=1,fps=${FPS},drawtext=fontfile=anton.ttf:textfile=${tag}:fontsize=46:fontcolor=black:box=1:boxcolor=${LIME}:boxborderw=18|26:x=(w-text_w)/2:y=150`,
      ...VENC, "-frames:v", String(Math.round(d * FPS)), v]);
    ff(["-ss", String(s.a), "-t", String(d), "-i", src, "-vn", "-ac", "2", "-ar", String(SR), "-af", `afade=t=in:d=0.02,afade=t=out:st=${(d - 0.04).toFixed(3)}:d=0.04`, `raw${n}.wav`]);
    const g = TARGET_LUFS - lufs(`raw${n}.wav`);
    ff(["-i", `raw${n}.wav`, "-af", `volume=${g.toFixed(2)}dB`, a]);
    console.log(`${t.toFixed(2).padStart(6)}  ${s.door} ${s.day}  ${s.a}-${s.b}  (${d}s, ${g >= 0 ? "+" : ""}${g.toFixed(1)} dB)`);
  } else {
    const d = s.d, total = s.lines.reduce((x, l) => x + l[1] * 1.08, 0) + (s.sub ? 90 : 0);
    let y = (H - total) / 2, f = [];
    s.lines.forEach(([line, size, color], k) => {
      f.push(`drawtext=fontfile=anton.ttf:textfile=${txt(`c${n}_${k}.txt`, line)}:fontsize=${size}:fontcolor=${color || LIME}:x=(w-text_w)/2:y=${Math.round(y)}`);
      y += size * 1.08;
    });
    if (s.sub) f.push(`drawtext=fontfile=manrope.ttf:textfile=${txt(`c${n}_s.txt`, s.sub)}:fontsize=66:fontcolor=${LIME}:x=(w-text_w)/2:y=${Math.round(y + 34)}`);
    ff(["-f", "lavfi", "-i", `color=c=black:s=${W}x${H}:r=${FPS}:d=${d}`, "-vf", f.join(","), ...VENC, "-frames:v", String(Math.round(d * FPS)), v]);
    ff(["-f", "lavfi", "-i", `anullsrc=r=${SR}:cl=stereo`, "-t", String(d), a]);
    marks.push({ t, d, swell: !!s.swell, bed: !!s.bed });
    console.log(`${t.toFixed(2).padStart(6)}  CARD ${s.lines.map((l) => l[0]).join(" / ")} (${d}s)`);
  }
  // keep audio and video lengths identical to the frame grid
  s.d = Math.round(s.d * FPS) / FPS;
  list.push(`file '${v}'`); alist.push(`file '${a}'`);
  t += s.d;
});
const TOTAL = t;
console.log("total", TOTAL.toFixed(2), "s");
fs.writeFileSync(path.join(WORK, "v.txt"), list.join("\n"));
fs.writeFileSync(path.join(WORK, "a.txt"), alist.join("\n"));
ff(["-f", "concat", "-safe", "0", "-i", "v.txt", "-c", "copy", "video.mp4"]);
// audio: pad/trim every piece to its frame-exact length so sync never drifts
SHOTS.forEach((s, i) => { const n = String(i).padStart(2, "0"); ff(["-i", `a${n}.wav`, "-af", `apad,atrim=0:${s.d.toFixed(4)}`, "-ar", String(SR), `p${n}.wav`]); });
fs.writeFileSync(path.join(WORK, "a.txt"), SHOTS.map((_, i) => `file 'p${String(i).padStart(2, "0")}.wav'`).join("\n"));
ff(["-f", "concat", "-safe", "0", "-i", "a.txt", "-c", "pcm_s16le", "dialog.wav"]);

// ---- synthesized hits (no outside music): an impact on every title card, a swell under the end card
{
  const N = Math.ceil(TOTAL * SR), L = new Float32Array(N);
  let seed = 11; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
  const add = (t0, fn, d, g) => { const i0 = Math.round(t0 * SR); for (let i = 0; i < d * SR && i0 + i < N; i++) if (i0 + i >= 0) L[i0 + i] += fn(i / SR) * g; };
  const impact = (t0, g) => { let ph = 0, lp = 0; add(t0, (tt) => { const f = 32 + 95 * Math.exp(-tt * 7); ph += 2 * Math.PI * f / SR; const n = rnd(); lp += 0.08 * (n - lp); return Math.tanh(2 * Math.sin(ph) * Math.exp(-tt * 3)) * 0.9 + lp * 3 * Math.exp(-tt * 5) + n * 0.25 * Math.exp(-tt * 40); }, 1.6, g); };
  const swell = (t0, d) => { const notes = [50, 57, 62, 66, 69].map((m) => 440 * Math.pow(2, (m - 69) / 12)); add(t0, (tt) => { let v = 0; for (const f of notes) v += Math.sin(2 * Math.PI * f * tt) + 0.3 * Math.sin(2 * Math.PI * f * 2.003 * tt); return v / notes.length * Math.min(1, tt / 0.4) * Math.min(1, (d - tt) / 1.2); }, d, 0.35); };
  const bed = marks.find((m) => m.bed); // one rising chord under the last three cards, so the close never drops to dead air
  if (bed) swell(bed.t, TOTAL - bed.t);
  for (const m of marks) impact(m.t, m.swell ? 0.8 : 0.6);
  const buf = Buffer.alloc(44 + N * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) { const v = Math.round(Math.max(-1, Math.min(1, Math.tanh(L[i]) * 0.7)) * 32767); buf.writeInt16LE(v, 44 + i * 4); buf.writeInt16LE(v, 46 + i * 4); }
  fs.writeFileSync(path.join(WORK, "hits.wav"), buf);
}
ff(["-i", "dialog.wav", "-i", "hits.wav", "-filter_complex",
  "[0][1]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.84:level=false,afade=t=out:st=" + (TOTAL - 0.6).toFixed(2) + ":d=0.6[a]",
  "-map", "[a]", "-ar", String(SR), "mix.wav"]);

// ---- masters
const OUTV = path.join(KIT, "Infinite-Hill-Week-One-60s-Vertical.mp4");
const OUTW = path.join(KIT, "Infinite-Hill-Week-One-60s-Wide.mp4");
ff(["-i", "video.mp4", "-i", "mix.wav", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-shortest", OUTV]);
ff(["-i", OUTV, "-filter_complex",
  "[0:v]split[a][b];[a]scale=1920:-2,crop=1920:1080,gblur=sigma=40,eq=brightness=-0.18:saturation=1.15[bg];[b]scale=-2:1080:flags=lanczos[fg];[bg][fg]overlay=(W-w)/2:0,setsar=1[v]",
  "-map", "[v]", "-map", "0:a", ...VENC, "-c:a", "copy", "-movflags", "+faststart", OUTW]);
console.log("wrote", OUTV, "\nwrote", OUTW);
