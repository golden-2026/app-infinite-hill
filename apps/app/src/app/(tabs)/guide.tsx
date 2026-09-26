import { TabHeader } from "@/ui/tab-header";
import { useTitle } from "@/lib/title";
// The Guide (v175). Pilot rule (BUILD_BRIEF): off until retrieval with sources exists, so by default it
// answers from the lesson's own text (v175's fallback) and says so. ?flags=guide-live uses /api/guide.
import { camp1, data, guideFallback, label } from "@ih/content";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { flag } from "@/lib/flags";
import { useStore } from "@/lib/store";
import { Eyebrow, Guy, Sun, color, font, type } from "@/ui";

// v175's fallback says "no signal" when it can't match a question. In the pilot the Guide is off by design,
// not offline, so say what's true and point at the words the person actually has.
function pilotAnswer(wing: string, q: string, words: string[]) {
  const a = guideFallback(wing, q);
  // matched answers carry v175's "(… I'm offline right now, so that's the lesson talking, not me.)"
  if (!/no signal/i.test(a)) return a.replace(/I'?m offline right now, so that's the lesson talking, not me\./i, "in the pilot I answer from your lessons, so that's the lesson talking.");
  const ws = words.slice(-4).join(", ");
  return `that's past what your lessons cover so far. in the pilot I answer from ${label(wing)}'s lessons only${ws ? ` — ask me about ${ws}` : ""}. the full guide opens after the pilot.`;
}

async function askLive(wing: string, words: string[], history: [string, string][], q: string): Promise<string | null> {
  if (!flag("guide-live") || Platform.OS !== "web") return null;
  try {
    const res = await fetch("/api/guide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ door: wing, words, history, question: q }) });
    if (!res.ok) return null;
    const { text } = await res.json();
    return typeof text === "string" && text.trim() ? text : null;
  } catch {
    return null;
  }
}

export default function Guide() {
  useTitle("guide");
  const { door: wing, lessonFor, saved } = useStore();
  const day = lessonFor(wing);
  const days = camp1(wing);
  const words = days.filter((d: any) => d.day <= day).map((d: any) => d.word);
  const today = days.find((d: any) => d.day === day) || days[0] || data.DAY1[wing] || data.DAY1.SPIRITUAL;
  const book = saved.settings.book;
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<[string, string][]>([["g", `ask me anything about ${label(wing)} — a word, a story, why something's done the way it's done. in the pilot I answer from ${label(wing)}'s own lessons, and I'll tell you when they're quiet.`]]);
  const scroller = useRef<ScrollView>(null);
  const send = async (text?: string) => {
    const question = (text ?? q).trim();
    if (!question || busy) return;
    setQ("");
    setBusy(true);
    const hist = log;
    setLog((l) => [...l, ["u", question]]);
    let a: string | null = null;
    if (/my book|what i kept|from my (lines|beads)/i.test(question) || /^book$/i.test(question)) {
      a = book.length ? "from your book — your own lines, with where each came from:\n\n" + book.map((b) => `“${b.line}”  — ${label(b.door)}, ${b.date}`).join("\n") + "\n\nthat's everything you've kept." : "your book is empty so far. after a session, tap keep it, and I'll be able to answer from your own lines.";
    } else {
      a = (await askLive(wing, words, hist.slice(1), question)) || pilotAnswer(wing, question, words);
    }
    setLog((l) => [...l, ["g", a || pilotAnswer(wing, question, words)]]);
    setBusy(false);
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50);
  };
  const chips = [...(book.length ? ["what's in my book?"] : []), `what does ${today.word} actually mean?`, `tell me the story behind ${today.word}`];
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: color.cream }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}><TabHeader eyebrow={`the guide · ${label(wing)}`} title="ask the house." pose="think" /></View>
        <ScrollView ref={scroller} contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 8, gap: 10 }}>
          {log.map(([who, t], i) => (
            <View key={i} style={{ maxWidth: "88%", alignSelf: who === "u" ? "flex-end" : "flex-start", backgroundColor: who === "u" ? color.ink : "#fff", borderWidth: who === "u" ? 0 : 1, borderColor: color.line, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 }}>
              <Text style={[type.body(), { color: who === "u" ? color.cream : color.text }]}>{t}</Text>
            </View>
          ))}
          {busy ? <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Sun size={18} mood="spin" /><Text style={[type.body(12), { color: color.mute }]}>looking it up…</Text></View> : null}
          {log.length === 1 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
              {chips.map((c) => <Pressable key={c} accessibilityRole="button" onPress={() => send(c)} style={{ backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.ink, borderRadius: 999, minHeight: 44, justifyContent: "center", paddingHorizontal: 14 }}><Text style={{ fontFamily: font.text[600], fontSize: 13, color: color.ink }}>{c}</Text></Pressable>)}
            </View>
          ) : null}
        </ScrollView>
        <Text style={[type.eyebrow(8), { paddingHorizontal: 18, paddingBottom: 6, color: color.mute }]}>{flag("guide-live") ? "from this door's texts · sources shown" : "answers from this door's lessons · live guide opens after the pilot"}</Text>
        <View style={{ paddingHorizontal: 18, paddingBottom: 12, paddingTop: 4, flexDirection: "row", gap: 8 }}>
          <TextInput value={q} onChangeText={setQ} onSubmitEditing={() => send()} placeholder={`what does ${today.word} actually mean?`} accessibilityLabel="Ask the guide" returnKeyType="send"
            style={{ flex: 1, borderWidth: 1.5, borderColor: color.line, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 16, fontFamily: font.text[400], fontSize: 16, backgroundColor: "#fff" }} />
          <Pressable accessibilityRole="button" accessibilityLabel="Send" onPress={() => send()} style={{ backgroundColor: busy ? color.line : color.ink, borderRadius: 999, width: 46, height: 46, alignItems: "center", justifyContent: "center" }}><Text style={{ color: color.gold, fontSize: 18 }}>↑</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
