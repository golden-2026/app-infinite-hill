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
5. The learning engine (owner priority, "as sophisticated as Harvard"): rebuild placement as a real adaptive test (item difficulty, understanding not word-matching, plausible distractors, stop when confident, a short open-answer check before big jumps), then mastery tracking and spaced review. Owner decisions (2026-10-03): placement first, Hinduism pilot, answers hidden until the end, outside expert reviews the rules first. Rules drafted: docs/learning/QUESTION_RULES.md. Next: the fake-test-taker simulator (§9), then the Hinduism bank (104 items) after the Tuesday reset.
6. Owner decisions open: mascot name; founder's note "we don't care which door" (keep or match); research-page
   videos "in production" vs "planned"; privacy page naming the AI provider.

## How to ship
- App: `cd apps/app; $env:CI='1'; npx expo export --platform web --output-dir ../../atlas/expo-liveN`, then
  `node atlas/pack-functions.mjs atlas/expo-liveN`, then the Netlify MCP deploy-site (site a55f267b-…), running
  its npx command inside the export folder (delete .netlify first). Last deploy: expo-live71 (2026-10-05: homepage shows only the eight most pressing reasons, one swipe row with a count and an end-aware hint; desktop pills above a wide card). Before that expo-live70 (2026-10-04: sign-up without "heard" or the five-year map, heard asked once after the first lesson; day-one pairs game; simpler win screen; back reviews reading without re-answering; "Priyanka's welcome" header). Before that expo-live69 (2026-10-03 evening: English Guide gets 988 and room for ~250 words on built paths and hard texts; "your move" and "call it" shuffle answers each visit; placement restart draws new starter questions; homepage evidence moves up after "was that the plan?" with 47% / 1 in 2 lonely / 33% less drug use; research page drops the cigarette line and says "women" for the 16-year study).
- Website: edit apps/app/public/site.html with small node scripts; Spanish pairs in atlas/mock/es.mjs (build throws
  on mismatch); rebuild with `node mock/build.mjs --apply` and `--lang es --apply` from atlas/.
- Lessons: never `npm run lessons` (wipes live lessons); build with `--out` to a scratch folder and merge weeks.
- GitHub push and remote changes are blocked for Claude; the owner runs
  `& "C:\Program Files\Git\cmd\git.exe" -C C:\Users\shset\code\golden-app push origin main`.
- Usage: weekly allowance resets Tuesday 2 AM Pacific; extra credits this week $312. Fable does NOT avoid credits
  once the weekly limit is hit.

## Session of 2026-10-03 evening (pick up here)
- Weekly allowance and extra credits ran out mid-run (extra spent this week: about $504). Everything below resumes
  after the Tuesday 2 AM PT reset. Check usage and quote the owner before restarting big jobs.
- Owner direction: concentrate on ONE excellent seven-day experience (ChatGPT review). Recommended first user: Hindu
  parents (Panditji's community); the owner has not confirmed yet. Plan days 1–7 as one arc; hide other features for
  the alpha.
- Live (expo-live69): Guide 988 + longer answers, shuffled games, placement restart, homepage evidence moved up.
- Now live in expo-live70 (was saved on the branch): Hinduism question bank (docs/learning/bank, 104 items,
  blind-checked 78/78), sign-up without "heard" and the five-year map (heard is asked after the first lesson), day-one
  pairs game, trimmed win screen, back = review reading without re-answering, welcome header names the voice. Needs
  screenshots to the owner, then deploy.
- Parked branches (not merged; breadth, keep off for the alpha): worktree-agent-af811feace3e8cb10 (Guide sprint 2:
  switch to my own path in chat, sampler week, chips, grader scripts/learning/guide-grader.mjs) and
  worktree-agent-a79829735f4276e67 (couple features).
- Lesson seams (title-as-carry, phrase-as-word): branch worktree-agent-a47b4a38300d64c48. Hinduism: 644 lessons fixed,
  1061/1061 validate (the owner okayed the outline/index change). Work files: atlas/seams-work (INSTRUCTIONS.md,
  apply.mjs, extract.mjs, work/<door>/bNN.in|out.jsonl, queue.txt); first point SP in apply.mjs/extract.mjs at
  atlas/seams-work. Remaining: Hinduism b05 b11 b14 b16 and every batch of the other seven doors (owner: "do all
  doors"; about $300–500). One batch = one subagent with INSTRUCTIONS.md; then `node apply.mjs DOOR`,
  import-outline/import-paths, validate-scripts, commit per door.

## Review kit findings (2026-10-03, docs/review-kit/, Claude's own baseline: overall 3.6/5)
Content is mostly accurate (4.0); the learning design is the weak part (2.9). Fix first:
1. DONE (expo-live69): "what would you do?" games now shuffle (the right answer was option 2 in 88% of lessons).
2. Placement: the longest answer is right in 68% of story questions; some word questions have two true options;
   Simply Spiritual has no placement questions. (Folds into the learning engine.)
3. Guide prompt (api/guide.js): DONE (expo-live69) the English 988 line and longer build-a-week / hard-text answers; it tells users scholars
   review the lessons and that there are "voices they know" (owner, 2026-10-03: KEEP these claims for the demo; do not remove).
4. Lessons: every practice ends "the bell holds the time"; 3,229 imagined practices; review only looks back one day;
   life-tip endings trivialize serious material; 1,435 carry lines just repeat the title (process leftovers).
Send the kit to Panditji, paid reviewers and an instructional designer before writing year 5.
