import { type ReactNode } from "react";
import { View } from "react-native";
import { icon } from "@ih/content";
import { Bubble, Face, Sun } from "@/ui";

/** v175 Host: the sun (or, once a door is chosen, its voice's face) speaking in a bubble. */
export function Host({ children, door }: { children: ReactNode; door?: string | null }) {
  return (
    <View style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
      {door ? <Face ic={icon(door)} w={64} h={64} r={32} caption={false} /> : <Sun size={56} />}
      <Bubble>{children}</Bubble>
    </View>
  );
}
