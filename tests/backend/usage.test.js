import assert from "node:assert/strict";
import { test } from "node:test";
import companion from "../../api/companion.js";
import { recordOutcome, snapshot, takeTurn, useStore } from "../../api/_usage.js";
import { watch } from "../../api/ai-watch.js";

const req = (ip) => ({ headers: { "x-nf-client-connection-ip": ip } });
const at = new Date("2026-09-29T15:00:00Z");

function withEnv(vars, fn) {
  const old = Object.fromEntries(Object.keys(vars).map((k) => [k, process.env[k]]));
  Object.assign(process.env, vars);
  return Promise.resolve(fn()).finally(() => {
    for (const [k, v] of Object.entries(old)) if (v === undefined) delete process.env[k]; else process.env[k] = v;
  });
}

test("each person gets their own daily limit, and it resets the next day", () => withEnv({ AI_DAILY_PER_PERSON: "3", AI_DAILY_SITE: "100" }, async () => {
  useStore(null);
  for (let i = 0; i < 3; i++) assert.equal((await takeTurn(req("1.1.1.1"), "secret", at)).ok, true);
  assert.deepEqual(await takeTurn(req("1.1.1.1"), "secret", at), { ok: false, who: "person" });
  assert.equal((await takeTurn(req("2.2.2.2"), "secret", at)).ok, true, "someone else is unaffected");
  assert.equal((await takeTurn(req("1.1.1.1"), "secret", new Date("2026-09-30T01:00:00Z"))).ok, true, "tomorrow is a fresh day");
  const s = await snapshot(at);
  assert.equal(s.used, 4);
  assert.equal(s.refusedPerson, 1);
}));

test("the whole site stops at its daily limit", () => withEnv({ AI_DAILY_PER_PERSON: "50", AI_DAILY_SITE: "2" }, async () => {
  useStore(null);
  assert.equal((await takeTurn(req("1.1.1.1"), "s", at)).ok, true);
  assert.equal((await takeTurn(req("2.2.2.2"), "s", at)).ok, true);
  assert.deepEqual(await takeTurn(req("3.3.3.3"), "s", at), { ok: false, who: "site" });
}));

test("nothing stored can be read back as an address or a question", async () => {
  const saved = new Map();
  useStore({ async get(k) { return saved.get(k) ?? null; }, async set(k, v) { saved.set(k, v); } });
  await takeTurn(req("203.0.113.9"), "server-secret", at);
  const dump = JSON.stringify([...saved]);
  assert.doesNotMatch(dump, /203\.0\.113\.9|server-secret/);
  for (const v of saved.values()) for (const x of Object.values(v)) assert.equal(typeof x, "number");
});

test("if storage breaks, the AI stays on", async () => {
  useStore({ async get() { throw new Error("down"); }, async set() { throw new Error("down"); } });
  assert.deepEqual(await takeTurn(req("1.1.1.1"), "s", at), { ok: true });
  await recordOutcome(false, at); // doesn't throw
  useStore(null);
});

test("over the limit, the companion answers 429 without calling the AI", () => withEnv({ AI_DAILY_PER_PERSON: "1", ANTHROPIC_API_KEY: "test-key" }, async () => {
  useStore(null);
  const realFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return new Response(JSON.stringify({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify({ text: "hello", remember: [] }) }] }), { status: 200 });
  };
  try {
    const body = JSON.stringify({ profile: { door: "HINDUISM" }, memory: [], context: { door: "HINDUISM", day: 2, hour: 9 }, messages: [{ role: "user", content: "hi" }] });
    const send = async () => {
      const res = { headers: {}, setHeader(n, v) { this.headers[n] = v; }, end(b) { this.body = b; } };
      await companion({ method: "POST", url: "/api/companion?kind=chat", headers: { "content-type": "application/json", "x-nf-client-connection-ip": "9.9.9.9" }, body }, res);
      return { status: res.statusCode, body: JSON.parse(res.body) };
    };
    assert.equal((await send()).status, 200);
    const second = await send();
    assert.equal(second.status, 429);
    assert.equal(second.body.limit, "person");
    assert.equal(calls, 1);
    assert.equal((await snapshot()).lastHours.ok, 1);
  } finally {
    globalThis.fetch = realFetch;
  }
}));

function fakeNet({ site = 401, models = 200 } = {}) {
  const alerts = [];
  const fetchImpl = async (url, init = {}) => {
    if (url === "https://ntfy.sh/ih-test") { alerts.push({ title: init.headers.Title, body: init.body }); return new Response("", { status: 200 }); }
    if (url.startsWith("https://api.anthropic.com/")) return typeof models === "number" ? new Response("{}", { status: models }) : Promise.reject(new Error("offline"));
    return typeof site === "number" ? new Response("", { status: site }) : Promise.reject(new Error("offline"));
  };
  return { alerts, fetchImpl };
}
const env = (over = {}) => ({ URL: "https://infinite-hill.netlify.app", ANTHROPIC_API_KEY: "k", ALERT_URL: "https://ntfy.sh/ih-test", ...over });

test("the watcher alerts once when something breaks, stays quiet while it stays broken, and says when it's back", async () => {
  useStore(null);
  let net = fakeNet();
  assert.deepEqual((await watch({ env: env(), fetchImpl: net.fetchImpl, now: at })).sent, [], "all fine, and a 401 from the team login still counts as up");

  net = fakeNet({ models: 401 });
  const down = await watch({ env: env(), fetchImpl: net.fetchImpl, now: at });
  assert.deepEqual(down.sent, ["down"]);
  assert.match(net.alerts[0].body, /rejecting the AI key/);

  net = fakeNet({ models: 401 });
  assert.deepEqual((await watch({ env: env(), fetchImpl: net.fetchImpl, now: at })).sent, [], "no repeat alert");

  net = fakeNet();
  assert.deepEqual((await watch({ env: env(), fetchImpl: net.fetchImpl, now: at })).sent, ["up"]);
  assert.match(net.alerts[0].title, /back to normal/);
});

test("the watcher notices a site that's down, a missing key, and failing answers", async () => {
  useStore(null);
  const net = fakeNet({ site: "offline" });
  const r = await watch({ env: env({ ANTHROPIC_API_KEY: "" }), fetchImpl: net.fetchImpl, now: at });
  assert.equal(r.reasons.length, 2);
  assert.match(r.reasons.join(" "), /site isn't answering/);
  assert.match(r.reasons.join(" "), /key is missing/);

  useStore(null);
  for (let i = 0; i < 6; i++) await recordOutcome(false, at);
  const f = await watch({ env: env(), fetchImpl: fakeNet().fetchImpl, now: at });
  assert.match(f.reasons.join(" "), /most AI answers are failing/);
});

test("the watcher warns once a day when the site-wide limit is reached", () => withEnv({ AI_DAILY_SITE: "1" }, async () => {
  useStore(null);
  await takeTurn(req("1.1.1.1"), "s", at);
  const net = fakeNet();
  assert.deepEqual((await watch({ env: env(), fetchImpl: net.fetchImpl, now: at })).sent, ["limit"]);
  assert.deepEqual((await watch({ env: env(), fetchImpl: net.fetchImpl, now: at })).sent, []);
}));

test("without ALERT_URL the watcher still checks, it just can't send", async () => {
  useStore(null);
  const r = await watch({ env: env({ ALERT_URL: "" }), fetchImpl: fakeNet({ models: 500 }).fetchImpl, now: at });
  assert.equal(r.down, true);
  assert.deepEqual(r.sent, []);
});
