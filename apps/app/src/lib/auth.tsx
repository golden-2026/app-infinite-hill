// Accounts: guest first (nothing blocks the first sit), then "save your day" with email.
// Sign-in is an emailed link or 6-digit code (no password). Signing out forgets this device's copy;
// the account keeps everything. Delete removes the account and every row (server cascade).
import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { supabase } from "./supabase";
import { t, type Key } from "@/i18n";

type Auth = {
  ready: boolean;
  session: Session | null;
  email: string | null;
  sendCode: (email: string) => Promise<{ ok: boolean; message: string }>;
  verifyCode: (email: string, code: string) => Promise<{ ok: boolean; message: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ ok: boolean; message: string }>;
};

const Ctx = createContext<Auth | null>(null);

export function redirectUrl() {
  if (Platform.OS === "web" && typeof window !== "undefined") return `${window.location.origin}/auth/callback`;
  return Linking.createURL("/auth/callback");
}

// Supabase error codes → plain words. Unknown errors never blame the person. Keys, read at the moment they're shown.
const CODES: Record<string, Key> = {
  email_address_invalid: "home.auth.emailInvalid",
  email_address_not_authorized: "home.auth.notOpen",
  over_email_send_rate_limit: "home.auth.tooManyCodes",
  over_request_rate_limit: "home.auth.tooManyTries",
  otp_expired: "home.auth.expired",
  otp_disabled: "home.auth.notOpen",
  signup_disabled: "home.auth.signupClosed",
};
const friendly = (e?: { code?: string; message?: string } | null) =>
  t((e?.code && CODES[e.code]) ||
  (/rate|too many/i.test(e?.message || "") ? CODES.over_request_rate_limit :
   /token|otp|code/i.test(e?.message || "") ? "home.auth.badCode" :
   "home.auth.unreachable"));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    // iPhone: the emailed link opens the app at /auth/callback?code=… — finish the sign-in here.
    const sub = Platform.OS === "web" ? null : Linking.addEventListener("url", async ({ url }) => {
      const code = Linking.parse(url).queryParams?.code;
      if (typeof code === "string") await supabase!.auth.exchangeCodeForSession(code).catch(() => {});
    });
    return () => { data.subscription.unsubscribe(); sub?.remove(); };
  }, []);

  const value = useMemo<Auth>(() => ({
    ready,
    session,
    email: session?.user.email ?? null,
    sendCode: async (email) => {
      if (!supabase) return { ok: false, message: t("home.auth.off") };
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: redirectUrl(), shouldCreateUser: true } });
      return error ? { ok: false, message: friendly(error) } : { ok: true, message: t("home.auth.sent") };
    },
    verifyCode: async (email, code) => {
      if (!supabase) return { ok: false, message: t("home.auth.offShort") };
      const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
      return error ? { ok: false, message: friendly(error) } : { ok: true, message: t("home.auth.in") };
    },
    signOut: async () => { await supabase?.auth.signOut().catch(() => {}); },
    deleteAccount: async () => {
      if (!supabase || !session) return { ok: true, message: t("home.auth.deletedDevice") };
      const { error } = await supabase.rpc("delete_my_account");
      if (error) return { ok: false, message: t("home.auth.deleteFailed") };
      await supabase.auth.signOut().catch(() => {});
      return { ok: true, message: t("home.auth.deletedAll") };
    },
  }), [ready, session]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): Auth {
  const a = useContext(Ctx);
  if (!a) throw new Error("useAuth outside AuthProvider");
  return a;
}
