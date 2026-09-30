import { useTitle } from "@/lib/title";
// Sign in / save your day: email → a link or a 6-digit code. No password, no form beyond one field.
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { useAuth } from "@/lib/auth";
import { accountsConfigured, accountsOn } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { ImportButton } from "@/ui/import-button";
import { importWalkers } from "@/lib/walkers";
import { t } from "@/i18n";
import { Body, Btn, Link, Screen, Sun, color, font, type } from "@/ui";

// Pilot (no accounts): "I've been here before" explains where days live and brings them from a file.
function BeenHere() {
  const { importData, derived } = useStore();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <Screen sheet close={() => (router.canGoBack() ? router.back() : router.replace("/welcome"))} footer={<>
        <ImportButton kind="ink" onText={(text) => { const r = importData(text); setMsg(r.message); if (r.ok) { try { importWalkers(JSON.parse(text)?.walkers); } catch { /* none in this file */ } } if (r.ok) setTimeout(() => router.replace("/today"), 900); }} />
        <Btn kind="ghost" onPress={() => router.replace(derived.showedUp ? "/today" : "/welcome/door")}>{derived.showedUp ? t("onboarding.signIn.backToday") : t("onboarding.signIn.startFresh")}</Btn>
      </>}>
      <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
        <Sun size={64} />
        <Text accessibilityRole="header" style={type.title()}>{t("onboarding.signIn.welcomeBack")}</Text>
        <Body>{t("onboarding.signIn.pilotBody")}</Body>
        <Body style={{ color: color.mute }}>{t("onboarding.signIn.pilotHow")}</Body>
        {msg ? <Text accessibilityLiveRegion="polite" style={[type.body(14), { color: color.ink }]}>{msg}</Text> : null}
      </View>
    </Screen>
  );
}

export default function SignIn() {
  useTitle(t("onboarding.signIn.title"));
  if (!accountsOn()) return <BeenHere />;
  return <SignInWithEmail />;
}

function SignInWithEmail() {
  const { then, mode } = useLocalSearchParams<{ then?: string; mode?: string }>();
  const { sendCode, verifyCode, session } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const done = () => router.replace((then as any) || "/today");
  const valid = /^\S+@\S+\.\S+$/.test(email.trim());

  if (Platform.OS === "web" && then) try { sessionStorage.setItem("ih:after-auth", String(then)); } catch {}
  if (session) {
    return (
      <Screen sheet close={done} footer={<Btn onPress={done}>{t("common.continue")}</Btn>}>
        <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
          <Sun size={64} mood="happy" />
          <Text accessibilityRole="header" style={type.title()}>{t("onboarding.signIn.youreIn")}</Text>
          <Body>{t("onboarding.signIn.saved", { email: session.user.email ?? "" })}</Body>
        </View>
      </Screen>
    );
  }
  return (
    <Screen sheet footer={accountsConfigured() ? (
        !sent ? (
          <Btn testID="send" disabled={!valid || busy} onPress={async () => { setBusy(true); const r = await sendCode(email); setBusy(false); setMsg(r.ok ? null : r.message); if (r.ok) setSent(true); }}>{busy ? t("onboarding.signIn.sending") : t("onboarding.signIn.send")}</Btn>
        ) : (
          <Btn testID="verify" disabled={code.length !== 6 || busy} onPress={async () => { setBusy(true); const r = await verifyCode(email, code); setBusy(false); setMsg(r.message); if (r.ok) setTimeout(done, 600); }}>{busy ? t("onboarding.signIn.checking") : t("onboarding.signIn.signIn")}</Btn>
        )
      ) : <Btn onPress={() => (router.canGoBack() ? router.back() : router.replace("/today"))}>{t("onboarding.signIn.ok")}</Btn>}>
      <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
        <Sun size={64} />
        <Text accessibilityRole="header" style={type.title()}>{mode === "save" ? t("onboarding.signIn.saveDay") : t("onboarding.signIn.welcomeBack")}</Text>
        {!accountsConfigured() ? <Body>{t("onboarding.signIn.notOn")}</Body> : !sent ? (
          <>
            <Body style={{ color: color.mute }}>{mode === "save" ? t("onboarding.signIn.saveBody") : t("onboarding.signIn.backBody")}</Body>
            <TextInput testID="email" value={email} onChangeText={setEmail} placeholder={t("onboarding.signIn.emailPlaceholder")} autoCapitalize="none" autoComplete="email" keyboardType="email-address" inputMode="email" accessibilityLabel={t("onboarding.signIn.emailA11y")}
              style={{ borderWidth: 1.5, borderColor: color.line, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 16, fontFamily: font.text[400], fontSize: 16, backgroundColor: "#fff" }} onSubmitEditing={() => valid && setSent(true)} />
          </>
        ) : (
          <>
            <Body>{t("onboarding.signIn.sentTo")}<Text style={{ fontFamily: font.text[700] }}>{email.trim()}</Text>{t("onboarding.signIn.tapLink")}{Platform.OS === "web" ? t("onboarding.signIn.opensHere") : ""}{t("onboarding.signIn.orCode")}</Body>
            <TextInput testID="code" value={code} onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))} placeholder="123456" keyboardType="number-pad" inputMode="numeric" autoComplete="one-time-code" accessibilityLabel={t("onboarding.signIn.codeA11y")}
              style={{ borderWidth: 1.5, borderColor: color.line, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, fontFamily: font.display[800], fontSize: 28, letterSpacing: 8, textAlign: "center", backgroundColor: "#fff" }} />
            <Link onPress={() => { setSent(false); setCode(""); setMsg(null); }} style={{ color: color.mute }}>{t("onboarding.signIn.otherEmail")}</Link>
          </>
        )}
        {msg ? <Text accessibilityLiveRegion="polite" style={[type.body(14), { color: color.ink }]}>{msg}</Text> : null}
      </View>
    </Screen>
  );
}
