// Songs that cross: someone singing inside a tradition you might not expect them in.
// We don't host or download any of this. Every song plays from YouTube's own player (embedding),
// and the artists own it. Titles and artists come from YouTube's oEmbed record for each video id.
// Every entry is draft: the "why" lines are ours and still need a Keeper's read before public release.

export type Tradition = "CHRISTIANITY" | "CATHOLIC" | "HINDUISM" | "ISLAM" | "JUDAISM" | "BUDDHISM" | "SIKHISM" | "SPIRITUAL";

export type Song = {
  /** the YouTube video id */
  id: string;
  title: string;
  artist: string;
  tradition: Tradition;
  form: string;
  why: string;
  draft: true;
};

export const SONGS: Song[] = [
  {
    id: "ZndJNdJ1WDY",
    title: "Dam Mast Qalandar (orchestral qawwali)",
    artist: "Rushil Ranjan, Abi Sampa & the Scottish Chamber Orchestra",
    tradition: "ISLAM",
    form: "qawwali",
    why: "a sufi song of longing for god, carried by a scottish orchestra. devotion doesn't check your passport.",
    draft: true,
  },
  {
    id: "xS_5BZCrD_Y",
    title: "Kirtan Rasa 2024 · day 1",
    artist: "Premanjali Mataji",
    tradition: "HINDUISM",
    form: "kirtan",
    why: "call and response with the names of god. anyone can sing back, and here's someone who found it from far away.",
    draft: true,
  },
  {
    id: "A42LnRppG1c",
    title: "Jesus Is Coming Back Soon",
    artist: "Forrest Frank & Josiah Queen",
    tradition: "CHRISTIANITY",
    form: "worship",
    why: "christian hope, sung like a summer drive with the windows down. joy is a kind of prayer too.",
    draft: true,
  },
  {
    id: "NJzEqTD2X7Y",
    title: "Mothaland Bounce",
    artist: "Nissim Black",
    tradition: "JUDAISM",
    form: "Jewish hip-hop",
    why: "a black rapper from seattle who became an orthodox jew and moved to jerusalem. the torah, on a beat.",
    draft: true,
  },
];

export const youtubeUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
/** Privacy-enhanced embed: no YouTube cookies until the person presses play inside the player. */
export const embedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&modestbranding=1`;

const dayNumber = (dateISO: string) => {
  const t = Date.parse(`${dateISO.slice(0, 10)}T12:00:00Z`);
  return Number.isFinite(t) ? Math.floor(t / 86_400_000) : 0;
};

/**
 * Today's song. Rotates by date. Every other day it reaches next door (a tradition that isn't yours),
 * because the point is the crossing. "stay" keeps you in your own tradition when there's a song for it.
 */
export function songForToday(homeDoor: string | undefined, dateISO: string, openness?: "stay" | "sometimes" | "love"): Song {
  const n = dayNumber(dateISO);
  const own = SONGS.filter((s) => s.tradition === homeDoor);
  const others = SONGS.filter((s) => s.tradition !== homeDoor);
  let pool: Song[];
  if (openness === "stay") pool = own.length ? own : SONGS;
  else if (openness === "love") pool = others.length ? others : SONGS;
  else pool = n % 2 === 0 ? (others.length ? others : SONGS) : SONGS;
  const pick = Math.floor(n / 2) + (n % 2); // move on each day without the two pools lining up
  return pool[((pick % pool.length) + pool.length) % pool.length];
}

/** For the listen screen: your door's songs first, then everyone else's. */
export function songsByDoor(homeDoor: string | undefined): { yours: Song[]; nextDoor: Song[] } {
  return { yours: SONGS.filter((s) => s.tradition === homeDoor), nextDoor: SONGS.filter((s) => s.tradition !== homeDoor) };
}
