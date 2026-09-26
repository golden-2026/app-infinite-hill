import { useTitle } from "@/lib/title";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDone } from "@/lib/done";
import { bell } from "@/lib/sound";
import { successHaptic } from "@/lib/haptics";
import { CloseButton, Sun, color, type } from "@/ui";
import { useChrome } from "@/ui/chrome";

// v175 PostLesson step 1: the ember. Tap (or swipe up) to light the day.
export default function Light() {
  useTitle("light your day");
  const { count, go, close } = useDone();
  useChrome(true);
  const insets = useSafeAreaInsets();
  const [risen, setRisen] = useState(false);
  const y = useSharedValue(40);
  const s = useSharedValue(0.8);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { scale: s.value }] }));
  const rise = () => {
    if (risen) return;
    setRisen(true);
    bell();
    successHaptic();
    y.value = withTiming(-40, { duration: 900 });
    s.value = withTiming(1.25, { duration: 900 });
    setTimeout(() => go("/done/lit"), 900);
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.ink }}>
      <View style={{ position: "absolute", top: 0, right: 0, zIndex: 2, paddingTop: insets.top + 4, paddingRight: 6 }}><CloseButton dark onPress={close} /></View>
      <Pressable testID="light-day" accessibilityRole="button" accessibilityLabel={`Light day ${count}`} onPress={rise} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={anim}><Sun size={150} mood={risen ? "happy" : "calm"} /></Animated.View>
        {!risen ? <Text style={[type.h1(24), { color: "#fff", marginTop: 60 }]}>tap to light day {count === 1 ? "one" : count}.</Text> : null}
      </Pressable>
    </SafeAreaView>
  );
}
