import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { accountsOn } from "@/lib/supabase";
import { Body, Btn, Eyebrow, Logo, color, font } from "@/ui";

export default function Splash() {
  useTitle("");
  return (
    <SafeAreaView style={styles.fill} edges={["top", "bottom"]}>
      <View style={styles.center}>
        <Logo h={190} />
        <Text accessibilityRole="header" style={styles.mark}>infinite hill</Text>
        <Body size={17} style={{ color: color.mute, marginTop: 12, textAlign: "center" }}>making religion cool again.</Body>
      </View>
      <View style={{ gap: 10 }}>
        <Btn testID="start-free" onPress={() => router.push("/welcome/door")}>Start free</Btn>
        <Btn kind="ghost" onPress={() => router.push("/sign-in")}>{accountsOn() ? "I already have an account" : "I've been here before"}</Btn>
      </View>
      <Eyebrow size={8} style={{ textAlign: "center", marginTop: 14 }}>free · no sign-up · eight doors</Eyebrow>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.cream, paddingHorizontal: 24, paddingBottom: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  mark: { fontFamily: font.mark[800], fontSize: 56, color: color.ink, marginTop: 14, lineHeight: 60 },
});
