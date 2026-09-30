import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useDone } from "@/lib/done";
import { useStore } from "@/lib/store";
import { STREAK_RULE } from "@/lib/streak";
import { accountsOn } from "@/lib/supabase";
import { Bubble, Btn, Guy, Screen, color, font, type } from "@/ui";

// After the first lesson: pick a streak goal. Nothing is preselected; "not now" is a real answer, and it gets one
// smaller offer (3 days) before we let it be. Progress shows on the streak screen; hitting it offers the next one.
export default function Goal() {
  useTitle("your goal");
  const { go, close } = useDone();
  const { setGoal, saved } = useStore();
  const [goal, setG] = useState<number | null>(null);
  const [small, setSmall] = useState(false); // the one-time "how about 3 days?"
  const then = () => go(accountsOn() ? "/done/save" : "/done/remind");
  const commit = (n: number) => { track("goal_set", { days: n }); setGoal(n); then(); };
  const notNow = () => {
    if (!small && !saved.settings.goal?.offered3) { setSmall(true); return; }
    track("goal_set", { days: 0 });
    setGoal("not_yet");
    then();
  };
  const opts: [number, string][] = [[7, "a week"], [14, "two weeks"], [30, "a month"]];

  if (small) {
    return (
      <Screen close={close} footer={<>
          <Btn testID="goal-3" onPress={() => commit(3)}>3 days. i'm in.</Btn>
          <Btn testID="goal-no" kind="ghost" onPress={notNow}>not now</Btn>
        </>}>
        <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
          <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}><Guy pose="think" h={96} /><Bubble>totally fair. how about something small? three days in a row, just to see how it feels.</Bubble></View>
          <Text accessibilityRole="header" style={type.title()}>just 3 days?</Text>
        </View>
      </Screen>
    );
  }
  return (
    <Screen close={close} footer={<>
        <Btn testID="goal-go" disabled={!goal} onPress={() => commit(goal!)}>{goal ? "commit to my goal" : "pick one above"}</Btn>
        <Btn testID="goal-later" kind="ghost" onPress={notNow}>not now</Btn>
      </>}>
      <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}><Guy pose="cheer" h={96} /><Bubble>{`nice start. want a streak goal? ${STREAK_RULE}`}</Bubble></View>
        <Text accessibilityRole="header" style={type.title()}>pick a goal.</Text>
        <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
          {opts.map(([n, t]) => (
            <Pressable key={n} testID={`goal-${n}`} accessibilityRole="radio" accessibilityState={{ checked: goal === n }} aria-checked={goal === n} accessibilityLabel={`${n} days, ${t}`} onPress={() => setG(n)}
              style={{ borderWidth: 1.5, borderColor: goal === n ? color.ink : color.line, backgroundColor: goal === n ? color.gold : "#fff", borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", gap: 14, alignItems: "center" }}>
              <Text style={{ fontFamily: font.display[800], fontSize: 30, width: 56, color: color.ink }}>{n}</Text>
              <Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink, flex: 1 }}>{`days · ${t}`}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
