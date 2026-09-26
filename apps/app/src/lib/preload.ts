// Warm the browser/app cache with the art the first sessions show, right after the first paint, so
// characters and portraits never pop in late or show blank (QA 2026-09-26).
import { art } from "@ih/brand";
import { data } from "@ih/content";
import { Asset } from "expo-asset";

const POSES = ["wave", "path", "point", "think", "meditate", "music", "joy", "jump", "wonder", "phone", "hike", "sleep", "thumbs", "shades", "dog", "heart", "sitrock", "peace", "namaste"];

export function preloadArt(firstDoor?: string) {
  const refs: string[] = [data.SUN_IMG, data.LOGO_MARK, ...POSES.map((p) => data.GUY[p]).filter(Boolean)];
  const photos = Object.entries(data.PHOTOS as Record<string, string>);
  photos.sort(([a], [b]) => (a === firstDoor ? -1 : b === firstDoor ? 1 : 0));
  refs.push(...photos.map(([, r]) => r));
  refs.push(data.HILL_FACES.morning.bg, data.HILL_FACES.gold.bg);
  const modules = refs.map((r) => art(r)?.src).filter(Boolean);
  const idle = (cb: () => void) => (typeof (globalThis as any).requestIdleCallback === "function" ? (globalThis as any).requestIdleCallback(cb) : setTimeout(cb, 400));
  idle(() => { Asset.loadAsync(modules as number[]).catch(() => {}); });
}
