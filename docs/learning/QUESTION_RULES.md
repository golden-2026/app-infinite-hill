# Question rules: the placement and review question bank

How every question in the learning engine is written, checked and scored. Owner decisions (2026-10-03): placement
first, Hinduism as the pilot door, answers hidden until the end of the check, and an outside instructional designer or
test designer reviews these rules before the bank is written at scale.

Status: **draft for outside review.** Nothing here is built yet. The current bank
(`apps/app/src/content/placement-bank.ts`) is generated from lesson game items and has the problems listed in
`docs/review-kit/claude-baseline.md` ("Placement: what the simulation shows").

## 1. What the bank is for

One bank serves three jobs:

1. **Placement**: the "where are you?" check finds where someone really is on a door's path (any stop, years 1 to 5).
2. **Walk-back**: if a placed learner keeps missing, the same items confirm the move back.
3. **Review**: items from earlier stretches come back inside later lessons, spaced out over weeks and months.

It tests **knowledge and understanding of a tradition, never belief or practice**. Nobody is asked whether they pray,
believe or observe. Getting a question wrong never means someone is a worse member of their faith.

## 2. Size and coverage

- **Stops.** The path is cut into stops: the start of each year-one camp (5), then four stretches per later year. With
  years 1 to 3 written that is 13 stops per door; years 4 and 5 add 8 more.
- **Per stop: 8 items** (today: 1 to 3). 6 multiple choice, 2 short "explain it" items (§6).
- **Spread.** Items come from across the stretch (early, middle and late lessons), never more than 2 from one lesson.
- **Mix.** In each stop: at least 2 *recognize*, 3 *understand*, 1 *apply* (§4).
- **Every door, including Simply Spiritual** (today it has none). For Simply Spiritual, items test the sources it
  teaches (named thinker, text or tradition), never a personal philosophy.
- **First build (pilot):** Hinduism, 13 stops × 8 = 104 items. Then the other seven doors (about 730 more). Years 4 and
  5 add about 600 when those years ship.
- **Spanish:** every item gets a Spanish twin, checked like any other text (`atlas/mock/es.mjs` rules: neutral Latin
  American Spanish, "tú", no strengthening).

## 3. The item record

```
id          HINDUISM-s04-03            door, stop, number; never reused after retirement
door, stop  HINDUISM, 4
day         212                        the lesson it comes from (for review timing and the source link)
level       recognize | understand | apply
difficulty  1–5                        writer's estimate; replaced by measured difficulty after the alpha (§8)
kind        choice | explain
stem        "In the Mandukya Upanishad, what does the fourth part of om stand for?"
options     4 for choice items (the right one + 3 wrong); none for explain items
answer      index of the right option
why         one or two sentences: why it's right, with its source (shown at the end of the check)
source      "Mandukya Upanishad 12"     a named text, verse, teacher or rite
rubric      explain items only (§6)
status      draft | checked | keeper-approved | retired
es          { stem, options, why }       the Spanish twin
```

## 4. Levels

| level | what it asks | example (Hinduism) |
|---|---|---|
| recognize | name or identify something taught | "Which sound is said to hold waking, dreaming and deep sleep?" |
| understand | explain what it means or why | "Why does the Mandukya say the fourth part of om has no sound?" |
| apply | use the idea in a new case the lesson didn't show | "A friend says namaste only means hello. What would the word itself add?" |

Placement leans on *understand* and *apply*, because they separate someone who knows a tradition from someone who
memorized our lesson's phrasing.

## 5. Writing a multiple-choice item

**The stem**
- One clear question, answerable without seeing the options.
- Names its anchor (person, text, place, rite) so it stands on its own.
- Uses the tradition's own terms with a plain gloss, never our lesson's private phrasing. Test: *someone who knows the
  tradition well but has never opened the app should get it right.*
- No negatives ("which is NOT…"), no "all/none of the above", no trick wording.
- Never asks about feelings, opinions, what the learner would do, or "in today's lesson".

**The right answer**
- Right according to the tradition's own sources, on every major reading. If schools disagree, either name the school
  in the stem ("According to Advaita Vedanta…") or don't use the item.

**The wrong answers (distractors)**
- **Plausible.** Each one is a real misunderstanding a learner might hold, a near neighbour from the same tradition
  (another figure, text, festival, term), or the right idea attached to the wrong source. No silly options.
- **Clearly wrong.** Not partly true, not true under another reading, not true of a different moment in the same
  story. (Today's failure: "Vali's son, sent as the last messenger" offered as *wrong* for Angada, though it is true.)
- **Never from another tradition** used as a foil, and never mocking anyone's belief.

**Form, so test-wise guessing doesn't work**
- All four options within about 20% of each other in length; the right one is the longest in no more than a quarter
  of a door's items (today: 68%).
- Same grammar and shape across options (all nouns, or all full clauses).
- No word from the stem repeated only in the right option.
- The right option's position is random when shown (the screen shuffles); in the stored record it is spread evenly.
- No "always", "never", "only" in wrong options only.

## 6. Writing an "explain it" item

Used once before the check places someone more than a year ahead, and later in review.

- One open question, answerable in one or two sentences: "In your own words, what is the Gita's answer to Arjuna's
  refusal to fight?"
- A **rubric** of 2 to 4 key points, with what counts and what doesn't, written so two reviewers would score the same
  answer the same way. Example:
  - names duty or dharma as Krishna's answer (required)
  - says the action is done without clinging to its results (required)
  - mentions the self/atman not being killed (optional, strengthens)
- The AI grades against the rubric only: *met / partly / not yet*. It never grades spelling, style or belief, and it
  explains kindly. If no AI is available, the check falls back to two extra multiple-choice items from that stop.
- Answers are not stored beyond the grade (privacy rules: no Guide questions or free text kept).

## 7. How each item is checked before it ships

1. **Blind solve.** A separate reviewer (a different AI run, never the writer) answers the item without the key, using
   the tradition's sources. If it picks another option, or finds two defensible answers, the item is fixed or dropped.
2. **Expert-outsider test.** The same blind solver is told to answer as a scholar who has never seen our lessons. Items
   that need our phrasing fail.
3. **Form check (automatic).** Length spread, longest-is-right rate, position balance, banned words, duplicates across
   the bank, Spanish twin present.
4. **Tone check.** Read as a grieving person, a teen dragged in, a convert, a lifelong practitioner: nothing shaming,
   nothing that ranks traditions.
5. **Keeper review** before public release (as with every lesson): the Keeper can fix or veto any item.

An item ships to the alpha at status `checked`; to the public only at `keeper-approved`.

## 8. How difficulty gets measured

- **Start:** the writer's 1–5 estimate, sanity-checked by where the item's lesson sits on the path.
- **After the alpha:** fit a simple item-response model (the standard method behind adaptive tests like the GRE) to
  real anonymous answers: each item gets a measured difficulty and how well it separates people who know the stretch
  from those who don't. Items that don't separate, or that most experts miss, are rewritten or retired.
- Only anonymous answer-correct data is used, bucketed by stop; no names, no free text.

## 9. Quality gates (the fake test-takers)

A simulator (extending `atlas/review-kit/placement-sim.mjs`) runs the check thousands of times per door with
simulated learners. **A door's bank ships only if:**

| simulated learner | must happen |
|---|---|
| total beginner | starts at day 1 in 9 of 10 runs or more |
| random guesser | starts at day 1 in 9 of 10 runs or more; never past camp 2 |
| always picks the longest answer | does no better than the random guesser |
| always picks the same position | does no better than the random guesser |
| knows exactly stops 1–k | placed at stop k or k−1 in 9 of 10 runs |
| expert outsider (blind-solver answers) | placed within one stop of where an expert should be |
| takes it twice | lands within one stop both times (test-retest), with no repeated questions |

## 10. What the check does with the items (summary; full design in the placement build)

- Picks each next item for the most information about where the learner is (adaptive testing), not a fixed order.
- Stops when it is confident, usually under 12 items; never more than 15.
- Never shows an item the learner has already seen on this device, including after "back" or a restart.
- Hides right answers during the check; at the end shows "here's what you knew" with each item's `why` and source.
- Before a jump of more than a year: one explain item (§6).
- Keeps the gentle walk-back after placement, with no failure language.

## 11. Open questions for the outside reviewer

1. Is 8 items per stop enough for stable placement, or should the pilot write 10 and keep the best 8?
2. One-parameter or two-parameter item model for the alpha's sample size (likely a few hundred learners per door)?
3. Is one explain item before a big jump the right gate, or should it be two short ones?
4. How should "not sure" answers count: as wrong, or as a separate signal?
5. Any risks in using AI-graded short answers for placement decisions with a religious audience?
