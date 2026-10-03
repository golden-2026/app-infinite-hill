# Infinite Hill: Claude Code project context

Infinite Hill (legal name Infinite Hill Ventures, Inc.; older files still say "Golden") is a mobile-first app for short
daily religious and spiritual practice across eight doors: Hinduism, Buddhism, Christianity, Catholicism, Judaism,
Islam, Sikhism and my own path (Simply Spiritual). The owner, Shaan Sethi, is a non-technical founder.

## Start here

1. `docs/HANDOFF.md`: where things stand, what's next, how to ship. It is the newest source of truth.
2. `docs/brand/MASCOT_VOICE.md`: every user-facing line is the mascot's voice.
3. `docs/PERSONAS.md`: the five personas and sixteen reasons.
4. `docs/GUIDE_PLAYBOOK.md` and `tests/guide-cases/cases.json` before changing `api/guide.js` or `api/companion.js`.
5. `docs/review-kit/`: the outside review kit and its findings.

Older docs (`README.md`, `CONTEXT.md`, `docs/PRODUCT_SPEC.md`, `docs/WAYFINDER.md`) describe the earlier "Golden"
Vite prototype. Use them for background only; where they disagree with the handoff, the handoff wins.

## Where things live

- The real app is the Expo (React Native, web export) app in `apps/app` (`apps/app/src/app` holds the screens:
  tabs Today, Guide, Together, You). The repo root's Vite build (`src/`, `index.html`) is the older prototype.
- Website: `apps/app/public/site.html` plus the footer pages; Spanish pairs in `atlas/mock/es.mjs`.
- Server functions: `api/*.js` (Guide, companion, state, wellbeing, circles, waitlist…), adapted by `netlify/functions/`.
- Lesson scripts: `docs/curriculum/<door>/scripts/y<N>/day-NNNN.json`; tools in `packages/content/scripts/`.
- Lesson workflows: `scripts/workflows/`.
- Code: GitHub `golden-2026/app-infinite-hill`. The QA atlas is git-ignored in `atlas/`.

## Commands

```sh
npm install
npm run test:unit        # repo root: feature, backend and content tests
cd apps/app; npx expo start --web
```

Never run `npm run lessons` or `npm run export:web` in `apps/app`: they rebuild and wipe the live lessons. Build
lessons with `--out` to a scratch folder and merge. Full shipping steps are in `docs/HANDOFF.md` ("How to ship").

## Owner rules

- Plain, brief language with the owner; no jargon.
- Send phone-size screenshots before any design or copy change goes live. Ask before every deploy.
- Check usage and tell the owner the cost before any big job (workflows, lesson checks).
- The mascot's voice is warm first; the mascot says "i", "we" is only the company. Only the approved mascot art
  (backwards cap) anywhere.
- Do not publish unreviewed religious content or imply that proposed voices and Keepers are signed.
- No "draft" or "review pending" labels in user-facing copy; don't mention daily AI limits.
- Never invent testimonials or community numbers; show real counts only above a threshold.
- Lessons get repeated review passes; a year goes live only with the owner's okay.
- Keep the Foundation "in formation"; never state a share of proceeds the owner hasn't chosen.

## Safety and privacy

- The Guide and companion must fall back gracefully when no AI key is configured. Never put server credentials in
  `EXPO_PUBLIC_*`, `VITE_*` or any browser code.
- Crisis care: danger or self-harm points to 988 (US) or local emergency help, in every language.
- Don't log credentials, auth headers, decrypted snapshots, chosen doors, practice history, journal text or Guide
  questions. Treat recovery files like passwords.
- Don't claim a feature is connected until a live request proves it.
- Don't deploy, change production secrets, push to GitHub or make anything public without the owner's approval.
  (Pushing is blocked for Claude; the owner runs the push command in `docs/HANDOFF.md`.)

## Live surfaces (behind a Netlify login)

- App: https://infinite-hill.netlify.app/
- Website: https://infinite-hill.netlify.app/site.html
- QA atlas: https://infinite-hill-app-atlas.netlify.app (refresh only at milestones)
