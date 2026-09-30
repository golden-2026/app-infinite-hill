// The streak's pieces: the odometer number, the Monday-to-Sunday week, the banked rest days (moons), and the chip
// on Today. The sun is our flame; the number leads. Rest days are soft moons, never red.
import { streakWeek, type Streak } from "@ih/domain";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, Mask, Path, Rect } from "react-native-svg";
import { Sun, color, font, type } from "@/ui";

export const GOLDEN = "#EEFF6A";
export const MOON = "#8C93B8"; // a soft dusk blue: rest, not loss

/** One odometer wheel: rolls forward from one digit to the next (9 → 0 keeps rolling up, like a real counter). */
function Wheel({ from, to, size, ink, delay, duration }: { from: number; to: number; size: number; ink: string; delay: number; duration: number }) {
  const reduce = useReducedMotion();
  const h = Math.round(size * 1.08);
  const target = to < from ? to + 10 : to;
  const y = useSharedValue(reduce ? -target * h : -from * h);
  useEffect(() => {
    if (reduce) { y.value = -target * h; return; }
    y.value = -from * h;
    y.value = withDelay(delay, withTiming(-target * h, { duration, easing: Easing.out(Easing.cubic) }));
  }, [from, target, h, delay, duration, reduce, y]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View style={{ height: h, overflow: "hidden" }}>
      <Animated.View style={a}>
        {Array.from({ length: 20 }, (_, i) => (
          <Text key={i} style={{ height: h, lineHeight: h, fontFamily: font.display[800], fontSize: size, letterSpacing: -size * 0.04, color: ink, textAlign: "center", fontVariant: ["tabular-nums"] }}>{i % 10}</Text>
        ))}
      </Animated.View>
    </View>
  );
}

/** The streak number, ticking from `from` up to `to` digit by digit. Screen readers hear just the final number. */
export function Odometer({ from, to, size = 110, ink = color.ink, delay = 350, duration = 1100 }: { from: number; to: number; size?: number; ink?: string; delay?: number; duration?: number }) {
  const digits = String(Math.max(to, 0)).length;
  const a = String(Math.max(0, Math.min(from, to))).padStart(digits, "0");
  const b = String(Math.max(to, 0));
  return (
    <View accessible accessibilityLabel={`${to}`} style={{ flexDirection: "row" }}>
      {b.split("").map((ch, i) => {
        const fromD = Number(a[i]);
        const toD = Number(ch);
        // the right-most wheel always turns; the others only when their digit changes
        return <Wheel key={i} from={fromD} to={toD} size={size} ink={ink} delay={delay + (digits - 1 - i) * 120} duration={fromD === toD ? 1 : duration} />;
      })}
    </View>
  );
}

/** A soft crescent moon: a banked or spent rest day. */
export function Moon({ size = 22, fill = MOON, faint = false }: { size?: number; fill?: string; faint?: boolean }) {
  const id = `m${size}${faint ? "f" : ""}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Defs>
        <Mask id={id}><Rect x="0" y="0" width="24" height="24" fill="#fff" /><Circle cx="16" cy="8" r="8" fill="#000" /></Mask>
      </Defs>
      <Circle cx="12" cy="12" r="10" fill={faint ? "none" : fill} stroke={fill} strokeWidth={faint ? 1.6 : 0} strokeDasharray={faint ? "3 3" : undefined} mask={`url(#${id})`} />
    </Svg>
  );
}

function Check({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="11" fill={GOLDEN} stroke={color.ink} strokeWidth="1.6" />
      <Path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke={color.ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Monday to Sunday: checks for lesson days, moons for rest days, a ring for today, outlines for the rest. */
export function WeekRow({ s, today, dark = false, size = 34 }: { s: Streak; today: string; dark?: boolean; size?: number }) {
  // days before the very first lesson were never missed: draw them like the days ahead (a faint dot), not a ring
  const first = Object.keys(s.days || {}).sort()[0] || today;
  const week = streakWeek(s, today).map((w) => (w.kind === "empty" && w.date < first ? { ...w, kind: "before" as const } : w));
  const done = week.filter((w) => w.kind === "lesson").length;
  const rested = week.filter((w) => w.kind === "rest").length;
  const line = dark ? "#ffffff44" : "#00000026";
  return (
    <View accessibilityRole="text" accessibilityLabel={`this week: ${done} ${done === 1 ? "lesson day" : "lesson days"}${rested ? `, ${rested} ${rested === 1 ? "rest day" : "rest days"}` : ""}`} style={{ flexDirection: "row", gap: 6, justifyContent: "center" }}>
      {week.map((w) => (
        <View key={w.date} testID={`week-${w.kind}`} style={{ alignItems: "center", width: size + 4 }}>
          <Text style={[type.eyebrow(8), { color: w.date === today ? (dark ? GOLDEN : color.ink) : dark ? "#ffffff88" : color.mute, letterSpacing: 0.6 }]}>{w.label}</Text>
          <View style={{ width: size, height: size, marginTop: 6, alignItems: "center", justifyContent: "center" }}>
            {w.kind === "lesson" ? <Check size={size - 4} />
              : w.kind === "rest" ? <View style={{ width: size - 4, height: size - 4, borderRadius: size, backgroundColor: dark ? "#ffffff14" : "#EEF0F8", alignItems: "center", justifyContent: "center" }}><Moon size={size - 14} /></View>
              : w.kind === "today" ? <View style={{ width: size - 6, height: size - 6, borderRadius: size, borderWidth: 2, borderStyle: "dashed", borderColor: dark ? GOLDEN : color.ink }} />
              : w.kind === "later" || w.kind === "before" ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: line }} />
              : <View style={{ width: size - 12, height: size - 12, borderRadius: size, borderWidth: 2, borderColor: line }} />}
          </View>
        </View>
      ))}
    </View>
  );
}

/** Banked rest days as moons (at most 2). */
export function RestBank({ n, max = 2, dark = false }: { n: number; max?: number; dark?: boolean }) {
  return (
    <View accessibilityRole="text" accessibilityLabel={`${n} of ${max} rest days banked`} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 4 }}>{Array.from({ length: max }, (_, i) => <Moon key={i} size={20} faint={i >= n} />)}</View>
      <Text style={[type.body(13), { color: dark ? "#ffffffcc" : color.ink }]}>{n === 0 ? "no rest days banked" : `${n} rest ${n === 1 ? "day" : "days"} banked`}</Text>
    </View>
  );
}

/** Today's header: the number first, then the sun. Gold once it's a golden streak. */
export function StreakChip({ n, golden }: { n: number; golden: boolean }) {
  return (
    <View testID={golden ? "streak-golden" : "streak-chip"} style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: golden ? GOLDEN : "#fff", borderWidth: 1.5, borderColor: color.ink, borderRadius: 999, paddingVertical: 4, paddingLeft: 12, paddingRight: 8 }}>
      <Text style={{ fontFamily: font.display[800], fontSize: 18, color: color.ink, fontVariant: ["tabular-nums"] }}>{n}</Text>
      <Sun size={18} />
    </View>
  );
}
