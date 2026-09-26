// Accounts: guest first (nothing blocks the first sit), then "save your day" with email.
// Sign-in is an emailed link or 6-digit code (no password). Signing out forgets this device's copy;
// the account keeps everything. Delete removes the account and every row (server cascade).
import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { supabase } from "./supabase";

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

// Supabase error codes → plain words. Unknown errors never blame the person.
const CODES: Record<string, string> = {
  email_address_invalid: "that email doesn't look right.",
  email_address_not_authorized: "email sign-in isn't open yet. your days are safe on this device.",
  over_email_send_rate_limit: "that's a lot of codes. wait a minute, then try again.",
  over_request_rate_limit: "that's a lot of tries. wait a minute, then try again.",
  otp_expired: "that code expired. send a new one.",
  otp_disabled: "email sign-in isn't open yet. your days are safe on this device.",
  signup_disabled: "new accounts aren't open yet. your days are safe on this device.",
};
const friendly = (e?: { code?: string; message?: string } | null) =>
  (e?.code && CODES[e.code]) ||
  (/rate|too many/i.test(e?.message || "") ? CODES.over_request_rate_limit :
   /token|otp|code/i.test(e?.message || "") ? "that code didn't work. check it, or send a new one." :
   "couldn't reach the server. try again in a minute.");

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
      if (!supabase) return { ok: false, message: "accounts aren't switched on yet. your days are saved on this device." };
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: redirectUrl(), shouldCreateUser: true } });
      return error ? { ok: false, message: friendly(error) } : { ok: true, message: "sent. check your email." };
    },
    verifyCode: async (email, code) => {
      if (!supabase) return { ok: false, message: "accounts aren't switched on yet." };
      const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
      return error ? { ok: false, message: friendly(error) } : { ok: true, message: "you're in." };
    },
    signOut: async () => { await supabase?.auth.signOut().catch(() => {}); },
    deleteAccount: async () => {
      if (!supabase || !session) return { ok: true, message: "deleted from this device." };
      const { error } = await supabase.rpc("delete_my_account");
      if (error) return { ok: false, message: "couldn't reach the server. nothing was deleted. try again." };
      await supabase.auth.signOut().catch(() => {});
      return { ok: true, message: "deleted. everything." };
    },
  }), [ready, session]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): Auth {
  const a = useContext(Ctx);
  if (!a) throw new Error("useAuth outside AuthProvider");
  return a;
}
