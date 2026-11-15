// The class months built so far in the new format, by home. /class?home=<key> picks one (Christian first, owner 2026-10-21).
import { CHRISTIAN_CLASS_DONE_KEY, CHRISTIAN_MONTH1, CHRISTIAN_MONTH1_DAYS } from "./christian-month1";
import { CLASS_DONE_KEY, HINDU_MONTH1, HINDU_MONTH1_DAYS, type ClassDay, type ClassWeek } from "./hindu-month1";

export type ClassMonth = { key: string; land: string; faith: string; theme: string; weeks: ClassWeek[]; days: ClassDay[]; doneKey: string; places: string };

export const CLASS_MONTHS: ClassMonth[] = [
  { key: "christian", land: CHRISTIAN_MONTH1.land, faith: "Christianity", theme: CHRISTIAN_MONTH1.theme, weeks: CHRISTIAN_MONTH1.weeks, days: CHRISTIAN_MONTH1_DAYS, doneKey: CHRISTIAN_CLASS_DONE_KEY, places: "the chapel, the waterfall, the grove, home" },
  { key: "hindu", land: HINDU_MONTH1.land, faith: "Hinduism", theme: HINDU_MONTH1.theme, weeks: HINDU_MONTH1.weeks, days: HINDU_MONTH1_DAYS, doneKey: CLASS_DONE_KEY, places: "the waterfall, the temple, the cave, home" },
];

export const classMonth = (key?: string) => CLASS_MONTHS.find((m) => m.key === key) ?? CLASS_MONTHS[0];
