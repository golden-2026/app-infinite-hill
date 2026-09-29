// "Walking with": friends who sent you a lantern by link. No server, no accounts: the link carries only
// what the sender chose to share (an optional first name they typed, the line, the door, the date, their
// days walked), and the list lives in this browser/phone under "ih:walkers". Nothing here is live.
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { label } from "@ih/content";
import { doorParam } from "@/lib/door-param";
import { readJSON, writeJSON } from "@/lib/storage";

export const WALKERS_KEY = "ih:walkers";
export type Walker = { name: string; door: string; lastLit: string; n: number };
export type LanternGift = { from: string; line: string; door: string; d: string; n: number };

const NAME_MAX = 24;
const LINE_MAX = 220;
const DAYS_MAX = 2000; // the longest path is five years (~1,826 days)

/** Plain text only: drop tags, angle brackets, control characters and extra spaces; then cut to length. */
export function cleanText(raw: unknown, max: number): string {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (typeof s !== "string") return "";
  return s
    .replace(/<(script|style)\b[^>]*>[\s\S]*?(<\/\1\s*>|$)/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>{}\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
function cleanDate(raw: unknown, today: string): string {
  const s = cleanText(raw, 10);
  if (!DATE.test(s) || Number.isNaN(Date.parse(s))) return today;
  return s > today ? today : s; // a date "from the future" is just a time-zone gap: call it today
}

function cleanDays(raw: unknown): number {
  const v = typeof raw === "number" ? Math.floor(raw) : parseInt(cleanText(raw, 6), 10);
  return Number.isFinite(v) ? Math.max(1, Math.min(DAYS_MAX, v)) : 1;
}

/** Reads a /with link's params. Returns null when there's nothing worth showing (no door or no line). */
export function readGift(p: Record<string, unknown>, today: string): LanternGift | null {
  const door = doorParam(p.door);
  const line = cleanText(p.line, LINE_MAX);
  if (!door || !line) return null;
  return { from: cleanText(p.from, NAME_MAX), line, door, d: cleanDate(p.d, today), n: cleanDays(p.n) };
}

/** The link a sender shares. The name is only what they typed; empty means it is left out entirely. */
export function giftLink(g: { from?: string; line: string; door: string; d: string; n: number }): string {
  const q: Record<string, string> = {};
  const from = cleanText(g.from, NAME_MAX);
  if (from) q.from = from;
  q.line = cleanText(g.line, LINE_MAX);
  q.door = g.door;
  q.d = g.d;
  q.n = String(cleanDays(g.n));
  const qs = Object.entries(q).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  const base =
    Platform.OS === "web" && typeof window !== "undefined" ? `${window.location.origin}/with` :
    process.env.EXPO_PUBLIC_SITE_URL ? `${process.env.EXPO_PUBLIC_SITE_URL.replace(/\/$/, "")}/with` :
    Linking.createURL("/with");
  return `${base}?${qs}`;
}

// ─── the list on this device ─────────────────────────────────────────────
const same = (a: { name: string; door: string }, b: { name: string; door: string }) =>
  a.name.toLowerCase() === b.name.toLowerCase() && a.door === b.door;

export function readWalkers(): Walker[] {
  const raw = readJSON<unknown>(WALKERS_KEY, []);
  if (!Array.isArray(raw)) return [];
  const today = "9999-12-31";
  return raw
    .map((w: any) => ({ name: cleanText(w?.name, NAME_MAX), door: doorParam(w?.door) ?? "", lastLit: cleanDate(w?.lastLit, today), n: cleanDays(w?.n) }))
    .filter((w) => w.door)
    .sort((a, b) => (a.lastLit < b.lastLit ? 1 : a.lastLit > b.lastLit ? -1 : 0));
}

/** Adds (or refreshes) the sender. One entry per name + door; keeps the latest date and day count. */
export function saveWalker(g: LanternGift): Walker[] {
  const list = readWalkers();
  const next: Walker = { name: g.from, door: g.door, lastLit: g.d, n: g.n };
  const i = list.findIndex((w) => same(w, next));
  if (i >= 0) {
    const old = list[i];
    list[i] = next.lastLit >= old.lastLit ? { ...old, lastLit: next.lastLit, n: Math.max(old.n, next.n) } : old;
  } else list.unshift(next);
  const trimmed = list.slice(0, 50);
  writeJSON(WALKERS_KEY, trimmed);
  return trimmed;
}

/** Brings "walking with" over from an export file (a new phone): merged with anyone already here. */
export function importWalkers(raw: unknown): number {
  if (!Array.isArray(raw)) return 0;
  let n = 0;
  for (const w of raw.slice(0, 50) as any[]) {
    const door = doorParam(w?.door);
    if (!door) continue;
    saveWalker({ from: cleanText(w?.name, NAME_MAX), door, d: cleanDate(w?.lastLit, "9999-12-31"), n: cleanDays(w?.n), line: "" });
    n++;
  }
  return n;
}

export function removeWalker(w: { name: string; door: string }): Walker[] {
  const list = readWalkers().filter((x) => !same(x, w));
  writeJSON(WALKERS_KEY, list);
  return list;
}

// ─── words ───────────────────────────────────────────────────────────────
export const walkerName = (w: { name: string }) => w.name || "someone";

/** "today", "yesterday", "3 days ago" (both dates are local YYYY-MM-DD). */
export function whenLit(date: string, today: string): string {
  const days = Math.round((Date.parse(today) - Date.parse(date)) / 86400000);
  if (!Number.isFinite(days) || days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export const pathWords = (door: string, n: number) => `day ${n} on the ${label(door)} path`;
