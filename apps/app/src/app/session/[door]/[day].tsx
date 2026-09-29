import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
// A day's lesson: v175 Session, as a real screen. Queue of steps, combo, "one more time" on the misses
// (nothing counted twice), then the tally. Leaving asks first; finishing records the sit and opens /done.
import { DOORS, GRADED, LEVELS, deeperRound, icon, label, lessonInfo, native, planDay, screenLines } from "@ih/content";
import { levelFor } from "@/lib/level";
import { RhythmStep, RushStep, SayStep, ScenesStep, TypeItStep } from "@/session/games";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hush, bell, speak } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { readJSON, remove, writeJSON } from "@/lib/storage";
import { play } from "@/lib/fx";
import { ComboBurst, FxProvider, ReactingGuy, cue, poseFor, type Reaction } from "@/session/juice";
import { today as todayNow } from "@/lib/time";
import { voiceLabel } from "@/lib/voice";
import { BetStep, BreathStep, ForkStep, MatchStep, MythStep, OptionStep, OrderStep, OriginalStep, SitStep, SpeakStep, TapHear, TrapdoorStep } from "@/session/steps";
import { BottomBar, Btn, Face, Guy, NavBar, Sun, color, confirmSheet, font, type } from "@/ui";
import { successHaptic, tapHaptic } from "@/lib/haptics";
import { SlotHost, SlotProvider } from "@/ui/slot";
import { ChevronLeft, SpeakerIcon } from "@/ui/tab-icons";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Enter } from "@/ui/enter";
import { useChrome } from "@/ui/chrome";

const SEG_LABEL: Record<string, string> = { bet: "call it", myth: "true or myth", fork: "your move", original: "in the original", trapdoor: "the trapdoor", bell: "the bell", guess: "your guess", order: "the ideas", match: "the pairs", listen: "your ear", scenes: "the scenes", say: "say it", rhythm: "the rhythm", typeit: "your ear", rush: "quick round", sit: "the sit", breath: "one breath", speak: "say it back", taphear: "your line", fixintro: "one more time", tally: "done" };

export default function SessionScreen() {
  const params = useLocalSearchParams<{ door: string; day: string; kid?: string; deep?: string }>();
  const { lessonFor, saved, derived, completeSit } = useStore();
  const door = String(params.door || "").toUpperCase();
  const day = Number(params.day);
  const kid = params.kid ? derived.kids.find((k: any) => k.id === params.kid) : null;
  const current = kid ? kid.day : lessonFor(door);
  const mode = kid && new Date().getFullYear() - (kid.birthYear || 2016) < 13 ? "kid" : "adult";
  // Deep links can't skip ahead: a lesson opens only up to where the door is.
  if (!DOORS.some(([, w]) => w === door)) return <Redirect href="/today" />;
  if (!Number.isInteger(day) || day < 1 || day > current) return <Redirect href={{ pathname: "/session/[door]/[day]", params: { door: door || saved.settings.homeWing, day: String(current) } }} />;
  // "go deeper" is an extra round on a lesson already walked today; children don't get it
  const deep = params.deep === "1" && !kid;
  return <Session door={door} day={day} kidId={kid?.id ?? null} mode={mode} deep={deep} voiceOn={saved.settings.voiceOn} onFinish={completeSit} />;
}

function Session({ door, day, kidId, mode, deep, voiceOn, onFinish }: { door: string; day: number; kidId: string | null; mode: string; deep: boolean; voiceOn: boolean; onFinish: ReturnType<typeof useStore>["completeSit"] }) {
  const ic = icon(door);
  const { earnLight, recordRun, recordFeel, update, saved: me } = useStore();
  useTitle(`${label(door).toLowerCase()} · day ${day}${deep ? " · deeper" : ""}`);
  useChrome(true);
  // The level is fixed for the whole lesson (it moves between lessons, never in the middle of one).
  const [level] = useState(() => (mode === "adult" ? levelFor({ door, day, profile: me.settings.profile, runs: me.settings.runs }) : 1));
  const plan = useMemo(() => {
    if (!deep) return planDay({ wing: door, day, mode, level: mode === "adult" ? level : 0 });
    const base = planDay({ wing: door, day, mode });
    return { ...base, steps: deeperRound(door, day, level) };
  }, [door, day, mode, level, deep]);
  const shownLevel = deep ? Math.min(5, level + 2) : level;
  const [rushSecs, setRushSecs] = useState<number | null>(null);
  const [feel, setFeel] = useState<string | null>(null);
  // A reload mid-lesson picks up where you were (same lesson, same day only); finishing or leaving clears it.
  const resumeKey = `ih:lesson:${door}:${day}:${kidId || "me"}${deep ? ":deep" : ""}:L${level}`;
  const [saved0] = useState(() => {
    const r = readJSON<any>(resumeKey, null);
    const ids = new Set(plan.steps.map((s) => s.id));
    return r && r.date === todayNow() && Array.isArray(r.queue) && r.queue.every((id: number) => ids.has(id)) && r.qi < r.queue.length ? r : null;
  });
  const [queue, setQueue] = useState<number[]>(() => saved0?.queue ?? plan.steps.map((s) => s.id));
  const [qi, setQi] = useState<number>(saved0?.qi ?? 0);
  const [phase, setPhase] = useState<"play" | "fixintro" | "fix">(saved0?.phase ?? "play");
  const [missed, setMissed] = useState<number[]>(saved0?.missed ?? []);
  const [score, setScore] = useState<{ right: number; asked: number }>(saved0?.score ?? { right: 0, asked: 0 });
  const [combo, setCombo] = useState(0);
  const [best, setBest] = useState<number>(saved0?.best ?? 0);
  useEffect(() => {
    if (qi === 0 && phase === "play") return; // nothing worth resuming yet
    writeJSON(resumeKey, { date: todayNow(), queue, qi, phase, missed, score, best });
  }, [queue, qi, phase, missed, score, best]); // eslint-disable-line react-hooks/exhaustive-deps
  // Game feel: the mascot's pose, a beat that pops it, and the combo counted the moment an answer lands.
  const [pose, setPose] = useState("wave");
  const [beat, setBeat] = useState(0);
  const react = useCallback((r: Reaction) => {
    const c = r === "right" ? combo + 1 : r === "wrong" ? 0 : combo;
    if (r !== "neutral") { setCombo(c); if (c > best) setBest(c); }
    setPose(poseFor(r, beat));
    setBeat((b) => b + 1);
    cue(r, c);
  }, [combo, best, beat]);
  const fx = useMemo(() => ({ react, combo, pose, beat }), [react, combo, pose, beat]);
  const t0 = useRef(Date.now());
  const finished = useRef(false);
  const step = phase === "fixintro" ? { type: "fixintro", id: -1 } : plan.steps.find((s) => s.id === queue[qi]);
  const total = plan.steps.length;
  const graded = plan.steps.filter((s) => GRADED.includes(s.type)).length;

  // Hardware back / browser back / swipe: ask before throwing the lesson away.
  const nav = useNavigation();
  useEffect(() => nav.addListener("beforeRemove", (e: any) => {
    if (finished.current) return;
    e.preventDefault();
    askLeave(() => nav.dispatch(e.data.action));
  }), [nav]); // eslint-disable-line react-hooks/exhaustive-deps

  // Advance. Before the tally, a play-through with misses gets the "one more time" round (only the
  // missed steps, then the tally). v175 checked this only after the tally, so the round never ran.
  const next = useCallback((missedNow: number[] = missed) => {
    setPose("wave");
    if (phase === "fixintro") { setPhase("fix"); setQi(0); return; }
    const tallyId = plan.steps[plan.steps.length - 1].id;
    const nextId = queue[qi + 1];
    if (phase === "play" && nextId === tallyId && missedNow.length) {
      setPhase("fixintro");
      setQueue([...missedNow, tallyId]);
      setMissed([]);
      return;
    }
    if (qi + 1 < queue.length) { setQi(qi + 1); return; }
    setQi(queue.length - 1);
  }, [phase, qi, queue, missed, plan]);

  const verdict = (ok: boolean | null) => {
    // (the combo, sound and mascot already reacted when the answer landed — see `react`)
    if (ok === null || ok === undefined) return next();
    if (ok) {
      if (phase === "play") setScore((s) => ({ right: s.right + 1, asked: s.asked + 1 }));
      return next();
    }
    if (phase !== "play") return next();
    const missedNow = missed.includes(step!.id) ? missed : [...missed, step!.id];
    setScore((s) => ({ ...s, asked: s.asked + 1 }));
    setMissed(missedNow);
    next(missedNow);
  };

  useEffect(() => {
    if (!step) return;
    track("lesson_step", { door, day, i: qi, of: queue.length, type: step.type, phase });
    if (step.type === "bell") { bell(); const t = setTimeout(next, 1800); return () => clearTimeout(t); }
    if (step.type === "beat") { const t = setTimeout(() => speak(step.text, voiceOn), 250); return () => { clearTimeout(t); hush(); }; }
    if (step.type === "fixintro") speak("one more time on the ones you missed. no rush.", voiceOn);
    if (step.type === "tally") { speak(`That's day ${day}. You showed up. Proud of you.`, voiceOn); bell(); }
  }, [qi, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => {
    if (finished.current) return; // a fast double-tap must not save two sits
    finished.current = true;
    hush();
    remove(resumeKey);
    const asked = score.asked || graded;
    if (deep) {
      // the extra round: light and a best time, never a second sit
      earnLight(deepLight(score.right, asked), best, false);
      recordRun({ door, day, acc: asked ? score.right / asked : 1, level: shownLevel, rushSecs, deep: true });
      router.replace("/today");
      return;
    }
    if (!kidId) recordRun({ door, day, acc: asked ? score.right / asked : 1, level, rushSecs });
    // a one-off visit to another door comes straight back to your own path
    if (!kidId && door !== me.settings.homeWing && me.settings.active === "visit") update({ active: "home" });
    const outcome = onFinish({ door, day, kidId });
    if (!kidId) earnLight(lessonLight(score.right, score.asked || graded, best), best, score.asked > 0 && score.right === score.asked);
    track("lesson_done", { door, day, right: score.right, asked: score.asked, newDay: outcome.isNewDay, kid: !!kidId });
    if (kidId) { router.canGoBack() ? router.back() : router.replace("/you/table"); return; } // a child's sit moves the child's hill, not yours
    const minutes = Math.max(1, Math.round((Date.now() - t0.current) / 60000));
    router.replace({ pathname: "/done", params: { door, day: String(day), right: String(score.right), total: String(score.asked), word: plan.word, carry: plan.carry, minutes: String(minutes), newDay: outcome.isNewDay ? "1" : "0", count: String(outcome.showedUp), milestone: outcome.milestone ? String(outcome.milestone) : "" } });
  };
  const leave = () => { finished.current = true; hush(); remove(resumeKey); router.canGoBack() ? router.back() : router.replace("/today"); };
  // The one confirm panel the whole app uses, not a lesson-only dialog.
  function askLeave(then: () => void = leave) {
    confirmSheet({ title: "leave this lesson?", body: "it won't count until you finish. your days so far stay right where they are.", confirm: "leave", cancel: "keep going" })
      .then((ok) => { if (ok) { finished.current = true; hush(); remove(resumeKey); then(); } });
  }

  const prevStep = qi > 0 ? plan.steps.find((x) => x.id === queue[qi - 1]) : null;
  const canBack = !!prevStep && ["beat", "bell"].includes(prevStep.type) && step?.type !== "tally";
  const pct = phase === "play" ? Math.round((qi / Math.max(1, total - 1)) * 100) : 100;
  const segLabel = step ? (step.type === "breath" && step.n > 1 ? `${step.n} breaths` : step.seg || SEG_LABEL[step.type] || "") : "";
  if (!step) return null;
  const k = `${phase}-${qi}-${step.id}`;

  const frame = (children: ReactNode, { foot, top }: { foot?: ReactNode; top?: boolean } = {}) => (
    <LinearGradient colors={color.dusk} locations={[0, 0.6, 1]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <SlotProvider>
        <FxProvider value={fx}>
        <NavBar dark close={() => askLeave()} closeLeft
          middle={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Pressable accessibilityRole="button" accessibilityLabel="Previous screen" accessibilityState={{ disabled: !canBack }} aria-disabled={!canBack} disabled={!canBack} onPress={() => { tapHaptic(); setQi(qi - 1); }} hitSlop={4}
                style={({ pressed }) => ({ minWidth: 36, minHeight: 44, alignItems: "center", justifyContent: "center", opacity: !canBack ? 0.25 : pressed ? 0.5 : 0.8 })}>
                <ChevronLeft color="#fff" size={20} />
              </Pressable>
              <View style={{ flex: 1 }}>
                {combo >= 2 ? <Text style={[type.eyebrow(), st.combo, combo >= 3 ? { color: "#FFD23F" } : null]}>{combo >= 3 ? `☀ glowing ×${combo}` : `×${combo} in a row`}</Text> : pct >= 80 && pct < 100 && phase === "play" ? <Text style={[type.eyebrow(), st.combo]}>almost there!</Text> : null}
                <Progress pct={pct} hot={combo >= 3} />
              </View>
            </View>
          }
          right={<Text style={[type.eyebrow(), { color: "#ffffff99", paddingRight: 10, opacity: step.type === "tally" ? 0 : 1 }]}>{phase === "play" ? `${Math.min(qi + 1, queue.length)}/${queue.length}` : phase === "fix" ? `again ${Math.min(qi + 1, Math.max(1, queue.length - 1))}/${Math.max(1, queue.length - 1)}` : ""}</Text>}
        />
        <View style={st.who}>
          <Face ic={ic} w={36} h={36} r={18} caption={false} />
          <Text style={[type.eyebrow(), { color: "#ffffffbb", flex: 1 }]} numberOfLines={2}>{voiceLabel(door, ic.short).short} reads · {label(door)}{segLabel ? ` · ${segLabel}` : ""}</Text>
          <ReactingGuy h={58} rest={step.type === "breath" || step.type === "sit" ? "meditate" : step.type === "tally" ? "celebrate" : undefined} />
        </View>
        <ScrollView key={k} contentContainerStyle={[st.body, { justifyContent: top ? "flex-start" : "center" }]}>
          <Enter style={{ width: "100%", alignItems: "center" }}>
            {step.newToday ? <View style={[st.newPill, { alignSelf: "flex-start" }]} accessibilityLabel="new today"><Text style={[type.eyebrow(), { color: color.ink }]}>new today</Text></View> : null}
            {children}
          </Enter>
        </ScrollView>
        {/* One bottom bar for every step: the frame's own button, or the one a step hands over. */}
        {foot ? <BottomBar dark>{foot}</BottomBar> : <SlotHost render={(c) => <BottomBar dark>{c}</BottomBar>} />}
        <ComboBurst />
        </FxProvider>
        </SlotProvider>
      </SafeAreaView>
    </LinearGradient>
  );

  switch (step.type) {
    case "bell":
      return frame(<View style={{ alignItems: "center", gap: 18 }}><Guy pose="wave" h={170} /><Text style={[type.h1(40), { color: "#fff" }]}>{step.text}</Text>{mode === "adult" && day > 1 ? <LevelPill level={shownLevel} /> : null}</View>);
    case "fixintro":
      return frame(<View style={{ alignItems: "center", gap: 16 }}><Guy pose="think" h={160} /><Text style={[type.h1(30), { color: "#fff", textAlign: "center" }]}>one more time on the ones you missed.</Text><Text style={[type.body(), { color: "#ffffffaa" }]}>no rush. nothing's counted twice.</Text></View>, { foot: <Btn kind="gold" onPress={() => next()}>one more time</Btn> });
    case "beat": {
      // The story is told by the mascot in a speech bubble (like a character in a story), not a wall of text.
      const n = step.text.length;
      const fs = n > 220 ? 16 : n > 140 ? 18 : n > 80 ? 20 : 24;
      // namaste is a Hindu gesture: only on the Hindu door; other doors get a warm pose in its place.
      const BEAT_POSES = ["point", "idea", "wonder", "aha", door === "HINDUISM" ? "namaste" : "heart", "think", "peace", "readsit"];
      return frame(
        <View style={{ width: "100%", maxWidth: 380, gap: 12, alignSelf: "center" }}>
          {step.head ? <Text style={[type.eyebrow(11), { color: color.gold, letterSpacing: 1.76, textAlign: "center" }]}>{step.head}</Text> : null}
          <View style={{ backgroundColor: "#fff", borderRadius: 22, paddingVertical: 16, paddingHorizontal: 18 }}>
            <Text style={{ fontFamily: font.display[700], fontSize: fs, lineHeight: fs * 1.3, color: color.ink, letterSpacing: -0.2 }}>{step.text}</Text>
          </View>
          <View style={{ width: 0, height: 0, marginLeft: 38, marginTop: -12, borderLeftWidth: 12, borderRightWidth: 12, borderTopWidth: 14, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#fff" }} />
          <Guy pose={BEAT_POSES[qi % BEAT_POSES.length]} h={150} style={{ alignSelf: "flex-start", marginLeft: 6 }} />
        </View>,
        { foot: <View style={{ gap: 4 }}><Pressable accessibilityRole="button" accessibilityLabel="Hear it again" onPress={() => speak(step.text, true)} style={({ pressed }) => ({ minHeight: 44, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.5 : 1 })}><SpeakerIcon color="#ffffff99" /><Text style={[type.eyebrow(), { color: "#ffffff99" }]}>hear it again</Text></Pressable><Btn testID="next" kind="gold" onPress={() => next()}>next</Btn></View> },
      );
    }
    case "bet": return frame(<BetStep step={step} onDone={verdict} />, { top: true });
    case "myth": return frame(<MythStep step={step} onDone={verdict} />, { top: true });
    case "fork": return frame(<ForkStep step={step} onDone={() => next()} />, { top: true });
    case "original": return frame(<OriginalStep step={step} voiceOn={voiceOn} onDone={() => next()} />, { top: true });
    case "trapdoor": return frame(<TrapdoorStep step={step} onDone={() => next()} />, { top: true });
    case "guess":
    case "listen": return frame(<OptionStep step={step} voiceOn={voiceOn} onDone={verdict} />);
    case "order":
      return frame(<View style={{ width: "100%" }}><Text style={[type.h1(24), { color: "#fff", marginBottom: 14 }]}>{step.prompt}</Text><View style={st.cream}><OrderStep step={step} onDone={(ok) => setTimeout(() => verdict(ok), 500)} /></View></View>, { top: true });
    case "match":
      return frame(<View style={{ width: "100%" }}><Text style={[type.h1(24), { color: "#fff", marginBottom: 14 }]}>{step.prompt}</Text><View style={st.cream}><MatchStep step={step} onDone={(ok) => setTimeout(() => verdict(ok), 300)} /></View></View>, { top: true });
    case "taphear": return frame(<TapHear step={step} voiceOn={voiceOn} onDone={verdict} />);
    case "scenes":
      return frame(<View style={{ width: "100%" }}><Text style={[type.h1(24), { color: "#fff", marginBottom: 8 }]}>{step.prompt}</Text><ScenesStep step={step} onDone={verdict} /></View>, { top: true });
    case "say": return frame(<SayStep step={step} voiceOn={voiceOn} onDone={() => next()} />);
    case "rhythm": return frame(<RhythmStep step={step} voiceOn={voiceOn} onDone={verdict} />);
    case "typeit": return frame(<TypeItStep step={step} voiceOn={voiceOn} onDone={verdict} />, { top: true });
    case "rush": return frame(<RushStep step={step} best={me.settings.rushBest?.[door] ?? null} onDone={(ok, secs) => { if (secs) setRushSecs(secs); verdict(ok); }} />, { top: true });
    case "sit": return frame(<SitStep secs={step.secs} onDone={() => next()} />);
    case "breath": return frame(<BreathStep n={step.n} onDone={() => next()} />);
    case "speak":
      return frame(<View style={[st.cream, { paddingVertical: 22, width: "100%" }]}><SpeakStep step={step} onDone={() => next()} /><Text style={[type.body(12), { color: color.mute, textAlign: "center", marginTop: 10 }]}>{step.hint}</Text></View>);
    case "tally": {
      const info = plan.info;
      const ideas = Math.min(4, (info?.segments ? screenLines(info.segments.find((g: any) => /teach/.test(g.type))?.screen).length : 2) || 2);
      const tomorrow = lessonInfo(door, day + 1)?.title;
      const nat = native(plan.word, door);
      const tiles: [string, string, string, boolean][] = [
        ["1", "word", plan.word, true],
        [String(ideas), ideas === 1 ? "idea" : "ideas", "you didn't have this morning", false],
        [`${score.right}/${score.asked || graded}`, "first try", best >= 3 ? `×${best} in a row` : score.asked && score.right === score.asked ? "perfect." : "all fixed.", false],
      ];
      // The win screen, in our own look: the light you earned, how on-target you were and how long it took, on one
      // gold-rimmed card; a fanfare; the mascot celebrating.
      const asked = score.asked || graded;
      const acc = asked ? Math.round((100 * score.right) / asked) : 100;
      const light = lessonLight(score.right, asked, best);
      const secs = Math.max(30, Math.round((Date.now() - t0.current) / 1000));
      const accLabel = acc >= 50 ? "on target" : "learning";
      // day one has a single graded question: one fixed miss is not "0%", it's a first try that got fixed
      const accStat: [string, string, string] = day === 1 && acc < 100 ? ["◎", "✓", "all fixed"] : ["◎", `${acc}%`, accLabel];
      const stats: [string, string, string][] = [["☀", `+${light}`, "light"], accStat, ["◷", `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`, "time"]];
      const nextLevel = mode === "adult" && !deep ? levelFor({ door, day: day + 1, profile: me.settings.profile, runs: [...(me.settings.runs || []), { door, acc: asked ? score.right / asked : 1, level }] }) : level;
      const feelRow = !kidId ? (
        <View style={{ alignItems: "center", gap: 8, marginTop: 4 }}>
          <Text style={[type.eyebrow(8), { color: "#ffffff99" }]}>{feel ? "thanks — we'll tune it." : "how did that feel?"}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {([["slow", "too easy"], ["right", "just right"], ["hard", "too hard"]] as const).map(([id, l]) => (
              <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: feel === id }} onPress={() => { setFeel(id); recordFeel({ door, day, level: shownLevel, feel: id }); }}
                style={{ borderRadius: 999, borderWidth: 1.5, borderColor: feel === id ? color.gold : "#ffffff44", backgroundColor: feel === id ? color.gold : "transparent", paddingVertical: 8, paddingHorizontal: 12 }}>
                <Text style={[type.eyebrow(8), { color: feel === id ? color.ink : "#fff" }]}>{l}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null;
      if (deep) {
        return frame(
          <View style={{ alignItems: "center", gap: 14, width: "100%" }}>
            <Celebrate />
            <Text accessibilityRole="header" style={{ fontFamily: font.mark[800], fontSize: 34, color: color.gold, textAlign: "center" }}>you went deeper.</Text>
            <LevelPill level={shownLevel} />
            <View style={{ flexDirection: "row", width: "100%", borderRadius: 22, borderWidth: 2, borderColor: color.gold, backgroundColor: "#ffffff0d", paddingVertical: 14 }}>
              {([["☀", `+${deepLight(score.right, asked)}`, "light"], ["◎", `${acc}%`, accLabel], ["⏱", rushSecs ? `${rushSecs}s` : "—", "quick round"]] as const).map(([g, v, l], k) => (
                <View key={l} style={{ flex: 1, alignItems: "center", borderLeftWidth: k ? 1 : 0, borderLeftColor: "#ffffff22" }}>
                  <Text style={{ fontSize: 18, color: color.gold }}>{g}</Text>
                  <Text style={{ fontFamily: font.display[800], fontSize: 24, color: "#fff", marginTop: 2 }}>{v}</Text>
                  <Text style={[type.eyebrow(8), { color: "#ffffffaa", marginTop: 2 }]}>{l}</Text>
                </View>
              ))}
            </View>
            <Text style={[type.body(14), { color: "#ffffffcc", textAlign: "center" }]}>{acc === 100 ? "two levels up and not one miss. that's real." : "two levels up is supposed to be hard. you did it anyway."}</Text>
            {feelRow}
          </View>,
          { foot: <Btn testID="finish" kind="gold" onPress={finish}>back to today</Btn> },
        );
      }
      return frame(
        <View style={{ alignItems: "center", gap: 14, width: "100%" }}>
          <Celebrate />
          <Text accessibilityRole="header" style={{ fontFamily: font.mark[800], fontSize: 36, color: color.gold, textAlign: "center" }}>{day === 1 ? "you're on the hill!" : `day ${day}. done!`}</Text>
          {mode === "adult" && day > 1 ? <LevelPill level={level} up={nextLevel > level} /> : null}
          <Text style={[type.body(15), { color: "#ffffffcc", marginTop: -8 }]}>{acc === 100 ? "not one miss. proud of you." : "proud of you. see you tomorrow."}</Text>
          <View style={{ flexDirection: "row", width: "100%", borderRadius: 22, borderWidth: 2, borderColor: color.gold, backgroundColor: "#ffffff0d", paddingVertical: 14 }}>
            {stats.map(([g, v, l], k) => (
              <View key={l} style={{ flex: 1, alignItems: "center", borderLeftWidth: k ? 1 : 0, borderLeftColor: "#ffffff22" }}>
                <Text style={{ fontSize: 18, color: color.gold }}>{g}</Text>
                <Text style={{ fontFamily: font.display[800], fontSize: 24, color: "#fff", marginTop: 2 }}>{v}</Text>
                <Text style={[type.eyebrow(8), { color: "#ffffffaa", marginTop: 2 }]}>{l}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: "row", gap: 8, width: "100%" }}>
            {tiles.map(([n, l, sub, hot]) => (
              <View key={l} style={[st.tile, hot ? { backgroundColor: color.gold, borderWidth: 0 } : null]}>
                <Text style={{ fontFamily: font.display[800], fontSize: 22, color: hot ? color.ink : color.gold }} numberOfLines={1} adjustsFontSizeToFit>{n}</Text>
                <Text style={[type.eyebrow(), { color: hot ? color.ink : "#ffffffaa" }]}>{l}</Text>
                <Text style={[type.body(11), { color: hot ? color.ink : "#ffffffcc", marginTop: 2 }]} numberOfLines={2}>{sub}</Text>
              </View>
            ))}
          </View>
          <Text style={{ fontFamily: font.display[500], fontSize: 17, color: "#ffffffcc", marginTop: 8, textAlign: "center" }}>your line: <Text style={{ fontStyle: "italic" }}>{/[.?!…]$/.test(plan.carry) ? plan.carry : `${plan.carry}.`}</Text></Text>
          {nat ? <View style={st.bead}><Text style={{ fontFamily: font.display[800], fontSize: 22, color: color.gold }}>{nat}</Text><Text style={[type.eyebrow(), { color: "#ffffffbb" }]}>bead {Math.min(day, 21)} of 21 · on your strand</Text></View> : null}
          {/* the label the Keeper & provenance page promises for unreviewed lessons */}
          <Text style={[type.eyebrow(8), { color: "#ffffff88", textAlign: "center" }]}>authored draft · Keeper review pending</Text>
          {feelRow}
          {tomorrow ? <View style={st.tomorrow}><Text style={[type.eyebrow(), { color: color.gold }]}>tomorrow</Text><Text style={{ fontFamily: font.display[800], fontSize: 17, color: "#fff", marginTop: 4 }}>{tomorrow}</Text></View> : null}
        </View>,
        { foot: <Btn testID="finish" kind="gold" onPress={finish}>done — proud of you</Btn> },
      );
    }
    default:
      return frame(<Text style={[type.body(), { color: "#fff" }]}>…</Text>, { foot: <Btn kind="gold" onPress={() => next()}>next</Btn> });
  }
}

const st = StyleSheet.create({
  track: { height: 6, backgroundColor: "#ffffff22", borderRadius: 3, overflow: "hidden" },
  bar: { height: 6, backgroundColor: color.gold, borderRadius: 3 },
  combo: { position: "absolute", top: -14, alignSelf: "center", color: color.gold },
  who: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14, paddingHorizontal: 20 },
  body: { flexGrow: 1, alignItems: "center", paddingHorizontal: 20, paddingVertical: 18 },
  cream: { backgroundColor: color.cream, borderRadius: 20, padding: 12 },
  newPill: { alignSelf: "flex-start", backgroundColor: color.gold, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10, marginBottom: 12 },
  tile: { flex: 1, backgroundColor: "#ffffff14", borderColor: "#ffffff33", borderWidth: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 10 },
  bead: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6, backgroundColor: "#ffffff14", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  tomorrow: { marginTop: 10, borderTopWidth: 1, borderTopColor: "#ffffff22", paddingTop: 10, width: "100%" },
});

/** Light for the "go deeper" round: 2 per first-try right, 5 more for a clean one. */
export function deepLight(right: number, asked: number) {
  return 2 * right + (asked && right === asked ? 5 : 0);
}

/** Light for a finished lesson: 10 for showing up, 1 per first-try right, a bonus for a clean run and for a long glow. */
export function lessonLight(right: number, asked: number, best: number) {
  return 10 + right + (asked && right === asked ? 5 : 0) + (best >= 5 ? 3 : 0);
}

/** Where the lesson sits on the five levels: five small suns, the lit ones yours. */
function LevelPill({ level, up }: { level: number; up?: boolean }) {
  return (
    <View accessibilityLabel={`level ${level} of 5: ${LEVELS[level]}${up ? ". next lesson goes up a level" : ""}`} style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#ffffff14", borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 }}>
      <Text style={{ letterSpacing: 2, fontSize: 12, color: color.gold }}>{[1, 2, 3, 4, 5].map((k) => (k <= level ? "☀" : "·")).join("")}</Text>
      <Text style={[type.eyebrow(8), { color: color.gold }]}>level {level} · {LEVELS[level]}{up ? " · next: ↑" : ""}</Text>
    </View>
  );
}

/** The mascot's victory: a jump with a fanfare, then a cheer. */
function Celebrate() {
  const [pose, setPose] = useState("jump");
  const s = useSharedValue(0.6);
  useEffect(() => {
    play("complete");
    s.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.back(2.2)) });
    const t = setTimeout(() => setPose("celebrate"), 900);
    return () => clearTimeout(t);
  }, [s]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ position: "absolute", top: 6, fontSize: 26, letterSpacing: 18 }} accessibilityElementsHidden>✨🎉✨</Text>
      <Animated.View style={anim}><Guy pose={pose} h={190} /></Animated.View>
    </View>
  );
}

/** The lesson's progress line fills instead of jumping. */
function Progress({ pct, hot }: { pct: number; hot?: boolean }) {
  const w = useSharedValue(pct);
  useEffect(() => { w.value = withTiming(pct, { duration: 380, easing: Easing.out(Easing.cubic) }); }, [pct, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View style={[st.track, { height: 10, borderRadius: 5 }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
      {/* the bar heats up on a combo */}
      <Animated.View style={[st.bar, { height: 10, borderRadius: 5, backgroundColor: hot ? "#FFD23F" : color.gold, shadowColor: "#FFD23F", shadowOpacity: hot ? 0.9 : 0, shadowRadius: hot ? 8 : 0 }, fill]} />
    </View>
  );
}
