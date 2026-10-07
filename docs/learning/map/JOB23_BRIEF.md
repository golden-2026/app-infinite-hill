# Years 2-3 brief: the style pass and the new recipe in one go

Owner, 2026-10-07: "do all" for years 2-3 (days 332-1061, all 8 paths). Each lesson gets both of year 1's jobs in a
single pass, by one writer, then one independent checker.

1. **The style pass:** follow `docs/learning/map/JOB2_BRIEF.md` exactly, including its per-lesson checklist and
   `docs/learning/map/STYLE_EXAMPLES.md`. In short: shorter and warmer, no homework or "the bell holds the time"
   lines, varied sign-offs, fair `games.guess` ([right, wrong, wrong]), and the same facts, sources, title, word and
   carry line.
2. **The new recipe:** follow `docs/learning/map/V2_BRIEF.md` exactly: `games.chat`, `games.gloss` and fixing
   `games.recall`, plus the job 3 review note. Do this after the style pass, so the tap-a-word terms match the new
   spoken text.

Append both review notes to `review.notes`: the job 2 restyle note and the job 3 note.

## Checks, all must be clean before you finish

- `node scripts/learning/style-lint.mjs DOOR FROM TO` reports 0 problems.
- `node scripts/learning/style-guard.mjs REV`: run it the way JOB2_BRIEF says, if it applies to your range.
- `node scripts/learning/v2-lint.mjs DOOR FROM TO` reports 0 problems.
- `node packages/content/scripts/validate-scripts.mjs` shows 0 fail in your files.

## Rules that never bend

- Same facts, same sources. Invent nothing.
- Hedges stay hedged ("the story says", "tradition holds").
- Crisis lines stay exactly as they are.
- No "wrong" chat reply that any school or tradition actually teaches.
- Hard topics are handled gently, and self-harm is never presented as a choice to weigh.
- No guilt or hype, and never speak for God.
- Original script only when you are certain of the spelling.
