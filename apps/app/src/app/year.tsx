import { useEffect, useRef, useState, type ReactNode } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { track } from "@/lib/analytics";
import { hoursWords } from "@/lib/year";
import { useStore } from "@/lib/store";
import { useTitle } from "@/lib/title";
import { useYear } from "@/lib/use-year";
import { CloseButton, Guy, Sun, color, font, type } from "@/ui";
import { ShareCardButton } from "@/ui/share-card";
import { GOLDEN, Odometer } from "@/ui/streak";
import { t } from "@/i18n";

// "Your year on the hill": a story, card by card (tap to go on, or it moves by itself), then one summary card to
// share. The last 365 days, from what's on this phone. Hours are timed where lessons were timed and estimated
// (about 5 minutes a lesson) where they weren't, and it says so. Nothing is scored but learning.
const STEP_MS = 3800;

type Slide = { key: string; pose: string; eyebrow: string; big?: number; bigText?: string; title: string; body?: string; extra?: ReactNode };

export default function Year() {
  const { so } = useLocalSearchParams<{ so?: string }>();
  const soFar = so === "1";
  useTitle(soFar ? t("session.year.soFarTitle") : t("session.year.title"));
  const { saved } = useStore();
  const y = useYear();
  const reduce = useReducedMotion();
  const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));
  useEffect(() => { track("year_opened", { days: y.days }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hours = hoursWords(y.minutes);
  const estimate = y.estimatedLessons === 0 ? t("session.year.timed")
    : y.timedLessons === 0 ? t("session.year.estimated")
    : t("session.year.mixed", { timed: t("session.year.timedN", { count: y.timedLessons }), est: t("session.year.estimatedN", { count: y.estimatedLessons }) });
  const slides: Slide[] = [
    { key: "intro", pose: "wave", eyebrow: y.range, title: soFar ? t("session.year.soFar") : t("session.year.onHill"), body: t("session.year.introBody") },
    { key: "days", pose: "climb", eyebrow: t("session.year.showedUp"), big: y.days, title: t("session.lit.plainTitle", { count: y.days }), body: t("session.year.daysBody") },
    { key: "hours", pose: "read", eyebrow: t("session.year.hoursEyebrow"), bigText: hours.split(" ")[0], title: t("session.year.hoursTitle", { unit: hours.split(" ").slice(1).join(" ") }), body: estimate },
    { key: "lessons", pose: "thumbs", eyebrow: t("session.year.lessonsEyebrow"), big: y.lessons, title: t("session.year.lessonsTitle", { count: y.lessons }) },
    {
      key: "words", pose: "think", eyebrow: t("session.year.wordsEyebrow"), big: y.words, title: t("session.year.wordsTitle", { count: y.words }),
      body: y.wordList.slice(-6).join(" · ") || undefined,
      extra: y.doorWords && y.doorWords.known > 0 ? <Text testID="door-words" style={[type.eyebrow(9), { color: GOLDEN, marginTop: 10 }]}>{t("session.year.campWords", { a: y.doorWords.known, b: y.doorWords.of })}</Text> : null,
    },
    ...(y.kept > 0 ? [{ key: "kept", pose: "readsit", eyebrow: t("session.year.book"), big: y.kept, title: t("session.year.keptTitle", { count: y.kept }), body: t("session.year.keptBody") }] : []),
    ...(y.longest > 1 ? [{ key: "streak", pose: "stride", eyebrow: t("session.year.longest"), big: y.longest, title: t("session.year.inARow"), body: t("session.year.streakBody") }] : []),
    ...(y.friends > 0 ? [{ key: "friends", pose: "cheer", eyebrow: t("session.year.walkedWith"), big: y.friends, title: t("session.year.friendsTitle", { count: y.friends }), body: t("session.year.friendsBody") }] : []),
    ...(y.quests > 0 ? [{ key: "quests", pose: "lantern", eyebrow: t("session.year.quests"), big: y.quests, title: t("session.year.questsTitle", { count: y.quests }), body: y.badges.map((b) => b.season.def.badge).join(" · ") }] : []),
  ];
  const last = slides.length; // the summary comes after the slides
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (reduce || paused || i >= last) return;
    timer.current = setTimeout(() => setI((n) => Math.min(last, n + 1)), STEP_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [i, reduce, paused, last]);
  const next = () => setI((n) => Math.min(last, n + 1));
  const back = () => setI((n) => Math.max(0, n - 1));

  if (y.days === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: color.ink, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Guy pose="wave" h={140} />
        <Text style={[type.h1(26), { color: "#fff", marginTop: 12, textAlign: "center" }]}>{t("session.year.empty")}</Text>
        <Text style={[type.body(14), { color: "#ffffffaa", marginTop: 8, textAlign: "center" }]}>{t("session.year.emptyBody")}</Text>
        <View style={{ marginTop: 16 }}><CloseButton dark onPress={close} /></View>
      </SafeAreaView>
    );
  }

  const s = slides[i];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.ink }}>
      {/* the story's progress: one bar per card */}
      <View style={{ flexDirection: "row", gap: 4, paddingHorizontal: 14, paddingTop: 10 }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: last, now: i }}>
        {Array.from({ length: last + 1 }, (_, k) => (
          <View key={k} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: k <= i ? GOLDEN : "#ffffff33" }} />
        ))}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 8 }}>
        <Text style={[type.eyebrow(9), { color: "#ffffff88", paddingLeft: 10 }]}>infinite hill</Text>
        <CloseButton dark onPress={close} />
      </View>

      {i < last ? (
        <Pressable testID="year-next" accessibilityRole="button" accessibilityLabel={t("session.year.next")} onPress={next} onLongPress={() => setPaused((x) => !x)} style={{ flex: 1 }}>
          <Animated.View key={s.key} entering={reduce ? undefined : FadeInDown.duration(480)} style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }}>
            <Text testID={`year-${s.key}`} style={[type.eyebrow(10), { color: GOLDEN }]}>{s.eyebrow}</Text>
            <View style={{ marginVertical: 14 }}><Guy pose={s.pose} h={s.key === "intro" ? 170 : 120} /></View>
            {s.big != null ? <Odometer from={0} to={s.big} size={96} ink={GOLDEN} delay={250} duration={900} />
              : s.bigText ? <Text style={{ fontFamily: font.display[800], fontSize: 96, lineHeight: 104, letterSpacing: -4, color: GOLDEN }}>{s.bigText}</Text> : null}
            <Text accessibilityRole="header" style={[type.h1(s.big != null || s.bigText ? 26 : 36), { color: "#fff", textAlign: "center", marginTop: 6 }]}>{s.title}</Text>
            {s.body ? <Text style={[type.body(14), { color: "#ffffffaa", textAlign: "center", marginTop: 10 }]}>{s.body}</Text> : null}
            {s.extra}
          </Animated.View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 22, paddingBottom: 18 }}>
            <Pressable accessibilityRole="button" accessibilityLabel={t("session.year.back")} onPress={back} hitSlop={12} disabled={i === 0}><Text style={[type.eyebrow(9), { color: i === 0 ? "transparent" : "#ffffff88" }]}>{t("session.year.backBtn")}</Text></Pressable>
            <Text style={[type.eyebrow(9), { color: "#ffffff88" }]}>{t("session.year.tapNext")}</Text>
          </View>
        </Pressable>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 14 }}>
          <Animated.View entering={reduce ? undefined : FadeIn.duration(500)} testID="year-summary" style={{ backgroundColor: color.cream, borderRadius: 26, padding: 20, gap: 14, borderWidth: 2, borderColor: GOLDEN }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Sun size={44} mood="happy" />
              <View style={{ flex: 1 }}>
                <Text style={[type.eyebrow(8), { color: color.ink }]}>{y.range}</Text>
                <Text style={type.h1(26)}>{soFar ? t("session.year.soFar") : t("session.year.onHill")}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {([
                [String(y.days), t("session.year.sumDays", { count: y.days })],
                [hours, t("session.year.sumLearned")],
                [String(y.lessons), t("session.year.sumLessons", { count: y.lessons })],
                [String(y.words), t("session.year.sumWords", { count: y.words })],
                [String(y.kept), t("session.year.sumKept", { count: y.kept })],
                [String(y.longest), t("session.year.longest")],
                [String(y.friends), t("session.year.sumFriends", { count: y.friends })],
                [String(y.quests), t("session.year.sumQuests", { count: y.quests })],
              ] as [string, string][]).map(([a, b]) => (
                <View key={b} style={{ width: "47.8%", backgroundColor: "#fff", borderRadius: 16, borderWidth: 1.5, borderColor: color.line, paddingVertical: 10, paddingHorizontal: 12 }}>
                  <Text style={{ fontFamily: font.display[800], fontSize: 22, color: color.ink }}>{a}</Text>
                  <Text style={[type.eyebrow(8), { marginTop: 2 }]}>{b}</Text>
                </View>
              ))}
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
              <View style={{ flex: 1, gap: 6 }}>
                {y.doorWords ? <Text testID="door-score" style={type.caption(12)}>{t("session.year.doorScore", { a: y.doorWords.known, b: y.doorWords.of })}</Text> : null}
                <Text style={type.caption(12)}>{t("session.year.hours", { estimate })}</Text>
              </View>
              <Guy pose="joy" h={84} />
            </View>
          </Animated.View>
          <ShareCardButton testID="share-year" kind="gold" spec={{ kind: "year", door: saved.settings.homeWing, days: y.days, hours, lessons: y.lessons, words: y.words, longest: y.longest, range: y.range }}>{t("session.year.share")}</ShareCardButton>
          <Pressable accessibilityRole="button" onPress={() => setI(0)} style={{ alignItems: "center", paddingVertical: 8 }}><Text style={[type.eyebrow(9), { color: "#ffffff99" }]}>{t("session.year.again")}</Text></Pressable>
          <Text style={[type.caption(11), { color: "#ffffff77", textAlign: "center" }]}>{t("session.year.foot")}</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
