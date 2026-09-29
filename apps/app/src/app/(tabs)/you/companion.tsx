import { useTitle } from "@/lib/title";
// What the companion knows: every fact it keeps about you, in plain words, each one editable and deletable, and
// "forget everything". Deleting a fact also stops the day being shaped by it. This lives on the phone.
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { addFact, deleteFact, editFact, forgetEverything, seedFacts, useMemory } from "@/lib/companion/memory";
import { useStore } from "@/lib/store";
import { Body, Btn, Guy, Screen, color, confirmSheet, font, toast, type } from "@/ui";

export default function CompanionKnows() {
  useTitle("what the companion knows");
  const { today, saved } = useStore();
  const m = useMemory();
  const profile = saved.settings.profile;
  useEffect(() => { if (profile?.door) seedFacts(profile, today, { kids: saved.settings.kids.length }); }, [profile?.door]); // eslint-disable-line react-hooks/exhaustive-deps
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState("");
  const input = { padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: color.line, backgroundColor: "#fff", fontFamily: font.text[400], fontSize: 16, color: color.ink } as const;
  const shared = m.journal.filter((e) => e.shared).length;
  return (
    <Screen scroll back="you" title="what the companion knows." contentStyle={{ gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Guy pose="think" h={90} />
        <Body style={{ flex: 1 }}>this lives on your phone. it's what shapes your practice and your note each day. change anything, or delete it, and the companion stops using it.</Body>
      </View>

      {m.facts.length === 0 ? (
        <Text style={[type.body(14), { color: color.mute }]}>nothing yet. it only knows what you tell it.</Text>
      ) : (
        <View>
          {m.facts.map((f) => (
            <View key={f.id} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: color.line, gap: 8 }}>
              {editing === f.id ? (
                <>
                  <TextInput value={draft} onChangeText={setDraft} autoFocus accessibilityLabel="edit this" style={input} onSubmitEditing={() => { editFact(f.id, draft); setEditing(null); }} />
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <Pressable accessibilityRole="button" onPress={() => { editFact(f.id, draft); setEditing(null); }} hitSlop={8}><Text style={[type.eyebrow(9), { color: color.ink }]}>save</Text></Pressable>
                    <Pressable accessibilityRole="button" onPress={() => setEditing(null)} hitSlop={8}><Text style={type.eyebrow(9)}>cancel</Text></Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={type.serif(17)}>{f.text}</Text>
                  <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
                    <Text style={type.caption(11)}>{f.from === "you" ? "you added this" : "from your answers"}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={`edit: ${f.text}`} onPress={() => { setEditing(f.id); setDraft(f.text); }} hitSlop={8} style={{ minHeight: 32, justifyContent: "center" }}><Text style={[type.eyebrow(8), { color: color.ink }]}>edit</Text></Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`delete: ${f.text}`} onPress={() => deleteFact(f.id)} hitSlop={8} style={{ minHeight: 32, justifyContent: "center" }}><Text style={[type.eyebrow(8), { color: color.danger }]}>delete</Text></Pressable>
                  </View>
                </>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={{ gap: 8 }}>
        <Text style={type.eyebrow(8)}>tell it something</Text>
        <TextInput value={adding} onChangeText={setAdding} placeholder="e.g. mornings are easier for me than nights." placeholderTextColor={color.mute} accessibilityLabel="add something the companion should know" style={input}
          onSubmitEditing={() => { addFact(adding, today); setAdding(""); }} />
        <Btn kind="ghost" disabled={!adding.trim()} onPress={() => { addFact(adding, today); setAdding(""); toast("kept."); }}>add</Btn>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={type.eyebrow(8)}>also on this phone</Text>
        <Text style={[type.body(13), { color: color.mute }]}>
          {m.moods.filter((x) => x.mood !== "skip").length} mood check-ins · {m.done.length} practices done · {m.journal.length} journal {m.journal.length === 1 ? "page" : "pages"} ({shared} shared with the companion). your kept lines stay in your book.
        </Text>
        <Pressable accessibilityRole="link" onPress={() => router.push("/journal")} hitSlop={8}><Text style={[type.caption(12), { color: color.ink }]}>open your journal ›</Text></Pressable>
      </View>
      <Text style={[type.caption(12)]}>when the companion's AI is on, it only ever sees the lines above and the journal pages you chose to share. never the rest.</Text>

      <Btn kind="danger" onPress={async () => {
        if (await confirmSheet({ title: "forget everything?", body: "every fact, mood, practice and journal page the companion kept on this phone. your days and your book stay.", confirm: "forget everything", destructive: true })) {
          forgetEverything();
          toast("forgotten.");
        }
      }}>forget everything</Btn>
    </Screen>
  );
}
