# Data contracts (current shapes, Nov 7 2026)

These are the shapes the prototypes rely on today. They are a starting point for your real data model, not a spec
to preserve. Where a field name is short or odd, it's because the prototypes grew fast; rename freely in the build,
but keep the meaning.

All counts below were taken from the files on Nov 7, 2026.

## 1. Faith keys (two vocabularies)

The curriculum and the story library use different keys for the same eight doors. A real build should pick one.

| faith | curriculum `door` | story `home` |
|---|---|---|
| Christian | `christianity` | `olive` |
| Catholic | `catholic` | `angelus` |
| Jewish | `judaism` | `pomegranate` |
| Muslim | `islam` | `datepalm` |
| Hindu | `hinduism` | `marigold` |
| Buddhist | `buddhism` | `lotus` |
| Sikh | `sikhism` | `nectar` |
| My own religion | `spiritual` | `wild` |

Order everywhere is Christian first (an owner rule for marketing and library order). Note: an earlier brief listed
other `home` names (rose, cedar, crescent, khanda, wildwonder); the table above is what the files actually use.

## 2. Curriculum lesson script (source of truth)

`docs/curriculum/<door>/scripts/y<N>/day-NNNN.json`, 1,791 days per door (year 1 = 331 days, years 2–5 = 365 each),
14,328 files in total. Top-level fields:

```
format, door, day, title, word, hook, carry, length, tomorrow,
segments[]   { type, duration{}, voice, screen{} }        the lesson as spoken/shown beats
howItsDone
games {
  match    { prompt, pairs{} }
  myth     [ { ... } ]                                    myth or fact
  fork     { setup, options{}, answer, reveal }
  original { script, say, note }                          the word in its own script + pronunciation
  trapdoor [ string ]
  story    { title, text, source }
  wrong    { myth, truth }
  build    { prompt, pieces{}, decoys{}, word }           rebuild the old line from pieces
  chat     { who, says, options{}, answer, meaning, tie{} } a friend's text; pick the best reply
}
sources[]   { ref, work, translation, quoted }
review      { status, keeper{}, notes[] }                 Keeper review state. Never shown to users.
meta        { index, writer, written }
```

Rules attached to this data: a year goes live only after repeated review passes and the owner's okay; `review` must
never reach the user-facing app (the converter strips it).

## 3. Curriculum player data (generated)

`prototypes/greybox/episodes/c/data/<door>/<day>.json` + `index.json` per door + `report.json`. Built by
`episodes/c/convert.mjs` from the scripts above. Shape:

```
v, door, day, year, title, word, hookLine, carry, tomorrow, last, next,
style   { genre, key, keyName, bpm, scale, drumsOnly, layout, particle, trans, paletteName, palette[], seed }
hook    { lines[], cards[] }
teach   [ { h, big, b } ]
how
games   [ { k, who, q, o, a, why, text } ]               k = the game kind
practice [ string ]
wordCard { voice, orig { s, say, note } }
carryVoice
sources [ { ref, work, tr, q } ]
drop    { n, name, tr, of, pos }                          which weekly "drop" this day belongs to, and its type treatment
```

Player URL: `episodes/c/player.html?door=<door>&day=<n>`. Films for a day come from `episodes/c/films.json`
(section 6).

## 4. Story lesson (the 226 filmed stories)

`prototypes/greybox/lessons/<id>.json` (226 stories; `places.json` in the same folder maps a story to its place).

```
id, home, title, told                     told = how the tradition tells it (e.g. "as tradition tells it")
clips                                     folder holding <v>.mp4 and <v>.webp
voice                                     "" or a folder of narration mp3s (only a few stories have one)
guide   { name, photo }
hook    { v, say, options: [[label, reply], ...] }      the guide's opening question
steps[] of kinds:
  shot  { t:"shot", v, line, vo? }        a film clip and its story line
  ask   { t:"ask", v, eb, q, o[], a, why } multiple choice; a = index of the right option
  teach { t:"teach", v, say[] }
  match { t:"match", v, eb, q, pairs[[l, r]], why }
  fill  { ... }
today    { v, say, options }               the modern-life action
tomorrow { title, line }
card     { sources, check? }               sources, and items a scholar still needs to check
```

## 5. Episode config and the episode contract

Writer configs: `prototypes/greybox/episodes/configs/<id>.json` (254 files, including test and extra configs).
The full schema with an example is in `prototypes/greybox/episodes/BRIEF.md` ("The episode contract"). In short:

```
id, open[3], open2[3], hint, particle, energy,
hot   { "<shot index>": { "<word in that shot's line>": "<colour letter>" } }
drop  <shot index of the story's big turn>
game  { ask: <index among the lesson's asks>, q, opts: [[key, label]], wrong{}, right }   the right key is "yes"
teachH, end { h[3], line, l1, l2 }, cliff { s1, s2, tmr }, share
```

Writer rules: only facts already in the lesson, no new religious claims or quotes; jokes never about God, Jesus,
Mary, a prophet, the Buddha, a Guru or anyone's faith; never compare faiths inside an episode.

**The episode contract** (engine, app and writers all rely on it):

1. Each episode is a standalone page at `episodes/<id>/index.html` with its own doctype.
2. It loads media by relative path from the lesson's clip folder (`../../art/sacred/...`). Media is never copied.
3. `episodes/list.json` lists the built ids (226 today). The app plays a story as an episode once its id is listed,
   and falls back to `play.html` otherwise (`brand/episodes.js`).
4. When it finishes, the end card's lime "head home" button links to **`../../hill-app.html?done=<id>`**.
5. The app, on `?done=<id>`, marks the day, runs Finn's party and the streak, unlocks the story card, and adds the
   place stamp. It then removes `?done=` from the address bar. If there's no profile yet (a shared link), sign-up
   comes first and nothing is awarded.

## 6. Done ids

| id pattern | from | example | what the app does |
|---|---|---|---|
| `<story id>` | a story episode | `lost-son`, `bud-alms` | streak, card, stamp/place, mood-loop progress |
| `c-<door>-<day>` | the curriculum player | `c-hinduism-7` | streak; moves your path to day + 1 (`S.curr[door]`) |

Ids match `^[a-z0-9-]+$`. The curriculum player also keeps its own list in `localStorage["ih-c-done"]`
(`<door>-<day>` entries). In a real build these become server-side completion events.

## 7. Film data

- `films/wave1/map.json`: `{ <door>: { <day>: { film: <story id> | null, why } } }` for days 1–30 of each faith
  (240 days: 180 reuse an existing film, 60 need a new one).
- `films/wave1/specs/<door>-<day>.json`: a six-shot plan for each new film (title, style, shots with caption and
  camera move). 60 files.
- `episodes/c/films.json` (generated by `films.mjs`):
  `{ v, made, doors: { <door>: { <day>: { kind: "reuse"|"new", id, title, style, told?, painted,
  shots: [ { mp4, webp, cap, move, has[] } ] } } }, stats }`.
  Today: 240 days, 1,511 planned shots, 1,499 with art; 2 new films have no art yet. The player checks each file at
  runtime (mp4, else webp with a slow zoom, else skip).
- `films/wave1/runway-log.json`: which shots were replaced by Runway/Kling clips (so re-renders skip them).

## 8. App state (prototype only)

`localStorage["ih-hill-app-demo"]`, one JSON object, shared by `hill-app.html` and `hill-chat.html`. Starts as
`{ home: null, done: {}, stamps: [], streak: 0, log: {} }`. Fields seen in the code (meanings as used today):

| field | meaning |
|---|---|
| `home` | chosen faith home key (one faith) |
| `log` | `{ "YYYY-MM-DD": [keys finished that day] }`; the streak is computed from this by `streak.js` |
| `streak` | cached streak number |
| `done` | `{ <story id>: true }` stories finished in course order |
| `epDone` | `{ <id>: true }` episodes finished outside the course |
| `curr` | `{ <door>: next curriculum day }` |
| `cards` | `{ <id>: { at, wk, d, hy, plays } }` collected story cards: time, ISO week, drop edition, holy-day window id, plays |
| `places`, `lplaces`, `stamps` | earned trip places, places from stories, older stamp list |
| `mood` | today's guide check-in and its loop progress |
| `pendingEp` | the episode just opened, so the `?done=` return knows where it came from |
| `dayDone`, `why`, `came`, `cameSeen`, `howSeen`, `nudge`, `fits`, `fitOn`, `litOn`, `courses`, `courseOn`, `partnerDoor`, `famDoors` | smaller UI and onboarding flags |

Other keys: `ih-hill-chat-log` (chat history), `ih-hill-pulse` (first-open date for pulse), `ih-trip-last`,
`ih-trips-done`, `ih-c-done`, `ih-circle-proto` / `ih-circle-demo-*` (circle prototype), `ih-nights-interest`
(nights prototype), `sessionStorage["ih-drop-sim"]` (QA drop switch).

Privacy note for the real build: this state includes chosen faith and practice history, which must never be logged
server-side. The old app's answer was an end-to-end encrypted snapshot (`/api/state`) plus owner-only rows.

## 9. Drops and cards (computed on the device today)

- The drop: one shared episode per faith per week, Friday 7 pm local. Episode 1 is fixed at Fri Aug 21, 2026, one a
  week since. The pick rotates through that faith's card order, except in holy windows (`HOLY` in `hill-app.html`:
  Diwali, Advent, Hanukkah, Christmas, Lent, Ramadan, Eid, Holi, Easter, Vaisakhi, Vesak; **dates still to be
  confirmed with Keepers**) where a fitting episode is chosen. It is "live" for 48 hours.
- Cards: `brand/cards-index.js` (generated) numbers each faith's cards (28 or 29 per faith, 226 total). Rarity:
  `common`, `drop edition` (finished within the 48-hour window), `holy-day edition`, `holo` (7 cards in one week).
- Rules built in: lessons are always free and open; only the collectible is timed and the timing is real; missing a
  drop never touches a streak; no leaderboards; nothing to buy.

## 10. Server contracts the new app uses

- `POST /api/guide` `{ system, messages, profile: { lang } }` → `{ text }` on success, or an error status; the app then shows
  a warm scripted line. The server ignores the client's prompt except to read the door name, and builds its own.
  The client also checks crisis words itself and shows 988 without calling the server.
- `POST /api/pulse` `{ cohortDate, daysSince, event: "first"|"open"|"lesson", variant: "hill" }` → 204.

Full request/response notes for every endpoint are in the header comment of each `api/*.js` file.
