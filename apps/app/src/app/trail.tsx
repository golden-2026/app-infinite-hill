import { useTitle } from "@/lib/title";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { label } from "@ih/content";
import { trailFor } from "@/content/journeys";
import { doorParam } from "@/lib/door-param";
import { useStore } from "@/lib/store";
import { Screen, type } from "@/ui";
import { TrailDay, TrailMap } from "@/ui/trail-map";

// "The whole climb" for any door (?door=, else your home door): the summit and what's there, every camp with what
// you'll be able to do by then, and where you are now. Read-only. Linked from Today.
export default function Trail() {
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const { saved, derived } = useStore();
  const door = doorParam(raw) || saved.settings.homeWing || "SPIRITUAL";
  const name = door === "SPIRITUAL" ? "my own path" : label(door);
  useTitle(`the whole climb · ${name}`);
  const p = derived.paths[door];
  const walked = p ? (p.done ? p.day : p.day - 1) : 0;
  const day = p?.day ?? 1;
  const stage = trailFor(door).stages.find((s) => day >= s.first && day <= s.last);
  return (
    <Screen title="the whole climb" back={{ label: "today", to: "/today" }} scroll>
      <Text style={[type.body(15), { color: "#6b6b6b", marginTop: -4, marginBottom: 16 }]}>
        {walked > 0 && stage
          ? `${name}: ${walked} ${walked === 1 ? "day" : "days"} walked. you're in ${stage.key.toLowerCase().startsWith("camp") ? `${stage.key.toLowerCase()}, ${stage.name}` : stage.name}${stage.key.startsWith("Camp") ? ` — the next lookout is day ${stage.last}` : ""}. scroll down for where you are, up for what's still ahead.`
          : `${name}, from the trailhead to the summit.`}
      </Text>
      <View style={{ gap: 16 }}>
        <TrailMap door={door} day={day} walked={walked} />
        <TrailDay />
        <Text style={[type.caption(), { textAlign: "center" }]}>a draft plan. the lessons are still being written, and each tradition's Keeper checks them before they're final.</Text>
      </View>
    </Screen>
  );
}
