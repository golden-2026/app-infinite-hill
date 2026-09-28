import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { DOORS, data, label } from "@ih/content";
import { emptyProfile, knowledgeScore } from "@/lib/profile";
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
  useTitle("where you are");
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
  const cur = qs[i];
  const options = useMemo(() => (cur ? shuffled(cur.o.map((o, k) => ({ o, k })), seed + i * 7) : []), [cur, seed, i]);

  useEffect(() => { if (!door) router.replace("/welcome/door"); }, [door]);
  if (!door) return null;
  const name = label(door);

  const finish = (score: number | null) => {
    const prev = saved.settings.profile?.door === door ? saved.settings.profile : null;
    update({ profile: { ...(prev || emptyProfile(door, today)), knowledge: score } });
    router.push({ pathname: "/welcome/belief", params: { door } });
  };

  if (!started || !qs.length) {
    return (
      <WelcomeFrame step={2} door={door} footer={<Btn testID="know-start" onPress={() => (qs.length ? setStarted(true) : finish(null))}>Let's see</Btn>}>
        <Host>{`${name}. Good. Before day one, let's see where you are — eight quick ones about what's underneath a few words.`}</Host>
        <Text style={[type.caption(), { textAlign: "center" }]}>nobody sees this but you. it only sets how deep we start.</Text>
        <View style={{ alignItems: "center" }}>
          <Link onPress={() => finish(null)} label={`I'm new to ${name}, skip the check`}>{`I'm new to ${name} · skip this ›`}</Link>
        </View>
      </WelcomeFrame>
    );
  }

  const answer = (o: string | null, k: number | null) => {
    if (picked) return;
    setPicked(o ?? "unsure");
    const next = results.slice(0, qs.length);
    next[i] = k === cur.a;
    setResults(next);
    setTimeout(() => {
      setPicked(null);
      if (i + 1 < qs.length) setI(i + 1);
      else finish(knowledgeScore(next.filter(Boolean).length, qs.length));
    }, 650);
  };
  return (
    <WelcomeFrame step={2} door={door}>
      <Eyebrow style={{ textAlign: "center" }}>{`${i + 1} of ${qs.length}`}</Eyebrow>
      <Text accessibilityRole="header" style={[type.h1(24), { textAlign: "center" }]}>{cur.q}</Text>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {options.map(({ o, k }) => (
          <Opt key={o} big on={picked === o} onPress={() => answer(o, k)} sub={picked === o ? (k === cur.a ? "yes — that's it" : `it's “${cur.o[cur.a]}”`) : undefined}>{o}</Opt>
        ))}
        <Opt big on={picked === "unsure"} onPress={() => answer(null, null)} sub={picked === "unsure" ? `it's “${cur.o[cur.a]}”` : undefined}>not sure</Opt>
      </View>
      <Text style={[type.caption(), { textAlign: "center", color: color.mute }]}>no score to anyone. just where to start.</Text>
    </WelcomeFrame>
  );
}
