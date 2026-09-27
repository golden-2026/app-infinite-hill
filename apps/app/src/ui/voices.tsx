// v175 Voices (the founding class) and KeeperDesk, made truthful (CLAUDE.md product truth): a voice appears here only
// once its licence is signed (lib/voice LICENSED_VOICES), and Keepers are named only once they have signed on. Until
// then each section says plainly what's true. Nothing proposed is presented as signed.
import { data, iconsShared, label } from "@ih/content";
import { Text, View } from "react-native";
import { LICENSED_VOICES } from "@/lib/voice";
import { Face, color, font, type } from "@/ui";

function Voice({ ic }: { ic: any }) {
  const cred = (data.BIO[ic.wing] || "").split(" · ")[0];
  return (
    <View style={{ width: "48.5%", backgroundColor: color.ink, borderRadius: 22, overflow: "hidden" }}>
      <Face ic={ic} w={"100%" as any} h={190} r={0} caption={false} big />
      <View style={{ padding: 14 }}>
        <Text style={{ fontFamily: font.display[800], fontSize: 17, color: "#fff" }}>{ic.name}</Text>
        {cred ? <Text style={[type.body(11), { color: "#ffffffbb", marginTop: 4 }]}>{cred}</Text> : null}
        <Text style={[type.eyebrow(8), { color: color.gold, marginTop: 12 }]}>reads the {label(ic.wing)} path</Text>
      </View>
    </View>
  );
}

export function Voices() {
  const signed = iconsShared().filter((ic: any) => LICENSED_VOICES[ic.wing]);
  return (
    <View style={{ gap: 12 }}>
      <View>
        <Text style={type.eyebrow()}>the voices</Text>
        <Text style={[type.h1(28), { marginTop: 6 }]}>every door will have a voice.</Text>
        <Text style={[type.body(), { marginTop: 8 }]}>
          {signed.length
            ? "these voices have signed and recorded. every other door is read by the house voice until its voice has too."
            : "for now, every lesson is read by the house voice. a named voice appears here only once they've signed and recorded — never before."}
        </Text>
      </View>
      {signed.length ? <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>{signed.map((ic: any) => <Voice key={ic.wing} ic={ic} />)}</View> : null}
    </View>
  );
}

export function KeeperDesk() {
  return (
    <View style={{ gap: 8 }}>
      <Text style={type.eyebrow()}>the keepers</Text>
      <Text style={type.h1(26)}>the people who make sure we get it right.</Text>
      <Text style={type.body()}>
        each tradition will have a Keeper — a scholar or teacher from inside it — who reads every lesson before it's recorded and can stop it.
        we're asking them now. names appear here only once they've signed on, and every lesson says whether a Keeper has reviewed it. none has yet: these are pilot drafts.
      </Text>
    </View>
  );
}
