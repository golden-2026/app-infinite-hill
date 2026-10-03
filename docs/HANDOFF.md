# Handoff (2026-10-03)

Where Infinite Hill stands, for the next working session. Read this, then CLAUDE.md, then the docs it links.

## The owner
Shaan Sethi, non-technical founder. Explain things plainly and briefly, no jargon. He tests on his phone and sends
screenshots. Standing rules live in Claude's memory (empathy-first voice, mascot says "i", screenshots before
design changes go live, ask before deploying, real testimonials only, check usage before big jobs).

## Live now (https://infinite-hill.netlify.app, behind a Netlify login)
- Lessons years 1–3 (days 1–1,061) on all 8 doors, checked; chopped-word bug fixed.
- Homepage: 16 reasons ("which one sounds like you?"), 8 up front shuffled each visit, warm copy, swipe on phone
  opens the card; 18 footer pages as real pages; approved mascot everywhere.
- App: placement anywhere in years 1–3 with gentle walk-back; WHO-5 wellbeing check-in; the gentle lane for grief,
  health news, struggling, forgiveness (4 screens, first lesson is a first-week lesson); all 16 journeys match
  their card; tabs Today/Guide/Together/You; circles; kids track.
- Guide/companion: seeker help (build a path, never refuse), hard-text, hostility and venting rules, mascot voice.
- Voice: docs/brand/MASCOT_VOICE.md (modeled on Usha Kiran; mascot = "i", company = "we").

## Key docs
- docs/PERSONAS.md: 5 personas, 16 reasons, first-week lessons, gaps.
- docs/GUIDE_PLAYBOOK.md + tests/guide-cases/cases.json (30 cases).
- docs/brand/MASCOT_VOICE.md.
- The plan and ranked to-do list: https://claude.ai/code/artifact/3f6bd7cc-7f4d-4456-ab6b-6ed32d015479
  (BCGDV-style stages, 12 weeks, 3 gates; sprints run Tuesday to Monday).

## In progress / next (sprint 1 starts Tue Oct 6, when the weekly allowance resets)
1. Year 4 lessons (days 1062–1426): written and edited; ~430 checked; ~2,500 checks left. Resume the workflow
   `write-lessons-new-process` (script: scripts/workflows/write-lessons-new-process.js, run with the Workflow tool, scriptPath; args {year:4, batch:10, ranges per door
   1062–1426}). Then an Opus second pass on years 1–4. Push each year live only with the owner's okay.
2. Couple features: "walk it together", "before the holiday", couple Guide questions.
3. Guide, sprint 2: one-tap "switch to my own path" in chat, the sampler week, tidier "remember this" chips, an
   automatic grader for the 30 cases.
4. Cost per active user; alpha invites (owner picks 10–20 people); 5 interviews; Panditji sign-off; one voice LOI.
5. Owner decisions open: mascot name; founder's note "we don't care which door" (keep or match); research-page
   videos "in production" vs "planned"; privacy page naming the AI provider.

## How to ship
- App: `cd apps/app; $env:CI='1'; npx expo export --platform web --output-dir ../../atlas/expo-liveN`, then
  `node atlas/pack-functions.mjs atlas/expo-liveN`, then the Netlify MCP deploy-site (site a55f267b-…), running
  its npx command inside the export folder (delete .netlify first). Last deploy: expo-live66.
- Website: edit apps/app/public/site.html with small node scripts; Spanish pairs in atlas/mock/es.mjs (build throws
  on mismatch); rebuild with `node mock/build.mjs --apply` and `--lang es --apply` from atlas/.
- Lessons: never `npm run lessons` (wipes live lessons); build with `--out` to a scratch folder and merge weeks.
- GitHub push and remote changes are blocked for Claude; the owner runs
  `& "C:\Program Files\Git\cmd\git.exe" -C C:\Users\shset\code\golden-app push origin main`.
- Usage: weekly allowance resets Tuesday 2 AM Pacific; extra credits this week $312. Fable does NOT avoid credits
  once the weekly limit is hit.
