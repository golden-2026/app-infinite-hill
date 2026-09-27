import { useTitle } from "@/lib/title";
import { label } from "@ih/content";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useDone } from "@/lib/done";
import { bridgeFor } from "@/lib/profile";
import { useStore } from "@/lib/store";
import { Btn, Card, Eyebrow, Screen, color, font, toast, type } from "@/ui";

// After a lesson, for people who said they're open to it: "another tradition has a similar idea — want more, or
// stay on your path?" Only ever an offer. "stay on my path" turns these off for good (changeable in You).
export default function Bridge() {
  useTitle("a similar idea");
  const { p, go, close } = useDone();
  const { saved, update, today } = useStore();
  const prof = saved.settings.profile ?? null;
  const [b] = useState(() => bridgeFor(prof, p.door, p.word, today));
  const [open, setOpen] = useState(false);
  const next = () => go(p.newDay === "1" ? "/done/light" : "/done/lit");
  useEffect(() => { if (!b) next(); }, [b]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!b || !prof) return null;

  const answer = (a: "more" | "later" | "stay") => {
    update({ profile: { ...prof, bridges: { ...prof.bridges, [b.bridge.id]: a }, lastBridgeOn: today, openness: a === "stay" ? "stay" : prof.openness } });
    if (a === "stay") toast(`got it — just ${label(p.door)}`);
  };
  return (
    <Screen close={close} footer={open
      ? <Btn onPress={next}>continue</Btn>
      : (
        <View style={{ gap: 8 }}>
          <Btn onPress={() => { answer("more"); setOpen(true); }}>tell me more</Btn>
          <Btn kind="ghost" onPress={() => { answer("stay"); next(); }}>{`stay on my path`}</Btn>
        </View>
      )}>
      <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
        <Eyebrow>a similar idea, next door</Eyebrow>
        <Text style={type.h1(26)}>{`${p.word} has cousins.`}</Text>
        <Text style={[type.body(15), { color: color.mute }]}>{`${b.bridge.idea} — ${label(p.door)} isn't the only tradition that found it.`}</Text>
        {open ? (
          <View style={{ gap: 10 }}>
            {b.others.map((o) => (
              <Card key={`${o.door}-${o.word}`}>
                <Eyebrow size={8}>{label(o.door)}</Eyebrow>
                <Text style={{ fontFamily: font.display[800], fontSize: 20, color: color.ink, marginTop: 4 }}>{o.word}</Text>
                <Text style={[type.body(14), { marginTop: 2 }]}>{o.gloss}</Text>
              </Card>
            ))}
            <Text style={[type.caption(), { textAlign: "center" }]}>{`similar, not the same. your path stays ${label(p.door)}.`}</Text>
          </View>
        ) : (
          <Text style={[type.body(15)]}>{`want to hear how ${b.others.map((o) => label(o.door)).join(", ").replace(/, ([^,]*)$/, " and $1")} put it — or stay on your path?`}</Text>
        )}
      </View>
    </Screen>
  );
}
