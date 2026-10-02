// The app's words in the person's language. t("area.key", { slot }) everywhere; useLang() in a component that must
// re-render on a switch (the root layout re-mounts the screens when the language changes, so most screens need not).
//
// The language is picked once on open (core.chooseLang: a ?lang= link, then the choice under You, then the phone's
// language) and kept on this phone only (never synced, never sent anywhere except as the fixed "en" | "es" the
// companion and the Guide use to answer in the same language).
import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import { getLocales } from "expo-localization";
import { label as contentLabel } from "@ih/content";

import { readJSON, writeJSON } from "@/lib/storage";
import { chooseLang, fill, formatDate, formatNumber, getLang, isLang, render, setLangState, subscribeLang, type Lang, type Vars } from "./core";
import { EN, ES } from "./strings";

export type { Lang } from "./core";
export { formatDate, formatNumber, getLang, fill } from "./core";
export type Key = keyof typeof EN;

export const LANG_KEY = "ih:lang";

function urlLang(): string | null {
  if (Platform.OS !== "web") return null;
  try {
    return new URLSearchParams(globalThis.location?.search || "").get("lang");
  } catch {
    return null;
  }
}

function deviceTags(): string[] {
  try {
    return getLocales().map((l) => l.languageTag);
  } catch {
    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    return nav?.languages ? [...nav.languages] : nav?.language ? [nav.language] : [];
  }
}

function applyDocument(l: Lang) {
  if (Platform.OS === "web" && typeof document !== "undefined") document.documentElement.lang = l === "es" ? "es" : "en";
}

/** Runs once, on import: the first render is already in the right language. A ?lang= link is kept as the choice. */
function init() {
  const url = urlLang();
  const saved = readJSON<unknown>(LANG_KEY, null);
  const l = chooseLang({ url, saved, device: deviceTags() });
  if (url && isLang(url.toLowerCase().slice(0, 2)) && saved !== l) writeJSON(LANG_KEY, l);
  setLangState(l);
  applyDocument(l);
}
init();

/** The person's choice under You. Saved on this phone; the screens re-mount in the new language. */
export function setLang(l: Lang) {
  if (!isLang(l)) return;
  writeJSON(LANG_KEY, l);
  setLangState(l);
  applyDocument(l);
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribeLang, getLang, getLang);
}

export const isEs = () => getLang() === "es";

/** One message, in the current language. Plurals read vars.count. */
export function t(key: Key, vars?: Vars): string {
  return render({ en: EN as Record<string, any>, es: ES as Record<string, any> }, key, vars);
}

/** Pick between two literal texts (for a one-off where a key would be noise). Prefer t() for anything reused. */
export const tr = (en: string, es: string, vars?: Vars) => fill(getLang() === "es" ? es : en, vars);

/** A number written the language's way. */
export const num = (x: number, opts?: Intl.NumberFormatOptions) => formatNumber(x, getLang(), opts);

/** A door's name ("Hinduism" / "hinduismo"). Use instead of @ih/content's label() for anything on screen. */
export function doorLabel(wing: string): string {
  const k = `door.${wing}` as Key;
  return k in EN ? t(k) : contentLabel(wing);
}

/** "Camp 2" → "Camp 2" / "campamento 2"; "Year 3" → "año 3". */
export function campLabel(camp: string): string {
  const c = /^Camp (\d+)$/.exec(camp);
  if (c) return t("camp.label", { n: c[1] });
  const y = /^Year (\d+)$/.exec(camp);
  if (y) return t("camp.year", { n: y[1] });
  return camp;
}

/** A camp's name ("The stories" / "las historias"); the years after year one are "the ranges". */
export function campName(camp: string, name: string): string {
  const k = `camp.${camp}` as Key;
  if (k in EN) return t(k);
  if (/^the ranges$/i.test(name)) return t("camp.ranges");
  return name;
}

/** A placement stretch inside a sentence: "camp 3, the practices" / "year 2, The Yoga Sutras of Patanjali". The camps'
 *  own names go lowercase (the brand voice); names from the lessons keep their capitals (they're mostly proper names). */
export function stretchLabel(camp: string, name: string, sep = ", "): string {
  const n = campName(camp, name);
  return `${campLabel(camp).toLowerCase()}${sep}${/^Camp \d+$/.test(camp) ? n.toLowerCase() : n}`;
}

/** Weekday / month names etc. in the current language. */
export const date = (d: Date | string, opts: Intl.DateTimeFormatOptions) => formatDate(d, opts, getLang());
