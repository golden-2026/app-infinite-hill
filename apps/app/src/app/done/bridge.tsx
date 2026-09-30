import { useTitle } from "@/lib/title";
import { doorLabel, t } from "@/i18n";
import { doorList, theDoor } from "@/lib/share-card";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useDone } from "@/lib/done";
import { bridgeFor } from "@/lib/profile";
import { useStore } from "@/lib/store";
import { Btn, Card, Eyebrow, Screen, color, font, toast, type } from "@/ui";

// After a lesson, for people who said they're open to it: "another tradition has a similar idea — want more, or
// stay on your path?" Only ever an offer. "stay on my path" turns these off for good (changeable in You).
export default function Bridge() {
  useTitle(t("session.bridge.title"));
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
    if (a === "stay") toast(t("session.bridge.stayToast", { door: doorLabel(p.door) }));
  };
  return (
    <Screen close={close} footer={open
      ? <Btn onPress={next}>{t("session.continue")}</Btn>
      : (
        <View style={{ gap: 8 }}>
          <Btn onPress={() => { answer("more"); setOpen(true); }}>{t("session.bridge.more")}</Btn>
          <Btn kind="ghost" onPress={() => { answer("stay"); next(); }}>{t("session.bridge.stay")}</Btn>
        </View>
      )}>
      <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
        <Eyebrow>{t("session.bridge.eyebrow")}</Eyebrow>
        <Text style={type.h1(26)}>{t("session.bridge.cousins", { word: p.word })}</Text>
        <Text style={[type.body(15), { color: color.mute }]}>{t("session.bridge.idea", { idea: b.bridge.idea, door: theDoor(p.door) })}</Text>
        {open ? (
          <View style={{ gap: 10 }}>
            {b.others.map((o) => (
              <Card key={`${o.door}-${o.word}`}>
                <Eyebrow size={8}>{doorLabel(o.door)}</Eyebrow>
                <Text style={{ fontFamily: font.display[800], fontSize: 20, color: color.ink, marginTop: 4 }}>{o.word}</Text>
                <Text style={[type.body(14), { marginTop: 2 }]}>{o.gloss}</Text>
              </Card>
            ))}
            <Text style={[type.caption(), { textAlign: "center" }]}>{t("session.bridge.similar", { door: theDoor(p.door) })}</Text>
          </View>
        ) : (
          <Text style={[type.body(15)]}>{t("session.bridge.ask", { list: doorList(b.others.map((o) => o.door)) })}</Text>
        )}
      </View>
    </Screen>
  );
}
