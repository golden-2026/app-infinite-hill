import { useTitle } from "@/lib/title";
import { icon } from "@ih/content";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { useDone } from "@/lib/done";
import { speak } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { Btn, Face, Guy, Screen, color, font, type } from "@/ui";

// v175 PostLesson step 0: proud of you.
export default function Proud() {
  useTitle("day done");
  const { p, day, go, close } = useDone();
  const { saved } = useStore();
  const ic = icon(p.door);
  const said = day === 1 ? "one" : String(day);
  useEffect(() => { speak(`you did day ${said}. proud of you. see you tomorrow.`, saved.settings.voiceOn); }, [said, saved.settings.voiceOn]);
  const tiles: [string, string][] = [[`${p.right}/${p.total}`, "first try"], [p.word, "yours now"], [`${p.minutes} min`, "that's it"]];
  return (
    <Screen close={close} footer={<Btn testID="continue" onPress={() => go("/done/landed")}>continue</Btn>}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
        {day === 21 ? <Guy pose="jump" h={170} /> : day % 7 === 0 ? <Guy pose="joy" h={170} /> : <Face ic={ic} w={140} h={140} r={70} caption={false} big />}
        <Text accessibilityRole="header" style={[type.title(), { marginTop: 8, textAlign: "center" }]}>{day === 21 ? "camp one. done." : day % 7 === 0 ? `week ${day / 7}. yours.` : `you did day ${said}.`}</Text>
        <Text style={[type.body(16), { textAlign: "center" }]}>proud of you. see you tomorrow.{"\n"}<Text style={{ color: color.mute }}>— {ic.short}</Text></Text>
        <View style={{ flexDirection: "row", gap: 8, width: "100%", marginTop: 18 }}>
          {tiles.map(([n, l]) => (
            <View key={l} style={{ flex: 1, backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.ink, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, alignItems: "center" }}>
              <Text style={{ fontFamily: font.display[800], fontSize: 20, color: color.ink }} numberOfLines={1} adjustsFontSizeToFit>{n}</Text>
              <Text style={[type.eyebrow(8), { marginTop: 4 }]}>{l}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
