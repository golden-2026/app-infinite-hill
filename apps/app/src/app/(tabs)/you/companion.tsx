import { useTitle } from "@/lib/title";
// What the companion knows: every fact it keeps about you, in plain words, each one editable and deletable, and
// "forget everything". Deleting a fact also stops the day being shaped by it. This lives on the phone.
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { addFact, deleteFact, editFact, factText, forgetEverything, seedFacts, useMemory } from "@/lib/companion/memory";
import { t } from "@/i18n";
import { useStore } from "@/lib/store";
import { Body, Btn, Guy, Screen, color, confirmSheet, font, toast, type } from "@/ui";

export default function CompanionKnows() {
  useTitle(t("companion.you.knows"));
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
    <Screen scroll back="you" title={t("companion.knows.header")} contentStyle={{ gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Guy pose="think" h={90} />
        <Body style={{ flex: 1 }}>{t("companion.knows.intro")}</Body>
      </View>

      {m.facts.length === 0 ? (
        <Text style={[type.body(14), { color: color.mute }]}>{t("companion.knows.empty")}</Text>
      ) : (
        <View>
          {m.facts.map((f) => { const text = factText(f, profile, { kids: saved.settings.kids.length }); return (
            <View key={f.id} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: color.line, gap: 8 }}>
              {editing === f.id ? (
                <>
                  <TextInput value={draft} onChangeText={setDraft} autoFocus accessibilityLabel={t("companion.knows.editA11y")} style={input} onSubmitEditing={() => { editFact(f.id, draft); setEditing(null); }} />
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <Pressable accessibilityRole="button" onPress={() => { editFact(f.id, draft); setEditing(null); }} hitSlop={8}><Text style={[type.eyebrow(9), { color: color.ink }]}>{t("companion.journal.save")}</Text></Pressable>
                    <Pressable accessibilityRole="button" onPress={() => setEditing(null)} hitSlop={8}><Text style={type.eyebrow(9)}>{t("common.cancel")}</Text></Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={type.serif(17)}>{text}</Text>
                  <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
                    <Text style={type.caption(11)}>{f.from === "you" ? t("companion.knows.youAdded") : t("companion.knows.fromAnswers")}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={t("companion.knows.editLabel", { fact: text })} onPress={() => { setEditing(f.id); setDraft(text); }} hitSlop={8} style={{ minHeight: 32, justifyContent: "center" }}><Text style={[type.eyebrow(8), { color: color.ink }]}>{t("companion.knows.edit")}</Text></Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={t("companion.knows.deleteLabel", { fact: text })} onPress={() => deleteFact(f.id)} hitSlop={8} style={{ minHeight: 32, justifyContent: "center" }}><Text style={[type.eyebrow(8), { color: color.danger }]}>{t("companion.journal.delete")}</Text></Pressable>
                  </View>
                </>
              )}
            </View>
          ); })}
        </View>
      )}

      <View style={{ gap: 8 }}>
        <Text style={type.eyebrow(8)}>{t("companion.knows.tell")}</Text>
        <TextInput value={adding} onChangeText={setAdding} placeholder={t("companion.knows.placeholder")} placeholderTextColor={color.mute} accessibilityLabel={t("companion.knows.addA11y")} style={input}
          onSubmitEditing={() => { addFact(adding, today); setAdding(""); }} />
        <Btn kind="ghost" disabled={!adding.trim()} onPress={() => { addFact(adding, today); setAdding(""); toast(t("companion.knows.kept")); }}>{t("common.add")}</Btn>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={type.eyebrow(8)}>{t("companion.knows.also")}</Text>
        <Text style={[type.body(13), { color: color.mute }]}>
          {t("companion.knows.stats", { moods: m.moods.filter((x) => x.mood !== "skip").length, done: m.done.length, pages: t("companion.knows.pages", { count: m.journal.length }), shared })}
        </Text>
        <Pressable accessibilityRole="link" onPress={() => router.push("/journal")} hitSlop={8}><Text style={[type.caption(12), { color: color.ink }]}>{t("companion.knows.openJournal")}</Text></Pressable>
      </View>
      <Text style={[type.caption(12)]}>{t("companion.knows.aiNote")}</Text>

      <Btn kind="danger" onPress={async () => {
        if (await confirmSheet({ title: t("companion.knows.forgetTitle"), body: t("companion.knows.forgetBody"), confirm: t("companion.knows.forget"), destructive: true })) {
          forgetEverything();
          toast(t("companion.knows.forgotten"));
        }
      }}>{t("companion.knows.forget")}</Btn>
    </Screen>
  );
}
