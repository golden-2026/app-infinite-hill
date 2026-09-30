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

// Spanish (the app's second language) is picked from globalThis.__ihLang, so this file stays import-free for the tests.
const es = () => (globalThis as { __ihLang?: string }).__ihLang === "es";

/** When people keep it, in words, for the "how it's done" explainer. */
const WHEN_WORDS: Record<string, string> = { hamotzi: "before a meal", grace: "before a meal", "salat-steps": "five times a day, at set times", "inna-lillahi": "at news of a death, or any loss", "eternal-rest": "when someone has died, and on the days they're remembered" };
const WHEN_WORDS_ES: Record<string, string> = { hamotzi: "antes de una comida", grace: "antes de una comida", "salat-steps": "cinco veces al día, a horas fijas", "inna-lillahi": "al saber de una muerte, o de cualquier pérdida", "eternal-rest": "cuando alguien muere, y en los días en que se le recuerda" };
export const whenWords = (p: Practice) =>
  es()
    ? WHEN_WORDS_ES[p.id] ? WHEN_WORDS_ES[p.id] : p.when === "morning" ? "por la mañana, al despertar" : p.when === "night" ? "al anochecer, o antes de dormir" : p.when === "friday" ? "el viernes, antes de la puesta del sol" : "a cualquier hora del día"
    : WHEN_WORDS[p.id] ? WHEN_WORDS[p.id] : p.when === "morning" ? "in the morning, on waking" : p.when === "night" ? "in the evening, or at bedtime" : p.when === "friday" ? "on Friday, before sundown" : "any time of day";

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

// ─── en español ───────────────────────────────────────────────────────────
// DRAFT — NOT KEEPER-REVIEWED, like the English above. Transliterations stay as they are; prayer glosses use the
// standard Spanish forms (the Padre Nuestro, the Reina-Valera 1909 psalms, the usual Catholic Spanish). The title,
// steps, why and about of each practice read in Spanish when the app is in Spanish; ids, kinds and timing never change.
type EsText = { title: string; steps: string[]; why: string; about?: string };
const PRACTICES_ES: Record<string, EsText> = {
  breath: { title: "una respiración, hasta el fondo",
    steps: ["siéntate o quédate de pie. deja caer los hombros.", "inhala por la nariz contando hasta cuatro.", "exhala despacio contando hasta seis, como si empañaras una ventana.", "hazlo tres veces. eso es todo."],
    why: "una exhalación más larga le dice a tu cuerpo que puede bajar la guardia." },
  "long-exhale": { title: "la exhalación larga",
    steps: ["inhala contando hasta cuatro.", "sostén un momento, con suavidad.", "exhala contando hasta ocho.", "diez rondas. cuéntalas con los dedos."],
    why: "cuando tu mente va a mil, la exhalación es la parte que puedes guiar." },
  sit: { title: "sentarte en quietud",
    steps: ["siéntate donde nadie te interrumpa. el teléfono boca abajo.", "cierra los ojos o déjalos descansar en el piso.", "nota la respiración sin cambiarla.", "cuando tu mente se distraiga (y lo hará), regresa. ese regresar es la práctica."],
    why: "tres minutos de quietud que no te piden nada." },
  "five-things": { title: "cinco cosas que puedes ver",
    steps: ["nombra cinco cosas que puedes ver.", "cuatro que puedes oír.", "tres que puedes tocar.", "dos que puedes oler, una que puedes saborear. luego, una respiración lenta."],
    why: "tus sentidos solo funcionan en el presente, así que te traen de vuelta a él." },
  walk: { title: "una caminata lenta, sin teléfono",
    steps: ["deja el teléfono, o ponlo en no molestar.", "camina un poco más despacio de lo normal.", "nota cinco cosas junto a las que normalmente pasarías de largo.", "de regreso, nota cómo te sientes."],
    why: "caminar deja que la mente se asiente sin que tengas que estar inmóvil." },
  gratitude: { title: "tres cosas buenas",
    steps: ["escribe tres cosas que salieron bien hoy, por pequeñas que sean.", "de una de ellas, escribe por qué pasó.", "léelas una vez."],
    why: "notar lo que ya está bien es un hábito, y los hábitos se construyen." },
  "kind-act": { title: "un gesto amable, en silencio",
    steps: ["elige a una persona: alguien cerca de ti, o alguien en quien no has pensado en un tiempo.", "haz algo pequeño por ella: un mensaje, un café, una tarea menos en su lista.", "no lo menciones. que quede en silencio."],
    why: "hacer el bien sin que te vean es un hilo que atraviesa casi todas las tradiciones de la colina." },
  give: { title: "regala algo",
    steps: ["busca algo que no necesites, o aparta una pequeña cantidad de dinero.", "decide para quién es: una persona, un albergue, una causa.", "dalo esta semana, sin hacer mucho alboroto."],
    why: "soltar las cosas es más fácil de practicar que de pensar." },
  "evening-review": { title: "el repaso de la noche",
    steps: ["¿qué salió bien hoy?", "¿qué harías distinto?", "¿qué agradeces?", "cierra el cuaderno. el día terminó."],
    why: "unas líneas honestas en la noche, para que mañana empiece limpio." },
  "digital-sabbath": { title: "una hora sin teléfono",
    steps: ["elige la hora: ahora, o después de cenar.", "deja el teléfono en otro cuarto, en silencio.", "haz una cosa lenta: cocinar, leer, sentarte afuera, platicar.", "cuando pase la hora, nota si lo extrañaste."],
    why: "una hora apartada, como muchas tradiciones apartan un día." },
  "body-scan": { title: "un recorrido por el cuerpo",
    steps: ["acuéstate o recárgate. cierra los ojos.", "empieza por los pies. nótalos sin moverlos.", "sube despacio: piernas, vientre, pecho, manos, hombros, cara.", "donde sientas tensión, exhala hacia ahí.", "termina con una respiración para todo el cuerpo."],
    why: "tu cuerpo guarda el estrés del día. esta es una forma de soltar un poco." },
  letter: { title: "una carta a alguien que perdiste",
    steps: ["escribe su nombre arriba.", "cuéntale algo que pasó esta semana.", "cuéntale algo que extrañas.", "di lo que no alcanzaste a decir. nunca tienes que enviarla."],
    why: "el duelo muchas veces necesita un lugar adonde ir. una carta es un lugar." },
  "used-to-think": { title: "lo que antes pensaba",
    steps: ["escribe algo que antes creías, sobre la fe o sobre cualquier cosa.", "escribe lo que piensas de eso ahora.", "escribe qué te hizo cambiar de opinión, si lo sabes.", "no hace falta resolverlo. solo nótalo."],
    why: "mirar atrás con honestidad es la manera en que quien regresa encuentra dónde pararse." },
  stretch: { title: "un estiramiento suave",
    steps: ["ponte de pie. sube los dos brazos e inhala.", "dóblate hacia adelante despacio, con las rodillas sueltas, y exhala.", "sube vértebra por vértebra.", "gira los hombros hacia atrás tres veces. luego el cuello, despacio."],
    why: "unos movimientos lentos despiertan el cuerpo sin apurarlo." },
  "meal-pause": { title: "una pausa antes de comer",
    steps: ["antes del primer bocado, detente.", "cada quien dice algo que le alegra de hoy.", "come el primer bocado despacio."],
    why: "una pequeña pausa en la mesa, fácil de hacer con los niños cerca." },
  "candle-night": { title: "una luz en la oscuridad",
    steps: ["baja las luces. prende una vela, o una lámpara pequeña.", "siéntate y mírala un minuto.", "si extrañas a alguien, di su nombre.", "apágala cuando quieras."],
    why: "una pequeña luz en la noche, para cuando el día pesó." },

  "sign-of-cross": { title: "la señal de la cruz",
    steps: ["con la mano derecha, toca tu frente: «en el nombre del Padre,»", "tu pecho: «y del Hijo,»", "tu hombro izquierdo, luego el derecho: «y del Espíritu Santo.»", "«amén». luego, una respiración tranquila."],
    why: "la oración católica más antigua y más corta: cabeza, corazón, hombros; todo tu ser.",
    about: "los católicos se tocan la frente, el pecho y luego cada hombro con la mano derecha, nombrando al Padre, al Hijo y al Espíritu Santo. con ella abren y cierran casi todas sus oraciones, y muchos la hacen al entrar a una iglesia o antes de comer." },
  "rosary-decade": { title: "una decena del rosario",
    steps: ["toma las cuentas, o cuenta con los dedos.", "reza un Padre Nuestro.", "reza diez Avemarías, una por cada cuenta, despacio.", "termina con un Gloria.", "si quieres, ten presente un misterio; la Anunciación es un buen primero."],
    why: "una decena es la quinta parte del rosario: una repetición que aquieta la mente.",
    about: "una decena es un Padre Nuestro, diez Avemarías contadas en las cuentas y un Gloria, muchas veces con una escena de la vida de Jesús o de María (un misterio) en mente. cinco decenas forman un rosario completo." },
  examen: { title: "el examen ignaciano",
    steps: ["pide luz para ver el día con honestidad.", "repasa el día con gratitud.", "nota dónde te sentiste cerca de Dios, y dónde lejos.", "pide perdón por lo que salió mal.", "mira hacia mañana con esperanza."],
    why: "san Ignacio pidió a sus jesuitas que lo mantuvieran aun cuando dejaran todo lo demás.",
    about: "al final del día, se repasa despacio: se da gracias, se nota dónde uno se sintió cerca de Dios y dónde lejos, se pide perdón por lo que salió mal y se mira hacia mañana." },
  "eternal-rest": { title: "una oración por los difuntos",
    steps: ["piensa en la persona que perdiste.", "reza: «dale, Señor, el descanso eterno, y brille para él la luz perpetua.»", "«descanse en paz. amén.»"],
    why: "una oración corta que los católicos rezan por los difuntos desde hace siglos.",
    about: "los católicos rezan una oración corta por alguien que murió, pidiendo descanso y luz para esa persona, muchas veces ante una tumba, en un aniversario o cuando la persona viene a la mente." },

  "psalm-slowly": { title: "un salmo, leído despacio",
    steps: ["abre en el Salmo 23 («el Señor es mi pastor»).", "léelo una vez, de corrido.", "léelo otra vez, más despacio. detente en la línea que te llame.", "quédate con esa línea un minuto."],
    why: "los salmos se han leído en noches difíciles durante tres mil años.",
    about: "se lee un salmo, muchas veces el Salmo 23, una vez de corrido y luego otra más despacio, deteniéndose en la línea que llama y quedándose con ella." },
  "lords-prayer": { title: "el Padre Nuestro",
    steps: ["busca un lugar tranquilo.", "rézalo despacio: «Padre nuestro, que estás en el cielo, santificado sea tu nombre…»", "haz una pausa después de cada línea.", "termina con una línea tuya."],
    why: "la oración que Jesús enseñó a sus discípulos (Mateo 6).",
    about: "los cristianos rezan las palabras que Jesús enseñó a sus discípulos, juntos en la iglesia o a solas, muchas veces despacio, a veces con una pausa después de cada línea." },
  grace: { title: "bendecir la mesa",
    steps: ["antes de comer, inclina la cabeza.", "dale gracias a Dios por la comida y por las manos que la prepararon.", "«amén». luego, a comer."],
    why: "un gracias breve en la mesa, fácil de enseñar a los niños.",
    about: "antes de comer, se inclina la cabeza y se le da gracias a Dios por la comida y por las manos que la prepararon, terminando con «amén»." },

  "salat-steps": { title: "salat, paso a paso",
    steps: ["haz el wudu: lava las manos, la boca, la nariz, la cara, los brazos, pasa las manos por la cabeza, lava los pies.", "mira hacia la qibla y pon tu intención en el corazón.", "levanta las manos, «allahu akbar», y recita al-Fatiha.", "inclínate (ruku), ponte de pie y luego prostérnate (sujud) dos veces.", "al final, siéntate y gira la cabeza a la derecha y luego a la izquierda: «as-salamu alaykum wa rahmatullah.»"],
    why: "la forma de una unidad (rak'ah) de la oración que los musulmanes cumplen cinco veces al día.",
    about: "los musulmanes primero se lavan (wudu), miran hacia La Meca (la qibla) y pasan por estar de pie, inclinarse y prosternarse mientras recitan del Corán, y terminan con un saludo de paz a la derecha y a la izquierda. se cumple cinco veces al día, a horas fijas." },
  "dhikr-fingers": { title: "dhikr con los dedos",
    steps: ["cuenta en las falanges de la mano derecha.", "«subhanallah» (gloria a Dios), 33 veces.", "«alhamdulillah» (toda alabanza es de Dios), 33 veces.", "«allahu akbar» (Dios es el más grande), 34 veces."],
    why: "el recuerdo de Dios, contado con los dedos, como se cuenta que lo hacía el Profeta.",
    about: "se cuentan frases cortas de alabanza en las falanges de los dedos o en un rosario de cuentas, muchas veces 33 de cada una, casi siempre justo después de la oración diaria." },
  "inna-lillahi": { title: "palabras ante una pérdida",
    steps: ["piensa en quién o qué perdiste.", "di: «inna lillahi wa inna ilayhi raji'un.»", "«de Dios somos, y a Él volvemos.» (Corán 2:156)", "quédate con eso durante una respiración."],
    why: "lo que dicen los musulmanes al saber de una muerte, o de cualquier pérdida.",
    about: "al saber de una muerte, o de cualquier pérdida, los musulmanes dicen un versículo del Corán (2:156): «de Dios somos, y a Él volvemos.»" },

  "shabbat-candles": { title: "las velas de Shabbat",
    steps: ["antes de la puesta del sol del viernes, pon dos velas.", "enciéndelas.", "atrae las manos hacia ti tres veces y luego cúbrete los ojos.", "di: «baruch atah Adonai, Eloheinu melech ha'olam, asher kid'shanu b'mitzvotav v'tzivanu l'hadlik ner shel Shabbat.»", "descubre tus ojos. la semana se detuvo."],
    why: "encender las velas es como empieza el Shabbat.",
    about: "antes de la puesta del sol del viernes, se encienden dos velas. quien las enciende atrae las manos hacia sí tres veces, se cubre los ojos y dice una bendición. en muchas casas, así empieza el Shabbat." },
  "shema-bedtime": { title: "el Shemá antes de dormir",
    steps: ["en la cama, con la luz apagada.", "cúbrete los ojos con la mano derecha.", "di: «Shema Yisrael, Adonai Eloheinu, Adonai echad.»", "luego, en voz baja: «baruch shem k'vod malchuto l'olam va'ed.»"],
    why: "escucha, Israel: las palabras que se dicen en la noche, y de las primeras que aprenden muchos niños judíos.",
    about: "antes de dormir, muchos judíos dicen el Shemá, a menudo cubriéndose los ojos con la mano derecha. es de lo primero que aprenden muchos niños judíos." },
  "modeh-ani": { title: "Modeh Ani al despertar",
    steps: ["antes de levantarte, quédate un momento en la cama.", "di: «modeh ani l'fanecha, melech chai v'kayam…»", "«te agradezco, Rey vivo y eterno, porque me devolviste el alma con compasión.»"],
    why: "las primeras palabras del día: gracias, antes que nada.",
    about: "al despertar, antes de salir de la cama, muchos judíos dicen una línea corta de gratitud por recibir un día más." },
  hamotzi: { title: "la bendición del pan",
    steps: ["antes de comer, toma el pan (o lo que haya en la mesa) en tus manos.", "di: «baruch atah Adonai, Eloheinu melech ha'olam, hamotzi lechem min ha'aretz.»", "«bendito eres Tú, Señor nuestro Dios, Rey del universo, que sacas el pan de la tierra.»", "da el primer bocado. si comes con alguien, pásale un pedazo."],
    why: "hamotzi, la bendición del pan (Mishná, Berajot 6:1): una comida empieza dando gracias.",
    about: "antes de una comida con pan, alguien toma el pan y dice la bendición, hamotzi. luego el pan pasa de mano en mano y cada quien toma un pedazo." },
  "tehillim-121": { title: "un salmo de subida",
    steps: ["abre en el Salmo 121, un cántico gradual: «alzaré mis ojos a los montes, de donde vendrá mi socorro.»", "léelo una vez, de corrido. son ocho versículos.", "léelo otra vez, más despacio. detente en la línea que te llame.", "si alguien que conoces necesita ayuda, tenlo presente mientras lees."],
    why: "decir tehillim (salmos) es una práctica judía para cualquier hora, muchas veces por alguien que lo necesita.",
    about: "se lee un salmo despacio, y el Salmo 121 es de los favoritos, muchas veces teniendo presente a alguien que necesita ayuda. decir tehillim (salmos) se puede a cualquier hora." },

  simran: { title: "simran",
    steps: ["siéntate cómodamente. cúbrete la cabeza si quieres.", "inhala y di en silencio «wahe».", "exhala: «guru».", "sigue, sin prisa, unos minutos."],
    why: "recordar el Nombre, una y otra vez, hasta que el Nombre te recuerda a ti.",
    about: "los sijs se sientan en silencio y repiten el Nombre, muchas veces «waheguru», al ritmo de la respiración, unos minutos o mucho más." },
  "japji-line": { title: "una línea del Japji",
    steps: ["abre al principio del Japji Sahib: «Ik Onkar, Sat Naam…»", "lee el Mool Mantar despacio, una vez en voz alta si puedes.", "lee un pauri (verso) y detente.", "lleva contigo una frase durante el día."],
    why: "el Japji de Gurú Nanak es la oración sij de la mañana, un verso a la vez.",
    about: "el Japji Sahib, el himno de Gurú Nanak, es la oración sij de la mañana. muchos lo leen cada mañana, empezando por el Mool Mantar." },
  "kirtan-sohila": { title: "Kirtan Sohila en la noche",
    steps: ["luces bajas, ya para dormir.", "lee o escucha el Kirtan Sohila.", "deja que el último verso sea lo último que oigas hoy."],
    why: "la oración de antes de dormir, que también se canta en un funeral sij.",
    about: "el Kirtan Sohila se lee o se canta antes de dormir, como la última oración del día. también se canta en un funeral sij." },

  metta: { title: "metta, bondad amorosa",
    steps: ["siéntate y acomódate. empieza por ti: «que yo esté a salvo. que sea feliz. que tenga salud. que viva con tranquilidad.»", "ahora alguien a quien quieres. dilo por esa persona.", "ahora alguien a quien apenas conoces.", "ahora alguien difícil, si puedes.", "al final: todos los seres, en todas partes."],
    why: "bondad deseada a propósito, como la enseñó el Buda en el Metta Sutta.",
    about: "se sientan y desean el bien a propósito, por pasos: a sí mismos, a alguien que quieren, a alguien que apenas conocen, a alguien difícil y luego a todos los seres. los deseos son sencillos: estar a salvo, ser feliz, vivir con tranquilidad." },
  "walking-meditation": { title: "meditación caminando",
    steps: ["busca un trayecto de diez o veinte pasos, adentro o afuera.", "camina despacio: levantando, moviendo y apoyando cada pie.", "al final, haz una pausa, da la vuelta y regresa.", "cuando la mente se distraiga, regresa a los pies."],
    why: "la misma atención que al sentarse, llevada al movimiento.",
    about: "se camina un trayecto corto muy despacio, notando cómo cada pie se levanta, se mueve y se apoya; luego una pausa, la vuelta y el regreso." },

  mantra: { title: "un mantra",
    steps: ["siéntate cómodamente. toma un mala, o cuenta con los dedos.", "elige un mantra que conozcas: «om», u «om namah shivaya».", "repítelo en voz baja con cada respiración.", "108 veces es un mala completo. unos minutos bastan."],
    why: "japa: un sonido sagrado repetido hasta que la mente descansa en él.",
    about: "se repite un sonido o nombre sagrado, como «om» u «om namah shivaya», en voz baja, muchas veces contado en un mala de 108 cuentas. se llama japa." },
  "gentle-yoga": { title: "yoga suave, con sus raíces",
    steps: ["el yoga es una de las seis escuelas clásicas del pensamiento hindú. las posturas (asana) son una de las ocho ramas de Patanjali.", "ponte de pie en tadasana (postura de la montaña). respira.", "dóblate hacia adelante y baja a balasana (postura del niño) durante cinco respiraciones.", "siéntate y termina con unas respiraciones lentas (pranayama)."],
    why: "las posturas vienen de un camino completo. esto nombra de dónde vienen.",
    about: "el yoga es una de las seis escuelas clásicas del pensamiento hindú. las posturas (asana) son una de las ocho ramas de Patanjali; el camino también incluye la ética, la respiración y la meditación." },
  diya: { title: "una lámpara al anochecer",
    steps: ["al anochecer, enciende un diya (una pequeña lámpara de aceite) o una vela.", "ponlo frente a la imagen de tu deidad, o simplemente junto a una ventana.", "junta las manos. un momento de gratitud.", "déjalo encendido mientras sigues con tu noche, con cuidado."],
    why: "encender una lámpara al anochecer es uno de los actos de devoción hindú más sencillos.",
    about: "al anochecer, muchos hindúes encienden una pequeña lámpara de aceite (un diya) frente a la imagen de una deidad, juntan las manos y dan gracias." },

  "seneca-questions": { title: "las tres preguntas de Séneca",
    steps: ["esta noche, repasa el día.", "¿qué mal hábito curé hoy?", "¿qué defecto resistí?", "¿en qué soy mejor? y luego, a dormir."],
    why: "el estoico Séneca lo hacía cada noche (Sobre la ira, libro 3).",
    about: "cada noche, el estoico Séneca repasaba su día con tres preguntas: ¿qué mal hábito curé?, ¿qué defecto resistí?, ¿en qué soy mejor?" },
  "view-from-above": { title: "la vista desde arriba",
    steps: ["cierra los ojos. imagínate donde estás ahora mismo.", "elévate: el edificio, la ciudad, el país.", "sigue subiendo hasta que la Tierra se vea pequeña y azul.", "nota qué tan grande se ve desde aquí la preocupación de hoy. luego baja otra vez."],
    why: "un antiguo ejercicio estoico al que Marco Aurelio volvía en sus Meditaciones.",
    about: "estoicos como Marco Aurelio se imaginaban elevándose sobre su ciudad y toda la Tierra hasta que sus preocupaciones se veían pequeñas, y luego volvían a bajar." },
};

// Each practice's words follow the language: read at render time, so a switch shows at once. The English above is
// what the tests (and every other language) see.
for (const p of PRACTICES) {
  const x = PRACTICES_ES[p.id];
  if (!x) continue;
  const en = { title: p.title, steps: p.steps, why: p.why, about: p.about };
  for (const k of ["title", "steps", "why", "about"] as const) {
    if (en[k] === undefined) continue;
    Object.defineProperty(p, k, { get: () => (es() && x[k] !== undefined ? x[k] : en[k]), enumerable: true, configurable: true });
  }
}

export const practiceById = (id: string | null | undefined) => PRACTICES.find((p) => p.id === id) || null;
