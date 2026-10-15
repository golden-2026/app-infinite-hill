// Our family (owner, 2026-10-14): the three homepage families, partners of different religions, parents unsure what
// to teach, kids asking questions parents can't answer. Content lives in public/family/*.json (docs/curriculum/family,
// scholar review pending): "when your kid asks" answers and shared lessons, one theme told by each religion.
// Web only for now (fetched like the daily cards); English only until translated.
import { useEffect, useState } from "react";
import { Platform } from "react-native";

export type KidAnswer = { id: string; path: string; q: string; answer: string; grownup: string; source: string };
export type SharedLesson = {
  id: string; theme: string; title: string; hook: string;
  byPath: Record<string, { practice: string; meaning: string; source?: string; central?: boolean | string }>;
  shared: string; different: string; familyActivity: string; kidLine: string;
};
export type FamilySettings = { doors: string[]; raising?: "both" | "one" | "unsure" | null };

const memo: { kids?: Promise<KidAnswer[]>; shared?: Promise<SharedLesson[]> } = {};
const get = <T,>(url: string, pick: (j: any) => T[]): Promise<T[]> =>
  fetch(url).then((r) => (r.ok ? r.json() : null)).then((j) => (j ? pick(j) : [])).catch(() => []);

/** Both content files, or empty lists off the web or offline. */
export function useFamilyContent(): { kids: KidAnswer[] | null; shared: SharedLesson[] | null } {
  const [kids, setKids] = useState<KidAnswer[] | null>(null);
  const [shared, setShared] = useState<SharedLesson[] | null>(null);
  useEffect(() => {
    if (Platform.OS !== "web") { setKids([]); setShared([]); return; }
    let live = true;
    (memo.kids ??= get<KidAnswer>("/family/kid-answers.json", (j) => j.items || [])).then((x) => live && setKids(x));
    (memo.shared ??= get<SharedLesson>("/family/shared-lessons.json", (j) => j.lessons || [])).then((x) => live && setShared(x));
    return () => { live = false; };
  }, []);
  return { kids, shared };
}

/** The family's religions: the ones they picked, else their home path and the one they visit. */
export function familyDoors(settings: { family?: FamilySettings | null; homeWing?: string | null; visitWing?: string | null }): string[] {
  const picked = settings.family?.doors?.filter(Boolean) || [];
  if (picked.length) return picked;
  return [settings.homeWing, settings.visitWing].filter((d): d is string => !!d);
}

/** Kid answers for this family: each religion's own, then the two-religion ones when the family has two or more. */
export function kidAnswersFor(all: KidAnswer[], doors: string[]): KidAnswer[] {
  const own = all.filter((a) => doors.includes(a.path));
  const both = doors.length > 1 ? all.filter((a) => a.path === "INTERFAITH") : [];
  return [...both, ...own];
}
