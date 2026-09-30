import { InstallCoach, needsInstallCoach } from "@/ui/install-coach";
import { useTitle } from "@/lib/title";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { disableReminders, enableReminders, reminderStatus, reminderSupport, syncReminders } from "@/lib/reminders";
import { useStore } from "@/lib/store";
import { Body, Btn, Card, Eyebrow, Screen, color, font, type, toast } from "@/ui";

const TIMES: [string, string][] = [["auto", "about a day after my lesson"], ["sundown", "evening · 7:00 pm"], ["18:00", "6:00 pm"], ["20:00", "8:00 pm"], ["21:00", "9:00 pm"], ["07:00", "7:00 am"], ["12:00", "noon"]];

export default function Reminders() {
  useTitle("reminders");
  const store = useStore();
  const r = store.saved.settings.reminder;
  const support = reminderSupport();
  const [msg, setMsg] = useState<string | null>(null);
  // "auto" (the default until they pick): about 23.5 hours after the last lesson. Stored as sundown + not set, which is
  // also what the web push server (fixed time only) understands.
  const pickTime = (v: string) => {
    const next = v === "auto" ? { ...r, time: "sundown", set: false } : { ...r, time: v, set: true };
    store.update({ reminder: next });
    syncReminders({ ...store, saved: { ...store.saved, settings: { ...store.saved.settings, reminder: next } } } as any);
  };
  const picked = (v: string) => (v === "auto" ? !r.set : r.set === true && r.time === v);
  return (
    <Screen scroll back="you" title="reminders." contentStyle={{ gap: 12 }}>
      <Body style={{ color: color.mute }}>one a day, about when you did your last lesson (or at your time). never on a day you've already sat. never between 10 pm and 7 am. one 8 pm note only if your streak needs a hand, and never on a quiet day. after 7 days away, one last note and then quiet. never red.</Body>
      <Card>
        <Eyebrow>status</Eyebrow>
        <Text testID="reminder-status" style={[type.serif(18), { marginTop: 4 }]}>{reminderStatus(r.on)}</Text>
        {needsInstallCoach() ? <View style={{ marginTop: 8 }}><InstallCoach /></View> : support.note ? <Body size={13} style={{ color: color.mute, marginTop: 6 }}>{support.note}</Body> : null}
        {msg ? <Body size={13} style={{ marginTop: 6 }}>{msg}</Body> : null}
        <View style={{ marginTop: 12 }}>
          {r.on ? <Btn kind="ghost" onPress={async () => { await disableReminders(store); setMsg(null); toast("reminders off. today still waits in the app."); }}>turn off</Btn>
            : support.can ? <Btn testID="reminders-on" onPress={async () => { const r = await enableReminders(store); if (r.ok) { setMsg(null); toast(r.message); } else setMsg(r.message); }}>turn on</Btn> : null}
        </View>
      </Card>
      <Card>
        <Eyebrow>when</Eyebrow>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }} accessibilityRole="radiogroup">
          {TIMES.map(([v, l]) => (
            <Pressable key={v} accessibilityRole="radio" accessibilityState={{ checked: picked(v) }} aria-checked={picked(v)} onPress={() => pickTime(v)}
              style={{ borderWidth: 1.5, borderColor: picked(v) ? color.ink : color.line, backgroundColor: picked(v) ? "#FFFBE0" : "#fff", borderRadius: 999, minHeight: 44, justifyContent: "center", paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: font.text[600], fontSize: 13, color: color.ink }}>{l}</Text>
            </Pressable>
          ))}
        </View>
        {Platform.OS === "web" ? <Body size={12} style={{ color: color.mute, marginTop: 10 }}>in a browser, reminders come at one set time for now (7 pm unless you pick another). the rhythm and the 8 pm streak note are on the phone app.</Body> : null}
      </Card>
    </Screen>
  );
}
