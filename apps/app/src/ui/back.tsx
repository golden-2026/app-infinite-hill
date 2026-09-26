import { router } from "expo-router";
import { Pressable, Text } from "react-native";
import { color, font } from "@/ui";
import { ChevronLeft } from "@/ui/tab-icons";

/** Native-style back: a chevron and the parent's name, 44pt tall. Goes back, or to a sensible parent. */
export function Back({ to = "/you", label }: { to?: string; label?: string }) {
  const name = (label ?? (to === "/you" ? "you" : to === "/today" ? "today" : to === "/welcome" ? "back" : "back")).replace(/^‹\s*/, "");
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Back to ${name}`} onPress={() => (router.canGoBack() ? router.back() : router.replace(to as any))} hitSlop={8}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", alignSelf: "flex-start", minHeight: 44, paddingRight: 12, marginLeft: -6, opacity: pressed ? 0.5 : 1 })}>
      <ChevronLeft color={color.ink} />
      <Text style={{ fontFamily: font.text[600], fontSize: 16, color: color.ink, marginLeft: 2 }}>{name}</Text>
    </Pressable>
  );
}
