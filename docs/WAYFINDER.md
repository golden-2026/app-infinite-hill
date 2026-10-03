# Golden one-shot build map

## Destination

A runnable, reviewable Golden product that preserves the supplied app and web
visuals exactly, makes the core mobile journey functional, and records what must
be true before a public release.

## Notes

This effort explicitly carries execution through the map. The supplied latest
prototypes are the presentation contract. The build brief, writer's bible,
curriculum review, brand book, and door manuscripts resolve behavior and release
truth. The canonical live map is [Build Golden as a feature-complete universal
product](https://github.com/kayan-mudita/golden-house-beta/issues/1); this file is
the repository-local context summary.

## Decisions so far

- **Product shape:** one Expo/React Native App for iOS, Android, and installable
  web, plus the separate supplied marketing Website. The current Vite PWA is the
  migration source rather than the final universal runtime.
- **Visual source:** `golden_v150.jsx` and `golden_web_v83.html`; no redesign and
  no analytics-dashboard styling.
- **Universal visual proof:** the owner accepted the rendered Expo Today,
  lesson, and Together states. The throwaway primary source remains on
  [`prototype/universal-app-visual-proof`](https://github.com/kayan-mudita/golden-house-beta/tree/prototype/universal-app-visual-proof/prototype-universal).
- **Content source:** use the embedded curriculum and supplied manuscripts. The
  JSON files named in the old build brief are absent, so the build cannot claim
  a complete five-year production catalog.
- **Door structure:** eight doors; Christianity and Catholicism remain separate.
- **Review mode:** preserve the prototype's reference roster, pricing, counts,
  and events for local review. They remain draft/sample data until approved and
  connected.
- **Guide:** same-origin server boundary with a lesson-grounded offline fallback;
  no browser-held model credential.
- **Progress:** persist on the device; one local calendar date earns one
  account-wide day even if both doors are practiced.
- **Core interface rhythm:** all customer screens use an 18 px page inset,
  12 px component rhythm, 24 px section rhythm, 48 px minimum controls, and
  52 px primary actions. Today leads with the daily practice, Together with
  the Table, Guide with its source boundary, and You with the current path.
- **Screen graph:** the 123 supporting screen states follow product-specific
  curriculum, Table, Guide, device, commerce, gift, and link journeys. The
  whole-house index remains an internal review catalog rather than the customer
  navigation model.
- **Guide entry:** before a first question, a person chooses Guide beta or the
  supplied lesson-text-only path. Sources and history have explicit routes.
- **Personas:** fifteen people arrive through the homepage picker (two groups: "where i'm at" and "a life
  moment"), each carrying a "what brings you" answer into sign-up; seven life moments also get a Keeper-review
  first-week card on Today. The list, care rules and lesson gaps: [PERSONAS.md](PERSONAS.md).
- **The Guide playbook**: how the Guide and companion handle seekers, people who moved on, anger at hard texts, hostility, venting and crisis, with 30 test cases: [GUIDE_PLAYBOOK.md](GUIDE_PLAYBOOK.md), cases in `tests/guide-cases/cases.json`.
- **Daily rollover:** a Door completed on an earlier local date advances to its
  next lesson when the app opens; progression no longer depends on a visible
  demo control.

## Not yet specified

- Account identity and cross-device sync.
- Final content catalog schema and CMS workflow.
- Signed Ambassador audio and Keeper approval records.
- Payment, gifting, notifications, events, festivals, metro counts, and location
  providers.
- Release hosting, domain, app-store packaging, analytics, and support operations.

## Out of scope

- Publishing, deploying, charging, messaging, or creating external accounts.
- Inventing the missing JSON dataset or marking draft curriculum as approved.
- Reworking the supplied visual language or information architecture.
