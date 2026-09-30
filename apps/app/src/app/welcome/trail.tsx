import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text } from "react-native";
import { label } from "@ih/content";
import { doorParam } from "@/lib/door-param";
import { Btn, type } from "@/ui";
import { Host } from "@/ui/host";
import { TrailDay, TrailMap } from "@/ui/trail-map";
import { WelcomeFrame } from "@/ui/welcome-frame";

// Right after picking a door: the whole climb, summit first — so people know what's at the top before they start.
export default function WelcomeTrail() {
  useEffect(() => { track("onboard_step", { step: "trail" }); }, []);
  useTitle("the whole climb");
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw);
  useEffect(() => { if (!door) router.replace("/welcome/door"); }, [door]);
  if (!door) return null;
  const own = door === "SPIRITUAL";
  const name = own ? "your own path" : label(door);
  const next = () => router.push(own ? "/welcome/intake" : { pathname: "/welcome/know", params: { door } });
  return (
    <WelcomeFrame step={3} door={door} footer={<Btn testID="trail-continue" onPress={next}>Start the climb</Btn>}>
      <Host pose="climb">{`Here's the whole climb for ${name} — the summit's at the top, and day one is at the bottom. No rush: a few minutes a day gets you there.`}</Host>
      <TrailMap door={door} day={1} walked={0} />
      <TrailDay />
      <Text style={[type.caption(), { textAlign: "center" }]}>
        the whole climb, a few minutes a day. new lessons open as you walk.
      </Text>
    </WelcomeFrame>
  );
}
