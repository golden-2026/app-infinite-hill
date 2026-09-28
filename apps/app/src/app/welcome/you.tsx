import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { STANCE_Q, raisedInQ } from "@/content/intake";
import { pendingProfile, youAnswers, type Stance } from "@/lib/onboard";
import { useStore } from "@/lib/store";
import { Btn, Eyebrow, Link, Opt, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// Before the doors: one or two warm questions so the door screen can show each person the right way in —
// their own tradition first, roots-with-fresh-eyes beside "my own path", or "my own path" up front. It never picks
// a door for anyone; every door stays open. Answers stay on the device (belief data: never sent to analytics).
export default function You() {
  useEffect(() => { track("onboard_step", { step: "you" }); }, []);
  useTitle("about you");
  const { update, saved, today } = useStore();
  const before = youAnswers(saved.settings.profile);
  const [stance, setStance] = useState<Stance | null>(before.stance);
  const [step, setStep] = useState(0);
  const q = step === 0 ? STANCE_Q : raisedInQ(stance);

  const done = (s: Stance | null, raisedIn: string | null) => {
    update({ profile: pendingProfile(today, s, raisedIn) });
    router.push("/welcome/door");
  };
  const pick = (id: string | null) => {
    if (step === 0) {
      setStance(id as Stance | null);
      if (id) setStep(1);
      else done(null, null);
    } else done(stance, id);
  };

  return (
    <WelcomeFrame step={1} footer={<Btn kind="ghost" onPress={() => pick(null)}>rather not say</Btn>}>
      <Eyebrow style={{ textAlign: "center" }}>{`before the doors · ${step + 1} of 2`}</Eyebrow>
      <Host pose={step === 0 ? "wave" : "think"}>{q.ask}</Host>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {q.choices.map((c) => (
          <Opt key={c.id} big testID={`${q.id}-${c.id}`} on={step === 0 ? stance === c.id : false} onPress={() => pick(c.id)}>{c.label}</Opt>
        ))}
      </View>
      {q.note ? <Text style={[type.caption(), { textAlign: "center" }]}>{q.note}</Text> : null}
      {step > 0 ? <View style={{ alignItems: "center" }}><Link onPress={() => setStep(0)}>‹ previous question</Link></View> : null}
    </WelcomeFrame>
  );
}
