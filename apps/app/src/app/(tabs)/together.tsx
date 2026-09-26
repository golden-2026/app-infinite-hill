import { TabHeader } from "@/ui/tab-header";
import { useTitle } from "@/lib/title";
// Together: honest in the pilot. No invented counts, members, live reads or events (audit 9/25).
// What's real: your door, the founding class, the keepers, and the bell at sundown.
import { icon, label } from "@ih/content";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/lib/store";
import { Card, Eyebrow, Face, Guy, color, font, type } from "@/ui";
import { KeeperDesk, Voices } from "@/ui/voices";

export default function Together() {
  useTitle("together");
  const { door, lessonFor, derived } = useStore();
  const ic = icon(door);
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: color.cream }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, gap: 16, paddingBottom: 32 }}>
        <TabHeader eyebrow="together" title="you're not doing this alone." pose="dog" />
        <Card dark>
          <Text style={[type.eyebrow(), { color: color.gold }]}>the bell</Text>
          <Text style={{ fontFamily: font.display[800], fontSize: 24, color: "#fff", marginTop: 6 }}>sundown, every day.</Text>
          <Text style={[type.body(), { color: "#ffffffcc", marginTop: 6 }]}>the founding 108 sit around the same hour. live counts start when the pilot does — real numbers only.</Text>
        </Card>
        <Card>
          <Eyebrow>your door · {label(door)}</Eyebrow>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 }}>
            <Face ic={ic} w={44} h={44} r={22} caption={false} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.display[800], fontSize: 17, color: color.ink }}>walking {label(door)}</Text>
              <Text style={[type.body(12), { color: color.mute }]}>you're on lesson {lessonFor(door)} · {derived.showedUp} {derived.showedUp === 1 ? "day" : "days"} showed up</Text>
            </View>
          </View>
        </Card>
        <Voices />
        <KeeperDesk />
      </ScrollView>
    </SafeAreaView>
  );
}
