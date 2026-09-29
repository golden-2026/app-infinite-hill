import { useTitle } from "@/lib/title";
// A practice from the companion: the steps, a gentle timer for the timed ones, the mascot, then "done".
// Never scored and never earns light (the brand book: prayer, the breath and the sit never count).
import { label } from "@ih/content";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { practiceById } from "@/content/practices";
import { markDone } from "@/lib/companion/memory";
import { bell } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { successHaptic } from "@/lib/haptics";
import { Btn, Guy, Screen, color, font, toast, type } from "@/ui";
import { KIND_WORD, poseFor } from "@/ui/companion";

const TIMED = new Set(["breath", "sit", "rest", "walk", "move"]);
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function PracticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = practiceById(typeof id === "string" ? id : null);
  useTitle(p ? p.title : "practice");
  const { today } = useStore();
  const [left, setLeft] = useState<number | null>(null); // seconds left while the timer runs
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  if (!p) {
    return (
      <Screen back="today" title="not found." contentStyle={{ gap: 12 }}>
        <Text style={type.body()}>that practice isn't here anymore.</Text>
      </Screen>
    );
  }
  const timed = TIMED.has(p.kind);
  const start = () => {
    bell();
    setLeft(p.minutes * 60);
    timer.current = setInterval(() => setLeft((s) => {
      if (s === null || s <= 1) { if (timer.current) clearInterval(timer.current); bell(); return 0; }
      return s - 1;
    }), 1000);
  };
  const finish = () => {
    if (timer.current) clearInterval(timer.current);
    markDone(p.id, today);
    successHaptic();
    toast("done. kept on your phone.");
    if (router.canGoBack()) router.back(); else router.replace("/today");
  };
  const running = left !== null && left > 0;
  return (
    <Screen scroll back="today" title={`${p.title}.`} contentStyle={{ gap: 14 }}
      footer={
        <View style={{ gap: 8 }}>
          {timed && left === null ? <Btn kind="gold" onPress={start} label={`start a ${p.minutes} minute timer`}>{`start · ${p.minutes} min`}</Btn> : null}
          <Btn kind={timed && left === null ? "ghost" : "ink"} onPress={finish}>{running ? "done early" : "done"}</Btn>
        </View>
      }>
      <Text style={[type.eyebrow(8)]}>{p.minutes} min · {KIND_WORD[p.kind]}{p.door ? ` · ${label(p.door)}` : " · every door"}</Text>
      <View style={{ alignItems: "center", paddingVertical: 4 }}>
        <Guy pose={poseFor(p)} h={140} />
        {left !== null ? (
          <Text accessibilityLiveRegion="polite" accessibilityLabel={left > 0 ? `${Math.ceil(left / 60)} minutes left` : "time's up"} style={{ fontFamily: font.display[800], fontSize: 34, color: color.ink, marginTop: 6 }}>
            {left > 0 ? mmss(left) : "that's it."}
          </Text>
        ) : null}
      </View>
      <View style={{ gap: 10 }}>
        {p.steps.map((step, n) => (
          <View key={n} style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: color.ink, alignItems: "center", justifyContent: "center", marginTop: 1 }}>
              <Text style={{ fontFamily: font.text[700], fontSize: 12, color: color.gold }}>{n + 1}</Text>
            </View>
            <Text style={[type.serif(17), { flex: 1 }]}>{step}</Text>
          </View>
        ))}
      </View>
      <Text style={[type.body(13), { color: color.mute }]}>why: {p.why}</Text>
      <Text style={[type.caption(11)]}>draft · not yet checked by a keeper. nothing here is scored.</Text>
    </Screen>
  );
}
