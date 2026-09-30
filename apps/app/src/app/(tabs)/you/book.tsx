import { useTitle } from "@/lib/title";
import { icon } from "@ih/content";
import { date, doorLabel, t } from "@/i18n";
import { Text, View } from "react-native";
import { useStore } from "@/lib/store";
import { Body, Face, Guy, Screen, color, type } from "@/ui";

export default function Book() {
  useTitle(t("companion.you.book"));
  const { saved } = useStore();
  const book = saved.settings.book;
  return (
    <Screen scroll back="you" title={t("companion.book.header")} contentStyle={{ gap: 12 }}>
      <View style={{ alignItems: "center" }}><Guy pose="read" h={130} /></View>
      {book.length === 0 ? (
        <View style={{ gap: 8 }}><Text style={type.h1(24)}>{t("companion.book.empty")}</Text><Body>{t("companion.book.body1")}<Text style={{ fontFamily: "Inter_700Bold" }}>{t("companion.book.keepIt")}</Text>{t("companion.book.body2")}</Body></View>
      ) : book.map((b, i) => (
        <View key={i} style={{ paddingVertical: 14, borderTopWidth: 1, borderTopColor: color.line }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Face ic={icon(b.door)} w={20} h={20} r={10} caption={false} /><Text style={type.eyebrow(8)}>{doorLabel(b.door)} · {date(b.date, { month: "short", day: "numeric" })}</Text></View>
          <Text style={[type.serif(17), { marginTop: 6 }]}>{b.line}</Text>
        </View>
      ))}
    </Screen>
  );
}
