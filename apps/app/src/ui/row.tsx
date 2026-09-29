import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { border, color, font, radius, space, type } from "@ih/brand";
import { tapHaptic } from "@/lib/haptics";
import { ChevronRight } from "@/ui/tab-icons";

/** An on/off switch drawn like the phone's own. */
function Switch({ on }: { on: boolean }) {
  return (
    <View style={{ width: 46, height: 28, borderRadius: 14, padding: 3, backgroundColor: on ? color.ink : color.line, alignItems: on ? "flex-end" : "flex-start" }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: on ? color.gold : "#fff", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }} />
    </View>
  );
}

/** A settings row: a title, a line under it, and a chevron, a value, or a switch on the right.
 *  Pressed rows go gray, as on iOS; they don't shrink like buttons. */
export function Row({ a, b, right, onPress, testID, toggle, first, cycle }: { a: string; b?: string; right?: string; onPress?: () => void; testID?: string; toggle?: boolean; first?: boolean; /** changes in place (steps through values): a value chip, not a link arrow */ cycle?: boolean }) {
  const trailing = toggle !== undefined ? <Switch on={toggle} />
    : cycle && right ? <View style={{ flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 999, borderWidth: 1.5, borderColor: color.ink, backgroundColor: color.sand, paddingVertical: 5, paddingHorizontal: 10 }}><Text style={{ fontFamily: font.text[600], fontSize: 13, color: color.ink }}>{right}</Text><Text style={{ fontSize: 11, color: color.ink }}>⇄</Text></View>
    : right ? <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><Text style={{ fontFamily: font.text[500], fontSize: 14, color: color.mute }}>{right}</Text>{onPress ? <ChevronRight color={color.mute} /> : null}</View>
    : onPress ? <ChevronRight color={color.mute} /> : null;
  const body = (pressed = false) => (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 56, paddingVertical: 10, paddingHorizontal: space.lg, backgroundColor: pressed ? color.sand : "transparent" }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: font.display[500], fontSize: 17, color: color.ink }}>{a}</Text>
        {b ? <Text style={type.caption(13)}>{b}</Text> : null}
      </View>
      {trailing}
      {!first ? <View pointerEvents="none" style={{ position: "absolute", top: 0, left: space.lg, right: 0, height: border.hair, backgroundColor: color.line }} /> : null}
    </View>
  );
  if (!onPress) return body();
  const press = () => { tapHaptic(); onPress(); };
  if (toggle !== undefined) return <Pressable testID={testID} accessibilityRole="switch" aria-checked={toggle} accessibilityState={{ checked: toggle }} accessibilityLabel={b ? `${a}: ${b}` : a} onPress={press}>{({ pressed }) => body(pressed)}</Pressable>;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={b ? `${a}: ${b}` : a} accessibilityHint={right} onPress={press}>{({ pressed }) => body(pressed)}</Pressable>;
}

/** An iOS-style group: a small header outside, rows inside one rounded block, separators inset to the text. */
export function Group({ title, children, footer }: { title?: string; children: ReactNode; footer?: string }) {
  let seen = false;
  const rows = Children.toArray(children).map((c) => {
    if (isValidElement(c) && c.type === Row && !seen) { seen = true; return cloneElement(c as ReactElement<any>, { first: true }); }
    return c;
  });
  return (
    <View style={{ gap: 6 }}>
      {title ? <Text style={[type.eyebrow(), { paddingHorizontal: space.lg }]}>{title}</Text> : null}
      <View style={{ backgroundColor: color.white, borderRadius: radius.card, borderWidth: border.hair, borderColor: color.line, overflow: "hidden" }}>{rows}</View>
      {footer ? <Text style={[type.caption(12), { paddingHorizontal: space.lg }]}>{footer}</Text> : null}
    </View>
  );
}
