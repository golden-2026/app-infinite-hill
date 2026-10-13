// Today's card (owner, 2026-10-13: "do everything"): one short, real thing per path per day, above the lesson. A
// saint, a verse, a festival, a Dhammapada line. The cards live in public/daily/<door>.json: "dated" (moving feasts,
// moon days) wins over "cards" (one per month-day). Web only for now; the native widget comes with the native app.
// English only until the cards are translated, so Spanish readers don't see it yet.
import { useEffect, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useStore } from "@/lib/store";
import { isEs, t } from "@/i18n";
import { Card, color, font, type } from "@/ui";

export type DailyCard = { kind: string; eyebrow: string; title: string; original?: string; line: string; meaning: string; source: string };
type DailyFile = { door: string; cards: Record<string, DailyCard>; dated?: Record<string, DailyCard> };

const cache: Record<string, DailyFile | null> = {};

/** Today's card for a door: the exact date first, then the month-day. `today` is YYYY-MM-DD. */
export function cardFor(file: DailyFile | null | undefined, today: string): DailyCard | null {
  if (!file) return null;
  return file.dated?.[today] || file.cards?.[today.slice(5)] || null;
}

export function DailyCardView({ door }: { door: string }) {
  const { saved, today, update } = useStore();
  const [file, setFile] = useState<DailyFile | null | undefined>(cache[door]);
  const web = Platform.OS === "web" && !isEs();
  useEffect(() => {
    if (!web || cache[door] !== undefined) { setFile(cache[door]); return; }
    let live = true;
    fetch(`/daily/${door.toLowerCase()}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null)
      .then((j) => { cache[door] = j; if (live) setFile(j); });
    return () => { live = false; };
  }, [door, web]);
  const card = web ? cardFor(file, today) : null;
  if (!card) return null;
  const read = saved.settings.dailyRead === `${door}:${today}`;
  if (read) {
    // read today: one quiet line stays, so the day's line is still there to carry
    return (
      <View testID="daily-card-read" style={{ marginHorizontal: 18, marginBottom: 10, flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Text style={[type.eyebrow(8), { color: color.ink }]}>{card.eyebrow} ✓</Text>
        <Text numberOfLines={1} style={[type.body(13), { flex: 1, color: color.mute }]}>{card.line}</Text>
      </View>
    );
  }
  return (
    <Card testID="daily-card" style={{ marginHorizontal: 18, marginBottom: 12, gap: 6, borderWidth: 2, borderColor: color.ink }}>
      <Text style={[type.eyebrow(8), { color: color.ink }]}>{card.eyebrow}</Text>
      <Text style={type.h1(20)}>{card.title}</Text>
      {card.original ? <Text style={{ fontSize: 18, lineHeight: 26, color: color.ink }}>{card.original}</Text> : null}
      <Text style={{ fontFamily: font.display[700], fontSize: 16, lineHeight: 21, color: color.ink }}>{card.line}</Text>
      <Text style={[type.body(13), { color: color.text }]}>{card.meaning}</Text>
      <Text style={type.caption(11)}>{card.source}</Text>
      <Pressable testID="daily-card-read-btn" accessibilityRole="button" accessibilityLabel={t("home.daily.read")} onPress={() => update({ dailyRead: `${door}:${today}` })}
        style={({ pressed }) => ({ marginTop: 6, alignSelf: "stretch", alignItems: "center", paddingVertical: 12, borderRadius: 999, backgroundColor: color.gold, opacity: pressed ? 0.85 : 1 })}>
        <Text style={{ fontFamily: font.text[700], fontSize: 13, color: color.ink }}>{t("home.daily.read")}</Text>
      </Pressable>
    </Card>
  );
}
