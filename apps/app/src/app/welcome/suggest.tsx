import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { doorLabel, t } from "@/i18n";
import { suggestFor } from "@/lib/profile";
import { useStore } from "@/lib/store";
import { Btn, Card, Eyebrow, color, font, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// What "my own path" draws on for this person: a few ideas from different traditions that match what they told us.
// Offered, never assigned: they stay on "my own path", and nobody is asked to choose a religion.
export default function Suggest() {
  useEffect(() => { track("onboard_step", { step: "suggest" }); }, []);
  useTitle(t("onboarding.suggest.title"));
  const { saved, today, update } = useStore();
  const p = saved.settings.profile?.door === "SPIRITUAL" ? saved.settings.profile : null;
  const picks = useMemo(() => (p ? suggestFor(p.answers) : []), [p]);
  const keepAway = p?.answers.organized === "away";
  useEffect(() => { if (!p) router.replace("/welcome/intake"); }, [p]);
  if (!p) return null;
  return (
    <WelcomeFrame step={6} door="SPIRITUAL" footer={<Btn testID="suggest-continue" onPress={() => router.push({ pathname: "/welcome/voice", params: { door: "SPIRITUAL" } })}>{t("onboarding.startMyPath")}</Btn>}>
      <Host>{keepAway ? t("onboarding.suggest.hostAway") : t("onboarding.suggest.host")}</Host>
      <View style={{ gap: 10 }}>
        {picks.map((s) => (
          <Card key={`${s.door}-${s.word}`}>
            <Eyebrow size={8}>{`${doorLabel(s.door)} · ${s.bridge}`}</Eyebrow>
            <Text style={{ fontFamily: font.display[800], fontSize: 20, color: color.ink, marginTop: 4 }}>{s.word}</Text>
            <Text style={[type.body(14), { marginTop: 2 }]}>{s.gloss}</Text>
            <Text style={[type.body(13), { color: color.mute, marginTop: 6 }]}>{s.why}.</Text>
          </Card>
        ))}
      </View>
      <Text style={[type.caption(), { textAlign: "center" }]}>
        {t("onboarding.suggest.caption")}
      </Text>
      {/* the sampler week (content/sampler.ts): seven doors, one lesson a day, alongside their own path; it waits on Today */}
      {saved.settings.sampler ? (
        <Text testID="suggest-sampler-on" accessibilityLiveRegion="polite" style={[type.body(14), { textAlign: "center", color: color.ink }]}>✓ {t("companion.sampler.suggestOn")}</Text>
      ) : (
        <Pressable testID="suggest-sampler" accessibilityRole="button" onPress={() => update({ sampler: { on: today } })} style={{ minHeight: 44, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontFamily: font.text[600], fontSize: 14, color: color.ink, textDecorationLine: "underline" }}>{t("companion.sampler.suggest")}</Text>
        </Pressable>
      )}
    </WelcomeFrame>
  );
}
