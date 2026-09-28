// The person's level (1–5) for today's lesson: where they started (what they told us they know), how far along the
// path they are, and how their last few lessons went — up a notch after three clean runs, down after a rough patch.
import { clampLevel } from "@ih/content";
import { depthFor, type Profile } from "@/lib/profile";

type Run = { door: string; acc: number; level: number };

export function levelFor(o: { door: string; day: number; profile?: Profile | null; runs?: Run[] }): number {
  const p = o.profile && o.profile.door === o.door ? o.profile : null;
  const base = p ? ({ new: 1, some: 2, deep: 3 } as const)[depthFor(p)] : 1;
  const along = (o.day >= 15 ? 1 : 0) + (o.day >= 60 ? 1 : 0);
  const mine = (o.runs || []).filter((r) => r.door === o.door).slice(-3);
  let form = 0;
  if (mine.length === 3 && mine.every((r) => r.acc >= 0.9)) form = 1;
  else if (mine.length >= 2 && mine.reduce((n, r) => n + r.acc, 0) / mine.length < 0.6) form = -1;
  return clampLevel(base + along + form);
}
