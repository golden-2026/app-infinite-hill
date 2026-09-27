import { useTitle } from "@/lib/title";
// Account: who you're signed in as, sync, sign out, export, and delete (asks twice, then really deletes).
import { router } from "expo-router";
import { useState } from "react";
import { Platform, Share, Text, View } from "react-native";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { accountsOn } from "@/lib/supabase";
import { useSync } from "@/lib/sync";
import { disableReminders } from "@/lib/reminders";
import { today } from "@/lib/time";
import { ImportButton } from "@/ui/import-button";
import { Row } from "@/ui/row";
import { analyticsAvailable } from "@/lib/analytics";
import { Body, Btn, Card, Eyebrow, Screen, color, confirmSheet, toast, type } from "@/ui";

export default function Account() {
  useTitle("your data");
  const { email, signOut, deleteAccount } = useAuth();
  const { saved, derived, resetAll, importData, update } = useStore();
  const sync = useSync();
  const [msg, setMsg] = useState<string | null>(null); // delete errors
  const [dataMsg, setDataMsg] = useState<string | null>(null); // export / import results

  const exportData = async () => {
    const json = JSON.stringify({ exportedAt: new Date().toISOString(), account: email, days: derived.showedUp, sits: saved.sits, settings: saved.settings, settingsVersion: saved.settingsVersion }, null, 2);
    if (Platform.OS === "web") {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      a.download = `infinite-hill-${today()}.json`;
      a.click();
      toast("saved to your downloads");
    } else {
      await Share.share({ message: json }).catch(() => {});
    }
  };
  const store = useStore();
  const doDelete = async () => {
    await disableReminders(store).catch(() => {}); // the server forgets this device too
    const r = await deleteAccount();
    if (!r.ok) { setMsg(r.message); return; }
    resetAll();
    router.replace("/welcome");
  };
  const askDelete = async () => {
    const ok = await confirmSheet({
      title: derived.showedUp ? `sure? ${derived.showedUp === 1 ? "your 1 day goes" : `all ${derived.showedUp} days go`} with it.` : "sure? everything here goes with it.",
      body: email ? "your account and everything in it, on every device. it can't be undone." : "everything on this phone. it can't be undone.",
      confirm: "yes, delete it all", cancel: "keep everything", destructive: true,
    });
    if (ok) doDelete();
  };
  const doSignOut = async () => {
    await signOut();
    resetAll(); // your days stay in your account; this device forgets them
    router.replace("/welcome");
  };

  return (
    <Screen scroll back="you" title={accountsOn() ? "account." : "your data."} contentStyle={{ gap: 12 }}>
      {!accountsOn() ? (
        <Card>
          <Eyebrow>where your days live</Eyebrow>
          <Text style={[type.serif(18), { marginTop: 4 }]}>on this phone · {derived.showedUp} {derived.showedUp === 1 ? "day" : "days"}</Text>
          <Body size={13} style={{ color: color.mute, marginTop: 6 }}>there are no accounts in the pilot — your days, answers and book stay on this phone. (if you turn on reminders, the reminder time and your time zone go to our server so it can ring.) new phone? export a file here, then open infinite hill on the new one and bring your days from that file.</Body>
          <View style={{ gap: 8, marginTop: 12 }}>
            <Btn testID="export" onPress={exportData}>export my days</Btn>
            <ImportButton onText={(t) => { const r = importData(t); if (r.ok) toast(r.message); else setDataMsg(r.message); }} />
          </View>
          <View style={{ marginTop: 14, marginHorizontal: -16 }}>
            <Row first a="share anonymous usage" b={analyticsAvailable() ? "helps us see where the app is confusing. only which screens you reach — never your answers, your words or your door's name." : "not collecting anything in this build."} toggle={analyticsAvailable() && saved.settings.analytics === "yes"} right={analyticsAvailable() && saved.settings.analytics === "yes" ? "on" : "off"} onPress={() => update({ analytics: saved.settings.analytics === "yes" ? "no" : "yes" })} />
          </View>
          {dataMsg ? <Body size={13} style={{ marginTop: 8 }}>{dataMsg}</Body> : null}
        </Card>
      ) : null}
      {accountsOn() ? <Card>
        <Eyebrow>{email ? "signed in" : "not signed in"}</Eyebrow>
        <Text style={[type.serif(18), { marginTop: 4 }]}>{email || "saved on this device only"}</Text>
        <Body size={13} style={{ color: color.mute, marginTop: 6 }}>
          {email ? (sync.state === "synced" ? `synced${sync.lastSynced ? " just now" : ""}. ${derived.showedUp} days in your account.` : sync.state === "offline" ? "offline right now. everything is kept here and syncs when you're back." : "syncing…")
            : "if this phone is lost or the browser is cleared, the days go with it. saving takes one email."}
        </Body>
        <View style={{ marginTop: 12 }}>
          {email ? <Btn kind="ghost" onPress={doSignOut}>sign out</Btn> : <Btn testID="save-days" onPress={() => router.push({ pathname: "/sign-in", params: { mode: "save", then: "/you/account" } })}>save with email</Btn>}
        </View>
      </Card> : null}
      {accountsOn() ? <Card>
        <Eyebrow>your data</Eyebrow>
        <Body size={13} style={{ marginTop: 6 }}>what you've done here is yours: every sit, your goal, your book. no ad identifiers, no third-party trackers, nothing sold.</Body>
        <View style={{ marginTop: 12 }}><Btn kind="ghost" onPress={exportData}>export my data</Btn></View>
      </Card> : null}
      <Card>
        <Eyebrow>delete</Eyebrow>
        <Body size={13} style={{ marginTop: 6 }}>{email ? "deletes your account and every day, line and setting in it, on every device. it can't be undone." : "erases everything on this device. it can't be undone."}</Body>
        <View style={{ marginTop: 12 }}><Btn testID="delete" kind="danger" onPress={askDelete}>{email ? "delete my account" : "erase this device"}</Btn></View>
        {msg ? <Body size={13} style={{ marginTop: 8 }}>{msg}</Body> : null}
      </Card>
    </Screen>
  );
}
