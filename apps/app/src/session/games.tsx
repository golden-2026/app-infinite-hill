// The hands-on games: drag the scenes into order, say it (microphone, when the browser has one), tap the
// word's rhythm, type what you hear, and the quick timed round. Same rules as the other steps: a miss gets a
// shrug and the answer, "next" lives in the pinned bottom bar, and nothing here ever blocks the lesson.
import { likeness } from "@ih/content";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming, type SharedValue } from "react-native-reanimated";
import { play } from "@/lib/fx";
import { speak } from "@/lib/sound";
import { Btn, Guy, color, font, type } from "@/ui";
import { SlotFill } from "@/ui/slot";
import { Verdict, useFx } from "@/session/juice";
import { t } from "@/i18n";

type Done = (ok: boolean | null) => void;
const norm = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();

function edits(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

function Replay({ text, left, onUse }: { text: string; left: number; onUse: () => void }) {
  const out = left <= 0;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={out ? t("session.noReplays") : t("session.hearAgainA11y")} disabled={out} onPress={() => { speak(text, true); onUse(); }} style={[s.pill, out ? { opacity: 0.35 } : null]}>
      <Text style={s.pillText}>🔊 {out ? t("session.noReplays") : left < 9 ? t("session.hearAgainLeft", { n: left }) : t("session.hearAgain")}</Text>
    </Pressable>
  );
}

// ─── drag the scenes into order ─────────────────────────────────────────
const ROW = 58;
const SLOT = ROW + 8;

function SceneRow({ id, text, n, positions, locked, right, onDrop, onMove }: { id: number; text: string; n: number; positions: SharedValue<Record<number, number>>; locked: boolean; right: boolean | null; onDrop: () => void; onMove: (dir: -1 | 1) => void }) {
  const top = useSharedValue(positions.value[id] * SLOT);
  const lift = useSharedValue(0);
  const start = useSharedValue(0);
  const dragging = useSharedValue(false);
  useAnimatedReaction(() => positions.value[id], (cur, prev) => { if (cur !== prev && !dragging.value) top.value = withSpring(cur * SLOT, { damping: 18, stiffness: 220 }); });
  const pan = Gesture.Pan().enabled(!locked).minDistance(2)
    .onStart(() => { dragging.value = true; start.value = top.value; lift.value = withTiming(1, { duration: 120 }); })
    .onUpdate((e) => {
      top.value = start.value + e.translationY;
      const to = Math.max(0, Math.min(n - 1, Math.round(top.value / SLOT)));
      const from = positions.value[id];
      if (to !== from) {
        const next = { ...positions.value };
        for (const k of Object.keys(next)) if (next[+k] === to) next[+k] = from;
        next[id] = to;
        positions.value = next;
      }
    })
    .onEnd(() => { dragging.value = false; lift.value = withTiming(0, { duration: 160 }); top.value = withSpring(positions.value[id] * SLOT, { damping: 18, stiffness: 220 }); runOnJS(onDrop)(); });
  const anim = useAnimatedStyle(() => ({ top: top.value, zIndex: dragging.value ? 10 : 1, transform: [{ scale: 1 + lift.value * 0.04 }, { rotate: `${lift.value * -1.2}deg` }], shadowOpacity: 0.1 + lift.value * 0.25 }));
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[s.scene, anim, right === true ? { backgroundColor: color.gold, borderColor: color.gold } : right === false ? { borderColor: "#E5484D" } : null]}>
        <Text style={s.grip} accessibilityElementsHidden>⋮⋮</Text>
        <Text style={s.sceneText} numberOfLines={2}>{text}</Text>
        {!locked ? (
          <View style={{ flexDirection: "row" }}>
            <Pressable accessibilityRole="button" accessibilityLabel={t("session.scene.up", { t: text })} hitSlop={6} onPress={() => onMove(-1)} style={s.arrow}><Text style={s.arrowText}>▲</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={t("session.scene.down", { t: text })} hitSlop={6} onPress={() => onMove(1)} style={s.arrow}><Text style={s.arrowText}>▼</Text></Pressable>
          </View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

export function ScenesStep({ step, onDone }: { step: any; onDone: Done }) {
  const items: string[] = step.items;
  const start = useMemo(() => {
    // a real shuffle that never starts already solved
    let o = items.map((_, i) => i);
    for (let t = 0; t < 8 && o.every((v, i) => v === i); t++) o = [...o].sort(() => Math.random() - 0.5);
    if (o.every((v, i) => v === i)) o = [...o.slice(1), o[0]];
    return Object.fromEntries(o.map((itemIdx, pos) => [itemIdx, pos])) as Record<number, number>;
  }, [items]);
  const positions = useSharedValue<Record<number, number>>(start);
  const [result, setResult] = useState<boolean | null>(null);
  const [, bump] = useState(0);
  const fx = useFx();
  const onDrop = () => { play("tap"); bump((x) => x + 1); };
  const move = (id: number, dir: -1 | 1) => {
    const from = positions.value[id];
    const to = Math.max(0, Math.min(items.length - 1, from + dir));
    if (to === from) return;
    const next = { ...positions.value };
    for (const k of Object.keys(next)) if (next[+k] === to) next[+k] = from;
    next[id] = to;
    positions.value = next;
    onDrop();
  };
  const check = () => {
    const ok = items.every((_, i) => positions.value[i] === i);
    setResult(ok);
    fx.react(ok ? "right" : "wrong");
  };
  return (
    <View style={{ width: "100%", gap: 12 }}>
      <Text style={[type.body(13), { color: "#ffffffaa" }]}>{t("session.scene.hint")}</Text>
      <View style={{ height: items.length * SLOT }}>
        {items.map((scene, i) => <SceneRow key={i} id={i} text={scene} n={items.length} positions={positions} locked={result !== null} right={result === null ? null : positions.value[i] === i} onDrop={onDrop} onMove={(d) => move(i, d)} />)}
      </View>
      {result === null ? <SlotFill><Btn kind="gold" onPress={check}>{t("session.check")}</Btn></SlotFill> : (
        <Verdict ok={result} seed={items.length} body={result ? t("session.scene.right") : t("session.itGoes", { list: items.map((v, k) => `${k + 1}. ${v}`).join("  ") })} onNext={() => onDone(result)} />
      )}
    </View>
  );
}

// ─── say it (microphone) ────────────────────────────────────────────────
function recognizer(): any {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function SayStep({ step, voiceOn, onDone }: { step: any; voiceOn: boolean; onDone: Done }) {
  const SR = useMemo(recognizer, []);
  const [mode, setMode] = useState<"ready" | "listening" | "heard" | "manual">(SR ? "ready" : "manual");
  const [heard, setHeard] = useState<{ text: string; ok: boolean } | null>(null);
  const [tries, setTries] = useState(0);
  const rec = useRef<any>(null);
  const fx = useFx();
  const target: string = step.say;
  useEffect(() => {
    const t = setTimeout(() => speak(target, voiceOn), 350);
    return () => { clearTimeout(t); try { rec.current?.abort(); } catch {} };
  }, [target, voiceOn]);
  const listen = () => {
    try {
      const r = new SR();
      rec.current = r;
      r.lang = "en-US";
      r.interimResults = false;
      r.maxAlternatives = 5;
      let got = false;
      r.onresult = (e: any) => {
        got = true;
        const alts: string[] = Array.from(e.results[0] || []).map((a: any) => a.transcript);
        const words = norm(target).length;
        const ok = alts.some((a) => { const x = norm(a), y = norm(target); return x.includes(y) || likeness(a, target) >= (words > 12 ? 0.5 : 0.55) || edits(x, y) <= Math.max(1, Math.floor(y.length / 4)); });
        setHeard({ text: alts[0] || "", ok });
        setMode("heard");
        setTries((n) => n + 1);
        fx.react(ok ? "right" : "neutral");
      };
      r.onerror = (e: any) => { if (e?.error === "not-allowed" || e?.error === "service-not-allowed" || e?.error === "audio-capture") setMode("manual"); else setMode("ready"); };
      r.onend = () => { if (!got) setMode((m) => (m === "listening" ? "ready" : m)); };
      r.start();
      setMode("listening");
      setTimeout(() => { try { r.stop(); } catch {} }, 6000);
    } catch { setMode("manual"); }
  };
  const long = target.length > 14;
  return (
    <View style={{ alignItems: "center", width: "100%", gap: 14 }}>
      <Text style={[type.eyebrow(), { color: color.gold }]}>{long ? t("session.say.line") : t("session.say.loud")}</Text>
      <Text style={{ fontFamily: font.display[800], fontSize: long ? 28 : 44, lineHeight: long ? 34 : 50, letterSpacing: -0.6, color: "#fff", textAlign: "center" }}>{target}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t("session.hearIt")} onPress={() => speak(target, true)} style={[s.pill, { alignSelf: "center" }]}><Text style={s.pillText}>{t("session.hearItBtn")}</Text></Pressable>
      {mode === "manual" ? (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel={t("session.saidIt")} onPress={() => { fx.react("neutral"); setTimeout(() => onDone(null), 700); }} style={[s.mic, { backgroundColor: color.gold }]}><Text style={{ fontSize: 36 }}>🗣</Text></Pressable>
          <Text style={[type.body(13), { color: "#ffffffaa", textAlign: "center" }]}>{t("session.say.noMic")}</Text>
        </>
      ) : mode === "heard" && heard ? (
        <>
          <Guy pose={heard.ok ? "cheer" : "think"} h={96} />
          <Text style={[type.body(15), { color: "#fff", textAlign: "center" }]}>{heard.ok ? t("session.say.heard") : t("session.say.close", { x: heard.text })}</Text>
          <SlotFill>
            <View style={{ gap: 6 }}>
              {!heard.ok && tries < 3 ? <Btn kind="light" onPress={() => { setHeard(null); setMode("ready"); }}>{t("session.say.again")}</Btn> : null}
              <Btn kind="gold" onPress={() => onDone(null)}>{t("session.next")}</Btn>
            </View>
          </SlotFill>
        </>
      ) : (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel={mode === "listening" ? t("session.say.listening") : t("session.say.tapA11y")} disabled={mode === "listening"} onPress={listen}
            style={[s.mic, { backgroundColor: mode === "listening" ? "#fff" : color.gold, borderWidth: mode === "listening" ? 4 : 0, borderColor: color.gold }]}>
            <Text style={{ fontSize: 36 }}>🎙</Text>
          </Pressable>
          <Text style={[type.body(13), { color: "#ffffffaa", textAlign: "center" }]}>{mode === "listening" ? t("session.say.listeningDots") : t("session.say.tapHint")}</Text>
          <Pressable accessibilityRole="button" onPress={() => setMode("manual")}><Text style={[type.eyebrow(), { color: "#ffffff66" }]}>{t("session.say.cantTalk")}</Text></Pressable>
          <Text style={[type.caption(), { color: "#ffffff55", textAlign: "center", fontSize: 11 }]}>{t("session.say.privacy")}</Text>
        </>
      )}
    </View>
  );
}

// ─── tap the rhythm ─────────────────────────────────────────────────────
export function RhythmStep({ step, voiceOn, onDone }: { step: any; voiceOn: boolean; onDone: Done }) {
  const syl: string[] = step.syllables;
  const total = syl.length * step.rounds;
  const gap = 60000 / step.bpm;
  const tol = Math.max(140, 280 - step.level * 25);
  const [phase, setPhase] = useState<"ready" | "demo" | "count" | "play" | "done">("ready");
  const [beat, setBeat] = useState(-1);
  const [hits, setHits] = useState(0);
  const t0 = useRef(0);
  const taps = useRef<number[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fx = useFx();
  const reduce = useReducedMotion();
  const drum = useSharedValue(1);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clear, []);
  const run = (n: number, onBeat: (k: number) => void, after: () => void, lead = 0) => {
    for (let k = 0; k < n; k++) timers.current.push(setTimeout(() => onBeat(k), lead + k * gap));
    timers.current.push(setTimeout(after, lead + n * gap));
  };
  const demo = () => {
    speak(step.word, voiceOn);
    setPhase("demo");
    run(syl.length, (k) => { setBeat(k); play("tock"); }, () => { setBeat(-1); countIn(); }, 900);
  };
  const countIn = () => {
    setPhase("count");
    run(2, (k) => { setBeat(-10 - k); play("tick"); }, () => {
      taps.current = [];
      t0.current = Date.now();
      setPhase("play");
      run(total, (k) => setBeat(k), score);
    });
  };
  const score = () => {
    const beats = Array.from({ length: total }, (_, k) => t0.current + k * gap);
    const used = new Set<number>();
    let h = 0;
    for (const b of beats) {
      const i = taps.current.findIndex((t, j) => !used.has(j) && Math.abs(t - b) <= tol);
      if (i >= 0) { used.add(i); h++; }
    }
    setHits(h);
    setBeat(-1);
    setPhase("done");
    fx.react(h / total >= 0.6 ? "right" : "wrong");
  };
  const tap = () => {
    if (phase !== "play") return;
    taps.current.push(Date.now());
    play("tock");
    if (!reduce) drum.value = withSequence(withTiming(0.9, { duration: 50 }), withSpring(1, { damping: 8 }));
  };
  const drumStyle = useAnimatedStyle(() => ({ transform: [{ scale: drum.value }] }));
  const current = phase === "demo" ? beat : phase === "play" ? beat % syl.length : -1;
  const ok = hits / total >= 0.6;
  return (
    <View style={{ alignItems: "center", width: "100%", gap: 18 }}>
      <Text style={[type.eyebrow(), { color: color.gold }]}>{t("session.rhythm.kicker")}</Text>
      <Text style={[type.h1(24), { color: "#fff", textAlign: "center" }]}>{phase === "ready" ? t("session.rhythm.ready", { word: step.word }) : phase === "demo" ? t("session.rhythm.listen") : phase === "count" ? (beat === -10 ? t("session.rhythm.readyDots") : t("session.rhythm.go")) : phase === "play" ? t("session.rhythm.round", { a: Math.min(step.rounds, Math.floor(Math.max(0, beat) / syl.length) + 1), b: step.rounds }) : ""}</Text>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" }} accessibilityLabel={syl.join(" · ")}>
        {syl.map((x, k) => (
          <View key={k} style={[s.syl, k === current ? { backgroundColor: color.gold, borderColor: color.gold, transform: [{ scale: 1.12 }] } : null]}>
            <Text style={[s.sylText, k === current ? { color: color.ink } : null]}>{x}</Text>
          </View>
        ))}
      </View>
      {phase === "ready" ? <SlotFill><Btn kind="gold" onPress={demo}>{t("session.rhythm.listenBtn")}</Btn></SlotFill> : null}
      {phase === "demo" || phase === "count" || phase === "play" ? (
        <Animated.View style={drumStyle}>
          <Pressable accessibilityRole="button" accessibilityLabel={t("session.rhythm.tapA11y")} onPressIn={tap} onPress={() => {}} style={[s.drum, phase === "play" ? null : { opacity: 0.5 }]}>
            <Text style={{ fontSize: 30 }}>☀</Text>
            <Text style={[type.eyebrow(8), { color: color.ink, marginTop: 4 }]}>{t("session.rhythm.tap")}</Text>
          </Pressable>
        </Animated.View>
      ) : null}
      {phase === "done" ? <Verdict ok={ok} seed={total} title={ok ? t("session.rhythm.good", { a: hits, b: total }) : t("session.rhythm.some", { a: hits, b: total })} body={ok ? t("session.rhythm.goodBody") : t("session.rhythm.body")} onNext={() => onDone(ok)} /> : null}
    </View>
  );
}

// ─── type what you hear ─────────────────────────────────────────────────
export function TypeItStep({ step, voiceOn, onDone }: { step: any; voiceOn: boolean; onDone: Done }) {
  const [text, setText] = useState("");
  const [left, setLeft] = useState<number>(step.replays ?? 2);
  const [res, setRes] = useState<{ ok: boolean; close: boolean } | null>(null);
  const fx = useFx();
  useEffect(() => {
    const t = setTimeout(() => speak(step.speak, voiceOn), 350);
    return () => clearTimeout(t);
  }, [step.speak, voiceOn]);
  const check = () => {
    const bare = (x: string) => norm(String(x).replace(/^\s*(the|a|an)\s+/i, ""));
    const a = bare(text), b = bare(step.answer);
    const d = edits(a, b);
    const ok = d === 0 || d <= (b.length > 6 ? 2 : 1);
    setRes({ ok, close: ok && d > 0 });
    fx.react(ok ? "right" : "wrong");
  };
  return (
    <View style={{ width: "100%", gap: 14 }}>
      <Text accessibilityRole="header" style={[type.h1(24), { color: "#fff" }]}>{step.prompt}</Text>
      <Replay text={step.speak} left={left} onUse={() => setLeft((n) => n - 1)} />
      <TextInput value={text} onChangeText={setText} editable={!res} autoCapitalize="none" autoCorrect={false} spellCheck={false} placeholder={t("session.type.placeholder")} placeholderTextColor="#ffffff55" onSubmitEditing={() => text.trim() && !res && check()}
        accessibilityLabel={t("session.type.a11y")} style={s.input} />
      {res === null ? <SlotFill><Btn kind="gold" disabled={!text.trim()} onPress={check}>{t("session.check")}</Btn></SlotFill> : (
        <Verdict ok={res.ok} seed={step.answer.length} body={res.ok ? (res.close ? t("session.type.close", { a: step.answer }) : t("session.type.right")) : t("session.itsAnswer", { a: step.answer })} onNext={() => onDone(res.ok)} />
      )}
    </View>
  );
}

// ─── the quick round (against the clock) ────────────────────────────────
export function RushStep({ step, best, onDone }: { step: any; best?: number | null; onDone: (ok: boolean, secs: number | null) => void }) {
  const pairs: [string, string][] = step.pairs;
  const right = useMemo(() => [...pairs.map((p) => p[1])].sort(() => Math.random() - 0.5), [pairs]);
  const [started, setStarted] = useState(false);
  const [left, setLeft] = useState<number>(step.secs);
  const [sel, setSel] = useState<string | null>(null);
  const [got, setGot] = useState<Record<string, string>>({});
  const [end, setEnd] = useState<{ ok: boolean; secs: number } | null>(null);
  const [shake, setShake] = useState<string | null>(null);
  const t0 = useRef(0);
  const fx = useFx();
  const bar = useSharedValue(1);
  useEffect(() => {
    if (!started || end) return;
    const iv = setInterval(() => setLeft((x) => {
      const n = x - 1;
      if (n <= 5 && n > 0) play("tick");
      if (n <= 0) { clearInterval(iv); setEnd({ ok: false, secs: step.secs }); fx.react("wrong"); return 0; }
      return n;
    }), 1000);
    return () => clearInterval(iv);
  }, [started, end]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (started && !end) bar.value = withTiming(0, { duration: step.secs * 1000 }); else if (end) bar.value = bar.value; }, [started, end]); // eslint-disable-line react-hooks/exhaustive-deps
  const barStyle = useAnimatedStyle(() => ({ width: `${bar.value * 100}%` }));
  const tryPair = (l: string, r: string) => {
    const ok = pairs.find((p) => p[0] === l)![1] === r;
    setSel(null);
    if (!ok) { setShake(r); fx.react("wrong"); setTimeout(() => setShake(null), 350); return; }
    const g = { ...got, [l]: r };
    setGot(g);
    play("right");
    if (Object.keys(g).length === pairs.length) {
      const secs = Math.max(1, Math.round((Date.now() - t0.current) / 1000));
      setEnd({ ok: true, secs });
      fx.react("right");
    }
  };
  const chip = (txt: string, active: boolean, done: boolean, onPress: () => void, small?: boolean) => (
    <Pressable key={txt} accessibilityRole="button" accessibilityLabel={txt} accessibilityState={{ selected: active, disabled: done }} disabled={done || !!end} onPress={onPress}
      style={[s.rchip, { backgroundColor: done ? color.gold : active ? color.ink : "#fff", opacity: done ? 0.55 : 1, borderColor: shake === txt ? "#E5484D" : active ? color.gold : "#fff" }]}>
      <Text style={{ fontFamily: font.text[700], fontSize: small ? 12 : 14, color: active ? "#fff" : color.ink, textAlign: "center" }} numberOfLines={3}>{txt}</Text>
    </Pressable>
  );
  if (!started) {
    return (
      <View style={{ alignItems: "center", gap: 14, width: "100%" }}>
        <Text style={[type.eyebrow(), { color: color.gold }]}>{t("session.rush.kicker", { n: step.secs })}</Text>
        <Guy pose="stride" h={140} />
        <Text style={[type.h1(26), { color: "#fff", textAlign: "center" }]}>{t("session.rush.intro", { n: pairs.length })}</Text>
        {best ? <Text style={[type.body(14), { color: color.gold }]}>{t("session.rush.best", { n: best })}</Text> : null}
        <SlotFill><Btn kind="gold" onPress={() => { t0.current = Date.now(); setStarted(true); play("tap"); }}>{t("session.rush.go")}</Btn></SlotFill>
      </View>
    );
  }
  const n = Object.keys(got).length;
  return (
    <View style={{ width: "100%", gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text style={{ fontSize: 18 }}>☀</Text>
        <View style={s.clock}><Animated.View style={[s.clockFill, { backgroundColor: left <= 5 ? "#FFB84D" : color.gold }, barStyle]} /></View>
        <Text accessibilityLabel={t("session.secsLeft", { n: left })} style={{ fontFamily: font.display[800], fontSize: 20, color: left <= 5 ? "#FFB84D" : "#fff", minWidth: 30, textAlign: "right" }}>{left}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 2, gap: 8 }}>{pairs.map(([l]) => chip(l, sel === l, !!got[l], () => setSel(l)))}</View>
        <View style={{ flex: 3, gap: 8 }}>{right.map((r) => chip(r, false, Object.values(got).includes(r), () => { if (sel) tryPair(sel, r); }, true))}</View>
      </View>
      {end ? (
        <Verdict ok={end.ok} seed={pairs.length}
          title={end.ok ? (best && end.secs < best ? t("session.rush.newBest", { n: end.secs }) : t("session.rush.all", { a: pairs.length, b: end.secs })) : t("session.rush.time", { a: n, b: pairs.length })}
          body={end.ok ? (best && end.secs >= best ? t("session.rush.bestIs", { n: best }) : undefined) : t("session.rush.sunset")}
          onNext={() => onDone(end.ok, end.ok ? end.secs : null)} />
      ) : <Text style={[type.body(12), { color: "#ffffff88", textAlign: "center" }]}>{t("session.rush.hint")}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  pill: { alignSelf: "flex-start", backgroundColor: "#ffffff14", borderColor: "#ffffff33", borderWidth: 1, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16 },
  pillText: { color: "#fff", fontFamily: font.text[600], fontSize: 13 },
  scene: { position: "absolute", left: 0, right: 0, height: ROW, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 16, borderWidth: 2, borderColor: "#fff", paddingLeft: 12, paddingRight: 6, shadowColor: "#000", shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  grip: { color: "#00000044", fontSize: 16, fontWeight: "800" },
  sceneText: { flex: 1, fontFamily: font.text[700], fontSize: 14, color: color.ink },
  arrow: { width: 32, height: 40, alignItems: "center", justifyContent: "center" },
  arrowText: { color: "#00000066", fontSize: 12 },
  mic: { width: 104, height: 104, borderRadius: 52, alignItems: "center", justifyContent: "center" },
  syl: { minWidth: 64, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 18, borderWidth: 2, borderColor: "#ffffff44", alignItems: "center", backgroundColor: "#ffffff10" },
  sylText: { fontFamily: font.display[800], fontSize: 24, color: "#fff" },
  drum: { width: 132, height: 132, borderRadius: 66, backgroundColor: color.gold, alignItems: "center", justifyContent: "center", borderWidth: 6, borderColor: "#ffffff33" },
  input: { borderWidth: 2, borderColor: color.gold, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, fontSize: 22, color: "#fff", fontFamily: font.display[700], backgroundColor: "#ffffff10" },
  rchip: { minHeight: 52, borderRadius: 14, borderWidth: 2, paddingVertical: 8, paddingHorizontal: 8, alignItems: "center", justifyContent: "center" },
  clock: { flex: 1, height: 12, borderRadius: 6, backgroundColor: "#ffffff22", overflow: "hidden" },
  clockFill: { height: 12, borderRadius: 6 },
});
