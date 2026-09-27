import { Stack } from "expo-router";
import { color } from "@/ui";

// The "you" tab must open on You itself: without an explicit initial route the stack started on its first declared
// screen (gift), so the first tap on the tab showed prices instead of your profile (walk 2026-09-27).
export const unstable_settings = { initialRouteName: "index" };

// You's pages live inside the tab, so the tab bar stays while you're in them (app review 2026-09-26).
// Gift and plans are jobs you finish or dismiss: they rise as sheets.
export default function YouLayout() {
  return (
    <Stack initialRouteName="index" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.cream } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="gift" options={{ presentation: "modal" }} />
      <Stack.Screen name="plans" options={{ presentation: "modal" }} />
    </Stack>
  );
}
