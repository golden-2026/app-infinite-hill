// @ih/brand: v175's design tokens for React Native + web. Colours and type come from the design build
// (packages/content data C / F / eyebrow / h1 / body); CSS-only values (em, gradients) are converted here.
import { ART } from "../art/index.js";

// Night on the hill (owner, 2026-10-28: "make everything the rich look", matching the story films): page = night,
// cards = deep navy, words = warm cream, highlight = the brand yellow (owner: keep the yellow so the mascot fits). Roles are unchanged: cream is still the page,
// ink is still the strongest words and filled buttons, white is still a card surface.
// The loud brand (2026-11-06, episodes/BRIEF.md + Magna's playbook): lime + black is the ownable look. Page = ink
// black, cards = near-black, words = cream #F3EFE4, the one brand accent = lime. The roles above are unchanged.
export const color = Object.freeze({
  cream: "#0A0A0A", sand: "#1C1C1A", ink: "#F3EFE4", gold: "#EEFF6A", green: "#19E68C",
  mute: "#ABA698", line: "#2C2C29", text: "#E6E1D4", white: "#151514", danger: "#FF6B7F", scrim: "#000000B3",
  dusk: ["#0A0A0A", "#111110", "#1C1C1A"], // DUSK gradient stops (0%, 60%, 100%)
  night: "#070A14", black: "#0A0A0A", lime: "#EEFF6A",
});

// The loud brand's accents. Lime stays the one brand colour; these are colour blocks, faith tags and game hits.
export const accent = Object.freeze({ lime: "#EEFF6A", pink: "#FF2D8A", saffron: "#FF8A1F", green: "#19E68C", blue: "#2F7BFF", violet: "#9B5CFF" });

/** Each door's bold colour (its lessons play as episodes in it). "my own religion" wears the brand lime. */
export const doorColor = Object.freeze({
  CHRISTIANITY: accent.blue, CATHOLIC: accent.violet, JUDAISM: accent.pink, ISLAM: accent.green,
  HINDUISM: accent.saffron, BUDDHISM: accent.saffron, SIKHISM: accent.blue, SPIRITUAL: accent.lime,
});
/** The colour for a door key (any case); lime when unknown. */
export const doorAccent = (door) => (door && doorColor[String(door).toUpperCase()]) || accent.lime;

// Font family names registered by the app's font loader (@expo-google-fonts).
// Loud brand: Anton (one weight, shown uppercase) for headlines and the wordmark; Manrope for everything else (was Inter).
// display 800 (card titles, numbers) stays Manrope ExtraBold so sentences inside cards stay easy to read.
export const font = Object.freeze({
  display: { 500: "Manrope_500Medium", 700: "Manrope_700Bold", 800: "Manrope_800ExtraBold" }, // v175 F.serif
  text: { 400: "Manrope_500Medium", 500: "Manrope_500Medium", 600: "Manrope_700Bold", 700: "Manrope_800ExtraBold" }, // F.sans / F.mono
  mark: { 800: "Anton_400Regular" }, // F.mark (wordmark, combo flash)
  head: "Anton_400Regular", // the huge uppercase headlines
});

// v175 text styles. letterSpacing in em → points (em × fontSize).
export const type = Object.freeze({
  // Labels only (a few words). v175 used 7–9px; 11px is the floor on a phone (app review 2026-09-26).
  // A sentence is never a label: use caption.
  eyebrow: (size = 11) => { const fs = Math.max(11, size); return { fontFamily: font.text[700], fontSize: fs, letterSpacing: 0.18 * fs, textTransform: "uppercase", color: color.mute }; },
  caption: (size = 13) => ({ fontFamily: font.text[400], fontSize: size, lineHeight: Math.round(size * 1.4), color: color.mute }),
  /** The one large page title (every tab and pushed screen). */
  title: () => ({ fontFamily: font.head, fontSize: 42, letterSpacing: 0.2, lineHeight: 42, textTransform: "uppercase", color: color.ink }),
  /** The compact title in the top bar. */
  nav: () => ({ fontFamily: font.head, fontSize: 18, letterSpacing: 0.4, textTransform: "uppercase", color: color.ink }),
  // Anton runs small for its size: headlines get +10% and a tight line (Magna's "huge confident type")
  h1: (size = 32) => { const fs = Math.round(size * 1.1); return { fontFamily: font.head, fontSize: fs, letterSpacing: 0.005 * fs, lineHeight: Math.round(fs * 1.02), textTransform: "uppercase", color: color.ink }; },
  /** The loud one: a whole-screen kinetic headline (episode openers, done, welcome). */
  shout: (size = 64) => ({ fontFamily: font.head, fontSize: size, lineHeight: Math.round(size * 0.94), letterSpacing: 0.005 * size, textTransform: "uppercase", color: color.ink }),
  body: (size = 14) => ({ fontFamily: font.text[400], fontSize: size, lineHeight: Math.round(1.45 * size), color: color.text }),
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
