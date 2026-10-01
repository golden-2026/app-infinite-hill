import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { data, pos } from "@ih/content";
import { campLabel, campName, doorLabel, t } from "@/i18n";

/** The quiz's own frame around a lesson word ("amen — what's underneath it?"); the word itself stays as the lesson has it. */
const UNDERNEATH = / — what's underneath it\?$/;
import { advancedFor } from "@/content/placement";
import { BASICS_STOP_AFTER, atHome, campOneEnd, nextPhase, placementResult, skipDay, withStart, type Check } from "@/lib/placement";
import { profileFor, youAnswers } from "@/lib/onboard";
import { doorParam } from "@/lib/door-param";
import { useStore } from "@/lib/store";
import { Btn, Eyebrow, Link, Opt, color, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// "Where are you?" (v175's placement, now real): the basics first, eight "what's underneath it?" questions from the
// door's first camp. Get them and six harder ones follow, from further up the path (content/placement.ts); do well
// there and you may start after camp one (day 22), or from the beginning anyway. Miss the basics and it stops early.
// The rules are in lib/placement.ts. The source lists the right answer first, so the order is shuffled per question
// (stable for the visit). "not sure" is always offered, so nobody has to guess. Knowledge only, never belief.
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

type Q = { q: string; o: string[]; a: number };

export default function Know() {
  useEffect(() => { track("onboard_step", { step: "know" }); }, []);
  useTitle(t("onboarding.know.title"));
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw) !== "SPIRITUAL" ? doorParam(raw) : null;
  const { update, saved, today } = useStore();
  const basicsQs: Q[] = (door && data.PLACEMENT[door]) || [];
  const advancedQs: Q[] = useMemo(() => (door ? advancedFor(door) : []), [door]);
  // practises it, grew up in it, or is learning it at home (first step): fewer basics before the harder ones
  const connected = useMemo(() => (door ? atHome(youAnswers(profileFor(saved.settings.profile, door, today)), door) : false), [door]); // eslint-disable-line react-hooks/exhaustive-deps
  // One seed per visit (state, not memo) so the options never reshuffle while the answer is revealed.
  const [seed] = useState(() => Math.floor(Math.random() * 10000) + 1);
  const [started, setStarted] = useState(false);
  // right/wrong per question asked, in order; "back" takes the last answer off
  const [basics, setBasics] = useState<boolean[]>([]);
  const [advanced, setAdvanced] = useState<boolean[]>([]);
  // the harder questions are offered, never sprung: "try them" or "no thanks"
  const [offer, setOffer] = useState<"open" | "accepted" | "declined">("open");
  const [picked, setPicked] = useState<{ o: string; ok: boolean } | null>(null);

  const check: Check = { connected, basics, advanced, basicsTotal: basicsQs.length, advancedTotal: advancedQs.length, declined: offer === "declined" };
  const phase = nextPhase(check);
  const tier = phase === "advanced" ? "advanced" : "basics";
  const i = tier === "advanced" ? advanced.length : basics.length;
  const cur: Q | undefined = phase === "done" ? undefined : (tier === "advanced" ? advancedQs : basicsQs)[i];
  const options = useMemo(() => (cur ? shuffled(cur.o.map((o, k) => ({ o, k })), seed + i * 7 + (tier === "advanced" ? 101 : 0)) : []), [cur, seed, i, tier]);

  useEffect(() => { if (!door) router.replace("/welcome/door"); }, [door]);
  if (!door) return null;
  const name = doorLabel(door);

  // where they'll start, saved with the profile; on "from the beginning" any earlier skip on this door is cleared
  const finish = (knowledge: number | null, start = 1) => {
    update({ profile: { ...profileFor(saved.settings.profile, door, today), knowledge }, placed: withStart(saved.settings.placed, door, start) });
    router.push({ pathname: "/welcome/belief", params: { door } });
  };

  if (!started || !basicsQs.length) {
    return (
      <WelcomeFrame step={4} door={door} footer={<Btn testID="know-start" onPress={() => (basicsQs.length ? setStarted(true) : finish(null))}>{t("onboarding.know.start")}</Btn>}>
        <Host>{t("onboarding.know.host", { door: name.charAt(0).toUpperCase() + name.slice(1) })}</Host>
        <Text style={[type.caption(), { textAlign: "center" }]}>{t("onboarding.know.private")}</Text>
        <View style={{ alignItems: "center" }}>
          <Link onPress={() => finish(null)} label={t("onboarding.know.skipA11y", { door: name })}>{t("onboarding.know.skip", { door: name })}</Link>
        </View>
      </WelcomeFrame>
    );
  }

  // The top "back" takes back the last answer (or the offer), then goes to the intro, before leaving the check.
  const stepBack = () => {
    if (picked) return true;
    if (advanced.length) setAdvanced(advanced.slice(0, -1));
    else if (offer !== "open") setOffer("open");
    else if (basics.length) setBasics(basics.slice(0, -1));
    else setStarted(false);
    return true;
  };

  if (phase === "done") {
    const r = placementResult(check);
    const end = campOneEnd();
    const p = pos(r.start);
    const camp = campName(p.camp, p.name).toLowerCase();
    const stoppedEarly = basics.length < basicsQs.length && basics.filter((x) => !x).length >= BASICS_STOP_AFTER;
    const host = r.outcome === "skip" ? t("onboarding.know.skipHost", { camp, day: r.start })
      : r.outcome === "deep" ? t("onboarding.know.deepHost")
      : r.outcome === "some" ? t("onboarding.know.someHost")
      : t("onboarding.know.newHost");
    return (
      <WelcomeFrame step={4} door={door} onBack={stepBack} footer={r.outcome === "skip" ? (
        <View style={{ gap: 10 }}>
          <Btn testID="place-skip" onPress={() => finish(r.knowledge, r.start)}>{t("onboarding.know.skipGo", { day: r.start })}</Btn>
          <Btn testID="place-start" kind="ghost" onPress={() => finish(r.knowledge, 1)}>{t("onboarding.know.fromStart")}</Btn>
        </View>
      ) : <Btn testID="place-continue" onPress={() => finish(r.knowledge, 1)}>{t("onboarding.know.continue")}</Btn>}>
        <Eyebrow style={{ textAlign: "center" }}>{t("onboarding.know.resultEyebrow")}</Eyebrow>
        <Host pose={r.outcome === "skip" ? "climb" : undefined}>{host}</Host>
        <View style={{ alignItems: "center", gap: 4 }}>
          <Text testID="place-where" style={[type.h1(26), { textAlign: "center" }]}>{t("common.day", { n: r.start })}</Text>
          <Text style={[type.eyebrow(9), { textAlign: "center", color: color.mute }]}>{campLabel(p.camp)} · {campName(p.camp, p.name)}</Text>
        </View>
        <Text style={[type.caption(), { textAlign: "center" }]}>
          {r.outcome === "skip" ? t("onboarding.know.skipNote", { end }) : stoppedEarly ? t("onboarding.know.stoppedNote") : t("onboarding.know.dayOneNote")}
        </Text>
      </WelcomeFrame>
    );
  }

  if (phase === "advanced" && offer === "open") {
    return (
      <WelcomeFrame step={4} door={door} onBack={stepBack} footer={
        <View style={{ gap: 10 }}>
          <Btn testID="know-harder" onPress={() => setOffer("accepted")}>{t("onboarding.know.offerGo", { n: advancedQs.length })}</Btn>
          <Btn testID="know-no-harder" kind="ghost" onPress={() => setOffer("declined")}>{t("onboarding.know.offerNo")}</Btn>
        </View>
      }>
        <Host pose="point">{t("onboarding.know.offerHost", { n: advancedQs.length, day: skipDay() })}</Host>
        <Text style={[type.caption(), { textAlign: "center" }]}>{t("onboarding.know.offerNote")}</Text>
      </WelcomeFrame>
    );
  }

  const q = cur!;
  const answer = (o: string | null, k: number | null) => {
    if (picked) return;
    const ok = k === q.a;
    setPicked({ o: o ?? "unsure", ok });
    setTimeout(() => {
      setPicked(null);
      if (tier === "advanced") setAdvanced((xs) => [...xs, ok]);
      else setBasics((xs) => [...xs, ok]);
    }, 650);
  };
  const total = tier === "advanced" ? advancedQs.length : basicsQs.length;
  const itWas = t("onboarding.know.itWas", { answer: q.o[q.a] });
  return (
    <WelcomeFrame step={4} door={door} onBack={stepBack}>
      <Eyebrow style={{ textAlign: "center" }}>{tier === "advanced" ? t("onboarding.know.harderCount", { n: i + 1, total }) : t("onboarding.know.count", { n: i + 1, total })}</Eyebrow>
      {/* basics: the word and the options come from the lessons (English until lessons are translated); only the frame
          is translated. The harder questions are written for this check, in both languages. */}
      <Text accessibilityRole="header" style={[type.h1(tier === "advanced" ? 22 : 24), { textAlign: "center" }]}>{tier === "advanced" ? q.q : q.q.replace(UNDERNEATH, t("onboarding.know.underneath"))}</Text>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {options.map(({ o, k }) => (
          <Opt key={o} big on={picked?.o === o} onPress={() => answer(o, k)} sub={picked?.o === o ? (picked.ok ? t("onboarding.know.right") : itWas) : undefined}>{o}</Opt>
        ))}
        <Opt big on={picked?.o === "unsure"} onPress={() => answer(null, null)} sub={picked?.o === "unsure" ? itWas : undefined}>{t("onboarding.know.unsure")}</Opt>
      </View>
      <Text style={[type.caption(), { textAlign: "center", color: color.mute }]}>{t("onboarding.know.noScore")}</Text>
    </WelcomeFrame>
  );
}
