import { FADE } from "@/ui/fade";
// v175's atoms (Sun, Guy, Face, Btn, Card, Opt, Bubble, text styles) for React Native + web.
// Every tappable thing has an accessibility role and label; motion respects reduced-motion.
import { useEffect, type ReactNode } from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { art, color, font, radius, type } from "@ih/brand";
import { data } from "@ih/content";
import { doorLabel } from "@/i18n";
import { tapHaptic } from "@/lib/haptics";
import { play as playFx } from "@/lib/fx";

export { color, font, type };

// ─── text ───────────────────────────────────────────────────────────────
type TP = { children: ReactNode; style?: StyleProp<TextStyle>; size?: number; numberOfLines?: number };
export const Eyebrow = ({ children, style, size }: TP) => <Text style={[type.eyebrow(size), style]}>{children}</Text>;
export const H1 = ({ children, style, size }: TP) => <Text accessibilityRole="header" style={[type.h1(size), style]}>{children}</Text>;
export const Body = ({ children, style, size, numberOfLines }: TP) => <Text numberOfLines={numberOfLines} style={[type.body(size), style]}>{children}</Text>;
export const Serif = ({ children, style, size = 18 }: TP) => <Text style={[type.serif(size), style]}>{children}</Text>;

// ─── layout: the shell (top bar, large title, pinned bottom bar) lives in ui/shell ─
export { BackButton, BottomBar, CloseButton, NavBar, Screen } from "@/ui/shell";
export { confirmSheet, toast } from "@/ui/overlay";

// ─── Btn (v175: ink · gold · ghost · light) ─────────────────────────────
const BTN = {
  ink: { bg: color.ink, fg: color.gold, border: "transparent" },
  gold: { bg: color.gold, fg: color.ink, border: "transparent" },
  ghost: { bg: "transparent", fg: color.ink, border: color.ink },
  light: { bg: color.white, fg: color.ink, border: "transparent" },
  danger: { bg: "transparent", fg: color.danger, border: color.danger },
  miss: { bg: "#E5484D", fg: "#fff", border: "transparent" }, // the lesson's "not quite" banner
} as const;
export function Btn({ children, onPress, kind = "ink", disabled, label: a11y, style, testID }: {
  children: ReactNode; onPress?: () => void; kind?: keyof typeof BTN; disabled?: boolean; label?: string; style?: StyleProp<ViewStyle>; testID?: string;
}) {
  const k = BTN[kind];
  // The press: dips to 0.96 the instant a finger lands, then springs back with a little overshoot on release.
  const p = useSharedValue(0); // 0 = resting, 1 = held
  const s = useSharedValue(1);
  const reduce = useReducedMotion();
  const live = !disabled && !!onPress;
  const pressAnim = useAnimatedStyle(() => ({ opacity: 1 - p.value * 0.08, transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={a11y ?? (typeof children === "string" ? children : undefined)}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={live ? () => { p.value = withTiming(1, { duration: 60 }); if (!reduce) s.value = withTiming(0.96, { duration: 70, easing: Easing.out(Easing.quad) }); } : undefined}
      onPressOut={live ? () => { p.value = withTiming(0, { duration: 160 }); if (!reduce) s.value = withSpring(1, { damping: 9, stiffness: 340, mass: 0.7 }); } : undefined}
      onPress={onPress ? () => { tapHaptic(); playFx("tap"); onPress(); } : undefined}
      style={[
        styles.btn,
        { backgroundColor: disabled ? color.line : k.bg, borderColor: disabled ? "transparent" : k.border },
        style,
        pressAnim,
      ]}
    >
      <Text style={[styles.btnText, { color: disabled ? color.mute : k.fg }]}>{typeof children === "string" ? children.toUpperCase() : children}</Text>
    </AnimatedPressable>
  );
}
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// A text link that is still a real button (e.g. "skip ›", "‹ back").
export function Link({ children, onPress, style, label: a11y }: { children: string; onPress: () => void; style?: StyleProp<TextStyle>; label?: string }) {
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={a11y ?? children} onPress={onPress} hitSlop={10} style={{ minHeight: 44, minWidth: 44, justifyContent: "center", marginVertical: -12, paddingVertical: 12 }}>
      <Text style={[type.eyebrow(), { color: color.ink }, style]}>{children}</Text>
    </Pressable>
  );
}

// ─── Card · Opt · Bubble ────────────────────────────────────────────────
export function Card({ children, dark, onPress, style, label: a11y, testID }: { children: ReactNode; dark?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle>; label?: string; testID?: string }) {
  const s = [styles.card, dark ? styles.cardDark : null, style];
  if (!onPress) return <View testID={testID} style={s}>{children}</View>;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={a11y} onPress={() => { tapHaptic(); onPress(); }} style={({ pressed }) => [...s, pressed && { opacity: 0.94, transform: [{ scale: 0.985 }] }]}>{children}</Pressable>;
}

/** The one answer row for onboarding questions (welcome/*: about you, how you heard, the check, your tradition,
 *  getting to know you). Manrope medium 17/22, one padding and row height, one selected state (ink edge on pale
 *  lemon). Pick-several rows carry a checkbox on the right so they read differently from pick-one. */
export function ChoiceRow({ on, onPress, children, sub, testID, multi }: { on?: boolean; onPress: () => void; children: string; sub?: string; testID?: string; /** pick-several: a checkbox, not a radio */ multi?: boolean }) {
  return (
    <Pressable testID={testID} accessibilityRole={multi ? "checkbox" : "radio"} accessibilityState={{ checked: !!on }} aria-checked={!!on} accessibilityLabel={sub ? `${children}. ${sub}` : children} onPress={() => { tapHaptic(); onPress(); }}
      style={({ pressed }) => [styles.choice, { borderColor: on ? color.ink : color.line, backgroundColor: on ? CHOSEN : color.white, transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
      <View style={{ flex: 1 }}>
        <Text style={type.choice()}>{children}</Text>
        {sub ? <Text style={[type.caption(), { marginTop: 3 }]}>{sub}</Text> : null}
      </View>
      {multi ? (
        <View style={[styles.check, on ? { backgroundColor: color.ink, borderColor: color.ink } : null]}>
          {on ? <Text style={{ fontFamily: font.text[700], fontSize: 13, lineHeight: 15, color: color.gold }}>✓</Text> : null}
        </View>
      ) : null}
    </Pressable>
  );
}
const CHOSEN = "#FFFBE0";

/** A small option (Inter 14), for compact pickers outside onboarding. `big` is the onboarding row: use ChoiceRow. */
export function Opt({ on, onPress, children, sub, testID, big, multi }: { on?: boolean; onPress: () => void; children: string; sub?: string; testID?: string; big?: boolean; /** pick-several: a checkbox, not a radio */ multi?: boolean }) {
  if (big) return <ChoiceRow on={on} onPress={onPress} sub={sub} testID={testID} multi={multi}>{children}</ChoiceRow>;
  return (
    <Pressable testID={testID} accessibilityRole={multi ? "checkbox" : "radio"} accessibilityState={{ checked: !!on }} aria-checked={!!on} accessibilityLabel={sub ? `${children}. ${sub}` : children} onPress={() => { tapHaptic(); onPress(); }}
      style={({ pressed }) => [styles.opt, { borderColor: on ? color.ink : color.line, backgroundColor: on ? CHOSEN : color.white, transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
      <Text style={{ fontFamily: font.text[600], fontSize: 14, color: color.ink }}>{children}</Text>
      {sub ? <Text style={[type.body(12), { color: color.mute, marginTop: 3 }]}>{sub}</Text> : null}
    </Pressable>
  );
}

export const Bubble = ({ children }: { children: ReactNode }) => (
  <View style={styles.bubble}><Text style={type.bubble()}>{children}</Text></View>
);

// ─── art ────────────────────────────────────────────────────────────────
function Art({ refKey, h, w, style, fit = "contain" }: { refKey: string; h?: number; w?: number; style?: any; fit?: "contain" | "cover" }) {
  const a = art(refKey);
  if (!a) return null;
  const ratio = a.w / a.h;
  const size = h ? { height: h, width: w ?? h * ratio } : { width: w!, height: (w ?? 0) / ratio };
  return <Image source={a.src} style={[size, style]} contentFit={fit} transition={FADE} cachePolicy="memory-disk" accessibilityIgnoresInvertColors accessible={false} />;
}

export function Logo({ h = 44 }: { h?: number }) {
  return <Art refKey={data.LOGO_MARK} h={h} />;
}

/** The infinite hill guy. Poses come from the design build (wave, joy, jump, meditate…). He's alive: a slow
 *  breath while idle (slower when he's meditating or asleep) and a little pop each time he changes pose.
 *  `still` for places that already move him (the breath and sit steps). Reduced motion → a plain image. */
const CALM_POSES = new Set(["meditate", "sleep", "namaste", "readsit", "sitrock", "sitthink", "lieread"]);
// The finished animated mascot (8 hand-made loops, green keyed out): used wherever a pose has a matching loop.
const ANIM: Record<string, any> = {
  wave: require("../../assets/mascot/wave.webp"),
  cheer: require("../../assets/mascot/cheer.webp"),
  walk: require("../../assets/mascot/walk.webp"),
  climb: require("../../assets/mascot/climb.webp"),
  meditate: require("../../assets/mascot/meditate.webp"),
  think: require("../../assets/mascot/think.webp"),
  celebrate: require("../../assets/mascot/celebrate.webp"),
  tap: require("../../assets/mascot/tap_reaction.webp"),
  sleep: require("../../assets/mascot/sleep.webp"),
  sitrock: require("../../assets/mascot/sit_on_rock.webp"),
  read: require("../../assets/mascot/read.webp"),
  lantern: require("../../assets/mascot/lantern.webp"),
  stretch: require("../../assets/mascot/sunrise_stretch.webp"),
  peek: require("../../assets/mascot/peek.webp"),
  thumbs: require("../../assets/mascot/thumbs_up.webp"),
  namaste: require("../../assets/mascot/namaste.webp"),
  rest: require("../../assets/mascot/rest.webp"),
  heart: require("../../assets/mascot/heart.webp"),
  phone: require("../../assets/mascot/phone.webp"),
};
// every pose that has a hand-made loop (all 16 checked: he stays fully inside the frame in every frame)
const POSE_ANIM: Record<string, string> = {
  wave: "wave", cheer: "cheer", jump: "cheer", joy: "celebrate", celebrate: "celebrate",
  walk: "walk", stride: "walk", stroll: "walk", hike: "walk", stickwalk: "walk", climb: "climb",
  meditate: "meditate", think: "think", idea: "think", sitthink: "think", aha: "think", tap: "tap",
  sleep: "sleep", sitrock: "sitrock", read: "read", readsit: "read", lieread: "read", lantern: "lantern",
  stretch: "stretch", peek: "peek", thumbs: "thumbs", namaste: "namaste",
  rest: "rest", heart: "heart", thanks: "heart", phone: "phone", share: "phone",
};
export function Guy({ pose = "wave", h = 160, style, still }: { pose?: string; h?: number; style?: any; still?: boolean }) {
  const reduce = useReducedMotion();
  const breath = useSharedValue(0);
  const pop = useSharedValue(1);
  const calm = CALM_POSES.has(pose);
  useEffect(() => {
    if (reduce || still) return;
    const half = calm ? 2600 : 1500;
    breath.value = withRepeat(withSequence(withTiming(1, { duration: half, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: half, easing: Easing.inOut(Easing.sin) })), -1);
  }, [reduce, still, calm, breath]);
  useEffect(() => {
    if (reduce || still) return;
    pop.value = 0.86;
    pop.value = withSpring(1, { damping: 7, stiffness: 180 });
  }, [pose, reduce, still, pop]);
  const lift = Math.max(1.5, h / 70);
  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: -breath.value * lift }, { scaleY: 1 + breath.value * (calm ? 0.015 : 0.025) }, { scale: pop.value }],
  }));
  const popOnly = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const loop = POSE_ANIM[pose] && !reduce ? ANIM[POSE_ANIM[pose]] : null;
  if (loop) {
    // the loop already moves: no extra breathing on top, just the pop when the pose changes
    return (
      <Animated.View style={[style, { transformOrigin: "50% 100%" } as any, still ? null : popOnly]}>
        <Image source={loop} style={{ width: h, height: h }} contentFit="contain" autoplay accessibilityIgnoresInvertColors accessible={false} />
      </Animated.View>
    );
  }
  const img = <Art refKey={data.GUY[pose] || data.GUY.wave} h={h} />;
  if (reduce || still) return <View style={style}>{img}</View>;
  return <Animated.View style={[style, { transformOrigin: "50% 100%" } as any, anim]}>{img}</Animated.View>;
}

/** The sun. Calm = slow breathe; happy/glow = a hop; oops = a small shrug. Never disappointed. */
export function Sun({ size = 64, mood = "calm" }: { size?: number; mood?: "calm" | "happy" | "glow" | "oops" | "spin" }) {
  const reduce = useReducedMotion();
  const s = useSharedValue(1);
  const r = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    if (mood === "calm") s.value = withRepeat(withSequence(withTiming(1.06, { duration: 2000, easing: Easing.inOut(Easing.sin) }), withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) })), -1);
    else if (mood === "happy" || mood === "glow") s.value = withSequence(withTiming(1.18, { duration: 180 }), withTiming(1, { duration: 370 }));
    else if (mood === "oops") r.value = withSequence(withTiming(-6, { duration: 120 }), withTiming(4, { duration: 160 }), withTiming(0, { duration: 220 }));
    else if (mood === "spin") r.value = withRepeat(withTiming(360, { duration: 2400, easing: Easing.linear }), -1);
  }, [mood, reduce, s, r]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }, { rotate: `${r.value}deg` }] }));
  const f = size * 1.4; // the glow is in the image: the disk fills 1/1.4 of the frame (v134)
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }} accessible={false}>
      <Animated.View style={[{ width: f, height: f }, anim]}>
        <Art refKey={data.SUN_IMG} w={f} h={f} />
      </Animated.View>
    </View>
  );
}

/** Where each voice's head and shoulders sit in its photo (packages/brand/art/photos-*.jpg), so small and round
 *  faces frame the person, not the whole scene: a = photo width/height, cx/cy = the point to center (fractions of
 *  the photo), vh = how much of the photo's height the frame shows (top of the head to a little shoulder). */
const FACE_FOCUS: Record<string, { a: number; cx: number; cy: number; vh: number }> = {
  CHRISTIANITY: { a: 560 / 700, cx: 0.5, cy: 0.42, vh: 0.86 },
  CATHOLIC: { a: 382 / 523, cx: 0.55, cy: 0.3, vh: 0.48 },
  HINDUISM: { a: 700 / 467, cx: 0.48, cy: 0.27, vh: 0.46 },
  ISLAM: { a: 560 / 700, cx: 0.5, cy: 0.45, vh: 0.92 },
  JUDAISM: { a: 560 / 700, cx: 0.5, cy: 0.38, vh: 0.6 },
  BUDDHISM: { a: 560 / 700, cx: 0.5, cy: 0.4, vh: 0.62 },
  SIKHISM: { a: 420 / 651, cx: 0.45, cy: 0.22, vh: 0.42 },
  SPIRITUAL: { a: 560 / 700, cx: 0.47, cy: 0.33, vh: 0.6 },
};

/** The photo sized and offset so FACE_FOCUS's point sits in the middle of a w×h frame (never leaving a gap). */
function faceFrame(wing: string, w: number, h: number) {
  const f = FACE_FOCUS[wing];
  if (!f) return null;
  let H = h / f.vh, W = H * f.a;
  if (W < w) { W = w; H = W / f.a; }
  const left = Math.min(0, Math.max(w - W, w / 2 - f.cx * W));
  const top = Math.min(0, Math.max(h - H, h / 2 - f.cy * H));
  return { position: "absolute" as const, width: W, height: H, left, top };
}

/** A voice's portrait (or its initial on the door's tint when there is no photo). */
export function Face({ ic, w = 96, h = 120, r = 16, caption = true, big = false }: { ic: any; w?: number; h?: number; r?: number; caption?: boolean; big?: boolean }) {
  const ref = data.PHOTOS[ic.wing];
  const a = art(ref);
  // small numeric frames (the round faces) are framed on the head; the big welcome portrait keeps the whole photo
  const framed = !big && typeof w === "number" && typeof h === "number" ? faceFrame(ic.wing, w, h) : null;
  return (
    <View style={{ width: w, height: h, borderRadius: r, overflow: "hidden", backgroundColor: a ? "#000" : ic.tint }} accessibilityLabel={`${ic.name}, ${doorLabel(ic.wing)}`}>
      {a ? <Image source={a.src} style={framed ?? StyleSheet.absoluteFill} contentFit="cover" contentPosition={big ? "center" : "top"} transition={FADE} cachePolicy="memory-disk" /> : (
        <View style={[StyleSheet.absoluteFill, styles.center]}><Text style={{ fontFamily: font.display[800], fontSize: big ? 64 : 36, color: "#ffffff55" }}>{ic.short[0]}</Text></View>
      )}
      {caption && a ? <LinearGradient pointerEvents="none" colors={["rgba(0,0,0,0)", "rgba(0,0,0,.62)"]} style={[styles.faceScrim, { height: Math.min(h * 0.6, big ? 150 : 90) }]} /> : null}
      {caption ? (
        <View style={styles.faceCaption}>
          <Text style={{ fontFamily: font.display[800], fontSize: big ? 22 : 15, color: "#fff", textShadowColor: "rgba(0,0,0,.75)", textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } }}>{ic.name}</Text>
          <Text style={[type.eyebrow(8), { color: color.gold, marginTop: 4, textShadowColor: "rgba(0,0,0,.75)", textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } }]}>{doorLabel(ic.wing)}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pad: { paddingHorizontal: 22, paddingBottom: 24 },
  scroll: { paddingHorizontal: 18, paddingBottom: 120 },
  center: { alignItems: "center", justifyContent: "center" },
  btn: { borderRadius: radius.btn, paddingVertical: 15, paddingHorizontal: 18, alignItems: "center", borderWidth: 1.5 },
  btnText: { fontFamily: font.text[600], fontSize: 13, letterSpacing: 0.78 },
  card: { backgroundColor: color.white, borderColor: color.line, borderWidth: 1, borderRadius: 20, padding: 16, shadowColor: "#161310", shadowOpacity: 0.05, shadowRadius: 15, shadowOffset: { width: 0, height: 8 } },
  cardDark: { backgroundColor: color.ink, borderWidth: 0 },
  opt: { borderWidth: 1.5, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 16 },
  choice: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, borderWidth: 1.5, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: color.line, backgroundColor: color.white, alignItems: "center", justifyContent: "center" },
  bubble: { flex: 1, backgroundColor: color.white, borderColor: color.line, borderWidth: 1, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16 },
  faceCaption: { position: "absolute", left: 12, right: 12, bottom: 12 },
  faceScrim: { position: "absolute", left: 0, right: 0, bottom: 0 },
});
