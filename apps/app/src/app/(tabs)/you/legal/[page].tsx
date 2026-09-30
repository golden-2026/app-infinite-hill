import { useTitle } from "@/lib/title";
import { data } from "@ih/content";
import { Redirect, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { Body, Eyebrow, Screen, type } from "@/ui";

export default function LegalPage() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const item = data.LEGAL[Number(page)];
  useTitle(item ? item[0] : "legal");
  if (!item) return <Redirect href="/you/legal" />;
  return (
    <Screen scroll back="legal" title={item[0]} contentStyle={{ gap: 12 }}>
      <Body size={15}>{item[1]}</Body>
      <Eyebrow size={8}>the plain-English version</Eyebrow>
    </Screen>
  );
}
