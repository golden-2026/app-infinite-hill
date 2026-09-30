import { useTitle } from "@/lib/title";
// Your week, looked back on: written on the phone from what actually happened, warm and true, no scores.
// If the companion's AI is on, its reflection is shown instead (the phone's stays as the fallback).
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useMemory } from "@/lib/companion/memory";
import { companionWeek, weekOf } from "@/lib/companion/reflect";
import { companionProfile, memoryLines } from "@/lib/companion/shape";
import { useCompanionDay } from "@/lib/companion/use-companion";
import { useStore } from "@/lib/store";
import { Btn, Guy, Screen, color, font, type } from "@/ui";
import { t } from "@/i18n";

export default function Reflect() {
  useTitle(t("companion.weekPage.title"));
  const { saved, derived, today } = useStore();
  const m = useMemory();
  const { input, day } = useCompanionDay();
  const week = weekOf({ today, dates: derived.dates, book: saved.settings.book, feels: saved.settings.feel || [], memory: m });
  const [ai, setAi] = useState<{ text: string; suggestion?: string } | null>(null);
  useEffect(() => {
    let live = true;
    companionWeek({ profile: companionProfile(input), memory: memoryLines(m) }, week).then((r) => { if (live) setAi(r); }).catch(() => {});
    return () => { live = false; };
  }, [today]); // eslint-disable-line react-hooks/exhaustive-deps
  const lines = ai ? ai.text.split(/\n+/).filter(Boolean) : week.text;
  const next = ai?.suggestion || (day.howItsDone ? t("companion.weekPage.nextHow", { title: day.practice.title }) : t("companion.weekPage.next", { title: day.practice.title }));
  return (
    <Screen scroll back={true} title={`${t("companion.weekPage.title")}.`} contentStyle={{ gap: 14 }}
      footer={<Btn onPress={() => router.push({ pathname: "/practice/[id]", params: day.howItsDone ? { id: day.practice.id, view: "learn" } : { id: day.practice.id } })}>{day.howItsDone ? t("companion.weekPage.howBtn", { title: day.practice.title }) : t("companion.weekPage.tryBtn", { title: day.practice.title })}</Btn>}>
      <View style={{ alignItems: "center" }}><Guy pose="sitrock" h={130} /></View>
      <View style={{ gap: 12 }}>
        {lines.map((l, n) => (
          <Text key={n} style={{ fontFamily: font.display[500], fontSize: 19, lineHeight: 25, color: color.ink }}>{l}</Text>
        ))}
      </View>
      <Text style={[type.body(14), { color: color.mute }]}>{next}</Text>
      <Text style={type.caption(11)}>{ai ? t("companion.weekPage.byCompanion") : t("companion.weekPage.byPhone")}</Text>
    </Screen>
  );
}
