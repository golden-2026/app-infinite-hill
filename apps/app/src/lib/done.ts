import { router, useLocalSearchParams } from "expo-router";

// The after-lesson steps replace each other (no back into a finished ceremony), and closing returns to
// the screen the lesson was opened from.

export type DoneParams = { door: string; day: string; right: string; total: string; word: string; carry: string; minutes: string; newDay: string; count: string; milestone: string; streak: string; prev: string; restored: string; tomorrow: string };

/** The after-lesson screens share the finished session's facts through the URL (so back/refresh work). */
export function useDone() {
  const p = useLocalSearchParams<DoneParams>();
  const go = (path: string) => router.replace({ pathname: path as any, params: p as any });
  const close = () => router.replace("/today");
  const valid = !!p.door && Number(p.day) > 0; // a reload or old link without the lesson's facts
  return { p, day: Number(p.day) || 1, count: Number(p.count) || 0, go, close, valid };
}
