import { useTitle } from "@/lib/title";
import { useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, interpolateColor, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { useDone } from "@/lib/done";
import { bell } from "@/lib/sound";
import { play } from "@/lib/fx";
import { successHaptic } from "@/lib/haptics";
import { CloseButton, Guy, Sun, color, type } from "@/ui";
import { useChrome } from "@/ui/chrome";

// Lighting the day: a sunrise over your hill. Tap (anywhere) and the sun climbs over the ridge, the sky warms
// from night to gold, and the mascot cheers. Our own streak moment (the sun and the hill), not a flame.
export default function Light() {
  useTitle("light your day");
  const { count, go, close } = useDone();
  useChrome(true);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [risen, setRisen] = useState(false);
  const up = useSharedValue(0);
  const guy = useSharedValue(0);
  const sky = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(up.value, [0, 1], ["#0b0d12", "#2a1c05"]) }));
  const glow = useAnimatedStyle(() => ({ opacity: up.value }));
  const sun = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - up.value) * 170 }, { scale: 0.85 + up.value * 0.35 }] }));
  const cheer = useAnimatedStyle(() => ({ opacity: guy.value, transform: [{ translateY: (1 - guy.value) * 30 }] }));
  const rise = () => {
    if (risen) return;
    setRisen(true);
    bell();
    play("complete");
    successHaptic();
    up.value = withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) });
    guy.value = withDelay(900, withTiming(1, { duration: 400 }));
    setTimeout(() => go("/done/lit"), 2300);
  };
  const ridge = `M0 ${height * 0.18} C ${width * 0.25} ${height * 0.02}, ${width * 0.45} ${height * 0.02}, ${width * 0.6} ${height * 0.1} S ${width * 0.9} ${height * 0.06}, ${width} ${height * 0.14} L ${width} ${height * 0.4} L 0 ${height * 0.4} Z`;
  return (
    <Animated.View style={[{ flex: 1 }, sky]}>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }, glow]}>
        <Svg width={width} height={height}>
          <Defs>
            <RadialGradient id="dawn" cx="50%" cy="62%" rx="75%" ry="45%">
              <Stop offset="0" stopColor="#FFD27A" stopOpacity="0.85" />
              <Stop offset="0.45" stopColor="#FFB84D" stopOpacity="0.35" />
              <Stop offset="1" stopColor="#FFB84D" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={width} height={height} fill="url(#dawn)" />
        </Svg>
      </Animated.View>
      <View style={{ position: "absolute", top: 0, right: 0, zIndex: 3, paddingTop: insets.top + 4, paddingRight: 6 }}><CloseButton dark onPress={close} /></View>
      <Pressable testID="light-day" accessibilityRole="button" accessibilityLabel={`Light day ${count}`} onPress={rise} style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", paddingBottom: height * 0.32 }}>
          <Animated.View style={sun}><Sun size={150} mood={risen ? "happy" : "calm"} /></Animated.View>
        </View>
        <Svg width={width} height={height * 0.4} style={{ position: "absolute", bottom: 0 }} viewBox={`0 0 ${width} ${height * 0.4}`}>
          <Path d={ridge} fill="#111418" />
        </Svg>
        <Animated.View pointerEvents="none" style={[{ position: "absolute", bottom: height * 0.12, right: 24 }, cheer]}><Guy pose="cheer" h={150} /></Animated.View>
        <View style={{ position: "absolute", bottom: insets.bottom + 40, left: 0, right: 0, alignItems: "center" }}>
          <Text style={[type.h1(24), { color: risen ? color.gold : "#fff" }]}>{risen ? `day ${count === 1 ? "one" : count}, lit.` : `tap to light day ${count === 1 ? "one" : count}.`}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
