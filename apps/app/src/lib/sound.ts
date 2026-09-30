// Read-aloud and the bell. v175 used the browser's speechSynthesis and a synthesized 528 Hz bell;
// here expo-speech (iOS + web) and assets/sounds/bell.wav (the same tone, rendered once).
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import * as Speech from "expo-speech";
import { getLang } from "@/i18n/core";

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

/**
 * Reads lesson text aloud. The lessons are English (phase 1 of Spanish), so with the app in Spanish the voice is told
 * to read English; otherwise a Spanish page would read an English lesson with a Spanish voice. In English nothing
 * changes (the phone's own default voice).
 */
export function speak(text: string, on: boolean, onEnd?: () => void): boolean {
  return say(text, on, onEnd, getLang() === "es" ? "en-US" : undefined);
}

/** Reads a line the app itself wrote (a cheer, "one more time …") in the app's language. */
export function speakChrome(text: string, on: boolean, onEnd?: () => void): boolean {
  return say(text, on, onEnd, getLang() === "es" ? "es-MX" : undefined);
}

function say(text: string, on: boolean, onEnd: (() => void) | undefined, language: string | undefined): boolean {
  if (!on || !text) return false;
  try {
    Speech.stop();
    Speech.speak(text, { rate: 0.92, pitch: 1, ...(language ? { language } : {}), onDone: onEnd ? () => { setTimeout(onEnd, 700); } : undefined });
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
