# The Review Kit: is our teaching actually good?

This folder answers one question honestly: **are Infinite Hill's lessons, Guide and placement check good, or are they
basic and not well thought through?** Nobody inside the company, and no AI, can settle that alone. So the kit hands the
same material to four kinds of people, each spending about an hour, and compares what they say.

Everything here is a draft for private review. The lessons are not approved for public release (see
`docs/CONTENT_RELEASE.md`). Ask every reviewer not to share the files.

## What's in the folder

| File | What it is | Who uses it |
|---|---|---|
| `rubric.md` | The scoring sheet: six 1-to-5 scores and "the single biggest problem" | everyone who scores lessons |
| `lessons/<door>.md` | 10 real lessons per tradition (80 in all), laid out to read, numbered "Hinduism #4" etc. | scholars, the instructional designer, test users |
| `side-by-side.md` | 4 famous stories: our lesson next to a well-known outside resource, plus blind questions | test users (and scholars, optional) |
| `guide-and-placement.md` | How to test the Guide (30 test questions) and the placement check (scripted test-takers) | test users, the owner, a helper |
| `claude-baseline.md` | Claude's own scores of all 80 lessons and its read of the Guide, written before any expert looks | the owner, for comparison later |

The 10 lessons per tradition are the **same day numbers on every door** (days 1, 7, 60, 180, 300, 420, 514, 640, 820
and 1,000), chosen by a fixed rule before anyone read them, so no one cherry-picked the good ones. They cover the first
day, the end of week one, all three years, a mid-year-two lesson and a year-three lesson.

## Who does what

| Who | How many | Time | What they do |
|---|---|---|---|
| **A scholar for each tradition** | 8 (one per door; Christianity and Catholic can share one person if needed) | about 1 hour, up to 3 to 4 if paid for a deeper check | Reads their door's 10 lessons, scores each with the rubric, writes the biggest problem. Deeper option: checks the folded "notes the writers left for a scholar" under each lesson (those are the facts the writers were least sure of). |
| **An instructional designer** | 1 | 2 to 3 hours | Reads two doors (suggest Hinduism and Judaism), scores mainly "depth" and "learning design", reads the placement section of `guide-and-placement.md`, and answers: "does this build real understanding over months, or is it a nice daily fact?" |
| **Test users** | 8 to 15 ordinary people, mixed: some from each faith, some with none | about 1 hour each | Do 3 lessons in the app on their own door, do the blind side-by-side (`side-by-side.md`), ask the Guide 5 of the test questions, take the placement check honestly. |
| **Claude (already done)** | 1 | done | `claude-baseline.md`. Used only to compare: where Claude and the experts agree, believe it; where they disagree, believe the experts. |

**Keep reviewers blind.** Don't show anyone Claude's scores, or another reviewer's scores, before they hand theirs in.

### Sending it out

Turn the files into PDFs or paste them into a shared doc. Each scholar gets: `rubric.md` plus their own door's file.
The instructional designer gets: `rubric.md`, two door files and `guide-and-placement.md`. Test users get: a link to
the app, `side-by-side.md`, and a short instruction (in `guide-and-placement.md`).

## How results are recorded

Use one shared spreadsheet with one row per lesson score. Columns:

`reviewer name | role (scholar / designer / test user / Claude) | door | lesson # | accuracy | depth | memorable | insider respect | voice | learning design | biggest problem (words)`

Guide results and placement results have their own tables in `guide-and-placement.md`. Copy those into two more tabs of
the same spreadsheet. Claude's scores from `claude-baseline.md` go in as the first 80 rows so the comparison is ready.

## What the scores mean

Scores are 1 to 5 (see `rubric.md`). Average them per door and per dimension, using **the scholars' scores** for
accuracy and insider respect, and **the designer's** for depth and learning design.

**Good enough for a private alpha (keep going, fix the listed problems):**
- Scholars average **3.5 or higher on accuracy and on insider respect** for every door, and **no lesson gets a 1 on
  accuracy** (a 1 means a real error a believer would find wrong or hurtful).
- Average of all six dimensions is **3.3 or higher**, and no dimension averages below **2.8**.
- In the blind side-by-side, test users pick ours or call it a tie **at least 4 times in 10**. (We're up against some of
  the best free teaching in the world, so losing some is expected.)
- The Guide passes **at least 26 of 30** test questions, and passes **both safety cases** (F3, "I don't want to be here
  anymore", and D2, the antisemitic myth) every time.
- Placement: a beginner starts at day 1, a real expert lands in year 2 or 3, and guessers rarely skip camp one.

**Fix specific things (the way lessons are made is fine, but parts need work):**
- Accuracy and insider respect are fine, but one or two other dimensions average **2.5 to 3.3**, or the same "biggest
  problem" is named by three or more reviewers. Fix that problem across all lessons before alpha.

**Rewrite how lessons are made (stop and rethink the process, not just edit):**
- Any door averages **below 3.0 on accuracy or insider respect** from its scholar, or **2 or more of a door's 10
  lessons** get a 1 on accuracy.
- Depth or learning design averages **below 2.5** from the instructional designer.
- Test users prefer the outside resource **7 or more times in 10**.
- More than half the reviewers name the same core problem (for example "it's a nice fact a day, not real teaching").

## Job posts you can paste anywhere

### For tradition scholars (paid reviewers)

> **Paid review: check 10 short religious lessons in your tradition ($30 to $60 an hour, 2 to 4 hours, remote)**
>
> We're a small team building a daily app of short (about 6 minute) lessons on world religions and spiritual practice:
> Christianity, Catholicism, Judaism, Islam, Hinduism, Buddhism, Sikhism, and a general "spiritual" track. Before
> anyone else sees them, we want an honest outside check.
>
> We're looking for a graduate student in religious studies, theology or a related field, or a seminary, yeshiva,
> madrasa or divinity student, who knows one of these traditions well, ideally from both study and practice.
>
> You'll read 10 sample lessons in your tradition, score each one on a simple 1-to-5 sheet (accuracy, depth, how
> memorable it is, whether a practitioner would feel it was taught properly, tone, and how well it builds over time),
> and tell us the single biggest problem. If you have more time, we'll pay you to check a list of specific facts the
> writers flagged as uncertain. Blunt criticism is exactly what we're paying for.
>
> Pay: $30 to $60 an hour depending on experience, 2 to 4 hours, paid on delivery. Please reply with your tradition,
> your program, and one sentence on your background.

Good places to post: religious studies and divinity school job boards and email lists (for example Harvard Divinity
School, Yale Divinity School, Union Theological Seminary, the Graduate Theological Union, Hebrew Union College, Hartford
International University), Hindu, Buddhist and Sikh studies programs, and Upwork.

### For an instructional designer

> **Paid review: is this daily learning app actually teaching anything? (a few hours, remote)**
>
> We're building a daily app of short lessons on world religions. Each day is about 6 minutes: a spoken story or
> teaching, a short practice, a line to remember, and a few quick games. There are five years of daily lessons per
> tradition, and a short quiz that places people who already know a lot further along the path.
>
> We'd like a learning-design expert (a PhD or doctoral student in education, learning sciences or instructional
> design, or an experienced course designer) to tell us honestly whether this builds real understanding over months, or
> just delivers a pleasant fact a day. You'll read about 20 sample lessons, score them on a short sheet (we care most
> about depth, practice, review and how lessons build on each other), look at how the placement quiz works, and send us
> your top three changes.
>
> Pay: $60 to $100 an hour, about 3 hours. Please reply with a line about your background and one course or learning
> product you've designed or studied.

## A note on Claude's own scores

Claude wrote much of this material (through writing workflows), so Claude grading it is like a student grading their own
homework. `claude-baseline.md` tries hard to be critical, and it found real problems, but treat it as a first draft of
the review, not the review.
