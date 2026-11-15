import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { accountsOn } from "@/lib/supabase";
import { t } from "@/i18n";
import { Btn, Eyebrow, Logo, color, font } from "@/ui";
import { Shout, Tag, Wordmark, shoutWords } from "@/ui/loud";

// Loud brand splash (2026-11-06): the wordmark as a graphic, one huge slamming headline with its last word in lime,
// the line, then the pill buttons (BRIEF.md "Brand" and "Magna's playbook").
export default function Splash() {
  useTitle("");
  const head = shoutWords(t("onboarding.splash.headline"));
  return (
    <SafeAreaView style={styles.fill} edges={["top", "bottom"]}>
      <View style={styles.top}>
        <Wordmark size={30} />
        <Tag>{t("onboarding.splash.drop")}</Tag>
      </View>
      <View style={styles.center}>
        <Shout words={head.words} hot={head.hot} size={78} start={150} />
        <Text style={styles.line}>{t("onboarding.splash.line")}</Text>
        <View style={styles.finnRow}>
          <Text style={styles.tag}>{t("onboarding.splash.tagline")}</Text>
          <Logo h={92} />
        </View>
      </View>
      <View style={{ gap: 10 }}>
        <Btn testID="start-free" onPress={() => router.push("/welcome/you")}>{t("onboarding.splash.start")}</Btn>
        <Btn kind="ghost" onPress={() => router.push("/sign-in")}>{accountsOn() ? t("onboarding.splash.haveAccount") : t("onboarding.splash.beenHere")}</Btn>
      </View>
      <Eyebrow size={8} style={{ textAlign: "center", marginTop: 14 }}>{t("onboarding.splash.eyebrow")}</Eyebrow>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: color.cream, paddingHorizontal: 20, paddingBottom: 18 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12 },
  center: { flex: 1, justifyContent: "center", gap: 16 },
  line: { fontFamily: font.text[700], fontSize: 17, lineHeight: 24, color: color.ink, maxWidth: 340 },
  finnRow: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  tag: { flex: 1, fontFamily: font.text[600], fontSize: 14, lineHeight: 20, color: color.gold },
});
