# Golden product and engineering handoff

Prepared for the original creator of Golden on September 13, 2026.

## What was built

Your prototype is now a working mobile-first web app and public website. The visual language, tone, screen structure, eight-door concept, lesson rhythm, and public-site composition were preserved. The work focused on making those supplied surfaces function as one system.

The app is installable as a progressive web app on a phone or desktop. It includes first-run setup, Door selection, placement, resumable daily lessons, practice, earned words and carry lines, independent two-Door progress, durable completion and review scheduling, Guide fallback and history controls, Supabase email identity, a server-backed six-seat Table, Stripe checkout and verified entitlement boundaries, gift purchase and claim state, explicit sunset-notification permission, anonymous encrypted backup, recovery-file export/import, offline shell behavior, and website-to-app deep links.

## Links

- Public website: https://golden-house-beta.netlify.app/site.html
- Mobile app: https://golden-house-beta.netlify.app/
- Account and encrypted backup: https://golden-house-beta.netlify.app/?view=account
- Source repository: https://github.com/kayan-mudita/golden-house-beta

The GitHub repository is private. Kayan must add your GitHub username at:

https://github.com/kayan-mudita/golden-house-beta/settings/access

After accepting the GitHub invitation, you and Claude Code can clone it normally.

## Connect Claude Code

Install Git, Node.js 20 or newer, and Claude Code. Then run:

```sh
git clone https://github.com/kayan-mudita/golden-house-beta.git
cd golden-house-beta
npm install
npm run dev
```

Open the local app at `http://localhost:5173/` and the website at `http://localhost:5173/site.html`.

Start Claude Code from inside the repository:

```sh
claude
```

Give Claude this first message:

> Read CLAUDE.md, README.md, docs/PRODUCT_SPEC.md, docs/WAYFINDER.md, and docs/CONTENT_RELEASE.md. Then inspect the current app and tests. Preserve the supplied Golden visual language and structure. Tell me what is live, what is still a private-beta preview, and the smallest safe next milestone before editing anything.

Claude Code will automatically find `CLAUDE.md` in the repository root. That file describes the architecture, commands, product constraints, privacy boundary, and content-release rules.

## System map

The React/Vite app lives in `src/`. The complete public website lives in `public/site.html` and opens the same current app. The normalized curriculum is in `src/content/catalog.js`. Anonymous accounts, encrypted snapshots, and recovery files live under `src/platform/`. The same-origin Guide, state, and commerce APIs live in `api/`, with Netlify adapters under `netlify/functions/`. The Supabase destination contract lives in `supabase/` and remains undeployed until the project and credentials are selected.

Production state is encrypted in the browser before it reaches the backend. Netlify stores ciphertext, initialization vectors, timestamps, and a hash of the recovery credential in a private Blobs store. Local development uses SQLite/libSQL. The recovery credential is never included in a normal upload.

## What is proven

- The public website opens the current mobile app and passes door/view context.
- The production app, website, account route, manifest, and service worker return successfully.
- A live production state test wrote an encrypted envelope, read the identical envelope back, rejected an incorrect credential, and removed the test record.
- One hundred fifty-seven automated unit, content, backend, feature-domain, Netlify-adapter, and PWA checks pass, plus twenty-nine end-to-end checks.
- The dependency audit reports zero known vulnerabilities.
- The app works without an AI key by answering from the current lesson text and saying that it is offline.

## Content status

The content system maps 2,648 curriculum slots across eight doors. Twenty-nine supplied manuscript drafts are previewable: Hinduism days 1-21, Christianity days 1-7, and Islam day 1. The remaining 2,619 slots are mapped outlines rather than completed lessons. Fifteen practice scripts need revision against the current sit ladder.

No lesson is cleared for public release. Keeper approval, voice participation, and recording rights are still pending. The app labels these states directly instead of pretending prototype material is complete.

## Features that remain previews

Supabase identity, Table creation and invitations, privacy-safe shared attendance, Stripe checkout, verified webhook entitlements, gift purchase and claim state, and reminder permission are implemented. The supplied repository does not yet have a selected Golden Supabase project, applied migrations, Netlify environment variables, Stripe products or webhook secrets, or a delivery provider. Those features therefore remain unavailable on the live beta until the provider setup is completed and verified. Scheduled notification delivery, email delivery, live community counts, events, celebrity recordings, and signed Keeper participation are also not connected. The app reports those boundaries directly.

The Guide endpoint is ready for a server-side Anthropic key but should remain a lesson-based offline reference until privacy notice, abuse controls, retention terms, and provider configuration are approved.

## Recommended next milestone

Run a small, private content pilot with the 29 supplied drafts. Complete Keeper review and voice-rights decisions for one door, revise its stale practice scripts, and test the full lesson/recovery journey with invited adults. This produces one honest, releasable vertical slice before payments, family accounts, events, or public acquisition are connected.

## Working agreement

Treat the supplied product as the source of truth for design. Use GitHub issues or pull requests for changes. Never place API keys in the client. Do not expose religious-path selections, lesson history, Guide questions, or recovery credentials in logs or analytics. Keep the repository private until the content, voice, legal, privacy, and safety decisions are complete.
