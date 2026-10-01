// The quiet "sources" link on a lesson's last screen, and the sheet it opens: the day's references, one per line.
// A day with no script (outline-only) has no sources, so nothing shows.
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, radius } from "@ih/brand";
import { Link, type } from "@/ui";
import { tapHaptic } from "@/lib/haptics";
import { t } from "@/i18n";
import { sourceLines } from "@/session/sources";

export function LessonSources({ sources }: { sources: unknown }) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const lines = sourceLines(sources, { paraphrased: t("session.sources.paraphrased"), original: t("session.sources.original") });
  if (!lines.length) return null;
  return (
    <>
      <Pressable testID="lesson-sources" accessibilityRole="button" accessibilityLabel={t("session.sources.a11y", { count: lines.length })}
        onPress={() => { tapHaptic(); setOpen(true); }} hitSlop={6}
        style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", paddingHorizontal: 12, opacity: pressed ? 0.5 : 1 })}>
        <Text style={[type.eyebrow(8), { color: "#ffffff88", textDecorationLine: "underline" }]}>{t("session.sources.link")}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "center" }}>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: color.scrim }]} accessibilityLabel={t("session.close")} onPress={() => setOpen(false)} />
          <View testID="sources-sheet" style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]} accessibilityViewIsModal aria-modal>
            <View style={s.grab} />
            <Text accessibilityRole="header" style={[type.eyebrow(), { textAlign: "center" }]}>{t("session.sources.title")}</Text>
            <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: 8 }}>
              {lines.map((l) => (
                <View key={l} style={s.row}>
                  <Text style={[type.body(14), { color: color.ink }]}>{l}</Text>
                </View>
              ))}
            </ScrollView>
            <Text style={[type.body(12), { color: color.mute, textAlign: "center" }]}>{t("session.sources.foot")}</Text>
            <View style={{ alignItems: "center" }}><Link onPress={() => setOpen(false)} style={{ color: color.mute }}>{t("session.close")}</Link></View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  sheet: { width: "100%", maxWidth: 430, backgroundColor: color.cream, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: 20, paddingTop: 10, gap: 12 },
  grab: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: color.line, marginBottom: 6 },
  row: { borderBottomWidth: 1, borderBottomColor: color.line, paddingBottom: 8 },
});
