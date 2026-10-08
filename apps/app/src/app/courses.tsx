import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { COURSES, courseDays, say } from "@/content/courses";
import { useStore } from "@/lib/store";
import { t } from "@/i18n";
import { Eyebrow, Screen, color, font, type } from "@/ui";
import { Host } from "@/ui/host";

// The course shelf (content/courses.ts): every course, named by the question it answers, with where someone is in each.
// Open to everyone, including people on a path (a course never moves their place on it).
export default function Courses() {
  useTitle(t("courses.shelf.title"));
  const { saved } = useStore();
  const on = saved.settings.course?.id;
  const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));
  return (
    <Screen close={close} scroll>
      <View style={{ gap: 18 }}>
        <View style={{ gap: 4 }}>
          <Eyebrow size={8}>{t("courses.pick.eyebrow")}</Eyebrow>
          <Text accessibilityRole="header" style={[type.h1(26), { color: color.ink }]}>{t("courses.shelf.title")}</Text>
        </View>
        <Host pose="wave">{t("courses.shelf.host")}</Host>
        <View testID="course-shelf" style={{ gap: 8 }}>
          {COURSES.map((c) => {
            const days = courseDays(c, saved.sits);
            const done = days.filter((x) => x.done).length;
            const status = done === days.length ? t("courses.shelf.finished") : c.id === on ? t("courses.shelf.on", { n: done + 1 }) : null;
            return (
              <Pressable key={c.id} testID={`shelf-${c.id}`} accessibilityRole="link" onPress={() => router.push({ pathname: "/course/[id]", params: { id: c.id } })}
                style={({ pressed }) => [{ borderWidth: c.id === on ? 1.5 : 1, borderColor: c.id === on ? color.ink : color.line, borderRadius: 16, backgroundColor: "#fff", paddingVertical: 12, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10, opacity: pressed ? 0.85 : 1 }]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontFamily: font.text[600], fontSize: 16, color: color.ink }}>{say(c.title)}</Text>
                  <Text style={[type.body(13), { color: color.mute }]}>{say(c.ask)}</Text>
                </View>
                {status ? <Text style={[type.eyebrow(8), { color: color.ink }]}>{status}</Text> : <Text style={{ fontSize: 20, color: color.ink }}>›</Text>}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
