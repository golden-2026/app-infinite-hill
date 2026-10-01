import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { doorLabel, t } from "@/i18n";
import { BELIEF_QUESTIONS, PARTNER_SKIPS, PERSON, PRACTICE_MODE_Q } from "@/content/intake";
import { commitmentScore, type Openness } from "@/lib/profile";
import { asksPracticeMode, profileFor, youAnswers } from "@/lib/onboard";
import { doorParam } from "@/lib/door-param";
import { useStore } from "@/lib/store";
import { Btn, Eyebrow, Link, Opt, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// About you and your tradition: how it sits in your life, and whether other traditions should ever come up.
// One question at a time. Answers stay on the device (and in your own synced settings when signed in).
export default function Belief() {
  useEffect(() => { track("onboard_step", { step: "belief" }); }, []);
  useTitle(t("onboarding.you.title"));
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw) !== "SPIRITUAL" ? doorParam(raw) : null;
  const { update, saved, today } = useStore();
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  useEffect(() => { if (!door) router.replace("/welcome/door"); }, [door]);
  // "try the practices, or just learn?": last, once, and never for someone who told us they practice a faith.
  // Fixed when the screen opens, so saving the answer doesn't shorten the list under the last question.
  const [askMode] = useState(() => {
    const p0 = door ? profileFor(saved.settings.profile, door, today) : null;
    return !!p0 && asksPracticeMode(youAnswers(p0).stance) && p0.answers.practiceMode == null;
  });
  // "what brings you" already answered (on the website's picker, carried by profileFor): not asked again.
  // Fixed when the screen opens, like askMode.
  const [whyKnown] = useState(() => !!door && typeof profileFor(saved.settings.profile, door, today).answers.why === "string");
  if (!door) return null;
  const name = doorLabel(door);
  const base = profileFor(saved.settings.profile, door, today);
  const you = youAnswers(base);
  // Already told us they grew up in it, or that they practise it (first step): don't ask "were you raised …?" right
  // after. For someone who practises it the answer is only "since I was little" or "later", and both count the same.
  // Learning a partner's or family's faith: "what brings you" and "were you raised" were answered on the first step.
  const learningThis = you.stance === "partner" && you.learning === door;
  const qs = [...BELIEF_QUESTIONS, ...(askMode ? [PRACTICE_MODE_Q] : [])]
    .filter((x) => !(x.id === "raised" && you.raisedIn === door))
    .filter((x) => !(x.id === "why" && whyKnown))
    .filter((x) => !(learningThis && PARTNER_SKIPS.includes(x.id)));
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
    <WelcomeFrame step={5} door={door} onBack={() => (i > 0 ? (setI(i - 1), true) : false)} footer={q.optional ? <Btn kind="ghost" onPress={() => pick(null)}>{t("onboarding.ratherNot")}</Btn> : undefined}>
      <Eyebrow style={{ textAlign: "center" }}>{t("onboarding.belief.eyebrow", { n: i + 1, total: qs.length })}</Eyebrow>
      <Host>{fill(q.ask)}</Host>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {q.choices.map((c) => <Opt key={c.id} big testID={`${q.id}-${c.id}`} on={answers[q.id] === c.id} onPress={() => pick(c.id)}>{fill(c.label)}</Opt>)}
      </View>
      {q.note ? <Text style={[type.caption(), { textAlign: "center" }]}>{q.note}</Text> : null}
      {i > 0 ? <View style={{ alignItems: "center" }}><Link onPress={() => setI(i - 1)}>{t("onboarding.prevQuestion")}</Link></View> : null}
    </WelcomeFrame>
  );
}
