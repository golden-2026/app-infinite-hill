// The shared packages are plain JS (tested with node --test). Loose types here; screens narrow as needed.
declare module "@ih/domain" {
  export type Sit = { id: string; door: string; day: number; date: string; tz: string | null; kidId: string | null; deviceId: string | null; at: string };
  export type Derived = {
    showedUp: number; dates: string[]; paths: Record<string, { day: number; done: boolean; lastDate: string | null }>;
    kids: any[]; sitsToday: number; doneToday: boolean; goal: { days: number; done: number; reached: boolean } | null;
    goldenWeeks: number; currentRun: number; missedDays: number; welcomeBack: boolean;
  };
  export function localDate(now?: Date, timeZone?: string): string;
  export function daysBetween(a: string, b: string): number;
  export function makeSit(s: Omit<Sit, "tz" | "kidId" | "deviceId"> & Partial<Sit>): Sit;
  export function mergeSits(...logs: Sit[][]): Sit[];
  export function deriveState(log: Sit[], opts: { today: string; settings?: any }): Derived;
  export function sitOutcome(log: Sit[], date: string): { isNewDay: boolean; showedUp: number; milestone: number | null };
  export const MILESTONES: readonly number[];
  export function readExport(input: unknown): { sits: Sit[]; settings: any; settingsVersion: number };
  export function fromP0(p0: unknown, o: { newId: () => string }): { sits: Sit[]; settings: any; settingsVersion: number } | null;
}
declare module "@ih/content" {
  export const data: any;
  export const DOORS: [string, string][];
  export const GRADED: readonly string[];
  export function planDay(o: { wing: string; day: number; lesson?: number; mode?: string; named?: boolean; level?: number }): { steps: any[]; word: string; carry: string; title: string; info: any };
  export const LEVELS: readonly string[];
  export function clampLevel(n: number): number;
  export function deeperRound(wing: string, day: number, level: number): any[];
  export function knownSoFar(wing: string, day: number): { word: string; carry: string; day: number }[];
  export function likeness(a: string, b: string): number;
  export function syllables(word: string): string[];
  export function lessonInfo(wing: string, lesson: number): any;
  export function icon(wing: string): { wing: string; name: string; short: string; tint: string };
  export function label(wing: string): string;
  export function pos(day: number): { camp: string; name: string; lesson: number; of: number; start: number };
  export function camp1(wing: string): any[];
  export function screenLines(a: string[] | undefined): string[];
  export function native(word: string, wing?: string): any;
  export function skyFor(...a: any[]): any;
  export function faceFor(...a: any[]): any;
  export function trailX(...a: any[]): any;
  export function guideFallback(...a: any[]): any;
  export function iconsShared(): any[];
  export function KNOW(w: string): string[];
  export function SUN_NOTES(wing: string, short: string, word: string): any[];
  export function STRAND_WORDS(wing: string, lesson: number): { word: string; day: number; title: string }[];
}
declare module "@ih/brand" {
  export const color: Record<string, any>;
  export const font: { display: Record<number, string>; text: Record<number, string>; mark: Record<number, string> };
  export const type: { eyebrow(s?: number): any; caption(s?: number): any; title(): any; nav(): any; h1(s?: number): any; body(s?: number): any; serif(s?: number, w?: number): any };
  export const space: Record<string, number>;
  export const radius: Record<string, number>;
  export const border: { hair: number; control: number; strong: number };
  export function art(ref: string | null | undefined): any;
}
