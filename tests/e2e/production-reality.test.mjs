import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import guide from "../../api/guide.js";
import { createCommerceHandler } from "../../api/commerce.js";

const root = new URL("../../", import.meta.url);
const [app, navigator, table, guideScreens, commerceScreens, navSource, matrix] = await Promise.all([
  readFile(new URL("src/Golden.jsx", root), "utf8"),
  readFile(new URL("src/screens/ExperienceNavigator.jsx", root), "utf8"),
  readFile(new URL("src/screens/TableScreens.jsx", root), "utf8"),
  readFile(new URL("src/screens/GuideScreens.jsx", root), "utf8"),
  readFile(new URL("src/screens/CommerceScreens.jsx", root), "utf8"),
  readFile(new URL("src/features/navigation.js", root), "utf8"),
  readFile(new URL("docs/PRODUCTION_ACCEPTANCE_MATRIX.md", root), "utf8"),
]);

function response() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(body) { this.body = body; },
  };
}

async function call(handler, request) {
  const res = response();
  await handler(request, res);
  return { status: res.statusCode, headers: res.headers, body: JSON.parse(res.body || "{}") };
}

test("acceptance matrix distinguishes shell, local, backend, provider, and delivery evidence", () => {
  for (const state of ["Rendered shell", "Local preview", "Persisted locally", "Backend connected", "Provider accepted", "Provider delivered / verified"]) {
    assert.ok(matrix.includes(state), `matrix should define ${state}`);
  }
  assert.match(matrix, /A source-level test is a guard against regressions; it is not proof/);
});

test("an empty Table journey cannot render named sample people as customer members", () => {
  // This checks the default production journey wiring as well as the screen's empty state.
  // Sample fixtures are acceptable in isolated tests, but must not enter a customer route.
  assert.doesNotMatch(navigator, /const sampleTable|name:\s*"(?:Mom|Ria|Sample [^"]+)"/i, "named sample people must not be wired into a customer-visible Table");
  assert.match(navigator, /table:\s*tableState, members, member:\s*selectedMember/, "customer journey screens must receive a real Table or an empty state");
  assert.match(table, /const members = table\?\.members \|\| \[\]/, "missing Table data should render as an empty member list");
  assert.match(table, /No one has joined|No members|invite someone/i, "empty Table state should offer a truthful next step");
});

test("primary navigation stays outside every immersive route", () => {
  assert.match(app, /if \(experienceScreen\) return <ExperienceNavigator/);
  assert.match(app, /!firstRun && !experienceScreen && !placing && !session && !review && !post && \["together", "today", "guide"\]\.includes\(tab\) && <nav/);
  assert.match(navigator, /aria-label="Back to all screens"/, "the journey graph retains an explicit exit control");
});

test("customer account entry uses real Supabase auth and preserves the originating journey", () => {
  assert.match(app, /I already have an account/);
  assert.match(app, /onAccount=\{\(\) => \{ setOnboardingAccountOpen\(true\)/);
  assert.match(navigator, /import AccountScreen from "\.\.\/components\/AccountScreen\.jsx"/);
  assert.match(navigator, /!catalogJourney\.current && \["account-sign-in", "account-sign-up", "account-password-reset"\]\.includes\(id\)/);
  assert.match(navigator, /origin === "gift-claim-sign-in-handoff"[^\n]+gift-attach-to-account/);
  assert.match(navigator, /catalogJourney\.current && <Button[^\n]+aria-label="Back to all screens"/);
});

test("checkout return stays unverified and cannot claim payment or entitlement", () => {
  const checkoutReturn = commerceScreens.slice(commerceScreens.indexOf("export function CheckoutSuccessScreen"), commerceScreens.indexOf("export function CheckoutCancelledScreen"));
  assert.match(navSource, /verified:\s*false/);
  assert.match(checkoutReturn, /checking the checkout session/i);
  assert.match(checkoutReturn, /No purchase or entitlement is confirmed/i);
  assert.match(checkoutReturn, /result\.verified === true/);
  assert.doesNotMatch(checkoutReturn, /payment (?:was )?(?:successful|succeeded)|purchase confirmed/i);
});

test("Guide never labels uncited provider or lesson fallback text as a verified citation", () => {
  const answerMarkup = app.slice(app.indexOf("{log.map(([who, t, origin], i)"), app.indexOf("{busy &&", app.indexOf("{log.map(([who, t, origin], i)")));
  assert.doesNotMatch(answerMarkup, /who === "g" && i > 0[^}]*from this door's sources/i, "all answer prose must not receive a source label by default");
  assert.match(answerMarkup, /origin === "lesson"|origin === "offline"/, "answer labels must reflect answer-specific provenance");
  assert.match(answerMarkup, /open sources to verify/, "provider text must invite source verification instead of claiming a citation");
  assert.match(guideScreens, /A source title alone is not a citation/);
  assert.match(guideScreens, /does not invent scripture|does not confirm translation/);
});

test("unconfigured providers report unavailable and make no provider request", async () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;
  const originalFetch = globalThis.fetch;
  delete process.env.ANTHROPIC_API_KEY;
  let guideCalls = 0;
  globalThis.fetch = async () => { guideCalls += 1; throw new Error("provider must not be called"); };
  try {
    const guideResponse = await call(guide, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        system: "You are the Guide. The user is walking the Hinduism door. Follow this tradition's own supplied texts.",
        messages: [{ role: "user", content: "What does namaste mean?" }],
      }),
    });
    assert.equal(guideResponse.status, 503);
    assert.deepEqual(guideResponse.body, { error: "Guide is not configured" });
    assert.equal(guideCalls, 0);

    let stripeCalls = 0;
    const commerce = createCommerceHandler({
      env: { SUPABASE_URL: "https://supabase.example", SUPABASE_ANON_KEY: "public-test-key" },
      fetchImpl: async (url) => {
        if (String(url).includes("/auth/v1/user")) {
          return { ok: true, json: async () => ({ id: "123e4567-e89b-42d3-a456-426614174000" }) };
        }
        stripeCalls += 1;
        throw new Error("Stripe must not be called without provider configuration");
      },
    });
    const status = await call(commerce, { method: "GET" });
    assert.equal(status.body.state, "provider_not_configured");
    assert.equal(status.body.configured, false);
    const checkout = await call(commerce, {
      method: "POST",
      headers: { authorization: `Bearer ${"a".repeat(24)}` },
      body: { action: "checkout", planId: "plus" },
    });
    assert.equal(checkout.status, 503);
    assert.equal(checkout.body.errorCode, "provider_not_configured");
    assert.equal(stripeCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalKey;
  }
});
