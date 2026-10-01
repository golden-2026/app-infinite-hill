import { TabHeader } from "@/ui/tab-header";
import { useTitle } from "@/lib/title";
// The Guide (v175), which becomes the companion when the server's AI is on (/api/companion?kind=status says so).
// Companion on: answers come from the companion, grounded in this door's lessons and the short facts the person
// keeps under "what the companion knows"; facts it proposes are only kept if the person taps them.
// Companion off (no AI key, offline, or the iPhone build): it answers from the lesson's own text (v175's fallback)
// and says so plainly. ?flags=guide-live still uses the older /api/guide.
import { camp1, data, GUIDE_NO_MATCH, guideFallback, label, lessonInfo } from "@ih/content";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addFact, getMemory, moodOn, MOODS, useMemory } from "@/lib/companion/memory";
import { crisisWords } from "@/lib/companion/shape";
import { HelpCard } from "@/ui/companion";
import { companionAvailable, companionChat, type ChatMessage, type CompanionContext, type CompanionProfile, answerLang } from "@/lib/companion-ai";
import { flag } from "@/lib/flags";
import { guideProfile } from "@/lib/profile";
import { useStore } from "@/lib/store";
import { today as todayDate } from "@/lib/time";
import { Eyebrow, Guy, Sun, color, font, type } from "@/ui";
import { doorLabel, isEs, t } from "@/i18n";

// Some lessons' "word" is a line of a prayer ("the Lord's Prayer, line 5"). Name the line itself ("deliver us"),
// taken from the lesson's own hook, instead of treating the label as a word.
const strip = (s: string) => (s || "").replace(/[.!?,;:"“”'’]/g, "").toLowerCase().trim();
function lineOf(d: any): { prayer: string; n: string; quote: string | null } | null {
  const m = typeof d?.word === "string" ? d.word.match(/^(.+), line (\d+)$/) : null;
  if (!m) return null;
  const quote = (String(d.hook || "").match(/^["“]([^"”]+)["”]/) || [])[1] || null;
  return { prayer: m[1], n: m[2], quote };
}
/** What to call a lesson's word out loud: the word, or for a line of a prayer, the line. */
function wordName(d: any): string {
  const l = lineOf(d);
  return l ? (l.quote ? `“${l.quote}”` : t("companion.guide.lineOf", { n: l.n, prayer: l.prayer })) : d?.word;
}

// When no lesson covers a question (guideFallback checks the lesson's own text, not just its word), say what's true:
// the lessons don't cover it and the live Guide isn't answering, so nothing is guessed; point at the words they have.
// "what does today's word mean?", "today's line", "the word of the day": today's lesson, whatever it's called.
const TODAY_ASK = /\b(today'?s|todays|this (?:morning|evening)'?s)\s+(word|line|lesson|idea)\b|\b(word|line) (of|for) (the day|today)\b/i;
// the same in Spanish: "¿qué significa la palabra de hoy?", "la lección de hoy", "la frase del día"
const TODAY_ASK_ES = /(palabra|frase|l[ií]nea|lecci[oó]n|idea)s? (de hoy|del d[ií]a|de este d[ií]a)/i;
// "what's in my book?" in Spanish: "¿qué hay en mi libro?", "lo que guardé"
const BOOK_ASK_ES = /\bmi libro\b|lo que (he )?guard(e|é|ado)(?![a-z])|^libro$/i;
function pilotAnswer(wing: string, q: string, words: string[], day = 999): string {
  const days = camp1(wing);
  if (TODAY_ASK.test(q.replace(/[’‘]/g, "'")) || TODAY_ASK_ES.test(q)) {
    const d = days.find((x: any) => x.day === day);
    if (d?.word) {
      // answered from the lesson's own text, like any word; if another word happens to match first, say today's directly
      const a = pilotAnswer(wing, d.word, words, day);
      const name = wordName(d);
      if (a.toLowerCase().startsWith(`${d.word} — `.toLowerCase()) || a.startsWith(name)) return a;
      const teach = (d.segments || []).find((g: any) => /teach/.test(g.type));
      return `${name} — ${d.carry}.${teach ? ` ${teach.voice.split(/(?<=[.!?])\s+/)[0]}` : ""} ${t("companion.guide.todayLesson", { day })}`;
    } else {
      // past camp one: today's lesson (a draft outline) says what it's about
      const info: any = lessonInfo(wing, day);
      if (info) return t("companion.guide.todayOutline", { day, title: info.title, hook: info.hook && info.hook !== info.title ? `${info.hook}. ` : "", carry: info.carry });
    }
  }
  // asked about a line by its words ("what does “deliver us” mean?"): look it up by the lesson's label
  const sq = strip(q);
  const asked = days.find((d: any) => { const l = lineOf(d); return l && ((l.quote && sq.includes(strip(l.quote))) || (sq.includes(strip(l.prayer)) && sq.includes(`line ${l.n}`))); });
  let a: string = guideFallback(wing, asked ? `${q} ${asked.word}` : q);
  const hit = days.find((d: any) => d.word && a.startsWith(`${d.word} — `));
  const l = hit && lineOf(hit);
  if (hit && l) {
    // "the Lord's Prayer, line 5 — you can ask. Here's the word: the Lord's Prayer, line 5. "deliver us" — …"
    // → "“deliver us” (line 5 of the Lord's Prayer) — you can ask. Here's the line: "deliver us" — …"
    const where = t("companion.guide.lineOf", { n: l.n, prayer: l.prayer });
    a = `${l.quote ? `“${l.quote}” (${where})` : where}${a.slice(hit.word.length)}`
      .replace(`Here's the word: ${hit.word}. `, l.quote ? "Here's the line: " : `Here's ${where}. `);
  }
  // A word from a lesson you haven't reached: don't answer from it while saying "from your lessons".
  const from = Number((a.match(/that's from day (\d+)/) || [])[1]);
  if (from > day) return t("companion.guide.notYet", { from, door: doorLabel(wing), day, ask: words.length ? t("companion.guide.askAbout", { words: words.slice(-4).join(", ") }) : "" });
  // matched answers carry v175's "(… I'm offline right now, so that's the lesson talking, not me.)"
  // The lesson's own words stay as written (English until the lessons are translated); the frame around them follows
  // the app's language.
  if (a !== GUIDE_NO_MATCH) {
    if (isEs()) return a.replace(/\(that's from day (\d+)\. I'?m offline right now, so that's the lesson talking, not me\.\)/i, (_m, n) => t("companion.guide.fromDay", { day: n }));
    return a.replace(/I'?m offline right now, so that's the lesson talking, not me\./i, t("companion.guide.pilotLesson"));
  }
  const ws = words.slice(-4).join(", ");
  return t("companion.guide.past", { door: doorLabel(wing), ask: ws ? t("companion.guide.askAbout", { words: ws }) : "" });
}

// api/guide.js accepts exactly { system, messages, profile? }: the door is read from the system line, the history
// must alternate user/assistant and end on the user's question (at most 9 messages).
async function askLive(wing: string, words: string[], history: Line[], q: string, profile: ReturnType<typeof guideProfile>): Promise<string | null> {
  if (!flag("guide-live") || Platform.OS !== "web") return null;
  try {
    const turns = history.map(([who, t]) => ({ role: who === "u" ? "user" : "assistant", content: t }));
    while (turns.length && turns[0].role !== "user") turns.shift();
    const messages = [...turns, { role: "user", content: q }].slice(-9);
    if (messages[0].role !== "user") messages.shift();
    const system = `The user is walking the ${label(wing)} door. Words they have so far: ${words.join(", ")}.`;
    const res = await fetch("/api/guide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system, messages, profile: { ...(profile || {}), lang: answerLang() } }) });
    if (!res.ok) return null;
    const { text } = await res.json();
    return typeof text === "string" && text.trim() ? text : null;
  } catch {
    return null;
  }
}

// api/companion.js limits (kept a little under): 13 alternating messages starting and ending with the person,
// 2,000 characters each and 12,000 in all; 24 memory facts, 200 characters each and 3,000 in all.
function chatMessages(history: Line[], q: string): ChatMessage[] {
  const turns: ChatMessage[] = history.map(([who, t]) => ({ role: who === "u" ? "user" : "assistant", content: t.slice(0, 2_000) }));
  let messages = [...turns, { role: "user" as const, content: q.slice(0, 2_000) }].slice(-13);
  const size = () => messages.reduce((n, m) => n + m.content.length, 0);
  while (messages.length > 1 && (messages[0].role !== "user" || size() > 11_500)) messages = messages.slice(1);
  return messages;
}
function memoryFacts(): string[] {
  const facts = getMemory().facts.map((f) => f.text.trim().slice(0, 200)).filter(Boolean).slice(-24);
  while (facts.reduce((n, f) => n + f.length, 0) > 2_900) facts.shift();
  return facts;
}

/** One line in the conversation: who ("g" guide/companion, "u" the person), what was said, and facts offered to keep. */
type Line = [string, string, string[]?];

export default function Guide() {
  useTitle(t("companion.guide.title"));
  const { door: wing, lessonFor, saved } = useStore();
  const memory = useMemory();
  const day = lessonFor(wing);
  const days = camp1(wing);
  const words = days.filter((d: any) => d.day <= day).map(wordName);
  const today = days.find((d: any) => d.day === day) || days[0] || data.DAY1[wing] || data.DAY1.SPIRITUAL;
  const book = saved.settings.book;
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  // words that mean someone may be in danger bring up real help (988), as in the journal. nothing is logged.
  const [help, setHelp] = useState(false);
  // null while checking; the companion is only ever "on" after the server says so.
  const [live, setLive] = useState<boolean | null>(Platform.OS === "web" ? null : false);
  const pilotHello = t("companion.guide.pilotHello", { door: doorLabel(wing) });
  const liveHello = t("companion.guide.liveHello", { door: doorLabel(wing) });
  const [log, setLog] = useState<Line[]>([["g", pilotHello]]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    let gone = false;
    companionAvailable().then((on) => {
      if (gone) return;
      setLive(on);
      if (on) setLog((l) => (l.length === 1 ? [["g", liveHello]] : l));
    });
    return () => { gone = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const scroller = useRef<ScrollView>(null);

  const askCompanion = async (history: Line[], question: string) => {
    const gp = guideProfile(saved.settings.profile ?? null, wing);
    const lastRun = (saved.settings.runs || []).filter((r) => r.door === wing).at(-1);
    const lastFeel = (saved.settings.feel || []).filter((f) => f.door === wing).at(-1)?.feel ?? null;
    const mood = moodOn(memory, todayDate());
    const profile: CompanionProfile = { door: wing, ...(gp || {}), ...(lastRun ? { level: lastRun.level } : {}) };
    const context: CompanionContext = {
      door: wing, day, hour: new Date().getHours(),
      ...(today.title ? { lessonTitle: String(today.title).slice(0, 160) } : {}),
      ...(today.carry ? { carry: String(today.carry).slice(0, 300) } : {}),
      lastFeel,
      mood: mood && mood !== "skip" ? MOODS.find((m) => m.id === mood)?.label ?? null : null,
    };
    return companionChat({ profile, memory: memoryFacts(), context, messages: chatMessages(history, question) });
  };

  const send = async (text?: string) => {
    const question = (text ?? q).trim();
    if (!question || busy) return;
    setQ("");
    setBusy(true);
    if (crisisWords(question)) setHelp(true);
    const hist = log;
    setLog((l) => [...l, ["u", question]]);
    let line: Line;
    if (/my book|what i kept|from my (lines|beads)/i.test(question) || /^book$/i.test(question) || BOOK_ASK_ES.test(question.replace(/[¿?¡!]/g, "").trim())) {
      line = ["g", book.length ? t("companion.guide.bookHead") + book.map((b) => `“${b.line}”  — ${doorLabel(b.door)}, ${b.date}`).join("\n") + t("companion.guide.bookTail") : t("companion.guide.bookEmpty")];
    } else if (live) {
      const reply = await askCompanion(hist.slice(1), question);
      line = reply?.limited
        ? ["g", `${pilotAnswer(wing, question, words, day)}${t("companion.guide.limited")}`]
        : reply?.text
        ? ["g", reply.text, (reply.remember || []).filter((f) => typeof f === "string" && f.trim())]
        : ["g", `${pilotAnswer(wing, question, words, day)}${t("companion.guide.failed")}`];
    } else {
      line = ["g", (await askLive(wing, words, hist.slice(1), question, guideProfile(saved.settings.profile ?? null, wing))) || pilotAnswer(wing, question, words, day)];
    }
    setLog((l) => [...l, line]);
    setBusy(false);
    setTimeout(() => scroller.current?.scrollToEnd({ animated: true }), 50);
  };
  const kept = new Set(memory.facts.map((f) => f.text.trim().toLowerCase()));
  const chips = [...(book.length ? [t("companion.guide.chipBook")] : []), t("companion.guide.chipMean", { word: wordName(today) }), t("companion.guide.chipStory", { word: wordName(today) })];
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: color.cream }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 18, paddingBottom: 8 }}><TabHeader eyebrow={t("companion.guide.eyebrow", { door: doorLabel(wing) })} title={t("companion.guide.header")} pose="think" /></View>
        <ScrollView ref={scroller} contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 8, gap: 10 }}>
          {log.map(([who, said, offers], i) => (
            <View key={i} style={{ gap: 6 }}>
              <View style={{ maxWidth: "88%", alignSelf: who === "u" ? "flex-end" : "flex-start", backgroundColor: who === "u" ? color.ink : "#fff", borderWidth: who === "u" ? 0 : 1, borderColor: color.line, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 }}>
                <Text style={[type.body(), { color: who === "u" ? color.cream : color.text }]}>{said}</Text>
              </View>
              {offers?.length ? (
                // Nothing is kept unless the person taps it; kept facts show under You → what the companion knows.
                <View style={{ maxWidth: "88%", gap: 6 }}>
                  <Text style={[type.body(12), { color: color.mute }]}>{t("companion.guide.remember")}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {offers.map((f) => {
                      const has = kept.has(f.trim().toLowerCase());
                      return (
                        <Pressable key={f} accessibilityRole="button" accessibilityState={{ disabled: has }} accessibilityLabel={has ? t("companion.guide.keptA11y", { fact: f }) : t("companion.guide.rememberA11y", { fact: f })} disabled={has} onPress={() => addFact(f, todayDate())}
                          style={{ backgroundColor: has ? color.ink : "#fff", borderWidth: 1.5, borderColor: color.ink, borderRadius: 999, minHeight: 44, justifyContent: "center", paddingHorizontal: 14 }}>
                          <Text style={{ fontFamily: font.text[600], fontSize: 13, color: has ? color.cream : color.ink }}>{has ? t("companion.guide.kept", { fact: f }) : `+ ${f}`}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}
            </View>
          ))}
          {help ? <View style={{ marginHorizontal: -18 }}><HelpCard onClose={() => setHelp(false)} /></View> : null}
          {busy ? <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Sun size={18} mood="spin" /><Text style={[type.body(12), { color: color.mute }]}>{t("companion.guide.looking")}</Text></View> : null}
          {log.length === 1 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
              {chips.map((c) => <Pressable key={c} accessibilityRole="button" onPress={() => send(c)} style={{ backgroundColor: "#fff", borderWidth: 1.5, borderColor: color.ink, borderRadius: 999, minHeight: 44, justifyContent: "center", paddingHorizontal: 14 }}><Text style={{ fontFamily: font.text[600], fontSize: 13, color: color.ink }}>{c}</Text></Pressable>)}
            </View>
          ) : null}
        </ScrollView>
        <Text style={[type.eyebrow(8), { paddingHorizontal: 18, paddingBottom: 6, color: color.mute }]}>{live ? t("companion.guide.footLive") : flag("guide-live") ? t("companion.guide.footGuideLive") : t("companion.guide.footPilot")}</Text>
        <View style={{ paddingHorizontal: 18, paddingBottom: 12, paddingTop: 4, flexDirection: "row", gap: 8 }}>
          <TextInput value={q} onChangeText={setQ} onSubmitEditing={() => send()} placeholder={t("companion.guide.chipMean", { word: wordName(today) })} placeholderTextColor={color.mute} accessibilityLabel={t("companion.guide.askA11y")} returnKeyType="send"
            style={{ flex: 1, borderWidth: 1.5, borderColor: color.line, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 16, fontFamily: font.text[400], fontSize: 16, backgroundColor: "#fff" }} />
          <Pressable accessibilityRole="button" accessibilityLabel={t("companion.guide.send")} onPress={() => send()} style={{ backgroundColor: busy ? color.line : color.ink, borderRadius: 999, width: 46, height: 46, alignItems: "center", justifyContent: "center" }}><Text style={{ color: color.gold, fontSize: 18 }}>↑</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
