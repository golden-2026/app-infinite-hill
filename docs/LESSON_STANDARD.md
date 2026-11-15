# The lesson standard (set 2026-11-10)

Every lesson on every path follows one shape. Hindu week 1 is the finished model; week 1 of the other seven paths is
built the same way. This page is the rule book: what a lesson is, how its film is made, and where the pieces live.

## 1. What a lesson is

One page: `prototypes/greybox/lesson.html?door=<path>&day=<n>` (works for all 8 paths, 14,328 lessons).

1. **The path screen.** The week card ("week 1 · days 1-7"), the streak, and Finn saying today's title.
2. **The film** (40-50 seconds, vertical, sound on). If a lesson has no film yet, the page falls back to a tap-through
   story over that lesson's paintings.
3. **Five quick games** (some lessons have four): guess, match, myth-or-true, fork (a friend's text: what do you say?),
   order (build the word).
4. **Today:** the thing to carry, how to do it, sources ("where this comes from").
5. **The win screen:** streak, games score, the word card (original script, how to say it, what it means), tomorrow's title.

Opened from the app (`&from=app`), "back to my path" returns to `hill-app.html?done=c-<path>-<day>`, which lights the
lantern and moves the path to the next day.

## 2. What a film is

**Shape: a real story, the faith's actual teaching, then today.** Never a self-help tip.

- **Cold open (1.8 s):** the most shocking moment of the story and a 5-9 word hook ("a whole army lost to *one sage.*").
- **Finn reacts (1 s):** "wait. *why?*"
- **The story, narrated** (85-125 words): short punchy sentences, big captions timed to the voice, one word lit lime.
- **The turn:** a snap, a beat of silence and the music drop on the surprising moment.
- **The teaching**, said plainly, and **one line about a teen's life today**.
- **Finn closes (1.9 s)** with the day's line ("a prayer for a *clear mind.*").

**Rules for the words:** real stories from the tradition's own sources; stay inside one faith (only "my own religion"
crosses faiths, crediting each tradition plainly); open to every school within a faith; no invented words for God;
prayer is always the viewer's choice; no romance angle; nothing goes public before a scholar has read it.

**Rules for the pictures:** one house style for every path. It's cinematic hand-painted sacred art: warm golden lamp
and fire light, deep soft shadows, rich earth tones with deep red and gold, and close human framing. The same characters
look the same in every shot. The last shot is always today: real modern people of that faith, warm and everyday.
- **Never shown:** the face of Jesus (only from behind, hands, or far away); any prophet in Islam, in any form; any
  Sikh Guru, in any form; God, in any tradition.
- **Also:** no blood, no text in pictures, and only the approved Finn art.

## 3. How a film is made (the recipe)

| Step | Tool | Cost |
|---|---|---|
| 1. Script + shot list (6-7 pictures, motion line per picture, hook, drop, close, highlight words, picture timings) | Claude, using the brief in `prototypes/greybox/tools/films/BRIEF.md` | free |
| 2. Narration | Runway, ElevenLabs Eleven v4, voice "Adrian Vale - Cinematic Narrator" | about 4 credits |
| 3. Pictures in the house style (the reference picture is attached to the first message of each chat) | ChatGPT images | free (pace about 300 a day; it pauses accounts after ~700) |
| 4. Each picture becomes a 5-second moving clip (first frame = the picture) | Runway, Kling 4.0, 720p, 9:16 | 60 credits a clip with the November discount, about 400 a film |
| 5. Edit: captions timed to the voice's pauses, pictures on their story beats, punch-ins, the drop, music | `tools/films/auto.mjs` → `caps.mjs` → `cut.mjs` (ffmpeg + headless Chrome) | free |

A film costs about 400 Runway credits (about $4). Clips are the cost; everything else is free or nearly free.

## 4. Where things live

- **Lesson data:** `prototypes/greybox/episodes/c/data/<path>/<day>.json`.
- **Film list:** `prototypes/greybox/lessons/films.json` (`<path>` → `<day>` → mp4 and poster).
- **Films:** `prototypes/greybox/art/lessons/<path>/<day>.mp4` plus a `.webp` poster.
- **Clips:** `prototypes/greybox/art/sacred/w1-<path>-<day>/house/`.
- **Week-1 scripts, shot lists and scholar flags:** `prototypes/greybox/tools/films/week1/<path>.json`.
- **Scholar checklist for week 1:** `docs/review/week1-scholar-checklist.md`.

## 5. Status

- **Hindu week 1:** in the house style with moving clips. Day 1 keeps its moving tusk story and gets new modern shots.
- **Other seven paths, week 1:** scripts written; pictures, narration and clips in production.
- **All other lessons (days 8+):** run in the same lesson page with games, word card and sources. They use the
  tap-through story until their films are made.
- **Before anything goes public:** a scholar for each faith reads that path's scripts and pictures.
