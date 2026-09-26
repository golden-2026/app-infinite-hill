import assert from "node:assert/strict";
import test from "node:test";

const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:5173").replace(/\/$/, "");
const requests = new Map();

function expectPattern(text, pattern, message) {
  assert.ok(pattern.test(text), message);
}

async function get(path) {
  const url = new URL(path, `${BASE_URL}/`).toString();
  if (!requests.has(url)) {
    requests.set(url, fetch(url, { redirect: "follow" }));
  }
  const response = await requests.get(url);
  return { response, text: await response.clone().text(), url };
}

async function shippedClientText() {
  const { response, text: html } = await get("/");
  assert.equal(response.status, 200, `app shell should load from ${BASE_URL}`);
  const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+\.js(?:\?[^"']*)?)["']/gi)].map((m) => m[1]);
  const candidates = [
    ...scripts,
    "/src/main.jsx",
    "/src/Golden.jsx",
    "/src/components/AccountScreen.jsx",
    "/src/content/catalog.js",
    "/src/platform/index.js",
  ];
  const bodies = await Promise.all(candidates.map(async (path) => {
    try {
      const { response: scriptResponse, text } = await get(path);
      return scriptResponse.ok ? text : "";
    } catch {
      return "";
    }
  }));
  return `${html}\n${bodies.join("\n")}`;
}

test("marketing Start Free bridge reaches the app with optional door and view context", async () => {
  const { response, text } = await get("/site.html");
  assert.equal(response.status, 200, "marketing page should be directly loadable");
  expectPattern(text, /Start free/i, "marketing page should include a Start free CTA");
  expectPattern(text, /goldenOpen\s*=\s*function/, "CTA bridge should define goldenOpen");
  assert.equal(
    [...text.matchAll(/window\.goldenOpen\s*=/g)].length,
    1,
    "marketing page should load one canonical app bridge instead of an embedded stale app copy",
  );
  expectPattern(text, /(?:embed=1|URLSearchParams\(\{\s*embed:\s*['"]1['"]\s*\}\))/, "CTA bridge should open the embedded app");
  expectPattern(text, /params\.set\(['"]door['"],\s*door\)/, "door-specific CTAs should preserve their selection");
});

test("app shell and direct onboarding query are served", async () => {
  const [{ response, text }, direct] = await Promise.all([get("/"), get("/?door=HINDUISM")]);
  assert.equal(response.status, 200);
  expectPattern(text, /manifest\.webmanifest/, "app shell should advertise its PWA manifest");
  expectPattern(text, /html, body, #root\s*\{[^}]*height:\s*100%/i, "embedded app root should resolve full-height layout");
  assert.equal(direct.response.status, 200, "door deep link should resolve to the app shell");
  expectPattern(direct.text, /src\/main\.jsx|assets\//, "door deep link should include the app entrypoint");
});

test("shipped client contains the supported Hinduism lesson and an honest coming state", async () => {
  const client = await shippedClientText();
  expectPattern(client, /namaste/i, "Hinduism day one should be present in the shipped app");
  expectPattern(client, /the oldest hello/i, "Hinduism day one should have its authored session title");
  expectPattern(client, /reviewed manuscript has not been supplied yet/i, "unsupported doors should show the review gate");
  expectPattern(client, /will not manufacture the missing lesson/i, "unsupported doors should not invent lessons");
});

test("daily credit is guarded once per local date and door progress is keyed separately", async () => {
  const client = await shippedClientText();
  expectPattern(client, /lastCompletedDateRef/, "completion should keep a last credited date");
  expectPattern(client, /localDateKey/, "completion should use the local calendar date");
  expectPattern(client, /finishDay/, "lesson completion callback should exist");
  expectPattern(client, /paths\[wing\]|paths\[w\]/, "lesson progress should be keyed by door");
  expectPattern(client, /visitWing|Two doors, never one soup/, "two-door state should be present");
});

test("Guide presents its offline answer from lesson text", async () => {
  const client = await shippedClientText();
  expectPattern(client, /no signal/i, "Guide should disclose no signal");
  expectPattern(client, /that's the lesson talking, not me/i, "lesson fallback should be labeled as offline");
  expectPattern(client, /I'm offline right now/i, "word fallback should state that the Guide is offline");
});

test("plan and gift previews avoid claiming payment or delivery", async () => {
  const client = await shippedClientText();
  expectPattern(client, /Payments are not connected/i, "paid plan preview should not imply connected payments");
  expectPattern(client, /checkout and delivery pending/i, "gift preview should say checkout and delivery are pending");
  expectPattern(client, /Nothing was charged or delivered/i, "saving a gift draft should not claim purchase or delivery");
  expectPattern(client, /planned ·/i, "paid plan should be visibly marked as planned");
});

test("account view exposes an encrypted backup control", async () => {
  const client = await shippedClientText();
  expectPattern(client, /encrypted.{0,24}backup|backup.{0,24}encrypted/i, "account UI should identify encrypted backup");
  expectPattern(client, /export recovery file/i, "account UI should offer a recovery-file export");
  expectPattern(client, /import recovery file/i, "account UI should offer a recovery-file import");
});

test("state API validates the account identifier without claiming a sync", async () => {
  const { response, text } = await get("/api/state?userId=not-a-valid-account");
  assert.equal(response.status, 400, "invalid account IDs should be rejected by the state API");
  expectPattern(text, /invalid_user_id/, "invalid state request should return an explicit pending error");
});

test("PWA manifest, service worker, and static routes are available", async () => {
  const [manifest, worker, icon, site] = await Promise.all([
    get("/manifest.webmanifest"), get("/sw.js"), get("/icon-sun.png"), get("/site.html"),
  ]);
  assert.equal(manifest.response.status, 200);
  expectPattern(manifest.text, /"display"\s*:\s*"standalone"/, "manifest should use standalone display mode");
  assert.equal(worker.response.status, 200);
  expectPattern(worker.text, /addAll\(APP_SHELL\)/, "service worker should pre-cache the app shell");
  assert.equal(icon.response.status, 200);
  assert.ok(site.response.status === 200, "marketing route should load directly like an installed app route");
});

test("mobile shell sizing is bounded to the viewport", async () => {
  const client = await shippedClientText();
  expectPattern(client, /min\(390px,\s*100vw\s*-\s*16px\)/, "phone shell should be capped by viewport width");
  expectPattern(client, /100dvh/, "phone shell should follow the dynamic mobile viewport");
  expectPattern(client, /overflow:\s*["']hidden["']/, "app frame should contain its content");
  expectPattern(client, /overflowY:\s*["']auto["']/, "long screens should scroll vertically");
});
