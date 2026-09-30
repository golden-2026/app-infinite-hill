import { router } from "expo-router";
import { View } from "react-native";
import { useStore } from "@/lib/store";
import { t } from "@/i18n";
import { Body, Btn, Guy, H1, Screen } from "@/ui";

export default function NotFound() {
  const { saved } = useStore();
  const onboarded = saved.settings.onboarded;
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
        <Guy pose="wonder" h={150} />
        <H1 size={28} style={{ textAlign: "center" }}>{t("onboarding.notFound.h1")}</H1>
        <Body style={{ textAlign: "center" }}>{onboarded ? t("onboarding.notFound.onboarded") : t("onboarding.notFound.new")}</Body>
      </View>
      <Btn onPress={() => router.replace("/")}>{onboarded ? t("onboarding.signIn.backToday") : t("onboarding.notFound.start")}</Btn>
    </Screen>
  );
}
