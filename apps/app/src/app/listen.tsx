import { useTitle } from "@/lib/title";
import { label } from "@ih/content";
import { Text, View } from "react-native";
import { songsByDoor, type Song } from "@/content/songs";
import { useStore } from "@/lib/store";
import { Screen, color, type } from "@/ui";
import { SongBody } from "@/ui/song";

// Listen: every song, your door's first, then next door's. They all play from YouTube.
export default function Listen() {
  useTitle("listen");
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
    <Screen scroll back="today" title="listen." contentStyle={{ gap: 22 }}>
      <Text style={[type.body(14), { color: color.text }]}>songs from every door, often sung by someone you wouldn't expect. music gets there before words do.</Text>
      {group("from your door", home ? `songs from ${label(home)}.` : "songs from your tradition.", yours)}
      {group("from next door", "someone else's prayer. just listen.", nextDoor)}
      <Text style={[type.caption(12), { textAlign: "center", marginTop: 4 }]}>songs play from YouTube. we don't own them — the artists do.</Text>
    </Screen>
  );
}
