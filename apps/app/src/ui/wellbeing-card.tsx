import { Text, View } from "react-native";
import { change, type Wellbeing } from "@/lib/wellbeing";
import { Card, Eyebrow, color, font, type } from "@/ui";
import { t } from "@/i18n";

/**
 * "How you've been": a person's own WHO-5 scores, first against latest, once there are two. Kind, never diagnostic:
 * a score is a number and a direction, never a label. Under WHO-5's own line (28) one gentle sentence points to
 * local help, nothing more. Nothing is shown before the second check-in.
 */
export function WellbeingCard({ wb }: { wb?: Wellbeing | null }) {
  const c = wb ? change(wb) : null;
  if (!c) return null;
  const point = (m: number, score: number) => (m === 1 ? t("wellbeing.card.start", { score }) : t("wellbeing.card.day", { n: m, score }));
  const headline = c.read === "up" ? t("wellbeing.card.up", { n: c.delta }) : c.read === "softer" ? t("wellbeing.card.down", { n: Math.abs(c.delta) }) : t("wellbeing.card.same");
  return (
    <Card testID="wellbeing-card">
      <Eyebrow>{t("wellbeing.card.eyebrow")}</Eyebrow>
      <Text style={[type.caption(13), { marginTop: 6, color: color.ink }]}>{point(c.first.m, c.first.score)} · {point(c.latest.m, c.latest.score)}</Text>
      <Text accessibilityRole="header" style={{ fontFamily: font.display[800], fontSize: 26, lineHeight: 30, letterSpacing: -0.6, color: color.ink, marginTop: 4 }}>{headline}</Text>
      <Text style={[type.body(14), { marginTop: 4 }]}>{t(`wellbeing.card.read.${c.read}`)}</Text>
      {c.help ? <Text style={[type.body(13), { marginTop: 8, color: color.ink }]}>{t("wellbeing.card.help")}</Text> : null}
      <View style={{ marginTop: 10 }}><Text style={type.caption(11)}>{t("wellbeing.card.foot")}</Text></View>
    </Card>
  );
}
