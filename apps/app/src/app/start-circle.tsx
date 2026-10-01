// Starting a circle: a teacher, pandit, rabbi, imam, priest, granthi or community leader brings their people in.
// Name, door, the leader's display name and an optional welcome note; then a share link and a short code to read out.
import { router } from "expo-router";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { DOORS } from "@ih/content";
import { useTitle } from "@/lib/title";
import { useStore } from "@/lib/store";
import { LEADER_MAX, NAME_MAX, NOTE_MAX, cleanLine, createCircle, prettyCode, type Circle } from "@/lib/circles";
import { Btn, Card, Eyebrow, Guy, Screen, color, font, type } from "@/ui";
import { DoorTile } from "@/ui/door-cards";
import { failWords, shareCircle } from "@/ui/circles";
import { t } from "@/i18n";

const field = { borderWidth: 1.5, borderColor: color.line, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, fontFamily: font.text[400], fontSize: 16, backgroundColor: "#fff", color: color.ink } as const;

export default function NewCircle() {
  useTitle(t("groups.new.title"));
  const { saved, today } = useStore();
  const [name, setName] = useState("");
  const [door, setDoor] = useState<string>(saved.settings.homeWing || "SPIRITUAL");
  const [leader, setLeader] = useState("");
  const [welcome, setWelcome] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [made, setMade] = useState<Circle | null>(null);
  const ok = !!cleanLine(name, NAME_MAX) && !!cleanLine(leader, LEADER_MAX);
  // always land on Together: on the web, canGoBack() can be true with nothing in the app to go back to, so back() did nothing
  const close = () => router.replace("/together");

  const go = async () => {
    setBusy(true);
    setMsg(null);
    const r = await createCircle({ name: cleanLine(name, NAME_MAX), door, leaderName: cleanLine(leader, LEADER_MAX), welcome: welcome.trim() || undefined }, today);
    setBusy(false);
    if (r.ok) setMade(r.circle); else setMsg(failWords(r.why));
  };

  if (made) {
    return (
      <Screen scroll close={close} contentStyle={{ gap: 14 }} footer={<Btn kind="ink" testID="circle-new-done" onPress={() => router.replace("/together")}>{t("groups.new.done")}</Btn>}>
        <View style={{ alignItems: "center", marginTop: 8 }}><Guy pose="heart" h={120} /></View>
        <Text testID="circle-ready" accessibilityRole="header" style={[type.h1(26), { textAlign: "center" }]}>{t("groups.new.ready", { circle: made.name })}</Text>
        <Text style={[type.body(14), { color: color.mute, textAlign: "center" }]}>{t("groups.new.readyBody")}</Text>
        <Card>
          <Eyebrow style={{ textAlign: "center" }}>{t("groups.codeLabel")}</Eyebrow>
          <Text testID="circle-new-code" accessibilityLabel={t("groups.codeA11y", { code: prettyCode(made.code).split("").join(" ") })} style={{ fontFamily: font.display[800], fontSize: 40, letterSpacing: 4, color: color.ink, textAlign: "center", marginTop: 6 }}>{prettyCode(made.code)}</Text>
          <Btn kind="gold" testID="circle-new-share" onPress={() => shareCircle(made)} style={{ marginTop: 12 }}>{t("groups.invite")}</Btn>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll close={close} title={t("groups.new.title")} contentStyle={{ gap: 14 }}
      footer={<Btn kind="ink" testID="circle-new-go" disabled={!ok || busy} onPress={go}>{busy ? t("groups.new.busy") : t("groups.new.go")}</Btn>}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Guy pose="point" h={84} />
        <Text style={[type.body(13), { flex: 1, color: color.mute }]}>{t("groups.new.host")}</Text>
      </View>
      <View style={{ gap: 6 }}>
        <Text style={type.eyebrow(8)}>{t("groups.new.name")}</Text>
        <TextInput testID="circle-new-name" value={name} onChangeText={(v) => setName(v.slice(0, NAME_MAX))} maxLength={NAME_MAX} placeholder={t("groups.new.namePlaceholder")} placeholderTextColor={color.mute} accessibilityLabel={t("groups.new.name")} style={field} />
      </View>
      <View style={{ gap: 6 }}>
        <Text style={type.eyebrow(8)}>{t("groups.new.door")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }} accessibilityRole="radiogroup">
          {DOORS.map(([, w]: [string, string]) => <DoorTile key={w} door={w} on={door === w} onPress={() => setDoor(w)} />)}
        </View>
      </View>
      <View style={{ gap: 6 }}>
        <Text style={type.eyebrow(8)}>{t("groups.new.leader")}</Text>
        <TextInput testID="circle-new-leader" value={leader} onChangeText={(v) => setLeader(v.slice(0, LEADER_MAX))} maxLength={LEADER_MAX} placeholder={t("groups.new.leaderPlaceholder")} placeholderTextColor={color.mute} accessibilityLabel={t("groups.new.leader")} style={field} />
      </View>
      <View style={{ gap: 6 }}>
        <Text style={type.eyebrow(8)}>{t("groups.new.welcome")}</Text>
        <TextInput testID="circle-new-welcome" value={welcome} onChangeText={(v) => setWelcome([...v].slice(0, NOTE_MAX).join(""))} maxLength={NOTE_MAX} multiline placeholder={t("groups.new.welcomePlaceholder")} placeholderTextColor={color.mute}
          accessibilityLabel={t("groups.new.welcome")} style={[field, { minHeight: 84, textAlignVertical: "top" }]} />
        <Text style={type.caption(11)}>{t("groups.note.left", { count: NOTE_MAX - [...welcome].length })}</Text>
      </View>
      {msg ? <Text accessibilityLiveRegion="polite" testID="circle-msg" style={[type.body(13), { color: color.ink }]}>{msg}</Text> : null}
      <Text style={[type.body(11), { color: color.mute }]}>{t("groups.new.rule")}</Text>
    </Screen>
  );
}
