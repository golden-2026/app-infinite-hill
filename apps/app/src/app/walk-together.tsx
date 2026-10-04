import { useTitle } from "@/lib/title";
// "walk it together" (content/couple.ts): two partners on different doors walk seven days side by side, each their own
// door's lesson. It rides on what's already here: a lantern link carrying a friend invite (lib/walkers, lib/friends),
// or a friend already paired. All either one sees of the other is the friends server's progress signal (done today,
// days together): never a lesson, answer, journal line or Guide question (docs/PRIVACY_ARCHITECTURE.md).
import { data, lessonInfo } from "@ih/content";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { cleanNick, friendsState, makeInvite, setNick, useFriends } from "@/lib/friends";
import { giftLink } from "@/lib/walkers";
import { useStore } from "@/lib/store";
import { DOORS } from "@ih/content";
import { doorLabel, t } from "@/i18n";
import { Btn, Card, Eyebrow, Link, Screen, color, font, toast, type } from "@/ui";
import { Host } from "@/ui/host";
import { WalkTogetherCard } from "@/ui/couple";
import { friendsPrivacy } from "@/ui/friends";
import { shareOrCopy } from "@/ui/invites";

const input = { borderWidth: 1.5, borderColor: color.line, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 16, fontFamily: font.text[400], fontSize: 16, backgroundColor: "#fff", color: color.ink } as const;

export default function WalkTogether() {
  useTitle(t("couple.walk.title"));
  const { saved, derived, door, lessonFor, today, update } = useStore();
  const st = saved.settings;
  const friends = useFriends();
  const active = st.walk && !st.walk.closed ? st.walk : null;
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));

  const start = (friendId: string) => { update({ walk: { on: today, friendId, seen: [] } }); toast(t("couple.walk.started")); };
  const send = async () => {
    if (busy) return;
    setBusy(true);
    const known = friends.friends.map((f) => f.id);
    const i = await makeInvite();
    if (!i) { setBusy(false); toast(t("couple.walk.offline")); return; }
    if (cleanNick(name) && !friendsState().nick) setNick(name);
    const lesson = lessonFor(door);
    const line = String(lessonInfo(door, lesson)?.carry || (data.DAY1[door] || data.DAY1.SPIRITUAL).carry || "").replace(/[.!]$/, "");
    const url = giftLink({ from: name, line, door, d: today, n: derived.showedUp || 1, i, w: true });
    const r = await shareOrCopy(`${t("couple.walk.shareText")}\n${url}`);
    setBusy(false);
    if (r === "failed") return;
    update({ walk: { on: today, known, seen: [] } });
    toast(t("couple.walk.sent"));
  };

  // the door their partner's family keeps: optional, only for "before the holiday" (never sent anywhere)
  const doors = DOORS.map(([, w]: [string, string]) => w).filter((w: string) => w !== "SPIRITUAL" && w !== st.homeWing);

  return (
    <Screen title={t("couple.walk.title")} close={close} scroll>
      <View style={{ gap: 16 }}>
        <Host pose="heart">{t("couple.walk.hello")}</Host>

        {active ? (
          <>
            <WalkTogetherCard flush />
            <View style={{ alignItems: "flex-start" }}>
              <Link onPress={() => { update({ walk: { ...active, closed: true } }); toast(t("couple.walk.stopped")); }} style={{ color: color.mute }}>{t("couple.walk.stop")}</Link>
            </View>
          </>
        ) : (
          <>
            <Card>
              <Eyebrow>{t("couple.walk.howTitle")}</Eyebrow>
              {[t("couple.walk.how1"), t("couple.walk.how2"), t("couple.walk.how3")].map((x, k) => (
                <View key={k} style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                  <Text style={{ fontFamily: font.display[800], fontSize: 14, color: color.ink, width: 16 }}>{k + 1}</Text>
                  <Text style={[type.body(14), { flex: 1, color: color.ink }]}>{x}</Text>
                </View>
              ))}
            </Card>

            {friends.friends.length ? (
              <Card>
                <Eyebrow>{t("couple.walk.pickTitle")}</Eyebrow>
                <Text style={[type.body(13), { color: color.mute, marginTop: 4 }]}>{t("couple.walk.pickBody")}</Text>
                {friends.friends.map((f) => (
                  <Pressable key={f.id} testID="walk-pick" accessibilityRole="button" accessibilityLabel={t("couple.walk.pickA11y", { nick: f.nick })} onPress={() => start(f.id)}
                    style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", minHeight: 44, borderTopWidth: 1, borderTopColor: color.line, marginTop: 8, paddingTop: 8, opacity: pressed ? 0.7 : 1 })}>
                    <Text style={{ flex: 1, fontFamily: font.display[800], fontSize: 16, color: color.ink }}>{f.nick}</Text>
                    <Text style={{ fontFamily: font.display[800], fontSize: 18, color: color.ink }}>›</Text>
                  </Pressable>
                ))}
              </Card>
            ) : null}

            <Card>
              <Eyebrow>{t("couple.walk.sendTitle")}</Eyebrow>
              <Text style={[type.body(13), { color: color.mute, marginTop: 4, marginBottom: 10 }]}>{t("couple.walk.sendBody")}</Text>
              {friends.nick ? null : (
                <TextInput testID="walk-name" value={name} onChangeText={(v) => setName(v.slice(0, 24))} placeholder={t("couple.walk.namePlaceholder")} placeholderTextColor={color.mute}
                  autoComplete="off" autoCorrect={false} autoCapitalize="words" maxLength={24} accessibilityLabel={t("couple.walk.nameA11y")} style={[input, { marginBottom: 10 }]} />
              )}
              <Btn kind="ink" testID="walk-send" disabled={busy} onPress={send}>{busy ? t("couple.walk.busy") : t("couple.walk.send")}</Btn>
            </Card>
          </>
        )}

        <Card>
          <Eyebrow>{t("couple.walk.doorTitle")}</Eyebrow>
          <Text style={[type.body(13), { color: color.mute, marginTop: 4 }]}>{t("couple.walk.doorBody")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {doors.map((w: string) => {
              const on = st.partnerDoor === w;
              return (
                <Pressable key={w} testID={`walk-door-${w}`} accessibilityRole="radio" accessibilityState={{ selected: on }} aria-checked={on} accessibilityLabel={t("couple.walk.doorA11y", { door: doorLabel(w) })}
                  onPress={() => update({ partnerDoor: on ? null : w })}
                  style={{ minHeight: 40, justifyContent: "center", paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, borderColor: on ? color.ink : color.line, backgroundColor: on ? color.ink : "#fff" }}>
                  <Text style={{ fontFamily: font.text[600], fontSize: 13, color: on ? color.gold : color.ink }}>{doorLabel(w)}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Text style={[type.body(11), { color: color.mute }]}>{friendsPrivacy()}</Text>
      </View>
    </Screen>
  );
}
