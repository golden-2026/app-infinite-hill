# Job 3 brief: the new lesson recipe (chat, tap-for-meaning, old words)

Owner, 2026-10-07, after studying Duolingo: lessons should break the teaching up with questions, let you tap a word to
see what it means, and mix old words back in. The engine is `packages/content/src/v2.js`; a lesson turns on the new
recipe when its script has `games.chat`. The finished example is `docs/curriculum/hinduism/scripts/y1/day-0030.json`
(read it first).

You add data to `games` only. Never change the voice, segments, title, word, carry, sources or any other game.

## games.chat (one per lesson): "complete the chat"

```json
"chat": { "who": "your little cousin", "says": "<their question>", "options": ["<right>", "<wrong>", "<wrong>"],
          "answer": 0, "meaning": "<why the right one is right>" }
```

- **who**: an ordinary person in the learner's life (a friend, a coworker, your kid, your grandmother, a neighbor, a
  classmate). Vary it from day to day. Never a clergy member, never a named real person.
- **says**: a real, warm question that someone who hasn't heard the lesson might ask. Under 20 words. It tests the
  lesson's main idea, not a side detail. Curious, never hostile or mocking.
- **options**: three replies the learner could send. Put the right one first (the app shuffles them). The right
  reply comes only from what the lesson teaches. The two wrong ones are believable misunderstandings of this lesson
  (a common mix-up, a half-truth), never jokes or silly answers, and never something another tradition teaches as
  true. All three are roughly the same length; the right one must not be the longest by much. Each under 22 words.
- **meaning**: one or two sentences, under 30 words, taken from the lesson: why the right reply is right.
- Voice: warm and plain, as in `docs/brand/MASCOT_VOICE.md`. Respectful to every tradition.

## games.gloss: "tap a word for its meaning"

```json
"gloss": { "<term exactly as it appears>": { "meaning": "...", "script": "...", "say": "..." } }
```

- 3 to 6 terms that appear, spelled exactly the same, in the lesson's spoken text (`segments[].voice`). Pick names,
  places, books and words from another language that a newcomer might not know (Hanuman, Lanka, minyan, Ummah,
  Vaisakhi, Magnificat). Skip everyday English words.
- **meaning**: under 14 words, plain, true to the lesson and its sources. No new claims.
- **script**: the term in its original script, only when you are sure of the standard spelling: Devanagari for
  Sanskrit or Hindi (Hindu), Gurmukhi for Punjabi (Sikh), Hebrew (Jewish), Arabic (Muslim), and Pali or Sanskrit in
  Devanagari only if certain (Buddhist). For English names and for Christian, Catholic and Simply Spiritual terms,
  usually leave it out (Greek or Latin only if certain). **If unsure, leave `script` out. Never guess.**
- **say**: a simple English sound-out with the stressed part in capitals ("JAHM-buh-vahn"). Leave it out for plain
  English words.

## games.recall (already filled by machine)

`scripts/learning/add-recall.mjs` has already put two earlier words into the pairs. Keep them unless a meaning reads
badly out of context (too blunt, too vague, or a fragment such as "the song"). In that case rewrite the meaning
(under 42 characters, true to the earlier lesson) or swap in another word from that earlier lesson's day.

## Review note

Append to `review.notes`:
`"2026-10-07 (job 3): new recipe data added (chat, gloss, recall); confirm the chat reply, glosses, scripts and
pronunciations with the Keeper."`

## Check before you finish

- Edit with a small node script that reads the JSON, sets `games.chat`, `games.gloss`, `games.recall` and the note,
  and writes it back with the same indentation (2 spaces) and a trailing newline.
- Run `node packages/content/scripts/validate-scripts.mjs` and make sure your files pass.
- Run `node -e "const {planDay}=require('./packages/content/src/index.js')"`. It's ESM, so use
  `node --input-type=module -e "import {planDay} from './packages/content/src/index.js'; ..."` and check that each
  lesson plans with a `chat` step.
