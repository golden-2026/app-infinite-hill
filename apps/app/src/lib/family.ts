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

/** Kid answers for this family: the two-religion ones first (filled in with this family's own two religions), then
 *  each religion's own. */
export function kidAnswersFor(all: KidAnswer[], doors: string[]): KidAnswer[] {
  const own = all.filter((a) => doors.includes(a.path));
  const both = doors.length > 1 ? all.filter((a) => a.path === "INTERFAITH").map((a) => fillTwo(a, doors[0], doors[1])) : [];
  return [...both, ...own];
}

// The written two-religion answers use a Hindu-Catholic family as their example. These fill in the family's own pair.
const ADJ: Record<string, string> = { HINDUISM: "Hindu", CHRISTIANITY: "Christian", CATHOLIC: "Catholic", JUDAISM: "Jewish", ISLAM: "Muslim", SIKHISM: "Sikh", BUDDHISM: "Buddhist" };
const HOLIDAY: Record<string, string> = { HINDUISM: "Diwali", CHRISTIANITY: "Christmas", CATHOLIC: "Christmas", JUDAISM: "Hanukkah", ISLAM: "Eid", SIKHISM: "Vaisakhi", BUDDHISM: "Vesak" };
const AFTER: Record<string, string> = {
  HINDUISM: "Many Hindus believe the soul is born again in a new life.",
  CHRISTIANITY: "Christians believe in being with God in heaven.",
  CATHOLIC: "Catholics believe in being with God in heaven.",
  JUDAISM: "Many Jews believe the soul returns to God, and we keep the person's memory as a blessing.",
  ISLAM: "Muslims believe the soul returns to God, and hope to be together again in paradise.",
  SIKHISM: "Many Sikhs believe the soul is part of God's light and longs to return to it.",
  BUDDHISM: "Many Buddhists believe life goes on in a new form.",
  SPIRITUAL: "People who make their own path believe many different things, and many say love is what lasts.",
};
export function fillTwo(raw: KidAnswer, d1: string, d2: string): KidAnswer {
  const a = { ...raw, grownup: raw.grownup.replace(/^Swap in your own (two traditions|holidays).s*/, "") }; // already filled in
  const A = ADJ[d1], B = ADJ[d2];
  if (a.id === "int-01" && A && B) return { ...a, q: `are we ${A} or ${B}?`, answer: `Our family has both! One of us grew up ${A} and one of us grew up ${B}, and both are part of your story, like knowing two languages or two grandmas' recipes. You get to learn about both, with lots of love from each side. What do you love most from each one?` };
  if (a.id === "int-03") return { ...a, q: "why do my grandparents pray differently?", answer: "Your grandparents grew up in different families, in different places, and each learned to talk to God in their own way. One might light a lamp, another might pray with beads or bow down. Different words, and both full of love. And they both pray for you! Want to ask each of them to show you how?" };
  if (a.id === "int-06") {
    const h1 = HOLIDAY[d1], h2 = HOLIDAY[d2];
    const both = h1 && h2 && h1 !== h2 ? ` ${h1} and ${h2} each tell a story that's special to one side of our family, and we get to share in both.` : " Each holiday tells a story that's special to one side of our family, and we get to share in both.";
    return { ...a, answer: `Because we have two families' stories!${both} It's like being invited to two birthday parties. Which one should we start getting ready for?` };
  }
  if (a.id === "int-07" && AFTER[d1] && AFTER[d2]) return { ...a, answer: `Different families believe different things. ${AFTER[d1]} ${AFTER[d2]} It's okay to wonder about it, and even to feel a little scared. What do you think happens? And I'm right here with you.` };
  return a;
}
