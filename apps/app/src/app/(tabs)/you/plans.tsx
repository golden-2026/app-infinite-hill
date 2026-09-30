import { useTitle } from "@/lib/title";
// Plans: shown as designed, with an honest pilot note. No purchase buttons until payments are switched on.
import { router } from "expo-router";
import { Text, View } from "react-native";
import { Body, Card, Eyebrow, Guy, Screen, color, font, type } from "@/ui";
import { t } from "@/i18n";

// Built at render time, so the plans read in the app's language. Prices and "planned · not on sale" never change.
const plans = (): [string, string, string, string, string[]][] => [
  [t("companion.plans.house"), "$0", "", t("companion.plans.houseBlurb"), [t("companion.plans.house1"), t("companion.plans.house2"), t("companion.plans.house3")]],
  [t("companion.plans.plus"), "$39.99", t("companion.plans.plusNote"), t("companion.plans.plusBlurb"), [t("companion.plans.plus1"), t("companion.plans.plus2"), t("companion.plans.plus3"), t("companion.plans.plus4")]],
  [t("companion.plans.table"), "$99", t("companion.plans.tableNote"), t("companion.plans.tableBlurb"), [t("companion.plans.table1"), t("companion.plans.table2")]],
];

export default function Plans() {
  useTitle(t("companion.plans.title"));
  return (
    <Screen scroll sheet title={t("companion.plans.title")} largeTitle={false} contentStyle={{ gap: 12 }}>
      <Text accessibilityRole="header" style={type.title()}>{t("companion.plans.h1")}</Text>
      <Body style={{ color: color.mute }}>{t("companion.plans.intro")}</Body>
      {plans().map(([n, p, s, blurb, perks], k) => (
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
      <Card onPress={() => router.push("/you/gift")} label={t("companion.plans.giftCard")} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Guy pose="heart" h={84} />
        <View style={{ flex: 1 }}><Text style={type.serif(20)}>{t("companion.plans.giftCard")}</Text><Body size={12} style={{ color: color.mute }}>{t("companion.plans.giftSub")}</Body></View>
        <Text style={{ fontSize: 22 }}>›</Text>
      </Card>
      <Text style={[type.caption(), { textAlign: "center" }]}>{t("companion.plans.footer")}</Text>
    </Screen>
  );
}
