import { useTitle } from "@/lib/title";
import { icon, label } from "@ih/content";
import { Text, View } from "react-native";
import { useStore } from "@/lib/store";
import { Body, Face, Screen, color, type } from "@/ui";

export default function Book() {
  useTitle("your book");
  const { saved } = useStore();
  const book = saved.settings.book;
  return (
    <Screen scroll back="you" title="your book." contentStyle={{ gap: 12 }}>
      {book.length === 0 ? (
        <View style={{ gap: 8 }}><Text style={type.h1(24)}>empty, for now.</Text><Body>after a session, tap <Text style={{ fontFamily: "Inter_700Bold" }}>keep it</Text> and the line goes here. one day this is the book you come back to — every line from a real door, in your order.</Body></View>
      ) : book.map((b, i) => (
        <View key={i} style={{ paddingVertical: 14, borderTopWidth: 1, borderTopColor: color.line }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><Face ic={icon(b.door)} w={20} h={20} r={10} caption={false} /><Text style={type.eyebrow(8)}>{label(b.door)} · {new Date(`${b.date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</Text></View>
          <Text style={[type.serif(17), { marginTop: 6 }]}>{b.line}</Text>
        </View>
      ))}
    </Screen>
  );
}
