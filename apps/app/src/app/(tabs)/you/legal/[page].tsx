import { useTitle } from "@/lib/title";
import { data } from "@ih/content";
import { Redirect, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { Body, Eyebrow, Screen, type } from "@/ui";
import { t, type Key } from "@/i18n";
import { en as companionEn } from "@/i18n/strings/companion";

/**
 * A legal page in the app's language. The English lives in @ih/content (data.LEGAL); the Spanish is shown only while
 * the English still matches the text it was translated from, so a changed term is never shown in a stale translation.
 */
export function legalItem(item: [string, string], i: number): [string, string] {
  const tk = `companion.legal.${i}.t` as Key;
  const bk = `companion.legal.${i}.b` as Key;
  const en = companionEn as Record<string, unknown>;
  return en[tk] === item[0] && en[bk] === item[1] ? [t(tk), t(bk)] : item;
}

export default function LegalPage() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const raw = data.LEGAL[Number(page)];
  const item = raw ? legalItem(raw, Number(page)) : null;
  useTitle(item ? item[0] : t("companion.you.legal"));
  if (!item) return <Redirect href="/you/legal" />;
  return (
    <Screen scroll back="legal" title={item[0]} contentStyle={{ gap: 12 }}>
      <Body size={15}>{item[1]}</Body>
      <Eyebrow size={8}>{t("companion.legal.plain")}</Eyebrow>
    </Screen>
  );
}
