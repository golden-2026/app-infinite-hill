# Who comes to infinite hill: the fifteen personas

Each persona is one card on the homepage picker ("which one sounds like you?", `apps/app/public/site.html` `#forwho`,
Spanish in `site-es.html`). Its "start here" opens sign-up with `?why=<key>`, so the "what brings you" question is
already answered. The same answers appear in the sign-up question for anyone who skips the website.

The picker shows the cards in two groups, behind two small toggles: **where i'm at** (8 cards) and **a life moment**
(7 cards). Without JavaScript every card shows as a plain list.

"Life moment" personas (grief, baby, diagnosis, belonging, forgiveness, wedding, gratitude) also get a **for you this
week** card on Today: four or so lessons that are **already written** in years 1–3 of their own door, which open ahead
of the path as extras (they never record a day or move the path). The lists live in
`apps/app/src/content/life-moments.ts`. **The selection is ours, not a Keeper's: each door's Keeper must confirm or
replace it before public release.** No list adds new religious content.

## The fifteen

Where they appear: **H** homepage picker card, **S** sign-up "what brings you" answer, **T** Today's "for you this
week" card. Group: *at* = where i'm at, *moment* = a life moment.

| key | card line (EN) | who they are | why they come | what day 1 does | lessons / first week | care rules | where |
|---|---|---|---|---|---|---|---|
| `roots` | "i miss what i grew up with." | grew up in a tradition, drifted | roots / identity | a story they half remember, one breath | the door's path from day 1 | warm about memory and family, never guilt (Guide) | H S · at |
| `own` | "i say the prayers but don't know what they mean." | practices without understanding | learning (own tradition) | a story, a few games, a breath, one line | the door's path | connect ideas to what they grew up with | H S · at |
| `spiritual` | "i want something real, without the rules." | spiritual, not religious | unhappiness / meaning | a few questions, then my own path | my own path (one practice here, a story there) | never blended, never pushed; each idea with its source | H · at (a first-step answer, not a "why") |
| `god` | "i'm not sure i believe anymore." | doubting | doubt | a story, one breath; nobody asks them to meditate | the door's path | take the question seriously, push no answer either way | H S · at |
| `hard` | "why does everyone else seem okay but me?" | struggling, low | fear / unhappiness | a breath, the quiet part, one line | the door's path | gentle and brief; danger → local emergency help; companion's quiet ("hard") voice | H S · at |
| `belonging` | "i want people around me who get it." | lonely, or wants a community | belonging | the door's day 1 | 4 lessons on gathering (sangha, minyan, langar, jumu'ah, fellowship…) + **start or join a circle ›** (Together tab) | never claim events or members that don't exist; golden hour nights are not live and are not mentioned | H S T · at |
| `forgiveness` | "i need to forgive someone. or be forgiven." | carrying a hurt or a wrong | becoming better | the door's day 1, gently | 4 lessons on forgiving and repentance (teshuvah, tawbah, confession…) | gentle start (no streak framing at sign-up); Guide never says they must reconcile or stay somewhere unsafe; danger → emergency help | H S T · at |
| `curious` | "what do all of them actually believe?" | curious about others | learning about others | pick any door | any door, one at a time | clear and interesting | H S · at |
| `partner` | "i want to understand their family." | partner's or in-laws' faith | learning about others | their door, taught properly | the partner's door | explain what things mean to the people who keep them; companion's "bridge" voice | H S · moment |
| `wedding` | "we're getting married, and our families pray differently." | engaged, two traditions | life moment | the door's day 1 | 2–4 lessons on marriage and wedding rites in **their own** door; the card says they can walk the other family's door too | honor both families, rank neither, never push conversion; companion's "bridge" voice; normal streak words | H S T · moment |
| `kids` | "i want my kids to know where they come from." | parent | kids / roots | a lesson side by side | the door's path; kids' track for under-13s | simple, tellable answers; companion's "parent" voice | H S · moment |
| `baby` | "we just had a baby." | new parent | life moment / kids | the door's day 1 | 2–4 lessons on welcoming a new life | warm and practical; "parent" voice | H S T · moment |
| `gratitude` | "i'm grateful, and i don't know who to thank." | grateful, with no one to thank | gratitude | the door's day 1 | 4 lessons on giving thanks (modeh ani, shukr, the Eucharist, Ardas in joy…) | warm; normal streak words | H S T · moment |
| `grief` | "someone i love died. where did they go?" | bereaved | grief | the door's day 1, gently | 4 lessons on loss | gentle start, no streak framing; Guide never promises where their person is; "hard" voice | H S T · moment |
| `diagnosis` | "i just got scary news about my health." | frightening health news, theirs or someone close | fear | the door's day 1, gently | 4 lessons on fear, waiting and the body | gentle start, no streak framing; Guide never diagnoses, predicts or promises healing; medical questions → their doctor; "hard" voice | H S T · moment |

Also in sign-up only (no homepage card): `calm`, "a calmer daily habit" (structure): a quieter daily practice, short
practical Guide answers.

A gentle start (grief, diagnosis, forgiveness) means: the ready screen says "go gently", no streak goal is asked after
the first lesson, Today's pill says "whenever you're ready", and day one ends with "you came. that's enough."
The streak still exists under You.

## Lessons per door (life moments)

The days below are what `life-moments.ts` lists; titles are the scripts' own. A short list means the door is thin
on that subject in years 1–3.

| persona | HINDUISM | BUDDHISM | CHRISTIANITY | CATHOLIC | JUDAISM | ISLAM | SIKHISM | SPIRITUAL |
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
