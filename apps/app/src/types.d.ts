// The shared packages are plain JS (tested with node --test). Loose types here; screens narrow as needed.
declare module "@ih/domain" {
  export type Sit = { id: string; door: string; day: number; date: string; tz: string | null; kidId: string | null; deviceId: string | null; at: string };
  export type Derived = {
    showedUp: number; dates: string[]; paths: Record<string, { day: number; done: boolean; lastDate: string | null }>;
    kids: any[]; sitsToday: number; doneToday: boolean; goal: { days: number; done: number; reached: boolean } | null;
    goldenWeeks: number; currentRun: number; missedDays: number; welcomeBack: boolean;
    streak: Streak;
  };
  export type StreakDay = "lesson" | "rest" | "restored";
  export type Streak = {
    streak: number; rest: number; clean: number; golden: boolean; doneToday: boolean; lessonsToday: number; atRisk: boolean;
    longest: number; startedOn: string | null; lastLessonDate: string | null; days: Record<string, StreakDay>;
    earnBack: { lost: number; brokeOn: string; lastDay: string; lessonsToday: number; need: number } | null;
    restoredToday: boolean; restedYesterday: boolean; today: string;
  };
  export type StreakOutcome = { before: number; after: number; grew: boolean; restored: boolean; milestone: number | null; rest: number; golden: boolean; becameGolden: boolean };
  export const STREAK_MILESTONES: readonly number[];
  export const STREAK_GOALS: readonly number[];
  export const REST_MAX: number;
  export const REST_EVERY: number;
  export const GOLDEN_AFTER: number;
  export function addDays(date: string, n: number): string;
  export function lessonCounts(sits: Sit[], kidId?: string | null): Record<string, number>;
  export function streakFrom(counts: Record<string, number>, today: string): Streak;
  export function streakOutcome(counts: Record<string, number>, today: string): StreakOutcome;
  export function streakWeek(s: Streak, today: string): { date: string; label: string; kind: "lesson" | "rest" | "today" | "empty" | "later" }[];
  export function nextGoal(days: number | null | undefined): number | null;
  export function localDate(now?: Date, timeZone?: string): string;
  export function daysBetween(a: string, b: string): number;
  export function makeSit(s: Omit<Sit, "tz" | "kidId" | "deviceId"> & Partial<Sit>): Sit;
  export function mergeSits(...logs: Sit[][]): Sit[];
  export function deriveState(log: Sit[], opts: { today: string; settings?: any }): Derived;
  export function sitOutcome(log: Sit[], date: string, kidId?: string | null): { isNewDay: boolean; showedUp: number; milestone: number | null; streak: StreakOutcome };
  /** Where placement started someone on each door ({ HINDUISM: 22 }); junk and day 1 dropped. */
  export function placedStarts(raw: unknown): Record<string, number>;
  /** Doors moved after placement ({ HINDUISM: { day: 157, at } }); junk dropped. */
  export function movedTo(raw: unknown): Record<string, { day: number; at: string }>;
  export const MILESTONES: readonly number[];
  export function readExport(input: unknown): { sits: Sit[]; settings: any; settingsVersion: number };
  export function fromP0(p0: unknown, o: { newId: () => string }): { sits: Sit[]; settings: any; settingsVersion: number } | null;
}
declare module "@ih/content" {
  export const data: any;
  export const OUTLINES: Readonly<Record<string, Map<number, any>>>;
  export const DOORS: [string, string][];
  export const GRADED: readonly string[];
  export function isV2(script: any): boolean;
  export function glossIn(gloss: any, text: string): Record<string, { meaning: string; script?: string; say?: string }> | null;
  export function composeV2(steps: any[], script: any, day: number): any[];
  export function planDay(o: { wing: string; day: number; lesson?: number; mode?: string; named?: boolean; level?: number; script?: any | null }): { steps: any[]; word: string; carry: string; title: string; info: any };
  export const LEVELS: readonly string[];
  export function clampLevel(n: number): number;
  export function deeperRound(wing: string, day: number, level: number): any[];
  export function knownSoFar(wing: string, day: number): { word: string; carry: string; day: number }[];
  export function likeness(a: string, b: string): number;
  export function wrongAnswers(answer: string, candidates: string[], o: { n: number; level: number; seed: number; meaning?: boolean }): string[];
  export function guessFor(wing: string, lesson: number, info: any): { answer: string; wrong: string[] } | null;
  export function syllables(word: string): string[];
  export function lessonInfo(wing: string, lesson: number): any;
  export function icon(wing: string): { wing: string; name: string; short: string; tint: string };
  export function label(wing: string): string;
  export function pos(day: number): { camp: string; name: string; lesson: number; of: number; start: number };
  export function camp1(wing: string): any[];
  export function screenLines(a: string[] | undefined): string[];
  export function splitBeats(text: string, max?: number, cap?: number): string[];
  // the upgraded first week (packages/content/src/week.js)
  export const WEEK_ONE: Readonly<Record<string, { day: number; word: string; q: string; options: string[]; answer: number }[]>>;
  export const SAY_IT: Readonly<Record<string, Record<string, string>>>;
  export function lookBack(door: string, day: number): { day: number; word: string; q: string; options: string[]; answer: number } | null;
  export function sayable(door: string, text: string): { text: string; say?: string }[];
  export function native(word: string, wing?: string): any;
  export function skyFor(...a: any[]): any;
  export function faceFor(...a: any[]): any;
  export function trailX(...a: any[]): any;
  export function guideFallback(...a: any[]): any;
  export const GUIDE_NO_MATCH: string;
  export function lessonCovers(d: any, q: string): boolean;
  export function iconsShared(): any[];
  export function KNOW(w: string): string[];
  export function SUN_NOTES(wing: string, short: string, word: string): any[];
  export function STRAND_WORDS(wing: string, lesson: number): { word: string; day: number; title: string }[];
  // the kids' track (packages/content/src/kids.js)
  export type KidText = { title: string; word: string; means: string; story: { head: string; text: string }[]; carry: string; breath: string; game: any; grownups: { source: string; ask: string } };
  export type KidLesson = { day: number; key: string; game: "match" | "truth"; en: KidText; es: KidText; sources: any[] };
  export const KIDS_PER_DOOR: number;
  export const KID_BREATHS: number;
  export const KID_DOORS: readonly string[];
  export function kidLessonIndex(day: number): number;
  export function kidLesson(door: string, day: number): KidLesson | null;
  export function kidPlan(o: { door: string; day: number; lang?: string; labels?: Record<string, string> }): { steps: any[]; word: string; carry: string; title: string; info: null; kid: { grownups: { source: string; ask: string }; sources: any[]; heads: string[]; key: string; day: number } } | null;
}
declare module "@ih/content/lesson-script" {
  export type LessonStore = { get(key: string): any; set(key: string, value: unknown): unknown };
  /** The full script for a door's day, or null (no script yet, or offline with nothing kept). Never throws. */
  export function lessonScript(door: string, day: number, o?: { base?: string; fetch?: typeof fetch; store?: LessonStore | null }): Promise<any | null>;
  export function resetLessonCache(): void;
  export function chunkOf(day: number): string;
}
declare module "@ih/brand" {
  export const color: Record<string, any>;
  export const font: { display: Record<number, string>; text: Record<number, string>; mark: Record<number, string> };
  export const type: { eyebrow(s?: number): any; caption(s?: number): any; title(): any; nav(): any; h1(s?: number): any; body(s?: number): any; serif(s?: number, w?: number): any; bubble(): any; choice(): any };
  export const space: Record<string, number>;
  export const radius: Record<string, number>;
  export const border: { hair: number; control: number; strong: number };
  export function art(ref: string | null | undefined): any;
}
