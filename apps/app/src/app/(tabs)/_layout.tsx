import { Redirect, router, usePathname } from "expo-router";
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from "expo-router/ui";
import { forwardRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useStore } from "@/lib/store";
import { tapHaptic } from "@/lib/haptics";
import { GuideIcon, TodayIcon, TogetherIcon, YouIcon } from "@/ui/tab-icons";
import { color, font } from "@/ui";
import { t } from "@/i18n";

// the black tab bar: today · guide · together · you (owner's order, 10/1): profile and settings are a real tab now,
// not a hidden ☰ (flow audit 9/25).
const TABS = [
  { name: "today", href: "/today", label: "home.tab.today", Icon: TodayIcon },
  { name: "guide", href: "/guide", label: "home.tab.guide", Icon: GuideIcon },
  { name: "together", href: "/together", label: "home.tab.together", Icon: TogetherIcon },
  { name: "you", href: "/you", label: "home.tab.you", Icon: YouIcon },
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
        {TABS.map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabButton label={t(tab.label)} root={tab.href} Icon={tab.Icon} />
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
