// DRAFT — NOT KEEPER-REVIEWED. The companion's practices library, written 2026-09-29 as a first pass. Every
// door-specific practice must be checked by that tradition's Keeper before public release (docs/CONTENT_RELEASE.md).
// Wording rules: plain, lowercase like the app, American spelling; describe a practice as its own tradition keeps
// it, never "the same as" another; nobody is told what to believe. Practices are never scored and never earn light.
// Prayers are offered as something to do only to people who practice that faith or chose "try them" (lib/onboard
// doable); everyone else sees them as "how it's done" (the `about` line, never the steps).

export const PRACTICES_STATUS = "draft-unreviewed" as const;

export type PracticeKind = "breath" | "sit" | "walk" | "move" | "write" | "serve" | "give" | "prayer" | "rest";
export type Mood = "calm" | "grief" | "anxious" | "tired" | "grateful" | "curious" | "joyful";
export type Energy = "low" | "med" | "high";

export type Practice = {
  id: string;
  title: string;
  /** About how long it takes, 1–10. */
  minutes: number;
  kind: PracticeKind;
  /** null: fits every door. Otherwise the door (tradition) it belongs to. */
  door: string | null;
  moods: Mood[];
  energy: Energy;
  steps: string[];
  why: string;
  /** When it belongs: morning, evening/bedtime, or Friday (before Shabbat). Unset: any time. */
  when?: "morning" | "night" | "friday";
  /** Names God or a holy name. Kept away from people who told us "no god" (every-door ones never do). */
  theistic?: boolean;
  /** About a loss (says a name, remembers the dead). Only offered to someone who told us about a loss, or said today is heavy. */
  loss?: boolean;
  /** "How it's done", in the third person: what people who keep it do. Shown instead of the steps to anyone who is
   *  here to learn, not to practice (and for a taste from next door). Never a new prayer text. */
  about?: string;
};

/** When people keep it, in words, for the "how it's done" explainer. */
const WHEN_WORDS: Record<string, string> = { hamotzi: "before a meal", grace: "before a meal", "salat-steps": "five times a day, at set times", "inna-lillahi": "at news of a death, or any loss", "eternal-rest": "when someone has died, and on the days they're remembered" };
export const whenWords = (p: Practice) =>
  WHEN_WORDS[p.id] ? WHEN_WORDS[p.id] : p.when === "morning" ? "in the morning, on waking" : p.when === "night" ? "in the evening, or at bedtime" : p.when === "friday" ? "on Friday, before sundown" : "any time of day";

export const PRACTICES: Practice[] = [
  // ─── every door ───────────────────────────────────────────────────────
  { id: "breath", title: "one breath, all the way down", minutes: 1, kind: "breath", door: null, moods: ["anxious", "tired", "calm", "grief"], energy: "low",
    steps: ["sit or stand. let your shoulders drop.", "breathe in through your nose for four.", "breathe out slowly for six, like fogging a window.", "do it three times. that's it."],
    why: "a longer breath out tells your body it can stand down." },
  { id: "long-exhale", title: "the long breath out", minutes: 2, kind: "breath", door: null, moods: ["anxious", "tired"], energy: "low",
    steps: ["breathe in for four.", "hold for a moment, gently.", "breathe out for eight.", "ten rounds. count them on your fingers."],
    why: "when your mind is racing, the out-breath is the part you can steer." },
  { id: "sit", title: "the sit", minutes: 3, kind: "sit", door: null, moods: ["calm", "anxious", "curious"], energy: "low",
    steps: ["sit somewhere you won't be interrupted. phone face down.", "close your eyes or rest them on the floor.", "notice the breath without changing it.", "when your mind wanders — it will — come back. that coming back is the practice."],
    why: "three quiet minutes that ask nothing of you." },
  { id: "five-things", title: "five things you can see", minutes: 2, kind: "sit", door: null, moods: ["anxious", "grief"], energy: "low",
    steps: ["name five things you can see.", "four you can hear.", "three you can touch.", "two you can smell, one you can taste. then one slow breath."],
    why: "your senses only work in the present, so they bring you back to it." },
  { id: "walk", title: "a slow walk, no phone", minutes: 10, kind: "walk", door: null, moods: ["calm", "tired", "curious", "grief"], energy: "med",
    steps: ["leave your phone behind, or put it on do not disturb.", "walk a little slower than usual.", "notice five things you'd normally pass.", "on the way back, notice how you feel."],
    why: "walking lets the mind settle without having to sit still." },
  { id: "gratitude", title: "three good things", minutes: 2, kind: "write", door: null, moods: ["grateful", "joyful", "calm", "tired"], energy: "low",
    steps: ["write down three things that went well today, however small.", "for one of them, write why it happened.", "read them back once."],
    why: "noticing what's already good is a habit, and habits can be built." },
  { id: "kind-act", title: "a quiet kind act", minutes: 5, kind: "serve", door: null, moods: ["joyful", "grateful", "curious", "calm"], energy: "med",
    steps: ["pick one person: someone near you, or someone you haven't thought of in a while.", "do one small thing for them: a message, a coffee, a task off their list.", "don't mention it. let it be quiet."],
    why: "doing good without being seen is a thread through almost every tradition on the hill." },
  { id: "give", title: "give something away", minutes: 3, kind: "give", door: null, moods: ["grateful", "joyful"], energy: "low",
    steps: ["find one thing you don't need, or set aside a small amount of money.", "decide who it's for: a person, a shelter, a cause.", "give it this week, without making a thing of it."],
    why: "holding things loosely is easier to practice than to think about." },
  { id: "evening-review", title: "the evening review", minutes: 4, kind: "write", door: null, moods: ["calm", "curious", "tired"], energy: "low", when: "night",
    steps: ["what went well today?", "what would you do differently?", "what are you grateful for?", "close the notebook. the day is done."],
    why: "a few honest lines at night, so tomorrow starts clean." },
  { id: "digital-sabbath", title: "a phone-free hour", minutes: 3, kind: "rest", door: null, moods: ["anxious", "tired", "calm"], energy: "low",
    steps: ["pick the hour: now, or after dinner.", "put your phone in another room, on silent.", "do one slow thing: cook, read, sit outside, talk.", "when the hour's up, notice whether you missed it."],
    why: "an hour set apart, the way many traditions set a day apart." },
  { id: "body-scan", title: "a body scan", minutes: 6, kind: "rest", door: null, moods: ["tired", "anxious", "grief"], energy: "low",
    steps: ["lie down or sit back. close your eyes.", "start at your feet. notice them without moving them.", "move slowly up: legs, belly, chest, hands, shoulders, face.", "wherever it's tight, breathe out toward it.", "end with one breath for the whole body."],
    why: "your body keeps the day's stress. this is a way to set some of it down." },
  { id: "letter", title: "a letter to someone you lost", minutes: 8, kind: "write", door: null, moods: ["grief"], energy: "low", loss: true,
    steps: ["write their name at the top.", "tell them one thing that happened this week.", "tell them one thing you miss.", "say anything you didn't get to say. you never have to send it."],
    why: "grief often needs somewhere to go. a letter is a place." },
  { id: "used-to-think", title: "what I used to think", minutes: 5, kind: "write", door: null, moods: ["curious", "calm"], energy: "low",
    steps: ["write one thing you used to believe, about faith, or anything.", "write what you think about it now.", "write what changed your mind, if you know.", "no need to settle it. just notice."],
    why: "looking back honestly is how a returner finds their own footing." },
  { id: "stretch", title: "a gentle stretch", minutes: 4, kind: "move", door: null, moods: ["tired", "calm", "joyful"], energy: "med", when: "morning",
    steps: ["stand. reach both arms up and breathe in.", "fold forward slowly, knees soft, and breathe out.", "roll up one vertebra at a time.", "roll your shoulders back three times. then your neck, slowly."],
    why: "a few slow movements wake the body without rushing it." },
  { id: "meal-pause", title: "a pause before eating", minutes: 1, kind: "rest", door: null, moods: ["grateful", "calm", "joyful"], energy: "low",
    steps: ["before the first bite, stop.", "each person says one thing they're glad about today.", "eat the first bite slowly."],
    why: "a small pause at the table, easy to do with kids nearby." },
  { id: "candle-night", title: "a light in the dark", minutes: 3, kind: "rest", door: null, moods: ["grief", "tired", "calm"], energy: "low", when: "night", loss: true,
    steps: ["turn the lights down. light a candle, or a small lamp.", "sit and watch it for a minute.", "if there's someone you're missing, say their name.", "blow it out, or turn it off, when you're ready."],
    why: "a small light at night, for when the day was heavy." },

  // ─── Catholic ─────────────────────────────────────────────────────────
  { id: "sign-of-cross", title: "the sign of the cross", minutes: 1, kind: "prayer", door: "CATHOLIC", moods: ["calm", "anxious", "grateful"], energy: "low", theistic: true,
    steps: ["with your right hand, touch your forehead: “in the name of the Father,”", "your chest: “and of the Son,”", "your left shoulder, then your right: “and of the Holy Spirit.”", "“amen.” then one quiet breath."],
    why: "the oldest, shortest Catholic prayer: head, heart, shoulders — all of you.",
    about: "Catholics touch the forehead, the chest, then each shoulder with the right hand, naming the Father, the Son and the Holy Spirit. it opens and closes most prayers, and many make it on entering a church or before a meal." },
  { id: "rosary-decade", title: "one decade of the rosary", minutes: 7, kind: "prayer", door: "CATHOLIC", moods: ["calm", "grief", "anxious"], energy: "low", theistic: true,
    steps: ["hold the beads, or count on your fingers.", "pray one Our Father.", "pray ten Hail Marys, one for each bead, slowly.", "end with one Glory Be.", "if you like, hold one mystery in mind — the Annunciation is a good first."],
    why: "a decade is one-fifth of the rosary: repetition that quiets the mind.",
    about: "a decade is one Our Father, ten Hail Marys counted on the beads, and one Glory Be, often while holding a scene from the life of Jesus or Mary (a mystery) in mind. five decades make a full rosary." },
  { id: "examen", title: "the examen", minutes: 5, kind: "prayer", door: "CATHOLIC", moods: ["calm", "curious", "grateful"], energy: "low", when: "night", theistic: true,
    steps: ["ask for light to see the day honestly.", "look back over the day with gratitude.", "notice where you felt close to God, and where far.", "ask forgiveness for what went wrong.", "look toward tomorrow with hope."],
    why: "St. Ignatius asked his Jesuits to keep this even when they dropped everything else.",
    about: "at the end of the day, people look back over it slowly: giving thanks, noticing where they felt close to God and where far, asking forgiveness for what went wrong, and looking toward tomorrow." },
  { id: "eternal-rest", title: "a prayer for the dead", minutes: 1, kind: "prayer", door: "CATHOLIC", moods: ["grief"], energy: "low", theistic: true, loss: true,
    steps: ["think of the person you've lost.", "pray: “eternal rest grant unto them, O Lord, and let perpetual light shine upon them.”", "“may they rest in peace. amen.”"],
    why: "a short prayer Catholics have said for the dead for centuries.",
    about: "Catholics say a short prayer for someone who has died, asking rest and light for them, often at a grave, on an anniversary, or whenever the person comes to mind." },

  // ─── Christianity ─────────────────────────────────────────────────────
  { id: "psalm-slowly", title: "a psalm, read slowly", minutes: 5, kind: "prayer", door: "CHRISTIANITY", moods: ["grief", "anxious", "calm"], energy: "low", theistic: true,
    steps: ["open to Psalm 23 (“the Lord is my shepherd”).", "read it once, straight through.", "read it again, slower. stop at the line that catches you.", "stay with that line for a minute."],
    why: "the psalms have been read in hard nights for three thousand years.",
    about: "people read a psalm, often Psalm 23, once straight through and then again more slowly, stopping at the line that catches them and staying with it." },
  { id: "lords-prayer", title: "the Lord's Prayer", minutes: 2, kind: "prayer", door: "CHRISTIANITY", moods: ["calm", "anxious", "grateful"], energy: "low", theistic: true,
    steps: ["find a quiet place.", "pray it slowly: “our Father, who art in heaven, hallowed be thy name…”", "pause after each line.", "end with one line of your own."],
    why: "the prayer Jesus taught his disciples (Matthew 6).",
    about: "Christians pray the words Jesus taught his disciples, together in church or alone, often slowly, sometimes pausing after each line." },
  { id: "grace", title: "grace before a meal", minutes: 1, kind: "prayer", door: "CHRISTIANITY", moods: ["grateful", "joyful"], energy: "low", theistic: true,
    steps: ["before eating, bow your head.", "thank God for the food and the hands that made it.", "“amen.” then eat."],
    why: "a short thanks at the table, easy to teach the kids.",
    about: "before a meal, people bow their heads and thank God for the food and the hands that made it, ending with “amen.”" },

  // ─── Islam ────────────────────────────────────────────────────────────
  { id: "salat-steps", title: "salat, step by step", minutes: 7, kind: "prayer", door: "ISLAM", moods: ["calm", "anxious", "grateful"], energy: "med", theistic: true,
    steps: ["make wudu: wash hands, mouth, nose, face, arms, wipe your head, wash your feet.", "face the qibla and set your intention in your heart.", "raise your hands, “allahu akbar”, and recite al-Fatiha.", "bow (ruku), stand, then prostrate (sujud) twice.", "at the end, sit, and turn your head right, then left: “as-salamu alaykum wa rahmatullah.”"],
    why: "the shape of one unit (rak'ah) of the prayer Muslims keep five times a day.",
    about: "Muslims wash first (wudu), face Mecca (the qibla), and move through standing, bowing and prostrating while reciting from the Qur'an, ending with a greeting of peace to the right and to the left. it's kept five times a day, at set times." },
  { id: "dhikr-fingers", title: "dhikr on your fingers", minutes: 3, kind: "prayer", door: "ISLAM", moods: ["calm", "anxious", "grateful"], energy: "low", theistic: true,
    steps: ["count on the joints of your right hand.", "“subhanallah” (glory be to God), 33 times.", "“alhamdulillah” (all praise is God's), 33 times.", "“allahu akbar” (God is greatest), 34 times."],
    why: "remembrance, counted on the fingers, as the Prophet is reported to have done.",
    about: "people count short phrases of praise on the joints of their fingers or on prayer beads, often 33 of each, very often right after the daily prayer." },
  { id: "inna-lillahi", title: "words for a loss", minutes: 1, kind: "prayer", door: "ISLAM", moods: ["grief"], energy: "low", theistic: true, loss: true,
    steps: ["think of who or what you've lost.", "say: “inna lillahi wa inna ilayhi raji'un.”", "“we belong to God, and to Him we return.” (Qur'an 2:156)", "sit with it for one breath."],
    why: "what Muslims say at news of a death, or any loss.",
    about: "at news of a death, or any loss, Muslims say a verse of the Qur'an (2:156): “we belong to God, and to Him we return.”" },

  // ─── Judaism ──────────────────────────────────────────────────────────
  { id: "shabbat-candles", title: "Shabbat candles", minutes: 3, kind: "prayer", door: "JUDAISM", moods: ["calm", "grateful", "joyful", "tired"], energy: "low", when: "friday", theistic: true,
    steps: ["before sundown on Friday, set out two candles.", "light them.", "draw your hands toward you three times, then cover your eyes.", "say: “baruch atah Adonai, Eloheinu melech ha'olam, asher kid'shanu b'mitzvotav v'tzivanu l'hadlik ner shel Shabbat.”", "uncover your eyes. the week has stopped."],
    why: "lighting the candles is how Shabbat begins.",
    about: "before sundown on Friday, two candles are lit. the person lighting them draws their hands in three times, covers their eyes, and says a blessing. in many homes, that's how Shabbat begins." },
  { id: "shema-bedtime", title: "the Shema at bedtime", minutes: 2, kind: "prayer", door: "JUDAISM", moods: ["calm", "anxious", "grief", "tired"], energy: "low", when: "night", theistic: true,
    steps: ["in bed, lights off.", "cover your eyes with your right hand.", "say: “Shema Yisrael, Adonai Eloheinu, Adonai echad.”", "then, quietly: “baruch shem k'vod malchuto l'olam va'ed.”"],
    why: "hear, Israel: the words said at night, and the first words many Jewish children learn.",
    about: "at bedtime, many Jews say the Shema, often covering their eyes with the right hand. it's one of the first things many Jewish children learn." },
  { id: "modeh-ani", title: "Modeh Ani on waking", minutes: 1, kind: "prayer", door: "JUDAISM", moods: ["grateful", "calm", "tired"], energy: "low", when: "morning", theistic: true,
    steps: ["before you get up, stay in bed a moment.", "say: “modeh ani l'fanecha, melech chai v'kayam…”", "“I thank You, living and lasting King, for returning my soul to me with compassion.”"],
    why: "the first words of the day: thanks, before anything else.",
    about: "on waking, before getting out of bed, many Jews say one short line of thanks for being given another day." },
  // any time of day, so someone walking this door always has one of its own (sources: Mishnah Berakhot 6:1; Psalm 121, JPS 1917)
  { id: "hamotzi", title: "the blessing over bread", minutes: 1, kind: "prayer", door: "JUDAISM", moods: ["grateful", "joyful", "calm"], energy: "low", theistic: true,
    steps: ["before you eat, take the bread (or whatever's on the table) in your hands.", "say: “baruch atah Adonai, Eloheinu melech ha'olam, hamotzi lechem min ha'aretz.”", "“blessed are You, Lord our God, king of the universe, who brings forth bread from the earth.”", "take the first bite. if you're eating with someone, pass them a piece."],
    why: "hamotzi, the blessing over bread (Mishnah Berakhot 6:1): a meal begins with thanks.",
    about: "before a meal with bread, someone holds the bread and says the blessing, hamotzi. then the bread is passed around and everyone takes a piece." },
  { id: "tehillim-121", title: "a psalm of ascent", minutes: 3, kind: "prayer", door: "JUDAISM", moods: ["anxious", "calm", "tired", "grief"], energy: "low", theistic: true,
    steps: ["open to Psalm 121, a song of ascents: “I will lift up mine eyes unto the mountains: from whence shall my help come?”", "read it once, straight through. it's eight verses.", "read it again, slower. stop at the line that catches you.", "if someone you know needs help, hold them in mind as you read."],
    why: "saying tehillim (psalms) is a Jewish practice for any hour, often for someone who needs it.",
    about: "people read a psalm, and Psalm 121 is a favorite, slowly, often holding in mind someone who needs help. saying tehillim (psalms) can be done at any hour." },

  // ─── Sikhism ──────────────────────────────────────────────────────────
  { id: "simran", title: "simran", minutes: 5, kind: "prayer", door: "SIKHISM", moods: ["calm", "anxious", "grief"], energy: "low", theistic: true,
    steps: ["sit comfortably. cover your head if you like.", "breathe in, and silently say “wahe”.", "breathe out: “guru”.", "keep going, unhurried, for a few minutes."],
    why: "remembering the Name, again and again, until it's remembering you.",
    about: "Sikhs sit quietly and repeat the Name, often “waheguru”, in time with the breath, for a few minutes or much longer." },
  { id: "japji-line", title: "a line of Japji", minutes: 4, kind: "prayer", door: "SIKHISM", moods: ["calm", "curious"], energy: "low", when: "morning", theistic: true,
    steps: ["open to the start of Japji Sahib: “Ik Onkar, Sat Naam…”", "read the Mool Mantar slowly, once aloud if you can.", "read one pauri (verse) and stop.", "carry one phrase with you through the day."],
    why: "Guru Nanak's Japji is the Sikh morning prayer, one verse at a time.",
    about: "Japji Sahib, Guru Nanak's hymn, is the Sikh morning prayer. many read it every morning, starting with the Mool Mantar." },
  { id: "kirtan-sohila", title: "Kirtan Sohila at night", minutes: 5, kind: "prayer", door: "SIKHISM", moods: ["calm", "grief", "tired"], energy: "low", when: "night", theistic: true,
    steps: ["lights low, ready for sleep.", "read or listen to Kirtan Sohila.", "let the last verse be the last thing you hear today."],
    why: "the bedtime prayer, also sung at a Sikh funeral.",
    about: "Kirtan Sohila is read or sung at bedtime, the last prayer of the day. it's also sung at a Sikh funeral." },

  // ─── Buddhism ─────────────────────────────────────────────────────────
  { id: "metta", title: "metta, loving-kindness", minutes: 6, kind: "sit", door: "BUDDHISM", moods: ["grief", "anxious", "calm", "grateful"], energy: "low",
    steps: ["sit and settle. start with yourself: “may I be safe. may I be happy. may I be healthy. may I live with ease.”", "now someone you love. say it for them.", "now someone you barely know.", "now someone difficult, if you can.", "last: all beings, everywhere."],
    why: "kindness wished on purpose, taught by the Buddha in the Metta Sutta.",
    about: "people sit and wish well on purpose, in steps: to themselves, to someone they love, to someone they barely know, to someone difficult, and then to all beings. the wishes are simple: to be safe, to be happy, to live with ease." },
  { id: "walking-meditation", title: "walking meditation", minutes: 8, kind: "walk", door: "BUDDHISM", moods: ["calm", "anxious", "tired"], energy: "med",
    steps: ["find ten or twenty steps of path, indoors or out.", "walk slowly: lifting, moving, placing each foot.", "at the end, pause, turn, and walk back.", "when the mind wanders, return to the feet."],
    why: "the same attention as sitting, carried into movement.",
    about: "people walk a short path very slowly, noticing each foot lift, move and land, then pause, turn, and walk back." },

  // ─── Hinduism ─────────────────────────────────────────────────────────
  { id: "mantra", title: "a mantra", minutes: 5, kind: "prayer", door: "HINDUISM", moods: ["calm", "anxious", "grief"], energy: "low", theistic: true,
    steps: ["sit comfortably. hold a mala, or count on your fingers.", "choose a mantra you know — “om”, or “om namah shivaya”.", "repeat it softly with each breath.", "108 times is a full mala. a few minutes is enough."],
    why: "japa: a sacred sound repeated until the mind rests in it.",
    about: "people repeat a sacred sound or name, like “om” or “om namah shivaya”, softly, often counted on a mala of 108 beads. it's called japa." },
  { id: "gentle-yoga", title: "gentle yoga, with its roots", minutes: 8, kind: "move", door: "HINDUISM", moods: ["tired", "calm", "anxious"], energy: "med",
    steps: ["yoga is one of the six classical schools of Hindu thought. postures (asana) are one of Patanjali's eight limbs.", "stand in tadasana (mountain pose). breathe.", "fold forward, then come down to balasana (child's pose) for five breaths.", "sit, and end with a few slow breaths (pranayama)."],
    why: "the postures came from a whole path. this names where they came from.",
    about: "yoga is one of the six classical schools of Hindu thought. the postures (asana) are one of Patanjali's eight limbs; the path also holds ethics, breath and meditation." },
  { id: "diya", title: "a lamp at dusk", minutes: 3, kind: "prayer", door: "HINDUISM", moods: ["grateful", "calm", "grief"], energy: "low", when: "night", theistic: true,
    steps: ["at dusk, light a diya (a small oil lamp) or a candle.", "set it before an image of your deity, or simply by a window.", "fold your hands. a moment of thanks.", "let it burn while you go about your evening, safely."],
    why: "lighting a lamp at evening is one of the simplest Hindu acts of devotion.",
    about: "at dusk, many Hindus light a small oil lamp (a diya) before an image of a deity, fold their hands, and give thanks." },

  // ─── my own path ──────────────────────────────────────────────────────
  { id: "seneca-questions", title: "Seneca's three questions", minutes: 4, kind: "write", door: "SPIRITUAL", moods: ["calm", "curious"], energy: "low", when: "night",
    steps: ["tonight, go back over the day.", "what bad habit did I cure today?", "what fault did I resist?", "in what way am I better? — then sleep."],
    why: "the Stoic Seneca did this every night (On Anger, book 3).",
    about: "every night, the Stoic Seneca went back over his day with three questions: what bad habit did I cure, what fault did I resist, in what way am I better?" },
  { id: "view-from-above", title: "the view from above", minutes: 4, kind: "sit", door: "SPIRITUAL", moods: ["anxious", "curious", "calm"], energy: "low",
    steps: ["close your eyes. picture yourself where you are right now.", "rise above: the building, the city, the country.", "keep rising until the earth is small and blue.", "notice how big today's worry looks from here. then come back down."],
    why: "an old Stoic exercise Marcus Aurelius returned to in his Meditations.",
    about: "Stoics like Marcus Aurelius pictured themselves rising above their city and the whole earth until their worries looked small, then came back down." },
];

export const practiceById = (id: string | null | undefined) => PRACTICES.find((p) => p.id === id) || null;
