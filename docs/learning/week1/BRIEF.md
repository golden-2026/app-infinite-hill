# Rebuilding a path's first camp (days 1–21)

The owner's direction (2026-10-06), learned on the Hindu path: meet people where they are. Young adults already
practice, or already use the words, but nobody explained them. Start from what they already do, say it once, keep it
light and fun, and teach for real. Don't "freak people out" on day one. Scholarly depth comes in later years.

The Hindu path is the finished model. Read it before you write:
- `docs/learning/AUDIENCE_RESEARCH.md` (the Hindu research) and `docs/learning/week1/HINDUISM.json`
- `docs/curriculum/hinduism/scripts/y1/day-0001.json` … `day-0021.json` (days 1–7 new, 8–21 moved and fixed)
- `docs/brand/MASCOT_VOICE.md`, `docs/curriculum/SCRIPT_GUIDE.md`
- the validator's rules: `packages/content/src/lesson-script.js` (`WORDS`, `FORBIDDEN`, `checkScript`)

Your path's research: `docs/learning/AUDIENCE_RESEARCH_<DOOR>.md` (its "Top 20 moments" and "A proposed first week").

## What to produce
1. Days 1–7: seven topics from the research's proposed first week (adjust if a better order appears). Reuse an existing
   camp-one lesson when it already covers the topic (move its file content to the new day and tighten it); write a new
   lesson where none fits.
2. Days 8–21: the camp's other lessons, in a sensible order. Lessons pushed out of week one move here, replacing the
   weakest or most redundant ones, so there are still exactly 21. Keep day 21 as the camp's close if it is one.
   Lighten every one of them the same way (below), but keep their content and teaching.
3. `docs/learning/week1/<DOOR>.json`, in the same shape as HINDUISM.json:
   - `door`, `note` (one line: the new order and what moved where)
   - `checkin`: 7 questions, one per day 1–7: `{ day, word (that day's word, exactly), q, options: [right, wrong, wrong], answer: 0 }`
   - `quiz`: for every day 2–21, `"N": [right meaning, wrong, wrong]` (the right answer must differ from that day's carry)
   - `bet`: day one's opening question `{ word (day 1's word), options (4), answer (one of them), reveal }`
   - `sayIt`: optional `{ "term": "how to say it", … }` for original-language words people can tap to hear
4. A final report (your reply) listing every move as `old day → new day`, every new lesson, and anything a reviewer
   should check (facts, sensitive points).

## Each lesson file
Same format as now (`ih-lesson/1`). Fixed segment order: the bell, review (not on day 1), the hook, the teach, the
practice, the word, the carry, the close. Word counts within the validator's bounds.
- `day`, `tomorrow` (next day's title), bell screen `` `DAY SEVEN.` `` (capital words), close screen
  `` `DAY 7 COUNTS.` → `TOMORROW: <NEXT TITLE IN CAPITALS>.` ``, the word screen `` `WORD — your 7th word`. ``
  and "Seventh word." style counts, all matching the NEW order.
- Every review on days 2–21 recaps the actual previous day. Fix any "on day three you…" style references inside days
  1–21 so they point at the right day.
- Practice: days 1–2 "One breath with the bell…"; days 3–7 "Three breaths with the bell…" (the app guides one breath
  on days 1–2 and three on 3–7). Days 8+ keep their sit, without "the bell holds the time".
- games (all drawn from that day's teaching): `match` (3–4 pairs, each side ≤48 chars), `myth` (2–3, mixed true and
  myth), `fork` (setup, 3 options, answer, reveal), `original` (script, say, note; or null), `trapdoor` (3 floors
  starting "what you thought:", "what it means:", "what a scholar hears:").
- Days 1–7 also get the week-one extras, exactly as on the Hindu path:
  - `story`: `{ title, text (3–6 sentences, opening with the drama, never with a book's name), source }`
  - `wrong`: `{ myth, truth }` (what most people get wrong)
  - `build`: `{ prompt, pieces, decoys, word }` (build the word from its parts, or put 3–4 steps in order with no decoys)
  - `think`: `{ setup, options (3), answer, reveal }` (an everyday dilemma; NOT on day 7, which has the check-in)
  - day 1 only: `betReveal` (the answer card for the opening question)
- `sources`: real, accurate references for every claim (exact citations live here, not in the spoken text).
- Add one review note: "Week one rebuilt 2026-10-06 from the audience research; confirm with the Keeper."

## The voice (owner's rules)
- Say it once. Adults get it the first time; no circling back to repeat the point.
- Lead with what's interesting or surprising, not the obvious.
- At most ONE named text a day in the spoken text, and only a famous one; otherwise "one of the oldest … texts".
- Stories open with the drama ("A boy is sent to Death's house…"), never "In the Katha Upanishad…".
- No homework asks ("say it inside", "try it on a friend today"). The carry is one line plus at most one plain sentence.
- No identical sign-offs: vary "That's day five." / "Day five, done." / "See you tomorrow."
- Warm, plain, American spelling, no jargon before plain English. Never rank traditions, sects or schools; never tell
  people what to believe; stay out of politics; avoid what the research lists under "What to avoid early".
- Facts must be right. When traditions differ, say "many …" / "in many families …".

## Rules for this job
- Edit ONLY `docs/curriculum/<door>/scripts/y1/day-0001.json` … `day-0021.json` and create
  `docs/learning/week1/<DOOR>.json`. Touch nothing else.
- You may run only: `node packages/content/scripts/validate-scripts.mjs` and
  `node scripts/learning/build-week1.mjs --check`. While you work, the validator will report "title/word/carry differs
  from the index" for your moved days 1–21; that's expected (the index is rebuilt after you finish). Every OTHER
  error must be fixed, and `build-week1.mjs --check` must pass.
