// Sync: push this device's new sits, pull every sit the account has, and keep the newest settings.
// Sits merge by set union (ids never collide), so any order on any number of devices is safe.
import type { Sit } from "@ih/domain";
import { createContext, createElement, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { useAuth } from "./auth";
import { useStore } from "./store";
import { supabase } from "./supabase";

type Row = { client_id: string; door: string; lesson: number; practice_date: string; tz: string | null; kid_id: string | null; device_id: string | null; completed_at: string };
const toRow = (s: Sit, userId: string) => ({ user_id: userId, client_id: s.id, door: s.door, lesson: s.day, practice_date: s.date, tz: s.tz, kid_id: s.kidId, device_id: s.deviceId, completed_at: s.at });
const toSit = (r: Row): Sit => ({ id: r.client_id, door: r.door, day: r.lesson, date: r.practice_date, tz: r.tz, kidId: r.kid_id, deviceId: r.device_id, at: new Date(r.completed_at).toISOString() });

export type SyncState = "guest" | "syncing" | "synced" | "offline";

function useSyncEngine(): { state: SyncState; lastSynced: string | null; syncNow: () => void } {
  const { session } = useAuth();
  const store = useStore();
  const [state, setState] = useState<SyncState>("guest");
  const [lastSynced, setLast] = useState<string | null>(null);
  const busy = useRef(false);
  const latest = useRef(store);
  latest.current = store;

  const run = async () => {
    if (!supabase || !session || busy.current) return;
    busy.current = true;
    setState("syncing");
    try {
      const uid = session.user.id;
      const s = latest.current.saved;
      const pending = s.sits.filter((x) => s.outbox.includes(x.id));
      if (pending.length) {
        const { error } = await supabase.from("practice_completions").upsert(pending.map((x) => toRow(x, uid)), { onConflict: "user_id,client_id", ignoreDuplicates: true });
        if (error) throw error;
        latest.current.markSynced(pending.map((x) => x.id));
      }
      const { data: rows, error: e2 } = await supabase.from("practice_completions").select("client_id,door,lesson,practice_date,tz,kid_id,device_id,completed_at").order("completed_at");
      if (e2) throw e2;
      const { data: remote } = await supabase.from("app_settings").select("version,data").maybeSingle();
      const local = latest.current.saved;
      if (remote && remote.version > local.settingsVersion) {
        latest.current.replaceFromServer({ sits: (rows as Row[]).map(toSit), settings: remote.data, settingsVersion: remote.version });
      } else {
        latest.current.replaceFromServer({ sits: (rows as Row[]).map(toSit) });
        if (!remote || local.settingsVersion > remote.version) await supabase.rpc("save_settings", { p_version: local.settingsVersion, p_data: local.settings });
      }
      setState("synced");
      setLast(new Date().toISOString());
    } catch {
      setState("offline"); // tried; the outbox keeps everything until the next open or reconnect
    } finally {
      busy.current = false;
    }
  };

  // on sign-in, on every new sit or settings change (debounced), and when the app comes back
  useEffect(() => {
    if (!session) { setState("guest"); return; }
    const t = setTimeout(run, 800);
    return () => clearTimeout(t);
  }, [session, store.saved.outbox.length, store.saved.settingsVersion]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const sub = AppState.addEventListener("change", (a) => a === "active" && run());
    const online = () => run();
    if (typeof window !== "undefined" && "addEventListener" in window) window.addEventListener("online", online);
    return () => { sub.remove(); if (typeof window !== "undefined" && "removeEventListener" in window) window.removeEventListener("online", online); };
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  return { state: session ? state : "guest", lastSynced, syncNow: run };
}

const Ctx = createContext<ReturnType<typeof useSyncEngine> | null>(null);
export function SyncProvider({ children }: { children: ReactNode }) {
  return createElement(Ctx.Provider, { value: useSyncEngine() }, children);
}
export function useSync() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSync outside SyncProvider");
  return v;
}
