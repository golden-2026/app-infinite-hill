# Golden product contract

## Source order

1. `golden_v150.jsx` and `golden_web_v83.html` control visuals, layout, and
   interaction structure.
2. `BUILD_BRIEF.md` controls the curriculum renderer, position, streak, path,
   festival, and content-status rules.
3. `golden_writers_bible.md` controls current voice and approval status.
4. Door manuscripts and `golden_curriculum_v3_review.md` control available
   scripts and outlines.
5. `golden_brand_book_v1.md` controls brand law where it does not conflict with
   later prototype revisions.

## Acceptance journeys

1. A first-time user can pick one of eight doors, answer onboarding, choose to
   start at lesson one or take placement, and enter a lesson before creating an
   account.
2. A user can finish a lesson, see the earned word and carry line, return to the
   path, and retain progress after refreshing the app.
3. A user can add one visiting door, switch between home and visit, and keep
   independent lesson positions while earning at most one showed-up day per
   local date.
4. Together, Today, Guide, profile/settings, plans, gift, review, and Why open
   without a runtime crash. The Guide falls back honestly when its server model
   is not configured.
5. The app works at phone width and in a desktop phone frame; the marketing
   site remains available as its own supplied visual surface.

## Release truth

This local build is a product preview. Current celebrity portraits and welcomes,
Keeper names, population counts, events, live reads, prices, gift delivery,
notifications, and payments are supplied prototype content. They are not proof
of signatures, review, live data, delivery, or connected services.

Only Keeper-approved scripted sessions may ship as production lessons. Designed
and outlined sessions may appear on the path as coming content but must not be
presented as authored, approved lessons. The missing `hinduism.json` and
`other_paths_camp1.json` files must be recovered or rebuilt from reviewed sources
before the app can claim the complete catalog described in the older brief.

## Release gates

- Keeper approval attached to each shippable session.
- Signed voice and image rights or approved house-voice replacements.
- Account/sync, payments, gifting, notifications, events, festivals, location,
  and live-count providers selected and tested.
- Claims, pricing, privacy, terms, age handling, and refund language reviewed.
- Browser accessibility, mobile-device, performance, and content QA completed on
  the exact release build.

## Normalized source catalog

`src/content/catalog.js` is the local content/approval boundary. It exposes
`getDoor(door)`, `getSession(door, lesson)`, `getSessionAvailability(door, lesson)`,
`listDoorSessions(door, { camp, authoredOnly })`, `getPracticeRung(lesson)`,
`getReleaseGate(session)`, and `assertPublishable(sessions)`.

The retained source snapshot contains prototype map metadata and manuscript
segments, with exact source filename/line references. Markdown emphasis is
removed for spoken text; welcome/three-promises headings normalize to the review
beat. Manuscript title, word, and length supersede older prototype values.
Carry labels and outline map metadata remain traceable to the prototype.

There are 29 complete manuscript drafts: Hinduism lessons 1–21, Christianity 1–7,
and Islam 1. Every other mapped lesson is `designed`, contains no manufactured
segments, and returns `canPreview: false`. Elective ranges are outline metadata,
not a fabricated complete five-year session database. Unknown doors and positions
fail closed instead of falling back to another tradition.

`canPreview` means an authored manuscript exists for local review; it does not
mean approved, recorded, or ready to publish. Every current session has pending
Keeper review, pending house-voice recording, and `publishable: false`.
Hinduism 8–21 and Islam 1 retain their supplied older practice prose and have
`needsPracticeRevision: true`; the current ladder policy is exposed separately.
Do not silently rewrite those scripts or interpret an adjusted timer as editorial
approval. Christianity and Catholicism remain separate doors, per the September
11 Christianity manuscript.

Production validation requires a complete script, the eight beats, a teaching,
Keeper evidence/reviewer/date tied to the content revision, approved voice-rights
evidence for that revision, and resolved practice revisions. These checks do not
claim that supplied proof strings have been independently verified. Only a
reviewed content publishing workflow may attach that evidence. The current
catalog is immutable and attaches none.

Run isolated gate/content tests with `node --test src/content/catalog.test.js`.
