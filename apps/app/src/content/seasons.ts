// Seasons: real moments in each tradition's calendar, each with a fixed-length daily quest (owner brief 2026-09-30),
// and each tradition's new year (when "your year on the hill" is offered).
// Pure data + pure date logic, no imports, so the unit tests load this file straight from Node (types stripped).
//
// Dates: Gregorian dates for 2026–2028, looked up 2026-09-30 from the sources named on each row. Lunar and lunisolar
// dates move by a day or two with the region and the moon sighting, so the app always says "dates may vary by
// community". Jewish dates are the daytime date (the day itself begins at sundown the evening before). Islamic dates
// are the Umm al-Qura projections. Hindu, Sikh and Buddhist dates follow the widely published Drik Panchang /
// public-holiday calendars. A quest never asks anyone to pray: the daily line is a question to sit with, or for
// people who chose "just learn", a line about how people keep the season.

export const DATES_MAY_VARY = "dates may vary by community";
/** After a season ends, its quest stays open this many days, so missed days can still be walked. */
export const GRACE_DAYS = 7;
/** A season's quest is offered from this many days before it starts. */
export const OFFER_FROM = 7;

export type SeasonKey =
  | "lent" | "advent" | "ramadan" | "awe" | "omer" | "navratri" | "diwali" | "vaisakhi" | "gurpurab" | "vesak" | "vassa"
  | "newyear" | "solstice-june" | "solstice-dec";

export type SeasonDef = {
  key: SeasonKey;
  /** lowercase, as the app says it */
  name: string;
  doors: string[];
  /** one line on what the season is */
  about: string;
  /** "practice" people: a question a day (never a new prayer). "learn" people: how people keep it. Cycled by day. */
  ask: string[];
  learn: string[];
  badge: string;
};

export const SEASON_DEFS: Record<SeasonKey, SeasonDef> = {
  lent: {
    key: "lent", name: "lent", doors: ["CHRISTIANITY", "CATHOLIC"], badge: "forty days",
    about: "the forty days from ash wednesday toward easter, remembering jesus's forty days in the wilderness.",
    ask: [
      "what's one thing you could set down for these forty days?",
      "where did you feel hungry for something more today?",
      "who could use a small act of mercy from you this week?",
      "what's crowding out quiet in your day?",
      "what would it look like to travel a little lighter?",
      "what did you give away today, even something small?",
      "what are you making room for?",
    ],
    learn: [
      "many christians give something up for lent, a food, a habit, a screen, to make room.",
      "ash wednesday starts it: a cross of ashes on the forehead and the words \"remember that you are dust.\"",
      "prayer, fasting and giving to people in need are the three old pillars of lent.",
      "many catholics skip meat on fridays in lent. fish fridays come from this.",
      "the forty days echo jesus's forty days in the desert before his public life began.",
      "some people add something instead: a daily reading, a visit, a kindness.",
      "lent ends in holy week: palm sunday, good friday, then easter.",
    ],
  },
  advent: {
    key: "advent", name: "advent", doors: ["CHRISTIANITY", "CATHOLIC"], badge: "the waiting",
    about: "the four sundays of waiting and getting ready before christmas.",
    ask: [
      "what are you waiting for this year?",
      "where could you use a little more hope right now?",
      "what would make room for peace in your house this week?",
      "who brings you joy, and do they know it?",
      "what small light could you bring into someone's evening?",
      "what's worth slowing down for before the rush?",
      "what are you getting ready for, inside?",
    ],
    learn: [
      "advent means \"coming.\" the season is about waiting and getting ready for christmas.",
      "many homes light an advent wreath: one more candle each sunday.",
      "the four candles often stand for hope, peace, joy and love, though churches vary.",
      "purple or blue marks advent in many churches: a color for waiting.",
      "advent calendars count the days, a door a day, down to christmas.",
      "the readings look two ways: back to the birth in bethlehem, and forward.",
      "some families set out the nativity scene and add the figures one by one.",
    ],
  },
  ramadan: {
    key: "ramadan", name: "ramadan", doors: ["ISLAM"], badge: "the month",
    about: "the month of fasting from dawn to sunset, when the qur'an was first revealed.",
    ask: [
      "what are you making room for this month?",
      "who could you share an iftar with, or send one to?",
      "what word or habit could you fast from too?",
      "what are you grateful for at sunset today?",
      "what is the fast teaching you about what you actually need?",
      "who is hungry near you, in any sense?",
      "what verse or idea stayed with you today?",
      "what do you hope carries past the month?",
    ],
    learn: [
      "muslims fast from dawn to sunset through ramadan: no food or water in daylight hours.",
      "suhoor is the meal before dawn. iftar breaks the fast at sunset, often with dates and water.",
      "many try to read the whole qur'an over the month, a portion each night.",
      "taraweeh are the extra night prayers many join at the mosque in ramadan.",
      "giving is part of it: zakat al-fitr is paid before the eid prayer so everyone can celebrate.",
      "laylat al-qadr, the night of power, is sought in the last ten nights.",
      "the fast is set aside for children, the sick, travelers and others it would harm.",
    ],
  },
  awe: {
    key: "awe", name: "the ten days of awe", doors: ["JUDAISM"], badge: "a new page",
    about: "rosh hashanah to yom kippur: ten days for looking back, making amends and turning around.",
    ask: [
      "what from this past year do you want to leave behind?",
      "who do you owe an apology, or a thank-you?",
      "what does \"returning\" look like for you this year?",
      "what's one thing you'd do differently, starting now?",
      "who could you forgive, even a little?",
      "what kind of year do you want to be written into?",
      "what would make this year a sweet one?",
    ],
    learn: [
      "rosh hashanah is the jewish new year. the shofar, a ram's horn, is blown like a wake-up call.",
      "apples dipped in honey are eaten for a sweet new year.",
      "teshuvah means \"return\": the work of these days is turning back toward the right path.",
      "many ask forgiveness from people directly before yom kippur. the day itself covers wrongs against god.",
      "tashlich: some throw crumbs into moving water, a picture of casting away wrongs.",
      "yom kippur is a 25-hour fast and the holiest day of the year.",
      "the greeting is \"may you be inscribed for a good year.\"",
    ],
  },
  omer: {
    key: "omer", name: "counting the omer", doors: ["JUDAISM"], badge: "forty-nine days",
    about: "the 49 days counted one by one from passover to shavuot, from freedom toward receiving the torah.",
    ask: [
      "what are you counting toward?",
      "what small thing did you grow in today?",
      "where did freedom show up in your day?",
      "what did you notice today that you'd normally miss?",
      "what quality would you like to work on this week?",
      "what's one step between who you are and who you want to be?",
      "what are you ready to receive?",
    ],
    learn: [
      "each night from the second night of passover, people count: \"today is one day of the omer.\"",
      "an omer was a measure of barley brought to the temple, which is where the name comes from.",
      "the count links leaving egypt with receiving the torah at sinai, 49 days later.",
      "the kabbalists gave each week a quality, like kindness or strength, to work on.",
      "many study pirkei avot, the \"sayings of the fathers,\" on the sabbaths of this season.",
      "lag ba'omer, the 33rd day, is a day of bonfires and celebration.",
      "the count ends at shavuot, when the ten commandments are read.",
    ],
  },
  navratri: {
    key: "navratri", name: "navaratri", doors: ["HINDUISM"], badge: "nine nights",
    about: "nine nights honoring the goddess in her forms, ending in vijayadashami, the victory of good.",
    ask: [
      "what strength do you need to call up this season?",
      "what's one thing in you that the light should win over?",
      "who is a quiet source of strength in your life?",
      "what would you like to begin fresh after these nine nights?",
      "where did you see courage today?",
      "what do you want to leave behind with the ninth night?",
      "what would victory over one small bad habit look like?",
    ],
    learn: [
      "navaratri means \"nine nights.\" each night honors a form of the goddess durga.",
      "in gujarat and far beyond, people dance garba and dandiya late into the night.",
      "many fast or eat simply for the nine days.",
      "in south india, families set up a golu: steps of dolls and figures, and visit each other's homes.",
      "in bengal it's durga puja: huge images of the goddess, then immersion in the river.",
      "on the eighth or ninth day, some honor young girls as the goddess and feed them.",
      "the tenth day, vijayadashami, marks rama's victory over ravana and durga's over mahishasura.",
    ],
  },
  diwali: {
    key: "diwali", name: "diwali", doors: ["HINDUISM"], badge: "festival of lights",
    about: "five days of lamps, from dhanteras to bhai dooj: light over darkness.",
    ask: [
      "what corner of your life could use some cleaning out?",
      "what darkness would you like a little light in this year?",
      "who could you bring something sweet to?",
      "what are you grateful to have this year?",
      "what would you like to welcome into your home?",
    ],
    learn: [
      "dhanteras, day one: homes are cleaned and many buy something new, often metal or gold.",
      "day two, choti diwali: the story of krishna defeating the demon narakasura.",
      "day three, diwali itself: diyas and lights everywhere, and lakshmi puja for the goddess of good fortune.",
      "day four is govardhan puja in many places, remembering krishna lifting a mountain to shelter people.",
      "day five, bhai dooj: brothers and sisters honor each other.",
    ],
  },
  vaisakhi: {
    key: "vaisakhi", name: "vaisakhi", doors: ["SIKHISM"], badge: "the khalsa",
    about: "the day guru gobind singh founded the khalsa in 1699, and punjab's harvest festival.",
    ask: [
      "what would you stand up for, even if it cost you?",
      "who could you serve this week without being asked?",
      "what harvest are you thankful for this year?",
      "what does being one of the same family mean to you?",
      "what could you share from your own table?",
      "where did you show courage lately?",
      "what commitment are you ready to renew?",
    ],
    learn: [
      "in 1699 at anandpur sahib, guru gobind singh asked who would give their head for the faith. five stepped up.",
      "those five became the panj pyare, the beloved five, the first of the khalsa.",
      "on vaisakhi, many sikhs take amrit, the khalsa initiation.",
      "nagar kirtan processions carry the guru granth sahib through the streets, with singing.",
      "gurdwaras serve langar, a free meal for everyone, whoever they are.",
      "the nishan sahib, the flag outside the gurdwara, is often renewed on vaisakhi.",
      "in punjab it's also harvest time, with bhangra and fairs.",
    ],
  },
  gurpurab: {
    key: "gurpurab", name: "guru nanak gurpurab", doors: ["SIKHISM"], badge: "prakash purab",
    about: "the birth of guru nanak, the first guru, on the full moon of kartik.",
    ask: [
      "where did you see the one light in someone different from you?",
      "what honest work are you proud of this week?",
      "what could you share today, time or food or attention?",
      "what would it mean to remember the name through an ordinary day?",
      "who treats everyone as equal, and what can you learn from them?",
      "what journey have you been putting off?",
      "what song or line stayed with you this week?",
    ],
    learn: [
      "guru nanak was born in 1469 in what is now pakistan. sikhs celebrate on the full moon of kartik.",
      "in the weeks before, prabhat pheris, early-morning processions, sing through the neighborhood.",
      "an akhand path, a 48-hour reading of the whole guru granth sahib, ends on the day.",
      "his three teachings are often put as: remember god, earn honestly, share with others.",
      "ik onkar, \"one creator,\" opens the guru granth sahib and was his first teaching.",
      "he traveled for years on long journeys called udasis, talking with people of every faith.",
      "gurdwaras light up and langar is served to everyone who comes.",
    ],
  },
  vesak: {
    key: "vesak", name: "vesak", doors: ["BUDDHISM"], badge: "the full moon",
    about: "the full moon that marks the buddha's birth, awakening and passing.",
    ask: [
      "what would a day of kindness toward every living thing look like?",
      "what did you notice when you slowed down today?",
      "what could you give today without expecting anything back?",
      "what are you ready to let go of?",
      "where did you see suffering today, and what eased it?",
      "what woke you up a little this week?",
      "what would you like to begin on the full moon?",
    ],
    learn: [
      "vesak remembers three moments in the buddha's life: his birth, his awakening and his passing.",
      "many visit temples, bring flowers, candles and incense, and listen to teachings.",
      "some lay buddhists keep the eight precepts for the day, living more simply.",
      "dana, generosity, is a big part of it: free food stalls and gifts to monks and nuns.",
      "lanterns fill the streets in sri lanka and many other countries.",
      "in some traditions, people pour water over a small statue of the baby buddha.",
      "the date follows the full moon, so it varies from country to country.",
    ],
  },
  vassa: {
    key: "vassa", name: "a taste of the rains retreat", doors: ["BUDDHISM"], badge: "rains retreat",
    about: "vassa, the three-month rains retreat. this is a 21-day taste of it.",
    ask: [
      "what could you stay with for three weeks, instead of starting something new?",
      "what's one habit you could rest from?",
      "where did you find stillness today?",
      "what did you notice about your mind today?",
      "who supports you, the way lay people support the monks?",
      "what would a simpler day look like?",
      "what has staying put taught you?",
    ],
    learn: [
      "vassa is the rains retreat: monks and nuns stay in one place for about three months.",
      "it began in the buddha's time, so monks wouldn't travel and trample crops in the rainy season.",
      "many lay people take on something for vassa: giving up a habit, meditating more, keeping precepts.",
      "in thailand, candles are offered to temples at the start of vassa.",
      "some young men ordain as monks just for the retreat.",
      "it ends with pavarana, and then kathina, when robes are offered to the monks.",
    ],
  },
  newyear: {
    key: "newyear", name: "the new year", doors: ["SPIRITUAL"], badge: "fresh start",
    about: "the first 21 days of the year: a fresh start, one small day at a time.",
    ask: [
      "what do you want more of this year?",
      "what's one thing from last year you're glad to leave behind?",
      "what would a good ordinary day look like this year?",
      "who do you want to spend more time with?",
      "what small promise could you actually keep?",
      "what did you learn about yourself last year?",
      "what are you curious about right now?",
    ],
    learn: [
      "people have marked new years for thousands of years, often with a clean-up and a promise.",
      "the babylonians made promises to their gods at the new year, an early version of resolutions.",
      "janus, the roman god the month is named for, had two faces: one looking back, one forward.",
      "in japan, temple bells ring 108 times at midnight on new year's eve.",
      "many cultures eat something round or sweet for a good year.",
      "research on habits suggests small, specific starts last longer than big resolutions.",
      "21 days won't make a habit on its own, but it's a real start.",
    ],
  },
  "solstice-june": {
    key: "solstice-june", name: "the june solstice", doors: ["SPIRITUAL"], badge: "the long light",
    about: "the longest day in the north (the shortest in the south): the sun's turning point.",
    ask: [
      "what's growing in your life right now?",
      "where could you spend more time outside this week?",
      "what's at its fullest for you right now?",
      "what would you like to harvest by winter?",
      "what does the light make easier for you?",
      "who do you want to share a long evening with?",
      "what's turning in you as the year turns?",
    ],
    learn: [
      "the solstice is when the sun reaches its farthest point north: the longest day in the northern half of the world.",
      "people have gathered at stonehenge for the summer sunrise for a very long time.",
      "in scandinavia, midsummer means flowers, dancing and staying up through the light night.",
      "many cultures lit bonfires around the summer solstice.",
      "the word means \"sun stands still\": for a few days it seems to rise at the same point.",
      "from here the days start to shorten, slowly, toward winter.",
      "in the southern half of the world it's the shortest day instead.",
    ],
  },
  "solstice-dec": {
    key: "solstice-dec", name: "the december solstice", doors: ["SPIRITUAL"], badge: "the return of the light",
    about: "the longest night in the north (the longest day in the south): after it, the light comes back.",
    ask: [
      "what's resting in you this season?",
      "what small light keeps you going in the dark months?",
      "what would you like to let go of before the year turns?",
      "who could use some warmth from you this week?",
      "what's worth waiting for?",
      "how could you make your evenings a little softer?",
      "what are you hoping comes back with the light?",
    ],
    learn: [
      "the december solstice is the longest night of the year in the northern half of the world.",
      "newgrange in ireland, older than the pyramids, lines up with the midwinter sunrise.",
      "many winter festivals across cultures are about light returning: candles, fires, lamps.",
      "yule was a midwinter festival in northern europe. the yule log comes from it.",
      "in iran, people stay up on yalda night with pomegranates and poetry.",
      "from here, the days start to get longer again.",
      "in the southern half of the world it's the longest day instead.",
    ],
  },
};

export type SeasonRow = { key: SeasonKey; year: number; start: string; end: string; source: string; note?: string };

/** The date n days after `date`. Calendar math, independent of any time zone. */
export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);

const W = "https://en.wikipedia.org/wiki/";
const HEBCAL = "https://www.hebcal.com/holidays/";
// start + a fixed length, a run-up of n days ending on the day, or an explicit start and end
const fixed = (key: SeasonKey, start: string, days: number, source: string, note?: string): SeasonRow => ({ key, year: +start.slice(0, 4), start, end: addDays(start, days - 1), source, ...(note ? { note } : {}) });
const runUp = (key: SeasonKey, day: string, days: number, source: string, note?: string): SeasonRow => ({ key, year: +day.slice(0, 4), start: addDays(day, -(days - 1)), end: day, source, ...(note ? { note } : {}) });
const span = (key: SeasonKey, start: string, end: string, source: string, note?: string): SeasonRow => ({ key, year: +start.slice(0, 4), start, end, source, ...(note ? { note } : {}) });

/** Every season, 2026–2028. Verified 2026-09-30 against the source on each row. */
export const SEASONS: SeasonRow[] = [
  // Christianity and Catholicism (Western calendar). Lent: 40 days from Ash Wednesday. Advent: first Sunday to Dec 24.
  fixed("lent", "2026-02-18", 40, `${W}Ash_Wednesday`, "ash wednesday; easter 2026-04-05"),
  fixed("lent", "2027-02-10", 40, `${W}Ash_Wednesday`, "ash wednesday; easter 2027-03-28"),
  fixed("lent", "2028-03-01", 40, `${W}Ash_Wednesday`, "ash wednesday; easter 2028-04-16"),
  span("advent", "2026-11-29", "2026-12-24", `${W}Advent_Sunday`),
  span("advent", "2027-11-28", "2027-12-24", `${W}Advent_Sunday`),
  span("advent", "2028-12-03", "2028-12-24", `${W}Advent_Sunday`),
  // Islam: Ramadan, first day to the day before Eid al-Fitr (Umm al-Qura; ±1 day with the moon sighting).
  span("ramadan", "2026-02-18", "2026-03-19", `${W}Ramadan`, "eid al-fitr 2026-03-20"),
  span("ramadan", "2027-02-08", "2027-03-08", `${W}Ramadan`, "eid al-fitr 2027-03-09"),
  span("ramadan", "2028-01-28", "2028-02-25", `${W}Ramadan`, "eid al-fitr 2028-02-26 (some calendars 2028-02-27)"),
  // Judaism: daytime dates (each begins at sundown the evening before).
  span("awe", "2026-09-12", "2026-09-21", `${HEBCAL}2026-2027`, "rosh hashanah 1 tishrei to yom kippur 10 tishrei"),
  span("awe", "2027-10-02", "2027-10-11", `${HEBCAL}2027-2028`),
  span("awe", "2028-09-21", "2028-09-30", `${HEBCAL}2028-2029`),
  fixed("omer", "2026-04-03", 49, `${HEBCAL}2025-2026`, "counting begins the night before; shavuot 2026-05-22"),
  fixed("omer", "2027-04-23", 49, `${HEBCAL}2026-2027`, "shavuot 2027-06-11"),
  fixed("omer", "2028-04-12", 49, `${HEBCAL}2027-2028`, "shavuot 2028-05-31"),
  // Hinduism: Sharad Navratri (to the day before Vijayadashami) and Diwali's five days (Dhanteras to Bhai Dooj).
  span("navratri", "2026-10-11", "2026-10-19", `${W}Vijayadashami`, "vijayadashami 2026-10-20 (bengal 2026-10-21)"),
  span("navratri", "2027-09-30", "2027-10-08", "https://samvat.in/festivals/navaratri-2027/", "vijayadashami 2027-10-09"),
  span("navratri", "2028-09-19", "2028-09-26", "https://www.drikpanchang.com/navratri/ashwin-shardiya-navratri-dates.html?year=2028", "a lunar day drops out in 2028: eight days; vijayadashami 2028-09-27"),
  span("diwali", "2026-11-06", "2026-11-10", `${W}Diwali`, "lakshmi puja 2026-11-08"),
  span("diwali", "2027-10-27", "2027-10-31", `${W}Diwali`, "lakshmi puja 2027-10-29"),
  span("diwali", "2028-10-15", "2028-10-19", `${W}Diwali`, "lakshmi puja 2028-10-17"),
  // Sikhism: run-ups ending on the day.
  runUp("vaisakhi", "2026-04-14", 10, "https://www.drikpanchang.com/festivals/vaisakhi/vaisakhi-date-time.html"),
  runUp("vaisakhi", "2027-04-14", 10, "https://www.drikpanchang.com/festivals/vaisakhi/vaisakhi-date-time.html"),
  runUp("vaisakhi", "2028-04-13", 10, "https://www.drikpanchang.com/festivals/vaisakhi/vaisakhi-date-time.html", "the nanakshahi calendar keeps 2028-04-14"),
  runUp("gurpurab", "2026-11-24", 7, "https://www.qppstudio.net/global-holidays-observances/guru-nanak-jayanti.htm", "kartik purnima; sgpc may announce a day either side"),
  runUp("gurpurab", "2027-11-14", 7, "https://www.qppstudio.net/global-holidays-observances/guru-nanak-jayanti.htm"),
  runUp("gurpurab", "2028-11-02", 7, "https://www.qppstudio.net/global-holidays-observances/guru-nanak-jayanti.htm"),
  // Buddhism: Vesak (7-day run-up to the most widely published date) and a 21-day taste of Vassa from its first day.
  runUp("vesak", "2026-05-31", 7, `${W}Vesak`, "singapore, malaysia, thailand; myanmar 2026-04-30, sri lanka 2026-05-30"),
  runUp("vesak", "2027-05-20", 7, `${W}Vesak`),
  runUp("vesak", "2028-05-09", 7, "https://publicholidays.sg/vesak-day/", "sri lanka 2028-05-23"),
  fixed("vassa", "2026-07-30", 21, "https://nationaltoday.com/asalha-puja/", "thai calendar; asalha puja 2026-07-29"),
  fixed("vassa", "2027-07-19", 21, "https://en.wikipedia.org/wiki/Vassa", "asalha puja 2027-07-18; varies by country"),
  fixed("vassa", "2028-07-08", 21, "https://en.wikipedia.org/wiki/Vassa", "asalha puja 2028-07-07; varies by country"),
  // My own path: the new year (Jan 1–21) and the week from each solstice (local date in the Americas).
  fixed("newyear", "2026-01-01", 21, "gregorian calendar"),
  fixed("newyear", "2027-01-01", 21, "gregorian calendar"),
  fixed("newyear", "2028-01-01", 21, "gregorian calendar"),
  fixed("solstice-june", "2026-06-21", 7, `${W}Solstice`),
  fixed("solstice-june", "2027-06-21", 7, `${W}Solstice`),
  fixed("solstice-june", "2028-06-20", 7, `${W}Solstice`),
  fixed("solstice-dec", "2026-12-21", 7, `${W}Solstice`),
  fixed("solstice-dec", "2027-12-21", 7, `${W}Solstice`, "2027-12-22 in utc, 2027-12-21 in the americas"),
  fixed("solstice-dec", "2028-12-21", 7, `${W}Solstice`),
];

/** Each tradition's new year: when "your year on the hill" is offered on Today (for a week). */
export type NewYear = { door: string; date: string; name: string; source: string };
const ny = (doors: string[], name: string, source: string, dates: string[]): NewYear[] => doors.flatMap((door) => dates.map((date) => ({ door, date, name, source })));
export const NEW_YEARS: NewYear[] = [
  ...ny(["CHRISTIANITY", "CATHOLIC", "SPIRITUAL"], "the new year", "gregorian calendar", ["2026-01-01", "2027-01-01", "2028-01-01"]),
  ...ny(["ISLAM"], "the islamic new year", `${W}Islamic_New_Year`, ["2026-06-16", "2027-06-06", "2028-05-25"]),
  ...ny(["JUDAISM"], "rosh hashanah", `${HEBCAL}2026-2027`, ["2026-09-12", "2027-10-02", "2028-09-21"]),
  ...ny(["HINDUISM"], "diwali", `${W}Diwali`, ["2026-11-08", "2027-10-29", "2028-10-17"]),
  ...ny(["SIKHISM"], "vaisakhi", "https://www.drikpanchang.com/festivals/vaisakhi/vaisakhi-date-time.html", ["2026-04-14", "2027-04-14", "2028-04-13"]),
  ...ny(["BUDDHISM"], "vesak", `${W}Vesak`, ["2026-05-31", "2027-05-20", "2028-05-09"]),
];
/** How long the new-year offer stays on Today. */
export const NEW_YEAR_DAYS = 7;

// ─── logic ─────────────────────────────────────────────────────────────────

export type Season = SeasonRow & { id: string; def: SeasonDef; length: number };
export const seasonId = (r: Pick<SeasonRow, "key" | "year">) => `${r.key}-${r.year}`;
const asSeason = (r: SeasonRow): Season => ({ ...r, id: seasonId(r), def: SEASON_DEFS[r.key], length: daysBetween(r.start, r.end) + 1 });
export const ALL_SEASONS: Season[] = SEASONS.map(asSeason);
export const seasonById = (id: string): Season | null => ALL_SEASONS.find((s) => s.id === id) || null;

export type Openness = "stay" | "sometimes" | "love";
/**
 * The doors whose seasons may be offered: always the home door; the visit door, which they chose to walk; and any
 * tradition they chose to taste (a line kept from it), but never for someone who said "stay on my path".
 */
export function seasonDoors(o: { home: string; visit?: string | null; openness?: Openness | null; tasted?: string[] }): string[] {
  const out = [o.home];
  if (o.visit && !out.includes(o.visit)) out.push(o.visit);
  if (o.openness && o.openness !== "stay") for (const d of o.tasted || []) if (d && !out.includes(d)) out.push(d);
  return out;
}

export type Phase = "upcoming" | "soon" | "active" | "grace" | "past";
/** Where today sits relative to a season: soon = within the offer window, grace = the week after it ends. */
export function phaseOf(s: Pick<Season, "start" | "end">, today: string): Phase {
  if (today < s.start) return daysBetween(today, s.start) <= OFFER_FROM ? "soon" : "upcoming";
  if (today <= s.end) return "active";
  return daysBetween(s.end, today) <= GRACE_DAYS ? "grace" : "past";
}

/** Seasons for these doors that are soon, active or in their grace week, soonest first. */
export function seasonsNear(doors: string[], today: string): (Season & { phase: Phase })[] {
  return ALL_SEASONS.filter((s) => s.def.doors.some((d) => doors.includes(d)))
    .map((s) => ({ ...s, phase: phaseOf(s, today) }))
    .filter((s) => s.phase === "soon" || s.phase === "active" || s.phase === "grace")
    .sort((a, b) => (a.start < b.start ? -1 : 1));
}

const WEEKDAY = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
/** "today", "tomorrow", "wednesday" (2–6 days), "a week from today". */
export function whenWords(today: string, date: string): string {
  const n = daysBetween(today, date);
  if (n <= 0) return "today";
  if (n === 1) return "tomorrow";
  if (n < 7) return WEEKDAY[new Date(`${date}T12:00:00Z`).getUTCDay()];
  if (n === 7) return "a week from today";
  return `in ${n} days`;
}

/** Day k of the season (1-based) for a date inside it, else 0 before it and length after it. */
export const seasonDay = (s: Pick<Season, "start" | "end" | "length">, today: string) => (today < s.start ? 0 : today > s.end ? s.length : daysBetween(s.start, today) + 1);

export type QuestState = { joined?: string; declined?: string };
export type Stone = "lit" | "rest" | "caught" | "today" | "missed" | "later";
export type Progress = {
  day: number; length: number; lit: number; missed: number; stones: Stone[]; phase: Phase;
  finished: boolean; finishedOn: string | null; canStillFinish: boolean; toGo: number; openUntil: string;
};

/**
 * A quest's progress. Each date of the season with a finished lesson lights its stone (lessons before joining count
 * too: nobody loses a day for joining late); a rest day from the streak lights it as a moon. Lessons in the grace
 * week after the season fill the earliest missed stones. The badge comes when every stone is lit.
 */
export function questProgress(s: Pick<Season, "start" | "end" | "length">, o: { lessonDates: Iterable<string>; restDates?: Iterable<string>; today: string }): Progress {
  const lessons = new Set(o.lessonDates);
  const rests = new Set(o.restDates || []);
  const { today } = o;
  const openUntil = addDays(s.end, GRACE_DAYS);
  const stones: Stone[] = [];
  const litOn: string[] = []; // the date each stone was lit, to find when the last one was
  for (let i = 0; i < s.length; i++) {
    const d = addDays(s.start, i);
    if (d > today) stones.push("later");
    else if (lessons.has(d)) { stones.push("lit"); litOn.push(d); }
    else if (rests.has(d)) { stones.push("rest"); litOn.push(d); }
    else stones.push(d === today ? "today" : "missed");
  }
  // the grace week: each lesson date after the season fills the earliest missed stone
  for (let d = addDays(s.end, 1); d <= today && d <= openUntil; d = addDays(d, 1)) {
    if (!lessons.has(d)) continue;
    const k = stones.indexOf("missed");
    if (k < 0) break;
    stones[k] = "caught";
    litOn.push(d);
  }
  const lit = litOn.length;
  const missed = stones.filter((x) => x === "missed").length;
  const finished = lit >= s.length;
  const finishedOn = finished ? litOn.sort()[s.length - 1] : null;
  const toGo = s.length - lit;
  // days still open to walk: the rest of the season (today too, if not yet lit) plus the grace week
  const left = today > openUntil ? 0 : daysBetween(today < s.start ? s.start : today, openUntil) + 1 - (lessons.has(today) ? 1 : 0);
  return {
    day: seasonDay(s, today), length: s.length, lit, missed, stones, phase: phaseOf(s, today),
    finished, finishedOn, canStillFinish: !finished && toGo <= left, toGo, openUntil,
  };
}

export type QuestCard =
  | { kind: "offer"; season: Season; line: string; joined: boolean }
  | { kind: "progress"; season: Season; progress: Progress; line: string };

/**
 * The one quest card for Today, or null. Joined quests come first (active, or in their grace week, or finished in
 * the last 3 days); then an offer for a season starting within 7 days or under way, unless they said "not this time".
 */
export function questCard(o: { doors: string[]; today: string; quests: Record<string, QuestState | undefined>; lessonDates: Iterable<string>; restDates?: Iterable<string> }): QuestCard | null {
  const near = seasonsNear(o.doors, o.today);
  const lessonDates = [...o.lessonDates];
  const restDates = [...(o.restDates || [])];
  for (const s of near) {
    const q = o.quests[s.id];
    if (!q?.joined || s.phase === "soon") continue;
    const p = questProgress(s, { lessonDates, restDates, today: o.today });
    if (p.finished && p.finishedOn && daysBetween(p.finishedOn, o.today) > 3) continue;
    if (!p.finished && s.phase === "grace" && !p.canStillFinish) continue;
    return { kind: "progress", season: s, progress: p, line: progressLine(s, p) };
  }
  for (const s of near) {
    const q = o.quests[s.id];
    if (q?.declined || s.phase === "grace") continue;
    if (q?.joined) return { kind: "offer", season: s, joined: true, line: `${s.def.name} begins ${whenWords(o.today, s.start)} · ${s.length} days · you're in` };
    if (s.phase === "active" && o.today === s.end) continue; // too late to begin on the last day
    return { kind: "offer", season: s, joined: false, line: offerLine(s, o.today) };
  }
  return null;
}

export function offerLine(s: Season, today: string): string {
  return today < s.start
    ? `${s.def.name} begins ${whenWords(today, s.start)} · ${s.length} days · join the quest`
    : `${s.def.name} · day ${seasonDay(s, today)} of ${s.length} · join the quest`;
}

export function progressLine(s: Season, p: Progress): string {
  if (p.finished) return `${s.def.name} · all ${p.length} stones lit`;
  if (p.phase === "grace") return `${s.def.name} is over · ${p.toGo} ${p.toGo === 1 ? "stone" : "stones"} to go, open till ${monthDay(p.openUntil)}`;
  return `${s.def.name} · day ${p.day} of ${p.length}`;
}

/** The gentle word when days were missed. Never a scold; rest days already count. */
export function stillFinishLine(s: Season, p: Progress): string | null {
  if (p.finished || p.missed === 0) return null;
  if (!p.canStillFinish) return `this one got away. every stone you lit still counts, and ${s.def.name} comes around again.`;
  return `you can still finish. ${p.toGo} ${p.toGo === 1 ? "stone" : "stones"} to go, and the quest stays open a week after ${s.def.name} ends. rest days count too.`;
}

/** Today's line for the quest: a question to sit with, or (for "just learn") how people keep it. */
export function seasonLine(s: Season, today: string, mode: "practice" | "learn"): string {
  const list = mode === "learn" ? s.def.learn : s.def.ask;
  const k = Math.max(0, seasonDay(s, today) - 1);
  return list[k % list.length];
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
export const monthDay = (d: string) => `${MONTHS[+d.slice(5, 7) - 1]} ${+d.slice(8, 10)}`;

/** Quests finished (all stones lit) with the badge date, for the recap and the You tab. */
export function finishedQuests(o: { quests: Record<string, QuestState | undefined>; lessonDates: Iterable<string>; restDates?: Iterable<string>; today: string }): { season: Season; on: string }[] {
  const lessonDates = [...o.lessonDates];
  const restDates = [...(o.restDates || [])];
  const out: { season: Season; on: string }[] = [];
  for (const [id, q] of Object.entries(o.quests)) {
    const s = seasonById(id);
    if (!s || !q?.joined) continue;
    const p = questProgress(s, { lessonDates, restDates, today: o.today });
    if (p.finished && p.finishedOn) out.push({ season: s, on: p.finishedOn });
  }
  return out.sort((a, b) => (a.on < b.on ? -1 : 1));
}

/** The new year to offer "your year on the hill" for, if one of the door's new years began in the last week. */
export function newYearNow(door: string, today: string): NewYear | null {
  return NEW_YEARS.find((y) => y.door === door && today >= y.date && daysBetween(y.date, today) < NEW_YEAR_DAYS) || null;
}
