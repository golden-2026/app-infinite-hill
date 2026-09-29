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
