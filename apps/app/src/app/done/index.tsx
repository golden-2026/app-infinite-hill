import { useTitle } from "@/lib/title";
import { art } from "@ih/brand";
import { icon, pos } from "@ih/content";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { lookoutArt, SUMMIT_ART } from "@/content/journeys";
import { useDone } from "@/lib/done";
import { FADE } from "@/ui/fade";
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
  // the last day of a camp (or a year): you've reached its lookout, so show the view
  const at = pos(day);
  const summit = /^Year ([5-9]|\d\d)/.test(at.camp);
  const view = at.lesson === at.of ? art(summit ? SUMMIT_ART : lookoutArt(at.camp)) : null;
  return (
    <Screen close={close} footer={<Btn testID="continue" onPress={() => go("/done/landed")}>continue</Btn>}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
        {view ? (
          <View accessibilityLabel={`${summit ? "The summit" : "The lookout"} at the end of ${at.camp.toLowerCase()}`} style={{ width: "100%", height: 230, borderRadius: 20, borderWidth: 1.5, borderColor: color.ink, overflow: "hidden", backgroundColor: color.ink }}>
            <Image source={view.src} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} contentFit="cover" contentPosition={{ top: "22%", left: "50%" }} transition={FADE} accessible={false} />
            <LinearGradient pointerEvents="none" colors={["rgba(10,10,10,0)", "rgba(10,10,10,0.8)"]} locations={[0.5, 1]} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
            <Guy pose="jump" h={120} style={{ position: "absolute", right: 12, bottom: 8 }} />
            <Text style={[type.eyebrow(10), { position: "absolute", left: 14, bottom: 12, color: color.gold, maxWidth: "60%" }]}>{summit ? "the summit · five years of trail" : `the lookout · ${at.camp} · ${at.name}`}</Text>
          </View>
        ) : day === 21 ? <Guy pose="jump" h={170} /> : day % 7 === 0 ? <Guy pose="joy" h={170} /> : <Face ic={ic} w={140} h={140} r={70} caption={false} big />}
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
