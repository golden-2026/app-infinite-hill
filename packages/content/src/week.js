// The upgraded first week (owner, 2026-10-06; Hindu pilot first). A lesson whose script carries games.story /
// games.build / games.wrong / games.think gets the upgraded shape in planDay: shorter bubbles, what most people get
// wrong, the story behind it (optional), build the word, a look back at an earlier day, a last thinking question, and
// on day 7 a check-in on the whole week. Other lessons are built exactly as before.

/** One question per day of the first week: the look-backs and the day-7 check-in. */
export const WEEK_ONE = Object.freeze({
  HINDUISM: [
    { day: 1, word: "Ganesha", q: "Vighnaharta, Ganesha's title, means…", options: ["remover of obstacles.", "elephant god.", "lord of the dance."], answer: 0 },
    { day: 2, word: "om", q: "in om, the silence after the sound is called…", options: ["the fourth.", "the end of the prayer.", "deep sleep."], answer: 0 },
    { day: 3, word: "Gayatri", q: "the Gayatri mantra asks for…", options: ["a clear mind, guided by the light.", "wealth and good luck.", "victory over enemies."], answer: 0 },
    { day: 4, word: "namaste", q: "namaste, word for word, means…", options: ["I bow to you.", "the light in me sees the light in you.", "peace be with you."], answer: 0 },
    { day: 5, word: "arti", q: "when the arti plate comes to you, people…", options: ["pass their hands over the flame, then to their eyes.", "blow out the flame.", "ring the bell three times."], answer: 0 },
    { day: 6, word: "ishta devata", q: "an old Hindu verse says truth is one, and the wise…", options: ["call it by many names.", "argue about which god is real.", "keep it secret."], answer: 0 },
    { day: 7, word: "karma", q: "karma, the word, means…", options: ["action.", "payback.", "fate."], answer: 0 },
  ],
});

/** Words in a lesson bubble you can tap to hear said (term → how to say it). Longest first when matching. */
export const SAY_IT = Object.freeze({
  HINDUISM: {
    namaste: "na mas tay", namas: "na mas", namaskar: "na mas kar", om: "ohm", aum: "ah oo mm", dharma: "dhar ma", svadharma: "sva dhar ma",
    shanti: "shaan tee", pranam: "pra naam", "charan sparsh": "cha ran sparsh", ashirvad: "aa sheer vaad", ganesha: "ga nay sha", ganapati: "ga na pa tee",
    vighnaharta: "vigh na har ta", "shri ganeshaya namah": "shree ga nay sha ya na mah", namah: "na mah", mantra: "man tra", japa: "ja pa", gayatri: "gaa ya tree",
    savitar: "sa vi tar", upanishad: "oo pa ni shad", mandukya: "maan dook ya", chandogya: "chaan dog ya", "bhagavad gita": "bha ga vad gee ta", gita: "gee ta",
    arjuna: "ar ju na", krishna: "krish na", kurukshetra: "ku ruk shay tra", manusmriti: "ma nu smri tee", vyasa: "vyaa sa", shiva: "shi va", gayatri: "gaa ya tree", "bhur bhuvah svah": "bhoor bhoo vah svah", "tat savitur varenyam": "tat sa vi toor va rayn yam", "bhargo devasya dhimahi": "bhar go day vas ya dhee ma hee", "dhiyo yo nah prachodayat": "dhee yo yo nah pra cho da yaat", arti: "aar tee", prasad: "pra saad", "ishta devata": "ish ta day va taa", "ekam sat": "ay kam sat", karma: "kar ma", vighnaharta: "vigh na har ta",
  },
});

/** The look-back for day `day`: a question from two days before (from day 3 on), so review reaches past yesterday. */
export function lookBack(door, day) {
  const week = WEEK_ONE[door];
  if (!week || day < 3 || day > week.length) return null;
  return week.find((x) => x.day === day - 2) || null;
}

/** Split a lesson line into plain text and tappable terms: [{ text, say? }]. */
export function sayable(door, text) {
  const terms = SAY_IT[door];
  if (!terms || !text) return [{ text: String(text || "") }];
  const keys = Object.keys(terms).sort((a, b) => b.length - a.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  // trailing punctuation rides with the word, so a line never breaks before its comma
  const re = new RegExp(`\\b(${keys.join("|")})\\b([,.;:!?…]*)`, "gi");
  const out = [];
  let at = 0;
  for (const m of String(text).matchAll(re)) {
    if (m.index > at) out.push({ text: text.slice(at, m.index) });
    out.push({ text: m[0], say: terms[m[1].toLowerCase()] });
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out;
}
