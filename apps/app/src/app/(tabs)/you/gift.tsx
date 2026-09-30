import { useTitle } from "@/lib/title";
// Gift: the design's copy, but no "send it" until gifts can actually be sent (payments not on in the pilot).
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Body, Card, Eyebrow, Screen, color, font, type } from "@/ui";
import { t, type Key } from "@/i18n";

/** Who it's for: the chip, and the line for them. */
const WHO = ["kid", "parent", "friend"] as const;
const who_ = (w: string) => t(`companion.gift.who.${w}` as Key);
const copy = (w: string) => t(`companion.gift.copy.${w}` as Key);

export default function Gift() {
  useTitle(t("companion.gift.title"));
  const [who, setWho] = useState<string>("kid");
  return (
    <Screen scroll sheet title={t("companion.you.gift")} largeTitle={false} contentStyle={{ gap: 14 }}>
      <Text accessibilityRole="header" style={type.title()}>{t("companion.gift.h1")}<Text style={{ fontStyle: "italic" }}>{t("companion.gift.h1b")}</Text></Text>
      <View style={{ flexDirection: "row", gap: 8 }} accessibilityRole="radiogroup">
        {WHO.map((w) => (
          <Pressable key={w} accessibilityRole="radio" accessibilityState={{ checked: who === w }} aria-checked={who === w} onPress={() => setWho(w)} style={{ borderWidth: 1.5, borderColor: who === w ? color.ink : color.line, backgroundColor: who === w ? "#FFFBE0" : "#fff", borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14 }}>
            <Text style={{ fontFamily: font.text[600], fontSize: 13, color: color.ink }}>{who_(w)}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={{ fontFamily: font.display[500], fontSize: 18, lineHeight: 23, color: color.ink }}>{copy(who)}</Text>
      {[[t("companion.gift.p100"), t("companion.gift.p100b"), "$19"], [t("companion.gift.pYear"), t("companion.gift.pYearB"), "$39.99"], [t("companion.gift.pTable"), t("companion.gift.pTableB"), "$99"]].map(([a, b, p]) => (
        <Card key={a} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View><Text style={type.serif(20)}>{a}</Text><Body size={12} style={{ color: color.mute }}>{b}</Body></View>
          <View style={{ alignItems: "flex-end" }}><Text style={type.serif(22)}>{p}</Text><Text style={type.eyebrow(7)}>{t("companion.gift.planned")}</Text></View>
        </Card>
      ))}
      <Card dark><Text style={[type.eyebrow(), { color: color.gold }]}>{t("companion.gift.pilotEyebrow")}</Text><Body style={{ color: "#fff", marginTop: 6 }}>{t("companion.gift.pilotBody")}</Body></Card>
    </Screen>
  );
}
