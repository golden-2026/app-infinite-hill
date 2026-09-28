// Game sounds, synthesized live with Web Audio (no files). Our own palette: small temple bells, a wooden
// tock, a soft low "hmm", warm chord swells. Every cue is short and quiet, runs through a gentle limiter and a
// touch of room, and follows the "sunset chime" setting (setFxOn), so someone who turned sound down gets a quiet game.
import { Platform } from "react-native";

let on = true;
export const setFxOn = (v: boolean) => { on = v; };

export type Cue =
  | "right" | "wrong" | "combo" | "complete" | "tap" | "reward"
  | "tick" | "tock" | "whoosh" | "lantern" | "rise";

// ─── the audio graph (built once) ─────────────────────────────────────────
type Bus = { c: AudioContext; dry: AudioNode; wet: AudioNode; noise: AudioBuffer };
let bus: Bus | null = null;

function ac(): Bus | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  try {
    if (!bus) {
      const C = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!C) return null;
      const c: AudioContext = new C();
      // master: overall level → soft limiter → speakers
      const master = c.createGain();
      master.gain.value = 0.9;
      const lim = c.createDynamicsCompressor();
      lim.threshold.value = -14; lim.knee.value = 10; lim.ratio.value = 6; lim.attack.value = 0.003; lim.release.value = 0.2;
      master.connect(lim).connect(c.destination);
      // a small warm room: a generated, darkened impulse response on a send
      const room = c.createConvolver();
      room.buffer = impulse(c, 1.4);
      const roomTone = c.createBiquadFilter();
      roomTone.type = "lowpass"; roomTone.frequency.value = 3200;
      const wet = c.createGain();
      wet.gain.value = 0.22;
      wet.connect(room).connect(roomTone).connect(master);
      bus = { c, dry: master, wet, noise: noiseBuffer(c) };
    }
    if (bus.c.state === "suspended") bus.c.resume().catch(() => {});
    return bus;
  } catch { return null; }
}

function impulse(c: AudioContext, secs: number) {
  const n = Math.floor(c.sampleRate * secs);
  const b = c.createBuffer(2, n, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2);
  }
  return b;
}

function noiseBuffer(c: AudioContext) {
  const n = Math.floor(c.sampleRate * 1);
  const b = c.createBuffer(1, n, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

/** Route a node to the dry master and (a little of it) to the room. */
function out(b: Bus, node: AudioNode, room = 1) {
  node.connect(b.dry);
  if (room > 0) {
    const s = b.c.createGain();
    s.gain.value = room;
    node.connect(s).connect(b.wet);
  }
}

/** A gain envelope: quick (or slow) rise to `vol`, exponential fall to silence by `len`. */
function env(c: AudioContext, t: number, vol: number, attack: number, len: number) {
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  return g;
}

function osc(c: AudioContext, f: number, t: number, len: number, wave: OscillatorType = "sine") {
  const o = c.createOscillator();
  o.type = wave;
  o.frequency.setValueAtTime(f, t);
  o.start(t);
  o.stop(t + len + 0.05);
  return o;
}

// ─── instruments ──────────────────────────────────────────────────────────
// A small bell: a few inharmonic partials, the high ones dying first, so it rings then mellows.
const BELL: [number, number, number][] = [
  // [ratio, relative level, relative decay]
  [1, 1, 1],
  [2.0, 0.42, 0.62],
  [2.76, 0.26, 0.42],
  [4.07, 0.12, 0.28],
  [5.43, 0.06, 0.2],
];
function bell(b: Bus, f: number, at: number, vol = 0.12, len = 0.9, room = 1) {
  const { c } = b;
  const t = c.currentTime + at;
  for (const [r, lv, dk] of BELL) {
    const fr = f * r;
    if (fr > 12000) continue;
    const g = env(c, t, vol * lv, 0.004, Math.max(0.08, len * dk));
    out(b, osc(c, fr, t, len * dk).connect(g), room);
  }
}

// A wooden tock: a pitch-dropping sine body plus a tiny filtered click.
function wood(b: Bus, f: number, at: number, vol = 0.1, len = 0.09, room = 0.3) {
  const { c } = b;
  const t = c.currentTime + at;
  const o = osc(c, f, t, len);
  o.frequency.exponentialRampToValueAtTime(f * 0.62, t + len * 0.7);
  out(b, o.connect(env(c, t, vol, 0.002, len)), room);
  const n = c.createBufferSource();
  n.buffer = b.noise;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass"; bp.frequency.value = f * 3; bp.Q.value = 2.5;
  n.connect(bp).connect(env(c, t, vol * 0.5, 0.001, 0.025)).connect(b.dry);
  n.start(t, Math.random() * 0.5); n.stop(t + 0.04);
}

// A warm pad voice: two gently detuned soft waves through a lowpass, slow swell in and out.
function pad(b: Bus, f: number, at: number, vol = 0.05, attack = 0.25, len = 1.4, cutoff = 1800, room = 1.2) {
  const { c } = b;
  const t = c.currentTime + at;
  const lp = c.createBiquadFilter();
  lp.type = "lowpass"; lp.frequency.value = cutoff; lp.Q.value = 0.4;
  const g = env(c, t, vol, attack, len);
  osc(c, f * 0.997, t, len, "triangle").connect(lp);
  osc(c, f * 1.003, t, len, "sine").connect(lp);
  out(b, lp.connect(g), room);
  return lp;
}

// A breath of air: filtered noise sweeping from `f0` to `f1`.
function air(b: Bus, at: number, len: number, f0: number, f1: number, vol = 0.05, room = 0.6) {
  const { c } = b;
  const t = c.currentTime + at;
  const n = c.createBufferSource();
  n.buffer = b.noise;
  n.loop = true;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass"; bp.Q.value = 1.1;
  bp.frequency.setValueAtTime(f0, t);
  bp.frequency.exponentialRampToValueAtTime(f1, t + len * 0.8);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + len * 0.4);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  out(b, n.connect(bp).connect(g), room);
  n.start(t, Math.random() * 0.4); n.stop(t + len + 0.05);
}

// ─── pitches: a warm major-pentatonic ladder on D (bright but never shrill) ──
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
const PENTA = [0, 2, 4, 7, 9];
/** step n on the pentatonic ladder above D5 */
const ladder = (n: number) => hz(74 + 12 * Math.floor(n / 5) + PENTA[((n % 5) + 5) % 5]);

/**
 * Play a cue. `level` is optional: for "combo" it is the streak (higher streak → the sparkle climbs higher
 * and has more notes); others ignore it.
 */
export function play(cue: Cue, level?: number) {
  if (!on) return;
  const b = ac();
  if (!b) return;
  try {
    switch (cue) {
      case "tap": // a tiny wooden tock
        wood(b, 820, 0, 0.07, 0.07, 0.15);
        break;
      case "tick": // a timer tick: very quiet, very short
        wood(b, 1900, 0, 0.022, 0.035, 0);
        break;
      case "tock": // a rhythm beat: rounder, lower wood block
        wood(b, 520, 0, 0.11, 0.12, 0.35);
        break;
      case "right": // two small bells, a fourth apart, rising
        bell(b, hz(79), 0, 0.1, 0.7);
        bell(b, hz(86), 0.075, 0.09, 1.0);
        break;
      case "wrong": // a gentle low "hmm": soft, dark, a slight dip (never a buzzer)
        {
          pad(b, hz(55), 0, 0.075, 0.04, 0.42, 520, 0.4);
          const { c } = b;
          const t = c.currentTime;
          const o = osc(c, hz(50), t + 0.14, 0.34);
          o.frequency.exponentialRampToValueAtTime(hz(48), t + 0.46);
          const f = c.createBiquadFilter();
          f.type = "lowpass"; f.frequency.value = 480;
          out(b, o.connect(f).connect(env(c, t + 0.14, 0.07, 0.05, 0.36)), 0.4);
        }
        break;
      case "combo": { // a sparkle arpeggio that starts higher and runs longer as the streak grows
        const lv = Math.max(3, Math.min(20, level ?? 3));
        const start = Math.min(7, Math.floor((lv - 3) / 2));
        const count = Math.min(7, 4 + Math.floor(lv / 5));
        for (let i = 0; i < count; i++) bell(b, ladder(start + i), i * 0.055, 0.075, 0.55 + i * 0.05);
        bell(b, ladder(start + count + 1), count * 0.055 + 0.04, 0.06, 1.1);
        break;
      }
      case "reward": // a handful of light bells scattering upward
        [0, 2, 4, 5, 7].forEach((n, i) => bell(b, ladder(n + 2), i * 0.06, 0.07, 0.8));
        air(b, 0, 0.6, 3000, 7000, 0.015, 0.8);
        break;
      case "complete": { // a warm chord swells in, then bells ring over it
        [hz(50), hz(57), hz(62), hz(66), hz(69), hz(76)].forEach((f, i) => pad(b, f, i * 0.03, 0.035, 0.3, 1.8, 2200));
        [0, 2, 3, 5].forEach((n, i) => bell(b, ladder(n), 0.18 + i * 0.1, 0.08, 1.0));
        bell(b, ladder(7), 0.62, 0.075, 1.6);
        break;
      }
      case "whoosh": // a soft breath of air across the screen
        air(b, 0, 0.32, 380, 2200, 0.05, 0.5);
        break;
      case "lantern": // a soft rising shimmer, like a flame catching
        air(b, 0, 0.7, 900, 4800, 0.018, 1);
        [0, 1, 2, 3, 4, 5].forEach((n, i) => bell(b, ladder(n + 3), 0.05 + i * 0.07, 0.035 + i * 0.004, 0.7));
        break;
      case "rise": { // sunrise: a low warm chord that opens up and brightens, one bell on top
        const { c } = b;
        const t = c.currentTime;
        [hz(38), hz(45), hz(50), hz(54), hz(57)].forEach((f, i) => {
          const lp = pad(b, f, i * 0.06, 0.04, 0.7, 2.2, 300, 1.2);
          lp.frequency.setValueAtTime(300, t);
          lp.frequency.exponentialRampToValueAtTime(2600, t + 1.3);
        });
        air(b, 0.1, 1.4, 300, 2600, 0.012, 1);
        bell(b, hz(81), 1.0, 0.06, 1.6);
        break;
      }
    }
  } catch {}
}
