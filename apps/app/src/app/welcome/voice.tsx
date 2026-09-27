import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { Text } from "react-native";
import { data, icon, label } from "@ih/content";
import { doorParam } from "@/lib/door-param";
import { voiceLabel } from "@/lib/voice";
import { Body, Btn, Face, color, font } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// Who reads your lessons. A named voice (photo, bio) only once their licence is signed; otherwise the truth:
// the house voice, reading drafts that no Keeper has reviewed yet.
export default function MeetVoice() {
  useEffect(() => { track("onboard_step", { step: "voice" }); }, []);
  useTitle("your voice");
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw) || "SPIRITUAL"; // unknown doors in a URL never get saved
  const ic = icon(door);
  const v = voiceLabel(door, ic.short);
  return (
    <WelcomeFrame step={5} door={door} footer={<Btn testID="lets-go" onPress={() => router.push({ pathname: "/welcome/ready", params: { door } })}>Let's go</Btn>}>
      {v.licensed ? (
        <Host door={door}>
          Meet your voice. <Text style={{ fontFamily: font.display[800] }}>{ic.name}</Text> — {data.BIO[ic.wing]}. {v.claim}
        </Host>
      ) : (
        <Host>{`Your ${label(door)} lessons are read by the house voice for now. A named voice comes only once they've signed and recorded.`}</Host>
      )}
      <Face ic={ic} w={"100%" as any} h={200} r={22} big />
      <Body size={13} style={{ color: color.mute }}>
        The path is long on purpose: <Text style={{ color: color.ink, fontFamily: font.text[600] }}>five camps this year</Text> — first steps, the stories, the practices, the text, the depths — and the deep texts for years after.
        {v.licensed ? "" : " These lessons are pilot drafts: no Keeper has reviewed them yet."}
      </Body>
    </WelcomeFrame>
  );
}
