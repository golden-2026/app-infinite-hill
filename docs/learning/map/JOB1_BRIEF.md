# Job 1: the content changes from the five-year map (owner: "do job 1 for all 8 paths at once", 2026-10-06)

You are the writer for ONE path. Your inputs: `docs/learning/map/<PATH>.md` (this path's map) and
`docs/learning/map/SUMMARY.md`, plus the research it cites (`docs/learning/AUDIENCE_RESEARCH*.md`,
`docs/learning/research-extra/*.md`). The voice and format rules: `docs/learning/week1/BRIEF.md` ("The voice"),
`docs/brand/MASCOT_VOICE.md`, `docs/curriculum/SCRIPT_GUIDE.md`, and the validator `packages/content/src/lesson-script.js`.
Model lessons: this path's days 1–7 (`docs/curriculum/<door>/scripts/y1/`).

## What to do
A. **Verify first.** For each proposed change in the map, open the actual lesson(s) it names. If the lesson already
   covers it (the outline is only one line a day), drop the change and note it. Keep the changes that hold up, ranked.
B. **Make the changes, years 1–3 only** (written scripts, days 22–1061). Target: the map's top changes, about 8–12
   lessons for this path. Never renumber days. Each change is one of:
   - **Replace** a weak or redundant lesson in the right stretch with a new lesson on the needed topic (same day
     number). Prefer slots inside the right week/camp where the topic fits the neighbors; prefer replacing a lesson
     whose content is repeated elsewhere. Say what was replaced and where its content still lives.
   - **Add to** an existing lesson (a teach bubble, a "traditions differ" line, a reassurance) when the topic fits there.
   - **Early answer** for a topic taught deep later: write the early, light lesson; leave the deep later lesson as is
     (or add one line pointing back).
C. **Week one (days 1–21):** small in-place additions only, no reordering, where the research's takeaways
   (`research-extra/THREADS_AND_COMMENTS.md` "5 takeaways", `REDDIT_REPLIES.md`, `REDDIT_ROUND2.md`) fit an existing
   day: a "you're not behind" line, a relief line, a sharper fact. At most 3 days touched.
D. **Keep everything consistent** for every day you change:
   - the script itself (full `ih-lesson/1` format, word counts in bounds, games from the day's own teaching,
     `sources` real and exact, a review note "Rewritten 2026-10-06 from the five-year map; confirm with the Keeper.");
   - the NEXT day's `review` segment (it recaps the previous day: name the new word/line) and the PREVIOUS day's
     `tomorrow` field (the new title);
   - `docs/curriculum/index-fixes/<door>.json`: set `{ "<day>": { "title", "word", "hook", "carry", "practice" } }`
     for each replaced day so the index matches (merge into the existing object; keep other days untouched);
   - any later lesson that cites the replaced day by number or names its old word as "your word".
E. **Validate:** `node packages/content/scripts/validate-scripts.mjs <DOOR>` must end with 0 fail, and
   `node scripts/learning/build-week1.mjs --check` must pass. After you update index-fixes, run
   `node packages/content/scripts/import-outline.mjs` (Hinduism) or `node packages/content/scripts/import-paths.mjs`
   (other paths) so the index is rebuilt, then validate again.
F. **Do not** run `npm run lessons` or `export:web`, ship week files, deploy, commit, or edit anything outside: your
   path's scripts, your path's `index-fixes` file, and the generated outline the import script rewrites.
   Do NOT edit app files; instead LIST any app references to the days you replaced: grep
   `apps/app/src/content/placement-bank.ts`, `placement-curated.ts`, `intake.ts`, `sampler.ts`, `life-moments.ts`,
   `packages/content/src/quiz.js` for those day numbers and report the hits.

## Content rules
The voice rules in `week1/BRIEF.md` apply (say it once, lead with the interesting, light early, one famous text a day
early, stories open with the drama, no homework asks, warm, plain, American spelling, never rank traditions or sects,
no politics, facts exact, "many families…" where traditions differ). Sensitive topics named in the map: handle with
care, add the Keeper review note, and put the hardest ones (caste, sexuality, hell, Israel/Palestine, 1984, Aisha's age,
psychedelics) in "traditions differ / ask your Keeper" framing or leave them for a later year rather than settle them.
Crisis: any lesson on despair, grief or "what's the point" includes a gentle line that help is there (988 in the US, or
local emergency help).

## Report (your reply)
- Changes made: `day N: replaced "<old title>" → "<new title>"` / `day N: added …`, one line each, with why.
- Changes dropped after verification, and why.
- App references to replaced days (file:line), for the lead to fix.
- Facts and sensitive points the Keeper should confirm.
