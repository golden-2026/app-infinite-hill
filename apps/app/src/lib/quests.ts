// Seasonal quests, wired to the store: which doors' seasons may be offered, and the dates that light stones.
// The rules and the dates live in content/seasons.ts (pure, unit-tested); this only reads the phone's state.
import { useMemo } from "react";
import { finishedQuests, questCard, seasonDoors, type Openness } from "@/content/seasons";
import { practiceModeOf } from "./onboard";
import { useStore } from "./store";

export function useSeasons() {
  const { saved, derived, today } = useStore();
  const st = saved.settings;
  return useMemo(() => {
    const openness: Openness = st.profile?.openness ?? (st.homeWing === "SPIRITUAL" ? "love" : "stay");
    // a tradition they chose to taste: a line they kept from it (only ever offered to people open to other traditions)
    const tasted = [...new Set(st.book.map((b) => b.door).filter((d) => d && d !== st.homeWing))];
    const doors = seasonDoors({ home: st.homeWing, visit: st.visitWing, openness, tasted });
    const lessonDates = derived.dates; // the adult's own lesson dates (a child's never count here)
    const restDates = Object.entries(derived.streak.days).filter(([, k]) => k !== "lesson").map(([d]) => d);
    const quests = st.quests || {};
    return {
      doors, lessonDates, restDates, quests, today,
      mode: practiceModeOf(st.profile),
      card: questCard({ doors, today, quests, lessonDates, restDates }),
      finished: finishedQuests({ quests, lessonDates, restDates, today }),
    };
  }, [st.profile, st.homeWing, st.visitWing, st.book, st.quests, derived.dates, derived.streak.days, today]);
}
