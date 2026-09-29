import { TabHeader } from "@/ui/tab-header";
import { useTitle } from "@/lib/title";
// You: v175's Me screen as a real tab. Profile, path, and every setting — each one does what it says.
import { DOORS, SUN_NOTES, data, icon, label, pos } from "@ih/content";
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
import { useMemory } from "@/lib/companion/memory";
import { Btn, Card, Eyebrow, Guy, Sun, color, font, type, toast } from "@/ui";
import { Group, Row } from "@/ui/row";

export default function You() {
  useTitle("you");
  const { saved, derived, lessonFor, update, demoShiftDays, today } = useStore();
  const { email } = useAuth();
  const sync = useSync();
  const st = saved.settings;
  const wing = st.homeWing;
  const ic = icon(wing);
  const day = lessonFor(wing);
  const memory = useMemory();
  const [changing, setChanging] = useState(false);
  const [adding, setAdding] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const share = async () => {
    const kept = st.book.at(-1)?.line;
    const text = `${derived.showedUp} ${derived.showedUp === 1 ? "day" : "days"} on infinite hill · ${label(wing)}${kept ? ` · “${kept}”` : ""}`;
    try {
      const nav: any = typeof navigator !== "undefined" ? navigator : null;
      if (Platform.OS === "web" && !nav?.share) {
        await nav?.clipboard?.writeText(text);
        toast("copied. paste it anywhere.");
      } else {
        await Share.share({ message: text });
      }
    } catch {
      setShareMsg(text);
    }
  };
  const DoorGrid = ({ exclude, onPick, current }: { exclude?: string; onPick: (w: string) => void; current?: string | null }) => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 14 }} accessibilityRole="radiogroup">
      {DOORS.filter(([, w]) => w !== exclude).map(([l, w]) => (
        <Pressable key={w} accessibilityRole="radio" accessibilityState={{ checked: current === w }} aria-checked={current === w} accessibilityLabel={l} onPress={() => onPick(w)}
          style={{ width: "48%", borderWidth: 1.5, borderColor: current === w ? color.ink : color.line, backgroundColor: current === w ? "#FFFBE0" : "#fff", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12 }}>
          <Text style={{ fontFamily: font.display[500], fontSize: 15, color: color.ink }}>{l}</Text>
          <Text style={[type.eyebrow(7), { marginTop: 2 }]}>read by {voiceLabel(w, icon(w).short).short}</Text>
        </Pressable>
      ))}
    </View>
  );
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: color.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
          <TabHeader eyebrow="profile · settings" title="you." pose="shades">
          <Text style={type.body()}>
            {label(wing)} · day {day} · read by {voiceLabel(wing, ic.short).short}{st.visitWing ? ` · also walking ${label(st.visitWing)} · day ${lessonFor(st.visitWing)}` : ""} · {derived.showedUp} {derived.showedUp === 1 ? "day" : "days"} showed up
          </Text>
          <Text style={[type.caption(), email ? { color: color.ink } : null]}>
            {email ? `saved to ${email}${sync.state === "offline" ? " · offline, will sync" : sync.state === "syncing" ? " · syncing" : ""}` : "your days live on this phone."}
          </Text>
          </TabHeader>
        </View>
        <View style={{ paddingHorizontal: 18, gap: 12 }}>
          {!email && accountsOn() ? (
            <Card style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Sun size={40} />
              <View style={{ flex: 1 }}><Text style={type.serif(17)}>save your days</Text><Text style={[type.body(12), { color: color.mute }]}>one email, no password. they follow you to any phone.</Text></View>
              <Btn style={{ paddingHorizontal: 14 }} onPress={() => router.push({ pathname: "/sign-in", params: { mode: "save", then: "/you" } })}>save</Btn>
            </Card>
          ) : null}

          <Card>
            <Eyebrow>your path · {label(wing)}</Eyebrow>
            <Text style={[type.serif(20), { marginTop: 4 }]}>Day {day} · {pos(day).camp}, {pos(day).name.toLowerCase()}</Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              {(() => { let acc = 0; return data.CAMPS.map(([c, n, len]: [string, string, number]) => { const start = acc; acc += len; const done = Math.max(0, Math.min(len, day - 1 - start + (derived.paths[wing]?.done ? 1 : 0))); return (
                <View key={c} accessibilityLabel={`${c}, ${n}: ${done} of ${len}`}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}><Text style={{ fontFamily: font.text[600], fontSize: 12 }}>{c} · {n}</Text><Text style={[type.body(12), { color: color.mute }]}>{done}/{len}</Text></View>
                  <View style={{ height: 6, backgroundColor: color.line, borderRadius: 3, marginTop: 4, overflow: "hidden" }}><View style={{ width: `${(done / len) * 100}%`, height: 6, backgroundColor: done === len ? color.green : color.gold }} /></View>
                </View>
              ); }); })()}
            </View>
            <Text style={{ fontFamily: font.display[500], fontSize: 16, color: "#6b6448", marginTop: 12 }}>“Not I, nor anyone else can travel that road for you. You must travel it for yourself.” <Text style={type.eyebrow(7)}>— Walt Whitman</Text></Text>
            <Text style={[type.body(12), { color: color.mute, marginTop: 12 }]}>Year one is the first mountain: five camps, 331 days, ending with a whole text read start to finish. Camp one is written; the later camps are being written now. After that, the ranges — the deep texts, the schools, the mystics — years of them. Days are earned one at a time, and a missed day never resets you.</Text>
            <View style={{ marginTop: 12 }}><Btn kind="ghost" onPress={share}>share my day</Btn>{shareMsg ? <Text accessibilityLiveRegion="polite" style={[type.body(12), { color: color.mute, marginTop: 6 }]}>{shareMsg}</Text> : null}</View>
          </Card>

          <Group title="your path">
            <Row a="your path" b={`${label(wing)} · voice: ${voiceLabel(wing, ic.short).short}`} onPress={() => setChanging(!changing)} right={changing ? "close" : "change"} />
            {changing ? <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}><DoorGrid current={wing} onPick={(w) => { update({ homeWing: w, visitWing: st.visitWing === w ? null : st.visitWing, active: "home" }); setChanging(false); }} /></View> : null}
            <Row a="also walking" b={st.visitWing ? `${label(st.visitWing)} · day ${lessonFor(st.visitWing)}` : "walk a second door alongside your own — a parent's, a partner's, one you're curious about"} onPress={() => setAdding(!adding)} right={adding ? "close" : st.visitWing ? "change" : "add"} />
            {adding ? (
              <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                <DoorGrid exclude={wing} current={st.visitWing} onPick={(w) => { update({ visitWing: w }); setAdding(false); }} />
                {st.visitWing ? <Pressable accessibilityRole="button" onPress={() => { update({ visitWing: null, active: "home" }); setAdding(false); }} style={{ paddingBottom: 12 }}><Text style={[type.eyebrow(8), { color: color.mute }]}>stop walking {label(st.visitWing)}</Text></Pressable> : null}
              </View>
            ) : null}
            {/* Always shown, so someone who skipped the questions can still keep other traditions away. */}
            {(() => {
              const prof = st.profile ?? emptyProfile(wing, today); // same setting Today reads, whichever door
              return (
                <Row a="other traditions" b={`${{ stay: "stay on my path — never bring them up", sometimes: "now and then, a similar idea from another tradition", love: "show me similar ideas from other traditions" }[prof.openness]} · tap to change`}
                  right={{ stay: "off", sometimes: "sometimes", love: "often" }[prof.openness]} cycle
                  onPress={() => { const o = ({ stay: "sometimes", sometimes: "love", love: "stay" } as const)[prof.openness]; update({ profile: { ...prof, openness: o } }); }} />
              );
            })()}
          </Group>
          <Group title="your companion">
            <Row a="your journal" b={(() => { const n = memory.journal.length; return n ? `${n} private ${n === 1 ? "page" : "pages"} · today's prompt is waiting` : "a prompt a day, private, on this phone"; })()} onPress={() => router.push("/journal")} />
            <Row a="what the companion knows" b={`${memory.facts.length} ${memory.facts.length === 1 ? "thing" : "things"} · see, change or forget any of it`} onPress={() => router.push("/you/companion")} />
            {derived.showedUp >= 7 ? <Row a="your week" b="a look back, no scores" onPress={() => router.push("/reflect")} /> : null}
          </Group>
          <Group title="every day">
            <Row testID="row-reminders" a="reminders" b="one a day, in the evening or at your time" right={reminderStatus(st.reminder.on)} onPress={() => router.push("/you/reminders")} />
            <Row a="read aloud" b="the house voice reads the lessons" toggle={st.voiceOn} onPress={() => update({ voiceOn: !st.voiceOn })} />
            <Row a="sunset chime" b="the bell at the start and end of each sit" toggle={st.chime} onPress={() => update({ chime: !st.chime })} />
          </Group>
          <Group title="yours">
            <Row a="your table" b={st.kids.length ? `${st.kids.map((k) => k.name).join(", ")} · each with their own hill` : "add a child · they sit in kid mode, you see their strand"} onPress={() => router.push("/you/table")} />
            <Row a="your book" b={st.book.length ? `${st.book.length} line${st.book.length === 1 ? "" : "s"} you kept` : "the lines you keep, in your order"} onPress={() => router.push("/you/book")} />
            <Row testID="row-account" a={accountsOn() ? "account" : "your data"} b={email ? `${email} · sign out · export · delete` : accountsOn() ? "save with email · export · delete" : "export · move to a new phone · erase"} onPress={() => router.push("/you/account")} />
          </Group>
          <Group title="about">
            <Row a="plan" b="the house · free during the pilot" onPress={() => router.push("/you/plans")} />
            <Row a="gift infinite hill" b="a round, a year, or the table — for someone else" onPress={() => router.push("/you/gift")} />
            <Row a="why infinite hill" b="the reason, the science, the voices, the money" onPress={() => router.push("/you/why")} />
            <Row a="legal" b="terms · privacy · how voices work · keeper & provenance" onPress={() => router.push("/you/legal")} />
          </Group>

          <Card>
            <Eyebrow>how the sun talks to you</Eyebrow>
            <Text style={[type.body(12.5), { color: color.mute, marginTop: 6 }]}>one a day, in the evening. never a guilt trip. never red.</Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              {SUN_NOTES(wing, ic.short, (data.DAY1[wing] || data.DAY1.SPIRITUAL).word).map(([t, m]: [string, string]) => (
                <View key={t} style={{ backgroundColor: "#F2F2EC", borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, flexDirection: "row", gap: 10 }}>
                  <Sun size={26} />
                  <View style={{ flex: 1 }}><Text style={type.eyebrow(7)}>infinite hill · {t}</Text><Text style={[type.body(13), { marginTop: 3 }]}>{m}</Text></View>
                </View>
              ))}
            </View>
          </Card>

          {isDemo() ? (
            <View style={{ alignItems: "center", gap: 6 }}>
              <Text style={[type.eyebrow(8), { color: "#b9b1a0" }]}>demo controls</Text>
              <Btn kind="light" onPress={() => demoShiftDays(1)}>skip to tomorrow</Btn>
              <Btn kind="light" onPress={() => demoShiftDays(3)}>skip 3 days</Btn>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
