// @ih/brand: v175's design tokens for React Native + web. Colours and type come from the design build
// (packages/content data C / F / eyebrow / h1 / body); CSS-only values (em, gradients) are converted here.
import { ART } from "../art/index.js";

export const color = Object.freeze({
  cream: "#F7F7F5", sand: "#ECECE8", ink: "#0A0A0A", gold: "#EEFF6A", green: "#8DE24A",
  mute: "#6b6b6b", line: "#E3E3DE", text: "#1a1a1a", white: "#FFFFFF", danger: "#B42318", scrim: "#0A0A0A73",
  dusk: ["#0A0A0A", "#161616", "#222222"], // DUSK gradient stops (0%, 60%, 100%)
});

// Font family names registered by the app's font loader (@expo-google-fonts).
export const font = Object.freeze({
  display: { 500: "Manrope_500Medium", 700: "Manrope_700Bold", 800: "Manrope_800ExtraBold" }, // v175 F.serif
  text: { 400: "Inter_400Regular", 500: "Inter_500Medium", 600: "Inter_600SemiBold", 700: "Inter_700Bold" }, // F.sans / F.mono
  mark: { 800: "Baloo2_800ExtraBold" }, // F.mark (wordmark, combo flash)
});

// v175 text styles. letterSpacing in em → points (em × fontSize).
export const type = Object.freeze({
  // Labels only (a few words). v175 used 7–9px; 11px is the floor on a phone (app review 2026-09-26).
  // A sentence is never a label: use caption.
  eyebrow: (size = 11) => { const fs = Math.max(11, size); return { fontFamily: font.text[600], fontSize: fs, letterSpacing: 0.14 * fs, textTransform: "uppercase", color: color.mute }; },
  caption: (size = 13) => ({ fontFamily: font.text[400], fontSize: size, lineHeight: Math.round(size * 1.4), color: color.mute }),
  /** The one large page title (every tab and pushed screen). */
  title: () => ({ fontFamily: font.display[800], fontSize: 30, letterSpacing: -0.9, lineHeight: 33, color: color.ink }),
  /** The compact title in the top bar. */
  nav: () => ({ fontFamily: font.text[600], fontSize: 16, color: color.ink }),
  h1: (size = 32) => ({ fontFamily: font.display[800], fontSize: size, letterSpacing: -0.03 * size, lineHeight: Math.round(1.02 * size * 1.05), color: color.ink }),
  body: (size = 14) => ({ fontFamily: font.text[400], fontSize: size, lineHeight: Math.round(1.5 * size), color: color.text }),
  serif: (size = 18, weight = 800) => ({ fontFamily: font.display[weight], fontSize: size, color: color.ink }),
  /** What the mascot (or a voice) says, in its bubble. One size everywhere. */
  bubble: () => ({ fontFamily: font.display[500], fontSize: 18, lineHeight: 22, color: color.ink }),
  /** An answer row in a question (ui ChoiceRow): onboarding's choices, single or multi. */
  choice: () => ({ fontFamily: font.display[500], fontSize: 17, lineHeight: 22, color: color.ink }),
});

export const space = Object.freeze({ xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, gutter: 18 });
// One scale each (app review 2026-09-26): cards 20, choices and tiles 16, inputs 14, pills round, sheets 28.
export const radius = Object.freeze({ card: 20, tile: 16, control: 16, input: 14, pill: 999, btn: 999, sheet: 28 });
export const border = Object.freeze({ hair: 1, control: 1.5, strong: 2 });

/** "art:<key>" (from content data) → an image source for <Image>. Unknown keys return null. */
export function art(ref) {
  if (!ref || typeof ref !== "string") return null;
  const key = ref.startsWith("art:") ? ref.slice(4) : ref;
  return ART[key] ?? null;
}
export { ART };
