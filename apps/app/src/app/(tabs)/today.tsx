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

export default function Today() {
  useTitle("today");
  const { saved, derived, door, lessonFor, update, markWelcomedBack, demoShiftDays, today } = useStore();
  const st = saved.settings;
  const wing = door;
  const ic = icon(wing);
  const lesson = lessonFor(wing);
  const doneHere = derived.paths[wing]?.done === true;
  const p = pos(lesson);
  const base0 = data.CAMPS.slice(0, data.CAMPS.findIndex((c: any[]) => c[0] === p.camp)).reduce((s: number, c: any[]) => s + c[2], 0);
  const titleFor = (n: number) => lessonInfo(wing, base0 + n) || {};
  const t = titleFor(p.lesson);
  const title = t.title || `${p.name.toLowerCase()} · lesson ${p.lesson}`;
  const hour = new Date().getHours();
  const night = hour < 5 || hour >= 19;
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
  useEffect(() => {
    if (hillTop !== null && nowY !== null) scroller.current?.scrollTo({ y: Math.max(0, hillTop + nowY - 320), animated: false });
  }, [hillTop, nowY, wing]);
  const start = () => router.push({ pathname: "/session/[door]/[day]", params: { door: wing, day: String(lesson) } });
  const doors: [string, "home" | "visit"][] | null = st.visitWing ? [[st.homeWing, "home"], [st.visitWing, "visit"]] : null;
  const lastNext = st.signals.at(-1)?.next;

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
        <Pressable testID="day-count" accessibilityRole="button" accessibilityLabel={`${derived.showedUp} ${derived.showedUp === 1 ? "day" : "days"} shown up. Open you.`} onPress={() => router.push("/you")} style={({ pressed }) => ({ paddingVertical: 7, marginVertical: -7, opacity: pressed ? 0.6 : 1 })}>
          <View style={s.count}><Sun size={16} /><Text style={{ fontFamily: font.display[800], fontSize: 14, color: color.ink }}>{derived.showedUp}</Text></View>
        </Pressable>
      </View>

      <ScrollView ref={scroller} contentContainerStyle={{ paddingBottom: 110 }}>
        {derived.welcomeBack ? (
          <Card style={{ marginHorizontal: 18, marginTop: 4, flexDirection: "row", gap: 12, alignItems: "center" }}>
            <Guy pose="wave" h={70} />
            <View style={{ flex: 1 }}>
              <Text style={type.h1(20)}>your days came with you.</Text>
              <Text style={[type.body(13), { color: color.mute, marginTop: 4 }]}>{derived.showedUp} {derived.showedUp === 1 ? "day" : "days"}, right where you left them. nothing moved. one breath tonight?</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={markWelcomedBack} hitSlop={10}><Text style={type.eyebrow()}>✕</Text></Pressable>
          </Card>
        ) : null}

        {(() => {
          const seen = st.unlocksSeen || [];
          const card = derived.showedUp >= 7 && !seen.includes("together") ? { key: "together", title: "a week in. meet who's walking with you.", body: "the founding class and the keepers are in together.", to: "/together" }
            : derived.showedUp >= 3 && !seen.includes("guide") ? { key: "guide", title: `${derived.showedUp} words in. the guide is worth asking now.`, body: "ask about any word you've learned — it answers from your lessons.", to: "/guide" } : null;
          if (!card) return null;
          const open = () => { track("unlock_seen", { unlock: card.key }); update({ unlocksSeen: [...seen, card.key] }); router.push(card.to as any); };
          return (
            <Card style={{ marginHorizontal: 18, marginBottom: 12, flexDirection: "row", gap: 12, alignItems: "center" }} onPress={open} label={card.title}>
              <View style={{ flex: 1 }}>
                <Text style={[type.eyebrow(9), { color: color.ink }]}>new for you</Text>
                <Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink, marginTop: 4 }}>{card.title}</Text>
                <Text style={[type.body(12), { color: color.mute, marginTop: 2 }]}>{card.body}</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={() => update({ unlocksSeen: [...seen, card.key] })} hitSlop={10}><Text style={type.eyebrow(12)}>✕</Text></Pressable>
            </Card>
          );
        })()}

        <View style={s.campCard}>
          <View style={{ flex: 1 }}>
            <Text style={[type.eyebrow(8), { color: color.gold }]}>{p.camp} · {p.name}</Text>
            <Text style={{ fontFamily: font.display[800], fontSize: 18, marginTop: 4, color: "#fff" }}>{title}</Text>
            {derived.goal ? <Text style={[type.eyebrow(8), { color: "#ffffff99", marginTop: 6 }]}>your goal · {derived.goal.done} of {derived.goal.days} days shown up{derived.goal.reached ? " · reached" : ""}</Text> : null}
          </View>
          <Text style={[type.eyebrow(8), { color: "#ffffff99" }]}>lesson {p.lesson} of {p.of}</Text>
        </View>

        {due > 0 ? (
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
              <Text style={[type.body(12), { color: "#ffffff99", marginTop: 6, paddingRight: 96 }]}>{night ? "sleep on it. see you at sundown." : "that's it for today. see you at sundown."}</Text>
              <View style={{ position: "absolute", right: 8, bottom: night ? 46 : -8 }}><Guy pose={night ? "sleep" : "thumbs"} h={night ? 78 : 112} /></View>
              {isDemo() ? <View style={{ marginTop: 12 }}><Btn kind="light" onPress={() => demoShiftDays(1)}>Demo: skip to tomorrow →</Btn></View> : null}
            </Card>
          ) : null /* the floating "start day N" button above the tab bar is the one start action */}

          <Pressable accessibilityRole="link" onPress={() => router.push("/together")} style={s.pill}>
            <Text style={type.eyebrow(8)}>sundown 7:00 · the bell</Text>
            <Text style={[type.eyebrow(8), { color: color.mute }]}>together ›</Text>
          </Pressable>

          {lastNext === "home" ? (
            <Pressable accessibilityRole="button" onPress={() => {
              const others = DOORS.map(([, x]) => x).filter((x) => x !== st.homeWing && x !== st.visitWing);
              update({ visitWing: others[derived.showedUp % others.length], active: "visit" });
            }}>
              <Text style={[type.caption(), { paddingVertical: 12 }]}>walking your door. a door nearby whenever you want one ›</Text>
            </Pressable>
          ) : (
            <View style={{ marginTop: 6 }}>
              <Text style={type.eyebrow()}>{st.reason ? "this week's visits · for you" : "your path · visit a door"}{st.book.length ? ` · ${st.book.length} in your book` : ""}</Text>
              <Text style={[type.body(13), { marginTop: 4, color: color.mute }]}>{st.homeWing === "SPIRITUAL" ? "build your own path through the house. one door at a time, each one taught properly." : "a friend's door, a partner's, your mother-in-law's. one session, taught properly. it counts."}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10, paddingBottom: 4 }}>
                {(() => {
                  const order: string[] = (data.MOMENTS.find(([id]: [string]) => id === st.reason) || [])[2] || [];
                  const rank = (w: string) => (order.indexOf(w) === -1 ? 99 : order.indexOf(w));
                  return DOORS.filter(([, w]) => w !== st.homeWing).sort((a, b) => rank(a[1]) - rank(b[1]));
                })().map(([l, w]) => {
                  const d1 = lessonInfo(w, lessonFor(w)) || data.DAY1[w] || {}; // the lesson it will actually open
                  return (
                    <Pressable key={w} accessibilityRole="button" accessibilityLabel={`Visit ${l}: ${d1.word}`} onPress={() => { update({ visitWing: w, active: "visit" }); router.push({ pathname: "/session/[door]/[day]", params: { door: w, day: String(lessonFor(w)) } }); }} style={s.visit}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Face ic={icon(w)} w={22} h={22} r={11} caption={false} /><Text style={type.eyebrow(7)}>{l}</Text></View>
                      <Text style={{ fontFamily: font.display[800], fontSize: 16, marginTop: 8, color: color.ink }}>{d1.word || "a first word"}</Text>
                      <Text style={[type.eyebrow(7), { marginTop: 4, color: color.mute }]}>one breath</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* The one thing to do today, always in view above the tab bar (approved journey 2026-09-25) */}
      {/* when today is done, the "today · done" card below already says so */}
      <View pointerEvents="box-none" style={s.dock}>
        {doneHere ? null : (
          <Btn testID="top-start" kind="gold" onPress={start} label={`Start day ${lesson}: ${title}`} style={s.dockBtn}>{`start day ${lesson} · about 3 min`}</Btn>
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
  pill: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 44, paddingVertical: 0, paddingHorizontal: 14, borderRadius: 999, backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.ink },
  dock: { position: "absolute", left: 16, right: 16, bottom: 12 },
  dockBtn: { borderWidth: 2, borderColor: color.ink, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  dockDone: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: color.ink, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  visit: { width: 150, backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.line, borderRadius: 18, paddingTop: 12, paddingHorizontal: 12, paddingBottom: 10 },
});
