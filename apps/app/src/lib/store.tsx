// The app's state: a sit log (what happened) + settings (what the person chose). Every number on screen
// is derived from the sit log by @ih/domain, so a reload, a second device or a sync can never drift.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { deriveState, fromP0, makeSit, mergeSits, readExport, sitOutcome, type Derived, type Sit } from "@ih/domain";

import { randomId } from "./ids";
import { setChime } from "./sound";
import { setFxOn } from "./fx";
import { readJSON, remove, writeJSON } from "./storage";
import { timeZone, today as todayNow } from "./time";
import { cleanProfile, type Profile } from "./profile";

export const STORE_KEY = "ih:app:v1";

export type Reminder = { on: boolean; time: "sundown" | string };
export type Settings = {
  onboarded: boolean;
  reason: string | null;
  homeWing: string;
  visitWing: string | null;
  active: "home" | "visit";
  goal: { days: number | null; setOn: string } | null;
  welcomedBackOn: string | null;
  kids: { id: string; name: string; door: string; birthYear?: number }[];
  voiceOn: boolean;
  chime: boolean;
  reminder: Reminder;
  book: { line: string; door: string; date: string }[];
  signals: { door: string; day: number; verdict: string; next: string | null; date: string }[];
  analytics: "unasked" | "yes" | "no";
  reviewedOn?: string | null;
  carried?: { date: string; lesson: number; did: boolean } | null;
  unlocksSeen?: string[];
  /** What someone told us in onboarding, scored on the device. Private: owner-only when synced. */
  profile?: Profile | null;
};

type Saved = { v: 1; deviceId: string; sits: Sit[]; outbox: string[]; settings: Settings; settingsVersion: number };

export const defaultSettings = (): Settings => ({
  onboarded: false, reason: null, homeWing: "HINDUISM", visitWing: null, active: "home", goal: null, welcomedBackOn: null,
  kids: [], voiceOn: true, chime: true, reminder: { on: false, time: "sundown" }, book: [], signals: [], analytics: "unasked",
});

export const P0_KEY = "ih:v1"; // the P0 web build's saved state on the same address

const DOOR_KEYS = ["CHRISTIANITY", "CATHOLIC", "HINDUISM", "ISLAM", "JUDAISM", "BUDDHISM", "SIKHISM", "SPIRITUAL"];
/** Whatever was saved or imported, the settings the screens get are well-formed. */
export function cleanSettings(raw: any): Settings {
  const d = defaultSettings();
  const s = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const door = (x: unknown) => (typeof x === "string" && DOOR_KEYS.includes(x) ? x : null);
  const arr = (x: unknown) => (Array.isArray(x) ? x : []);
  const home = door(s.homeWing) || d.homeWing;
  const visit = door(s.visitWing) && s.visitWing !== home ? s.visitWing : null;
  return {
    ...d,
    ...s,
    onboarded: s.onboarded === true,
    homeWing: home,
    visitWing: visit,
    active: s.active === "visit" && visit ? "visit" : "home",
    goal: s.goal && typeof s.goal === "object" && typeof s.goal.setOn === "string" ? { days: typeof s.goal.days === "number" ? s.goal.days : null, setOn: s.goal.setOn } : null,
    kids: arr(s.kids).filter((k: any) => k && typeof k.id === "string" && typeof k.name === "string" && door(k.door)),
    book: arr(s.book).filter((b: any) => b && typeof b.line === "string"),
    signals: arr(s.signals).filter((x: any) => x && typeof x.door === "string"),
    voiceOn: s.voiceOn !== false,
    chime: s.chime !== false,
    reminder: s.reminder && typeof s.reminder === "object" && typeof s.reminder.time === "string" ? { on: s.reminder.on === true, time: s.reminder.time } : d.reminder,
    profile: cleanProfile(s.profile),
  };
}

function load(): Saved {
  let s = readJSON<Partial<Saved> | null>(STORE_KEY, null);
  if (!s) {
    // First open of the new app where the P0 build ran: carry every day over (P0 key is left untouched).
    const p0 = fromP0(readJSON(P0_KEY, null), { newId: () => randomId("sit_") });
    if (p0 && p0.sits.length) {
      s = { v: 1, deviceId: randomId("dev_"), sits: p0.sits, outbox: [], settings: { ...defaultSettings(), ...p0.settings }, settingsVersion: p0.settingsVersion };
      writeJSON(STORE_KEY, s); // carried over once; the P0 copy stays as a backup
    }
  }
  return {
    v: 1,
    deviceId: s?.deviceId || randomId("dev_"),
    sits: mergeSits(Array.isArray(s?.sits) ? s!.sits : []),
    outbox: Array.isArray(s?.outbox) ? s!.outbox : [],
    settings: cleanSettings(s?.settings),
    settingsVersion: s?.settingsVersion || 0,
  };
}

type Store = {
  saved: Saved;
  today: string;
  derived: Derived;
  door: string; // the door on screen now (visit or home)
  lessonFor: (door: string) => number;
  completeSit: (o: { door: string; day: number; kidId?: string | null }) => ReturnType<typeof sitOutcome>;
  update: (patch: Partial<Settings>) => void;
  setGoal: (days: number | "not_yet") => void;
  keepLine: (line: string, door: string) => void;
  addSignal: (sig: Settings["signals"][number]) => void;
  markWelcomedBack: () => void;
  replaceFromServer: (o: { sits: Sit[]; settings?: Partial<Settings>; settingsVersion?: number }) => void;
  markSynced: (ids: string[]) => void;
  resetAll: () => void;
  demoShiftDays: (n: number) => void; // demo/test only: pretend every sit happened n days earlier
  importData: (file: string) => { ok: boolean; message: string };
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(load);
  const [today, setToday] = useState(todayNow);

  // A new local date while the app is open (or coming back to it) re-derives everything.
  useEffect(() => {
    const tick = () => setToday(todayNow());
    const sub = AppState.addEventListener("change", (s) => s === "active" && tick());
    const t = setInterval(tick, 60_000);
    return () => {
      sub.remove();
      clearInterval(t);
    };
  }, []);

  const commit = useCallback((next: (s: Saved) => Saved) => {
    setSaved((prev) => {
      const s = next(prev);
      writeJSON(STORE_KEY, s);
      return s;
    });
  }, []);

  useEffect(() => { setChime(saved.settings.chime); setFxOn(saved.settings.chime); }, [saved.settings.chime]);
  const derived = useMemo(() => deriveState(saved.sits, { today, settings: saved.settings }), [saved.sits, saved.settings, today]);
  const st = saved.settings;
  const door = st.active === "visit" && st.visitWing ? st.visitWing : st.homeWing;

  const store = useMemo<Store>(() => ({
    saved,
    today,
    derived,
    door,
    lessonFor: (d) => derived.paths[d]?.day ?? 1,
    completeSit: ({ door: d, day, kidId = null }) => {
      const date = todayNow();
      const outcome = sitOutcome(saved.sits, date);
      const sit = makeSit({ id: randomId("sit_"), door: d, day, date, tz: timeZone(), kidId, deviceId: saved.deviceId, at: new Date().toISOString() });
      commit((s) => ({ ...s, sits: mergeSits(s.sits, [sit]), outbox: [...s.outbox, sit.id] }));
      return kidId ? { isNewDay: false, showedUp: outcome.showedUp - (outcome.isNewDay ? 1 : 0), milestone: null } : outcome;
    },
    update: (patch) => commit((s) => ({ ...s, settings: { ...s.settings, ...patch }, settingsVersion: s.settingsVersion + 1 })),
    setGoal: (days) => commit((s) => ({ ...s, settings: { ...s.settings, goal: { days: days === "not_yet" ? null : days, setOn: todayNow() } }, settingsVersion: s.settingsVersion + 1 })),
    keepLine: (line, d) => commit((s) => {
      const date = todayNow();
      if (s.settings.book.some((b) => b.line === line && b.door === d)) return s; // kept once
      return { ...s, settings: { ...s.settings, book: [...s.settings.book, { line, door: d, date }] }, settingsVersion: s.settingsVersion + 1 };
    }),
    addSignal: (sig) => commit((s) => {
      // one answer per door + lesson: answering again replaces it
      const signals = [...s.settings.signals.filter((x) => !(x.door === sig.door && x.day === sig.day)), sig];
      return { ...s, settings: { ...s.settings, signals }, settingsVersion: s.settingsVersion + 1 };
    }),
    markWelcomedBack: () => commit((s) => ({ ...s, settings: { ...s.settings, welcomedBackOn: todayNow() }, settingsVersion: s.settingsVersion + 1 })),
    replaceFromServer: ({ sits, settings, settingsVersion }) =>
      commit((s) => {
        const newer = settings && (settingsVersion ?? 0) > s.settingsVersion;
        return { ...s, sits: mergeSits(s.sits, sits), settings: newer ? { ...s.settings, ...settings } : s.settings, settingsVersion: newer ? settingsVersion! : s.settingsVersion };
      }),
    markSynced: (ids) => commit((s) => ({ ...s, outbox: s.outbox.filter((id) => !ids.includes(id)) })),
    demoShiftDays: (n) => commit((s) => ({
      ...s,
      sits: s.sits.map((x) => {
        const d = new Date(`${x.date}T12:00:00Z`);
        d.setUTCDate(d.getUTCDate() - n);
        return { ...x, date: d.toISOString().slice(0, 10), at: new Date(Date.parse(x.at) - n * 86_400_000).toISOString() };
      }),
      settings: s.settings.goal ? { ...s.settings, goal: { ...s.settings.goal, setOn: (() => { const d = new Date(`${s.settings.goal!.setOn}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); })() } } : s.settings,
    })),
    importData: (file) => {
      try {
        const r = readExport(file);
        const tomorrow = new Date(Date.now() + 36 * 3600_000).toISOString().slice(0, 10); // allow time-zone slack only
        r.sits = r.sits.filter((x) => x.date <= tomorrow);
        // A file with no days of your own can still carry children, kept lines or choices: bring those over too.
        const rs: any = r.settings || {};
        const hasSettings = !!(rs.kids?.length || rs.book?.length || rs.profile || rs.onboarded);
        if (!r.sits.length && !hasSettings) return { ok: false, message: "that file has no days in it." };
        commit((s) => ({
          ...s,
          sits: mergeSits(s.sits, r.sits),
          settings: cleanSettings(r.settings && (!s.settings.onboarded || r.settingsVersion > s.settingsVersion) ? { ...s.settings, ...r.settings, onboarded: true } : { ...s.settings, onboarded: true }),
          settingsVersion: Math.max(s.settingsVersion, r.settingsVersion) + 1,
        }));
        const n = new Set(r.sits.filter((x) => !x.kidId).map((x) => x.date)).size;
        return { ok: true, message: n ? `brought over. ${n} ${n === 1 ? "day" : "days"}, right where you left them.` : "brought over — your table, book and choices are here." };
      } catch (e) {
        return { ok: false, message: (e as Error).message };
      }
    },
    resetAll: () => {
      remove(STORE_KEY);
      remove(P0_KEY); // otherwise the P0 copy would be carried over again on the next open
      remove("ih:device-secret");
      setSaved(load());
    },
  }), [saved, today, derived, door, commit]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}
