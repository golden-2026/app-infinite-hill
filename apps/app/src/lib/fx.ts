// Game sounds: short synthesized cues for right, wrong, combo and lesson-complete (web: Web Audio, no files).
// They follow the "sunset chime" setting, so someone who turned sound down gets a quiet game.
import { Platform } from "react-native";

let on = true;
export const setFxOn = (v: boolean) => { on = v; };

let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  try {
    const C = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!C) return null;
    ctx ??= new C();
    if (ctx!.state === "suspended") ctx!.resume().catch(() => {});
    return ctx;
  } catch { return null; }
}

/** One soft note: frequency (Hz), start offset and length (s), waveform, peak volume. */
function note(c: AudioContext, f: number, at: number, len: number, wave: OscillatorType = "sine", vol = 0.18) {
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = wave;
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + len + 0.02);
}

export type Cue = "right" | "wrong" | "combo" | "complete" | "tap" | "reward";
export function play(cue: Cue) {
  if (!on) return;
  const c = ac();
  if (!c) return;
  try {
    switch (cue) {
      case "tap": note(c, 660, 0, 0.06, "triangle", 0.06); break;
      case "right": note(c, 784, 0, 0.14, "triangle"); note(c, 1175, 0.09, 0.22, "triangle"); break; // G5 → D6
      case "wrong": note(c, 220, 0, 0.18, "square", 0.07); note(c, 185, 0.12, 0.22, "square", 0.06); break;
      case "combo": [784, 988, 1175, 1568].forEach((f, i) => note(c, f, i * 0.06, 0.16, "triangle", 0.14)); break;
      case "reward": [1047, 1319, 1568, 2093].forEach((f, i) => note(c, f, i * 0.05, 0.2, "sine", 0.12)); break;
      case "complete": [523, 659, 784, 1047].forEach((f, i) => note(c, f, i * 0.11, 0.35, "triangle", 0.16)); note(c, 1319, 0.5, 0.6, "sine", 0.12); break;
    }
  } catch {}
}
