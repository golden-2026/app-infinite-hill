import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { STANCE_Q, raisedInQ } from "@/content/intake";
import { pendingProfile, youAnswers, type Stance } from "@/lib/onboard";
import { useStore } from "@/lib/store";
import { whyParam } from "@/lib/why-param";
import { afterYou, laneFor } from "@/lib/lane";
import { t } from "@/i18n";
import { tg, type GentleKey } from "@/lib/gentle-t";
import { Btn, ChoiceRow, Eyebrow, Link, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// Before the doors: one or two warm questions so the door screen can show each person the right way in —
// their own tradition first, roots-with-fresh-eyes beside "my own path", or "my own path" up front. It never picks
// a door for anyone; every door stays open. Answers stay on the device (belief data: never sent to analytics).
// Someone who came from the website's "which one sounds like you?" is met first (gentle.hello.<why>): warm first,
// then the question. Learning a partner's faith ("partner") skips straight to "which faith are you learning?".
export default function You() {
  useEffect(() => { track("onboard_step", { step: "you" }); }, []);
  useTitle(t("onboarding.you.title"));
  const { update, saved, today } = useStore();
  const before = youAnswers(saved.settings.profile);
  // ?why= from the website's "which one sounds like you?": a "what brings you" answer is kept for the door,
  // "spiritual" answers this first question (so it's skipped), "partner" answers it too ("learning my partner's faith")
  const fromSite = whyParam(useLocalSearchParams<{ why?: string }>().why);
  const preset: Stance | null = fromSite.stance ?? (fromSite.why === "partner" ? "partner" : null);
  const [stance, setStance] = useState<Stance | null>(preset ?? before.stance);
  const first = preset ? 1 : 0;
  const [step, setStep] = useState(first);
  const q = step === 0 ? STANCE_Q : raisedInQ(stance);
  const helloKey = fromSite.stance === "spiritual" ? "spiritual" : fromSite.why;
  const hello = helloKey && step === first ? tg(`gentle.hello.${helloKey}` as GentleKey) : null;
  const lane = laneFor(fromSite.why);
  const pose = lane === "gentle" ? "sitrock" : fromSite.why === "baby" || fromSite.why === "wedding" ? "joy" : step === 0 ? "wave" : "think";

  const done = (s: Stance | null, raisedIn: string | null, learning: string | null = null) => {
    const heard = saved.settings.profile?.answers.heardFrom;
    const heardFrom = typeof heard === "string" ? heard : null;
    update({ profile: pendingProfile(today, s, raisedIn, learning, heardFrom, fromSite.why) });
    // "how did you hear about us?": once, right after this step; never again once answered or skipped, and never on
    // the gentle or quick ways in (lib/lane.ts)
    router.push(afterYou(fromSite.why, !!heardFrom));
  };
  const pick = (id: string | null) => {
    if (step === 0) {
      setStance(id as Stance | null);
      if (id) setStep(1);
      else done(null, null);
    } else if (stance === "partner") done(stance, null, id);
    else done(stance, id);
  };

  return (
    <WelcomeFrame step={1} onBack={() => (step > 0 ? (setStep(0), true) : false)} footer={<Btn kind="ghost" onPress={() => pick(null)}>{t("onboarding.ratherNot")}</Btn>}>
      <Eyebrow style={{ textAlign: "center" }}>{t("onboarding.you.eyebrow", { n: step + 1 })}</Eyebrow>
      <Host pose={pose}>{hello ? <><Text testID="hello">{hello}</Text>{"\n\n"}{q.ask}</> : q.ask}</Host>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {q.choices.map((c) => (
          <ChoiceRow key={c.id} testID={`${q.id}-${c.id}`} on={step === 0 ? stance === c.id : false} onPress={() => pick(c.id)}>{c.label}</ChoiceRow>
        ))}
      </View>
      {q.note ? <Text style={[type.caption(), { textAlign: "center" }]}>{q.note}</Text> : null}
      {step > 0 ? <View style={{ alignItems: "center" }}><Link onPress={() => setStep(0)}>{t("onboarding.prevQuestion")}</Link></View> : null}
    </WelcomeFrame>
  );
}
