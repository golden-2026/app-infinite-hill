# Golden feature status

This is a source-based snapshot of the local private-beta implementation. It describes behavior in this repository, not independent verification of the deployed site or service configuration. “Working locally” means the code supports the behavior in this browser build. It does not mean that its content is approved for public use or that an external service is connected.

The local shell now includes a code-split Whole House navigator with 123 reviewable customer screen states spanning curriculum, accounts, Table, Together, plans, gifting, Guide, device behavior, and website/app landings. They are reachable from the profile screen or directly with `?screen=<screen-id>`. Screens that depend on Supabase Auth, Stripe outcomes, notifications, event providers, audio, content approval, or other live services remain explicitly preview, pending, or unavailable until a verified integration supplies their state.

| Customer-facing area | Status | What the source supports |
| --- | --- | --- |
| Onboarding and Door choice | Working locally | First run asks onboarding questions, offers eight Doors, and allows a fresh start or placement path. A website Door link can preselect a Door. |
| Eight Doors | Working locally; content preview varies | All eight Door choices and paths exist. Only 29 mapped lessons have supplied manuscript drafts, across Hinduism, Christianity, and Islam. Other mapped lessons are designed or outlined; unknown positions fail closed. |
| Lesson one or placement | Working locally for eligible preview lessons | Users can start from the top or take placement. Placement changes the selected lesson position, not the day count. The player is available only when the selected position has a local preview script. |
| Lesson beats and practice | Preview | The authored-session contract is eight beats: bell, review, hook, teaching, practice, word, carry, close. The local lesson player supports the supplied lesson interactions. Manuscripts remain unapproved drafts; 15 authored practices still need revision against the current sit ladder. |
| Earned word, carry line, and progress | Working locally; browser-local | Completing an available lesson shows its word and carry line and saves path progress in browser storage. This is device-local unless the user separately opts into encrypted backup and a live state service confirms a request. |
| Showed-up streak | Working locally; browser-local | Completion credits at most one day per local calendar date across the account, even when both Doors are practiced. There is no server-backed identity required for the local count. |
| Second Door | Working locally; browser-local | A user can add one visiting Door, switch between home and visit, and keep per-Door lesson positions. Completing lessons on both Doors still credits one showed-up day per local date. The UI caps the journey at two Doors. |
| Review | Working locally; browser-local | Earned words enter a due-date queue and the Today path opens a review flow for learned words. Reviews are stored with local progress. |
| Today | Working locally; content preview | The daily path, current lesson, streak, review entry, and two-Door switcher render in the app. Later curriculum slots may be outlines and are not full authored lessons. |
| Together / Table | Local Table preview; provider-backed pieces blocked | The Together screen opens. A Table can be created on this device, hold up to six local member/invitation entries, and record a shared showed-up streak locally. Invitation delivery, member accounts on other devices, live community data, and events are not connected. |
| Guide | Lesson-text fallback works locally; AI answers provider-backed | With no configured server model, the Guide can answer from supplied lesson text or disclose “no signal.” Live model answers require a configured server-side provider. Answers are beta references, not Keeper-approved guidance. |
| Plans | Checkout boundary built; provider blocked | House, Plus, and Table plan cards render. Paid choices call the same-origin commerce API, which accepts only server-owned Stripe price IDs and redirects only after a verified Checkout Session response. Stripe credentials and prices are not configured in this workspace. |
| Gifts | Local draft and checkout boundary built; delivery blocked | A recipient and gift can be saved in this browser and offered to the same server-owned Stripe boundary. Without configured Stripe credentials, the app explicitly says that nothing was charged or delivered. Gift claim and delivery are not connected. |
| Profile and preferences | Working locally; browser-local | Door selection and read-aloud preference are stored locally. Enabling the sunset chime explicitly requests browser notification permission and stores the timezone preference without precise location; automatic delivery remains pending until a scheduler/provider accepts it. |
| Account and recovery | Working locally; optional sync provider-backed | Anonymous account state and progress can be exported/imported with a recovery file. There is no verified sign-in identity. Encrypted remote backup is opt-in and must be reported from an observed successful API response; configuration alone is not a connected backup. |
| Marketing website link | Working locally | `public/site.html` Start free controls open the current app shell in an embedded view and preserve an optional Door choice. This is the local source bridge; it does not prove the deployed version matches. |

## Release boundary

The content catalog maps 2,648 lesson positions. Twenty-nine have manuscript-authored local preview scripts, and zero are currently marked publishable. Keeper review and voice/recording rights are pending. Community counts, event listings, proposed voices, planned pricing, and draft gift offers must not be presented as connected services. Production release also depends on the gates in [PRODUCT_SPEC.md](PRODUCT_SPEC.md) and [CONTENT_RELEASE.md](CONTENT_RELEASE.md).

## Verification

Run `npm test` for unit and HTTP acceptance coverage. The test runner starts an isolated local Vite server for the end-to-end checks and stops it afterward. Source checks do not prove a live provider request; rendered journeys were also inspected in the local in-app browser during this build.
