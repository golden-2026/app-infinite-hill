import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { DOORS, label } from "@ih/content";
import { Btn, Eyebrow, color, font } from "@/ui";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

export default function PickDoor() {
  useEffect(() => { track("onboard_step", { step: "door" }); }, []);
  useTitle("pick a door");
  const [door, setDoor] = useState<string | null>(null);
  return (
    <WelcomeFrame step={1} door={door} footer={<Btn disabled={!door} onPress={() => router.push(door === "SPIRITUAL" ? "/welcome/intake" : { pathname: "/welcome/know", params: { door: door! } })}>{door ? (door === "SPIRITUAL" ? "Start my path" : `Open ${label(door)}`) : "Pick a door"}</Btn>}>
      <Host>Which door is yours? You can change it any time — your days come with you.</Host>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }} accessibilityRole="radiogroup">
        {DOORS.map(([l, w]) => (
          <Pressable key={w} accessibilityRole="radio" accessibilityState={{ checked: door === w }} aria-checked={door === w} accessibilityLabel={w === "SPIRITUAL" ? "my own path" : l} onPress={() => setDoor(w)}
            style={{ width: "48.5%", borderWidth: 1.5, borderColor: door === w ? color.ink : color.line, backgroundColor: door === w ? "#FFFBE0" : color.white, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12 }}>
            <Text style={{ fontFamily: font.display[500], fontSize: 17, color: color.ink }}>{w === "SPIRITUAL" ? "my own path" : l}</Text>
            <Eyebrow size={8} style={{ marginTop: 4 }}>{w === "SPIRITUAL" ? "simply spiritual · a bit of each" : "one word a day"}</Eyebrow>
          </Pressable>
        ))}
      </View>
      <Eyebrow size={8} style={{ textAlign: "center" }}>more traditions on the way.</Eyebrow>
    </WelcomeFrame>
  );
}
