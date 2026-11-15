# Wave-1 cinema films: opening audit (2026-11-08)

Internal. Nothing edited, no art made, nothing deployed.

**Scope:** the 55 wave-1 films that have a `cinema` look (`art/sacred/<id>/looks/cinema/<id>-1..6.webp`). All 55 are new films. Each one's shot-1 caption lives in `prototypes/greybox/films/wave1/specs/<door>-<day>.json` at `shots[0].caption`. `episodes/c/films.mjs` copies it into `episodes/c/films.json`. Reused lesson films (`lessons/<id>.json`) have no cinema look, so they are out of scope.

**Standard:** a viewer must be hooked within 7 seconds. In the cinema style, each sentence of up to 11 words shows as one page for at least 2.8 s, so the first sentence is the only one that reliably lands. Score 5 means I'd stop scrolling. Score 1 means the opening is a place name, a résumé or a scene description with no tension.

**Pattern:** most weak openings *describe the setting* ("a lake in galilee, early in the day"). The spec's own `hook` line, which never reaches the screen, is usually the better opener. Many proposals below borrow from it.

**Reordering:** shots can be reordered at no cost. A suggested opener means "move shot N to position 1". Its caption moves with it unless the proposed caption replaces it.

**HOT keywords:** when a caption changes, check the matching `HOT` entry in `episodes/c/films.mjs`. Seven shot-1 overrides point at words that the new captions drop: christianity-6 "wind", christianity-8 "eat", christianity-10 "glass", hinduism-1 "taxi", hinduism-3 "king", sikhism-9 "pendant" and spiritual-24 "enslaved". The build falls back to an automatic keyword, so nothing breaks, but the lime word may be wrong.

| door | day | id | current caption | score | proposed caption | image verdict / reorder | caption source |
|---|---|---|---|---|---|---|---|
| christianity | 2 | w1-christianity-2 | jesus prays to the father. | 2 | three names. one god. how? | Weak: lovely but generic figure from behind under light. Open on **shot 4** (three beams of light, gold/white/red, on an altar). | films/wave1/specs/christianity-2.json |
| christianity | 4 | w1-christianity-4 | a wild preacher named john was dipping people in the jordan. | 3 | a wild man in camel hair was dunking people in a river. | OK (John in the river, arms up). Keep. Shot 5 (teen bursting out of the pool) is the loudest frame if you want a modern cold open. | films/wave1/specs/christianity-4.json |
| christianity | 5 | w1-christianity-5 | "a great while before day," he went off to pray. | 2 | before sunrise, he slipped away from everyone. | Weak: dark, small figure from behind. Shot 3 (bonfire testimony) is the most alive. Shot 2 (Emmaus road, mid-stride) is the best story frame. | films/wave1/specs/christianity-5.json |
| christianity | 6 | w1-christianity-6 | on the first page, the wind of god moves over the waters. | 3 | before the world: wind, over black water. | OK (storm sea, but empty). Stronger cold open: **shot 4** (flames over the crowd's heads). | films/wave1/specs/christianity-6.json |
| christianity | 7 | w1-christianity-7 | in a grandmother's lap, the pages gone soft. | 2 | it's not one book. it's a whole library. | Weak: quiet hands on a Bible. Open on **shot 2** (books and scrolls exploding out of the Bible). | films/wave1/specs/christianity-7.json |
| christianity | 8 | w1-christianity-8 | right before anyone's allowed to eat. | 3 | amen isn't the end. it's the opposite. | Good: bowed heads, kid's fork hovering. Keep. | films/wave1/specs/christianity-8.json |
| christianity | 9 | w1-christianity-9 | somebody's grandmother says: wait. | 4 | keep | Good: grandmother's raised hand over a full table. Keep. | films/wave1/specs/christianity-9.json |
| christianity | 10 | w1-christianity-10 | the usual pictures: stained glass, a golden circle. | 3 | forget the stained glass. he had calloused hands. | OK as a setup only (abstract glass). Keep it short, or open on shot 2 (rough hands planing wood). | films/wave1/specs/christianity-10.json |
| christianity | 11 | w1-christianity-11 | "our father which art in heaven." | 2 | you know it by heart. but listen. | Weak: generic hillside crowd. Open on **shot 2** (Gethsemane at night, figure from behind, moon). Its caption "the night before he died, his own word: abba." is itself a strong opener. | films/wave1/specs/christianity-11.json |
| christianity | 14 | w1-christianity-14 | crowds followed a teacher out of the towns. | 2 | #blessed? his list was the opposite. | OK but expected. Open on **shot 3** (two women weeping in an embrace, "they that mourn"). | films/wave1/specs/christianity-14.json |
| christianity | 22 | w1-christianity-22 | a lake in galilee, early in the day. | 1 | no lecture. no rules. just: listen. | Weak: wide lake and crowd. Open on **shot 4** (sower flinging seed, big gesture). | films/wave1/specs/christianity-22.json |
| christianity | 29 | w1-christianity-29 | a rich man is leaving on a long journey. | 3 | two risked it. one buried it. | OK (man on a camel). Stronger cold open: **shot 4** (digging the hole at night by moonlight). | films/wave1/specs/christianity-29.json |
| christianity | 30 | w1-christianity-30 | more grain than his barns can hold. | 3 | best harvest ever. he dies tonight. | Good: grain pouring out of the barn. Keep. Shot 5 (empty chair by the barns at night) is eerier if you want a darker open. | films/wave1/specs/christianity-30.json |
| catholic | 2 | w1-catholic-2 | "this is my body, which is given for you." | 3 | catholics say this isn't a symbol. | Good: close-up of hands breaking bread. Keep. | films/wave1/specs/catholic-2.json |
| catholic | 5 | w1-catholic-5 | plaster figures in niches. candles flickering. | 2 | isn't that worshiping a statue? | Weak: dim, empty chapel. Open on **shot 2** (Mary in stained glass, vivid blue). | films/wave1/specs/catholic-5.json |
| catholic | 10 | w1-catholic-10 | "hail, full of grace, the lord is with thee." | 3 | the first line was an angel's. | Strong: angel of light and a kneeling young woman. Keep. | films/wave1/specs/catholic-10.json |
| catholic | 23 | w1-catholic-23 | she answers with a song. | 2 | she sang the win early. | OK. Open on **shot 2** (toppled golden thrones, crown in the dust), which matches "he hath put down the mighty". | films/wave1/specs/catholic-23.json |
| catholic | 29 | w1-catholic-29 | they start home, sure he's with the cousins. | 3 | they turn around. the kid is gone. | OK (caravan). Open on **shot 2** (the parents' panicked faces). | films/wave1/specs/catholic-29.json |
| judaism | 3 | w1-judaism-3 | immigrants carried it to american cities. | 2 | schlep. nosh. you already speak yiddish. | OK (Lower East Side street). Louder: **shot 5** (wedding crowd, "mazel tov"). | films/wave1/specs/judaism-3.json |
| judaism | 20 | w1-judaism-20 | every copy is written by hand, letter by letter. | 3 | nobody's allowed to print it. | OK: quill on parchment, quiet but fits the line. Keep. Shot 4 (a worn scroll being buried) is the shock frame if you want it up front. | films/wave1/specs/judaism-20.json |
| judaism | 29 | w1-judaism-29 | their fig leaves were a patch job. | 3 | on the way out, god dressed them. | OK (two figures from behind in a garden). Stronger cold open: **shot 4** (flaming sword at the guarded gate). | films/wave1/specs/judaism-29.json |
| judaism | 30 | w1-judaism-30 | the older a farmer, the younger a shepherd. | 2 | two brothers. two gifts. god picks one. | Fine: the brothers side by side. Keep. Shot 4 (dark figure crouched at the door) is the moody alternative. | films/wave1/specs/judaism-30.json |
| islam | 29 | w1-islam-29 | my lord, i've called my people night and day. | 2 | centuries of calling. almost no one came. | Weak, and the whole film is: six empty lanes look the same (correctly, no people). Best of them is shot 3 (cloths hung over doorways, "clothes over their heads"). The film needs a stronger image idea, not just a caption. | films/wave1/specs/islam-29.json |
| islam | 30 | w1-islam-30 | a ship, on dry land. | 5 | keep | Strong: a huge hull on cracked earth, no sea. Keep. | films/wave1/specs/islam-30.json |
| hinduism | 1 | w1-hinduism-1 | a small statue on a taxi dashboard. | 3 | he shows up first. every time. | Strong: Ganesha on a rainy Mumbai dashboard at night. Keep. | films/wave1/specs/hinduism-1.json |
| hinduism | 2 | w1-hinduism-2 | i give you to death. | 5 | keep | Strong: furious father pointing, a small boy standing straight. Keep. | films/wave1/specs/hinduism-2.json |
| hinduism | 3 | w1-hinduism-3 | a powerful king stopped with his army at a sage's forest home. | 2 | a king brought an army. the sage had a staff. | Busy, with no focal point. Open on **shot 4** (sage with staff, broken weapons on the ground). | films/wave1/specs/hinduism-3.json |
| hinduism | 4 | w1-hinduism-4 | two armies of cousins face each other. | 4 | keep | Good: conch blowing, armies, chariot. Keep. | films/wave1/specs/hinduism-4.json |
| hinduism | 5 | w1-hinduism-5 | the gods grew proud: we did this. | 4 | keep | Good: triumphant gods, loud and gold. Keep. | films/wave1/specs/hinduism-5.json |
| hinduism | 6 | w1-hinduism-6 | at a great debate in a king's court. | 2 | how many gods? first answer: 3,306. | Static court. Open on **shot 2** (a sky of thousands of figures on clouds). | films/wave1/specs/hinduism-6.json |
| hinduism | 8 | w1-hinduism-8 | she begs four handfuls of flattened rice. | 3 | his best friend is a king. he brings rice. | OK (wife at a neighbour's door). Keep. Shot 3 (Krishna running down the palace steps) is the payoff, so save it. | films/wave1/specs/hinduism-8.json |
| hinduism | 11 | w1-hinduism-11 | home after twelve years, very sure of himself. | 3 | twelve years of school. his dad stumps him. | OK (proud walk home). Keep. Shot 4 (the grimacing "salty" sip) is the funny alternative. | films/wave1/specs/hinduism-11.json |
| hinduism | 12 | w1-hinduism-12 | he asks his mother. | 2 | mom, who's my dad? | Fine (boy and mother in a doorway). Keep. Shot 2 (her hand on his face) is warmer. | films/wave1/specs/hinduism-12.json |
| hinduism | 14 | w1-hinduism-14 | the lesson didn't begin with the lesson. | 2 | not once. three times. on purpose. | Weak: calm teacher and student. Open on **shot 3** (lightning storm over the hermitage). | films/wave1/specs/hinduism-14.json |
| hinduism | 15 | w1-hinduism-15 | lakshmana lies barely breathing. | 4 | keep (optional: "his brother is dying. one herb can save him.") | Strong: Rama cradling his brother at night. Keep. | films/wave1/specs/hinduism-15.json |
| hinduism | 17 | w1-hinduism-17 | he weeps alone in the forest. | 3 | a snake took his bride. | OK (grieving man). Stronger cold open: **shot 3** (club raised to strike). | films/wave1/specs/hinduism-17.json |
| hinduism | 18 | w1-hinduism-18 | something coiled across the path. | 4 | keep | Good: tension on a dusk path. Optional cold open: shot 2 (giant snake, man leaping back). | films/wave1/specs/hinduism-18.json |
| hinduism | 19 | w1-hinduism-19 | a boy at the door of death's house. | 3 | death offered a kingdom. he said no. | OK (boy at a red door). Open on **shot 3** (gold chariots and heaps of treasure). The open also repeats day 2's setup, so lead with the refusal. | films/wave1/specs/hinduism-19.json |
| hinduism | 20 | w1-hinduism-20 | an old man reciting sanskrit grammar. | 2 | an old man, cramming rules. for what? | OK (ghats at dawn, good light). Keep. Shot 3 (monk laughing, arms wide) is livelier. | films/wave1/specs/hinduism-20.json |
| hinduism | 21 | w1-hinduism-21 | conch shells blowing. | 3 | war horns. he sits down. | Good: loud conch-blowing warriors. Keep. | films/wave1/specs/hinduism-21.json |
| hinduism | 22 | w1-hinduism-22 | every guard at the door is shiva's. | 2 | she wanted one ally. she made him. | Cold, with distant guards. Open on **shot 3** (Parvati breathing life into a golden clay boy). | films/wave1/specs/hinduism-22.json |
| hinduism | 23 | w1-hinduism-23 | shiva walks home to his own house. | 3 | a kid blocks shiva's own front door. | OK (Shiva from behind on the stairs). Open on **shot 2** (the boy barring the door with a staff). | films/wave1/specs/hinduism-23.json |
| hinduism | 27 | w1-hinduism-27 | krauncha steps on a sage's foot. | 2 | a mouse the size of a mountain. | Busy court scene. Open on **shot 3** (giant mouse eating the village). | films/wave1/specs/hinduism-27.json |
| hinduism | 29 | w1-hinduism-29 | a baby wakes up hungry. | 4 | keep (optional: "a baby saw the sun and thought: mango.") | Good: yawning baby Hanuman. Shot 3 (baby flying at the sun) is the wow if you want it first. | films/wave1/specs/hinduism-29.json |
| hinduism | 30 | w1-hinduism-30 | young hanuman knocks over the sages' water pots. | 3 | the strongest one there forgot he was strong. | OK (playful). Stronger cold open: **shot 5** (Hanuman on a rock, fist raised over the ocean). | films/wave1/specs/hinduism-30.json |
| buddhism | 29 | w1-buddhism-29 | lotus ponds: blue, red, white. | 1 | his dad hid pain from him. | Weak: pretty garden, no tension. Open on **shot 4** (the prince lounging among musicians, luxury as a cage). | films/wave1/specs/buddhism-29.json |
| buddhism | 30 | w1-buddhism-30 | at sixteen, the prince is married. | 3 | she's not his trophy. | OK (wedding). Open on **shot 2** (Yasodhara, close, looking straight out). | films/wave1/specs/buddhism-30.json |
| sikhism | 9 | w1-sikhism-9 | a gold pendant, a dashboard, a shop door. | 2 | before any story, any rule: a number. | Weak: dark, murky car interior, and the same dashboard idea as Hindu day 1. Open on **shot 5** (golden temple reflection at dawn) or shot 2 (a finger tracing "1" in flour). | films/wave1/specs/sikhism-9.json |
| sikhism | 28 | w1-sikhism-28 | nanak steps into the water, goes under. | 4 | he went under. he didn't come up. | Good: figure from behind stepping into the river at dawn. Keep. | films/wave1/specs/sikhism-28.json |
| sikhism | 29 | w1-sikhism-29 | on the third morning, he walks back into sultanpur. | 3 | gone three days. back with one sentence. | OK (figure from behind, crowd forming). Keep. (The spec hook says "back from the dead"; he was presumed drowned, so don't use that.) | films/wave1/specs/sikhism-29.json |
| sikhism | 30 | w1-sikhism-30 | come and pray with us. | 3 | he stood there. he didn't pray. | OK (court scene). Keep. Shot 4 (mare and foal) is the quirky alternative. | films/wave1/specs/sikhism-30.json |
| spiritual | 2 | w1-spiritual-2 | the mind does the opposite. | 3 | clear your mind? nobody can. | Strong: busy-day objects swirling around a meditator's head. Keep. | films/wave1/specs/spiritual-2.json |
| spiritual | 24 | w1-spiritual-24 | a lame, formerly enslaved man teaching the sons of the powerful. | 3 | once enslaved. now he teaches the rich kids. | OK (teacher among young Romans). Keep. Shot 2 (escorted out by a soldier) adds conflict. | films/wave1/specs/spiritual-24.json |
| spiritual | 29 | w1-spiritual-29 | cato spent the day making sure everyone else got out. | 3 | he got everyone else out first. | OK (man in black at the harbour). Keep. This film's ending is a suicide, so keep the opener calm and don't push it toward shock. 988 is in the spec. | films/wave1/specs/spiritual-29.json |
| spiritual | 30 | w1-spiritual-30 | seneca: philosopher, playwright, senator. | 1 | life isn't short. we make it short. | Weak: a résumé over an old man writing. Open on **shot 3** (hourglass burying phones, cups and controllers). | films/wave1/specs/spiritual-30.json |

## Counts

- 5: **2** (hinduism-2, islam-30)
- 4: **7** (christianity-9, hinduism-4, hinduism-5, hinduism-15, hinduism-18, hinduism-29, sikhism-28)
- 3 or under: **46** (3: 25 · 2: 18 · 1: 3)
- Reorder recommended (a bold **shot N** in the table): 25 films

## 5 worst openings

1. **christianity-22**: "a lake in galilee, early in the day." Place name plus weather. Christian viewers come first, so this film matters most.
2. **buddhism-29**: "lotus ponds: blue, red, white." A colour list over a calm garden.
3. **spiritual-30**: "seneca: philosopher, playwright, senator." A résumé. The real hook ("life isn't short. we make it short.") is sitting unused in the spec.
4. **islam-29**: "my lord, i've called my people night and day." The image is an empty lane, and every other shot in the film is too. This one needs an art rethink within the no-people rule (light, weather, doors closing), not just a new caption.
5. **sikhism-9**: "a gold pendant, a dashboard, a shop door." A list over a murky frame, and it reuses Hindu day 1's dashboard idea.

## 5 best (the target)

1. **hinduism-2**: "i give you to death." Six words, a shocking line from a father, and an image of a pointing finger over a small boy.
2. **islam-30**: "a ship, on dry land." A paradox in five words, and the image proves it at a glance.
3. **hinduism-15**: "lakshmana lies barely breathing." Life-or-death stakes in the first second. The name works because the picture tells you he's a brother.
4. **christianity-9**: "somebody's grandmother says: wait." Instantly familiar, with a raised hand and a table full of food. Warm and funny.
5. **sikhism-28**: "nanak steps into the water, goes under." The cliffhanger is built in. It goes to 5 with "he went under. he didn't come up."

What the best ones share: a person in trouble or in a paradox, said in under eight words, with the image showing the same moment. No setting, no list, no definition.
