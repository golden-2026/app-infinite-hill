# Carry-over: what the old app had, and where it goes now

2026-11-07. This is the answer to "is there any content from before that we need?"

- The old Expo app (`apps/app/src`) is frozen. Nothing in it was edited.
- The new app is `hill-app.html`, and its chat-first version is `hill-chat.html`. Both share the `ih-hill-app-demo` store.

## The three marks

- **KEEP-PORTED**: it's in the new app now. "(today)" means it was ported in this pass. "(already)" means an earlier
  pass had already carried it, and this audit checked it.
- **KEEP-LATER**: it's worth keeping, but it needs a server, accounts, payments, a Keeper's review or Xogito.
- **DROP**: it doesn't fit the loud, chat-first, one-faith direction, or the new app already does the job another way.

Backups made before editing: `hill-app.pre-carry.html`, `hill-chat.pre-carry.html`, `hard-moment.pre-carry.html` and
`episodes/c/player.pre-carry.html`. Screenshots are in `qa-carry/`.

The four ported on 2026-11-07 (Spanish, journal, rematch, holy days + quests) were backed up first as
`hill-app.pre-four.html`, `hill-chat.pre-four.html`, `episodes/c/player.pre-four.html` and `CARRY-OVER.pre-four.md`.
The shared code is in `lib/ih-four.js`, `lib/ih-es.js` and `lib/ih-seasons.js`. Screenshots are in `qa-four/`.

## Safety and care

- [x] **KEEP-PORTED (today): crisis care, 988 / local emergency.** Both apps, plus `hard-moment.html`, now use the old
  app's fuller crisis-word list. It covers "what's the point of living", "can't go on anymore", "better off without
  me" and more. They also use its **Spanish** list, matched with or without accents.
  - The reply stays warm first.
  - It has tap buttons: call 988, text 988, and "not in the US? 112", plus a line saying any local emergency number
    works.
  - If someone writes in Spanish, they also get the Spanish line: "llama al 988 y oprime 2, o escribe AYUDA al 988".
  - Crisis words are never sent to the Guide and never saved on the phone. The Today mood box used to save them; it no
    longer does.
  - Where it shows: hill-app's Guide tab and Today mood box, every hill-chat message (including during placement), and
    the hard-moment page.
- [x] **KEEP-PORTED (already): Guide fallback when no AI key is set.** Both apps call `/api/guide` and fall back to a
  warm scripted line when it can't be reached. No keys live in browser code.
- [x] **KEEP-PORTED (already): privacy.** Everything stays on the phone (localStorage). Nothing about someone's faith
  goes to analytics.
- [x] **KEEP-PORTED (today): recovery and export.** hill-app's You tab has a new card, "your progress, your phone".
  - "Save a backup" downloads a file of your progress.
  - "Bring one back" restores it.
  - The copy says to keep the file private, like a password.
  - "Start over" now also clears the chat app's saved conversation.
- [ ] **KEEP-LATER: sign-in, sync across devices, "delete my account".** These need accounts on a server (Xogito).
- [ ] **KEEP-LATER: "what the companion knows".** In the old app you could see, edit and delete every fact the AI kept
  about you. It needs the companion's memory on a server. Bring it back the day the Guide starts remembering things.

## Getting started

- [x] **KEEP-PORTED (today in hill-app, already in hill-chat): placement as a conversation.** "How well do you know
  [faith]?" has three answers:
  - "new to this" starts you at day 1.
  - "grew up with it" starts you at day 60.
  - "i know it well" starts you at day 332 (year two).
  - In hill-app it's a new third question in the guide's sign-up, right after "where are you with religion right
    now?". The guide then says it back to you, for example: "you're past year one, so i'm starting your lessons at
    year two, day 332."
  - In both apps you can say "skip ahead" or "start me over" to the guide at any time. hill-app's Guide tab understands
    those words now too.
- [ ] **KEEP-LATER: the adaptive placement quiz.** The old app climbed the five years with real questions
  (`content/placement-bank.ts`, `lib/placement.ts`). This is the approved learning-engine plan (question bank, then
  placement, then review), so it should come back as a quick game inside the chat, not as a test. For now it's too
  big for a prototype.
- [x] **KEEP-PORTED (already): "where are you with religion?"** The old app's stance answers (practice, unsure, left,
  partner, curious, spiritual) still shape the guide's first words in hill-app.
- [ ] **KEEP-LATER: "how did you hear about us?"** It needs opt-in analytics, so it's a job for the server.
- [ ] **KEEP-LATER: the waitlist and invite codes.** Both need the server's switch and real places in line (site plus
  backend).
- [ ] **DROP: the five-year trail map, the camps and the summit.** The owner rule is no summit, and never say the hill
  ends. Streaks, drops and cards now do the "how far have i come" job.
- [ ] **DROP: "my own path" intake and suggestions as a separate flow.** "My own religion" is its own home now, and
  the chat already asks what's on your mind. A curated intake comes back later inside wild, as part of the commonality
  work.

## Hard moments

- [x] **KEEP-PORTED (today and already): the hard-moment way in.** `hard-moment.html` offers two minutes, one breath,
  one story and one step. Before today, you could reach it from:
  - Today's "rough moment?" row in hill-app.
  - hill-chat's "rough moment" chip.
  - Typing "blew up" or "fight" in either app.

  Today I added:
  - A **pink "rough?" button in hill-chat's top bar**, so it's always one tap away.
  - A **pink "just had a blowup?" chip** at the front of hill-app's Guide suggestions.
  - The phrase "rough moment" as something you can type to hill-app's guide.
- [x] **KEEP-PORTED (already): the grief and diagnosis lanes, as feelings.**
  - "i'm missing someone" leads to each faith's grief story.
  - "a worry i can't shake" leads to a worry story. It catches "diagnosis", "sick" and "results".
- [ ] **KEEP-LATER: the old first-week lesson lists for grief, a new baby, scary health news, belonging, forgiveness,
  a wedding and gratitude** (`content/life-moments.ts`). The old file itself says each faith's Keeper must confirm the
  days picked, so it needs that review before it shows up anywhere.

## Prayer and practice

- [x] **KEEP-PORTED (already, sharpened today): prayer is a choice.**
  - The lesson player's "your move" step already said "join in, just watch, or skip. your call, always."
  - When the practice mentions prayer, it now says "pray along, just watch, or skip. prayer is always your choice."
  - Episodes mention prayer only inside the stories. None of them ask you to pray.
- [x] **KEEP-PORTED (already): practice is never scored.** The old rule was that prayer, breath and sitting never earn
  points. The player's practice step is still optional and has no score.

## Daily habit

- [x] **KEEP-PORTED (already): streaks with rest days, earning a streak back, and the streak party.** All of these
  work through `streak.js`, Finn's party and the lantern chip.
- [x] **KEEP-PORTED (already): daily reminders.** hill-app's "a daily nudge from me" adds a daily calendar event.
- [ ] **KEEP-LATER: real push reminders, and "auto" timing (about a day after your last lesson).** Both need web push
  on a server.
- [x] **KEEP-PORTED (already): your week, and your year on the hill.** These are hill-app's week recap card and the
  "your year on the hill" screens.
- [x] **KEEP-PORTED (today, 2026-11-07): the holiday calendar and season quests** (`content/seasons.ts`,
  `app/quest.tsx`, and the holiday dates in `content/couple.ts`).
  - Today in hill-app now has an **"up next" holy-day card** for your own faith only (never another faith's), and a
    **season quest** card while a season is near or under way. Join it, and each day you finish a story lights a stone;
    rest days count, and the week after the season fills missed stones, like the old app.
  - The quest page shows the path of stones, one line a day (a question to sit with if you said you practice, or how
    people keep the season if not; it never asks anyone to pray), and the badge.
  - hill-chat mentions the holy day when it's two weeks away or less, and offers the quest as a card.
  - Every date comes from the old app's own data (`lib/ih-seasons.js` is generated from `seasons.ts`). Nothing new was
    invented. The card always says "dates may vary by community".
  - Advent's 25-door countdown stays as it was. I only fixed its line "starts sunday, nov 30": Nov 30, 2026 is a
    Monday (Advent Sunday is Nov 29), so it now says "door one opens monday, nov 30".
  - **Needs Keeper review before anything ships:**
    - Lunar dates move by a day or two with the moon and the region: Ramadan, Eid al-Fitr, the Islamic new year
      (Umm al-Qura projections), Navaratri, Vijayadashami, Diwali, Vaisakhi, Guru Nanak's gurpurab (the SGPC may announce
      a day either side), Vesak (differs by country: e.g. Sri Lanka and Myanmar) and Vassa.
    - Four days are worked out from a season row, the same way the old app did: Passover is the day before the omer
      count starts, Yom Kippur is the last day of the Days of Awe, Christmas Eve is the last day of Advent, and Diwali's
      main day is the Lakshmi Puja date in the row's note.
    - Not in the old data, so not on the card: Christmas Day, Good Friday, Hanukkah, Purim, Holi, Eid al-Adha, Bandi
      Chhor Divas and others. They need dates from a Keeper first.
    - hill-app's older "holy windows" list (the one the drops and the holiday fits use) has dates that don't match the
      old data: Diwali Nov 5–11 (old data: Nov 6–10), Eid Mar 10–12, 2027 (old data: Eid al-Fitr Mar 9), Easter "Mar 21 to
      Apr 4" (old data: Easter Mar 28), Vesak May 18–21 (old data: May 20), and Hanukkah and Holi aren't in the old data.
      I didn't change it. A Keeper should confirm one set of dates for both.
- [x] **KEEP-PORTED (today): review of what you got wrong, as a "quick rematch"** (`app/review.tsx`, `lib/missed.ts`).
  - What records it: nothing did before. The lesson player (`episodes/c/player.html`) now keeps your **first wrong pick**
    in its "your guess", "text back", "what happens next" and "true or myth" games, and hill-chat's quick game does
    the same. The episodes themselves don't report answers back (`?done=` only says which one finished), so they
    aren't counted.
  - Same rules as the old app: a miss comes back tomorrow; right moves it to 3, then 7, then 14 days, and then it's
    gone; wrong brings it back tomorrow. Up to 80 are kept, on the phone only (`ih-missed`).
  - Today in hill-app shows a purple **"quick rematch"** card when some are due ("2 questions want a rematch. they got
    you last time. 30 seconds to get even."). No hearts, no score, no streak at stake. hill-chat swaps "surprise me"
    for "quick rematch" in its menu when something is due.
- [ ] **KEEP-LATER: the WHO-5 wellbeing check.** It's five questions at days 21, 50 and 100. It only matters once the
  answers can be collected with consent on a server and used to prove the app helps. For now, a 30-second form would
  break the chat's flow.
- [ ] **DROP: streak goals after the first lesson** (pick 3, 7 or 14 days). The drops, the cards and the streak party
  carry this now.
- [ ] **DROP: the old "light the day" sunrise screen and "today's three" lantern.** Finn's party and the lantern chip
  replaced them.

## Family and together

- [x] **KEEP-PORTED (already): kids and family.** hill-app's "when your kids ask the big questions" gives simple
  answers for tonight, plus a family activity.
- [x] **KEEP-PORTED (already): walk it together** (seven days side by side, each person on their own faith), from
  Together.
- [ ] **KEEP-LATER: circles** (a teacher, pandit, rabbi, imam, priest or granthi brings their people in with a code).
  The server is needed. This is the top-priority community piece, so it should be one of the first things Xogito
  builds.
- [ ] **KEEP-LATER: friend lantern links ("light one back") and real friend progress.** They need the friends server.
- [ ] **KEEP-LATER: kid mode** (children on their own hill, parent consents, under 13). It needs accounts and a
  consent flow.
- [ ] **KEEP-LATER: Keepers and voices on Together.** Show them only in the approved way, and never say "signed".

## Content and extras

- [x] **KEEP-PORTED (already): today's lesson from the 5-year path.** hill-app's lesson row and hill-chat's lesson card
  open `episodes/c/player.html` at the placed day.
- [x] **KEEP-PORTED (already): short courses for what you're carrying** (worry, grief, anger…), on hill-app's Today.
- [x] **KEEP-PORTED (today): Spanish.**
  - An **EN / ES switch** on hill-app's sign-up screen and in You ("Language"), and in hill-chat's first hello (or just
    say "español" or "language"). The first time, it follows the phone's language. The choice is saved in the shared
    app state (`lang`), so both apps agree.
  - All the app's own words, and Finn's and the guide's lines, are in warm Latin-American Spanish, using the old
    app's terms (racha, días de descanso, farol, la colina, misión de temporada). The lines live in `lib/ih-es.js`:
    one English line, one Spanish line. Adding a line there is all it takes.
  - The Guide is asked to answer in Spanish. "adelántame", "empiézame de nuevo", "momento difícil", "diario" and
    "revancha" work like their English versions, and the feelings loop understands Spanish words.
  - Crisis care in Spanish: "llama al 988 y oprime 2, o escribe AYUDA al 988", plus local emergency (911 in Mexico, 112
    elsewhere), with tap buttons. It's the same everywhere: the Guide, the Today mood box, the journal and hill-chat.
  - Still in English, on purpose: lesson and episode content, story card text, the celebrity guides' real quotes,
    the family answers and course days (that's content), and the prototype notes for the team.
- [x] **KEEP-PORTED (today): the journal.**
  - hill-app: "your journal" in You, and on Today after you finish a story ("write one line about today?"). Finn's
    prompt is tied to the day's story: "today's story was “rama's face didn't change”. what's one line from it you want
    to keep?". You can edit and delete pages; deleting asks first.
  - hill-chat: say "journal" or tap "my journal" for a private page right in the chat; after a story, Finn offers one
    line. Those pages are never saved in the chat's transcript.
  - Pages stay on the phone (`ih-journal`). They are never sent, never logged, and never part of a Guide call (the QA
    checks the Guide's requests). "Save a backup" now includes them, and "Bring one back" restores them.
  - Crisis words in a page bring up the same 988 / local emergency care. The page itself stays private.
  - "Start over" keeps your journal and your language; it clears progress and the rematch list.
- [ ] **KEEP-LATER: the gift flow, plans and prices.** The old app only showed the design; it had no checkout. Bring it
  back with real payments.
- [ ] **KEEP-LATER: legal pages in the app** (terms, privacy, safety). They live on the website now. The new app
  should link them from You before any real user sees it.
- [ ] **KEEP-LATER: songs ("listen").** The YouTube list for each faith could come back as music drops. It's
  listening only, never singing along.
- [ ] **DROP: "a taste from next door", the sampler week and "another tradition has a similar idea" offers.** The rule
  now is one faith first. Exploring other faiths happens only inside "my own religion".
- [ ] **DROP: the October class format, the "one day on the hill" waterfall slice and the old film screen.** Episodes
  and the curriculum player replaced them.
- [ ] **DROP: the old session games screen** (combo, hearts-free tally). The player's games replaced it.

## What I'd do next (needs the owner's okay)

1. Bring the old placement question bank back as a "quick game" in the chat, so "skip ahead" can be earned rather
   than just asked for.
2. Add the old life-moment first weeks for grief and diagnosis, once each Keeper confirms the days.
3. A Keeper pass on the holy-day dates (above), so the drops' holy windows and the holy-day card use one set of dates.
