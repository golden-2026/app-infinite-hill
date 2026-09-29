import { useTitle } from "@/lib/title";
import { data, label } from "@ih/content";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doorParam } from "@/lib/door-param";
import { speak } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { Btn, CloseButton, Guy, Link, color, font, type } from "@/ui";

// A taste from next door: one idea from another tradition, read in a minute, on its own terms. It never changes
// anyone's path. Keeping the line puts it in their book; a full visit is a separate, explicit choice that comes
// straight back. (Owner, 2026-09-28: no more tapping a word and landing in another religion's course.)
export default function Taste() {
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const w = doorParam(raw);
  const { saved, keepLine, update } = useStore();
  const st = saved.settings;
  const d = (w && data.DAY1[w]) || null;
  const [kept, setKept] = useState(false);
  useTitle(d ? `a taste · ${d.word}` : "a taste");
  const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));
  if (!w || !d || w === st.homeWing) { close(); return null; }
  const carry = String(d.carry || "").replace(/[.!]$/, "");
  const home = label(st.homeWing);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.cream }}>
      <View style={{ alignItems: "flex-end", paddingHorizontal: 8 }}><CloseButton onPress={close} /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 14 }}>
        <Text style={type.eyebrow()}>a taste from next door · {label(w)}</Text>
        <Text accessibilityRole="header" style={type.h1(40)}>{d.word}</Text>
        <View style={{ backgroundColor: "#fff", borderRadius: 22, padding: 18, gap: 8, borderWidth: 1, borderColor: color.line }}>
          {[...(d.hook || []), ...(d.teach || []).slice(0, 2)].map((line: string, k: number) => (
            <Text key={k} style={{ fontFamily: font.display[k === 0 ? 700 : 500], fontSize: k === 0 ? 19 : 16, lineHeight: k === 0 ? 25 : 22, color: color.ink }}>{line}</Text>
          ))}
          <Link onPress={() => speak([...(d.hook || []), ...(d.teach || []).slice(0, 2)].join(" "), true)}>🔊 read it to me</Link>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Guy pose={w === "HINDUISM" ? "namaste" : "wonder"} h={90} />
          <View style={{ flex: 1 }}>
            <Text style={type.eyebrow(8)}>the line people carry</Text>
            <Text style={{ fontFamily: font.display[700], fontStyle: "italic", fontSize: 18, color: color.ink, marginTop: 4 }}>{carry}.</Text>
          </View>
        </View>
        <Text style={[type.body(13), { color: color.mute }]}>
          {st.homeWing === "SPIRITUAL" ? "that's the whole taste. your path keeps going tomorrow." : `that's the whole taste. nothing's changed — you're still walking ${home}.`}
        </Text>
        <Btn kind={kept ? "light" : "gold"} disabled={kept} onPress={() => { keepLine(carry, w); setKept(true); }}>{kept ? "in your book ✓" : "keep the line in my book"}</Btn>
        <Btn kind="ghost" onPress={close}>back to my path</Btn>
        {/* a full visit is its own, clearly labeled choice: one lesson, then home */}
        <View style={{ alignItems: "center", marginTop: 6 }}>
          <Link onPress={() => { update({ visitWing: w, active: "visit" }); router.replace({ pathname: "/session/[door]/[day]", params: { door: w, day: "1" } }); }}>
            {`sit a full ${label(w)} lesson once — you come right back`}
          </Link>
        </View>
        <Text style={[type.caption(), { textAlign: "center", fontSize: 11 }]}>draft · waiting on a Keeper's review</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
