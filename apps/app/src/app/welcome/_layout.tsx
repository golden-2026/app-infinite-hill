import { Redirect, Stack } from "expo-router";
import { useStore } from "@/lib/store";
import { useGate } from "@/lib/waitlist";
import { color } from "@/ui";

// Onboarding is for new people. Once onboarded, any way back into it (browser back, an old link)
// lands on Today instead of restarting day one.
// Invite-only launch: while the server's switch is on (api/waitlist.js), a new person who hasn't been let in by an
// invite goes to the waitlist instead. With the switch off (the default) or no server, nothing here changes.
export default function WelcomeLayout() {
  const { saved } = useStore();
  const g = useGate(!!saved.settings.onboarded);
  if (saved.settings.onboarded) return <Redirect href="/today" />;
  if (g === "waitlist") return <Redirect href="/waitlist" />;
  // "asking" (the first read of the switch on this phone) shows the welcome as usual, so nothing waits on the server
  // while the switch is off; if the answer is "on", the redirect above follows a moment later.
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.cream } }} />;
}
