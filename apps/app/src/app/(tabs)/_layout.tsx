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
import { focused } from "@/lib/focus";

// the black tab bar: today · guide · together · you (owner's order, 10/1): profile and settings are a real tab now,
// not a hidden ☰ (flow audit 9/25).
const TABS = [
  { name: "today", href: "/today", label: "home.tab.today", Icon: TodayIcon },
  { name: "guide", href: "/guide", label: "home.tab.guide", Icon: GuideIcon },
  { name: "together", href: "/together", label: "home.tab.together", Icon: TogetherIcon },
  { name: "you", href: "/you", label: "home.tab.you", Icon: YouIcon },
] as const;

const TabButton = forwardRef<View, TabTriggerSlotProps & { label: string; root: string; Icon: (p: { color: string; filled?: boolean }) => React.JSX.Element }>(function TabButton({ isFocused, label, root, Icon, onPress, ...props }, ref) {
  // loud brand: the tab you're on is a lime pill with black words (lime + black, Magna's playbook)
  const tint = isFocused ? "#0A0A0A" : "#F3EFE48c";
  const path = usePathname();
  // Tapping the tab you're in goes back to its first screen, as in every iPhone app.
  const press = (e: any) => {
    tapHaptic();
    if (isFocused && path !== root) { router.dismissTo(root as any); return; }
    onPress?.(e);
  };
  return (
    <Pressable ref={ref} {...props} onPress={press} accessibilityRole="tab" accessibilityState={{ selected: !!isFocused }} aria-selected={!!isFocused} aria-current={isFocused ? "page" : undefined} accessibilityLabel={label}
      style={({ pressed }) => [styles.tab, isFocused && styles.on, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
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
        {TABS.filter((tab) => !(focused && tab.name === "together")).map((tab) => (
          <TabTrigger key={tab.name} name={tab.name} href={tab.href} asChild>
            <TabButton label={t(tab.label)} root={tab.href} Icon={tab.Icon} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", backgroundColor: "#0A0A0A", paddingTop: 8, paddingHorizontal: 8, gap: 4, borderTopWidth: 1, borderTopColor: "#F3EFE41a" },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, paddingVertical: 5, minHeight: 50, borderRadius: 999 },
  on: { backgroundColor: color.gold },
  label: { fontFamily: font.text[700], fontSize: 10.5, letterSpacing: 1.1, textTransform: "uppercase" },
});
