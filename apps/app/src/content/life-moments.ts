// Life moments: three "what brings you" answers (lib/why-param.ts) that get a short first-week list on Today.
// Each list is a handful of lessons ALREADY WRITTEN in years 1–3 of that door (docs/curriculum/<door>/scripts/y1..y3),
// picked by searching titles, words and lines to carry. Nothing here is new religious content.
//
// KEEPER REVIEW REQUIRED: this selection is ours, not a Keeper's. Before public release, each door's Keeper must
// confirm (or replace) the days chosen for their tradition. The titles beside each day are the scripts' own, for that
// review only; the app shows the lesson's own title.
//
// A door with nothing fitting falls back to its day 1 (see firstWeekFor).

export const LIFE_MOMENTS = ["grief", "baby", "diagnosis"] as const;
export type LifeMoment = (typeof LIFE_MOMENTS)[number];

type Pick = [day: number, title: string];

export const FIRST_WEEK: Record<LifeMoment, Record<string, Pick[]>> = {
  // someone I love died
  grief: {
    HINDUISM: [[162, "The self that is not slain (Gita 2.11–2.25)"], [43, "The king dies"], [53, "Rama breaks"], [385, "Death — the caterpillar reaching the next blade (Brihadaranyaka 4.4)"]],
    BUDDHISM: [[74, "Kisa Gotami's child"], [75, "The mustard seed"], [199, "From the dear, grief (Dhammapada 209–216)"], [603, "The dart of grief"]],
    CHRISTIANITY: [[100, "Praying the Psalms (Psalm 23)"], [234, "Those who mourn (Matthew 5:4)"], [60, "Lazarus, come out (John 11)"], [622, "I am the resurrection (John 11:1–27)"]],
    CATHOLIC: [[56, "Lazarus (John 11:1–44)"], [594, "Not as others without hope (1 Thessalonians 4:13–18)"], [441, "Praying for the dead (2 Maccabees 12:43–46)"], [686, "All Souls (2 November)"]],
    JUDAISM: [[317, "The Lord is my shepherd (Psalm 23)"], [603, "Kaddish is praise"], [604, "Why mourners say it"], [49, "Sarah's burial (Genesis 23)"]],
    ISLAM: [[348, "To Him we return (inna lillahi wa inna ilayhi raji'un)"], [93, "The year of sorrow"], [817, "Maria and the eclipse (the eyes weep, the heart grieves)"], [374, "Every soul tastes death"]],
    SIKHISM: [[135, "Kirtan Sohila at night"], [641, "Ardas in grief"], [434, "A wedding song at a funeral"], [674, "Songs of mourning (alaahnee)"]],
    SPIRITUAL: [[75, "The mustard seed"], [469, "I wept too much"], [514, "Marcia's long grief"], [873, "Love and grief"]],
  },
  // we just had a baby
  baby: {
    // thin: no year 1–3 lesson is about Hindu birth or naming rites (jatakarma, namakarana); these two are the closest
    HINDUISM: [[145, "Janmashtami (Krishna's birth)"], [390, "Honor your mother as god, your father as god (Taittiriya 1.11)"]],
    BUDDHISM: [[23, "Born in a grove"], [26, "The one whose aim succeeds (the naming)"], [146, "Bathing the baby Buddha"], [105, "The metta sutta (as a mother)"]],
    CHRISTIANITY: [[152, "Baptism, two ways"], [43, "Simeon and Anna (Luke 2:22–38)"], [201, "Let the children come (Mark 10:13–16)"], [438, "You knit me together (Psalm 139)"]],
    CATHOLIC: [[126, "Baptism"], [27, "Simeon and Anna (Luke 2:22–38)"], [218, "Let the children come (Mark 10:1–16)"], [421, "Before I formed thee (Jeremiah 1)"]],
    JUDAISM: [[101, "Blessing the children"], [179, "Vayera: Isaac is born (Genesis 21:1–7)"], [395, "Tazria: after a birth (Leviticus 12)"], [336, "Bo: tell your child (Exodus 13:8)"]],
    // the adhan said in a newborn's ear is told inside day 15; no lesson on aqiqah or tahnik in years 1–3
    ISLAM: [[15, "The call to prayer (and the adhan in a newborn's ear)"], [23, "The names"], [344, "The prayer at the foundations (pray for the ones not born)"], [21, "The short surahs (the ones every child knows)"]],
    SIKHISM: [[656, "A child is born (Asa M5, ang 396)"], [53, "The song of bliss (sung at a baby's naming)"], [22, "Born at Talwandi, 1469"], [745, "Telling a sakhi to a child"]],
    SPIRITUAL: [[93, "The story you'd tell a child"], [816, "Welcoming birth"], [863, "Loving children"], [1042, "A newborn"]],
  },
  // scary news about health, mine or someone close
  diagnosis: {
    // thin: no year 1–3 lesson is about illness or healing prayer; these speak to fear, care for the body, and peace
    HINDUISM: [[35, "The mountain of herbs"], [4, "Why it's said three times (om shanti shanti shanti)"], [125, "The body as temple"], [213, "The divine qualities (Gita 16.1–16.5, fearlessness)"]],
    BUDDHISM: [[3, "Not \"suffering\" (dukkha)"], [257, "The second arrow"], [274, "Without fear"], [673, "Read to the sick"]],
    CHRISTIANITY: [[175, "Asleep on a cushion (Mark 4:35–41)"], [417, "Whom shall I fear? (Psalm 27)"], [549, "Fear not, little flock (Luke 12:22–34)"], [154, "Confession and anointing"]],
    CATHOLIC: [[42, "The storm (Mark 4:35–41)"], [130, "Anointing of the sick"], [165, "The Lord is my light (Psalm 26 [27])"], [607, "Is any man sick (James 5:13–16)"]],
    JUDAISM: [[302, "A very narrow bridge"], [328, "Psalms for the sick"], [585, "Heal us (refuah)"], [601, "Prayers for others (Mi Sheberach)"]],
    ISLAM: [[58, "The shirt and the false blood (beautiful patience)"], [287, "The illness"], [516, "Who feeds me and heals me"], [667, "A healing and a mercy (shifa')"]],
    SIKHISM: [[6, "Without fear, without hate (Mool Mantar, line 2)"], [414, "Why worry, mind"], [495, "He knows your pain"], [358, "Jaap for courage"]],
    SPIRITUAL: [[114, "Serenity, courage, wisdom"], [300, "Is this what I feared?"], [701, "The second arrow"], [756, "To someone suffering now"]],
  },
};

/** Grief and scary health news: sign-up never talks about keeping it up (no streak framing). */
export const gentleStart = (why: unknown) => why === "grief" || why === "diagnosis";

export const isLifeMoment =(why: unknown): why is LifeMoment => typeof why === "string" && (LIFE_MOMENTS as readonly string[]).includes(why);

/** The first-week days for a life moment on a door, in order. A door with no list gets its day 1. Null when `why` isn't a life moment. */
export function firstWeekFor(why: unknown, door: string): number[] | null {
  if (!isLifeMoment(why)) return null;
  const list = FIRST_WEEK[why][door];
  return list && list.length ? list.map(([d]) => d) : [1];
}

/** May this day open ahead of where the door stands? Only a day on this person's own first-week list for their door. */
export function opensAhead(p: { door?: string; answers?: Record<string, unknown> } | null | undefined, door: string, day: number): boolean {
  if (!p || p.door !== door) return false;
  return (firstWeekFor(p.answers?.why, door) || []).includes(day);
}
