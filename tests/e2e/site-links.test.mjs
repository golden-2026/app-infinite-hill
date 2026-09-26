import assert from "node:assert/strict";
import test from "node:test";

const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:5173").replace(/\/$/, "");
const DOORS = ["CHRISTIANITY", "CATHOLIC", "JUDAISM", "ISLAM", "HINDUISM", "BUDDHISM", "SIKHISM", "SPIRITUAL"];
const VIEWS = ["today", "plans", "gift"];

async function get(path) {
  const response = await fetch(new URL(path, `${BASE_URL}/`));
  return { response, text: await response.text() };
}

test("public app calls have real same-origin app destinations and retain the iframe bridge", async () => {
  const { response, text } = await get("/site.html");
  assert.equal(response.status, 200, "the supplied website should load");

  const appLinks = [...text.matchAll(/<a\b[^>]*href="([^\"]+)"[^>]*onclick="([^\"]*goldenOpen[^\"]*)"[^>]*>/gi)];
  assert.ok(appLinks.length >= 7, "all visible Start, plan, gift, and join CTAs should use the app bridge");
  for (const [, href, onclick] of appLinks) {
    const destination = new URL(href, `${BASE_URL}/`);
    assert.equal(destination.origin, new URL(BASE_URL).origin, `${href} should stay on the current site`);
    assert.equal(destination.pathname, "/", `${href} should open the app shell`);
    assert.match(onclick, /return false/, "the embedded preview should enhance, not replace, its direct app link");
    assert.match(href, /^\/(?:\?view=(?:today|plans|gift))$/, `${href} should point to a supported app view`);
  }

  assert.ok(/frame\.src\s*=\s*new URL\('\/\?'\s*\+\s*params\.toString\(\),\s*window\.location\.href\)\.href/.test(text), "the preview iframe should use a same-origin app URL");
  assert.match(text, /params\.set\('door',\s*door\)/, "door selections should reach the embedded app");
  assert.match(text, /params\.set\('view',\s*view\)/, "view selections should reach the embedded app");
  assert.doesNotMatch(text, /href="javascript:void\(0\)"/, "app calls should not use dead javascript links");
});

test("every advertised door and app view resolves to the current app shell", async () => {
  const routes = [...DOORS.map((door) => `/?door=${door}`), ...VIEWS.map((view) => `/?view=${view}`)];
  const results = await Promise.all(routes.map(get));
  for (const [index, { response, text }] of results.entries()) {
    assert.equal(response.status, 200, `${routes[index]} should resolve to the app`);
    assert.match(text, /src\/main\.jsx|assets\//, `${routes[index]} should serve the app entrypoint`);
  }

  const { text: site } = await get("/site.html");
  assert.ok(/const DOORSW\s*=\s*\[\["Christianity","CHRISTIANITY"/.test(site), "the supplied eight-door list should be rendered");
  assert.ok(/goldenOpen\('\$\{w\}'\)/.test(site), "each rendered door card should open its own door");
  for (const door of DOORS) assert.ok(site.includes(`"${door}"`), `the ${door} app door ID should be present`);
});

test("unconnected email signup does not store an address or claim success", async () => {
  const { text } = await get("/site.html");
  assert.ok(/The email list is not connected yet\. Your email is not collected, saved, or sent\./.test(text));
  assert.doesNotMatch(text, /golden:beta-interest|Saved on this device|Join the list/, "the inactive list flow should not save or report success");
  assert.doesNotMatch(text, /<form[^>]*onsubmit/i, "an unavailable signup service should not present a working form");
});

test("footer information links remain keyboard-accessible semantic links", async () => {
  const { text } = await get("/site.html");
  assert.match(text, /<li><a href="#about" data-page="about">About<\/a><\/li>/);
  assert.match(text, /<a href="#privacy" data-page="privacy">Privacy<\/a>/);
  assert.match(text, /<a href="#terms" data-page="terms">Terms<\/a>/);
  assert.match(text, /footer ul a,footer \.legal a\{color:inherit;text-decoration:none\}/, "semantic link styling should preserve the supplied footer look");
});
