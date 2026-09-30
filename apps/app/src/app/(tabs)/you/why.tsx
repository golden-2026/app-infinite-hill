import { useTitle } from "@/lib/title";
import { type ReactNode } from "react";
import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Body, Card, Eyebrow, Screen, color, font, type } from "@/ui";
import { KeeperDesk, Voices } from "@/ui/voices";
import { t } from "@/i18n";

const Sec = ({ k, t, children }: { k: string; t: string; children: ReactNode }) => (
  <Card><Eyebrow>{k}</Eyebrow><Text style={{ fontFamily: font.display[800], letterSpacing: -0.44, fontSize: 22, marginTop: 6, lineHeight: 23, color: color.ink }}>{t}</Text><Body style={{ marginTop: 8 }}>{children}</Body></Card>
);

export default function Why() {
  useTitle(t("companion.you.why"));
  return (
    <Screen scroll back="you" title={t("companion.why.header")} contentStyle={{ gap: 12 }}>
      <LinearGradient colors={color.dusk} style={{ borderRadius: 20, padding: 16 }}>
        <Text style={[type.eyebrow(), { color: color.gold }]}>{t("companion.why.reason")}</Text>
        <Text style={{ fontFamily: font.display[800], fontSize: 24, marginTop: 6, lineHeight: 25, color: "#fff" }}>{t("companion.why.h1")}<Text style={{ fontStyle: "italic" }}>{t("companion.why.h1b")}</Text></Text>
        <Text style={[type.body(), { color: "#ffffffdd", marginTop: 10 }]}>{t("companion.why.p1")}</Text>
      </LinearGradient>
      <Sec k={t("companion.why.ruleK")} t={t("companion.why.ruleT")}>{t("companion.why.rule")}</Sec>
      <Sec k={t("companion.why.workK")} t={t("companion.why.workT")}>{t("companion.why.work")}</Sec>
      <Sec k={t("companion.why.howK")} t={t("companion.why.howT")}>{t("companion.why.how")}</Sec>
      <View style={{ marginVertical: 8 }}><Voices /></View>
      <View style={{ marginVertical: 8 }}><KeeperDesk /></View>
      <Sec k={t("companion.why.moneyK")} t={t("companion.why.moneyT")}>{t("companion.why.money")}</Sec>
      <Card><Eyebrow>{t("companion.why.founder")}</Eyebrow><Text style={[type.serif(22), { marginTop: 2 }]}>Shaan Sethi</Text><Body size={12} style={{ color: color.mute }}>{t("companion.why.bio")}</Body></Card>
      <Sec k={t("companion.why.noteK")} t={t("companion.why.noteT")}>{t("companion.why.note")}</Sec>
    </Screen>
  );
}
