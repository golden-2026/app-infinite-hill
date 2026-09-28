// A song for today, and the player both it and the listen screen use.
// Web: tapping play opens YouTube's own privacy-enhanced player inline (nothing loads from YouTube before the tap).
// Native: tapping play opens the video in YouTube. We never download or re-host the audio.
import { label } from "@ih/content";
import { router } from "expo-router";
import { createElement, useState } from "react";
import { Linking, Platform, Pressable, Text, View } from "react-native";
import { embedUrl, songForToday, youtubeUrl, type Song } from "@/content/songs";
import { tapHaptic } from "@/lib/haptics";
import { useStore } from "@/lib/store";
import { color, font, type } from "@/ui";

function Embed({ song }: { song: Song }) {
  return (
    <View style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 14, overflow: "hidden", backgroundColor: "#000", marginTop: 12 }}>
      {createElement("iframe", {
        src: embedUrl(song.id),
        title: `${song.title} by ${song.artist}, on YouTube`,
        allow: "autoplay; encrypted-media; picture-in-picture; fullscreen",
        allowFullScreen: true,
        referrerPolicy: "strict-origin-when-cross-origin",
        style: { width: "100%", height: "100%", border: 0, display: "block" },
      })}
    </View>
  );
}

/** One song: title, artist · form, the why line, and a play button. `open` on web shows the player inline. */
export function SongBody({ song, showDoor, dark }: { song: Song; showDoor?: boolean; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const web = Platform.OS === "web";
  const ink = dark ? "#fff" : color.ink;
  const play = () => {
    tapHaptic();
    if (web) setOpen((o) => !o);
    else Linking.openURL(youtubeUrl(song.id)).catch(() => {});
  };
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1 }}>
          {showDoor ? <Text style={[type.eyebrow(8), { color: dark ? color.gold : color.mute, marginBottom: 4 }]}>{label(song.tradition)}</Text> : null}
          <Text style={{ fontFamily: font.display[800], fontSize: 17, lineHeight: 21, color: ink }}>{song.title}</Text>
          <Text style={[type.caption(12), { marginTop: 3, color: dark ? "#ffffffaa" : color.mute }]}>{song.artist} · {song.form}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={open ? `Close the player for ${song.title}` : `Play ${song.title} by ${song.artist}${web ? "" : " in YouTube"}`}
          accessibilityState={{ expanded: open }} onPress={play} hitSlop={6}
          style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 24, backgroundColor: dark ? color.gold : color.ink, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] })}>
          <Text style={{ fontSize: open ? 16 : 18, color: dark ? color.ink : color.gold, marginLeft: open ? 0 : 3 }}>{open ? "✕" : "▶"}</Text>
        </Pressable>
      </View>
      <Text style={[type.body(13), { marginTop: 8, color: dark ? "#ffffffcc" : color.text }]}>{song.why}</Text>
      {web && open ? <Embed song={song} /> : null}
    </View>
  );
}

/** The Today card: "a song for today", rotating by date; other traditions only for people who asked for them. */
export function SongCard({ door }: { door?: string }) {
  const { saved, today } = useStore();
  const st = saved.settings;
  const home = door ?? st.homeWing;
  const song = songForToday(home, today, st.profile?.openness);
  if (!song) return null;
  return (
    <View style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: color.line, borderRadius: 20, padding: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <Text style={type.eyebrow(8)}>a song for today · {label(song.tradition)}</Text>
        <Pressable accessibilityRole="link" accessibilityLabel="All songs" onPress={() => router.push("/listen" as any)} hitSlop={10}
          style={{ minHeight: 44, justifyContent: "center", marginVertical: -12 }}>
          <Text style={[type.eyebrow(8), { color: color.ink }]}>all songs ›</Text>
        </Pressable>
      </View>
      <SongBody song={song} />
    </View>
  );
}
