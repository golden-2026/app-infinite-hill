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
        {support.can ? <Btn testID="remind-on" onPress={turnOn}>remind me in the evening</Btn> : null}
        <Btn testID="remind-later" kind="ghost" onPress={close}>not now</Btn>
      </>}>
      <View style={{ flex: 1, justifyContent: "center", gap: 16 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}><Guy pose="phone" h={92} /><Bubble>i'll find you in the evening. once a day. no nagging — and never on a day you've already sat.</Bubble></View>
        <Text accessibilityRole="header" style={type.title()}>the sun, in the evening.</Text>
        <Text style={[type.body(13), { color: color.mute }]}>one reminder a day, at 7 pm (or pick a time in You → Reminders). it never turns red. it never guilts you.</Text>
        {needsInstallCoach() ? <InstallCoach /> : support.note ? <Text style={[type.body(12), { color: color.mute }]}>{support.note}</Text> : null}
        {msg ? <Text accessibilityLiveRegion="polite" style={[type.body(14), { color: color.ink }]}>{msg}</Text> : null}
      </View>
    </Screen>
  );
}
