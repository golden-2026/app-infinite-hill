// Game feel for the lesson: the mascot reacts to every answer, a colored verdict banner with a sound,
// combos that burst, and a progress bar that heats up. Steps call `useFx().react(...)` the moment an answer
// is known; the lesson frame shows the mascot and the combo burst; `Verdict` is the banner each step shows.
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { play } from "@/lib/fx";
import { successHaptic, tapHaptic } from "@/lib/haptics";
import { Btn, Guy, color, font, type } from "@/ui";
import { SlotFill } from "@/ui/slot";

export type Reaction = "right" | "wrong" | "neutral";
type Fx = { react: (r: Reaction) => void; combo: number; pose: string; beat: number };
const FxCtx = createContext<Fx>({ react: () => {}, combo: 0, pose: "wave", beat: 0 });
export const FxProvider = ({ value, children }: { value: Fx; children: ReactNode }) => <FxCtx.Provider value={value}>{children}</FxCtx.Provider>;
export const useFx = () => useContext(FxCtx);

const RIGHT_POSES = ["joy", "cheer", "thumbs", "jump", "aha", "peace2"];
const WRONG_POSES = ["wonder", "think", "sitthink"];
export const poseFor = (r: Reaction, n: number) => (r === "right" ? RIGHT_POSES[n % RIGHT_POSES.length] : r === "wrong" ? WRONG_POSES[n % WRONG_POSES.length] : "idea");

/** Sound + haptics for a reaction; the lesson calls this once per answer. */
export function cue(r: Reaction, combo: number) {
  if (r === "right") { successHaptic(); play(combo >= 3 && combo % 1 === 0 && [3, 5, 10, 15, 20].includes(combo) ? "combo" : "right"); }
  else if (r === "wrong") { tapHaptic(); play("wrong"); }
  else play("tap");
}

/** The mascot in the lesson header: changes pose with each answer and pops when it does. */
export function ReactingGuy({ h = 56 }: { h?: number }) {
  const { pose, beat } = useFx();
  const s = useSharedValue(1);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce || beat === 0) return;
    s.value = withSequence(withTiming(1.25, { duration: 140, easing: Easing.out(Easing.back(2)) }), withSpring(1, { damping: 8 }));
  }, [beat, reduce, s]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={anim}><Guy pose={pose} h={h} /></Animated.View>;
}

/** "COMBO ×5" bursting over the lesson at 3, 5, 10… in a row. */
export function ComboBurst() {
  const { combo } = useFx();
  const show = [3, 5, 10, 15, 20].includes(combo);
  const s = useSharedValue(0), o = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!show) return;
    o.value = withSequence(withTiming(1, { duration: 120 }), withDelay(700, withTiming(0, { duration: 350 })));
    s.value = reduce ? 1 : withSequence(withTiming(1.35, { duration: 180, easing: Easing.out(Easing.back(3)) }), withSpring(1, { damping: 6 }));
  }, [combo, show, reduce, o, s]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }, { rotate: "-6deg" }] }));
  if (!show) return null;
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", top: "38%", alignSelf: "center", zIndex: 20 }, anim]}>
      <Text accessibilityLiveRegion="polite" style={{ fontFamily: font.mark[800], fontSize: 52, color: color.gold, textShadowColor: "#b37400", textShadowRadius: 0, textShadowOffset: { width: 3, height: 4 } }}>COMBO ×{combo}</Text>
    </Animated.View>
  );
}

const RIGHT_TITLES = ["Awesome!", "Nice!", "Excellent!", "Right on!", "Nailed it!", "Beautiful."];
const RED = "#E5484D";
const RED_BG = "#FFE6E4";

/** The verdict banner: slides up in the bottom bar with the next button (gold = right, coral = not quite). */
export function Verdict({ ok, title, body, onNext, label, seed = 0 }: { ok: boolean | null; title?: string; body?: string; onNext: () => void; label?: string; seed?: number }) {
  const y = useSharedValue(40), o = useSharedValue(0);
  useEffect(() => { y.value = withSpring(0, { damping: 14 }); o.value = withTiming(1, { duration: 160 }); }, [y, o]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }] }));
  const bad = ok === false;
  const head = title ?? (ok === true ? RIGHT_TITLES[seed % RIGHT_TITLES.length] : bad ? "Not quite" : "Good call");
  return (
    <SlotFill>
      <Animated.View style={[{ backgroundColor: bad ? RED_BG : color.gold, borderRadius: 22, padding: 14, gap: 10, marginHorizontal: -4 }, anim]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: bad ? RED : color.ink, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: bad ? "#fff" : color.gold, fontFamily: font.text[700], fontSize: 16 }}>{bad ? "✕" : "✓"}</Text>
          </View>
          <Text accessibilityLiveRegion="polite" style={{ fontFamily: font.display[800], fontSize: 20, color: bad ? RED : color.ink }}>{head}</Text>
        </View>
        {body ? <Text style={[type.body(14), { color: bad ? "#7a2320" : color.ink }]}>{body}</Text> : null}
        <Btn kind={bad ? "miss" : "ink"} onPress={onNext}>{label ?? (bad ? "got it" : "continue")}</Btn>
      </Animated.View>
    </SlotFill>
  );
}
