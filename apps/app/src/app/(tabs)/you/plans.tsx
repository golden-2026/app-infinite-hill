import { useTitle } from "@/lib/title";
// Plans: shown as designed, with an honest pilot note. No purchase buttons until payments are switched on.
import { router } from "expo-router";
import { Text, View } from "react-native";
import { Body, Card, Eyebrow, Guy, Screen, color, font, type } from "@/ui";

const P: [string, string, string, string, string[]][] = [
  ["The house", "$0", "", "every door, every lesson, every day.", ["Every door, every camp, every lesson", "Every tradition's texts, cover to cover", "Missed days are free — always"]],
  ["infinite hill plus", "$39.99", "planned · per year or $4.99/mo · not on sale in the pilot", "no ads. offline. the deeper sessions. the guide.", ["No ads, anywhere", "The deeper sessions — the full readings, the long texts", "The Guide, unlimited", "Download and listen offline"]],
  ["The table", "$99", "planned · per year, up to 6 · not on sale in the pilot", "plus, for six people. grandparents to grandkids.", ["Everything in plus, for six", "Each person on their own hill"]],
];

export default function Plans() {
  useTitle("plans");
  return (
    <Screen scroll sheet title="plans" largeTitle={false} contentStyle={{ gap: 12 }}>
      <Text accessibilityRole="header" style={type.title()}>it's free.</Text>
      <Body style={{ color: color.mute }}>during the founding pilot everything is open to you. no card, nothing to cancel.</Body>
      {P.map(([n, p, s, blurb, perks], k) => (
        <Card key={n} dark={k === 1}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Text style={{ fontFamily: font.display[500], fontSize: 22, color: k === 1 ? "#fff" : color.ink }}>{n}</Text>
            <Text style={{ fontFamily: font.display[500], fontSize: 20, color: k === 1 ? "#fff" : color.ink }}>{p}</Text>
          </View>
          {/* the long "planned · not on sale" line gets its own full-width row (it pushed the price off a phone screen) */}
          {s ? <Text style={[type.eyebrow(8), { color: k === 1 ? color.gold : color.mute, marginTop: 4 }]}>{s}</Text> : null}
          <Text style={[type.body(13), { marginTop: 8, color: k === 1 ? "#ffffffcc" : color.text }]}>{blurb}</Text>
          <View style={{ gap: 6, marginTop: 12 }}>{perks.map((x) => <Text key={x} style={[type.body(13), { color: k === 1 ? "#fff" : color.text }]}>· {x}</Text>)}</View>
        </Card>
      ))}
      <Card onPress={() => router.push("/you/gift")} label="Give someone a door" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Guy pose="heart" h={84} />
        <View style={{ flex: 1 }}><Text style={type.serif(20)}>Give someone a door</Text><Body size={12} style={{ color: color.mute }}>gifts open after the pilot</Body></View>
        <Text style={{ fontSize: 22 }}>›</Text>
      </Card>
      <Text style={[type.caption(), { textAlign: "center" }]}>No ads near practice · missed days never sold · 0% of giving touches us · part of what we earn goes to the Infinite Hill Foundation</Text>
    </Screen>
  );
}
