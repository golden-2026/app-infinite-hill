import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { daysBetween, MILESTONES } from "@ih/domain";
import { Text, View } from "react-native";
import { useDone } from "@/lib/done";
import { useStore } from "@/lib/store";
import { Btn, Guy, Screen, Sun, color, font, type } from "@/ui";

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// v175 PostLesson step 2: N days lit. The week row shows the real last 7 dates (a missed day is just
// empty, never red), not an assumed streak.
export default function Lit() {
  useTitle("days lit");
  const { p, count, go, close } = useDone();
  const { derived, saved, today } = useStore();
  const lit = new Set(derived.dates);
  const week = Array.from({ length: 7 }, (_, k) => {
    const d = new Date(`${today}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (6 - k));
    const iso = d.toISOString().slice(0, 10);
    return { iso, dow: DOW[d.getUTCDay()], on: lit.has(iso) };
  });
  const milestone = Number(p.milestone) || (MILESTONES.includes(count) && p.newDay === "1" ? count : 0);
  const firstDay = count === 1 && p.newDay === "1";
  const gap = derived.dates.length > 1 && daysBetween(derived.dates[derived.dates.length - 2], today) > 1;
  const line = p.newDay !== "1" ? "today was already lit. this one was just for you." : saved.settings.active === "visit" ? "your days come with you. any door, one count — nothing you've earned stays behind."
    : firstDay ? "day one counts. it always will." : gap ? "right where you left it. the path didn't move." : milestone ? `${milestone} days. you keep showing up.` : "another stone lit.";
  useEffect(() => { if (milestone) track("milestone", { n: milestone }); }, [milestone]);
  const next = () => (firstDay && !saved.settings.goal ? go("/done/goal") : close());
  return (
    <Screen close={close} footer={<Btn testID="continue" onPress={next}>continue</Btn>}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        {milestone >= 7 ? <Guy pose={milestone >= 21 ? "jump" : "joy"} h={150} /> : <View style={{ marginBottom: 28 }}><Sun size={130} mood="happy" /></View>}
        <View style={{ backgroundColor: color.gold, paddingHorizontal: 26, paddingTop: 6, borderRadius: 28, marginTop: 10, marginBottom: 14 }}>
          <Text accessibilityLabel={`${count} ${count === 1 ? "day" : "days"} lit`} style={{ fontFamily: font.display[800], fontSize: 120, lineHeight: 118, letterSpacing: -6, color: color.ink }}>{count}</Text>
        </View>
        <Text style={type.h1(26)}>day{count === 1 ? "" : "s"} lit.</Text>
        <Text style={[type.body(), { marginTop: 8, textAlign: "center" }]}>{line}</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 26 }} accessibilityLabel={`this week: ${week.filter((w) => w.on).length} of 7 days lit`}>
          {week.map((w) => (
            <View key={w.iso} style={{ alignItems: "center" }}>
              <Text style={[type.eyebrow(8), { color: w.on ? color.ink : "#00000066" }]}>{w.dow}</Text>
              <View style={{ width: 34, height: 34, borderRadius: 17, marginTop: 6, backgroundColor: w.on ? color.ink : "#00000022", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: color.gold, fontFamily: font.text[700] }}>{w.on ? "✓" : ""}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
