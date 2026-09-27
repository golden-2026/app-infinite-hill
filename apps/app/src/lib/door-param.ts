import { DOORS } from "@ih/content";

/** A door from a URL: any case ("hinduism", "Hinduism"), only one of the eight, otherwise null (never guessed). */
export function doorParam(raw: unknown): string | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (typeof s !== "string") return null;
  const up = s.trim().toUpperCase();
  return DOORS.some(([, w]) => w === up) ? up : null;
}
