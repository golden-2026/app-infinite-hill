import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text } from "react-native";
import { doorLabel, t } from "@/i18n";
import { doorParam } from "@/lib/door-param";
import { Btn, type } from "@/ui";
import { Host } from "@/ui/host";
import { TrailDay, TrailMap } from "@/ui/trail-map";
import { WelcomeFrame } from "@/ui/welcome-frame";

// Right after picking a door: the whole climb, summit first — so people know what's at the top before they start.
export default function WelcomeTrail() {
  useEffect(() => { track("onboard_step", { step: "trail" }); }, []);
  useTitle(t("onboarding.trail.title"));
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw);
  useEffect(() => { if (!door) router.replace("/welcome/door"); }, [door]);
  if (!door) return null;
  const own = door === "SPIRITUAL";
  const name = own ? t("onboarding.trail.ownName") : t("onboarding.trail.doorName", { door: doorLabel(door) });
  const next = () => router.push(own ? "/welcome/intake" : { pathname: "/welcome/know", params: { door } });
  return (
    <WelcomeFrame step={3} door={door} footer={<Btn testID="trail-continue" onPress={next}>{t("onboarding.trail.start")}</Btn>}>
      <Host pose="climb">{t("onboarding.trail.host", { name })}</Host>
      <TrailMap door={door} day={1} walked={0} />
      <TrailDay />
      <Text style={[type.caption(), { textAlign: "center" }]}>
        {t("onboarding.trail.caption")}
      </Text>
    </WelcomeFrame>
  );
}
