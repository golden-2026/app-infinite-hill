import { useTitle } from "@/lib/title";
import { type ReactNode } from "react";
import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Body, Card, Eyebrow, Screen, color, font, type } from "@/ui";
import { KeeperDesk, Voices } from "@/ui/voices";

const Sec = ({ k, t, children }: { k: string; t: string; children: ReactNode }) => (
  <Card><Eyebrow>{k}</Eyebrow><Text style={{ fontFamily: font.display[800], letterSpacing: -0.44, fontSize: 22, marginTop: 6, lineHeight: 23, color: color.ink }}>{t}</Text><Body style={{ marginTop: 8 }}>{children}</Body></Card>
);

export default function Why() {
  useTitle("why infinite hill");
  return (
    <Screen scroll back="you" title="why infinite hill." contentStyle={{ gap: 12 }}>
      <LinearGradient colors={color.dusk} style={{ borderRadius: 20, padding: 16 }}>
        <Text style={[type.eyebrow(), { color: color.gold }]}>the reason</Text>
        <Text style={{ fontFamily: font.display[800], fontSize: 24, marginTop: 6, lineHeight: 25, color: "#fff" }}>everyone's anxious. everyone's online. <Text style={{ fontStyle: "italic" }}>nobody's okay.</Text></Text>
        <Text style={[type.body(), { color: "#ffffffdd", marginTop: 10 }]}>half of adults say they're lonely. we touch our phones 144 times a day. anxiety in young people has doubled since your older cousin was in school. and the robots are coming for the jobs we used to call ourselves by. Every tradition on earth spent thousands of years on exactly that question.</Text>
      </LinearGradient>
      <Sec k="the rule" t="The golden rule is undefeated.">Every path arrived at it on its own. We don't care which door you walk through — or whether you'd call it a door at all. We care that you have somewhere to sit. Hinduism, Christianity, Catholicism, Judaism, Islam, Buddhism, Sikhism — or none of them, just the practice. Read to you from each tradition's own texts. No sermon. Nobody asks what you believe.</Sec>
      <Sec k="why it'll work" t="people with a practice live longer and worry less.">Weekly practice is linked to a third lower mortality (Harvard, 2016), roughly five-fold lower suicide risk in the same cohort, and far lower rates of recurrent depression among high-risk adults (Columbia, 2014). Meditation programs reduce anxiety and depression with moderate evidence across 47 trials (Johns Hopkins, 2014). We don't claim infinite hill produces this. The research is about having a practice; we just make one easy to keep.</Sec>
      <Sec k="how we work" t="From the texts. Checked by scholars.">Every lesson is written from a tradition's own public-domain scripture, and each will be checked by a Keeper — a scholar of that tradition — before it's recorded. In the pilot, lessons are drafts no Keeper has reviewed yet, read by the house voice. We never write a prayer. We never blend traditions in a lesson. If you want, we'll show you where another tradition has a similar idea — never which is better.</Sec>
      <View style={{ marginVertical: 8 }}><Voices /></View>
      <View style={{ marginVertical: 8 }}><KeeperDesk /></View>
      <Sec k="how the money works" t="Conscious capitalism, or it's not worth doing.">The house is free forever. 0% of anything you give to a tradition touches us. The plan: every gift seeds a gift for someone who can't pay. No ads near practice. None of the paid plans or gifts are on sale during the pilot.</Sec>
      <Card><Eyebrow>founder</Eyebrow><Text style={[type.serif(22), { marginTop: 2 }]}>Shaan Sethi</Text><Body size={12} style={{ color: color.mute }}>Co-founder and former CEO of Jaanuu · Entrepreneur-in-Residence, Chadwick School · Rancho Palos Verdes</Body></Card>
      <Sec k="a note from Shaan" t="My mom walked ten thousand steps a day. In late 2025 she got sick, and two weeks later she was gone.">I wasn't ready. I was the one who had to explain to my son where she went, and watching his face at her funeral shattered me. On my first silent retreat I found out what had been holding me up the whole time: the quiet faith she handed me without ever forcing it. It held my family up too. Then I looked around at a generation lost in the scroll, not one of us prepared for the one fact coming for all of us — and built infinite hill to change how that goes. The sun on every screen is for her. To infinity and beyond.</Sec>
    </Screen>
  );
}
