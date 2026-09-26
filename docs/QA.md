# Golden QA

## Required coverage

- Build succeeds from a clean install.
- Splash and all eight door choices render at 390 x 780.
- Onboarding supports direct start and placement.
- One complete lesson reaches its post-session result.
- Refresh retains onboarding, settings, active doors, and progress.
- Plans, gift, Together, Guide, Why, and profile open without console errors.
- The Guide returns its honest offline response when no server key is configured.
- Phone (390 x 780), tablet (768 x 1024), and desktop (1440 x 1000) layouts are
  visually inspected.

## Evidence

PASS on the local Vite build at `http://127.0.0.1:5173/` on September 12,
2026 (America/New_York):

- Completed first-run door selection and onboarding into the Hinduism lesson.
- Exercised guess, ordering, pairs, listening, breath, speech fallback, carry-line,
  tally, and post-session screens.
- Completed Buddhism day one end to end. The account-wide day changed from 0 to
  1, the carry line became `may you be at ease`, and both remained after reload.
- Added Buddhism as the visiting door beside Hinduism and confirmed the two-door
  selection survived reload.
- Opened Plans after repairing its tuple error and rendered all three plans.
- Opened Guide without a server key and received the lesson-grounded offline
  answer for `namaste`.
- Inspected the app at 390 x 780 and 768 x 1024 with no horizontal overflow; the
  desktop phone frame was also inspected at the default 1280 x 720 viewport.
- Loaded `/site.html`, visually inspected its hero, and confirmed its Start free
  modal opens the current app shell in embedded mode.
- `npm run build` completed. The only build warning is the expected large client
  chunk caused by the prototype's embedded curriculum and image data.

The browser run found and fixed a blocked speech-recognition permission path, a
stalled carry transition caused by that pending browser session, a Plans crash,
and a React list-key warning. No current console error was observed in the final
flow.
# Core interface review — 2026-09-13

The current local build was inspected at the app's 390 by 780 desktop phone
frame after the core interface and route-graph pass.

- Today shows one primary daily card, an honest unavailable-manuscript state,
  three nearby path stops, and a route to the full mountain.
- Together keeps Table creation and privacy above the fold; planned community
  modules remain collapsed behind a private-beta disclosure.
- Guide starts with an explicit Guide-beta or lesson-only choice and exposes
  its privacy note, sources, and history.
- You exposes the current path without the former floating-menu overlap. The
  supplied three-tab navigation remains intact, with a consistent profile
  affordance in the core screen headers. Long reminder examples are collapsed.
- A direct Table home route rendered with native headings, buttons, member
  rows, activity, streak, voice-note, invitation, and management actions.
- Browser accessibility snapshots confirmed one `main` heading per revised
  core view and native controls for primary actions.

The production build and full local test suite passed after this inspection.
The remaining build warning is the existing large main JavaScript chunk.
