import { useTitle } from "@/lib/title";
import { DOORS } from "@ih/content";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useDone } from "@/lib/done";
import { ChevronRight } from "@/ui/tab-icons";
import { useStore } from "@/lib/store";
import { Btn, Eyebrow, Guy, Screen, color, font, toast, type } from "@/ui";

// v175 PostLesson step 9: did it land? + what do you want tomorrow. Every answer is kept (signals, book).
export default function Landed() {
  useTitle("did it land");
  const { p, day, go, close } = useDone();
  const { saved, update, keepLine, addSignal, today } = useStore();
  const [verdict, setVerdict] = useState<string | null>(null);
  const visiting = saved.settings.active === "visit";
  const signal = (next: string | null) => {
    addSignal({ door: p.door, day, verdict: verdict || "skip", next, date: today });
    if (verdict === "keep" && p.carry) { keepLine(p.carry, p.door); toast("kept in your book"); }
    if (next === "home") update({ active: "home" });
    if (next === "nearby") {
      const others = DOORS.map(([, w]) => w).filter((w) => w !== p.door && w !== saved.settings.homeWing);
      update({ visitWing: others[Math.floor(Math.random() * others.length)] }); // offered on Today; your door stays active
    }
    go(p.newDay === "1" ? "/done/light" : "/done/lit");
  };
  const V: [string, string, string][] = [["keep", "keep it", color.gold], ["ok", "it was fine", "#fff"], ["no", "not for me", "#fff"]];
  const N: [string, string][] = [["more", verdict === "no" ? "something different from this door" : "more like this"], ["home", visiting ? "back to my own door" : "keep walking my door"], ["nearby", "a door nearby · surprise me"]];
  return (
    <Screen close={close} footer={verdict ? undefined : <Btn kind="ghost" onPress={() => signal(null)}>skip</Btn>}>
      <View style={{ flex: 1, justifyContent: "center", gap: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}><Eyebrow>did it land?</Eyebrow><Guy pose="wonder" h={96} /></View>
        <Text style={type.h1(30)}>{p.word}.</Text>
        <Text style={[type.body(15), { color: color.mute }]}>{p.carry ? `“${p.carry}”` : "the line you took with you."}</Text>
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
            <Eyebrow style={{ marginTop: 18 }}>tomorrow, what do you want?</Eyebrow>
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
