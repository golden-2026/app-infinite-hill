// Truthful voice disclosure. A named voice is claimed only when its licence is signed (BUILD_BRIEF,
// "Voice, disclosure and legal"). Add a door here only with the signed paper on file.
export const LICENSED_VOICES: Record<string, true> = {};

export function voiceLabel(door: string, name: string) {
  if (LICENSED_VOICES[door]) return { licensed: true, short: name, claim: `${name} reads every lesson. It's a licensed voice, used with their permission.` };
  return {
    licensed: false,
    short: "the house voice",
    claim: `${name} will read these lessons once they record. For now it's the house voice, reading lines that are still drafts, waiting on a Keeper's review.`,
  };
}
