import { useTitle } from "@/lib/title";
// A practice from the companion: the steps, a gentle timer for the timed ones, the mascot, then "done".
// Never scored and never earns light (the brand book: prayer, the breath and the sit never count).
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { practiceById, whenWords, type Practice } from "@/content/practices";
import { doable } from "@/lib/onboard";
import { markDone } from "@/lib/companion/memory";
import { bell } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { successHaptic } from "@/lib/haptics";
import { Btn, Guy, Screen, color, font, toast, type } from "@/ui";
import { kindWord, poseFor } from "@/ui/companion";
import { doorLabel, t } from "@/i18n";

const TIMED = new Set(["breath", "sit", "rest", "walk", "move"]);
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function PracticeScreen() {
  const { id, view } = useLocalSearchParams<{ id: string; view?: string }>();
  const p = practiceById(typeof id === "string" ? id : null);
  useTitle(p ? p.title : t("companion.practice.title"));
  const { today, door, saved } = useStore();
  const [left, setLeft] = useState<number | null>(null); // seconds left while the timer runs
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  if (!p) {
    return (
      <Screen back="today" title={t("companion.practice.notFound")} contentStyle={{ gap: 12 }}>
        <Text style={type.body()}>{t("companion.practice.gone")}</Text>
      </Screen>
    );
  }
  // "how it's done": asked for by the card, or anything this person isn't offered as something to do (a prayer they
  // haven't opted into, "just learn", a taste from next door), however they got here. Read-only: no timer, no start, no "done".
  if (view === "learn" || !doable(p, door, saved.settings.profile ?? null)) return <HowItsDone p={p} />;
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
    toast(t("companion.practice.doneToast"));
    if (router.canGoBack()) router.back(); else router.replace("/today");
  };
  const running = left !== null && left > 0;
  return (
    <Screen scroll back="today" title={`${p.title}.`} contentStyle={{ gap: 14 }}
      footer={
        <View style={{ gap: 8 }}>
          {timed && left === null ? <Btn kind="gold" onPress={start} label={t("companion.practice.timerA11y", { n: p.minutes })}>{t("companion.practice.start", { n: p.minutes })}</Btn> : null}
          <Btn kind={timed && left === null ? "ghost" : "ink"} onPress={finish}>{running ? t("companion.practice.doneEarly") : t("common.done")}</Btn>
        </View>
      }>
      <Text style={[type.eyebrow(8)]}>{t("companion.practice.eyebrow", { n: p.minutes, kind: kindWord(p.kind) })}{p.door ? ` · ${doorLabel(p.door)}` : t("companion.practice.everyDoor")}</Text>
      <View style={{ alignItems: "center", paddingVertical: 4 }}>
        <Guy pose={poseFor(p)} h={140} />
        {left !== null ? (
          <Text accessibilityLiveRegion="polite" accessibilityLabel={left > 0 ? t("companion.practice.leftA11y", { n: Math.ceil(left / 60) }) : t("companion.practice.timesUp")} style={{ fontFamily: font.display[800], fontSize: 34, color: color.ink, marginTop: 6 }}>
            {left > 0 ? mmss(left) : t("companion.practice.thatsIt")}
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
      <Text style={[type.body(13), { color: color.mute }]}>{t("companion.practice.why", { why: p.why })}</Text>
      <Text style={[type.caption(11)]}>{t("companion.practice.notScored")}</Text>
    </Screen>
  );
}

/** The read-only explainer: what it is, when people do it, what it means to them. Nothing to do, nothing to tap but back. */
function HowItsDone({ p }: { p: Practice }) {
  const leave = () => (router.canGoBack() ? router.back() : router.replace("/today"));
  const Part = ({ k, children }: { k: string; children: string }) => (
    <View style={{ gap: 4 }}>
      <Text style={type.eyebrow(8)}>{k}</Text>
      <Text style={[type.serif(17)]}>{children}</Text>
    </View>
  );
  return (
    <Screen scroll back="today" title={`${p.title}.`} contentStyle={{ gap: 16 }} footer={<Btn kind="ghost" onPress={leave}>{t("common.back")}</Btn>}>
      <Text testID="how-its-done" style={[type.eyebrow(8)]}>{t("companion.practice.howItsDone")}{p.door ? ` · ${doorLabel(p.door)}` : ""}</Text>
      <View style={{ alignItems: "center", paddingVertical: 4 }}><Guy pose="read" h={120} /></View>
      <Part k={t("companion.practice.whatItIs")}>{p.about || p.why}</Part>
      <Part k={t("companion.practice.whenPeople")}>{whenWords(p)}</Part>
      {p.about ? <Part k={t("companion.practice.whatItMeans")}>{p.why}</Part> : null}
      <Text style={[type.caption(12)]}>{t("companion.practice.nothingToDo")}</Text>
    </Screen>
  );
}
