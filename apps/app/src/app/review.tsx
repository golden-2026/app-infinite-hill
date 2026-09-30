import { useTitle } from "@/lib/title";
// v175 Review: your three latest strand words come back. No hearts. (Misses aren't scheduled separately yet.)
import { STRAND_WORDS, data } from "@ih/content";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useStore } from "@/lib/store";
import { Bubble, Btn, Eyebrow, Guy, Screen, Sun, color, font, type } from "@/ui";
import { t, type Key } from "@/i18n";

// praise after a right answer (content's data.NICE, in the current language)
const NICE_N = 6;

export default function Review() {
  useTitle(t("session.review.title"));
  const { door, lessonFor, update, today } = useStore();
  const lesson = lessonFor(door);
  const strand = STRAND_WORDS(door, lesson);
  const due = useMemo(() => { const w = strand.filter((s) => data.REVIEW_Q[s.word]); return (w.length ? w : strand).slice(-3).reverse(); }, [door, lesson]); // eslint-disable-line react-hooks/exhaustive-deps
  // v175 stored the right answer first; shuffle (stable per word) so it isn't always the top option
  const items = due.map((s) => {
    // Words without a written review question: pick its lesson's title among two other titles from your own strand.
    const others = strand.filter((x) => x.word !== s.word && x.title && x.title !== s.title).map((x) => x.title).slice(-2);
    const q = data.REVIEW_Q[s.word] || { q: t("session.review.which", { word: s.word }), o: [s.title, ...(others.length === 2 ? others : [...others, t("session.review.notYet")].slice(0, 2))], a: 0 };
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
  if (!items.length) return <Screen close={close}><View style={{ flex: 1, justifyContent: "center", gap: 12 }}><Text style={type.h1(28)}>{t("session.review.empty")}</Text><Text style={type.body()}>{t("session.review.emptyBody")}</Text></View><Btn onPress={close}>{t("session.review.backPath")}</Btn></Screen>;
  if (phase === "intro") return (
    <Screen close={close} footer={<Btn onPress={() => setPhase("play")}>{t("session.review.go", { n: items.length })}</Btn>}>
      <View style={{ flex: 1, justifyContent: "center", gap: 18 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}><Sun size={64} /><Bubble>{t("session.review.due", { count: items.length })}</Bubble></View>
        <Eyebrow>{t("session.review.strand", { count: strand.length })}</Eyebrow>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {strand.map((s) => { const d = due.find((x) => x.word === s.word); return <View key={s.word} style={{ backgroundColor: d ? color.gold : color.ink, borderWidth: 1.5, borderColor: color.ink, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 }}><Text style={{ fontFamily: font.display[800], fontSize: 14, color: d ? color.ink : color.gold }}>{s.word}</Text></View>; })}
        </View>
        <Text style={type.h1(30)}>{items.length === 1 ? t("session.review.keepIt") : t("session.review.keepThem")}</Text>
      </View>
    </Screen>
  );
  if (phase === "done") return (
    <Screen close={close} footer={<Btn onPress={() => { update({ reviewedOn: today }); close(); }}>{t("session.review.backPath")}</Btn>}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
        <Guy pose={right === items.length ? "jump" : "peace"} h={170} />
        <Text style={type.h1(30)}>{items.length === 1 ? (right ? t("session.review.still") : t("session.review.almost")) : t("session.review.someOf", { a: right, b: items.length })}</Text>
        <Text style={[type.body(), { color: color.mute, textAlign: "center" }]}>{/* Review picks your latest strand words; misses aren't scheduled yet, so don't promise spacing that doesn't exist. */}
          {items.length === 1 ? (right ? t("session.review.yours") : t("session.review.again")) : right === items.length ? t("session.review.allYours") : t("session.review.missed")}</Text>
      </View>
    </Screen>
  );
  return (
    <Screen close={close} closeLeft progress={i / items.length} right={<View style={{ paddingRight: 8 }}><Sun size={30} mood={picked === null ? "calm" : picked === it.a ? "happy" : "oops"} /></View>}>
      <View style={{ paddingTop: 18, flex: 1 }}>
        <Eyebrow>{t("session.review.from", { n: it.day })}</Eyebrow>
        <Text style={[type.h1(26), { marginTop: 8, marginBottom: 22 }]}>{it.q}</Text>
        <View style={{ gap: 10 }}>
          {it.o.map((o: string, k: number) => (
            <Pressable key={o} accessibilityRole="button" accessibilityLabel={o} onPress={() => pick(k)} style={{ backgroundColor: picked !== null && k === it.a ? color.gold : picked === k ? "#F2F2EC" : "#fff", borderWidth: 1.5, borderColor: color.ink, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 }}>
              <Text style={{ fontFamily: font.text[600], fontSize: 15, color: color.ink }}>{o}</Text>
            </Pressable>
          ))}
        </View>
        {picked !== null ? <Text style={[type.body(), { marginTop: 16, fontFamily: font.text[700] }]}>{picked === it.a ? t(`session.nice.${i % NICE_N}` as Key) : t("session.review.itWas", { a: it.o[it.a] })}</Text> : null}
      </View>
    </Screen>
  );
}
