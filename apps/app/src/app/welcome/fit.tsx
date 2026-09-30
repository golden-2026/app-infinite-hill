import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { doorLabel, t } from "@/i18n";
import { depthFor, type Openness } from "@/lib/profile";
import { doorParam } from "@/lib/door-param";
import { useStore } from "@/lib/store";
import { Btn, Card, Eyebrow, color, font, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// "Here's how we'll walk it with you": the profile, said back in plain words (never as scores).
export default function Fit() {
  useEffect(() => { track("onboard_step", { step: "fit" }); }, []);
  useTitle(t("onboarding.fit.title"));
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw) !== "SPIRITUAL" ? doorParam(raw) : null;
  const { saved, update } = useStore();
  const p = saved.settings.profile?.door === door ? saved.settings.profile : null;
  useEffect(() => { if (!door || !p) router.replace("/welcome/door"); }, [door, p]);
  if (!door || !p) return null;
  const name = { door: doorLabel(door) };
  const depth = {
    new: [t("onboarding.fit.newH"), t("onboarding.fit.newB")],
    some: [t("onboarding.fit.someH"), t("onboarding.fit.someB")],
    deep: [t("onboarding.fit.deepH"), t("onboarding.fit.deepB")],
  }[depthFor(p)];
  const open: Record<Openness, [string, string]> = {
    stay: [t("onboarding.fit.stayH", name), t("onboarding.fit.stayB")],
    sometimes: [t("onboarding.fit.sometimesH", name), t("onboarding.fit.sometimesB")],
    love: [t("onboarding.fit.loveH", name), t("onboarding.fit.loveB", name)],
  };
  const setOpen = (o: Openness) => update({ profile: { ...p, openness: o } });
  const rows: [string, string, string][] = [[t("onboarding.fit.howDeep"), ...depth] as [string, string, string], [t("onboarding.fit.others"), ...open[p.openness]] as [string, string, string]];
  // Grew up in it, not sure they believe (or left): the roots, walked with fresh eyes (welcome/you → door). DRAFT copy.
  if (p.answers.lens === "fresh") rows.unshift([t("onboarding.fit.hold"), t("onboarding.fit.freshH"), t("onboarding.fit.freshB", name)]);
  return (
    <WelcomeFrame step={6} door={door} footer={<Btn testID="fit-continue" onPress={() => router.push({ pathname: "/welcome/voice", params: { door } })}>{t("onboarding.fit.continue")}</Btn>}>
      <Host>{t("onboarding.fit.host", name)}</Host>
      <View style={{ gap: 10 }}>
        {rows.map(([k, h, b]) => (
          <Card key={k}>
            <Eyebrow size={8}>{k}</Eyebrow>
            <Text style={{ fontFamily: font.display[800], fontSize: 20, color: color.ink, marginTop: 4 }}>{h}</Text>
            <Text style={[type.body(14), { color: color.mute, marginTop: 4 }]}>{b}</Text>
          </Card>
        ))}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {(["stay", "sometimes", "love"] as Openness[]).filter((o) => o !== p.openness).map((o) => (
          <Btn key={o} kind="ghost" style={{ minHeight: 40, paddingHorizontal: 14 }} onPress={() => setOpen(o)}>{o === "stay" ? t("onboarding.fit.btnStay") : o === "sometimes" ? t("onboarding.fit.btnSometimes") : t("onboarding.fit.btnLove")}</Btn>
        ))}
      </View>
      <Text style={[type.caption(), { textAlign: "center" }]}>{t("onboarding.fit.caption")}</Text>
    </WelcomeFrame>
  );
}
