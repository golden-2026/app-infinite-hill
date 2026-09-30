// The recap's numbers for this phone: the last 365 days of the sit log, the book, timed minutes, friends and quests.
import { useMemo } from "react";
import { OUTLINES, camp1 } from "@ih/content";
import { lessonCounts, streakFrom } from "@ih/domain";
import { useFriends } from "./friends";
import { useSeasons } from "./quests";
import { useStore } from "./store";
import { readWalkers } from "./walkers";
import { YEAR_DAYS, yearRecap } from "./year";

const addDays = (date: string, n: number) => { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
// A lesson's real word, for "words learned": camp one's words (the strand words), and after that a word only where
// the plan names one. Outline days without a word would otherwise count their title ("The eve", "the driver").
const NO_WORD = /^[\s—–-]*$/;
export function realWord(door: string, day: number): string | null {
  if (day <= 21) return String((camp1(door) || []).find((x: any) => x.day === day)?.word || "").trim() || null;
  const w = (OUTLINES as any)[door]?.get(day)?.word;
  return typeof w === "string" && !NO_WORD.test(w) ? w.trim() : null;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
export const monthYear = (d: string) => `${MONTHS[+d.slice(5, 7) - 1]} ${d.slice(0, 4)}`;

export function useYear() {
  const { saved, today } = useStore();
  const { friends } = useFriends();
  const { finished } = useSeasons();
  const st = saved.settings;
  return useMemo(() => {
    const since = addDays(today, -(YEAR_DAYS - 1));
    const own = saved.sits.filter((s) => !s.kidId && s.date >= since && s.date <= today);
    // the longest streak inside the window, by the same streak rules
    const longest = streakFrom(lessonCounts(own), today).longest;
    // friends walked with: friends on the friends server plus people whose lanterns you opened (by name, once)
    const names = new Set<string>();
    friends.forEach((f) => names.add(`f:${f.id}`));
    readWalkers().forEach((w) => names.add(`w:${(w.name || "someone").toLowerCase()}:${w.door}`));
    const campWords = (camp1(st.homeWing) || []).map((x: any) => ({ day: x.day, word: String(x.word || "") })).filter((x: { word: string }) => x.word);
    const r = yearRecap({
      sits: own, today, timed: st.timed, book: st.book, longest, friends: names.size, questsDone: finished,
      wordOf: realWord, home: st.homeWing, campWords,
    });
    return { ...r, range: r.from.slice(0, 7) === r.to.slice(0, 7) ? monthYear(r.to) : `${monthYear(r.from)} – ${monthYear(r.to)}`, badges: finished.filter((q) => q.on >= since) };
  }, [saved.sits, st.timed, st.book, st.homeWing, friends, finished, today]);
}
