# Who comes to infinite hill: five personas, sixteen reasons

Two layers. **Personas** are the five kinds of people we design for, recruit the alpha from, test ads with and market
to. **Reasons** are the sixteen lines a visitor recognizes themselves in, on the homepage picker ("which one sounds
like you?", `apps/app/public/site.html` `#forwho`, Spanish in `site-es.html`) and in the sign-up question "what
brings you". Every reason belongs to exactly one persona. Add reasons freely; add a persona only when a gate's evidence
calls for it.

## The five personas

| persona | who they are | their reasons | why they matter |
|---|---|---|---|
| **The parent** | a mom or dad who wants their kids to have roots, a new parent, and the teen they sent | kids · baby · sent | likely the biggest market; having children is one of the most common reasons adults return to faith |
| **The person in a hard moment** | someone grieving, frightened by health news, or low | grief · diagnosis · hard | the most acute need; looks for help the same day; needs the most care in tone |
| **The two-faith couple** | partners, and engaged couples, whose families pray differently | partner · wedding | about 4 in 10 new marriages cross religious lines; only a many-door house serves them: our moat |
| **The returner** | someone who already practices or grew up practicing and wants it to mean more | own · roots · belonging · forgiveness · gratitude | the largest pool of people who already pray; the lessons and Keepers fit them best |
| **The searcher** | doubting, spiritual but not religious, or curious about others | god · spiritual · curious | large and growing; harder to keep, because we never argue which door is true |

**Alpha focus (sprint 1):** the parent, the person in a hard moment, and the two-faith couple. **Ad test:** one
promise per persona.

## How the reasons show

The homepage shows **eight reasons** (kids, grief, partner, hard, own, god, diagnosis, sent), in a fresh random order
on every visit, in one row (owner, 2026-10-05: the other eight were taken off the homepage; they remain sign-up answers).
Without JavaScript every card shows as a plain list. Each card's "start here" opens sign-up with `?why=<key>`, so "what brings you" is already
answered; the same answers appear in sign-up for anyone who skips the website.

Life-moment reasons (grief, baby, diagnosis, belonging, forgiveness, wedding, gratitude) also get a **for you this
week** card on Today: four or so lessons **already written** in years 1–3 of their own door, which open ahead of the
path as extras (they never record a day or move the path). The lists live in
`apps/app/src/content/life-moments.ts`. **The selection is ours, not a Keeper's: each door's Keeper must confirm or
replace it before public release.** No list adds new religious content.

## The sixteen reasons

Where they appear: **H** homepage picker card, **S** sign-up "what brings you" answer, **T** Today's "for you this
week" card; *up front* = among the eight shown first, *more* = behind "more reasons people come".

| persona | key | card line (EN) | who they are | why they come | what day 1 does | lessons / first week | care rules | where |
|---|---|---|---|---|---|---|---|---|
| The parent | `kids` | "i want my kids to know where they come from." | parent | kids / roots | a lesson side by side | the door's path; kids' track for under-13s | simple, tellable answers; companion's "parent" voice | H S · up front |
| The parent | `baby` | "we just had a baby." | new parent | life moment / kids | the door's day 1 | 2–4 lessons on welcoming a new life | warm and practical; "parent" voice | H S T · more |
| The parent | `sent` | "my parents told me to come here. 🙄" | a teen whose parents sent them | kids, from the kid's side | the door's day 1 | normal path; under 13 → a parent adds them to their table (kids' track) | light, short, never preachy | H S · up front |
| The person in a hard moment | `grief` | "someone i love died. where did they go?" | bereaved | grief | the door's day 1, gently | 4 lessons on loss | gentle start, no streak framing; Guide never promises where their person is; "hard" voice | H S T · up front |
| The person in a hard moment | `diagnosis` | "i just got scary news about my health." | frightening health news, theirs or someone close | fear | the door's day 1, gently | 4 lessons on fear, waiting and the body | gentle start, no streak framing; Guide never diagnoses, predicts or promises healing; medical questions → their doctor; "hard" voice | H S T · up front |
| The person in a hard moment | `hard` | "why does everyone else seem okay but me?" | struggling, low | fear / unhappiness | a breath, the quiet part, one line | the door's path | gentle and brief; danger → local emergency help; companion's quiet ("hard") voice | H S · up front |
| The two-faith couple | `partner` | "i want to understand their family." | partner's or in-laws' faith | learning about others | their door, taught properly | the partner's door | explain what things mean to the people who keep them; companion's "bridge" voice | H S · up front |
| The two-faith couple | `wedding` | "we're getting married, and our families pray differently." | engaged, two traditions | life moment | the door's day 1 | 2–4 lessons on marriage and wedding rites in **their own** door; the card says they can walk the other family's door too | honor both families, rank neither, never push conversion; companion's "bridge" voice; normal streak words | H S T · more |
| The returner | `own` | "i say the prayers but don't know what they mean." | practices without understanding | learning (own tradition) | a story, a few games, a breath, one line | the door's path | connect ideas to what they grew up with | H S · up front |
| The returner | `roots` | "i miss what i grew up with." | grew up in a tradition, drifted | roots / identity | a story they half remember, one breath | the door's path from day 1 | warm about memory and family, never guilt (Guide) | H S · more |
| The returner | `belonging` | "i want people around me who get it." | lonely, or wants a community | belonging | the door's day 1 | 4 lessons on gathering (sangha, minyan, langar, jumu'ah, fellowship…) + **start or join a circle ›** (Together tab) | never claim events or members that don't exist; golden hour nights are not live and are not mentioned | H S T · more |
| The returner | `forgiveness` | "i need to forgive someone. or be forgiven." | carrying a hurt or a wrong | becoming better | the door's day 1, gently | 4 lessons on forgiving and repentance (teshuvah, tawbah, confession…) | gentle start (no streak framing at sign-up); Guide never says they must reconcile or stay somewhere unsafe; danger → emergency help | H S T · more |
| The returner | `gratitude` | "i'm grateful, and i don't know who to thank." | grateful, with no one to thank | gratitude | the door's day 1 | 4 lessons on giving thanks (modeh ani, shukr, the Eucharist, Ardas in joy…) | warm; normal streak words | H S T · more |
| The searcher | `god` | "i'm not sure i believe anymore." | doubting | doubt | a story, one breath; nobody asks them to meditate | the door's path | take the question seriously, push no answer either way | H S · up front |
| The searcher | `spiritual` | "i want something real, without the rules." | spiritual, not religious | unhappiness / meaning | a few questions, then my own path | my own path (one practice here, a story there) | never blended, never pushed; each idea with its source | H · more |
| The searcher | `curious` | "what do all of them actually believe?" | curious about others | learning about others | pick any door | any door, one at a time | clear and interesting | H S · more |

Also in sign-up only (no homepage card): `calm`, "a calmer daily habit" (structure): a quieter daily practice, short
practical Guide answers.

A gentle start (grief, diagnosis, forgiveness) means: the ready screen says "go gently", no streak goal is asked after
the first lesson, Today's pill says "whenever you're ready", and day one ends with "you came. that's enough."
The streak still exists under You.

## Lessons per door (life moments)

The days below are what `life-moments.ts` lists; titles are the scripts' own. A short list means the door is thin
on that subject in years 1–3.

| reason | HINDUISM | BUDDHISM | CHRISTIANITY | CATHOLIC | JUDAISM | ISLAM | SIKHISM | SPIRITUAL |
|---|---|---|---|---|---|---|---|---|
| belonging | 20, 138, 137, 933 | 17, 319, 320, 779 | 20, 140, 337, 163 | 74, 104, 318, 36 | 18, 27, 500, 1054 | 16, 259, 369, 1040 | 13, 8, 144, 465 | 20, 17, 278, 421 |
| forgiveness | 779, 593, 199, 166 | 666, 202, 531, 857 | 7, 11, 31, 586 | 129, 135, 485, 925 | 17, 652, 120, 583 | 27, 118, 496, 634 | 259, 1054, 792, 634 | 947, 977, 978, 986 |
| wedding | 511, 510, 364, 984 | 571, 664, 30 | 52, 200, 89, 337 | 132, 35, 438, 395 | 690, 859, 276, 1049 | 531, 778, 717, 83 | 56, 246, 423, 244 | 648, 258 |
| gratitude | 153, 116, 173, 895 | 595, 593, 789, 58 | 563, 431, 153, 1059 | 128, 23, 177, 435 | 116, 109, 593, 387 | 3, 445, 188, 694 | 642, 457, 204, 2 | 9, 118, 119, 120 |

Grief, baby and diagnosis lists are in the same file.

## Open gaps (no fitting lesson in years 1–3)

- **Hinduism, baby:** no lesson on birth or naming rites (jatakarma, namakarana); two nearby lessons only.
- **Hinduism, diagnosis:** no lesson on illness or healing prayer.
- **Hinduism, forgiveness:** no lesson on kshama or prayashchitta as such; the list uses scenes from the epics and the Gita.
- **Hinduism, wedding:** no lesson on the vivaha rite itself (saptapadi, the seven steps).
- **Hinduism, gratitude:** no lesson on giving thanks as such; harvest thanks, prasad, grace before food and Govardhan stand in.
- **Buddhism, wedding:** three lessons; no lesson on a Buddhist blessing of a marriage.
- **Judaism, wedding:** no lesson on the chuppah, ketubah or seven blessings themselves.
- **Islam, baby:** no lesson on aqiqah or tahnik (the adhan in a newborn's ear is told inside day 15).
- **Islam, wedding:** no lesson on the nikah itself.
- **Spiritual, wedding:** two lessons only.

Each gap is a writing brief for a later year, to be written and Keeper-approved like every other script.

## How to add a persona

1. **Key:** add it to `WHY_KEYS` in `apps/app/src/lib/why-param.ts`.
2. **Sign-up answer:** add it to the "why" choices in `apps/app/src/content/intake.ts` and its Spanish line in
   `apps/app/src/i18n/strings/onboarding-intake.ts`.
3. **Companion and Guide:** a `companion.fact.why.<key>` line (EN and ES) in
   `apps/app/src/i18n/strings/companion.ts`; a reason line in `api/guide.js` (`PROFILE_TEXT.reason`); a companion
   voice in `personaFor` (`apps/app/src/lib/companion/shape.ts`) if it needs one.
4. **Life moment (optional):** add it to `LIFE_MOMENTS` and `FIRST_WEEK` in `apps/app/src/content/life-moments.ts`
   (only written year 1–3 days, every door, gaps written down), its `home.forYou.<key>` line (EN and ES) in
   `apps/app/src/i18n/strings/home.ts`, its mascot pose in Today (`apps/app/src/app/(tabs)/today.tsx`), and
   `gentleStart` if it should skip streak words.
5. **Homepage card:** a script like `atlas/_personas-picker2.cjs` adds the tab and panel to `site.html` (approved
   mascot art only: `packages/brand/art/guy-*.webp` or `apps/app/public/mascot/*.webp`), its group (`MOMENT` set), and
   the Spanish pairs in `atlas/mock/es.mjs`. Then, from `atlas/`: `node mock/build.mjs --apply` and
   `node mock/build.mjs --lang es --apply`.
6. **Tests:** `tests/features/why-param.test.mjs` checks every key is a sign-up answer and a picker card in both
   languages, and that every listed day is a written script.
7. **Screenshots:** `atlas/_persona-shots2.mjs` shoots the picker and Today at 1440 and 390 wide.
