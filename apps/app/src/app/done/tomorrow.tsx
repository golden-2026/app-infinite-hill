import { tg } from "@/lib/gentle-t";
import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { daysFrom } from "@/lib/pulse-plan";
import { useDone } from "@/lib/done";
import { enableReminders, reminderSupport, remindersReady, remindersServer } from "@/lib/reminders";
import { useStore } from "@/lib/store";
import { todaysThree } from "@/lib/three";
import { dueAfterLesson, emptyWellbeing } from "@/lib/wellbeing";
import { gentleStart } from "@/content/life-moments";
import { Bubble, Btn, Guy, Link, Screen, Sun, color, font, type } from "@/ui";
import { t, type Key } from "@/i18n";

/** The times offered here (the full list lives in You → Reminders). "auto" = about a day after today's lesson. */
const TIMES: [string, Key][] = [["auto", "session.tomorrow.t.auto"], ["07:00", "companion.remPage.t.07"], ["12:00", "companion.remPage.t.12"], ["sundown", "companion.remPage.t.sundown"], ["21:00", "companion.remPage.t.21"]];
const LABEL: Record<string, Key> = { sundown: "companion.remPage.t.sundown", "18:00": "companion.remPage.t.18", "20:00": "companion.remPage.t.20", "21:00": "companion.remPage.t.21", "07:00": "companion.remPage.t.07", "12:00": "companion.remPage.t.12" };
/** If they walk past the offer, it waits a week before asking again. */
const ASK_AGAIN_DAYS = 7;

// The finish, last step (owner brief 2026-10-01): one concrete reason to come back (tomorrow's lesson, by name) and,
// if no reminder is set, one tap to set one. Warm, short, no guilt. Then the lantern if it's due, else back home.
export default function Tomorrow() {
  useTitle(t("session.tomorrow.title"));
  const { p, day, close } = useDone();
  const store = useStore();
  const { saved, derived, update, today } = store;
  const st = saved.settings;
  const r = st.reminder;
  const [pick, setPick] = useState("auto");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ready = remindersReady();
  const asked = !!st.remindOffer && daysFrom(st.remindOffer, today) < ASK_AGAIN_DAYS;
  const [offer] = useState(() => ready && !r.on && !asked); // decided once, so turning it on shows the confirmation here
  const note = !ready && remindersServer() ? reminderSupport().note : null; // e.g. iPhone: add to Home Screen first
  const teaser = p.tomorrow || t("session.tomorrow.fallback");
  const when = (!r.set ? t("session.tomorrow.when.auto") : LABEL[r.time] ? t(LABEL[r.time]) : r.time).replace(/\.$/, ""); // "7:00 a. m." ends in its own period

  const turnOn = async () => {
    setBusy(true);
    const next = pick === "auto" ? { ...r, time: "sundown", set: false } : { ...r, time: pick, set: true };
    const res = await enableReminders({ ...store, saved: { ...saved, settings: { ...st, reminder: next } } } as any);
    setBusy(false);
    if (!res.ok) setMsg(res.message);
  };
  // when today's three are done and the lantern hasn't been lit yet, the lantern comes next; a milestone's check-in
  // (day 21, 50, 100 …; lib/wellbeing) comes first, once, and then goes on to the same place
  const finish = () => {
    if (offer && !saved.settings.reminder.on) update({ remindOffer: today });
    const three = todaysThree({ doneToday: derived.doneToday, glow: st.glow, book: st.book, lanternOn: st.lanternOn, today });
    const then = three.all && !three.opened ? "/lantern" : "/today";
    const m = dueAfterLesson(derived.showedUp, st.wellbeing || emptyWellbeing()); // (a child's lesson ends at /done/kid, never here)
    if (m) router.replace({ pathname: "/wellbeing", params: { m: String(m), then } });
    else if (then === "/lantern") router.replace("/lantern");
    else close();
  };

  return (
    <Screen close={finish} scroll footer={<Btn testID="see-you" onPress={finish}>{t("session.tomorrow.done")}</Btn>} contentStyle={{ flexGrow: 1, justifyContent: "center", gap: 16 }}>
      <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}><Guy pose="wave" h={96} /><Bubble>{t("session.tomorrow.bubble")}</Bubble></View>

      {/* after a gentle lesson (grief, scary health news, something hard, forgiveness): the Guide, offered softly */}
      {gentleStart(st.profile?.answers?.why) ? (
        <View testID="gentle-guide" style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Text style={[type.body(14), { flex: 1, minWidth: 180 }]}>{tg("gentle.after.guide")}</Text>
          <Link onPress={() => router.push("/guide")}>{tg("gentle.after.talk")}</Link>
        </View>
      ) : null}

      {/* the reason to come back: tomorrow's lesson, by name */}
      <View testID="tomorrow-card" style={{ backgroundColor: color.ink, borderRadius: 22, paddingVertical: 18, paddingHorizontal: 18, gap: 6 }}>
        <Text style={[type.eyebrow(9), { color: color.gold }]}>{t("session.tomorrow.eyebrow", { n: day + 1 })}</Text>
        <Text accessibilityRole="header" style={{ fontFamily: font.display[800], fontSize: 26, lineHeight: 30, color: "#fff" }}>{teaser}</Text>
        <Text style={[type.body(14), { color: "#ffffffcc" }]}>{t("session.tomorrow.sub")}</Text>
      </View>

      {r.on ? (
        <View testID="remind-set" style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.line, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 }}>
          <Sun size={28} mood="happy" />
          <Text style={[type.body(14), { flex: 1 }]}>{t("session.tomorrow.set", { when })}</Text>
          <Link onPress={() => router.push("/you/reminders")}>{t("session.tomorrow.change")}</Link>
        </View>
      ) : offer ? (
        <View testID="remind-offer" style={{ backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.line, borderRadius: 18, padding: 14, gap: 10 }}>
          <Text style={{ fontFamily: font.display[800], fontSize: 17, color: color.ink }}>{t("session.tomorrow.ask")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }} accessibilityRole="radiogroup">
            {TIMES.map(([v, l]) => (
              <Pressable key={v} testID={`remind-${v}`} accessibilityRole="radio" accessibilityState={{ checked: pick === v }} aria-checked={pick === v} onPress={() => setPick(v)}
                style={{ borderWidth: 1.5, borderColor: pick === v ? color.ink : color.line, backgroundColor: pick === v ? "#FFFBE0" : "#fff", borderRadius: 999, minHeight: 40, justifyContent: "center", paddingHorizontal: 12 }}>
                <Text style={{ fontFamily: font.text[600], fontSize: 13, color: color.ink }}>{t(l)}</Text>
              </Pressable>
            ))}
          </View>
          <Btn testID="remind-on" kind="gold" disabled={busy} onPress={turnOn}>{t("session.tomorrow.on")}</Btn>
          <Text style={[type.caption(12)]}>{t("session.tomorrow.promise")}</Text>
          {msg ? <Text accessibilityLiveRegion="polite" style={[type.body(13), { color: color.ink }]}>{msg}</Text> : null}
        </View>
      ) : note ? (
        <Text style={[type.body(12), { color: color.mute }]}>{note}</Text>
      ) : null}
    </Screen>
  );
}
