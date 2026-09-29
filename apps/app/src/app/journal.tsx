import { useTitle } from "@/lib/title";
// The journal: today's prompt from the companion, a page to write on, and every past page. Each page is private
// and stays on this phone. Only pages with "share this with the companion" on may ever be sent to the server.
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { deleteEntry, saveEntry, setShared, useMemory } from "@/lib/companion/memory";
import { crisisWords } from "@/lib/companion/shape";
import { useCompanionDay } from "@/lib/companion/use-companion";
import { useStore } from "@/lib/store";
import { Btn, Guy, Screen, color, confirmSheet, font, toast, type } from "@/ui";
import { HelpCard } from "@/ui/companion";
import { Group, Row } from "@/ui/row";

export default function Journal() {
  useTitle("your journal");
  const { today } = useStore();
  const { day } = useCompanionDay();
  const m = useMemory();
  const [text, setText] = useState("");
  const [share, setShare] = useState(false);
  const [help, setHelp] = useState(false);
  const save = () => {
    const t = text.trim();
    if (!t) return;
    saveEntry({ date: today, prompt: day.prompt, text: t, shared: share });
    setText("");
    setShare(false);
    if (crisisWords(t)) setHelp(true);
    toast("saved on your phone.");
  };
  const pages = [...m.journal].reverse();
  return (
    <Screen scroll back={true} title="your journal." contentStyle={{ gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Guy pose="read" h={84} />
        <Text style={[type.body(13), { flex: 1, color: color.mute }]}>private. every page stays on this phone. nothing is shared unless you turn it on for that page.</Text>
      </View>
      {help || day.help ? <View style={{ marginHorizontal: -18 }}><HelpCard onClose={() => setHelp(false)} /></View> : null}
      <View style={{ gap: 8 }}>
        <Text style={type.eyebrow(8)}>today's page</Text>
        <Text style={{ fontFamily: font.display[500], fontSize: 19, lineHeight: 23, color: color.ink }}>{day.prompt}</Text>
        <TextInput value={text} onChangeText={setText} multiline placeholder="write as much or as little as you like." placeholderTextColor={color.mute} accessibilityLabel={`today's page: ${day.prompt}`}
          style={{ minHeight: 130, textAlignVertical: "top", padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: color.line, backgroundColor: "#fff", fontFamily: font.text[400], fontSize: 16, lineHeight: 22, color: color.ink }} />
        <Group>
          <Row first a="share this with the companion" b={share ? "it may read this page to know you better" : "off: this page stays only on your phone"} toggle={share} onPress={() => setShare(!share)} />
        </Group>
        <Btn onPress={save} disabled={!text.trim()}>save</Btn>
      </View>

      {pages.length ? <Text style={[type.eyebrow(8), { marginTop: 8 }]}>past pages</Text> : null}
      {pages.map((e) => (
        <View key={e.id} style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: color.line, gap: 6 }}>
          <Text style={type.eyebrow(7)}>{new Date(`${e.date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}{e.prompt ? ` · ${e.prompt}` : ""}</Text>
          <Text style={type.serif(17)}>{e.text}</Text>
          <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
            <Pressable accessibilityRole="switch" aria-checked={e.shared} accessibilityState={{ checked: e.shared }} accessibilityLabel="share this with the companion" onPress={() => setShared(e.id, !e.shared)} hitSlop={8} style={{ minHeight: 36, justifyContent: "center" }}>
              <Text style={[type.caption(12), e.shared ? { color: color.ink } : null]}>{e.shared ? "☀ shared with the companion · turn off" : "private · share with the companion"}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="delete this page" hitSlop={8} style={{ minHeight: 36, justifyContent: "center" }}
              onPress={async () => { if (await confirmSheet({ title: "delete this page?", body: "it's gone from this phone for good.", confirm: "delete", destructive: true })) deleteEntry(e.id); }}>
              <Text style={[type.caption(12), { color: color.danger }]}>delete</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </Screen>
  );
}
