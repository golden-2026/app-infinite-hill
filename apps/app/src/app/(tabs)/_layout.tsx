import { Redirect, router, usePathname } from "expo-router";
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from "expo-router/ui";
import { forwardRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useStore } from "@/lib/store";
import { tapHaptic } from "@/lib/haptics";
import { GuideIcon, TodayIcon, TogetherIcon, YouIcon } from "@/ui/tab-icons";
import { color, font } from "@/ui";

// v175's black tab bar (together · today · guide), plus "you": profile and settings are a real tab now,
// not a hidden ☰ (flow audit 9/25).
const TABS = [
  { name: "together", href: "/together", label: "together", Icon: TogetherIcon },
  { name: "today", href: "/today", label: "today", Icon: TodayIcon },
  { name: "guide", href: "/guide", label: "guide", Icon: GuideIcon },
  { name: "you", href: "/you", label: "you", Icon: YouIcon },
] as const;

const TabButton = forwardRef<View, TabTriggerSlotProps & { label: string; root: string; Icon: (p: { color: string; filled?: boolean }) => React.JSX.Element }>(function TabButton({ isFocused, label, root, Icon, onPress, ...props }, ref) {
  const tint = isFocused ? color.gold : "#ffffff8c";
  const path = usePathname();
  // Tapping the tab you're in goes back to its first screen, as in every iPhone app.
  const press = (e: any) => {
    tapHaptic();
    if (isFocused && path !== root) { router.dismissTo(root as any); return; }
    onPress?.(e);
  };
  return (
    <Pressable ref={ref} {...props} onPress={press} accessibilityRole="tab" accessibilityState={{ selected: !!isFocused }} aria-selected={!!isFocused} aria-current={isFocused ? "page" : undefined} accessibilityLabel={label}
      style={({ pressed }) => [styles.tab, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
      <Icon color={tint} filled={!!isFocused} />
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
    </Pressable>
  );
});

export default function TabsLayout() {
  const { saved } = useStore();
  const insets = useSafeAreaInsets();
  if (!saved.settings.onboarded) return <Redirect href="/welcome" />;
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
        {TABS.map((t) => (
          <TabTrigger key={t.name} name={t.name} href={t.href} asChild>
            <TabButton label={t.label} root={t.href} Icon={t.Icon} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", backgroundColor: color.ink, paddingTop: 10, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: "#ffffff14" },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 4, minHeight: 48 },
  label: { fontFamily: font.text[600], fontSize: 11, letterSpacing: 0.2 },
});
