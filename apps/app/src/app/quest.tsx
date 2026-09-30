import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { datesMayVary, deName, monthDay, questProgress, seasonById, seasonLine, seasonNote, stillFinishLine, whenWords } from "@/content/seasons";
import { doorLabel, isEs, t } from "@/i18n";
import { track } from "@/lib/analytics";
import { useSeasons } from "@/lib/quests";
import { useStore } from "@/lib/store";
import { useTitle } from "@/lib/title";
import { Btn, Card, Guy, Link, Screen, color, font, type } from "@/ui";
import { QuestBadge, Stones } from "@/ui/quest";

// A season quest: the path of stones for the whole season, today's line, and the badge at the end.
// Joining is opt-in and lives on the phone. A day counts when any lesson is finished that day; rest days count too.
export default function Quest() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const s = id ? seasonById(String(id)) : null;
  useTitle(s ? t("home.quest.title", { name: s.def.name }) : t("home.quest.titleNone"));
  const { setQuest } = useStore();
  const { lessonDates, restDates, quests, today, mode, doors } = useSeasons();
  const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));
  // only seasons this person may be offered (their door, a visit, or a taste they chose)
  if (!s || !s.def.doors.some((d) => doors.includes(d))) {
    return (
      <Screen close={close} center>
        <Text style={[type.body(), { textAlign: "center" }]}>{t("home.quest.notHere")}</Text>
      </Screen>
    );
  }
  const q = quests[s.id];
  const joined = !!q?.joined;
  const p = questProgress(s, { lessonDates, restDates, today });
  const before = today < s.start;
  const still = joined ? stillFinishLine(s, p) : null;
  const line = seasonLine(s, before ? s.start : today, mode);
  const join = () => { setQuest(s.id, { joined: today }); track("quest_joined", { days: s.length }); };
  const leave = () => setQuest(s.id, null);
  const days = `${monthDay(s.start)} – ${monthDay(s.end)}`;

  return (
    <Screen close={close} scroll footer={joined ? null : p.phase === "grace" || p.phase === "past" ? null : (
      <>
        <Btn testID="quest-join" kind="gold" onPress={join}>{t("home.quest.join")}</Btn>
        <View style={{ alignItems: "center" }}><Link onPress={() => { setQuest(s.id, { declined: today }); close(); }}>{t("home.quest.notThisTime")}</Link></View>
      </>
    )}>
      <View style={{ gap: 14 }}>
        <View>
          <Text style={type.eyebrow(9)}>{t("home.quest.eyebrow", { doors: s.def.doors.map((d) => doorLabel(d)).join(" · ") })}</Text>
          <Text accessibilityRole="header" style={[type.h1(34), { marginTop: 6 }]}>{s.def.name}</Text>
          <Text style={[type.body(14), { marginTop: 6 }]}>{s.def.about}</Text>
        </View>

        {p.finished ? (
          <Card style={{ alignItems: "center", gap: 10, paddingVertical: 22 }}>
            <Guy pose="joy" h={120} />
            <QuestBadge name={s.def.badge} season={s.def.name} />
            <Text style={{ fontFamily: font.display[800], fontSize: 20, color: color.ink, textAlign: "center" }}>{t("home.quest.walkedAll", { n: p.length, name: isEs() ? deName(s.def.name) : s.def.name })}</Text>
            <Text style={[type.caption(), { textAlign: "center" }]}>{t("home.quest.badgeLives")}</Text>
          </Card>
        ) : null}

        <Card testID="quest-progress" style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Text style={{ fontFamily: font.display[800], fontSize: 24, color: color.ink }}>
              {before ? t("home.quest.begins", { when: whenWords(today, s.start) }) : p.phase === "active" ? t("home.quest.dayOf", { day: p.day, n: p.length }) : t("home.quest.over", { name: s.def.name })}
            </Text>
            <Text style={type.eyebrow(8)}>{t("home.quest.lit", { lit: p.lit, n: p.length })}</Text>
          </View>
          <Stones stones={p.stones} />
          <Text style={type.caption(12)}>{days} · {datesMayVary()}{s.note ? ` (${seasonNote(s)})` : ""}.</Text>
          {still ? <Text testID="quest-still" style={[type.body(14), { color: color.ink }]}>{still}</Text> : null}
        </Card>

        <Card dark style={{ gap: 8 }}>
          <Text style={[type.eyebrow(8), { color: color.gold }]}>{mode === "learn" ? t("home.quest.howPeople") : before ? t("home.quest.firstQuestion") : t("home.quest.todaysQuestion")}</Text>
          <Text testID="quest-line" style={{ fontFamily: font.display[700], fontSize: 19, lineHeight: 25, color: "#fff" }}>{line}</Text>
          <Text style={[type.caption(12), { color: "#ffffff88" }]}>{mode === "learn" ? t("home.quest.learnNote") : t("home.quest.askNote")}</Text>
        </Card>

        <View style={{ gap: 6 }}>
          <Text style={type.eyebrow(8)}>{t("home.quest.howItWorks")}</Text>
          <Text style={type.body(13)}>{t("home.quest.rules", { name: isEs() ? deName(s.def.name) : s.def.name, n: p.length, badge: s.def.badge })}</Text>
          <Text style={[type.caption(12)]}>{t("home.quest.phoneOnly")}</Text>
        </View>

        {joined && !p.finished ? <View style={{ alignItems: "center", marginTop: 4 }}><Link onPress={leave} style={{ color: color.mute }}>{t("home.quest.leave")}</Link></View> : null}
      </View>
    </Screen>
  );
}
