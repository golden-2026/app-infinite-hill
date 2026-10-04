import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { lessonInfo } from "@ih/content";
import { samplerDays, walkedFrom } from "@/content/sampler";
import { useStore } from "@/lib/store";
import { doorLabel, t } from "@/i18n";
import { Btn, Eyebrow, Screen, color, font, type } from "@/ui";
import { Host } from "@/ui/host";

// The sampler week (content/sampler.ts): "a week of many paths" for seekers, offered by the Guide and on the "my own
// path" welcome. Seven already-written lessons, one a day, each from a different door, read as extras: no door's
// path moves, no streak changes. Before starting: the offer. After: the week, with what's open, read and next.
export default function Sampler() {
  useTitle(t("companion.sampler.title"));
  const { saved, today, update } = useStore();
  const st = saved.settings;
  const started = !!st.sampler;
  const walked = walkedFrom(st.forYouDone, saved.sits);
  const days = samplerDays(st.sampler ?? { on: today }, today, walked);
  const shown = started ? days : days.map((x) => ({ ...x, open: false }));
  const allDone = started && days.every((x) => x.done);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));
  const open = (door: string, day: number) => router.push({ pathname: "/session/[door]/[day]", params: { door, day: String(day) } });
  const start = () => update({ sampler: { on: today } });
  const firstOpen = days.find((x) => x.open && !x.done);
  return (
    <Screen close={close} scroll footer={started ? (
      allDone
        ? <Btn testID="sampler-guide" onPress={() => router.replace("/guide")}>{t("companion.sampler.askGuide")}</Btn>
        : firstOpen ? <Btn testID="sampler-next" onPress={() => open(firstOpen.door, firstOpen.day)}>{`${t("common.day", { n: firstOpen.n })} · ${doorLabel(firstOpen.door)}`}</Btn> : null
    ) : <>
      <Btn testID="sampler-start" onPress={start}>{t("companion.sampler.start")}</Btn>
      <Btn testID="sampler-not-now" kind="ghost" onPress={close}>{t("companion.sampler.notNow")}</Btn>
    </>}>
      <View style={{ gap: 18 }}>
        <View style={{ gap: 4 }}>
          <Eyebrow size={8}>{t("companion.sampler.eyebrow")}</Eyebrow>
          <Text accessibilityRole="header" style={[type.h1(26), { color: color.ink }]}>{t("companion.sampler.title")}</Text>
        </View>
        <Host pose={allDone ? "cheer" : "wave"}>{allDone ? t("companion.sampler.allDone") : t("companion.sampler.host")}</Host>
        <View testID="sampler-days" style={{ borderWidth: 1, borderColor: color.line, borderRadius: 16, backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 4 }}>
          {shown.map((x, i) => {
            const title = (lessonInfo(x.door, x.day) as { title?: string } | null)?.title || t("common.day", { n: x.day });
            const when = !started || x.open ? null : t("companion.sampler.opensIn", { count: x.n - (days.filter((d) => d.open).length) });
            return (
              <Pressable key={`${x.door}:${x.day}`} testID={`sampler-day-${x.n}`} disabled={!x.open} accessibilityRole="link" accessibilityState={{ disabled: !x.open }}
                accessibilityLabel={t("companion.sampler.rowA11y", { n: x.n, title, door: doorLabel(x.door) })} onPress={() => open(x.door, x.day)}
                style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 52, paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderTopColor: color.line, opacity: pressed ? 0.8 : 1 }]}>
                <Text style={[type.eyebrow(8), { width: 44, color: color.mute }]}>{t("common.day", { n: x.n })}</Text>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontFamily: font.text[600], fontSize: 14, color: x.open || !started ? color.ink : color.mute }}>{title}{x.done ? " ✓" : ""}</Text>
                  <Text style={[type.body(12), { color: color.mute }]}>{doorLabel(x.door)}{when ? ` · ${when}` : ""}</Text>
                </View>
                {x.open ? <Text style={{ fontSize: 20, color: color.ink }}>›</Text> : null}
              </Pressable>
            );
          })}
        </View>
        <Text style={[type.caption(12), { textAlign: "center" }]}>{t("companion.sampler.how")}</Text>
      </View>
    </Screen>
  );
}
