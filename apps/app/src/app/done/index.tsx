import { useTitle } from "@/lib/title";
import { art } from "@ih/brand";
import { DOORS, icon, pos } from "@ih/content";
import { campLabel, campName, t } from "@/i18n";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { lookoutArt, SUMMIT_ART } from "@/content/journeys";
import { useDone } from "@/lib/done";
import { FADE } from "@/ui/fade";
import { speakChrome } from "@/lib/sound";
import { bridgeFor } from "@/lib/profile";
import { useStore } from "@/lib/store";
import { ChevronRight } from "@/ui/tab-icons";
import { Btn, Eyebrow, Face, Guy, Screen, color, font, toast, type } from "@/ui";

// The finish, step 1 of 3 (owner brief 2026-10-01, after Duolingo's lesson that the end of a session is what brings
// people back): what you just did. The day, the word, the line to carry, and one light question, "did it land?",
// whose answer is kept (signals, book). This was two screens (proud of you + did it land); now it's one.
// Then: the streak moving (/done/light → /done/lit), then tomorrow (/done/tomorrow).
export default function Carry() {
  useTitle(t("session.done.title"));
  const { p, day, go, close } = useDone();
  const { saved, update, keepLine, addSignal, today } = useStore();
  const [verdict, setVerdict] = useState<string | null>(null);
  const ic = icon(p.door);
  const said = day === 1 ? t("session.done.one") : String(day);
  useEffect(() => { speakChrome(t("session.done.say", { said }), saved.settings.voiceOn); }, [said, saved.settings.voiceOn]);
  // the last day of a camp (or a year): you've reached its lookout, so show the view
  const at = pos(day);
  const summit = /^Year ([5-9]|\d\d)/.test(at.camp);
  const view = at.lesson === at.of ? art(summit ? SUMMIT_ART : lookoutArt(at.camp)) : null;
  const visiting = saved.settings.active === "visit";

  const signal = (next: string | null) => {
    addSignal({ door: p.door, day, verdict: verdict || "skip", next, date: today });
    const bridgeNext = next !== "nearby" && !!bridgeFor(saved.settings.profile ?? null, p.door, p.word, today);
    // the toast would sit over the bridge screen's buttons, so it only shows when no bridge follows
    if (verdict === "keep" && p.carry) { keepLine(p.carry, p.door); if (!bridgeNext) toast(t("session.landed.kept")); }
    if (next === "home") update({ active: "home" });
    if (next === "nearby") {
      const others = DOORS.map(([, w]) => w).filter((w) => w !== p.door && w !== saved.settings.homeWing);
      update({ visitWing: others[Math.floor(Math.random() * others.length)] }); // offered on Today; your door stays active
    }
    // A "similar idea, next door" offer only for people who said they're open to it (see lib/profile bridgeFor).
    if (bridgeNext) go("/done/bridge");
    else go(p.newDay === "1" ? "/done/light" : "/done/lit");
  };
  const stayOnly = saved.settings.profile?.openness === "stay";
  const V: [string, string, string][] = [["keep", t("session.landed.keep"), color.gold], ["ok", t("session.landed.fine"), "#fff"], ["no", t("session.landed.no"), "#fff"]];
  // "a door nearby" puts another religion in front of someone, so it's never offered to people who want to stay on their path.
  const N: [string, string][] = [["more", verdict === "no" ? t("session.landed.different") : t("session.landed.more")], ["home", visiting ? t("session.landed.backHome") : t("session.landed.keepWalking")], ...(stayOnly ? [] : [["nearby", t("session.landed.nearby")] as [string, string]])];
  const title = day === 21 ? t("session.done.camp1") : day % 7 === 0 ? t("session.done.week", { n: day / 7 }) : t("session.done.day", { said });

  return (
    <Screen close={close} scroll footer={<Btn testID="continue" onPress={() => signal(null)}>{t("session.continue")}</Btn>} contentStyle={{ flexGrow: 1, justifyContent: "center", gap: 14 }}>
      {view ? (
        <View accessibilityLabel={t(summit ? "session.done.summitA11y" : "session.done.lookoutA11y", { camp: campLabel(at.camp).toLowerCase() })} style={{ width: "100%", height: 190, borderRadius: 20, borderWidth: 1.5, borderColor: color.ink, overflow: "hidden", backgroundColor: color.ink }}>
          <Image source={view.src} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} contentFit="cover" contentPosition={{ top: "22%", left: "50%" }} transition={FADE} accessible={false} />
          <LinearGradient pointerEvents="none" colors={["rgba(10,10,10,0)", "rgba(10,10,10,0.8)"]} locations={[0.5, 1]} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
          <Guy pose="jump" h={110} style={{ position: "absolute", right: 12, bottom: 8 }} />
          <Text style={[type.eyebrow(10), { position: "absolute", left: 14, bottom: 12, color: color.gold, maxWidth: "60%" }]}>{summit ? t("session.done.summit") : t("session.done.lookout", { camp: campLabel(at.camp), name: campName(at.camp, at.name) })}</Text>
        </View>
      ) : (
        <View style={{ alignItems: "center" }}>{day === 21 ? <Guy pose="jump" h={130} /> : day % 7 === 0 ? <Guy pose="joy" h={130} /> : <Face ic={ic} w={104} h={104} r={52} caption={false} big />}</View>
      )}
      <View style={{ alignItems: "center", gap: 4 }}>
        <Text accessibilityRole="header" style={[type.title(), { textAlign: "center" }]}>{title}</Text>
        <Text style={[type.body(15), { textAlign: "center", color: color.mute }]}>{t("session.carry.proud", { min: p.minutes })}</Text>
      </View>

      {/* the word and the line: what they take with them */}
      <View testID="carry-card" style={{ backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.ink, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 18, gap: 6 }}>
        <Eyebrow>{t("session.carry.eyebrow")}</Eyebrow>
        <Text style={type.h1(30)}>{p.word}.</Text>
        <Text style={[type.body(16), { fontStyle: "italic" }]}>{p.carry ? `“${p.carry}”` : t("session.landed.lineFallback")}</Text>
      </View>

      <Eyebrow style={{ marginTop: 4 }}>{t("session.landed.ask")}</Eyebrow>
      <View style={{ flexDirection: "row", gap: 8 }} accessibilityRole="radiogroup">
        {V.map(([v, l, bg]) => (
          <Pressable key={v} testID={`land-${v}`} accessibilityLabel={l} accessibilityRole="radio" accessibilityState={{ checked: verdict === v }} aria-checked={verdict === v} onPress={() => setVerdict(verdict === v ? null : v)}
            style={{ flex: 1, alignItems: "center", justifyContent: "center", minHeight: 48, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 16, backgroundColor: verdict === v ? bg : "#fff", borderWidth: 1.5, borderColor: verdict === v ? color.ink : color.line }}>
            <Text style={{ fontFamily: font.text[600], fontSize: 13, color: color.ink, textAlign: "center" }}>{l}</Text>
          </Pressable>
        ))}
      </View>
      {verdict ? (
        <>
          <Eyebrow style={{ marginTop: 4 }}>{t("session.landed.tomorrow")}</Eyebrow>
          <View style={{ gap: 8 }}>
            {N.map(([nx, l]) => (
              <Pressable key={nx} accessibilityRole="button" onPress={() => signal(nx)} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.line, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16 }}>
                <Text style={{ fontFamily: font.display[500], fontSize: 15, color: color.ink }}>{l}</Text><ChevronRight color={color.ink} />
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}
