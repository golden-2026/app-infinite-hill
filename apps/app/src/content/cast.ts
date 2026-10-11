// The recurring cast (owner, 2026-10-09): ordinary people who show up again and again in a door's lessons, so the path
// feels like a story with people in it. Hindu path first: a family in Edison, NJ (docs: the Hindu cast kit). Art made
// with ChatGPT from the owner's prompts; fictional, never presented as real users.
//
//   faces   in the "what would you say?" chat: the lesson's asker ("your sister", "a classmate") is played by the cast
//           member who fits; anyone else keeps the lesson's own wording
//   scenes  a picture over a lesson's opening, on the days it was drawn for
//
// SCHOLAR REVIEW REQUIRED before public release (the cast and the shrine/arti scenes), as with every lesson.

type Who = { name: string; face: number };

const HINDU: Record<string, Who> = {
  priya: { name: "Priya", face: require("../../assets/cast/hindu/priya.webp") },
  nani: { name: "Nani", face: require("../../assets/cast/hindu/nani.webp") },
  arjun: { name: "Arjun", face: require("../../assets/cast/hindu/arjun.webp") },
  sam: { name: "Sam", face: require("../../assets/cast/hindu/sam.webp") },
};

// Who plays which asker: Priya is 16 (a sister, cousin, niece, daughter), Sam her best friend (a friend, classmate,
// roommate, neighbor), Arjun the dad (a dad, uncle, coworker), Nani the elder (a grandparent or aunt quizzing you; owner
// asked for more of her, 2026-10-09). Mothers are left as written: the
// family's mother has died, and the cast never stands in for her.
const PLAYS: [RegExp, string][] = [
  [/^(your )?(grandmother|grandma|nani|grandfather|grandpa|aunt)$/, "nani"], // an elder quizzing you: Nani loves to
  [/^(your )?(dad|father|uncle)$|coworker|friend (from|at) work/, "arjun"],
  [/^(your )?(little |teenage |younger )?(sister|cousin|niece|daughter)$|^(your )?(kid|teenager)$/, "priya"],
  [/best friend|roommate|classmate|^(your |a )?(friend|new friend)$|neighbor$|teammate|study partner|friend from school/, "sam"],
];

// Christianity (owner, 2026-10-10): an African-American family in Atlanta. Grace (16, choir), Pop (her grandfather, a
// deacon), Marcus (her dad, an ER nurse), Leo (her best friend, family not religious). Same roles as the Hindu cast.
const CHRISTIAN: Record<string, Who> = {
  priya: { name: "Grace", face: require("../../assets/cast/christianity/grace.webp") },
  nani: { name: "Pop", face: require("../../assets/cast/christianity/pop.webp") },
  arjun: { name: "Marcus", face: require("../../assets/cast/christianity/marcus.webp") },
  sam: { name: "Leo", face: require("../../assets/cast/christianity/leo.webp") },
};
// Catholicism (owner, 2026-10-10): a Mexican-American family in San Antonio. Sofia (16, soccer), Abuela Rosa (her
// grandmother, runs the parish tamale sale), Tomás (her dad, history teacher and coach), Mia (her best friend, not
// religious). Same roles as the Hindu cast.
const CATHOLIC: Record<string, Who> = {
  priya: { name: "Sofia", face: require("../../assets/cast/catholic/sofia.webp") },
  nani: { name: "Abuela", face: require("../../assets/cast/catholic/abuela.webp") },
  arjun: { name: "Tomás", face: require("../../assets/cast/catholic/tomas.webp") },
  sam: { name: "Mia", face: require("../../assets/cast/catholic/mia.webp") },
};
// Judaism (owner, 2026-10-11): a family outside Chicago. Noa (16, theater kid), Saba David (her grandfather, a retired
// pharmacist), Rachel (her mom, an architect), Owen (her best friend, loosely Lutheran). Here the parent is the mom, so
// Rachel plays "your mom" (and the coworker) and Saba the grandfathers and uncles; "your dad" keeps its own wording.
const JEWISH: Record<string, Who> = {
  priya: { name: "Noa", face: require("../../assets/cast/judaism/noa.webp") },
  nani: { name: "Saba", face: require("../../assets/cast/judaism/saba.webp") },
  arjun: { name: "Rachel", face: require("../../assets/cast/judaism/rachel.webp") },
  sam: { name: "Owen", face: require("../../assets/cast/judaism/owen.webp") },
};
const PLAYS_BY_DOOR: Record<string, [RegExp, string][]> = {
  JUDAISM: [
    [/^(your )?(grandfather|grandpa|uncle)$/, "nani"],
    [/^(your )?(mom|mother|aunt)$|coworker|friend (from|at) work/, "arjun"],
    ...PLAYS.slice(2),
  ],
};
// Islam (owner, 2026-10-11): a family in Houston. Amira (16), Dadi Fatima (her grandmother), Yusuf (her dad, runs a
// coffee shop), Jordan (her best friend). Same roles as the Hindu cast.
const MUSLIM: Record<string, Who> = {
  priya: { name: "Amira", face: require("../../assets/cast/islam/amira.webp") },
  nani: { name: "Dadi", face: require("../../assets/cast/islam/dadi.webp") },
  arjun: { name: "Yusuf", face: require("../../assets/cast/islam/yusuf.webp") },
  sam: { name: "Jordan", face: require("../../assets/cast/islam/jordan.webp") },
};
const CASTS: Record<string, Record<string, Who>> = { HINDUISM: HINDU, CHRISTIANITY: CHRISTIAN, CATHOLIC, JUDAISM: JEWISH, ISLAM: MUSLIM };

/** The cast member playing a chat's asker on this door, or null (the lesson's own wording stays). */
export function castFor(door: string, who: string | undefined): Who | null {
  const cast = CASTS[door];
  if (!cast || !who) return null;
  const w = who.toLowerCase().trim();
  const hit = (PLAYS_BY_DOOR[door] ?? PLAYS).find(([re]) => re.test(w));
  return hit ? cast[hit[1]] : null;
}

const SCENE = {
  doorway: require("../../assets/cast/hindu/scene-doorway.webp"),
  dinner: require("../../assets/cast/hindu/scene-dinner.webp"),
  diwali: require("../../assets/cast/hindu/scene-diwali.webp"),
  holi: require("../../assets/cast/hindu/scene-holi.webp"),
  arti: require("../../assets/cast/hindu/scene-arti.webp"),
  "car": require("../../assets/cast/hindu/scene-car.webp"),
  "garba": require("../../assets/cast/hindu/scene-garba.webp"),
  "janmashtami": require("../../assets/cast/hindu/scene-janmashtami.webp"),
  "ganesh-clay": require("../../assets/cast/hindu/scene-ganesh-clay.webp"),
  "rakhi": require("../../assets/cast/hindu/scene-rakhi.webp"),
  "restless": require("../../assets/cast/hindu/scene-restless.webp"),
  "om": require("../../assets/cast/hindu/scene-om.webp"),
  "unkind": require("../../assets/cast/hindu/scene-unkind.webp"),
  "salt": require("../../assets/cast/hindu/scene-salt.webp"),
  "banyan": require("../../assets/cast/hindu/scene-banyan.webp"),
  "shadows": require("../../assets/cast/hindu/scene-shadows.webp"),
  "shivaratri": require("../../assets/cast/hindu/scene-shivaratri.webp"),
  "serial": require("../../assets/cast/hindu/scene-serial.webp"),
  "dice": require("../../assets/cast/hindu/scene-dice.webp"),
  "seva": require("../../assets/cast/hindu/scene-seva.webp"),
  "river": require("../../assets/cast/hindu/scene-river.webp"),
  "vow": require("../../assets/cast/hindu/scene-vow.webp"),
  "cousins": require("../../assets/cast/hindu/scene-cousins.webp"),
  "karna-basket": require("../../assets/cast/hindu/scene-karna-basket.webp"),
  "palace": require("../../assets/cast/hindu/scene-palace.webp"),
  "question": require("../../assets/cast/hindu/scene-question.webp"),
  "love-story": require("../../assets/cast/hindu/scene-love-story.webp"),
  "waiting": require("../../assets/cast/hindu/scene-waiting.webp"),
  "riddles": require("../../assets/cast/hindu/scene-riddles.webp"),
  "mediator": require("../../assets/cast/hindu/scene-mediator.webp"),
  "chariot": require("../../assets/cast/hindu/scene-chariot.webp"),
  "maze": require("../../assets/cast/hindu/scene-maze.webp"),
  "wheel": require("../../assets/cast/hindu/scene-wheel.webp"),
  "bed-teaching": require("../../assets/cast/hindu/scene-bed-teaching.webp"),
  "dog": require("../../assets/cast/hindu/scene-dog.webp"),
  "butter": require("../../assets/cast/hindu/scene-butter.webp"),
  "deep-end": require("../../assets/cast/hindu/scene-deep-end.webp"),
  "moon-dance": require("../../assets/cast/hindu/scene-moon-dance.webp"),
  "silent-hill": require("../../assets/cast/hindu/scene-silent-hill.webp"),
  "potter": require("../../assets/cast/hindu/scene-potter.webp"),
  "mira": require("../../assets/cast/hindu/scene-mira.webp"),
  "debate": require("../../assets/cast/hindu/scene-debate.webp"),
  "umbrella": require("../../assets/cast/hindu/scene-umbrella.webp"),
  "garden-seva": require("../../assets/cast/hindu/scene-garden-seva.webp"),
  "friend-gift": require("../../assets/cast/hindu/scene-friend-gift.webp"),
  "durga-puja": require("../../assets/cast/hindu/scene-durga-puja.webp"),
  "saraswati": require("../../assets/cast/hindu/scene-saraswati.webp"),
  "rangoli": require("../../assets/cast/hindu/scene-rangoli.webp"),
  "logic": require("../../assets/cast/hindu/scene-logic.webp"),
  "yoga": require("../../assets/cast/hindu/scene-yoga.webp"),
  "reflection": require("../../assets/cast/hindu/scene-reflection.webp"),
  "big-book": require("../../assets/cast/hindu/scene-big-book.webp"),
  "chanting": require("../../assets/cast/hindu/scene-chanting.webp"),
  "sunrise-offering": require("../../assets/cast/hindu/scene-sunrise-offering.webp"),
  "havan": require("../../assets/cast/hindu/scene-havan.webp"),
  "museum": require("../../assets/cast/hindu/scene-museum.webp"),
  "chant-lesson": require("../../assets/cast/hindu/scene-chant-lesson.webp"),
  "garland": require("../../assets/cast/hindu/scene-garland.webp"),
  "healing": require("../../assets/cast/hindu/scene-healing.webp"),
  "gopuram": require("../../assets/cast/hindu/scene-gopuram.webp"),
  "kites": require("../../assets/cast/hindu/scene-kites.webp"),
  "onam": require("../../assets/cast/hindu/scene-onam.webp"),
};
const HINDU_SCENES: Record<number, number> = {
  1: SCENE.doorway, // the one at every doorway (Ganesha)
  30: SCENE.dinner, // the forgotten strength (Nani tells the story)
  81: SCENE.diwali, 88: SCENE.diwali, 139: SCENE.diwali, 140: SCENE.diwali,
  82: SCENE.holi, 96: SCENE.holi, 141: SCENE.holi, 142: SCENE.holi,
  122: SCENE.arti, // family arti
  // more scenes (owner, 2026-10-10); "seva" is held back: its kitchen reads as a Sikh gurdwara, not a Hindu temple
  164: SCENE.car, // act, never for the fruit (Arjun and Priya in the car)
  80: SCENE.garba, 87: SCENE.garba, 144: SCENE.garba, 686: SCENE.garba,
  92: SCENE.janmashtami, 670: SCENE.janmashtami,
  79: SCENE["ganesh-clay"], 93: SCENE["ganesh-clay"], 147: SCENE["ganesh-clay"], 678: SCENE["ganesh-clay"],
  150: SCENE.rakhi, 683: SCENE.rakhi,
  181: SCENE.restless, 2: SCENE.om, 255: SCENE.om,
  329: SCENE.unkind, 339: SCENE.salt, 348: SCENE.banyan,
  58: SCENE.shadows, 613: SCENE.shadows, 632: SCENE.shadows, 635: SCENE.shadows,
  675: SCENE.shivaratri, 705: SCENE.serial, 765: SCENE.dice, 768: SCENE.dice,
  // years 3-4 (owner, 2026-10-10); seva now a Hindu temple kitchen
  261: SCENE.seva, 318: SCENE.seva,
  704: SCENE.river, 711: SCENE.vow, 714: SCENE.vow, 722: SCENE.cousins, 728: SCENE["karna-basket"], 746: SCENE.palace,
  770: SCENE.question, 790: SCENE["love-story"], 795: SCENE.waiting, 801: SCENE.riddles, 813: SCENE.mediator,
  819: SCENE.chariot, 831: SCENE.maze, 837: SCENE.wheel, 861: SCENE["bed-teaching"], 873: SCENE.dog,
  885: SCENE.butter, 892: SCENE["deep-end"], 895: SCENE.umbrella, 900: SCENE["moon-dance"], 921: SCENE.potter,
  930: SCENE.mira, 939: SCENE.debate, 949: SCENE["silent-hill"], 956: SCENE["garden-seva"], 986: SCENE["friend-gift"],
  1062: SCENE["durga-puja"], 1072: SCENE.saraswati, 1073: SCENE.rangoli, 1160: SCENE.logic, 1181: SCENE.yoga, 1192: SCENE.reflection,
  1244: SCENE.chanting, 1262: SCENE["sunrise-offering"], 1268: SCENE.havan, 1274: SCENE["chant-lesson"], 1280: SCENE.healing,
  1300: SCENE.kites, 1328: SCENE.museum, 1353: SCENE.garland, 1370: SCENE.gopuram, 1394: SCENE.onam,
  697: SCENE["big-book"],
  // year 5 scenes (avatars, critical, practice, arrivals, sam-teaches, stars, summit, sanskrit) are in assets/cast/hindu; placed when year 5 is written
};

const C_SCENE = {
  choir: require("../../assets/cast/christianity/scene-choir.webp"),
  potluck: require("../../assets/cast/christianity/scene-potluck.webp"),
  christmas: require("../../assets/cast/christianity/scene-christmas.webp"),
  shift: require("../../assets/cast/christianity/scene-shift.webp"),
  easter: require("../../assets/cast/christianity/scene-easter.webp"),
  porch: require("../../assets/cast/christianity/scene-porch.webp"),
};
const CHRISTIAN_SCENES: Record<number, number> = {
  19: C_SCENE.easter, 119: C_SCENE.easter, // the women at the tomb; Easter is fifty days
  76: C_SCENE.potluck, 140: C_SCENE.potluck, // they shared everything; fellowship
  110: C_SCENE.christmas, 111: C_SCENE.christmas, // Advent; Christmas
  135: C_SCENE.choir, 136: C_SCENE.choir, 430: C_SCENE.choir, // the church sings; Watts and Wesley; sing a new song
  105: C_SCENE.porch, 106: C_SCENE.porch, // how long, O Lord?; when prayer feels empty
  418: C_SCENE.shift, // joy in the morning
};
// Catholic scenes (owner, 2026-10-10): two lessons each, three in the first week
const K_SCENE = {
  mass: require("../../assets/cast/catholic/scene-mass.webp"),
  rosary: require("../../assets/cast/catholic/scene-rosary.webp"),
  ofrenda: require("../../assets/cast/catholic/scene-ofrenda.webp"),
  posadas: require("../../assets/cast/catholic/scene-posadas.webp"),
  ashes: require("../../assets/cast/catholic/scene-ashes.webp"),
  field: require("../../assets/cast/catholic/scene-field.webp"),
};
const CATHOLIC_SCENES: Record<number, number> = {
  1: K_SCENE.field, 209: K_SCENE.field, // the smallest prayer; it is I, fear not
  4: K_SCENE.rosary, 118: K_SCENE.rosary, // what the string is for; how the rosary is built
  6: K_SCENE.ashes, 148: K_SCENE.ashes, // ashes, and forty days; Ash Wednesday
  97: K_SCENE.mass, 128: K_SCENE.mass, // first Mass, or first in years; the Eucharist
  686: K_SCENE.ofrenda, 1400: K_SCENE.ofrenda, // All Souls; the Day of the Dead
  1397: K_SCENE.posadas, 1401: K_SCENE.posadas, // Advent customs; processions
};
// Jewish scenes (owner, 2026-10-11): two lessons each, three in the first week
const J_SCENE = {
  shabbat: require("../../assets/cast/judaism/scene-shabbat.webp"),
  seder: require("../../assets/cast/judaism/scene-seder.webp"),
  sukkah: require("../../assets/cast/judaism/scene-sukkah.webp"),
  hanukkah: require("../../assets/cast/judaism/scene-hanukkah.webp"),
  study: require("../../assets/cast/judaism/scene-study.webp"),
  shofar: require("../../assets/cast/judaism/scene-shofar.webp"),
};
const JEWISH_SCENES: Record<number, number> = {
  2: J_SCENE.shabbat, 614: J_SCENE.shabbat, // two flames before sunset; welcoming Shabbat
  4: J_SCENE.seder, 135: J_SCENE.seder, // the plate that tells a story; a seat at the seder
  7: J_SCENE.study, 150: J_SCENE.study, // an argument for the sake of heaven; study as worship
  123: J_SCENE.shofar, 646: J_SCENE.shofar, // Rosh Hashanah: the shofar; the three sounds
  127: J_SCENE.sukkah, 661: J_SCENE.sukkah, // Sukkot: the booth; the season of our joy
  130: J_SCENE.hanukkah, 667: J_SCENE.hanukkah, // Hanukkah: the lights; show the light
};
// Muslim scenes (owner, 2026-10-11): two lessons each. The mosque scene waits until the shoe logos are removed.
const M_SCENE = {
  iftar: require("../../assets/cast/islam/scene-iftar.webp"),
  eid: require("../../assets/cast/islam/scene-eid.webp"),
  stories: require("../../assets/cast/islam/scene-stories.webp"),
  charity: require("../../assets/cast/islam/scene-charity.webp"),
};
const MUSLIM_SCENES: Record<number, number> = {
  6: M_SCENE.iftar, 122: M_SCENE.iftar, // one day of Ramadan; breaking with a date
  7: M_SCENE.eid, 127: M_SCENE.eid, // two Eids, not one; Eid al-Fitr
  439: M_SCENE.stories, 468: M_SCENE.stories, // the best of stories; Musa meets al-Khidr
  126: M_SCENE.charity, 150: M_SCENE.charity, // the charity at the fast's end; charity from the right hand
};
const SCENES: Record<string, Record<number, number>> = { HINDUISM: HINDU_SCENES, CHRISTIANITY: CHRISTIAN_SCENES, CATHOLIC: CATHOLIC_SCENES, JUDAISM: JEWISH_SCENES, ISLAM: MUSLIM_SCENES };

/** The scene drawn for this lesson, if any. */
export const sceneFor = (door: string, day: number): number | null => SCENES[door]?.[day] ?? null;

/** The whole family, for the Hindu path's welcome. */
export const HINDU_FAMILY: number = require("../../assets/cast/hindu/family.webp");
/** Each path's family, for its welcome (paths without one show the mascot). */
export const FAMILY: Record<string, number> = { HINDUISM: HINDU_FAMILY, CHRISTIANITY: require("../../assets/cast/christianity/family.webp"),
  CATHOLIC: require("../../assets/cast/catholic/family.webp"),
  JUDAISM: require("../../assets/cast/judaism/family.webp"),
  ISLAM: require("../../assets/cast/islam/family.webp") };
