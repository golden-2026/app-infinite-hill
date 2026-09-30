# infinite hill platform contract (`window.IH`)
<!--
What: the API the one-file UI calls for saved progress, real days, honest labels and flags.
Scope: design/infinitehill_vNNN.jsx (Claude Project output) + src/platform/ih.js (this repo).
Owner: Kayan (product) · Claude (implementation). Created 2026-09-25 (P0). Contract version 1.
Rule: the UI never counts days itself. It asks IH. Without window.IH it must still run (claude.ai preview).
Source of truth for day rules: src/platform/day-engine.js + tests/features/day-engine.test.js.
-->

## 1. Why this exists

The UI ships as one file from the Claude Project. The app needs saved progress, calendar days and honest labels. The UI calls `window.IH` for those. This repo supplies `window.IH`.

Until the builder adopts the contract, `scripts/apply-platform-patch.mjs` adds the calls to the published file. The patch runs before every `npm run dev` and `npm run build`. It writes `src/InfiniteHill.jsx`. Do not edit that file by hand.

## 2. Rules for the builder (v176 and later)

1. Guard every call: `const IH = typeof window !== "undefined" ? window.IH || null : null;`.
2. Without `IH`, keep the current demo behaviour. The claude.ai preview has no `IH`.
3. Read saved state once on mount: `const saved = IH ? IH.load() : null;`.
4. Start the day count at `saved.showedUp || 0`. Never start at 1.
5. When a sit finishes, call `IH.completeSit(...)`. Use the returned `showedUp` and `state.paths`.
6. Do not advance days in the UI. `IH.load()` moves finished doors to the next lesson on a new local date.
7. Show "Demo: skip to tomorrow" and demo speed only when `IH.demo` is true.
8. Get every voice name from `IH.voiceLabel(door, name)`. Do not write "licensed voice" in copy.
9. Do not show made-up counts, members, RSVPs or events. Gate them behind `IH.flag(...)`.
10. Save the UI fields with `IH.save({...})` when they change.

## 3. API

| Call | Returns | Notes |
|---|---|---|
| `IH.version` | `1` | Contract version. |
| `IH.demo` | boolean | True with `?demo=1` or flag `demo`. |
| `IH.today()` | `{ date: "YYYY-MM-DD", tz, hour }` | The only source of "now". Local calendar date. |
| `IH.load()` | state or `null` | `null` on a fresh device. Rolls finished doors to the next lesson on a new date. |
| `IH.save(ui)` | — | Saves UI fields: `onboarded, homeWing, visitWing, active, paths, kids, book, signals, moment, offset, plan, chime, voiceOn`. Cannot change `showedUp` or `dates`. |
| `IH.completeSit({ door, kidIndex })` | `{ state, isNewDay, showedUp, milestone }` | First sit on a new local date adds 1. More sits that date add 0. A child's sit moves only the child's hill. |
| `IH.setGoal(days)` | — | `3`, `7`, `21`, `100` or `"not_yet"`. A sit already done today counts. |
| `IH.goalProgress()` | `{ days, done, reached }` or `null` | |
| `IH.goldenWeeks()` | number | Runs of 7 consecutive dates. Never taken away. |
| `IH.currentRun()` | number | Consecutive dates up to the last sit. Display only. Never used to reset. |
| `IH.welcomeBack()` | boolean | True on the first open after 2 or more missed dates. |
| `IH.markWelcomedBack()` | — | Call after the welcome-back screen shows. |
| `IH.voiceLabel(door, name)` | `{ licensed, short, claim }` | `short` is "the house voice" until a signed licence is on file. |
| `IH.flag(name)` | boolean | From `?flags=a,b` or localStorage `ih:flags` (JSON array). |
| `IH.reminders.status()` | `"in-app-only"` | P1 adds web push. |
| `IH.track(event, props)` | — | No-op until P2 opt-in analytics. |
| `IH.exportData()` / `IH.reset()` | JSON string / — | The user owns their data. |

## 4. Day laws (enforced in the engine, not the UI)

- Missed days never reset the day count (days on the hill). The streak is separate: it grows one lesson a day, and rest days protect it (packages/domain/src/streak.js).
- Rest days: a new streak starts with 2, holds at most 2, earns one back every 7 days; a missed day spends one automatically. With none left, a missed day breaks the streak; 2 lessons in one day within 3 days earns it back.
- One day per local date, from the first finished sit.
- Travel across time zones never counts a date twice.
- Grace is free forever. Rest days and the earn-back are never sold.

## 5. Flags in use

| Flag | Effect |
|---|---|
| `demo` | Demo speed and "skip to tomorrow". Same as `?demo=1`. |
| `guide-live` | The Guide calls `/api/guide`. Off by default (BUILD_BRIEF: Guide off until retrieval). |
| `accounts` | Shows the Apple / Google / email save buttons. Off until accounts are live. |
| `live-read` | Shows the "next live read" card. Off until a read is booked. |
| `events` | Shows "golden hour nights". Off until real events are listed. |

## 6. Storage

- Key `ih:v1` in localStorage. If storage is blocked, the app runs from memory for the session.
- Shape: `{ v, showedUp, dates[], sitsByDate{}, paths{ [door]: { day, done, lastDate } }, kids[], goal, welcomedBackOn, ui{} }`.
- `showedUp` always equals the number of distinct `dates`. `normalizeState` repairs it on load.

## 7. Error reports

`src/main.jsx` sends `error` and `unhandledrejection` to `POST /api/log`. The body holds kind, a clipped message, file, line and build only. It never holds user text, door or lesson content.

## 8. Change process

1. Put the new build in `design/` as-is.
2. Point `SOURCE` in `scripts/apply-platform-patch.mjs` at it.
3. Run `npm run patch:app`. A moved anchor fails with the edit name.
4. Fix each failing anchor, or delete the edit if the build now calls `IH` itself.
5. Run `npm run test:unit` and the browser checks in section 9.

## 9. Browser checks (mobile viewport)

1. Fresh device: onboarding, first sit, count shows 1.
2. Reload: count 1, no splash, today done.
3. Move stored dates back one day, reload: next lesson, count 1, not done.
4. Sit again: count 2, goal progress 2.
5. No "Demo: skip" without `?demo=1`. The session header says "the house voice reads".
6. Together shows no numbers, members, live read or events.
