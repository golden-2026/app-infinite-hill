import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { label } from "@ih/content";
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
  const { saved, derived, today, door, lessonFor, openLantern } = useStore();
  const st = saved.settings;
  const three = todaysThree({ doneToday: derived.doneToday, glow: st.glow, book: st.book, lanternOn: st.lanternOn, today });
  const [lit, setLit] = useState(three.opened);
  const gift = lanternLine(door, lessonFor(door), today);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));
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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 14 }}>
        <Text style={[type.eyebrow(), { color: color.gold }]}>today's lantern</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={lit ? "your lantern is lit" : three.all ? "light your lantern" : "your lantern lights when today's three are done"} onPress={light} disabled={lit || !three.all}>
          <Lantern size={130} lit={lit} />
        </Pressable>
        {!lit && three.all ? <Text style={[type.h1(24), { color: "#fff", textAlign: "center" }]}>tap to light your lantern.</Text> : null}
        {!three.all ? (
          <View style={{ gap: 8, width: "100%" }}>
            <Text style={[type.h1(22), { color: "#fff", textAlign: "center" }]}>{three.count} of 3. it lights when all three are done.</Text>
            {three.items.map((i) => (
              <View key={i.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#ffffff10", borderRadius: 14, padding: 12 }}>
                <Text style={{ fontSize: 18, color: i.done ? color.gold : "#ffffff44" }}>{i.done ? "☀" : "○"}</Text>
                <Text style={[type.body(14), { color: i.done ? "#fff" : "#ffffffaa" }]}>{i.label}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {!lit ? <Guy pose="namaste" h={110} /> : null}
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
            {gift ? <ShareLantern line={gift.line} door={door} day={today} n={derived.showedUp} /> : null}
          </View>
        ) : null}
      </View>
      <View style={{ padding: 18 }}><Btn kind="gold" onPress={close}>{lit ? "carry it with you" : "back"}</Btn></View>
    </SafeAreaView>
  );
}
