import { useTitle } from "@/lib/title";
import { DOORS } from "@ih/content";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useDone } from "@/lib/done";
import { ChevronRight } from "@/ui/tab-icons";
import { bridgeFor } from "@/lib/profile";
import { useStore } from "@/lib/store";
import { Btn, Eyebrow, Guy, Screen, color, font, toast, type } from "@/ui";
import { t } from "@/i18n";

// v175 PostLesson step 9: did it land? + what do you want tomorrow. Every answer is kept (signals, book).
export default function Landed() {
  useTitle(t("session.landed.title"));
  const { p, day, go, close } = useDone();
  const { saved, update, keepLine, addSignal, today } = useStore();
  const [verdict, setVerdict] = useState<string | null>(null);
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
  return (
    <Screen close={close} footer={verdict ? undefined : <Btn kind="ghost" onPress={() => signal(null)}>{t("session.landed.skip")}</Btn>}>
      <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}><Eyebrow>{t("session.landed.ask")}</Eyebrow><Guy pose="wonder" h={96} /></View>
        <Text style={type.h1(30)}>{p.word}.</Text>
        <Text style={[type.body(15), { color: color.mute }]}>{p.carry ? `“${p.carry}”` : t("session.landed.lineFallback")}</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }} accessibilityRole="radiogroup">
          {V.map(([v, l, bg]) => (
            <Pressable key={v} accessibilityLabel={l} accessibilityRole="radio" accessibilityState={{ checked: verdict === v }} aria-checked={verdict === v} onPress={() => setVerdict(v)}
              style={{ flex: 1, alignItems: "center", paddingVertical: 14, paddingHorizontal: 8, borderRadius: 16, backgroundColor: verdict === v ? bg : "#fff", borderWidth: 1.5, borderColor: verdict === v ? color.ink : color.line }}>
              <Text style={{ fontFamily: font.text[600], fontSize: 13, color: color.ink }}>{l}</Text>
            </Pressable>
          ))}
        </View>
        {verdict ? (
          <>
            <Eyebrow style={{ marginTop: 18 }}>{t("session.landed.tomorrow")}</Eyebrow>
            <View style={{ gap: 8 }}>
              {N.map(([nx, l]) => (
                <Pressable key={nx} accessibilityRole="button" onPress={() => signal(nx)} style={{ flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.line, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 }}>
                  <Text style={{ fontFamily: font.display[500], fontSize: 16, color: color.ink }}>{l}</Text><ChevronRight color={color.ink} />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </View>
    </Screen>
  );
}
