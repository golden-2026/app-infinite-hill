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
import { importWalkers, readWalkers } from "@/lib/walkers";
import { Body, Btn, Card, Eyebrow, Screen, color, confirmSheet, toast, type } from "@/ui";
import { t } from "@/i18n";

export default function Account() {
  useTitle(t("companion.acct.title"));
  const { email, signOut, deleteAccount } = useAuth();
  const { saved, derived, resetAll, importData, update } = useStore();
  const sync = useSync();
  const [msg, setMsg] = useState<string | null>(null); // delete errors
  const [dataMsg, setDataMsg] = useState<string | null>(null); // export / import results

  const exportData = async () => {
    const json = JSON.stringify({ exportedAt: new Date().toISOString(), account: email, days: derived.showedUp, sits: saved.sits, settings: saved.settings, settingsVersion: saved.settingsVersion, walkers: readWalkers() }, null, 2);
    if (Platform.OS === "web") {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      a.download = `infinite-hill-${today()}.json`;
      a.click();
      toast(t("companion.acct.downloads"));
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
      title: derived.showedUp ? t("companion.acct.sureDays", { count: derived.showedUp }) : t("companion.acct.sureAll"),
      body: email ? t("companion.acct.delBodyAcct") : t("companion.acct.delBodyLocal"),
      confirm: t("companion.acct.confirm"), cancel: t("companion.acct.keep"), destructive: true,
    });
    if (ok) doDelete();
  };
  const doSignOut = async () => {
    await signOut();
    resetAll(); // your days stay in your account; this device forgets them
    router.replace("/welcome");
  };

  return (
    <Screen scroll back="you" title={accountsOn() ? t("companion.acct.hAccount") : t("companion.acct.hData")} contentStyle={{ gap: 12 }}>
      {!accountsOn() ? (
        <Card>
          <Eyebrow>{t("companion.acct.whereEyebrow")}</Eyebrow>
          <Text style={[type.serif(18), { marginTop: 4 }]}>{t("companion.acct.onPhone", { count: derived.showedUp })}</Text>
          <Body size={13} style={{ color: color.mute, marginTop: 6 }}>{t("companion.acct.pilotBody")}</Body>
          <View style={{ gap: 8, marginTop: 12 }}>
            <Btn testID="export" onPress={exportData}>{t("companion.acct.export")}</Btn>
            <ImportButton onText={(t) => {
              const r = importData(t);
              if (r.ok) {
                // "walking with" lives beside the days (lib/walkers), so it rides in the same file
                try { importWalkers(JSON.parse(t)?.walkers); } catch { /* no friends in this file */ }
                setDataMsg(null); toast(r.message);
              } else setDataMsg(r.message);
            }} />
          </View>
          <View style={{ marginTop: 14, marginHorizontal: -16 }}>
            <Row first a={t("companion.acct.analytics")} b={analyticsAvailable() ? t("companion.acct.analyticsOn") : t("companion.acct.analyticsOff")} toggle={analyticsAvailable() && saved.settings.analytics === "yes"} right={analyticsAvailable() && saved.settings.analytics === "yes" ? t("common.on") : t("common.off")} onPress={() => update({ analytics: saved.settings.analytics === "yes" ? "no" : "yes" })} />
            <Row testID="pulse-switch" a={t("companion.acct.pulse")} b={t("companion.acct.pulseBody")} toggle={saved.settings.pulse !== false} right={saved.settings.pulse !== false ? t("common.on") : t("common.off")} onPress={() => update({ pulse: saved.settings.pulse === false })} />
          </View>
          {dataMsg ? <Body size={13} style={{ marginTop: 8 }}>{dataMsg}</Body> : null}
        </Card>
      ) : null}
      {accountsOn() ? <Card>
        <Eyebrow>{email ? t("companion.acct.signedIn") : t("companion.acct.notSignedIn")}</Eyebrow>
        <Text style={[type.serif(18), { marginTop: 4 }]}>{email || t("companion.acct.deviceOnly")}</Text>
        <Body size={13} style={{ color: color.mute, marginTop: 6 }}>
          {email ? (sync.state === "synced" ? t("companion.acct.synced", { now: sync.lastSynced ? t("companion.acct.justNow") : "", n: derived.showedUp }) : sync.state === "offline" ? t("companion.acct.offline") : t("companion.acct.syncing"))
            : t("companion.acct.noSave")}
        </Body>
        <View style={{ marginTop: 12 }}>
          {email ? <Btn kind="ghost" onPress={doSignOut}>{t("companion.acct.signOut")}</Btn> : <Btn testID="save-days" onPress={() => router.push({ pathname: "/sign-in", params: { mode: "save", then: "/you/account" } })}>{t("companion.acct.saveEmail")}</Btn>}
        </View>
      </Card> : null}
      {accountsOn() ? <Card>
        <Eyebrow>{t("companion.acct.dataEyebrow")}</Eyebrow>
        <Body size={13} style={{ marginTop: 6 }}>{t("companion.acct.dataBody")}</Body>
        <View style={{ marginTop: 10, marginHorizontal: -16 }}>
          <Row first testID="pulse-switch" a={t("companion.acct.pulse")} b={t("companion.acct.pulseBody")} toggle={saved.settings.pulse !== false} right={saved.settings.pulse !== false ? t("common.on") : t("common.off")} onPress={() => update({ pulse: saved.settings.pulse === false })} />
        </View>
        <View style={{ marginTop: 12 }}><Btn kind="ghost" onPress={exportData}>{t("companion.acct.exportData")}</Btn></View>
      </Card> : null}
      <Card>
        <Eyebrow>{t("companion.acct.delete")}</Eyebrow>
        <Body size={13} style={{ marginTop: 6 }}>{email ? t("companion.acct.delAcct") : t("companion.acct.delLocal")}</Body>
        <View style={{ marginTop: 12 }}><Btn testID="delete" kind="danger" onPress={askDelete}>{email ? t("companion.acct.delAcctBtn") : t("companion.acct.delLocalBtn")}</Btn></View>
        {msg ? <Body size={13} style={{ marginTop: 8 }}>{msg}</Body> : null}
      </Card>
    </Screen>
  );
}
