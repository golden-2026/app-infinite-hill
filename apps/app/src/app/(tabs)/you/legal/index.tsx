import { useTitle } from "@/lib/title";
import { data } from "@ih/content";
import { router } from "expo-router";
import { Text } from "react-native";
import { Eyebrow, Screen, type } from "@/ui";
import { Group, Row } from "@/ui/row";

export default function Legal() {
  useTitle("legal");
  return (
    <Screen scroll back="you" title="legal." contentStyle={{ gap: 12 }}>
      <Group footer="the plain-English versions · the lawyer's versions come before launch">
        {data.LEGAL.map(([t]: [string], i: number) => <Row key={t} a={t} onPress={() => router.push({ pathname: "/you/legal/[page]", params: { page: String(i) } })} />)}
      </Group>
    </Screen>
  );
}
