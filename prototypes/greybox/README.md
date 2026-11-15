# prototypes/greybox: the new Infinite Hill app

This is THE app (owner, 2026-11-07). Start with `docs/XOGITO-START-HERE.md` at the repo root.
Run locally: `node tools/serve.cjs . 8791`, then open http://127.0.0.1:8791/hill-app.html.

| Path | What it is |
|---|---|
| `hill-app.html` | The app: Today, Guide, Together, You |
| `hill-chat.html` | Chat-first version of the same app (same saved data) |
| `streak.js`, `lib/` | Streak logic; shared code (`ih-four.js` journal/rematch, `ih-es.js` Spanish, `ih-seasons.js` holy days, courses, family) |
| `brand/` | Brand stylesheet, the episode list and the story-card index |
| `episodes/` | 226 story episodes (`engine.html`, `configs/`, `build.mjs`), the brand brief (`BRIEF.md`) and content flags (`FLAGS.md`) |
| `episodes/c/` | The lesson player for all 14,328 lessons (`player.html?door=&day=`), lesson data and the films list (`films.mjs` → `films.json`) |
| `episodes/storm/` | Two story-chat episodes (prototype; need scholar review) |
| `films/wave1/` | Specs, style bible and review notes for the 55 new films |
| `community/` | Three community concepts (prototype) |
| `places/` | The places and trips data |
| `lessons/` | The older filmed story lessons the player reuses |
| `art/` | All art and film (about 14 GB; not in git, delivered separately) |
| `tools/` | Build scripts (see `tools/README.md`) |
| `CARRY-OVER.md` | What the old app had and where it went (KEEP-LATER = still to build) |
| `_archive/` | Backups, QA screenshots and old mocks; not used, not in git |
| other `*.html` at the top | Earlier experiments (trips, map, nights, circle, hard moment, store test, dance stage) |
