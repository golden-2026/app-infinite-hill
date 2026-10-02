import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { campLabel, campName, doorLabel, stretchLabel, t } from "@/i18n";
import { placeStops, type PlaceQ } from "@/content/placement";
import { atOffer, climbState, placementResult, withStart, type Answer, type Climb } from "@/lib/placement";
import { profileFor } from "@/lib/onboard";
import { doorParam } from "@/lib/door-param";
import { useStore } from "@/lib/store";
import { Btn, ChoiceRow, Eyebrow, Link, color, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

/** The quiz's own frame around a lesson word ("amen — what's underneath it?"); the word itself stays as the lesson has it. */
const UNDERNEATH = / — what's underneath it\?$/;

// "Where are you?": an adaptive climb up the whole written path (rules in lib/placement.ts). Camp one's basics first;
// know them and it offers to keep climbing, a stretch at a time, jumping further up on each one known and stepping
// back down on a miss, until it's clear where someone is (14 questions at most, usually fewer). The questions above
// camp one are the lessons' own (content/placement-bank.ts, generated). The source lists options in the lesson's
// order, so they're shuffled per question (stable for the visit). "not sure" is always offered. Knowledge only.
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

/** "camp 3 · the practices", "year 2 · sundara kanda". */
const where = (s: { camp: string; name: string }) => stretchLabel(s.camp, s.name, " · ");

export default function Know() {
  useEffect(() => { track("onboard_step", { step: "know" }); }, []);
  useTitle(t("onboarding.know.title"));
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw) !== "SPIRITUAL" ? doorParam(raw) : null;
  const { update, saved, today } = useStore();
  // One seed per visit (state, not memo) so the options never reshuffle while the answer is revealed.
  const [seed] = useState(() => Math.floor(Math.random() * 10000) + 1);
  const stops = useMemo(() => (door ? placeStops(door, seed) : []), [door, seed]);
  const firsts = useMemo(() => stops.map((s) => s.first), [stops]);
  const [started, setStarted] = useState(false);
  // every answer, in order, with the stop it came from; "back" takes the last one off
  const [answers, setAnswers] = useState<Answer[]>([]);
  // after the basics, the rest of the climb is offered, never sprung: "keep climbing" or "no thanks"
  const [offer, setOffer] = useState<"open" | "accepted" | "declined">("open");
  const [picked, setPicked] = useState<{ o: string; ok: boolean } | null>(null);

  const climb: Climb = { stops: stops.length, answers, declined: offer === "declined" };
  const state = climbState(climb);
  const cur: PlaceQ | undefined = state.probe === null ? undefined : stops[state.probe]?.qs[state.nth];
  const qKey = `${state.probe}:${state.nth}`;
  const options = useMemo(() => (cur ? shuffled(cur.o.map((o, k) => ({ o, k })), seed + answers.length * 7) : []), [qKey, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (!door) router.replace("/welcome/door"); }, [door]);
  if (!door) return null;
  const name = doorLabel(door);

  // where they'll start, saved with the profile; any earlier start or move on this door is replaced
  const finish = (knowledge: number | null, start = 1) => {
    const moved = { ...(saved.settings.moved || {}) };
    delete moved[door];
    const settle = { ...(saved.settings.settle || {}) };
    delete settle[door];
    update({ profile: { ...profileFor(saved.settings.profile, door, today), knowledge }, placed: withStart(saved.settings.placed, door, start), moved, settle });
    router.push({ pathname: "/welcome/belief", params: { door } });
  };

  if (!started || !stops.length) {
    return (
      <WelcomeFrame step={4} door={door} footer={<Btn testID="know-start" onPress={() => (stops.length ? setStarted(true) : finish(null))}>{t("onboarding.know.start")}</Btn>}>
        <Host>{t("onboarding.know.host", { door: name })}</Host>
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
    if (offer !== "open" && atOffer({ ...climb, declined: false })) setOffer("open");
    else if (answers.length) setAnswers(answers.slice(0, -1));
    else setStarted(false);
    return true;
  };

  if (state.done) {
    const r = placementResult(climb, firsts);
    const at = r.stop >= 1 ? stops[r.stop] : stops[0];
    const next = r.anyway ? stops[r.stop + 1] : null;
    const missedBasics = r.stop < 0;
    const tally = answers.length > 3 ? `${t("onboarding.know.tally", { got: r.got, asked: r.asked })} ` : "";
    const host = tally + (r.outcome === "skip" ? `${t("onboarding.know.placedHost", { camp: where(at) })}${next ? ` ${t("onboarding.know.mixedNext", { camp: where(next) })}` : ""}`
      : next ? t("onboarding.know.mixedHost", { camp: where(next) })
      : r.outcome === "deep" ? t("onboarding.know.deepHost")
      : r.outcome === "some" ? t("onboarding.know.someHost")
      : t("onboarding.know.newHost"));
    return (
      <WelcomeFrame step={4} door={door} onBack={stepBack} footer={r.outcome === "skip" ? (
        <View style={{ gap: 10 }}>
          <Btn testID="place-skip" onPress={() => finish(r.knowledge, r.start)}>{t("onboarding.know.skipGo", { day: r.start })}</Btn>
          {r.anyway ? <Btn testID="place-skip-anyway" kind="ghost" onPress={() => finish(r.knowledge, r.anyway!)}>{t("onboarding.know.skipAnyway", { day: r.anyway })}</Btn> : null}
          <Btn testID="place-start" kind="ghost" onPress={() => finish(r.knowledge, 1)}>{t("onboarding.know.fromStart")}</Btn>
        </View>
      ) : r.anyway ? (
        <View style={{ gap: 10 }}>
          <Btn testID="place-continue" onPress={() => finish(r.knowledge, 1)}>{t("onboarding.know.continue")}</Btn>
          <Btn testID="place-skip-anyway" kind="ghost" onPress={() => finish(r.knowledge, r.anyway!)}>{t("onboarding.know.skipAnyway", { day: r.anyway })}</Btn>
        </View>
      ) : <Btn testID="place-continue" onPress={() => finish(r.knowledge, 1)}>{t("onboarding.know.continue")}</Btn>}>
        <Eyebrow style={{ textAlign: "center" }}>{t("onboarding.know.resultEyebrow")}</Eyebrow>
        <Host pose={r.outcome === "skip" ? "climb" : undefined}>{host}</Host>
        <View style={{ alignItems: "center", gap: 4 }}>
          <Text testID="place-where" style={[type.h1(26), { textAlign: "center" }]}>{t("common.day", { n: r.start })}</Text>
          <Text style={[type.eyebrow(9), { textAlign: "center", color: color.mute }]}>{campLabel(at.camp)} · {campName(at.camp, at.name)}</Text>
        </View>
        <Text style={[type.caption(), { textAlign: "center" }]}>
          {r.outcome === "skip" ? t("onboarding.know.skipNote", { end: r.start - 1 }) : missedBasics ? t("onboarding.know.stoppedNote") : t("onboarding.know.dayOneNote")}
        </Text>
      </WelcomeFrame>
    );
  }

  if (offer === "open" && atOffer(climb)) {
    return (
      <WelcomeFrame step={4} door={door} onBack={stepBack} footer={
        <View style={{ gap: 10 }}>
          <Btn testID="know-harder" onPress={() => setOffer("accepted")}>{t("onboarding.know.offerGo")}</Btn>
          <Btn testID="know-no-harder" kind="ghost" onPress={() => setOffer("declined")}>{t("onboarding.know.offerNo")}</Btn>
        </View>
      }>
        <Host pose="point">{t("onboarding.know.offerHost")}</Host>
        <Text style={[type.caption(), { textAlign: "center" }]}>{t("onboarding.know.offerNote")}</Text>
      </WelcomeFrame>
    );
  }

  const q = cur!;
  const stop = stops[state.probe!];
  const answer = (o: string | null, k: number | null) => {
    if (picked) return;
    const ok = k === q.a;
    setPicked({ o: o ?? "unsure", ok });
    setTimeout(() => {
      setPicked(null);
      setAnswers((xs) => [...xs, { stop: state.probe!, ok }]);
    }, 650);
  };
  const itWas = t("onboarding.know.itWas", { answer: q.o[q.a] });
  const prompt = q.kind === "word" ? t("onboarding.know.fits", { term: q.term || q.q }) : q.kind === "basic" ? q.q.replace(UNDERNEATH, t("onboarding.know.underneath")) : q.q;
  return (
    <WelcomeFrame step={4} door={door} onBack={stepBack}>
      <Eyebrow style={{ textAlign: "center" }}>{t("onboarding.know.step", { n: answers.length + 1, where: where(stop) })}</Eyebrow>
      {/* the questions and options are the lessons' own (English until the lessons are translated); only the frame is translated */}
      <Text accessibilityRole="header" style={[type.h1(q.kind === "fork" ? 20 : 24), { textAlign: "center" }]}>{prompt}</Text>
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {options.map(({ o, k }) => (
          <ChoiceRow key={o} on={picked?.o === o} onPress={() => answer(o, k)} sub={picked?.o === o ? (picked.ok ? t("onboarding.know.right") : itWas) : undefined}>{o}</ChoiceRow>
        ))}
        <ChoiceRow on={picked?.o === "unsure"} onPress={() => answer(null, null)} sub={picked?.o === "unsure" ? itWas : undefined}>{t("onboarding.know.unsure")}</ChoiceRow>
      </View>
      <Text style={[type.caption(), { textAlign: "center" }]}>{t("onboarding.know.noScore")}</Text>
    </WelcomeFrame>
  );
}
