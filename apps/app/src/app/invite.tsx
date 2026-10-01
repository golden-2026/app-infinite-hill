import { useTitle } from "@/lib/title";
// Coming in with an invite (/invite?code=…): from the waitlist when a door opens, from a member's link, or a code the
// owner gave a Keeper or a voice. The code is checked, then used once; this phone is let in and gets invites of its
// own. A nickname is sent only if the person chooses to let whoever invited them see it.
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { checkCode, redeemCode, refreshGate, useInvite } from "@/lib/waitlist";
import { cleanCode } from "@/lib/invite-gate";
import { useStore } from "@/lib/store";
import { t } from "@/i18n";
import { Body, Btn, Link, Screen, Sun, color, font, type } from "@/ui";

const input = { borderWidth: 1.5, borderColor: color.line, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 16, fontFamily: font.text[400], fontSize: 16, backgroundColor: "#fff", color: color.ink } as const;

export default function Invite() {
  useTitle(t("waitlist.invite.title"));
  const { code: param } = useLocalSearchParams<{ code?: string }>();
  const { saved } = useStore();
  const s = useInvite();
  const [code, setCode] = useState(typeof param === "string" ? param : "");
  const [check, setCheck] = useState<"idle" | "checking" | "ok" | "used" | "bad" | "offline">("idle");
  const [nick, setNick] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { refreshGate(); }, []);
  useEffect(() => {
    const c = cleanCode(code);
    if (!c) { setCheck(code ? "bad" : "idle"); return; }
    let live = true;
    setCheck("checking");
    checkCode(c).then((r) => { if (live) setCheck(r); });
    return () => { live = false; };
  }, [code]);

  if (saved.settings.onboarded) {
    return (
      <Screen center footer={<Btn onPress={() => router.replace("/today")}>{t("waitlist.invite.today")}</Btn>}>
        <View style={{ gap: 14 }}><Sun size={64} mood="happy" /><Text accessibilityRole="header" style={type.title()}>{t("waitlist.invite.already")}</Text><Body>{t("waitlist.invite.alreadyBody")}</Body></View>
      </Screen>
    );
  }
  if (s.status.on === false || s.admitted) {
    // nothing to unlock: the switch is off, or this phone was already let in
    return (
      <Screen center footer={<Btn testID="invite-start" onPress={() => router.replace("/welcome/you")}>{t("waitlist.invite.start")}</Btn>}>
        <View style={{ gap: 14 }}><Sun size={64} mood="happy" /><Text accessibilityRole="header" style={type.title()}>{s.admitted ? t("waitlist.invited") : t("waitlist.invite.open")}</Text><Body>{s.admitted ? t("waitlist.invitedBody") : t("waitlist.invite.openBody")}</Body></View>
      </Screen>
    );
  }

  const enter = async () => {
    setBusy(true); setErr(null);
    const r = await redeemCode(code, show ? nick : null);
    setBusy(false);
    if (r === "ok") { router.replace("/welcome/you"); return; }
    setErr(t(({ used: "waitlist.invite.used", bad: "waitlist.invite.bad", full: "waitlist.invite.full", slow: "waitlist.slow", offline: "waitlist.offline" } as const)[r]));
  };
  const note = check === "checking" ? t("waitlist.invite.checking") : check === "used" ? t("waitlist.invite.used") : check === "bad" ? t("waitlist.invite.bad") : check === "offline" ? t("waitlist.offline") : null;
  return (
    <Screen scroll footer={<>
      <Btn testID="redeem" disabled={check !== "ok" || busy} onPress={enter}>{busy ? t("waitlist.invite.entering") : t("waitlist.invite.enter")}</Btn>
      <Btn kind="ghost" onPress={() => router.replace("/waitlist")}>{t("waitlist.invite.toList")}</Btn>
    </>}>
      <View style={{ gap: 14 }}>
        <Sun size={64} />
        <Text accessibilityRole="header" style={type.title()}>{t("waitlist.invite.title")}</Text>
        <Body style={{ color: color.mute }}>{t("waitlist.invite.body")}</Body>
        <TextInput testID="invite-code" value={code} onChangeText={setCode} placeholder={t("waitlist.invite.code")} accessibilityLabel={t("waitlist.invite.codeA11y")} autoCapitalize="none" autoCorrect={false} maxLength={12} style={input} />
        {note ? <Text testID="invite-note" accessibilityLiveRegion="polite" style={[type.body(13), { color: check === "checking" ? color.mute : "#a12a00" }]}>{note}</Text> : null}
        {check === "ok" ? (
          <View style={{ gap: 10 }}>
            <Pressable testID="show-nick" accessibilityRole="checkbox" accessibilityState={{ checked: show }} aria-checked={show} onPress={() => setShow(!show)} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: color.ink, backgroundColor: show ? color.ink : "#fff", alignItems: "center", justifyContent: "center" }}>{show ? <Text style={{ color: "#fff", fontSize: 14, lineHeight: 16 }}>✓</Text> : null}</View>
              <Text style={[type.body(14), { flex: 1, color: color.ink }]}>{t("waitlist.invite.showNick")}</Text>
            </Pressable>
            {show ? <TextInput testID="invite-nick" value={nick} onChangeText={setNick} placeholder={t("waitlist.invite.nick")} accessibilityLabel={t("waitlist.invite.nickA11y")} maxLength={24} style={input} /> : null}
            <Text style={[type.body(12), { color: color.mute }]}>{t("waitlist.invite.nickNote")}</Text>
          </View>
        ) : null}
        {err ? <Text accessibilityLiveRegion="polite" style={[type.body(13), { color: "#a12a00", fontFamily: font.text[600] }]}>{err}</Text> : null}
        <Link onPress={() => router.push("/sign-in")}>{t("waitlist.beenHere")}</Link>
      </View>
    </Screen>
  );
}
