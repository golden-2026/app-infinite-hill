// The companion on Today: one short note, a one-tap "how are you, today?", today's practice, and today's page.
// Plus the gentle "real help" card and the weekly reflection card. Everything here is kept on the phone.
import { label } from "@ih/content";
import { router } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { Practice } from "@/content/practices";
import { checkIn, clearCheckIn, closeHelp, markReflected, MOODS, useMemory } from "@/lib/companion/memory";
import type { Shaped } from "@/lib/companion/shape";
import { useStore } from "@/lib/store";
import { Guy, color, font, type } from "@/ui";

/** The mascot's pose for a practice: sits and breaths meditate, walks walk, writing reads, rest and loss carry the lantern.
 *  Prayers: namaste only where it belongs (Hinduism); every other tradition's prayer gets him sitting still, never
 *  another tradition's gesture. */
export function poseFor(p: Practice): string {
  if (p.kind === "rest" || p.loss) return "lantern";
  if (p.kind === "prayer") return p.door === "HINDUISM" ? "namaste" : "sitrock";
  return ({ breath: "meditate", sit: "meditate", walk: "walk", write: "read", move: "stretch", serve: "thumbs", give: "thumbs" } as Record<string, string>)[p.kind] || "meditate";
}
export const KIND_WORD: Record<string, string> = { breath: "breath", sit: "sit", walk: "walk", move: "move", write: "write", serve: "a kind act", give: "give", prayer: "prayer", rest: "rest" };

export function CompanionCard({ day }: { day: Shaped }) {
  const { today } = useStore();
  const m = useMemory();
  const asked = m.moods.find((x) => x.date === today)?.mood ?? null;
  const p = day.practice;
  // "how it's done": the practice screen opens read-only (no timer, no start, no "done")
  const open = () => router.push({ pathname: "/practice/[id]", params: day.howItsDone ? { id: p.id, view: "learn" } : { id: p.id } });
  const eyebrow = day.howItsDone
    ? `how it's done · ${p.door ? label(p.door) : KIND_WORD[p.kind]}${day.fromNextDoor ? " · from next door" : ""}`
    : `${day.fromNextDoor ? "a taste from next door" : m.done.some((d) => d.date === today) ? "done one today · another?" : day.learn ? "if you'd like" : "today's practice"} · ${p.minutes} min · ${KIND_WORD[p.kind]}`;
  return (
    <View style={s.card} testID="companion-card">
      <Text style={[type.eyebrow(8), { color: color.ink }]}>your companion{day.quiet ? " · a quiet day" : ""}</Text>
      <Text style={s.note} accessibilityLiveRegion="polite">{day.note}</Text>
      {day.reachOut ? (
        <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center", gap: 8 }} testID="reach-out">
          <Text style={[type.body(13), { flex: 1, color: color.ink }]}>a few hard days in a row. want to talk to someone? a friend, family, someone you trust.</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="close for today" onPress={() => closeHelp(today)} hitSlop={8} style={{ minHeight: 36, justifyContent: "center" }}>
            <Text style={[type.eyebrow(8), { color: color.mute }]}>not now</Text>
          </Pressable>
        </View>
      ) : null}

      {asked === null ? (
        <View style={{ marginTop: 10 }}>
          <Text style={[type.body(13), { color: color.mute }]}>how are you, today?</Text>
          <View style={s.moods} accessibilityRole="radiogroup" accessibilityLabel="how are you, today?">
            {MOODS.map((x) => (
              <Pressable key={x.id} accessibilityRole="radio" accessibilityState={{ checked: false }} accessibilityLabel={x.label} onPress={() => checkIn(today, x.id)}
                style={({ pressed }) => [s.mood, pressed && { backgroundColor: "#FFFBE0" }]}>
                <Text style={s.moodText}>{x.label}</Text>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" accessibilityLabel="skip" onPress={() => checkIn(today, "skip")} hitSlop={6} style={{ justifyContent: "center", paddingHorizontal: 6, minHeight: 36 }}>
              <Text style={[type.eyebrow(8), { color: color.mute }]}>skip</Text>
            </Pressable>
          </View>
        </View>
      ) : asked !== "skip" ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`you said ${asked}. change`} onPress={() => clearCheckIn(today)} hitSlop={6} style={{ marginTop: 6, alignSelf: "flex-start" }}>
          <Text style={[type.caption(12)]}>you said: {asked} · <Text style={{ textDecorationLine: "underline" }}>change</Text></Text>
        </Pressable>
      ) : null}

      <Pressable testID="companion-practice" accessibilityRole="button" accessibilityLabel={day.howItsDone ? `how it's done: ${p.title}` : `${day.learn ? "something to try, if you'd like" : "today's practice"}: ${p.title}, about ${p.minutes} ${p.minutes === 1 ? "minute" : "minutes"}`} onPress={open}
        style={({ pressed }) => [s.practice, pressed && { opacity: 0.85 }]}>
        <Guy pose={day.howItsDone ? "read" : poseFor(p)} h={58} />
        <View style={{ flex: 1 }}>
          <Text style={[type.eyebrow(8), { color: color.gold }]}>{eyebrow}</Text>
          <Text style={{ fontFamily: font.display[800], fontSize: 16, marginTop: 3, color: "#fff" }}>{p.title}</Text>
        </View>
        <Text style={{ color: color.gold, fontSize: 20 }}>›</Text>
      </Pressable>

      <Pressable accessibilityRole="link" accessibilityLabel={`today's page: ${day.prompt}`} onPress={() => router.push("/journal")} style={{ marginTop: 10, minHeight: 36, justifyContent: "center" }}>
        <Text style={[type.caption(12)]}>today's page · <Text style={{ color: color.ink }}>{day.prompt}</Text> ›</Text>
      </Pressable>
    </View>
  );
}

/** Real help, gently: only for words (journal, Guide) that mean someone may be in danger. Never from mood taps alone. No diagnosis. */
export function HelpCard({ onClose }: { onClose?: () => void }) {
  const { today } = useStore();
  return (
    <View style={[s.card, { borderColor: color.ink, backgroundColor: "#FFFBE0" }]} accessibilityRole="summary" testID="help-card">
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <Guy pose="lantern" h={64} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: font.display[800], fontSize: 17, color: color.ink }}>you don't have to carry this alone.</Text>
          <Text style={[type.body(13), { marginTop: 4 }]}>if you're in the US, you can call or text 988, the Suicide & Crisis Lifeline, any hour. anywhere else, call your local emergency number. or tell someone you trust, tonight.</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="call 988" onPress={() => Linking.openURL("tel:988").catch(() => {})} style={[s.yn, { backgroundColor: color.ink }]}>
          <Text style={[s.ynText, { color: color.gold }]}>call 988</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="text 988" onPress={() => Linking.openURL("sms:988").catch(() => {})} style={s.yn}>
          <Text style={s.ynText}>text 988</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="close for today" onPress={() => { closeHelp(today); onClose?.(); }} style={s.yn}>
          <Text style={s.ynText}>not now</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** On the 7th day of each week of use: a warm look back. */
export function ReflectCard() {
  const { derived } = useStore();
  const m = useMemory();
  const week = Math.floor(derived.showedUp / 7);
  if (week < 1 || derived.showedUp % 7 !== 0 || m.reflected.includes(week)) return null;
  const open = () => { markReflected(week); router.push("/reflect"); };
  return (
    <View style={[s.card, { flexDirection: "row", alignItems: "center", gap: 12 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="your week, looked back on" onPress={open} style={({ pressed }) => ({ flex: 1, flexDirection: "row", alignItems: "center", gap: 12, opacity: pressed ? 0.8 : 1 })}>
        <Guy pose="sitrock" h={60} />
        <View style={{ flex: 1 }}>
          <Text style={[type.eyebrow(8), { color: color.ink }]}>{week === 1 ? "your first week" : `week ${week}`}</Text>
          <Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink, marginTop: 3 }}>a look back at your week.</Text>
          <Text style={[type.body(12), { color: color.mute, marginTop: 2 }]}>no scores. just what happened.</Text>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={() => markReflected(week)} hitSlop={10}><Text style={type.eyebrow(12)}>✕</Text></Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: { marginHorizontal: 18, marginBottom: 12, backgroundColor: "#fff", borderWidth: 2, borderColor: color.ink, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14 },
  note: { fontFamily: font.display[500], fontSize: 17, lineHeight: 21, color: color.ink, marginTop: 4 },
  moods: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  mood: { borderWidth: 1.5, borderColor: color.ink, borderRadius: 999, paddingHorizontal: 11, minHeight: 36, justifyContent: "center", backgroundColor: "#fff" },
  moodText: { fontFamily: font.text[600], fontSize: 13, color: color.ink },
  practice: { marginTop: 10, backgroundColor: color.ink, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  yn: { flex: 1, alignItems: "center", backgroundColor: "#fff", borderWidth: 2, borderColor: color.ink, borderRadius: 999, paddingVertical: 8 },
  ynText: { fontFamily: font.text[700], fontSize: 13, color: color.ink },
});
