// Put the Guide and companion servers (Netlify Functions) into a static export folder, so they deploy with it.
// Usage: node atlas/pack-functions.mjs atlas/expo-liveN
// What it does (safe to run more than once):
//   1. bundles the Guide, companion, outage-watcher, friends, pulse (anonymous return counts), circles and waitlist (the invite-only launch switch) functions into
//      self-contained files;
//   2. adds a [functions] section to the folder's netlify.toml;
//   3. puts /api/guide and /api/companion at the top of _redirects (before the app's catch-all), and hides the copied
//      source folders from the public site;
//   4. loads each copied function and checks it answers (companion status says "off" here because no key is set).
// It never reads, sets or prints ANTHROPIC_API_KEY. See atlas/DEPLOY_FUNCTIONS.md.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = process.argv[2];
if (!arg) {
  console.error("usage: node atlas/pack-functions.mjs <exportDir>");
  process.exit(1);
}
const out = resolve(arg);
if (!existsSync(join(out, "index.html"))) {
  console.error(`${out} doesn't look like an export folder (no index.html).`);
  process.exit(1);
}

// Each function is bundled into one self-contained file (its imports, the lesson data and @netlify/blobs included),
// because the export folder has no node_modules for Netlify to resolve packages from.
const { rolldown } = await import(pathToFileURL(join(repo, "node_modules/rolldown/dist/index.mjs")).href);
const FUNCTIONS = ["guide", "companion", "ai-watch", "friends", "pulse", "circles", "waitlist"];
for (const name of FUNCTIONS) {
  const bundle = await rolldown({ input: join(repo, "netlify/functions", `${name}.js`), platform: "node", logLevel: "silent" });
  await bundle.write({ file: join(out, "netlify/functions", `${name}.js`), format: "esm", codeSplitting: false });
  await bundle.close();
}
// The bundles are ES modules; without the repo's package.json around them, say so next to them.
writeFileSync(join(out, "netlify", "package.json"), `${JSON.stringify({ private: true, type: "module" }, null, 2)}\n`);

// netlify.toml: keep what's there, add the functions section once.
const tomlPath = join(out, "netlify.toml");
let toml = existsSync(tomlPath) ? readFileSync(tomlPath, "utf8") : '[build]\n  command = ""\n  publish = "."\n';
if (!/^\[functions\]/m.test(toml)) {
  toml = `${toml.trimEnd()}\n\n# The Guide and companion servers (added by atlas/pack-functions.mjs). ANTHROPIC_API_KEY is set in Netlify, never here.\n[functions]\n  directory = "netlify/functions"\n  node_bundler = "esbuild"\n`;
}
writeFileSync(tomlPath, toml);

// _redirects: our block goes first, because Netlify uses the first rule that matches and "/*" would swallow /api/*.
const BEGIN = "# >>> functions (atlas/pack-functions.mjs)";
const END = "# <<< functions";
const block = [
  BEGIN,
  "/api/guide        /.netlify/functions/guide      200!",
  "/api/companion    /.netlify/functions/companion  200!",
  "/api/friends      /.netlify/functions/friends    200!",
  "/api/pulse        /.netlify/functions/pulse      200!",
  "/api/circles      /.netlify/functions/circles    200!",
  "/api/waitlist     /.netlify/functions/waitlist   200!",
  "# the servers' source files are uploaded with the site; don't serve them as pages",
  "/api/*            /index.html                    404!",
  "/netlify/*        /index.html                    404!",
  "/packages/*       /index.html                    404!",
  END,
].join("\n");
const redirectsPath = join(out, "_redirects");
const current = existsSync(redirectsPath) ? readFileSync(redirectsPath, "utf8") : "/*    /index.html   200\n";
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const withoutOld = current.replace(new RegExp(`${esc(BEGIN)}[\\s\\S]*?${esc(END)}\\s*`), "");
writeFileSync(redirectsPath, `${block}\n\n${withoutOld.trimStart()}`);

// Check: each copied function loads from the export folder and answers.
delete process.env.ANTHROPIC_API_KEY; // only in this process, so the check is the same on every machine
const decode = (r) => JSON.parse(Buffer.from(r.body, "base64").toString("utf8"));
const { handler: companion } = await import(pathToFileURL(join(out, "netlify/functions/companion.js")).href);
const status = await companion({ httpMethod: "GET", rawUrl: "https://example.test/api/companion?kind=status", headers: {} });
const { handler: guide } = await import(pathToFileURL(join(out, "netlify/functions/guide.js")).href);
const guideGet = await guide({ httpMethod: "GET", rawUrl: "https://example.test/api/guide", headers: {} });
const { handler: friendsFn } = await import(pathToFileURL(join(out, "netlify/functions/friends.js")).href);
const friendsBad = await friendsFn({ httpMethod: "GET", rawUrl: "https://example.test/api/friends?kind=friends", headers: {} });
console.log(`friends GET without a token: ${friendsBad.statusCode} (401 = loaded and refusing, as it should)`);
const { handler: circlesFn } = await import(pathToFileURL(join(out, "netlify/functions/circles.js")).href);
const circlesBad = await circlesFn({ httpMethod: "GET", rawUrl: "https://example.test/api/circles?kind=mine", headers: {} });
console.log(`circles GET without a token: ${circlesBad.statusCode} (401 = loaded and refusing, as it should)`);
// waitlist: the launch switch is checked here as OFF (INVITE_ONLY unset in this process), so status says so
const inviteOnly = process.env.INVITE_ONLY; // only in this process, never printed
delete process.env.INVITE_ONLY;
const { handler: waitlistFn } = await import(pathToFileURL(join(out, "netlify/functions/waitlist.js")).href);
const waitlistStatus = await waitlistFn({ httpMethod: "GET", rawUrl: "https://example.test/api/waitlist?kind=status", headers: {} });
const waitlistAdmin = await waitlistFn({ httpMethod: "GET", rawUrl: "https://example.test/api/waitlist?kind=admin-stats", headers: {} });
if (inviteOnly !== undefined) process.env.INVITE_ONLY = inviteOnly;
console.log(`waitlist status: ${waitlistStatus.statusCode} ${JSON.stringify(decode(waitlistStatus))}, admin without the key: ${waitlistAdmin.statusCode} (404 = loaded and refusing)`);
const readKey = process.env.PULSE_READ_KEY; // only in this process, never printed
delete process.env.PULSE_READ_KEY;
const { handler: pulseFn } = await import(pathToFileURL(join(out, "netlify/functions/pulse.js")).href);
const pulseRead = await pulseFn({ httpMethod: "GET", rawUrl: "https://example.test/api/pulse", headers: {} });
const pulseBad = await pulseFn({ httpMethod: "POST", rawUrl: "https://example.test/api/pulse", headers: { "content-type": "application/json" }, body: JSON.stringify({ door: "ISLAM" }) });
if (readKey !== undefined) process.env.PULSE_READ_KEY = readKey;
console.log(`pulse GET without a read key: ${pulseRead.statusCode} (404 = loaded, reading off here), POST with a door: ${pulseBad.statusCode} (400 = refused, as it should)`);
const watcher = await import(pathToFileURL(join(out, "netlify/functions/ai-watch.js")).href);
console.log(`ai-watch: runs on "${watcher.config?.schedule}"`);
const ok = friendsBad.statusCode === 401 && circlesBad.statusCode === 401 && waitlistStatus.statusCode === 200 && decode(waitlistStatus).inviteOnly === false && waitlistAdmin.statusCode === 404 && pulseRead.statusCode === 404 && pulseBad.statusCode === 400 && status.statusCode === 200 && decode(status).on === false && guideGet.statusCode === 405 && typeof watcher.default === "function" && !!watcher.config?.schedule;
console.log(`companion status: ${status.statusCode} ${JSON.stringify(decode(status))}`);
console.log(`guide GET: ${guideGet.statusCode} (405 = loaded and refusing non-POST, as it should)`);
if (!ok) {
  console.error("the copied functions did not answer as expected");
  process.exit(1);
}
console.log(`packed functions into ${out}`);
