// A friend's lantern, opened from a link. Everything shown comes from the link itself (checked and trimmed);
// the sender is remembered on this device only ("walking with" on Together). No server, no account.
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { label } from "@ih/content";
import { useTitle } from "@/lib/title";
import { useStore } from "@/lib/store";
import { pathWords, readGift, saveWalker, whenLit } from "@/lib/walkers";
import { isLessonLine } from "@/lib/three";
import { Btn, CloseButton, Guy, Link, color, font, type } from "@/ui";
import { Lantern } from "@/ui/lantern";

export default function WithScreen() {
  useTitle("a lantern for you");
  const params = useLocalSearchParams();
  const { saved, today } = useStore();
  const onboarded = saved.settings.onboarded;
  const key = JSON.stringify(params);
  const gift = useMemo(() => readGift(JSON.parse(key), today), [key, today]);
  useEffect(() => { if (gift) saveWalker(gift); }, [gift]);
  const fromLessons = useMemo(() => (gift ? isLessonLine(gift.door, gift.line) : false), [gift]);

  const later = () => router.replace(onboarded ? "/together" : "/");
  const back = () => router.replace(onboarded ? "/today" : "/welcome/you");
  // "light one back" opens today's lantern (it says what's left if today's three aren't done yet)
  const lightBack = () => (onboarded && gift ? router.replace({ pathname: "/lantern", params: { to: gift.from || "" } }) : back());

  if (!gift) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: color.ink }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 14 }}>
          <Lantern size={100} />
          <Text style={[type.h1(22), { color: "#fff", textAlign: "center" }]}>this lantern's link came through incomplete.</Text>
          <Text style={[type.body(14), { color: "#ffffffaa", textAlign: "center" }]}>ask them to send it again — or light your own.</Text>
        </View>
        <View style={{ padding: 18 }}><Btn kind="gold" onPress={back}>{onboarded ? "go to today" : "start walking"}</Btn></View>
      </SafeAreaView>
    );
  }

  const who = gift.from || "someone";
  const when = whenLit(gift.d, today);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.ink }}>
      <View style={{ alignItems: "flex-end", paddingHorizontal: 8 }}><CloseButton dark onPress={later} /></View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 12, paddingBottom: 12 }}>
        <Text style={[type.eyebrow(), { color: color.gold }]}>a lantern for you</Text>
        <Lantern size={110} lit />
        <Text style={{ fontFamily: font.display[800], fontSize: 20, color: "#fff", textAlign: "center" }} testID="with-from">
          from {who} · {pathWords(gift.door, gift.n)}
        </Text>
        <View style={{ backgroundColor: "#fff", borderRadius: 22, padding: 18, width: "100%" }}>
          {/* only a line that really is in the lessons shows as "inside"; anything else is marked as the sender's own words */}
          <Text style={[type.eyebrow(8), { color: color.mute }]}>{fromLessons ? `inside · ${label(gift.door)}` : `in ${gift.from ? `${who}'s` : "their"} own words · not from the lessons`}</Text>
          <Text style={{ fontFamily: font.display[800], fontSize: 22, color: color.ink, marginTop: 6 }}>“{gift.line}”</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, width: "100%" }}>
          <Guy pose="namaste" h={72} />
          <Text style={[type.body(15), { color: "#ffffffdd", flex: 1 }]}>
            {gift.from ? `${who} walked ${when === "today" ? "today" : when}.` : `someone walked ${when === "today" ? "today" : when} and thought of you.`} walk with them?
          </Text>
        </View>
      </ScrollView>
      <View style={{ padding: 18, gap: 14, alignItems: "center" }}>
        <Btn kind="gold" onPress={lightBack} style={{ alignSelf: "stretch" }} testID="light-back">light one back</Btn>
        <Link onPress={later} style={{ color: "#ffffffaa" }}>not now</Link>
        <Text style={[type.body(11), { color: "#ffffff77", textAlign: "center" }]}>
          {onboarded ? "saved to “walking with” on this phone. no accounts, no feeds." : "you'll start on your own path. they'll be in “walking with” once you're in."}
        </Text>
      </View>
    </SafeAreaView>
  );
}
