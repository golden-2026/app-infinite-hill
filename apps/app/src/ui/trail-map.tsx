// The whole climb for one door, drawn as a switchback trail: the summit at the top (what someone who walks it all
// will know, practice and be able to do), each camp and year below it as a stop with a "by here you'll be able to…"
// promise, and the trailhead at the bottom. A "you are here" marker shows once someone has walked days on this door.
// Used in onboarding (welcome/trail) and from Today (app/trail). Copy is DRAFT (content/journeys.ts).
import { useState, type ReactElement } from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import { art } from "@ih/brand";
import { icon, label } from "@ih/content";
import { lookoutArt, SUMMIT_ART, trailFor, type Stage, type Summit } from "@/content/journeys";
import { FADE } from "@/ui/fade";
import { Guy, color, font, type } from "@/ui";

const NODE = 44;
const EDGE = NODE / 2;
const INK = "rgba(10,10,10,";

/** A painted lookout filling its box, with the view (peaks and water) kept in frame. */
function Painting({ artKey, y = "25%" }: { artKey: string; y?: string }) {
  const a = art(artKey);
  if (!a) return null;
  return <Image source={a.src} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} contentFit="cover" contentPosition={{ top: y as `${number}%`, left: "50%" }} transition={FADE} cachePolicy="memory-disk" accessible={false} />;
}

function SummitCard({ s, name, planned }: { s: Summit; name: string; planned: boolean }) {
  const rows: [string, string][] = [["you'll know", s.know], ["you'll practice", s.practice], ["you'll be able to", s.able]];
  return (
    <View style={{ backgroundColor: color.ink, borderRadius: 24, overflow: "hidden" }} accessibilityLabel={`The summit of ${name}`}>
      {/* the top of the climb, painted: the view fades down into the card so the words stay easy to read */}
      <View style={{ height: 210 }}>
        <Painting artKey={`${SUMMIT_ART}-sm`} y="12%" />
        <LinearGradient pointerEvents="none" colors={[`${INK}0.3)`, `${INK}0)`, `${INK}0.7)`, color.ink]} locations={[0, 0.25, 0.6, 1]} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
        <Guy pose="cheer" h={70} style={{ position: "absolute", right: 18, top: 12 }} />
        <View style={{ position: "absolute", left: 18, right: 18, bottom: 4 }}>
          <Text style={[type.eyebrow(11), { color: color.gold, maxWidth: 240 }]}>{s.eyebrow}</Text>
          <Text style={{ fontFamily: font.display[800], fontSize: 30, letterSpacing: -0.9, color: "#fff", marginTop: 6 }}>the summit</Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}>
        <Text style={[type.body(14), { color: "#ffffffb3", marginTop: 2 }]}>{`walk all of ${name} and here's what's at the top:`}</Text>
        <View style={{ gap: 12, marginTop: 16 }}>
          {rows.map(([k, v]) => (
            <View key={k} style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ width: 6, borderRadius: 3, backgroundColor: color.gold }} />
              <View style={{ flex: 1 }}>
                <Text style={[type.eyebrow(10), { color: "#ffffff99" }]}>{k}</Text>
                <Text style={{ fontFamily: font.display[700], fontSize: 17, lineHeight: 22, color: "#fff", marginTop: 2 }}>{v}</Text>
              </View>
            </View>
          ))}
        </View>
        {planned ? <Text style={[type.body(12), { color: "#ffffff80", marginTop: 14 }]}>years two to five are still being planned, so this is where the climb is aiming — the lessons come first.</Text> : null}
      </View>
    </View>
  );
}

type Status = "walked" | "here" | "ahead";

function Node({ n, status, tint, outlined }: { n: string; status: Status; tint: string; outlined?: boolean }) {
  const bg = status === "walked" ? color.ink : status === "here" ? color.gold : color.white;
  return (
    <View style={{ width: NODE, height: NODE, borderRadius: EDGE, backgroundColor: bg, borderWidth: 2.5, borderStyle: outlined && status === "ahead" ? "dashed" : "solid", borderColor: status === "ahead" ? tint : color.ink, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontFamily: font.display[800], fontSize: n.length > 1 ? 14 : 18, color: status === "walked" ? color.gold : color.ink }}>{status === "walked" ? "✓" : n}</Text>
    </View>
  );
}

function Stop({ st, n, side, status, tint, day, view }: { st: Stage; n: string; side: "left" | "right"; status: Status; tint: string; day: number | null; view: string }) {
  const here = status === "here";
  const card = (
    <View style={{ flex: 1, backgroundColor: here ? "#FFFBE0" : color.white, borderRadius: 18, borderWidth: 1.5, borderColor: here ? color.ink : color.line, overflow: "hidden", opacity: status === "walked" ? 0.8 : 1 }}>
      {/* the lookout at the end of this stretch, painted; its name sits on a dark fade so it stays readable */}
      <View style={{ height: 132, backgroundColor: color.ink }}>
        <Painting artKey={`${lookoutArt(st.key)}-sm`} y={view} />
        <LinearGradient pointerEvents="none" colors={[`${INK}0)`, `${INK}0.3)`, `${INK}0.88)`]} locations={[0, 0.42, 1]} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />
        {here ? (
          <View style={{ position: "absolute", left: 10, top: 10, flexDirection: "row" }}>
            <View style={{ backgroundColor: color.ink, borderRadius: 999, borderWidth: 1.5, borderColor: color.gold, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={[type.eyebrow(10), { color: color.gold }]}>{`you are here · day ${day}`}</Text>
            </View>
          </View>
        ) : null}
        <View style={{ position: "absolute", left: 14, right: 14, bottom: 10 }}>
          <Text style={[type.eyebrow(10), { color: color.gold }]}>{`${st.eyebrow}${st.planned ? " · being planned" : st.outlined ? " · outline" : ""}`}</Text>
          <Text style={{ fontFamily: font.display[800], fontSize: 22, letterSpacing: -0.5, color: "#fff", marginTop: 2 }}>{st.name}</Text>
        </View>
      </View>
      <View style={{ padding: 14, paddingTop: 6 }}>
        {st.planned ? (
          <Text style={[type.body(13), { color: color.mute, marginTop: 4 }]}>four more years of trail, being planned. they'll show up here once they're written.</Text>
        ) : <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {st.samples.map((x) => (
              <View key={x} style={{ backgroundColor: color.sand, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, maxWidth: "100%", flexShrink: 1 }}>
                <Text numberOfLines={1} style={{ fontFamily: font.text[500], fontSize: 12, color: color.ink, flexShrink: 1 }}>{x}</Text>
              </View>
            ))}
          </View>
          <Text style={[type.eyebrow(10), { marginTop: 10 }]}>by here you'll be able to</Text>
          <Text style={[type.body(14), { color: color.ink, marginTop: 2 }]}>{st.promise}</Text>
          {st.key.startsWith("Camp") ? <Text style={[type.body(12), { color: color.mute, marginTop: 8 }]}>{`⛰ ends at a lookout · day ${st.last}`}</Text> : null}
        </>}
      </View>
    </View>
  );
  const node = (
    <View style={{ width: NODE, alignItems: "center", paddingTop: 12, gap: 4 }}>
      <Node n={n} status={status} tint={tint} outlined={st.outlined} />
      {here ? <Guy pose="stride" h={54} /> : null}
    </View>
  );
  return (
    <View style={{ flexDirection: "row", gap: 10 }} accessibilityLabel={`${st.name}, ${st.eyebrow}. ${st.planned ? "Being planned." : `By here you'll be able to ${st.promise}.`}${here ? ` You are here, day ${day}.` : status === "walked" ? " Walked." : ""}`}>
      {side === "left" ? <>{node}{card}</> : <>{card}{node}</>}
    </View>
  );
}

/** A dashed switchback from the stop below (at `from`) up to the stop above (at `to`). */
function Switchback({ w, from, to, tint, walked }: { w: number; from: "left" | "right"; to: "left" | "right"; tint: string; walked: boolean }) {
  if (!w) return <View style={{ height: 30 }} />;
  const x = (s: "left" | "right") => (s === "left" ? EDGE : w - EDGE);
  const a = x(from), b = x(to), h = 34;
  return (
    <Svg width={w} height={h} style={{ marginVertical: -2 }}>
      <Path d={`M ${a} ${h} C ${a} ${h * 0.45}, ${b} ${h * 0.55}, ${b} 0`} stroke={walked ? color.ink : tint} strokeWidth={2.5} strokeDasharray={walked ? undefined : "5 6"} fill="none" />
    </Svg>
  );
}

function Milestone({ text, sub }: { text: string; sub: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: color.white, borderRadius: 999, borderWidth: 1.5, borderColor: color.ink, paddingHorizontal: 14, paddingVertical: 7 }}>
        <Text style={{ fontSize: 14 }}>⛳</Text>
        <Text style={{ fontFamily: font.display[800], fontSize: 14, color: color.ink }}>{text}</Text>
        <Text style={[type.eyebrow(10)]}>{sub}</Text>
      </View>
    </View>
  );
}

/** `day`: the day they're on for this door; `walked`: days walked. The marker shows only once walked > 0. */
export function TrailMap({ door, day, walked }: { door: string; day: number; walked: number }) {
  const [w, setW] = useState(0);
  const ic = icon(door);
  const tint: string = ic.tint || color.ink;
  const name = door === "SPIRITUAL" ? "your own path" : label(door);
  const { stages, lookout, summit, planned } = trailFor(door);
  const statusOf = (s: Stage): Status => (walked <= 0 ? "ahead" : day > s.last ? "walked" : day >= s.first ? "here" : "ahead");
  // bottom (trailhead) is index 0; sides alternate so the trail zig-zags up the page
  const sideOf = (i: number): "left" | "right" => (i % 2 === 0 ? "left" : "right");
  const top = stages.length - 1;
  const rows: ReactElement[] = [];
  for (let i = top; i >= 0; i--) {
    const st = stages[i];
    const n = st.planned ? "2–5" : st.key.startsWith("Year") ? `Y${st.key.slice(5)}` : st.key.replace(/\D/g, "");
    // years two to five share the ranges painting: each year looks at a different stretch of it
    const view = st.key.startsWith("Year ") ? `${[18, 44, 70, 96][Number(st.key.slice(5)) - 2] ?? 25}%` : "25%";
    rows.push(<Stop key={st.key} st={st} n={n} side={sideOf(i)} status={statusOf(st)} tint={tint} day={walked > 0 ? day : null} view={view} />);
    if (i > 0) {
      const walkedUp = walked > 0 && day >= st.first;
      rows.push(<Switchback key={`${st.key}-sb`} w={w} from={sideOf(i - 1)} to={sideOf(i)} tint={tint} walked={walkedUp} />);
      // the end of year one: a lookout (the summit is only the top of the five-year climb)
      if (st.first === lookout + 1) rows.push(<Milestone key="lookout" text="the big lookout" sub={`day ${lookout} · year one`} />, <Switchback key="fs-sb" w={w} from={sideOf(i - 1)} to={sideOf(i - 1)} tint={tint} walked={walkedUp} />);
    }
  }
  return (
    <View style={{ gap: 0 }} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <SummitCard s={summit} name={name} planned={planned} />
      <Switchback w={w} from={sideOf(top)} to={sideOf(top)} tint={tint} walked={false} />
      {rows}
      <Switchback w={w} from="left" to="left" tint={tint} walked={walked > 0} />
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10 }}>
        <View style={{ width: NODE, alignItems: "center" }}>
          <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: walked > 0 ? color.ink : color.gold, borderWidth: 2, borderColor: color.ink }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.eyebrow(10)]}>{walked > 0 ? "where you started" : "day one · you start here"}</Text>
          <Text style={{ fontFamily: font.display[800], fontSize: 20, color: color.ink }}>the trailhead</Text>
        </View>
        {walked > 0 ? null : <Guy pose="hike" h={86} />}
      </View>
    </View>
  );
}

/** What every day on the trail holds (true of the lessons in the app today). */
export function TrailDay() {
  const parts: [string, string][] = [["a story", "or a teaching"], ["a practice", "a minute or two"], ["a game", "to make it stick"], ["a line", "to carry all day"]];
  return (
    <View style={{ backgroundColor: color.white, borderRadius: 18, borderWidth: 1.5, borderColor: color.line, padding: 14 }}>
      <Text style={[type.eyebrow(10)]}>every day on the trail · a few minutes</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8, rowGap: 10 }}>
        {parts.map(([a, b]) => (
          <View key={a} style={{ width: "50%" }}>
            <Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink }}>{a}</Text>
            <Text style={[type.body(12), { color: color.mute }]}>{b}</Text>
          </View>
        ))}
      </View>
      <Text style={[type.body(12), { color: color.mute, marginTop: 10 }]}>a lantern lights at the end of every week you walk.</Text>
    </View>
  );
}
