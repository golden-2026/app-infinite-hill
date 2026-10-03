// Life moments: seven "what brings you" answers (lib/why-param.ts) that get a short first-week list on Today:
// grief, a new baby, scary health news, and belonging, forgiveness, a wedding, gratitude.
// Each list is a handful of lessons ALREADY WRITTEN in years 1–3 of that door (docs/curriculum/<door>/scripts/y1..y3),
// picked by searching titles, words and lines to carry. Nothing here is new religious content.
//
// KEEPER REVIEW REQUIRED: this selection is ours, not a Keeper's. Before public release, each door's Keeper must
// confirm (or replace) the days chosen for their tradition. The titles beside each day are the scripts' own, for that
// review only; the app shows the lesson's own title.
//
// A door with nothing fitting falls back to its day 1 (see firstWeekFor).

export const LIFE_MOMENTS = ["grief", "baby", "diagnosis", "belonging", "forgiveness", "wedding", "gratitude"] as const;
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
  // i want people around me who get it (Today also points to circles on the Together tab)
  belonging: {
    HINDUISM: [[20, "Good company"], [138, "Satsang, in person"], [137, "Kirtan (call, answer)"], [933, "Chaitanya and the Bengal kirtan"]],
    BUDDHISM: [[17, "The community (you need people)"], [319, "Finding a sangha"], [320, "The admirable friend"], [779, "Faces of the sangha"]],
    CHRISTIANITY: [[20, "Not a building (where two or three)"], [140, "Fellowship (Acts 2:42)"], [337, "Not good to be alone (Genesis 2:18–25)"], [163, "Through the roof (Mark 2:1–12)"]],
    CATHOLIC: [[74, "The first community (Acts 2:42–47)"], [104, "The entrance (we gather first)"], [318, "The body of Christ (CCC 787–796)"], [36, "Through the roof (Mark 2:1–12)"]],
    JUDAISM: [[18, "Why some prayers need ten people (the minyan)"], [27, "Not good to be alone (Genesis 2:18–25)"], [500, "Re'eh: rejoice together (Deuteronomy 16:11, 14)"], [1054, "The synagogue today"]],
    ISLAM: [[16, "Friday (gather: jumu'ah)"], [259, "Brothers across tribes"], [369, "The rope of Allah (hold it together)"], [1040, "Your nearest mosque"]],
    SIKHISM: [[13, "The congregation (sangat)"], [8, "Everyone on the floor, everyone the same meal (langar)"], [144, "Sitting in the sangat"], [465, "Living ashtpadi 7 (choose your company)"]],
    SPIRITUAL: [[20, "Every tradition says it: you can't do this alone"], [17, "You're not the only one"], [278, "Sikhism: the free kitchen"], [421, "Alone, not lonely"]],
  },
  // i need to forgive someone. or be forgiven.
  forgiveness: {
    // thin: no year 1–3 lesson is about kshama or prayashchitta as such; these are the epics' and the Gita's own scenes
    HINDUISM: [[779, "Vana: Draupadi argues for anger, Yudhishthira for forgiveness"], [593, "Lakshmana's warning (an apology and an embrace)"], [199, "Arjuna's terror and praise (forgive my familiarity, 11.35–11.46)"], [166, "Desire, anger, ruin; the peace at the end (2.62–2.72)"]],
    BUDDHISM: [[666, "Removing grudges"], [202, "Overcome anger by kindness (Dhammapada 223–228)"], [531, "The king's regret (regret, confessed)"], [857, "Ashoka's remorse"]],
    CHRISTIANITY: [[7, "Forgive us as we forgive"], [11, "The father runs (the prodigal son)"], [31, "The unforgiving servant (Matthew 18:21–35)"], [586, "Father, forgive them (Luke 23:32–43)"]],
    CATHOLIC: [[129, "Reconciliation"], [135, "The act of contrition"], [485, "Father, forgive them (Luke 23:34)"], [925, "Forgiving the gunman (1983)"]],
    JUDAISM: [[17, "Return, not repentance (teshuvah)"], [652, "Yom Kippur: ask first"], [120, "The bedtime Shema (forgive before sleeping)"], [583, "Forgive us (selach lanu)"]],
    ISLAM: [[27, "The words of return (we wronged ourselves; forgive us)"], [118, "Astaghfirullah, a hundred times"], [496, "Don't you want to be forgiven?"], [634, "Sincere repentance (tawbah)"]],
    SIKHISM: [[259, "Farid: don't strike back"], [1054, "Maghi: the torn letter (the forty forgiven)"], [792, "Satta and Balvand (forgiven, and sung)"], [634, "Forgive our mistakes (the Ardas)"]],
    SPIRITUAL: [[947, "As we forgive"], [977, "Forgiving yourself"], [978, "Asking forgiveness"], [986, "Boundaries after (forgive and stay safe)"]],
  },
  // we're getting married, and our families pray differently (their own door only; the other family's door is a second walk)
  wedding: {
    // thin: no year 1–3 lesson on the vivaha rite itself (saptapadi, the seven steps)
    HINDUISM: [[511, "The four weddings (a father places his daughter's hand)"], [510, "The four weddings (two families tell their histories)"], [364, "The self split in two: husband and wife (Brihadaranyaka 1.4)"], [984, "Rukmini's letter (the Bhagavata's tenth book)"]],
    // thin: no year 1–3 lesson on a Buddhist blessing of a marriage (Buddhism has no wedding sacrament)
    BUDDHISM: [[571, "West, north, below, above (spouses: duties both ways)"], [664, "Together, lives on (Nakula's parents)"], [30, "Yasodhara (partner, not prize)"]],
    CHRISTIANITY: [[52, "Water into wine (John 2:1–11)"], [200, "Marriage (Mark 10:1–12)"], [89, "Love is patient (1 Corinthians 13)"], [337, "Not good to be alone (Genesis 2:18–25)"]],
    CATHOLIC: [[132, "Matrimony"], [35, "The wine ran out (John 2:1–11)"], [438, "The wedding night prayer (Tobit 8)"], [395, "Whither thou goest (Ruth 1)"]],
    // thin: no year 1–3 lesson on the chuppah, ketubah or seven blessings themselves; day 690 pictures Sinai as a wedding
    JUDAISM: [[690, "Shavuot: a wedding at the mountain"], [859, "I am my beloved's (Song of Songs 6:3)"], [276, "Akiva and Rachel (Ketubot 62b–63a)"], [1049, "Interfaith families"]],
    // the nikah itself has no lesson of its own in years 1–3
    ISLAM: [[531, "Love and mercy between you (30:21)"], [778, "Fatimah and Ali (a simple wedding)"], [717, "She proposed (Khadijah)"], [83, "Khadijah hires him"]],
    SIKHISM: [[56, "The four rounds (laavan, the anand karaj)"], [246, "The wedding date is written"], [423, "Oil at the threshold"], [244, "The soul as a bride"]],
    // thin: two lessons
    SPIRITUAL: [[648, "Musonius on marriage"], [258, "Christianity: love is patient"]],
  },
  // i'm grateful, and i don't know who to thank
  gratitude: {
    // thin: no year 1–3 lesson on thanks as such; these are harvest thanks, prasad, grace before food and Govardhan
    HINDUISM: [[153, "Pongal / Onam (harvest)"], [116, "The sweet (food offered, then shared)"], [173, "Sacrifice as knowledge (the verse said before dinner, 4.24)"], [895, "Govardhan lifted"]],
    BUDDHISM: [[595, "Blessings of the heart (gratitude is a blessing)"], [593, "The highest blessings"], [789, "Mahapajapati's thanks"], [58, "Two merchants (the first gift)"]],
    CHRISTIANITY: [[563, "Ten healed, one returned (Luke 17:11–19)"], [431, "Bless the Lord, O my soul (Psalm 103)"], [153, "The table, many views (eucharist: thanksgiving)"], [1059, "Thanksgiving"]],
    CATHOLIC: [[128, "The Eucharist"], [23, "My soul doth magnify (Luke 1:46–55)"], [177, "Bless the Lord, O my soul (Psalm 102 [103])"], [435, "The three young men (Daniel 3)"]],
    JUDAISM: [[116, "For firsts (Shehecheyanu)"], [109, "Modeh Ani"], [593, "We thank you (Modim)"], [387, "Tzav: the thanks offering (Leviticus 7:12)"]],
    ISLAM: [[3, "Thank-you as a reflex (alhamdulillah)"], [445, "If you are grateful (shukr, 14:7)"], [188, "Ad-Duha: speak of the blessings"], [694, "Sulayman's du'a"]],
    SIKHISM: [[642, "Ardas in joy"], [457, "Living ashtpadi 5 (count the ten)"], [204, "Pauri 25: even hunger is a gift"], [2, "Waheguru: wonder + teacher"]],
    SPIRITUAL: [[9, "Three things, out loud, badly"], [118, "Counting blessings"], [119, "Thank them directly"], [120, "Gratitude without the forced smile"]],
  },
};

/** Grief, scary health news, something hard, and forgiveness (someone may be carrying a hurt): sign-up never talks
 *  about keeping it up (no streak framing), and they walk the gentle lane in (lib/lane.ts). "hard" has no list of its
 *  own: the homepage promises it the door's day one ("a breath, a story, one line to carry").
 *  Belonging, a wedding and gratitude get the normal streak words. */
export const gentleStart = (why: unknown) => why === "grief" || why === "diagnosis" || why === "hard" || why === "forgiveness";

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
