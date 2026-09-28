import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { DOORS } from "@ih/content";
import { router, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { data, icon } from "@ih/content";
import { doorParam } from "@/lib/door-param";
import { voiceLabel } from "@/lib/voice";
import { Body, Btn, Face, color, font } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

export default function MeetVoice() {
  useEffect(() => { track("onboard_step", { step: "voice" }); }, []);
  useTitle("meet your voice");
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw) || "SPIRITUAL"; // unknown doors in a URL never get saved
  const ic = icon(door);
  const v = voiceLabel(door, ic.short);
  return (
    <WelcomeFrame step={7} door={door} footer={<Btn testID="lets-go" onPress={() => router.push({ pathname: "/welcome/ready", params: { door } })}>Let's go</Btn>}>
      <Host door={door}>
        Meet your voice. <Text style={{ fontFamily: font.display[800] }}>{ic.name}</Text> — {data.BIO[ic.wing]}. {v.claim}
      </Host>
      <Face ic={ic} w={"100%" as any} h={260} r={22} big />
      <Body size={13} style={{ color: color.mute }}>
        The path is long on purpose: <Text style={{ color: color.ink, fontFamily: font.text[600] }}>five camps this year</Text> — first steps, the stories, the practices, the text, the depths — and the deep texts for years after.{" "}
        {v.licensed ? `${ic.short}'s voice, every session` : `${ic.short} will read every session once they record`} — the faith they actually grew up in.
      </Body>
    </WelcomeFrame>
  );
}
