import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { DOORS } from "@ih/content";
import { useStore } from "@/lib/store";
import { familyDoors, kidAnswersFor, useFamilyContent, type KidAnswer, type SharedLesson } from "@/lib/family";
import { doorLabel, t } from "@/i18n";
import { Eyebrow, Screen, color, font, type } from "@/ui";
import { Host } from "@/ui/host";

// Our family (lib/family.ts): pick the religions in your home, then "when your kid asks" answers and shared lessons,
// one theme told by each religion. Never ranks, never pushes; the family chooses how to raise their kids.
export default function Family() {
  useTitle(t("family.title"));
  const { saved, update } = useStore();
  const st = saved.settings;
  const doors = familyDoors(st);
  const { kids, shared } = useFamilyContent();
  const [tab, setTab] = useState<"kids" | "shared">("kids");
  const [open, setOpen] = useState<string | null>(null);
  const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));
  const toggle = (w: string) => {
    const next = doors.includes(w) ? doors.filter((d) => d !== w) : [...doors, w];
    update({ family: { doors: next, raising: st.family?.raising ?? null } });
  };
  const list = tab === "kids" ? kidAnswersFor(kids || [], doors) : (shared || []);
  return (
    <Screen close={close} scroll>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 4 }}>
          <Eyebrow size={8}>{t("family.eyebrow")}</Eyebrow>
          <Text accessibilityRole="header" style={[type.h1(26), { color: color.ink }]}>{t("family.title")}</Text>
        </View>
        <Host pose="heart">{t("family.host")}</Host>

        <View style={{ gap: 6 }}>
          <Eyebrow size={8}>{t("family.ours")}</Eyebrow>
          <View testID="family-doors" style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
            {DOORS.map(([, w]: [string, string]) => {
              const on = doors.includes(w);
              return (
                <Pressable key={w} accessibilityRole="checkbox" accessibilityState={{ checked: on }} aria-checked={on} onPress={() => toggle(w)}
                  style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: on ? color.ink : color.line, backgroundColor: on ? color.gold : "#fff" }}>
                  <Text style={{ fontFamily: font.text[600], fontSize: 13, color: color.ink }}>{doorLabel(w)}{on ? " ✓" : ""}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 8 }} accessibilityRole="tablist">
          {(["kids", "shared"] as const).map((k) => (
            <Pressable key={k} testID={`family-tab-${k}`} accessibilityRole="tab" accessibilityState={{ selected: tab === k }} aria-selected={tab === k} onPress={() => { setTab(k); setOpen(null); }}
              style={{ flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 999, backgroundColor: tab === k ? color.ink : "#fff", borderWidth: 1.5, borderColor: color.ink }}>
              <Text style={{ fontFamily: font.text[700], fontSize: 13, color: tab === k ? color.gold : color.ink }}>{t(k === "kids" ? "family.tab.kids" : "family.tab.shared")}</Text>
            </Pressable>
          ))}
        </View>

        {!doors.length ? <Text style={type.caption()}>{t("family.pickFirst")}</Text> : null}
        <View style={{ gap: 8 }}>
          {tab === "kids"
            ? (list as KidAnswer[]).map((a) => <KidCard key={a.id} a={a} open={open === a.id} onPress={() => setOpen(open === a.id ? null : a.id)} />)
            : (list as SharedLesson[]).map((l) => <SharedCard key={l.id} l={l} doors={doors} open={open === l.id} onPress={() => setOpen(open === l.id ? null : l.id)} />)}
        </View>
        <Text style={type.caption(11)}>{t("family.note")}</Text>
      </View>
    </Screen>
  );
}

function Card({ testID, title, eyebrow, open, onPress, children }: { testID: string; title: string; eyebrow?: string; open: boolean; onPress: () => void; children: React.ReactNode }) {
  return (
    <View testID={testID} style={{ borderWidth: open ? 1.5 : 1, borderColor: open ? color.ink : color.line, borderRadius: 16, backgroundColor: "#fff", overflow: "hidden" }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onPress} style={({ pressed }) => ({ paddingVertical: 12, paddingHorizontal: 16, flexDirection: "row", gap: 10, alignItems: "center", opacity: pressed ? 0.85 : 1 })}>
        <View style={{ flex: 1, gap: 2 }}>
          {eyebrow ? <Text style={[type.eyebrow(8), { color: color.mute }]}>{eyebrow}</Text> : null}
          <Text style={{ fontFamily: font.text[600], fontSize: 15, color: color.ink }}>{title}</Text>
        </View>
        <Text style={{ fontSize: 18, color: color.ink }}>{open ? "–" : "+"}</Text>
      </Pressable>
      {open ? <View style={{ paddingHorizontal: 16, paddingBottom: 14, gap: 8 }}>{children}</View> : null}
    </View>
  );
}

function KidCard({ a, open, onPress }: { a: KidAnswer; open: boolean; onPress: () => void }) {
  return (
    <Card testID={`kid-${a.id}`} title={`“${a.q}”`} eyebrow={a.path === "INTERFAITH" ? t("family.both") : doorLabel(a.path)} open={open} onPress={onPress}>
      <Text style={{ fontFamily: font.display[700], fontSize: 16, lineHeight: 22, color: color.ink }}>{a.answer}</Text>
      <View style={{ backgroundColor: color.cream, borderRadius: 12, padding: 10, gap: 3 }}>
        <Text style={[type.eyebrow(8), { color: color.ink }]}>{t("family.forYou")}</Text>
        <Text style={[type.body(13), { color: color.text }]}>{a.grownup}</Text>
      </View>
      <Text style={type.caption(11)}>{a.source}</Text>
    </Card>
  );
}

function SharedCard({ l, doors, open, onPress }: { l: SharedLesson; doors: string[]; open: boolean; onPress: () => void }) {
  const show = (doors.length ? doors : Object.keys(l.byPath)).filter((d) => l.byPath[d]);
  return (
    <Card testID={`shared-${l.id}`} title={l.title} eyebrow={t("family.sharedEyebrow", { theme: l.theme })} open={open} onPress={onPress}>
      <Text style={[type.body(14), { color: color.text }]}>{l.hook}</Text>
      {show.map((d) => (
        <View key={d} style={{ backgroundColor: color.cream, borderRadius: 12, padding: 10, gap: 3 }}>
          <Text style={[type.eyebrow(8), { color: color.ink }]}>{doorLabel(d)}</Text>
          <Text style={[type.body(13), { color: color.text }]}>{l.byPath[d].practice}</Text>
          <Text style={[type.body(13), { color: color.mute }]}>{l.byPath[d].meaning}</Text>
        </View>
      ))}
      <Text style={[type.body(13), { color: color.text }]}><Text style={{ fontFamily: font.text[700] }}>{t("family.shared")} </Text>{l.shared}</Text>
      <Text style={[type.body(13), { color: color.text }]}><Text style={{ fontFamily: font.text[700] }}>{t("family.different")} </Text>{l.different}</Text>
      <Text style={[type.body(13), { color: color.text }]}><Text style={{ fontFamily: font.text[700] }}>{t("family.tonight")} </Text>{l.familyActivity}</Text>
      <Text style={{ fontFamily: font.display[700], fontSize: 15, color: color.ink }}>{t("family.kidLine")} “{l.kidLine}”</Text>
    </Card>
  );
}
