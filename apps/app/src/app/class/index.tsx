import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CLASS_MONTHS, classMonth } from "@/content/classes/months";
import { readJSON } from "@/lib/storage";
import { CloseButton, color, font, type } from "@/ui";

// The new class format (owner, 2026-10-20): month 1 of each home built so far, a class every day, seven a week.
// A preview reached at /class; it doesn't touch the live lessons, the streak or the path.

export default function ClassMonth() {
  const { home } = useLocalSearchParams<{ home?: string }>();
  const M = classMonth(home);
  useTitle(`${M.land} · ${M.theme}`);
  const [done] = useState<number[]>(() => readJSON<number[]>(M.doneKey, []));
  const close = () => (router.canGoBack() ? router.back() : router.replace("/today"));
  let day = 0;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.ink }}>
      <View style={{ alignItems: "flex-end", paddingHorizontal: 8 }}><CloseButton dark onPress={close} /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 18 }}>
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
            {CLASS_MONTHS.map((m) => (
              <Pressable key={m.key} testID={`class-home-${m.key}`} accessibilityRole="tab" accessibilityState={{ selected: m.key === M.key }}
                onPress={() => router.replace({ pathname: "/class", params: { home: m.key } })}
                style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: m.key === M.key ? color.gold : "#ffffff1a" }}>
                <Text style={{ fontFamily: font.text[600], fontSize: 13, color: m.key === M.key ? color.ink : "#fff" }}>{m.land}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[type.eyebrow(8), { color: color.gold }]}>{M.land} · the home of {M.faith} · month 1</Text>
          <Text accessibilityRole="header" style={[type.h1(30), { color: "#fff" }]}>{M.theme}</Text>
          <Text style={[type.body(14), { color: "#ffffffaa" }]}>A class every day, about four minutes. Practice lives on the mountain: each class ends with places to go before the next one.</Text>
        </View>
        {M.weeks.map((w) => (
          <View key={w.week} style={{ gap: 8 }}>
            <Text style={{ fontFamily: font.text[600], fontSize: 13, color: "#ffffffcc" }}>{w.week}</Text>
            {w.classes.map((c) => {
              day += 1;
              const n = day;
              const isDone = done.includes(n);
              return (
                <Pressable key={n} testID={`class-day-${n}`} accessibilityRole="link" accessibilityLabel={`Day ${n}: ${c.title}${isDone ? ", done" : ""}`}
                  onPress={() => router.push({ pathname: "/class/[day]", params: { day: String(n), home: M.key } })}
                  style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#ffffff10", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, opacity: pressed ? 0.8 : 1 })}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: isDone ? color.gold : "#ffffff1a" }}>
                    <Text style={{ fontFamily: font.text[600], fontSize: 13, color: isDone ? color.ink : "#fff" }}>{isDone ? "✓" : n}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: font.text[600], fontSize: 16, color: "#fff" }}>{c.title}</Text>
                    <Text numberOfLines={1} style={[type.body(13), { color: "#ffffff99" }]}>{c.life[0]}</Text>
                  </View>
                  <Text style={{ fontSize: 20, color: "#ffffff99" }}>›</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
