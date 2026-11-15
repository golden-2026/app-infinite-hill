# Loud brand restyle (overnight 2026-11-06/07)

Not deployed, pushed or committed. Brief: `prototypes/greybox/episodes/BRIEF.md` (Brand, Owner direction, Magna's playbook).

## Choices made
- Tokens first: `packages/brand/src/index.js` keeps every role name (cream = page, ink = words, gold = brand accent,
  white = card) but now page = ink black #0A0A0A, words = cream #F3EFE4, accent = lime #EEFF6A.
- New tokens: `accent` (lime, pink, saffron, green, blue, violet), `doorColor` / `doorAccent` (one bold colour per door:
  Christian blue, Catholic violet, Jewish pink, Muslim green, Hindu saffron, Buddhist saffron, Sikh blue, my own
  religion lime; 8 doors share 6 brand accents), `font.head` (Anton), `type.shout`.
- Fonts: Anton (uppercase) for page titles, `type.h1`, the top-bar title and the wordmark; Manrope for all body text
  (Inter retired from the tokens). Card titles (`font.display[800]`) stay Manrope ExtraBold so sentences in cards stay
  readable. Added the `@expo-google-fonts/anton` package.
- Grain: web only, one fixed noise layer over the app (no grain on native yet).
- Status bar always light (every page is black now).

## Files touched
- `packages/brand/src/index.js`: colours, accents, door colours, Anton, title/h1/nav/shout/eyebrow styles.
- `apps/app/package.json`, `apps/app/package-lock.json`: added `@expo-google-fonts/anton`.
- `apps/app/src/types.d.ts`: types for the new brand tokens.
- `apps/app/src/app/_layout.tsx`: loads Anton, black frame with a lime edge on wide screens, light status bar, web grain.
- `apps/app/src/ui/chrome.ts`: status bar always light.
- `apps/app/src/ui/index.tsx`: fat pill buttons (new `black` kind), lime chosen/answer states on black, cards, bubbles.
- `apps/app/src/ui/loud.tsx` (new): `Shout` (kinetic slam-in headline, one lime word), `Wordmark`, `Tag`, `Punch`, `dropNo`.
- `apps/app/src/app/(tabs)/_layout.tsx`: black tab bar, the tab you're on is a lime pill.
- `apps/app/src/app/welcome/index.tsx`: new splash (wordmark graphic, "drop 01" tag, "because you gotta have faith." slam, the line, Finn, pills).
- `apps/app/src/i18n/strings/onboarding.ts`: splash headline, line and drop tag (English + Spanish).
- `apps/app/src/app/session/[door]/[day].tsx`: lessons play as episodes: door-colour wash, "episode NN" tag, kinetic opener.
- `apps/app/src/i18n/strings/session.ts`: "episode {n}" (English + Spanish).
- `apps/app/src/session/juice.tsx`: answer banner is a lime block (right) or hot-pink block (miss) with an Anton heading and black pill.
- `apps/app/src/session/games.tsx`: readable text on lime game chips and tap button.
- `apps/app/src/app/done/index.tsx`: the finish slams in, the "carry this" card is a tilted lime block that punches in.
- `apps/app/src/ui/today-hero.tsx`: today's lesson is a lime block with a black start pill (the gentle lane keeps the calm dark card).
- `apps/app/src/ui/hill-home.tsx`: Anton home name and film title, lime play button and border; "a keepsake for your shelf" → "a stamp to keep".
- `apps/app/src/app/(tabs)/guide.tsx`: your messages are lime bubbles, lime send button.
- `apps/app/BRAND-CHANGES.md` (this file), `apps/app/qa-brand/` (screenshots, before/after sheet).

## Tests
- `npm run test:unit`: 491 of 492 pass. The one failure (`tests/features/why-param.test.mjs`, site.html "kids start
  here" link) was failing before this work; site.html wasn't touched here.
- `npx tsc --noEmit`: 20 errors, all old (expo-router typings, `done/week.tsx`, `games.tsx` line 44); none new.
- Web export to `atlas/expo-brand-test` built cleanly. Click-through at 390×844 (welcome → placement → WHO-5 → a full
  lesson incl. the fix round → done → streak → Today → You → Guide with no AI key): no console or page errors.

## Not done yet
- Screens not restyled by hand (they pick up the new tokens): Together, circles, kids, courses, trail, practice, year,
  reflect, settings pages. Some older spots still put cream words on lime/cream blocks (the night look's inverted
  "ink"); worth a sweep.
- Grain is web only. Hard-coded English on the film card ("your home", "this week's story film") was already untranslated.
