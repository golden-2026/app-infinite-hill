import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useStore } from "@/lib/store";
import { WHO5_ITEMS, WHO5_SCALE, who5Score } from "@/lib/wellbeing";
import { sendWellbeing } from "@/lib/wellbeing-send";
import { Btn, Eyebrow, Link, Screen, color, font, toast, type } from "@/ui";
import { Host } from "@/ui/host";
import { t, type Key } from "@/i18n";
import { tg } from "@/lib/gentle-t";

// The 30-second check-in (the WHO-5 Well-Being Index): one screen, five statements, each answered 0–5. It opens once
// right after onboarding (m=1, before the first lesson) and when a lesson reaches day 21, 50, 100 and every 30 days
// after (lib/wellbeing decides; this screen only asks). Always skippable: the × and "skip for now" both mark the
// milestone as offered, so it is never asked twice. Then it goes on to wherever it was going (`then`), or to the
// first lesson (`door` + `day`).
// `gentle`: the baseline deferred to the third day (lib/lane.ts), introduced more softly.
type Params = { m?: string; then?: string; door?: string; day?: string; gentle?: string };

export default function WellbeingCheckIn() {
  useTitle(t("wellbeing.title"));
  const p = useLocalSearchParams<Params>();
  const m = Math.max(1, Number(p.m) || 1);
  const { saved, recordWellbeing } = useStore();
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null, null, null]);
  const score = who5Score(answers);
  const intro: Key = m === 1 ? "wellbeing.intro.1" : m === 21 ? "wellbeing.intro.21" : m === 50 ? "wellbeing.intro.50" : m === 100 ? "wellbeing.intro.100" : "wellbeing.intro.more";

  const onward = () => {
    if (p.door && Number(p.day) > 0) router.replace({ pathname: "/session/[door]/[day]", params: { door: p.door, day: String(p.day) } });
    else router.replace((p.then as any) || "/today");
  };
  const skip = () => { recordWellbeing(m, null); onward(); };
  const done = () => {
    if (score === null) return;
    recordWellbeing(m, score);
    sendWellbeing(saved.settings.homeWing, m, score); // anonymous: door, bucket, score; nothing while counts are off
    toast(t(m === 1 ? "wellbeing.thanks" : "wellbeing.thanksLater"));
    onward();
  };

  return (
    <Screen close={skip} scroll title={t("wellbeing.title")} footer={<Btn testID="wellbeing-done" disabled={score === null} onPress={done}>{t("wellbeing.done")}</Btn>} contentStyle={{ gap: 16 }}>
      <Eyebrow>{t("wellbeing.eyebrow")}</Eyebrow>
      <Host pose={p.gentle === "1" ? "heart" : m === 1 ? "wave" : "think"}>{p.gentle === "1" && m === 1 ? tg("gentle.wellbeing.intro") : t(intro)}</Host>
      <Text style={type.body(14)}>{t("wellbeing.ask")}</Text>
      <Text style={type.caption(12)}>{t("wellbeing.legend")}</Text>
      <View style={{ gap: 10 }}>
        {WHO5_ITEMS.map((item, i) => {
          const label = t(`wellbeing.item.${item}` as Key);
          const v = answers[i];
          return (
            <View key={item} testID={`who5-${item}`} accessibilityRole="radiogroup" accessibilityLabel={label}
              style={{ backgroundColor: color.white, borderWidth: 1.5, borderColor: v === null ? color.line : color.ink, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14, gap: 10 }}>
              <Text style={type.choice()}>{label}</Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                {WHO5_SCALE.map((n) => {
                  const on = v === n;
                  const word = t(`wellbeing.scale.${n}` as Key);
                  return (
                    <Pressable key={n} testID={`who5-${item}-${n}`} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={t("wellbeing.pickA11y", { item: label, label: word })}
                      onPress={() => setAnswers((a) => a.map((x, k) => (k === i ? n : x)))}
                      style={({ pressed }) => [{ flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1.5, borderColor: on ? color.ink : color.line, backgroundColor: on ? color.gold : color.cream, transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
                      <Text style={{ fontFamily: font.text[700], fontSize: 15, color: color.ink }}>{n}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text accessibilityLiveRegion="polite" style={[type.caption(12), { minHeight: 17, color: v === null ? color.mute : color.ink }]}>{v === null ? " " : t(`wellbeing.scale.${v}` as Key)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={type.caption(12)}>{t("wellbeing.privacy")}</Text>
      <View style={{ alignItems: "center", paddingBottom: 8 }}><Link label={t("wellbeing.skipA11y")} onPress={skip}>{t("wellbeing.skip")}</Link></View>
    </Screen>
  );
}
