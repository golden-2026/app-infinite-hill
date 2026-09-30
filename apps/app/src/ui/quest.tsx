// Seasonal quests on screen: the path of stones, the card on Today, and the badge at the end.
// Missed stones are plain outlines, never red; rest days are moons, like the streak's week.
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { datesMayVary, deName, type QuestCard, type Stone } from "@/content/seasons";
import { doorLabel, isEs, t } from "@/i18n";
import { Guy, Sun, color, font, type } from "@/ui";
import { GOLDEN, Moon } from "@/ui/streak";

/** One stone on the path. */
function StoneDot({ kind, size }: { kind: Stone; size: number }) {
  const w = size, h = Math.round(size * 0.78);
  const base = { width: w, height: h, borderRadius: h, alignItems: "center" as const, justifyContent: "center" as const };
  if (kind === "lit" || kind === "caught") return <View testID={`stone-${kind}`} style={[base, { backgroundColor: GOLDEN, borderWidth: 1.5, borderColor: color.ink, borderStyle: kind === "caught" ? "dashed" : "solid" }]} />;
  if (kind === "rest") return <View testID="stone-rest" style={[base, { backgroundColor: "#EEF0F8" }]}><Moon size={h - 4} /></View>;
  if (kind === "today") return <View testID="stone-today" style={[base, { borderWidth: 2, borderStyle: "dashed", borderColor: color.ink }]} />;
  if (kind === "missed") return <View testID="stone-missed" style={[base, { borderWidth: 1.5, borderColor: "#00000026" }]} />;
  return <View testID="stone-later" style={[base, { backgroundColor: "#00000010" }]} />;
}

/** The season as a path of stones, a gentle wave, a row at a time. */
export function Stones({ stones, size = 22, perRow = 10 }: { stones: Stone[]; size?: number; perRow?: number }) {
  const rows: Stone[][] = [];
  for (let i = 0; i < stones.length; i += perRow) rows.push(stones.slice(i, i + perRow));
  const lit = stones.filter((s) => s === "lit" || s === "rest" || s === "caught").length;
  return (
    <View accessibilityRole="text" accessibilityLabel={t("home.quest.stonesLit", { lit, n: stones.length })} style={{ gap: 8 }}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: r % 2 ? "row-reverse" : "row", gap: 6, justifyContent: "flex-start" }}>
          {row.map((k, i) => (
            <View key={i} style={{ marginTop: Math.round(Math.sin((i + r) * 0.9) * 3) + 3 }}><StoneDot kind={k} size={size} /></View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** The quest's badge: the sun in a gold ring, the badge's name under it. */
export function QuestBadge({ name, season, size = 120 }: { name: string; season: string; size?: number }) {
  return (
    <View testID="quest-badge" style={{ alignItems: "center", gap: 8 }} accessibilityLabel={t("home.quest.badgeA11y", { name, season })}>
      <View style={{ width: size, height: size, borderRadius: size, backgroundColor: GOLDEN, borderWidth: 3, borderColor: color.ink, alignItems: "center", justifyContent: "center" }}>
        <Sun size={size * 0.62} mood="happy" />
      </View>
      <Text style={[type.eyebrow(10), { color: color.ink }]}>{name}</Text>
    </View>
  );
}

/** Today's quest card: an offer (join / not this time) or the progress so far. */
export function QuestTodayCard({ card, mode, onJoin, onDecline }: { card: QuestCard; mode: "practice" | "learn"; onJoin: () => void; onDecline: () => void }) {
  const s = card.season;
  const open = () => router.push({ pathname: "/quest", params: { id: s.id } });
  const doors = s.def.doors.map((d) => doorLabel(d)).join(" · ");
  if (card.kind === "progress") {
    const p = card.progress;
    const end = Math.min(p.stones.length, Math.max(10, p.day));
    const recent = p.stones.slice(Math.max(0, end - 10), end);
    return (
      <Pressable testID="quest-card" accessibilityRole="button" accessibilityLabel={t("home.quest.openA11y", { line: card.line })} onPress={open}
        style={({ pressed }) => ({ marginHorizontal: 18, marginBottom: 12, backgroundColor: "#fff", borderWidth: 2, borderColor: color.ink, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, gap: 8, opacity: pressed ? 0.85 : 1 })}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {p.finished ? <Sun size={40} mood="happy" /> : <Guy pose="lantern" h={58} />}
          <View style={{ flex: 1 }}>
            <Text style={[type.eyebrow(8), { color: color.ink }]}>{p.finished ? t("home.quest.complete") : t("home.quest.yours")}</Text>
            <Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink, marginTop: 3 }}>{card.line}</Text>
          </View>
          <Text style={{ fontFamily: font.display[800], fontSize: 20 }}>›</Text>
        </View>
        {p.finished ? null : <Stones stones={recent} size={20} />}
        <Text style={[type.caption(11)]}>{p.finished ? t("home.quest.badgeYours", { badge: s.def.badge }) : mode === "learn" ? t("home.quest.lightsLearn") : t("home.quest.lightsAsk")}</Text>
      </Pressable>
    );
  }
  const joined = card.joined;
  return (
    <View testID="quest-offer" style={{ marginHorizontal: 18, marginBottom: 12, backgroundColor: color.ink, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Guy pose="lantern" h={64} />
        <View style={{ flex: 1 }}>
          <Text style={[type.eyebrow(8), { color: GOLDEN }]}>{t("home.quest.eyebrow", { doors })}</Text>
          <Text style={{ fontFamily: font.display[800], fontSize: 17, color: "#fff", marginTop: 3 }}>{card.line}</Text>
        </View>
        {joined ? null : <Pressable testID="quest-decline" accessibilityRole="button" accessibilityLabel={t("home.quest.notThisTime")} onPress={onDecline} hitSlop={10}><Text style={[type.eyebrow(12), { color: "#ffffff99" }]}>✕</Text></Pressable>}
      </View>
      <Text style={[type.body(12), { color: "#ffffffbb" }]}>{s.def.about} {mode === "learn" ? t("home.quest.aDayLearn") : t("home.quest.aDayAsk")}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 2 }}>
        {joined ? (
          <Pressable testID="quest-open" accessibilityRole="button" onPress={open} style={{ backgroundColor: GOLDEN, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16 }}>
            <Text style={{ fontFamily: font.text[700], fontSize: 13, color: color.ink }}>{t("home.quest.seePath")}</Text>
          </Pressable>
        ) : (
          <Pressable testID="quest-join" accessibilityRole="button" accessibilityLabel={t("home.quest.joinA11y", { name: isEs() ? deName(s.def.name) : s.def.name })} onPress={onJoin} style={{ backgroundColor: GOLDEN, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16 }}>
            <Text style={{ fontFamily: font.text[700], fontSize: 13, color: color.ink }}>{t("home.quest.join")}</Text>
          </Pressable>
        )}
        <Pressable accessibilityRole="link" onPress={open}><Text style={[type.eyebrow(8), { color: "#ffffffaa" }]}>{t("home.quest.howItWorksLink")}</Text></Pressable>
      </View>
      <Text style={[type.caption(11), { color: "#ffffff77" }]}>{datesMayVary()}.</Text>
    </View>
  );
}
