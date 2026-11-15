import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { createElement, useEffect, useRef, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { classMonth } from "@/content/classes/months";
import { companionAvailable, companionChat } from "@/lib/companion-ai";
import { crisisWords } from "@/lib/companion/shape";
import { readJSON, writeJSON } from "@/lib/storage";
import { bell, hush, speak } from "@/lib/sound";
import { play } from "@/lib/fx";
import { successHaptic, tapHaptic } from "@/lib/haptics";
import { HelpCard } from "@/ui/companion";
import { Btn, CloseButton, Guy, color, font, type } from "@/ui";

// One day on the hill (vertical slice A, 2026-10-23): arrive → your guide checks in → today's class → a few quiet
// minutes at the waterfall → step out into your day. Painted scenes from the world, the real Christianity class,
// and the companion when it's connected (scripted, warm replies when it isn't).
// 2026-10-26: you walk in and pick a cushion before class, can ask your guide a question mid-class, and day two
// remembers how you arrived yesterday and asks about the thing you carried out. Day two's quiet minutes are at the
// gospel steps. `?day=1` or `?day=2` opens a given day (for demos).
type Stage = "arrive" | "talk" | "walk" | "class" | "still" | "out";
const STAGES: Stage[] = ["arrive", "talk", "walk", "class", "still", "out"];
const SCENE = (name: string) => `/site-art/world/app/${name}`;
/** What the guide remembers between visits, kept on this device only. */
const MEMORY_KEY = "ih.day-slice.memory.v1";
type Memory = { mood: string | null };
const SEATS: [string, string][] = [
  ["near the front", "Front row. I like it."],
  ["next to the kids", "Good choice. They ask the best questions."],
  ["at the back", "The back is perfect. Nobody's checking."],
];
const CHECKIN: [string, string][] = [
  ["yes, I did", "That makes me so happy. That first step is the hardest one."],
  ["a little", "A little counts. Really, it does."],
  ["not yet", "That's okay. Today is a new day, and it's still yours."],
];
const ASK_FALLBACK = "Good question. Hold on to it. Let's finish the story together, and you can ask me again after class.";
const GUIDE = { name: "Denzel Washington", face: "/site-art/guides/denzel.jpg" };
const MOODS: [string, string][] = [
  ["a little heavy", "Thank you for telling me. You don't have to fix anything today. Let's start small, together."],
  ["scattered", "That makes sense. A lot is pulling at you. Let's bring you back to one thing at a time."],
  ["pretty good", "Love that. Let's put that good energy somewhere."],
  ["grateful", "That's a beautiful way to arrive. Let's hold on to it."],
];
const FALLBACK = "Thank you for telling me. I'm really glad you came.";

/** A painted scene that fills the screen: the moving clip on web, the still picture elsewhere. */
function Scene({ name, dim = 0.55 }: { name: string; dim?: number }) {
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: color.ink }} pointerEvents="none">
      {Platform.OS === "web"
        ? createElement("video", { src: SCENE(`${name}.mp4`), poster: SCENE(`${name}.webp`), autoPlay: true, muted: true, loop: true, playsInline: true, style: { width: "100%", height: "100%", objectFit: "cover", display: "block" } })
        : <Image source={{ uri: SCENE(`${name}.webp`) }} style={{ width: "100%", height: "100%" }} contentFit="cover" />}
      <LinearGradient colors={[`rgba(10,10,10,${dim * 0.5})`, `rgba(10,10,10,${dim})`, "rgba(10,10,10,0.92)"]} locations={[0, 0.45, 1]} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
    </View>
  );
}

function GuideLine({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start" }}>
      <Image source={{ uri: GUIDE.face }} style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: color.gold }} contentFit="cover" accessibilityIgnoresInvertColors />
      <View style={{ flex: 1, backgroundColor: "#ffffffee", borderRadius: 18, borderTopLeftRadius: 4, paddingVertical: 10, paddingHorizontal: 14 }}>
        <Text style={[type.body(16), { color: color.ink, lineHeight: 23 }]}>{text}</Text>
      </View>
    </View>
  );
}

function YouLine({ text }: { text: string }) {
  return (
    <View style={{ alignSelf: "flex-end", maxWidth: "82%", backgroundColor: color.gold, borderRadius: 18, borderTopRightRadius: 4, paddingVertical: 10, paddingHorizontal: 14 }}>
      <Text style={[type.body(16), { color: color.ink }]}>{text}</Text>
    </View>
  );
}

/** Speech to text on web (Chrome, Safari); null when the browser can't listen. */
function useListen(onText: (s: string) => void) {
  const [on, setOn] = useState(false);
  const rec = useRef<any>(null);
  const Ctor = Platform.OS === "web" && typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
  const start = () => {
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-US"; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e: any) => { const s = e.results?.[0]?.[0]?.transcript; if (s) onText(String(s)); };
    r.onend = () => setOn(false);
    r.onerror = () => setOn(false);
    rec.current = r; setOn(true); r.start();
  };
  const stop = () => { rec.current?.stop?.(); setOn(false); };
  return Ctor ? { on, start, stop } : null;
}

export default function DayOnTheHill() {
  const M = classMonth("christian");
  const params = useLocalSearchParams<{ day?: string }>();
  const [dayN] = useState(() => (params.day === "1" || params.day === "2" ? Number(params.day) : readJSON<number[]>(M.doneKey, []).includes(1) ? 2 : 1));
  const two = dayN === 2;
  const c = M.days[dayN - 1];
  const [memory] = useState(() => readJSON<Memory>(MEMORY_KEY, { mood: null }));
  const yesterday = M.days[0];
  const place = two ? "the gospel steps" : "the waterfall";
  useTitle(`${M.land} · one day on the hill`);
  const [stage, setStage] = useState<Stage>("arrive");
  const [voice, setVoice] = useState(false);
  const say = (s: string) => { if (voice) speak(s, true); };
  useEffect(() => () => hush(), []);

  // ── talk ──
  const hello = two
    ? `Welcome back. Yesterday you came in feeling ${memory.mood ?? "a lot of things"}, and you left with one small thing to try: “${yesterday.tryit.split(".")[0]}.” Did you get a chance?`
    : "Hey, good to see you. Before anything else: how are you arriving today?";
  const plan = two
    ? `Today's class is “${c.title}.” Then a few minutes at the gospel steps, where the choir practices. It's your call.`
    : `Here's what I'd suggest: a five-minute class on “${c.title},” then a few quiet minutes at the waterfall. It's your call.`;
  const chips = two ? CHECKIN : MOODS;
  const [log, setLog] = useState<["g" | "u", string][]>([["g", hello]]);
  const [answered, setAnswered] = useState(false);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [help, setHelp] = useState(false);
  const [live, setLive] = useState(false);
  useEffect(() => { if (Platform.OS === "web") companionAvailable().then(setLive); }, []);
  useEffect(() => { if (stage === "talk") say(hello); }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps
  const respond = async (text: string) => {
    const s = text.trim();
    if (!s || busy || answered) return;
    tapHaptic(); setQ(""); setBusy(true);
    setLog((l) => [...l, ["u", s]]);
    if (crisisWords(s)) setHelp(true);
    const mood = chips.find(([m]) => m === s);
    if (!two && mood) writeJSON(MEMORY_KEY, { mood: s } satisfies Memory);
    let reply = mood ? mood[1] : FALLBACK;
    if (live && !mood) {
      const r = await companionChat({
        profile: { door: "CHRISTIANITY" }, memory: [],
        context: { door: "CHRISTIANITY", day: dayN, hour: new Date().getHours(), lessonTitle: c.title, mood: null },
        messages: [{ role: "assistant", content: hello }, { role: "user", content: s }],
      });
      if (r?.text) reply = r.text;
    }
    setLog((l) => [...l, ["g", reply], ["g", plan]]);
    say(`${reply} ${plan}`);
    setAnswered(true); setBusy(false);
  };
  const listen = useListen((s) => respond(s));

  // ── class ──
  const [ci, setCi] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const CLASS = ["your life", "the story", "the takeaway", "your call"];
  const [seat, setSeat] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const [ask, setAsk] = useState("");
  const [qa, setQa] = useState<[string, string] | null>(null);
  const askGuide = async () => {
    const s = ask.trim();
    if (!s || busy) return;
    tapHaptic(); setBusy(true); setAsk("");
    if (crisisWords(s)) setHelp(true);
    let reply = ASK_FALLBACK;
    if (live) {
      const part = ci === 0 ? c.life.join(" ") : ci === 1 ? c.story.join(" ") : ci === 2 ? c.take.join(" ") : c.question;
      const r = await companionChat({
        profile: { door: "CHRISTIANITY" }, memory: [],
        context: { door: "CHRISTIANITY", day: dayN, hour: new Date().getHours(), lessonTitle: c.title, mood: null },
        messages: [{ role: "assistant", content: `We're in today's class, “${c.title}.” ${part}` }, { role: "user", content: s }],
      });
      if (r?.text) reply = r.text;
    }
    setQa([s, reply]); say(reply); setBusy(false);
  };

  // ── still ──
  const [mins, setMins] = useState<number | null>(null);
  const [left, setLeft] = useState(0);
  const [breath, setBreath] = useState<"in" | "out">("in");
  useEffect(() => {
    if (!mins) return;
    bell();
    setLeft(mins * 60);
    const tick = setInterval(() => setLeft((x) => Math.max(0, x - 1)), 1000);
    const br = setInterval(() => setBreath((b) => (b === "in" ? "out" : "in")), 4000);
    return () => { clearInterval(tick); clearInterval(br); };
  }, [mins]);
  useEffect(() => { if (mins && left === 0) { bell(); setStage("out"); } }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (s: Stage) => { tapHaptic(); hush(); setStage(s); };
  const close = () => { hush(); router.canGoBack() ? router.back() : router.replace("/"); };
  const finish = () => {
    const done = readJSON<number[]>(M.doneKey, []);
    if (!done.includes(dayN)) writeJSON(M.doneKey, [...done, dayN]);
    play("reward"); successHaptic(); hush();
    router.replace("/");
  };

  const h1 = (s: string, size = 30) => <Text accessibilityRole="header" style={[type.h1(size), { color: "#fff" }]}>{s}</Text>;
  const body = (s: string) => <Text style={[type.body(17), { color: "#ffffffe6", lineHeight: 26 }]}>{s}</Text>;
  const eyebrow = (s: string) => <Text style={[type.eyebrow(8), { color: color.gold }]}>{s}</Text>;
  const top = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingTop: 4 }}>
      <CloseButton dark onPress={close} />
      <View style={{ flex: 1, flexDirection: "row", gap: 4 }} accessibilityLabel="your day on the hill">
        {STAGES.map((s, k, all) => (
          <View key={s} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: all.indexOf(stage) >= k ? color.gold : "#ffffff33" }} />
        ))}
      </View>
      <Pressable testID="day-voice" accessibilityRole="switch" accessibilityState={{ checked: voice }} accessibilityLabel="read it to me" hitSlop={8}
        onPress={() => { tapHaptic(); if (voice) hush(); setVoice(!voice); }}
        style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: voice ? color.gold : "#ffffff26" }}>
        <Text style={{ fontFamily: font.text[600], fontSize: 12, color: voice ? color.ink : "#fff" }}>{voice ? "voice on" : "voice off"}</Text>
      </Pressable>
    </View>
  );
  const footer = (children: React.ReactNode) => <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingBottom: 14 }}>{children}</View>;

  return (
    <View style={{ flex: 1, backgroundColor: color.ink }}>
      <Scene key={stage === "walk" ? "class" : stage}
        name={stage === "arrive" || stage === "talk" ? "1-arrival" : stage === "walk" ? "2-class" : stage === "class" ? "2-class" : stage === "still" ? (two ? "5-music" : "4-meditate") : "7-lanterns"}
        dim={stage === "talk" || stage === "class" ? 0.82 : stage === "still" ? 0.25 : 0.45} />
      <SafeAreaView style={{ flex: 1 }}>
        {top}

        {stage === "arrive" ? (
          <>
            <View style={{ flex: 1, justifyContent: "flex-end", paddingHorizontal: 22, paddingBottom: 18, gap: 12 }}>
              {eyebrow("the home of Christianity · olive grove")}
              {two ? eyebrow("day 2") : null}
              {h1(two ? "Welcome back." : "Good morning. You made it.", 36)}
              {body(two ? "Your guide's been expecting you." : "A few minutes for you. Then back to your day, a little steadier.")}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 }}>
                <Image source={{ uri: GUIDE.face }} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: color.gold }} contentFit="cover" />
                <View>
                  <Text style={{ fontFamily: font.text[700], fontSize: 15, color: "#fff" }}>{GUIDE.name}</Text>
                  <Text style={{ fontFamily: font.text[500], fontSize: 13, color: "#ffffffaa" }}>your guide</Text>
                </View>
              </View>
            </View>
            {footer(<Btn testID="day-step-in" kind="gold" style={{ flex: 1 }} onPress={() => go("talk")}>step in</Btn>)}
          </>
        ) : null}

        {stage === "talk" ? (
          <>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 20, paddingBottom: 16, gap: 12 }}>
              {eyebrow("your guide")}
              {log.map(([who, s], k) => (who === "g" ? <GuideLine key={k} text={s} /> : <YouLine key={k} text={s} />))}
              {busy ? <Text style={[type.body(14), { color: "#ffffffaa", marginLeft: 50 }]}>…</Text> : null}
              {help ? <HelpCard onClose={() => setHelp(false)} /> : null}
              {!answered ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginLeft: 50 }}>
                  {chips.map(([m]) => (
                    <Pressable key={m} testID={`day-mood-${m}`} accessibilityRole="button" onPress={() => respond(m)}
                      style={{ borderWidth: 1.5, borderColor: "#ffffff66", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 }}>
                      <Text style={{ fontFamily: font.text[600], fontSize: 15, color: "#fff" }}>{m}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </ScrollView>
            {!answered ? (
              <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 14, alignItems: "center" }}>
                <TextInput testID="day-input" value={q} onChangeText={setQ} onSubmitEditing={() => respond(q)} placeholder="or tell your guide in your own words" placeholderTextColor="#ffffff88"
                  style={{ flex: 1, minHeight: 48, borderRadius: 24, paddingHorizontal: 16, backgroundColor: "#ffffff1f", color: "#fff", fontFamily: font.text[500], fontSize: 15 }} />
                {listen ? (
                  <Pressable testID="day-mic" accessibilityRole="button" accessibilityLabel={listen.on ? "stop listening" : "talk to your guide"} onPress={() => (listen.on ? listen.stop() : listen.start())}
                    style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: listen.on ? color.gold : "#ffffff26" }}>
                    <Text style={{ fontSize: 20, color: listen.on ? color.ink : "#fff" }}>{listen.on ? "■" : "🎙"}</Text>
                  </Pressable>
                ) : null}
                {q.trim() ? <Btn kind="gold" style={{ flex: 0, minWidth: 72 }} onPress={() => respond(q)}>send</Btn> : null}
              </View>
            ) : footer(<>
              <Btn kind="ink" style={{ flex: 1, borderColor: "#ffffff66", borderWidth: 1 }} onPress={() => go("still")}>{two ? "just the music" : "just the waterfall"}</Btn>
              <Btn testID="day-plan-yes" kind="gold" style={{ flex: 1 }} onPress={() => go("walk")}>sounds good</Btn>
            </>)}
          </>
        ) : null}

        {stage === "walk" ? (
          <>
            <View style={{ flex: 1, justifyContent: "flex-end", paddingHorizontal: 22, paddingBottom: 18, gap: 12 }}>
              {eyebrow("the class circle · by the lake")}
              {h1(seat ? "Settle in." : "Class is about to start. Grab a cushion.", 30)}
              {seat ? <GuideLine text={SEATS.find(([s]) => s === seat)![1]} /> : (
                <View style={{ gap: 8 }}>
                  {SEATS.map(([s]) => (
                    <Pressable key={s} testID={`day-seat-${s}`} accessibilityRole="button" onPress={() => { tapHaptic(); play("tap"); setSeat(s); say(SEATS.find(([x]) => x === s)![1]); }}
                      style={{ borderWidth: 1.5, borderColor: "#ffffff88", backgroundColor: "#0000004d", borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 }}>
                      <Text style={{ fontFamily: font.text[600], fontSize: 16, color: "#fff" }}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
            {seat ? footer(<Btn testID="day-sit" kind="gold" style={{ flex: 1 }} onPress={() => go("class")}>sit down</Btn>) : null}
          </>
        ) : null}

        {stage === "class" ? (
          <>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 20, gap: 14 }}>
              {eyebrow(`today's class · ${CLASS[ci]}`)}
              <Text style={[type.body(13), { color: "#ffffff99" }]}>{c.title}</Text>
              {ci === 0 ? <>{h1(c.life[0], 26)}{body(c.life[1])}<Guy pose="think" h={120} style={{ alignSelf: "center", marginTop: 6 }} /></> : null}
              {ci === 1 ? <>{h1(c.story[0], 26)}{body(c.story[1])}</> : null}
              {ci === 2 ? (
                <>
                  {h1(c.take[0], 26)}{body(c.take[1])}
                  {c.word ? (
                    <View style={{ backgroundColor: "#ffffff14", borderRadius: 16, padding: 14, gap: 4 }}>
                      <Text style={{ fontFamily: font.text[600], fontSize: 21, color: color.gold }}>{c.word[0]}</Text>
                      <Text style={[type.body(14), { color: "#ffffffaa" }]}>{c.word[1]}</Text>
                    </View>
                  ) : null}
                </>
              ) : null}
              {ci === 3 ? (
                <>
                  {h1(c.question, 24)}
                  <View style={{ gap: 8 }}>
                    {c.options.map((o, k) => (
                      <Pressable key={o} testID={`day-opt-${k}`} accessibilityRole="radio" accessibilityState={{ checked: pick === k }} onPress={() => { tapHaptic(); setPick(k); }}
                        style={{ borderWidth: 1.5, borderColor: pick === k ? color.gold : "#ffffff44", backgroundColor: pick === k ? "#ffffff14" : "transparent", borderRadius: 16, paddingVertical: 12, paddingHorizontal: 14 }}>
                        <Text style={{ fontFamily: font.text[600], fontSize: 16, color: "#fff" }}>{o}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {pick !== null ? <View style={{ backgroundColor: "#ffffff14", borderRadius: 16, padding: 14 }}><Text accessibilityLiveRegion="polite" style={[type.body(16), { color: "#fff" }]}>{c.reveal}</Text></View> : null}
                </>
              ) : null}
              {qa ? <><YouLine text={qa[0]} /><GuideLine text={qa[1]} /></> : null}
              {busy ? <Text style={[type.body(14), { color: "#ffffffaa", marginLeft: 50 }]}>…</Text> : null}
              {help ? <HelpCard onClose={() => setHelp(false)} /> : null}
              {asking && !qa ? (
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <TextInput testID="day-ask-input" autoFocus value={ask} onChangeText={setAsk} onSubmitEditing={askGuide} placeholder={`ask ${GUIDE.name.split(" ")[0]} anything`} placeholderTextColor="#ffffff88"
                    style={{ flex: 1, minHeight: 46, borderRadius: 23, paddingHorizontal: 16, backgroundColor: "#ffffff1f", color: "#fff", fontFamily: font.text[500], fontSize: 15 }} />
                  {ask.trim() ? <Btn kind="gold" style={{ flex: 0, minWidth: 64 }} onPress={askGuide}>ask</Btn> : null}
                </View>
              ) : !qa ? (
                <Pressable testID="day-ask" accessibilityRole="button" onPress={() => { tapHaptic(); setAsking(true); }} style={{ flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start" }}>
                  <Image source={{ uri: GUIDE.face }} style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: color.gold }} contentFit="cover" />
                  <Text style={{ fontFamily: font.text[600], fontSize: 15, color: color.gold }}>ask your guide a question</Text>
                </Pressable>
              ) : null}
            </ScrollView>
            {footer(<>
              {ci > 0 ? <Btn kind="ink" style={{ flex: 0, minWidth: 92, borderColor: "#ffffff55", borderWidth: 1 }} onPress={() => { setCi(ci - 1); setQa(null); setAsking(false); }}>back</Btn> : null}
              <Btn testID="day-class-next" kind="gold" style={{ flex: 1 }} disabled={ci === 3 && pick === null}
                onPress={() => (ci < 3 ? (tapHaptic(), setQa(null), setAsking(false), setCi(ci + 1)) : go("still"))}>{ci < 3 ? "next" : `to ${place}`}</Btn>
            </>)}
          </>
        ) : null}

        {stage === "still" ? (
          <>
            <View style={{ flex: 1, justifyContent: "flex-end", paddingHorizontal: 22, paddingBottom: 18, gap: 12 }}>
              {eyebrow(two ? "the gospel steps · the choir is practicing" : "the waterfall · a few quiet minutes")}
              {mins ? (
                <View style={{ alignItems: "center", gap: 10, marginBottom: 24 }}>
                  <Text accessibilityLiveRegion="polite" style={[type.h1(40), { color: "#fff" }]}>{breath === "in" ? "breathe in" : "breathe out"}</Text>
                  <Text style={{ fontFamily: font.display[700], fontSize: 20, color: "#ffffffcc", fontVariant: ["tabular-nums"] }}>{`${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}</Text>
                </View>
              ) : (
                <>
                  {h1(two ? "Pull up a seat on the steps." : "Sit with the water for a moment.", 30)}
                  {body(two
                    ? "Sing along, pray or just listen. It's your choice. A bell will tell you when it's time."
                    : "Breathe, pray or just listen. It's your choice. Close your eyes if you like; a bell will tell you when it's time.")}
                </>
              )}
            </View>
            {mins ? footer(<Btn kind="ink" style={{ flex: 1, borderColor: "#ffffff66", borderWidth: 1 }} onPress={() => { bell(); go("out"); }}>I'm ready to go</Btn>)
              : footer(<>
                <Btn testID="day-still-1" kind="ink" style={{ flex: 1, borderColor: "#ffffff66", borderWidth: 1 }} onPress={() => setMins(1)}>1 minute</Btn>
                <Btn testID="day-still-3" kind="gold" style={{ flex: 1 }} onPress={() => setMins(3)}>3 minutes</Btn>
              </>)}
          </>
        ) : null}

        {stage === "out" ? (
          <>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end", paddingHorizontal: 22, paddingTop: 20, paddingBottom: 18, gap: 14 }}>
              {eyebrow("step out")}
              {h1("Now go live it.", 36)}
              <View style={{ backgroundColor: "#ffffffee", borderRadius: 18, padding: 16, gap: 6 }}>
                <Text style={[type.eyebrow(7), { color: color.ink }]}>carry this today</Text>
                <Text style={[type.body(16), { color: color.ink, lineHeight: 23 }]}>{c.tryit}</Text>
              </View>
              <GuideLine text="If you ever want to sit in a real church, there are a few near you. No pressure. I'll be here tomorrow." />
              <Pressable accessibilityRole="link" onPress={() => Linking.openURL("https://www.google.com/maps/search/church+near+me").catch(() => {})} style={{ marginLeft: 50 }}>
                <Text style={{ fontFamily: font.text[600], fontSize: 15, color: color.gold, textDecorationLine: "underline" }}>find a church near me</Text>
              </Pressable>
            </ScrollView>
            {footer(<Btn testID="day-done" kind="gold" style={{ flex: 1 }} onPress={finish}>back to my day</Btn>)}
          </>
        ) : null}
      </SafeAreaView>
    </View>
  );
}
