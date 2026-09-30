import { useTitle } from "@/lib/title";
import { data } from "@ih/content";
import { router } from "expo-router";
import { Text } from "react-native";
import { Eyebrow, Screen, type } from "@/ui";
import { Group, Row } from "@/ui/row";
import { t, type Key } from "@/i18n";
import { en as companionEn } from "@/i18n/strings/companion";

/** A page's title in the app's language, while the English still matches what was translated (as in [page].tsx). */
function legalTitle(item: [string, string], i: number): string {
  const tk = `companion.legal.${i}.t` as Key;
  const en = companionEn as Record<string, unknown>;
  return en[tk] === item[0] && en[`companion.legal.${i}.b`] === item[1] ? t(tk) : item[0];
}

export default function Legal() {
  useTitle(t("companion.you.legal"));
  return (
    <Screen scroll back="you" title={t("companion.legal.header")} contentStyle={{ gap: 12 }}>
      <Group footer={t("companion.legal.footer")}>
        {data.LEGAL.map((item: [string, string], i: number) => <Row key={item[0]} a={legalTitle(item, i)} onPress={() => router.push({ pathname: "/you/legal/[page]", params: { page: String(i) } })} />)}
      </Group>
    </Screen>
  );
}
