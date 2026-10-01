import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { useDone } from "@/lib/done";
import { Bubble, Btn, Screen, Sun, color, type } from "@/ui";
import { t } from "@/i18n";

// v175 PostLesson step 4: save your day. Email code sign-in (no password); "later" keeps it on this phone.
export default function Save() {
  useTitle(t("session.save.title"));
  const { go, close } = useDone();
  return (
    <Screen close={close} footer={<>
        <Btn testID="save-email" onPress={() => router.push({ pathname: "/sign-in", params: { then: "/done/tomorrow", mode: "save" } })}>{t("session.save.email")}</Btn>
        <Btn kind="ghost" onPress={() => go("/done/tomorrow")}>{t("session.save.later")}</Btn>
      </>}>
      <View style={{ flex: 1, justifyContent: "center", gap: 16 }}>
        <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}><Sun size={56} mood="happy" /><Bubble>{t("session.save.bubble")}</Bubble></View>
        <Text accessibilityRole="header" style={type.title()}>{t("session.save.head")}{"\n"}<Text style={{ fontFamily: "Manrope_500Medium", fontStyle: "italic" }}>{t("session.save.headSub")}</Text></Text>
        <Text style={[type.body(), { color: color.mute }]}>{t("session.save.body")}</Text>
      </View>
    </Screen>
  );
}
