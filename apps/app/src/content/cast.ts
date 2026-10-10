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

/** The cast member playing a chat's asker on this door, or null (the lesson's own wording stays). */
export function castFor(door: string, who: string | undefined): Who | null {
  if (door !== "HINDUISM" || !who) return null;
  const w = who.toLowerCase().trim();
  const hit = PLAYS.find(([re]) => re.test(w));
  return hit ? HINDU[hit[1]] : null;
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
  675: SCENE.shivaratri, 705: SCENE.serial, 711: SCENE.serial, 765: SCENE.dice, 768: SCENE.dice,
};

/** The scene drawn for this lesson, if any. */
export const sceneFor = (door: string, day: number): number | null => (door === "HINDUISM" ? HINDU_SCENES[day] ?? null : null);

/** The whole family, for the Hindu path's welcome. */
export const HINDU_FAMILY: number = require("../../assets/cast/hindu/family.webp");
