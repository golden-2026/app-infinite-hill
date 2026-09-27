import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { icon } from "@ih/content";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useDone } from "@/lib/done";
import { useStore } from "@/lib/store";
import { accountsOn } from "@/lib/supabase";
import { Bubble, Btn, Screen, Sun, color, font, type } from "@/ui";

// v175 PostLesson step 3: pick a number to aim at. Stored (v175 threw it away). "not yet" is a real answer.
export default function Goal() {
  useTitle("your goal");
  const { p, go, close } = useDone();
  const notYet = () => { track("goal_set", { days: 0 }); setGoal("not_yet"); go(accountsOn() ? "/done/save" : "/done/remind"); };
  const { setGoal } = useStore();
  const [goal, setG] = useState<number | null>(null);
  const ic = icon(p.door);
  // No rewards promised that don't exist yet (a note from a voice, a Keeper's message): just what you'll have.
  const opts: [number, string, string][] = [[7, "a week", "seven words you can use in a sentence."], [21, "camp one", "a whole camp: 21 words, and the oldest prayer by heart."], [100, "the beginning", "a hundred quiet minutes with your own mind."]];
  return (
    <Screen close={close} footer={<>
        <Btn testID="goal-go" disabled={!goal} onPress={() => { track("goal_set", { days: goal! }); setGoal(goal!); go(accountsOn() ? "/done/save" : "/done/remind"); }}>{goal ? `${goal} days. bet.` : "pick one above"}</Btn>
        <Btn kind="ghost" onPress={notYet}>not yet</Btn>
      </>}>
      <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}><Sun size={56} /><Bubble>pick a number to aim at. miss a day, nothing happens — days are free here.</Bubble></View>
        <Text accessibilityRole="header" style={type.title()}>how far this time?</Text>
        <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
          {opts.map(([n, t, b]) => (
            <Pressable key={n} testID={`goal-${n}`} accessibilityRole="radio" accessibilityState={{ checked: goal === n }} aria-checked={goal === n} accessibilityLabel={`${n} days, ${t}`} onPress={() => setG(n)}
              style={{ borderWidth: 1.5, borderColor: goal === n ? color.ink : color.line, backgroundColor: goal === n ? color.gold : "#fff", borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", gap: 14, alignItems: "center" }}>
              <Text style={{ fontFamily: font.display[800], fontSize: 30, width: 56, color: color.ink }}>{n}</Text>
              <View style={{ flex: 1 }}><Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink }}>{t}</Text><Text style={[type.body(12.5), { marginTop: 2 }]}>{b}</Text></View>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
