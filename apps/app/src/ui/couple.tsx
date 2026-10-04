// Today's two cards for the two-faith couple (content/couple.ts): "walk it together" (seven days side by side, each on
// their own door; only the partner's progress signal from the friends server is shown) and "before the holiday" (a few
// already-written lessons on the partner's family's door, a week or two before its next big holiday).
import { lessonInfo } from "@ih/content";
import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { holidayFor, noteSeen, walkPartner, walkView, WALK_DAYS } from "@/content/couple";
import { datesMayVary } from "@/content/seasons";
import { couplePartnerDoor, coupleWhy } from "@/lib/couple";
import { useFriends } from "@/lib/friends";
import { useStore } from "@/lib/store";
import { doorLabel, t, type Key } from "@/i18n";
import { Btn, Guy, Sun, color, font, type } from "@/ui";

/** One row of seven stones: a sun for a day walked, a ring for today, a dot for the rest. */
function Stones({ states }: { states: ("lit" | "today" | "missed" | "later" | "open")[] }) {
  return (
    <View style={{ flexDirection: "row", gap: 5, flexShrink: 0 }}>
      {states.map((s, i) => s === "lit"
        ? <View key={i} style={c.stone}><Sun size={18} /></View>
        : <View key={i} style={[c.stone, { borderWidth: 1.5, borderColor: s === "today" ? color.ink : color.line, borderRadius: 9, width: 18, height: 18, backgroundColor: s === "later" ? "transparent" : "#fff" }]} />)}
    </View>
  );
}

export function WalkTogetherCard({ quiet, flush }: { quiet?: boolean; /** inside a screen with its own gutter */ flush?: boolean }) {
  const { saved, derived, today, update } = useStore();
  const st = saved.settings;
  const friends = useFriends();
  const walk = st.walk && !st.walk.closed ? st.walk : null;
  const partner = walkPartner(walk, friends.friends);
  // the partner was seen done today: remembered on this phone (only that they walked, from the friends signal)
  useEffect(() => {
    if (!walk || !partner) return;
    const next = noteSeen(walk.friendId ? walk : { ...walk, friendId: partner.id }, today, partner.doneToday);
    if (next !== walk) update({ walk: next });
  }, [walk, partner?.id, partner?.doneToday, today]); // eslint-disable-line react-hooks/exhaustive-deps
  if ((!coupleWhy(st) && !flush) || quiet) return null;
  if (st.walk?.closed) return null;
  const open = () => router.push("/walk-together");
  if (!walk) {
    return (
      <View testID="walk-offer" style={[c.lite, { flexDirection: "row", alignItems: "center", gap: 12 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("couple.walk.offerA11y")} onPress={open} style={({ pressed }) => ({ flex: 1, flexDirection: "row", gap: 12, alignItems: "center", opacity: pressed ? 0.8 : 1 })}>
          <Guy pose="heart" h={56} />
          <View style={{ flex: 1 }}>
            <Text style={[type.eyebrow(8), { color: color.ink }]}>{t("couple.walk.eyebrow")}</Text>
            <Text style={{ fontFamily: font.display[800], fontSize: 15, marginTop: 3, color: color.ink }}>{t("couple.walk.offerTitle")}</Text>
            <Text style={[type.body(12), { color: color.mute, marginTop: 2 }]}>{t("couple.walk.offerBody")}</Text>
          </View>
          <Text style={c.chev}>›</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t("home.dismiss")} onPress={() => update({ walk: { on: today, closed: true } })} hitSlop={10} style={{ alignSelf: "flex-start" }}><Text style={type.eyebrow(12)}>✕</Text></Pressable>
      </View>
    );
  }
  const v = walkView(walk, { myDates: derived.dates, theirDoneToday: partner?.doneToday, today });
  const nick = partner?.nick || t("couple.walk.partner");
  const line = v.finished ? t("couple.walk.finished") : v.over ? t("couple.walk.over")
    : !partner ? t("couple.walk.waiting") : partner.doneToday ? t("couple.walk.themDone", { nick }) : t("couple.walk.themNotYet", { nick });
  return (
    <View testID="walk-card" style={[c.lite, { gap: 8 }, flush && { marginHorizontal: 0 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("couple.walk.openA11y")} onPress={open} style={({ pressed }) => ({ gap: 8, opacity: pressed ? 0.85 : 1 })}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={[type.eyebrow(8), { color: color.ink }]}>{v.over ? t("couple.walk.eyebrow") : t("couple.walk.dayOf", { day: v.day, of: WALK_DAYS })}</Text>
          <Text style={c.chev}>›</Text>
        </View>
        <View accessible accessibilityLabel={t("couple.walk.rowsA11y", { mine: v.mine, theirs: v.theirs, of: WALK_DAYS, nick })} style={{ gap: 6 }}>
          <View style={c.row}><Text numberOfLines={1} style={c.who}>{t("couple.walk.you")}</Text><Stones states={v.stones.map((s) => s.me)} /></View>
          <View style={c.row}><Text numberOfLines={1} style={c.who}>{nick}</Text><Stones states={v.stones.map((s) => s.them)} /></View>
        </View>
        <Text style={[type.body(13), { color: color.ink }]}>{line}</Text>
      </Pressable>
      {v.over || v.finished ? (
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <Btn kind="gold" testID="walk-again" style={{ paddingHorizontal: 16, paddingVertical: 10 }} onPress={() => update({ walk: { on: today, ...(partner ? { friendId: partner.id } : { known: walk.known || [] }), seen: [] } })}>{t("couple.walk.again")}</Btn>
          <Pressable accessibilityRole="button" accessibilityLabel={t("home.dismiss")} onPress={() => update({ walk: { ...walk, closed: true } })} hitSlop={10}><Text style={type.eyebrow(12)}>✕</Text></Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function HolidayCard({ quiet, onOpen }: { quiet?: boolean; onOpen: (door: string, day: number) => void }) {
  const { saved, today, update } = useStore();
  const st = saved.settings;
  const door = couplePartnerDoor(st);
  const h = holidayFor(door, today);
  if (!h || quiet || (st.holidaySeen || []).includes(h.id)) return null;
  const read = new Set(st.forYouDone || []);
  const walked = (n: number) => read.has(`${h.door}:${n}`) || saved.sits.some((x) => !x.kidId && x.door === h.door && x.day === n);
  if (h.days.every(walked)) return null;
  const name = t(`couple.holiday.name.${h.key}` as Key);
  const title = h.daysAway === 0 ? t("couple.holiday.today", { name }) : t("couple.holiday.soon", { name, count: h.daysAway });
  return (
    <View testID="holiday-card" style={[c.lite, { gap: 6 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Guy pose="joy" h={52} />
        <View style={{ flex: 1 }}>
          <Text style={[type.eyebrow(8), { color: color.ink }]}>{t("couple.holiday.eyebrow")} · {doorLabel(h.door)}</Text>
          <Text style={{ fontFamily: font.display[800], fontSize: 15, marginTop: 3, color: color.ink }}>{title}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={t("home.dismiss")} onPress={() => update({ holidaySeen: [...(st.holidaySeen || []), h.id].slice(-20) })} hitSlop={10}><Text style={type.eyebrow(12)}>✕</Text></Pressable>
      </View>
      {h.days.map((n) => {
        const title = lessonInfo(h.door, n)?.title || t("common.day", { n });
        return (
          <Pressable key={n} testID={`holiday-${n}`} accessibilityRole="link" accessibilityLabel={t("home.forYou.a11y", { n, title })} onPress={() => onOpen(h.door, n)}
            style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 40, opacity: pressed ? 0.8 : 1 }]}>
            <Text style={[type.eyebrow(8), { width: 76, color: color.mute }]}>{t("common.day", { n })}</Text>
            <Text numberOfLines={1} style={[type.body(14), { flex: 1, color: color.ink }]}>{title}{walked(n) ? " ✓" : ""}</Text>
            <Text style={c.chev}>›</Text>
          </Pressable>
        );
      })}
      <Text style={[type.body(12), { color: color.mute }]}>{t("couple.holiday.body")} {datesMayVary()}.</Text>
    </View>
  );
}

const c = StyleSheet.create({
  lite: { marginHorizontal: 18, marginTop: 0, marginBottom: 12, backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.line, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14 },
  chev: { fontFamily: font.display[800], fontSize: 18, color: color.ink },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  who: { flex: 1, fontFamily: font.text[600], fontSize: 13, color: color.ink },
  stone: { width: 18, height: 18, alignItems: "center", justifyContent: "center" },
});

