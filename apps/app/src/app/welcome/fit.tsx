import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { DOORS, label } from "@ih/content";
import { depthFor, type Openness } from "@/lib/profile";
import { doorParam } from "@/lib/door-param";
import { useStore } from "@/lib/store";
import { Btn, Card, Eyebrow, color, font, type } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// "Here's how we'll walk it with you": the profile, said back in plain words (never as scores).
export default function Fit() {
  useEffect(() => { track("onboard_step", { step: "fit" }); }, []);
  useTitle("your path");
  const { door: raw } = useLocalSearchParams<{ door?: string }>();
  const door = doorParam(raw) !== "SPIRITUAL" ? doorParam(raw) : null;
  const { saved, update } = useStore();
  const p = saved.settings.profile?.door === door ? saved.settings.profile : null;
  useEffect(() => { if (!door || !p) router.replace("/welcome/door"); }, [door, p]);
  if (!door || !p) return null;
  const name = label(door);
  const depth = {
    new: [`from the very beginning`, `what each word means, where it comes from, and how people actually live it.`],
    some: [`past the basics`, `you know the words; we'll go into why they're said and what's underneath.`],
    deep: [`deep, quickly`, `you know this well. expect sources, history, and the questions people still argue about.`],
  }[depthFor(p)];
  const open: Record<Openness, [string, string]> = {
    stay: [`just ${name}`, `we won't bring up other traditions. ask the Guide any time if you're curious.`],
    sometimes: [`${name}, with the odd window`, `now and then, when another tradition has a similar word, we'll mention it and ask if you want more. say no once and we'll stop.`],
    love: [`${name}, and its neighbors`, `when another tradition has a similar idea, we'll show you. your path stays ${name}.`],
  };
  const setOpen = (o: Openness) => update({ profile: { ...p, openness: o } });
  const rows: [string, string, string][] = [["how deep", ...depth] as [string, string, string], ["other traditions", ...open[p.openness]] as [string, string, string]];
  // Grew up in it, not sure they believe (or left): the roots, walked with fresh eyes (welcome/you → door). DRAFT copy.
  if (p.answers.lens === "fresh") rows.unshift(["how we'll hold it", "with fresh eyes", `${name} as history, stories and practice. nothing here asks you to believe — bring your questions.`]);
  return (
    <WelcomeFrame step={6} door={door} footer={<Btn testID="fit-continue" onPress={() => router.push({ pathname: "/welcome/voice", params: { door } })}>Sounds right</Btn>}>
      <Host>{`Here's how we'll walk ${name} with you.`}</Host>
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
          <Btn key={o} kind="ghost" style={{ minHeight: 40, paddingHorizontal: 14 }} onPress={() => setOpen(o)}>{o === "stay" ? "keep it to my path" : o === "sometimes" ? "only now and then" : "show me neighbors"}</Btn>
        ))}
      </View>
      <Text style={[type.caption(), { textAlign: "center" }]}>change any of this in You, any time. private to you.</Text>
    </WelcomeFrame>
  );
}
