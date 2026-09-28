// A small burst of sun specks and four-point stars that flies out from a point and fades (about 600 ms).
// It plays once when it mounts; give it a new `key` to play it again. Never catches touches, and draws nothing
// for people who asked for reduced motion.
import { useEffect, useMemo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming, type SharedValue } from "react-native-reanimated";
import { color } from "@ih/brand";

type P = { angle: number; dist: number; size: number; star: boolean; spin: number; tint: string };

export function Sparkle({ count = 10, radius = 56, size = 7, duration = 600, delay = 0, colors, style }: {
  /** how many specks */ count?: number;
  /** how far they fly, px */ radius?: number;
  /** base speck size, px */ size?: number;
  duration?: number;
  /** wait this long (ms) before bursting, e.g. until a banner lands */ delay?: number;
  /** tints to pick from (default: gold, white, warm amber) */ colors?: string[];
  /** where the burst's center sits; default is the center of the parent */ style?: StyleProp<ViewStyle>;
}) {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  const parts = useMemo<P[]>(() => {
    const tints = colors ?? [color.gold, "#FFFFFF", "#FFC94A"];
    return Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
      dist: radius * (0.6 + Math.random() * 0.5),
      size: size * (0.7 + Math.random() * 0.7),
      star: i % 2 === 0,
      spin: (Math.random() - 0.5) * 180,
      tint: tints[i % tints.length],
    }));
  }, [count, radius, size, colors]);
  useEffect(() => {
    if (reduce) return;
    t.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.cubic) }));
  }, [reduce, duration, delay, t]);
  if (reduce) return null;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[{ position: "absolute", left: "50%", top: "50%", width: 0, height: 0, overflow: "visible", zIndex: 30 }, style]}>
      {parts.map((p, i) => <Speck key={i} p={p} t={t} />)}
    </View>
  );
}

function Speck({ p, t }: { p: P; t: SharedValue<number> }) {
  const anim = useAnimatedStyle(() => {
    const v = t.value;
    // pop in fast, drift out, shrink and fade in the last half
    const grow = v < 0.2 ? v / 0.2 : 1 - (v - 0.2) * 0.9;
    return {
      opacity: v < 0.55 ? 1 : Math.max(0, 1 - (v - 0.55) / 0.45),
      transform: [
        { translateX: Math.cos(p.angle) * p.dist * v },
        { translateY: Math.sin(p.angle) * p.dist * v - 10 * v * v },
        { rotate: `${p.spin * v}deg` },
        { scale: Math.max(0, grow) },
      ],
    };
  });
  const s = p.size;
  return (
    <Animated.View style={[{ position: "absolute", left: -s / 2, top: -s / 2, width: s, height: s, alignItems: "center", justifyContent: "center" }, anim]}>
      {p.star ? (
        // a four-point star: two thin crossed rays
        <>
          <View style={{ position: "absolute", width: s * 0.34, height: s * 1.5, borderRadius: s, backgroundColor: p.tint }} />
          <View style={{ position: "absolute", width: s * 1.5, height: s * 0.34, borderRadius: s, backgroundColor: p.tint }} />
        </>
      ) : (
        // a little sun: a round speck with a soft glow
        <View style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: p.tint, shadowColor: p.tint, shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }} />
      )}
    </Animated.View>
  );
}
