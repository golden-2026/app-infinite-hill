import { useTitle } from "@/lib/title";
// Your table: children on their own hills (v175 TableSheet). Kid mode under 13; the parent consents.
import { DOORS, icon } from "@ih/content";
import { doorLabel, t } from "@/i18n";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { randomId } from "@/lib/ids";
import { useStore } from "@/lib/store";
import { Body, Btn, Eyebrow, Face, Screen, color, font, type, confirmSheet, toast } from "@/ui";

export default function Table() {
  useTitle(t("companion.you.table"));
  const { saved, derived, update } = useStore();
  const kids = saved.settings.kids;
  const [name, setName] = useState("");
  const [age, setAge] = useState(9);
  const [door, setDoor] = useState(saved.settings.homeWing === "SPIRITUAL" ? "HINDUISM" : saved.settings.homeWing);
  const [adding, setAdding] = useState(kids.length === 0);
  const add = () => {
    if (!name.trim()) return;
    update({ kids: [...kids, { id: randomId("kid_").slice(0, 24), name: name.trim().slice(0, 40), door, birthYear: new Date().getFullYear() - age }] });
    toast(t("companion.table.added", { name: name.trim() }));
    setName("");
    setAdding(false);
  };
  const chip = (on: boolean, text: string, onPress: () => void, key: string) => (
    <Pressable key={key} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} onPress={onPress} style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: on ? color.ink : color.line, backgroundColor: on ? color.ink : "#fff" }}>
      <Text style={{ fontFamily: font.text[700], fontSize: 13, color: on ? color.gold : color.ink }}>{text}</Text>
    </Pressable>
  );
  return (
    <Screen scroll back="you" title={t("companion.table.header")} contentStyle={{ gap: 12 }}>
      {derived.kids.map((k: any) => {
        const kidAge = new Date().getFullYear() - (k.birthYear || 2016);
        // Name and details get the full width; the actions wrap to their own line (they used to squeeze the name to one letter a line).
        return (
          <View key={k.id} style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: 10, rowGap: 8, paddingVertical: 12, borderTopWidth: 1, borderTopColor: color.line }}>
            <Face ic={icon(k.door)} w={36} h={36} r={18} caption={false} />
            <View style={{ flex: 1, minWidth: 180 }}>
              <Text style={type.serif(17)}>{k.name} <Text style={type.eyebrow(7)}>· {kidAge} · {doorLabel(k.door)} · {t("common.day", { n: k.day })}{k.done ? " ✓" : ""}{saved.settings.streakOn !== false && k.streak?.streak ? ` · ${t("common.streakDays", { n: k.streak.streak })}` : ""}</Text></Text>
              <Text style={[type.body(12), { color: color.mute }]}>{kidAge < 13 ? t("companion.table.kidMode") : t("companion.table.full")}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={t("companion.table.removeA11y", { name: k.name })} onPress={async () => { if (await confirmSheet({ title: t("companion.table.removeTitle", { name: k.name }), body: t("companion.table.removeBody"), confirm: t("companion.table.remove"), cancel: t("companion.table.keep"), destructive: true })) { update({ kids: kids.filter((x) => x.id !== k.id) }); toast(t("companion.table.removed", { name: k.name })); } }} style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 10, justifyContent: "center" }}><Text style={[type.eyebrow(), { color: color.danger }]}>{t("companion.table.remove")}</Text></Pressable>
            {!k.done ? <Btn style={{ paddingHorizontal: 12, paddingVertical: 10 }} onPress={() => router.push({ pathname: "/session/[door]/[day]", params: { door: k.door, day: String(k.day), kid: k.id } })}>{t("companion.table.sitAs", { name: k.name })}</Btn> : <Text style={type.eyebrow(8)}>{t("companion.table.doneToday")}</Text>}
          </View>
        );
      })}
      {adding ? (
        <View style={{ backgroundColor: "#fff", borderRadius: 18, padding: 14, gap: 8 }}>
          <Eyebrow>{t("companion.table.addChild")}</Eyebrow>
          <TextInput value={name} onChangeText={setName} placeholder={t("companion.table.name")} accessibilityLabel={t("companion.table.nameA11y")} style={{ padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: color.line, fontFamily: font.text[400], fontSize: 16 }} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel={t("companion.table.age")}>{[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((a) => chip(age === a, String(a), () => setAge(a), `a${a}`))}</View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel={t("companion.table.door")}>{DOORS.filter(([, w]) => w !== "SPIRITUAL").map(([, w]) => chip(door === w, doorLabel(w), () => setDoor(w), w))}</View>
          <Body size={11} style={{ color: color.mute }}>{t("companion.table.consent")}</Body>
          <Btn onPress={add} disabled={!name.trim()}>{name.trim() ? t("companion.table.add", { name: name.trim() }) : t("companion.table.addEmpty")}</Btn>
          {kids.length ? <Btn kind="ghost" onPress={() => { setName(""); setAdding(false); }}>{t("common.cancel")}</Btn> : null}
        </View>
      ) : <Pressable accessibilityRole="button" onPress={() => setAdding(true)}><Text style={[type.eyebrow(), { marginTop: 14 }]}>{t("companion.table.plusAdd")}</Text></Pressable>}
    </Screen>
  );
}
