# Product decisions, guardrails and open questions

Current ideas as of Nov 7, 2026. "Decided" means the owner has settled it for now; everything else is open to your
team's challenge.

## Decided

- **Tagline:** "making religion yours again." **Big idea:** "step in to remember who you are. step out to live it."
- **One faith first.** You go deep in your own faith. Exploring other faiths is opt-in and mainly lives inside
  "my own religion", which must be excellent and carefully curated. Never a comparative-religion tour.
- **Open to every view.** The product never tilts toward any faith, school or the founder's personal view; never
  ranks faiths; never pushes conversion.
- **Loud brand, one look everywhere** (site, app, episodes): Anton display (uppercase) + Manrope body; ink `#0A0A0A`,
  night `#070a14`, cream `#F3EFE4`, lime `#EEFF6A` as the one brand colour, accents pink, saffron, green, blue,
  violet. Film grain, huge type, short punchy lines. No rainbow gradients. Magna is the model. Details:
  `prototypes/greybox/episodes/BRIEF.md`.
- **Each lesson is a film plus games** (updated 2026-11-10): a 40-50 second narrated film (a real story from the faith,
  then that faith's actual teaching, then life today), then quick games that test the teaching. No drills, no
  self-help tips. Standard: `docs/LESSON_STANDARD.md`. The longer loud episodes (style "A", "the night out") still exist.
- **Celebrity guides and voices people know narrate.** (Celebrity voices would be AI versions used only with
  permission.) Keepers, scholars of each faith, check content and can say no. The Keepers group is in formation.
- **Finn** is the mascot (trademark check pending). Approved backwards-cap art only. Finn may roast stale, boring
  faith apps in general, never a faith, its people or a named rival.
- **The hill app is THE app.** The old Expo app is frozen.
- **Streaks are kind:** rest days, earn a broken streak back, no leaderboards.
- **Not launching soon.** No date-driven decisions.

## Exploring (prototyped, not decided)

- **Chat first:** open straight into the guide (like Instinct, Muse, Yam). Episodes, games and rewards appear inside
  the chat. Compare `hill-chat.html` with `hill-app.html`.
- **A library, curated live:** build an approved film library once, scholar-checked, and let the AI pick from it per
  person and write only the personal parts live (why it picked this, a friend's text, tomorrow's check-in). Films made
  on the fly are not planned: they can't be checked and today they look like slideshows. Gus's "lens" idea (music,
  stories, philosophy) fits inside one faith.
- **Two tracks:** your path (personal, your own pace) + the drop (one shared episode per faith per week, like a
  premiere). Drops could ride each faith's calendar: the weekly Torah portion, Sunday readings, Jumu'ah and Ramadan
  nights, festival days and gurpurabs.
- **Rewards:** story cards with real rarity (drop edition, holy-day edition, holo week); Finn's outfits that level up
  with your streak; a "your year on the hill" recap built to post; collabs. Real scarcity only, no fake "3 left",
  nothing to buy, missing a drop never breaks a streak.
- **Mood loop and trips:** the guide asks how you are, picks one story, flies you on a globe to a real place, and a
  passport stamp drops in (50 trips today).
- **"You're in it" ideas** (inspired by Yam): you're an ordinary person inside the story; a recurring cast of
  everyday friends who remember what you told them; story texts instead of reminders; choices that come back days later.
- **A "hard moment" way in:** the app you reach for after a blowup (`hard-moment.html`).

## Open (where we most want your thinking)

- **Community** is critical and unsolved. Three layers on the table:
  1. *Your people:* a private circle of 2–6 friends or family; shared streaks, reactions to the same drop, warm nudges.
  2. *Your crowd:* everyone in your faith watches the drop together; reactions flow like a premiere. Needs moderation
     from day one.
  3. *The night:* monthly in-person drop nights in one city (LA first), real stamps at the door. 18+, verified hosts
     and venues, never pushed.
- **How smart is the guide:** how far it personalizes, how it remembers you, and the cost per user.
- **Platform:** native vs. web-first; what to reuse from the old Expo app and its backend.
- Episode length (the full day-7 demo may be too long); whether to convert all 226 stories now or test more first;
  which celebrities narrate which faiths; Spanish for the new app.

## The guardrails (keep all of these)

From the project's standing rules (`CLAUDE.md` "Owner rules" and "Safety and privacy") and the brand brief.

### Safety and privacy
- The Guide and companion must fall back gracefully when no AI key is configured.
- Never put server credentials in `EXPO_PUBLIC_*`, `VITE_*` or any browser code.
- Crisis care: danger or self-harm points to 988 (US) or local emergency help, in every language. Crisis words get
  that line at once, with no story.
- Don't log credentials, auth headers, decrypted snapshots, chosen faith, practice history, journal text or Guide
  questions. Treat recovery files like passwords.
- Don't claim a feature is connected until a live request proves it.
- Don't deploy, change production secrets, push or make anything public without the owner's approval.
- Kids: preset messages only for children in circles; off-app gatherings are 18+.
- The guide never pressures anyone to attend anything, buy anything or believe anything.

### Religious content
- Every lesson: a real story → the faith's actual teaching → modern life. No generic self-help filler.
- Do not publish unreviewed religious content. Lessons get repeated review passes; a year goes live only with the
  owner's okay.
- AI never speaks as God and never plays Jesus, prophets or Gurus. Their words stay fixed and checked.
- No faces of Jesus, prophets or Sikh Gurus. No people in Islamic story scenes.
- Never invent religious claims or quotes; keep the lesson's own "as tradition tells it" hedges.
- Prayer is always a choice: watch, learn or join in. Never ask users to sing or hold a mic.
- Never mock a faith, its holy figures or its people. Shock comes from surprise and confidence, never crudeness.
- Holy-day dates must be confirmed with Keepers before they drive anything.

### Brand and honesty
- Every user-facing line is Finn's voice: warm and compassionate first, punchy, never corny, never cold. Finn says
  "i"; "we" is only the company. See `docs/brand/MASCOT_VOICE.md`.
- No "draft" or "review pending" labels in user-facing copy. Don't mention daily AI limits.
- Never invent testimonials or community numbers; show real counts only above a threshold. No gimmick stats.
- Never imply that a celebrity or a Keeper has agreed to, endorsed or reviewed something they haven't. Frame plans
  as plans.
- Say "celebrity guides," never "famous guides."
- Keep the Foundation "in formation"; never state a share of proceeds the owner hasn't chosen.
- Never say the hill never ends, and never "only one step". Progress lines celebrate.

### Working with the owner
- Plain, brief language; no jargon.
- Phone-size screenshots before any design or copy change goes live. Ask before every deploy.
- Tell the owner the cost before any big job (AI batches, video generation, lesson checks).

## Known risks and loose ends

- **Repo hygiene:** `prototypes/`, `apps/app/public-next/` and `docs/briefs/` are untracked; about 14 GB of media is
  outside git. The pipeline scripts are in `prototypes/greybox/tools/` with no local paths; the QA walks still load
  Playwright from the owner's checkout.
- **Single-file app:** `hill-app.html` is ~375 KB of inline code with all state in `localStorage`. Treat it as a
  living spec of behaviour and feel, not as code to extend.
- **Live AI:** an Oct 30 note recorded `/api/guide` returning 502 in production. Unproven until a live request works.
- **Content checks pending:** `episodes/FLAGS.md`, `films/wave1/REVIEW-NOTES.md`, and the scholar list for the mood
  loop's guide lines and places in `docs/HANDOFF.md` (some places are near, not exact).
- **Weight:** `places/map-index.json` is about 2.6 MB; video needs proper streaming and caching.
- **Messaging between frames** uses `postMessage` with a `"*"` target; restrict it in production.
- **Two vocabularies** for the eight faiths (curriculum `door` vs. story `home`), see `DATA-CONTRACTS.md`.
- **Spanish:** the new website has Spanish; the new app is English only.

## Questions for the team (from the owner's kickoff page)

- Gabe (design): how do we keep a loud brand from feeling like a gimmick in a sacred space?
- Bogdan (tech): what should we not decide yet? What does the guide cost per user at 10k and 100k?
- Everyone: what's the smallest version of community we could test in a month?
- Stathi: would you send an episode to a friend? What's corny?
