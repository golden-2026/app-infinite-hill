import { useTitle } from "@/lib/title";
import { InstallCoach, needsInstallCoach } from "@/ui/install-coach";
import { useState } from "react";
import { Text, View } from "react-native";
import { useDone } from "@/lib/done";
import { enableReminders, reminderSupport } from "@/lib/reminders";
import { useStore } from "@/lib/store";
import { Bubble, Btn, Guy, Screen, color, toast, type } from "@/ui";

// Replaces v175's widget screen (a web app can't add a widget): one quiet reminder a day, the sun's way.
export default function Remind() {
  useTitle("reminders");
  const { close } = useDone();
  const store = useStore();
  const [msg, setMsg] = useState<string | null>(null);
  const support = reminderSupport();
  const turnOn = async () => {
    const r = await enableReminders(store);
    if (r.ok) { toast(r.message); close(); } else setMsg(r.message);
  };
  return (
    <Screen close={close} footer={<>
        {support.can ? <Btn testID="remind-on" onPress={turnOn}>remind me</Btn> : null}
        <Btn testID="remind-later" kind="ghost" onPress={close}>not now</Btn>
      </>}>
      <View style={{ flex: 1, justifyContent: "center", gap: 16 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}><Guy pose="phone" h={92} /><Bubble>i'll find you about a day after your lesson. once a day, never on a day you've already sat, and never at bedtime.</Bubble></View>
        <Text accessibilityRole="header" style={type.title()}>a little nudge from me.</Text>
        <Text style={[type.body(13), { color: color.mute }]}>one reminder a day, around when you did today's lesson (or pick a time in You → Reminders). if your streak ever needs a hand, one note at 8 pm. after a quiet week i stop asking. never red, never a guilt trip.</Text>
        {needsInstallCoach() ? <InstallCoach /> : support.note ? <Text style={[type.body(12), { color: color.mute }]}>{support.note}</Text> : null}
        {msg ? <Text accessibilityLiveRegion="polite" style={[type.body(14), { color: color.ink }]}>{msg}</Text> : null}
      </View>
    </Screen>
  );
}
