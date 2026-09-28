// Game feel for the lesson: the mascot reacts to every answer, a colored verdict banner with a sound,
// combos that burst, and a progress bar that heats up. Steps call `useFx().react(...)` the moment an answer
// is known; the lesson frame shows the mascot and the combo burst; `Verdict` is the banner each step shows.
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { Sparkle } from "@/fx/Sparkle";
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

/** The streak counts that earn a combo burst (and its climbing sparkle sound). */
const COMBO_AT = [3, 5, 10, 15, 20];

/** Sound + haptics for a reaction; the lesson calls this once per answer. */
export function cue(r: Reaction, combo: number) {
  if (r === "right") { successHaptic(); if (COMBO_AT.includes(combo)) play("combo", combo); else play("right"); }
  else if (r === "wrong") { tapHaptic(); play("wrong"); }
  else play("tap");
}

/** The mascot in the lesson header: changes pose with each answer and pops (with a little squash) when it does. */
export function ReactingGuy({ h = 56 }: { h?: number }) {
  const { pose, beat } = useFx();
  const s = useSharedValue(1), r = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce || beat === 0) return;
    s.value = withSequence(withTiming(0.88, { duration: 70 }), withTiming(1.25, { duration: 150, easing: Easing.out(Easing.back(2)) }), withSpring(1, { damping: 8, stiffness: 220 }));
    r.value = withSequence(withTiming(-6, { duration: 90 }), withTiming(5, { duration: 110 }), withSpring(0, { damping: 7 }));
  }, [beat, reduce, s, r]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }, { rotate: `${r.value}deg` }] }));
  return <Animated.View style={anim}><Guy pose={pose} h={h} /></Animated.View>;
}

/** "glowing ×5": a sunburst over the lesson at 3, 5, 10… in a row — bigger, longer and sparklier as the streak grows. */
export function ComboBurst() {
  const { combo } = useFx();
  const show = COMBO_AT.includes(combo);
  const lv = Math.min(1, Math.max(0, (combo - 3) / 17)); // 0 at ×3 → 1 at ×20
  const s = useSharedValue(0), o = useSharedValue(0), spin = useSharedValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!show) return;
    const peak = 1.3 + lv * 0.5;
    o.value = withSequence(withTiming(1, { duration: 120 }), withDelay(700 + lv * 400, withTiming(0, { duration: 350 })));
    s.value = reduce ? 1 : withSequence(withTiming(0.4, { duration: 0 }), withTiming(peak, { duration: 200, easing: Easing.out(Easing.back(3)) }), withSpring(1 + lv * 0.15, { damping: 6 }));
    spin.value = reduce ? 0 : withSequence(withTiming(0, { duration: 0 }), withTiming(40 + lv * 60, { duration: 1400, easing: Easing.out(Easing.cubic) }));
  }, [combo, show, reduce, lv, o, s, spin]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }] }));
  const sun = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  if (!show) return null;
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", top: "34%", alignSelf: "center", zIndex: 20 }, anim]}>
      <View style={{ alignItems: "center" }}>
        <View>
          <Animated.Text style={[{ fontSize: 64 + lv * 28, color: color.gold, textAlign: "center" }, sun]}>☀</Animated.Text>
          <Sparkle key={combo} count={10 + Math.round(lv * 8)} radius={70 + lv * 50} size={8 + lv * 4} duration={700} />
        </View>
        <Text accessibilityLiveRegion="polite" style={{ fontFamily: font.mark[800], fontSize: 40 + lv * 16, color: color.gold, textShadowColor: "#00000088", textShadowRadius: 8, textShadowOffset: { width: 0, height: 2 } }}>glowing ×{combo}</Text>
      </View>
    </Animated.View>
  );
}

// our own voice, lowercase and warm (not a copy of any other app's cheers)
const RIGHT_TITLES = ["yes — exactly.", "that's it.", "lit.", "beautiful.", "you've got it.", "right on."];
const RED = "#E5484D";
const RED_BG = "#FFE6E4";
// specks that read on the gold banner and on the dark bar around it
const SPARK_ON_GOLD = ["#FFFFFF", "#F08C00", "#FFFFFF", "#B86B00"];

/** The verdict banner: springs up in the bottom bar with the next button (gold = right, coral = not quite).
 *  Right answers throw a little burst of sun specks off the badge; a miss gives the banner a small head-shake. */
export function Verdict({ ok, title, body, onNext, label, seed = 0 }: { ok: boolean | null; title?: string; body?: string; onNext: () => void; label?: string; seed?: number }) {
  const reduce = useReducedMotion();
  const y = useSharedValue(reduce ? 0 : 56), o = useSharedValue(0), x = useSharedValue(0), badge = useSharedValue(reduce ? 1 : 0.4);
  const bad = ok === false;
  useEffect(() => {
    o.value = withTiming(1, { duration: 160 });
    if (reduce) return;
    y.value = withSpring(0, { damping: 13, stiffness: 190, mass: 0.9 });
    badge.value = withDelay(90, withSpring(1, { damping: 7, stiffness: 260 }));
    if (bad) x.value = withDelay(140, withSequence(
      withTiming(-9, { duration: 55 }), withTiming(8, { duration: 70 }), withTiming(-6, { duration: 65 }),
      withTiming(4, { duration: 60 }), withTiming(-2, { duration: 55 }), withTiming(0, { duration: 50 }),
    ));
  }, [reduce, bad, y, o, x, badge]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }, { translateX: x.value }] }));
  const badgeAnim = useAnimatedStyle(() => ({ transform: [{ scale: badge.value }] }));
  const head = title ?? (ok === true ? RIGHT_TITLES[seed % RIGHT_TITLES.length] : bad ? "almost." : "good call.");
  return (
    <SlotFill>
      <Animated.View style={[{ backgroundColor: bad ? RED_BG : color.gold, borderRadius: 22, padding: 14, gap: 10, marginHorizontal: -4 }, anim]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 30, height: 30 }}>
            <Animated.View style={[{ width: 30, height: 30, borderRadius: 15, backgroundColor: bad ? RED : color.ink, alignItems: "center", justifyContent: "center" }, badgeAnim]}>
              <Text style={{ color: bad ? "#fff" : color.gold, fontFamily: font.text[700], fontSize: 16 }}>{bad ? "↺" : "☀"}</Text>
            </Animated.View>
            {ok === true ? <Sparkle count={10} radius={60} size={10} delay={reduce ? 0 : 120} colors={SPARK_ON_GOLD} /> : null}
          </View>
          <Text accessibilityLiveRegion="polite" style={{ fontFamily: font.display[800], fontSize: 20, color: bad ? RED : color.ink }}>{head}</Text>
        </View>
        {body ? <Text style={[type.body(14), { color: bad ? "#7a2320" : color.ink }]}>{body}</Text> : null}
        <Btn kind={bad ? "miss" : "ink"} onPress={onNext}>{label ?? (bad ? "okay, next" : "next")}</Btn>
      </Animated.View>
    </SlotFill>
  );
}
