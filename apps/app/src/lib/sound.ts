// Read-aloud and the bell. v175 used the browser's speechSynthesis and a synthesized 528 Hz bell;
// here expo-speech (iOS + web) and assets/sounds/bell.wav (the same tone, rendered once).
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import * as Speech from "expo-speech";

let bellPlayer: AudioPlayer | null = null;
let modeSet = false;
let chimeOn = true;
/** The "sunset chime" setting: when off, the bell stays quiet. */
export const setChime = (on: boolean) => { chimeOn = on; };

export function bell() {
  if (!chimeOn) return;
  try {
    if (!modeSet) {
      modeSet = true;
      setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
    }
    bellPlayer ??= createAudioPlayer(require("../../assets/sounds/bell.wav"));
    bellPlayer.seekTo(0);
    bellPlayer.play();
  } catch {
    // sound is a nicety; never block the lesson on it
  }
}

export function speak(text: string, on: boolean, onEnd?: () => void): boolean {
  if (!on || !text) return false;
  try {
    Speech.stop();
    Speech.speak(text, { rate: 0.92, pitch: 1, onDone: onEnd ? () => { setTimeout(onEnd, 700); } : undefined });
    return true;
  } catch {
    return false;
  }
}

export function hush() {
  try {
    Speech.stop();
  } catch {}
}
