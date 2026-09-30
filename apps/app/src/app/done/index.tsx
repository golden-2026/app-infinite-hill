import { useTitle } from "@/lib/title";
import { art } from "@ih/brand";
import { icon, pos } from "@ih/content";
import { campLabel, campName, t } from "@/i18n";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { lookoutArt, SUMMIT_ART } from "@/content/journeys";
import { useDone } from "@/lib/done";
import { FADE } from "@/ui/fade";
import { speakChrome } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { Btn, Face, Guy, Screen, color, font, type } from "@/ui";

// v175 PostLesson step 0: proud of you.
export default function Proud() {
  useTitle(t("session.done.title"));
  const { p, day, go, close } = useDone();
  const { saved } = useStore();
  const ic = icon(p.door);
  const said = day === 1 ? t("session.done.one") : String(day);
  useEffect(() => { speakChrome(t("session.done.say", { said }), saved.settings.voiceOn); }, [said, saved.settings.voiceOn]);
  const tiles: [string, string][] = [[`${p.right}/${p.total}`, t("session.tile.firstTry")], [p.word, t("session.done.yours")], [t("session.done.min", { n: p.minutes }), t("session.done.thatsIt")]];
  // the last day of a camp (or a year): you've reached its lookout, so show the view
  const at = pos(day);
  const summit = /^Year ([5-9]|\d\d)/.test(at.camp);
  const view = at.lesson === at.of ? art(summit ? SUMMIT_ART : lookoutArt(at.camp)) : null;
  return (
    <Screen close={close} footer={<Btn testID="continue" onPress={() => go("/done/landed")}>{t("session.continue")}</Btn>}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
        {view ? (
          <View accessibilityLabel={t(summit ? "session.done.summitA11y" : "session.done.lookoutA11y", { camp: campLabel(at.camp).toLowerCase() })} style={{ width: "100%", height: 230, borderRadius: 20, borderWidth: 1.5, borderColor: color.ink, overflow: "hidden", backgroundColor: color.ink }}>
            <Image source={view.src} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} contentFit="cover" contentPosition={{ top: "22%", left: "50%" }} transition={FADE} accessible={false} />
            <LinearGradient pointerEvents="none" colors={["rgba(10,10,10,0)", "rgba(10,10,10,0.8)"]} locations={[0.5, 1]} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
            <Guy pose="jump" h={120} style={{ position: "absolute", right: 12, bottom: 8 }} />
            <Text style={[type.eyebrow(10), { position: "absolute", left: 14, bottom: 12, color: color.gold, maxWidth: "60%" }]}>{summit ? t("session.done.summit") : t("session.done.lookout", { camp: campLabel(at.camp), name: campName(at.camp, at.name) })}</Text>
          </View>
        ) : day === 21 ? <Guy pose="jump" h={170} /> : day % 7 === 0 ? <Guy pose="joy" h={170} /> : <Face ic={ic} w={140} h={140} r={70} caption={false} big />}
        <Text accessibilityRole="header" style={[type.title(), { marginTop: 8, textAlign: "center" }]}>{day === 21 ? t("session.done.camp1") : day % 7 === 0 ? t("session.done.week", { n: day / 7 }) : t("session.done.day", { said })}</Text>
        <Text style={[type.body(16), { textAlign: "center" }]}>{t("session.done.proud")}{"\n"}<Text style={{ color: color.mute }}>— {ic.short}</Text></Text>
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
