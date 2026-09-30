import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { data, label, lessonInfo } from "@ih/content";
import { play } from "@/lib/fx";
import { successHaptic } from "@/lib/haptics";
import { useStore } from "@/lib/store";
import { LANTERN_LIGHT, lanternLine, todaysThree } from "@/lib/three";
import { Btn, CloseButton, Guy, color, font, type } from "@/ui";
import { Lantern } from "@/ui/lantern";
import { ShareLantern } from "@/ui/share-lantern";

// Today's lantern: lights when today's three are done and opens to a line from a lesson already walked.
export default function LanternScreen() {
  useTitle("today's lantern");
  const { saved, derived, today, door, lessonFor, openLantern, keepLine } = useStore();
  const st = saved.settings;
  const three = todaysThree({ doneToday: derived.doneToday, glow: st.glow, book: st.book, lanternOn: st.lanternOn, today });
  const [lit, setLit] = useState(three.opened);
  const gift = lanternLine(door, lessonFor(door), today);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));
  // opened to answer a friend's lantern ("light one back" / "send them one back"): name them
  const { to: rawTo } = useLocalSearchParams<{ to?: string }>();
  const to = typeof rawTo === "string" ? rawTo.replace(/[<>]/g, "").trim().slice(0, 40) : "";
  // what's left of today's three, and a way to do it from here
  const lesson = lessonFor(door);
  const carry = String(lessonInfo(door, lesson)?.carry || (data.DAY1[door] || data.DAY1.SPIRITUAL).carry || "").replace(/[.!]$/, "");
  const sit = () => router.push({ pathname: "/session/[door]/[day]", params: { door, day: String(lesson) } });
  const todo = (id: string): { hint: string; go?: () => void } | null => {
    if (id === "lesson") return { hint: `start day ${lesson} · a few minutes`, go: sit };
    if (id === "glow") return derived.doneToday ? { hint: "sit today's lesson again — no misses counts", go: sit } : { hint: "comes with today's lesson: no misses, or three right in a row" };
    if (id === "keep") return derived.doneToday && carry ? { hint: `keep today's line: “${carry}”`, go: () => keepLine(carry, door) } : { hint: "after today's lesson, keep its line" };
    return null;
  };
  const light = () => {
    if (lit || !three.all) return;
    setLit(true);
    play("reward");
    successHaptic();
    if (!three.opened) openLantern(LANTERN_LIGHT);
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.ink }}>
      <View style={{ alignItems: "flex-end", paddingHorizontal: 8 }}><CloseButton dark onPress={close} /></View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 14, paddingBottom: 8 }}>
        <Text style={[type.eyebrow(), { color: color.gold }]}>today's lantern</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={lit ? "your lantern is lit" : three.all ? "light your lantern" : "your lantern lights when today's three are done"} onPress={light} disabled={lit || !three.all}>
          <Lantern size={130} lit={lit} />
        </Pressable>
        {!lit && three.all ? <Text style={[type.h1(24), { color: "#fff", textAlign: "center" }]}>{to ? `tap to light it for ${to}.` : "tap to light your lantern."}</Text> : null}
        {!three.all ? (
          <View style={{ gap: 8, width: "100%" }}>
            <Text style={[type.h1(22), { color: "#fff", textAlign: "center" }]}>{three.count} of 3. it lights when all three are done.</Text>
            {to ? <Text style={[type.body(14), { color: "#ffffffcc", textAlign: "center" }]}>{`light yours, then send it to ${to}. here's what's left today:`}</Text> : null}
            {three.items.map((i) => {
              const how = i.done ? null : todo(i.id);
              const row = (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#ffffff10", borderRadius: 14, padding: 12 }}>
                  <Text style={{ fontSize: 18, color: i.done ? color.gold : "#ffffff44" }}>{i.done ? "☀" : "○"}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.body(14), { color: i.done ? "#fff" : "#ffffffaa" }]}>{i.label}</Text>
                    {how ? <Text style={[type.body(12), { color: how.go ? color.gold : "#ffffff77", marginTop: 2 }]}>{how.hint}</Text> : null}
                  </View>
                  {how?.go ? <Text style={{ color: color.gold, fontSize: 18 }}>›</Text> : null}
                </View>
              );
              return how?.go
                ? <Pressable key={i.id} accessibilityRole="button" accessibilityLabel={`${i.label}: ${how.hint}`} onPress={how.go} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>{row}</Pressable>
                : <View key={i.id}>{row}</View>;
            })}
          </View>
        ) : null}
        {!lit ? <Guy pose={door === "HINDUISM" ? "namaste" : "heart"} h={110} /> : null}
        {lit ? (
          <View style={{ alignItems: "center", gap: 10, width: "100%" }}>
            <Text style={{ fontFamily: font.display[800], fontSize: 20, color: color.gold }}>+{LANTERN_LIGHT} light</Text>
            {gift ? (
              <View style={{ backgroundColor: "#fff", borderRadius: 22, padding: 18, width: "100%" }}>
                <Text style={[type.eyebrow(8), { color: color.mute }]}>{`inside · ${label(door)} · day ${gift.day} · ${gift.word}`}</Text>
                <Text style={{ fontFamily: font.display[800], fontSize: 22, color: color.ink, marginTop: 6 }}>“{gift.line}”</Text>
              </View>
            ) : null}
            <Guy pose="lantern" h={110} />
            {gift ? <ShareLantern line={gift.line} door={door} day={today} n={derived.showedUp} to={to || undefined} /> : null}
          </View>
        ) : null}
      </ScrollView>
      <View style={{ padding: 18 }}><Btn kind="gold" onPress={close}>{lit ? "carry it with you" : "back"}</Btn></View>
    </SafeAreaView>
  );
}
