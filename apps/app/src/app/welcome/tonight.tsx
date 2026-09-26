import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { data, icon, label, lessonInfo } from "@ih/content";
import { voiceLabel } from "@/lib/voice";
import { Btn, Eyebrow, Face, Link, color, font, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

export default function Tonight() {
  useEffect(() => { track("onboard_step", { step: "tonight" }); }, []);
  useTitle("tonight's door");
  const { moment } = useLocalSearchParams<{ moment?: string }>();
  const row = data.MOMENTS.find(([id]: [string]) => id === moment);
  const sw: string = row?.[2]?.[0] || "HINDUISM";
  const si = icon(sw);
  const d1 = lessonInfo(sw, 1) || data.DAY1[sw] || {};
  const go = (door: string) => router.push({ pathname: "/welcome/voice", params: { door } });
  return (
    <WelcomeFrame step={2} door={sw} footer={<Btn testID="try-tonight" onPress={() => go(sw)}>{`Try ${label(sw)} tonight`}</Btn>}>
      <Host>Tonight, try this. One door, one word, one breath. If it doesn't land, tomorrow's a different door — and your days come with you.</Host>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label(sw)}, day 1: ${d1.word}`} onPress={() => go(sw)}
        style={{ backgroundColor: color.white, borderWidth: 2, borderColor: color.ink, borderRadius: 22, padding: 16, flexDirection: "row", gap: 14, alignItems: "center" }}>
        <Face ic={si} w={84} h={84} r={18} caption={false} />
        <View style={{ flex: 1 }}>
          <Eyebrow size={8}>tonight · {label(sw)} · day 1</Eyebrow>
          <Text style={{ fontFamily: font.display[800], fontSize: 24, marginTop: 4, color: color.ink }}>{d1.word || "one word"}</Text>
          <Text style={[type.body(13), { color: color.mute, marginTop: 4 }]}>{d1.title || "the oldest hello"} · read by {voiceLabel(sw, si.short).short}</Text>
        </View>
        <Text style={{ fontFamily: font.display[800], fontSize: 24 }}>›</Text>
      </Pressable>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Link onPress={() => router.push("/welcome/door")} style={{ fontSize: 9, textDecorationLine: "underline" }}>I know my door ›</Link>
        <Link onPress={() => go("SPIRITUAL")} style={{ fontSize: 9, color: color.mute }}>no door · a bit of each ›</Link>
      </View>
      <Text style={[type.caption(), { textAlign: "center" }]}>eight doors, one house. walk in, look around, stay where it lands.</Text>
    </WelcomeFrame>
  );
}
