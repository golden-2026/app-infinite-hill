import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { EXCLUSIVE, intakeReply, nextIntake } from "@/content/intake";
import { asksPracticeMode, profileFor, youAnswers } from "@/lib/onboard";
import { useStore } from "@/lib/store";
import { t } from "@/i18n";
import { Btn, ChoiceRow, Eyebrow, Link, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// "my own path": no single religion. Get to know the person one question at a time — where they came from, what
// turned them off or on, what they believe, how they are lately, what sounds good — then suggest a few things
// from different traditions. Never asks them to choose a religion.
type Answers = Record<string, string | string[]>;

export default function Intake() {
  useEffect(() => { track("onboard_step", { step: "intake" }); }, []);
  useTitle(t("onboarding.intake.title"));
  const { update, saved, today } = useStore();
  // What the first step already told us (which tradition, how they feel about it) is not asked again.
  const [answers, setAnswers] = useState<Answers>(() => {
    const a = profileFor(saved.settings.profile, "SPIRITUAL", today).answers;
    const seeded: Answers = {};
    for (const k of ["raised", "feelNow"]) if (a[k] != null) seeded[k] = a[k];
    return seeded;
  });
  const [history, setHistory] = useState<string[]>([]);
  const [multi, setMulti] = useState<string[]>([]);
  const [reply, setReply] = useState<string | null>(null);
  const [was, setWas] = useState<Answers>({}); // answers given before stepping back
  // "try the practices, or just learn?" ends the intake, once, for anyone who didn't say they practice a faith
  const [askMode] = useState(() => { const p = saved.settings.profile; return asksPracticeMode(youAnswers(p).stance) && p?.answers.practiceMode == null; });
  const q = nextIntake(answers, { askMode });

  useEffect(() => {
    if (q) return;
    const prev = profileFor(saved.settings.profile, "SPIRITUAL", today);
    update({ profile: { ...prev, answers: { ...prev.answers, ...answers } } });
    router.replace("/welcome/suggest");
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!q) return null;

  const commit = (a: string | string[] | null) => {
    const next = { ...answers, [q.id]: a ?? "skipped" };
    setAnswers(next);
    setHistory((h) => [...h, q.id]);
    setMulti([]);
    setReply(a ? intakeReply(q.id, a) : null);
  };
  const back = () => {
    const last = history[history.length - 1];
    if (!last) return router.back();
    const next = { ...answers };
    const was = next[last];
    delete next[last];
    setAnswers(next);
    setHistory((h) => h.slice(0, -1));
    // stepping back keeps what they picked: it shows as chosen, ready to keep or change
    setWas((w) => ({ ...w, [last]: was }));
    setMulti(Array.isArray(was) ? was : []);
    setReply(null);
  };
  const asked = history.length + 1;
  const footer = q.multi
    ? <Btn disabled={!multi.length} onPress={() => commit(multi)}>{multi.length ? t("onboarding.intake.thatsMe") : t("onboarding.intake.pickAny")}</Btn>
    : q.optional ? <Btn kind="ghost" onPress={() => commit(null)}>{t("onboarding.ratherNot")}</Btn> : undefined;
  return (
    <WelcomeFrame step={4 + Math.min(1.5, history.length / 4)} door="SPIRITUAL" footer={footer} onBack={() => (history.length ? (back(), true) : false)}>
      <Eyebrow style={{ textAlign: "center" }}>{t("onboarding.intake.eyebrow", { n: asked })}</Eyebrow>
      {reply ? <Text style={[type.body(14), { textAlign: "center", fontStyle: "italic" }]}>{reply}</Text> : null}
      <Host>{q.ask}</Host>
      <View style={{ gap: 8 }} accessibilityRole={q.multi ? undefined : "radiogroup"}>
        {q.choices.map((c) => (
          <ChoiceRow key={c.id} multi={!!q.multi} testID={`${q.id}-${c.id}`} on={q.multi ? multi.includes(c.id) : (answers[q.id] ?? was[q.id]) === c.id}
            onPress={() => (q.multi
              // "not really" stands alone: picking it clears the rest, picking anything else clears it
              ? setMulti((m) => (m.includes(c.id) ? m.filter((x) => x !== c.id) : EXCLUSIVE.has(c.id) ? [c.id] : [...m.filter((x) => !EXCLUSIVE.has(x)), c.id]))
              : commit(c.id))}>
            {c.label}
          </ChoiceRow>
        ))}
      </View>
      {q.note ? <Text style={[type.caption(), { textAlign: "center" }]}>{q.note}</Text> : null}
      {history.length ? <View style={{ alignItems: "center" }}><Link onPress={back}>{t("onboarding.prevQuestion")}</Link></View> : null}
    </WelcomeFrame>
  );
}
