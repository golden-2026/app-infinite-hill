import { track } from "@/lib/analytics";
import { doorParam } from "@/lib/door-param";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { useStore } from "@/lib/store";
import { dueAtStart, emptyWellbeing } from "@/lib/wellbeing";
import { t } from "@/i18n";
import { Eyebrow, Guy, type } from "@/ui";
import { WelcomeFrame } from "@/ui/welcome-frame";

// v175 step 8: one breath of framing, then the first lesson opens on its own: day one, or where the check placed them
// (day 22, when they chose to skip camp one).
export default function Ready() {
  useEffect(() => { track("onboard_step", { step: "ready" }); }, []);
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw) || "SPIRITUAL"; // unknown doors in a URL never get saved
  const { update, saved } = useStore();
  const start = saved.settings.placed?.[door] ?? 1;
  const baseline = dueAtStart(saved.settings.wellbeing || emptyWellbeing()); // the 30-second check-in, once, before day one
  useEffect(() => {
    const t = setTimeout(() => {
      // straight into the first lesson (after the optional baseline check-in); finishing or leaving it lands on Today
      if (baseline) router.replace({ pathname: "/wellbeing", params: { m: String(baseline), door, day: String(start) } });
      else router.replace({ pathname: "/session/[door]/[day]", params: { door, day: String(start) } });
      update({ onboarded: true, homeWing: door, active: "home" });
    }, 2400);
    return () => clearTimeout(t);
  }, [door, update, start, baseline]);
  return (
    <WelcomeFrame step={8} door={door}>
      <View style={{ alignItems: "center", gap: 18 }}>
        <Guy pose="path" h={180} />
        <Text style={[type.h1(24), { textAlign: "center", maxWidth: 280 }]}>
          {t("onboarding.ready.hard")}{"\n"}
          <Text style={{ fontFamily: "Manrope_500Medium", fontStyle: "italic" }}>{t("onboarding.ready.so")}</Text>
        </Text>
        <Text style={[type.caption(), { textAlign: "center" }]}>{t("onboarding.ready.fact")}</Text>
      </View>
    </WelcomeFrame>
  );
}
