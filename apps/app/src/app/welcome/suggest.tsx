import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { Text, View } from "react-native";
import { label } from "@ih/content";
import { suggestFor } from "@/lib/profile";
import { useStore } from "@/lib/store";
import { Btn, Card, Eyebrow, color, font, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// What "my own path" draws on for this person: a few ideas from different traditions that match what they told us.
// Offered, never assigned: they stay on "my own path", and nobody is asked to choose a religion.
export default function Suggest() {
  useEffect(() => { track("onboard_step", { step: "suggest" }); }, []);
  useTitle("for you");
  const { saved } = useStore();
  const p = saved.settings.profile?.door === "SPIRITUAL" ? saved.settings.profile : null;
  const picks = useMemo(() => (p ? suggestFor(p.answers) : []), [p]);
  const keepAway = p?.answers.organized === "away";
  useEffect(() => { if (!p) router.replace("/welcome/intake"); }, [p]);
  if (!p) return null;
  return (
    <WelcomeFrame step={6} door="SPIRITUAL" footer={<Btn testID="suggest-continue" onPress={() => router.push({ pathname: "/welcome/voice", params: { door: "SPIRITUAL" } })}>Start my path</Btn>}>
      <Host>{keepAway ? "Thanks. No religion required here. A few old ideas that might help, from people who worked on the same things:" : "Thanks. Here are a few things from different traditions that might speak to you:"}</Host>
      <View style={{ gap: 10 }}>
        {picks.map((s) => (
          <Card key={`${s.door}-${s.word}`}>
            <Eyebrow size={8}>{`${label(s.door)} · ${s.bridge}`}</Eyebrow>
            <Text style={{ fontFamily: font.display[800], fontSize: 20, color: color.ink, marginTop: 4 }}>{s.word}</Text>
            <Text style={[type.body(14), { marginTop: 2 }]}>{s.gloss}</Text>
            <Text style={[type.body(13), { color: color.mute, marginTop: 6 }]}>{s.why}.</Text>
          </Card>
        ))}
      </View>
      <Text style={[type.caption(), { textAlign: "center" }]}>
        you don't have to pick a religion — now or ever. "my own path" draws a little from each, and you can ask the Guide about any of these.
      </Text>
    </WelcomeFrame>
  );
}
