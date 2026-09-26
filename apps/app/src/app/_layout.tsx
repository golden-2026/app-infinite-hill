import { Baloo2_800ExtraBold } from "@expo-google-fonts/baloo-2";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold } from "@expo-google-fonts/manrope";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform, View, useWindowDimensions } from "react-native";
import { preloadArt } from "@/lib/preload";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/lib/auth";
import { registerWorker, syncReminders } from "@/lib/reminders";
import { StoreProvider, useStore } from "@/lib/store";
import { SyncProvider } from "@/lib/sync";
import { color } from "@/ui";
import { OverlayHost } from "@/ui/overlay";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Keeps reminders in step with the day: on open, when the time changes, and right after a sit.
function ReminderSync() {
  const store = useStore();
  const { reminder } = store.saved.settings;
  useEffect(() => { registerWorker(); }, []);
  useEffect(() => { syncReminders(store); }, [reminder.on, reminder.time, store.derived.doneToday, store.today]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Manrope_500Medium, Manrope_700Bold, Manrope_800ExtraBold,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
    Baloo2_800ExtraBold,
  });
  useEffect(() => {
    if (loaded || error) { SplashScreen.hideAsync().catch(() => {}); preloadArt(); }
  }, [loaded, error]);
  const { width, height } = useWindowDimensions();
  // Web on a wide screen: show the app in a phone frame (as v175 did) instead of stretching it.
  const framed = Platform.OS === "web" && width >= 520;
  const frame = framed
    ? { width: 430, height: Math.min(932, height - 48), alignSelf: "center" as const, marginVertical: "auto" as const, borderRadius: 44, overflow: "hidden" as const, backgroundColor: color.cream, boxShadow: "0 30px 80px rgba(40,34,20,.22), 0 2px 6px rgba(40,34,20,.08)" }
    : { flex: 1, backgroundColor: color.cream };
  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: framed ? "#E6E3DA" : color.cream, justifyContent: "center" }}>
      <View style={frame as any}>
      <SafeAreaProvider>
        <AuthProvider>
        <StoreProvider>
        <SyncProvider>
          <StatusBar style="dark" />
          <ReminderSync />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.cream } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="welcome" options={{ gestureEnabled: false }} />
            <Stack.Screen name="session/[door]/[day]" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
            <Stack.Screen name="done" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
            <Stack.Screen name="review" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="sign-in" options={{ presentation: "modal" }} />
          </Stack>
          <OverlayHost />
        </SyncProvider>
        </StoreProvider>
        </AuthProvider>
      </SafeAreaProvider>
      </View>
    </GestureHandlerRootView>
  );
}
