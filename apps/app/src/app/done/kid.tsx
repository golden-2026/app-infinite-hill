import { useTitle } from "@/lib/title";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { play } from "@/lib/fx";
import { successHaptic } from "@/lib/haptics";
import { useStore } from "@/lib/store";
import { Btn, Guy, Screen, Sun, color, type } from "@/ui";
import { GOLDEN, Odometer } from "@/ui/streak";
import { t } from "@/i18n";

// A child's streak, kid-sized: one big number, a cheer, and back to the table. It's the child's own streak;
// it never touches the parent's.
export default function KidStreak() {
  useTitle(t("session.lit.title"));
  const p = useLocalSearchParams<{ kid: string; streak: string; prev: string }>();
  const { saved } = useStore();
  const kid = saved.settings.kids.find((k) => k.id === p.kid);
  const n = Number(p.streak) || 1;
  const back = () => router.replace("/you/table");
  useEffect(() => { const t = setTimeout(() => { play("reward"); successHaptic(); }, 1300); return () => clearTimeout(t); }, []);
  const name = kid?.name || t("session.kid.you");
  return (
    <Screen close={back} footer={<Btn testID="kid-back" onPress={back}>{t("session.kid.back")}</Btn>}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Guy pose="celebrate" h={170} />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: GOLDEN, borderWidth: 2, borderColor: color.ink, borderRadius: 28, paddingLeft: 22, paddingRight: 14, paddingVertical: 4 }}>
          <Odometer from={Math.min(Number(p.prev) || 0, n)} to={n} size={96} />
          <Sun size={44} mood="happy" />
        </View>
        <Text accessibilityRole="header" style={[type.h1(28), { textAlign: "center" }]}>{n === 1 ? t("session.kid.one", { name }) : t("session.kid.n", { n, name })}</Text>
        <Text style={[type.body(16), { textAlign: "center", color: color.mute }]}>{n === 1 ? t("session.kid.oneBody") : t("session.kid.nBody")}</Text>
      </View>
    </Screen>
  );
}
