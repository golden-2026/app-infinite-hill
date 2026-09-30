import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { data } from "@ih/content";
import { doorLabel, t } from "@/i18n";

/** The quiz's own frame around a lesson word ("amen — what's underneath it?"); the word itself stays as the lesson has it. */
const UNDERNEATH = / — what's underneath it\?$/;
import { knowledgeScore } from "@/lib/profile";
import { profileFor } from "@/lib/onboard";
import { doorParam } from "@/lib/door-param";
import { useStore } from "@/lib/store";
import { Btn, Eyebrow, Link, Opt, color, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// The knowledge check (v175's placement, brought back): eight "what's underneath it?" questions from the door's
// first camp. It sets how deep lessons and the Guide go. The source lists the right answer first, so the order
// is shuffled per question (stable for the visit). "not sure" is always offered, so nobody has to guess.
function shuffled<T>(xs: T[], seed: number): T[] {
  const a = xs.slice();
  let s = seed || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Know() {
  useEffect(() => { track("onboard_step", { step: "know" }); }, []);
  useTitle(t("onboarding.know.title"));
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw) !== "SPIRITUAL" ? doorParam(raw) : null;
  const { update, saved, today } = useStore();
  const qs: { q: string; o: string[]; a: number }[] = (door && data.PLACEMENT[door]) || [];
  // One seed per visit (state, not memo) so the options never reshuffle while the answer is revealed.
  const [seed] = useState(() => Math.floor(Math.random() * 10000) + 1);
  const [started, setStarted] = useState(false);
  const [i, setI] = useState(0);
  // Right/wrong per question, so answering a question again (e.g. after "back") replaces it instead of adding up.
  const [results, setResults] = useState<boolean[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string[]>([]); // what was picked per question, shown again after "back"
  const cur = qs[i];
  const options = useMemo(() => (cur ? shuffled(cur.o.map((o, k) => ({ o, k })), seed + i * 7) : []), [cur, seed, i]);

  useEffect(() => { if (!door) router.replace("/welcome/door"); }, [door]);
  if (!door) return null;
  const name = doorLabel(door);

  const finish = (score: number | null) => {
    update({ profile: { ...profileFor(saved.settings.profile, door, today), knowledge: score } });
    router.push({ pathname: "/welcome/belief", params: { door } });
  };

  if (!started || !qs.length) {
    return (
      <WelcomeFrame step={4} door={door} footer={<Btn testID="know-start" onPress={() => (qs.length ? setStarted(true) : finish(null))}>{t("onboarding.know.start")}</Btn>}>
        <Host>{t("onboarding.know.host", { door: name.charAt(0).toUpperCase() + name.slice(1) })}</Host>
        <Text style={[type.caption(), { textAlign: "center" }]}>{t("onboarding.know.private")}</Text>
        <View style={{ alignItems: "center" }}>
          <Link onPress={() => finish(null)} label={t("onboarding.know.skipA11y", { door: name })}>{t("onboarding.know.skip", { door: name })}</Link>
        </View>
      </WelcomeFrame>
    );
  }

  const answer = (o: string | null, k: number | null) => {
    if (picked) return;
    setPicked(o ?? "unsure");
    setChosen((c) => { const n = c.slice(); n[i] = o ?? "unsure"; return n; });
    const next = results.slice(0, qs.length);
    next[i] = k === cur.a;
    setResults(next);
    setTimeout(() => {
      setPicked(null);
      if (i + 1 < qs.length) setI(i + 1);
      else finish(knowledgeScore(next.filter(Boolean).length, qs.length));
    }, 650);
  };
  // The top "back" steps back one question (answers kept), then to the intro, before leaving the check.
  const stepBack = () => {
    if (picked) return true;
    if (i > 0) setI(i - 1);
    else setStarted(false);
    return true;
  };
  return (
    <WelcomeFrame step={4} door={door} onBack={stepBack}>
      <Eyebrow style={{ textAlign: "center" }}>{t("onboarding.know.count", { n: i + 1, total: qs.length })}</Eyebrow>
      {/* the word and the options come from the lessons (English until lessons are translated); only the frame is */}
      <Text accessibilityRole="header" style={[type.h1(24), { textAlign: "center" }]}>{cur.q.replace(UNDERNEATH, t("onboarding.know.underneath"))}</Text>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {options.map(({ o, k }) => (
          <Opt key={o} big on={picked ? picked === o : chosen[i] === o} onPress={() => answer(o, k)} sub={picked === o ? (k === cur.a ? t("onboarding.know.right") : t("onboarding.know.itWas", { answer: cur.o[cur.a] })) : undefined}>{o}</Opt>
        ))}
        <Opt big on={picked ? picked === "unsure" : chosen[i] === "unsure"} onPress={() => answer(null, null)} sub={picked === "unsure" ? t("onboarding.know.itWas", { answer: cur.o[cur.a] }) : undefined}>{t("onboarding.know.unsure")}</Opt>
      </View>
      <Text style={[type.caption(), { textAlign: "center", color: color.mute }]}>{t("onboarding.know.noScore")}</Text>
    </WelcomeFrame>
  );
}
