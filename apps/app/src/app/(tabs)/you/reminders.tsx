import { InstallCoach, needsInstallCoach } from "@/ui/install-coach";
import { useTitle } from "@/lib/title";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { disableReminders, enableReminders, reminderStatus, reminderSupport, syncReminders } from "@/lib/reminders";
import { useStore } from "@/lib/store";
import { Body, Btn, Card, Eyebrow, Screen, color, font, type, toast } from "@/ui";
import { t, type Key } from "@/i18n";

const TIMES: [string, Key][] = [["auto", "companion.remPage.t.auto"], ["sundown", "companion.remPage.t.sundown"], ["18:00", "companion.remPage.t.18"], ["20:00", "companion.remPage.t.20"], ["21:00", "companion.remPage.t.21"], ["07:00", "companion.remPage.t.07"], ["12:00", "companion.remPage.t.12"]];

export default function Reminders() {
  useTitle(t("companion.remPage.title"));
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
    <Screen scroll back="you" title={t("companion.remPage.header")} contentStyle={{ gap: 12 }}>
      <Body style={{ color: color.mute }}>{t("companion.remPage.body")}</Body>
      <Card>
        <Eyebrow>{t("companion.remPage.status")}</Eyebrow>
        <Text testID="reminder-status" style={[type.serif(18), { marginTop: 4 }]}>{reminderStatus(r.on)}</Text>
        {needsInstallCoach() ? <View style={{ marginTop: 8 }}><InstallCoach /></View> : support.note ? <Body size={13} style={{ color: color.mute, marginTop: 6 }}>{support.note}</Body> : null}
        {msg ? <Body size={13} style={{ marginTop: 6 }}>{msg}</Body> : null}
        <View style={{ marginTop: 12 }}>
          {r.on ? <Btn kind="ghost" onPress={async () => { await disableReminders(store); setMsg(null); toast(t("companion.remPage.offToast")); }}>{t("companion.remPage.turnOff")}</Btn>
            : support.can ? <Btn testID="reminders-on" onPress={async () => { const r = await enableReminders(store); if (r.ok) { setMsg(null); toast(r.message); } else setMsg(r.message); }}>{t("companion.remPage.turnOn")}</Btn> : null}
        </View>
      </Card>
      <Card>
        <Eyebrow>{t("companion.remPage.when")}</Eyebrow>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }} accessibilityRole="radiogroup">
          {TIMES.map(([v, l]) => (
            <Pressable key={v} accessibilityRole="radio" accessibilityState={{ checked: picked(v) }} aria-checked={picked(v)} onPress={() => pickTime(v)}
              style={{ borderWidth: 1.5, borderColor: picked(v) ? color.ink : color.line, backgroundColor: picked(v) ? "#FFFBE0" : "#fff", borderRadius: 999, minHeight: 44, justifyContent: "center", paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: font.text[600], fontSize: 13, color: color.ink }}>{t(l)}</Text>
            </Pressable>
          ))}
        </View>
        {Platform.OS === "web" ? <Body size={12} style={{ color: color.mute, marginTop: 10 }}>{t("companion.remPage.web")}</Body> : null}
      </Card>
    </Screen>
  );
}
