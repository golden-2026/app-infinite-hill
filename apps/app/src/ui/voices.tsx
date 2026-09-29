// v175 Voices (the founding class) and KeeperDesk. Copy ported as-is pending the voices decision
// (queue: decision #1); portraits and quotes come from the design build.
import { art } from "@ih/brand";
import { data, iconsShared, label } from "@ih/content";
import { Image } from "expo-image";
import { Text, View } from "react-native";
import { Face, color, font, type } from "@/ui";

function Ambassador({ ic }: { ic: any }) {
  const cred = (data.BIO[ic.wing] || "").split(" · ")[0];
  const q = data.QUOTES[ic.wing];
  return (
    <View style={{ width: "48.5%", backgroundColor: color.ink, borderRadius: 22, overflow: "hidden" }}>
      <Face ic={ic} w={"100%" as any} h={190} r={0} caption={false} big />
      <View style={{ padding: 14 }}>
        <Text style={{ fontFamily: font.display[800], fontSize: 17, color: "#fff" }}>{ic.name}</Text>
        <Text style={[type.body(11), { color: "#ffffffbb", marginTop: 4 }]}>{label(ic.wing)} · Global Ambassador & Shareholder</Text>
        <View style={{ alignSelf: "flex-start", marginTop: 10, borderWidth: 1, borderColor: "#ffffff55", borderRadius: 999, paddingVertical: 5, paddingHorizontal: 9 }}><Text style={[type.eyebrow(7), { color: "#fff" }]}>{cred}</Text></View>
        <Text style={[type.eyebrow(8), { color: color.gold, marginTop: 12 }]}>Voice of the {label(ic.wing)} path</Text>
        {q ? <Text style={{ fontFamily: font.display[500], fontStyle: "italic", fontSize: 12, lineHeight: 17, color: "#fff", marginTop: 8 }}>“{q}”</Text> : <Text style={{ fontFamily: font.display[500], fontStyle: "italic", fontSize: 12, color: "#ffffffaa", marginTop: 8 }}>“Why this matters to me.” — in {ic.short}'s own words, once signed.</Text>}
      </View>
    </View>
  );
}

export function Voices() {
  return (
    <View style={{ gap: 12 }}>
      <View>
        <Text style={type.eyebrow()}>The founding class</Text>
        <Text style={[type.h1(28), { marginTop: 6 }]}>your door has a voice. <Text style={{ fontFamily: font.display[500], fontStyle: "italic" }}>you already know it.</Text></Text>
        <Text style={[type.body(), { marginTop: 8 }]}>eight people with no time, taking the time. in your ear for every lesson, in the faith they grew up in. not a gig — it matters to them.</Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>{iconsShared().map((ic: any) => <Ambassador key={ic.wing} ic={ic} />)}</View>
    </View>
  );
}

export function KeeperDesk() {
  return (
    <View style={{ gap: 8 }}>
      <Text style={type.eyebrow()}>the keepers</Text>
      <Text style={type.h1(26)}>the people who make sure we get it right.</Text>
      <Text style={type.body()}>a scholar of each tradition, respected inside it and out, reads every lesson before it's recorded. they can veto us.</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between", marginTop: 6 }}>
        {data.KEEPERS.map(([t, n, c, p]: string[]) => { const a = art(p); return (
          <View key={t} style={{ width: "48.5%", backgroundColor: "#fff", borderWidth: 1, borderColor: color.line, borderRadius: 16, overflow: "hidden" }}>
            <View style={{ aspectRatio: 1, backgroundColor: "#7a6a3a" }}>{a ? <Image source={a.src} style={{ width: "100%", height: "100%" }} contentFit="cover" accessibilityLabel={n} /> : null}</View>
            <View style={{ padding: 12 }}><Text style={type.eyebrow(7)}>{t}</Text><Text style={[type.serif(16), { marginTop: 3 }]}>{n}</Text><Text style={[type.body(11), { color: color.mute, marginTop: 2 }]}>{c}</Text></View>
          </View>
        ); })}
      </View>
    </View>
  );
}
