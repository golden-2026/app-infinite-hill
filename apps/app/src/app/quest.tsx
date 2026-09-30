import { label } from "@ih/content";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { DATES_MAY_VARY, monthDay, questProgress, seasonById, seasonLine, stillFinishLine, whenWords } from "@/content/seasons";
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
  useTitle(s ? `${s.def.name} quest` : "season quest");
  const { setQuest } = useStore();
  const { lessonDates, restDates, quests, today, mode, doors } = useSeasons();
  const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));
  // only seasons this person may be offered (their door, a visit, or a taste they chose)
  if (!s || !s.def.doors.some((d) => doors.includes(d))) {
    return (
      <Screen close={close} center>
        <Text style={[type.body(), { textAlign: "center" }]}>that quest isn't here right now.</Text>
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
        <Btn testID="quest-join" kind="gold" onPress={join}>join the quest</Btn>
        <View style={{ alignItems: "center" }}><Link onPress={() => { setQuest(s.id, { declined: today }); close(); }}>not this time</Link></View>
      </>
    )}>
      <View style={{ gap: 14 }}>
        <View>
          <Text style={type.eyebrow(9)}>a season quest · {s.def.doors.map((d) => label(d)).join(" · ")}</Text>
          <Text accessibilityRole="header" style={[type.h1(34), { marginTop: 6 }]}>{s.def.name}</Text>
          <Text style={[type.body(14), { marginTop: 6 }]}>{s.def.about}</Text>
        </View>

        {p.finished ? (
          <Card style={{ alignItems: "center", gap: 10, paddingVertical: 22 }}>
            <Guy pose="joy" h={120} />
            <QuestBadge name={s.def.badge} season={s.def.name} />
            <Text style={{ fontFamily: font.display[800], fontSize: 20, color: color.ink, textAlign: "center" }}>{`you walked all ${p.length} days of ${s.def.name}.`}</Text>
            <Text style={[type.caption(), { textAlign: "center" }]}>the badge lives under you, and in your year on the hill.</Text>
          </Card>
        ) : null}

        <Card testID="quest-progress" style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Text style={{ fontFamily: font.display[800], fontSize: 24, color: color.ink }}>
              {before ? `begins ${whenWords(today, s.start)}` : p.phase === "active" ? `day ${p.day} of ${p.length}` : `${s.def.name} is over`}
            </Text>
            <Text style={type.eyebrow(8)}>{p.lit} of {p.length} lit</Text>
          </View>
          <Stones stones={p.stones} />
          <Text style={type.caption(12)}>{days} · {DATES_MAY_VARY}{s.note ? ` (${s.note.replace(/\d{4}-\d{2}-\d{2}/g, (d) => monthDay(d))})` : ""}.</Text>
          {still ? <Text testID="quest-still" style={[type.body(14), { color: color.ink }]}>{still}</Text> : null}
        </Card>

        <Card dark style={{ gap: 8 }}>
          <Text style={[type.eyebrow(8), { color: color.gold }]}>{mode === "learn" ? "how people keep it" : before ? "the first day's question" : "today's question"}</Text>
          <Text testID="quest-line" style={{ fontFamily: font.display[700], fontSize: 19, lineHeight: 25, color: "#fff" }}>{line}</Text>
          <Text style={[type.caption(12), { color: "#ffffff88" }]}>{mode === "learn" ? "one line a day on how the season is kept. nothing to do but notice." : "no answer needed. carry it with you, or write it in your journal."}</Text>
        </Card>

        <View style={{ gap: 6 }}>
          <Text style={type.eyebrow(8)}>how it works</Text>
          <Text style={type.body(13)}>{`finish a lesson on a day of ${s.def.name} and that day's stone lights. rest days from your streak count too. miss a few? lessons in the week after it ends fill them in. light all ${p.length} for the badge: “${s.def.badge}.”`}</Text>
          <Text style={[type.caption(12)]}>it stays on this phone. we score learning, never faith.</Text>
        </View>

        {joined && !p.finished ? <View style={{ alignItems: "center", marginTop: 4 }}><Link onPress={leave} style={{ color: color.mute }}>leave this quest</Link></View> : null}
      </View>
    </Screen>
  );
}
