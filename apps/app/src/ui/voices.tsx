// v175 Voices (the founding class) and KeeperDesk. Copy ported as-is pending the voices decision
// (queue: decision #1); portraits and quotes come from the design build. The quotes are each person's own words, so
// they stay as they said them (English) in Spanish too; the credentials and the page's own copy are translated.
import { art } from "@ih/brand";
import { data, iconsShared } from "@ih/content";
import { Image } from "expo-image";
import { Text, View } from "react-native";
import { doorLabel, isEs, t, type Key } from "@/i18n";
import { EN } from "@/i18n/strings";
import { voiceBio } from "@/lib/voice";
import { Face, color, font, type } from "@/ui";

/** Spanish is gendered: the proposed voices on these doors are women ("embajadora"). Keep in step with data.ICONS. */
const WOMEN = new Set(["HINDUISM", "JUDAISM"]);

function Ambassador({ ic }: { ic: any }) {
  const cred = voiceBio(ic.wing).split(" · ")[0];
  const q = data.QUOTES[ic.wing];
  const door = doorLabel(ic.wing);
  return (
    <View style={{ width: "48.5%", backgroundColor: color.ink, borderRadius: 22, overflow: "hidden" }}>
      <Face ic={ic} w={"100%" as any} h={190} r={0} caption={false} big />
      <View style={{ padding: 14 }}>
        <Text style={{ fontFamily: font.display[800], fontSize: 17, color: "#fff" }}>{ic.name}</Text>
        <Text style={[type.body(11), { color: "#ffffffbb", marginTop: 4 }]}>{t(WOMEN.has(ic.wing) ? "onboarding.voices.roleF" : "onboarding.voices.role", { door })}</Text>
        <View style={{ alignSelf: "flex-start", marginTop: 10, borderWidth: 1, borderColor: "#ffffff55", borderRadius: 999, paddingVertical: 5, paddingHorizontal: 9 }}><Text style={[type.eyebrow(7), { color: "#fff" }]}>{cred}</Text></View>
        <Text style={[type.eyebrow(8), { color: color.gold, marginTop: 12 }]}>{t("onboarding.voices.voiceOf", { door })}</Text>
        {q ? <Text style={{ fontFamily: font.display[500], fontStyle: "italic", fontSize: 12, lineHeight: 17, color: "#fff", marginTop: 8 }}>“{q}”</Text> : <Text style={{ fontFamily: font.display[500], fontStyle: "italic", fontSize: 12, color: "#ffffffaa", marginTop: 8 }}>{t("onboarding.voices.unsigned", { name: ic.short })}</Text>}
      </View>
    </View>
  );
}

export function Voices() {
  return (
    <View style={{ gap: 12 }}>
      <View>
        <Text style={type.eyebrow()}>{t("onboarding.voices.eyebrow")}</Text>
        <Text style={[type.h1(28), { marginTop: 6 }]}>{t("onboarding.voices.h1")}{" "}<Text style={{ fontFamily: font.display[500], fontStyle: "italic" }}>{t("onboarding.voices.h1b")}</Text></Text>
        <Text style={[type.body(), { marginTop: 8 }]}>{t("onboarding.voices.body")}</Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>{iconsShared().map((ic: any) => <Ambassador key={ic.wing} ic={ic} />)}</View>
    </View>
  );
}

/** A Keeper's tradition and credentials in Spanish, by position, only while the English there is still the same line. */
function keeperText(i: number, title: string, cred: string): [string, string] {
  if (!isEs()) return [title, cred];
  const kt = `onboarding.keeper.${i}.t` as Key;
  const kc = `onboarding.keeper.${i}.c` as Key;
  return EN[kt] === title && EN[kc] === cred ? [t(kt), t(kc)] : [title, cred];
}

export function KeeperDesk() {
  return (
    <View style={{ gap: 8 }}>
      <Text style={type.eyebrow()}>{t("onboarding.keepers.eyebrow")}</Text>
      <Text style={type.h1(26)}>{t("onboarding.keepers.h1")}</Text>
      <Text style={type.body()}>{t("onboarding.keepers.body")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between", marginTop: 6 }}>
        {data.KEEPERS.map(([k, n, c0, p]: string[], i: number) => { const a = art(p); const [tt, c] = keeperText(i, k, c0); return (
          <View key={k} style={{ width: "48.5%", backgroundColor: "#fff", borderWidth: 1, borderColor: color.line, borderRadius: 16, overflow: "hidden" }}>
            <View style={{ aspectRatio: 1, backgroundColor: "#7a6a3a" }}>{a ? <Image source={a.src} style={{ width: "100%", height: "100%" }} contentFit="cover" accessibilityLabel={n} /> : null}</View>
            <View style={{ padding: 12 }}><Text style={type.eyebrow(7)}>{tt}</Text><Text style={[type.serif(16), { marginTop: 3 }]}>{n}</Text><Text style={[type.body(11), { color: color.mute, marginTop: 2 }]}>{c}</Text></View>
          </View>
        ); })}
      </View>
    </View>
  );
}
