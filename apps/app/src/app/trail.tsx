import { useTitle } from "@/lib/title";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { trailFor } from "@/content/journeys";
import { doorParam } from "@/lib/door-param";
import { useStore } from "@/lib/store";
import { Screen, type } from "@/ui";
import { TrailDay, TrailMap } from "@/ui/trail-map";
import { campLabel, doorLabel, isEs, t } from "@/i18n";

// "The whole climb" for any door (?door=, else your home door): the summit and what's there, every camp with what
// you'll be able to do by then, and where you are now. Read-only. Linked from Today.
export default function Trail() {
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const { saved, derived } = useStore();
  const door = doorParam(raw) || saved.settings.homeWing || "SPIRITUAL";
  const name = door === "SPIRITUAL" ? t("home.trail.myPath") : doorLabel(door);
  useTitle(t("home.trail.docTitle", { name }));
  const p = derived.paths[door];
  const walked = p ? (p.done ? p.day : p.day - 1) : 0;
  const day = p?.day ?? 1;
  const stage = trailFor(door).stages.find((s) => day >= s.first && day <= s.last);
  const isCamp = !!stage && stage.key.startsWith("Camp");
  const where = !stage ? "" : stage.key.toLowerCase().startsWith("camp") ? `${isEs() ? campLabel(stage.key) : stage.key.toLowerCase()}, ${stage.name}` : stage.name;
  return (
    <Screen title={t("home.trail.title")} back={{ label: "today", to: "/today" }} scroll>
      <Text style={[type.body(15), { color: "#6b6b6b", marginTop: -4, marginBottom: 16 }]}>
        {walked > 0 && stage
          ? t("home.trail.intro", { name, walked: t("home.trail.walked", { count: walked }), where, next: isCamp ? t("home.trail.nextLookout", { n: stage.last }) : "" })
          : t("home.trail.fromTo", { name })}
      </Text>
      <View style={{ gap: 16 }}>
        <TrailMap door={door} day={day} walked={walked} />
        <TrailDay />
        <Text style={[type.caption(), { textAlign: "center" }]}>{t("home.trail.footer")}</Text>
      </View>
    </Screen>
  );
}
