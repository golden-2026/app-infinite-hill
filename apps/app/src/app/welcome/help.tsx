import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { useStore } from "@/lib/store";
import { t } from "@/i18n";
import { Btn, ChoiceRow, Eyebrow, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// For seekers (no religion, exploring more than one, spiritual not religious: welcome/you): no religion to pick, just
// what would help. Their own answer decides where they start (owner, 2026-10-08):
//   help with something  → a course (content/courses.ts): seven days on one need, one tradition a day
//   a daily practice     → simply spiritual, the usual way in (belief, fit, ready)
//   a taste of each path → the sampler week (content/sampler.ts), on simply spiritual as home
//   not sure             → every door (welcome/door)
export default function Help() {
  useEffect(() => { track("onboard_step", { step: "help" }); }, []);
  useTitle(t("courses.help.ask"));
  const { update, today } = useStore();
  const course = () => router.push("/welcome/courses");
  const daily = () => router.push({ pathname: "/welcome/belief", params: { door: "SPIRITUAL" } });
  const taste = () => {
    // the page first, then the save (saving "onboarded" sends the welcome screens to Today), as welcome/ready does
    router.replace("/sampler");
    update({ onboarded: true, homeWing: "SPIRITUAL", active: "home", sampler: { on: today } });
  };
  return (
    <WelcomeFrame step={2} footer={<Btn testID="help-unsure" kind="ghost" onPress={() => router.push("/welcome/door")}>{t("courses.help.unsure")}</Btn>}>
      <Eyebrow style={{ textAlign: "center" }}>{t("courses.help.eyebrow")}</Eyebrow>
      <Host pose="heart">{t("courses.help.ask")}</Host>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        <ChoiceRow testID="help-course" onPress={course}>{t("courses.help.course")}</ChoiceRow>
        <ChoiceRow testID="help-daily" onPress={daily}>{t("courses.help.daily")}</ChoiceRow>
        <ChoiceRow testID="help-taste" onPress={taste}>{t("courses.help.taste")}</ChoiceRow>
      </View>
      <Text style={[type.caption(), { textAlign: "center" }]}>{t("courses.help.note")}</Text>
    </WelcomeFrame>
  );
}
