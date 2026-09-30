# Full lesson scripts: loading them without bloating the app

*Status: wired (2026-09-30). The lesson screen waits up to 2.5 s for the day's script (`apps/app/src/session/script-load.ts`, `apps/app/src/lib/lessons.ts`), then plays it or the outline-built lesson. Tests: `packages/content/test/lesson-script.test.js` and `tests/features/lesson-script-wiring.test.mjs`. Not done: the Today prefetch (§4.6) and the draft label (§4.7).*

## 1. Why

About 14,300 days still need full scripts (7 doors × 1,791 days, plus the Hindu path after its 21 manuscript days). At the pilot's measured size (see §5) that is roughly 80 MB of JSON. `generated/data.js` alone is already 435 KB in the bundle. Scripts therefore never go in the bundle: the app keeps only the small **index** (title, word, hook, carry per day: camp one in `data.js`, the outlines in `generated/outline-*.js`) and fetches a script when its lesson opens.

## 2. Pieces

| piece | where | what it does |
|---|---|---|
| source scripts | `docs/curriculum/<door>/scripts/y<N>/day-NNNN.json` | one file per day, the format in `SCRIPT_GUIDE.md` (`ih-lesson/1`) |
| format check | `packages/content/src/lesson-script.js` → `checkScript()` | schema, segment order, spoken word counts, games, public-domain sources, forbidden phrases, spelling, and word/carry equal to the index |
| validator | `packages/content/scripts/validate-scripts.mjs [DOOR]` | runs the check on every file, plus neighbor checks; exit 1 on any error |
| build | `packages/content/scripts/build-lessons.mjs [--out dir] [--check]` | compiles passing scripts into week files + a manifest (below); strips `review.notes` and `meta` |
| loader | `lessonScript(door, day, { base, fetch, store })` in `lesson-script.js` (re-exported from `@ih/content`; also importable alone as `@ih/content/lesson-script`, which pulls in no design data) | fetches the manifest once per session, then the day's week file (cache-busted by its hash), keeps it in memory and in an optional store; returns the day's script or `null`; never throws |
| planDay support | `planDay({ …, script })` in `packages/content/src/index.js` | with a script: the script's segments, today's match pairs, the script's practice on days 1–7, the day's feature game (myth/fork/original/trapdoor) on days 2–5 in place of day one's, and one more from day 6; without one, exactly as before |

### Output layout

```
apps/app/public/lessons/manifest.json            { format, chunkDays: 7, built, doors: { CHRISTIANITY: { days, chunks: { "001": "<hash>", … } } } }
apps/app/public/lessons/christianity/001.json    { format, door, chunk, hash, days: { "1": {…}, … "7": {…} } }   days 1–7
apps/app/public/lessons/christianity/002.json    days 8–14   …   256.json = days 1786–1791
```

**Why a week per file**, not a camp or a day: a camp file would be 21–100 days (up to ~0.5 MB for Camp 5, and years 2–5 have no camps at all); a day file means 14,300 tiny requests and nothing in hand offline tomorrow. A week is about 40 KB (about 12 KB gzipped), one request, and opening today's lesson also keeps the next few days for a flight or a dead zone. The manifest (about 25 KB when every door is full) says which weeks exist, so a day with no script costs no 404, and its hashes make every week file safely cacheable forever.

### Fallback

`lessonScript` returns `null` when the door has no script for that day, the network is down and nothing was kept, or anything fails. The caller then builds the lesson exactly as today (camp-one data or the outline). The index never depends on a script, so Today, the strand, the review, the lantern, "tomorrow:" and the quick rounds are unaffected by what has loaded.

## 3. Build

```sh
node packages/content/scripts/validate-scripts.mjs      # every error must be fixed first
node packages/content/scripts/build-lessons.mjs         # → apps/app/public/lessons/
```

Expo copies `public/` into the web export, so the files ship as static assets. **The built files are committed** under `apps/app/public/lessons/`, so a plain `npx expo export --platform web` (and the Netlify build) ships them with no extra step. After adding or editing a script, rebuild and commit the output: `npm run lessons` in `apps/app` (or the command above). `npm run export:web` in `apps/app` rebuilds them first.

## 4. The wiring change (made; items 6 and 7 not yet)

All in `apps/app/src/app/session/[door]/[day].tsx` and `apps/app/src/session/learn.ts`:

1. **Resolve the script before the lesson starts**, in `SessionScreen`, so the step ids never change under the resume logic:

   ```tsx
   import { lessonScript } from "@ih/content/lesson-script";
   import { lessonStore, LESSONS_BASE } from "@/lib/lessons"; // new, below

   const [script, setScript] = useState<any | null | undefined>(undefined); // undefined = still looking
   useEffect(() => {
     let live = true;
     lessonScript(door, day, { base: LESSONS_BASE, store: lessonStore }).then((s) => live && setScript(s));
     const t = setTimeout(() => live && setScript((s) => (s === undefined ? null : s)), 1500); // never hold a lesson > 1.5 s
     return () => { live = false; clearTimeout(t); };
   }, [door, day]);
   if (script === undefined) return <LessonLoading />;   // the bell screen's gradient + mascot, no text
   return <Session … script={script} />;
   ```

2. **Pass it to planDay** inside `Session` (both the plain and the "go deeper" call) and add it to the memo's dependencies:
   `planDay({ wing: door, day, mode, level, script })`.

3. **Keep resume honest**: add `${script ? ":S" : ""}` to `resumeKey`, so a lesson resumed after the script arrived (or went away) doesn't restore a queue built from the other plan.

4. **Just-learn mode**: in `learn.ts`, `learnSteps(steps, told?: string)` uses `told` in place of `howItsDoneLine(voice)` when given; the screen calls `learnSteps(p.steps, p.info?.howItsDone)`.

5. **A small `apps/app/src/lib/lessons.ts`**:

   ```ts
   import { Platform } from "react-native";
   import Constants from "expo-constants";
   import { readJSON, writeJSON, remove } from "@/lib/storage";
   // web: same origin; native: the deployed site (from app config, not hard-coded)
   export const LESSONS_BASE = Platform.OS === "web" ? "/lessons" : `${Constants.expoConfig?.extra?.siteUrl ?? "https://golden-house-beta.netlify.app"}/lessons`;
   // keep at most the last 3 weeks per door (localStorage is ~5 MB on the web)
   export const lessonStore = {
     get: (k: string) => readJSON<any>(k, null),
     set: (k: string, v: unknown) => {
       const [, , door, week] = k.split(":");
       const keep = new Set([week, String(+week - 1).padStart(3, "0"), String(+week + 1).padStart(3, "0")]);
       for (let i = 0; i < (globalThis.localStorage?.length ?? 0); i++) {
         const key = globalThis.localStorage!.key(i)!;
         const m = key.match(/^ih:lessons:([A-Z]+):(\d{3})$/);
         if (m && m[1] === door && !keep.has(m[2])) remove(key);
       }
       writeJSON(k, v);
     },
   };
   ```

6. **Prefetch** (optional, one line on Today): `lessonScript(door, lessonFor(door))` when Today mounts, so the lesson opens instantly.

7. **Show the draft label** from `plan.info.review === "pending"` wherever the outline lessons already say "draft · waiting on a Keeper's review".

Checks after wiring: the existing session e2e runs with and without `public/lessons/` present; a script day and an outline day both reach the tally; offline (DevTools → offline) a kept week still opens its script and an unkept day falls back to the outline lesson; `?v=` hashes change only for edited weeks.

## 5. Sizes (measured in the pilot)

See the pilot report numbers in the final section of this file, filled in from `validate-scripts.mjs` and `build-lessons.mjs --check`.
