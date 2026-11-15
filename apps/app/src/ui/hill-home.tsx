// The night look's two new Today pieces (owner, 2026-10-28): your home on the painted hill, and this week's story
// film when your door has one. Everything else on Today stays as it was; the regular lesson still sits below.
// Films live in public/films (copied from prototypes/greybox) and play in /film; web only for now.
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { color, font, type } from "@/ui";

// where each home sits on the 1200px painted map (site-art/world/map.webp)
const HOMES: Record<string, { name: string; x: number; y: number }> = {
  CHRISTIANITY: { name: "Olive Grove", x: 740, y: 250 }, CATHOLIC: { name: "Angelus", x: 1010, y: 270 },
  JUDAISM: { name: "Pomegranate", x: 1030, y: 650 }, ISLAM: { name: "Date Palm", x: 990, y: 950 },
  HINDUISM: { name: "Marigold", x: 470, y: 960 }, BUDDHISM: { name: "Lotus Pond", x: 150, y: 860 },
  SIKHISM: { name: "Nectar Lake", x: 200, y: 470 }, SPIRITUAL: { name: "Wildwonder", x: 190, y: 190 },
};

export const FILMS: Record<string, { id: string; title: string; from: string; poster: string }[]> = {
  CHRISTIANITY: [
    { id: "light", title: "Let there be light", from: "the first page of the Bible", poster: "/films/art/sacred/light/clips/G02-Light.webp" },
    { id: "lost-son", title: "The son who came home", from: "a story Jesus told", poster: "/films/art/sacred/lost-son/clips/C10-Father-Runs.webp" },
    { id: "ruth", title: "Where you go, I will go", from: "from the book of Ruth", poster: "/films/art/sacred/ruth/clips/R04-Where-You-Go.webp" },
  ],
  HINDUISM: [
    { id: "ganesha-first", title: "Ganesha comes first", from: "a traditional story", poster: "/films/art/sacred/ganesha-first/clips/GF5-Whole-World.webp" },
    { id: "broken-tusk", title: "The broken tusk", from: "a traditional story", poster: "/films/art/sacred/broken-tusk/clips/K07-The-Tusk-Writes.webp" },
    { id: "valmiki", title: "The robber who became a poet", from: "as tradition tells it", poster: "/films/art/sacred/valmiki/clips/VA6-Valmiki.webp" },
    { id: "no-effort", title: "No effort is ever lost", from: "from the Bhagavad Gita", poster: "/films/art/sacred/no-effort/clips/NE4-The-Answer.webp" },
    { id: "universe", title: "The universe starts over too", from: "from the Puranas", poster: "/films/art/sacred/universe/clips/US4-Brahma.webp" },
    { id: "first-letters", title: "The first letters", from: "Vidyarambham", poster: "/films/art/sacred/first-letters/clips/FL2-Rice-Letters.webp" },
    { id: "milk", title: "Milk that boils over", from: "griha pravesh", poster: "/films/art/sacred/milk/clips/MB4-Boils-Over.webp" },
    { id: "ganesha-head", title: "How Ganesha got his head", from: "from the Shiva Purana", poster: "/films/art/sacred/ganesha-head/clips/GH5-New-Life.webp" },
    { id: "rama", title: "Rama's face didn't change", from: "from the Ramayana", poster: "/films/art/sacred/rama/clips/RF4-His-Face.webp" },
    { id: "ganga", title: "The king who brought down a river", from: "Bhagiratha", poster: "/films/art/sacred/ganga/clips/GA5-Shiva-Catches.webp" },
    { id: "vibhishana", title: "Vibhishana crosses over", from: "from the Ramayana", poster: "/films/art/sacred/vibhishana/clips/VB5-Welcome.webp" },
    { id: "gajendra", title: "The elephant and the crocodile", from: "Gajendra", poster: "/films/art/sacred/gajendra/clips/GJ4-The-Lotus.webp" },
    { id: "ahalya", title: "Stuck until the right step", from: "from the Ramayana", poster: "/films/art/sacred/ahalya/clips/AH5-Free.webp" },
    { id: "markandeya", title: "The boy who wouldn't let go", from: "Markandeya", poster: "/films/art/sacred/markandeya/clips/MK4-Holding-On.webp" },
    { id: "squirrel", title: "The squirrel on the bridge", from: "a folk story", poster: "/films/art/sacred/squirrel/clips/SQ5-Rama.webp" },
    { id: "krishna-morning", title: "Krishna's morning", from: "from the Bhagavata Purana", poster: "/films/art/sacred/krishna-morning/clips/KM3-Stillness.webp" },
    { id: "parvati", title: "Parvati's practice", from: "from the Shiva Purana", poster: "/films/art/sacred/parvati/clips/PV3-Seasons.webp" },
    { id: "restless-mind", title: "Training the restless mind", from: "from the Bhagavad Gita", poster: "/films/art/sacred/restless-mind/clips/RM5-Coming-Back.webp" },
    { id: "arjuna-dark", title: "Arjuna in the dark", from: "from the Mahabharata", poster: "/films/art/sacred/arjuna-dark/clips/AD4-In-The-Dark.webp" },
    { id: "narada", title: "Narayana, Narayana", from: "Narada", poster: "/films/art/sacred/narada/clips/ND2-Narada.webp" },
    { id: "annapurna", title: "Annapurna's kitchen", from: "a legend of Varanasi", poster: "/films/art/sacred/annapurna/clips/AN5-The-Bowl.webp" },
    { id: "new-clothes", title: "New clothes for the soul", from: "from the Bhagavad Gita", poster: "/films/art/sacred/new-clothes/clips/NC4-Atman.webp" },
    { id: "homecoming", title: "Lamps for the homecoming", from: "from the Ramayana", poster: "/films/art/sacred/homecoming/clips/HC4-City-Of-Light.webp" },
    { id: "holika", title: "Burning the old", from: "Holika Dahan", poster: "/films/art/sacred/holika/clips/HK5-Bonfire-Night.webp" },
    { id: "ugadi", title: "Six tastes of a new year", from: "Ugadi", poster: "/films/art/sacred/ugadi/clips/UG2-Six-Tastes.webp" },
    { id: "visarjan", title: "Goodbye, Ganesha", from: "Ganesh visarjan", poster: "/films/art/sacred/visarjan/clips/GV4-Into-The-Water.webp" },
    { id: "durga", title: "The demon who kept changing shape", from: "from the Devi Mahatmya", poster: "/films/art/sacred/durga/clips/DG2-Durga.webp" },
    { id: "kumbh", title: "Millions take the plunge", from: "the Kumbh Mela", poster: "/films/art/sacred/kumbh/clips/KU5-The-Plunge.webp" },
  ],
};
const SEEN = "ih-films-seen";
export function seenFilms(): string[] { try { return JSON.parse(globalThis.localStorage?.getItem(SEEN) || "[]"); } catch { return []; } }
export function markFilmSeen(id: string) { try { const s = seenFilms(); if (!s.includes(id)) globalThis.localStorage?.setItem(SEEN, JSON.stringify([...s, id])); } catch { /* private mode */ } }

export function HillHome({ door }: { door: string }) {
  const h = HOMES[door] ?? HOMES.SPIRITUAL;
  const [w, setW] = useState(0);
  const H = 190, size = w * 2.4, sc = size / 1200;
  const left = Math.min(0, Math.max(w - size, w / 2 - h.x * sc)), top = Math.min(0, Math.max(H - size, H * 0.55 - h.y * sc));
  return (
    <View style={s.hill} onLayout={(e) => setW(e.nativeEvent.layout.width)} accessibilityLabel={`your home on the hill, ${h.name}`}>
      {w ? <Image source={{ uri: "/site-art/world/map.webp" }} style={{ position: "absolute", width: size, height: size, left, top, opacity: 0.88 }} /> : null}
      <View style={s.shade} />
      <View style={[s.glow, { left: left + h.x * sc - 40, top: top + h.y * sc - 40 }]} />
      <View style={s.label}><Text style={type.eyebrow(11)}>your home</Text><Text style={s.name}>{h.name}</Text></View>
    </View>
  );
}

export function StoryFilmCard({ door }: { door: string }) {
  const [seen, setSeen] = useState<string[]>([]);
  useFocusEffect(useCallback(() => { setSeen(seenFilms()); }, []));
  const list = FILMS[door];
  if (!list || Platform.OS !== "web") return null;
  const f = list.find((x) => !seen.includes(x.id)) ?? list[0];
  return (
    <Pressable testID="story-film-card" accessibilityRole="button" accessibilityLabel={`story film: ${f.title}`} onPress={() => router.push({ pathname: "/film", params: { f: f.id } })} style={s.card}>
      <Image source={{ uri: f.poster }} style={s.poster} />
      <View style={s.play}><Text style={{ color: "#0A0A0A", fontSize: 20, marginLeft: 3 }}>▶</Text></View>
      <View style={{ padding: 14, gap: 4 }}>
        <Text style={[type.eyebrow(11), { color: color.gold }]}>this week's story film · {f.from}</Text>
        <Text style={s.title}>{f.title}</Text>
        <Text style={type.caption(13)}>about 6 min · 3 choices · a quick check · a stamp to keep</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  hill: { height: 190, marginHorizontal: 18, marginBottom: 12, borderRadius: 20, overflow: "hidden", backgroundColor: color.sand },
  shade: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(7,10,20,0.18)" },
  glow: { position: "absolute", width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(238,255,106,0.3)" },
  label: { position: "absolute", left: 14, bottom: 12, backgroundColor: "rgba(7,10,20,0.72)", borderRadius: 12, paddingVertical: 6, paddingHorizontal: 10 },
  name: { fontFamily: font.head, fontSize: 24, lineHeight: 26, textTransform: "uppercase", color: color.ink },
  card: { marginHorizontal: 18, marginBottom: 12, borderRadius: 24, overflow: "hidden", backgroundColor: color.white, borderWidth: 2, borderColor: color.gold },
  poster: { width: "100%", height: 170 },
  play: { position: "absolute", top: 60, alignSelf: "center", width: 54, height: 54, borderRadius: 27, backgroundColor: color.gold, borderWidth: 0, alignItems: "center", justifyContent: "center" },
  // loud brand: the film title is a poster headline (Anton caps), like the site's episode cards
  title: { fontFamily: font.head, fontSize: 32, lineHeight: 32, textTransform: "uppercase", color: color.ink },
});
