import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
// Today: v175 PathHome as a real screen. The hill, today's lesson, review, yesterday's carry, visits.
import { DOORS, STRAND_WORDS, data, icon, label, lessonInfo, native, pos } from "@ih/content";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { isDemo } from "@/lib/flags";
import { useStore } from "@/lib/store";
import { voiceLabel } from "@/lib/voice";
import { Btn, Card, Face, Guy, Sun, color, font, type } from "@/ui";
import { HillScene } from "@/ui/hill";
import { TodaysThree } from "@/ui/todays-three";
import { SongCard } from "@/ui/song";
import { useCompanionDay } from "@/lib/companion/use-companion";
import { CompanionCard, HelpCard, ReflectCard } from "@/ui/companion";
import { StreakChip } from "@/ui/streak";
import { goalView, weekdayOf } from "@/lib/streak";
import { useSeasons } from "@/lib/quests";
import { newYearNow } from "@/content/seasons";
import { QuestTodayCard } from "@/ui/quest";

export default function Today() {
  useTitle("today");
  const { saved, derived, door, lessonFor, update, markWelcomedBack, demoShiftDays, today, setQuest } = useStore();
  const seasons = useSeasons();
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
  const t = titleFor(p.lesson);
  const title = t.title || `${p.name.toLowerCase()} · lesson ${p.lesson}`;
  const hour = new Date().getHours();
  const night = hour < 6 || hour >= 20; // same bedtime as the hill
  const strand = STRAND_WORDS(wing, lesson);
  const due = st.reviewedOn === today ? 0 : Math.min(3, strand.length); // reviewed today: rests till tomorrow
  const yest = lesson > 1 ? lessonInfo(wing, lesson - 1) || {} : null;
  const carried = st.carried && st.carried.lesson === lesson - 1 ? st.carried.did : null; // saved, so reload keeps it
  const setCarried = (did: boolean) => update({ carried: { date: today, lesson: lesson - 1, did } });
  // v175 scrolled the hill so your stone sits mid-screen; same here once the hill has laid out.
  // a return visit: the first open of a new date after at least one earlier day
  useEffect(() => { if (derived.showedUp > 0 && !derived.doneToday) track("day_returned", { days: derived.showedUp, missed: derived.missedDays }); }, [today]); // eslint-disable-line react-hooks/exhaustive-deps
  const scroller = useRef<ScrollView>(null);
  const [hillTop, setHillTop] = useState<number | null>(null);
  const [nowY, setNowY] = useState<number | null>(null);
  // ...except when the companion comes first: a quiet day, or today's "how are you?" not yet answered
  const { input: companionIn, day: companion } = useCompanionDay();
  const quiet = companion.quiet;
  // ...or when the streak can be earned back today: that offer sits at the top and must not scroll away
  const companionFirst = useRef(quiet || !companionIn.memory.moods.some((x) => x.date === today) || (st.streakOn !== false && !!derived.streak.earnBack)).current;
  useEffect(() => {
    if (hillTop !== null && nowY !== null && !companionFirst) scroller.current?.scrollTo({ y: Math.max(0, hillTop + nowY - 320), animated: false });
  }, [hillTop, nowY, wing]);
  const start = () => router.push({ pathname: "/session/[door]/[day]", params: { door: wing, day: String(lesson) } });
  const doors: [string, "home" | "visit"][] | null = st.visitWing ? [[st.homeWing, "home"], [st.visitWing, "visit"]] : null;
  const lastNext = st.signals.at(-1)?.next;
  // the streak (the adult's own; a child's days never count here). "show my streak" off hides all of it.
  const streakOn = st.streakOn !== false;
  const sk = derived.streak;
  const golden = sk.golden && sk.streak >= 7;
  const goal = goalView(st.goal, sk);
  // the companion (above): today's practice, mood and note. On a quiet day the games step back and the practice comes first.

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: color.cream }}>
      <View style={s.head}>
        {doors ? (
          <View style={s.switch} accessibilityRole="tablist">
            {doors.map(([w, kind]) => (
              <Pressable key={kind} accessibilityRole="tab" accessibilityState={{ selected: st.active === kind }} aria-selected={st.active === kind} accessibilityLabel={`${kind === "home" ? "your door" : "visiting"}: ${label(w)}`} onPress={() => update({ active: kind })}
                style={[s.switchItem, st.active === kind && { backgroundColor: color.ink }]}>
                <Face ic={icon(w)} w={22} h={22} r={11} caption={false} />
                <Text style={[type.eyebrow(7), { color: st.active === kind ? color.gold : color.ink }]}>{label(w)}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Face ic={ic} w={30} h={30} r={15} caption={false} /><Text style={type.eyebrow(8)}>{label(wing)}</Text></View>
        )}
        {streakOn ? (
          // the streak leads: the number, then the sun (our flame). Gold once it's a golden streak (7+ days, no rest day).
          <Pressable testID="day-count" accessibilityRole="button" accessibilityLabel={`${sk.streak}-day streak${golden ? ", golden" : ""}. Open you.`} onPress={() => router.push("/you")} style={({ pressed }) => ({ paddingVertical: 7, marginVertical: -7, opacity: pressed ? 0.6 : 1 })}>
            <StreakChip n={sk.streak} golden={golden} />
          </Pressable>
        ) : (
          <Pressable testID="day-count" accessibilityRole="button" accessibilityLabel={`${derived.showedUp} ${derived.showedUp === 1 ? "day" : "days"} on the hill. Open you.`} onPress={() => router.push("/you")} style={({ pressed }) => ({ paddingVertical: 7, marginVertical: -7, opacity: pressed ? 0.6 : 1 })}>
            <View style={s.count}><Sun size={16} /><Text style={{ fontFamily: font.display[800], fontSize: 14, color: color.ink }}>{derived.showedUp}</Text></View>
          </Pressable>
        )}
      </View>

      <ScrollView ref={scroller} contentContainerStyle={{ paddingBottom: 110 }}>
        {derived.welcomeBack ? (
          <Card style={{ marginHorizontal: 18, marginTop: 4, flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Guy pose="wave" h={70} />
            <View style={{ flex: 1 }}>
              <Text style={type.h1(20)}>{streakOn && sk.streak > 0 ? "rest days had your back." : "your days came with you."}</Text>
              <Text style={[type.body(13), { color: color.mute, marginTop: 4 }]}>{streakOn && sk.streak > 0
                ? `your ${sk.streak}-day streak is still here. one lesson today grows it.`
                : `${derived.showedUp} ${derived.showedUp === 1 ? "day" : "days"} on the hill, right where you left them. one breath tonight?`}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={markWelcomedBack} hitSlop={10}><Text style={type.eyebrow()}>✕</Text></Pressable>
          </Card>
        ) : null}

        {streakOn && sk.earnBack && !quiet ? (
          // the streak broke: for 3 days, two lessons in one day bring it back. An offer, never a bill.
          <Card testID="earn-back" style={{ marginHorizontal: 18, marginTop: 4, marginBottom: 12, flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Guy pose="climb" h={74} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[type.eyebrow(8), { color: color.ink }]}>earn your streak back · {sk.earnBack.lessonsToday} of {sk.earnBack.need} today</Text>
              <Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink }}>finish 2 lessons today and your {sk.earnBack.lost}-day streak comes back.</Text>
              <Text style={[type.body(12), { color: color.mute }]}>{sk.earnBack.lastDay === today ? "open till tonight." : `open till ${weekdayOf(sk.earnBack.lastDay)}.`} no catch.</Text>
              <Btn testID="earn-back-go" kind="gold" style={{ marginTop: 6, alignSelf: "flex-start", paddingHorizontal: 16 }}
                onPress={doneHere ? () => router.push({ pathname: "/session/[door]/[day]", params: { door: wing, day: String(lesson) } }) : start}>{doneHere ? "one more lesson" : `start day ${lesson}`}</Btn>
            </View>
          </Card>
        ) : null}

        {/* a season quest for their own door (or a visit or a taste they chose): an offer from 7 days out, then the path */}
        {seasons.card && (seasons.card.kind === "progress" || !quiet) ? (
          <QuestTodayCard card={seasons.card} mode={seasons.mode}
            onJoin={() => { setQuest(seasons.card!.season.id, { joined: today }); track("quest_joined", { days: seasons.card!.season.length }); }}
            onDecline={() => setQuest(seasons.card!.season.id, { declined: today })} />
        ) : null}

        {/* the tradition's new year: "your year on the hill", for a week */}
        {newYear && derived.showedUp >= 3 && st.yearSeen !== newYearKey && !quiet ? (
          <Card testID="year-offer" style={{ marginHorizontal: 18, marginBottom: 12, flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Pressable accessibilityRole="button" accessibilityLabel="see your year on the hill" onPress={() => { update({ yearSeen: newYearKey }); router.push("/year"); }} style={({ pressed }) => ({ flex: 1, flexDirection: "row", gap: 12, alignItems: "center", opacity: pressed ? 0.8 : 1 })}>
              <Sun size={40} mood="happy" />
              <View style={{ flex: 1 }}>
                <Text style={[type.eyebrow(8), { color: color.ink }]}>{newYear.name} · a new year</Text>
                <Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink, marginTop: 3 }}>your year on the hill is ready.</Text>
                <Text style={[type.body(12), { color: color.mute, marginTop: 2 }]}>days, words, hours learned. a minute to look back.</Text>
              </View>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={() => update({ yearSeen: newYearKey })} hitSlop={10}><Text style={type.eyebrow(12)}>✕</Text></Pressable>
          </Card>
        ) : null}

        {(() => {
          const seen = st.unlocksSeen || [];
          const card = derived.showedUp >= 7 && !seen.includes("together") ? { key: "together", title: `${derived.showedUp < 14 ? "a week in" : `${derived.showedUp} days in`}. walk with someone.`, body: "light your lantern and send it to one friend.", to: "/together" }
            : derived.showedUp >= 3 && !seen.includes("guide") ? { key: "guide", title: `${derived.showedUp} days in. the guide is worth asking now.`, body: "ask about any word you've learned — it answers from your lessons.", to: "/guide" } : null;
          if (!card) return null;
          const open = () => { track("unlock_seen", { unlock: card.key }); update({ unlocksSeen: [...seen, card.key] }); router.push(card.to as any); };
          // The card and its ✕ are siblings: a pressable card containing the ✕ nested a <button> in a <button> on web
          // (invalid HTML; in dev its error toast covered the done screen's continue button).
          return (
            <Card style={{ marginHorizontal: 18, marginBottom: 12, flexDirection: "row", gap: 12, alignItems: "center" }}>
              <Pressable accessibilityRole="button" accessibilityLabel={card.title} onPress={open} style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.8 : 1 })}>
                <Text style={[type.eyebrow(9), { color: color.ink }]}>new for you</Text>
                <Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink, marginTop: 4 }}>{card.title}</Text>
                <Text style={[type.body(12), { color: color.mute, marginTop: 2 }]}>{card.body}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={() => update({ unlocksSeen: [...seen, card.key] })} hitSlop={10}><Text style={type.eyebrow(12)}>✕</Text></Pressable>
            </Card>
          );
        })()}

        {companion.help ? <HelpCard /> : null}
        {quiet ? <CompanionCard day={companion} /> : null}
        {quiet ? <ReflectCard /> : null}

        <View style={s.campCard}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={[type.eyebrow(8), { color: color.gold }]}>{p.camp} · {p.name}</Text>
            <Text style={{ fontFamily: font.display[800], fontSize: 18, marginTop: 4, color: "#fff" }}>{title}</Text>
            {goal && streakOn ? <Text style={[type.eyebrow(8), { color: "#ffffff99", marginTop: 6 }]}>your goal · {goal.done} of {goal.days} days in a row{goal.reached ? " · reached" : ""}</Text> : null}
          </View>
          <Text style={[type.eyebrow(8), { color: "#ffffff99" }]}>lesson {p.lesson} of {p.of}</Text>
        </View>

        {quiet ? null : <TodaysThree />}
        {quiet ? null : <CompanionCard day={companion} />}
        {quiet ? null : <ReflectCard />}
        {due > 0 && !quiet ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`Review ${due} ${due === 1 ? "word" : "words"}`} onPress={() => router.push("/review")} style={s.inkCard}>
            <Sun size={34} />
            <View style={{ flex: 1 }}>
              <Text style={type.eyebrow(8)}>review · {due} {due === 1 ? "word" : "words"} due</Text>
              <Text style={{ fontFamily: font.display[800], fontSize: 16, marginTop: 2, color: color.ink }}>keep your strand. ninety seconds.</Text>
            </View>
            <Text style={{ fontFamily: font.display[800], fontSize: 22 }}>›</Text>
          </Pressable>
        ) : null}

        {yest && !doneHere ? (
          <View style={[s.inkCard, { flexDirection: "column", alignItems: "stretch" }]}>
            <Text style={type.eyebrow(8)}>{derived.missedDays > 0 ? "last time’s carry" : "yesterday’s carry"}</Text>
            <Text style={{ fontFamily: font.display[800], fontSize: 16, marginTop: 4, color: color.ink }}>{yest.carry || "the line you took with you"}</Text>
            {carried === null ? (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                <Pressable accessibilityRole="button" onPress={() => setCarried(true)} style={[s.yn, { backgroundColor: color.gold }]}><Text style={s.ynText}>did it</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => setCarried(false)} style={s.yn}><Text style={s.ynText}>not yet</Text></Pressable>
              </View>
            ) : <Text style={[type.body(13), { marginTop: 8, color: color.mute }]}>{carried ? "that's the whole point. it's in you now." : "no rush. it keeps."}</Text>}
          </View>
        ) : null}

        <View style={{ marginTop: 12 }} onLayout={(e) => setHillTop(e.nativeEvent.layout.y)}>
          <HillScene onNow={setNowY} hour={hour} done={doneHere ? p.lesson : p.lesson - 1} total={p.of} doneToday={doneHere} firstLesson={base0 + 1}
            onReplay={(n) => router.push({ pathname: "/session/[door]/[day]", params: { door: wing, day: String(n) } })}
            words={Array.from({ length: p.of }, (_, i) => native(titleFor(i + 1).word, wing) || "")} onStart={start} wing={wing} label={`${label(wing)}, day ${lesson}: ${title}`} />
        </View>

        <View style={{ paddingHorizontal: 18, gap: 12 }}>
          {doneHere ? (
            <Card dark style={{ padding: 18, overflow: "hidden" }}>
              <Text style={[type.eyebrow(), { color: color.gold }]}>today · done</Text>
              <Text style={{ fontFamily: font.display[500], fontSize: 18, marginTop: 6, paddingRight: 96, color: "#fff" }}>carry: {t.carry || (data.DAY1[wing] || data.DAY1.SPIRITUAL).carry}</Text>
              <Text style={[type.body(12), { color: "#ffffff99", marginTop: 6, paddingRight: 96 }]}>{night ? "sleep on it. see you tomorrow." : hour >= 19 ? "that's it for today. see you tomorrow." : "that's it for today. see you at sundown."}</Text>
              <View style={{ position: "absolute", right: 8, bottom: night ? 46 : 4 }}><Guy pose={night ? "sleep" : "thumbs"} h={night ? 78 : 104} /></View>
              {isDemo() ? <View style={{ marginTop: 12 }}><Btn kind="light" onPress={() => demoShiftDays(1)}>Demo: skip to tomorrow →</Btn></View> : null}
            </Card>
          ) : streakOn && sk.streak >= 2 && !quiet ? (
            // the streak, said gently. It's only "at stake" when no rest day is left, and louder only as the day ends.
            (() => {
              const loud = sk.atRisk && hour >= 17;
              const right = sk.atRisk ? (hour >= 17 ? "one lesson keeps it going" : "no rest days left · one lesson keeps it")
                : sk.restedYesterday ? "a rest day held it yesterday"
                : `rest days protect your streak · ${sk.rest} banked`;
              return (
                <View testID="streak-pill" style={[s.pill, { borderColor: loud ? color.gold : color.line, backgroundColor: loud ? color.ink : "transparent" }]} accessibilityRole="text">
                  <Text numberOfLines={1} style={[type.eyebrow(8), { color: loud ? color.gold : color.ink, flexShrink: 0 }]}>{sk.streak}-day streak</Text>
                  <Text numberOfLines={1} style={[type.eyebrow(8), { color: loud ? "#fff" : color.mute, flexShrink: 1, textAlign: "right" }]}>{right}</Text>
                </View>
              );
            })()
          ) : null /* the floating "start day N" button above the tab bar is the one start action */}

          {doneHere && st.deepOn !== today && lesson > 1 && !quiet ? (
            <Pressable accessibilityRole="button" accessibilityLabel="go deeper: a harder extra round, two levels up" onPress={() => router.push({ pathname: "/session/[door]/[day]", params: { door: wing, day: String(lesson), deep: "1" } })}
              style={[s.inkCard, { marginHorizontal: 0, marginTop: 0, backgroundColor: color.ink }]}>
              <Guy pose="stride" h={64} />
              <View style={{ flex: 1 }}>
                <Text style={[type.eyebrow(8), { color: color.gold }]}>go deeper · optional</Text>
                <Text style={{ fontFamily: font.display[800], fontSize: 16, marginTop: 3, color: "#fff" }}>two levels up. type it, beat the clock.</Text>
                <Text style={[type.body(12), { color: "#ffffff99", marginTop: 2 }]}>about 3 minutes · extra light</Text>
              </View>
              <Text style={{ color: color.gold, fontSize: 20 }}>›</Text>
            </Pressable>
          ) : null}

          <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: "/trail", params: { door: wing } })} style={s.pill}>
            <Text style={type.eyebrow(8)}>see the whole trail · what's at the top</Text>
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
                <Pressable accessibilityRole="button" accessibilityLabel={`a taste from next door: ${label(w)}, ${d1.word}`} onPress={() => router.push({ pathname: "/taste", params: { door: w } })} style={[s.inkCard, { marginHorizontal: 0, marginTop: 0 }]}>
                  <Guy pose="wonder" h={60} />
                  <View style={{ flex: 1 }}>
                    <Text style={type.eyebrow(8)}>{ownPath ? "picked for you · from around the house" : "a taste from next door"}</Text>
                    <Text style={{ fontFamily: font.display[800], fontSize: 16, marginTop: 3, color: color.ink }}>{d1.word}: <Text style={{ fontFamily: font.display[500] }}>{String(d1.carry || "").replace(/[.!]$/, "")}</Text></Text>
                    <Text style={[type.body(12), { color: color.mute, marginTop: 2 }]}>a one-minute look · your path stays yours</Text>
                  </View>
                  <Text style={{ fontFamily: font.display[800], fontSize: 20 }}>›</Text>
                </Pressable>
              );
            }
            if (unsure) {
              return (
                <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: "/trail", params: { door: "SPIRITUAL" } })}>
                  <Text style={[type.caption(), { paddingVertical: 12 }]}>still working out where you stand? that's allowed. there's also a path built around you ›</Text>
                </Pressable>
              );
            }
            return null;
          })()}
        </View>
      </ScrollView>

      {/* The one thing to do today, always in view above the tab bar (approved journey 2026-09-25) */}
      {/* when today is done, the "today · done" card below already says so */}
      <View pointerEvents="box-none" style={s.dock}>
        {doneHere ? null : (
          <Btn testID="top-start" kind={quiet ? "light" : "gold"} onPress={start} label={`Start day ${lesson}: ${title}`} style={s.dockBtn}>{quiet ? `day ${lesson}, whenever you're ready` : `start day ${lesson} · about 5 min`}</Btn>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  head: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  switch: { flexDirection: "row", backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.line, borderRadius: 999, padding: 3, gap: 2 },
  switchItem: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 999, paddingVertical: 4, paddingLeft: 4, paddingRight: 10 },
  count: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.ink, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 12 },
  campCard: { marginHorizontal: 18, marginTop: 4, backgroundColor: color.ink, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  inkCard: { marginHorizontal: 18, marginTop: 12, backgroundColor: "#fff", borderWidth: 2, borderColor: color.ink, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  yn: { flex: 1, alignItems: "center", backgroundColor: "#fff", borderWidth: 2, borderColor: color.ink, borderRadius: 999, paddingVertical: 8 },
  ynText: { fontFamily: font.text[700], fontSize: 13, color: color.ink },
  pill: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, minHeight: 44, paddingVertical: 0, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.ink },
  dock: { position: "absolute", left: 16, right: 16, bottom: 12 },
  dockBtn: { borderWidth: 2, borderColor: color.ink, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  dockDone: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: color.ink, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  visit: { width: 150, backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.line, borderRadius: 18, paddingTop: 12, paddingHorizontal: 12, paddingBottom: 10 },
});
