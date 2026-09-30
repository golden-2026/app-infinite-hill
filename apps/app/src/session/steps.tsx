// v175's session steps, ported. Same copy, same rules: voice never gates progress, a miss gets a shrug,
// "next" on every screen, always in the pinned bottom bar (SlotFill hands it to the lesson frame). No microphone in the pilot: "say it" keeps v175's no-mic fallback.
import { data, native } from "@ih/content";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { bell, speak } from "@/lib/sound";
import { Btn, Guy, Sun, color, font, type } from "@/ui";
import { SlotFill } from "@/ui/slot";
import { Verdict, useFx } from "@/session/juice";

const strip = (s: string) => (s || "").replace(/[.!?,;:"“”'’]/g, "").toLowerCase().trim();
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5);
type Done = (ok: boolean | null) => void;

// ─── shared bits ────────────────────────────────────────────────────────
export const Kicker = ({ children }: { children: string }) => <Text style={[type.eyebrow(), { color: color.gold }]}>{children}</Text>;
export const Prompt = ({ children, size = 24 }: { children: string; size?: number }) => <Text accessibilityRole="header" style={[type.h1(size), { color: "#fff" }]}>{children}</Text>;

function Choice({ text, on, right, disabled, onPress, testID }: { text: string; on: boolean; right: boolean; disabled: boolean; onPress: () => void; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={text} accessibilityState={{ disabled, selected: on }} aria-pressed={on} aria-disabled={disabled} disabled={disabled} onPress={onPress}
      style={[s.choice, { borderColor: on || right ? color.gold : "#ffffff44", backgroundColor: right ? color.gold : on ? "#fff" : "#ffffff10" }]}>
      <Text style={[s.choiceText, { color: right || on ? color.ink : "#fff" }]}>{text}</Text>
    </Pressable>
  );
}

function Reveal({ label, text, onNext }: { label: string; text?: string; onNext: () => void }) {
  return (
    <View style={{ marginTop: 6, gap: 12 }}>
      <Text style={[type.eyebrow(), { color: color.gold }]}>{label}</Text>
      {text ? <Text style={s.reveal}>{text}</Text> : null}
      <SlotFill><Btn kind="gold" onPress={onNext}>next</Btn></SlotFill>
    </View>
  );
}

function RoundBtn({ glyph, label, onPress, active, size = 84 }: { glyph: string; label: string; onPress?: () => void; active?: boolean; size?: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={!onPress}
      // active used to go black, which hid dark emoji glyphs (🗣); a white disc with a gold ring keeps them visible
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: active ? "#fff" : color.gold, borderWidth: active ? 3 : 0, borderColor: color.gold, alignItems: "center", justifyContent: "center", alignSelf: "center" }}>
      <Text style={{ fontSize: size * 0.36 }}>{glyph}</Text>
    </Pressable>
  );
}

// ─── guess · listen ─────────────────────────────────────────────────────
export function OptionStep({ step, voiceOn, onDone }: { step: any; voiceOn: boolean; onDone: Done }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [replays, setReplays] = useState<number>(step.replays ?? 99);
  useEffect(() => {
    if (!step.speak) return;
    const t = setTimeout(() => speak(step.speak, voiceOn), 300);
    return () => clearTimeout(t);
  }, [step.speak, voiceOn]);
  const fx = useFx();
  const ok = picked !== null && picked === step.answer;
  const guess = step.graded === false;
  const pick = (o: string) => { setPicked(o); fx.react(guess ? "neutral" : o === step.answer ? "right" : "wrong"); };
  return (
    <View style={{ gap: 10, width: "100%" }}>
      <Prompt>{step.prompt}</Prompt>
      {step.speak ? <View style={{ marginVertical: 8, alignItems: "center", gap: 6 }}><RoundBtn glyph="🔊" label={replays > 0 ? "Hear it again" : "no more replays"} onPress={replays > 0 ? () => { speak(step.speak, true); setReplays((n) => n - 1); } : undefined} />{step.replays != null && step.replays < 9 ? <Text style={[type.eyebrow(8), { color: "#ffffff88" }]}>{replays > 0 ? `${replays} replay left` : "no more replays — trust your ear"}</Text> : null}</View> : null}
      {step.options.map((o: string) => <Choice key={o} text={o} on={picked === o} right={picked !== null && !guess && o === step.answer} disabled={picked !== null} onPress={() => pick(o)} />)}
      {picked !== null ? <Verdict ok={guess ? null : ok} seed={step.prompt.length} title={guess ? "good guess" : undefined} body={guess ? "the lesson's about to tell you." : ok ? undefined : `it's "${step.answer}."`} onNext={() => onDone(guess ? null : ok)} /> : null}
    </View>
  );
}

// ─── order ──────────────────────────────────────────────────────────────
export function OrderStep({ step, onDone }: { step: any; onDone: Done }) {
  const [pool, setPool] = useState<string[]>(() => shuffle(step.items));
  const [seq, setSeq] = useState<string[]>([]);
  const [result, setResult] = useState<boolean | null>(null);
  const fx = useFx();
  const pick = (x: string) => {
    const s2 = [...seq, x];
    const p2 = pool.filter((y) => y !== x);
    setSeq(s2);
    setPool(p2);
    // Say whether the order was right (and show it when it wasn't) before moving on.
    if (p2.length === 0) { const r = s2.every((v, k) => v === step.items[k]); setResult(r); fx.react(r ? "right" : "wrong"); }
  };
  return (
    <View>
      <View style={{ gap: 8, minHeight: 60, marginBottom: 14 }}>
        {seq.map((x, k) => <View key={x} style={[s.tile, { backgroundColor: result === false && x !== step.items[k] ? "#fff" : color.gold, borderColor: color.gold }]}><Text style={s.tileText}>{k + 1}. {x}</Text></View>)}
      </View>
      {result !== null ? (
        <Verdict ok={result} seed={step.items.length} body={result ? undefined : `it goes: ${step.items.map((v: string, k: number) => `${k + 1}. ${v}`).join("  ")}`} onNext={() => onDone(result)} />
      ) : null}
      <View style={{ gap: 8 }}>
        {pool.map((x) => (
          <Pressable key={x} accessibilityRole="button" accessibilityLabel={x} onPress={() => pick(x)} style={s.tile}><Text style={s.tileText}>{x}</Text></Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── match ──────────────────────────────────────────────────────────────
export function MatchStep({ step, onDone }: { step: any; onDone: Done }) {
  const left: string[] = step.pairs.map((p: string[]) => p[0]);
  const right = useMemo<string[]>(() => shuffle(step.pairs.map((p: string[]) => p[1])), [step]);
  const [sel, setSel] = useState<string | null>(null);
  const [got, setGot] = useState<Record<string, string>>({});
  const [miss, setMiss] = useState(0);
  const [finished, setFinished] = useState(false);
  const fx = useFx();
  const tryPair = (l: string, r: string) => {
    const ok = step.pairs.find((p: string[]) => p[0] === l)[1] === r;
    if (ok) {
      const g = { ...got, [l]: r };
      setGot(g);
      setSel(null);
      if (Object.keys(g).length === step.pairs.length) { setFinished(true); fx.react(miss === 0 ? "right" : "wrong"); }
    } else {
      setMiss((m) => m + 1);
      setSel(null);
      setNope(`not ${l} and ${r}. try another.`);
    }
  };
  const [nope, setNope] = useState<string | null>(null);
  const chip = (txt: string, active: boolean, done: boolean, onPress: () => void) => (
    <Pressable key={txt} accessibilityRole="button" accessibilityLabel={txt} accessibilityState={{ selected: active, disabled: done }} aria-pressed={active} aria-disabled={done} disabled={done} onPress={onPress}
      style={[s.tile, { alignItems: "center", backgroundColor: done ? color.gold : active ? color.ink : "#fff", opacity: done ? 0.7 : 1 }]}>
      <Text style={[s.tileText, { color: active ? "#fff" : color.ink, textAlign: "center" }]}>{txt}</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1, gap: 10 }}>{left.map((l) => chip(l, sel === l, !!got[l], () => { setNope(null); setSel(l); }))}</View>
        <View style={{ flex: 1, gap: 10 }}>{right.map((r) => chip(r, false, Object.values(got).includes(r), () => sel && tryPair(sel, r)))}</View>
      </View>
      {nope && !finished ? <Text accessibilityLiveRegion="polite" style={[s.feedback, { color: color.ink, textAlign: "center" }]}>{nope}</Text> : null}
      {finished ? <Verdict ok={miss === 0} seed={step.pairs.length} body={miss === 0 ? "every pair on the first try." : `all matched — ${miss} ${miss === 1 ? "slip" : "slips"} on the way.`} onNext={() => onDone(miss === 0)} /> : null}
    </View>
  );
}

// ─── say it (no microphone in the pilot: v175's fallback) ───────────────
export function SpeakStep({ step, onDone }: { step: any; onDone: () => void }) {
  const [said, setSaid] = useState(false);
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontFamily: font.display[800], fontSize: 44, letterSpacing: -0.9, color: color.ink }}>{step.say}</Text>
      <View style={{ marginTop: 26 }}>
        <RoundBtn glyph="🗣" label="I said it" active={said} size={96} onPress={said ? undefined : () => { speak(step.say, true); setSaid(true); setTimeout(onDone, 1400); }} />
      </View>
      <Text style={[type.body(), { marginTop: 14, color: color.mute }]}>{said ? "that's it." : "say it out loud, then tap"}</Text>
    </View>
  );
}

// ─── tap what you hear ──────────────────────────────────────────────────
export function TapHear({ step, voiceOn, onDone }: { step: any; voiceOn: boolean; onDone: Done }) {
  const [seq, setSeq] = useState<{ w: string; k: number }[]>([]);
  const [state, setState] = useState<boolean | null>(null);
  const [left, setLeft] = useState<number>(step.replays ?? 99);
  useEffect(() => {
    const t = setTimeout(() => speak(step.speak, voiceOn), 300);
    return () => clearTimeout(t);
  }, [step.speak, voiceOn]);
  const bank = step.bank.map((w: string, k: number) => ({ w, k }));
  const used = new Set(seq.map((x) => x.k));
  const fx = useFx();
  const check = () => { const r = seq.map((x) => strip(x.w)).join(" ") === step.answer; setState(r); fx.react(r ? "right" : "wrong"); };
  const chip = (x: { w: string; k: number }, on: boolean) => (
    <Pressable key={x.k} accessibilityRole="button" accessibilityLabel={x.w} disabled={state !== null}
      onPress={() => (on ? setSeq(seq.filter((y) => y.k !== x.k)) : setSeq([...seq, x]))}
      style={{ backgroundColor: on ? color.gold : "#fff", borderColor: on ? color.gold : "#fff", borderWidth: 2, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14 }}>
      <Text style={{ fontFamily: font.text[700], fontSize: 15, color: color.ink }}>{x.w}</Text>
    </Pressable>
  );
  return (
    <View style={{ width: "100%", gap: 14 }}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-end" }}><View style={{ flex: 1 }}><Prompt>{step.prompt}</Prompt></View><Guy pose="music" h={84} /></View>
      <Pressable accessibilityRole="button" accessibilityLabel={left > 0 ? "Hear it again" : "no more replays"} disabled={left <= 0} onPress={() => { speak(step.speak, true); setLeft((n) => n - 1); }} style={[s.pill, left <= 0 ? { opacity: 0.35 } : null]}><Text style={s.pillText}>🔊 {left <= 0 ? "no more replays" : left < 9 ? `hear it again · ${left} left` : "hear it again"}</Text></Pressable>
      <View style={s.answerRow}>{seq.length ? seq.map((x) => chip(x, true)) : <Text style={[type.body(), { color: "#ffffff66", fontStyle: "italic" }]}>tap the words in order…</Text>}</View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>{bank.filter((x: any) => !used.has(x.k)).map((x: any) => chip(x, false))}</View>
      {state === null ? <SlotFill><Btn kind="gold" disabled={seq.length < step.words.length} onPress={check}>check</Btn></SlotFill> : (
        <Verdict ok={state} seed={step.words.length} body={state ? "that's your line." : `it's "${step.speak}."`} onNext={() => onDone(state)} />
      )}
    </View>
  );
}

// ─── not today: the breath and the sit can always be passed ────────────
// Skipping costs nothing: the step just moves on (these steps are never graded, so no miss, and the day, glow,
// streak and lantern are the same as if it had been done). Once only, even on a fast double tap.
function useSkip(onDone: () => void) {
  const gone = useRef(false);
  return () => { if (gone.current) return; gone.current = true; onDone(); };
}
function NotToday({ onPress }: { onPress: () => void }) {
  return (
    <Pressable testID="not-today" accessibilityRole="button" accessibilityLabel="not today, skip this" onPress={onPress} style={{ marginTop: 16, minHeight: 44, justifyContent: "center" }}>
      <Text style={[type.eyebrow(), { color: "#ffffff66" }]}>not today ›</Text>
    </Pressable>
  );
}

// ─── one breath · three breaths ─────────────────────────────────────────
export function BreathStep({ n, onDone }: { n: number; onDone: () => void }) {
  const [k, setK] = useState(0);
  const skip = useSkip(onDone);
  const [phase, setPhase] = useState<"ready" | "in" | "out" | "done">("ready");
  const reduce = useReducedMotion();
  const scale = useSharedValue(0.9);
  useEffect(() => {
    if (phase === "ready" || phase === "done") return;
    scale.value = withTiming(phase === "in" ? 1.25 : 0.9, { duration: reduce ? 0 : 4000, easing: Easing.inOut(Easing.sin) });
    const t = setTimeout(() => {
      if (phase === "in") setPhase("out");
      else if (k + 1 >= n) { bell(); setPhase("done"); }
      else { setK(k + 1); setPhase("in"); }
    }, 4000);
    return () => clearTimeout(t);
  }, [phase, k, n, reduce, scale]);
  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [phase, onDone]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <View style={{ alignItems: "center", gap: 18, width: "100%" }}>
      <View style={{ width: 200, height: 200, alignItems: "center", justifyContent: "center" }}><Animated.View style={anim}><Guy still pose={phase === "done" ? "joy" : "meditate"} h={150} /></Animated.View></View>
      {phase === "ready" ? (
        <>
          <Text style={[type.h1(26), { color: "#fff", textAlign: "center" }]}>{n === 1 ? "one breath. that's the practice." : `${n} breaths together.`}</Text>
          <Text style={[type.body(), { color: "#ffffffaa", textAlign: "center" }]}>in as it grows. out as it shrinks. eyes open is fine.</Text>
          <SlotFill><Btn kind="gold" onPress={() => { bell(); setPhase("in"); }}>{n === 1 ? "take it" : "start"}</Btn></SlotFill>
          <NotToday onPress={skip} />
        </>
      ) : null}
      {phase === "in" || phase === "out" ? (
        <>
          <Text accessibilityLiveRegion="polite" style={[type.h1(30), { color: color.gold }]}>{phase === "in" ? "in…" : "out…"}</Text>
          {n > 1 ? <Text style={[type.eyebrow(9), { color: "#ffffff99" }]}>{k + 1} of {n}</Text> : null}
          <NotToday onPress={skip} />
        </>
      ) : null}
      {phase === "done" ? <Text style={[type.h1(26), { color: color.gold, textAlign: "center" }]}>{n === 1 ? "that counts. that was the whole thing." : "that was a practice. you just did one."}</Text> : null}
    </View>
  );
}

// ─── the sit (real seconds; "I'm done" after 30 s, as v175 without demo speed) ─
export function SitStep({ secs, onDone }: { secs: number; onDone: () => void }) {
  const [phase, setPhase] = useState<"ready" | "sitting" | "done">("ready");
  const skip = useSkip(() => { clearInterval(iv.current!); onDone(); });
  const [left, setLeft] = useState(secs);
  const iv = useRef<ReturnType<typeof setInterval> | null>(null);
  const reduce = useReducedMotion();
  const breathe = useSharedValue(1);
  useEffect(() => {
    if (phase !== "sitting") return;
    bell();
    if (!reduce) breathe.value = withRepeat(withSequence(withTiming(1.08, { duration: 4000 }), withTiming(1, { duration: 4000 })), -1);
    iv.current = setInterval(() => setLeft((x) => {
      if (x <= 1) { clearInterval(iv.current!); bell(); setPhase("done"); return 0; }
      return x - 1;
    }), 1000);
    return () => clearInterval(iv.current!);
  }, [phase, reduce, breathe]);
  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(onDone, 1000);
    return () => clearTimeout(t);
  }, [phase, onDone]);
  const R = 78;
  const circ = 2 * Math.PI * R;
  const pct = 1 - left / secs;
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));
  return (
    <View style={{ alignItems: "center", gap: 18, width: "100%" }}>
      <View style={{ width: 200, height: 200, alignItems: "center", justifyContent: "center" }}>
        <Svg width={200} height={200} style={{ position: "absolute" }}>
          <G transform="rotate(-90 100 100)">
            <Circle cx={100} cy={100} r={R} stroke="#ffffff22" strokeWidth={4} fill="none" />
            <Circle cx={100} cy={100} r={R} stroke={color.gold} strokeWidth={4} fill="none" strokeDasharray={`${circ}`} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round" />
          </G>
        </Svg>
        <Animated.View style={anim}><Guy still pose="meditate" h={phase === "sitting" ? 112 : 96} /></Animated.View>
      </View>
      {phase === "ready" ? (
        <>
          <Text style={[type.h1(26), { color: "#fff", textAlign: "center" }]}>{secs} seconds. the sun breathes with you.</Text>
          <Text style={[type.body(), { color: "#ffffffaa", textAlign: "center" }]}>in as it grows. out as it shrinks. that's the whole job.</Text>
          <SlotFill><Btn kind="gold" onPress={() => setPhase("sitting")}>start the sit</Btn></SlotFill>
          <NotToday onPress={skip} />
        </>
      ) : null}
      {phase === "sitting" ? (
        <>
          <Text accessibilityLabel={`${left} seconds left`} style={{ fontFamily: font.display[800], fontSize: 40, color: color.gold }}>{left}</Text>
          <Text style={{ fontFamily: font.display[500], fontSize: 16, color: "#ffffffaa" }}>the sun holds the time.</Text>
          {secs - left >= 30 ? (
            <Pressable accessibilityRole="button" onPress={() => { clearInterval(iv.current!); bell(); setPhase("done"); }} style={{ padding: 8 }}>
              <Text style={[type.eyebrow(10), { color: "#ffffff99" }]}>I'm done ›</Text>
            </Pressable>
          ) : <NotToday onPress={skip} />}
        </>
      ) : null}
      {phase === "done" ? <Text style={[type.h1(28), { color: color.gold }]}>that was a sit. you just did one.</Text> : null}
    </View>
  );
}

// ─── the adult game (day 1): bet · myth · fork · original · trapdoor ────
export function BetStep({ step, onDone }: { step: any; onDone: Done }) {
  const [picked, setPicked] = useState<string | null>(null);
  const ok = picked === step.answer;
  const fx = useFx();
  return (
    <View style={{ gap: 10, width: "100%" }}>
      <Kicker>call it</Kicker>
      <Prompt size={26}>{`${step.word}. what does it actually mean?`}</Prompt>
      {step.options.map((o: string) => <Choice key={o} text={o} on={picked === o} right={picked !== null && o === step.answer} disabled={picked !== null} onPress={() => { setPicked(o); fx.react(o === step.answer ? "right" : "wrong"); }} />)}
      {picked !== null ? <Verdict ok={ok} seed={step.word.length} body={step.reveal} onNext={() => onDone(ok)} /> : null}
    </View>
  );
}

export function MythStep({ step, onDone }: { step: any; onDone: Done }) {
  const [ans, setAns] = useState<Record<number, boolean>>({});
  const n = step.items.length;
  const done = Object.keys(ans).length === n;
  const right = step.items.filter(([, v]: [string, boolean], i: number) => ans[i] === v).length;
  const fx = useFx();
  return (
    <View style={{ gap: 12, width: "100%" }}>
      <Kicker>true or myth</Kicker>
      <Prompt>three things people say. which are true?</Prompt>
      {step.items.map(([t, v, why]: [string, boolean, string], i: number) => {
        const a = ans[i];
        const answered = a !== undefined;
        return (
          <View key={i} style={[s.myth, { borderColor: answered ? (a === v ? color.gold : "#ffffff44") : "#ffffff30" }]}>
            <Text style={s.reveal}>{t}</Text>
            {!answered ? (
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                {([["true", true], ["myth", false]] as const).map(([l, val]) => (
                  <Pressable key={l} accessibilityRole="button" accessibilityLabel={`${l}: ${t}`} onPress={() => { setAns((x) => ({ ...x, [i]: val })); fx.react(val === v ? "right" : "wrong"); }} style={s.tf}>
                    <Text style={{ color: "#fff", fontFamily: font.text[700], fontSize: 14 }}>{l}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={{ marginTop: 8, fontSize: 13, lineHeight: 18, color: a === v ? color.gold : "#ffffffcc", fontFamily: font.text[400] }}>
                <Text style={{ fontFamily: font.text[700] }}>{v ? "true." : "myth."}</Text> {why}
              </Text>
            )}
          </View>
        );
      })}
      {done ? (
        <Verdict ok={right === n} seed={n} title={right === n ? `${right} of ${n}. right on!` : `${right} of ${n}`} body={right === n ? undefined : "not quite — that's what the week is for."} onNext={() => onDone(right === n)} />
      ) : null}
    </View>
  );
}

export function ForkStep({ step, onDone }: { step: any; onDone: Done }) {
  const [picked, setPicked] = useState<number | null>(null);
  const fx = useFx();
  const i0 = step.options.length;
  return (
    <View style={{ gap: 10, width: "100%" }}>
      <Kicker>your move</Kicker>
      <Text style={[s.reveal, { fontSize: 19, marginBottom: 6 }]}>{step.setup}</Text>
      {step.options.map((o: string, i: number) => <Choice key={i} text={o} on={picked === i} right={picked !== null && i === step.answer} disabled={picked !== null} onPress={() => { setPicked(i); fx.react("neutral"); }} />)}
      {picked !== null ? <Verdict ok={picked === step.answer} seed={i0} title={picked === step.answer ? "right on." : "not quite."} body={step.reveal} onNext={() => onDone(null)} /> : null}
    </View>
  );
}

export function OriginalStep({ step, voiceOn, onDone }: { step: any; voiceOn: boolean; onDone: Done }) {
  const say = step.say.replace(/-/g, " ").toLowerCase();
  const [said, setSaid] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => speak(say, voiceOn), 400);
    return () => clearTimeout(t);
  }, [say, voiceOn]);
  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <Kicker>in the original</Kicker>
      <Text style={{ fontFamily: font.display[800], fontSize: 52, color: "#fff", marginTop: 14, marginBottom: 6, lineHeight: 58, textAlign: "center" }}>{step.script}</Text>
      <Text style={{ fontFamily: font.display[500], fontSize: 22, color: color.gold }}>{step.say}</Text>
      <Text style={[type.body(14), { color: "#ffffffbb", marginTop: 8, textAlign: "center" }]}>{step.note}</Text>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
        <RoundBtn glyph="🔊" label="Hear it" size={72} onPress={() => speak(say, true)} />
        <RoundBtn glyph="🗣" label="I said it" size={72} active={said} onPress={said ? undefined : () => { setSaid(true); setTimeout(() => onDone(null), 900); }} />
      </View>
      <Text style={[type.body(), { marginTop: 14, color: "#ffffff99" }]}>{said ? "that's the sound." : "hear it. say it once."}</Text>
      {!said ? <Pressable accessibilityRole="button" onPress={() => onDone(null)} style={{ marginTop: 16 }}><Text style={[type.eyebrow(), { color: "#ffffff66" }]}>skip ›</Text></Pressable> : null}
    </View>
  );
}

export function TrapdoorStep({ step, onDone }: { step: any; onDone: Done }) {
  const [floor, setFloor] = useState(0);
  const labels = ["what you thought", "what it means", "what a scholar hears"];
  return (
    <View style={{ gap: 10, width: "100%" }}>
      <Kicker>the trapdoor</Kicker>
      {step.floors.slice(0, floor + 1).map((f: string, i: number) => (
        <View key={i} style={[s.myth, { backgroundColor: i === 2 ? color.gold : "#ffffff10", borderColor: i === 2 ? color.gold : "#ffffff30" }]}>
          <Text style={[type.eyebrow(8), { color: i === 2 ? color.ink : color.gold }]}>floor {i + 1} · {labels[i]}</Text>
          <Text style={[s.reveal, { color: i === 2 ? color.ink : "#fff", marginTop: 6 }]}>{f.replace(/^what (you thought|it means|a scholar hears): /, "")}</Text>
        </View>
      ))}
      {floor < 2 ? <SlotFill><Btn kind="gold" onPress={() => setFloor(floor + 1)}>{floor === 0 ? "go down" : "one more"}</Btn></SlotFill> : (
        <View style={{ gap: 8 }}>
          <Text style={[type.eyebrow(), { color: "#ffffff99", textAlign: "center" }]}>there are more floors. later.</Text>
          <SlotFill><Btn kind="gold" onPress={() => onDone(null)}>next</Btn></SlotFill>
        </View>
      )}
    </View>
  );
}

export { native };

const s = StyleSheet.create({
  choice: { borderWidth: 1.5, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 17 },
  choiceText: { fontFamily: font.text[600], fontSize: 15 },
  reveal: { fontFamily: font.display[500], fontSize: 18, lineHeight: 24, color: "#fff" },
  feedback: { fontFamily: font.display[500], fontSize: 16, textAlign: "center" },
  tile: { backgroundColor: "#fff", borderColor: color.ink, borderWidth: 2, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  tileText: { fontFamily: font.text[600], fontSize: 14, color: color.ink },
  pill: { alignSelf: "flex-start", backgroundColor: "#ffffff14", borderColor: "#ffffff33", borderWidth: 1, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16 },
  pillText: { color: "#fff", fontFamily: font.text[600], fontSize: 13 },
  answerRow: { minHeight: 56, borderBottomWidth: 1, borderBottomColor: "#ffffff33", paddingTop: 6, paddingBottom: 12, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  myth: { backgroundColor: "#ffffff10", borderWidth: 1.5, borderRadius: 18, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 14 },
  tf: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 999, borderWidth: 1.5, borderColor: "#ffffff66" },
});
