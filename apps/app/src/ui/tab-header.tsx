import { type ReactNode } from "react";
import { Text, View } from "react-native";
import { space, type } from "@ih/brand";
import { Eyebrow, Guy } from "@/ui";

/** The same top for every tab (together, guide, you): a label, the one large title, the guy on the right.
 *  Today keeps its map header. The parent supplies the side gutter. */
export function TabHeader({ eyebrow, title, pose, children }: { eyebrow: string; title: ReactNode; pose: string; children?: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: space.md, paddingTop: space.md }}>
      <View style={{ flex: 1, gap: 6 }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Text accessibilityRole="header" style={type.title()}>{title}</Text>
        {children}
      </View>
      <Guy pose={pose} h={104} />
    </View>
  );
}
