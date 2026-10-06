import { track } from "@/lib/analytics";
import { pulseLesson } from "@/lib/pulse";
import { useTitle } from "@/lib/title";
// A day's lesson: v175 Session, as a real screen. Queue of steps, combo, "one more time" on the misses
// (nothing counted twice), then the tally. Leaving asks first; finishing records the sit and opens /done.
import { DOORS, GRADED, data, deeperRound, icon, kidLesson, knownSoFar, lessonInfo, native, planDay, pos, screenLines, splitBeats } from "@ih/content";
import { KidTally, kidPlanFor } from "@/session/kids";
import { dueCards, slipsFor } from "@/lib/missed";
import { recallQuestion } from "@/session/recall";
import { campName, doorLabel, isEs, t, type Key } from "@/i18n";
import { levelFor } from "@/lib/level";
import { practiceModeOf } from "@/lib/onboard";
import { learnSteps } from "@/session/learn";
import { lessonScript } from "@ih/content/lesson-script";
import { LESSONS_BASE, lessonStore } from "@/lib/lessons";
import { scriptWithin } from "@/session/script-load";
import { LessonSources } from "@/session/sources-sheet";
import { RhythmStep, RushStep, SayStep, ScenesStep, TypeItStep } from "@/session/games";
import { BuildStep, CheckinStep, SayText, StoryStep, ThinkStep, WrongStep } from "@/session/week";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, router, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hush, bell, speak, speakChrome } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { readJSON, remove, writeJSON } from "@/lib/storage";
import { play } from "@/lib/fx";
import { ComboBurst, FxProvider, ReactingGuy, cue, poseFor, type Reaction } from "@/session/juice";
import { today as todayNow } from "@/lib/time";
import { voiceLabel } from "@/lib/voice";
import { opensAhead } from "@/content/life-moments";
import { samplerOpens } from "@/content/sampler";
import { BetStep, BreathStep, ForkStep, MatchStep, MythStep, OptionStep, OrderStep, OriginalStep, SitStep, SpeakStep, TapHear, TrapdoorStep } from "@/session/steps";
import { BottomBar, Btn, Face, Guy, NavBar, Sun, color, confirmSheet, font, type } from "@/ui";
import { successHaptic, tapHaptic } from "@/lib/haptics";
import { SlotHost, SlotProvider } from "@/ui/slot";
import { ChevronLeft, SpeakerIcon } from "@/ui/tab-icons";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Enter } from "@/ui/enter";
import { useChrome } from "@/ui/chrome";

// The eyebrow over each step: the lesson part's name (planDay's segment type), or else the app's own name for the step.
const SEG_TYPES = ["recall", "bet", "myth", "fork", "original", "trapdoor", "bell", "guess", "order", "match", "listen", "scenes", "say", "rhythm", "typeit", "rush", "sit", "breath", "speak", "taphear", "fixintro", "tally", "wrong", "story", "build", "think", "lookback", "checkin"];
function segName(seg: string | undefined, type: string): string {
  if (seg) {
    const k = `session.part.${seg}` as Key;
    const v = t(k);
    return isEs() && v !== k ? v : seg;
  }
  return SEG_TYPES.includes(type) ? t(`session.seg.${type}` as Key) : "";
}
/** The level's name (first steps … keeper-level) in the current language. */
const levelName = (n: number) => (n >= 1 && n <= 5 ? t(`session.level.${n}` as Key) : "");

/** Spanish only: the first lesson on this phone says, once and honestly, that lessons are still in English. */
const ES_NOTE_KEY = "ih:es-lesson-note";
function EsLessonNote() {
  const [show, setShow] = useState(() => isEs() && !readJSON<boolean>(ES_NOTE_KEY, false));
  // once per phone: remembered as soon as it's shown, so it never comes back, even if this lesson is left early
  useEffect(() => { if (show) writeJSON(ES_NOTE_KEY, true); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!show) return null;
  return (
    <View testID="es-lesson-note" accessibilityLiveRegion="polite" style={st.esNote}>
      <View style={{ flex: 1 }}>
        <Text style={[type.eyebrow(8), { color: color.gold }]}>{t("lesson.enNote.title")}</Text>
        <Text style={[type.body(13), { color: "#ffffffcc", marginTop: 3 }]}>{t("lesson.enNote.body")}</Text>
      </View>
      <Pressable testID="es-lesson-note-ok" accessibilityRole="button" accessibilityLabel={t("session.enNote.a11y")} onPress={() => { tapHaptic(); setShow(false); }} hitSlop={6}
        style={({ pressed }) => [st.esNoteBtn, { opacity: pressed ? 0.7 : 1 }]}>
        <Text style={[type.eyebrow(8), { color: color.ink }]}>{t("lesson.enNote.ok")}</Text>
      </Pressable>
    </View>
  );
}

export default function SessionScreen() {
  const params = useLocalSearchParams<{ door: string; day: string; kid?: string; deep?: string }>();
  const { lessonFor, saved, derived, completeSit } = useStore();
  const door = String(params.door || "").toUpperCase();
  const day = Number(params.day);
  const kid = params.kid ? derived.kids.find((k: any) => k.id === params.kid) : null;
  const current = kid ? kid.day : lessonFor(door);
  const mode = kid && new Date().getFullYear() - (kid.birthYear || 2016) < 13 ? "kid" : "adult";
  // Deep links can't skip ahead: a lesson opens only up to where the door is, or a day already walked (someone who
  // walked back to an earlier stretch keeps the days they'd finished further up open).
  const walkedBefore = !kid && saved.sits.some((x) => !x.kidId && x.door === door && x.day === day);
  if (!DOORS.some(([, w]) => w === door)) return <Redirect href="/today" />;
  // ...except a day on their own first-week list (content/life-moments.ts): it opens as an extra, never moving the path
  // (or a day of their sampler week that has opened, content/sampler.ts: seven doors, one a day, the same way)
  const extra = !kid && Number.isInteger(day) && day > current && !walkedBefore && (opensAhead(saved.settings.profile, door, day) || samplerOpens(saved.settings.sampler, todayNow(), door, day));
  if (!Number.isInteger(day) || day < 1 || (day > current && !walkedBefore && !extra)) return <Redirect href={{ pathname: "/session/[door]/[day]", params: { door: door || saved.settings.homeWing, day: String(current) } }} />;
  // "go deeper" is an extra round on a lesson already walked today; children don't get it
  const deep = params.deep === "1" && !kid;
  // a child under 13 sits the door's kids' track, never the grown-up lesson (no script is fetched for it)
  if (mode === "kid") {
    if (!kidLesson(door, day)) return <Redirect href="/you/table" />;
    return <Session key={`${door}:${day}:kid`} door={door} day={day} kidId={kid?.id ?? null} mode="kid" deep={false} voiceOn={saved.settings.voiceOn} onFinish={completeSit} script={null} />;
  }
  return <ScriptedSession key={`${door}:${day}`} door={door} day={day} kidId={kid?.id ?? null} mode={mode} deep={deep} extra={extra} voiceOn={saved.settings.voiceOn} onFinish={completeSit} />;
}

// The day's full script (docs/curriculum/LESSON_LOADER.md) is resolved before the lesson starts, so the steps never
// change under the resume logic. A door or day with no script, no network with nothing kept, or a slow answer (over
// 2.5 s) gets null, and the lesson is built from the outline exactly as before.
function ScriptedSession(props: Parameters<typeof Session>[0]) {
  const { door, day } = props;
  const [script, setScript] = useState<any | null | undefined>(undefined); // undefined = still looking
  useEffect(() => {
    let live = true;
    scriptWithin(() => lessonScript(door, day, { base: LESSONS_BASE, store: lessonStore })).then((s) => { if (live) setScript(s); });
    return () => { live = false; };
  }, [door, day]);
  if (script === undefined) return <LessonLoading />;
  return <Session {...props} script={script} />;
}

/** A moment while the day's script arrives: the lesson's own gradient and the mascot, no text. */
function LessonLoading() {
  useChrome(true);
  return (
    <LinearGradient colors={color.dusk} locations={[0, 0.6, 1]} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View accessibilityRole="progressbar" accessibilityLabel={t("session.loading")} testID="lesson-loading"><Guy pose="wave" h={170} /></View>
    </LinearGradient>
  );
}

function Session({ door, day, kidId, mode, deep, extra = false, voiceOn, onFinish, script = null }: { door: string; day: number; kidId: string | null; mode: string; deep: boolean; extra?: boolean; voiceOn: boolean; onFinish: ReturnType<typeof useStore>["completeSit"]; script?: any | null }) {
  const ic = icon(door);
  const { earnLight, recordRun, recordFeel, update, noteLearning, saved: me } = useStore();
  useTitle(`${t("session.title", { door: doorLabel(door).toLowerCase(), day })}${deep ? t("session.title.deeper") : ""}`);
  useChrome(true);
  // The level is fixed for the whole lesson (it moves between lessons, never in the middle of one).
  const [level] = useState(() => (mode === "adult" ? levelFor({ door, day, profile: me.settings.profile, runs: me.settings.runs }) : 1));
  // "just learn": no breath or sit, and the practice is told as how it's done (fixed for the whole lesson)
  const [learn] = useState(() => practiceModeOf(me.settings.profile) === "learn");
  // Words that slipped before and are due today come back as "one from before" (two at most, fixed for the lesson;
  // grown-ups' own lessons only). The door's words so far are what a slip can be about.
  const own = mode === "adult" && !kidId && !deep && !extra;
  const [recallCards] = useState(() => (own ? dueCards(me.missed || [], door, todayNow(), { n: 2 }) : []));
  const vocab = useMemo(() => new Map(knownSoFar(door, day).map((k) => [k.word.toLowerCase(), k])), [door, day]);
  // The first lesson after placement (day 22 for someone who skipped camp one): there was no "yesterday" on this path,
  // so the script's look back at day 21 gives way to the welcome day one would have had, and a line on where they are.
  const [placedFirst] = useState(() => own && day > 1 && day === (me.settings.placed?.[door] ?? 1) && !me.settings.moved?.[door] && !me.sits.some((x) => !x.kidId && x.door === door && x.day === day - 1));
  const kidMode = mode === "kid";
  const plan = useMemo<{ steps: any[]; word: string; carry: string; title: string; info: any; kid?: any }>(() => {
    // kid mode never falls back to the grown-up lesson (SessionScreen only opens it when the door has a kids' set)
    if (kidMode) return kidPlanFor(door, day) ?? { steps: [{ type: "tally", id: 0 }], word: "", carry: "", title: "", info: null, kid: null };
    const p = !deep ? planDay({ wing: door, day, mode, level: mode === "adult" ? level : 0, script }) : { ...planDay({ wing: door, day, mode, script }), steps: deeperRound(door, day, level) };
    let steps = learn ? learnSteps(p.steps, p.info?.script ? p.info.howItsDone : null) : p.steps;
    if (placedFirst) {
      let id = Math.max(...steps.map((x: any) => x.id)) + 1;
      const p0 = pos(day);
      const welcome = [
        ...splitBeats(String(data.WELCOME[door] || data.WELCOME.SPIRITUAL || ""), 45, 2).map((text: string) => ({ type: "beat", seg: "a welcome", text, head: null, id: id++ })),
        { type: "beat", seg: "a welcome", text: t("session.placed.beat", { day, camp: campName(p0.camp, p0.name).toLowerCase(), end: day - 1 }), head: null, id: id++ },
      ];
      const at = steps.findIndex((x: any) => x.type === "beat" && /^review/.test(String(x.seg || "")));
      steps = steps.filter((x: any) => !(x.type === "beat" && /^review/.test(String(x.seg || ""))));
      const where = at >= 0 ? at : Math.max(0, steps.findIndex((x: any) => x.type !== "bell"));
      steps = [...steps.slice(0, where), ...welcome, ...steps.slice(where)];
    }
    if (extra && !placedFirst) {
      // A first-week lesson read ahead (content/life-moments.ts) had no "yesterday" either: its look back at the day
      // before goes. For someone's very first lesson (the gentle and light ways in, lib/lane.ts), the door's welcome
      // takes its place, as day one would have had it.
      const at = steps.findIndex((x: any) => x.type === "beat" && /^review/.test(String(x.seg || "")));
      steps = steps.filter((x: any) => !(x.type === "beat" && /^review/.test(String(x.seg || ""))));
      if (!me.sits.some((x) => !x.kidId) && !(me.settings.forYouDone || []).length) {
        let id = Math.max(...steps.map((x: any) => x.id)) + 1;
        const welcome = splitBeats(String(data.WELCOME[door] || data.WELCOME.SPIRITUAL || ""), 45, 2).map((text: string) => ({ type: "beat", seg: "a welcome", text, head: null, id: id++ }));
        const where = at >= 0 ? at : Math.max(0, steps.findIndex((x: any) => x.type !== "bell"));
        steps = [...steps.slice(0, where), ...welcome, ...steps.slice(where)];
      }
    }
    const cards = recallCards.filter((c) => c.word.toLowerCase() !== String(p.word).toLowerCase());
    if (cards.length) {
      let id = Math.max(...steps.map((x: any) => x.id)) + 1;
      const recall = cards.map((c, k) => recallQuestion(c, day, day * 17 + k)).filter(Boolean).map((q) => ({ type: "recall", graded: true, ...q!, id: id++ }));
      // the weekly quick round leans on them too
      const words = new Set(cards.map((c) => c.word.toLowerCase()));
      steps = steps.map((x: any) => (x.type === "rush" ? { ...x, pairs: [...cards.map((c) => [c.word, c.carry.replace(/[.!]$/, "")]), ...x.pairs.filter((pr: string[]) => !words.has(pr[0].toLowerCase()))].slice(0, x.pairs.length) } : x));
      steps = [...steps.slice(0, -1), ...recall, steps[steps.length - 1]]; // just before the tally
    }
    return { ...p, steps };
  }, [door, day, mode, level, deep, learn, script, recallCards, placedFirst, extra]); // eslint-disable-line react-hooks/exhaustive-deps
  const shownLevel = deep ? Math.min(5, level + 2) : level;
  const [rushSecs, setRushSecs] = useState<number | null>(null);
  const [feel, setFeel] = useState<string | null>(null);
  // A reload mid-lesson picks up where you were (same lesson, same day only); finishing or leaving clears it.
  const resumeKey = `ih:lesson:${door}:${day}:${kidId || "me"}${deep ? ":deep" : ""}:L${level}${script ? ":S" : ""}${kidMode ? ":K1" : ""}`;
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
  // first tries that slipped (words) and the "one from before" answers, kept for the missed-words schedule at the end
  const [slips, setSlips] = useState<string[]>(saved0?.slips ?? []);
  const [recalled, setRecalled] = useState<{ word: string; ok: boolean }[]>(saved0?.recalled ?? []);
  const pairSlips = useRef<string[]>([]); // the pairs tried wrong in the step on screen
  useEffect(() => {
    if (qi === 0 && phase === "play") return; // nothing worth resuming yet
    writeJSON(resumeKey, { date: todayNow(), queue, qi, phase, missed, score, best, slips, recalled });
  }, [queue, qi, phase, missed, score, best, slips, recalled]); // eslint-disable-line react-hooks/exhaustive-deps
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
  // Looking back is separate from answering (2026-10-03 review): the back arrow steps to the previous reading screen,
  // skipping games already answered, and going forward again skips them too, back to where you were. Answers never
  // re-open, so nothing is scored twice.
  const readable = (id: number | undefined) => { const s0 = plan.steps.find((x) => x.id === id); return !!s0 && ["beat", "bell"].includes(s0.type); };
  const [furthest, setFurthest] = useState<number>(saved0?.qi ?? 0);
  useEffect(() => { if (phase === "play") setFurthest((f0) => Math.max(f0, qi)); }, [qi, phase]);
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
    if (phase === "play" && qi < furthest) {
      let k = qi + 1;
      while (k < furthest && !readable(queue[k])) k++;
      setQi(k);
      return;
    }
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
  }, [phase, qi, queue, missed, plan, furthest]); // eslint-disable-line react-hooks/exhaustive-deps

  // Upgraded lessons (a script with games.build): getting the opener right offers to skip the rest of the teaching. The
  // teaching bubbles still ahead drop out of the queue; every game stays.
  const upgraded = plan.steps.some((s) => s.type === "build");
  const isTeachBeat = (id: number) => { const s0 = plan.steps.find((x) => x.id === id); return !!s0 && s0.type === "beat" && /^the teach/.test(String(s0.seg || "")); };
  const skipTeach = (ok: boolean | null) => {
    setQueue((q) => [...q.slice(0, qi + 1), ...q.slice(qi + 1).filter((id) => !isTeachBeat(id))]);
    track("lesson_step", { door, day, i: qi, of: queue.length, type: "skip_teach", phase });
    verdict(ok);
  };

  const verdict = (ok: boolean | null) => {
    // (the combo, sound and mascot already reacted when the answer landed — see `react`)
    if (ok === null || ok === undefined) return next();
    const tried = pairSlips.current;
    pairSlips.current = [];
    if (phase === "play" && step?.type === "recall") setRecalled((r) => [...r.filter((x) => x.word !== step.word), { word: step.word, ok: !!ok }]);
    else if (phase === "play" && !ok && own) {
      const words = slipsFor(step as any, plan.word, tried).filter((w) => vocab.has(w.toLowerCase()));
      if (words.length) setSlips((x) => [...new Set([...x, ...words])]);
    }
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
    if (step.type === "beat") { const t = setTimeout(() => (kidMode ? speakChrome : speak)(step.text, voiceOn), 250); return () => { clearTimeout(t); hush(); }; }
    if (step.type === "fixintro") speakChrome(t("session.fix.say"), voiceOn);
    if (step.type === "tally") { speakChrome(t("session.tally.say", { day }), voiceOn); bell(); }
  }, [qi, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = () => {
    if (finished.current) return; // a fast double-tap must not save two sits
    finished.current = true;
    hush();
    remove(resumeKey);
    const asked = score.asked || graded;
    if (extra) {
      // a first-week lesson opened ahead of the path: remembered as read, never a sit (the path and streak stay put)
      const key = `${door}:${day}`;
      // its date is kept too: not a sit, but a day they came (lib/lane.ts daysCome, for the deferred check-in)
      const on = todayNow();
      update({ forYouDone: [...(me.settings.forYouDone || []).filter((k) => k !== key), key], forYouOn: [...(me.settings.forYouOn || []).filter((d) => d !== on), on].slice(-30) });
      // a short, warm close: after a gentle lesson the Guide is offered softly (/done/week), then Today
      router.replace({ pathname: "/done/week", params: { door, day: String(day) } });
      return;
    }
    if (deep) {
      // the extra round: light and a best time, never a second sit
      earnLight(deepLight(score.right, asked), best, false);
      recordRun({ door, day, acc: asked ? score.right / asked : 1, level: shownLevel, rushSecs, deep: true });
      router.replace("/today");
      return;
    }
    const minutes = Math.max(1, Math.round((Date.now() - t0.current) / 60000));
    if (!kidId) recordRun({ door, day, acc: asked ? score.right / asked : 1, level, rushSecs, minutes });
    if (own) noteLearning({ door, slips: slips.map((w) => vocab.get(w.toLowerCase())!).filter(Boolean), recalled });
    // a one-off visit to another door comes straight back to your own path
    if (!kidId && door !== me.settings.homeWing && me.settings.active === "visit") update({ active: "home" });
    const outcome = onFinish({ door, day, kidId });
    if (!kidId) earnLight(lessonLight(score.right, score.asked || graded, best), best, score.asked > 0 && score.right === score.asked);
    track("lesson_done", { door, day, right: score.right, asked: score.asked, newDay: outcome.isNewDay, kid: !!kidId });
    if (!kidId) pulseLesson(todayNow(), day <= 7 ? day : null); // anonymous: "a lesson was finished today", and which of days 1–7 (lib/pulse)
    // a child's sit moves the child's hill and the child's streak, not yours: a kid-sized cheer, then back to the table
    if (kidId) {
      if (me.settings.streakOn !== false && outcome.streak.grew) router.replace({ pathname: "/done/kid", params: { door, day: String(day), kid: kidId, streak: String(outcome.streak.after), prev: String(outcome.streak.before) } });
      else router.canGoBack() ? router.back() : router.replace("/you/table");
      return;
    }
    const st = outcome.streak;
    // the streak's facts ride along to the after-lesson screens (the streak screen is /done/lit), and tomorrow's title
    // for the last one (/done/tomorrow); nothing shows in the lesson itself
    router.replace({ pathname: "/done", params: { door, day: String(day), right: String(score.right), total: String(score.asked), word: plan.word, carry: plan.carry, minutes: String(minutes), newDay: outcome.isNewDay ? "1" : "0", count: String(outcome.showedUp), milestone: st.milestone ? String(st.milestone) : "", streak: String(st.after), prev: String(st.before), restored: st.restored ? "1" : "", tomorrow: (script?.tomorrow || lessonInfo(door, day + 1)?.title || "").slice(0, 120) } });
  };
  const leave = () => { finished.current = true; hush(); remove(resumeKey); router.canGoBack() ? router.back() : router.replace("/today"); };
  // The one confirm panel the whole app uses, not a lesson-only dialog.
  function askLeave(then: () => void = leave) {
    confirmSheet({ title: t("session.leave.title"), body: t("session.leave.body"), confirm: t("session.leave.confirm"), cancel: t("session.leave.cancel") })
      .then((ok) => { if (ok) { finished.current = true; hush(); remove(resumeKey); then(); } });
  }

  let backTo = -1;
  if (phase === "play") for (let j = qi - 1; j >= 0; j--) if (readable(queue[j])) { backTo = j; break; }
  const canBack = backTo >= 0;
  const pct = phase === "play" ? Math.round((qi / Math.max(1, total - 1)) * 100) : 100;
  // the welcome is in the voice's own words, so the header says whose welcome it is (the house voice reads it until they record)
  const segLabel = step ? (step.label ? String(step.label) : step.seg === "a welcome" && !kidMode ? t("session.seg.welcomeOf", { name: ic.short }) : step.type === "breath" && step.n > 1 ? t("session.seg.breaths", { count: step.n }) : segName(step.seg, step.type)) : "";
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
              <Pressable accessibilityRole="button" accessibilityLabel={t("session.prevScreen")} accessibilityState={{ disabled: !canBack }} aria-disabled={!canBack} disabled={!canBack} onPress={() => { tapHaptic(); setQi(backTo); }} hitSlop={4}
                style={({ pressed }) => ({ minWidth: 36, minHeight: 44, alignItems: "center", justifyContent: "center", opacity: !canBack ? 0.25 : pressed ? 0.5 : 0.8 })}>
                <ChevronLeft color="#fff" size={20} />
              </Pressable>
              <View style={{ flex: 1 }}>
                {combo >= 2 ? <Text style={[type.eyebrow(), st.combo, combo >= 3 ? { color: "#FFD23F" } : null]}>{combo >= 3 ? t("session.glowing", { n: combo }) : t("session.inARow", { n: combo })}</Text> : pct >= 80 && pct < 100 && phase === "play" ? <Text style={[type.eyebrow(), st.combo]}>{t("session.almost")}</Text> : null}
                <Progress pct={pct} hot={combo >= 3} />
              </View>
            </View>
          }
          right={<Text style={[type.eyebrow(), { color: "#ffffff99", paddingRight: 10, opacity: step.type === "tally" ? 0 : 1 }]}>{phase === "play" ? `${Math.min(qi + 1, queue.length)}/${queue.length}` : phase === "fix" ? t("session.again", { a: Math.min(qi + 1, Math.max(1, queue.length - 1)), b: Math.max(1, queue.length - 1) }) : ""}</Text>}
        />
        <View style={st.who}>
          {/* a child's lesson shows no proposed voice's face */}
          {kidMode ? null : <Face ic={ic} w={36} h={36} r={18} caption={false} />}
          <Text style={[type.eyebrow(), { color: "#ffffffbb", flex: 1 }]} numberOfLines={2}>{kidMode ? t("kids.reads", { door: doorLabel(door) }) : t("session.reads", { voice: voiceLabel(door, ic.short).short, door: doorLabel(door) })}{segLabel ? ` · ${segLabel}` : ""}</Text>
          <ReactingGuy h={58} rest={step.type === "breath" || step.type === "sit" ? "meditate" : step.type === "tally" ? "celebrate" : undefined} />
        </View>
        {kidMode ? null : <EsLessonNote />}
        <ScrollView key={k} contentContainerStyle={[st.body, { justifyContent: top ? "flex-start" : "center" }]}>
          <Enter style={{ width: "100%", alignItems: "center" }}>
            {step.newToday ? <View style={[st.newPill, { alignSelf: "flex-start" }]} accessibilityLabel={t("session.newToday")}><Text style={[type.eyebrow(), { color: color.ink }]}>{t("session.newToday")}</Text></View> : null}
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
      return frame(<View style={{ alignItems: "center", gap: 16 }}><Guy pose="think" h={160} /><Text style={[type.h1(30), { color: "#fff", textAlign: "center" }]}>{t("session.fix.title")}</Text><Text style={[type.body(), { color: "#ffffffaa" }]}>{t("session.fix.body")}</Text></View>, { foot: <Btn kind="gold" onPress={() => next()}>{t("session.fix.go")}</Btn> });
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
            <SayText door={door} text={step.text} style={{ fontFamily: font.display[700], fontSize: fs, lineHeight: fs * 1.3, color: color.ink, letterSpacing: -0.2 }} />
          </View>
          <View style={{ width: 0, height: 0, marginLeft: 38, marginTop: -12, borderLeftWidth: 12, borderRightWidth: 12, borderTopWidth: 14, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#fff" }} />
          <Guy pose={BEAT_POSES[qi % BEAT_POSES.length]} h={150} style={{ alignSelf: "flex-start", marginLeft: 6 }} />
        </View>,
        { foot: <View style={{ gap: 4 }}><Pressable accessibilityRole="button" accessibilityLabel={t("session.hearAgainA11y")} onPress={() => (kidMode ? speakChrome : speak)(step.text, true)} style={({ pressed }) => ({ minHeight: 44, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.5 : 1 })}><SpeakerIcon color="#ffffff99" /><Text style={[type.eyebrow(), { color: "#ffffff99" }]}>{t("session.hearAgain")}</Text></Pressable><Btn testID="next" kind="gold" onPress={() => next()}>{t("session.next")}</Btn></View> },
      );
    }
    case "bet": return frame(<BetStep step={step} onDone={verdict} onSkip={upgraded && phase === "play" ? () => skipTeach(true) : undefined} />, { top: true });
    case "myth": return frame(<MythStep step={step} onDone={verdict} />, { top: true });
    case "fork": return frame(<ForkStep step={step} onDone={() => next()} />, { top: true });
    case "original": return frame(<OriginalStep step={step} voiceOn={voiceOn} onDone={() => next()} />, { top: true });
    case "trapdoor": return frame(<TrapdoorStep step={step} onDone={() => next()} />, { top: true });
    case "wrong": return frame(<WrongStep step={step} onDone={() => next()} />);
    case "story": return frame(<StoryStep step={step} door={door} onDone={() => next()} />, { top: true });
    case "build": return frame(<BuildStep step={step} onDone={verdict} />, { top: true });
    case "think": return frame(<ThinkStep step={step} onDone={verdict} />, { top: true });
    case "checkin": return frame(<CheckinStep step={step} onMiss={(w) => { pairSlips.current.push(w); }} onDone={verdict} />, { top: true });
    case "guess":
    case "lookback":
    case "recall":
    case "listen": return frame(<OptionStep step={step} voiceOn={voiceOn} onDone={verdict} onSkip={upgraded && phase === "play" && step.type === "guess" ? () => skipTeach(null) : undefined} />);
    case "order":
      return frame(<View style={{ width: "100%" }}><Text style={[type.h1(24), { color: "#fff", marginBottom: 14 }]}>{step.prompt}</Text><View style={st.cream}><OrderStep step={step} onDone={(ok) => setTimeout(() => verdict(ok), 500)} /></View></View>, { top: true });
    case "match":
      return frame(<View style={{ width: "100%" }}><Text style={[type.h1(24), { color: "#fff", marginBottom: 14 }]}>{step.prompt}</Text><View style={st.cream}><MatchStep step={step} onMiss={(l) => { pairSlips.current.push(l); }} onDone={(ok) => setTimeout(() => verdict(ok), 300)} /></View></View>, { top: true });
    case "taphear": return frame(<TapHear step={step} voiceOn={voiceOn} onDone={verdict} />);
    case "scenes":
      return frame(<View style={{ width: "100%" }}><Text style={[type.h1(24), { color: "#fff", marginBottom: 8 }]}>{step.prompt}</Text><ScenesStep step={step} onDone={verdict} /></View>, { top: true });
    case "say": return frame(<SayStep step={step} voiceOn={voiceOn} onDone={() => next()} />);
    case "rhythm": return frame(<RhythmStep step={step} voiceOn={voiceOn} onDone={verdict} />);
    case "typeit": return frame(<TypeItStep step={step} voiceOn={voiceOn} onDone={verdict} />, { top: true });
    case "rush": return frame(<RushStep step={step} best={me.settings.rushBest?.[door] ?? null} onMiss={(l) => { pairSlips.current.push(l); }} onDone={(ok, secs) => { if (secs) setRushSecs(secs); verdict(ok); }} />, { top: true });
    case "sit": return frame(<SitStep secs={step.secs} onDone={() => next()} />);
    case "breath": return frame(<BreathStep n={step.n} onDone={() => next()} />);
    case "speak":
      return frame(<View style={[st.cream, { paddingVertical: 22, width: "100%" }]}><SpeakStep step={step} onDone={() => next()} /><Text style={[type.body(12), { color: color.mute, textAlign: "center", marginTop: 10 }]}>{step.hint}</Text></View>);
    case "tally": {
      // a child's tally: the word, the games, the line, and the "for grown-ups" note for whoever holds the phone
      if (kidMode) return frame(<KidTally plan={plan} day={day} right={score.right} asked={score.asked || graded} best={best} celebrate={<Celebrate />} />, { foot: <Btn testID="finish" kind="gold" onPress={finish}>{t("kids.finish")}</Btn> });
      const info = plan.info;
      // The win screen, in our own look: the light you earned, how on-target you were and how long it took, on one
      // gold-rimmed card; a fanfare; the mascot celebrating.
      const asked = score.asked || graded;
      const acc = asked ? Math.round((100 * score.right) / asked) : 100;
      const light = lessonLight(score.right, asked, best);
      const secs = Math.max(30, Math.round((Date.now() - t0.current) / 1000));
      const accLabel = acc >= 50 ? t("session.stat.onTarget") : t("session.stat.learning");
      // day one has a single graded question: one fixed miss is not "0%", it's a first try that got fixed
      const accStat: [string, string, string] = day === 1 && acc < 100 ? ["◎", "✓", t("session.stat.allFixed")] : ["◎", `${acc}%`, accLabel];
      const stats: [string, string, string][] = [["☀", `+${light}`, t("session.stat.light")], accStat, ["◷", `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`, t("session.stat.time")]];
      const nextLevel = mode === "adult" && !deep ? levelFor({ door, day: day + 1, profile: me.settings.profile, runs: [...(me.settings.runs || []), { door, acc: asked ? score.right / asked : 1, level }] }) : level;
      const feelRow = !kidId ? (
        <View style={{ alignItems: "center", gap: 8, marginTop: 4 }}>
          <Text style={[type.eyebrow(8), { color: "#ffffff99" }]}>{feel ? t("session.feel.thanks") : t("session.feel.ask")}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {([["slow", t("session.feel.slow")], ["right", t("session.feel.right")], ["hard", t("session.feel.hard")]] as const).map(([id, l]) => (
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
            <Text accessibilityRole="header" style={{ fontFamily: font.mark[800], fontSize: 34, color: color.gold, textAlign: "center" }}>{t("session.deep.title")}</Text>
            <LevelPill level={shownLevel} />
            <View style={{ flexDirection: "row", width: "100%", borderRadius: 22, borderWidth: 2, borderColor: color.gold, backgroundColor: "#ffffff0d", paddingVertical: 14 }}>
              {([["☀", `+${deepLight(score.right, asked)}`, t("session.stat.light")], ["◎", `${acc}%`, accLabel], ["⏱", rushSecs ? `${rushSecs}s` : "—", t("session.stat.quick")]] as const).map(([g, v, l], k) => (
                <View key={l} style={{ flex: 1, alignItems: "center", borderLeftWidth: k ? 1 : 0, borderLeftColor: "#ffffff22" }}>
                  <Text style={{ fontSize: 18, color: color.gold }}>{g}</Text>
                  <Text style={{ fontFamily: font.display[800], fontSize: 24, color: "#fff", marginTop: 2 }}>{v}</Text>
                  <Text style={[type.eyebrow(8), { color: "#ffffffaa", marginTop: 2 }]}>{l}</Text>
                </View>
              ))}
            </View>
            <Text style={[type.body(14), { color: "#ffffffcc", textAlign: "center" }]}>{acc === 100 ? t("session.deep.clean") : t("session.deep.body")}</Text>
            {feelRow}
          </View>,
          { foot: <Btn testID="finish" kind="gold" onPress={finish}>{t("session.deep.back")}</Btn> },
        );
      }
      return frame(
        <View style={{ alignItems: "center", gap: 14, width: "100%" }}>
          <Celebrate />
          <Text accessibilityRole="header" style={{ fontFamily: font.mark[800], fontSize: 36, color: color.gold, textAlign: "center" }}>{day === 1 ? t("session.tally.first") : t("session.tally.day", { day })}</Text>
          {mode === "adult" && day > 1 ? <LevelPill level={level} up={nextLevel > level} /> : null}
          <Text style={[type.body(15), { color: "#ffffffcc", marginTop: -8 }]}>{acc === 100 ? t("session.tally.clean") : t("session.tally.body")}</Text>
          <View style={{ flexDirection: "row", width: "100%", borderRadius: 22, borderWidth: 2, borderColor: color.gold, backgroundColor: "#ffffff0d", paddingVertical: 14 }}>
            {stats.map(([g, v, l], k) => (
              <View key={l} style={{ flex: 1, alignItems: "center", borderLeftWidth: k ? 1 : 0, borderLeftColor: "#ffffff22" }}>
                <Text style={{ fontSize: 18, color: color.gold }}>{g}</Text>
                <Text style={{ fontFamily: font.display[800], fontSize: 24, color: "#fff", marginTop: 2 }}>{v}</Text>
                <Text style={[type.eyebrow(8), { color: "#ffffffaa", marginTop: 2 }]}>{l}</Text>
              </View>
            ))}
          </View>
          {/* (2026-10-03 review: the win screen was busy. The word, the line and the bead now live on the next screen,
              done/index, which leads with them; here it is the celebration, three numbers and how it felt.) */}
          {feelRow}
          <LessonSources sources={script?.sources} />
        </View>,
        { foot: <Btn testID="finish" kind="gold" onPress={finish}>{t("session.tally.finish")}</Btn> },
      );
    }
    default:
      return frame(<Text style={[type.body(), { color: "#fff" }]}>…</Text>, { foot: <Btn kind="gold" onPress={() => next()}>{t("session.next")}</Btn> });
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
  esNote: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10, marginHorizontal: 20, backgroundColor: "#ffffff14", borderColor: "#ffffff33", borderWidth: 1, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  esNoteBtn: { backgroundColor: color.gold, borderRadius: 999, minHeight: 36, paddingVertical: 8, paddingHorizontal: 12, justifyContent: "center" },
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
    <View accessibilityLabel={`${t("session.level.a11y", { n: level, name: levelName(level) })}${up ? t("session.level.a11yUp") : ""}`} style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#ffffff14", borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 }}>
      <Text style={{ letterSpacing: 2, fontSize: 12, color: color.gold }}>{[1, 2, 3, 4, 5].map((k) => (k <= level ? "☀" : "·")).join("")}</Text>
      <Text style={[type.eyebrow(8), { color: color.gold }]}>{t("session.level.pill", { n: level, name: levelName(level) })}{up ? t("session.level.up") : ""}</Text>
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
