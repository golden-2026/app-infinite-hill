import { TabHeader } from "@/ui/tab-header";
import { useTitle } from "@/lib/title";
// You: who you are on the hill (three numbers), where you are on the path (the camp you're in, what's next), then every
// setting in plain groups: your practice, what you've kept, your people, your data, plan, language, help & legal.
import { DOORS, SUN_NOTES, data, icon, lessonInfo, pos } from "@ih/content";
import { border, radius, space } from "@ih/brand";
import { router } from "expo-router";
import { useState, type ReactNode } from "react";
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
import { useFriends } from "@/lib/friends";
import { useCircles } from "@/lib/circles";
import { Btn, Card, Eyebrow, Link, Sun, color, font, type, toast } from "@/ui";
import { Group, Row } from "@/ui/row";
import { hoursWords, minutesLearned } from "@/lib/year";
import { useSeasons } from "@/lib/quests";
import { campLabel, campName, doorLabel, isEs, setLang, t, useLang, type Key } from "@/i18n";
import { en as companionEn } from "@/i18n/strings/companion";
import { InvitesCard } from "@/ui/invites";

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

const YEAR_ONE: number = data.CAMPS.reduce((n: number, c: [string, string, number]) => n + c[2], 0); // 331

/** One of the three numbers under the header: big figure, small label, an optional mark (the sun) and footnote. */
function Stat({ n, label, mark, foot, testID }: { n: number; label: string; mark?: ReactNode; foot?: string; testID?: string }) {
  return (
    <View testID={testID} accessible accessibilityLabel={`${n} ${label}${foot ? `, ${foot}` : ""}`}
      style={{ flex: 1, backgroundColor: color.white, borderRadius: radius.tile, borderWidth: border.hair, borderColor: color.line, paddingVertical: space.md, paddingHorizontal: space.md, gap: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {mark}
        <Text style={{ fontFamily: font.display[800], fontSize: 26, lineHeight: 30, letterSpacing: -0.6, color: color.ink }}>{n}</Text>
      </View>
      <Text style={type.caption(12)} numberOfLines={2}>{label}{foot ? ` · ${foot}` : ""}</Text>
    </View>
  );
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
  const friends = useFriends();
  const circles = useCircles();
  const own = saved.sits.filter((x) => !x.kidId);
  const learned = { ...minutesLearned(own, st.timed), lessons: own.length };
  const { finished: badges } = useSeasons();
  const lang = useLang();
  const [changing, setChanging] = useState(false);
  const [adding, setAdding] = useState(false);
  const [sunOpen, setSunOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const streakOn = st.streakOn !== false;
  const sk = derived.streak;
  const doneToday = derived.paths[wing]?.done === true;

  // the path: how many days of a camp are walked. A camp a placement skipped counts only the days caught up on.
  const campDone = (start: number, len: number) => start + len < startFor(wing)
    ? new Set(own.filter((x) => x.door === wing && x.day > start && x.day <= start + len).map((x) => x.day)).size
    : Math.max(0, Math.min(len, day - 1 - start + (doneToday ? 1 : 0)));
  const here = pos(day);
  const hereDone = campDone(here.start - 1, here.of);
  let acc = 0;
  const camps = data.CAMPS.map(([c, n, len]: [string, string, number]) => { const start = acc; acc += len; return { c, n, len, done: day > YEAR_ONE ? len : campDone(start, len) }; });
  const yearDone = camps.reduce((s: number, x: { done: number }) => s + x.done, 0);
  const nextDay = doneToday ? day + 1 : day;
  const nextTitle = String(lessonInfo(wing, nextDay)?.title || "");

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
  const prof = st.profile ?? emptyProfile(wing, today); // same setting Today reads, whichever door
  const learn = practiceModeOf(prof) === "learn";
  const people = [friends.friends.length ? t("companion.you.friendsN", { count: friends.friends.length }) : "", circles.circles.length ? t("companion.you.circlesN", { count: circles.circles.length }) : ""].filter(Boolean).join(" · ");
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: color.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <View style={{ paddingHorizontal: space.gutter, paddingBottom: space.md }}>
          <TabHeader eyebrow={`${doorLabel(wing)} · ${t("common.day", { n: day })}`} title={t("companion.you.header")} pose="heart">
            {st.visitWing ? <Text style={type.caption()}>{t("companion.you.also")}: {doorLabel(st.visitWing)} · {t("common.day", { n: lessonFor(st.visitWing) })}</Text> : null}
            <Text style={[type.caption(), email ? { color: color.ink } : null]}>
              {email ? `${t("companion.you.savedTo", { email })}${sync.state === "offline" ? t("companion.you.offlineSync") : sync.state === "syncing" ? t("companion.you.syncing") : ""}` : t("companion.you.onPhone")}
            </Text>
          </TabHeader>
          {/* three numbers: the streak (with the sun; the book's lines when the streak is hidden), days walked, lessons */}
          <View style={{ flexDirection: "row", gap: space.sm, marginTop: space.md }}>
            {streakOn
              ? <Stat testID="stat-streak" n={sk.streak} label={t("companion.you.stat.streak", { count: sk.streak })} mark={<Sun size={22} />} foot={sk.longest > sk.streak ? t("companion.you.stat.best", { n: sk.longest }) : undefined} />
              : <Stat testID="stat-lines" n={st.book.length} label={t("companion.you.stat.lines", { count: st.book.length })} />}
            <Stat testID="stat-days" n={derived.showedUp} label={t("companion.you.stat.days", { count: derived.showedUp })} />
            <Stat testID="stat-lessons" n={learned.lessons} label={t("companion.you.stat.lessons", { count: learned.lessons })} />
          </View>
          {learned.lessons > 0 ? (
            <Text testID="hours-learned" style={[type.caption(12), { marginTop: space.sm }]}>
              <Text style={{ color: color.ink }}>{t("companion.you.learned", { hours: hoursWords(learned.minutes) })}</Text>{learned.estimatedLessons ? (learned.timedLessons ? t("companion.you.partlyEst") : t("companion.you.est")) : t("companion.you.timed")}
            </Text>
          ) : null}
        </View>
        <View style={{ paddingHorizontal: space.gutter, gap: space.xl }}>
          {!email && accountsOn() ? (
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Sun size={40} />
              <View style={{ flex: 1 }}><Text style={type.serif(17)}>{t("companion.you.saveTitle")}</Text><Text style={[type.body(12), { color: color.mute }]}>{t("companion.you.saveBody")}</Text></View>
              <Btn style={{ paddingHorizontal: 14 }} onPress={() => router.push({ pathname: "/sign-in", params: { mode: "save", then: "/you" } })}>{t("companion.you.save")}</Btn>
            </Card>
          ) : null}

          {/* your path: the camp you're in, one bar, what's next; the year as one thin strip; the whole climb a tap away */}
          <Card testID="you-path">
            <Eyebrow>{t("companion.you.pathEyebrow", { door: doorLabel(wing) })}</Eyebrow>
            <Text style={[type.serif(20), { marginTop: 4 }]}>{campLabel(here.camp)} · {campName(here.camp, here.name).toLowerCase()}</Text>
            <View accessible accessibilityLabel={t("companion.you.campA11y", { camp: campLabel(here.camp), name: campName(here.camp, here.name), done: hereDone, len: here.of })} style={{ marginTop: space.md }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontFamily: font.text[600], fontSize: 13, color: color.ink }}>{t("companion.you.campDay", { n: here.lesson, of: here.of })}</Text>
                <Text style={type.caption(12)}>{hereDone}/{here.of}</Text>
              </View>
              <View style={{ height: 8, backgroundColor: color.line, borderRadius: 4, marginTop: 6, overflow: "hidden" }}><View style={{ width: `${Math.max(hereDone ? 3 : 0, (hereDone / here.of) * 100)}%`, height: 8, backgroundColor: hereDone === here.of ? color.green : color.gold }} /></View>
            </View>
            {nextTitle ? <Text testID="you-next" style={[type.body(14), { marginTop: space.md }]} numberOfLines={2}>{t(doneToday ? "companion.you.nextTomorrow" : "companion.you.nextToday", { title: nextTitle })}</Text> : null}
            {/* the year: five camps as one strip, each as wide as it is long */}
            <View accessible accessibilityLabel={t("companion.you.yearA11y", { done: yearDone, total: YEAR_ONE })} style={{ flexDirection: "row", gap: 3, marginTop: space.lg }}>
              {camps.map((x: { c: string; len: number; done: number }) => (
                <View key={x.c} style={{ flex: x.len, height: 4, borderRadius: 2, backgroundColor: color.line, overflow: "hidden" }}>
                  <View style={{ width: `${(x.done / x.len) * 100}%`, height: 4, backgroundColor: x.done === x.len ? color.green : color.ink }} />
                </View>
              ))}
            </View>
            <Text style={[type.caption(12), { marginTop: 6 }]}>{t("companion.you.yearShort")}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space.md, gap: space.md }}>
              <Link onPress={() => router.push({ pathname: "/trail", params: { door: wing } })}>{t("companion.you.climb")}</Link>
              <Btn kind="ghost" style={{ paddingHorizontal: 16 }} onPress={share}>{t("companion.you.shareDay")}</Btn>
            </View>
            {shareMsg ? <Text accessibilityLiveRegion="polite" style={[type.body(12), { color: color.mute, marginTop: 6 }]}>{shareMsg}</Text> : null}
          </Card>

          <Group title={t("companion.you.gPractice")}>
            <Row a={t("companion.you.gPath")} b={t("companion.you.pathB", { door: doorLabel(wing), voice: voiceLabel(wing, ic.short).short })} onPress={() => setChanging(!changing)} right={changing ? t("common.close") : t("common.change")} />
            {changing ? <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}><DoorGrid current={wing} onPick={(w) => { update({ homeWing: w, visitWing: st.visitWing === w ? null : st.visitWing, active: "home" }); setChanging(false); }} /></View> : null}
            <Row a={t("companion.you.also")} b={st.visitWing ? `${doorLabel(st.visitWing)} · ${t("common.day", { n: lessonFor(st.visitWing) })}` : t("companion.you.alsoB")} onPress={() => setAdding(!adding)} right={adding ? t("common.close") : st.visitWing ? t("common.change") : t("common.add")} />
            {adding ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                <DoorGrid exclude={wing} current={st.visitWing} onPick={(w) => { update({ visitWing: w }); setAdding(false); }} />
                {st.visitWing ? <Pressable accessibilityRole="button" onPress={() => { update({ visitWing: null, active: "home" }); setAdding(false); }} style={{ paddingBottom: 12 }}><Text style={[type.eyebrow(8), { color: color.mute }]}>{t("companion.you.stopWalking", { door: doorLabel(st.visitWing) })}</Text></Pressable> : null}
              </View>
            ) : null}
            <Row testID="row-practices" a={t("companion.you.practices")} b={learn ? t("companion.you.practices.learn") : t("companion.you.practices.try")}
              right={learn ? t("companion.you.practices.rLearn") : t("companion.you.practices.rTry")} cycle
              onPress={() => { update({ profile: { ...prof, answers: { ...prof.answers, practiceMode: learn ? "practice" : "learn" } } }); setLearnFact(!learn, today); }} />
            {/* Always shown, so someone who skipped the questions can still keep other traditions away. */}
            <Row a={t("companion.you.others")} b={`${{ stay: t("companion.you.others.stay"), sometimes: t("companion.you.others.sometimes"), love: t("companion.you.others.love") }[prof.openness]}${t("companion.you.tapToChange")}`}
              right={{ stay: t("common.off"), sometimes: t("companion.you.others.rSometimes"), love: t("companion.you.others.rLove") }[prof.openness]} cycle
              onPress={() => { const o = ({ stay: "sometimes", sometimes: "love", love: "stay" } as const)[prof.openness]; update({ profile: { ...prof, openness: o } }); }} />
            <Row testID="row-reminders" a={t("companion.you.reminders")} b={t("companion.you.remindersB")} right={reminderStatus(st.reminder.on)} onPress={() => router.push("/you/reminders")} />
            <Row testID="row-sun" a={t("companion.you.sunEyebrow")} b={t("companion.you.sunIntro")} right={sunOpen ? t("common.close") : t("companion.you.see")} onPress={() => setSunOpen(!sunOpen)} />
            {sunOpen ? (
              <View style={{ gap: 8, paddingHorizontal: 16, paddingBottom: 14 }}>
                {sunNotes(SUN_NOTES(wing, ic.short, (data.DAY1[wing] || data.DAY1.SPIRITUAL).word), ic.short, (data.DAY1[wing] || data.DAY1.SPIRITUAL).word).map(([when, m]: [string, string]) => (
                  <View key={when} style={{ backgroundColor: color.cream, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, flexDirection: "row", gap: 10 }}>
                    <Sun size={26} />
                    <View style={{ flex: 1 }}><Text style={type.eyebrow()}>infinite hill · {when}</Text><Text style={[type.body(13), { marginTop: 3 }]}>{m}</Text></View>
                  </View>
                ))}
              </View>
            ) : null}
            <Row testID="row-streak" a={t("companion.you.streak")} b={streakOn ? t("companion.you.streakOn") : t("companion.you.streakOff")} right={streakOn ? t("common.on") : t("common.off")} cycle onPress={() => update({ streakOn: st.streakOn === false })} />
            <Row a={t("companion.you.readAloud")} b={t("companion.you.readAloudB")} toggle={st.voiceOn} onPress={() => update({ voiceOn: !st.voiceOn })} />
            <Row a={t("companion.you.chime")} b={t("companion.you.chimeB")} toggle={st.chime} onPress={() => update({ chime: !st.chime })} />
          </Group>

          <Group title={t("companion.you.gKept")}>
            <Row testID="row-year" a={t("companion.you.year")} b={t("companion.you.yearB", { days: t("common.days", { count: derived.showedUp }), hours: hoursWords(learned.minutes), badges: badges.length ? t("companion.you.badges", { count: badges.length }) : "" })} onPress={() => router.push({ pathname: "/year", params: { so: "1" } })} />
            <Row a={t("companion.you.book")} b={st.book.length ? t("companion.you.bookB", { count: st.book.length }) : t("companion.you.bookEmpty")} onPress={() => router.push("/you/book")} />
            <Row a={t("companion.journal.title")} b={memory.journal.length ? t("companion.you.journalB", { count: memory.journal.length }) : t("companion.you.journalEmpty")} onPress={() => router.push("/journal")} />
            <Row a={t("companion.you.knows")} b={t("companion.you.knowsB", { count: memory.facts.length })} onPress={() => router.push("/you/companion")} />
            {derived.showedUp >= 7 ? <Row a={t("companion.weekPage.title")} b={t("companion.you.weekB")} onPress={() => router.push("/reflect")} /> : null}
          </Group>

          <View style={{ gap: space.md }}>
            <Group title={t("companion.you.gPeople")}>
              <Row testID="row-friends" a={t("companion.you.friends")} b={people || t("companion.you.friendsEmpty")} onPress={() => router.push("/together")} />
              <Row a={t("companion.you.table")} b={st.kids.length ? t("companion.you.tableB", { names: st.kids.map((k) => k.name).join(", ") }) : t("companion.you.tableEmpty")} onPress={() => router.push("/you/table")} />
              <Row a={t("companion.you.gift")} b={t("companion.you.giftB")} onPress={() => router.push("/you/gift")} />
            </Group>
            <InvitesCard />
          </View>

          <Group title={t("companion.you.gData")}>
            <Row testID="row-account" a={accountsOn() ? t("companion.you.account") : t("companion.you.yourData")} b={email ? t("companion.you.accountEmail", { email }) : accountsOn() ? t("companion.you.accountSave") : t("companion.you.accountLocal")} onPress={() => router.push("/you/account")} />
          </Group>
          <Group title={t("companion.you.gPlan")}>
            <Row a={t("companion.you.plan")} b={t("companion.you.planB")} onPress={() => router.push("/you/plans")} />
          </Group>
          <Group title={t("common.language")}>
            <Row testID="row-language" a={t("common.language")} b={t("common.language.b")} right={lang === "es" ? t("common.language.es") : t("common.language.en")} cycle onPress={() => setLang(lang === "es" ? "en" : "es")} />
          </Group>
          <Group title={t("companion.you.gHelp")}>
            <Row a={t("companion.you.why")} b={t("companion.you.whyB")} onPress={() => router.push("/you/why")} />
            <Row a={t("companion.you.legal")} b={t("companion.you.legalB")} onPress={() => router.push("/you/legal")} />
          </Group>

          {/* a small sign-off */}
          <Text style={[type.caption(13), { textAlign: "center", paddingHorizontal: space.xl, fontStyle: "italic" }]}>
            {t("companion.you.quote").trim()} <Text style={{ fontStyle: "normal", color: color.ink }}>— Walt Whitman</Text>
          </Text>

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
