// The loud brand's shared parts (2026-11-06, prototypes/greybox/episodes/BRIEF.md, Magna's playbook):
// the chunky wordmark as a graphic, a lime "drop" tag, and kinetic headlines whose words slam in one by one.
// Motion respects reduced-motion (the words just appear).
import { useEffect, type ReactNode } from "react";
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { color, font, type } from "@ih/brand";

/** One word that slams in: big, tilted and see-through first, then snaps into place. */
function SlamWord({ children, delay, style }: { children: string; delay: number; style?: StyleProp<TextStyle> }) {
  const reduce = useReducedMotion();
  const v = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) { v.value = 1; return; }
    v.value = 0;
    v.value = withDelay(delay, withSpring(1, { damping: 11, stiffness: 260, mass: 0.6 }));
  }, [children, delay, reduce, v]);
  const anim = useAnimatedStyle(() => ({
    opacity: Math.min(1, v.value * 1.6),
    transform: [{ scale: 1 + (1 - v.value) * 1.2 }, { rotate: `${(1 - v.value) * -5}deg` }],
  }));
  return <Animated.Text style={[style, anim]}>{children}</Animated.Text>;
}

/** A kinetic headline. `words` slam in one at a time; `hot` (indexes) are the key words, in solid lime (never a
 *  rainbow gradient). Screen readers get the whole line at once. */
export function Shout({ words, hot = [], size = 64, colorHot = color.gold, step = 110, start = 0, style, center }: {
  words: string[]; hot?: number[]; size?: number; colorHot?: string; step?: number; start?: number; style?: StyleProp<ViewStyle>; center?: boolean;
}) {
  const line = words.join(" ");
  return (
    <View accessible accessibilityRole="header" accessibilityLabel={line} style={[{ flexDirection: "row", flexWrap: "wrap", columnGap: size * 0.22, justifyContent: center ? "center" : "flex-start" }, style]}>
      {words.map((w, i) => (
        <SlamWord key={`${i}-${w}`} delay={start + i * step} style={[type.shout(size), hot.includes(i) ? { color: colorHot } : null]}>{w}</SlamWord>
      ))}
    </View>
  );
}

/** Split a sentence into words for Shout, and light up its last word (Magna's one hot word). */
export function shoutWords(text: string, max = 7): { words: string[]; hot: number[] } {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).slice(0, max);
  return { words, hot: words.length ? [words.length - 1] : [] };
}

/** The chunky wordmark, used as a graphic (Magna's playbook). */
export function Wordmark({ size = 56, tone = "lime", style }: { size?: number; tone?: "lime" | "cream" | "black"; style?: StyleProp<TextStyle> }) {
  const c = tone === "lime" ? color.gold : tone === "black" ? "#0A0A0A" : color.ink;
  return <Text accessibilityRole="header" style={[{ fontFamily: font.mark[800], fontSize: size, lineHeight: Math.round(size * 0.95), letterSpacing: size * 0.01, textTransform: "uppercase", color: c }, style]}>infinite hill</Text>;
}

/** A small pill tag: "DROP 01", a door name, "NEW". Lime by default; pass a door colour for faith tags. */
export function Tag({ children, bg = color.gold, fg = "#0A0A0A", style }: { children: ReactNode; bg?: string; fg?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ alignSelf: "flex-start", backgroundColor: bg, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11 }, style]}>
      <Text style={{ fontFamily: font.text[700], fontSize: 11, letterSpacing: 1.8, textTransform: "uppercase", color: fg }}>{children}</Text>
    </View>
  );
}

/** A colour block that punches in (scale + fade) once: game hits, the done screen's stamp. */
export function Punch({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const reduce = useReducedMotion();
  const v = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) return;
    v.value = withDelay(delay, withTiming(1, { duration: 320, easing: Easing.out(Easing.back(2.2)) }));
  }, [delay, reduce, v]);
  const anim = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ scale: 0.7 + v.value * 0.3 }] }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/** Two-digit drop numbers ("01"), for the drops/series framing. */
export const dropNo = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0");
