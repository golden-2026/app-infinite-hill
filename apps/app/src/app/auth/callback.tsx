// Where the emailed link lands. supabase-js finishes the sign-in from the URL; then we go on.
import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";
import { useAuth } from "@/lib/auth";
import { Body, Screen, Sun } from "@/ui";

export default function AuthCallback() {
  const { session, ready } = useAuth();
  useEffect(() => {
    if (!ready) return;
    let next = "/today";
    try { next = sessionStorage.getItem("ih:after-auth") || next; sessionStorage.removeItem("ih:after-auth"); } catch {}
    const t = setTimeout(() => router.replace((session ? next : "/sign-in") as any), session ? 300 : 4000);
    return () => clearTimeout(t);
  }, [ready, session]);
  return <Screen><View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}><Sun size={80} mood="spin" /><Body>{session ? "you're in." : "signing you in…"}</Body></View></Screen>;
}
