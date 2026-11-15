import { Anton_400Regular } from "@expo-google-fonts/anton";
import { Baloo2_800ExtraBold } from "@expo-google-fonts/baloo-2";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Fragment, useEffect } from "react";
import { Platform, View, useWindowDimensions } from "react-native";
import { preloadArt } from "@/lib/preload";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useLang } from "@/i18n";
import { AuthProvider } from "@/lib/auth";
import { registerWorker, syncReminders } from "@/lib/reminders";
import { StoreProvider, useStore } from "@/lib/store";
import { SyncProvider } from "@/lib/sync";
import { color } from "@/ui";
import { OverlayHost } from "@/ui/overlay";
import { useCompanionInput } from "@/lib/companion/use-companion";
import { shapeToday } from "@/lib/companion/shape";
import { checkin, refreshFriends, useFriends, weekLight } from "@/lib/friends";
import { useSeasons } from "@/lib/quests";
import { pulseOpen } from "@/lib/pulse";
import { CirclesSync } from "@/ui/circles";

SplashScreen.preventAutoHideAsync().catch(() => {});

// The loud brand's film grain (BRIEF.md, Magna's playbook), web only: one fixed, untouchable noise layer over the app.
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
function addGrain() {
  if (Platform.OS !== "web" || typeof document === "undefined" || document.getElementById("ih-grain")) return;
  const el = document.createElement("style");
  el.id = "ih-grain";
  el.textContent = `body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:2147483646;background-image:${GRAIN};opacity:.07;mix-blend-mode:overlay}@media (prefers-reduced-transparency: reduce){body::after{display:none}}`;
  document.head.appendChild(el);
}

// Keeps reminders in step with the day: on open, when the time changes, and right after a sit.
function ReminderSync() {
  const store = useStore();
  const { reminder } = store.saved.settings;
  // quiet mode as it would stand at the 8 pm saver (so bedtime alone doesn't decide): the hard persona or heavy days
  const input = useCompanionInput();
  const quiet = shapeToday({ ...input, hour: 20 }).quiet;
  useEffect(() => { registerWorker(); }, []);
  useEffect(() => { syncReminders({ ...store, quiet } as any); }, [reminder.on, reminder.time, reminder.set, store.derived.doneToday, store.today, quiet, store.saved.settings.streakOn]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Friends: after a lesson (or a new day), tell friends how today stands and refresh theirs. Nothing happens until this
// phone has paired a friend; offline it quietly waits (lib/friends).
function FriendsSync() {
  const { saved, derived, today } = useStore();
  const f = useFriends();
  const s = derived.streak;
  const light = weekLight(saved.sits, saved.settings.runs, today);
  const quests = useSeasons().finished.length; // a count only: never which quest (a quest names a tradition's season)
  useEffect(() => {
    if (!f.friendId) return;
    let live = true;
    (async () => { await checkin({ date: today, doneToday: s.doneToday, streak: s.streak, golden: s.golden, weekLight: light, quests }); if (live) await refreshFriends(today); })();
    return () => { live = false; };
  }, [f.friendId, today, s.doneToday, s.streak, s.golden, light, quests, f.nick, f.board]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Anonymous return counts: once a day on open, the phone says "opened today" with only the day it started and how many
// days since (lib/pulse). Nothing while the person has switched it off under You › Your data.
function PulseSync() {
  const { saved, today } = useStore();
  const on = saved.settings.pulse !== false;
  const own = saved.sits.filter((s) => !s.kidId);
  const earliest = own.length ? own.reduce((a, s) => (s.date < a ? s.date : a), own[0].date) : null;
  useEffect(() => { if (on) pulseOpen(today, earliest); }, [today, on]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
    Baloo2_800ExtraBold, Anton_400Regular,
  });
  useEffect(() => {
    if (loaded || error) { SplashScreen.hideAsync().catch(() => {}); preloadArt(); }
  }, [loaded, error]);
  useEffect(() => { addGrain(); }, []);
  const { width, height } = useWindowDimensions();
  // a language switch (under You) re-mounts the screens, so every string is read again in the new language
  const lang = useLang();
  // Web on a wide screen: show the app in a phone frame (as v175 did) instead of stretching it.
  const framed = Platform.OS === "web" && width >= 520;
  const frame = framed
    ? { width: 430, height: Math.min(932, height - 48), alignSelf: "center" as const, marginVertical: "auto" as const, borderRadius: 44, overflow: "hidden" as const, backgroundColor: color.cream, boxShadow: "0 0 0 3px #EEFF6A, 0 30px 80px rgba(0,0,0,.6)" }
    : { flex: 1, backgroundColor: color.cream };
  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: framed ? "#000000" : color.cream, justifyContent: "center" }}>
      <View style={frame as any}>
      <SafeAreaProvider>
        <AuthProvider>
        <StoreProvider>
        <SyncProvider>
          <StatusBar style="light" />
          <ReminderSync />
          <FriendsSync />
          <PulseSync />
          <CirclesSync />
          <Fragment key={lang}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.cream } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
            <Stack.Screen name="session/[door]/[day]" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
            <Stack.Screen name="done" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
            <Stack.Screen name="review" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="sign-in" options={{ presentation: "modal" }} />
          </Stack>
          <OverlayHost />
          </Fragment>
        </SyncProvider>
        </StoreProvider>
        </AuthProvider>
      </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
  );
}
