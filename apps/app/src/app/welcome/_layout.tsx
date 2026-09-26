import { Redirect, Stack } from "expo-router";
import { useStore } from "@/lib/store";
import { color } from "@/ui";

// Onboarding is for new people. Once onboarded, any way back into it (browser back, an old link)
// lands on Today instead of restarting day one.
export default function WelcomeLayout() {
  const { saved } = useStore();
  if (saved.settings.onboarded) return <Redirect href="/today" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.cream } }} />;
}
