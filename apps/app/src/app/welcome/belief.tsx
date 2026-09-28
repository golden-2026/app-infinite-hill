import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { DOORS, label } from "@ih/content";
import { BELIEF_QUESTIONS, PERSON } from "@/content/intake";
import { commitmentScore, emptyProfile, type Openness } from "@/lib/profile";
import { doorParam } from "@/lib/door-param";
import { useStore } from "@/lib/store";
import { Btn, Eyebrow, Link, Opt, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// About you and your tradition: how it sits in your life, and whether other traditions should ever come up.
// One question at a time. Answers stay on the device (and in your own synced settings when signed in).
export default function Belief() {
  useEffect(() => { track("onboard_step", { step: "belief" }); }, []);
  useTitle("about you");
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw) !== "SPIRITUAL" ? doorParam(raw) : null;
  const { update, saved, today } = useStore();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  useEffect(() => { if (!door) router.replace("/welcome/door"); }, [door]);
  if (!door) return null;
  const name = label(door);
  const q = BELIEF_QUESTIONS[i];
  const fill = (s: string) => s.replace(/\{door\}/g, name).replace(/\{person\}/g, PERSON[door] || name);

  const save = (all: Record<string, string>) => {
    const prev = saved.settings.profile?.door === door ? saved.settings.profile : emptyProfile(door, today);
    const openness = (["stay", "sometimes", "love"].includes(all.openness) ? all.openness : "sometimes") as Openness;
    update({ profile: { ...prev, answers: { ...prev.answers, ...all }, commitment: commitmentScore(all), openness } });
    router.push({ pathname: "/welcome/fit", params: { door } });
  };
  const pick = (id: string | null) => {
    const all = id ? { ...answers, [q.id]: id } : answers;
    setAnswers(all);
    if (i + 1 < BELIEF_QUESTIONS.length) setI(i + 1);
    else save(all);
  };

  return (
    <WelcomeFrame step={3} door={door} footer={q.optional ? <Btn kind="ghost" onPress={() => pick(null)}>rather not say</Btn> : undefined}>
      <Eyebrow style={{ textAlign: "center" }}>{`about you · ${i + 1} of ${BELIEF_QUESTIONS.length}`}</Eyebrow>
      <Host>{fill(q.ask)}</Host>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {q.choices.map((c) => <Opt key={c.id} big testID={`${q.id}-${c.id}`} on={answers[q.id] === c.id} onPress={() => pick(c.id)}>{fill(c.label)}</Opt>)}
      </View>
      {q.note ? <Text style={[type.caption(), { textAlign: "center" }]}>{q.note}</Text> : null}
      {i > 0 ? <View style={{ alignItems: "center" }}><Link onPress={() => setI(i - 1)}>‹ previous question</Link></View> : null}
    </WelcomeFrame>
  );
}
