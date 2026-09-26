// App-wide feedback: toast("saved") for quiet confirmations, confirmSheet({...}) for a yes/no that slides up.
// One place for both, so every screen confirms the same way (app review 2026-09-26).
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { border, color, font, radius, space, type } from "@ih/brand";
import { successHaptic, tapHaptic } from "@/lib/haptics";

type Toast = { id: number; text: string };
type Confirm = { title: string; body?: string; confirm: string; cancel?: string; destructive?: boolean; resolve: (ok: boolean) => void };

let showToast: ((t: Toast) => void) | null = null;
let showConfirm: ((c: Confirm | null) => void) | null = null;
let seq = 0;

/** A short confirmation at the bottom of the screen ("saved", "exported"). */
export function toast(text: string) {
  successHaptic();
  showToast?.({ id: ++seq, text });
}

/** Asks before something that can't be undone. Resolves true when they confirm. */
export function confirmSheet(opts: Omit<Confirm, "resolve">): Promise<boolean> {
  return new Promise((resolve) => {
    if (!showConfirm) return resolve(false);
    showConfirm({ ...opts, resolve });
  });
}

const EASE = Easing.out(Easing.cubic);

function ToastView({ t, bottom }: { t: Toast; bottom: number }) {
  const reduce = useReducedMotion();
  const o = useSharedValue(0);
  const y = useSharedValue(reduce ? 0 : 16);
  useEffect(() => {
    o.value = withTiming(1, { duration: 200, easing: EASE });
    y.value = withTiming(0, { duration: 240, easing: EASE });
  }, [o, y]);
  const anim = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[st.toastWrap, { bottom }, anim]}>
      <View style={st.toast} accessibilityLiveRegion="polite" role="status"><Text style={st.toastText}>{t.text}</Text></View>
    </Animated.View>
  );
}

function ConfirmView({ c, close }: { c: Confirm; close: (ok: boolean) => void }) {
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const o = useSharedValue(0);
  const y = useSharedValue(reduce ? 0 : 60);
  useEffect(() => {
    o.value = withTiming(1, { duration: 180 });
    y.value = withTiming(0, { duration: 260, easing: EASE });
  }, [o, y]);
  const scrim = useAnimatedStyle(() => ({ opacity: o.value }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal aria-modal>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color.scrim }, scrim]}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel={c.cancel ?? "cancel"} onPress={() => close(false)} />
      </Animated.View>
      <Animated.View style={[st.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }, sheet]}>
        <View style={st.grab} />
        <Text accessibilityRole="header" style={[type.h1(24), { textAlign: "center" }]}>{c.title}</Text>
        {c.body ? <Text style={[type.body(15), { color: color.mute, textAlign: "center" }]}>{c.body}</Text> : null}
        <View style={{ gap: 10, marginTop: 6 }}>
          <Pressable accessibilityRole="button" onPress={() => close(true)} style={({ pressed }) => [st.action, { backgroundColor: c.destructive ? color.danger : color.ink, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
            <Text style={[st.actionText, { color: c.destructive ? "#fff" : color.gold }]}>{c.confirm.toUpperCase()}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => close(false)} style={({ pressed }) => [st.action, { borderWidth: border.control, borderColor: color.ink, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
            <Text style={[st.actionText, { color: color.ink }]}>{(c.cancel ?? "cancel").toUpperCase()}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

/** Mount once, above every screen. */
export function OverlayHost() {
  const insets = useSafeAreaInsets();
  const [t, setT] = useState<Toast | null>(null);
  const [c, setC] = useState<Confirm | null>(null);
  useEffect(() => {
    showToast = setT;
    showConfirm = setC;
    return () => { showToast = null; showConfirm = null; };
  }, []);
  useEffect(() => {
    if (!t) return;
    const h = setTimeout(() => setT((cur) => (cur?.id === t.id ? null : cur)), 2200);
    return () => clearTimeout(h);
  }, [t]);
  const close = (ok: boolean) => { tapHaptic(); c?.resolve(ok); setC(null); };
  return (
    <>
      {t ? <ToastView key={t.id} t={t} bottom={Math.max(insets.bottom, 8) + 84} /> : null}
      {c ? <ConfirmView c={c} close={close} /> : null}
    </>
  );
}

const st = StyleSheet.create({
  toastWrap: { position: "absolute", left: 0, right: 0, alignItems: "center", zIndex: 50 },
  toast: { backgroundColor: color.ink, borderRadius: radius.pill, paddingVertical: 12, paddingHorizontal: 18, maxWidth: 340, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  toastText: { fontFamily: font.text[600], fontSize: 14, color: color.gold, textAlign: "center" },
  sheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: color.cream, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: space.gutter + 2, paddingTop: 10, gap: 12 },
  grab: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: color.line, marginBottom: 6 },
  action: { minHeight: 52, borderRadius: radius.btn, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  actionText: { fontFamily: font.text[600], fontSize: 13, letterSpacing: 0.78 },
});
