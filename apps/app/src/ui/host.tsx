import { type ReactNode } from "react";
import { View } from "react-native";
import { icon } from "@ih/content";
import { Bubble, Face, Guy } from "@/ui";

/** v175 Host: the mascot (or, once a door is chosen, its voice's face) speaking in a bubble. The mascot takes a
 *  pose that fits the moment (`pose`), like a game character, instead of the static sun it used to be. */
export function Host({ children, door, pose = "wave" }: { children: ReactNode; door?: string | null; pose?: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-end" }}>
      {door ? <Face ic={icon(door)} w={64} h={64} r={32} caption={false} /> : <Guy pose={pose} h={92} />}
      <View style={{ flex: 1, alignSelf: "flex-start" }}><Bubble>{children}</Bubble></View>
    </View>
  );
}
