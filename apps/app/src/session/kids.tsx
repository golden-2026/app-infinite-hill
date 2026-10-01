// Kid mode's lesson: the door's kids' track (packages/content/kids), in the app's language, with the app's own words
// around the story. The child sees the story, the games, the word, the breath and the line; the grown-up holding the
// phone sees "for grown-ups" on the last screen (where the story comes from, and a question to ask together).
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { kidLessonIndex, kidPlan } from "@ih/content";
import { isEs, t } from "@/i18n";
import { LessonSources } from "@/session/sources-sheet";
import { color, font, type } from "@/ui";

/** The child's lesson steps for a door and the child's day, or null when the door has no kids' set. */
export function kidPlanFor(door: string, day: number) {
  return kidPlan({
    door,
    day,
    lang: isEs() ? "es" : "en",
    labels: {
      bell: t("kids.bell", { n: kidLessonIndex(day) }),
      story: t("kids.seg.story"),
      game: t("kids.seg.game"),
      wordSeg: t("kids.seg.word"),
      breathSeg: t("kids.seg.breath"),
      lineSeg: t("kids.seg.line"),
      order: t("kids.order"),
      truthKicker: t("kids.truth.kicker"),
      truthQ: t("kids.truth.q"),
      yes: t("kids.truth.yes"),
      no: t("kids.truth.no"),
      yesDot: t("kids.truth.yesDot"),
      noDot: t("kids.truth.noDot"),
      // templates: the content fills {word}, {means} and {carry}
      word: t("kids.word"),
      carry: t("kids.carry"),
    },
  });
}

/** The child's last screen: a cheer, the word and the games, the line, then the grown-ups' note and the sources. */
export function KidTally({ plan, day, right, asked, best, celebrate }: { plan: any; day: number; right: number; asked: number; best: number; celebrate: ReactNode }) {
  const g = plan.kid?.grownups;
  return (
    <View style={{ alignItems: "center", gap: 14, width: "100%" }}>
      {celebrate}
      <Text accessibilityRole="header" style={{ fontFamily: font.mark[800], fontSize: 34, color: color.gold, textAlign: "center" }}>{t("kids.tally.title", { n: kidLessonIndex(day) })}</Text>
      <Text style={[type.body(15), { color: "#ffffffcc", marginTop: -8, textAlign: "center" }]}>{t("kids.tally.body")}</Text>
      <View style={{ flexDirection: "row", gap: 8, width: "100%" }}>
        <View style={[s.tile, { backgroundColor: color.gold, borderWidth: 0 }]}>
          <Text style={[type.eyebrow(), { color: color.ink }]}>{t("kids.tally.word")}</Text>
          <Text style={{ fontFamily: font.display[800], fontSize: 20, color: color.ink }} numberOfLines={2} adjustsFontSizeToFit>{plan.word}</Text>
        </View>
        <View style={s.tile}>
          <Text style={[type.eyebrow(), { color: "#ffffffaa" }]}>{t("kids.tally.game")}</Text>
          <Text style={{ fontFamily: font.display[800], fontSize: 22, color: color.gold }}>{t("kids.tally.games", { a: right, b: asked })}</Text>
          {best >= 2 ? <Text style={[type.body(11), { color: "#ffffffcc" }]}>{t("session.inARow", { n: best })}</Text> : null}
        </View>
      </View>
      <Text style={{ fontFamily: font.display[500], fontSize: 17, color: "#ffffffcc", textAlign: "center" }}>{t("session.tally.line")}<Text style={{ fontStyle: "italic" }}>{/[.?!…]$/.test(plan.carry) ? plan.carry : `${plan.carry}.`}</Text></Text>
      {g ? (
        <View testID="kid-grownups" style={s.card} accessibilityLabel={`${t("kids.grownups.title")}. ${g.source} ${t("kids.grownups.ask")}: ${g.ask}`}>
          <Text style={[type.eyebrow(9), { color: color.ink }]}>{t("kids.grownups.title")}</Text>
          <Text style={[type.body(13), { color: color.ink }]}><Text style={{ fontFamily: font.text[700] }}>{t("kids.grownups.source")}: </Text>{g.source}</Text>
          <Text style={[type.body(13), { color: color.ink }]}><Text style={{ fontFamily: font.text[700] }}>{t("kids.grownups.ask")}: </Text>{g.ask}</Text>
          <Text style={[type.body(11), { color: color.mute }]}>{t("kids.grownups.draft")}</Text>
        </View>
      ) : null}
      <LessonSources sources={plan.kid?.sources} />
    </View>
  );
}

const s = StyleSheet.create({
  tile: { flex: 1, backgroundColor: "#ffffff14", borderColor: "#ffffff33", borderWidth: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 12, gap: 2 },
  card: { width: "100%", backgroundColor: color.cream, borderRadius: 18, padding: 14, gap: 6 },
});
