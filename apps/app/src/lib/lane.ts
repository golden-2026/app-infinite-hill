// Which way in someone walks, from what brought them (the website's ?why=, lib/why-param.ts). Pure and import-light,
// so plain Node can test it. The homepage promises each reason a particular first day (apps/app/public/site.html
// #forwho); this file keeps the app's first screens to that promise.
//
//   gentle  grief, scary health news, something hard, forgiveness: the stance and door questions only, then straight
//           into their first-week lesson (grief/diagnosis/forgiveness) or the door's day one (hard: "a breath, a story,
//           one line"). No "how did you hear about us", no five-year map, no placement quiz, no profile summary, no
//           voice intro. The wellbeing baseline waits until their third day, and every gentle lesson ends with the
//           Guide, offered softly.
//   light   a baby, a wedding, belonging, gratitude: their first-week lesson first, no quiz up front (offered later on
//           Today), no five-year map, no profile summary.
//   quick   a teen whose parents sent them: door, the voice, day one. Nothing else.
//   full    everyone else (own, roots, god, kids, calm, partner, curious, spiritual, no reason): the whole welcome.
import { firstWeekFor } from "@/content/life-moments";

export type Lane = "gentle" | "light" | "quick" | "full";
export const GENTLE_WHYS = ["grief", "diagnosis", "hard", "forgiveness"] as const;
export const LIGHT_WHYS = ["baby", "wedding", "belonging", "gratitude"] as const;

export function laneFor(why: unknown): Lane {
  if (typeof why !== "string") return "full";
  if ((GENTLE_WHYS as readonly string[]).includes(why)) return "gentle";
  if ((LIGHT_WHYS as readonly string[]).includes(why)) return "light";
  if (why === "sent") return "quick";
  return "full";
}

/** Does the first week (content/life-moments.ts) come before the path? Gentle and light lanes with a list. */
export const weekFirst = (why: unknown, door: string) => {
  const l = laneFor(why);
  return (l === "gentle" || l === "light") && !!firstWeekFor(why, door);
};

/** After the first step (welcome/you): "how did you hear about us?" is skipped by the gentle and quick lanes. */
export function afterYou(why: unknown, heardAsked: boolean): "/welcome/heard" | "/welcome/door" {
  const l = laneFor(why);
  return heardAsked || l === "gentle" || l === "quick" ? "/welcome/door" : "/welcome/heard";
}

/** After the door: the full welcome walks the map; gentle goes straight to "ready"; light and quick meet the voice. */
export function afterDoor(why: unknown): "trail" | "ready" | "voice" {
  const l = laneFor(why);
  return l === "full" ? "trail" : l === "gentle" ? "ready" : "voice";
}

/** The first lesson someone opens: the first day of their first-week list on a week-first lane, else where the door stands. */
export function firstLesson(why: unknown, door: string, start = 1): number {
  if (!weekFirst(why, door)) return start;
  return (firstWeekFor(why, door) || [start])[0];
}

/** The next first-week day still to walk (null once the week is walked, or on a lane that doesn't lead with it). */
export function nextWeekDay(why: unknown, door: string, walked: (day: number) => boolean): number | null {
  if (!weekFirst(why, door)) return null;
  return (firstWeekFor(why, door) || []).find((d) => !walked(d)) ?? null;
}

/** The wellbeing baseline right after sign-up? Not on the gentle or quick lanes: theirs waits for the third day. */
export const baselineAtStart = (why: unknown) => { const l = laneFor(why); return l !== "gentle" && l !== "quick"; };

/** The days someone has come, counting a first-week lesson read ahead of the path (never a sit) as a day too. */
export function daysCome(sitDates: string[], weekDates: string[] | undefined): string[] {
  return [...new Set([...sitDates, ...(weekDates || [])])].sort();
}
