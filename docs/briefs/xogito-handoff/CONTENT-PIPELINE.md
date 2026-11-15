# The content pipeline (how it works today)

Three pipelines feed the app. All of them are hand-run Node or shell scripts on the owner's PC, directed by AI
agents (Claude), with ChatGPT used only for art. None is automated end to end, and there is no review screen yet.
Making that reliable, with a scholar approval step, is one of the things we'd most like from you.

```
 A. CURRICULUM   docs/curriculum/<door>/scripts/y<N>/day-NNNN.json
                     |  episodes/c/convert.mjs
                     v
                 episodes/c/data/<door>/<day>.json  ----->  episodes/c/player.html?door=&day=
                                                                   ^
 C. FILMS        films/wave1/map.json + specs/            films.mjs -> episodes/c/films.json
                     |  ChatGPT stills -> ffmpeg motion -> Runway (Kling) hero clips
                     v
                 art/sacred/<film>/clips/<shot>.mp4 + .webp ---------+
                                                                   |
 B. EPISODES     lessons/<id>.json + episodes/configs/<id>.json      |
                     |  episodes/build.mjs  (engine.html is the template)
                     v
                 episodes/<id>/index.html, list.json, styles.json, index.html (library)
```

## A. Curriculum: scripts → player data

- **Source:** 14,328 lesson scripts, 1,791 days for each of the 8 faiths, in `docs/curriculum/<door>/scripts/`.
  Recipe for every lesson: a real story from the tradition → the faith's actual teaching → modern life. Early lessons
  are light, with at most one well-known text named a day; depth comes in later years.
- **How they were written:** AI workflows (`scripts/workflows/write-lessons-new-process.js`) plus repeated review
  passes. Tools in `packages/content/scripts/` (`validate-scripts.mjs`, `build-lessons.mjs`, `build-placement.mjs`,
  and others). Writing guides: `docs/curriculum/SCRIPT_GUIDE.md`, `RECIPE_V3.md`, `QUESTION_RULES.md`.
- **Review state:** each script has a `review` block. Hindu years 1–4 have had a full quality pass. A year goes live
  only after repeated review and the owner's okay. Keeper (scholar) review is still to come for most content.
- **Convert:** `node prototypes/greybox/episodes/c/convert.mjs [--door <door>]` reads the scripts (never writes to
  them) and writes compact JSON per day, an index per door and `report.json` (counts and variety checks). It assigns
  each day a deterministic look and sound: genre (Muslim days are percussion only), key, tempo, opening layout,
  particle, transition, palette, and a weekly "drop" with its own retro type treatment. It strips `review`.
- **Warning from the old app:** never run `npm run lessons` or `npm run export:web` inside `apps/app`; they rebuild and
  wipe the live lessons. Build lessons with `--out` to a scratch folder and merge.

## B. Stories → episodes

- **Source:** 226 story lessons in `prototypes/greybox/lessons/<id>.json` (28–29 per faith), each already filmed.
- **Writer configs:** one JSON per episode in `episodes/configs/` (hooks, highlighted words, the big turn, one game,
  end card, cliffhanger, share line). Written by AI agents under the rules in `episodes/BRIEF.md`: only facts already
  in the lesson; jokes never about God, holy figures or anyone's faith; gentle wrong answers for Muslim and Sikh
  stories; one faith only.
- **Build:** `node prototypes/greybox/episodes/build.mjs [--only id,id] [--configs <folder>]` fills
  `episodes/engine.html` per config and writes `episodes/<id>/index.html`, `styles.json`, `list.json` and the library
  page. Style assignment is deterministic across all 226, so an episode keeps its look and sound as more configs land.
- **Cards index:** `node prototypes/greybox/tools/build-cards.cjs` regenerates `brand/cards-index.js` from
  `list.json`, the lessons, the configs and `places.json`. Run it after a build that adds or changes episodes.
- **Finn's art** for episodes is in `episodes/assets/finn-*.webp`. To pull in new Finn art from another folder, run
  the build with `FINN_ASSETS=<folder>`.
- **Open content flags** are listed in `episodes/FLAGS.md` (for example source lines to confirm, cross-faith
  comparisons inside a lesson, a stray use of "famous"). These need a scholar call before anything is public.

## C. Films

Stills come from ChatGPT; motion comes from ffmpeg and Runway. OpenAI has shut Sora down, so ChatGPT makes stills
only. Kling (run inside Runway) won a bake-off for image-to-video.

1. **Plan.** `films/wave1/map.json` decides, for days 1–30 of each faith, whether an existing story film fits
   (strict: same story or same idea, same faith, no film twice in a month). 180 of 240 days reuse a film; the other
   60 get a six-shot spec in `films/wave1/specs/<door>-<day>.json`, each in a look from `films/wave1/STYLE-BIBLE.md`
   (grainy 35mm, impasto oil, risograph, neon night photography, miniature painting, Y2K chrome, fashion editorial and
   more), with diverse casts.
2. **Paint.** Each shot's prompt goes to ChatGPT (driven through the browser); the browser saves the image to the
   paintings folder, `PAINT_IN` (default `~/Downloads`), and `tools/grab.sh <shot>` renames the newest save to the
   shot's name. The picture lists used for earlier films are in `tools/paint-lists/`. Known traps: ChatGPT adds deities when told to "show gods reverently"; it draws Gurmukhi badly (keep the
   glyph out of art; set it as type); some religious scenes are blocked by its policy and need rewording.
3. **Motion (cheap).** Shell scripts in `prototypes/greybox/tools/` (`fire-w1.sh` for wave 1; `kb-w1.sh`,
   `kb-lesson.sh` and `kb-film.sh` for the older living paintings; `enc-film.sh` for downloaded clips) turn each still into an 8-second 9:16 clip plus a `.webp` poster with ffmpeg:
   crash zooms, whip pans, pull-backs, tilt-ups, 2.5D parallax from a depth map, dolly zoom, handheld, film grain,
   halation, gate weave (at most two flashes per shot, never closer than 0.25 s, for photosensitivity).
4. **Motion (hero).** The strongest shots go through Runway image-to-video with Kling: first frame from the painting,
   8 s, 720p, then conformed to 720×1280, 30 fps, H.264 CRF 23, no audio. `films/wave1/runway-log.json` records which
   shots were replaced so later re-renders skip them.
5. **Index.** `node prototypes/greybox/episodes/c/films.mjs` writes `episodes/c/films.json`; the player plays those
   clips for that day. Today: 1,511 planned shots, 1,499 with art.
6. **Review.** Picture notes for the owner and scholars are in `films/wave1/REVIEW-NOTES.md` (for example shots where a
   robed man could read as Jesus with his face showing, which must be redone). There is no structured approval yet.

Image rules every film must follow: no faces of Jesus, prophets or Sikh Gurus (from behind only); no people in
Islamic story scenes; reverent subjects stay reverent even when the cut is loud.

## Cost and usage

Video and AI runs cost real money (Runway credits, AI tokens). Standing rule: tell the owner the cost before any big
job. Ask him for current credit balances rather than relying on numbers in old notes.

## Portability (things to fix when you take this over)

- All build scripts are now in `prototypes/greybox/tools/` (one line each in `tools/README.md`), with paths worked
  out from the script's own folder; none point at the owner's PC. Paintings are read from `PAINT_IN` (default
  `~/Downloads`), so point it at any folder.
- The QA walk scripts (`episodes/qa/`, `episodes/c/qa*/`, `qa-chat/`) still load Playwright from the owner's main
  checkout (`atlas/node_modules`). Install Playwright in your own setup and change that one import line.
- Media (about 14 GB under `prototypes/greybox/art/`) is not in git and needs a proper home (object storage or a CDN),
  with a manifest instead of folder conventions.
- `prototypes/greybox/` itself is not in git yet.
