// The app shell: every screen is built from the same parts (app review 2026-09-26, "it doesn't feel like one app").
//   top bar    back (chevron + where you came from) · close × · a progress line · a compact title · one action
//   title      the one large title; it shrinks into the bar as you scroll
//   body       scrolls; the keyboard goes away when you drag
//   bottom bar the main button, pinned, with a fade above it and room for the home bar
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState, type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets, type Edge } from "react-native-safe-area-context";
import { border, color, font, space, type } from "@ih/brand";
import { tapHaptic } from "@/lib/haptics";
import { useChrome } from "@/ui/chrome";
import { Slide } from "@/ui/enter";
import { ChevronLeft, CloseIcon } from "@/ui/tab-icons";
import { t, type Key } from "@/i18n";

export type BackTo = boolean | string | { label: string; to?: string; /** step back inside the screen first (e.g. the previous question); return true if handled */ onPress?: () => boolean };

const PARENT: Record<string, string> = { you: "/you", today: "/today", together: "/together", guide: "/guide", legal: "/you/legal" };
const NAV: Record<string, Key> = { you: "home.tab.you", today: "home.tab.today", together: "home.tab.together", guide: "home.tab.guide", back: "home.back" };
/** A back label in the current language: the tabs' names and "back" are translated here; other labels come in translated. */
export const navName = (label: string) => (NAV[label] ? t(NAV[label]) : label);

function goBack(fallback: string) {
  if (router.canGoBack()) router.back();
  // Arrived from the website (a full page load, so the app has no history of its own): go back to it.
  else if (Platform.OS === "web" && typeof document !== "undefined" && document.referrer.startsWith(location.origin) && history.length > 1) history.back();
  else router.replace(fallback as any);
}

export function BackButton({ to, dark }: { to: BackTo; dark?: boolean }) {
  const label = typeof to === "string" ? to : typeof to === "object" ? to.label : "back";
  const href = (typeof to === "object" && to.to) || PARENT[label] || "/today";
  const ink = dark ? "#fff" : color.ink;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={t("home.backTo", { name: navName(label) })} hitSlop={8} onPress={() => { tapHaptic(); if (typeof to === "object" && to.onPress?.()) return; goBack(href); }}
      style={({ pressed }) => [st.back, { opacity: pressed ? 0.45 : 1 }]}>
      <ChevronLeft color={ink} />
      <Text style={[st.backText, { color: ink }]} numberOfLines={1}>{navName(label)}</Text>
    </Pressable>
  );
}

export function CloseButton({ onPress, dark, label = t("home.close") }: { onPress?: () => void; dark?: boolean; label?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} hitSlop={8} onPress={() => { tapHaptic(); (onPress ?? (() => goBack("/today")))(); }}
      style={({ pressed }) => [st.closeHit, { opacity: pressed ? 0.5 : 1 }]}>
      <View style={[st.closeDot, { backgroundColor: dark ? "#ffffff1f" : color.sand }]}><CloseIcon color={dark ? "#fff" : color.ink} /></View>
    </Pressable>
  );
}

/** The top bar on its own (lessons and onboarding draw their own middle, e.g. a progress line). */
export function NavBar({ back, close, closeLeft, right, title, showTitle = true, progress, dark, hairline, middle }: {
  back?: BackTo; close?: boolean | (() => void); /** a task in progress (lesson, review): × sits left of its progress line */ closeLeft?: boolean; right?: ReactNode; title?: string; showTitle?: boolean; progress?: number; dark?: boolean; hairline?: boolean; middle?: ReactNode;
}) {
  const tv = useSharedValue(showTitle ? 1 : 0);
  useEffect(() => { tv.value = withTiming(showTitle ? 1 : 0, { duration: 180 }); }, [showTitle, tv]);
  const titleAnim = useAnimatedStyle(() => ({ opacity: tv.value }));
  const onClose = typeof close === "function" ? close : undefined;
  return (
    <View style={[st.bar, hairline && { borderBottomColor: dark ? "#ffffff1a" : color.line }]}>
      <View style={[st.side, closeLeft && st.sideSmall]}>{back ? <BackButton to={back} dark={dark} /> : close && closeLeft ? <CloseButton dark={dark} onPress={onClose} label={t("home.leave")} /> : null}</View>
      <View style={st.middle} pointerEvents="box-none">
        {middle ?? (progress != null ? (
          <View style={[st.track, dark && { backgroundColor: "#ffffff22" }]} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
            <View style={[st.fillBar, { width: `${Math.max(4, Math.min(100, progress * 100))}%` }]} />
          </View>
        ) : title ? (
          <Animated.Text style={[type.nav(), { color: dark ? "#fff" : color.ink, textAlign: "center" }, titleAnim]} numberOfLines={1} accessibilityElementsHidden={!showTitle}>{title.replace(/\.$/, "")}</Animated.Text>
        ) : null)}
      </View>
      <View style={[st.side, closeLeft && st.sideSmall, { alignItems: "flex-end" }]}>{right ?? (close && !closeLeft ? <CloseButton dark={dark} onPress={onClose} /> : null)}</View>
    </View>
  );
}

/** The pinned bottom bar: the screen's main action always sits here, above the home bar. */
export function BottomBar({ children, dark, inset = true }: { children: ReactNode; dark?: boolean; /** false inside screens that already pad the home bar */ inset?: boolean }) {
  const insets = useSafeAreaInsets();
  const bg = dark ? color.ink : color.cream;
  return (
    <View style={[st.bottom, { backgroundColor: dark ? "transparent" : bg, paddingBottom: inset ? Math.max(insets.bottom, 12) : 12 }]}>
      {dark ? null : <LinearGradient pointerEvents="none" colors={[`${bg}00`, bg]} style={st.fade} />}
      {children}
    </View>
  );
}

type ScreenProps = {
  children: ReactNode;
  /** The page's name: shown large at the top, and in the bar once you scroll past it. */
  title?: string;
  /** false: only the compact bar title (short screens, sheets). */
  largeTitle?: boolean;
  back?: BackTo;
  close?: boolean | (() => void);
  closeLeft?: boolean;
  right?: ReactNode;
  progress?: number;
  /** Pinned main action(s). */
  footer?: ReactNode;
  /** Slides up (web) with a close ×, for jobs you finish or dismiss: sign-in, gift, plans. */
  sheet?: boolean;
  dark?: boolean;
  scroll?: boolean;
  /** Short flows: center the content in the space between the bars. */
  center?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, title, largeTitle = true, back, close, closeLeft, right, progress, footer, sheet, dark, scroll, center, edges = ["top"], style, contentStyle }: ScreenProps) {
  useChrome(!!dark);
  const [scrolled, setScrolled] = useState(0); // 0 top · 1 moved · 2 past the large title
  const bg = { backgroundColor: dark ? color.ink : color.cream };
  const hasBar = !!(back || close || right || progress != null || (title && !largeTitle) || sheet || (title && scroll));
  const big = title && largeTitle;
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const next = y > 38 ? 2 : y > 2 ? 1 : 0;
    if (next !== scrolled) setScrolled(next);
  };
  const safeEdges: Edge[] = footer ? edges.filter((x) => x !== "bottom") : edges;
  const bigTitle = big ? <Text accessibilityRole="header" style={[type.title(), dark && { color: "#fff" }, st.bigTitle]}>{title}</Text> : null;
  return (
    <SafeAreaView edges={safeEdges} style={[st.fill, bg, style]}>
      <Slide style={st.fill} from={sheet ? "up" : "right"}>
        {hasBar ? (
          <NavBar back={back} close={close ?? (sheet ? true : undefined)} closeLeft={closeLeft} right={right} progress={progress} dark={dark}
            title={title} showTitle={!big || scrolled === 2} hairline={scroll && scrolled > 0} />
        ) : null}
        {scroll ? (
          <ScrollView onScroll={onScroll} scrollEventThrottle={32} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled"
            contentContainerStyle={[st.scroll, !hasBar && st.noBar, center && st.center, { paddingBottom: footer ? 28 : 40 }, contentStyle]}>
            {bigTitle}
            {children}
          </ScrollView>
        ) : (
          <View style={[st.fill, st.pad, !hasBar && st.noBar, center && st.center, contentStyle]}>{bigTitle}{children}</View>
        )}
        {footer ? <BottomBar dark={dark}>{footer}</BottomBar> : null}
      </Slide>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  fill: { flex: 1 },
  bar: { minHeight: 52, flexDirection: "row", alignItems: "center", paddingHorizontal: space.sm, borderBottomWidth: border.hair, borderBottomColor: "transparent" },
  side: { minWidth: 88, flexShrink: 0, justifyContent: "center" },
  sideSmall: { minWidth: 48 },
  middle: { flex: 1, alignItems: "stretch", justifyContent: "center", paddingHorizontal: 6 },
  back: { flexDirection: "row", alignItems: "center", minHeight: 44, paddingRight: 10, paddingLeft: 2, alignSelf: "flex-start" },
  backText: { fontFamily: font.text[600], fontSize: 16, marginLeft: 2, maxWidth: 120 },
  closeHit: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center", marginRight: 2 },
  closeDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  track: { height: 6, borderRadius: 3, backgroundColor: color.line, overflow: "hidden" },
  fillBar: { height: 6, borderRadius: 3, backgroundColor: color.gold },
  scroll: { paddingHorizontal: space.gutter, flexGrow: 1 },
  pad: { paddingHorizontal: space.gutter, paddingBottom: space.xl },
  noBar: { paddingTop: space.md },
  center: { justifyContent: "center" },
  bigTitle: { marginTop: 2, marginBottom: space.md },
  bottom: { paddingHorizontal: space.gutter, paddingTop: 10, gap: 10 },
  fade: { position: "absolute", left: 0, right: 0, top: -28, height: 28 },
});
