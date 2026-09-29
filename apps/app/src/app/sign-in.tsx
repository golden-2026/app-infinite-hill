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
import { Body, Btn, Link, Screen, Sun, color, font, type } from "@/ui";

// Pilot (no accounts): "I've been here before" explains where days live and brings them from a file.
function BeenHere() {
  const { importData, derived } = useStore();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <Screen sheet close={() => (router.canGoBack() ? router.back() : router.replace("/welcome"))} footer={<>
        <ImportButton kind="ink" onText={(t) => { const r = importData(t); setMsg(r.message); if (r.ok) { try { importWalkers(JSON.parse(t)?.walkers); } catch { /* none in this file */ } } if (r.ok) setTimeout(() => router.replace("/today"), 900); }} />
        <Btn kind="ghost" onPress={() => router.replace(derived.showedUp ? "/today" : "/welcome/door")}>{derived.showedUp ? "back to today" : "start fresh"}</Btn>
      </>}>
      <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
        <Sun size={64} />
        <Text accessibilityRole="header" style={type.title()}>welcome back.</Text>
        <Body>in the pilot your days live on the phone you started on — no account. (only if you turn on reminders do your reminder time and time zone go to our server.)</Body>
        <Body style={{ color: color.mute }}>same phone? just open infinite hill there. new phone? on the old one go to you › your data › export my days, then bring that file here.</Body>
        {msg ? <Text accessibilityLiveRegion="polite" style={[type.body(14), { color: color.ink }]}>{msg}</Text> : null}
      </View>
    </Screen>
  );
}

export default function SignIn() {
  useTitle("welcome back");
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
      <Screen sheet close={done} footer={<Btn onPress={done}>continue</Btn>}>
        <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
          <Sun size={64} mood="happy" />
          <Text accessibilityRole="header" style={type.title()}>you're in.</Text>
          <Body>{session.user.email} · your days are saved to your account and follow you to any phone or browser.</Body>
        </View>
      </Screen>
    );
  }
  return (
    <Screen sheet footer={accountsConfigured() ? (
        !sent ? (
          <Btn testID="send" disabled={!valid || busy} onPress={async () => { setBusy(true); const r = await sendCode(email); setBusy(false); setMsg(r.ok ? null : r.message); if (r.ok) setSent(true); }}>{busy ? "sending…" : "send me a code"}</Btn>
        ) : (
          <Btn testID="verify" disabled={code.length !== 6 || busy} onPress={async () => { setBusy(true); const r = await verifyCode(email, code); setBusy(false); setMsg(r.message); if (r.ok) setTimeout(done, 600); }}>{busy ? "checking…" : "sign in"}</Btn>
        )
      ) : <Btn onPress={() => (router.canGoBack() ? router.back() : router.replace("/today"))}>ok</Btn>}>
      <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
        <Sun size={64} />
        <Text accessibilityRole="header" style={type.title()}>{mode === "save" ? "save your day." : "welcome back."}</Text>
        {!accountsConfigured() ? <Body>accounts aren't switched on yet. your days are saved on this device in the meantime.</Body> : !sent ? (
          <>
            <Body style={{ color: color.mute }}>{mode === "save" ? "one email, no password. your days follow you to any phone or browser." : "the email you saved your days with. we'll send a link and a code."}</Body>
            <TextInput testID="email" value={email} onChangeText={setEmail} placeholder="you@email.com" autoCapitalize="none" autoComplete="email" keyboardType="email-address" inputMode="email" accessibilityLabel="Email"
              style={{ borderWidth: 1.5, borderColor: color.line, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 16, fontFamily: font.text[400], fontSize: 16, backgroundColor: "#fff" }} onSubmitEditing={() => valid && setSent(true)} />
          </>
        ) : (
          <>
            <Body>sent to <Text style={{ fontFamily: font.text[700] }}>{email.trim()}</Text>. tap the link in the email{Platform.OS === "web" ? " (it opens right here)" : ""}, or type the 6-digit code.</Body>
            <TextInput testID="code" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))} placeholder="123456" keyboardType="number-pad" inputMode="numeric" autoComplete="one-time-code" accessibilityLabel="6-digit code"
              style={{ borderWidth: 1.5, borderColor: color.line, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, fontFamily: font.display[800], fontSize: 28, letterSpacing: 8, textAlign: "center", backgroundColor: "#fff" }} />
            <Link onPress={() => { setSent(false); setCode(""); setMsg(null); }} style={{ color: color.mute }}>use a different email</Link>
          </>
        )}
        {msg ? <Text accessibilityLiveRegion="polite" style={[type.body(14), { color: color.ink }]}>{msg}</Text> : null}
      </View>
    </Screen>
  );
}
