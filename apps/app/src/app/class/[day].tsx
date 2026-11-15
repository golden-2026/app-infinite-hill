import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ClassDay } from "@/content/classes/hindu-month1";
import { classMonth } from "@/content/classes/months";
import { readJSON, writeJSON } from "@/lib/storage";
import { hush, speak } from "@/lib/sound";
import { play } from "@/lib/fx";
import { successHaptic, tapHaptic } from "@/lib/haptics";
import { Btn, CloseButton, Guy, color, font, type } from "@/ui";

// One class in the new shape: your life → the story → the takeaway → try it → your call → go explore → go deeper.
// Class is for learning; practice happens on the mountain, so the class ends with places to go (owner, 2026-10-20).
type Step = { key: string; label: string };
const STEPS: Step[] = [
  { key: "life", label: "your life" },
  { key: "story", label: "the story" },
  { key: "take", label: "the takeaway" },
  { key: "try", label: "try it" },
  { key: "call", label: "your call" },
  { key: "explore", label: "before your next class" },
  { key: "deeper", label: "go deeper" },
];

const sayable = (c: ClassDay, k: string) =>
  k === "life" ? `${c.life[0]} ${c.life[1]}` : k === "story" ? `${c.story[0]}. ${c.story[1]}` : k === "take" ? `${c.take[0]} ${c.take[1]}` : k === "try" ? `${c.word ? `${c.word[0]}. ${c.word[2]} ` : ""}${c.tryit}` : "";

export default function ClassScreen() {
  const { day: raw, home } = useLocalSearchParams<{ day?: string; home?: string }>();
  const M = classMonth(home);
  const DAYS = M.days;
  const n = Math.min(Math.max(parseInt(String(raw || "1"), 10) || 1, 1), DAYS.length);
  const c = DAYS[n - 1];
  useTitle(`${M.land} · day ${n} · ${c.title}`);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [voice, setVoice] = useState(false);
  const step = STEPS[i];
  useEffect(() => { setI(0); setPick(null); setOpen(null); }, [n, M.key]);
  useEffect(() => () => hush(), []);
  useEffect(() => { hush(); const line = sayable(c, step.key); if (voice && line) speak(line, true); }, [i, n, voice]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => { hush(); router.canGoBack() ? router.back() : router.replace({ pathname: "/class", params: { home: M.key } }); };
  const finish = () => {
    const done = readJSON<number[]>(M.doneKey, []);
    if (!done.includes(n)) writeJSON(M.doneKey, [...done, n]);
    play("reward");
    successHaptic();
    hush();
    if (n < DAYS.length) router.replace({ pathname: "/class/[day]", params: { day: String(n + 1), home: M.key } });
    else router.replace({ pathname: "/class", params: { home: M.key } });
  };
  const next = () => (i < STEPS.length - 1 ? setI(i + 1) : finish());

  const big = (s: string) => <Text accessibilityRole="header" style={[type.h1(26), { color: "#fff" }]}>{s}</Text>;
  const body = (s: string) => <Text style={[type.body(17), { color: "#ffffffe6", lineHeight: 27 }]}>{s}</Text>;
  const card = (children: React.ReactNode) => <View style={{ backgroundColor: "#ffffff12", borderRadius: 16, padding: 14, gap: 4 }}>{children}</View>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.ink }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingTop: 4 }}>
        <CloseButton dark onPress={close} />
        <View style={{ flex: 1, flexDirection: "row", gap: 4 }} accessibilityLabel={`step ${i + 1} of ${STEPS.length}`}>
          {STEPS.map((s, k) => <View key={s.key} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: k <= i ? color.gold : "#ffffff26" }} />)}
        </View>
        <Pressable testID="class-voice" accessibilityRole="switch" accessibilityState={{ checked: voice }} accessibilityLabel="read it to me" hitSlop={8}
          onPress={() => { tapHaptic(); if (voice) hush(); setVoice(!voice); }}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: voice ? color.gold : "#ffffff1a" }}>
          <Text style={{ fontFamily: font.text[600], fontSize: 12, color: voice ? color.ink : "#fff" }}>{voice ? "voice on" : "voice off"}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 24, gap: 16 }}>
        <View style={{ gap: 2 }}>
          <Text style={[type.eyebrow(8), { color: color.gold }]}>{`day ${n} · ${step.label}`}</Text>
          <Text style={[type.body(13), { color: "#ffffff99" }]}>{c.title}</Text>
        </View>

        {step.key === "life" ? <>{big(c.life[0])}{body(c.life[1])}<Guy pose="think" h={130} style={{ alignSelf: "center", marginTop: 8 }} /></> : null}
        {step.key === "story" ? <>{big(c.story[0])}{body(c.story[1])}</> : null}
        {step.key === "take" ? <>{big(c.take[0])}{body(c.take[1])}</> : null}
        {step.key === "try" ? (
          <>
            {big(c.word ? "A word worth keeping" : "Try it")}
            {c.word ? card(<>
              <Text style={{ fontFamily: font.text[600], fontSize: 22, color: color.gold }}>{c.word[0]}</Text>
              <Text style={[type.body(14), { color: "#ffffffaa" }]}>{c.word[1]}</Text>
              <Text style={[type.body(14), { color: "#ffffffcc" }]}>{c.word[2]}</Text>
            </>) : null}
            {body(c.tryit)}
          </>
        ) : null}
        {step.key === "call" ? (
          <>
            {big(c.question)}
            <View style={{ gap: 8 }}>
              {c.options.map((o, k) => (
                <Pressable key={o} testID={`class-opt-${k}`} accessibilityRole="radio" accessibilityState={{ checked: pick === k }} onPress={() => { tapHaptic(); setPick(k); }}
                  style={{ borderWidth: 1.5, borderColor: pick === k ? color.gold : "#ffffff33", backgroundColor: pick === k ? "#ffffff14" : "transparent", borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 }}>
                  <Text style={{ fontFamily: font.text[600], fontSize: 16, color: "#fff" }}>{o}</Text>
                </Pressable>
              ))}
            </View>
            {pick !== null ? card(<Text accessibilityLiveRegion="polite" style={[type.body(16), { color: "#fff" }]}>{c.reveal}</Text>) : null}
          </>
        ) : null}
        {step.key === "explore" ? (
          <>
            {big(`Go explore ${M.land}`)}
            <View style={{ gap: 8 }}>
              {c.explore.map(([place, what]) => <View key={place}>{card(<>
                <Text style={{ fontFamily: font.text[600], fontSize: 16, color: color.gold }}>{place}</Text>
                <Text style={[type.body(15), { color: "#ffffffe6" }]}>{what}</Text>
              </>)}</View>)}
            </View>
            <Text style={[type.body(13), { color: "#ffffff99" }]}>{`Practice is always open on the mountain: ${M.places}. Go whenever you like.`}</Text>
          </>
        ) : null}
        {step.key === "deeper" ? (
          <>
            {big("For the curious")}
            {c.deeper.map(([q, a], k) => (
              <View key={q} style={{ borderTopWidth: 1, borderTopColor: "#ffffff22", paddingTop: 10 }}>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: open === k }} onPress={() => { tapHaptic(); setOpen(open === k ? null : k); }}>
                  <Text style={{ fontFamily: font.text[600], fontSize: 16, color: "#fff" }}>{`${open === k ? "▾" : "▸"} ${q}`}</Text>
                </Pressable>
                {open === k ? <Text style={[type.body(15), { color: "#ffffffcc", marginTop: 6 }]}>{a}</Text> : null}
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>

      <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingBottom: 14 }}>
        {i > 0 ? <Btn kind="ink" style={{ flex: 0, minWidth: 92, borderColor: "#ffffff55", borderWidth: 1 }} onPress={() => setI(i - 1)}>back</Btn> : null}
        <Btn testID="class-next" kind="gold" style={{ flex: 1 }} onPress={next}>{i < STEPS.length - 1 ? "next" : n < DAYS.length ? "done · next class" : "done"}</Btn>
      </View>
    </SafeAreaView>
  );
}
