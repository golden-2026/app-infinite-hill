# Handoff (2026-10-03)

Where Infinite Hill stands, for the next working session. Read this, then CLAUDE.md, then the docs it links.

## The owner
Shaan Sethi, non-technical founder. Explain things plainly and briefly, no jargon. He tests on his phone and sends
screenshots. Standing rules live in Claude's memory (empathy-first voice, mascot says "i", screenshots before
design changes go live, ask before deploying, real testimonials only, check usage before big jobs).

## Live now (https://infinite-hill.netlify.app, behind a Netlify login)
- Lessons years 1–3 (days 1–1,061) on all 8 doors, checked; chopped-word bug fixed.
- Homepage: 16 reasons ("which one sounds like you?"), 8 up front shuffled each visit, warm copy, swipe on phone
  opens the card; 18 footer pages as real pages; approved mascot everywhere.
- App: placement anywhere in years 1–3 with gentle walk-back; WHO-5 wellbeing check-in; the gentle lane for grief,
  health news, struggling, forgiveness (4 screens, first lesson is a first-week lesson); all 16 journeys match
  their card; tabs Today/Guide/Together/You; circles; kids track.
- Guide/companion: seeker help (build a path, never refuse), hard-text, hostility and venting rules, mascot voice.
- Voice: docs/brand/MASCOT_VOICE.md (modeled on Usha Kiran; mascot = "i", company = "we").

## Key docs
- docs/PERSONAS.md: 5 personas, 16 reasons, first-week lessons, gaps.
- docs/GUIDE_PLAYBOOK.md + tests/guide-cases/cases.json (30 cases).
- docs/brand/MASCOT_VOICE.md.
- The plan and ranked to-do list: https://claude.ai/code/artifact/3f6bd7cc-7f4d-4456-ab6b-6ed32d015479
  (BCGDV-style stages, 12 weeks, 3 gates; sprints run Tuesday to Monday).

## In progress / next (sprint 1 starts Tue Oct 6, when the weekly allowance resets)
1. Year 4 lessons (days 1062–1426): written and edited; ~430 checked; ~2,500 checks left. Resume the workflow
   `write-lessons-new-process` (script: scripts/workflows/write-lessons-new-process.js, run with the Workflow tool, scriptPath; args {year:4, batch:10, ranges per door
   1062–1426}). Then an Opus second pass on years 1–4. Push each year live only with the owner's okay.
2. Couple features: "walk it together", "before the holiday", couple Guide questions.
3. Guide, sprint 2 (built on a branch, not live): one-tap "switch to my own path" in chat (confirm + undo), the
   sampler week (app/sampler.tsx; 7 written lessons from 7 doors, Keeper review of the picks pending), tidier
   "remember this" chips, and the grader (scripts/learning/guide-grader.mjs; needs a key to run for real).
4. Cost per active user; alpha invites (owner picks 10–20 people); 5 interviews; Panditji sign-off; one voice LOI.
5. The learning engine (owner priority, "as sophisticated as Harvard"): rebuild placement as a real adaptive test (item difficulty, understanding not word-matching, plausible distractors, stop when confident, a short open-answer check before big jumps), then mastery tracking and spaced review. Owner decisions (2026-10-03): placement first, Hinduism pilot, answers hidden until the end, outside expert reviews the rules first. Rules drafted: docs/learning/QUESTION_RULES.md. Next: the fake-test-taker simulator (§9), then the Hinduism bank (104 items) after the Tuesday reset.
6. Owner decisions open: (mascot name chosen 2026-11-03: Finn, pending trademark check); founder's note "we don't care which door" (keep or match); research-page
   videos "in production" vs "planned"; privacy page naming the AI provider.

## How to ship
- App: `cd apps/app; $env:CI='1'; npx expo export --platform web --output-dir ../../atlas/expo-liveN`, then
  `node atlas/pack-functions.mjs atlas/expo-liveN`, then the Netlify MCP deploy-site (site a55f267b-…), running
  its npx command inside the export folder (delete .netlify first). **Since 2026-10-14 that route returns 500; use the Netlify CLI instead** (owner logged in on this PC): inside the export folder, delete .netlify, then
  `npx -y netlify-cli@latest deploy --prod --no-build --dir . --functions netlify/functions --site a55f267b-22cc-4a75-9b82-16133909933a --message "expo-liveN: …" < /dev/null`.
  To ship site-only changes without unapproved app work, copy the last live export and swap in site.html/site-es.html. Last deploy: expo-live71 (2026-10-05: homepage shows only the eight most pressing reasons, one swipe row with a count and an end-aware hint; desktop pills above a wide card). Before that expo-live70 (2026-10-04: sign-up without "heard" or the five-year map, heard asked once after the first lesson; day-one pairs game; simpler win screen; back reviews reading without re-answering; "Priyanka's welcome" header). Before that expo-live69 (2026-10-03 evening: English Guide gets 988 and room for ~250 words on built paths and hard texts; "your move" and "call it" shuffle answers each visit; placement restart draws new starter questions; homepage evidence moves up after "was that the plan?" with 47% / 1 in 2 lonely / 33% less drug use; research page drops the cigarette line and says "women" for the 16-year study).
- Website: edit apps/app/public/site.html with small node scripts; Spanish pairs in atlas/mock/es.mjs (build throws
  on mismatch); rebuild with `node mock/build.mjs --apply` and `--lang es --apply` from atlas/.
- Lessons: never `npm run lessons` (wipes live lessons); build with `--out` to a scratch folder and merge weeks.
- GitHub push and remote changes are blocked for Claude; the owner runs
  `& "C:\Program Files\Git\cmd\git.exe" -C C:\Users\shset\code\golden-app push origin main`.
- Usage: weekly allowance resets Tuesday 2 AM Pacific; extra credits this week $312. Fable does NOT avoid credits
  once the weekly limit is hit.

## Session of 2026-10-06 (pick up here; newest first)
- 2026-11-14/15 (overnight, for Xogito): **consistency sweep of the website and the app, on the test link.** Nothing on prod.
  - **Owner rules from this session:**
    - The celebrity guide asks every question and says every line. Finn is wordless (still art plus a bounce; the dance videos are pulled).
    - No old "Disneyland" place names (Marigold, Olive Grove…). Paths are named by faith. The labeled map art was swapped for the unlabeled version.
    - Places are named only after a story, in the new **reveal → card → your path** flow (`hill-app-doors.html`: `reveal()`, `openPath()`).
    - Pricing: ad-free plus family plans, so never promise "no ads".
  - **Voices:** the 226 episodes were rebuilt so every story plays the new stand-in voice (`V01.mp3…`). After any voice or lesson change, rerun `node episodes/build.mjs`.
  - **Place art:** 40 new paintings (`art/trip/`), wired in through `lessons/places.json` (`img`). Every story in days 1–28 of each faith now has one, except sik-kauda, which has no place. Christianity day 1 is moved from the Vatican to Qumran.
  - **QA:** four walkers covered all 8 paths in English and Spanish; reports are in the session scratchpad (`walk/`). Three fixers then worked on separate files:
    - Spanish switch and the Spanish crisis screen
    - the old navy colors, removed
    - an exit button in the episode player
    - the path and week logic for placed users and mood stories
    - one verb, "claim my card"
    - holy days within 45 days, plus Hanukkah
  - **Website:** all pages match the homepage; colors are brand black and cream; faith chips deep-link to `?pick=<key>`; Spanish links add `lang=es`; the "how it works" shots are retaken from the new app, in English and Spanish.
  - **Build-your-own films re-voiced (2026-11-15, owner yes):** all 24 week-one films in `art/lessons/` now use Justin's stand-in voice and play with sound; spiritual/6 rewritten Matthew-only (Jung line and picture removed). Old copies in the scratchpad `revoice/old/`. Recipe: scratchpad `revoice/run.mjs` (TTS → auto.mjs with NOASR → caps → cut).
  - **Owner decided 2026-11-15:** keep the homepage "what wore you out" crossed-out list; keep "every faith landed on the same rule: love your enemy"; founder letter "the sun on every screen" stays (Finn IS the sun, per MASCOT_VOICE).
  - **Owner decided 2026-11-15 (after phone mockups):** the 7-day no-rest streak is now **"lit"** ("your streak is lit"; Spanish "encendida"); every Israel / West Bank / Palestine / East Jerusalem / Golan place is labeled **"the Holy Land"** ("Tierra Santa"), 1,046 entries across lessons/places.json and places/*.json; Justin's site quote is now his 2021 GQ line "I don't want to let my shame of my past dictate what I'm able to do now for people."; "what i live by" (my own religion) and "what spoke to you" (faith paths) approved to build.
  - **Test link refreshed 2026-11-15 (brand-next only, never --prod):** "what i live by" (my own religion) + "what spoke to you" (faith paths, days 2-7 on every path; Hinduism all 28) in prototypes/greybox (lib/live-by.js); lit streak; the Holy Land; 24 build-your-own films re-voiced as Justin with word-timed captions (spiritual/6 Matthew-only); privacy page rewritten to match the app (EN+ES); Justin GQ quote. Guide server: the app sends only line ids (the request's "live" field), api/guide.js turns them into fixed text from api/_live-by.js (regenerate with films 24 path stories 67 questions 10 after editing lib/live-by.js); a faith path only gets its own stories' lines; tests in tests/backend/guide-live-by.test.js. Not yet proven by a live request. The ~180 new lesson lines need scholar review before anything goes public. Corporate docs refreshed (brand book, BIG-IDEA, VISION-NOW, XOGITO-START-HERE, MASCOT_VOICE); investor deck edited only in a local copy (scratchpad/deck), not published.
  - **Owner decisions open:** Privacy-page features that don't exist; whether Sources shows in search.
- 2026-11-08 (later): **"Cinema" is the film standard** (owner: "Yes, this is the standard. Apply it to every film."). It is on the test link.
  - **The look:** photoreal art, a darker grade, and huge Anton captions with one lime keyword (picker: `episodes/keyword.mjs`, people beat places and God; hand overrides go in the `HOT` list in `films.mjs`).
  - **Art:** 104 repainted films were restored to their original art (`tools/restore-photoreal.mjs`). The stylized versions are now remix looks.
  - **Particles:** removed from both players. The homepage tap-to-throw color and floating dots are off (`#fx` hidden).
  - **Done (2026-11-08 evening):** born-again restored. All 55 wave-1 films have `looks/cinema/` photoreal art and default "cinema" (all 1,511 shots painted). sikhism-9 and spiritual-29 had no art at all; they now have photoreal art in clips/ too. On the test link and checked on a phone-size screen.
    - **ChatGPT flagged "unusual activity"** at 12:29 PT, so ChatGPT was stopped. The last 10 films were painted in Runway (GPT Image model inside Runway), 310 credits; about 10,557 remain. Pace ChatGPT slower when it comes back.
    - Chrome now blocks automatic downloads from runwayml.com (a site setting; the owner can reset it).
    - `tools/looks-check.mjs` now skips films with no original clips (it used to call empty films complete). Lime keyword fixes for 30 films are in the `HOT` list in `episodes/c/films.mjs`.
  - **Test-link refreshes:** the owner gave a standing okay for brand-next refreshes after each batch (never --prod).
- 2026-11-08: **Hill app: local only, not on the test link yet.**
  - **New features:** old-app features 1–4 ported into prototypes/greybox (see `CARRY-OVER.md`): Spanish, journal, rematch, holy-day card/season quest. Shared code is in `lib/ih-four.js`, `ih-es.js` and `ih-seasons.js`.
  - **Remix button** on every film (episodes + lesson player). It offers music, energy, captions, the Finn toggle and looks, and saves picks in localStorage `ih-remix`. Code: `episodes/assets/ih-remix.js`. The looks contract is `art/sacred/<id>/looks/<look>/` plus `looks/looks.json`. Holy films lock to glass.
  - **Repaints:**
    - Christianity 16/16, Catholic 24/24, Jewish 25/26, Hindu 7/7, Buddhist 17/28.
    - Muslim, Sikh, spiritual and jew-ayekah wait for the owner's choice: signature looks or varied.
    - Old art is in each film's `pre-repaint/` folder. Before/after sheets are in `films/wave1/`.
  - **Five-looks test** (Christianity week 1): painting. Day 1's cup shot no longer shows a face.
  - **Fixes:** removed the internal style tag from the player. Fixed the hot words in the first-letters and sik-water configs.
  - **On the test link** (owner: "Deploy the brand-next test link now. Not production", 2026-11-08). Next refresh: drop hill/films (internal sheets went up by mistake).
- 2026-11-07: **TEST LINK, NOT PRODUCTION** (owner okayed "put it on a test link when the films are done"): https://brand-next--infinite-hill.netlify.app (Netlify login; deployed with `--alias brand-next`, never --prod).
  - **Build folder:** atlas/expo-next1, built by the scratchpad script stage-next.ps1 from expo-live130 + apps/app/public-next + prototypes/greybox (→ /hill).
  - **Brand:** the new loud, Magna-style brand is applied everywhere. The brief is prototypes/greybox/episodes/BRIEF.md.
  - **Website:** apps/app/public-next, EN + ES, all footer pages.
  - **The NEW APP:** the owner decided the hill app is THE app. The old Expo app is frozen; its reskin is uncommitted, see apps/app/BRAND-CHANGES.md.
    - /app → hill-app.html: drops, cards, the Finn drip locker, the your-year recap, a one-faith You tab, today's lesson.
    - hill-chat.html (the chat-first version) was archived 2026-11-10 to prototypes/greybox/_archive/2026-11-10/: nothing linked to it, and its chat used celebrity photos (the mascot does all the chatting).
    - /hill/circle.html and /hill/nights.html: community prototypes, local demo only.
  - **Episodes:** /hill/episodes/ holds the 226 story episodes (engine.html, build.mjs, configs/). There are 18 music genres and every episode's mix is unique.
  - **Curriculum:** /hill/episodes/c/player.html?door=&day= plays all 14,328 lessons, type-led. Days 1–30 of each faith play films from films.json.
  - **Wave 1 films** (prototypes/greybox/films/wave1): 58 new films in 22 art styles (ChatGPT paintings), re-cut with fire-w1.sh, plus 93 Runway clips made with Kling (9,599 credits spent; about 10,867 left).
  - **Review notes:** films/wave1/REVIEW-NOTES.md. Lesson content flags: episodes/FLAGS.md. Finn drip: owner approved all 10 fits (2026-11-08); they are in art/finn/drip/ and listed in drip.js; hill-app.html FITS unlock them by streak (5 to 80 days; advent is the Advent holiday fit). Then the owner approved all 20 more (10 streetwear, v3; 10 GQ-inspired, v4; prompts in scratchpad rp/finn3-prompts.json and finn4-prompts.json): 30 fits with art now unlock from 3 to 365 days (FITS in hill-app.html). On the test link 2026-11-08 night (deploy 6af1656d). Player fix: the lime word no longer lights up its trailing comma or period (episodes/c/player.html wordsHTML).
  - **2026-11-08 night (owner: "keep moving forward"):**
    - Film openings: audit in films/openings-audit.md (46 of 55 scored 3 or under). New shot-1 captions applied to films/wave1/specs/*.json (originals saved as *.pre-open); shot-1 lime words set in films.mjs OPEN. On the test link. Open ideas for the owner: open on a later, louder shot (25 films), and cut the cover/intro so the first 7 seconds are the film.
    - Holiday windows fixed in hill-app.html HOLY: ramadan to 03-08, eid from 03-09, holi from 03-19, easter from 03-28, vaisakhi from 04-09. Scholar list: docs/holiday-dates-for-scholars.md (Guru Nanak Gurpurab Nov 24 has no window: owner call).
    - Xogito kickoff questions: docs/xogito-kickoff-questions.md.
    - Community concepts (local): community/ (crew, drop-night, small-group); bet: small group + Drop Night.
    - Story-chat episodes (local, scholar review needed): episodes/storm/ (ep 1 storm on Galilee; ep 2 out on the water in progress). New stills art/sacred/chr-storm/ (Runway, 72 credits).
    - Runway credits left about 10,137.
  - **2026-11-09: handover prep for Xogito** (owner: "Write the handover guide and tidy everything").
    - Their guide: `docs/XOGITO-START-HERE.md`. Folder map: `prototypes/greybox/README.md`.
    - The tidy moved 145 backups, QA folders, screenshots and old mocks into `prototypes/greybox/_archive/`. Nothing was deleted, and the test-link script skips the archive.
    - `prototypes/greybox/.gitignore` keeps the 14 GB of art and the video files out of git. The code is about 250 MB.
    - Nothing is committed or pushed yet. The owner pushes, and decides where the art goes.
  - **2026-11-09: film polish** (owner: "Do the polish list first"). On the test link.
    - **ChatGPT is working again** (owner, 2026-11-09). Pace it: one chat, one image at a time.
    - **10 pictures repainted** in ChatGPT (0 Runway credits): islam-29 shots 1, 2, 4 and 6; christianity-9 shots 1–4 (now a modern dinner); christianity-10 shot 6 (no cap); catholic-30 shot 6 (no crucifix). Clips are 8 s ffmpeg pushes. The old clips are in `_archive/backups`. Notes are in films/wave1/REVIEW-NOTES.md.
    - **Cold-open test:** `player.html?cold=1` plays the film's loudest clip behind the cover, then runs the film before the hook. Uses `film.loud` from the `LOUD` list in films.mjs (25 films; the others use shot 1). It's off by default until the owner chooses.
  - **2026-11-09: week one must be "fire"** (owner: "The first 7 days for all religions need to be fire to get people to not bounce").
    - Done: the 40 reused films in days 1–7 (all faiths) got short cinema captions, hook first (`episodes/c/caps-week1.mjs`, read by films.mjs; the old films.mjs is in `_archive/backups/films.pre-week1.mjs`). The lesson files are unchanged.
    - Proposed next: film-first by default in week 1; cut each week-one lesson from about 500–700 words to about 250; a reward at the end of every week-one day.
    - Phone screenshot tool: scratchpad `phoneshot.mjs <url> <out.png> "<js>" <waitMs>` (headless Chrome over CDP, 390x844 @2x).
    - Owner list of every Hindu day: `docs/HINDUISM-ALL-DAYS.md`.
  - **2026-11-09: Hindu month 2 films** (owner: "Work on Hinduism as much as you can… I can properly review").
    - Days 31–60 (the Ramayana): 28 new photoreal "cinema" films. Specs: `films/wave1/specs/hinduism-31..59.json`, made by scratchpad `hindu-m2.mjs`. Days 40 and 60 reuse `rama` and `vibhishana` (map.json). The old map is in `_archive/backups/map.pre-hindu-m2.json`.
    - Caption review sheet for the owner: `films/wave1/HINDU-MONTH2-REVIEW.md`.
    - Painting: 2 ChatGPT painters, about 1 picture a minute each (queues in scratchpad `paint-w1/queue-h1.txt`, `queue-h2.txt`). Unpainted films stay type-led.
  - **Video tools:** OpenAI has shut Sora down, so ChatGPT makes stills only. Runway handles motion; Kling (run inside Runway) won the bake-off.
- 2026-11-04 overnight: **TEST LINK, NOTHING LIVE**: draft https://app-next--infinite-hill.netlify.app/hill/hill-app.html
  (owner login; deployed with `--alias app-next`, never --prod).
  - Has: the Today mood loop (guide asks → one played story → globe flight → story → stamp → opt-in other faith);
    52 passport stamps (art/stamps/stamps.js; 50 are places you can earn, so the count says "N of 50"; jerusalem and
    samos wait for trips); new lessons `ruth` (Christian grief → Bethlehem) and `isl-ibrahim` (Muslim grief →
    Medina); grief swaps `jew-glass` (→ Western Wall) and `bud-mustard` (Kisa Gotami → Lumbini); "i'm missing
    someone" is always one of the taps; the reviewer's fact fixes to the pitch and "why i brought you" lines (tradition
    vs text wording, Upper Room, Cana, Capernaum, Aaron/Sinai, Ben Zoma, Rabbi Yochanan's bandit, tawbah, alhamdulillah)
    and a wider crisis-word list (988).
  - Fixed: the "here's why i brought you" line now shows on the first landing screen of every trip (trip.html); all
    40 picks checked at 390×844, place name never covered. Passport: real stamp art for every earned place, painting
    with a perforated edge if a stamp is missing, tidy 3-column grid, locked tiles greyed "?".
  - Tested (390×844, no console errors): Christian angry → lost son → Galilee → stamp → yes, another faith → Sinai
    stamp; Muslim grief → Ibrahim → Medina; Jewish grief → the glass → Western Wall; Hindu grief typed + 988 crisis
    line; passport with 8 stamps. Screens: prototypes/greybox/mood-loop-phone-screens.jpg.
  - Scholar check before any of this goes live: Ruth items (Boaz "relative of Naomi", chapters 3–4 left out, "they had
    nothing", "house of bread", hesed framing, Shepherds' Field as tradition); Ibrahim items (age "not yet two", "held
    him", "my father Ibrahim", "out by the palm groves", al-Baqi burial from the sira, eclipse report, Ya'qub's eyes,
    tears vs wailing, no-people art, sabr/rahma glosses); the Western Wall line ("this wall once held up the hill the
    temple stood on") and the glass folk reading; the Kisa Gotami lines (Burlingame wording, du/kha picture, Savatthi
    "a few days' walk west" of Lumbini); and the near-not-exact place framings (lost son → Galilee, Aaron → Sinai,
    Cana → Tzippori, Emmaus → Mount of Olives). Each lesson's list is in lessons/<id>.json `card.check`.
  - Lesson-place stamps: when a played story's own place (lessons/places.json placeId) has stamp art in IH_STAMPS, the
    stamp moment and the "STAMPED!" screen show it (e.g. bud-mustard → Shravasti); the passport keeps "N of 50" and adds
    "and N places from your stories" with its own grid (saved as S.lplaces); otherwise world stamp, then painting.
- 2026-11-03 night: **TEST LINK, NOT LIVE**: the hill app now does the homepage video's loop. Draft (owner login):
  https://app-next--infinite-hill.netlify.app/hill/hill-app.html (try `?why=grief`).
  - Today opens with the home's guide asking "what's on your mind today?": 4 taps (angry at someone i love, a worry,
    i feel lost, a good day) or your own words. The guide answers warmly and picks ONE played story from your home
    ("yes, take me there" / "not now"). Yes → globe flight (trip.html) to a real place → landing → the story →
    the stamp drops into the passport ("Sea of Galilee is in your passport · 1 of 50 places").
  - Then, opt-in only: "every faith has a story about this. want to hear how another faith tells it?" → same loop
    with another faith's story (order: Jewish, Muslim, Hindu, Buddhist, Sikh, Christian, Catholic, my own religion).
  - Hand-picked feeling → story → place table: `MOOD` in prototypes/greybox/hill-app.html (8 homes × angry, worry,
    lost, good day, grief). `?why=` from the site (kids, sent, partner, own, hard, grief, god, diagnosis) changes the
    first line, and for grief/hard/diagnosis the taps too. Crisis words still get the 988 line, no story.
  - Passport tab: earned stamps as images, a few locked "?" tiles, "N of 50". Stamp art is art/stamps/<world>.jpg,
    listed in art/stamps/stamps.js (re-list after adding art; anything unlisted shows the place painting with a
    perforated edge). jerusalem.jpg and samos.jpg aren't place ids the app uses yet.
  - Tested: two full loops on a 390×844 phone (Christian angry → lost son → Galilee, then Jewish → Aaron → Sinai;
    Hindu grief typed in own words → new clothes → Varanasi; crisis line), no console errors. Screens:
    prototypes/greybox/mood-loop-phone-screens.jpg. Driver: session scratchpad mood-test.mjs.
  - Copied into atlas/expo-live130/hill (hill-app.html + art/stamps/). That folder is also what production deploys
    from, so the next --prod deploy will ship this too. Needs the owner's okay first.
  - Still open: scholar check of the 40 guide pitch lines and "why i brought you here" lines (some places are near,
    not exact: e.g. the lost son is flown to Galilee as in the video; Aaron to Sinai); more stamp art; Spanish.
- 2026-11-03: **expo-live130 is LIVE** (owner okayed). New homepage: the proposed pages were copied over site.html and site-es.html (old drafts are in the session scratchpad as site-pre-live.html). The video now includes the trips (a globe flight to Galilee, a gondola to Jerusalem), about 41 s. Earlier notes:
- 2026-11-03 (later): **expo-live130 redeployed LIVE** (owner okayed). Homepage video is now the all-faiths trips loop (~2.5 min): Denzel asks, you say "angry at my brother", he picks the prodigal son, flies you to Galilee, you play it and earn a passport stamp; then, opt-in, each of the other 7 faiths gets a Denzel reason line tied to the fight, a landing, a 6 s story and a stamp; ends on the full passport. Build files: session scratchpad v11/ (cards3.mjs, list.txt) and v10/stamp.mjs. Hero note now says the guide "takes you to a story from every faith, if you want".
- 2026-11-03 (later): **LIVE** (owner okayed "make the main address open the new app"). The front door "/" stays the website; every English "start" button on site.html now goes to /app, and _redirects sends /app to /hill/hill-app.html (302). The Spanish site still opens the older Expo app, because the hill app is English only. The installed-app start_url is still /today (old app).
  - Demo link (draft, owner login): https://homepage-demo--infinite-hill.netlify.app/site.html (made by swapping
    apps/app/public/site-proposed.html and site-es-proposed.html into atlas/expo-live130 as site.html/site-es.html,
    deploying with --alias homepage-demo, then restoring the folder).
  - New order and copy are in BIG-IDEA.md. Builders: scratchpad proposed.mjs (EN) and proposed-es.mjs (ES); cut
    sections are hidden at the end of the page, not deleted. The atlas/mock/es.mjs pairs are NOT synced yet.
  - 30-second video: site-art/lesson-demo-30.mp4 (guide asks → son who came home → optional Jewish story → "two
    faiths. one lesson. picked for you."). Cards from scratchpad v30/cards.mjs; clips reuse seg3 part1/part3.
  - Evidence: 4 cards in a 2x2 grid (happiness 36% vs 25%, Pew 2019, verified; interfaith 39%; 14 of 32; 18–24).
  - Footer pages reviewed vs expo-live129: only label removals ("design comp / not signed"), camp→chapter, and the
    contact line (duplicate fixed). OK to ship with the owner's okay.
  - To ship to production: copy the two proposed files over site.html/site-es.html (worktree + expo-live130), then
    deploy --prod. The /hill test app sits in the same folder (unlinked).
  - Build partner: owner leaning Xogito (5-week $25K phase as written, steer at kickoff) + Anurag/Hans as paid
    consultants. Draft reply to Gus is in the chat, not sent.
- 2026-11-02 night (owner: "do all four" Duolingo moves, then "use ChatGPT and runway and do all of them"):
  - Test link (draft, NOT live): https://6ae98eb10b11c357faa30365--infinite-hill.netlify.app/hill/hill-app.html
    (also /hill/hard-moment.html, /hill/advent.html?today=2026-12-13, /site.html#hill). The deploy folder
    atlas/expo-live130 now also holds the worktree's site.html/site-es.html: check that diff before any production deploy.
  - Hill app (prototypes/greybox):
    - Real streak: streak.js is a browser copy of packages/domain/src/streak.js (rest days, earn-back with 2 stories in
      3 days, golden). hill-app keeps S.log {date: [keys]}.
    - Streak-saver banner on Today; a rolling 7-day row in You; milestone/golden/earned-back celebration after "Head home".
    - Daily nudge = a repeating calendar event (.ics); real push still needs the app build.
    - Return counts: hill-app pings /api/pulse with variant "hill" (anonymous; proven on the draft by the page's own 204).
      One hand test with variant "qa-check" returned 500 and may have left a stray variant name.
    - New people start at 0 (the old invented "2-day streak" is gone).
    - "My week on the hill" share card (canvas, counts only).
    - Today has "rough moment?" (hard-moment.html) and, Nov 16 to Dec 25, an Advent card (advent.html). The Guide chat
      offers the rough-moment flow on fight/yell words.
  - Lessons (play.html):
    - A missed question comes back in the next day's story ("remember this one?", localStorage ih-review).
    - The guide asks each question and reacts to each answer (text only).
    - The run carries through the day: big moment at 5, full-screen moment at 10, "perfect story" when there are no misses.
  - Art (ChatGPT, 10 stills; Runway 50 credits) in art/moments/. The Advent door is now drawn in code so it shows the
    right number; door-open.mp4 is unused.
  - Phone QA fixes:
    - stories without a painting land on the lesson poster (not black);
    - no-3D phones skip the globe;
    - the 360px You tab fits; the notes "i" button is hidden; the title is "Infinite Hill";
    - wave.webp is 20 KB, earth.jpg 211 KB;
    - the dancer sits behind cards.
  - Still open from QA:
    - 57 lessons need their own place painting;
    - places/map-index.json is 2.6 MB;
    - the "Your week" thumbnail row is tiny; the passport shelf is a wall of "Not yet";
    - the gondola video letterboxes at 360;
    - parables promise a "real place";
    - Together/Courses thumbnails repeat;
    - guide quotes (e.g. Denzel's "First thing I do is pray…") need a source check.
  - Website: a #hill section ("every day, one step up.") in site.html and site-es.html, plus its es.mjs pair. The summit
    picture is swapped for lookout-5 in site.html, site-es.html and atlas/mock/motion.html.
  - Mascot name shortlist: docs/brand/MASCOT_NAMES.md (pick: Finn).
- 2026-10-30 night (owner: "the hill is your house, the world is outside"):
  - LIVE AI IS DOWN. /api/guide and /api/companion?kind=chat both return 502 within about 1 s on production and on
    drafts; status says on:true, so the key is set. Switching to claude-sonnet-5-5 on a draft didn't help (reverted).
    Likely the key or billing on the Anthropic account. The owner must check it; confirm with a live request after.
  - Test link (newest draft): https://6ae56736e3e5f31240fe0907--infinite-hill.netlify.app/hill/hill-app.html, plus
    /site-night.html. Summary page: https://claude.ai/artifact/BiDPTTg4ibcvQP3EBY5371
  - Hill app:
    - The guide's face speaks on Today and on every trip bubble.
    - Coming home after a trip: trip.html saves ih-trip-last; Today says welcome home, lantern +1 once per day, and
      shows tomorrow's place.
    - The passport shows real places.
    - "visit another home" and "The world" tiles; Together adds "go for real" and "nights on the hill".
    - The Guide tab calls /api/guide with a warm fallback and a client-side 988 line.
    - Western Wall, Kedarnath and Iona trips run as painted scenes with no 3D.
  - site-night.html (draft): "inside the app" is now the journey: guide asks → fly → real place → story → quiet
    minute → home → music → scholar. New clips are site-art/world/app/t-fly, t-quiet, t-place (Ken Burns from our own
    art). The hill section says the hill is home.
- TEST LINK, NOT LIVE (2026-10-31 night, owner: "write and paint the other 47, captions only", then "do all four"):
  - Week one of all 8 paths is played lessons (56): 47 new captions-only living-painting lessons (282 ChatGPT
    paintings → kb-lesson.sh clips) + the 9 below. Ids: abram nets born-again zacchaeus rest; cat-sign cat-bread
    cat-ars cat-beads cat-cana cat-ashes cat-cloak; jew-pearl jew-angels jew-worse jew-dough jew-glass jew-judith
    jew-hillel; isl-bismillah isl-fatiha isl-wudu isl-inshallah isl-doubt isl-ramadan isl-eid; bud-karma bud-bow
    bud-oil bud-deer-park bud-alms bud-vesak bud-lamp; sik-wow sik-bargain sik-crown sik-five sik-water sik-river
    sik-khanda; wild-maybe wild-lute wild-notebook wild-bow wild-wagon wild-shadow wild-karma. Each written, then
    reviewed by a second agent; all 47 playtested to the end. Each lesson's `card` holds sources and check items.
  - Week two written + reviewed for all 8 (49 new + Hindu week-two films turned into played lessons), all painted
    (~292 more paintings) and playtested to the end. Lessons without clips would show "coming soon" (wire-week1.cjs
    sets `soon`); none do now. Week-two ids: chr-past chr-well chr-breakfast chr-scales chr-joseph chr-jonah
    chr-morning; cat-loaves cat-fiat cat-visit cat-abba cat-ezra cat-peace cat-sunday; jew-sodom jew-wrestle jew-sinai
    jew-manna jew-aaron jew-shema jew-hannah; isl-salaam isl-pillars isl-salat isl-hamd isl-rabb isl-rahma isl-din;
    bud-mustard bud-gold-rain bud-patacara bud-old-city bud-stop bud-sal-trees bud-silence; sik-seva sik-doors
    sik-bronze sik-boulder sik-lalo sik-needle sik-tera; wild-mud wild-earth wild-room wild-spice wild-whisper
    wild-branch wild-ten. Week-two items are in each lesson's card.check (no scholar pack for week two yet).
  - Hill app wiring: scratchpad wire-week1.cjs (re-runnable, /*W1*/ markers) adds CLASSES, keepsake icons, home lists.
    Deploy copy: scratchpad sync-hill.sh → atlas/expo-live130/hill. Draft:
    https://6ae6f2080b3fc3557d7876d5--infinite-hill.netlify.app/hill/hill-app.html
  - Scholar pack: docs/review-kit/scholar-pack-week1/ (187 items; rebuild with scratchpad pack/build.js after edits).
    Open owner decision: some Balmiki communities object to the Valmiki robber story (Hindu day 3).
  - Demand-test drafts (not published): prototypes/greybox/store-test.html, docs/review-kit/store-test.jpg.
  - Demo video: docs/review-kit/demo-abram-lesson.mp4. Phone sheet: docs/review-kit/week1-all-paths.jpg.
  - Nothing is live; all religious content awaits Keeper review and the owner's okay.
- TEST LINK, NOT LIVE (2026-10-31, owner chose "start with the lesson player and one week of questions" and "first
  week of all 8 paths, films included"):
  - One played-lesson player, `prototypes/greybox/play.html?l=<id>`, reads `lessons/<id>.json`. A lesson runs: film
    shots with voice, then ask/fill/match taps, teach, today, lesson complete. Played standalone, the streak and invite
    screens follow. Inside the hill app (`&app=1`) it posts "done" to the hill's keepsake screen.
  - 9 lessons so far: Christian light and lost-son, plus Hindu week 1 (ganesha-first, tusk, valmiki, no-effort,
    universe, first-letters, milk). The hill app's classes now open them.
  - Draft: https://6ae6801759b78f0cb4b22fff--infinite-hill.netlify.app/hill/hill-app.html (one lesson on its own:
    /hill/play.html?l=milk).
  - Tools (scratchpad): mkplay.cjs, extract-film.cjs, week1-filmed.cjs, playtest2.mjs.
  - Scholar review needed for the new facts in the questions: pradakshina, Ekadanta, adi kavi, "mara mara",
    Vijayadashami, Pongal, and the sun on day four.
  - To do: 47 more week-one lessons.
    - Christian (5): Abram, nets, born again, Zacchaeus, rest.
    - 7 each for Catholic, Jewish, Muslim, Buddhist, Sikh and Wildwonder.
    - Each needs a story, about 6 ChatGPT paintings made into living paintings, and questions.
    - Narration needs Runway voice credits; without them, captions only.
- LIVE: expo-live131 (2026-11-11, owner approved): copy of expo-live130 (verified file-by-file against the live deploy; post-deploy drift in 3 stamp images and hill/map.html reverted to the live versions) with one change: voices and Keepers shown as live, no "signed"/"targets"/"being seated" wording (site, site-es, provenance, provenance-es, science, science-es, site-night). Deploy 6af49e3ae8a98de48eb3134e.
- LIVE: expo-live130 (2026-10-31, owner approved "put the hill version live"). The hill version is at /hill/hill-app.html: guide-first welcome, trips, coming home, every card linked (family, courses, walk-together, today's daily card), Today scrolls on iPhone, globe pictures restored; "just curious", "spiritual" and "more than one" now start at Wildwonder, not the Christian home (live 2026-10-31). The AI Guide was down because the Anthropic key "infinite hill" expired on 2026-10-29. The owner made "infinite hill 2" and put it in Netlify ANTHROPIC_API_KEY (all contexts). After the deploy, live /api/guide answered with status 200. Keys can expire: check the console before an expiry date.
- TEST LINK, NOT LIVE: expo-live130 (2026-10-30), a Netlify draft deploy behind the same login:
  https://6ae55f0b0ddaeeb8e56e6708--infinite-hill.netlify.app/hill/hill-app.html
  It is 129 with /hill/ replaced by the current prototypes/greybox (no source/ folders; about 2.2 GB, including 47
  Marble worlds, both light and full). Changes in the prototype:
  - Guide-first welcome: pick a celeb guide; the guide says hello, asks "where are you with religion", answers and
    takes you home. "Help me choose" keeps the old two questions plus the map.
  - Today opens with "today your guide is taking you to <place>" for all 8 homes (trip.html?w=, from
    places/trips.js; kedarnath, western-wall and iona are skipped because their worlds never finished). The story
    film stays below.
  - Trips end with "sit here quietly" (a 1-minute breathing light in the 3D place), "open your map", or back to the
    hill.
  - The map tile goes to that home's path.
  Production is still 129. Promote to production only with the owner's okay.
- LIVE: expo-live129 (2026-10-30, owner approved): copy of expo-live128 with one change: `_headers` X-Frame-Options
  DENY → SAMEORIGIN. DENY blocked the hill app's class films, which play inside a frame on the same site; other sites
  still can't frame us. Checked live: the header reads SAMEORIGIN and the Let There Be Light class loads inside
  /hill/hill-app.html. Owner is signed in to Netlify in Chrome, so Claude in Chrome can view the live site.
- LIVE: expo-live128 (2026-10-29, owner approved "add it as a separate page"): copy of expo-live127 plus `/hill/`
  (redirects to `/hill/hill-app.html`): the middle-ground app prototype and all 32 story films (28 Hindu + 4 Christian),
  copied from `prototypes/greybox` without the `source/` folders, each page given a doctype + charset + phone viewport
  (the artifact skeleton used to add these). App and homepage unchanged. Behind Netlify team protection: viewers need a
  Netlify account invited to the team. Next (owner: "start on the new homepage too"): the night-look homepage draft
  `apps/app/public/site-night.html` (not live).
- NOT LIVE (2026-10-28, owner direction): the "middle ground" app prototype, `prototypes/greybox/hill-app.html`
  (private artifact https://claude.ai/artifact/DxLPmRWdyAf5Mdij8GjRsJ). The current app's shape (Today/Guide/Together/You,
  class picked for you), but the class is a story film with guess/"your turn" pauses and a 3-question check; Today opens
  on the living painted map; gondola rides between homes (passport stamps); keepsake shelf; lantern streak; no
  leaderboards; no 3D. Owner: "make everything the rich look" (night + lamplight everywhere, sign-up included). Bridge
  between the cartoon world and the sacred films: the story circle (cartoon family + mascot at a fire / lamp circle,
  painted in the films' light); "Hear the story" flies into the flames. Films (stand-in voices, scholar review pending):
  light-film (Genesis 1, Elias), lost-son-film (Elias), ruth-film (Miriam), broken-tusk-film (Arjun); each runs inside
  the app with `?app=1`. Art made through ChatGPT + Runway (Runway Max, ~320 credits per 8 s clip, ~$0.01/credit).
  Next: owner okay before any Netlify test link; scholar review; a week of films per faith.
- NOT LIVE (2026-10-29 overnight, owner: "create as many Hindu films as possible"): 28 Hindu story films, one for every
  Marigold month-1 lesson (weeks 1-4 of `apps/app/src/content/classes/hindu-month1.ts`), in course order. Moving-clip
  films (Runway): ganesha-first, broken-tusk, valmiki, no-effort, universe, first-letters, milk, rama. Living-painting
  films (6 ChatGPT paintings + slow camera moves, no video credits): the other 20. ganesha-head, ahalya, holika and
  durga are told gently (no violence shown or said; Runway's voice filter and ChatGPT's image filter blocked plainer
  versions, so the clash at Ganesha's door is "a terrible misunderstanding" and Holika "tried a trick with a great
  bonfire"). Review pages (private artifacts): https://claude.ai/artifact/5rYsSbuzn2bPSgJeyBLzqr
  (`prototypes/greybox/hindu-films.html`, 24 films; full at ~500 files) and part 2
  https://claude.ai/artifact/2W9RapahknjjTBiVvE5y2L (`hindu-films-2.html`: ganesha-head, ahalya, holika, durga). Films are wired into the
  prototype's Marigold classes + keepsakes and into the app's Hindu film list (`apps/app/src/ui/hill-home.tsx`;
  art copied to git-ignored `apps/app/public/films`). Markandeya narration softened ("the god who ends each life's
  journey") after Runway's voice filter blocked the first wording. ChatGPT chats sometimes broke ("connection
  interrupted"); run 2-3 at a time. Scripts: scratchpad specs/make-specs2-7,
  build-film.cjs, kb-film.sh, cutvo.cjs, add-hindu.cjs, sync-films.sh, make-gallery.cjs. Runway: 964 credits left
  (3,019 at the start of the night). Stand-in Arjun voice; scholar review pending; nothing deployed.
- LIVE: expo-live127 (2026-10-23, owner approved): homepage film only (80s): map pin "the waterfall · a few quiet minutes to meditate" → zoom → painted waterfall with the mascot → her phone in the car ("meditating at the waterfall, on her phone"). Investor film (2:28) gets the same waterfall moment plus slower pins for gospel on the steps and festival night; map tour now comes before them. Pin animation: scratchpad/film16/pinanim.mjs.
- LIVE: expo-live126 (2026-10-23, owner approved): homepage film only: guide line now "Your guide listens, and suggests your day. Where you go is always up to you." (75s). Investor film done: pitch-film-kit/Infinite-Hill-Investor-Film-Full-HD.mp4 and -Mobile.mp4 (2:14; stats cards, guides wall, picker → painted Denzel, class, Keeper desk + scholars wall, go wherever you want, labeled map tour, Sunday, summit, end card). Build: scratchpad/film16/build-inv.cjs.
- LIVE: expo-live125 (2026-10-22, owner approved): homepage rebuilt around the big idea (en+es): hero (celebrity guides, "the most fun, most personalized way to learn a religion, or create your own", Start free + watch the film) → why (3 stats, "we can learn, together") → introducing infinite hill: 71s film (site-art/world/real/film.mp4; real woman in a car, the painted world only on her phone; choose-your-guide picker → Denzel; class; waterfall; Sunday church; end card "making religion yours again") → inside the app (phone walkthrough) → guides you already know (rotating quotes) → the map (homes led by religion name; coined names only on the map) → Keepers → what would you tell your guide? → stories → FAQ (Is it free? etc.) → close. Footer "not signed" note removed (owner: celebs and Keepers are signed). Film narration is English on the Spanish page too. Film build: scratchpad/film16/build4.cjs; source clips pitch-film-kit/real-clips.
- 2026-10-22 BIG IDEA LOCKED: "step in to remember who you are. step out to live it." (docs/brand/BIG-IDEA.md is the source for every material). Updated: brand book opening, investor deck (cover, thesis, Introducing, What it is like, It knows you), intro pack one-pager. Not yet: website rebuild (local work in apps/app/public/site.html is a v4 draft, NOT live; live is expo-live124) and the film, both waiting on the 7 new scenes (pitch-film-kit/STEP-IN-SCENES-PROMPTS.txt); app copy not touched.
- LIVE: expo-live124 (2026-10-22, owner approved): homepage adds "we're divided. we're confused. but we can learn, together." after the research, and moves the golden rule (one human race, one hill) up to right after the map, matching the film (en+es). App unchanged. Film v15 done: pitch-film-kit/Infinite-Hill-v15-Mobile.mp4 and -Full-HD.mp4 (new world scenes, music line "every home has its own music…", hosts line, retitled celebrity card; built in scratchpad/v15).
- LIVE: expo-live123 (2026-10-21, owner approved): homepage new flow (copy of expo-live122 + site.html/site-es.html): hero (celebrity photos kept) → why + research → the world (map; homes link to start; Wildwonder build-your-own; old doors section removed) → a day (phone walkthrough, class steps) → hosts (voices as Host of each home) → Keepers → year one (twelve themes, replaces 100 days) → which one sounds like you → one human race → stories, pricing, FAQ, join. Wide 16:9 versions of the 8 scenes saved in pitch-film-kit/app-screens-wide for the film update.
- LIVE: expo-live122 (2026-10-21, owner approved): homepage only (copy of expo-live121 + site.html/site-es.html + site-art/world/): under the hero, "a world you visit every day" line; after the Keepers, the map of the eight homes (Olive Grove first), a phone walkthrough of a day (8 Runway clips in site-art/world/app with the app UI drawn on top), the five class screens (the lost sheep), FAQ adds "Is it a video game?" and "Do I have to pray?", How long is it = twelve monthly themes; music wording promises a station always on plus a big night monthly, not nightly concerts. Spanish mirrored (atlas/mock/es.mjs not synced). App unchanged. Owner then said the page flow may not fit the new vision; reorder proposed, not done.
- LIVE: expo-live121 (2026-10-16, owner approved): Hindu quality pass for years 1–4 (1,426 lessons; the y4 planning-label titles are gone), week one keeps its design plus the friend chat, placement bank rebuilt, next-day recap fixes on the other paths. Held: year 5 (all paths) and the Catholic v3 pilot week (days 22–28 kept at the live version).
- LIVE: expo-live120 (2026-10-15, owner kept all 8 on the approval page): app update with the "our family" card + screen (kid answers, shared lessons), daily card, "same idea, another door", tie-back card (option A) + "why? ask the guide", iPhone voice unlock, Guide family rules. Lessons copied unchanged from expo-live119.
- LIVE: expo-live119 (2026-10-15, owner approved): built from expo-live118 plus only: 988 named in five lessons' crisis notes (christianity 733, spiritual 321/738, buddhism 837/1039); real titles and carries for 185 y1–4 lessons on 7 paths (planning labels; docs/curriculum/<path>/day-lines.json); site "we'll help you create your own" (en+es). App code unchanged (new screens await the preview tour). Not live: Hindu quality pass, year 5, Catholic pilot week.
- LIVE: expo-live118 (2026-10-14, owner approved): homepage only: closing adds "a little more love, a little less fighting"; in-laws quote first in stories; interfaith FAQ first; Day 50 "the lights" (replaces "the serial"); third family card "our kids ask questions about our religion, and we don't have the answers." (en+es).
- LIVE: expo-live117 (2026-10-14, owner approved): homepage hero only: "why religion? … for being okay, together." and "every faith on one hill, more alike than we think. learn your faith, or create your own, in five fun minutes a day." (en+es). Copy of expo-live116 + site files.
- LIVE: expo-live116 (2026-10-14, owner approved): homepage only (copy of expo-live115 + site.html/site-es.html): the three interfaith-family cards first in "which one sounds like you?" (partners of different religions; what to teach the kids; kids who don't understand the religion in our home). Deployed with the Netlify CLI. NOT live yet: daily cards, pilot week (recipe v3), pulse fix.
- LIVE: expo-live115 (2026-10-12): door card photo says 'your voice for every lesson'; Today done card has 'keep going: day N'.
- LIVE: expo-live113 (2026-10-12): voice photos are clean square crops around each face (app+site); door card trimmed; answer taps light up before moving on.
- LIVE: expo-live112 (2026-10-12): swipe cards same height; voice photos pre-framed (face centered, same scale) on site en+es.
- LIVE: expo-live110 (2026-10-12): swipe-card counter removed.
- LIVE: expo-live109 (2026-10-12): voice portrait full size on the door card; 'meet your voice' screen retired (redirects to the welcome).
- LIVE: expo-live108 (2026-10-12): 'which one sounds like you' swipe cards on phones (en+es).
- LIVE: expo-live107 (2026-10-12): merged 'how it plays' section (en+es): Christian day screenshots with Nia, then the rotating demo with cast faces; softened scholar line.
- LIVE: expo-live106 (2026-10-12): one-hill/love copy on site and app (en+es); mixed-faith stats (Pew 39% interfaith marriages, Pew 14 of 32, Global Flourishing 18-24); voice photo crops; keepers name wrap; 'my own religion' label. site-es edited directly, atlas/mock/es.mjs not synced for these lines. test:unit: account-screen + backend/state fail on a vite.config path (pre-existing, not content).
- LIVE: expo-live105 (2026-10-12): site one-hill message + new verified evidence stats (en+es). NOTE: site-es.html was edited directly; atlas/mock/es.mjs pairs for these lines are not yet updated, so a full site rebuild would revert them until synced.
- LIVE: expo-live104 (2026-10-12): Spanish site day screenshots 1-2 now show the cast too.
- LIVE: expo-live103 (2026-10-12): Nicole Kidman replaces Mark Wahlberg as the Catholic voice (app + site, en + es; Mark is tied to Hallow). Site day screenshots 1-2 now show the cast (English only; Spanish still old). Families section tried and dropped (owner: homepage already long). Spanish pairs in main atlas/mock/es.mjs updated for Nicole.
- LIVE: expo-live102 (2026-10-12): fixed wrong chat faces (Ava showed Ong, Pop showed Marcus, Jordan showed Dadi); lesson scenes now 4:3 framed on faces (was a short top strip); Catholic and Islam welcome pictures recropped.
- LIVE: expo-live101 (2026-10-12): new Abuela (big and bold, no glasses) in faces, family and 5 Catholic scenes.
- LIVE: expo-live100 (2026-10-12): Catholic family picture with Sofia in navy.
- LIVE: expo-live99 (2026-10-12): Christianity family redrawn (white family outside Nashville; Nia replaces Leo; Marcus a firefighter); fix-up #2 done (Noa green, Sofia navy, Amira teal). Remaining fix-ups in scratchpad castkit REMAINING-CAST-CHANGES.txt.
- LIVE: expo-live98 (2026-10-11): My own religion cast (Zoe, Ray, Ines, Theo; friends, not family) in the chats, 6 scenes on 12 lessons, porch picture on its welcome. All 8 paths now have casts. Next: look-alike fix-up round (castkit FIX-UP-ROUND.txt).
- LIVE: expo-live97 (2026-10-11): Buddhist cast (Mai, Ong, Linh as the mom, Ava) in the chats, 6 scenes on 12 lessons, family on its welcome.
- LIVE: expo-live96 (2026-10-11): Sikh cast (Simran, Bebe, Harjit, Maya) in the chats, 6 scenes on 12 lessons, family on its welcome; Islam prayer scene (days 2, 112).
- LIVE: expo-live95 (2026-10-11): Islam cast (Amira, Dadi, Yusuf, Jordan) in the chats, 4 scenes on 8 lessons, family on its welcome. Mosque scene held (shoe logos). Owner: fix look-alikes across casts after all paths are done.
- LIVE: expo-live94 (2026-10-11): Catholic cast (Sofia, Abuela, Tomás, Mia) and Judaism cast (Noa, Saba, Rachel as the mom, Owen) in the chats, 6 scenes each on 12 lessons, families on their welcomes. Paste files for Islam, Sikhism, Buddhism, My own religion are with the owner.
- LIVE: expo-live93 (2026-10-10): Christianity cast live (Grace, Pop, Marcus, Leo in ~1,000 chats; 6 scenes on 12 lessons; family on its welcome). Hindu fixes: Devanagari Sanskrit scene, rash guard, big-book day 697, summit with the approved mascot.
- LIVE: expo-live92 (2026-10-10): 42 more Hindu cast scenes through year 4 (82 lesson days in all); 7 year-5 scenes stored in assets/cast/hindu for when year 5 is written.
- LIVE: expo-live91 (2026-10-10): 14 more Hindu cast scenes on 28 lesson days (content/cast.ts); seva scene held back.
- LIVE: expo-live90 (2026-10-09): Hindu cast (Priya, Nani, Arjun, Sam) in chats (~1,000 Hindu lessons) and scenes on days 1, 30, 81/88/139/140 (Diwali), 82/96/141/142 (Holi), 122 (arti); family on the Hindu welcome. content/cast.ts. Scholar review before public.
- LIVE: expo-live89 (2026-10-09): demo polish (easy basics open every placement quiz, Create my own religion button, lowercase name in sentences, my own religion preselected, Guide fallback helpful, hill next stone opens now, put-it-in-order label, camp-day wording, web warning gone). Celebrity first-person welcomes kept (owner).
- LIVE: expo-live88 (2026-10-09): the alternative path is "my own religion" everywhere (app, site en+es, footer pages, Guide/companion prompts; server still accepts "Simply Spiritual" from old apps). Site: three ways to walk it, FAQ, games line, placement FAQ.
- LIVE: expo-live87 (2026-10-09): site "make your own path" gains one line naming the three ways (en + es).
- LIVE: expo-live86 (2026-10-09): Simply Spiritual holds the courses: "your own path, your way" (every day / a course / wander) after picking my own path; religion paths show no courses; no seeker detour before the doors.
- LIVE: expo-live85 (2026-10-09): placement quiz for all 7 tradition paths through year 4 (hand-checked bank, 17 stops each; adaptive check, see docs/learning/placement-gates.md). Owner approved.
- LIVE: expo-live84 (2026-10-09): YEAR 4 live on all 8 paths (owner okay after reviewing 3 lessons); "Day one thousand…" sign-offs (days 1001-1426) became warm goodbyes. Next: placement bank for all paths + year 4 stops (running); year 5 starts Oct 13 (owner).
- LIVE: expo-live83 (2026-10-08): courses for seekers (11 seven-day courses from existing y1-y3 lessons, content/courses.ts), "what would help most?" welcome step, course page/shelf/Today card; course days count for the streak, never move a path. Owner approved the 21 setup lines. Code only (year 4 not compiled in).
- LIVE: expo-live82 (2026-10-08): finish screen "keep going: day N" opens the next lesson right away, no limit; streak counts the day once. Built from code only (year 4 scripts not compiled in).
- LIVE: expo-live81 (2026-10-08): placement quiz waits on a wrong/unsure answer with the right one in green until Next.
- LIVE: expo-live80 (2026-10-08, owner: "publish years 2-3"): years 2-3 (days 332-1061, all 8 paths): style pass + new recipe in one go via workflow (docs/learning/map/JOB23_BRIEF.md), 304 batches each written then independently checked (1,782 fixes), style-lint/v2-lint/style-guard/validator all clean; 64 plainer chat replies (owner-approved). Extra usage for the run ~$380. Waiting on owner okay to publish.
- LIVE: expo-live79 (2026-10-07, owner: "publish everything"): job 3 complete on year 1 of all 8 paths (days 22-331: chat, tap-a-word, old words in the pairs; ~1,300 second-reader fixes), no typing anywhere (chat reply bubble appears only on tap; level 4 / go-deeper listen is tap). Next: years 2-3 after the Oct 13 reset.
- BUILT, NOT LIVE (2026-10-07): job 3 on year 1 of all 8 paths (days 29-331): chat, tap-a-word glosses, old words in the pairs; each batch machine-checked (scripts/learning/v2-lint.mjs) and second-read (~1,300 fixes). Only Simply Spiritual days 209-238 still old-style (a drafted script was blocked by the safety check; owner to choose: redo normally or approve it). Cost: weekly allowance 51% -> 61%. Next: owner okay to publish; years 2-3 after the Oct 13 reset.
- LIVE: expo-live78 (2026-10-07, owner: "publish the pilot"): job 3 pilot, the new recipe on days 22-28 of all 8 paths (brief docs/learning/map/V2_BRIEF.md; checks scripts/learning/v2-lint.mjs, scripts/learning/add-recall.mjs). Owner then approved year 1 on all 8 paths now, extra charges okay.
- LIVE: expo-live77 (2026-10-07, owner: "make day 30 live"): the new-style lesson pilot on Hindu day 30 (games.chat / games.gloss / games.recall turn on packages/content/src/v2.js: new word first, tap-for-meaning, complete the chat, old words in the pairs, one rotating game, challenge finale, "one you missed", identity line; explain-my-answer opens the Guide prefilled). Every other lesson is built as before.
- LIVE: expo-live76 (2026-10-07, owner: "publish it"): the style pass on all of year 1 (days 22-331, all 8 paths), the
  cleanup round, the site video label and demo day numbers. Next: years 2-3 style pass (days 332-1061) after the Tuesday
  2026-10-13 reset with the same workflow (scriptPath style-pass-year-1; change FIRST/LAST and the y1 folder to y2/y3).
- JOB 2 (style pass, owner: "use a workflow"): brief docs/learning/map/JOB2_BRIEF.md; examples STYLE_EXAMPLES.md;
  machine checklist scripts/learning/style-lint.mjs DOOR FROM TO; guard scripts/learning/style-guard.mjs REV. Pilot done and
  committed (days 22-34, all paths). Year 1 days 35-331 running as workflow style-pass-year-1 (run wf_9f95203f-822; resume
  with its scriptPath + resumeFromRunId). After it: lint every path 35-331, guard vs the pre-run commit, validate, ship-door
  all 8, commit, screenshots, ask to deploy. Years 2-3 (days 332-1061) after the Tuesday reset unless the owner pays extra.
  Lessons learned: open-ended reviewer loops don't converge; machine-check the mechanical rules, review only lost/invented.
- Also done 2026-10-06/07: scholar packets docs/review/<PATH>.md (scripts/learning/review-packets.mjs); cleanup round
  (apply.mjs now merges index fields); site video label + demo day numbers (not live); games.guess support; YEARS_4_5.md.
- LIVE: expo-live75 (2026-10-06 night, owner: "publish as is"): job 1 from the five-year map on all 8 paths
  (~55 lessons; docs/learning/map/), seams on all 8 paths, Guide safety (crisis wording, offline crisis reply, psychedelics
  and channeling rules, 43 cases). Research: docs/learning/research-extra/ (Reddit saved by the owner into
  reddit-saved/, git-ignored; YouTube; IG/TikTok; app reviews). Next: job 2 (style pass for days 22+, needs "use a
  workflow"), seams rejects + 65 plain words + 7 Sikh titled names, Keeper review lists in each lesson's notes, year-4
  plan moves, website (Day-1 video label "amen", demo day numbers), celebrity name in scenes prompts (owner kept it).
- LIVE: expo-live74 (2026-10-06 night, owner: "publish now, then fold in the findings"): every path's rebuilt first camp. Before that expo-live73 (the rebuilt Hindu week). Was committed before expo-live74: every other path's first camp
  rebuilt from its audience research (docs/learning/week1/<DOOR>.json → week1-data.js; scripts/learning/fix-day-refs.mjs
  and fix-app-days.mjs move later citations and app day links), tests updated (463/465; the 2 old environment failures
  remain). Next: fold docs/learning/research-extra/THREADS_AND_COMMENTS.md into the first weeks (screenshots before it goes live). Screenshot robot for any path:
  scratchpad w1door.mjs <out> <day> <maxShots> <DOOR>.
- Seams applied and committed: Hinduism, Judaism, Buddhism, Catholic, Christianity (101 rejects), Islam (57 rejects;
  batch b06 was split into b06a/b06b, so apply with --only=b01,…,b06a,b06b,…). Sikhism b01–b06 done, b07–b10 running,
  b11–b16 left; Spiritual b01–b18 not started. Rejects are mostly "word isn't in the lesson" (agents re-spelled a
  term): redo with extract.mjs DOOR 45 --only ids.json, telling agents to copy the word character for character.
- Research extras: docs/learning/research-extra/REDDIT.md (search-engine snippets only; Reddit itself is blocked) and
  SOCIAL.md (Instagram/TikTok read-only in the owner's Chrome; TikTok logged out, so views but no likes). Not yet
  folded into the week-one lessons. Still missing: Reddit replies, YouTube comments (owner asked for exhaustive).
- Validator: "mum" British-spelling check no longer flags names like Mumtaz/Mumbai.
- LIVE: expo-live72 (2026-10-06, owner approved "publish the normal one"): the Hindu week-one upgrade (story card,
  "most people get this wrong", build the word, look-backs, thinking question, day-7 check-in, tap-to-hear, "i knew
  that · skip to the games"), days tightened and lightened, curated Hindu placement (docs/learning/bank → apps/app/src/
  content/placement-curated.ts via scripts/learning/build-curated.mjs), tester switch EXPO_PUBLIC_FOCUS_DOOR (off),
  pulse week-one funnel, Guide sprint 2 + couple features merged, Hinduism 644 seams. NOT yet live (committed after):
  the REBUILT Hindu week one (below), Hinduism/Judaism/Buddhism seams batches.
- Hindu week one REBUILT from docs/learning/AUDIENCE_RESEARCH.md (owner: "meet them where they are", "don't freak
  people out"): 1 Ganesha · 2 om · 3 Gayatri (mantra folds in) · 4 namaste + touching feet (pranam folds in) · 5 arti +
  prasad · 6 why so many gods (ishta devata, ekam sat) · 7 karma + check-in · 8 puja · 9 dharma · 10 atman · 11 Brahman ·
  12 guru · 13 japa · 14 shanti · 15–21 unchanged. Index override: packages/content/src/hindu-week.js (applied in
  index.js, plus ADULT.HINDUISM day-1 bet = Ganesha); QUIZ, WEEK_ONE, sampler/life-moments/intake day numbers updated.
  Needs owner screenshots review, then publish. Panditji/Keeper review pending for all new copy.
- Owner rules saved: light start (memory light-start), one famous text name a day max early, stories open with drama,
  no Manusmriti early; no comics; no homework asks; adults get it the first time.
- Audience research for all 8 paths: docs/learning/AUDIENCE_RESEARCH*.md (Catholic report was still running). Next:
  rebuild each path's week one from its report, like Hinduism (owner asked for this).
- Seams job (big job 1 of 3): work in C:/Users/shset/code/golden-app/atlas/seams-work (apply.mjs now takes
  --only=b05,b11; SP/WT point at this worktree). Subagents (Sonnet) often write their output into THIS worktree's
  atlas/seams-work/work/<door>/ — copy those into the main atlas folder before apply. Done and committed: Hinduism,
  Judaism, Buddhism. Catholic batches mostly done/running; Christianity, Islam, Sikhism, Spiritual not started. Redo
  batches: judaism retry01/02 (apply when retry02 lands), Buddhism's 35 rejects. A batch can exceed the 64K output cap:
  split it (b06a/b06b). After apply: import-outline, import-paths, validate-scripts, then
  scratchpad ship-door.mjs (rebuilds that door's week files, keeping live days 1062–1064 in chunk 152).
- Big jobs 2–3 (Year 4 checks, Opus second pass) need the owner to say "use a workflow" (Workflow tool opt-in).
- Jewish day 1025 (1948): word "atzmaut", voice names the Nakba too; flagged for Keeper review.

## Session of 2026-10-03 evening
- Weekly allowance and extra credits ran out mid-run (extra spent this week: about $504). Everything below resumes
  after the Tuesday 2 AM PT reset. Check usage and quote the owner before restarting big jobs.
- Owner direction: concentrate on ONE excellent seven-day experience (ChatGPT review). Recommended first user: Hindu
  parents (Panditji's community); the owner has not confirmed yet. Plan days 1–7 as one arc; hide other features for
  the alpha.
- Live (expo-live69): Guide 988 + longer answers, shuffled games, placement restart, homepage evidence moved up.
- Now live in expo-live70 (was saved on the branch): Hinduism question bank (docs/learning/bank, 104 items,
  blind-checked 78/78), sign-up without "heard" and the five-year map (heard is asked after the first lesson), day-one
  pairs game, trimmed win screen, back = review reading without re-answering, welcome header names the voice. Needs
  screenshots to the owner, then deploy.
- Parked branches (not merged; breadth, keep off for the alpha): worktree-agent-af811feace3e8cb10 (Guide sprint 2:
  switch to my own path in chat, sampler week, chips, grader scripts/learning/guide-grader.mjs) and
  worktree-agent-a79829735f4276e67 (couple features).
- Lesson seams (title-as-carry, phrase-as-word): branch worktree-agent-a47b4a38300d64c48. Hinduism: 644 lessons fixed,
  1061/1061 validate (the owner okayed the outline/index change). Work files: atlas/seams-work (INSTRUCTIONS.md,
  apply.mjs, extract.mjs, work/<door>/bNN.in|out.jsonl, queue.txt); first point SP in apply.mjs/extract.mjs at
  atlas/seams-work. Remaining: Hinduism b05 b11 b14 b16 and every batch of the other seven doors (owner: "do all
  doors"; about $300–500). One batch = one subagent with INSTRUCTIONS.md; then `node apply.mjs DOOR`,
  import-outline/import-paths, validate-scripts, commit per door.

## Review kit findings (2026-10-03, docs/review-kit/, Claude's own baseline: overall 3.6/5)
Content is mostly accurate (4.0); the learning design is the weak part (2.9). Fix first:
1. DONE (expo-live69): "what would you do?" games now shuffle (the right answer was option 2 in 88% of lessons).
2. Placement: the longest answer is right in 68% of story questions; some word questions have two true options;
   Simply Spiritual has no placement questions. (Folds into the learning engine.)
3. Guide prompt (api/guide.js): DONE (expo-live69) the English 988 line and longer build-a-week / hard-text answers; it tells users scholars
   review the lessons and that there are "voices they know" (owner, 2026-10-03: KEEP these claims for the demo; do not remove).
4. Lessons: every practice ends "the bell holds the time"; 3,229 imagined practices; review only looks back one day;
   life-tip endings trivialize serious material; 1,435 carry lines just repeat the title (process leftovers).
Send the kit to Panditji, paid reviewers and an instructional designer before writing year 5.
