import { router } from "expo-router";
import { View } from "react-native";
import { useStore } from "@/lib/store";
import { Body, Btn, Guy, H1, Screen } from "@/ui";

export default function NotFound() {
  const { saved } = useStore();
  const onboarded = saved.settings.onboarded;
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
        <Guy pose="wonder" h={150} />
        <H1 size={28} style={{ textAlign: "center" }}>this path doesn't go anywhere.</H1>
        <Body style={{ textAlign: "center" }}>{onboarded ? "the hill is still right where you left it." : "the front door is this way."}</Body>
      </View>
      <Btn onPress={() => router.replace("/")}>{onboarded ? "back to today" : "go to the start"}</Btn>
    </Screen>
  );
}
