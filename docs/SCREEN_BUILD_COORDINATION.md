# Golden screen build coordination

## Destination

Turn the supplied Golden prototype's preview cards and dead-end actions into coherent customer journeys while preserving its exact visual language and private-beta truth labels.

## Shared resources

- `src/Golden.jsx` remains the active shell and final integration point.
- New screen modules live under `src/screens/`; shared Golden primitives live under `src/ui/`.
- `src/content/catalog.js`, `src/features/`, and `src/platform/` remain the behavior and data boundaries.
- Supplied visual source: `/Users/kayan-work-mac/Downloads/golden/golden_v150.jsx`.

## Ownership and dependencies

1. Shared UI primitives land first; all new screen modules consume them.
2. Curriculum, account, Table, Together, commerce, gifting, Guide, reminder/offline, and website-link modules have separate file ownership and can be built in parallel.
3. The shell integration pass begins after modules export stable screen contracts.
4. Existing backend and feature tests are preserved; each module adds focused behavior tests only where state transitions are material.

## Gates

- Preserve cream/dusk/gold palette, typography, card geometry, Sun treatment, spacing, and mobile dimensions.
- No unapproved manuscript becomes a shippable lesson.
- Proposed voices, Keepers, events, counts, prices, payments, delivery, and provider connections remain clearly labeled as preview or pending until proven live.
- No secrets enter browser code or `VITE_*` variables.
- All existing tests and the production build pass after integration.
- Rendered mobile app and marketing-site journeys receive browser inspection.

## Expected first-pass result

- 10 independently owned screen packages.
- At least 35 new navigable customer screen states across the highest-value journeys.
- One integrated route registry in the existing shell.
- Focused tests plus the full repository test/build suite.

## Production slice dispatch · 2026-09-13

### Dependencies

- Identity is the root dependency for cross-device progress, Guide history,
  Tables, Stripe entitlements, and gifts. Each package must expose a local-safe
  contract that can later bind to the same authenticated account.
- The current anonymous encrypted snapshot remains the migration source. No
  package may silently discard or overwrite it.
- `src/Golden.jsx` is owned by the orchestrator during parallel work. Agents
  return modules and tests; the orchestrator integrates their public contracts.
- `src/ui/GoldenUI.jsx` is shared and read-only during dispatch to avoid visual
  drift and merge conflicts.

### Agent ownership

1. Lesson continuity owns `src/features/lesson-session.js` and its tests.
2. Progress owns `src/features/progression.js`, `src/screens/ProgressScreens.jsx`, and focused tests.
3. Guide owns new Guide storage/report modules and tests, without changing the live Guide shell.
4. Identity owns new Supabase-ready identity modules and tests under `src/platform/`.
5. Account journey owns a new production account controller module and tests, without editing `AccountScreen.jsx`.
6. Table sync owns new Table repository/API modules and tests, without editing `Golden.jsx`.
7. Commerce owns Stripe return/webhook/entitlement verification modules and tests.
8. Gifts owns gift lifecycle state and repository modules with tests.
9. Device owns PWA install/offline/background-sync state modules and tests.
10. QA owns a production acceptance matrix and adversarial tests, and edits no application source.

### Gates and expected results

- Each agent returns one bounded package, tests, and exact integration notes.
- Expected result count: 10 packages, at least 25 meaningful state transitions,
  and one reconciled customer flow across practice, progress, Guide, identity,
  Table, commerce, gifts, and device state.
- No agent commits, pushes, deploys, changes secrets, creates paid resources, or
  sends external messages.
- The orchestrator runs full unit, E2E, production build, and rendered browser
  verification before claiming any state is complete.
