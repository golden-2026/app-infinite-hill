// Supabase client (project infinite-hill). The publishable key is public by design: row level security
// keeps every row owner-only. Sessions persist in the same localStorage the app uses (Expo SQLite on iOS).
import "./storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { flag } from "./flags";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase: SupabaseClient | null = url && key
  ? createClient(url, key, {
      auth: {
        storage: globalThis.localStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === "web",
        flowType: "pkce",
      },
    })
  : null;

export const accountsConfigured = () => supabase !== null;
/** Email accounts are off in the pilot (Kayan 2026-09-25: "C" — days stay on each device). ?flags=accounts turns them on. */
export const accountsOn = () => accountsConfigured() && flag("accounts");
