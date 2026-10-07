// The upgraded first week's steps (owner, 2026-10-06; content in each script's games, order in @ih/content planDay):
// what most people get wrong, the story behind it (optional), build the word, a last thinking question, the week's
// check-in on day 7, and lesson text whose old-language words can be tapped to hear them said.
import { sayable } from "@ih/content";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View, type TextStyle } from "react-native";
import { speak } from "@/lib/sound";
import { tapHaptic } from "@/lib/haptics";
import { Btn, color, font, type } from "@/ui";
import { SlotFill } from "@/ui/slot";
import { Enter } from "@/ui/enter";
import { Verdict, useFx } from "@/session/juice";
import { t } from "@/i18n";

type Done = (ok: boolean | null) => void;
const Kicker = ({ children }: { children: string }) => <Text style={[type.eyebrow(), { color: color.gold }]}>{children}</Text>;
const shuffled = <T,>(a: T[]) => { const o = [...a]; for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; };

/** A lesson line whose old-language words (namaste, dharma, Vighnaharta…) are tappable: a tap says the word. */
export function SayText({ door, text, style }: { door: string; text: string; style: TextStyle }) {
  const parts = sayable(door, text);
  if (parts.length === 1 && !parts[0].say) return <Text style={style}>{text}</Text>;
  return (
    <Text style={style}>
      {parts.map((p, k) => p.say ? (
        <Text key={k} accessibilityRole="button" accessibilityLabel={t("session.sayIt.a11y", { term: p.text })} onPress={() => { tapHaptic(); speak(p.say!, true); }}
          style={{ color: color.ink, textDecorationLine: "underline", textDecorationStyle: "dotted", textDecorationColor: color.gold }}>{p.text}</Text>
      ) : <Text key={k}>{p.text}</Text>)}
    </Text>
  );
}

// ─── what most people get wrong ─────────────────────────────────────────
export function WrongStep({ step, onDone }: { step: any; onDone: Done }) {
  return (
    <View style={{ gap: 12, width: "100%" }}>
      <Kicker>{t("session.seg.wrong")}</Kicker>
      <View style={[s.card, { backgroundColor: "#ffffff10", borderColor: "#ffffff30" }]}>
        <Text style={[type.eyebrow(8), { color: "#ffffff99" }]}>{t("session.wrong.say")}</Text>
        <Text style={[s.line, { color: "#ffffffaa", textDecorationLine: "line-through" }]}>{step.myth}</Text>
      </View>
      <View style={[s.card, { backgroundColor: color.cream, borderColor: color.gold }]}>
        <Text style={[type.eyebrow(8), { color: color.ink }]}>{t("session.wrong.actually")}</Text>
        <Text style={[s.line, { color: color.ink }]}>{step.truth}</Text>
      </View>
      <SlotFill><Btn testID="next" kind="gold" onPress={() => onDone(null)}>{t("session.next")}</Btn></SlotFill>
    </View>
  );
}

// ─── the story behind it (optional: one tap opens it, next skips it) ────
export function StoryStep({ step, door, onDone }: { step: any; door: string; onDone: Done }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 12, width: "100%" }}>
      <Kicker>{t("session.seg.story")}</Kicker>
      <Text accessibilityRole="header" style={{ fontFamily: font.display[800], fontSize: 28, lineHeight: 32, color: "#fff", letterSpacing: -0.4 }}>{step.title}</Text>
      {open ? (
        <View style={[s.card, { backgroundColor: color.cream, borderColor: color.cream, gap: 10 }]}>
          <SayText door={door} text={step.text} style={{ fontFamily: font.text[400], fontSize: 16, lineHeight: 24, color: color.ink }} />
          {step.source ? <Text style={[type.eyebrow(8), { color: color.mute }]}>{t("session.story.from", { source: step.source })}</Text> : null}
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <Pressable testID="story-open" accessibilityRole="button" onPress={() => { tapHaptic(); setOpen(true); }} style={({ pressed }) => [s.open, { opacity: pressed ? 0.7 : 1 }]}>
            <Text style={{ fontFamily: font.text[700], fontSize: 15, color: color.ink }}>{t("session.story.read")}</Text>
          </Pressable>
          <Text style={[type.body(13), { color: "#ffffff88" }]}>{t("session.story.optional")}</Text>
        </View>
      )}
      <SlotFill><Btn testID="next" kind="gold" onPress={() => onDone(null)}>{t("session.next")}</Btn></SlotFill>
    </View>
  );
}

// ─── build the word ─────────────────────────────────────────────────────
export function BuildStep({ step, onDone }: { step: any; onDone: Done }) {
  const fx = useFx();
  const [bank] = useState(() => shuffled([...step.pieces, ...step.decoys]).map((w: string, k: number) => ({ w, k })));
  const [seq, setSeq] = useState<{ w: string; k: number }[]>([]);
  const [ok, setOk] = useState<boolean | null>(null);
  const phrase = step.pieces.some((p: string) => p.includes(" "));
  const join = (xs: string[]) => (phrase ? xs.join(" · ") : xs.join(""));
  const used = new Set(seq.map((x) => x.k));
  const add = (x: { w: string; k: number }) => {
    if (ok !== null) return;
    const next = [...seq, x];
    setSeq(next);
    if (next.length === step.pieces.length) {
      const r = next.every((y, i) => y.w === step.pieces[i]);
      setOk(r);
      fx.react(r ? "right" : "wrong");
    }
  };
  const chip = (x: { w: string; k: number }, on: boolean) => (
    <Pressable key={x.k} accessibilityRole="button" accessibilityLabel={x.w} disabled={ok !== null} onPress={() => (on ? setSeq(seq.filter((y) => y.k !== x.k)) : add(x))}
      style={[s.chip, { backgroundColor: on ? color.gold : "#fff", borderColor: on ? color.gold : "#fff" }]}>
      <Text style={{ fontFamily: font.text[700], fontSize: 16, color: color.ink }}>{x.w}</Text>
    </Pressable>
  );
  return (
    <View style={{ gap: 14, width: "100%" }}>
      <Kicker>{t("session.seg.build")}</Kicker>
      <Text accessibilityRole="header" style={[type.h1(24), { color: "#fff" }]}>{String(step.prompt).replace(/^build the word:s*/i, "")}</Text>
      <View style={s.slot}>
        {seq.length ? <Text style={{ fontFamily: font.display[800], fontSize: phrase ? 20 : 34, color: color.gold, letterSpacing: -0.5 }}>{join(seq.map((x) => x.w))}</Text> : <Text style={[type.body(), { color: "#ffffff55", fontStyle: "italic" }]}>{phrase ? "…" : "_ _ _"}</Text>}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>{bank.filter((x: any) => !used.has(x.k)).map((x: any) => chip(x, false))}</View>
      {seq.length && ok === null ? <Pressable accessibilityRole="button" onPress={() => setSeq([])} style={{ alignSelf: "center", minHeight: 44, justifyContent: "center" }}><Text style={[type.eyebrow(), { color: "#ffffff77" }]}>{t("session.build.clear")}</Text></Pressable> : null}
      {ok !== null ? <Verdict ok={ok} seed={step.pieces.length + 3} body={t("session.build.itIs", { word: step.word, parts: step.pieces.join(phrase ? ", then " : " + ") })} onNext={() => onDone(ok)} /> : null}
    </View>
  );
}

// ─── the last thinking question (graded, explained) ─────────────────────
export function ThinkStep({ step, onDone }: { step: any; onDone: Done }) {
  const [picked, setPicked] = useState<number | null>(null);
  const fx = useFx();
  const [order] = useState<number[]>(() => shuffled(step.options.map((_: string, i: number) => i)));
  const ok = picked === step.answer;
  return (
    <View style={{ gap: 10, width: "100%" }}>
      <Kicker>{t("session.seg.think")}</Kicker>
      <Text style={[s.line, { color: "#fff", fontSize: 19, marginBottom: 6 }]}>{step.setup}</Text>
      {order.map((i) => {
        const on = picked === i, right = picked !== null && i === step.answer;
        return (
          <Pressable key={i} accessibilityRole="button" accessibilityLabel={step.options[i]} disabled={picked !== null} onPress={() => { setPicked(i); fx.react(i === step.answer ? "right" : "wrong"); }}
            style={[s.choice, { borderColor: on || right ? color.gold : "#ffffff44", backgroundColor: right ? color.gold : on ? "#fff" : "#ffffff10" }]}>
            <Text style={{ fontFamily: font.text[600], fontSize: 15, color: right || on ? color.ink : "#fff" }}>{step.options[i]}</Text>
          </Pressable>
        );
      })}
      {picked !== null ? <Verdict ok={ok} seed={step.options.length + 1} body={step.reveal} onNext={() => onDone(ok)} /> : null}
    </View>
  );
}

// ─── complete the chat (the new recipe, @ih/content v2.js): someone asks, you pick the best reply ──
export function ChatStep({ step, onDone }: { step: any; onDone: Done }) {
  const [picked, setPicked] = useState<string | null>(null);
  const fx = useFx();
  const [order] = useState<string[]>(() => shuffled(step.options));
  const ok = picked === step.answer;
  return (
    <View style={{ gap: 12, width: "100%" }}>
      <Kicker>{t("session.chat.title")}</Kicker>
      <View style={{ gap: 4, maxWidth: "88%" }}>
        <Text style={[type.eyebrow(8), { color: "#ffffff99" }]}>{t("session.chat.who", { who: step.who })}</Text>
        <View style={[s.bubble, { backgroundColor: "#fff", borderBottomLeftRadius: 6 }]}>
          <Text style={[s.line, { color: color.ink }]}>{step.says}</Text>
        </View>
      </View>
      {/* your reply appears only once you tap one (owner, 2026-10-07: an empty bubble read like a box to type in) */}
      {picked ? (
        <Enter style={{ alignSelf: "flex-end", maxWidth: "88%" }}>
          <View style={[s.bubble, { backgroundColor: color.gold, borderBottomRightRadius: 6 }]}>
            <Text style={[s.line, { fontSize: 16, color: color.ink }]}>{picked}</Text>
          </View>
        </Enter>
      ) : null}
      {order.map((o) => {
        const right = picked !== null && o === step.answer;
        return (
          <Pressable key={o} accessibilityRole="button" accessibilityLabel={o} disabled={picked !== null} onPress={() => { setPicked(o); fx.react(o === step.answer ? "right" : "wrong"); }}
            style={[s.choice, { borderColor: right ? color.gold : "#ffffff44", backgroundColor: right ? "#ffffff18" : "#ffffff10", opacity: picked !== null && !right && picked !== o ? 0.5 : 1 }]}>
            <Text style={{ fontFamily: font.text[600], fontSize: 15, color: "#fff" }}>{o}</Text>
          </Pressable>
        );
      })}
      {picked !== null ? <Verdict ok={ok} seed={step.says.length} body={step.meaning ? t("session.meaning", { m: step.meaning }) : ok ? undefined : t("session.itsAnswer", { a: step.answer })} explain={t("session.explain.q", { says: step.says, answer: step.answer })} onNext={() => onDone(ok)} /> : null}
    </View>
  );
}

/** Teaching text whose terms (games.gloss) can be tapped: the word, its original script with the sound above it, and
 *  what it means, in a small card under the bubble. Terms the door can say aloud are still said on tap. */
export function GlossText({ door, text, gloss, style }: { door: string; text: string; gloss: Record<string, { meaning: string; script?: string; say?: string }>; style: TextStyle }) {
  const [open, setOpen] = useState<string | null>(null);
  const keys = Object.keys(gloss).sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`\\b(${keys.join("|")})\\b`, "gi");
  const parts: { text: string; term?: string }[] = [];
  let at = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > at) parts.push({ text: text.slice(at, m.index) });
    const term = Object.keys(gloss).find((k) => k.toLowerCase() === m[1].toLowerCase())!;
    parts.push({ text: m[0], term });
    at = m.index! + m[0].length;
  }
  if (at < text.length) parts.push({ text: text.slice(at) });
  const g = open ? gloss[open] : null;
  return (
    <View style={{ gap: 10 }}>
      <Text style={style}>
        {parts.map((p, k) => p.term ? (
          <Text key={k} accessibilityRole="button" accessibilityLabel={t("session.gloss.a11y", { term: p.text })} onPress={() => { tapHaptic(); setOpen(open === p.term ? null : p.term!); }}
            style={{ color: color.ink, textDecorationLine: "underline", textDecorationStyle: "dotted", textDecorationColor: color.gold, backgroundColor: open === p.term ? "#FFF3C4" : undefined }}>{p.text}</Text>
        ) : <SayText key={k} door={door} text={p.text} style={style} />)}
      </Text>
      {g ? (
        <View accessibilityLiveRegion="polite" style={[s.card, { backgroundColor: color.cream, borderColor: color.gold, gap: 4 }]}>
          {g.script ? (
            <View style={{ alignItems: "flex-start" }}>
              {g.say ? <Text style={[type.eyebrow(9), { color: "#8a6d00" }]}>{g.say}</Text> : null}
              <Text style={{ fontFamily: font.display[700], fontSize: 26, color: color.ink }}>{g.script}</Text>
            </View>
          ) : null}
          <Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink }}>{open}</Text>
          <Text style={{ fontFamily: font.text[400], fontSize: 15, lineHeight: 21, color: color.ink }}>{g.meaning}</Text>
          {g.say || g.script ? <Pressable accessibilityRole="button" accessibilityLabel={t("session.sayIt.a11y", { term: open! })} onPress={() => speak(open!, true)} style={{ minHeight: 36, justifyContent: "center" }}><Text style={[type.eyebrow(), { color: color.ink }]}>🔊 {open}</Text></Pressable> : null}
        </View>
      ) : null}
    </View>
  );
}

// ─── the week's check-in (day 7): one question per day, then the score ──
export function CheckinStep({ step, onDone, onMiss }: { step: any; onDone: Done; onMiss: (word: string) => void }) {
  const fx = useFx();
  const items: any[] = step.items;
  const [k, setK] = useState(-1); // -1 = the intro, items.length = the score
  const [picked, setPicked] = useState<string | null>(null);
  const [right, setRight] = useState(0);
  if (k < 0) {
    return (
      <View style={{ gap: 14, width: "100%" }}>
        <Kicker>{t("session.seg.checkin")}</Kicker>
        <Text accessibilityRole="header" style={[type.h1(28), { color: "#fff" }]}>{t("session.checkin.intro")}</Text>
        <SlotFill><Btn testID="checkin-start" kind="gold" onPress={() => setK(0)}>{t("session.checkin.start")}</Btn></SlotFill>
      </View>
    );
  }
  if (k >= items.length) {
    const all = right === items.length;
    return (
      <View style={{ gap: 14, width: "100%", alignItems: "center" }}>
        <Kicker>{t("session.seg.checkin")}</Kicker>
        <Text accessibilityRole="header" style={{ fontFamily: font.mark[800], fontSize: 34, color: color.gold, textAlign: "center" }}>{t("session.checkin.title", { a: right, b: items.length })}</Text>
        <View style={{ flexDirection: "row", gap: 6 }} accessibilityElementsHidden>{items.map((_, i) => <Text key={i} style={{ fontSize: 18, color: i < right ? color.gold : "#ffffff33" }}>☀</Text>)}</View>
        <Text style={[type.body(15), { color: "#ffffffcc", textAlign: "center" }]}>{all ? t("session.checkin.all") : t("session.checkin.some")}</Text>
        <SlotFill><Btn testID="next" kind="gold" onPress={() => onDone(all)}>{t("session.next")}</Btn></SlotFill>
      </View>
    );
  }
  const q = items[k];
  const ok = picked === q.answer;
  return (
    <View style={{ gap: 10, width: "100%" }}>
      <Kicker>{`${t("session.seg.checkin")} · ${t("session.xOfY", { a: k + 1, b: items.length })}`}</Kicker>
      <Text style={[type.eyebrow(8), { color: "#ffffff88" }]}>{t("session.lookback.from", { day: q.day })}</Text>
      <Text accessibilityRole="header" style={[type.h1(24), { color: "#fff", marginBottom: 4 }]}>{q.q}</Text>
      {q.options.map((o: string) => {
        const on = picked === o, isRight = picked !== null && o === q.answer;
        return (
          <Pressable key={o} accessibilityRole="button" accessibilityLabel={o} disabled={picked !== null}
            onPress={() => { setPicked(o); const r = o === q.answer; fx.react(r ? "right" : "wrong"); if (r) setRight((n) => n + 1); else onMiss(q.word); }}
            style={[s.choice, { borderColor: on || isRight ? color.gold : "#ffffff44", backgroundColor: isRight ? color.gold : on ? "#fff" : "#ffffff10" }]}>
            <Text style={{ fontFamily: font.text[600], fontSize: 15, color: isRight || on ? color.ink : "#fff" }}>{o}</Text>
          </Pressable>
        );
      })}
      {picked !== null ? <Verdict ok={ok} seed={k + 2} body={ok ? undefined : t("session.itsAnswer", { a: q.answer })} onNext={() => { setPicked(null); setK(k + 1); }} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1.5, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 16, gap: 6 },
  line: { fontFamily: font.display[500], fontSize: 18, lineHeight: 24 },
  open: { alignSelf: "flex-start", backgroundColor: color.cream, borderRadius: 999, minHeight: 44, paddingVertical: 10, paddingHorizontal: 18, justifyContent: "center" },
  chip: { borderWidth: 2, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18, minHeight: 44, justifyContent: "center" },
  slot: { minHeight: 64, borderBottomWidth: 1, borderBottomColor: "#ffffff33", alignItems: "center", justifyContent: "center", paddingBottom: 8 },
  choice: { borderWidth: 1.5, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 17 },
  bubble: { borderRadius: 20, paddingVertical: 12, paddingHorizontal: 16 },
});
