import { InstallCoach, needsInstallCoach } from "@/ui/install-coach";
import { useTitle } from "@/lib/title";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { disableReminders, enableReminders, reminderStatus, reminderSupport, syncReminders } from "@/lib/reminders";
import { useStore } from "@/lib/store";
import { Body, Btn, Card, Eyebrow, Screen, color, font, type, toast } from "@/ui";

const TIMES: [string, string][] = [["sundown", "sundown · 7:00 pm"], ["18:00", "6:00 pm"], ["20:00", "8:00 pm"], ["21:00", "9:00 pm"], ["07:00", "7:00 am"], ["12:00", "noon"]];

export default function Reminders() {
  useTitle("reminders");
  const store = useStore();
  const r = store.saved.settings.reminder;
  const support = reminderSupport();
  const [msg, setMsg] = useState<string | null>(null);
  const pickTime = (time: string) => {
    store.update({ reminder: { ...r, time } });
    syncReminders({ ...store, saved: { ...store.saved, settings: { ...store.saved.settings, reminder: { ...r, time } } } } as any);
  };
  return (
    <Screen scroll back="you" title="reminders." contentStyle={{ gap: 12 }}>
      <Body style={{ color: color.mute }}>one a day. never on a day you've already sat. never between 10 pm and 7 am. never red.</Body>
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
            <Pressable key={v} accessibilityRole="radio" accessibilityState={{ checked: r.time === v }} aria-checked={r.time === v} onPress={() => pickTime(v)}
              style={{ borderWidth: 1.5, borderColor: r.time === v ? color.ink : color.line, backgroundColor: r.time === v ? "#FFFBE0" : "#fff", borderRadius: 999, minHeight: 44, justifyContent: "center", paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: font.text[600], fontSize: 13, color: color.ink }}>{l}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
    </Screen>
  );
}
