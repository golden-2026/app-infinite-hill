# Golden: Claude Code project context

Golden is a mobile-first progressive web app for short daily religious and spiritual practice. The supplied look, feel, navigation, and information architecture are product constraints. Preserve them unless the owner explicitly requests a redesign.

## Start here

Read these files before changing the product:

1. `README.md` for setup and architecture.
2. `docs/PRODUCT_SPEC.md` for intended product behavior and release gates.
3. `docs/WAYFINDER.md` for the current system map and implementation decisions.
4. `docs/CONTENT_RELEASE.md` for content status and approval requirements.
5. `docs/PRIVACY_ARCHITECTURE.md` and `docs/ACCESSIBILITY_REVIEW.md` before changing accounts, Guide, storage, children/family features, or interaction patterns.

## Commands

```sh
npm install
npm run dev
npm run build
npm test
```

The app runs at `http://localhost:5173/`; the public website is `http://localhost:5173/site.html`.

## Architecture

- React 19 and Vite power the mobile app in `src/Golden.jsx`.
- `public/site.html` is the supplied public website and opens the current app in an iframe.
- `src/content/catalog.js` is the normalized content catalog.
- `src/platform/` owns anonymous accounts, snapshots, recovery files, encryption, and API calls.
- `api/state.js` and `api/_db.js` implement encrypted account-state persistence.
- Netlify Functions adapt the Guide and state APIs in `netlify/functions/`.
- Production uses private Netlify Blobs. Local development uses SQLite/libSQL.
- `public/sw.js` and `public/manifest.webmanifest` provide installable PWA and offline-shell behavior.

## Product truth

The deployed build is a private beta. It currently has 2,648 mapped curriculum slots and 29 manuscript-authored preview lessons. None are approved for public release. Keeper review, voice participation, and recording rights remain pending. Do not turn prototype copy, proposed celebrities, planned Keepers, sample community numbers, prices, gifts, events, family accounts, payments, or email-list behavior into claims that those services are connected.

The Guide must clearly fall back to supplied lesson text when no AI provider key is configured. Never put server credentials in `VITE_*` variables or browser code.

The anonymous recovery credential is both a bearer secret and the basis of snapshot encryption. Treat exported recovery files like passwords. Do not log credentials, authorization headers, decrypted snapshots, selected doors, practice history, or Guide questions.

## Change rules

- Keep the supplied visual language and mobile dimensions.
- Keep manuscript text separate from generated placeholder content.
- Run the relevant tests and inspect the rendered mobile app and website.
- Do not claim a feature is connected until a live request proves it.
- Do not publish unreviewed religious content or imply that proposed voices and Keepers are signed.
- Do not deploy, change production secrets, or make the repository public without the owner's approval.

## Live surfaces

- App: https://golden-house-beta.netlify.app/
- Website: https://golden-house-beta.netlify.app/site.html
- Account: https://golden-house-beta.netlify.app/?view=account

