// score.mjs [out.wav] [dropAt=18]: 30 s cinematic score: string pad (Dm Bb F C), drone, taiko hits, snap + silence, big swell at the drop
import fs from "node:fs";
const SR = 44100, DUR = +(process.argv[4] || 30), N = SR * DUR, out = process.argv[2] || "score.wav", DROP = +(process.argv[3] || 18);
const L = new Float32Array(N), R = new Float32Array(N);
let seed = 3; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
const add = (t0, b, g = 1, pan = 0) => { const i0 = Math.round(t0 * SR); for (let i = 0; i < b.length && i0 + i < N; i++) if (i0 + i >= 0) { L[i0 + i] += b[i] * g * (1 - Math.max(0, pan)); R[i0 + i] += b[i] * g * (1 + Math.min(0, pan)); } };
const len = (s) => new Float32Array(Math.round(s * SR));
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
function pad(t0, d, notes, gain, cut0, cut1, att = 1.5) { // detuned saws, opening low-pass
  for (const [k, m] of notes.entries()) for (let v = 0; v < 4; v++) {
    const b = len(d), f = hz(m) * (1 + (v - 1.5) * 0.004); let ph = Math.random(), lp = 0, lp2 = 0;
    for (let i = 0; i < b.length; i++) { const t = i / SR; ph += f / SR; ph -= Math.floor(ph); const saw = 2 * ph - 1; const c = cut0 + (cut1 - cut0) * (t / d); const a = 1 - Math.exp(-2 * Math.PI * c / SR); lp += a * (saw - lp); lp2 += a * (lp - lp2);
      b[i] = lp2 * Math.min(1, t / att) * Math.min(1, (d - t) / 0.8); }
    add(t0, b, gain / 4, ((k + v) % 3 - 1) * 0.5);
  }
}
function taiko(t0, g = 1) { const b = len(1.4); let ph = 0, lp = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; const f = 55 + 70 * Math.exp(-t * 18); ph += 2 * Math.PI * f / SR; const n = rnd(); lp += 0.05 * (n - lp); b[i] = Math.tanh(1.8 * Math.sin(ph) * Math.exp(-t * 4)) + lp * 4 * Math.exp(-t * 10); } add(t0, b, g); }
function snap(t0) { const b = len(0.6); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = rnd() * Math.exp(-t * 35) + Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-t * 50) * 0.4; } add(t0, b, 0.9); }
function boom(t0, g = 1) { const b = len(3.5); let ph = 0, lp = 0; for (let i = 0; i < b.length; i++) { const t = i / SR; const f = 28 + 60 * Math.exp(-t * 4); ph += 2 * Math.PI * f / SR; const n = rnd(); lp += 0.03 * (n - lp); b[i] = Math.tanh(2.2 * Math.sin(ph) * Math.exp(-t * 1.3)) + lp * 3 * Math.exp(-t * 2); } add(t0, b, g); }
function riser(t0, d) { const b = len(d); let lp = 0; for (let i = 0; i < b.length; i++) { const t = i / SR, x = t / d; const n = rnd(); lp += (0.01 + 0.5 * x * x) * (n - lp); b[i] = lp * 0.5 * x * x; } add(t0, b, 1); }
function bell(t0, m, g = 0.25) { const b = len(3); const f = hz(m); for (let i = 0; i < b.length; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 3) + 0.3 * Math.sin(2 * Math.PI * f * 5.4 * t) * Math.exp(-t * 6)) * Math.exp(-t * 1.5); } add(t0, b, g, 0.3); }
const chords = [[50, 57, 62, 65, 69], [46, 53, 58, 62, 65], [41, 53, 57, 60, 65], [48, 55, 60, 64, 67]]; // Dm Bb F C
// act 1: hits on the opening cuts, then a building pad
taiko(0, 1); boom(0, 0.8); bell(0, 74, 0.3);
for (const t of (process.env.HITS ? process.env.HITS.split(",").map(Number) : [1, 1.5, 2, 2.5])) taiko(t, 0.6);
for (let c = 0; c < 4; c++) pad(3 + c * 3.25, 3.6, chords[c], 0.22 + c * 0.05, 300, 900 + c * 300);
for (let t = 6; t < DROP - 2; t += 1) taiko(t, 0.25 + (t / DROP) * 0.4);
riser(DROP - 4, 2);
snap(DROP - 2); taiko(DROP - 2, 0.9); // the pen breaks; then silence until the drop
// act 2: the drop
boom(DROP, 1.1); taiko(DROP, 1); bell(DROP, 74, 0.35);
const ACT2 = Math.min(3, Math.floor((DUR - DROP - 1.5) / 3)); for (let c = 0; c < ACT2; c++) pad(DROP + c * 3, 3.4, chords[c].concat([chords[c][2] + 12]), 0.5, 1200, 2600, 0.15);
for (let t = DROP + 1; t < DROP + ACT2 * 3; t += 0.5) taiko(t, t % 1 ? 0.35 : 0.6);
const T3 = DROP + ACT2 * 3; pad(T3, Math.max(1.5, DUR - T3), chords[0], 0.4, 2000, 400, 0.3); bell(T3, 69, 0.3); taiko(T3, 0.9);
let peak = 0; for (let i = 0; i < N; i++) { L[i] = Math.tanh(L[i] * 0.8); R[i] = Math.tanh(R[i] * 0.8); peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const buf = Buffer.alloc(44 + N * 4); buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) { const f = i > N - SR ? (N - i) / SR : 1; buf.writeInt16LE(Math.round(L[i] / peak * 0.95 * f * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] / peak * 0.95 * f * 32767), 46 + i * 4); }
fs.writeFileSync(out, buf); console.log("wrote", out);
