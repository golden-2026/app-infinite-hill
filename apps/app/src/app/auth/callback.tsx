// Where the emailed link lands. supabase-js finishes the sign-in from the URL; then we go on.
import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { useAuth } from "@/lib/auth";
import { accountsOn } from "@/lib/supabase";
import { t } from "@/i18n";
import { Body, Screen, Sun } from "@/ui";

export default function AuthCallback() {
  const { session, ready } = useAuth();
  useEffect(() => {
    // Accounts off in this build: there's no sign-in to finish, so don't pretend ("signing you in…" then bounce).
    if (!accountsOn()) { router.replace("/"); return; }
    if (!ready) return;
    let next = "/today";
    try { next = sessionStorage.getItem("ih:after-auth") || next; sessionStorage.removeItem("ih:after-auth"); } catch {}
    const timer = setTimeout(() => router.replace((session ? next : "/sign-in") as any), session ? 300 : 4000);
    return () => clearTimeout(timer);
  }, [ready, session]);
  return <Screen><View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}><Sun size={80} mood="spin" /><Body>{session ? t("onboarding.signIn.youreIn") : t("onboarding.callback.signingIn")}</Body></View></Screen>;
}
