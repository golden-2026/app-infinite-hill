import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { HEARD_Q } from "@/content/intake";
import { pendingProfile, youAnswers } from "@/lib/onboard";
import { useStore } from "@/lib/store";
import { t } from "@/i18n";
import { Btn, Eyebrow, Opt, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// "How did you hear about us?": one tap or skip, once, between the first step and the doors. Kept on the profile as
// answers.heardFrom ("skip" when skipped, so it's never asked again). Only the choice goes to analytics, as its own
// opt-in event (track() sends nothing without a yes): never with the door or any belief answer.
export default function Heard() {
  useEffect(() => { track("onboard_step", { step: "heard" }); }, []);
  useTitle(t("onboarding.heard.title"));
  const { update, saved, today } = useStore();
  const p = saved.settings.profile;
  const asked = typeof p?.answers.heardFrom === "string";
  useEffect(() => { if (asked) router.replace("/welcome/door"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const pick = (id: string | null) => {
    const heardFrom = id || "skip";
    if (p && p.door) update({ profile: { ...p, answers: { ...p.answers, heardFrom } } });
    else { const y = youAnswers(p); update({ profile: pendingProfile(today, y.stance, y.raisedIn, y.learning, heardFrom) }); }
    if (id) track("heard_from", { choice: id });
    router.push("/welcome/door");
  };
  return (
    <WelcomeFrame step={1} footer={<Btn kind="ghost" testID="heardFrom-skip" onPress={() => pick(null)}>{t("onboarding.heard.skip")}</Btn>}>
      <Eyebrow style={{ textAlign: "center" }}>{t("onboarding.heard.eyebrow")}</Eyebrow>
      <Host pose="wave">{HEARD_Q.ask}</Host>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {HEARD_Q.choices.map((c) => <Opt key={c.id} testID={`heardFrom-${c.id}`} on={false} onPress={() => pick(c.id)}>{c.label}</Opt>)}
      </View>
      {HEARD_Q.note ? <Text style={[type.caption(), { textAlign: "center" }]}>{HEARD_Q.note}</Text> : null}
    </WelcomeFrame>
  );
}
