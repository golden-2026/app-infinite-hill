// Wires the companion to the app's store: the shaped day for the door on screen, and the facts drawn once.
import { lessonInfo } from "@ih/content";
import { useEffect } from "react";
import { levelFor } from "@/lib/level";
import { useStore } from "@/lib/store";
import { now } from "@/lib/time";
import { seedFacts, useMemory } from "@/lib/companion/memory";
import { useShapedDay, type ShapeInput } from "@/lib/companion/shape";

export function useCompanionInput(): ShapeInput {
  const { saved, derived, door, lessonFor, today } = useStore();
  const st = saved.settings;
  const memory = useMemory();
  const profile = st.profile ?? null;
  // the facts are drawn from the onboarding answers once (a door's profile, never a child's)
  useEffect(() => { if (profile?.door) seedFacts(profile, today, { kids: st.kids.length }); }, [profile?.door, today]); // eslint-disable-line react-hooks/exhaustive-deps
  const lesson = lessonFor(door);
  const info = lessonInfo(door, lesson) || {};
  const d = now();
  return {
    door, profile, today, lesson, memory,
    level: levelFor({ door, day: lesson, profile, runs: st.runs }),
    hour: d.getHours(), weekday: d.getDay(),
    showedUp: derived.showedUp, missedDays: derived.missedDays, doneToday: derived.paths[door]?.done === true,
    lessonTitle: info.title, carry: info.carry,
    feels: (st.feel || []).map((f) => ({ date: f.date, feel: f.feel })),
    kids: st.kids.length,
  };
}

export function useCompanionDay() {
  const input = useCompanionInput();
  return { input, day: useShapedDay(input) };
}
