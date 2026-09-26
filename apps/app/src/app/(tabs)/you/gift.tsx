import { useTitle } from "@/lib/title";
// Gift: the design's copy, but no "send it" until gifts can actually be sent (payments not on in the pilot).
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Body, Card, Eyebrow, Screen, color, font, type } from "@/ui";

const COPY: Record<string, string> = {
  "my kid": "They check their phone 144 times a day. Give them a few minutes of it back.",
  "my parent": "They gave you your first prayer. Give them a place to keep it, read slowly, by a voice they'd trust.",
  "a friend": "They said they've been 'kind of a mess lately.' You can't fix that. You can hand them a door.",
};

export default function Gift() {
  useTitle("gift");
  const [who, setWho] = useState("my kid");
  return (
    <Screen scroll sheet title="gift infinite hill" largeTitle={false} contentStyle={{ gap: 14 }}>
      <Text accessibilityRole="header" style={type.title()}>give someone <Text style={{ fontStyle: "italic" }}>a door.</Text></Text>
      <View style={{ flexDirection: "row", gap: 8 }} accessibilityRole="radiogroup">
        {Object.keys(COPY).map((w) => (
          <Pressable key={w} accessibilityRole="radio" accessibilityState={{ checked: who === w }} aria-checked={who === w} onPress={() => setWho(w)} style={{ borderWidth: 1.5, borderColor: who === w ? color.ink : color.line, backgroundColor: who === w ? "#FFFBE0" : "#fff", borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14 }}>
            <Text style={{ fontFamily: font.text[600], fontSize: 13, color: color.ink }}>{w}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ fontFamily: font.display[500], fontSize: 18, lineHeight: 23, color: color.ink }}>{COPY[who]}</Text>
      {[["The first 100 days", "long enough to become a habit", "$19"], ["A year", "the first mountain, all five camps", "$39.99"], ["The table", "a year for six", "$99"]].map(([a, b, p]) => (
        <Card key={a} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View><Text style={type.serif(20)}>{a}</Text><Body size={12} style={{ color: color.mute }}>{b}</Body></View>
          <Text style={type.serif(22)}>{p}</Text>
        </Card>
      ))}
      <Card dark><Text style={[type.eyebrow(), { color: color.gold }]}>during the pilot</Text><Body style={{ color: "#fff", marginTop: 6 }}>gifts open after the founding pilot. until then, the easiest gift is free: send them the link and sit the same night.</Body></Card>
    </Screen>
  );
}
