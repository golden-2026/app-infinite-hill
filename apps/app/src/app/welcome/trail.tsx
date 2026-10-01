import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { icon, lessonInfo } from "@ih/content";
import { doorLabel, formatNumber, isEs, t } from "@/i18n";
import { lookoutArt, SUMMIT_ART, trailFor } from "@/content/journeys";
import { doorParam } from "@/lib/door-param";
import { Btn, Eyebrow, Guy, color, font, type } from "@/ui";
import { Host } from "@/ui/host";
import { Painting, SummitCard } from "@/ui/trail-map";
import { WelcomeFrame } from "@/ui/welcome-frame";

const INK = "rgba(10,10,10,";

// Right after picking a door: the climb from where you start to where it leads. Today's first lesson, the first
// lookout at the end of camp one, year one's five camps at a glance, and the summit last, as the payoff. A thin glimpse
// of the summit sits at the very top so the destination is felt from the start. Copy is DRAFT (content/journeys.ts).
export default function WelcomeTrail() {
  useEffect(() => { track("onboard_step", { step: "trail" }); }, []);
  useTitle(t("onboarding.trail.title"));
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw);
  useEffect(() => { if (!door) router.replace("/welcome/door"); }, [door]);
  if (!door) return null;
  const own = door === "SPIRITUAL";
  const name = own ? t("home.trail.ownPath") : doorLabel(door);
  const next = () => router.push(own ? "/welcome/intake" : { pathname: "/welcome/know", params: { door } });
  const { stages, summit, planned } = trailFor(door);
  const camps = stages.filter((s) => s.key.startsWith("Camp"));
  const first = camps[0];
  // day one's real lesson (lesson words stay as the lesson has them, English until lessons are translated)
  const one = lessonInfo(door, 1) as { word?: string; title?: string };
  const tint: string = icon(door).tint || color.ink;
  const top = isEs() ? formatNumber(summit.day, "es") : summit.day.toLocaleString("en-US");

  return (
    <WelcomeFrame step={3} door={door} footer={<Btn testID="trail-continue" onPress={next}>{t("onboarding.trail.start")}</Btn>}>
      {/* a glimpse of where it leads: a thin strip of the summit painting */}
      <View style={{ height: 40, borderRadius: 14, overflow: "hidden", backgroundColor: color.ink, opacity: 0.85 }} accessibilityLabel={t("onboarding.trail.peekA11y", { day: top })}>
        <Painting artKey={`${SUMMIT_ART}-sm`} y="10%" />
        <LinearGradient pointerEvents="none" colors={[`${INK}0.15)`, `${INK}0.55)`]} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 14 }}>
          <Text style={[type.eyebrow(), { color: color.gold }]}>{t("onboarding.trail.peek", { day: top })}</Text>
        </View>
      </View>

      <Host pose="wave">{t("onboarding.trail.host")}</Host>

      {/* 1 · today, at the trailhead */}
      <View style={{ backgroundColor: "#FFFBE0", borderRadius: 18, borderWidth: 1.5, borderColor: color.ink, padding: 14, flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Eyebrow style={{ color: color.ink }}>{t("onboarding.trail.todayEyebrow")}</Eyebrow>
          <Text testID="trail-today-word" style={[type.h1(26), { marginTop: 6 }]}>{one.word || ""}</Text>
          {one.title ? <Text style={[type.body(14), { color: color.ink, marginTop: 2 }]}>{one.title}</Text> : null}
          <Text style={[type.caption(), { marginTop: 8 }]}>{t("onboarding.trail.todayLine")}</Text>
        </View>
        <Guy pose="hike" h={84} />
      </View>

      {/* 2 · the first lookout, end of camp one */}
      {first ? (
        <View style={{ backgroundColor: color.white, borderRadius: 18, borderWidth: 1.5, borderColor: color.line, overflow: "hidden" }}>
          <View style={{ height: 96, backgroundColor: color.ink }}>
            <Painting artKey={`${lookoutArt(first.key)}-sm`} />
            <LinearGradient pointerEvents="none" colors={[`${INK}0)`, `${INK}0.85)`]} locations={[0.2, 1]} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
            <View style={{ position: "absolute", left: 14, right: 14, bottom: 10 }}>
              <Text style={[type.eyebrow(), { color: color.gold }]}>{t("onboarding.trail.lookoutEyebrow", { day: first.last })}</Text>
              <Text style={{ fontFamily: font.display[800], fontSize: 20, letterSpacing: -0.4, color: "#fff", marginTop: 2 }}>{t("onboarding.trail.lookoutName", { name: first.name })}</Text>
            </View>
          </View>
          <View style={{ padding: 14, paddingTop: 10 }}>
            <Eyebrow>{t("onboarding.trail.byThen")}</Eyebrow>
            <Text style={[type.body(14), { color: color.ink, marginTop: 2 }]}>{first.promise}</Text>
          </View>
        </View>
      ) : null}

      {/* 3 · year one at a glance: the five camps as a short path */}
      <View style={{ backgroundColor: color.white, borderRadius: 18, borderWidth: 1.5, borderColor: color.line, padding: 14 }}>
        <Eyebrow>{t("onboarding.trail.yearOne")}</Eyebrow>
        <View style={{ marginTop: 10 }}>
          {camps.map((c, i) => (
            <View key={c.key} style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ width: 14, alignItems: "center" }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, marginTop: 4, borderWidth: 2, borderColor: i === 0 ? color.ink : tint, backgroundColor: i === 0 ? color.gold : color.white }} />
                {i < camps.length - 1 ? <View style={{ flex: 1, width: 2, minHeight: 14, backgroundColor: color.line, marginVertical: 2 }} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: i < camps.length - 1 ? 10 : 0 }}>
                <Text style={{ fontFamily: font.display[700], fontSize: 16, lineHeight: 21, color: color.ink }}>{c.name}</Text>
                <Text style={type.caption(12)}>{c.eyebrow}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={[type.caption(), { marginTop: 10 }]}>{t("onboarding.trail.yearsMore")}</Text>
      </View>

      {/* 4 · the summit, last: the payoff */}
      <SummitCard s={summit} name={name} planned={planned} />
    </WelcomeFrame>
  );
}
