# Infinite Hill: start here (for Xogito)

Written 2026-11-09 for the phase-one kickoff. Read this first. It tells you what the product is, what's real and what's
a mockup, where every piece lives, how to run it, and the rules that don't bend.

> **Updated 2026-11-15: what to review first.** Two links, both behind the Netlify login:
> - **Website:** https://brand-next--infinite-hill.netlify.app/ (English) and /es (Spanish). Files:
>   `apps/app/public-next/site-new.html` and `site-es.html`, plus 18 footer pages, each in English and Spanish.
> - **App:** https://brand-next--infinite-hill.netlify.app/app. File: `prototypes/greybox/hill-app-doors.html`, the
>   "two paths" version: go deep in one faith, or build your own religion. It replaces `hill-app.html`, which is
>   kept for reference only; nothing links to it.
>
> **Decided by the owner (these win over anything older below):**
> - **Tagline:** "religion, reimagined." on the new website. The brand book, app and films still say "making religion
>   yours again." until the owner confirms the swap everywhere.
> - **The product in one line:** one lesson a day, about 5 minutes. Every lesson opens with a short film told by your
>   path's celebrity guide, then a few quick questions on what the faith actually teaches, then one thing to carry.
> - **Who talks (2026-11-14):** the path's **celebrity guide asks every question and says every scripted line**,
>   with their round photo and name. **Finn, the mascot, never talks.** He is wordless hype only: he pops in on right
>   answers, streaks and finished stories, using the approved still art. The live AI chat shows the guide's photo, but
>   it is labeled "your [faith] guide · powered by AI", never "Denzel says". Before a path is picked, questions show
>   with no speaker.
> - **Guides:**
>   - Denzel Washington (Christianity), Nicole Kidman (Catholicism), Natalie Portman (Judaism), Mahershala Ali (Islam)
>   - Priyanka Chopra (Hinduism), Orlando Bloom (Buddhism), Diljit Dosanjh (Sikhism), Justin Bieber (my own religion)
>   - **Voices:** the guide contracts cover a licensed AI voice and likeness. The website describes the launch product
>     ("told by voices you know"). Until each licensed voice model is built, the prototype plays **stand-in stock AI
>     voices**, matched only by gender and feel and never imitating the person.
>   - All 226 story episodes were re-narrated on 2026-11-14.
> - **No place names as homes.** The old "Marigold / Olive Grove / Angelus…" names are gone; paths are named by faith.
>   No map of eight homes.
> - **One day (2026-11-14):** film → the guide's questions → **the reveal** (the real place tied to the story lights
>   up as a spot on your path, and the guide names it) → the story card → **your path**. Your path is a full-screen
>   climb of this week's 7 stories for your faith only: lit spots show their place, the next one is a mystery. Places
>   are only ever named after the story, never before. Every story in the first 28 days of each faith has a place
>   painting (`art/trip/`, data in `lessons/places.json`).
> - **The dance videos are gone** (they weren't good enough). Finn celebrates with still art and a bounce.
> - **Pricing direction:** the daily lesson is free (it may carry ads later). The paid plans are ad-free and a family
>   plan. Don't promise "no ads". If ads come: only between lessons, never inside a film or prayer, never targeted by
>   faith.
> - **Brand:**
>   - Colors: black #0A0A0A, lime #EEFF6A, cream #F3EFE4.
>   - Type: Anton for display, uppercase; Manrope for everything else.
>   - Copy: lowercase, punchy and warm. Say "celebrity guides", never "famous".
> - **Words:** a "lantern" is a streak day. A "card" is what you earn for each story. Stamps are only for real-life
>   events.
> - **Streak (2026-11-15):** seven days in a row with no rest day is "lit" ("your streak is lit", Spanish
>   "encendida"), never "golden". Rest days and earn-back stay.
> - **The Holy Land (2026-11-15):** every place in Israel, the West Bank, Palestine, East Jerusalem or the Golan is
>   labeled "the Holy Land" ("Tierra Santa"), never a modern country (1,046 entries in `lessons/places.json` and
>   `places/*.json`).
> - **"what i live by" (2026-11-15, built in the hill app; the live guide reads it via short line ids, api/guide.js + api/_live-by.js; lesson lines await scholar review):** in "my own religion", after each story you
>   mark it "this is me", "not sure yet" or "not for me"; the guide occasionally asks an optional big question; your
>   page groups the three, each piece tagged with its faith and source, and the guide answers from it. Faith paths get
>   a lighter "what spoke to you" (no "not for me"). Private, on the phone.
> - **Privacy:** no account; everything stays on the phone. Only guide questions and an anonymous return count leave
>   it. "We don't sell your faith."
>
> **Swept overnight 2026-11-14/15:**
> - Every website page (English and Spanish) and every app screen across all 8 paths was walked by first-time-user QA
>   passes and fixed:
>   - language switching
>   - brand colors (the old navy is gone)
>   - wording, and leftover old names
>   - the order of story names and places
>   - an exit from stories
>   - Spanish for the crisis screen
> - 40 new place paintings.
>
> **Still open:**
> - The 24 "build your own religion" week-one films (`art/lessons/<path>/<n>.mp4`) were re-voiced on 2026-11-15 with
>   Justin's stand-in voice and play with sound. The speck-and-plank film now teaches from Matthew only (no Jung).
> - Story content stays English when the app is in Spanish (by design for now).
> - Nothing religious is public until a Keeper (scholar) has reviewed it.

> **Which player plays what (2026-11-15):** in the app, days 1–28 of each faith open the story episode
> `episodes/<story>/index.html`: a tap-through film with the guide's narration and questions, built by
> `node episodes/build.mjs` from `episodes/engine.html` and `lessons/<story>.json`. Later days open
> `lesson-doors.html`, which reads `episodes/c/data/`. `play.html` and `lesson.html` are earlier players, kept
> for reference.

> **New 2026-11-10: the lesson standard.** Every lesson now follows one shape: a 40-50 second narrated film (real
> story → the faith's actual teaching → today), five quick games, the thing to carry, sources, and a word card. It's
> all in one page, `prototypes/greybox/lesson.html?door=<path>&day=<n>`. The app's "today's lesson" opens it.
> - Week 1 of all eight paths is being made to this standard in one house art style, with moving clips.
> - Read `docs/LESSON_STANDARD.md` for what a lesson and a film are, the recipe, costs and where files live.
> - The film tools are in `prototypes/greybox/tools/films/`.
> - What scholars must check first is in `docs/review/week1-scholar-checklist.md`.
> - The older `episodes/c/player.html` below still works, but `lesson.html` replaces it.

## 1. What Infinite Hill is, in one minute

A phone app for short daily religious and spiritual practice. You pick one faith (Christianity, Catholicism, Judaism,
Islam, Hinduism, Buddhism, Sikhism) or "my own religion", and every day you get one short, fun lesson: a real story
from that faith, what the faith actually teaches about it, and what it means for your life today.

- **Tagline:** "religion, reimagined." on the new website (approved 2026-11-13); "making religion yours again." elsewhere until the owner confirms the swap.
- **The big idea:** "step in to remember who you are. step out to live it." (`docs/brand/BIG-IDEA.md`)
- **The look:** loud and on trend: lime and black, huge captions, drops, music. Brand brief: `prototypes/greybox/episodes/BRIEF.md`.
- **The mascot is Finn.** Only the approved art (backwards cap) is ever used. The name still needs a trademark check.
- **One faith first.** You stay inside your own faith. Looking across faiths happens only in "my own religion".
- **Main first audience:** Christian. Hindu parents are the first alpha group.
- **We're not launching soon.** No dates drive the work.

## 2. Which app is "the app"

There are two apps in this repo. **Build on the new one.**

| | The new app (THE app) | The old app (reference only) |
|---|---|---|
| Where | `prototypes/greybox/hill-app-doors.html` (plain HTML + JS, no build step) | `apps/app` (Expo / React Native, web export) |
| Status | Owner decided 2026-11-07 that this is the app | Frozen. Live at the main link; it has an uncommitted brand reskin (`apps/app/BRAND-CHANGES.md`) |
| Use it for | The product, the screens, the feel | Server features it already has: accounts, sync, circles, placement, reminders |

What the old app had, and whether each piece was carried over, is in
`prototypes/greybox/CARRY-OVER.md` (KEEP-PORTED / KEEP-LATER / DROP). **The KEEP-LATER items are most of your
backlog**: sign-in and sync, "delete my account", the adaptive placement quiz, push reminders, circles, friends,
kid mode, the waitlist, gifts and plans.

## 3. What's real and what's a mockup

**Works now (on the test link):**
- The app's 4 tabs:
  - **Today:** today's lesson, drops and cards, holiday cards
  - **Guide:** the AI chat
  - **Together**
  - **You:** the streak, the Finn outfit locker (30 outfits unlock from day 3 to day 365), your-year recap, journal, backup/restore, Spanish
- **The lesson player:** every lesson of all 8 paths, 14,328 in all. Days 1–30 of each faith play real films.
  - Page: `episodes/c/player.html?door=christianity&day=2`
- **226 story episodes** (`episodes/`), each with its own music mix.
- **55 new films**, painted photoreal with huge captions (`films/wave1`, art in `art/sacred/w1-*`).
- **The Guide** calls the real server function `/api/guide`. When there's no AI key, it falls back to a warm scripted answer.
- **Crisis care** in the Guide, the mood box and the hard-moment page: 988, text 988, "not in the US? 112", in English and Spanish.

**Mockups and prototypes. Work locally, not finished, not reviewed:**
- `community/`: 3 community ideas (crew, Drop Night, small group). The owner's lean is small group plus Drop Night. Community is the top unsolved problem.
- `episodes/storm/`: two story-chat episodes, "the storm on Galilee" and "out on the water". **Need scholar review.**
- `hill-chat.html`: a chat-first version of the app (shares the same saved data).
- `circle.html`, `nights.html`, `world.html`, `map.html`, `trip.html`, `galilee-trip.html`, `hard-moment.html`, `store-test.html`, `dance-stage.html`: earlier experiments; ideas, not finished screens.

**Not built yet (needs a real server, so it's yours):**
- Everything saves on the phone only (localStorage, key `ih-hill-doors`). There's no sign-in, no sync, no accounts.
- The only analytics are an anonymous return ping to `/api/pulse`: days since first visit, the event, nothing about faith.

## 4. Where everything lives

| What | Where |
|---|---|
| The new app and everything around it | `prototypes/greybox/` (map: `prototypes/greybox/README.md`) |
| New website (EN + ES, 38 pages) | `apps/app/public-next/` (`site-new.html` / `site-es.html` are the homepages; `site.html` is an older homepage that now redirects) |
| Old website (live now) | `apps/app/public/` |
| Server functions (Guide, companion, state, wellbeing, circles, waitlist, pulse…) | `api/*.js`, adapted for Netlify by `netlify/functions/` |
| Lesson scripts (source of truth) | `docs/curriculum/<door>/scripts/y<N>/day-NNNN.json` |
| Lessons as the player reads them | `prototypes/greybox/episodes/c/data/<door>/` |
| Guide rules and its 51 test cases | `docs/GUIDE_PLAYBOOK.md`, `tests/guide-cases/cases.json` |
| Brand, voice, personas | `docs/brand/`, `docs/brand/MASCOT_VOICE.md`, `docs/PERSONAS.md` |
| Lesson and film flags still open | `prototypes/greybox/episodes/FLAGS.md`, `films/wave1/REVIEW-NOTES.md` |
| Holiday dates to confirm with scholars | `docs/holiday-dates-for-scholars.md` |
| Day-by-day history of decisions | `docs/HANDOFF.md` (long; newest at the top of each section) |

## 5. How to run it

No build step for the new app. From `prototypes/greybox/`:

```sh
node tools/serve.cjs . 8791
```

Then open http://127.0.0.1:8791/hill-app-doors.html. The Guide needs the server functions, so locally it shows its
fallback answers. To see it with real answers, use the test link.

- **Repo tests:** `npm install`, then `npm run test:unit` at the repo root. 491 of 492 pass. The one known failure
  (`tests/features/why-param.test.mjs`, the old site's "kids" link) comes from the old app's uncommitted reskin.
- **The test link:** https://brand-next--infinite-hill.netlify.app (Netlify login). Built by
  `prototypes/greybox/tools/stage-next.ps1`. The new app is at `/hill/hill-app-doors.html` (also `/app`).
- **Rebuilding films after caption or art changes**, from `prototypes/greybox`:
  1. `node tools/looks-check.mjs --apply`
  2. `node episodes/c/films.mjs`
  3. `node episodes/build.mjs`
- **More build scripts:** `prototypes/greybox/tools/README.md`.
- **Never run `npm run lessons` or `npm run export:web` in `apps/app`.** They rebuild and wipe the live lessons.

## 6. The art and film files

`prototypes/greybox/art/` is about 14 GB (4,400 videos, about 1,150 paintings). That's too big for GitHub, so it's
left out of git (`prototypes/greybox/.gitignore`) and delivered through Infinite Hill's own shared storage.

About 4.4 GB of it is backups that the app doesn't need: the `pre-repaint/` folders, plus `*.kb.mp4` and `*.slow.mp4`.
The test-link script already skips these.

## 7. Rules that don't bend

**Settled 2026-11-10** (these ended open conflicts; they win over any older doc or mockup)
- **(Replaced 2026-11-14) The celebrity guide asks and narrates; Finn never talks.** See the top of this file.
  Guide lines are written by us and checked like every lesson; keep them warm, short, and never on topics a real
  person might object to. Contracts cover the AI voice and likeness.
- **One faith at a time, the Guide included.** On a faith path: no cross-faith answers, no "visit another faith"
  offers. Cross-faith only in "my own religion".
- **Two-faith families follow two separate paths** and switch between them; never mixed in one lesson.
- **Hindu deities may be shown,** as Hindu art traditionally does. Never show God in traditions that don't depict God,
  or the faces of Jesus, Muhammad or the Sikh Gurus.
- **Trips earn story cards; stamps are only for real-life attendance.**
- **Name celebrities as guides, never "signed".**
- **AI-generated people are for mood drafts only;** anything that runs uses real people.
- Justin Bieber's quote on "my own religion" is his 2021 GQ line about not letting shame of his past limit what he can do for people (owner's pick, 2026-11-15).

**Safety and privacy**
- Danger or self-harm always points to 988 (US) or local emergency help, warm first, in every language. Crisis words are never sent to the AI and never saved.
- The Guide must work with no AI key: it falls back gracefully.
- No server keys in browser code, `EXPO_PUBLIC_*` or `VITE_*`.
- Never log credentials, auth headers, someone's chosen faith, practice history, journal text or Guide questions.
- Run the 51 Guide test cases before any demo.

**Religious content**
- Nothing religious goes public without scholar ("Keeper") review. The storm episodes, the holiday dates and the film teaching are all still waiting for it.
- No faces of Jesus, prophets or Gurus. No people in Islamic story scenes.
- The AI never speaks as God. Jesus speaks only words from scripture.
- Prayer is always a choice: watch, learn, or join in.
- Every lesson follows the same shape: the real story, then the faith's actual teaching, then today's life. No self-help tips.

**Voice and copy**
- Every line is warm first, never cold. The guide says "i"; "we" means only the company. Finn has no lines.
- Copy is punchy and current, never corny.
- No "draft" or "review pending" labels anywhere users see.
- Never mention daily AI limits.
- Never invent testimonials or community numbers. Show real counts only above a threshold.
- Never say "signed" about celebrity guides or Keepers.
- No romance or dating mechanics. No sing-alongs. No rainbow gradients.

**Process**
- Nothing goes live without the owner's okay.
- Phone-size screenshots go to the owner before any design or copy change ships.

## 8. Decisions the owner still has open

- Whether films open on their loudest shot (25 films could), and whether to cut the cover so the film starts within 7 seconds.
- Which community idea to build.
- A Guru Nanak Gurpurab (Nov 24) holiday window.
- New art for one Islam film (day 29).
- The Bible translation for Jesus' line in the storm episodes ("Cheer up!" or "Take courage!").
- Year 5 lessons are held until the owner okays them.
- Three small website choices:
  - the founder's note line "we don't care which path" (keep it or cut it)
  - whether the research-page videos say "in production" or "planned"
  - whether the privacy page names the AI provider

## 8b. Build checklist (what Xogito builds, 2026-11-15)

The full rules are in `docs/brand/SOURCE-OF-TRUTH.md` ("Feeling-first, path in order" and "Never over their heads").

**Learning engine: content never goes over someone's head**
- [ ] **Story levels.** Every story carries a `level` (starter / building / deep) and a `needsFirst` list of ideas it assumes, e.g. "knows who Moses is", "knows what the Eucharist is". The tags are filled in during scholar review, so tooling must let reviewers set and change them.
- [ ] **Gating.** A story is offered only when its `needsFirst` items have been met: by a story already done, or by the placement result.
- [ ] **The path is the spine.** Your place moves forward one lesson at a time from where placement put you. A feeling never moves it.
- [ ] **Feeling picks** ("what's on your mind today?") come only from stories you've done, this week's stories, or starter-tagged stories. They are never above your level and never months ahead.
  - Fallback: the closest starter story for that feeling.
  - A pick that isn't today's lesson is a labeled bonus. It counts for the streak, but the path doesn't move.
- [ ] **Feeling tags.** 2–3 stories per feeling per month per path, at each level, so a year-2 learner gets a year-2 story. This is curriculum work with scholar sign-off.
- [ ] **"This was a lot".** After a story, one tap slows things down: easier stories, more explaining, and the option to move back on the path without losing anything.
- [ ] **Quiz signal.** Missed answers after a story keep the next stories easier until the learner is solid.
- [ ] **Placement.** It moves to after the first story, optional ("know some already? 4 quick questions"). It gently moves people back or forward if they were misplaced.
- [ ] **New words.** Each one is explained the first time it's used, and this is checked on every story.
- [ ] **The guide's AI answers follow the learner's level.** Send the level the same safe way as the `live` line ids in `api/guide.js`: server-side text only.

**Pacing: never a zoo**
- [ ] Today's story is always new; never a silent repeat. If a feeling's best fit was already seen, the guide asks "again, or something new?"
- [ ] Rewatching is user-started, from cards or the path. Review is a short spaced-review question about an older story, not a full rerun.
- [ ] One clear next step a day, plus at most one optional extra (a bonus or a holy-day moment, never both).
- [ ] Every day ends with "tomorrow: <next story>". A week-complete moment comes on day 7.
- [ ] The Today screen shows the guide's question and today's story, the week's path below, and at most one optional card. Everything else lives in its own tab or appears only when it matters.

**Platform** (the owner is still deciding some of these)
- [ ] **Accounts and sync.** The pilot says "no account; it lives on your phone". Design accounts so they keep that promise, or wait for the owner's call.
- [ ] **Payments.** A family plan plus ad-free. The free tier may show ads, so never promise "no ads".
- [ ] **Real push reminders.** Today a reminder is a calendar event.
- [ ] **Spanish stories and films.** Today the screens are in Spanish and the stories are in English.
- [ ] **Community.** The owner's top open problem.
- [ ] **Real celebrity recordings or approved voices.** Every voice today is a stand-in.

## 9. Who to ask

Shaan Sethi (owner) decides product, content and anything that goes live. Questions for the kickoff are in
`docs/xogito-kickoff-questions.md`.
