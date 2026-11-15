// auto.mjs <cfg.json> <vo.mp3> <outPrefix>: builds edit-<x>.json + mix-<x>.wav for one narrated lesson film
// structure: cold open (shock shot + caption) -> Finn question -> narrated story (captions timed to the voice's pauses,
// shots in story order, punch-ins) -> snap + silence + drop on the turn -> Finn close with the day's line
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const here = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, "$1");
const ART = path.join(here, "..", "..", "art") + "/"; // prototypes/greybox/art/
const [cfgPath, vo, prefix] = process.argv.slice(2);
const C = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
const probe = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim();
const VOD = probe(vo);

// 1. speech segments from pauses
const log = spawnSync("ffmpeg", ["-hide_banner", "-i", vo, "-af", "silencedetect=n=-35dB:d=0.16", "-f", "null", "-"], { encoding: "utf8" }).stderr;
const gaps = []; let s0 = null;
for (const m of log.matchAll(/silence_(start|end): ([0-9.]+)/g)) { if (m[1] === "start") s0 = +m[2]; else if (s0 !== null) { gaps.push([s0, +m[2]]); s0 = null; } }
const G = gaps.filter(([a, b]) => (a + b) / 2 > 0.3 && (a + b) / 2 < VOD - 0.3).map(([a, b]) => ({ t: (a + b) / 2, len: b - a }));

// 2. phrases from the script (split on , . ? ! ; but keep short bits together inside a sentence)
let ph = C.script.split(/(?<=[,.?!;])\s+/).map((s) => s.trim()).filter(Boolean);
const merged = []; for (const p of ph) { const last = merged[merged.length - 1]; if (last && !/[.?!]$/.test(last) && (last.length < 10 || p.length < 6)) merged[merged.length - 1] += " " + p; else merged.push(p); }
ph = merged;
while (ph.length - 1 > G.length) { let k = 0, m = 1e9; for (let i = 0; i < ph.length - 1; i++) if (ph[i].length + ph[i + 1].length < m) { m = ph[i].length + ph[i + 1].length; k = i; } ph.splice(k, 2, ph[k] + " " + ph[k + 1]); }
// DP: each phrase boundary takes one pause, in order, matching the expected time (by characters) and preferring long pauses at sentence ends
const speechStart = gaps.length && gaps[0][0] < 0.05 ? gaps[0][1] : 0;
const total = ph.reduce((a, p) => a + p.length, 0); const span = VOD - speechStart - 0.3;
const nb = ph.length - 1, m = G.length; let accx = 0; const exp = [], end = [];
for (let i = 0; i < nb; i++) { accx += ph[i].length; exp.push(speechStart + (accx / total) * span); end.push(/[.?!]$/.test(ph[i])); }
const INF = 1e18, dp = [...Array(nb)].map(() => new Array(m).fill(INF)), bk = [...Array(nb)].map(() => new Array(m).fill(-1));
const cost = (i, k) => { const d = G[k].t - exp[i]; return d * d - (end[i] ? 1.6 : 0.5) * Math.min(G[k].len, 0.8); };
for (let k = 0; k < m; k++) dp[0][k] = cost(0, k);
for (let i = 1; i < nb; i++) { let best = INF, bj = -1; for (let k = 0; k < m; k++) { if (k > 0 && dp[i - 1][k - 1] < best) { best = dp[i - 1][k - 1]; bj = k - 1; } if (best < INF) { dp[i][k] = best + cost(i, k); bk[i][k] = bj; } } }
let kk = 0; for (let k = 1; k < m; k++) if (dp[nb - 1][k] < dp[nb - 1][kk]) kk = k;
const pick = new Array(nb); for (let i = nb - 1; i >= 0; i--) { pick[i] = kk; kk = bk[i][kk]; }
const starts = [speechStart, ...pick.map((k) => G[k].t)];

// 3. captions: highlight one word (keyword > proper noun > last word)
const KW = (C.keywords || []).map((k) => k.toLowerCase());
function hi(p) {
  const w = p.split(" "); const kr = (x) => KW.indexOf(x.toLowerCase().replace(/[^a-z'-]/g, "")); let idx = -1, bestr = 1e9; w.forEach((x, i) => { const r = kr(x); if (r >= 0 && r < bestr) { bestr = r; idx = i; } });
  if (idx < 0) idx = w.findIndex((x, i) => i > 0 && /^[A-Z]/.test(x) && !/^I$/.test(x.replace(/\W/g, "")));
  if (idx < 0) idx = w.length - 1;
  const m = w[idx].match(/^(.*?)([,.:?!;]*)$/); w[idx] = "*" + m[1] + "*" + m[2]; return w.join(" ").replace(/[.:;]$/, (c) => (c === "." ? "." : ""));
}
const lw = (t) => Math.max(...t.replace(/\*/g, "").split(" ").map((w) => w.length));
const size = (p) => { const n = p.replace(/\*/g, "").length; return Math.min(Math.floor(560 / lw(p)), n <= 8 ? 96 : n <= 14 ? 80 : n <= 24 ? 64 : n <= 40 ? 54 : 46); };

// 4. shots in story order with varied in-points and punch-ins
const shots = C.shots.map((s) => ({ src: s, dur: /\.mp4$/.test(s) ? probe(ART + s) : 99 }));
const OPEN = 1.8, Q = 1.0, VO0 = OPEN + Q, CLOSE = 1.9;
const cards = [];
const op = shots[C.open.shot - 1];
cards.push({ d: OPEN, src: op.src, ss: Math.min(C.open.ss ?? 1.5, Math.max(0, op.dur - OPEN - 0.2)), flash: true, shake: true, zoom: 0.14, text: C.open.text, size: C.open.size || 62 });
cards.push({ d: Q, src: "lime:finn/finn-think-still.webp", text: C.q, ink: true, pos: "top", size: 72, finnY: 420 });
const dropI = ph.findIndex((p) => p.toLowerCase().startsWith(C.drop.toLowerCase()));
const use = {};
const beatAt = []; if (C.beats) { let from = 0; C.beats.forEach((b, bi) => { const j = ph.findIndex((p, k) => k >= from && p.toLowerCase().includes(b.toLowerCase())); beatAt.push(j < 0 ? from : j); if (j >= 0) from = j; }); console.log("beats", beatAt.join(",")); }
for (let i = 0; i < ph.length; i++) {
  const t0 = i === 0 ? 0 : starts[i], t1 = i === ph.length - 1 ? VOD : starts[i + 1];
  let d = t1 - t0; const si = C.beats ? Math.max(0, beatAt.filter((j) => j <= i).length - 1) : Math.min(shots.length - 1, Math.floor((starts[i] / VOD) * shots.length)); const sh = shots[si];
  use[si] = (use[si] || 0) + 1; const k = use[si] - 1;
  const ss = sh.dur < 90 ? Math.max(0, Math.min(sh.dur - d - 0.1, 0.4 + k * 1.3)) : 0;
  const c = { d: +d.toFixed(3), src: sh.src, ss: +ss.toFixed(2), zoom: [0.06, 0.12, 0.18, 0.09][k % 4], text: hi(ph[i]), size: size(ph[i]) };
  if (sh.dur < 90 && d > sh.dur - 0.25) { c.ss = 0; c.speed = +((sh.dur - 0.25) / d).toFixed(3); }
  if (i === dropI - 1) { c.shake = true; c.zoom = 0.2; c.size = Math.min(110, c.size + 16, Math.floor(560 / lw(c.text))); }
  if (i === dropI) { c.flash = true; c.shake = true; c.zoom = 0.16; }
  if (k === 0 && i > 0 && i !== dropI) c.flash = false;
  cards.push(c);
}
cards.push({ d: CLOSE, src: "lime:finn/finn-celebrate-still.webp", text: C.close, ink: true, pos: "top", size: 60, finnY: 430 });
const DUR = +(VO0 + VOD + CLOSE).toFixed(2), DROP = +(VO0 + (dropI >= 0 ? starts[dropI] : VOD * 0.6)).toFixed(2);
fs.writeFileSync(path.join(here, `edit-${prefix}.json`), JSON.stringify({ audio: `mix-${prefix}.wav`, cards }, null, 1));

// 5. audio: score (drop on the turn) + beat (its drop lined up) + voice
execFileSync("node", [path.join(here, "score.mjs"), path.join(here, `score-${prefix}.wav`), String(DROP), String(Math.ceil(DUR))], { env: { ...process.env, HITS: String(OPEN) }, stdio: "ignore" });
const bd = DROP - 18; const beatIn = bd >= 0 ? `adelay=${Math.round(bd * 1000)}|${Math.round(bd * 1000)}` : `atrim=start=${-bd},asetpts=PTS-STARTPTS`;
execFileSync("ffmpeg", ["-y", "-v", "error", "-i", vo, "-i", path.join(here, `score-${prefix}.wav`), "-i", path.join(here, "beat.wav"), "-filter_complex",
  `[0:a]adelay=${VO0 * 1000}|${VO0 * 1000},apad[vo];[1:a]volume=0.28[s];[2:a]afade=t=out:st=27:d=3,${beatIn},volume=0.3,apad[b];[vo][s][b]amix=inputs=3:duration=longest:normalize=0,alimiter=limit=0.95[a]`,
  "-map", "[a]", "-t", String(DUR), path.join(here, `mix-${prefix}.wav`)]);
console.log(prefix, "phrases", ph.length, "drop", DROP, "dur", DUR, "dropI", dropI);
