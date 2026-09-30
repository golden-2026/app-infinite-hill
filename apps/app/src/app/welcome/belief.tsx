import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { DOORS, label } from "@ih/content";
import { BELIEF_QUESTIONS, PERSON } from "@/content/intake";
import { commitmentScore, type Openness } from "@/lib/profile";
import { profileFor, youAnswers } from "@/lib/onboard";
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
  const base = profileFor(saved.settings.profile, door, today);
  const you = youAnswers(base);
  // Already told us they grew up in it (first step): don't ask "were you raised …?" again.
  // Learning a partner's or family's faith: "what brings you" and "were you raised" were answered on the first step.
  const learningThis = you.stance === "partner" && you.learning === door;
  const qs = BELIEF_QUESTIONS.filter((x) => !(x.id === "raised" && you.raisedIn === door && you.stance !== "practice"))
    .filter((x) => !(learningThis && (x.id === "why" || x.id === "raised")));
  const q = qs[i];
  const fill = (s: string) => s.replace(/\{door\}/g, name).replace(/\{person\}/g, PERSON[door] || name);

  const save = (all: Record<string, string>) => {
    const prev = base;
    const openness = (["stay", "sometimes", "love"].includes(all.openness) ? all.openness : "stay") as Openness; // skipped: other traditions never come up
    update({ profile: { ...prev, answers: { ...prev.answers, ...all }, commitment: commitmentScore({ ...prev.answers, ...all }), openness } });
    router.push({ pathname: "/welcome/fit", params: { door } });
  };
  const pick = (id: string | null) => {
    const all = id ? { ...answers, [q.id]: id } : answers;
    setAnswers(all);
    if (i + 1 < qs.length) setI(i + 1);
    else save(all);
  };

  return (
    <WelcomeFrame step={5} door={door} onBack={() => (i > 0 ? (setI(i - 1), true) : false)} footer={q.optional ? <Btn kind="ghost" onPress={() => pick(null)}>rather not say</Btn> : undefined}>
      <Eyebrow style={{ textAlign: "center" }}>{`about you · ${i + 1} of ${qs.length}`}</Eyebrow>
      <Host>{fill(q.ask)}</Host>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {q.choices.map((c) => <Opt key={c.id} big testID={`${q.id}-${c.id}`} on={answers[q.id] === c.id} onPress={() => pick(c.id)}>{fill(c.label)}</Opt>)}
      </View>
      {q.note ? <Text style={[type.caption(), { textAlign: "center" }]}>{q.note}</Text> : null}
      {i > 0 ? <View style={{ alignItems: "center" }}><Link onPress={() => setI(i - 1)}>‹ previous question</Link></View> : null}
    </WelcomeFrame>
  );
}
