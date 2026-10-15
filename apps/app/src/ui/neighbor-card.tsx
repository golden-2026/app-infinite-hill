// The weekly "same idea, another door" card (lib/neighbors.ts), under the day's line at the end of a lesson.
// Closed it's an invitation; a tap opens the neighbor's version, one honest difference and what they share.
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { familyDoors } from "@/lib/family";
import { PEOPLE, neighborFor, useNeighborItems } from "@/lib/neighbors";
import { useStore } from "@/lib/store";
import { doorLabel, isEs, t } from "@/i18n";
import { color, font, type } from "@/ui";

export function NeighborCard({ door, day }: { door: string; day: number }) {
  const { saved } = useStore();
  const st = saved.settings;
  const items = useNeighborItems(door);
  const [open, setOpen] = useState(false);
  // "stay on my path" means no other religion unless they go looking; Spanish waits for a translation
  if (isEs() || st.profile?.openness === "stay") return null;
  const fam = familyDoors(st).filter((d) => d !== door);
  const n = neighborFor(items, day, fam);
  if (!n) return null;
  const theirs = fam.includes(n.path);
  return (
    <View testID="neighbor-card" style={{ backgroundColor: "#fff", borderWidth: 2, borderColor: color.ink, borderRadius: 18, overflow: "hidden" }}>
      <Pressable testID="neighbor-open" accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)}
        style={({ pressed }) => ({ paddingVertical: 13, paddingHorizontal: 16, gap: 3, opacity: pressed ? 0.85 : 1 })}>
        <Text style={[type.eyebrow(8), { color: "#6d6a00" }]}>{open ? `${doorLabel(door)} · ${doorLabel(n.path)}` : t("neighbor.eyebrow")}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ flex: 1, fontFamily: font.display[800], fontSize: 16, lineHeight: 21, color: color.ink }}>{open ? n.heading : t("neighbor.ask", { people: PEOPLE[n.path] || doorLabel(n.path) })}</Text>
          <Text style={{ fontSize: 18, color: color.ink }}>{open ? "–" : "›"}</Text>
        </View>
        {open ? null : <Text style={[type.caption(12)]}>{theirs ? t("neighbor.subFamily") : t("neighbor.sub")}</Text>}
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 8 }}>
          <Text style={[type.body(14), { color: color.text }]}>{n.text}</Text>
          <Text style={[type.eyebrow(8), { color: color.ink }]}>{t("neighbor.difference")}</Text>
          <Text style={[type.body(14), { color: color.text, marginTop: -4 }]}>{n.difference}</Text>
          <View style={{ backgroundColor: color.gold, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 }}>
            <Text style={{ fontFamily: font.display[700], fontSize: 14, lineHeight: 19, color: color.ink }}>{t("neighbor.shared", { line: n.shared })}</Text>
          </View>
          <Text style={type.caption(11)}>{n.sources}</Text>
        </View>
      ) : null}
    </View>
  );
}
