// The hill: v175's painted map (v172 "the painted hill") as a real game map.
// The painting, light, footprints, camp signs and poses are v175's. The stones are now proper nodes:
// done (gold, replayable), today (big, pulsing, a bouncing "start" bubble), tomorrow and later (locked,
// with a tap that says when they open). Everything sits on v175's traced trail in % of the painting,
// so it lines up at any screen width.
import { data, faceFor, trailX } from "@ih/content";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Circle, Ellipse, G, Rect, Text as SvgText } from "react-native-svg";
import { art } from "@ih/brand";
import { FADE } from "@/ui/fade";
import { color, font } from "@/ui";

const W = 390;
const pillW = (txt: string) => txt.length * 6.4 + 22;
const celebrated = new Set<string>(); // "door:lesson" popped once per app session

function Pill({ x, y, txt, anchor, night }: { x: number; y: number; txt: string; anchor: "start" | "middle" | "end"; night: boolean }) {
  const w = pillW(txt);
  let rx = anchor === "end" ? x - w : anchor === "middle" ? x - w / 2 : x;
  rx = Math.max(8, Math.min(W - 8 - w, rx));
  return (
    <G>
      <Rect x={rx} y={y - 10} width={w} height={15} rx={7.5} fill={night ? "#FFFFFF" : "#0A0A0A"} opacity={0.92} />
      <SvgText x={rx + 11} y={y + 1} fontFamily="Inter_700Bold" fontSize={7.5} fill={night ? "#0A0A0A" : "#FFFFFF"} fontWeight="700" letterSpacing={1.4}>{txt}</SvgText>
    </G>
  );
}

type NodeState = "done" | "now" | "tomorrow" | "locked";

export function HillScene({ hour, done, total, words, doneToday, onStart, onReplay, firstLesson, wing, label, onNow }: {
  hour: number; done: number; total: number; words: string[]; doneToday: boolean; onStart: () => void; onReplay: (lesson: number) => void;
  firstLesson: number; wing: string; label: string; onNow?: (y: number) => void;
}) {
  const face = faceFor(wing);
  const bg = art(face.bg);
  const [width, setWidth] = useState(W);
  const k = width / W;
  const night = hour < 6 || hour >= 20;
  const golden = hour >= 17 && hour < 20;
  const H = face.h;
  const yBot = H - 92;
  const yTop = face.top + 26;
  const pts = Array.from({ length: total }, (_, i) => {
    const t = total > 1 ? i / (total - 1) : 0;
    const y = yBot - t * (yBot - yTop);
    return [trailX(face, y), y] as [number, number];
  });
  const nowI = Math.min(done, total - 1);
  const [nx, ny] = pts[nowI];
  const canStart = !doneToday && done < total;
  useEffect(() => { onNow?.(ny * k); }, [ny, k]); // eslint-disable-line react-hooks/exhaustive-deps
  const camps = ([[6, "WEEK 1 · REST"], [13, "WEEK 2 · REST"]] as [number, string][]).filter(([d]) => d < total - 1);
  const [sx, sy] = pts[total - 1];
  const px = (x: number) => `${(x / W) * 100}%` as const;
  const py = (y: number) => `${(y / H) * 100}%` as const;

  const state = (i: number): NodeState => (i < done ? "done" : i === done && canStart ? "now" : i === done && doneToday ? "tomorrow" : "locked");

  // motion: today's stone breathes, the start bubble bobs, the character bobs, a just-lit stone pops once
  const reduce = useReducedMotion();
  const pulse = useSharedValue(1);
  const bob = useSharedValue(0);
  const pop = useSharedValue(1);
  const popKey = `${wing}:${firstLesson + done - 1}`;
  // decided once per mount, so a re-render can't cancel the pop half-way
  const [justLit] = useState(() => doneToday && done > 0 && !celebrated.has(popKey));
  useEffect(() => {
    if (reduce) return;
    if (canStart) pulse.value = withRepeat(withSequence(withTiming(1.28, { duration: 1100 }), withTiming(1, { duration: 1100 })), -1);
    bob.value = withRepeat(withSequence(withTiming(-5, { duration: 900, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) })), -1);
  }, [reduce, canStart, pulse, bob]);
  useEffect(() => {
    if (!justLit) return;
    celebrated.add(popKey);
    if (reduce) return;
    pop.value = 0.3;
    const t = setTimeout(() => { pop.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.back(2.2)) }); }, 350);
    return () => { clearTimeout(t); pop.value = 1; };
  }, [justLit, popKey, reduce, pop]);
  const ring = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: 2.2 - pulse.value * 1.6 }));
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  // a tap on a locked stone explains itself for a moment
  const [tip, setTip] = useState<{ i: number; text: string } | null>(null);
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTip = (i: number, text: string) => {
    setTip({ i, text });
    if (tipTimer.current) clearTimeout(tipTimer.current);
    tipTimer.current = setTimeout(() => setTip(null), 2200);
  };
  useEffect(() => () => { if (tipTimer.current) clearTimeout(tipTimer.current); }, []);

  const guy = (pose: string, x: number, y: number, h: number, animated = false) => {
    const a = art(data.GUY[pose]);
    if (!a) return null;
    const img = <Image source={a.src} style={{ height: "100%", aspectRatio: a.w / a.h }} contentFit="contain" transition={FADE} accessible={false} />;
    return (
      <Animated.View key={pose + x} pointerEvents="none" style={[{ position: "absolute", left: px(x), top: py(y), height: py(h) }, animated ? bobStyle : null]}>{img}</Animated.View>
    );
  };

  const NODE = { done: 40, now: 54, tomorrow: 42, locked: 38 } as const;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ width: "100%", aspectRatio: W / H }}>
      {bg ? <Image source={bg.src} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" transition={FADE} cachePolicy="memory-disk" accessible={false} /> : null}
      <LinearGradient pointerEvents="none" colors={["rgba(247,247,245,0)", "#F7F7F5"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 56 }} />

      {/* light, stars, footprints and signs: v175's SVG layer (the stones moved to real nodes below) */}
      <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ position: "absolute" }} pointerEvents="none">
        {night ? <Rect width={W} height={H} fill="#0A0A1A" opacity={0.58} /> : golden ? <Rect width={W} height={H} fill="#FFB347" opacity={0.14} /> : null}
        {night ? Array.from({ length: 30 }, (_, i) => <Circle key={i} cx={(i * 137) % 390} cy={(i * 53) % 120} r={i % 3 ? 1 : 1.8} fill="#fff" opacity={0.9} />) : null}
        {/* footprints between the stones you've walked (the stones themselves now cover their own spot) */}
        {pts.slice(0, Math.min(done, total - 1)).map(([x0, y0], i) => { const [x1, y1] = pts[i + 1]; const x = (x0 + x1) / 2; const y = (y0 + y1) / 2; return (
          <G key={`f${i}`}>
            <Ellipse cx={x - 4} cy={y + 2} rx={2.6} ry={4.4} fill="#EEFF6A" opacity={0.85} transform={`rotate(-20 ${x - 4} ${y + 2})`} />
            <Ellipse cx={x + 5} cy={y - 4} rx={2.6} ry={4.4} fill="#EEFF6A" opacity={0.85} transform={`rotate(-20 ${x + 5} ${y - 4})`} />
          </G>
        ); })}
        {camps.map(([d, l]) => { const [x, y] = pts[d]; const left = x > W / 2; return <Pill key={l} x={left ? x - 26 : x + 26} y={y - 2} txt={l} anchor={left ? "end" : "start"} night={night} />; })}
        <Pill x={14} y={H - 40} txt="▲ THE TRAILHEAD · YOUR FOOTPRINTS STAY" anchor="start" night={night} />
        <Pill x={sx + (sx > W / 2 ? -24 : 24)} y={sy - 24} txt="SUMMIT · SAME HILL · CAMP 2 STARTS HERE" anchor={sx > W / 2 ? "end" : "start"} night={night} />
      </Svg>

      {camps.filter(([d]) => done > d).map(([d]) => { const [x, y] = pts[d]; return guy("sitrock", x > W / 2 ? x + 20 : x - 80, y - 62, 60); })}

      {/* the stones */}
      {pts.map(([x, y], i) => {
        const s = state(i);
        const size = NODE[s];
        const lesson = firstLesson + i;
        const w = words[i];
        const labelText = s === "done" ? (w && w.length <= 3 ? w : String(i + 1)) : s === "locked" ? "" : s === "tomorrow" ? "" : "";
        const onPress = () => {
          if (s === "now") onStart();
          else if (s === "done") onReplay(lesson);
          else showTip(i, s === "tomorrow" ? "opens tomorrow · see you at sundown" : `unlocks after day ${lesson - 1}`);
        };
        const a11y = s === "now" ? `Start today: ${label}` : s === "done" ? `Day ${lesson}, done. Sit it again` : s === "tomorrow" ? `Day ${lesson} opens tomorrow` : `Day ${lesson}, locked`;
        const isPop = s === "done" && i === done - 1;
        return (
          <View key={`n${i}`} style={{ position: "absolute", left: px(x), top: py(y), width: 0, height: 0, alignItems: "center", justifyContent: "center", zIndex: s === "now" ? 5 : 3 }}>
            {s === "now" ? <Animated.View pointerEvents="none" style={[{ position: "absolute", width: size + 26, height: (size + 26) * 0.78, borderRadius: 999, borderWidth: 3, borderColor: color.gold }, ring]} /> : null}
            <Animated.View style={isPop ? popStyle : null}>
              <Pressable testID={s === "now" ? "lit-stone" : `stone-${lesson}`} accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress} hitSlop={8}
                style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
                {({ pressed }) => (
                  // the stone is drawn inside a 44pt tap area (web ignores hitSlop)
                  <View style={{
                    width: size, height: size * 0.8, borderRadius: 999, alignItems: "center", justifyContent: "center",
                    backgroundColor: s === "done" || s === "now" ? color.gold : "#F7F3E4",
                    borderWidth: s === "now" ? 3 : 2.5, borderColor: color.ink, opacity: s === "locked" ? 0.8 : 1,
                    transform: [{ translateY: pressed ? 2 : 0 }, { scale: pressed ? 0.94 : 1 }],
                    shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 0, shadowOffset: { width: 0, height: pressed ? 1 : 4 },
                  }}>
                    {s === "locked" || s === "tomorrow" ? <LockGlyph /> : labelText ? <Text style={{ fontFamily: font.text[700], fontSize: labelText.length <= 2 ? 13 : 11, color: color.ink }}>{labelText}</Text> : null}
                  </View>
                )}
              </Pressable>
            </Animated.View>
            {s === "now" ? (
              <Animated.View pointerEvents="box-none" style={[{ position: "absolute", bottom: size * 0.55 + 10, alignItems: "center" }, bobStyle]}>
                <Pressable onPress={onStart} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ backgroundColor: "#fff", borderRadius: 14, borderWidth: 2, borderColor: color.ink, paddingVertical: 7, paddingHorizontal: 12, alignItems: "center" }}>
                  <Text style={{ fontFamily: font.text[700], fontSize: 11, letterSpacing: 1.2, color: color.ink }}>{done === 0 ? "START" : `START · DAY ${firstLesson + i}`}</Text>
                </Pressable>
                <View style={{ width: 12, height: 12, backgroundColor: "#fff", borderRightWidth: 2, borderBottomWidth: 2, borderColor: color.ink, transform: [{ rotate: "45deg" }], marginTop: -7 }} />
              </Animated.View>
            ) : null}
          </View>
        );
      })}

      {done >= total ? guy("jump", sx - 40, sy - 100, 80) : guy(doneToday ? "sleep" : "hike", nx > W / 2 ? nx - 88 : nx + 30, ny - 78, doneToday ? 60 : 76, !doneToday)}

      {/* tooltips sit above every stone and pose */}
      {tip ? (
        <View pointerEvents="none" style={{ position: "absolute", left: px(pts[tip.i][0]), top: py(pts[tip.i][1]), width: 0, height: 0, alignItems: "center", zIndex: 30 }}>
          <View accessibilityLiveRegion="polite" style={{ position: "absolute", bottom: 26, width: 210, alignItems: "center" }}>
            <View style={{ backgroundColor: color.ink, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 }}>
              <Text style={{ fontFamily: font.text[600], fontSize: 12, color: color.gold, textAlign: "center" }}>{tip.text}</Text>
            </View>
            <View style={{ width: 10, height: 10, backgroundColor: color.ink, transform: [{ rotate: "45deg" }], marginTop: -6 }} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** A small padlock drawn with Views (no icon font needed). */
function LockGlyph() {
  return (
    <View style={{ alignItems: "center" }} accessible={false}>
      <View style={{ width: 9, height: 7, borderWidth: 2, borderBottomWidth: 0, borderColor: "#8C8779", borderTopLeftRadius: 5, borderTopRightRadius: 5, marginBottom: -1 }} />
      <View style={{ width: 13, height: 9, backgroundColor: "#8C8779", borderRadius: 2 }} />
    </View>
  );
}
