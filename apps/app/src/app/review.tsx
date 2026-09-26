import { useTitle } from "@/lib/title";
// v175 Review: three words from your strand come back. No hearts; misses come back sooner.
import { STRAND_WORDS, data } from "@ih/content";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useStore } from "@/lib/store";
import { Bubble, Btn, Eyebrow, Guy, Screen, Sun, color, font, type } from "@/ui";

export default function Review() {
  useTitle("review");
  const { door, lessonFor, update, today } = useStore();
  const lesson = lessonFor(door);
  const strand = STRAND_WORDS(door, lesson);
  const due = useMemo(() => { const w = strand.filter((s) => data.REVIEW_Q[s.word]); return (w.length ? w : strand).slice(-3).reverse(); }, [door, lesson]); // eslint-disable-line react-hooks/exhaustive-deps
  // v175 stored the right answer first; shuffle (stable per word) so it isn't always the top option
  const items = due.map((s) => {
    const q = data.REVIEW_Q[s.word] || { q: `${s.word} — remember it?`, o: [s.title, "a prayer", "a festival"], a: 0 };
    const order = q.o.map((_: string, i: number) => i).sort((x: number, y: number) => ((x * 7 + s.word.length * 3) % 5) - ((y * 7 + s.word.length * 3) % 5));
    return { ...s, q: q.q, o: order.map((i: number) => q.o[i]), a: order.indexOf(q.a) };
  });
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [right, setRight] = useState(0);
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));
  const it = items[i];
  const pick = (k: number) => {
    if (picked !== null) return;
    setPicked(k);
    if (k === it.a) setRight((r) => r + 1);
    setTimeout(() => { setPicked(null); if (i + 1 < items.length) setI(i + 1); else setPhase("done"); }, k === it.a ? 550 : 1200);
  };
  if (!items.length) return <Screen close={close}><View style={{ flex: 1, justifyContent: "center", gap: 12 }}><Text style={type.h1(28)}>nothing due yet.</Text><Text style={type.body()}>your strand starts after day one.</Text></View><Btn onPress={close}>back to the path</Btn></Screen>;
  if (phase === "intro") return (
    <Screen close={close} footer={<Btn onPress={() => setPhase("play")}>{`review ${items.length}`}</Btn>}>
      <View style={{ flex: 1, justifyContent: "center", gap: 18 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}><Sun size={64} /><Bubble>{items.length === 1 ? "one of your words is due" : `${items.length} of your words are due`}. ninety seconds. they'll come back again later — that's how they stick.</Bubble></View>
        <Eyebrow>your strand · {strand.length} word{strand.length === 1 ? "" : "s"}</Eyebrow>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {strand.map((s) => { const d = due.find((x) => x.word === s.word); return <View key={s.word} style={{ backgroundColor: d ? color.gold : color.ink, borderWidth: 1.5, borderColor: color.ink, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 }}><Text style={{ fontFamily: font.display[800], fontSize: 14, color: d ? color.ink : color.gold }}>{s.word}</Text></View>; })}
        </View>
        <Text style={type.h1(30)}>{items.length === 1 ? "keep it." : "keep them."}</Text>
      </View>
    </Screen>
  );
  if (phase === "done") return (
    <Screen close={close} footer={<Btn onPress={() => { update({ reviewedOn: today }); close(); }}>back to the path</Btn>}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
        <Guy pose={right === items.length ? "jump" : "peace"} h={170} />
        <Text style={type.h1(30)}>{items.length === 1 ? (right ? "still yours." : "almost. it's still yours.") : `${right} of ${items.length}. still yours.`}</Text>
        <Text style={[type.body(), { color: color.mute, textAlign: "center" }]}>{items.length === 1 ? (right ? "next time it'll wait longer before coming back." : "it'll come back sooner. no hearts.") : right === items.length ? "next time they'll wait longer before coming back." : "the ones you missed come back sooner. no hearts."}</Text>
      </View>
    </Screen>
  );
  return (
    <Screen close={close} closeLeft progress={i / items.length} right={<View style={{ paddingRight: 8 }}><Sun size={30} mood={picked === null ? "calm" : picked === it.a ? "happy" : "oops"} /></View>}>
      <View style={{ paddingTop: 18, flex: 1 }}>
        <Eyebrow>review · from lesson {it.day}</Eyebrow>
        <Text style={[type.h1(26), { marginTop: 8, marginBottom: 22 }]}>{it.q}</Text>
        <View style={{ gap: 10 }}>
          {it.o.map((o: string, k: number) => (
            <Pressable key={o} accessibilityRole="button" accessibilityLabel={o} onPress={() => pick(k)} style={{ backgroundColor: picked !== null && k === it.a ? color.gold : picked === k ? "#F2F2EC" : "#fff", borderWidth: 1.5, borderColor: color.ink, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: font.text[600], fontSize: 15, color: color.ink }}>{o}</Text>
            </Pressable>
          ))}
        </View>
        {picked !== null ? <Text style={[type.body(), { marginTop: 16, fontFamily: font.text[700] }]}>{picked === it.a ? data.NICE[i % data.NICE.length] : `it's “${it.o[it.a]}”. it'll come back.`}</Text> : null}
      </View>
    </Screen>
  );
}
