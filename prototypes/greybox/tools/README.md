# prototypes/greybox/tools

Build scripts for the new app (episodes, films, cards, test-link staging). Every path is worked out from the script's
own folder, so they run from any checkout. Run the shell scripts with Git Bash (or any bash) and ffmpeg/ffprobe on PATH.

Settings you can change with environment variables:

- `PAINT_IN`: the folder where saved ChatGPT paintings and downloaded clips land. Default `~/Downloads`.
- `PAINT_LISTS`: the folder of picture lists for `kb-w1.sh` and `kb-lesson.sh`. Default `tools/paint-lists`.
- `FIRE_TMP`: scratch folder for `fire-w1.sh` renders. Default `${TMPDIR:-/tmp}/ih-fire-tmp`.
- `HILL_OUT`, `FILMS_OUT`: where the two sync scripts copy to (defaults below).

Examples assume you are in `prototypes/greybox`.

| Script | What it does | Inputs | Outputs | Example |
|---|---|---|---|---|
| `fire-w1.sh` | Renders wave-1 film shots as motion-designed 6–8 s clips (crash zoom, whip, parallax, dolly…) from one painting each; never touches Runway shots | `films/wave1/specs/<door>-<day>.json`, `films/wave1/runway-log.json`, `$PAINT_IN/w1-<door>-<day>-<n>.png` | `art/sacred/w1-<door>-<day>/clips/<shot>.mp4` + `.webp` (old clip kept once as `.slow.mp4`), or `--out DIR` | `bash tools/fire-w1.sh --out /tmp/try --only 2,3 w1-buddhism-29` |
| `kb-w1.sh` | Older, simpler wave-1 motion: one camera move per shot (push, pull, pan, tilt, drift, parallax, whip); skips clips that exist | `tools/paint-lists/w1/<id>.json`, `$PAINT_IN/<shot>.png` | `art/sacred/<id>/clips/<shot>.mp4` + `.webp` | `bash tools/kb-w1.sh w1-catholic-2` |
| `kb-lesson.sh` | Living-painting clips for a story lesson (push / pull / drift / rise, in turn); skips clips that exist and lists missing pictures | `tools/paint-lists/lesson/<id>.json`, `$PAINT_IN/<shot>.png` | `art/sacred/<id>/clips/<shot>.mp4` + `.webp` | `bash tools/kb-lesson.sh bud-monkey` |
| `kb-film.sh` | Same moves as `kb-lesson.sh` for a film whose paintings are numbered downloads | `$PAINT_IN/<prefix>1.png`, `<prefix>2.png`… | `art/sacred/<film>/clips/<name>.mp4` + `.webp` | `bash tools/kb-film.sh ganga HN-GA s1 s2 s3` |
| `enc-film.sh` | Re-encodes downloaded video clips (Runway etc.) to 720×1280 H.264, no audio, plus a poster | `$PAINT_IN/<prefix>1.mp4`… | `art/sacred/<film>/clips/<name>.mp4` + `.webp` | `bash tools/enc-film.sh ganga HN-GA s1 s2` |
| `grab.sh` | Renames the newest picture saved in the last 3 minutes to a shot name | newest `*.png` in `$PAINT_IN` | `$PAINT_IN/<name>.png` | `bash tools/grab.sh w1-hindu-4-2` |
| `build-cards.cjs` | Builds the story-card index the app's cards and weekly drops read | `episodes/list.json`, `lessons/*.json`, `episodes/configs/*.json`, `lessons/places.json` | `brand/cards-index.js` | `node tools/build-cards.cjs` |
| `sync-hill.sh` | Copies the lesson player, hill app, lessons, store art and every lesson's clips into the staged site | `play.html`, `hill-app.html`, `store-test.html`, `lessons/`, `art/store/`, lesson clip folders | `$HILL_OUT` (default `<repo>/atlas/expo-live130/hill`) | `bash tools/sync-hill.sh` |
| `sync-films.sh` | Copies finished Hindu film pages with their clips and voice into the old app's films folder | `<film>-film.html`, `art/sacred/<film>/clips` + `voice`, `art/world/` | `$FILMS_OUT` (default `<repo>/apps/app/public/films`) | `bash tools/sync-films.sh` |
| `stage-next.ps1` | Builds the test-link folder: the live site, plus the new-brand website at the root, plus the new app and episodes under `/hill` (skips backups, QA output, test configs and `tools/`). Does not deploy | `<repo>/atlas/<Live>`, `prototypes/greybox`, `apps/app/public-next` | `<repo>/atlas/<Out>` | `powershell -File tools/stage-next.ps1 -Live expo-live130 -Out expo-next1` |
| `serve.cjs` | Tiny local web server (supports video seeking) for previews and QA walks | a folder (default `prototypes/greybox`) | http://127.0.0.1:8791 | `node tools/serve.cjs . 8791` |

Related scripts that live elsewhere in `prototypes/greybox`:

- `episodes/build.mjs` builds every episode (`node episodes/build.mjs [--only id,id] [--configs folder]`). Finn's art is
  in `episodes/assets/`; set `FINN_ASSETS=<folder>` to pull in new `finn-*.webp` files from somewhere else.
- `episodes/c/convert.mjs` and `episodes/c/films.mjs` build the curriculum player's data and film index.
- `places/take-painting.sh` and `places/take-many.sh` take place paintings from `$PAINT_IN` into `art/trip/`, plus a
  jpg for Marble in `$MARBLE_UP` (default `${TMPDIR:-/tmp}/ih-marble-upload`).

`paint-lists/` holds the picture lists (name, prompt, camera move) that were used to paint each film and lesson.

Safety: scripts that write into `art/` skip or back up what is already there, but they do write in place. To try a
change, use `fire-w1.sh --out <temp folder>` or copy the script into a throwaway folder first. Never delete art.
