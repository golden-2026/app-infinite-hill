import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useDone } from "@/lib/done";
import { useStore } from "@/lib/store";
import { streakRule } from "@/lib/streak";
import { t } from "@/i18n";
import { accountsOn } from "@/lib/supabase";
import { Bubble, Btn, Guy, Screen, color, font, type } from "@/ui";

// After the first lesson: pick a streak goal. Nothing is preselected; "not now" is a real answer, and it gets one
// smaller offer (3 days) before we let it be. Progress shows on the streak screen; hitting it offers the next one.
export default function Goal() {
  useTitle(t("session.goal.title"));
  const { go, close } = useDone();
  const { setGoal, saved } = useStore();
  const [goal, setG] = useState<number | null>(null);
  const [small, setSmall] = useState(false); // the one-time "how about 3 days?"
  const then = () => go(accountsOn() ? "/done/save" : "/done/tomorrow");
  const commit = (n: number) => { track("goal_set", { days: n }); setGoal(n); then(); };
  const notNow = () => {
    if (!small && !saved.settings.goal?.offered3) { setSmall(true); return; }
    track("goal_set", { days: 0 });
    setGoal("not_yet");
    then();
  };
  const opts: [number, string][] = [[7, t("session.goal.week")], [14, t("session.goal.twoWeeks")], [30, t("session.goal.month")]];

  if (small) {
    return (
      <Screen close={close} footer={<>
          <Btn testID="goal-3" onPress={() => commit(3)}>{t("session.goal.three")}</Btn>
          <Btn testID="goal-no" kind="ghost" onPress={notNow}>{t("session.notNow")}</Btn>
        </>}>
        <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
          <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}><Guy pose="think" h={96} /><Bubble>{t("session.goal.smallBubble")}</Bubble></View>
          <Text accessibilityRole="header" style={type.title()}>{t("session.goal.just3")}</Text>
        </View>
      </Screen>
    );
  }
  return (
    <Screen close={close} footer={<>
        <Btn testID="goal-go" disabled={!goal} onPress={() => commit(goal!)}>{goal ? t("session.goal.commit") : t("session.goal.pick")}</Btn>
        <Btn testID="goal-later" kind="ghost" onPress={notNow}>{t("session.notNow")}</Btn>
      </>}>
      <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}><Guy pose="cheer" h={96} /><Bubble>{t("session.goal.bubble", { rule: streakRule() })}</Bubble></View>
        <Text accessibilityRole="header" style={type.title()}>{t("session.goal.pickTitle")}</Text>
        <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
          {opts.map(([n, span]) => (
            <Pressable key={n} testID={`goal-${n}`} accessibilityRole="radio" accessibilityState={{ checked: goal === n }} aria-checked={goal === n} accessibilityLabel={t("session.goal.optA11y", { n, t: span })} onPress={() => setG(n)}
              style={{ borderWidth: 1.5, borderColor: goal === n ? color.ink : color.line, backgroundColor: goal === n ? color.gold : "#fff", borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", gap: 14, alignItems: "center" }}>
              <Text style={{ fontFamily: font.display[800], fontSize: 30, width: 56, color: color.ink }}>{n}</Text>
              <Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink, flex: 1 }}>{t("session.goal.opt", { t: span })}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
