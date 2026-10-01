// DRAFT — NOT KEEPER-REVIEWED. The harder half of the "where are you?" check (welcome/know), written 2026-10-01.
// Asked only after someone gets the basics (data.PLACEMENT, camp one's words) right. Each question tests knowledge
// the door's own year-one curriculum teaches (the day it's taught is noted beside it, from
// docs/curriculum/<door>/scripts/y1), so doing well here means camp one would mostly be review.
// Rules: facts only, never belief; no trick wording; one clearly right answer; the wrong ones are real things from
// the same tradition, never jokes. Every question needs its tradition's Keeper before release (docs/CONTENT_RELEASE.md).
// The right answer is listed first (a: 0); the screen shuffles the order. Spanish overlays it at render time
// (i18n/strings/onboarding-placement.ts, by door and position), like the onboarding questions (content/intake.ts).
import { getLang } from "@/i18n/core";
import { PLACEMENT_ES } from "@/i18n/strings/onboarding-placement";

export const CONTENT_STATUS = "draft-unreviewed" as const;

export type PlaceQ = { q: string; o: string[]; a: number; day: number };

const EN: Record<string, PlaceQ[]> = {
  HINDUISM: [
    { day: 108, q: "the Gayatri mantra is first found in…", o: ["the Rig Veda (3.62.10)", "the Bhagavad Gita", "the Ramayana"], a: 0 },
    { day: 227, q: "many readers split the Gita's eighteen chapters into three sets of six. the middle six are mostly about…", o: ["bhakti, devotion", "the rules of a battle", "the four stages of life"], a: 0 },
    { day: 117, q: "the full, sixteen-step form of puja is called…", o: ["shodashopachara", "panchopachara", "saptapadi"], a: 0 },
    { day: 108, q: "the sacred-thread samskara, where the Gayatri is traditionally taught, is…", o: ["upanayana", "annaprashana", "namakarana"], a: 0 },
    { day: 82, q: "Holi falls on the full moon of which month?", o: ["Phalguna", "Shravana", "Kartika"], a: 0 },
    { day: 170, q: "the four aims of life are dharma, artha, kama and…", o: ["moksha", "karma", "seva"], a: 0 },
  ],
  ISLAM: [
    { day: 86, q: "the first revealed word to the Prophet ﷺ, in Surah al-'Alaq, was…", o: ["iqra' — read, recite", "qul — say", "bismillah"], a: 0 },
    { day: 100, q: "the five daily prayers, in order from dawn:", o: ["fajr, dhuhr, asr, maghrib, isha", "fajr, asr, dhuhr, isha, maghrib", "dhuhr, fajr, maghrib, asr, isha"], a: 0 },
    { day: 151, q: "zakat on savings held for a lunar year, above the nisab, is usually…", o: ["2.5 percent", "10 percent", "20 percent"], a: 0 },
    { day: 85, q: "Laylat al-Qadr, the Night of Power, is sought in…", o: ["the last ten nights of Ramadan", "the first night of Muharram", "the night before Eid al-Adha"], a: 0 },
    { day: 92, q: "the hijra, from Mecca to Medina, marks…", o: ["year one of the Islamic calendar", "the first revelation", "the first Hajj"], a: 0 },
    { day: 311, q: "every surah opens with bismillah except one:", o: ["al-Tawbah (9)", "al-Baqarah (2)", "al-Ikhlas (112)"], a: 0 },
  ],
  JUDAISM: [
    { day: 2, q: "the Shema's first line, \"Hear, O Israel\", is from…", o: ["Deuteronomy 6:4", "Exodus 20:2", "Genesis 1:1"], a: 0 },
    { day: 114, q: "on weekdays, the Amidah has how many blessings?", o: ["nineteen", "seven", "ten"], a: 0 },
    { day: 107, q: "Havdalah, at the end of Shabbat, uses…", o: ["wine, spices and a braided candle", "matzah and bitter herbs", "a shofar and honey"], a: 0 },
    { day: 3, q: "Shabbat ends on Saturday night when…", o: ["three stars are out", "the candles burn down", "the rabbi says the closing prayer"], a: 0 },
    { day: 21, q: "in the yearly cycle, the Torah is read in how many weekly portions?", o: ["fifty-four", "twelve", "one hundred fifty"], a: 0 },
    { day: 130, q: "Hanukkah begins on the 25th of which month?", o: ["Kislev", "Nisan", "Tishrei"], a: 0 },
  ],
  BUDDHISM: [
    { day: 5, q: "the Buddha's first teaching, turning the wheel of the Dhamma, was given at…", o: ["the Deer Park at Sarnath", "Bodh Gaya, under the tree", "Kushinagar"], a: 0 },
    { day: 11, q: "the three marks of existence are anicca, anatta and…", o: ["dukkha", "metta", "sila"], a: 0 },
    { day: 303, q: "the eightfold path is often grouped into three trainings:", o: ["ethics, concentration, wisdom", "kindness, compassion, joy", "Buddha, Dhamma, Sangha"], a: 0 },
    { day: 16, q: "the four brahmaviharas are metta, karuna, mudita and…", o: ["upekkha", "sati", "dana"], a: 0 },
    { day: 291, q: "the Pali canon's \"three baskets\" are the Vinaya, the Suttas and…", o: ["the Abhidhamma", "the Jataka", "the Dhammapada"], a: 0 },
    { day: 4, q: "in South and Southeast Asia, Vesak remembers…", o: ["the Buddha's birth, awakening and death", "only his first teaching", "the first monks' ordination"], a: 0 },
  ],
  SIKHISM: [
    { day: 2, q: "Japji Sahib, the morning prayer that opens the Guru Granth Sahib, was composed by…", o: ["Guru Nanak", "Guru Gobind Singh", "Guru Arjan"], a: 0 },
    { day: 20, q: "the Adi Granth was first compiled, in 1604, by…", o: ["Guru Arjan", "Guru Nanak", "Guru Har Rai"], a: 0 },
    { day: 16, q: "Guru Gobind Singh founded the Khalsa at Anandpur on…", o: ["Vaisakhi, 1699", "Diwali, 1604", "Guru Nanak's birthday, 1469"], a: 0 },
    { day: 232, q: "after the opening prayers, the Guru Granth Sahib's hymns are arranged by…", o: ["raga, the musical measure", "the order they were written", "which Guru wrote them"], a: 0 },
    { day: 16, q: "the five Ks are kesh, kara, kanga, kachera and…", o: ["kirpan", "karah parshad", "kirtan"], a: 0 },
    { day: 67, q: "Bandi Chhor Divas remembers…", o: ["Guru Hargobind freeing 52 princes from Gwalior fort", "Guru Nanak's birth", "the founding of the Khalsa"], a: 0 },
  ],
  CATHOLIC: [
    { day: 4, q: "the two main parts of the Mass are the Liturgy of the Word and…", o: ["the Liturgy of the Eucharist", "the Benediction", "the Stations of the Cross"], a: 0 },
    { day: 124, q: "how many sacraments does the Catholic Church count?", o: ["seven", "three", "twelve"], a: 0 },
    { day: 10, q: "the luminous mysteries of the rosary were added by…", o: ["John Paul II, in 2002", "Pius X, in 1910", "the Council of Trent"], a: 0 },
    { day: 19, q: "the Church's liturgical year begins with…", o: ["Advent", "Lent", "Easter"], a: 0 },
    { day: 23, q: "the Magnificat, Mary's song, is in…", o: ["Luke 1", "Matthew 5", "John 1"], a: 0 },
    { day: 290, q: "the Catechism's four parts are the creed, the sacraments, life in Christ and…", o: ["prayer", "the saints", "Church history"], a: 0 },
  ],
  CHRISTIANITY: [
    { day: 4, q: "the Lord's Prayer is in Matthew 6 and…", o: ["Luke 11", "Mark 4", "John 3"], a: 0 },
    { day: 12, q: "the Sermon on the Mount is in which gospel?", o: ["Matthew", "Mark", "John"], a: 0 },
    { day: 48, q: "Pentecost remembers…", o: ["the Holy Spirit coming on the disciples", "Jesus' birth", "the Last Supper"], a: 0 },
    { day: 52, q: "in John's gospel, Jesus' first sign is…", o: ["water into wine at Cana", "feeding the five thousand", "walking on water"], a: 0 },
    { day: 106, q: "the Nicene Creed was first agreed at Nicaea in…", o: ["325", "1517", "70"], a: 0 },
    { day: 39, q: "how many books are in the Protestant Old Testament?", o: ["thirty-nine", "forty-six", "twenty-seven"], a: 0 },
  ],
};

const es = () => getLang() === "es";

/** The harder questions for a door, in the current language (none for "my own path"). */
export function advancedFor(door: string): PlaceQ[] {
  const qs = EN[door] || [];
  if (!es()) return qs;
  const t = PLACEMENT_ES[door];
  return qs.map((x, i) => (t?.[i] ? { ...x, q: t[i].q, o: t[i].o } : x));
}

/** Every door's questions in English (tests check the shape and the Spanish overlay against it). */
export const ADVANCED_EN = EN;
