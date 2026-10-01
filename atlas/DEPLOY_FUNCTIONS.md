# Shipping the Guide and the companion with the live site

The live site is a folder of finished files (`atlas/expo-liveN`). On its own it has no server, so the Guide and the
companion always fall back to the lesson text. Two small servers ("functions") make them live:

- `/api/guide`: the older Guide (answers from this door's texts).
- `/api/companion`: the companion. `?kind=status` says whether the AI is on; `shape` picks today's practice,
  `reflect` writes the weekly reflection, `chat` is the conversation.

Both only work once the AI key is set in Netlify (step 4). Until then they answer "off" and the app says so plainly.

## Steps

1. **Make the export folder** as usual (for example `atlas/expo-live11`).
2. **Pack the functions into it:**

   ```sh
   node atlas/pack-functions.mjs atlas/expo-live11
   ```

   This copies the two functions and the files they need, adds a `[functions]` section to the folder's
   `netlify.toml`, and puts the `/api/guide` and `/api/companion` rules at the **top** of `_redirects`, before the
   app's catch-all `/*` (Netlify uses the first rule that matches, so the order matters). It also hides the copied
   source folders from the public site. At the end it loads each function and prints:

   ```
   companion status: 200 {"on":false}
   guide GET: 405 (...)
   ```

   Anything else means something is missing; don't deploy that folder. Running it twice is safe.
3. **Deploy with the Netlify command-line tool, not drag-and-drop.** Dragging a folder onto Netlify uploads files
   only and silently skips functions. From inside the folder:

   ```sh
   cd atlas/expo-live11
   npx netlify-cli deploy --prod --dir .
   ```

   (Link the folder to the live site the first time with `npx netlify-cli link`.) The deploy output should list
   `guide` and `companion` under "Functions".
4. **Turn the AI on (once, by the owner):** in Netlify, open the site, then
   **Site configuration → Environment variables → Add a variable**.
   - Key: `ANTHROPIC_API_KEY`
   - Value: a key from console.anthropic.com → API keys
   - Scopes: at least **Functions**; tick "Contains secret values".
   Then **redeploy** (step 3, or Deploys → Trigger deploy); functions only see a new key after a deploy.
   Never put this key in the export folder, in `netlify.toml`, or in any `EXPO_PUBLIC_*`/`VITE_*` setting.
5. **Check it:** open `https://<site>/api/companion?kind=status`. `{"on":true}` means the companion is live;
   `{"on":false}` means the key isn't reaching the function (check the scope and redeploy). If the page shows the
   app instead of that little answer, the functions didn't deploy (see step 3).

## Good to know

- **Cost.** The companion uses Claude Sonnet 5 ($2 per million tokens read, $10 per million written; a token is about three quarters of a word).
  Roughly: a chat reply costs about 1 cent, shaping a day about a third of a cent, a weekly reflection under half a
  cent. An active person (daily shaping, weekly reflection, about 30 chat messages a month) comes to about
  **$0.30 to $0.50 a month**; a heavy chatter maybe $1 to $2. Set a monthly spend limit in the Anthropic console.
  Netlify's free tier includes 125,000 function calls a month.
- **Time limit.** Netlify stops a function after 10 seconds. The companion gives up on the AI after 9 and the
  phone falls back to its on-device version, so nobody is left waiting.
- **Privacy.** The functions log nothing a person sends or receives. The companion is sent only the short facts the
  person can see and delete, fixed profile values, and today's lesson; journal text only when they choose to share it.
- **Turning it off.** Delete the `ANTHROPIC_API_KEY` variable and redeploy; the app goes back to the lesson text.

## AI limits and the outage watcher (added 29 Sep 2026)

- api/_usage.js: per-person daily AI limit (AI_DAILY_PER_PERSON, default 60) and site-wide limit (AI_DAILY_SITE, default 2000), counted in private Netlify Blobs store `ai-usage`. People are counted by a daily-rotating one-way hash; no addresses or text are stored. Over the limit the server answers 429 and the app falls back to lesson text.
- api/ai-watch.js + netlify/functions/ai-watch.js: scheduled every 10 minutes (production only). Checks the site, the AI key (free models call) and the last two hours of failures; alerts on change to ALERT_URL (ntfy.sh topic, Slack or Discord webhook).
- GET /api/companion?kind=health: today's counts and the watcher's last check (numbers only).
- pack-functions.mjs now bundles each function with rolldown (includes @netlify/blobs).

## Anonymous return counts, /api/pulse (added 1 Oct 2026)

- api/pulse.js + netlify/functions/pulse.js: the app's once-a-day "opened today" and "a lesson done" ticks, with no id
  at all (only the first-open date, days since, and the event). Counters only, in private Netlify Blobs store `pulse`.
  pack-functions.mjs bundles it and adds `/api/pulse` to `_redirects`; its check prints
  `pulse GET without a read key: 404 …, POST with a door: 400 …`.
- To read the counts, the owner sets `PULSE_READ_KEY` in Netlify (Site configuration → Environment variables; a long
  random value, at least 16 characters; scope Functions; "Contains secret values") and redeploys. Then, from a
  terminal with the same value in `PULSE_READ_KEY`: `node atlas/pulse-report.mjs https://<site>`. Without the variable,
  reading is off (404) and counting still works.
- What is sent and stored, exactly: docs/PRIVACY_ARCHITECTURE.md, "Anonymous return counts".

## Invite-only launch: waitlist and invites, /api/waitlist (added 1 Oct 2026, OFF by default)

- api/waitlist.js + netlify/functions/waitlist.js, private Netlify Blobs store `waitlist`. pack-functions.mjs bundles it
  and adds `/api/waitlist` to `_redirects`; its check prints `waitlist status: 200 {"inviteOnly":false}, admin without
  the key: 404`.
- **Nothing changes until the owner turns it on.** The app and the website ask `/api/waitlist?kind=status` and only
  switch to "request an invite" when it says `{"inviteOnly":true}`.
- **Turning it on** (Netlify → the site → Site configuration → Environment variables; scope Functions; then redeploy):
  - `WAITLIST_ADMIN_KEY`: a long random value (at least 16 characters), "Contains secret values". Set this first, any
    time: the admin desk works with the switch off, so codes for Keepers and voices can be made before launch.
  - `INVITE_ONLY` = `on`. This is the launch switch. Delete it (or set `off`) and redeploy to go back.
  - Optional: `WAITLIST_FOUNDING_CAP` (default 10000), `WAITLIST_BETA_CLAIMS` (how many people already in the private
    beta can claim their own 3 invites; default 500), `WAITLIST_SITE_URL` (the address used in share and invite
    links, e.g. `https://infinitehill.com`; default: the address the request came to), `WAITLIST_SALT` (secret).
- **The owner's desk** (the key is read from the terminal, never printed):
  `$env:WAITLIST_ADMIN_KEY = "<the key>"; node atlas/waitlist-admin.mjs https://<site> stats`, then
  `release 50 ISLAM --csv invites.csv` (the next 50 in the Islam line; omit the door for every door),
  `codes 5 20 keeper-name` (5 codes, 20 uses each), `grant m_<id> 10`, `remove someone@example.com`.
  **No email is sent**: there is no email provider; `release` prints the list for you to send. A person released can
  also see their code by reopening the waitlist on the device they joined from.
- Local: `$env:INVITE_ONLY = "on"; $env:WAITLIST_ADMIN_KEY = "<16+ chars>"; node atlas/friends-server.mjs <exportDir>`.
- What is stored, exactly: docs/PRIVACY_ARCHITECTURE.md, "Waitlist and invite-only launch".
