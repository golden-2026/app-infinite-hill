import { FADE } from "@/ui/fade";
// v175's atoms (Sun, Guy, Face, Btn, Card, Opt, Bubble, text styles) for React Native + web.
// Every tappable thing has an accessibility role and label; motion respects reduced-motion.
import { useEffect, type ReactNode } from "react";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { art, color, font, radius, type } from "@ih/brand";
import { data, label } from "@ih/content";
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
export function Card({ children, dark, onPress, style, label: a11y }: { children: ReactNode; dark?: boolean; onPress?: () => void; style?: StyleProp<ViewStyle>; label?: string }) {
  const s = [styles.card, dark ? styles.cardDark : null, style];
  if (!onPress) return <View style={s}>{children}</View>;
  return <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={() => { tapHaptic(); onPress(); }} style={({ pressed }) => [...s, pressed && { opacity: 0.94, transform: [{ scale: 0.985 }] }]}>{children}</Pressable>;
}

/** `big`: v175's onboarding choice (Manrope 17), not the small settings option. */
export function Opt({ on, onPress, children, sub, testID, big }: { on?: boolean; onPress: () => void; children: string; sub?: string; testID?: string; big?: boolean }) {
  return (
    <Pressable testID={testID} accessibilityRole="radio" accessibilityState={{ checked: !!on }} aria-checked={!!on} accessibilityLabel={sub ? `${children}. ${sub}` : children} onPress={() => { tapHaptic(); onPress(); }}
      style={({ pressed }) => [styles.opt, big && { paddingVertical: 14, paddingHorizontal: 14 }, { borderColor: on ? color.ink : color.line, backgroundColor: on ? "#FFFBE0" : color.white, transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
      <Text style={big ? { fontFamily: font.display[500], fontSize: 17, color: color.ink } : { fontFamily: font.text[600], fontSize: 14, color: color.ink }}>{children}</Text>
      {sub ? <Text style={[type.body(12), { color: color.mute, marginTop: 3 }]}>{sub}</Text> : null}
    </Pressable>
  );
}

export const Bubble = ({ children }: { children: ReactNode }) => (
  <View style={styles.bubble}><Text style={{ fontFamily: font.display[500], fontSize: 18, lineHeight: 22, color: color.ink }}>{children}</Text></View>
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

/** The infinite hill guy. Poses come from the design build (wave, joy, jump, meditate…). */
export function Guy({ pose = "wave", h = 160, style }: { pose?: string; h?: number; style?: any }) {
  return <Art refKey={data.GUY[pose] || data.GUY.wave} h={h} style={style} />;
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

/** A voice's portrait (or its initial on the door's tint when there is no photo). */
export function Face({ ic, w = 96, h = 120, r = 16, caption = true, big = false }: { ic: any; w?: number; h?: number; r?: number; caption?: boolean; big?: boolean }) {
  const ref = data.PHOTOS[ic.wing];
  const a = art(ref);
  return (
    <View style={{ width: w, height: h, borderRadius: r, overflow: "hidden", backgroundColor: a ? "#000" : ic.tint }} accessibilityLabel={`${ic.name}, ${label(ic.wing)}`}>
      {a ? <Image source={a.src} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition={big ? "center" : "top"} transition={FADE} cachePolicy="memory-disk" /> : (
        <View style={[StyleSheet.absoluteFill, styles.center]}><Text style={{ fontFamily: font.display[800], fontSize: big ? 64 : 36, color: "#ffffff55" }}>{ic.short[0]}</Text></View>
      )}
      {caption ? (
        <View style={styles.faceCaption}>
          <Text style={{ fontFamily: font.display[800], fontSize: big ? 22 : 15, color: "#fff", textShadowColor: "rgba(0,0,0,.75)", textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } }}>{ic.name}</Text>
          <Text style={[type.eyebrow(8), { color: color.gold, marginTop: 4, textShadowColor: "rgba(0,0,0,.75)", textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } }]}>{label(ic.wing)}</Text>
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
  bubble: { flex: 1, backgroundColor: color.white, borderColor: color.line, borderWidth: 1, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16 },
  faceCaption: { position: "absolute", left: 12, right: 12, bottom: 12 },
});
