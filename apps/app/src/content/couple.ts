// The two-faith couple (docs/PERSONAS.md: reasons "partner" and "wedding"): who they are, which door their partner's
// family keeps, the holiday coming up on that door, and the seven days two partners walk side by side.
// Pure data + pure logic (only seasons.ts, itself import-free), so the unit tests load it straight from Node.
//
// "Before the holiday": a week or two before the next major holiday of the partner's family's door, Today offers a
// few lessons ALREADY WRITTEN in years 1–3 of that door (docs/curriculum/<door>/scripts/y1..y3), the same way
// life-moments.ts picks a first week. Nothing here is new religious content.
//
// KEEPER REVIEW REQUIRED: this selection is ours, not a Keeper's. Before public release, each door's Keeper must
// confirm (or replace) the days chosen for their tradition. The titles beside each day are the scripts' own, for that
// review only; the app shows the lesson's own title.
import { ALL_SEASONS, addDays, daysBetween, type Season, type SeasonKey } from "./seasons";

export const COUPLE_WHYS = ["partner", "wedding"] as const;
export const isCouple = (why: unknown): boolean => why === "partner" || why === "wedding";

/** The holiday card shows from this many days before the holiday, through the day itself. */
export const HOLIDAY_FROM = 14;

type Pick = [day: number, title: string];
export type HolidayKey = "navratri" | "diwali" | "advent" | "lent" | "ramadan" | "roshhashanah" | "passover" | "vaisakhi" | "gurpurab" | "vesak";
type HolidayDef = {
  key: HolidayKey;
  /** the season row (content/seasons.ts) its dates come from */
  season: SeasonKey;
  /** the holiday's own date from that row: its first day, its last (a run-up ends on the day), or the day before
   *  (the omer is counted from the second day of passover) */
  at: "start" | "end" | "before";
  lessons: Record<string, Pick[]>;
};

export const HOLIDAY_DEFS: HolidayDef[] = [
  { key: "navratri", season: "navratri", at: "start", lessons: { HINDUISM: [[80, "Navaratri: nine nights of the Goddess"], [143, "Navaratri (nine nights, nine forms; Durga)"]] } },
  { key: "diwali", season: "diwali", at: "start", lessons: { HINDUISM: [[81, "Diwali: the row of lamps"], [139, "Diwali (5 days — Dhanteras, Naraka Chaturdashi, Lakshmi puja, Govardhan, Bhai Dooj)"], [895, "Govardhan lifted"]] } },
  { key: "advent", season: "advent", at: "start", lessons: {
    CHRISTIANITY: [[110, "Advent: waiting"], [1003, "Advent: the prophets' candle"], [111, "Christmas: twelve days"]],
    CATHOLIC: [[144, "Advent"], [633, "First Sunday of Advent (Mark 13:33–37)"], [145, "Christmas is a season"]],
  } },
  { key: "lent", season: "lent", at: "start", lessons: {
    CHRISTIANITY: [[113, "Ash Wednesday: dust"], [114, "Lent: forty days"]],
    CATHOLIC: [[148, "Ash Wednesday (Genesis 3:19)"], [651, "Ash Wednesday (Joel 2:12–18)"]],
  } },
  { key: "ramadan", season: "ramadan", at: "start", lessons: { ISLAM: [[120, "Ramadan: the new moon"], [122, "Ramadan: breaking with a date"], [127, "Eid al-Fitr"]] } },
  { key: "roshhashanah", season: "awe", at: "start", lessons: { JUDAISM: [[123, "Rosh Hashanah: the shofar"], [124, "Rosh Hashanah: apples, honey, water"], [125, "Yom Kippur: the fast"]] } },
  { key: "passover", season: "omer", at: "before", lessons: { JUDAISM: [[135, "Passover: a seat at the seder"], [678, "Passover: the seder plate"]] } },
  { key: "vaisakhi", season: "vaisakhi", at: "end", lessons: { SIKHISM: [[145, "Vaisakhi: the harvest"], [84, "Vaisakhi, 1699: the call"], [146, "Vaisakhi: the procession"]] } },
  { key: "gurpurab", season: "gurpurab", at: "end", lessons: { SIKHISM: [[147, "Guru Nanak's gurpurab"], [22, "Born at Talwandi, 1469"]] } },
  { key: "vesak", season: "vesak", at: "end", lessons: { BUDDHISM: [[145, "Vesak"], [682, "Vesak, deeper"], [23, "Born in a grove"]] } },
];

export type Holiday = { key: HolidayKey; id: string; door: string; date: string; days: number[]; daysAway: number };

const dateOf = (d: HolidayDef, s: Season) => (d.at === "end" ? s.end : d.at === "before" ? addDays(s.start, -1) : s.start);

/** The holiday on this door that is 0–14 days away (the soonest), with its lessons. Null when none is that close. */
export function holidayFor(door: string | null | undefined, today: string): Holiday | null {
  if (!door) return null;
  let best: Holiday | null = null;
  for (const d of HOLIDAY_DEFS) {
    const list = d.lessons[door];
    if (!list?.length) continue;
    for (const s of ALL_SEASONS) {
      if (s.key !== d.season) continue;
      const date = dateOf(d, s);
      const away = daysBetween(today, date);
      if (away < 0 || away > HOLIDAY_FROM) continue;
      if (!best || away < best.daysAway) best = { key: d.key, id: `${d.key}-${date}`, door, date, days: list.map(([n]) => n), daysAway: away };
    }
  }
  return best;
}

/** May this day open ahead of where the door stands? Only a lesson on the partner's door's holiday list, while the
 *  holiday card is up. */
export function holidayOpens(partnerDoor: string | null | undefined, door: string, day: number, today: string): boolean {
  if (!partnerDoor || partnerDoor !== door) return false;
  return !!holidayFor(door, today)?.days.includes(day);
}

const DOORS = ["CHRISTIANITY", "CATHOLIC", "HINDUISM", "ISLAM", "JUDAISM", "BUDDHISM", "SIKHISM"];
/**
 * The door their partner's family keeps: the one they chose under "walk it together", else for "partner" the faith
 * they said they're learning (their own door), else for "wedding" a door they're visiting. "my own path" is nobody's
 * family door here (it has no holidays of its own).
 */
export function partnerDoorOf(o: { why: unknown; chosen?: string | null; learning?: string | null; home: string; visit?: string | null }): string | null {
  if (!isCouple(o.why)) return null;
  if (o.chosen && DOORS.includes(o.chosen)) return o.chosen;
  if (o.why === "partner") return o.learning && DOORS.includes(o.learning) ? o.learning : DOORS.includes(o.home) ? o.home : null;
  return o.visit && DOORS.includes(o.visit) && o.visit !== o.home ? o.visit : null;
}

// ─── walk it together ─────────────────────────────────────────────────────
// Two partners on different doors each walk their own door's lesson for seven days. All either one sees of the other
// is the friends server's progress signal (lib/friends: done today, days together): never a lesson, answer, journal
// line or Guide question.

export const WALK_DAYS = 7;
/** `on`: the first day. `friendId`: the partner, once paired (lib/friends). `known`: the friends already on this phone
 *  when the link went out, so the first new one is them. `seen`: days this phone saw them done (from the signal). */
export type Walk = { on: string; friendId?: string | null; known?: string[]; seen?: string[]; closed?: boolean };
export type WalkStone = { date: string; me: "lit" | "today" | "missed" | "later"; them: "lit" | "open" | "later" };
export type WalkView = { day: number; stones: WalkStone[]; mine: number; theirs: number; finished: boolean; over: boolean };

/** The partner among the friends: the one chosen, else the first friend who wasn't there when the link went out. */
export function walkPartner<F extends { id: string }>(walk: Walk | null | undefined, friends: F[]): F | null {
  if (!walk) return null;
  if (walk.friendId) return friends.find((f) => f.id === walk.friendId) || null;
  const known = new Set(walk.known || []);
  return friends.find((f) => !known.has(f.id)) || null;
}

/** The seven stones, side by side: your days from your own lessons, theirs from what the signal showed. */
export function walkView(walk: Walk, o: { myDates: Iterable<string>; theirDoneToday?: boolean; today: string }): WalkView {
  const mine = new Set(o.myDates);
  const theirs = new Set(walk.seen || []);
  if (o.theirDoneToday) theirs.add(o.today);
  const stones: WalkStone[] = Array.from({ length: WALK_DAYS }, (_, i) => {
    const date = addDays(walk.on, i);
    const me = mine.has(date) ? "lit" : date === o.today ? "today" : date < o.today ? "missed" : "later";
    const them = theirs.has(date) ? "lit" : date > o.today ? "later" : "open";
    return { date, me, them };
  });
  const day = Math.min(WALK_DAYS, Math.max(1, daysBetween(walk.on, o.today) + 1));
  const m = stones.filter((s) => s.me === "lit").length;
  const t = stones.filter((s) => s.them === "lit").length;
  const last = addDays(walk.on, WALK_DAYS - 1);
  return { day, stones, mine: m, theirs: t, finished: m === WALK_DAYS && t === WALK_DAYS, over: o.today > last };
}

/** Remember that the partner was seen done today (once per day). Returns the walk unchanged when nothing is new. */
export function noteSeen(walk: Walk, today: string, theirDoneToday: boolean): Walk {
  if (!theirDoneToday || (walk.seen || []).includes(today) || today < walk.on || today > addDays(walk.on, WALK_DAYS - 1)) return walk;
  return { ...walk, seen: [...(walk.seen || []), today].slice(-WALK_DAYS) };
}
