import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import { Text, View } from "react-native";
import { data } from "@ih/content";
import { useStore } from "@/lib/store";
import { Btn, Opt, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

export default function Moment() {
  useEffect(() => { track("onboard_step", { step: "moment" }); }, []);
  useTitle("welcome");
  const { update } = useStore();
  const [moment, setMoment] = useState<string | null>(null);
  return (
    <WelcomeFrame step={1} footer={<Btn disabled={!moment} onPress={() => { update({ reason: moment }); router.push({ pathname: "/welcome/tonight", params: { moment: moment! } }); }}>Continue</Btn>}>
      <Host>What brought you tonight?</Host>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {data.MOMENTS.map(([id, l]: [string, string]) => <Opt key={id} big testID={`moment-${id}`} on={moment === id} onPress={() => setMoment(id)}>{l}</Opt>)}
      </View>
      <Text style={[type.caption(), { textAlign: "center" }]}>we'll pick tonight's door for it. no wrong door — change any time.</Text>
    </WelcomeFrame>
  );
}
