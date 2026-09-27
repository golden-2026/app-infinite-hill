import { track } from "@/lib/analytics";
import { doorParam } from "@/lib/door-param";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { useStore } from "@/lib/store";
import { Eyebrow, Guy, type } from "@/ui";
import { WelcomeFrame } from "@/ui/welcome-frame";

// v175 step 8: one breath of framing, then day one opens on its own.
export default function Ready() {
  useEffect(() => { track("onboard_step", { step: "ready" }); }, []);
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw) || "SPIRITUAL"; // unknown doors in a URL never get saved
  const { update } = useStore();
  useEffect(() => {
    const t = setTimeout(() => {
      // straight into day one; finishing or leaving the lesson lands on Today
      router.replace({ pathname: "/session/[door]/[day]", params: { door, day: "1" } });
      update({ onboarded: true, homeWing: door, active: "home" });
    }, 2400);
    return () => clearTimeout(t);
  }, [door, update]);
  return (
    <WelcomeFrame step={6} door={door}>
      <View style={{ alignItems: "center", gap: 18 }}>
        <Guy pose="path" h={180} />
        <Text style={[type.h1(24), { textAlign: "center", maxWidth: 280 }]}>
          It's hard to stay with anything.{"\n"}
          <Text style={{ fontFamily: "Manrope_500Medium", fontStyle: "italic" }}>So infinite hill gives you one moment a day, and a lot of company.</Text>
        </Text>
        <Text style={[type.caption(), { textAlign: "center" }]}>did you know · every tradition on earth arrived at the golden rule on its own</Text>
      </View>
    </WelcomeFrame>
  );
}
