// v175's "drop" entrance (≈.35s ease-out) for each new screen or lesson step. Plain timed values on mount
// (Reanimated's layout "entering" presets don't finish on web and left content invisible). Reduced motion:
// content appears at once.
import { useEffect, type ReactNode } from "react";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";

export function Enter({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reduce = useReducedMotion();
  const o = useSharedValue(reduce ? 1 : 0);
  const y = useSharedValue(reduce ? 0 : -14);
  useEffect(() => {
    if (reduce) return;
    const ease = Easing.out(Easing.cubic);
    o.value = withTiming(1, { duration: 340, easing: ease });
    y.value = withTiming(0, { duration: 340, easing: ease });
  }, [reduce, o, y]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }] }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/** A pushed screen slides in from the right on web, like a native stack. Native stacks animate themselves.
 *  A CSS animation, not frame-driven values: it always ends visible, even if frames pause mid-way. */
// Keyframes compile only through StyleSheet.create on react-native-web, never inline.
const web = StyleSheet.create({
  right: {
    animationKeyframes: [{ from: { opacity: 0, transform: [{ translateX: 28 }] }, to: { opacity: 1, transform: [{ translateX: 0 }] } }],
    animationDuration: "300ms",
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    animationFillMode: "backwards",
  } as unknown as ViewStyle,
  // sheets rise from the bottom
  up: {
    animationKeyframes: [{ from: { opacity: 0, transform: [{ translateY: 60 }] }, to: { opacity: 1, transform: [{ translateY: 0 }] } }],
    animationDuration: "340ms",
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    animationFillMode: "backwards",
  } as unknown as ViewStyle,
});

export function Slide({ children, style, from = "right" }: { children: ReactNode; style?: StyleProp<ViewStyle>; from?: "right" | "up" }) {
  const reduce = useReducedMotion();
  return <View style={[style, Platform.OS === "web" && !reduce && web[from]]}>{children}</View>;
}
