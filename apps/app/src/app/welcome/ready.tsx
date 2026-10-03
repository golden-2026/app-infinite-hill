import { tg } from "@/lib/gentle-t";
import { track } from "@/lib/analytics";
import { doorParam } from "@/lib/door-param";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { lessonInfo } from "@ih/content";
import { useStore } from "@/lib/store";
import { dueAtStart, emptyWellbeing } from "@/lib/wellbeing";
import { baselineAtStart, firstLesson, laneFor, weekFirst } from "@/lib/lane";
import { t } from "@/i18n";
import { Eyebrow, Guy, type } from "@/ui";
import { WelcomeFrame } from "@/ui/welcome-frame";
import { gentleStart } from "@/content/life-moments";

// v175 step 8: one breath of framing, then the first lesson opens on its own: day one, or where the check placed them
// (day 22, when they chose to skip camp one), or, for someone who came for a life moment on the gentle or light way
// in (lib/lane.ts), the first lesson of their first week (it opens ahead of the path as an extra, never a sit).
export default function Ready() {
  useEffect(() => { track("onboard_step", { step: "ready" }); }, []);
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw) || "SPIRITUAL"; // unknown doors in a URL never get saved
  const { update, saved } = useStore();
  const why = saved.settings.profile?.door === door ? saved.settings.profile.answers?.why : null;
  const week = weekFirst(why, door);
  const start = firstLesson(why, door, saved.settings.placed?.[door] ?? 1);
  // grief, scary health news, something hard, forgiveness: no "stay with it" framing at sign-up
  const gentle = gentleStart(why);
  const light = laneFor(why) === "light";
  const title = week ? (lessonInfo(door, start) as { title?: string } | null)?.title : null;
  // the 30-second check-in, once, before day one; the gentle and quick ways in get it on their third day instead
  const baseline = baselineAtStart(why) ? dueAtStart(saved.settings.wellbeing || emptyWellbeing()) : null;
  useEffect(() => {
    const t = setTimeout(() => {
      // straight into the first lesson (after the optional baseline check-in); finishing or leaving it lands on Today
      if (baseline) router.replace({ pathname: "/wellbeing", params: { m: String(baseline), door, day: String(start) } });
      else router.replace({ pathname: "/session/[door]/[day]", params: { door, day: String(start) } });
      update({ onboarded: true, homeWing: door, active: "home", ...(week ? { weekFirst: true } : {}) });
    }, 2400);
    return () => clearTimeout(t);
  }, [door, update, start, baseline, week]);
  const [head, sub] = gentle ? [t("onboarding.ready.gentle"), t("onboarding.ready.gentleSo")] : light ? tg("gentle.ready.light").split("\n") : [t("onboarding.ready.hard"), t("onboarding.ready.so")];
  return (
    <WelcomeFrame step={8} door={door}>
      <View style={{ alignItems: "center", gap: 18 }}>
        <Guy pose={gentle ? "heart" : "path"} h={180} />
        <Text style={[type.h1(24), { textAlign: "center", maxWidth: 280 }]}>
          {head}{"\n"}
          <Text style={gentle ? { fontFamily: "Manrope_500Medium", fontSize: 18, lineHeight: 25 } : { fontFamily: "Manrope_500Medium", fontStyle: "italic" }}>{sub}</Text>
        </Text>
        {title ? <Eyebrow style={{ textAlign: "center" }}>{tg("gentle.ready.first", { title })}</Eyebrow> : null}
        {gentle ? null : <Text style={[type.caption(), { textAlign: "center" }]}>{t("onboarding.ready.fact")}</Text>}
      </View>
    </WelcomeFrame>
  );
}
