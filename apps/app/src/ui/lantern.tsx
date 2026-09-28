// The lantern: our own reward object (a paper lantern that lights), drawn in SVG so it can glow and flicker.
import { useEffect, useId } from "react";
import Svg, { Defs, Ellipse, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { View } from "react-native";

export function Lantern({ size = 120, lit = false }: { size?: number; lit?: boolean }) {
  // each lantern needs its own gradient name: two on one page (Today + the lantern screen) shared "flame" and the second stayed dark
  const gid = `flame${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const glow = useSharedValue(lit ? 1 : 0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!lit) { glow.value = withTiming(0, { duration: 200 }); return; }
    glow.value = reduce ? 1 : withRepeat(withSequence(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }), withTiming(0.75, { duration: 900, easing: Easing.inOut(Easing.sin) })), -1, true);
  }, [lit, reduce, glow]);
  const halo = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.9 + glow.value * 0.2 }] }));
  const w = size, h = size * 1.25;
  return (
    <View style={{ width: w * 1.6, height: h * 1.3, alignItems: "center", justifyContent: "center" }} accessibilityLabel={lit ? "a lit lantern" : "an unlit lantern"}>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", width: w * 1.6, height: w * 1.6, borderRadius: w * 0.8, backgroundColor: "#FFD23F55" }, halo]} />
      <Svg width={w} height={h} viewBox="0 0 100 125">
        <Defs>
          <RadialGradient id={gid} cx="50%" cy="58%" r="55%">
            <Stop offset="0" stopColor={lit ? "#FFF7C2" : "#6b6448"} />
            <Stop offset="0.6" stopColor={lit ? "#FFD23F" : "#4a4533"} />
            <Stop offset="1" stopColor={lit ? "#F2A516" : "#2f2c22"} />
          </RadialGradient>
        </Defs>
        <Path d="M50 2 C 53 2 53 10 50 12 C 47 10 47 2 50 2 Z" fill="#2b2b2b" />
        <Rect x="36" y="12" width="28" height="9" rx="3" fill="#1d1d1d" />
        <Ellipse cx="50" cy="66" rx="40" ry="44" fill={`url(#${gid})`} />
        {[22, 36, 50, 64, 78].map((x) => <Path key={x} d={`M${x} 26 Q ${x + (x - 50) * 0.35} 66 ${x} 106`} stroke={lit ? "#E08E0B88" : "#00000055"} strokeWidth="2" fill="none" />)}
        <Rect x="36" y="106" width="28" height="9" rx="3" fill="#1d1d1d" />
        <Path d="M44 115 L 50 124 L 56 115 Z" fill={lit ? "#E5484D" : "#553"} />
      </Svg>
    </View>
  );
}
