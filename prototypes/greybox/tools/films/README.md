# Film tools (the lesson-film recipe)

See `docs/LESSON_STANDARD.md` for the standard. These are the tools that turn a script, a narration and 6-7 clips
into a finished lesson film. They need Node 20+, ffmpeg on the PATH, and Google Chrome (for captions).

1. `node auto.mjs <cfg.json> <narration.mp3> <name>` writes `edit-<name>.json` (cards timed to the voice's pauses,
   pictures on their story beats) and `mix-<name>.wav` (voice + score with the drop on the turn + beat).
   A cfg has: `script`, `shots` (paths under `prototypes/greybox/art/`), `beats` (where each shot starts, as
   script substrings), `open` {shot, text}, `q`, `drop`, `close`, `keywords`. Examples: `week1/hinduism-cfg-*.json`.
2. `node caps.mjs edit-<name>.json` renders the captions (Anton, one lime word).
3. `node cut.mjs edit-<name>.json out.mp4` cuts the film (720x1280, 30 fps).
4. `node verify-clips.cjs` checks that every saved clip matches the picture it should start from.

`week1/<path>.json` holds each path's week-1 scripts, shot lists, motion lines, sources and scholar flags.
`BRIEF.md` is the brief the scripts were written to.
