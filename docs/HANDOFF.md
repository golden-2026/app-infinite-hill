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
3. Guide, sprint 2 (built on a branch, not live): one-tap "switch to my own path" in chat (confirm + undo), the
   sampler week (app/sampler.tsx; 7 written lessons from 7 doors, Keeper review of the picks pending), tidier
   "remember this" chips, and the grader (scripts/learning/guide-grader.mjs; needs a key to run for real).
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

## Session of 2026-10-06 (pick up here; newest first)
- LIVE: expo-live81 (2026-10-08): placement quiz waits on a wrong/unsure answer with the right one in green until Next.
- LIVE: expo-live80 (2026-10-08, owner: "publish years 2-3"): years 2-3 (days 332-1061, all 8 paths): style pass + new recipe in one go via workflow (docs/learning/map/JOB23_BRIEF.md), 304 batches each written then independently checked (1,782 fixes), style-lint/v2-lint/style-guard/validator all clean; 64 plainer chat replies (owner-approved). Extra usage for the run ~$380. Waiting on owner okay to publish.
- LIVE: expo-live79 (2026-10-07, owner: "publish everything"): job 3 complete on year 1 of all 8 paths (days 22-331: chat, tap-a-word, old words in the pairs; ~1,300 second-reader fixes), no typing anywhere (chat reply bubble appears only on tap; level 4 / go-deeper listen is tap). Next: years 2-3 after the Oct 13 reset.
- BUILT, NOT LIVE (2026-10-07): job 3 on year 1 of all 8 paths (days 29-331): chat, tap-a-word glosses, old words in the pairs; each batch machine-checked (scripts/learning/v2-lint.mjs) and second-read (~1,300 fixes). Only Simply Spiritual days 209-238 still old-style (a drafted script was blocked by the safety check; owner to choose: redo normally or approve it). Cost: weekly allowance 51% -> 61%. Next: owner okay to publish; years 2-3 after the Oct 13 reset.
- LIVE: expo-live78 (2026-10-07, owner: "publish the pilot"): job 3 pilot, the new recipe on days 22-28 of all 8 paths (brief docs/learning/map/V2_BRIEF.md; checks scripts/learning/v2-lint.mjs, scripts/learning/add-recall.mjs). Owner then approved year 1 on all 8 paths now, extra charges okay.
- LIVE: expo-live77 (2026-10-07, owner: "make day 30 live"): the new-style lesson pilot on Hindu day 30 (games.chat / games.gloss / games.recall turn on packages/content/src/v2.js: new word first, tap-for-meaning, complete the chat, old words in the pairs, one rotating game, challenge finale, "one you missed", identity line; explain-my-answer opens the Guide prefilled). Every other lesson is built as before.
- LIVE: expo-live76 (2026-10-07, owner: "publish it"): the style pass on all of year 1 (days 22-331, all 8 paths), the
  cleanup round, the site video label and demo day numbers. Next: years 2-3 style pass (days 332-1061) after the Tuesday
  2026-10-13 reset with the same workflow (scriptPath style-pass-year-1; change FIRST/LAST and the y1 folder to y2/y3).
- JOB 2 (style pass, owner: "use a workflow"): brief docs/learning/map/JOB2_BRIEF.md; examples STYLE_EXAMPLES.md;
  machine checklist scripts/learning/style-lint.mjs DOOR FROM TO; guard scripts/learning/style-guard.mjs REV. Pilot done and
  committed (days 22-34, all paths). Year 1 days 35-331 running as workflow style-pass-year-1 (run wf_9f95203f-822; resume
  with its scriptPath + resumeFromRunId). After it: lint every path 35-331, guard vs the pre-run commit, validate, ship-door
  all 8, commit, screenshots, ask to deploy. Years 2-3 (days 332-1061) after the Tuesday reset unless the owner pays extra.
  Lessons learned: open-ended reviewer loops don't converge; machine-check the mechanical rules, review only lost/invented.
- Also done 2026-10-06/07: scholar packets docs/review/<PATH>.md (scripts/learning/review-packets.mjs); cleanup round
  (apply.mjs now merges index fields); site video label + demo day numbers (not live); games.guess support; YEARS_4_5.md.
- LIVE: expo-live75 (2026-10-06 night, owner: "publish as is"): job 1 from the five-year map on all 8 paths
  (~55 lessons; docs/learning/map/), seams on all 8 paths, Guide safety (crisis wording, offline crisis reply, psychedelics
  and channeling rules, 43 cases). Research: docs/learning/research-extra/ (Reddit saved by the owner into
  reddit-saved/, git-ignored; YouTube; IG/TikTok; app reviews). Next: job 2 (style pass for days 22+, needs "use a
  workflow"), seams rejects + 65 plain words + 7 Sikh titled names, Keeper review lists in each lesson's notes, year-4
  plan moves, website (Day-1 video label "amen", demo day numbers), celebrity name in scenes prompts (owner kept it).
- LIVE: expo-live74 (2026-10-06 night, owner: "publish now, then fold in the findings"): every path's rebuilt first camp. Before that expo-live73 (the rebuilt Hindu week). Was committed before expo-live74: every other path's first camp
  rebuilt from its audience research (docs/learning/week1/<DOOR>.json → week1-data.js; scripts/learning/fix-day-refs.mjs
  and fix-app-days.mjs move later citations and app day links), tests updated (463/465; the 2 old environment failures
  remain). Next: fold docs/learning/research-extra/THREADS_AND_COMMENTS.md into the first weeks (screenshots before it goes live). Screenshot robot for any path:
  scratchpad w1door.mjs <out> <day> <maxShots> <DOOR>.
- Seams applied and committed: Hinduism, Judaism, Buddhism, Catholic, Christianity (101 rejects), Islam (57 rejects;
  batch b06 was split into b06a/b06b, so apply with --only=b01,…,b06a,b06b,…). Sikhism b01–b06 done, b07–b10 running,
  b11–b16 left; Spiritual b01–b18 not started. Rejects are mostly "word isn't in the lesson" (agents re-spelled a
  term): redo with extract.mjs DOOR 45 --only ids.json, telling agents to copy the word character for character.
- Research extras: docs/learning/research-extra/REDDIT.md (search-engine snippets only; Reddit itself is blocked) and
  SOCIAL.md (Instagram/TikTok read-only in the owner's Chrome; TikTok logged out, so views but no likes). Not yet
  folded into the week-one lessons. Still missing: Reddit replies, YouTube comments (owner asked for exhaustive).
- Validator: "mum" British-spelling check no longer flags names like Mumtaz/Mumbai.
- LIVE: expo-live72 (2026-10-06, owner approved "publish the normal one"): the Hindu week-one upgrade (story card,
  "most people get this wrong", build the word, look-backs, thinking question, day-7 check-in, tap-to-hear, "i knew
  that · skip to the games"), days tightened and lightened, curated Hindu placement (docs/learning/bank → apps/app/src/
  content/placement-curated.ts via scripts/learning/build-curated.mjs), tester switch EXPO_PUBLIC_FOCUS_DOOR (off),
  pulse week-one funnel, Guide sprint 2 + couple features merged, Hinduism 644 seams. NOT yet live (committed after):
  the REBUILT Hindu week one (below), Hinduism/Judaism/Buddhism seams batches.
- Hindu week one REBUILT from docs/learning/AUDIENCE_RESEARCH.md (owner: "meet them where they are", "don't freak
  people out"): 1 Ganesha · 2 om · 3 Gayatri (mantra folds in) · 4 namaste + touching feet (pranam folds in) · 5 arti +
  prasad · 6 why so many gods (ishta devata, ekam sat) · 7 karma + check-in · 8 puja · 9 dharma · 10 atman · 11 Brahman ·
  12 guru · 13 japa · 14 shanti · 15–21 unchanged. Index override: packages/content/src/hindu-week.js (applied in
  index.js, plus ADULT.HINDUISM day-1 bet = Ganesha); QUIZ, WEEK_ONE, sampler/life-moments/intake day numbers updated.
  Needs owner screenshots review, then publish. Panditji/Keeper review pending for all new copy.
- Owner rules saved: light start (memory light-start), one famous text name a day max early, stories open with drama,
  no Manusmriti early; no comics; no homework asks; adults get it the first time.
- Audience research for all 8 paths: docs/learning/AUDIENCE_RESEARCH*.md (Catholic report was still running). Next:
  rebuild each path's week one from its report, like Hinduism (owner asked for this).
- Seams job (big job 1 of 3): work in C:/Users/shset/code/golden-app/atlas/seams-work (apply.mjs now takes
  --only=b05,b11; SP/WT point at this worktree). Subagents (Sonnet) often write their output into THIS worktree's
  atlas/seams-work/work/<door>/ — copy those into the main atlas folder before apply. Done and committed: Hinduism,
  Judaism, Buddhism. Catholic batches mostly done/running; Christianity, Islam, Sikhism, Spiritual not started. Redo
  batches: judaism retry01/02 (apply when retry02 lands), Buddhism's 35 rejects. A batch can exceed the 64K output cap:
  split it (b06a/b06b). After apply: import-outline, import-paths, validate-scripts, then
  scratchpad ship-door.mjs (rebuilds that door's week files, keeping live days 1062–1064 in chunk 152).
- Big jobs 2–3 (Year 4 checks, Opus second pass) need the owner to say "use a workflow" (Workflow tool opt-in).
- Jewish day 1025 (1948): word "atzmaut", voice names the Nakba too; flagged for Keeper review.

## Session of 2026-10-03 evening
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
