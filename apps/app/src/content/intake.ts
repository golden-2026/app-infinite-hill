// DRAFT — NOT KEEPER-REVIEWED. Onboarding questions and cross-tradition "bridges" written 2026-09-27 as a first
// pass for the door-first onboarding. Every gloss below must be reviewed by that tradition's Keeper before
// release (docs/CONTENT_RELEASE.md). Wording rules: plain, warm, never pushy; a bridge says "a similar idea",
// never "the same thing"; nobody is ever told they should choose, switch, or become religious.

export const CONTENT_STATUS = "draft-unreviewed" as const;

/** "Were you raised Jewish?" — the adjective for a person of each tradition ({person} in question text). */
export const PERSON: Record<string, string> = { CHRISTIANITY: "Christian", CATHOLIC: "Catholic", HINDUISM: "Hindu", ISLAM: "Muslim", JUDAISM: "Jewish", BUDDHISM: "Buddhist", SIKHISM: "Sikh" };

/** Answers that stand alone in a multi-choice question: picking one clears the rest. */
export const EXCLUSIVE = new Set(["nothing", "none"]);

export type Choice = { id: string; label: string };
export type Question = {
  id: string;
  ask: string;
  note?: string;
  multi?: boolean;
  /** Optional answers let people keep things to themselves. */
  optional?: boolean;
  choices: Choice[];
};

// ---------- the first step, before any door (welcome/you) ----------

/** Sorts people warmly before the door screen, so it can show them the right way in. Never assigns a door. */
export const STANCE_Q: Question = {
  id: "stance", ask: "First, a little about you. Where are you with religion right now?",
  note: "private — it stays on your phone. it only changes what we show you first. every door stays open.",
  choices: [
    { id: "practice", label: "I practice a faith" },
    { id: "unsure", label: "I grew up in one, but I'm not sure I believe anymore" },
    { id: "left", label: "I grew up in one and left it" },
    { id: "curious", label: "no religion — just curious" },
    { id: "many", label: "exploring more than one" },
    { id: "spiritual", label: "spiritual, not religious" },
  ],
};

/** The follow-up: which tradition (same ids as the intake's `raised`, so "my own path" doesn't ask it again). */
export function raisedInQ(stance: string | null): Question {
  const grewUp = stance === "unsure" || stance === "left";
  const ask = stance === "practice" ? "Lovely. Which one?" : grewUp ? "Which one did you grow up in?" : "Did you grow up in a religion?";
  const choices = RAISED.filter((c) => (stance === "practice" || grewUp ? c.id !== "none" : true))
    .map((c) => (c.id === "none" ? { ...c, label: "no, none" } : c))
    .sort((a, z) => Number(z.id === "none") - Number(a.id === "none")); // "no, none" first when it's offered
  return { id: "raisedIn", ask, optional: true, note: grewUp ? "no wrong answers. nothing here asks you to go back." : undefined, choices };
}

// ---------- someone who picked a tradition ----------

/** Asked after the knowledge check, to learn how much the tradition is part of their life. {door} is the tradition's name. */
export const BELIEF_QUESTIONS: Question[] = [
  { id: "why", ask: "What brings you to {door}?", note: "pick the closest. it shapes what we lead with.", choices: [
    { id: "own", label: "I want to know my own religion better" },
    { id: "roots", label: "reconnect with how I grew up" },
    { id: "god", label: "I'm wondering if I believe in God" },
    { id: "partner", label: "my partner's or family's faith" },
    { id: "kids", label: "to teach my kids" },
    { id: "calm", label: "a calmer daily habit" },
    { id: "hard", label: "going through something hard" },
    { id: "curious", label: "just curious" },
  ] },
  { id: "raised", ask: "Were you raised {person}?", choices: [
    { id: "yes", label: "yes, since I was little" },
    { id: "later", label: "I came to it later" },
    { id: "exploring", label: "no — I'm exploring it" },
    { id: "family", label: "no — it's my partner's or family's" },
  ] },
  { id: "practice", ask: "How much is it part of your life right now?", choices: [
    { id: "daily", label: "most days" },
    { id: "weekly", label: "most weeks" },
    { id: "holidays", label: "holidays and big moments" },
    { id: "rarely", label: "not much right now" },
  ] },
  { id: "hold", ask: "How do you hold it?", optional: true, note: "there's no right answer. this only changes how we talk to you.", choices: [
    { id: "fully", label: "I believe it, fully" },
    { id: "questions", label: "I believe, with questions" },
    { id: "culture", label: "it's more culture and family" },
    { id: "figuring", label: "I'm figuring it out" },
  ] },
  { id: "openness", ask: "Sometimes another tradition has a word for something similar. When that comes up, you'd like to…", note: "you can change this any time in You.", choices: [
    { id: "stay", label: "stay on my path — keep it to {door}" },
    { id: "sometimes", label: "hear about it now and then" },
    { id: "love", label: "I love that stuff" },
  ] },
];

// ---------- "my own path": get to know them, one question at a time ----------

const RAISED: Choice[] = [
  { id: "CHRISTIANITY", label: "Christian" }, { id: "CATHOLIC", label: "Catholic" }, { id: "JUDAISM", label: "Jewish" },
  { id: "ISLAM", label: "Muslim" }, { id: "HINDUISM", label: "Hindu" }, { id: "BUDDHISM", label: "Buddhist" },
  { id: "SIKHISM", label: "Sikh" }, { id: "mixed", label: "a mix" }, { id: "other", label: "something else" }, { id: "none", label: "no religion" },
];

export const INTAKE: Record<string, Question> = {
  raised: { id: "raised", ask: "Were you raised in a religion?", note: "no wrong answers. you don't have to pick one here, now or ever.", choices: RAISED },
  feelNow: { id: "feelNow", ask: "How do you feel about it now?", choices: [
    { id: "part", label: "it's still part of me" },
    { id: "complicated", label: "it's complicated" },
    { id: "left", label: "I left it" },
    { id: "never", label: "it never really clicked" },
  ] },
  turnedOff: { id: "turnedOff", ask: "What turned you off, if anything?", multi: true, optional: true, choices: [
    { id: "rules", label: "the rules" }, { id: "judged", label: "feeling judged" }, { id: "hypocrisy", label: "the hypocrisy" },
    { id: "believe", label: "I didn't believe it" }, { id: "rote", label: "it felt rote" }, { id: "politics", label: "the politics" },
    { id: "hurt", label: "something that happened" }, { id: "none", label: "nothing, really" },
  ] },
  loved: { id: "loved", ask: "Was there anything you loved about it?", multi: true, optional: true, choices: [
    { id: "music", label: "the music" }, { id: "ritual", label: "the rituals" }, { id: "community", label: "the people" },
    { id: "stories", label: "the stories" }, { id: "quiet", label: "the quiet, prayer" }, { id: "holidays", label: "holidays and food" },
    { id: "nothing", label: "not really" },
  ] },
  grewUp: { id: "grewUp", ask: "Growing up, religion was…", choices: [
    { id: "absent", label: "just not around" }, { id: "others", label: "other people's thing" },
    { id: "curious", label: "something I was curious about" }, { id: "avoided", label: "something to stay away from" },
  ] },
  believe: { id: "believe", ask: "What do you believe right now?", optional: true, note: "private. it only changes what we show you.", choices: [
    { id: "bigger", label: "there's something bigger" }, { id: "unsure", label: "not sure" },
    { id: "meaning", label: "no god, but meaning matters" }, { id: "searching", label: "I'm searching" },
  ] },
  organized: { id: "organized", ask: "And organized religion?", choices: [
    { id: "like", label: "I like it" }, { id: "mixed", label: "mixed feelings" }, { id: "away", label: "I'd rather keep away" },
  ] },
  feeling: { id: "feeling", ask: "What's going on for you lately?", multi: true, choices: [
    { id: "sleep", label: "can't sleep" }, { id: "anxious", label: "anxious" }, { id: "grief", label: "grieving someone" },
    { id: "sick", label: "someone I love is sick" }, { id: "lonely", label: "lonely" }, { id: "focus", label: "can't focus" },
    { id: "grateful", label: "grateful, actually" }, { id: "curious", label: "just curious" },
  ] },
  interests: { id: "interests", ask: "What sounds good to you?", multi: true, choices: [
    { id: "still", label: "breathing and stillness" }, { id: "stories", label: "old stories" }, { id: "words", label: "wise words to carry" },
    { id: "kindness", label: "kindness, in practice" }, { id: "others", label: "how other people believe" },
    { id: "common", label: "what all religions share" },
  ] },
};

/** The next question for "my own path", given what they've said so far. Null when we know enough to suggest. */
export function nextIntake(answers: Record<string, string | string[]>): Question | null {
  const has = (id: string) => id in answers;
  if (!has("raised")) return INTAKE.raised;
  const raisedIn = answers.raised as string;
  const religious = raisedIn !== "none" && raisedIn !== "other";
  if (religious) {
    if (!has("feelNow")) return INTAKE.feelNow;
    if (answers.feelNow !== "part" && !has("turnedOff")) return INTAKE.turnedOff;
    if (!has("loved")) return INTAKE.loved;
  } else if (!has("grewUp")) return INTAKE.grewUp;
  if (!has("believe")) return INTAKE.believe;
  if (!has("organized")) return INTAKE.organized;
  if (!has("feeling")) return INTAKE.feeling;
  if (!has("interests")) return INTAKE.interests;
  return null;
}

/** A short reply after an answer, so it feels like a conversation, not a form. */
export function intakeReply(qid: string, a: string | string[]): string | null {
  const v = Array.isArray(a) ? a : [a];
  if (qid === "feelNow" && v[0] === "left") return "that's allowed. nothing here asks you to go back.";
  if (qid === "feelNow" && v[0] === "complicated") return "most people's is.";
  if (qid === "organized" && v[0] === "away") return "fair. no one here will sign you up for anything.";
  if (qid === "believe" && v[0] === "meaning") return "good. there's a lot here that doesn't need a god to work.";
  if (qid === "raised" && v[0] === "none") return "then you get to walk in with fresh eyes.";
  if (qid === "turnedOff" && v.includes("hurt")) return "I'm sorry. we'll go gently.";
  if (qid === "feeling" && v.includes("grief")) return "I'm sorry. we'll start with something steady.";
  return null;
}

/** Which bridge themes an answer points at (see BRIDGES[].tags). */
export const INTAKE_TAGS: Record<string, string[]> = {
  sleep: ["stillness", "sound"], anxious: ["stillness", "patience"], grief: ["compassion", "community", "patience"],
  sick: ["compassion", "patience", "service"], lonely: ["community", "kindness"], focus: ["stillness", "sound", "name"],
  grateful: ["gratitude", "blessing"], curious: ["oneness", "stories", "greeting"],
  still: ["stillness", "sound"], stories: ["stories"], words: ["patience", "kindness", "oneness"], kindness: ["kindness", "service", "compassion"],
  others: ["greeting", "rest", "oneness"], common: ["kindness", "oneness", "greeting"],
  music: ["sound", "name"], ritual: ["rest", "blessing"], community: ["community"], quiet: ["stillness", "name"], holidays: ["rest", "community"],
  bigger: ["oneness"], searching: ["oneness", "stillness"], meaning: ["kindness", "service"], unsure: ["stillness"],
};

// ---------- bridges: similar ideas across traditions (DRAFT glosses) ----------

export type Bridge = {
  id: string;
  /** The shared idea, in one plain line. */
  idea: string;
  /** Why it might speak to someone ("my own path" suggestions). */
  why: string;
  tags: string[];
  /** day = the Camp 1 lesson where this word is taught on that door, when there is one. */
  members: { door: string; word: string; day?: number; gloss: string }[];
};

export const BRIDGES: Bridge[] = [
  { id: "greeting", idea: "a hello that is also a blessing", why: "a way to meet people that wishes them well", tags: ["greeting", "kindness"], members: [
    { door: "HINDUISM", word: "namaste", day: 1, gloss: "the light in me sees the light in you" },
    { door: "JUDAISM", word: "shalom", day: 1, gloss: "hello, goodbye, peace — and wholeness" },
    { door: "ISLAM", word: "salaam", day: 1, gloss: "peace be upon you" },
  ] },
  { id: "rest", idea: "a day set apart to stop", why: "permission to stop, built into the week", tags: ["rest", "stillness", "community"], members: [
    { door: "JUDAISM", word: "Shabbat", day: 3, gloss: "from Friday sundown, the week stops" },
    { door: "CHRISTIANITY", word: "the Sabbath", day: 9, gloss: "a day of rest, kept holy" },
    { door: "CATHOLIC", word: "Sunday", day: 13, gloss: "one day that isn't yours to fill" },
    { door: "ISLAM", word: "Jumu'ah", day: 19, gloss: "Friday's gathering for prayer" },
  ] },
  { id: "name", idea: "repeating a holy word until it quiets you", why: "a single word to come back to when your mind won't settle", tags: ["name", "stillness", "sound"], members: [
    { door: "HINDUISM", word: "japa", day: 13, gloss: "a name repeated, counted on beads" },
    { door: "ISLAM", word: "dhikr", day: 12, gloss: "remembrance: repeating words that praise God" },
    { door: "SIKHISM", word: "simran", day: 7, gloss: "remembering the Name, again and again" },
    { door: "CATHOLIC", word: "the rosary, beads", day: 10, gloss: "prayers counted on beads" },
  ] },
  { id: "service", idea: "giving as a practice, not a feeling", why: "doing something for someone else, quietly, as part of your day", tags: ["service", "kindness"], members: [
    { door: "SIKHISM", word: "seva", day: 1, gloss: "selfless service" },
    { door: "HINDUISM", word: "seva", day: 15, gloss: "service offered without expecting return" },
    { door: "JUDAISM", word: "tzedakah", day: 10, gloss: "giving as justice, not only charity" },
    { door: "ISLAM", word: "zakat", day: 15, gloss: "a share of what you have, owed to others" },
    { door: "BUDDHISM", word: "dana", day: 14, gloss: "generosity" },
  ] },
  { id: "compassion", idea: "kindness wished on purpose, even to strangers", why: "a practice for when caring hurts or runs thin", tags: ["compassion", "kindness"], members: [
    { door: "BUDDHISM", word: "metta", day: 1, gloss: "loving-kindness, wished outward" },
    { door: "BUDDHISM", word: "karuna", day: 16, gloss: "compassion for suffering" },
    { door: "CATHOLIC", word: "mercy", day: 20, gloss: "kindness you didn't earn" },
    { door: "CHRISTIANITY", word: "love", day: 13, gloss: "love as something you do" },
  ] },
  { id: "return", idea: "you can turn around and start again", why: "a way back after getting it wrong", tags: ["patience", "compassion"], members: [
    { door: "JUDAISM", word: "teshuvah", day: 17, gloss: "returning — repair and start over" },
    { door: "CATHOLIC", word: "confession", day: 12, gloss: "saying it out loud, and being forgiven" },
    { door: "CHRISTIANITY", word: "the Prodigal Son", day: 11, gloss: "the son who comes home and is welcomed" },
  ] },
  { id: "oneness", idea: "one, underneath everything", why: "an old idea about how everything fits together", tags: ["oneness"], members: [
    { door: "SIKHISM", word: "Ik Onkar", day: 4, gloss: "there is one" },
    { door: "ISLAM", word: "tawhid", day: 20, gloss: "the oneness of God" },
    { door: "JUDAISM", word: "the Shema", day: 2, gloss: "hear: the Lord is one" },
    { door: "HINDUISM", word: "Brahman", day: 11, gloss: "the one reality behind all things" },
  ] },
  { id: "sound", idea: "a sound that starts the quiet", why: "something to hear that brings you back to now", tags: ["sound", "stillness"], members: [
    { door: "HINDUISM", word: "om", day: 2, gloss: "the first sound" },
    { door: "BUDDHISM", word: "the bell", day: 10, gloss: "a bell that calls you back to the present" },
    { door: "SPIRITUAL", word: "the bell", day: 5, gloss: "one sound, then silence" },
  ] },
  { id: "blessing", idea: "starting something by saying why it matters", why: "a small pause before ordinary things", tags: ["blessing", "gratitude"], members: [
    { door: "ISLAM", word: "bismillah", day: 2, gloss: "in the name of God — before a meal, a journey, a first line" },
    { door: "JUDAISM", word: "bracha", day: 5, gloss: "a blessing said before and after" },
    { door: "CATHOLIC", word: "the sign of the cross", day: 2, gloss: "head, heart, shoulders — all of you" },
  ] },
  { id: "gratitude", idea: "thanks, said out loud", why: "noticing what's already good", tags: ["gratitude"], members: [
    { door: "ISLAM", word: "alhamdulillah", day: 3, gloss: "all praise is God's — thanks, in good times and bad" },
    { door: "SPIRITUAL", word: "gratitude", day: 9, gloss: "thank you, anyway" },
  ] },
  { id: "community", idea: "gathering to practice together", why: "company for the part that's hard to do alone", tags: ["community"], members: [
    { door: "SIKHISM", word: "sangat", day: 13, gloss: "the gathered community" },
    { door: "BUDDHISM", word: "the sangha", day: 17, gloss: "the community that walks together" },
    { door: "HINDUISM", word: "satsang", day: 20, gloss: "gathering in truth" },
    { door: "JUDAISM", word: "minyan", day: 18, gloss: "ten people, so prayer can begin" },
    { door: "SIKHISM", word: "langar", day: 8, gloss: "a free kitchen: everyone eats, side by side" },
  ] },
  { id: "patience", idea: "staying steady when things are hard", why: "something to hold when you can't fix it", tags: ["patience"], members: [
    { door: "ISLAM", word: "sabr", day: 18, gloss: "patient endurance" },
    { door: "SIKHISM", word: "chardi kala", day: 15, gloss: "rising spirits, even in hardship" },
    { door: "BUDDHISM", word: "equanimity", day: 19, gloss: "a mind that stays level" },
  ] },
  { id: "stillness", idea: "sitting in silence on purpose", why: "a few quiet minutes that ask nothing of you", tags: ["stillness"], members: [
    { door: "BUDDHISM", word: "sati", day: 9, gloss: "mindfulness: noticing what's here" },
    { door: "CHRISTIANITY", word: "silence", day: 18, gloss: "quiet is where he is" },
    { door: "ISLAM", word: "muraqaba", day: 13, gloss: "watchful, quiet attention" },
    { door: "JUDAISM", word: "hitbodedut", day: 15, gloss: "being alone to speak freely with God" },
    { door: "SPIRITUAL", word: "silence", day: 10, gloss: "a few minutes of nothing" },
  ] },
  { id: "stories", idea: "old stories about starting over", why: "stories people have told for thousands of years because they still work", tags: ["stories"], members: [
    { door: "CHRISTIANITY", word: "the Prodigal Son", day: 11, gloss: "the son who comes home" },
    { door: "ISLAM", word: "Yusuf", day: 16, gloss: "the brother sold, who forgives" },
    { door: "BUDDHISM", word: "the Jataka", day: 18, gloss: "the Buddha's past lives, as stories" },
    { door: "SIKHISM", word: "the sakhis", day: 18, gloss: "stories of the Gurus" },
  ] },
  { id: "golden", idea: "treat others the way you'd want to be treated", why: "the rule nearly every tradition arrived at on its own", tags: ["kindness", "oneness"], members: [
    { door: "SPIRITUAL", word: "the golden rule", day: 4, gloss: "be good to others as to yourself" },
    { door: "CHRISTIANITY", word: "the Good Samaritan", day: 10, gloss: "the stranger who stopped to help" },
    { door: "HINDUISM", word: "ahimsa", day: 17, gloss: "do no harm" },
  ] },
];
