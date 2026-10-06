import { tg } from "@/lib/gentle-t";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { lessonInfo } from "@ih/content";
import { gentleStart } from "@/content/life-moments";
import { nextWeekDay } from "@/lib/lane";
import { inSampler, samplerDays, walkedFrom } from "@/content/sampler";
import { useStore } from "@/lib/store";
import { doorLabel, t } from "@/i18n";
import { Btn, Guy, Screen, color, type } from "@/ui";
import { Host } from "@/ui/host";

// After a first-week lesson (content/life-moments.ts), read ahead of the path as an extra: not a sit, so none of the
// streak screens. One warm line, what's next on their week, and, after a gentle lesson (grief, scary health news,
// forgiveness), the Guide offered softly: "want to talk about it? i'm here."
export default function WeekDone() {
  useTitle(tg("gentle.after.title"));
  const { door = "", day = "" } = useLocalSearchParams<{ door?: string; day?: string }>();
  const { saved, today } = useStore();
  const st = saved.settings;
  const why = st.profile?.door === door ? st.profile.answers?.why : null;
  const gentle = gentleStart(why);
  const read = new Set([...(st.forYouDone || []), `${door}:${day}`]);
  const next = nextWeekDay(why, door, (n) => read.has(`${door}:${n}`) || saved.sits.some((x) => !x.kidId && x.door === door && x.day === n));
  const nextTitle = next ? (lessonInfo(door, next) as { title?: string } | null)?.title || t("common.day", { n: next }) : null;
  const home = () => router.replace("/today");
  // a day of the sampler week (content/sampler.ts): what comes next in that week instead
  const sampler = st.sampler && inSampler(door, Number(day)) ? (() => {
    const walked = walkedFrom([...(st.forYouDone || []), `${door}:${day}`], saved.sits);
    const left = samplerDays(st.sampler, today, walked).filter((x) => !x.done);
    if (!left.length) return t("companion.sampler.weekDone");
    const x = left[0];
    const title = (lessonInfo(x.door, x.day) as { title?: string } | null)?.title || t("common.day", { n: x.day });
    return t(x.open ? "companion.sampler.next" : "companion.sampler.nextTomorrow", { title, door: doorLabel(x.door) });
  })() : null;
  return (
    <Screen close={home} footer={gentle ? <>
        <Btn testID="week-guide" onPress={() => router.replace("/guide")}>{tg("gentle.after.talk")}</Btn>
        <Btn testID="week-today" kind="ghost" onPress={home}>{tg("gentle.after.notNow")}</Btn>
      </> : <Btn testID="week-today" onPress={home}>{tg("gentle.after.home")}</Btn>}>
      <View style={{ flex: 1, justifyContent: "center", gap: 18 }}>
        {gentle ? null : <View style={{ alignItems: "center" }}><Guy pose="cheer" h={150} /></View>}
        <Text accessibilityRole="header" style={[type.h1(26), { textAlign: "center" }]}>{gentle ? tg("gentle.after.gentle") : tg("gentle.after.light")}</Text>
        {gentle ? <Host pose="heart">{tg("gentle.after.guide")}</Host> : null}
        {sampler ? <Text testID="week-next" style={[type.body(14), { textAlign: "center", color: color.mute }]}>{sampler}</Text> : st.weekFirst || nextTitle ? (
          <Text testID="week-next" style={[type.body(14), { textAlign: "center", color: color.mute }]}>
            {nextTitle ? tg("gentle.after.next", { title: nextTitle }) : tg("gentle.after.weekDone")}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
