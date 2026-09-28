import { TabHeader } from "@/ui/tab-header";
import { useTitle } from "@/lib/title";
// Together: honest in the pilot. No invented counts, members, live reads or events (audit 9/25).
// What's real: your door and the bell at sundown. Voices and Keepers appear only once signed (ui/voices).
// "Walking with" is real and local: friends who sent you a lantern link (lib/walkers). No live reads.
import { icon, label } from "@ih/content";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/lib/store";
import { pathWords, readWalkers, walkerName, whenLit, type Walker } from "@/lib/walkers";
import { Btn, Card, Eyebrow, Face, Guy, Link, color, font, type } from "@/ui";
import { KeeperDesk, Voices } from "@/ui/voices";

function WalkingWith() {
  const { saved, today } = useStore();
  const mine = saved.settings.lanternOn ?? null;
  const [list, setList] = useState<Walker[]>(() => readWalkers());
  useFocusEffect(useCallback(() => { setList(readWalkers()); }, []));
  return (
    <Card>
      <Eyebrow>walking with</Eyebrow>
      {list.length === 0 ? (
        <View style={{ gap: 10, marginTop: 8 }}>
          <Text style={{ fontFamily: font.display[800], fontSize: 17, color: color.ink }}>nobody yet. light your lantern and send it to one person.</Text>
          <Btn kind="ink" onPress={() => router.push("/lantern")} testID="walkers-empty-lantern">today's lantern</Btn>
        </View>
      ) : (
        <View style={{ marginTop: 6 }}>
          {list.map((w, i) => {
            const both = !!mine && mine === w.lastLit;
            return (
              <View key={`${w.name}|${w.door}`} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: color.line }} testID="walker">
                {/* the friend's initial on their door's colour — never a voice's photo (voices aren't signed) */}
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: icon(w.door).tint, alignItems: "center", justifyContent: "center" }} accessible={false}>
                  <Text style={{ fontFamily: font.display[800], fontSize: 18, color: "#fff" }}>{walkerName(w)[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink }}>{walkerName(w)}</Text>
                  <Text style={[type.body(12), { color: color.mute }]}>{pathWords(w.door, w.n)}</Text>
                  <Text style={[type.body(13), { color: color.ink }]}>lit a lantern for you · {whenLit(w.lastLit, today)}</Text>
                  {both ? <Text style={[type.body(13), { color: color.ink, fontFamily: font.text[600] }]}>{w.lastLit === today ? "you both walked today ☀☀" : "you both walked that day ☀☀"}</Text> : null}
                  <View style={{ alignItems: "flex-start", marginTop: 4 }}>
                    <Link onPress={() => router.push("/lantern")} label={`send ${walkerName(w)} one back`} style={{ fontSize: 11 }}>send them one back ›</Link>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
      <Text style={[type.body(11), { color: color.mute, marginTop: 10 }]}>this lives on your phone. no accounts, no feeds.</Text>
    </Card>
  );
}

export default function Together() {
  useTitle("together");
  const { saved, lessonFor, derived } = useStore();
  const door = saved.settings.homeWing; // "your door" is your home door, even while visiting another
  const ic = icon(door);
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: color.cream }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, gap: 16, paddingBottom: 32 }}>
        <TabHeader eyebrow="together" title="you're not doing this alone." pose="dog" />
        <WalkingWith />
        <Card dark>
          <Text style={[type.eyebrow(), { color: color.gold }]}>the bell</Text>
          <Text style={{ fontFamily: font.display[800], fontSize: 24, color: "#fff", marginTop: 6 }}>sundown, every day.</Text>
          <Text style={[type.body(), { color: "#ffffffcc", marginTop: 6 }]}>one bell at sundown, wherever you are. live counts start when the pilot does — real numbers only.</Text>
        </Card>
        <Card>
          <Eyebrow>your door · {label(door)}</Eyebrow>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 }}>
            <Face ic={ic} w={44} h={44} r={22} caption={false} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.display[800], fontSize: 17, color: color.ink }}>walking {label(door)}</Text>
              <Text style={[type.body(12), { color: color.mute }]}>you're on lesson {lessonFor(door)} · {derived.showedUp} {derived.showedUp === 1 ? "day" : "days"} showed up</Text>
            </View>
          </View>
        </Card>
        <Voices />
        <KeeperDesk />
      </ScrollView>
    </SafeAreaView>
  );
}
