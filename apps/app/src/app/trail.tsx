import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { stretchesBefore } from "@/content/placement";
import { lessonInfo, pos } from "@ih/content";
import { trailFor } from "@/content/journeys";
import { doorParam } from "@/lib/door-param";
import { useStore } from "@/lib/store";
import { Card, Eyebrow, Screen, color, font, type } from "@/ui";
import { TrailDay, TrailMap } from "@/ui/trail-map";
import { campLabel, campName, doorLabel, isEs, t } from "@/i18n";

// "The whole climb" for any door (?door=, else your home door): the summit and what's there, every camp with what
// you'll be able to do by then, and where you are now. Linked from Today. Someone the check placed past camp one
// (welcome/know) also gets camp one's days here, open to catch up on, one tap each.
export default function Trail() {
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const { saved, derived, startFor } = useStore();
  const door = doorParam(raw) || saved.settings.homeWing || "SPIRITUAL";
  const name = door === "SPIRITUAL" ? t("home.trail.myPath") : doorLabel(door);
  useTitle(t("home.trail.docTitle", { name }));
  const p = derived.paths[door];
  const start = startFor(door);
  const walkedDays = new Set(saved.sits.filter((x) => !x.kidId && x.door === door).map((x) => x.day));
  // placed: only the days actually walked count (the skipped ones weren't); otherwise everything below the door's day
  const walked = start > 1 ? walkedDays.size : p ? (p.done ? p.day : p.day - 1) : 0;
  const day = p?.day ?? start;
  const stage = trailFor(door).stages.find((s) => day >= s.first && day <= s.last);
  const isCamp = !!stage && stage.key.startsWith("Camp");
  const where = !stage ? "" : stage.key.toLowerCase().startsWith("camp") ? `${isEs() ? campLabel(stage.key) : stage.key.toLowerCase()}, ${stage.name}` : stage.name;
  const next = isCamp ? t("home.trail.nextLookout", { n: stage!.last }) : "";
  // everything before where the check (or a move) started them, by stretch: one stretch shows its days straight away
  // (someone placed at day 22); several fold up, one row each, and open on a tap
  const groups = stretchesBefore(door, start);
  const [open, setOpen] = useState<number | null>(null);
  const skipped = groups.length === 1 ? pos(start - 1) : null;
  const tiles = (first: number, last: number) => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
      {Array.from({ length: last - first + 1 }, (_, k) => first + k).map((n) => {
        const done = walkedDays.has(n);
        const word = String(lessonInfo(door, n)?.word || "");
        return (
          <Pressable key={n} testID={`catch-up-${n}`} accessibilityRole="button" accessibilityLabel={t("home.trail.catchA11y", { n, word, walked: done ? t("home.trail.a11yWalked") : "" })}
            onPress={() => router.push({ pathname: "/session/[door]/[day]", params: { door, day: String(n) } })}
            style={({ pressed }) => ({ width: "31.5%", minHeight: 52, borderRadius: 12, borderWidth: 1.5, borderColor: done ? color.ink : color.line, backgroundColor: done ? color.ink : color.white, paddingVertical: 7, paddingHorizontal: 8, opacity: pressed ? 0.7 : 1 })}>
            <Text style={[type.eyebrow(8), { color: done ? color.gold : color.mute }]}>{done ? "✓ " : ""}{t("common.day", { n })}</Text>
            <Text numberOfLines={1} style={{ fontFamily: font.display[700], fontSize: 13, color: done ? "#fff" : color.ink, marginTop: 2 }}>{word}</Text>
          </Pressable>
        );
      })}
    </View>
  );
  return (
    <Screen title={t("home.trail.title")} back={{ label: "today", to: "/today" }} scroll>
      <Text style={[type.body(15), { color: "#6b6b6b", marginTop: -4, marginBottom: 16 }]}>
        {walked > 0 && stage
          ? t("home.trail.intro", { name, walked: t("home.trail.walked", { count: walked }), where, next })
          : start > 1 && stage ? t("home.trail.placedIntro", { name, day, where, next })
          : t("home.trail.fromTo", { name })}
      </Text>
      <View style={{ gap: 16 }}>
        {skipped ? (
          <Card testID="catch-up">
            <Eyebrow size={8}>{t("home.trail.catchUp", { camp: `${campLabel(skipped.camp)} · ${campName(skipped.camp, skipped.name)}` })}</Eyebrow>
            <Text style={[type.body(13), { color: color.mute, marginTop: 4 }]}>{t("home.trail.catchUpBody", { day: start, end: start - 1 })}</Text>
            {tiles(1, start - 1)}
          </Card>
        ) : groups.length > 1 ? (
          <Card testID="catch-up">
            <Eyebrow size={8}>{t("home.trail.catchUpAll")}</Eyebrow>
            <Text style={[type.body(13), { color: color.mute, marginTop: 4 }]}>{t("home.trail.catchUpAllBody", { day: start })}</Text>
            {groups.map((g, i) => {
              const total = g.last - g.first + 1;
              let done = 0;
              for (let n = g.first; n <= g.last; n++) if (walkedDays.has(n)) done++;
              const shown = open === i;
              return (
                <View key={g.first} style={{ borderTopWidth: 1, borderTopColor: color.line, marginTop: 12, paddingTop: 10 }}>
                  <Pressable testID={`catch-up-group-${g.first}`} accessibilityRole="button" accessibilityState={{ expanded: shown }} aria-expanded={shown} onPress={() => setOpen(shown ? null : i)}
                    style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44, opacity: pressed ? 0.7 : 1 })}>
                    <View style={{ flex: 1 }}>
                      <Text style={[type.eyebrow(8), { color: done === total ? color.ink : color.mute }]}>{campLabel(g.camp)} · {t("home.trail.groupWalked", { done, total })}</Text>
                      <Text numberOfLines={1} style={{ fontFamily: font.display[800], fontSize: 15, color: color.ink, marginTop: 2 }}>{campName(g.camp, g.name)}</Text>
                    </View>
                    <Text style={[type.eyebrow(8), { color: color.ink }]}>{shown ? t("home.trail.hideDays") : t("home.trail.showDays")}</Text>
                  </Pressable>
                  {shown ? tiles(g.first, g.last) : null}
                </View>
              );
            })}
          </Card>
        ) : null}
        <TrailMap door={door} day={day} walked={walked} placed={start > 1 ? start : undefined} caughtUp={walkedDays} />
        <TrailDay />
        <Text style={[type.caption(), { textAlign: "center" }]}>{t("home.trail.footer")}</Text>
      </View>
    </Screen>
  );
}
