import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { useDone } from "@/lib/done";
import { Bubble, Btn, Screen, Sun, color, type } from "@/ui";

// v175 PostLesson step 4: save your day. Email code sign-in (no password); "later" keeps it on this phone.
export default function Save() {
  useTitle("save your day");
  const { go, close } = useDone();
  return (
    <Screen close={close} footer={<>
        <Btn testID="save-email" onPress={() => router.push({ pathname: "/sign-in", params: { then: "/done/remind", mode: "save" } })}>save with email</Btn>
        <Btn kind="ghost" onPress={() => go("/done/remind")}>later — keep it on this phone</Btn>
      </>}>
      <View style={{ flex: 1, justifyContent: "center", gap: 16 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}><Sun size={56} mood="happy" /><Bubble>day one counts. don't lose it.</Bubble></View>
        <Text accessibilityRole="header" style={type.title()}>save your day.{"\n"}<Text style={{ fontFamily: "Manrope_500Medium", fontStyle: "italic" }}>one email. no password.</Text></Text>
        <Text style={[type.body(), { color: color.mute }]}>we'll send a 6-digit code. your days follow you to any phone or browser.</Text>
      </View>
    </Screen>
  );
}
