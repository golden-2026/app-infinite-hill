import { Stack } from "expo-router";
import { color } from "@/ui";

// You's pages live inside the tab, so the tab bar stays while you're in them (app review 2026-09-26).
// Gift and plans are jobs you finish or dismiss: they rise as sheets.
export default function YouLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.cream } }}>
      <Stack.Screen name="gift" options={{ presentation: "modal" }} />
      <Stack.Screen name="plans" options={{ presentation: "modal" }} />
    </Stack>
  );
}
