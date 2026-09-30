// Truthful voice disclosure. A named voice is claimed only when its license is signed (BUILD_BRIEF,
// "Voice, disclosure and legal"). Add a door here only with the signed paper on file.
import { data } from "@ih/content";
import { isEs, t, type Key } from "@/i18n";
import { EN } from "@/i18n/strings";

export const LICENSED_VOICES: Record<string, true> = {};

export function voiceLabel(door: string, name: string) {
  if (LICENSED_VOICES[door]) return { licensed: true, short: name, claim: t("onboarding.voiceLabel.claim", { name }) };
  return {
    licensed: false,
    short: t("onboarding.voiceLabel.house"),
    claim: t("onboarding.voiceLabel.pending", { name }),
  };
}

/** A proposed voice's credentials (data.BIO), in the person's language. Prototype copy: nothing here says they signed. */
export function voiceBio(wing: string): string {
  const k = `onboarding.bio.${wing}` as Key;
  const en = (data.BIO as Record<string, string>)[wing] || "";
  // English straight from the content (so it can never drift); Spanish only while it still translates that same line
  return isEs() && en && en === EN[k] ? t(k) : en;
}
