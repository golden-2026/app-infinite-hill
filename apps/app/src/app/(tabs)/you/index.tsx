import { TabHeader } from "@/ui/tab-header";
import { useTitle } from "@/lib/title";
// You: v175's Me screen as a real tab. Profile, path, and every setting — each one does what it says.
import { DOORS, SUN_NOTES, data, icon, pos } from "@ih/content";
import { router } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth";
import { isDemo } from "@/lib/flags";
import { reminderStatus } from "@/lib/reminders";
import { useStore } from "@/lib/store";
import { useSync } from "@/lib/sync";
import { accountsOn } from "@/lib/supabase";
import { voiceLabel } from "@/lib/voice";
import { emptyProfile } from "@/lib/profile";
import { setLearnFact, useMemory } from "@/lib/companion/memory";
import { practiceModeOf } from "@/lib/onboard";
import { Btn, Card, Eyebrow, Guy, Sun, color, font, type, toast } from "@/ui";
import { Group, Row } from "@/ui/row";
import { hoursWords, minutesLearned } from "@/lib/year";
import { useSeasons } from "@/lib/quests";
import { campLabel, campName, doorLabel, isEs, setLang, t, useLang, type Key } from "@/i18n";
import { en as companionEn } from "@/i18n/strings/companion";

/**
 * "How the sun talks to you" in the app's language. The English comes from @ih/content (SUN_NOTES); each example is
 * swapped for its Spanish only while the English still reads as expected, so a changed note never shows a stale line.
 */
function sunNotes(notes: [string, string][], name: string, word: string): [string, string][] {
  if (!isEs()) return notes;
  const W: Record<string, Key> = { amen: "companion.sun.word.amen", grace: "companion.sun.word.grace", breathe: "companion.sun.word.breathe" };
  const same = (k: keyof typeof companionEn, m: string, vars: Record<string, string> = {}) => m === (companionEn[k] as string).replace(/\{(\w+)\}/g, (_x, v: string) => vars[v] ?? "");
  const WHEN: Record<string, Key> = { "sunset · 6:42 pm": "companion.sun.sunsetWhen", "9:10 pm · not done yet": "companion.sun.lateWhen", "day 7": "companion.sun.weekWhen", "missed yesterday": "companion.sun.missedWhen" };
  return notes.map(([when, m]) => {
    const w = WHEN[when] ? t(WHEN[when]) : when;
    if (same("companion.sun.golden", m, { name, word })) return [w, t("companion.sun.golden", { name, word: W[word] ? t(W[word]) : word })];
    for (const k of ["companion.sun.late", "companion.sun.missed"] as const) if (same(k, m)) return [w, t(k)];
    if (same("companion.sun.week", m, { name })) return [w, t("companion.sun.week", { name })];
    return [w, m];
  });
}

export default function You() {
  useTitle(t("companion.you.title"));
  const { saved, derived, lessonFor, startFor, update, demoShiftDays, today } = useStore();
  const { email } = useAuth();
  const sync = useSync();
  const st = saved.settings;
  const wing = st.homeWing;
  const ic = icon(wing);
  const day = lessonFor(wing);
  const memory = useMemory();
  const own = saved.sits.filter((x) => !x.kidId);
  const learned = { ...minutesLearned(own, st.timed), lessons: own.length };
  const { finished: badges } = useSeasons();
  const lang = useLang();
  const [changing, setChanging] = useState(false);
  const [adding, setAdding] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const share = async () => {
    const kept = st.book.at(-1)?.line;
    const text = t("companion.you.shareText", { count: derived.showedUp, door: doorLabel(wing), kept: kept ? ` · “${kept}”` : "" });
    try {
      const nav: any = typeof navigator !== "undefined" ? navigator : null;
      if (Platform.OS === "web" && !nav?.share) {
        await nav?.clipboard?.writeText(text);
        toast(t("companion.you.copied"));
      } else {
        await Share.share({ message: text });
      }
    } catch {
      setShareMsg(text);
    }
  };
  const DoorGrid = ({ exclude, onPick, current }: { exclude?: string; onPick: (w: string) => void; current?: string | null }) => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 14 }} accessibilityRole="radiogroup">
      {DOORS.filter(([, w]) => w !== exclude).map(([, w]) => { const l = doorLabel(w); return (
        <Pressable key={w} accessibilityRole="radio" accessibilityState={{ checked: current === w }} aria-checked={current === w} accessibilityLabel={l} onPress={() => onPick(w)}
          style={{ width: "48%", borderWidth: 1.5, borderColor: current === w ? color.ink : color.line, backgroundColor: current === w ? "#FFFBE0" : "#fff", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 }}>
          <Text style={{ fontFamily: font.display[500], fontSize: 15, color: color.ink }}>{l}</Text>
          <Text style={[type.eyebrow(7), { marginTop: 2 }]}>{t("common.readBy", { name: voiceLabel(w, icon(w).short).short })}</Text>
        </Pressable>
      ); })}
    </View>
  );
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: color.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
          <TabHeader eyebrow={t("companion.you.eyebrow")} title={t("companion.you.header")} pose="shades">
          <Text style={type.body()}>
            {doorLabel(wing)} · {t("common.day", { n: day })} · {t("common.readBy", { name: voiceLabel(wing, ic.short).short })}{st.visitWing ? t("companion.you.alsoWalking", { door: doorLabel(st.visitWing), day: t("common.day", { n: lessonFor(st.visitWing) }) }) : ""} · {t("common.daysOnHill", { count: derived.showedUp })}{st.streakOn !== false ? ` · ${t("common.streakDays", { n: derived.streak.streak })}${derived.streak.longest > derived.streak.streak ? t("companion.you.longest", { n: derived.streak.longest }) : ""}` : ""}
          </Text>
          {learned.lessons > 0 ? (
            <Text testID="hours-learned" style={[type.body(13), { color: color.ink }]}>
              {t("companion.you.learned", { hours: hoursWords(learned.minutes) })}<Text style={{ color: color.mute }}>{learned.estimatedLessons ? (learned.timedLessons ? t("companion.you.partlyEst") : t("companion.you.est")) : t("companion.you.timed")}</Text>
            </Text>
          ) : null}
          <Text style={[type.caption(), email ? { color: color.ink } : null]}>
            {email ? `${t("companion.you.savedTo", { email })}${sync.state === "offline" ? t("companion.you.offlineSync") : sync.state === "syncing" ? t("companion.you.syncing") : ""}` : t("companion.you.onPhone")}
          </Text>
          </TabHeader>
        </View>
        <View style={{ paddingHorizontal: 18, gap: 12 }}>
          {!email && accountsOn() ? (
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Sun size={40} />
              <View style={{ flex: 1 }}><Text style={type.serif(17)}>{t("companion.you.saveTitle")}</Text><Text style={[type.body(12), { color: color.mute }]}>{t("companion.you.saveBody")}</Text></View>
              <Btn style={{ paddingHorizontal: 14 }} onPress={() => router.push({ pathname: "/sign-in", params: { mode: "save", then: "/you" } })}>{t("companion.you.save")}</Btn>
            </Card>
          ) : null}

          <Card>
            <Eyebrow>{t("companion.you.pathEyebrow", { door: doorLabel(wing) })}</Eyebrow>
            <Text style={[type.serif(20), { marginTop: 4 }]}>{t("companion.you.dayCamp", { day, camp: campLabel(pos(day).camp), name: campName(pos(day).camp, pos(day).name).toLowerCase() })}</Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              {(() => { let acc = 0; return data.CAMPS.map(([c, n, len]: [string, string, number]) => { const start = acc; acc += len; const done = start + len < startFor(wing) ? new Set(own.filter((x) => x.door === wing && x.day > start && x.day <= start + len).map((x) => x.day)).size /* a camp placement skipped: only the days caught up on */ : Math.max(0, Math.min(len, day - 1 - start + (derived.paths[wing]?.done ? 1 : 0))); return (
                <View key={c} accessibilityLabel={t("companion.you.campA11y", { camp: campLabel(c), name: campName(c, n), done, len })}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ fontFamily: font.text[600], fontSize: 12 }}>{campLabel(c)} · {campName(c, n)}</Text><Text style={[type.body(12), { color: color.mute }]}>{done}/{len}</Text></View>
                  <View style={{ height: 6, backgroundColor: color.line, borderRadius: 3, marginTop: 4, overflow: "hidden" }}><View style={{ width: `${(done / len) * 100}%`, height: 6, backgroundColor: done === len ? color.green : color.gold }} /></View>
                </View>
              ); }); })()}
            </View>
            <Text style={{ fontFamily: font.display[500], fontSize: 16, color: "#6b6448", marginTop: 12 }}>{t("companion.you.quote")}<Text style={type.eyebrow(7)}>— Walt Whitman</Text></Text>
            <Text style={[type.body(12), { color: color.mute, marginTop: 12 }]}>{t("companion.you.yearOne")}</Text>
            <View style={{ marginTop: 12 }}><Btn kind="ghost" onPress={share}>{t("companion.you.shareDay")}</Btn>{shareMsg ? <Text accessibilityLiveRegion="polite" style={[type.body(12), { color: color.mute, marginTop: 6 }]}>{shareMsg}</Text> : null}</View>
          </Card>

          <Group title={t("companion.you.gPath")}>
            <Row a={t("companion.you.gPath")} b={t("companion.you.pathB", { door: doorLabel(wing), voice: voiceLabel(wing, ic.short).short })} onPress={() => setChanging(!changing)} right={changing ? t("common.close") : t("common.change")} />
            {changing ? <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}><DoorGrid current={wing} onPick={(w) => { update({ homeWing: w, visitWing: st.visitWing === w ? null : st.visitWing, active: "home" }); setChanging(false); }} /></View> : null}
            <Row a={t("companion.you.also")} b={st.visitWing ? `${doorLabel(st.visitWing)} · ${t("common.day", { n: lessonFor(st.visitWing) })}` : t("companion.you.alsoB")} onPress={() => setAdding(!adding)} right={adding ? t("common.close") : st.visitWing ? t("common.change") : t("common.add")} />
            {adding ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                <DoorGrid exclude={wing} current={st.visitWing} onPick={(w) => { update({ visitWing: w }); setAdding(false); }} />
                {st.visitWing ? <Pressable accessibilityRole="button" onPress={() => { update({ visitWing: null, active: "home" }); setAdding(false); }} style={{ paddingBottom: 12 }}><Text style={[type.eyebrow(8), { color: color.mute }]}>{t("companion.you.stopWalking", { door: doorLabel(st.visitWing) })}</Text></Pressable> : null}
              </View>
            ) : null}
            {/* Always shown, so someone who skipped the questions can still keep other traditions away. */}
            {(() => {
              const prof = st.profile ?? emptyProfile(wing, today); // same setting Today reads, whichever door
              return (
                <Row a={t("companion.you.others")} b={`${{ stay: t("companion.you.others.stay"), sometimes: t("companion.you.others.sometimes"), love: t("companion.you.others.love") }[prof.openness]}${t("companion.you.tapToChange")}`}
                  right={{ stay: t("common.off"), sometimes: t("companion.you.others.rSometimes"), love: t("companion.you.others.rLove") }[prof.openness]} cycle
                  onPress={() => { const o = ({ stay: "sometimes", sometimes: "love", love: "stay" } as const)[prof.openness]; update({ profile: { ...prof, openness: o } }); }} />
              );
            })()}
            {(() => {
              const prof = st.profile ?? emptyProfile(wing, today);
              const learn = practiceModeOf(prof) === "learn";
              return (
                <Row testID="row-practices" a={t("companion.you.practices")} b={learn ? t("companion.you.practices.learn") : t("companion.you.practices.try")}
                  right={learn ? t("companion.you.practices.rLearn") : t("companion.you.practices.rTry")} cycle
                  onPress={() => { update({ profile: { ...prof, answers: { ...prof.answers, practiceMode: learn ? "practice" : "learn" } } }); setLearnFact(!learn, today); }} />
              );
            })()}
          </Group>
          <Group title={t("companion.you.gCompanion")}>
            <Row a={t("companion.journal.title")} b={(() => { const n = memory.journal.length; return n ? t("companion.you.journalB", { count: n }) : t("companion.you.journalEmpty"); })()} onPress={() => router.push("/journal")} />
            <Row a={t("companion.you.knows")} b={t("companion.you.knowsB", { count: memory.facts.length })} onPress={() => router.push("/you/companion")} />
            {derived.showedUp >= 7 ? <Row a={t("companion.weekPage.title")} b={t("companion.you.weekB")} onPress={() => router.push("/reflect")} /> : null}
          </Group>
          <Group title={t("companion.you.gEveryDay")}>
            <Row testID="row-language" a={t("common.language")} b={t("common.language.b")} right={lang === "es" ? t("common.language.es") : t("common.language.en")} cycle onPress={() => setLang(lang === "es" ? "en" : "es")} />
            <Row testID="row-reminders" a={t("companion.you.reminders")} b={t("companion.you.remindersB")} right={reminderStatus(st.reminder.on)} onPress={() => router.push("/you/reminders")} />
            <Row testID="row-streak" a={t("companion.you.streak")} b={st.streakOn !== false ? t("companion.you.streakOn") : t("companion.you.streakOff")} right={st.streakOn !== false ? t("common.on") : t("common.off")} cycle onPress={() => update({ streakOn: st.streakOn === false })} />
            <Row a={t("companion.you.readAloud")} b={t("companion.you.readAloudB")} toggle={st.voiceOn} onPress={() => update({ voiceOn: !st.voiceOn })} />
            <Row a={t("companion.you.chime")} b={t("companion.you.chimeB")} toggle={st.chime} onPress={() => update({ chime: !st.chime })} />
          </Group>
          <Group title={t("companion.you.gYours")}>
            <Row a={t("companion.you.table")} b={st.kids.length ? t("companion.you.tableB", { names: st.kids.map((k) => k.name).join(", ") }) : t("companion.you.tableEmpty")} onPress={() => router.push("/you/table")} />
            <Row testID="row-year" a={t("companion.you.year")} b={t("companion.you.yearB", { days: t("common.days", { count: derived.showedUp }), hours: hoursWords(learned.minutes), badges: badges.length ? t("companion.you.badges", { count: badges.length }) : "" })} onPress={() => router.push({ pathname: "/year", params: { so: "1" } })} />
            <Row a={t("companion.you.book")} b={st.book.length ? t("companion.you.bookB", { count: st.book.length }) : t("companion.you.bookEmpty")} onPress={() => router.push("/you/book")} />
            <Row testID="row-account" a={accountsOn() ? t("companion.you.account") : t("companion.you.yourData")} b={email ? t("companion.you.accountEmail", { email }) : accountsOn() ? t("companion.you.accountSave") : t("companion.you.accountLocal")} onPress={() => router.push("/you/account")} />
          </Group>
          <Group title={t("companion.you.gAbout")}>
            <Row a={t("companion.you.plan")} b={t("companion.you.planB")} onPress={() => router.push("/you/plans")} />
            <Row a={t("companion.you.gift")} b={t("companion.you.giftB")} onPress={() => router.push("/you/gift")} />
            <Row a={t("companion.you.why")} b={t("companion.you.whyB")} onPress={() => router.push("/you/why")} />
            <Row a={t("companion.you.legal")} b={t("companion.you.legalB")} onPress={() => router.push("/you/legal")} />
          </Group>

          <Card>
            <Eyebrow>{t("companion.you.sunEyebrow")}</Eyebrow>
            <Text style={[type.body(12.5), { color: color.mute, marginTop: 6 }]}>{t("companion.you.sunIntro")}</Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              {sunNotes(SUN_NOTES(wing, ic.short, (data.DAY1[wing] || data.DAY1.SPIRITUAL).word), ic.short, (data.DAY1[wing] || data.DAY1.SPIRITUAL).word).map(([when, m]: [string, string]) => (
                <View key={when} style={{ backgroundColor: "#F2F2EC", borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, flexDirection: "row", gap: 10 }}>
                  <Sun size={26} />
                  <View style={{ flex: 1 }}><Text style={type.eyebrow(7)}>infinite hill · {when}</Text><Text style={[type.body(13), { marginTop: 3 }]}>{m}</Text></View>
                </View>
              ))}
            </View>
          </Card>

          {isDemo() ? (
            <View style={{ alignItems: "center", gap: 6 }}>
              <Text style={[type.eyebrow(8), { color: "#b9b1a0" }]}>{t("companion.you.demo")}</Text>
              <Btn kind="light" onPress={() => demoShiftDays(1)}>{t("companion.you.demoTomorrow")}</Btn>
              <Btn kind="light" onPress={() => demoShiftDays(3)}>{t("companion.you.demo3")}</Btn>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
