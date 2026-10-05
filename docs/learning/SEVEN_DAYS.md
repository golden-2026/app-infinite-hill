# The first seven days: Hindu parents

Owner decision (2026-10-04): the first user is **Hindu parents who want their kids to know where they come from**
(persona "the parent", reason `kids`, door Hinduism). Everything in the alpha is judged by one question: *does this
week make them come back on their own?* Other doors, couples, circles, plans and gifts stay built but switched off for
the alpha.

## The promise

> **In one week, you'll understand seven things your family already says and does, and you'll have a five-minute
> habit you can share with your kids.**

Every day keeps that promise: something they already know from home, what's inside it, one thing to do, one line to
tell their child tonight.

## The week

All seven are lessons **already written** (years 1–3), shown in this order as the `kids` reason's first week
(`apps/app/src/content/life-moments.ts`, the same way grief and wedding get theirs). No new religious content.
Panditji (and later the Keeper) reviews these seven before the alpha.

| day | lesson (existing day) | what they already know | what's inside it | do (not imagine) | tonight with your kids (from the kids' set) |
|---|---|---|---|---|---|
| 1 | namaste (day 1) | the greeting | "I bow to you": the light in me sees the light in you | greet one person with namaste, meaning it | greet each other with namaste at dinner |
| 2 | om (day 2) | the sound at the start of prayers and yoga | three sounds and a silence: waking, dreaming, sleep, and what's beneath | one long om, out loud or humming | hum one om together before bed |
| 3 | pranam (day 5) | touching a grandparent's feet | bowing to what came before you | call or bow to one elder today | tell them who their great-grandparents were |
| 4 | Ganesha (day 6) | the elephant god at every doorway | clear the road, then begin | pause at one doorway before starting something | the race around the world (kids' story 1) |
| 5 | arti (day 14) | the lamp waved at the end of puja | light passed hand to hand | light a candle or lamp; pass your hand over it | Rama comes home and the lamps are lit (kids' story 4) |
| 6 | puja (day 8) | what grandmother was doing at the shelf | attention is an offering | offer one ordinary thing full attention | let them pick one thing to honor today |
| 7 | **your week** (new, no new content) | the six words they now own | see below | teach one word to your child | the "seven things" card, to share |

Why this order: it starts with what everyone does without thinking (a greeting, a sound), moves to family (elders),
then to the gods and rituals they see at home, and ends with puja, which pulls the week together. Ganesha comes before
any "beginning" lesson, as tradition does. If Panditji prefers a different six, the list is one line of code.

## What changes in each of these seven lessons

From the outside review (docs/review-kit) and ChatGPT's notes, applied to these seven first:
- **A game in the middle**, not only at the start (day one now has the pairs game; the other six get theirs the same way).
- **Review that builds**: each day's opening asks about one of the earlier days, not just yesterday (day 4 asks about
  namaste; day 6 about om). Day 7 asks about all six.
- **A practice you do**, not one you imagine (the table's "do" column). The fixed ending "the bell holds the time" is
  replaced in these seven.
- **The ending stays honest**: no life tip that shrinks the teaching; the "tonight with your kids" line takes that place.
- **Five minutes**: if a lesson runs long, its reading screens are merged, not cut.

## Day 7: "your week"

A short session built from the six days, not new teaching:
1. **Six quick recalls**, one per day, from the Hinduism question bank's first stop (docs/learning/bank), answers shown
   at the end.
2. **"Seven things you understand now"**: the six words and the habit itself, as one card they can keep or share with
   family (no names, no streak shown to others).
3. **One thing to teach**: pick one word to teach your child tonight.
4. **What's next, offered, never pushed**: the path continues from day 9 at the same five minutes, or a gentle reminder
   time.

## Keep going (owner, 2026-10-04)
After any day, people can continue straight to the next one ("keep going: day N →"). The streak still counts one
day per calendar day, and look-back questions still reach back to earlier days.

## Switched off for the alpha

Other doors (visible as "coming soon" or hidden, owner's choice), couple features, circles, plans and gifts, the
sampler week. The Guide stays on (it's how parents ask "how do I explain this to my kid?"). Kids' track stays on for
parents who add a child.

## What we measure (anonymous, as today: no names, no answers)

| number | what it tells us | where it comes from |
|---|---|---|
| came back on day 2 | did day one earn a second visit | pulse counts (api/pulse.js) |
| reached day 7 | did the week hold | pulse counts |
| "did it land?" answers | which days are weak | the existing end-of-lesson question |
| shared the day-7 card | did it reach the kids and family | one anonymous event |
| 5 conversations | why, in their words | owner interviews at day 7 |

The targets are the owner's to set before the alpha starts (for example: at least half come back on day 2, at least a
third reach day 7). Real numbers only; nothing shown to users until they're above a threshold.

## The alpha

10–20 Hindu parents from Panditji's community and the owner's circle, invited by link. Two weeks: one week to walk it,
one week of interviews and fixes. Then decide: widen to more parents, or fix the week and run again.

## Build list (after the Tuesday reset; small)

1. `kids` reason's first week: the six days above, in order, plus day 7 (life-moments.ts, as for grief/wedding).
2. A mid-lesson game and cross-day review in the six lessons (script edits, validated).
3. "Do" practices and "tonight with your kids" endings in the six lessons, written in the lesson's own words, for
   Panditji's review.
4. Day 7 session: recalls from the bank, the "seven things" card, teach-one, what's next.
5. The alpha switch: hides the switched-off features for invited alpha users.
6. Day-2 and day-7 return counts in the existing anonymous pulse.
7. Screenshots of all seven days to the owner, then Panditji's review, then live.

Estimated cost: roughly $40–80 of usage, about two working sessions.
