// The hill: v175's painted hill (v172 "the painted hill") as a game board of stepping stones.
// Only a readable window of the trail is shown — this week and the next (10–15 stones) — never a whole camp,
// so day 34 or day 400 reads as cleanly as day 4. Walked stones are warm gold with a small sun; today's stone
// glows like a sunrise with the walker beside it; stones ahead are muted and locked. Every 7th stone (a week's
// end) carries a paper lantern that lights once that week is walked. A wooden trail sign says where you are.
// Everything sits on v175's traced trail in % of the painting, so it lines up at any screen width.
import { data, faceFor, pos, trailX } from "@ih/content";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, G, Line, Path, RadialGradient, Rect, Stop, Text as SvgText } from "react-native-svg";
import { art } from "@ih/brand";
import { lookoutArt, SUMMIT_ART } from "@/content/journeys";
import { FADE } from "@/ui/fade";
import { color, font } from "@/ui";

const W = 390;
const WEEK = 7;
const SLOTS = 14; // stone places on the painted trail; a window never holds more than 15 stones
const pillW = (txt: string) => txt.length * 6.4 + 22;
const celebrated = new Set<string>(); // "door:lesson" popped once per app session
const HILL_LOOP: Record<string, any> = { hike: require("../../assets/mascot/walk.webp"), jump: require("../../assets/mascot/celebrate.webp") };

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

/** Which stones (0-based lessons within this camp or year) are on the board: this week and the next. */
export function trailWindow(done: number, total: number) {
  const cur = Math.max(0, Math.min(done, total - 1));
  let first = Math.floor(cur / WEEK) * WEEK;
  const last = Math.min(total - 1, first + 2 * WEEK - 1);
  // near a camp's end there is no "next week": show the week behind instead, so the board never looks empty
  while (last - first + 1 < 10 && first > 0) first = Math.max(0, first - WEEK);
  return { first, last, cur };
}

export function HillScene({ hour, done, total, doneToday, onStart, onReplay, firstLesson, wing, label, onNow }: {
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
  const yBot = H - 110;
  const yTop = face.top + 70;
  const step = (yBot - yTop) / SLOTS;
  // the board centres on today: the stone to walk, or once walked, the stone just finished (its lantern may have just lit)
  const { first, last, cur } = trailWindow(doneToday && done > 0 ? done - 1 : done, total);
  const idx = Array.from({ length: last - first + 1 }, (_, j) => first + j);
  // stepping stones sit a little left and right of the trail's line, like stones you hop between
  const at = (i: number): [number, number] => {
    const y = yBot - (i - first) * step;
    return [trailX(face, y) + (i % 2 ? 11 : -11), y];
  };
  const [nx, ny] = at(cur);
  const canStart = !doneToday && done < total;
  const allDone = done >= total;
  useEffect(() => { onNow?.(ny * k); }, [ny, k]); // eslint-disable-line react-hooks/exhaustive-deps
  const px = (x: number) => `${(x / W) * 100}%` as const;
  const py = (y: number) => `${(y / H) * 100}%` as const;

  const here = pos(firstLesson);
  const weekNo = Math.floor(cur / WEEK) + 1;
  const weeks = Math.ceil(total / WEEK);
  const nextPart = pos(firstLesson + total);
  const ty = at(last)[1];
  // the end of this camp (or year) is on the board: its painted lookout rises at the top of the hill, fading down
  // into it (the fade is baked into the "-top" image). Year five's end looks out from the summit instead.
  const atLookout = last === total - 1;
  const toSummit = /^Year ([6-9]|\d\d)/.test(nextPart.camp);
  const view = atLookout ? art(`${toSummit ? SUMMIT_ART : lookoutArt(here.camp)}-top`) : null;
  const viewH = view ? (W * view.h) / view.w : 0;
  const viewBottom = Math.min(viewH, ty + 40); // the painting's soft edge reaches just past the lookout stone

  const state = (i: number): NodeState => (i < done ? "done" : i === done && canStart ? "now" : i === done && doneToday ? "tomorrow" : "locked");
  const isLantern = (i: number) => (i + 1) % WEEK === 0;

  // motion: today's halo breathes like a sunrise, the walker bobs, a just-lit stone pops once
  const reduce = useReducedMotion();
  const pulse = useSharedValue(0);
  const bob = useSharedValue(0);
  const pop = useSharedValue(1);
  const popKey = `${wing}:${firstLesson + done - 1}`;
  // decided once per mount, so a re-render can't cancel the pop half-way
  const [justLit] = useState(() => doneToday && done > 0 && !celebrated.has(popKey));
  useEffect(() => {
    if (reduce) return;
    if (canStart) pulse.value = withRepeat(withSequence(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })), -1);
    bob.value = withRepeat(withSequence(withTiming(-4, { duration: 900, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) })), -1);
  }, [reduce, canStart, pulse, bob]);
  useEffect(() => {
    if (!justLit) return;
    celebrated.add(popKey);
    if (reduce) return;
    pop.value = 0.3;
    const t = setTimeout(() => { pop.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.back(2.2)) }); }, 350);
    return () => { clearTimeout(t); pop.value = 1; };
  }, [justLit, popKey, reduce, pop]);
  const halo = useAnimatedStyle(() => ({ transform: [{ scale: 0.92 + pulse.value * 0.22 }], opacity: 0.95 - pulse.value * 0.35 }));
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
    // the hand-made loops: walking up to today's stone, celebrating at the summit (resting/sleeping stay still)
    const loop = reduce ? null : HILL_LOOP[pose];
    if (loop) {
      const shift = (h * (1 - a.w / a.h)) / 2; // the loop is square; keep him centred where the still pose stood (hill units)
      return (
        <View key={pose + x} pointerEvents="none" style={{ position: "absolute", left: px(x - shift), top: py(y), height: py(h), width: px(h), zIndex: 6 }}>
          <Image source={loop} style={{ width: "100%", height: "100%" }} contentFit="contain" autoplay accessible={false} />
        </View>
      );
    }
    const img = <Image source={a.src} style={{ height: "100%", aspectRatio: a.w / a.h }} contentFit="contain" transition={FADE} accessible={false} />;
    return (
      <Animated.View key={pose + x} pointerEvents="none" style={[{ position: "absolute", left: px(x), top: py(y), height: py(h), zIndex: 6 }, animated ? bobStyle : null]}>{img}</Animated.View>
    );
  };

  // the walker stands beside today's stone, on whichever side has room; the trail sign goes on the other side
  const walkerRight = nx + 42 + 60 < W;
  const pose = allDone ? "jump" : doneToday ? (night ? "sleep" : "sitrock") : "hike";
  const walkerH = doneToday ? 62 : 76;
  const walkerX = walkerRight ? nx + (doneToday ? 46 : 40) : nx - (doneToday ? 46 : 40) - 58;
  const signRight = !walkerRight;
  const signY = Math.max(ty - 28, ny - step * 2 - 20); // never up under the summit note
  const campName = here.name.toLowerCase();
  const campTag = `${here.camp} · week ${weekNo} of ${weeks}`.toUpperCase();

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ width: "100%", aspectRatio: W / H }}>
      {bg ? <Image source={bg.src} style={{ position: "absolute", width: "100%", height: "100%" }} contentFit="cover" transition={FADE} cachePolicy="memory-disk" accessible={false} /> : null}
      {view ? (
        <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, height: py(viewBottom), overflow: "hidden" }}>
          <Image source={view.src} style={{ position: "absolute", left: 0, right: 0, bottom: 0, width: "100%", aspectRatio: view.w / view.h }} contentFit="cover" transition={FADE} cachePolicy="memory-disk" accessible={false} />
        </View>
      ) : null}
      <LinearGradient pointerEvents="none" colors={["rgba(247,247,245,0)", "#F7F7F5"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 56 }} />

      {/* light, stars, footprints and the two trail-end notes */}
      <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ position: "absolute" }} pointerEvents="none">
        {night ? <Rect width={W} height={H} fill="#0A0A1A" opacity={0.58} /> : golden ? <Rect width={W} height={H} fill="#FFB347" opacity={0.14} /> : null}
        {night ? Array.from({ length: 30 }, (_, i) => <Circle key={i} cx={(i * 137) % 390} cy={(i * 53) % 120} r={i % 3 ? 1 : 1.8} fill="#fff" opacity={0.9} />) : null}
        {/* gold footprints between the stones you've walked */}
        {idx.filter((i) => i < Math.min(done, last)).map((i) => { const [x0, y0] = at(i); const [x1, y1] = at(i + 1); const x = (x0 + x1) / 2; const y = (y0 + y1) / 2; return (
          <G key={`f${i}`}>
            <Ellipse cx={x - 4} cy={y + 3} rx={2.6} ry={4.4} fill="#EEFF6A" opacity={0.9} transform={`rotate(-18 ${x - 4} ${y + 3})`} />
            <Ellipse cx={x + 5} cy={y - 5} rx={2.6} ry={4.4} fill="#EEFF6A" opacity={0.9} transform={`rotate(-18 ${x + 5} ${y - 5})`} />
          </G>
        ); })}
        <Pill x={14} y={H - 58} txt={first === 0 ? "▲ THE TRAILHEAD · YOUR FOOTPRINTS STAY" : `▲ DAYS ${firstLesson}–${firstLesson + first - 1} WALKED · FOOTPRINTS STAY`} anchor="start" night={night} />
        <Pill x={W / 2} y={last === total - 1 ? ty - 120 : ty - 46} night={night} anchor="middle"
          txt={last === total - 1 ? (/^Year ([6-9]|\d\d)/.test(nextPart.camp) ? "THE SUMMIT · FIVE YEARS OF TRAIL" : `LOOKOUT · ${nextPart.camp} · ${nextPart.name} AHEAD`.toUpperCase()) : `THE TRAIL GOES ON · WEEK ${Math.floor(last / WEEK) + 2} AHEAD`} />
      </Svg>

      {/* the wooden trail sign: where you are on the hill */}
      <View pointerEvents="none" accessible accessibilityLabel={`${here.camp}, ${campName}, week ${weekNo} of ${weeks}`}
        style={{ position: "absolute", top: py(signY), ...(signRight ? { right: px(10) } : { left: px(10) }), alignItems: "center", zIndex: 4 }}>
        <View style={{ backgroundColor: "#A86F3A", borderWidth: 2, borderColor: color.ink, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 9, maxWidth: 138, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 0, shadowOffset: { width: 0, height: 3 } }}>
          <View style={{ position: "absolute", left: 3, right: 3, top: 3, height: 1.5, backgroundColor: "#C98F55", borderRadius: 1 }} />
          <Text numberOfLines={1} style={{ fontFamily: font.display[800], fontSize: 13, color: "#FFF6E0" }}>{campName}</Text>
          <Text numberOfLines={1} style={{ fontFamily: font.text[700], fontSize: 7.5, letterSpacing: 1.1, color: color.gold, marginTop: 1 }}>{campTag}</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 40, marginTop: -1 }}>
          <View style={{ width: 5, height: 16, backgroundColor: "#7A4E27", borderWidth: 1.5, borderTopWidth: 0, borderColor: color.ink }} />
          <View style={{ width: 5, height: 16, backgroundColor: "#7A4E27", borderWidth: 1.5, borderTopWidth: 0, borderColor: color.ink }} />
        </View>
      </View>

      {/* today's sunrise glow, under the stones */}
      {!allDone && state(cur) === "now" ? (
        <View pointerEvents="none" style={{ position: "absolute", left: px(nx), top: py(ny), width: 0, height: 0, alignItems: "center", justifyContent: "center", zIndex: 2 }}>
          <Animated.View style={[{ position: "absolute", width: 210, height: 150 }, halo]}>
            <Svg width={210} height={150} viewBox="0 0 210 150">
              <Defs>
                <RadialGradient id="ih-sunrise" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#FFFFFF" stopOpacity={1} />
                  <Stop offset="0.3" stopColor="#FBFFC4" stopOpacity={0.95} />
                  <Stop offset="0.62" stopColor={color.gold} stopOpacity={0.55} />
                  <Stop offset="1" stopColor={color.gold} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Ellipse cx={105} cy={75} rx={105} ry={75} fill="url(#ih-sunrise)" />
              <Ellipse cx={105} cy={80} rx={48} ry={31} fill="none" stroke={color.gold} strokeWidth={3} />
            </Svg>
          </Animated.View>
        </View>
      ) : null}

      {/* the stones */}
      {idx.map((i) => {
        const [x, y] = at(i);
        const s = state(i);
        const lesson = firstLesson + i;
        const lantern = isLantern(i);
        const onPress = () => {
          if (s === "now") onStart();
          else if (s === "done") onReplay(lesson);
          else showTip(i, s === "tomorrow" ? "opens tomorrow · see you at sundown" : `unlocks after day ${lesson - 1}`);
        };
        const weekEnd = lantern ? `, the end of week ${Math.floor(i / WEEK) + 1}${s === "done" ? ", lantern lit" : ""}` : "";
        const a11y = (s === "now" ? `Start today: ${label}` : s === "done" ? `Day ${lesson}, done. Sit it again` : s === "tomorrow" ? `Day ${lesson} opens tomorrow` : `Day ${lesson}, locked`) + weekEnd;
        const isPop = s === "done" && i === done - 1;
        return (
          <View key={`n${i}`} style={{ position: "absolute", left: px(x), top: py(y), width: 0, height: 0, alignItems: "center", justifyContent: "center", zIndex: s === "now" ? 5 : 3 }}>
            <Animated.View style={isPop ? popStyle : null}>
              <Pressable testID={s === "now" ? "lit-stone" : `stone-${lesson}`} accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress} hitSlop={8}
                style={{ minWidth: 48, minHeight: 44, alignItems: "center", justifyContent: "center" }}>
                {({ pressed }) => (
                  <View style={{ alignItems: "center", transform: [{ translateY: pressed ? 2 : 0 }, { scale: pressed ? 0.94 : 1 }] }}>
                    <Stone state={s} seed={lesson} />
                    {lantern ? (
                      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", bottom: LOOK[s].h + 2, alignItems: "center", justifyContent: "center" }}>
                        {s === "done" ? (
                          <Svg width={96} height={96} viewBox="0 0 96 96" style={{ position: "absolute" }}>
                            <Defs>
                              <RadialGradient id={`ih-lamp-${i}`} cx="50%" cy="50%" r="50%">
                                <Stop offset="0" stopColor="#FFF3B0" stopOpacity={0.95} />
                                <Stop offset="0.4" stopColor="#FFD23F" stopOpacity={0.75} />
                                <Stop offset="1" stopColor="#FFD23F" stopOpacity={0} />
                              </RadialGradient>
                            </Defs>
                            <Circle cx={48} cy={48} r={48} fill={`url(#ih-lamp-${i})`} />
                          </Svg>
                        ) : null}
                        <TrailLantern lit={s === "done"} />
                      </View>
                    ) : null}
                  </View>
                )}
              </Pressable>
            </Animated.View>
            {s === "now" || (doneToday && i === done - 1) ? (
              // a trail flag beside today's stone, on the side away from the walker, pointing at it
              <Animated.View pointerEvents="box-none" style={[{ position: "absolute", top: -21, flexDirection: walkerRight ? "row" : "row-reverse", alignItems: "center", ...(walkerRight ? { right: s === "now" ? 38 : 32 } : { left: s === "now" ? 38 : 32 }) }, s === "now" ? bobStyle : null]}>
                <Pressable onPress={s === "now" ? onStart : () => onReplay(lesson)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
                  style={{ backgroundColor: color.ink, borderRadius: 8, borderWidth: 2, borderColor: color.gold, paddingVertical: 5, paddingHorizontal: 10, alignItems: "center" }}>
                  <Text numberOfLines={1} style={{ fontFamily: font.text[700], fontSize: 8, letterSpacing: 1.2, color: "#ffffffb3" }}>{s === "now" ? `DAY ${lesson}` : "TODAY"}</Text>
                  <Text numberOfLines={1} style={{ fontFamily: font.display[800], fontSize: 13, color: color.gold }}>{s === "now" ? "start" : "walked"}</Text>
                </Pressable>
                <Svg width={10} height={16} viewBox="0 0 10 16" style={{ marginLeft: walkerRight ? -1 : 0, marginRight: walkerRight ? 0 : -1 }}><Path d={walkerRight ? "M0 1 L9 8 L0 15 Z" : "M10 1 L1 8 L10 15 Z"} fill={color.gold} stroke={color.ink} strokeWidth={1.5} strokeLinejoin="round" /></Svg>
              </Animated.View>
            ) : null}
          </View>
        );
      })}

      {guy(pose, allDone ? nx - 40 : walkerX, ny - walkerH + (doneToday ? 14 : 16), allDone ? 80 : walkerH, !doneToday && !allDone)}

      {/* tooltips sit above every stone and pose */}
      {tip ? (
        <View pointerEvents="none" style={{ position: "absolute", left: px(at(tip.i)[0]), top: py(at(tip.i)[1]), width: 0, height: 0, alignItems: "center", zIndex: 30 }}>
          <View accessibilityLiveRegion="polite" style={{ position: "absolute", bottom: isLantern(tip.i) ? 48 : 24, width: 210, alignItems: "center" }}>
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

/** A flat, slightly lumpy stepping stone seen from above-front: a top face on a darker side, outlined in ink. */
function pebble(cx: number, cy: number, rx: number, ry: number, seed: number) {
  const n = 9;
  const p = Array.from({ length: n }, (_, j) => {
    const a = (j / n) * Math.PI * 2;
    const r = 1 + 0.07 * Math.sin(seed * 12.9898 + j * 2.3) + 0.04 * Math.cos(seed * 4.1 + j * 5.1);
    return [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r];
  });
  const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(p[n - 1], p[0]);
  let d = `M${m0[0].toFixed(1)} ${m0[1].toFixed(1)}`;
  for (let j = 0; j < n; j++) {
    const m = mid(p[j], p[(j + 1) % n]);
    d += ` Q${p[j][0].toFixed(1)} ${p[j][1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  return d + " Z";
}

const LOOK = {
  done: { w: 50, h: 30, top: "#EEFF6A", side: "#A9B83A", opacity: 1 },
  now: { w: 64, h: 38, top: "#EEFF6A", side: "#A9B83A", opacity: 1 },
  tomorrow: { w: 46, h: 28, top: "#E9E3CF", side: "#A69E86", opacity: 0.92 },
  locked: { w: 44, h: 27, top: "#E4DECB", side: "#A39B83", opacity: 0.82 },
} as const;

function Stone({ state, seed }: { state: NodeState; seed: number }) {
  const L = LOOK[state];
  const t = 6; // the stone's thickness
  const W2 = L.w + 6, H2 = L.h + t + 6;
  const cx = W2 / 2, cy = 3 + L.h / 2;
  const top = pebble(cx, cy, L.w / 2, L.h / 2, seed);
  const side = pebble(cx, cy + t, L.w / 2, L.h / 2, seed);
  const ink = "#0A0A0A";
  return (
    <Svg width={W2} height={H2} viewBox={`0 0 ${W2} ${H2}`} style={{ opacity: L.opacity }}>
      <Path d={side} fill={L.side} stroke={ink} strokeWidth={2.5} />
      <Path d={top} fill={L.top} stroke={ink} strokeWidth={2.5} />
      <Ellipse cx={cx - L.w * 0.18} cy={cy - L.h * 0.2} rx={L.w * 0.16} ry={L.h * 0.1} fill="#FFFFFF" opacity={state === "locked" || state === "tomorrow" ? 0.35 : 0.55} />
      {state === "done" ? <SunMark cx={cx} cy={cy + 1} r={3.4} /> : null}
      {state === "now" ? <Sunrise cx={cx} cy={cy + 1} /> : null}
      {state === "locked" || state === "tomorrow" ? <Lock cx={cx} cy={cy + 1} /> : null}
    </Svg>
  );
}

function SunMark({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill="#0A0A0A" />
      {Array.from({ length: 8 }, (_, j) => {
        const a = (j / 8) * Math.PI * 2;
        return <Line key={j} x1={cx + Math.cos(a) * (r + 2)} y1={cy + Math.sin(a) * (r + 2) * 0.8} x2={cx + Math.cos(a) * (r + 4.5)} y2={cy + Math.sin(a) * (r + 4.5) * 0.8} stroke="#0A0A0A" strokeWidth={1.6} strokeLinecap="round" />;
      })}
    </G>
  );
}

/** Today's mark: a sun coming up over a line of hill. */
function Sunrise({ cx, cy }: { cx: number; cy: number }) {
  const r = 6.5, base = cy + 3;
  return (
    <G>
      <Path d={`M${cx - r} ${base} A${r} ${r} 0 0 1 ${cx + r} ${base} Z`} fill="#0A0A0A" />
      {[-60, -30, 0, 30, 60].map((deg) => {
        const a = ((deg - 90) * Math.PI) / 180;
        return <Line key={deg} x1={cx + Math.cos(a) * (r + 2.5)} y1={base + Math.sin(a) * (r + 2.5)} x2={cx + Math.cos(a) * (r + 5.5)} y2={base + Math.sin(a) * (r + 5.5)} stroke="#0A0A0A" strokeWidth={1.8} strokeLinecap="round" />;
      })}
      <Line x1={cx - 13} y1={base + 0.5} x2={cx + 13} y2={base + 0.5} stroke="#0A0A0A" strokeWidth={2} strokeLinecap="round" />
    </G>
  );
}

function Lock({ cx, cy }: { cx: number; cy: number }) {
  const c = "#857E6C";
  return (
    <G>
      <Path d={`M${cx - 3.5} ${cy - 1} V${cy - 4} A3.5 3.5 0 0 1 ${cx + 3.5} ${cy - 4} V${cy - 1}`} stroke={c} strokeWidth={1.8} fill="none" />
      <Rect x={cx - 5.5} y={cy - 1.5} width={11} height={7.5} rx={1.6} fill={c} />
    </G>
  );
}

/** The week's-end lantern: a small paper lantern (the same family as the reward lantern), lit gold once the week is walked. */
function TrailLantern({ lit }: { lit: boolean }) {
  const ink = "#0A0A0A";
  return (
    <Svg width={24} height={34} viewBox="0 0 24 34">
      <Path d="M12 1 V5" stroke={ink} strokeWidth={1.6} strokeLinecap="round" />
      <Rect x={7} y={5} width={10} height={3.5} rx={1.2} fill={ink} />
      <Ellipse cx={12} cy={17.5} rx={10} ry={10} fill={lit ? "#FFC53D" : "#5E5746"} stroke={ink} strokeWidth={1.6} />
      {lit ? <Ellipse cx={12} cy={18} rx={5} ry={6.5} fill="#FFF3B0" /> : null}
      {[6.5, 12, 17.5].map((x) => <Path key={x} d={`M${x} 8.5 Q${x + (x - 12) * 0.45} 17.5 ${x} 26.5`} stroke={lit ? "#E08E0B" : "#2F2B22"} strokeWidth={1.1} fill="none" />)}
      <Rect x={7} y={26.5} width={10} height={3.5} rx={1.2} fill={ink} />
      <Path d="M10 30 L12 33.5 L14 30 Z" fill={lit ? "#E5484D" : "#6B5A45"} />
    </Svg>
  );
}
