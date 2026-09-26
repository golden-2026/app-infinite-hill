# End-to-end smoke matrix

This harness checks the deployed or local HTTP surface and the client code that
the server actually ships. It uses Node's built-in test runner and `fetch`; it
does not require a browser automation dependency. Set `BASE_URL` to the origin
under test. It defaults to the Vite development server at
`http://127.0.0.1:5173`.

```sh
BASE_URL=http://127.0.0.1:5173 node --test tests/e2e/smoke.test.mjs
```

The harness is deliberately read-only. It never completes a lesson, changes
browser storage, submits a gift, or initiates a payment. Its client assertions
confirm that user-visible behavior and safeguards are present in shipped code;
they do not claim to simulate taps or prove persistence in an actual browser.

| Journey / invariant | Automated check | Browser/manual evidence still needed |
| --- | --- | --- |
| Marketing **Start free** bridge | Fetches `/site.html`; checks the CTA bridge and that door/view context is carried into the app URL. | Tap the CTA and a door-specific CTA; verify the overlay opens and the selected door reaches onboarding. |
| Hinduism onboarding and session | Checks shipped app code includes the authored `namaste` session and onboarding deep-link shell. | Complete onboarding and one Hinduism lesson through its result screen. |
| Unsupported door | Checks the shipped app displays the manuscript-coming state and explicitly avoids manufacturing lessons. | Open a mapped, unauthored session and confirm it cannot be started. |
| One credit per local date | Checks the client has a local-date guard on completion. | Complete both doors on one local date; verify the account-wide day count increases once, including after reload. Repeat after the local date changes. |
| Two-door isolation | Checks door-keyed path state and two-door UI contract are shipped. | Set two doors; advance one; switch, reload, and verify the other door's day and completion state did not move. |
| Guide offline honesty | Checks the fallback contains the no-signal response and labels a lesson-derived answer as offline. | With the Guide service unavailable, ask about today's word and an unrelated question; confirm the answers disclose the outage. |
| Plan and gift honesty | Checks previews say payment is not connected, checkout/delivery are pending, and saving a draft claims nothing was charged or delivered. | Open plans and gifts, exercise preview/save, and confirm there is no checkout redirect or success claim. |
| Account encrypted backup UI | Checks shipped client text for encrypted backup, export, and import controls. | Export without recovery secret, inspect file; repeat with explicit recovery-secret inclusion; import both forms and verify the warning and restored scope. |
| Account-state backend boundary | Sends an invalid account ID to `/api/state` and requires an explicit 400 `invalid_user_id` response. This is read-only and does not contact the database with a valid identity. | With an isolated test account and test database, upload then fetch an encrypted snapshot and verify plaintext never appears in the API response or stored record. |
| PWA routes | Fetches `/`, `/site.html`, `/manifest.webmanifest`, `/sw.js`, and the app icon; verifies standalone manifest and shell cache code. | Install on a supported mobile browser, launch standalone, then launch offline after one successful visit. |
| Mobile overflow | Checks the app shell is viewport-bounded and scrollable content can use vertical overflow. | Inspect 320×568, 390×844, and 768×1024; verify no horizontal page overflow or clipped primary actions in onboarding, session, Guide, plans, gifts, and account. |

## Interpretation

An HTTP smoke pass establishes route availability and shipped-code contracts
only. It does not establish backend persistence, successful encrypted upload,
cross-browser restore, visual layout, or a complete user journey. Record those
as browser evidence separately, including the tested build URL, viewport, date,
and any required API configuration. Do not use a static phrase check as proof
that a control is reachable or that an action succeeded.
