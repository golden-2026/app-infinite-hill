// DRAFT — NOT KEEPER-REVIEWED. Written 2026-09-28 for the curated start of onboarding and the "whole climb"
// screen (app/trail.tsx). Every line below — door hooks, stage samples, "by here you'll be able to…" promises and
// summit cards — must be checked by that tradition's Keeper before public release (docs/CONTENT_RELEASE.md).
// Rules: accurate to the curriculum outline in @ih/content (data.CAMPS, data.LATER, OUTLINES), respectful, never
// comparative ("better", "truer"), modest where a camp is only outlined, and never a claim that lessons are reviewed.
// The Spanish (i18n/strings/onboarding-journeys.ts) is also a DRAFT, not Keeper-reviewed: same review, plus a native
// speaker's. Exports keep their names and shapes; each read picks the current language (DOOR_HOOK and OWN_PATH are
// getters, trailFor picks inside). Words drawn from the lesson outlines themselves (OUTLINES) stay in English.
import { data, OUTLINES } from "@ih/content";
import { fill, formatNumber, getLang } from "@/i18n/core";
import { es as COMMON_ES } from "@/i18n/strings/common";
import { DOOR_HOOK_ES, OWN_PATH_ES, PLANS_ES, TRAIL_ES, YEAR_NAMES_ES, YEAR_PROMISES_ES } from "@/i18n/strings/onboarding-journeys";

const isEs = () => getLang() === "es";
/** Getters over a plain English object: the Spanish when the app is in Spanish (and the Spanish has it). */
function bilingual<T extends Record<string, string>>(en: T, es: Record<string, string>): T {
  const o = {} as T;
  for (const k of Object.keys(en)) Object.defineProperty(o, k, { get: () => (isEs() && es[k] ? es[k] : en[k]), enumerable: true });
  return o;
}

const YEAR_ONE: number = data.CAMPS.reduce((n: number, c: [string, string, number]) => n + c[2], 0); // 331, as @ih/content

export const JOURNEY_STATUS = "draft-unreviewed" as const;

/** One line per door: what the trek holds (replaces the old, repetitive "one word a day"). DRAFT, Keeper review. */
export const DOOR_HOOK: Record<string, string> = bilingual({
  HINDUISM: "gods, epics, the Gita — a five-year trek",
  CHRISTIANITY: "parables, the life of Jesus, a whole gospel",
  CATHOLIC: "the Mass, the saints, the rosary, the Psalms",
  JUDAISM: "Genesis, Shabbat, a year of Torah portions",
  ISLAM: "the prophets' stories, salat, the short surahs",
  BUDDHISM: "the Buddha's life, the breath, the Dhammapada",
  SIKHISM: "the ten Gurus, seva and kirtan, Japji Sahib",
  SPIRITUAL: "Stoics, Rumi, zen stories — the best of every door",
}, DOOR_HOOK_ES);

/** What "my own path" promises, everywhere it's offered. DRAFT. */
export const OWN_PATH = bilingual({
  title: "my own path",
  line: "a path built around you",
  promise: "the house's best ideas, picked for you — stillness from one tradition, a story from another, a line to carry from a third. nothing to sign up to.",
}, OWN_PATH_ES);

export type Stage = {
  key: string;
  /** e.g. "camp 2 · 75 days" or "year 3" */
  eyebrow: string;
  name: string;
  first: number;
  last: number;
  samples: string[];
  /** "by here you'll be able to…" (finishes that sentence). */
  promise: string;
  /** Only outlined so far: shown quieter, and the copy says so. */
  outlined?: boolean;
  /** Not planned yet at all: no samples or promise, and the stop says so. */
  planned?: boolean;
};
export type Summit = { day: number; eyebrow: string; know: string; practice: string; able: string };

type Plan = { camps: [string[], string][]; years?: [string[], string][]; summit: Omit<Summit, "day" | "eyebrow"> };

// Per door: for each of the five camps (data.CAMPS order), [samples, promise]. Samples come from the camp's own
// outline (data.CAMP1_* words for camp 1, data.LATER for camps 2–5, OUTLINES.HINDUISM for years 2–5).
const PLANS: Record<string, Plan> = {
  HINDUISM: {
    camps: [
      [["namaste", "om", "dharma", "karma"], "know words you may have heard all your life, and what's underneath each one"],
      [["Ganesha's broken tusk", "Hanuman's leap", "the Ramayana as a serial", "Mahabharata cliffhangers"], "tell the Ramayana start to finish, and why Ganesha has an elephant's head"],
      [["the breath", "choosing a mantra", "a home shrine in five objects", "arti at sunset"], "sit with your breath for five minutes, and know what happens at arti and why"],
      [["Arjuna's despair", "the yoga of action", "the vision", "all 18 chapters"], "read a verse of the Gita and know what it's arguing — you'll have read the whole thing"],
      [["the Upanishads", "the three paths", "Advaita and Dvaita, never ranked", "the Yoga Sutras opening"], "explain the three paths — action, devotion, knowledge — and the question the Upanishads keep asking"],
    ],
    years: [
      [["the principal Upanishads", "the Yoga Sutras", "Valmiki's Ramayana, book by book"], "read a whole Upanishad closely, and the Ramayana as Valmiki told it"],
      [["the Mahabharata as a serial", "Krishna's childhood", "the bhakti poet-saints", "the modern teachers"], "follow the Mahabharata's long argument about duty, and know the poet-saints by name"],
      [["the Devi", "Shiva", "the six schools of thought", "the Vedas themselves"], "tell the six schools apart, and know where the Vedas sit in all of it"],
      [["Devanagari", "the Puranas", "Hinduism in the world", "the great sayings"], "sound out Devanagari, and hold the four great sayings in your own words"],
    ],
    summit: {
      know: "the epics, the Gita, the principal Upanishads, the six schools",
      practice: "breath, mantra, a daily sit, the festivals as they come round",
      able: "read a verse and explain it to a friend — and sit with the questions the tradition still argues about",
    },
  },
  CHRISTIANITY: {
    camps: [
      [["amen", "grace", "the Lord's Prayer", "the Good Samaritan"], "say the Lord's Prayer and know what each line is asking"],
      [["the parables", "the storm", "the feeding", "the last week"], "tell the life of Jesus from Bethlehem to Easter, and a handful of parables by heart"],
      [["prayer forms", "the church year", "sabbath as a practice", "scripture as a habit"], "keep a short daily prayer, and know why the church year moves the way it does"],
      [["the Gospel of Mark"], "have read a whole gospel — Mark, start to finish"],
      [["the Sermon on the Mount", "the mystics", "the denominations, without ranking"], "explain what the Sermon on the Mount asks, and how different churches read it"],
    ],
    summit: {
      know: "the life of Jesus, the parables, a whole gospel, the church year",
      practice: "a daily prayer, sabbath rest, scripture as a habit",
      able: "read a passage and say what it meant then and what people take from it now",
    },
  },
  CATHOLIC: {
    camps: [
      [["grace", "the sign of the cross", "the Mass, scene by scene", "the rosary"], "follow the Mass from start to end and know what each part is for"],
      [["the stories of Jesus", "Mary", "the saints"], "tell the stories behind the saints and Mary"],
      [["the Mass", "the rosary", "the sacraments", "the liturgical year"], "pray a decade of the rosary, and know what each of the seven sacraments marks"],
      [["the Psalms", "a gospel"], "pray a Psalm, and know why the Psalms have been prayed for thousands of years"],
      [["John of the Cross", "Thomas Merton", "catechism themes"], "know the mystics' way of prayer, and where the catechism's big themes come from"],
    ],
    summit: {
      know: "the Mass, the sacraments, the saints, the Psalms",
      practice: "the rosary, the church's year, a quiet prayer of your own",
      able: "walk into any Mass and know what's happening, and why",
    },
  },
  JUDAISM: {
    camps: [
      [["shalom", "the Shema", "Shabbat", "tzedakah"], "say the Shema and know why it sits at the heart of daily prayer"],
      [["Genesis as the original serial", "into Exodus"], "tell Genesis as a family saga — Abraham to Joseph — and how Exodus begins"],
      [["Shabbat as a practice", "blessings through the day", "the holidays as they arrive", "study as prayer"], "light the candles and say the blessings, and know what each holiday remembers"],
      [["the weekly Torah portion", "one parsha a week"], "read the week's Torah portion alongside Jews all over the world"],
      [["Pirkei Avot", "a taste of Talmud", "Hasidic stories", "the Psalms as prayer"], "follow a Talmud argument a little way, and carry a saying of the sages"],
    ],
    summit: {
      know: "Genesis and Exodus, the weekly portion, the holidays, the sages",
      practice: "Shabbat, blessings through the day, study as prayer",
      able: "sit down with a text and argue with it, the way the sages did",
    },
  },
  ISLAM: {
    camps: [
      [["salaam", "bismillah", "al-Fatiha", "the five pillars"], "know al-Fatiha line by line, and what the five pillars are"],
      [["Ibrahim and the idols", "Yusuf in full", "Yunus in the whale", "the first revelation"], "tell the prophets' stories, from Adam to the Hijra"],
      [["salat, step by step", "dhikr", "du'a", "Ramadan and the two Eids"], "know how salat is prayed and why, and what Ramadan asks of people"],
      [["juz' 'amma", "the short surahs", "Arabic sound first, meaning second"], "know the short surahs every Muslim child learns, by sound and by meaning"],
      [["the 99 names", "the seerah, continued", "Rumi and the Sufi path", "the Qur'an's structure"], "know how the Qur'an is put together, and a few of the 99 names by heart"],
    ],
    summit: {
      know: "the prophets' stories, the seerah, the short surahs, the 99 names",
      practice: "salat, dhikr, du'a in your own words, Ramadan as it arrives",
      able: "hear a surah recited and know what it's saying",
    },
  },
  BUDDHISM: {
    camps: [
      [["metta", "the breath", "the four noble truths", "the middle way"], "explain the four noble truths plainly, and wish someone well on purpose"],
      [["the palace", "the four sights", "the bodhi tree", "Kisa Gotami's mustard seed"], "tell the Buddha's life, from the palace to the first sermon"],
      [["metta in full", "breath meditation", "walking meditation", "the precepts"], "sit for five minutes, walk slowly on purpose, and know the five precepts"],
      [["the Dhammapada", "26 chapters"], "have read the whole Dhammapada, and carry a verse from it"],
      [["the Heart Sutra", "koans", "Theravada and Tibetan paths", "the Satipatthana Sutta"], "tell the major schools apart, and read the Heart Sutra knowing what it's saying"],
    ],
    summit: {
      know: "the Buddha's life, the four truths, the Dhammapada, the schools",
      practice: "breath, metta, walking meditation, the precepts",
      able: "sit with a hard feeling and watch it change",
    },
  },
  SIKHISM: {
    camps: [
      [["seva", "Ik Onkar", "the Mool Mantar", "langar"], "know the Mool Mantar line by line, and the three pillars of a Sikh life"],
      [["Nanak's travels", "the ten Gurus", "Vaisakhi 1699", "the sakhis"], "tell the story of the ten Gurus, from Guru Nanak to Guru Gobind Singh"],
      [["seva in practice", "kirtan", "simran on the breath", "the gurdwara visit"], "know what happens in a gurdwara and why, and keep simran on the breath"],
      [["Japji Sahib", "verse by verse", "Gurmukhi sound first"], "have walked through all of Japji Sahib, verse by verse"],
      [["the Guru Granth Sahib's themes", "Kabir and Farid in the Granth", "Sikh history", "the diaspora"], "know the Granth's big themes, and the history — including the hard parts"],
    ],
    summit: {
      know: "the ten Gurus, Japji Sahib, the Granth's big themes, Sikh history",
      practice: "seva, simran, kirtan, a place at langar",
      able: "walk into a gurdwara anywhere and feel at home",
    },
  },
  SPIRITUAL: {
    camps: [
      [["breathe", "notice", "the golden rule", "gratitude"], "stop, breathe and notice — anywhere, in under a minute"],
      [["Marcus Aurelius, not wanting to get up", "zen stories", "Hasidic tales", "Nasruddin"], "carry stories from many traditions — each one told with its source"],
      [["the evening review", "walking", "the body scan", "a digital sabbath"], "keep a small daily practice that's yours: a sit, a walk, an evening review"],
      [["Rumi", "Marcus Aurelius' Meditations"], "have read Rumi and Marcus Aurelius side by side, and carry a line from each"],
      [["a week at each of the seven doors", "the Stoics", "the science"], "know what each of the seven doors holds, and what the science says about practice"],
    ],
    summit: {
      know: "the best stories and ideas of every door, each with its source",
      practice: "a daily sit, an evening review, kindness on purpose",
      able: "meet a hard day with something steady — borrowed from the wisest people who ever lived",
    },
  },
};

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

// "By here you'll be able to…" for years two to five on the doors whose later years come from their five-year plans
// (docs/curriculum/<door>/y2–y5.md). Written from each year's blocks as an outcome, not a list of chapter names.
// DRAFT, like the plans themselves.
const YEAR_PROMISES: Record<string, string[]> = {
  CHRISTIANITY: [
    "read the Bible's big books in order, from Genesis to the Gospels, and know where any story sits",
    "tell the church's long story, from Israel and the first believers to Christians across the world today",
    "understand how different Christians pray, decide what's right, and face the hardest questions",
    "read a Gospel, Acts and the letters in their own words, and live what you've found",
  ],
  CATHOLIC: [
    "follow the Bible from Genesis to the Apocalypse, and hear the readings of the Church's year",
    "tell the Church's story, from the Fathers and the councils to the saints of every century",
    "find your way around the Catechism, Aquinas, the great orders and the Church's social teaching",
    "read the spiritual classics yourself, and practice the works of mercy in an ordinary life",
  ],
  JUDAISM: [
    "know the whole Torah and walk the prayer book, service by service, through the Jewish year",
    "tell the story of a people, from the prophets and the writings to the story after the Bible",
    "understand how Judaism thinks and lives: the Talmud, Maimonides, Hasidic thought, the movements and the life cycle",
    "read the sources yourself, a tractate, Pirkei Avot, midrash, and live a Jewish week with meaning",
  ],
  ISLAM: [
    "walk the Qur'an surah by surah, and know what each part is about",
    "tell the life of the Prophet ﷺ, his family and his companions, from Mecca to Medina",
    "understand the five pillars in depth, how hadith are weighed, and the schools of law, side by side",
    "carry the forty hadith and the ninety-nine names, and read whole passages of the Qur'an",
  ],
  BUDDHISM: [
    "know the four noble truths and the eightfold path in the Buddha's own words, discourse by discourse",
    "tell the Buddha's life, his disciples, and how the teaching travelled across Asia and the world",
    "understand the schools, from Abhidhamma to Zen, Pure Land and Tibet, side by side and never ranked",
    "read the sources yourself, a little Pali and Shantideva, and keep a practice as a householder",
  ],
  SIKHISM: [
    "know the daily banis, from Jaap Sahib to Kirtan Sohila, and the Ardas line by line",
    "tell the Panth's long story, from the first tellers and the Bhagats to Sikhs today",
    "understand the ragas, the Gurus' teachings, the Khalsa and the Rehat Maryada",
    "read the Guru Granth Sahib yourself, in order, and live it day to day",
  ],
  SPIRITUAL: [
    "read the Stoics in full, Epictetus, Seneca and Marcus Aurelius, and use them on a hard day",
    "bring wisdom from every tradition to the big questions: suffering, death, love, work, forgiveness and awe",
    "know the thinkers and the schools, from the Tao Te Ching and Montaigne to Thoreau and the science of practice",
    "read the sources yourself, walk with the poets, and build a practice of your own",
  ],
};

/** The whole climb for a door, from the trailhead up: the five camps (year one ends at a lookout, not the summit),
 *  then years two to five — outlined where a plan exists (Hinduism), otherwise one "being planned" stage — and the
 *  summit at the top of the five years. */
export function trailFor(door: string): { stages: Stage[]; lookout: number; summit: Summit; planned: boolean } {
  const es = isEs();
  const plan = PLANS[door] || PLANS.SPIRITUAL;
  // the Spanish plan, in the same shape and order (falls back to the English, piece by piece, if a line is missing)
  const planEs = es ? PLANS_ES[PLANS[door] ? door : "SPIRITUAL"] : undefined;
  let day = 1;
  const stages: Stage[] = data.CAMPS.map(([camp, name, len]: [string, string, number], i: number) => {
    const [samples, promise] = planEs?.camps[i] || plan.camps[i] || [[], ""];
    const s: Stage = es
      ? { key: camp, eyebrow: fill(TRAIL_ES.campEyebrow, { n: camp.replace(/\D/g, ""), len }, "es"), name: (COMMON_ES as Record<string, unknown>)[`camp.${camp}`] as string || lower(name), first: day, last: day + len - 1, samples, promise }
      : { key: camp, eyebrow: `${camp.toLowerCase()} · ${len} days`, name: lower(name), first: day, last: day + len - 1, samples, promise };
    day += len;
    return s;
  });
  const end = YEAR_ONE + 4 * 365;
  const summit: Summit = es
    ? { day: end, eyebrow: fill(TRAIL_ES.summitEyebrow, { day: formatNumber(end, "es") }, "es"), ...plan.summit, ...planEs?.summit }
    : { day: end, eyebrow: `day ${end.toLocaleString("en-US")} · the top of the five-year climb`, ...plan.summit };
  if (!plan.years) {
    // no hand-written promise for years 2–5: read them from the path's own five-year plan (OUTLINES), if it has one
    const out = OUTLINES[door] as Map<number, any> | undefined;
    if (!out || !out.get(YEAR_ONE + 1)) {
      stages.push({ key: "Years 2-5", eyebrow: es ? TRAIL_ES.yearsPlanned : "years 2–5", name: es ? TRAIL_ES.ranges : "the ranges", first: YEAR_ONE + 1, last: end, samples: [], promise: "", outlined: true, planned: true });
      return { stages, lookout: YEAR_ONE, summit, planned: true };
    }
    for (let k = 0; k < 4; k++) {
      const first = YEAR_ONE + 1 + k * 365;
      const days = Array.from({ length: 365 }, (_, i) => out.get(first + i)).filter(Boolean);
      const heading = String(days[0]?.camp || "");
      const theme = (heading.match(/[“"]([^”"]+)[”"]/) || [])[1] || (es ? TRAIL_ES.ranges : "the ranges");
      // the year's blocks, by name ("Block A · Exodus finished (Days 332–378)" → "exodus finished"); a year without
      // named blocks falls back to a spread of its session titles
      const named = [...new Set(days.map((d) => String(d.part || "").replace(/^(Block|Weeks?|Part)\s+[\w–-]+\s*·\s*/i, "").split(" · ")[0].replace(/\s*\(.*$/, "").trim()).filter((p) => p && !/^(block|weeks?|opening)\b/i.test(p)))];
      const parts = named.length >= 2 ? named : [0, 0.25, 0.5, 0.75].map((f) => String(days[Math.floor(f * days.length)]?.title || "").replace(/\s*\(.*$/, "")).filter(Boolean);
      // part names can hold commas ("The Acts of the Apostles, read through"), so they're set apart with dots
      const tidy = (p: string) => p.replace(/^(The|A|An) /, (m) => m.toLowerCase());
      const promise = es
        ? YEAR_PROMISES_ES[door]?.[k] || YEAR_PROMISES[door]?.[k] || fill(TRAIL_ES.walkThrough, { parts: `${parts.slice(0, 3).map(tidy).join(" · ")}${parts.length > 3 ? TRAIL_ES.andMore : ""}` }, "es")
        : YEAR_PROMISES[door]?.[k] || `walk through ${parts.slice(0, 3).map(tidy).join(" · ")}${parts.length > 3 ? " · and more" : ""}`;
      const eyebrow = es ? fill(TRAIL_ES.yearEyebrow, { n: String(k + 2) }, "es") : `year ${k + 2} · 365 days`;
      stages.push({ key: `Year ${k + 2}`, eyebrow, name: lower(theme), first, last: first + 364, samples: parts.slice(0, 4), promise, outlined: true });
    }
    return { stages, lookout: YEAR_ONE, summit, planned: false };
  }
  plan.years.forEach(([samplesEn, promiseEn], k) => {
    const first = YEAR_ONE + 1 + k * 365;
    const [samples, promise] = planEs?.years?.[k] || [samplesEn, promiseEn];
    const eyebrow = es ? fill(TRAIL_ES.yearEyebrow, { n: String(k + 2) }, "es") : `year ${k + 2} · 365 days`;
    const name = (es ? YEAR_NAMES_ES : ["the ranges", "the great epics", "gods and schools", "the language and the world"])[k];
    stages.push({ key: `Year ${k + 2}`, eyebrow, name, first, last: first + 364, samples, promise, outlined: true });
  });
  return { stages, lookout: YEAR_ONE, summit, planned: false };
}

/** The painted lookout for the end of a part of the climb ("Camp 1"…"Camp 5", "Year 2"…, "Years 2-5"): its art key
 *  in @ih/brand. Camps each have their own; years two to five share "the ranges". The summit has its own too. */
export function lookoutArt(part: string): string {
  const camp = /^Camp ([1-5])$/.exec(part);
  return camp ? `lookout-${camp[1]}` : "lookout-ranges";
}
export const SUMMIT_ART = "lookout-summit";
