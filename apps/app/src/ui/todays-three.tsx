// Today's three on the Today screen: three small suns that fill in, your total light, and the lantern.
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useStore } from "@/lib/store";
import { todaysThree } from "@/lib/three";
import { color, font, type } from "@/ui";
import { Lantern } from "@/ui/lantern";

export function TodaysThree() {
  const { saved, derived, today } = useStore();
  const st = saved.settings;
  const t = todaysThree({ doneToday: derived.doneToday, glow: st.glow, book: st.book, lanternOn: st.lanternOn, today });
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`today's three: ${t.count} of 3 done${t.all && !t.opened ? ", your lantern is ready" : ""}. ${st.light || 0} light.`} onPress={() => router.push("/lantern")}
      style={({ pressed }) => ({ marginHorizontal: 18, marginBottom: 12, backgroundColor: color.ink, borderRadius: 22, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, opacity: pressed ? 0.92 : 1 })}>
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={[type.eyebrow(9), { color: color.gold }]}>today's three</Text>
          <Text style={[type.eyebrow(9), { color: "#ffffffaa" }]}>☀ {st.light || 0} light</Text>
        </View>
        {t.items.map((i) => (
          <View key={i.id} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 14, color: i.done ? color.gold : "#ffffff44", width: 16 }}>{i.done ? "☀" : "○"}</Text>
            <Text style={[type.body(13), { color: i.done ? "#fff" : "#ffffffaa", textDecorationLine: i.done ? "line-through" : "none" }]}>{i.label}</Text>
          </View>
        ))}
        {t.all && !t.opened ? <Text style={{ fontFamily: font.display[800], fontSize: 14, color: color.gold, marginTop: 2 }}>your lantern is ready — tap to light it ›</Text> : null}
      </View>
      <Lantern size={44} lit={t.opened || t.all} />
    </Pressable>
  );
}
