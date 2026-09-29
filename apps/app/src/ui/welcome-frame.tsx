import { router } from "expo-router";
import { type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "@/lib/store";
import { BottomBar, NavBar, color, font } from "@/ui";
import { Enter } from "@/ui/enter";

export const WELCOME_STEPS = 8; // about you → door → the whole climb → check-in (or get to know you) → your tradition → your path → voice → ready

/** Onboarding on the app shell: the same top bar (back · progress · skip) and pinned bottom bar as every screen. */
export function WelcomeFrame({ step, children, footer, door, onBack }: { step: number; children: ReactNode; footer?: ReactNode; door?: string | null; /** the top back steps back one question first; returns false when there is nothing left to step back */ onBack?: () => boolean }) {
  const { update } = useStore();
  const skip = () => {
    update({ onboarded: true, homeWing: door || "SPIRITUAL" });
    router.replace("/today");
  };
  return (
    <SafeAreaView style={styles.fill} edges={footer ? ["top"] : ["top", "bottom"]}>
      <NavBar back={{ label: "back", to: "/welcome", onPress: onBack }} progress={step / WELCOME_STEPS}
        right={<Pressable accessibilityRole="button" accessibilityLabel="Skip and start as a guest" onPress={skip} hitSlop={8} style={({ pressed }) => [styles.skip, { opacity: pressed ? 0.5 : 1 }]}><Text style={styles.skipText}>skip</Text></Pressable>} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"><Enter style={{ gap: 16 }}>{children}</Enter></ScrollView>
      {footer ? <BottomBar>{footer}</BottomBar> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.cream },
  body: { flexGrow: 1, justifyContent: "center", gap: 16, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 24 },
  skip: { minHeight: 44, minWidth: 44, alignItems: "flex-end", justifyContent: "center", paddingHorizontal: 10 },
  skipText: { fontFamily: font.text[600], fontSize: 15, color: color.mute },
});
