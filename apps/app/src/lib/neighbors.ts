// "Same idea, another door" (owner, 2026-10-15): once a week, after the lesson, an invitation to hear how a neighbor
// religion says the same idea, in its own words and source, with one honest difference and one shared line. Opt-in by
// design (a tap), so "your door is yours" holds; never shown to someone who chose to stay on their path. Families with
// two religions are offered the other parent's religion when that week has it. Content: public/neighbors/<door>.json,
// built from docs/curriculum/neighbors (fact-checked, scholar review pending). Web only, English for now.
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export type Neighbor = { path: string; heading: string; text: string; difference: string; shared: string; sources: string };
export type NeighborItem = { day: number; lessonTitle?: string; neighbors: Neighbor[] };

const memo: Record<string, Promise<NeighborItem[]>> = {};

export function useNeighborItems(door: string): NeighborItem[] | null {
  const [items, setItems] = useState<NeighborItem[] | null>(null);
  useEffect(() => {
    if (Platform.OS !== "web" || !door) { setItems([]); return; }
    let live = true;
    (memo[door] ??= fetch(`/neighbors/${door.toLowerCase()}.json`).then((r) => (r.ok ? r.json() : null)).then((j) => (j?.items as NeighborItem[]) || []).catch(() => []))
      .then((x) => live && setItems(x));
    return () => { live = false; };
  }, [door]);
  return items;
}

/** This day's piece, preferring the family's other religion when it's one of the week's neighbors. */
export function neighborFor(items: NeighborItem[] | null, day: number, prefer: string[]): Neighbor | null {
  const it = items?.find((x) => x.day === day);
  if (!it || !it.neighbors?.length) return null;
  return it.neighbors.find((n) => prefer.includes(n.path)) || it.neighbors[0];
}

export const PEOPLE: Record<string, string> = {
  HINDUISM: "Hindus", CHRISTIANITY: "Christians", CATHOLIC: "Catholics", JUDAISM: "Jews", ISLAM: "Muslims",
  SIKHISM: "Sikhs", BUDDHISM: "Buddhists", SPIRITUAL: "people on their own path",
};
