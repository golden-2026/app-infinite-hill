# Writing a full lesson script

*For writer agents and human writers. Every script is a DRAFT until that tradition's Keeper signs it off. Nothing here is approved for public release.*

A **script** is one day of one path, written in full: what the voice says, what the screen shows, and the material the games are built from. Today only the Hindu path's 21 manuscript days (`CAMP1_HIN` in `packages/content/generated/data.js`) are written like this. They are the quality bar. Read at least days 3, 5, 9 and 14 before you write anything: dump them with

```sh
node -e "import('./packages/content/generated/data.js').then(({default:d})=>{for(const x of d.CAMP1_HIN.filter(x=>[3,5,9,14].includes(x.day))){console.log('\n== '+x.day+' '+x.title);for(const s of x.segments)if(s.voice)console.log('['+s.type+'] '+s.voice)}})"
```

Then look at one finished script in the new format: `docs/curriculum/christianity/scripts/y1/day-0001.json`.

---

## 1. Where scripts live

```
docs/curriculum/<door>/scripts/y<year>/day-<NNNN>.json      e.g. docs/curriculum/islam/scripts/y1/day-0006.json
```

`<door>` is lowercase (`christianity`, `catholic`, `judaism`, `islam`, `buddhism`, `sikhism`, `spiritual`, `hinduism`). Year one is days 1â€“331, year two 332â€“696, year three 697â€“1061, year four 1062â€“1426, year five 1427â€“1791. The day number is the day on the path, zero-padded to four digits.

Before writing a run of days, print what the path already promises for them:

```sh
node packages/content/scripts/script-brief.mjs CHRISTIANITY 22 42
```

It shows each day's **index** (title, word, hook, carry), the outline's camp, part and practice, the length of the sit the app will run, and which feature game the day plays.

---

## 2. The format (`ih-lesson/1`)

```jsonc
{
  "format": "ih-lesson/1",
  "door": "CHRISTIANITY",            // capitals, as in the app
  "day": 5,
  "title": "\"thy kingdom come\"",   // the index title (see Â§6)
  "word": "the Lord's Prayer, line 2", // EXACTLY the index word
  "hook": "â€¦",                       // one line: the teaser shown before the lesson
  "carry": "here, now, would be fine", // EXACTLY the index carry
  "length": "6:30",                  // your estimate of the whole session with games and sit
  "tomorrow": "daily bread",         // tomorrow's title, as a teaser
  "segments": [ /* see Â§4: bell, review, hook, teach, practice, word, carry, close */ ],
  "howItsDone": "â€¦",                 // one or two sentences for "just learn" mode (Â§4)
  "games": {
    "match":    { "prompt": "â€¦", "pairs": [["left", "right"], â€¦] },   // 3â€“4 pairs
    "myth":     [["statement", true|false, "reveal"], â€¦],               // 2â€“3 items
    "fork":     { "setup": "â€¦", "options": ["â€¦","â€¦","â€¦"], "answer": 0-2, "reveal": "â€¦" },
    "original": { "script": "â€¦", "say": "â€¦", "note": "â€¦" } | null,
    "trapdoor": ["what you thought: â€¦", "what it means: â€¦", "what a scholar hears: â€¦"]
  },
  "sources": [
    { "ref": "Matthew 6:10", "work": "The Bible", "translation": "KJV (1769)", "quoted": "Thy kingdom come." },
    { "ref": "Exodus 16:16â€“21", "work": "The Bible", "translation": null, "quoted": null }   // paraphrase
  ],
  "review": { "status": "pending", "keeper": null, "notes": ["anything a Keeper should check"] },
  "meta": { "index": "the index/outline line you wrote from", "writer": "â€¦", "written": "YYYY-MM-DD" }
}
```

A segment is `{ "type", "duration", "voice", "screen" }`, the same shape the app already uses. `review` and `meta` never ship to the app (the build strips them); `review.status` stays `"pending"` until a Keeper changes it. Never set it to anything else.

---

## 3. Voice

Write the way the Hindu manuscript talks: a friend who knows the stories, sitting next to you at sunset.

- **Warm, plain, concrete.** Short sentences. Everyday pictures (a group chat, a kitchen table, 2am). One idea per day, told well.
- **American spelling** in your own words (neighbor, honor, color, center, practice). Quotations keep their translation's spelling ("neighbour" in the KJV is correct inside quotation marks).
- **Lowercase on screen.** Titles, carries, game prompts, pairs, myths, forks and trapdoor floors are lowercase, except names, "I" and "God". The one exception is the screen heads inside backticks, which follow the manuscript's convention of capitals: they render as small labels and the games lowercase them.
- **Never preach.** Describe what the tradition says and does ("Christians sayâ€¦", "the text saysâ€¦", "in the storyâ€¦"). Never tell the listener what to believe, never say "you should repent / convert / accept". Nobody here is told what to believe.
- **Never compare or rank traditions.** Another path may appear only as a neighbor who shares something ("Jews say it too"), briefly, and never to make a point against anyone. No "unlikeâ€¦", no "better thanâ€¦", no "the trueâ€¦".
- **Where the tradition itself differs, say who says what, and rank no one.** "Catholics and Orthodox Christians understand the bread asâ€¦ many Protestants understand it asâ€¦"
- **Never write a new prayer.** Quote a real one (from a public-domain source) or describe one. A practice may invite someone to say a line from a real text "if you pray", never require it.
- **Quote only real public-domain text, with a citation** (Â§8). If you aren't sure of a translation's exact words, don't use quotation marks: paraphrase, and cite with `"quoted": null`.
- **Say so plainly when the sources are silent or unsure.** "The Gospels never tell us what he wrote in the dirt." "Nobody knows exactly what this Greek word means; it appears almost nowhere else." That honesty is part of the voice.
- **Voice-neutral.** The proposed celebrity voices are not signed. A script never names a voice, never says "I'm a Christian / a Muslimâ€¦", and never makes the narrator a member of the faith. "I" is allowed only as the manuscript uses it ("here's the answer I like best").
- **Serious about faith, never solemn about ourselves.** A little humor about the listener's life is fine. The joke is never on a belief, a ritual, a text or God.
- **Careful with history.** Rome executed Jesus; never frame the crucifixion as "the Jews killed Jesus". Colonialism, 1984, the Holocaust, the partition: honest, careful, never used as a hook for drama.
- **No template filler.** The thin camp-one templates said "Most people in X never had anyone explain it to them like this. Now you've got it." Never write that, or anything like it. The validator rejects it.

---

## 4. Length and structure

**Length.** The spoken script is **430â€“640 words** (about 3â€“4 minutes at 150 words a minute). With the games and the sit, the whole session runs about five minutes. The validator fails anything under 380 or over 700.

| segment | duration (write it like this) | words | what it does |
|---|---|---|---|
| `the bell` | `null` | 0 | screen: ``["`DAY FIVE.`"]`` (the day in capital words) |
| `review` | `"20 sec"` | 12â€“60 | picks up yesterday: its word or its line, one question, then "Day five." (no review on day 1) |
| `the hook` | `"50 sec"` | 70â€“150 | a scene, a surprise or a question from the listener's life, or the story's opening. Ends by pointing at today. |
| `the teach` | `"2 min 15"` | 190â€“330 | the word or story, opened up: roots, the real text, what it means, why it matters today. One idea, turned three or four ways. |
| `the practice` | `"2 min 30"` | 45â€“150 | a small, concrete thing to do right now, sized to the sit (below). Ends "The bell holds the time." from day 8 on. |
| `the word` | `"25 sec"` | 10â€“45 | the word, what it means in one breath, and "Fifth word." (camp one: `your 5th word` on screen) |
| `the carry` | `"15 sec"` | 18â€“70 | "Your line: â€¦" plus one small thing to try today. "Day five." |
| `the close` | `null` | 0 | screen: ``["`DAY 5 COUNTS.` â†’ `TOMORROW: â€¦`"]`` |

**The sit the app runs after the practice** (you don't choose it, you write to fit it): days 1â€“2 one breath with the bell; days 3â€“7 three breaths; days 8â€“14 a 45-second sit; days 15â€“21 a 75-second sit; day 22 on, two minutes. So a day-4 practice is about three breaths, not a two-minute meditation.

**Practices are invitations.** Some listeners practice this faith, some are learning it, some are here for a partner or a parent. Write a practice anyone can do: a breath, noticing, remembering someone, one small act. A prayer line is offered as "if you pray, you canâ€¦", never required.

**`howItsDone`** is what someone in "just learn" mode sees instead of the practice: one or two sentences saying how people on this path actually do this (e.g. "Many Christians pray the Lord's Prayer daily, and in most churches the congregation says it together, aloud."). Descriptive, never an instruction.

**Screen lines.** Each segment's `screen` is an array of strings. Put each thing the screen should show in backticks, capitals, in the order it's said: ``"`A â€” FIRST IDEA` Â· `SECOND IDEA` Â· then, large: `THE LINE` Â· then: `THE LAST IDEA`"``. The app shows one head per stretch of voice.
- **The teach needs 3â€“4 backticked heads of 46 characters or fewer, in the order you teach them.** They become the "put the ideas back in order" game (and at higher levels the drag-the-scenes game), so each should make sense alone and the order should be learnable. Don't start a head with THEN or AND.
- The hook needs backticked heads too (2â€“4).
- The word screen: ``"`AMEN â€” your 1st word`."`` in camp one; ``"`LEAVEN â€” today's word`."`` after it.

**The shape of a good day** (look how the manuscript does it):
1. The hook starts where the listener already is (a word they've said, a thing they've seen, a feeling everyone knows), or drops them into the story.
2. The teach opens the word or story: the original word and its root, the actual text (quoted, cited), what's surprising, what it's doing, and why it matters on an ordinary Tuesday.
3. The practice makes the idea physical for one minute.
4. The carry gives it a job for the rest of the day.

---

## 5. The games: derive them from today's teaching

The app builds some games itself (don't write these): **your guess** (what does today's word mean, from the carry), **your ear** (which word did you hear), **your line** (tap the words of the carry), **say it** and **the rhythm** (today's word), and **the ideas** (order the teach's screen heads). The levels (1â€“5) make these harder on their own.

You write the rest. Every item must come from what today's script actually taught, so someone who listened can get it right:

- **`match`** (3â€“4 pairs, each side 48 characters or fewer): what's inside the word, or who-did-what in the story. Left sides must differ. Good: `["abba", "father â€” the family word"]`, `["the priest", "passed by on the other side"]`. It replaces the "words so far" pairs on script days.
- **`myth`** (2â€“3 items, mix true and myth): common misunderstandings the teach cleared up, or surprising true facts it taught. Each has a one-line reveal. Only claims you can source; never a myth about what someone else believes.
- **`fork`** (3 options, one answer): the story's decision point, "what do you do?", with the text's real answer revealed. Setup in second person or as the character. The reveal says what actually happened and why it's surprising. Not graded, so the "answer" is what the text says, not a moral test.
- **`original`**: the word in its original language and script, how to say it (capitals on the stressed syllable: `ah-MEN`), and a one-line note. Hebrew or Greek for the Bible (Greek in Greek script, e.g. `á¼€Î³Î¬Ï€Î·`), Arabic for Islam, Gurmukhi for Sikhism, Pali/Sanskrit in Devanagari for Buddhism and Hinduism, Hebrew for Judaism. For "my own path", only when the day's source has one (Latin *spiritus*, Greek *pneuma*, Sanskrit *prÄá¹‡a*), and say which tradition it comes from. Use `null` when there's no original-language word worth teaching. Never guess at a spelling: if unsure, `null`.
- **`trapdoor`** (exactly three floors, starting `what you thought:`, `what it means:`, `what a scholar hears:`): the word, falling through three levels of depth. The third floor is the good detail (a root, a manuscript fact, a history note) and must be accurate.

The app plays **one** of myth, fork, original or trapdoor each day after day one: myth on day 2, fork on day 3, original on day 4, trapdoor on day 5, then rotating in that order (skipping `original` when it's `null`). Write all four anyway: the others feed the "go deeper" round and future levels.

---

## 6. Staying true to the path: the index, the outline, the neighbors

**The index is fixed.** Each day already has a title, word, hook and carry (camp one in `data.js`; days 22 on in `docs/curriculum/<door>/y1.md â€¦ y5.md`). The strand, the review screen, the lantern, the quick rounds and "tomorrow:" all read the index, not the script, and the script loads only when the lesson opens. So:
- `word` and `carry` must match the index **exactly** (the validator fails otherwise). If the index is wrong or awkward, write the script to it anyway and put the suggestion in `review.notes`; changing the index is a separate, owner-approved edit to the outline.
- On outline days whose word is `â€”`, the app uses the start of the title as the word (e.g. `The sower`). Keep that exactly; `script-brief.mjs` prints it.
- Keep the index `title`. A camp-one title cut short with `â€¦` may be written out in full.
- Use the outline line: its hook is the story beat, its practice is the practice, its carry is the carry. Expand; don't contradict.

**Neighbors.** The `review` picks up yesterday (its word or its line); the validator warns when it doesn't. `tomorrow` and the close screen tease the next day's title. Don't teach tomorrow's story today. When a story runs over several days (the Lord's Prayer, the Christmas story, al-Fatiha), each day takes one piece and says where we are in the whole.

**The camp's arc.** Camp 1 (days 1â€“21) is first words: one word a day, the vocabulary of the path. Camp 2 (22â€“96) is the stories: the hook becomes a story, retold vividly and accurately. Camp 3 practices, Camp 4 the text read in order, Camp 5 the depths, then the five years. Week ends (days 7, 14, 21, â€¦) look back at the week; the last day of a camp names the whole camp's words and points at the next.

---

## 7. Per door

- **Christianity** (the broad path: Protestant, Orthodox and Catholic Christians all welcome). The Bible, Gospels first; the Psalms. Where churches differ (communion, Mary, saints, baptism), say who says what.
- **Catholic.** Douay-Rheims (Challoner) for scripture; the Mass, the rosary, the sacraments, the saints.
- **Judaism.** JPS 1917 Tanakh. Hebrew words in Hebrew script. Rodkinson's 1903 Talmud translation is public domain but uneven: paraphrase the Talmud unless you're sure.
- **Islam.** Quote the Qur'an only from **Pickthall (1930)**, citing surah:ayah. Say "the Prophet Muhammad ï·º" (or "peace be upon him") the first time he's named in a script. Hadith: paraphrase and cite the collection and number (e.g. "Sahih al-Bukhari 6018"); most English hadith translations are under copyright. Arabic words in Arabic script. Don't retell popular stories that have no source in the Qur'an or the major hadith collections as if they were sourced; if you tell one, say it's a story people tell.
- **Buddhism.** Max MÃ¼ller's Dhammapada (1881); Rhys Davids for the suttas. Pali terms, with Sanskrit where it's the more familiar form (nirvana/nibbana).
- **Sikhism.** Macauliffe (1909) is public domain; modern translations of the Guru Granth Sahib (Gopal Singh, Manmohan Singh, Talib, Sant Singh Khalsa) are not. Paraphrase and cite by Ang (page) number when not using Macauliffe. Gurmukhi for words.
- **My own path (SPIRITUAL).** Draws from every tradition and from philosophy and science, **always naming the source**, never blending sources into one teaching. Public-domain options: the Tao Te Ching (Legge 1891), Marcus Aurelius (Long 1862), Epictetus (Long 1877), Seneca's letters (Gummere), Pascal (Trotter 1910), William James (1890), Emerson, Thoreau, Rumi (Nicholson 1898, Whinfield 1898), Gibran's *The Prophet* (1923). The popular Rumi lines ("out beyond ideas of wrongdoing and rightdoingâ€¦") are Coleman Barks's 1990s versions and are **not** public domain; paraphrase and credit Rumi via Nicholson, or leave them out. Modern teachers (Thich Nhat Hanh, Ram Dass, Rupert Spira, Tolle) may be named and paraphrased, never quoted.

---

## 8. Sources and translations

Every script lists its `sources`: each text it quotes or leans on, with `ref` (book chapter:verse, surah:ayah, sutta, Ang, section), `work`, `translation`, and `quoted`:
- `quoted` is the **exact** words you quoted, and `translation` must be one of the public-domain translations the validator knows: KJV, Douay-Rheims, JPS 1917, Book of Common Prayer 1662, Pickthall 1930, Rodwell 1861, Palmer 1880, Max MÃ¼ller 1881, Rhys Davids, Macauliffe 1909, Legge (1861â€“1891), Long 1862 / 1877, Trotter 1910, William James 1890, Nicholson 1898, Whinfield 1898, Gummere, Gibran 1923, Rodkinson 1903, Warrack 1901, Pusey 1838, Schaff, Lightfoot, Arnold 1885, Emerson, Thoreau. Write it like `"KJV (1769)"` or `"Pickthall 1930"`.
- `quoted: null` (with `translation: null`) means you paraphrased. Paraphrases are cited too.
- **Not public domain; never quote:** Sahih International, the NIV, ESV, NRSV, NASB, NKJV, The Message, Yusuf Ali (1934: protected in the US until 2030), Muhsin Khan, Gopal Singh, Manmohan Singh, Coleman Barks's Rumi, any modern translation of anything. If the only wording you remember comes from one of these, paraphrase.
- Keep quotations short: a verse or two. The reading comes later in the path.
- If you can't verify a fact (a date, a number, a word's root), leave it out or say "tradition says". Put anything a Keeper should double-check in `review.notes`.

---

## 9. Quality checklist (before you hand in a day)

1. Did you read the index line and the outline for this day, and yesterday's and tomorrow's?
2. Does the hook start where the listener is, or drop them into the story, within two sentences?
3. Does the teach teach one idea, with the real text quoted (and cited) or clearly paraphrased?
4. Is there at least one thing a curious person would repeat to a friend tonight?
5. Would a Keeper of this tradition recognize their faith in it, and would someone from another tradition feel welcome and not judged?
6. Does it say "Christians sayâ€¦", not "you shouldâ€¦"? Does it rank or compare anyone? Does it write a new prayer? (It must not.)
7. Is the practice doable by anyone in the time the sit allows, and phrased as an invitation?
8. Are word and carry exactly the index's? Does the review pick up yesterday, and does `tomorrow` match the next title?
9. Do the teach's screen heads make a sensible 3â€“4 step order game? Can every game item be answered from today's script?
10. Is every quotation from a public-domain translation, exact, and in `sources`? Is every uncertain claim in `review.notes`?
11. American spelling, lowercase screen strings, no filler, 430â€“640 spoken words?
12. Does `node packages/content/scripts/validate-scripts.mjs DOOR` pass with no errors? Read its warnings and fix what's real.

---

## 9a. What the year-1 audit caught (avoid these)

Fresh reviewers read 525 year-1 lessons (20%) and had to rewrite 222 of them (42%). The same problems kept coming up:

- **Templated hooks.** Almost every hook opened "Think of... / You know... Now picture...". Vary the way in: a fact, a question, a line of scripture, a scene already under way, an object.
- **Stock lines and empty uplift.** "Christians have long pondered", "here's what people often miss", "stops scholars in their tracks", "you're not alone", "doesn't have the last word". End on a concrete detail instead.
- **Unsourced superlatives and sweeping claims.** "One of the most loved lines", "and always have", "most Christians hear both". Say only what a source supports, or soften it ("for many centuries").
- **Wrong counts and dates.** "Three famous words" that are seven; a meeting placed in a year the papacy was empty; ages taken from the wrong chapter. Count and check every number.
- **Preacher's etymologies.** Don't build a day on a word origin unless a standard lexicon gives it.
- **Repeating a nearby day.** Before writing, read the scripts for the 10 days before yours (and the same theme earlier in the year), and choose a new angle, image and myth/fork item.
- **Unfair framing of another tradition.** Jewish law, Pharisees and other paths must never be the foil. Name differences between churches or schools fairly, without ranking them.
- **Overstated text claims.** When manuscripts differ, say "the King James text says", not "nobody mentioned".
- **Garbled sentences.** Read every spoken line aloud in your head once.
## 9b. The claims rule (from the year-3 process)

State no date, age, year, count, number, statistic, etymology, manuscript claim, or "most / many / every / always / all [people of a tradition]" claim unless the text you cite for that day says it directly. If a lesson seems to need one, cut it or say "tradition says" or "some readers". No superlatives ("the most loved", "the first", "the only") unless the cited text says so. Prefer the text itself over facts about the text. Never tell the listener what they feel or believe. Every lesson now gets an editor pass and an audit after writing.

## 10. Commands

```sh
node packages/content/scripts/script-brief.mjs DOOR FROM TO     # what the path promises for these days
node packages/content/scripts/validate-scripts.mjs [DOOR]       # the format check (exit 1 on any error)
node packages/content/scripts/build-lessons.mjs [--check]       # compile passing scripts into apps/app/public/lessons/
```

## 11. For a writer agent handed a batch

You'll be given a door and a run of days (20â€“70). Read this guide, the four manuscript days above, the example script, and `script-brief.mjs` for your days plus one day either side. Write one file per day in order (each day's review depends on the one before). Run the validator after every few days, fix every error, and read every warning. Don't edit any other file, don't commit, don't deploy. Report: the days written, the validator's summary line, and anything a Keeper should decide.
