import { router } from "expo-router";
import { View } from "react-native";
import { Body, Btn, Guy, H1, Screen } from "@/ui";

export default function NotFound() {
  return (
    <Screen>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 14 }}>
        <Guy pose="wonder" h={150} />
        <H1 size={28}>this path doesn't go anywhere.</H1>
        <Body>the hill is still right where you left it.</Body>
      </View>
      <Btn onPress={() => router.replace("/")}>back to today</Btn>
    </Screen>
  );
}
