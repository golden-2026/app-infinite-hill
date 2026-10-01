// Today's hero (Today redesign, 2026-10-01): the one obvious next step. Before the lesson: the day, the lesson's
// title, the mascot walking, and the start button inside the card (nothing floats over the screen). After it: what you
// did, the line you carry, the streak, and tomorrow's lesson by name (the same teaser the finish's last step shows).
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Btn, Guy, Sun, color, font, type } from "@/ui";
import { t } from "@/i18n";

type Before = {
  done: false; n: number; title: string; camp: string; first: boolean; quiet: boolean; goal: string | null;
  streak: { text: string; loud: boolean } | null; onStart: () => void; startLabel: string;
};
type After = {
  done: true; n: number; title: string; carry: string; streak: number | null; tomorrow: string; when: string; night: boolean; extra?: ReactNode;
};

function Check() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" accessible={false}>
      <Circle cx="12" cy="12" r="11" fill={color.gold} stroke={color.ink} strokeWidth="1.6" />
      <Path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke={color.ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TodayHero(p: Before | After) {
  if (p.done) {
    return (
      <View testID="hero-done" style={[s.card, { backgroundColor: "#FFFBE0" }]}>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Check /><Text style={[type.eyebrow(9), { color: color.ink }]}>{t("home.today.done")}</Text></View>
            <Text accessibilityRole="header" style={[type.h1(19), { marginTop: 8 }]}>{t("home.hero.did", { n: p.n, title: p.title })}</Text>
            <Text style={{ fontFamily: font.display[500], fontSize: 15, lineHeight: 20, color: color.ink, marginTop: 6 }}>{t("home.today.carry", { line: p.carry })}</Text>
          </View>
          <Guy pose={p.night ? "sleep" : "thumbs"} h={84} />
        </View>
        {p.streak !== null ? (
          <View testID="hero-streak" style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }}>
            <Sun size={20} />
            <Text style={[type.body(13), { flex: 1, color: color.ink }]}>{t("home.hero.streak", { count: p.streak, next: p.streak + 1 })}</Text>
          </View>
        ) : null}
        <View style={s.rule} />
        <Text style={[type.eyebrow(8)]}>{t("session.tomorrow.eyebrow", { n: p.n + 1 })}</Text>
        <Text testID="hero-tomorrow" style={{ fontFamily: font.display[800], fontSize: 17, lineHeight: 22, color: color.ink, marginTop: 4 }}>{p.tomorrow}</Text>
        <Text style={[type.caption(12), { marginTop: 4 }]}>{p.when}</Text>
        {p.extra}
      </View>
    );
  }
  return (
    <View testID="hero" style={s.card}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={[type.eyebrow(9), { color: color.ink }]}>{t("home.hero.eyebrow", { n: p.n })}</Text>
          <Text accessibilityRole="header" style={[type.h1(24), { marginTop: 8 }]}>{p.title}</Text>
          <Text style={[type.caption(12), { marginTop: 6 }]}>{p.camp}</Text>
        </View>
        <Guy pose={p.quiet ? "sitrock" : "walk"} h={96} style={{ marginRight: -6, marginTop: -4 }} />
      </View>
      {p.first ? <Text style={[type.body(13), { color: color.mute, marginTop: 10 }]}>{t("home.hero.first")}</Text> : null}
      {p.goal ? <Text style={[type.caption(12), { marginTop: 6, color: color.ink }]}>{p.goal}</Text> : null}
      <Btn testID="top-start" kind={p.quiet ? "ghost" : "gold"} onPress={p.onStart} label={p.startLabel} style={{ marginTop: 14, borderWidth: 2, borderColor: color.ink }}>
        {p.quiet ? t("home.today.whenReady", { n: p.n }) : t("home.today.startDay", { n: p.n })}
      </Btn>
      {p.streak ? (
        <View testID="streak-pill" accessibilityRole="text" style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10 }}>
          <Sun size={16} />
          <Text style={[type.caption(12), p.streak.loud && { color: color.ink, fontFamily: font.text[700] }]}>{p.streak.text}</Text>
        </View>
      ) : null}
    </View>
  );
}

const s = {
  card: { marginHorizontal: 18, marginBottom: 12, backgroundColor: "#fff", borderWidth: 2, borderColor: color.ink, borderRadius: 22, paddingVertical: 16, paddingHorizontal: 16 },
  rule: { height: 1, backgroundColor: "#0A0A0A1F", marginVertical: 12 },
} as const;
