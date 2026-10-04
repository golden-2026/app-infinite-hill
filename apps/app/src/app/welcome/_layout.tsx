import { Redirect, Stack, useGlobalSearchParams, usePathname } from "expo-router";
import { useStore } from "@/lib/store";
import { useGate } from "@/lib/waitlist";
import { color } from "@/ui";

// Onboarding is for new people. Once onboarded, any way back into it (browser back, an old link)
// lands on Today instead of restarting day one. One exception: the placement check offered later (?later=1 on
// /welcome/know, from Today's first-week card for someone who came on a light way in, lib/lane.ts), and "how did you hear
// about us?" asked once after the first finished lesson (/welcome/heard?then=…, done/tomorrow).
// Invite-only launch: while the server's switch is on (api/waitlist.js), a new person who hasn't been let in by an
// invite goes to the waitlist instead. With the switch off (the default) or no server, nothing here changes.
export default function WelcomeLayout() {
  const { saved } = useStore();
  const g = useGate(!!saved.settings.onboarded);
  const path = usePathname();
  const { later, then } = useGlobalSearchParams<{ later?: string; then?: string }>();
  const placeLater = path === "/welcome/know" && later === "1";
  const heardAfter = path === "/welcome/heard" && !!then;
  if (saved.settings.onboarded && !placeLater && !heardAfter) return <Redirect href="/today" />;
  if (g === "waitlist" && !saved.settings.onboarded) return <Redirect href="/waitlist" />;
  // "asking" (the first read of the switch on this phone) shows the welcome as usual, so nothing waits on the server
  // while the switch is off; if the answer is "on", the redirect above follows a moment later.
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: color.cream } }} />;
}
