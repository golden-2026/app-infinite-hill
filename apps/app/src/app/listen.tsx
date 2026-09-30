import { useTitle } from "@/lib/title";
import { doorLabel, t } from "@/i18n";
import { Text, View } from "react-native";
import { songsByDoor, type Song } from "@/content/songs";
import { useStore } from "@/lib/store";
import { Screen, color, type } from "@/ui";
import { SongBody } from "@/ui/song";

// Listen: every song, your door's first, then next door's. They all play from YouTube.
export default function Listen() {
  useTitle(t("session.listen.title"));
  const { saved } = useStore();
  const home = saved.settings.homeWing;
  const { yours, nextDoor: all } = songsByDoor(home);
  // other traditions only for people who said they love those connections, or walk their own path
  const nextDoor = saved.settings.profile?.openness === "love" || home === "SPIRITUAL" ? all : [];
  const group = (title: string, note: string, songs: Song[]) => songs.length ? (
    <View style={{ gap: 10 }}>
      <View>
        <Text accessibilityRole="header" style={type.eyebrow(9)}>{title}</Text>
        <Text style={[type.caption(13), { marginTop: 3 }]}>{note}</Text>
      </View>
      {songs.map((s) => (
        <View key={s.id} style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: color.line, borderRadius: 20, padding: 16 }}>
          <SongBody song={s} showDoor />
        </View>
      ))}
    </View>
  ) : null;
  return (
    <Screen scroll back="today" title={t("session.listen.head")} contentStyle={{ gap: 22 }}>
      <Text style={[type.body(14), { color: color.text }]}>{t("session.listen.intro")}</Text>
      {group(t("session.listen.yours"), home ? t("session.listen.fromDoor", { door: doorLabel(home) }) : t("session.listen.fromTradition"), yours)}
      {group(t("session.listen.nextDoor"), t("session.listen.nextNote"), nextDoor)}
      <Text style={[type.caption(12), { textAlign: "center", marginTop: 4 }]}>{t("session.listen.foot")}</Text>
    </Screen>
  );
}
