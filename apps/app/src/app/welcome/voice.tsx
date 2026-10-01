import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { icon } from "@ih/content";
import { t } from "@/i18n";
import { doorParam } from "@/lib/door-param";
import { voiceBio, voiceLabel } from "@/lib/voice";
import { Btn, Face, color, font, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

export default function MeetVoice() {
  useEffect(() => { track("onboard_step", { step: "voice" }); }, []);
  useTitle(t("onboarding.voice.title"));
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw) || "SPIRITUAL"; // unknown doors in a URL never get saved
  const ic = icon(door);
  const v = voiceLabel(door, ic.short);
  return (
    <WelcomeFrame step={7} door={door} footer={<Btn testID="lets-go" onPress={() => router.push({ pathname: "/welcome/ready", params: { door } })}>{t("onboarding.voice.go")}</Btn>}>
      <Host door={door}>
        {t("onboarding.voice.meet")}{" "}<Text style={{ fontFamily: font.display[800] }}>{ic.name}</Text>{" — "}{voiceBio(ic.wing)}{". "}{v.claim}
      </Host>
      <Face ic={ic} w={"100%" as any} h={260} r={22} big />
      <Text style={type.caption()}>
        {t("onboarding.voice.long")}<Text style={{ color: color.ink, fontFamily: font.text[600] }}>{t("onboarding.voice.camps")}</Text>{t("onboarding.voice.campList")}{" "}
        {v.licensed ? t("onboarding.voice.licensed", { name: ic.short }) : t("onboarding.voice.unlicensed", { name: ic.short })}{t("onboarding.voice.grewUp")}
      </Text>
    </WelcomeFrame>
  );
}
