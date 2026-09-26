import { useTitle } from "@/lib/title";
// Your table: children on their own hills (v175 TableSheet). Kid mode under 13; the parent consents.
import { DOORS, icon, label } from "@ih/content";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { randomId } from "@/lib/ids";
import { useStore } from "@/lib/store";
import { Body, Btn, Eyebrow, Face, Screen, color, font, type, confirmSheet, toast } from "@/ui";

export default function Table() {
  useTitle("your table");
  const { saved, derived, update } = useStore();
  const kids = saved.settings.kids;
  const [name, setName] = useState("");
  const [age, setAge] = useState(9);
  const [door, setDoor] = useState(saved.settings.homeWing === "SPIRITUAL" ? "HINDUISM" : saved.settings.homeWing);
  const [adding, setAdding] = useState(kids.length === 0);
  const add = () => {
    if (!name.trim()) return;
    update({ kids: [...kids, { id: randomId("kid_").slice(0, 24), name: name.trim().slice(0, 40), door, birthYear: new Date().getFullYear() - age }] });
    toast(`${name.trim()} is at your table`);
    setName("");
    setAdding(false);
  };
  const chip = (on: boolean, text: string, onPress: () => void, key: string) => (
    <Pressable key={key} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} onPress={onPress} style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: on ? color.ink : color.line, backgroundColor: on ? color.ink : "#fff" }}>
      <Text style={{ fontFamily: font.text[700], fontSize: 13, color: on ? color.gold : color.ink }}>{text}</Text>
    </Pressable>
  );
  return (
    <Screen scroll back="you" title="your table." contentStyle={{ gap: 12 }}>
      {derived.kids.map((k: any) => {
        const kidAge = new Date().getFullYear() - (k.birthYear || 2016);
        return (
          <View key={k.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: color.line }}>
            <Face ic={icon(k.door)} w={36} h={36} r={18} caption={false} />
            <View style={{ flex: 1 }}>
              <Text style={type.serif(17)}>{k.name} <Text style={type.eyebrow(7)}>· {kidAge} · {label(k.door)} · day {k.day}{k.done ? " ✓" : ""}</Text></Text>
              <Text style={[type.body(12), { color: color.mute }]}>{kidAge < 13 ? "kid mode: matching, ordering, the stories · shorter sits · no Guide" : "the full game"}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${k.name}`} onPress={async () => { if (await confirmSheet({ title: `remove ${k.name}?`, body: "their hill leaves this phone. you can add them again, but their days start over.", confirm: "remove", cancel: "keep", destructive: true })) { update({ kids: kids.filter((x) => x.id !== k.id) }); toast(`${k.name} removed`); } }} style={{ minHeight: 44, minWidth: 44, paddingHorizontal: 10, justifyContent: "center" }}><Text style={[type.eyebrow(), { color: color.danger }]}>remove</Text></Pressable>
            {!k.done ? <Btn style={{ paddingHorizontal: 12, paddingVertical: 10 }} onPress={() => router.push({ pathname: "/session/[door]/[day]", params: { door: k.door, day: String(k.day), kid: k.id } })}>{`sit as ${k.name}`}</Btn> : <Text style={type.eyebrow(8)}>done today</Text>}
          </View>
        );
      })}
      {adding ? (
        <View style={{ backgroundColor: "#fff", borderRadius: 18, padding: 14, gap: 8 }}>
          <Eyebrow>add a child</Eyebrow>
          <TextInput value={name} onChangeText={setName} placeholder="name" accessibilityLabel="Child's name" style={{ padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: color.line, fontFamily: font.text[400], fontSize: 16 }} />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel="Age">{[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((a) => chip(age === a, String(a), () => setAge(a), `a${a}`))}</View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel="Door">{DOORS.filter(([, w]) => w !== "SPIRITUAL").map(([l, w]) => chip(door === w, l, () => setDoor(w), w))}</View>
          <Body size={11} style={{ color: color.mute }}>under 13 runs kid mode automatically. you consent as the parent; that's the law, and it's the only time we ever learn an age. their days go on their own hill, next to yours.</Body>
          <Btn onPress={add} disabled={!name.trim()}>{`add ${name.trim() || "child"}`}</Btn>
          {kids.length ? <Btn kind="ghost" onPress={() => { setName(""); setAdding(false); }}>cancel</Btn> : null}
        </View>
      ) : <Pressable accessibilityRole="button" onPress={() => setAdding(true)}><Text style={[type.eyebrow(), { marginTop: 14 }]}>+ add a child</Text></Pressable>}
    </Screen>
  );
}
