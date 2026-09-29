// The door screen's cards: "my own path" (big, with the mascot — never a small tile in a corner), a tradition's
// big card (your door / your roots with fresh eyes), and the smaller tradition tiles. All are radios.
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { icon, label } from "@ih/content";
import { DOOR_HOOK, OWN_PATH } from "@/content/journeys";
import { tapHaptic } from "@/lib/haptics";
import { Face, Guy, color, font, type } from "@/ui";

function Radio({ on, onPress, a11y, style, children }: { on: boolean; onPress: () => void; a11y: string; style: any; children: ReactNode }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={a11y}
      onPress={() => { tapHaptic(); onPress(); }}
      style={({ pressed }) => [style, { transform: [{ scale: pressed ? 0.985 : 1 }] }]}>
      {children}
    </Pressable>
  );
}

const Check = ({ on, dark }: { on: boolean; dark?: boolean }) => (
  <View style={[s.check, on ? { backgroundColor: color.gold, borderColor: color.gold } : { borderColor: dark ? "#ffffff55" : color.line }]}>
    {on ? <Text style={{ fontFamily: font.text[700], fontSize: 13, color: color.ink }}>✓</Text> : null}
  </View>
);

/** "my own path", wherever it's offered. "hero": the big dark card with the mascot (no religion, exploring,
 *  spiritual, or nothing told). "soft": a lighter card offered beside someone's roots — an option, never a redirect. */
export function OwnPathCard({ on, onPress, size = "hero", eyebrow = "my own path" }: { on: boolean; onPress: () => void; size?: "hero" | "soft"; eyebrow?: string }) {
  const hero = size === "hero";
  return (
    <Radio on={on} onPress={onPress} a11y="my own path" style={[hero ? s.own : s.ownSoft, on && (hero ? s.ownOn : s.bigOn)]}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={[type.eyebrow(11), { color: hero ? color.gold : color.mute, paddingRight: 30 }]}>{eyebrow}</Text>
          <Text style={{ fontFamily: font.display[800], fontSize: hero ? 26 : 22, lineHeight: hero ? 28 : 24, letterSpacing: -0.6, color: hero ? "#fff" : color.ink }}>{OWN_PATH.line}</Text>
          <Text style={[type.body(hero ? 14 : 13), { color: hero ? "#ffffffcc" : color.mute }]}>{OWN_PATH.promise}</Text>
        </View>
        <Guy pose={hero ? "globe" : "wonder"} h={hero ? 128 : 96} style={{ marginRight: -8, marginBottom: -6 }} />
      </View>
      <View style={{ position: "absolute", top: 14, right: 14 }}><Check on={on} dark={hero} /></View>
    </Radio>
  );
}

/** A tradition as a big card: "your door" for someone who practices, or "your roots, with fresh eyes". */
export function BigDoorCard({ door, on, onPress, eyebrow, line, a11y }: { door: string; on: boolean; onPress: () => void; eyebrow: string; line?: string; a11y?: string }) {
  const ic = icon(door);
  return (
    <Radio on={on} onPress={onPress} a11y={a11y ?? label(door)} style={[s.big, on && s.bigOn, { borderLeftColor: ic.tint }]}>
      <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
        <Face ic={ic} w={76} h={76} r={38} caption={false} />
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <Text style={[type.eyebrow(11), { color: ic.tint, flexShrink: 1 }]}>{eyebrow}</Text>
            <Check on={on} />
          </View>
          <Text style={{ fontFamily: font.display[800], fontSize: 26, lineHeight: 28, letterSpacing: -0.6, color: color.ink }}>{label(door)}</Text>
          <Text style={[type.body(13), { color: color.mute }]}>{line ?? DOOR_HOOK[door]}</Text>
        </View>
      </View>
    </Radio>
  );
}

/** A tradition tile in the "or walk one door" grid: the name and what its trek holds. */
export function DoorTile({ door, on, onPress }: { door: string; on: boolean; onPress: () => void }) {
  const ic = icon(door);
  return (
    <Radio on={on} onPress={onPress} a11y={label(door)} style={[s.tile, on && s.tileOn]}>
      <View style={[s.dot, { backgroundColor: ic.tint }]} />
      <Text style={{ fontFamily: font.display[500], fontSize: 17, color: color.ink }}>{label(door)}</Text>
      <Text style={[type.body(12), { color: color.mute, marginTop: 3, lineHeight: 16 }]}>{DOOR_HOOK[door]}</Text>
    </Radio>
  );
}

const s = StyleSheet.create({
  own: { backgroundColor: color.ink, borderRadius: 22, padding: 18, paddingBottom: 14, borderWidth: 2, borderColor: color.ink, overflow: "hidden" },
  ownOn: { borderColor: color.gold },
  ownSoft: { backgroundColor: color.white, borderRadius: 22, padding: 16, paddingBottom: 12, borderWidth: 1.5, borderColor: color.line, overflow: "hidden" },
  big: { backgroundColor: color.white, borderRadius: 22, padding: 16, borderWidth: 1.5, borderColor: color.line, borderLeftWidth: 6 },
  bigOn: { borderColor: color.ink, backgroundColor: "#FFFBE0" },
  tile: { width: "48.5%", minHeight: 104, borderWidth: 1.5, borderColor: color.line, backgroundColor: color.white, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 12 },
  tileOn: { borderColor: color.ink, backgroundColor: "#FFFBE0" },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 8 },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
});
