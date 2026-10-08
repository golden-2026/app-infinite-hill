import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { COURSES, courseById, say } from "@/content/courses";
import { useStore } from "@/lib/store";
import { t } from "@/i18n";
import { Btn, ChoiceRow, Eyebrow, Link } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// A seeker picks a course (content/courses.ts) on the way in: each one named by the question it answers. Starting it
// finishes the welcome with simply spiritual as home (its daily path waits on Today, underneath the course) and opens
// the course's page, day 1 one tap away.
export default function PickCourse() {
  useEffect(() => { track("onboard_step", { step: "courses" }); }, []);
  useTitle(t("courses.pick.eyebrow"));
  const { update, today } = useStore();
  const [pick, setPick] = useState<string | null>(null);
  const c = courseById(pick);
  const start = () => {
    if (!c) return;
    // the page first, then the save (saving "onboarded" sends the welcome screens to Today), as welcome/ready does
    router.replace({ pathname: "/course/[id]", params: { id: c.id } });
    update({ onboarded: true, homeWing: "SPIRITUAL", active: "home", course: { id: c.id, on: today } });
  };
  return (
    <WelcomeFrame step={3} footer={<Btn testID="course-start" kind="gold" disabled={!c} onPress={start}>{c ? t("courses.pick.start", { title: say(c.title) }) : t("courses.pick.choose")}</Btn>}>
      <Eyebrow style={{ textAlign: "center" }}>{t("courses.pick.eyebrow")}</Eyebrow>
      <Host pose="wave">{t("courses.pick.host")}</Host>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {COURSES.map((x) => <ChoiceRow key={x.id} testID={`course-${x.id}`} on={pick === x.id} sub={say(x.ask)} onPress={() => setPick(x.id)}>{say(x.title)}</ChoiceRow>)}
      </View>
      <View style={{ alignItems: "center" }}><Link onPress={() => router.push({ pathname: "/welcome/belief", params: { door: "SPIRITUAL" } })}>{t("courses.pick.daily")}</Link></View>
    </WelcomeFrame>
  );
}
