# Architecture and file map (current state, Nov 7 2026)

This describes what exists, not what it should become. Most of the new work is static HTML prototypes; the only
real server code is the older backend in `api/`. Paths are relative to the repo root.

## The big picture

```
                        website (apps/app/public-next, static, EN + ES)
                                     |  "start" -> /app
                                     v
   hill-chat.html  <-- same state -->  hill-app.html   (the new app, one HTML file, state in localStorage)
         |                                  |
         | opens full-screen (iframe or link)|
         v                                  v
   episodes/<id>/index.html          episodes/c/player.html?door=&day=     trip.html, hard-moment.html, advent.html
   (226 story episodes)              (14,328 curriculum lessons)           (globe trip, rough moment, Advent)
         |                                  |
         +--- end card: ../../hill-app.html?done=<id> ----> app gives streak + Finn party + card/stamp
                                     |
                                     v
                     /api/guide (AI guide, warm fallback)   /api/pulse (anonymous return counts)
                     api/*.js  via  netlify/functions/*.js  (Netlify Functions, Node)
```

There is no build step for the new app. Content is generated ahead of time by Node scripts into static JSON and HTML
(see `CONTENT-PIPELINE.md`), and the pages read it with `fetch` at runtime.

## The new app: `prototypes/greybox/`

The whole folder is the test app; on the test link it is served under `/hill/`. It is **not in git yet**.

| file | role |
|---|---|
| `hill-app.html` | **the new app.** Tabs: Today, Guide, Together, You. Guide check-in ("what's on your mind today?"), one story pick from a hand-made mood table, globe trip, episode, streak with rest days, rough-moment flow with 988, the weekly drop, story cards, Finn's drip locker, your-year recap, one-faith You tab, today's curriculum lesson. Everything inline (CSS + JS, ~375 KB). |
| `hill-chat.html` | chat-first version: opens straight onto the guide; episodes, lessons, games and rewards appear as cards in the chat. Shares `ih-hill-app-demo`; keeps its own chat log in `ih-hill-chat-log`. |
| `circle.html` | private circle (2–6 friends or family): shared week, this week's drop, warm nudges, kid-safe preset messages, family mode. Local only; reads the app's streak, never writes it. |
| `nights.html` | in-person "drop night" page (LA): interest button, mock door scan, sample stamp. Local only, no network calls. |
| `trip.html` | globe flight to a real place, landing, story, stamp. Runs inside the app's iframe and talks back by `postMessage`. |
| `play.html` | the older story player; used as the fallback when a story has no built episode. |
| `hard-moment.html`, `advent.html` | the two-minute "rough moment" reset; the Advent calendar (Nov 16–Dec 25). |
| `streak.js` | browser copy of `packages/domain/src/streak.js` (rest days, earn-back, golden). Change the rules there, then re-copy. |
| `brand/episodes.js` | `IHEp`: reads `episodes/list.json`, says whether a story has an episode, gives its URL. |
| `brand/cards-index.js` | generated: every episode as a collectible card, numbered per faith (`IH_CARDS`). |
| `brand/brand.css` | shared brand tokens for the prototypes. |
| `art/finn/drip/drip.js` | list of approved Finn outfit art (empty today; drafts wait for the owner in `art/finn/drip-drafts/`). |
| `places/trips.js`, `places/trips-more.js` | the 50 trips (`IH_TRIPS`): place, guide line, door. |
| `places/map-index.json` | 4,118 real places across the faiths (about 2.6 MB; flagged as too big for phones). |
| `art/stamps/stamps.js` | which stamp art exists. |
| `lessons/<id>.json` | the 226 story lessons (plus `lessons/places.json`, story → place). |
| `episodes/` | the episode engine, builder, configs, the 226 built episodes, and the curriculum player in `episodes/c/`. |
| `films/wave1/` | the first-month film plan: `map.json`, `specs/`, style bible, review notes, Runway log. |
| `art/` | all images and video (about 14 GB): `sacred/<film>/clips/*.mp4|.webp`, homes, guides, stamps, Finn, moments. |
| `*.pre-*.html` | backups made before big edits. Not part of the app. |
| `qa*/` | QA screenshots and scripts. Not part of the app. |
| `tools/` | the build scripts: film motion, cards index, sync and test-link staging. See `tools/README.md`. Not part of the app. |

How the pieces talk:
- App → full-screen pages: an iframe (`#film`) for trips, rough moment, Advent and `play.html`; a full page navigation
  for episodes and the curriculum player.
- Iframe → app: `postMessage` with `{ ih: "done" | "close" | "episode" | "hard-done" | "advent-done", ... }`.
  These use `"*"` as the target origin today; tighten that in production.
- Episode / player → app: a link to `hill-app.html?done=<id>` (see `DATA-CONTRACTS.md`).

Music in the episodes and the player is generated in the browser with Web Audio (`episodes/engine.html`, and a copy
in `episodes/c/engine-audio.js`): 18 genre recipes, seeded per episode. No licensed tracks. Muslim episodes are
percussion only. Narration exists for only a few stories (`voice` folders); most episodes are captions plus music.

External dependencies are minimal: Google Fonts (Anton, Manrope). No frameworks in the prototypes.

## The new website: `apps/app/public-next/`

Static HTML, EN + ES pairs for the homepage (`site.html`, `site-es.html`) and every footer page (about, foundation,
keepers, provenance, careers, science, paths, nights, prayers, voices, schools, promise, safety, contact, privacy,
terms, biometric, legal, sources). `brand.css` holds the shared look. `_redirects` maps `/` to the site, `/app` to
`/hill/hill-app.html`, and every other path to the old app's `index.html`. Not in git yet.

## The backend: `api/*.js` + `netlify/functions/`

Plain Node handlers in the Vercel `(req, res)` style; each `netlify/functions/<name>.js` wraps one with
`netlify/_shared/vercel-adapter.js` and connects its storage (`netlify/_shared/*-store.js`, Netlify Blobs).
`netlify.toml` routes `/api/<name>` to the function. Tests: `npm run test:unit` from the repo root
(`tests/backend`, `tests/features`, `tests/netlify-adapter.test.js`, plus domain and content packages).

| endpoint | what it does | used by |
|---|---|---|
| `/api/guide` | the AI guide. The server builds its own system prompt per faith (the client's `system` is read only for the door name), caps sizes, times out before Netlify's 10 s limit, adds 988 crisis rules, mascot voice and per-faith knowledge rules. | old app, **new app**, chat app |
| `/api/companion` | `?kind=status|shape|reflect|chat`: shapes a day, reflects on a week, talks. Answers are checked against a contract; off-contract becomes an error and the phone uses its on-device companion. | old app |
| `api/_usage.js` | per-person and site-wide daily AI limits, counted by a one-way daily hash; fails open. (Never mention limits in copy.) | guide, companion |
| `/api/ai-watch` | scheduled outage watcher; alerts the owner's phone when AI or the site breaks. | scheduled |
| `/api/state` | end-to-end encrypted state snapshot (AES-GCM envelope; the server never sees plain data). Turso / libSQL or local SQLite via `api/_db.js`. | old app |
| `/api/pulse` | anonymous return counts: day 1 / 7 / 30 cohorts and lessons per day. No door, no identifier. | old app, **new app** (`variant: "hill"`) |
| `/api/wellbeing` | anonymous WHO-5 aggregates per faith and stage; shown only above a threshold. | old app |
| `/api/friends` | anonymous friend identity (token hash only), invites, check-ins, cheers. | old app |
| `/api/circles` | leader-run circles: peek, create, join, walked, nickname opt-in, pinned note. | old app |
| `/api/table`, `/api/gifts`, `/api/commerce`, `/api/stripe-webhook` | family "table" plan, gifts and Stripe checkout pieces. | old app |
| `/api/waitlist` | invite-only launch behind a server switch (off by default). | site, old app |
| `/api/log` | content-free client error reports. | old app |

Server settings are environment variables set in Netlify (names only, no values here): the AI provider key, AI
limits, storage backend and database URL/token, friend and waitlist salts, the waitlist switch and admin key, the
pulse read key, Stripe prices, and the alert URL. **None of these may ever appear in browser code or in
`EXPO_PUBLIC_*` / `VITE_*` variables.**

Live status note: the handoff from Oct 30 recorded `/api/guide` returning 502 in production (likely the provider
account). Treat the live AI as unproven until a live request shows it working.

## The old app: `apps/app/` (frozen, reference only)

Expo (React Native) app exported to the web, 74 screen files under `apps/app/src/app` (tabs Today, Guide, Together,
You; welcome/intake flow, placement, sessions, done screens, circles, family, courses, journal, wellbeing, waitlist,
sign-in). Logic in `apps/app/src/lib` (streak, placement, sync, store, reminders, companion, circles, friends,
wellbeing, pulse, share cards). Accounts are guest-first with email link or code via Supabase (row-level security);
practice "sits" sync by set union. Shared logic lives in `packages/domain` (streak, day engine) and
`packages/content` (lesson tooling); brand tokens in `packages/brand`.

The owner decided the hill app is THE app and the Expo app is frozen. An uncommitted loud-brand reskin of it exists
(`apps/app/BRAND-CHANGES.md`). Useful to carry over: the backend contracts, placement and walk-back, the gentle lane,
WHO-5, kids track, reminders, streak rules, sync, Spanish, and the Guide's safety behaviour.

## Other places

- `docs/curriculum/<door>/scripts/y<N>/day-NNNN.json`: the 5-year lesson scripts (source of truth for curriculum).
- `scripts/workflows/`: the AI workflows that wrote and reviewed lessons.
- `atlas/`: git-ignored build and QA folder. Production deploys come from an export folder here.

## How the test link was built

The staging script `prototypes/greybox/tools/stage-next.ps1` mirrors the last production export
(`atlas/expo-live130`) into `atlas/expo-next1`, copies `prototypes/greybox` into `/hill` (skipping backups, QA, test
configs and `tools/`) and `apps/app/public-next` over the root (`-Live` and `-Out` pick other folders). It does not
deploy; the deploy is a separate step, done with the Netlify CLI as an alias
(`--alias brand-next`), never `--prod`. Production deploys are the owner's call only.
