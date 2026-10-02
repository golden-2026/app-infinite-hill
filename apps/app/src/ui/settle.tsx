// The mascot's gentle offer after placement (rules in lib/settle.ts): walk back to the start of an earlier stretch when
// the lessons here lean on stories not walked yet, or go on ahead when everything here is easy. Shown on Today, above
// the day's lesson. Never "failed", "behind" or "too hard": it's about picking up a few stories, and nothing is lost.
import { View, Text } from "react-native";
import { lastWritten, stopAt, stopFirsts } from "@/content/placement";
import { declineOffer, moveTo, settleOffer } from "@/lib/settle";
import { useStore } from "@/lib/store";
import { stretchLabel, t } from "@/i18n";
import { Btn, Card, Eyebrow, toast, type } from "@/ui";
import { Host } from "@/ui/host";

export function SettleCard({ door }: { door: string }) {
  const { saved, derived, today, startFor, update } = useStore();
  const st = saved.settings;
  const offer = settleOffer({
    door, start: startFor(door), day: derived.paths[door]?.day ?? 1, runs: st.runs || [], firsts: stopFirsts(door), last: lastWritten(door),
    today, moved: st.moved?.[door] ?? null, memo: st.settle?.[door] ?? null,
  });
  if (!offer) return null;
  const to = stopAt(door, offer.to);
  const camp = to ? stretchLabel(to.camp, to.name) : "";
  const back = offer.kind === "back";
  const go = () => {
    update(moveTo(st, door, offer.to, new Date().toISOString()));
    toast(t("home.settle.moved", { day: offer.to }));
  };
  const stay = () => {
    update({ settle: declineOffer(st.settle, door, offer, today) });
  };
  return (
    <Card testID="settle-offer" style={{ marginHorizontal: 18, marginBottom: 12, gap: 12 }}>
      <Eyebrow size={8}>{t("home.settle.eyebrow")}</Eyebrow>
      <Host pose={back ? "hike" : "climb"}>{back ? t("home.settle.back", { camp }) : t("home.settle.ahead", { camp, day: offer.to })}</Host>
      <Text style={[type.caption(), { textAlign: "center" }]}>{back ? t("home.settle.backNote", { day: offer.to }) : t("home.settle.aheadNote")}</Text>
      <View style={{ gap: 10 }}>
        <Btn testID="settle-go" onPress={go}>{back ? t("home.settle.backGo") : t("home.settle.aheadGo")}</Btn>
        <Btn testID="settle-stay" kind="ghost" onPress={stay}>{t("home.settle.stay")}</Btn>
      </View>
    </Card>
  );
}
