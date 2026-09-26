# golden app shell

This Vite shell turns the supplied `golden v150` React prototype into a connected private-beta product. The preserved journey includes welcome, lessons, today, Together, Guide, plans, gift, profile, and encrypted account recovery.

The expanded product journeys are available from **You → The whole house**. Individual states can also be reviewed with `/?screen=<screen-id>`; for example, `/?screen=mountain-map`, `/?screen=table-home`, and `/?screen=gift-details`. These screens are code-split by journey so the existing lesson shell does not load every review surface up front.

The complete supplied marketing site is available at `/site.html`. Its existing Start free modal opens this same current app in embedded mode, so the two review surfaces share one progress state and one runtime.

## Run locally

```sh
npm install
npm run dev
npm run build
npm run preview
```

The Guide uses the same-origin `POST /api/guide` route. Set `ANTHROPIC_API_KEY` in the serverless runtime to enable live answers. The Vite development route returns an unavailable response when that key is absent; the app then uses its built-in offline lesson fallback. Never put the key in a `VITE_*` variable or browser code.

Plans and gifts use the same-origin `GET/POST /api/commerce` boundary. Stripe Checkout remains unavailable until the server has `STRIPE_SECRET_KEY`, `GOLDEN_PUBLIC_URL`, and the applicable server-owned price variables (`STRIPE_PRICE_PLUS`, `STRIPE_PRICE_TABLE`, `STRIPE_GIFT_PRICE_100_DAYS`, `STRIPE_GIFT_PRICE_YEAR`, and `STRIPE_GIFT_PRICE_TABLE`). The browser cannot supply a price, entitlement, or redirect URL. No successful checkout is shown until Stripe returns a valid Checkout Session URL.

## Private beta account and state

The platform foundation creates an anonymous local profile with a stable random user ID and a separate 256-bit recovery credential. This is not sign-in: there is no verified identity, password, email, or account recovery service. The ID locates state; it never authenticates a request. A client must present the recovery credential as a bearer secret to read or write that ID's remote state.

Progress and preferences are stored in this browser under a versioned local-storage key. The platform snapshot schema is versioned independently and is ready for JSON export/import. Including the recovery credential in an export is opt-in; treat that file like a password. Import without the credential restores app progress to the current local profile. Import with it restores the transferable sync identity too.

Before remote upload, the browser encrypts the complete snapshot with AES-GCM. Its AES key is derived from the recovery credential using HKDF-SHA-256. The server stores only the ciphertext, IV, schema version, and SHA-256 hash of the credential. GET and PUT responses report pending, connected, or delivered from observed server results. API errors do not become success states. The API has no email login, credential reset, merge/conflict UI, or account deletion flow, so beta users must keep their recovery export safe and should not put highly sensitive notes in the preview.

The account-state API uses a local SQLite/libSQL database at `.data/golden.db` by default. The directory is ignored by Git. Initialize the versioned schema with `npm run db:init`. On Netlify, the function stores the same encrypted account records in the site's private Netlify Blobs store with strong authenticated access through the function runtime. Hosted Turso/libSQL remains supported by setting `TURSO_DATABASE_URL` and optionally `TURSO_AUTH_TOKEN`; never expose server credentials in a `VITE_*` variable or browser code. `npm run test:state` uses a temporary isolated SQLite file and removes it when finished.

The serverless route is `GET /api/state?userId=…` and `PUT /api/state`. For Vite local development, mount the provided middleware plugin alongside the Guide plugin:

```js
import { createStateDevMiddleware } from "./api/dev-state-middleware.js";

// Add createStateDevMiddleware() to the Vite plugins array.
```

The capability catalog reports auth as anonymous/device-local; sync as pending until a live encrypted API request succeeds; and payments, gifting, notifications, celebrity audio, events, and live community counts as pending. Reminder preference storage is device-local only. Displayed prices, event cards, voices, and community figures remain prototype content, not connected or delivered services. The existing Guide route is separate from state sync.

Finishing a lesson credits at most one completed day per local calendar date, even when using both doors.

The PWA shell caches same-origin app files for repeat and offline launches. Google Fonts and live Guide answers still require network access.

## Supabase destination

`supabase/migrations/20260913000100_golden_backend_contract.sql` defines the intended authenticated backend for private profiles and Door progress, practice completion, Table membership and invitations, private voice-note metadata, content approvals, entitlements, gifts, and idempotent provider events. It is not deployed or connected from this workspace. See `docs/SUPABASE_SETUP.md` for local validation and the remaining migration boundary from encrypted anonymous snapshots.

The source contract and release gates are in `docs/PRODUCT_SPEC.md`; the local decision map is in `docs/WAYFINDER.md`; verified browser coverage is recorded in `docs/QA.md`.
