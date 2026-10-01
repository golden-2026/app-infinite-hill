# Writing the kids' track

*For writers and Keepers. Every kids' lesson is a DRAFT until that tradition's Keeper signs it off. Nothing here is approved for public release.*

A child under 13 added at **You → your table** sits in kid mode. Kid mode never plays the grown-up path: it plays the door's **kids' set**, 21 story lessons for ages 6–12, in English and Spanish. After day 21 the set starts again from story 1 until the next set is written.

Files: `packages/content/kids/<door>.json` (lowercase door: `hinduism`, `judaism`, `islam`, `christianity`, `catholic`, `sikhism`, `buddhism`, `spiritual`).

```sh
node packages/content/scripts/validate-kids.mjs [DOOR]   # the format check (exit 1 on any error)
node packages/content/scripts/build-kids.mjs             # compile into packages/content/generated/kids.js (the app bundles it)
```

## What a kids' lesson is

The tradition's best-loved stories, told simply and warmly, one story a day. The app plays them in this order:

1. **the story** in four short pictures (`story`: 4 beats, each a `head` and 18–70 words of `text`; 100–240 words in all). The mascot tells it in a speech bubble.
2. **put the story in order**: the four heads, shuffled. So each head must make sense alone and the order must be learnable from the story.
3. **one game**: `match` on odd days (3 pairs, each side 34 characters or fewer), `truth` on even days ("did it happen in the story?": 3 items, `[claim, true|false, reveal]`, at least one of each).
4. **the word**: `word` and `means` ("today's word: Ganesha. the elephant-headed god of new beginnings.").
5. **the breath**: one line (`breath`, 8–40 words) inviting four slow breaths, about 30 seconds, with a picture from the story. Never a prayer.
6. **your line**: `carry`, 12 words or fewer, something a child can say and do today.
7. **the tally**, where the grown-up holding the phone sees **for grown-ups**: `grownups.source` (where the story comes from, in plain words) and `grownups.ask` (one question to ask together).

## Rules

Everything in `SCRIPT_GUIDE.md` §3 (voice), §8 (sources) and §9a–9b (the audit's lessons and the claims rule) applies. For children, also:

- **Warm, plain, short sentences.** Words a six-year-old knows, or explained the first time. Lowercase titles, heads, carries and game items, except names and "God".
- **No fear, no gore, no guilt.** Tell the gentlest version a family would tell at bedtime. Battles, deaths and punishments are left out or named in a few calm words. Nobody is "bad"; nobody is told they'll be punished.
- **Describe, don't preach.** "Hindus tell this story at Diwali", "in the story", "Muslims say". A carry can invite a small kind act; it never tells a child what to believe.
- **Never invent a prayer.** A real one may be named or described.
- **Quote only public-domain translations, exactly, and list them in `sources`.** Otherwise paraphrase with `translation: null, quoted: null`. Extra public-domain options for kids: Aesop (`Townsend 1867`), the Jataka (`Cowell 1895`), Jacobs's *Indian Fairy Tales* (`Jacobs 1894`).
- **Islam:** God and the prophets are never characters: no lines of dialogue spoken by them, no descriptions of how they looked, no pictures. Tell what they did, and what the Prophet Muhammad ﷺ said only as a reported, paraphrased narration with its collection and number. Write "the Prophet Muhammad ﷺ" the first time and "(peace be upon him)" after other prophets' names the first time. Use only stories from the Qur'an or the major hadith collections; a popular story without a sound source is left out (the cat on the Prophet's sleeve, for example, has no sound source).
- **Sikhism:** the Gurus are told about, not given invented speeches. Janamsakhi stories are named as such ("the janamsakhis, the old life-stories of Guru Nanak, tell…").
- **Never compare or rank traditions.** "My own path" names its source for every tale and never blends sources into one teaching.
- **Spanish** (`es`) has the same shape as `en`: neutral Latin American Spanish, "tú", the same lowercase voice, the same number of beats, match pairs in the same order, the same true/false answers.
- **Anything a Keeper should check** goes in the lesson's `notes` (they never ship).

## The shape

```jsonc
{
  "format": "ih-kids/1",
  "door": "HINDUISM",
  "review": { "status": "pending", "keeper": null, "notes": ["anything about the whole set"] },
  "lessons": [
    {
      "day": 1,
      "key": "ganesha-race",                 // a short slug, unique in the file
      "game": "match",                       // "match" on odd days, "truth" on even days
      "en": {
        "title": "Ganesha and the race around the world",
        "word": "Ganesha",
        "means": "the elephant-headed god of new beginnings",
        "story": [ { "head": "a mango for the winner", "text": "…" }, { "head": "…", "text": "…" }, { "head": "…", "text": "…" }, { "head": "…", "text": "…" } ],
        "game": { "prompt": "who did what? tap the pairs.", "pairs": [["Kartikeya", "flew off on his peacock"], ["Ganesha", "walked around his parents"], ["the mango", "the prize for the winner"]] },
        // or, on even days: "game": { "items": [["Hanuman leaped across the sea.", true, "yes: one huge leap, all the way to Lanka."], ["…", false, "…"], ["…", true, "…"]] }
        "breath": "…",
        "carry": "my family is my whole world",
        "grownups": { "source": "…", "ask": "…?" }
      },
      "es": { /* the same shape, in Spanish */ },
      "sources": [ { "ref": "…", "work": "…", "translation": null, "quoted": null } ],
      "notes": ["for the Keeper: …"]
    }
  ]
}
```
