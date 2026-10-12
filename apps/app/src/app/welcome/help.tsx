import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { afterDoor } from "@/lib/lane";
import { profileFor } from "@/lib/onboard";
import { useStore } from "@/lib/store";
import { t } from "@/i18n";
import { Btn, ChoiceRow, Eyebrow, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// "Your own path, your way" (owner, 2026-10-09): Infinite Hill is "choose a religion to learn"; the one alternative is
// making your own path, Simply Spiritual. Picking it on the door screen comes here, and they choose how to walk it:
//   a little every day   → the Simply Spiritual path, step by step (the usual way on: intake or the voice, then day 1)
//   something on my mind → a seven-day course (content/courses.ts), inside this path
//   wander               → the sampler week (content/sampler.ts): a different tradition each day
// Courses and wandering live only here; the seven religion paths stay clean. Light, and all theirs to switch.
export default function Help() {
  useEffect(() => { track("onboard_step", { step: "help" }); }, []);
  useTitle(t("courses.help.ask"));
  const { update, saved, today } = useStore();
  const why = saved.settings.profile?.answers.why;
  // the daily path: the same way on as picking "my own path" always had
  const daily = () => {
    const next = afterDoor(why);
    if (next === "check") return router.push("/welcome/intake");
    update({ profile: profileFor(saved.settings.profile, "SPIRITUAL", today) });
    router.push({ pathname: "/welcome/ready", params: { door: "SPIRITUAL" } });
  };
  const course = () => router.push("/welcome/courses");
  const wander = () => {
    // the page first, then the save (saving "onboarded" sends the welcome screens to Today), as welcome/ready does
    router.replace("/sampler");
    update({ onboarded: true, homeWing: "SPIRITUAL", active: "home", sampler: { on: today }, profile: profileFor(saved.settings.profile, "SPIRITUAL", today) });
  };
  return (
    <WelcomeFrame step={3} door="SPIRITUAL" footer={<Btn testID="help-religion" kind="ghost" onPress={() => router.back()}>{t("courses.help.unsure")}</Btn>}>
      <Eyebrow style={{ textAlign: "center" }}>{t("courses.help.eyebrow")}</Eyebrow>
      <Host pose="heart">{t("courses.help.ask")}</Host>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        <ChoiceRow testID="help-daily" sub={t("courses.help.dailySub")} onPress={daily}>{t("courses.help.daily")}</ChoiceRow>
        <ChoiceRow testID="help-course" sub={t("courses.help.courseSub")} onPress={course}>{t("courses.help.course")}</ChoiceRow>
        <ChoiceRow testID="help-taste" sub={t("courses.help.tasteSub")} onPress={wander}>{t("courses.help.taste")}</ChoiceRow>
      </View>
      <Text style={[type.caption(), { textAlign: "center" }]}>{t("courses.help.note")}</Text>
    </WelcomeFrame>
  );
}
