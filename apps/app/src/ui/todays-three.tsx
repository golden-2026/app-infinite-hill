// Today's extras (was "today's three") on the Today screen: one light, compact card. Three small goals in plain words
// (finish the lesson, get 3 right in a row, save a line), a count, and the lantern they light. The logic is
// lib/three.ts, unchanged. Today shows it only after someone's first lesson, never before.
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useStore } from "@/lib/store";
import { todaysThree } from "@/lib/three";
import { color, font, type } from "@/ui";
import { Lantern } from "@/ui/lantern";
import { t as tr } from "@/i18n";

export function TodaysThree() {
  const { saved, derived, today } = useStore();
  const st = saved.settings;
  const t = todaysThree({ doneToday: derived.doneToday, glow: st.glow, book: st.book, lanternOn: st.lanternOn, today });
  const ready = t.all && !t.opened;
  return (
    <Pressable testID="todays-extras" accessibilityRole="button" accessibilityLabel={tr(ready ? "home.extras.a11yReady" : "home.extras.a11y", { count: t.count })} onPress={() => router.push("/lantern")}
      style={({ pressed }) => ({ marginHorizontal: 18, marginBottom: 12, backgroundColor: ready ? "#FFFBE0" : "#fff", borderWidth: 1.5, borderColor: ready ? color.ink : color.line, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14, opacity: pressed ? 0.9 : 1 })}>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontFamily: font.display[800], fontSize: 15, color: color.ink }}>{tr("home.extras.title")}</Text>
          <Text style={[type.caption(12), { flex: 1 }]}>{tr("home.extras.count", { count: t.count })}</Text>
          <View style={{ marginVertical: -12, marginRight: -8 }}><Lantern size={24} lit={t.opened || t.all} /></View>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {t.items.map((i) => (
            <View key={i.id} style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 9, backgroundColor: i.done ? color.gold : color.cream, borderWidth: 1, borderColor: i.done ? color.ink : color.line }}>
              <Text style={{ fontSize: 11, color: color.ink }}>{i.done ? "✓" : "○"}</Text>
              <Text style={{ fontFamily: font.text[600], fontSize: 12, color: i.done ? color.ink : color.text }}>{i.label}</Text>
            </View>
          ))}
        </View>
        <Text style={[type.caption(12), ready && { fontFamily: font.display[800], color: color.ink }]}>{ready ? tr("home.three.ready") : tr("home.extras.why")}</Text>
      </View>
    </Pressable>
  );
}
