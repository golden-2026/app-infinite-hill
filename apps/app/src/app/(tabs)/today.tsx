import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
// Today, redesigned (owner brief 2026-10-01): one obvious next step. The hero holds today's lesson and its start
// button (or, once done, what you did and tomorrow's lesson). Everything else is secondary and lighter, below it:
// today's extras (only after someone's first lesson), review, yesterday's carry, the companion's short note, offers,
// friends, the hill, the trail, songs. On a quiet day the companion comes first and the games step back.
import { DOORS, STRAND_WORDS, data, icon, lessonInfo, native, pos } from "@ih/content";
import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { isDemo } from "@/lib/flags";
import { useStore } from "@/lib/store";
import { dueCards } from "@/lib/missed";
import { useFriends, togetherWords } from "@/lib/friends";
import { Btn, Card, Face, Guy, Sun, color, font, type } from "@/ui";
import { HillScene } from "@/ui/hill";
import { TodaysThree } from "@/ui/todays-three";
import { TodayHero } from "@/ui/today-hero";
import { SongCard } from "@/ui/song";
import { useCompanionDay } from "@/lib/companion/use-companion";
import { CompanionCard, CompanionNote, HelpCard, ReflectCard } from "@/ui/companion";
import { StreakChip } from "@/ui/streak";
import { goalView, weekdayOf } from "@/lib/streak";
import { useSeasons } from "@/lib/quests";
import { newYearNow } from "@/content/seasons";
import { QuestTodayCard } from "@/ui/quest";
import { campLabel, campName, doorLabel, isEs, t } from "@/i18n";

export default function Today() {
  useTitle(t("home.tab.today"));
  const { saved, derived, door, lessonFor, startFor, update, markWelcomedBack, demoShiftDays, today, setQuest } = useStore();
  const seasons = useSeasons();
  const friends = useFriends();
  const newYear = newYearNow(saved.settings.homeWing, today);
  const newYearKey = newYear ? `${newYear.door}:${newYear.date}` : null;
  const st = saved.settings;
  const wing = door;
  const ic = icon(wing);
  const lesson = lessonFor(wing);
  const doneHere = derived.paths[wing]?.done === true;
  const p = pos(lesson);
  const base0 = p.start - 1; // the day before this camp (or year) begins
  const titleFor = (n: number) => lessonInfo(wing, base0 + n) || {};
  const info = titleFor(p.lesson);
  const title = info.title || `${(isEs() ? campName(p.camp, p.name) : p.name).toLowerCase()} · ${t("home.today.lessonN", { n: p.lesson })}`;
  const hour = new Date().getHours();
  const night = hour < 6 || hour >= 20; // same bedtime as the hill
  const strand = STRAND_WORDS(wing, lesson);
  // words that slipped and are due again come first; otherwise the latest strand words (reviewed today: rests till tomorrow)
  const dueAgain = dueCards(saved.missed || [], wing, today, { n: 5 }).length;
  const due = dueAgain || (st.reviewedOn === today ? 0 : Math.min(3, strand.length));
  // yesterday's line to carry: only once there was a yesterday on this path (not on the day placement started them)
  const yest = lesson > startFor(wing) ? lessonInfo(wing, lesson - 1) || {} : null;
  const carried = st.carried && st.carried.lesson === lesson - 1 ? st.carried.did : null; // saved, so reload keeps it
  const setCarried = (did: boolean) => update({ carried: { date: today, lesson: lesson - 1, did } });
  // a return visit: the first open of a new date after at least one earlier day
  useEffect(() => { if (derived.showedUp > 0 && !derived.doneToday) track("day_returned", { days: derived.showedUp, missed: derived.missedDays }); }, [today]); // eslint-disable-line react-hooks/exhaustive-deps
  // the companion: today's practice, mood and note. On a quiet day it comes first and the games step back.
  const { day: companion } = useCompanionDay();
  const quiet = companion.quiet;
  const start = () => router.push({ pathname: "/session/[door]/[day]", params: { door: wing, day: String(lesson) } });
  const doors: [string, "home" | "visit"][] | null = st.visitWing ? [[st.homeWing, "home"], [st.visitWing, "visit"]] : null;
  // the streak (the adult's own; a child's days never count here). "show my streak" off hides all of it.
  const streakOn = st.streakOn !== false;
  const sk = derived.streak;
  const golden = sk.golden && sk.streak >= 7;
  const goal = goalView(st.goal, sk);
  // the streak under the start button, said gently. It's only "at stake" when no rest day is left, and louder only as the day ends.
  const streakLine = streakOn && sk.streak >= 1 && !quiet ? (() => {
    if (sk.streak === 1) return { text: t("home.hero.streakBefore", { count: 1 }), loud: false };
    const right = sk.atRisk ? (hour >= 17 ? t("home.today.keepsGoing") : t("home.today.noRestLeft"))
      : sk.restedYesterday ? t("home.today.restUsed")
      : t("home.restBanked", { count: sk.rest });
    return { text: `${t("home.streakN", { count: sk.streak })} · ${right}`, loud: sk.atRisk && hour >= 17 };
  })() : null;
  const tomorrow = (lessonInfo(wing, lesson + 1) || {}).title || t("session.tomorrow.fallback");
  const campLine = `${campLabel(p.camp)} · ${isEs() ? campName(p.camp, p.name) : p.name} · ${t("home.today.lessonOf", { n: p.lesson, of: p.of })}`.toLowerCase(); // lowercase voice (the English camp names are title case)

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: color.cream }}>
      <View style={s.head}>
        {doors ? (
          <View style={s.switch} accessibilityRole="tablist">
            {doors.map(([w, kind]) => (
              <Pressable key={kind} accessibilityRole="tab" accessibilityState={{ selected: st.active === kind }} aria-selected={st.active === kind} accessibilityLabel={t(kind === "home" ? "home.today.yourDoor" : "home.today.visiting", { door: doorLabel(w) })} onPress={() => update({ active: kind })}
                style={[s.switchItem, st.active === kind && { backgroundColor: color.ink }]}>
                <Face ic={icon(w)} w={22} h={22} r={11} caption={false} />
                <Text style={[type.eyebrow(7), { color: st.active === kind ? color.gold : color.ink }]}>{doorLabel(w)}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 }}><Face ic={ic} w={30} h={30} r={15} caption={false} /><Text numberOfLines={1} style={[type.eyebrow(8), { flexShrink: 1 }]}>{doorLabel(wing)}</Text></View>
        )}
        {streakOn ? (
          // the streak leads: the number, then the sun (our flame). Gold once it's a golden streak (7+ days, no rest day).
          // No streak yet: say what starts one, never a bare "0".
          <Pressable testID="day-count" accessibilityRole="button" accessibilityLabel={`${sk.streak > 0 ? t("home.streakN", { count: sk.streak }) : derived.showedUp === 0 ? t("home.today.streakDay1") : t("home.today.streakNew")}${golden ? t("home.today.golden") : ""}. ${t("home.today.openYou")}`} onPress={() => router.push("/you")} style={({ pressed }) => ({ paddingVertical: 7, marginVertical: -7, opacity: pressed ? 0.6 : 1, flexShrink: 0 })}>
            {sk.streak > 0 ? <StreakChip n={sk.streak} golden={golden} /> : (
              <View testID="streak-start" style={s.startPill}><Sun size={16} /><Text style={{ fontFamily: font.text[600], fontSize: 12, color: color.ink }}>{derived.showedUp === 0 ? t("home.today.streakDay1") : t("home.today.streakNew")}</Text></View>
            )}
          </Pressable>
        ) : (
          <Pressable testID="day-count" accessibilityRole="button" accessibilityLabel={`${t("common.daysOnHill", { count: derived.showedUp })}. ${t("home.today.openYou")}`} onPress={() => router.push("/you")} style={({ pressed }) => ({ paddingVertical: 7, marginVertical: -7, opacity: pressed ? 0.6 : 1 })}>
            <View style={s.count}><Sun size={16} /><Text style={{ fontFamily: font.display[800], fontSize: 14, color: color.ink }}>{derived.showedUp}</Text></View>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: 4, paddingBottom: 28 }}>
        {derived.welcomeBack ? (
          <Card style={{ marginHorizontal: 18, marginBottom: 12, flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Guy pose="wave" h={70} />
            <View style={{ flex: 1 }}>
              <Text style={type.h1(20)}>{streakOn && sk.streak > 0 ? t("home.today.wbStreakTitle") : t("home.today.wbDaysTitle")}</Text>
              <Text style={[type.body(13), { color: color.mute, marginTop: 4 }]}>{streakOn && sk.streak > 0
                ? t("home.today.wbStreak", { count: sk.streak })
                : t("home.today.wbDays", { count: derived.showedUp })}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={t("home.dismiss")} onPress={markWelcomedBack} hitSlop={10}><Text style={type.eyebrow()}>✕</Text></Pressable>
          </Card>
        ) : null}

        {/* safety first, always: the real-help card (only for words that mean someone may be in danger) */}
        {companion.help ? <HelpCard /> : null}
        {quiet ? <CompanionCard day={companion} /> : null}
        {quiet ? <ReflectCard /> : null}

        {/* the one thing to do today */}
        {doneHere ? (
          <TodayHero done n={lesson} title={title} carry={info.carry || (data.DAY1[wing] || data.DAY1.SPIRITUAL).carry} streak={streakOn ? sk.streak : null}
            tomorrow={tomorrow} night={night} when={night ? t("home.today.sleepOnIt") : hour >= 19 ? t("home.today.seeTomorrow") : t("home.today.seeSundown")}
            extra={isDemo() ? <View style={{ marginTop: 12 }}><Btn kind="ghost" onPress={() => demoShiftDays(1)}>{t("home.today.demoSkip")}</Btn></View> : null} />
        ) : (
          <TodayHero done={false} n={lesson} title={title} camp={campLine} first={derived.showedUp === 0} quiet={quiet}
            goal={goal && streakOn ? `${t("home.today.goal", { done: goal.done, days: goal.days })}${goal.reached ? t("home.today.goalReached") : ""}` : null}
            streak={streakLine} onStart={start} startLabel={t("home.today.startA11y", { n: lesson, title })} />
        )}

        {streakOn && sk.earnBack && !quiet ? (
          // the streak broke: for 3 days, two lessons in one day bring it back. An offer, never a bill.
          // Before today's lesson the hero's start button is the way in; after it, "one more" lives here.
          <View testID="earn-back" style={[s.lite, { marginTop: 0 }]}>
            <Guy pose="climb" h={60} />
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[type.eyebrow(8), { color: color.ink }]}>{t("home.today.earnBack", { done: sk.earnBack.lessonsToday, need: sk.earnBack.need })}</Text>
              <Text style={{ fontFamily: font.display[800], fontSize: 15, color: color.ink }}>{t("home.today.earnBackBody", { count: sk.earnBack.lost })}</Text>
              <Text style={[type.body(12), { color: color.mute }]}>{sk.earnBack.lastDay === today ? t("home.today.openTonight") : t("home.today.openTill", { day: weekdayOf(sk.earnBack.lastDay) })}</Text>
              {doneHere ? <Btn testID="earn-back-go" kind="gold" style={{ marginTop: 6, alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 10 }} onPress={start}>{t("home.today.oneMore")}</Btn> : null}
            </View>
          </View>
        ) : null}

        {/* today's extras: only once someone has finished a first lesson */}
        {derived.showedUp >= 1 && !quiet ? <TodaysThree /> : null}

        {doneHere && st.deepOn !== today && lesson > 1 && !quiet ? (
          <Pressable accessibilityRole="button" accessibilityLabel={t("home.today.deeperA11y")} onPress={() => router.push({ pathname: "/session/[door]/[day]", params: { door: wing, day: String(lesson), deep: "1" } })}
            style={({ pressed }) => [s.lite, { marginTop: 0 }, pressed && { opacity: 0.85 }]}>
            <Guy pose="stride" h={52} />
            <View style={{ flex: 1 }}>
              <Text style={[type.eyebrow(8), { color: color.ink }]}>{t("home.today.deeperEyebrow")}</Text>
              <Text style={{ fontFamily: font.display[800], fontSize: 15, marginTop: 3, color: color.ink }}>{t("home.today.deeperTitle")}</Text>
              <Text style={[type.body(12), { color: color.mute, marginTop: 2 }]}>{t("home.today.deeperBody")}</Text>
            </View>
            <Text style={s.chev}>›</Text>
          </Pressable>
        ) : null}

        {due > 0 && !quiet ? (
          <Pressable testID="review-card" accessibilityRole="button" accessibilityLabel={t("home.today.reviewA11y", { count: due })} onPress={() => router.push("/review")} style={({ pressed }) => [s.lite, { marginTop: 0 }, pressed && { opacity: 0.85 }]}>
            <Sun size={30} />
            <View style={{ flex: 1 }}>
              <Text style={type.eyebrow(8)}>{t("home.today.reviewDue", { count: due })}</Text>
              <Text style={{ fontFamily: font.display[800], fontSize: 15, marginTop: 2, color: color.ink }}>{t("home.today.reviewTitle")}</Text>
            </View>
            <Text style={s.chev}>›</Text>
          </Pressable>
        ) : null}

        {yest && !doneHere ? (
          <View style={[s.lite, { marginTop: 0, flexDirection: "column", alignItems: "stretch", gap: 0 }]}>
            <Text style={type.eyebrow(8)}>{derived.missedDays > 0 ? t("home.today.carryLast") : t("home.today.carryYesterday")}</Text>
            <Text style={{ fontFamily: font.display[800], fontSize: 15, marginTop: 4, color: color.ink }}>{yest.carry || t("home.today.carryFallback")}</Text>
            {carried === null ? (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <Pressable accessibilityRole="button" onPress={() => setCarried(true)} style={[s.yn, { backgroundColor: color.gold }]}><Text style={s.ynText}>{t("home.today.didIt")}</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => setCarried(false)} style={s.yn}><Text style={s.ynText}>{t("home.today.notYet")}</Text></Pressable>
              </View>
            ) : <Text style={[type.body(13), { marginTop: 8, color: color.mute }]}>{carried ? t("home.today.didItReply") : t("home.today.notYetReply")}</Text>}
          </View>
        ) : null}

        {/* the companion: one short note and a "talk" link; "how are you today?" waits until after the lesson */}
        {quiet ? null : <CompanionNote day={companion} afterLesson={doneHere} />}
        {quiet ? null : <ReflectCard />}

        {/* a season quest for their own door (or a visit or a taste they chose): an offer from 7 days out, then the path */}
        {seasons.card && (seasons.card.kind === "progress" || !quiet) ? (
          <QuestTodayCard card={seasons.card} mode={seasons.mode}
            onJoin={() => { setQuest(seasons.card!.season.id, { joined: today }); track("quest_joined", { days: seasons.card!.season.length }); }}
            onDecline={() => setQuest(seasons.card!.season.id, { declined: today })} />
        ) : null}

        {/* the tradition's new year: "your year on the hill", for a week */}
        {newYear && derived.showedUp >= 3 && st.yearSeen !== newYearKey && !quiet ? (
          <View testID="year-offer" style={[s.lite, { marginTop: 0 }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={t("home.today.yearA11y")} onPress={() => { update({ yearSeen: newYearKey }); router.push("/year"); }} style={({ pressed }) => ({ flex: 1, flexDirection: "row", gap: 12, alignItems: "center", opacity: pressed ? 0.8 : 1 })}>
              <Sun size={36} mood="happy" />
              <View style={{ flex: 1 }}>
                <Text style={[type.eyebrow(8), { color: color.ink }]}>{t("home.today.yearEyebrow", { name: newYear.name })}</Text>
                <Text style={{ fontFamily: font.display[800], fontSize: 15, color: color.ink, marginTop: 3 }}>{t("home.today.yearTitle")}</Text>
                <Text style={[type.body(12), { color: color.mute, marginTop: 2 }]}>{t("home.today.yearBody")}</Text>
              </View>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t("home.dismiss")} onPress={() => update({ yearSeen: newYearKey })} hitSlop={10}><Text style={type.eyebrow(12)}>✕</Text></Pressable>
          </View>
        ) : null}

        {(() => {
          const seen = st.unlocksSeen || [];
          const card = derived.showedUp >= 7 && !seen.includes("together") ? { key: "together", title: derived.showedUp < 14 ? t("home.today.unlockWeek") : t("home.today.unlockDays", { n: derived.showedUp }), body: t("home.today.unlockTogetherBody"), to: "/together" }
            : derived.showedUp >= 3 && !seen.includes("guide") ? { key: "guide", title: t("home.today.unlockGuide", { n: derived.showedUp }), body: t("home.today.unlockGuideBody"), to: "/guide" } : null;
          if (!card) return null;
          const open = () => { track("unlock_seen", { unlock: card.key }); update({ unlocksSeen: [...seen, card.key] }); router.push(card.to as any); };
          // The card and its ✕ are siblings: a pressable card containing the ✕ nested a <button> in a <button> on web
          // (invalid HTML; in dev its error toast covered the done screen's continue button).
          return (
            <View style={[s.lite, { marginTop: 0 }]}>
              <Pressable accessibilityRole="button" accessibilityLabel={card.title} onPress={open} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.8 : 1 })}>
                <Text style={[type.eyebrow(9), { color: color.ink }]}>{t("home.today.newForYou")}</Text>
                <Text style={{ fontFamily: font.display[800], fontSize: 15, color: color.ink, marginTop: 4 }}>{card.title}</Text>
                <Text style={[type.body(12), { color: color.mute, marginTop: 2 }]}>{card.body}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={t("home.dismiss")} onPress={() => update({ unlocksSeen: [...seen, card.key] })} hitSlop={10}><Text style={type.eyebrow(12)}>✕</Text></Pressable>
            </View>
          );
        })()}

        {/* friends, at a glance (from what's already on the phone; Together has the full list, cheers and the board) */}
        {friends.friends.length > 0 && !quiet ? (
          <Pressable testID="today-friends" accessibilityRole="link" accessibilityLabel={t("home.today.friendsA11y")} onPress={() => router.push("/together")} style={({ pressed }) => [s.lite, { marginTop: 0, flexDirection: "column", alignItems: "stretch", gap: 6 }, pressed && { opacity: 0.85 }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={type.eyebrow(8)}>{t("home.today.friendsEyebrow")}</Text>
              <Text style={s.chev}>›</Text>
            </View>
            {friends.friends.filter((x) => !x.faded).slice(0, 3).map((x) => (
              <View key={x.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={s.initial}><Text style={{ fontFamily: font.display[800], fontSize: 13, color: color.ink }}>{(x.nick[0] || "·").toUpperCase()}</Text></View>
                <Text numberOfLines={1} style={[type.body(13), { flex: 1, color: color.ink }]}>
                  <Text style={{ fontFamily: font.display[800] }}>{x.nick}</Text> · {x.doneToday ? t("home.friends.doneToday") : t("home.friends.notYetToday")}
                </Text>
                <Text style={[type.caption(12)]}>{togetherWords(x.together)}</Text>
              </View>
            ))}
          </Pressable>
        ) : null}

        <View style={{ marginTop: 4 }}>
          <HillScene hour={hour} done={doneHere ? p.lesson : p.lesson - 1} total={p.of} doneToday={doneHere} firstLesson={base0 + 1}
            onReplay={(n) => router.push({ pathname: "/session/[door]/[day]", params: { door: wing, day: String(n) } })}
            words={Array.from({ length: p.of }, (_, i) => native(titleFor(i + 1).word, wing) || "")} onStart={start} wing={wing} label={t("home.today.hillLabel", { door: doorLabel(wing), n: lesson, title })} />
        </View>

        <View style={{ paddingHorizontal: 18, gap: 12, marginTop: 12 }}>
          <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: "/trail", params: { door: wing } })} style={s.pill}>
            <Text style={type.eyebrow(8)}>{t("home.today.wholeTrail")}</Text>
            <Text style={[type.eyebrow(8), { color: color.mute }]}>›</Text>
          </Pressable>

          <SongCard />

          {/* Other traditions, handled gently (owner, 2026-09-28): someone who chose their door and wants to stay there
              sees nothing about other religions here. Only people who said they love those connections, or are
              walking their own path, get ONE quiet card — and it opens a short taste, never a switch of course.
              Someone unsure where they stand gets one soft line, never a push. */}
          {(() => {
            const pr = st.profile;
            const ownPath = st.homeWing === "SPIRITUAL";
            const unsure = !ownPath && !!pr && (pr.answers?.hold === "figuring" || pr.answers?.why === "god");
            if (ownPath || pr?.openness === "love") {
              const others = DOORS.map(([, x]) => x).filter((x) => x !== st.homeWing && x !== "SPIRITUAL");
              const w = others[(derived.showedUp + new Date().getDate()) % others.length];
              const d1 = data.DAY1[w] || {};
              return (
                <Pressable accessibilityRole="button" accessibilityLabel={t("home.today.tasteA11y", { door: doorLabel(w), word: d1.word })} onPress={() => router.push({ pathname: "/taste", params: { door: w } })} style={[s.lite, { marginHorizontal: 0, marginTop: 0, marginBottom: 0 }]}>
                  <Guy pose="wonder" h={56} />
                  <View style={{ flex: 1 }}>
                    <Text style={type.eyebrow(8)}>{ownPath ? t("home.today.tastePicked") : t("home.today.tasteNextDoor")}</Text>
                    <Text style={{ fontFamily: font.display[800], fontSize: 15, marginTop: 3, color: color.ink }}>{d1.word}: <Text style={{ fontFamily: font.display[500] }}>{String(d1.carry || "").replace(/[.!]$/, "")}</Text></Text>
                    <Text style={[type.body(12), { color: color.mute, marginTop: 2 }]}>{t("home.today.tasteBody")}</Text>
                  </View>
                  <Text style={s.chev}>›</Text>
                </Pressable>
              );
            }
            if (unsure) {
              return (
                <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: "/trail", params: { door: "SPIRITUAL" } })}>
                  <Text style={[type.caption(), { paddingVertical: 12 }]}>{t("home.today.unsure")}</Text>
                </Pressable>
              );
            }
            return null;
          })()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  head: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  switch: { flexDirection: "row", backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.line, borderRadius: 999, padding: 3, gap: 2 },
  switchItem: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingVertical: 4, paddingLeft: 4, paddingRight: 10 },
  count: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.ink, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
  startPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.line, borderRadius: 999, paddingVertical: 6, paddingLeft: 8, paddingRight: 12 },
  // the secondary cards: white, a hairline border, no heavy ink
  lite: { marginHorizontal: 18, marginTop: 12, marginBottom: 12, backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.line, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  chev: { fontFamily: font.display[800], fontSize: 18, color: color.ink },
  initial: { width: 26, height: 26, borderRadius: 13, backgroundColor: color.gold, borderWidth: 1, borderColor: color.ink, alignItems: "center", justifyContent: "center" },
  yn: { flex: 1, alignItems: "center", backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.ink, borderRadius: 999, paddingVertical: 8 },
  ynText: { fontFamily: font.text[700], fontSize: 13, color: color.ink },
  pill: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, minHeight: 44, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.line },
});
