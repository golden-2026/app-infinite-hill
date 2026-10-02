import { TabHeader } from "@/ui/tab-header";
import { useTitle } from "@/lib/title";
// Together: honest in the pilot. No invented counts, members, live reads or events (audit 9/25).
// What's real: friends walking with you, lanterns, and your door. Voices and Keepers appear only once signed (ui/voices).
// "Walking with": friends who sent you a lantern link (lib/walkers, local), and friends you paired with through a
// lantern invite (lib/friends, the small server in api/friends.js): their streak, your days together, and the opt-in
// friends-only weekly board. Offline, it shows when you last saw them.
// Circles (ui/circles, api/circles.js): groups a teacher or a house of worship brings in. Their counts are real (from the
// server), and members appear by nickname only if they choose to.
import { icon } from "@ih/content";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/lib/store";
import { pathWords, readWalkers, walkerName, whenLit, type Walker } from "@/lib/walkers";
import { Btn, Card, Eyebrow, Face, Guy, Link, color, confirmSheet, font, toast, type } from "@/ui";
import { friendsPrivacy, FamilyBoard, FriendRows, NickPrompt, WeeklyBoard } from "@/ui/friends";
import { leaveFriends, useFriends } from "@/lib/friends";
import { leaveAllCircles } from "@/lib/circles";
import { CirclesCard } from "@/ui/circles";
import { useCompanionDay } from "@/lib/companion/use-companion";
import { doorLabel, t } from "@/i18n";

function WalkingWith() {
  const { saved, today } = useStore();
  const mine = saved.settings.lanternOn ?? null;
  const [list, setList] = useState<Walker[]>(() => readWalkers());
  const friends = useFriends();
  useFocusEffect(useCallback(() => { setList(readWalkers()); }, []));
  return (
    <Card>
      <Eyebrow>{t("home.together.walkingWith")}</Eyebrow>
      <FriendRows />
      <NickPrompt />
      {list.length === 0 && friends.friends.length === 0 ? (
        <View style={{ gap: 10, marginTop: 8 }}>
          <Text style={{ fontFamily: font.display[800], fontSize: 17, color: color.ink }}>{t("home.together.nobody")}</Text>
          <Btn kind="ink" onPress={() => router.push("/lantern")} testID="walkers-empty-lantern">{t("home.together.todaysLantern")}</Btn>
        </View>
      ) : list.length === 0 ? null : (
        <View style={{ marginTop: 6 }}>
          {friends.friends.length ? <Text style={[type.eyebrow(8), { marginTop: 10 }]}>{t("home.together.sentYou")}</Text> : null}
          {list.map((w, i) => {
            const both = !!mine && mine === w.lastLit;
            return (
              <View key={`${w.name}|${w.door}`} style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: color.line }} testID="walker">
                {/* the friend's initial on their door's color — never a voice's photo (voices aren't signed) */}
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: icon(w.door).tint, alignItems: "center", justifyContent: "center" }} accessible={false}>
                  <Text style={{ fontFamily: font.display[800], fontSize: 18, color: "#fff" }}>{walkerName(w)[0].toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink }}>{walkerName(w)}</Text>
                  <Text style={[type.body(12), { color: color.mute }]}>{pathWords(w.door, w.n)}</Text>
                  <Text style={[type.body(13), { color: color.ink }]}>{t("home.together.litForYou", { when: whenLit(w.lastLit, today) })}</Text>
                  {both ? <Text style={[type.body(13), { color: color.ink, fontFamily: font.text[600] }]}>{w.lastLit === today ? t("home.together.bothToday") : t("home.together.bothThatDay")}</Text> : null}
                  <View style={{ alignItems: "flex-start", marginTop: 4 }}>
                    <Link onPress={() => router.push({ pathname: "/lantern", params: { to: walkerName(w) } })} label={t("home.together.sendBackA11y", { name: walkerName(w) })} style={{ fontSize: 11 }}>{t("home.together.sendBack")}</Link>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
      <Text testID="friends-privacy" style={[type.body(11), { color: color.mute, marginTop: 10 }]}>{friends.friendId ? friendsPrivacy() : t("home.together.localNote")}</Text>
      {friends.friendId ? <Link onPress={async () => { if (await confirmSheet({ title: t("home.together.leaveTitle"), body: t("home.together.leaveBody"), confirm: t("home.together.leaveConfirm"), cancel: t("home.together.keep"), destructive: true })) { if ((await leaveAllCircles()) && (await leaveFriends())) { setList(readWalkers()); toast(t("home.together.left")); } else toast(t("home.friends.unreachable")); } }} style={{ color: color.mute, fontSize: 10, marginTop: 6 }}>{t("home.together.leaveLink")}</Link> : null}
    </Card>
  );
}

export default function Together() {
  useTitle(t("home.tab.together"));
  const { saved, lessonFor, derived } = useStore();
  const door = saved.settings.homeWing; // "your door" is your home door, even while visiting another
  const ic = icon(door);
  const quiet = useCompanionDay().day.quiet; // no boards on a quiet day
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: color.cream }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, gap: 16, paddingBottom: 32 }}>
        <TabHeader eyebrow={t("home.tab.together")} title={t("home.together.title")} pose="dog" />
        <WalkingWith />
        <CirclesCard />
        <WeeklyBoard quiet={quiet} />
        <FamilyBoard quiet={quiet} />
        <Card>
          <Eyebrow>{t("home.together.yourDoor", { door: doorLabel(door) })}</Eyebrow>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 }}>
            <Face ic={ic} w={44} h={44} r={22} caption={false} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.display[800], fontSize: 17, color: color.ink }}>{t("home.together.walking", { door: doorLabel(door) })}</Text>
              <Text style={[type.body(12), { color: color.mute }]}>{t("home.together.onLesson", { n: lessonFor(door) })} · {t("common.daysOnHill", { count: derived.showedUp })}</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
