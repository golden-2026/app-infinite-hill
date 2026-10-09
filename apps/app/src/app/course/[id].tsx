import { useTitle } from "@/lib/title";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { courseById, courseDays, dayName, fromLabel, say } from "@/content/courses";
import { useStore } from "@/lib/store";
import { doorLabel, t } from "@/i18n";
import { Btn, Eyebrow, Screen, color, font, type } from "@/ui";
import { Host } from "@/ui/host";

// One course (content/courses.ts): its seven days, each from a different tradition, with what's done and what's next.
// Days open in order, with no waiting (as many in a day as someone likes). For the course they're on: the next day
// one tap away. For another course: start it (the one they were on keeps its finished days). Finished: another course,
// or simply spiritual, the daily path that mixes traditions the same way.
export default function CoursePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = courseById(id);
  const { saved, today, update } = useStore();
  useTitle(c ? say(c.title) : t("courses.shelf.title"));
  if (!c) return <Redirect href="/courses" />;
  const st = saved.settings;
  const mine = st.course?.id === c.id;
  const other = !mine && st.course ? courseById(st.course.id) : null;
  const days = courseDays(c, saved.sits);
  const next = days.find((x) => !x.done) ?? null;
  const allDone = !next;
  const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));
  const open = (door: string, day: number) => router.push({ pathname: "/session/[door]/[day]", params: { door, day: String(day), course: c.id } });
  const begin = () => {
    update({ course: { id: c.id, on: today } });
  };
  const footer = allDone ? <>
    <Btn testID="course-another" kind="gold" onPress={() => router.replace("/courses")}>{t("courses.page.another")}</Btn>
    <Btn testID="course-spiritual" kind="ghost" onPress={() => router.replace("/today")}>{t("courses.page.spiritual")}</Btn>
  </> : mine && next ? (
    <Btn testID="course-next" kind="gold" onPress={() => open(next.door, next.day)}>{next.n === 1 ? t("courses.page.start") : t("courses.page.next", { n: next.n })}</Btn>
  ) : (
    <Btn testID="course-begin" kind="gold" onPress={begin}>{other ? t("courses.page.switch") : t("courses.page.begin")}</Btn>
  );
  return (
    <Screen close={close} scroll footer={footer}>
      <View style={{ gap: 18 }}>
        <View style={{ gap: 4 }}>
          <Eyebrow size={8}>{t("courses.page.eyebrow", { title: say(c.title) })}</Eyebrow>
          <Text accessibilityRole="header" style={[type.h1(26), { color: color.ink }]}>{say(c.ask)}</Text>
        </View>
        <Host pose={allDone ? "cheer" : "wave"}>{allDone ? t("courses.page.done", { title: say(c.title) }) : say(c.line)}</Host>
        <View testID="course-days" style={{ borderWidth: 1, borderColor: color.line, borderRadius: 16, backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 4 }}>
          {days.map((x, i) => {
            const name = dayName(x.door, x.day);
            const can = mine && x.open;
            const isNext = mine && next?.n === x.n;
            return (
              <Pressable key={`${x.door}:${x.day}`} testID={`course-day-${x.n}`} disabled={!can} accessibilityRole="link" accessibilityState={{ disabled: !can }}
                accessibilityLabel={t("courses.page.dayA11y", { n: x.n, name, door: fromLabel(x.door) })} onPress={() => open(x.door, x.day)}
                style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 56, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: color.line, opacity: pressed ? 0.8 : 1 }]}>
                <Text style={[type.eyebrow(8), { width: 44, color: isNext ? color.ink : color.mute }]}>{t("common.day", { n: x.n })}</Text>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={2} style={{ fontFamily: font.text[600], fontSize: 15, color: x.done || isNext || !mine ? color.ink : color.mute }}>{name}{x.done ? " ✓" : ""}</Text>
                  <Text style={[type.body(12), { color: color.mute }]}>{fromLabel(x.door)}</Text>
                </View>
                {can ? <Text style={{ fontSize: 20, color: color.ink }}>›</Text> : null}
              </Pressable>
            );
          })}
        </View>
        {other ? <Text style={[type.caption(12), { textAlign: "center" }]}>{t("courses.page.switchNote", { title: say(other.title) })}</Text> : null}
        <Text style={[type.caption(12), { textAlign: "center" }]}>{t("courses.page.how")}</Text>
      </View>
    </Screen>
  );
}
