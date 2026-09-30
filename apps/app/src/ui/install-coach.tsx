import { Text, View } from "react-native";
import { t } from "@/i18n";
import { color, font, type } from "@/ui";

/** iPhone Safari only allows web reminders from the Home Screen app. Three steps, plainly. */
export function InstallCoach() {
  const steps = [t("onboarding.install.step1"), t("onboarding.install.step2"), t("onboarding.install.step3")];
  return (
    <View style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: color.line, borderRadius: 16, padding: 14, gap: 8 }} accessibilityLabel={t("onboarding.install.a11y")}>
      <Text style={type.caption()}>{t("onboarding.install.title")}</Text>
      {steps.map((s, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 10 }}>
          <Text style={{ fontFamily: font.display[800], fontSize: 15, color: color.ink, width: 16 }}>{i + 1}</Text>
          <Text style={[type.body(13), { flex: 1 }]}>{s}</Text>
        </View>
      ))}
    </View>
  );
}

export const needsInstallCoach = () => {
  if (typeof window === "undefined") return false;
  const n: any = window.navigator;
  const ios = /iPhone|iPad|iPod/.test(n?.userAgent || "");
  const standalone = n?.standalone === true || window.matchMedia?.("(display-mode: standalone)")?.matches;
  return ios && !standalone;
};
