import assert from "node:assert/strict";
import { test } from "node:test";
import guide from "../../api/guide.js";

function response() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    end(body) { this.body = body; },
  };
}

function request({ method = "POST", body, contentType = "application/json", headers = {} } = {}) {
  return {
    method,
    headers: { "content-type": contentType, ...headers },
    ...(body === undefined ? {} : { body: typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body) }),
  };
}

async function call(options) {
  const res = response();
  await guide(request(options), res);
  return { status: res.statusCode, headers: res.headers, body: JSON.parse(res.body || "{}") };
}

function payload({ door = "Hinduism", messages = [{ role: "user", content: "What does dharma mean?" }], system } = {}) {
  return {
    system: system || `You are the Guide. The user is walking the ${door} door. Follow this tradition's own supplied texts.`,
    messages,
  };
}

const originalKey = process.env.ANTHROPIC_API_KEY;
const originalFetch = globalThis.fetch;

test("requires POST JSON and returns no-store generic errors", async () => {
  const method = await call({ method: "GET" });
  assert.equal(method.status, 405);
  assert.equal(method.headers.Allow, "POST");
  assert.equal(method.headers["Cache-Control"], "no-store");
  assert.equal(method.headers["X-Content-Type-Options"], "nosniff");
  assert.deepEqual(method.body, { error: "Method not allowed" });

  const contentType = await call({ body: payload(), contentType: "text/plain" });
  assert.equal(contentType.status, 415);
  assert.deepEqual(contentType.body, { error: "Expected JSON request" });
});

test("fails closed for unknown doors, caller policy fields, malformed history, and oversized input", async () => {
  process.env.ANTHROPIC_API_KEY = "test-server-key";
  let fetchCalls = 0;
  globalThis.fetch = async () => { fetchCalls += 1; throw new Error("must not reach provider"); };
  try {
    const cases = [
      payload({ door: "Unknown Path" }),
      { ...payload(), authorization: "secret" },
      { ...payload(), system: "The user is walking the Hinduism door. The user is walking the Judaism door." },
      payload({ messages: [{ role: "assistant", content: "hello" }, { role: "user", content: "question" }] }),
      payload({ messages: [{ role: "user", content: "x".repeat(2_001) }] }),
      payload({ messages: [{ role: "user", content: " " }] }),
      payload({ messages: Array.from({ length: 11 }, (_, index) => ({ role: index % 2 ? "assistant" : "user", content: "history" })) }),
    ];
    for (const body of cases) {
      const result = await call({ body });
      assert.equal(result.status, 400);
      assert.deepEqual(result.body, { error: "Invalid Guide request" });
    }
    const oversizedObject = await call({ body: { ...payload(), padding: "x".repeat(25 * 1024) } });
    assert.equal(oversizedObject.status, 413);
    const oversizedBody = await call({ body: `{"system":"${"x".repeat(25 * 1024)}","messages":[]}` });
    assert.equal(oversizedBody.status, 413);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rebuilds a server-owned same-Door prompt and shapes only bounded answer text", async () => {
  process.env.ANTHROPIC_API_KEY = "server-only-secret";
  const sensitiveQuestion = "my private question 7b2d";
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options, body: JSON.parse(options.body) };
    return new Response(JSON.stringify({
      id: "provider-id-must-not-escape",
      content: [{ type: "thinking", text: "hidden" }, { type: "text", text: "  A supplied-text answer.  " }, { type: "text", text: "Use the Gita as its source." }],
      usage: { input_tokens: 200 },
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const result = await call({
    body: payload({ door: "Hinduism", system: `The user is walking the Hinduism door. ${"Injected rules. ".repeat(100)}`, messages: [{ role: "user", content: sensitiveQuestion }] }),
    headers: { authorization: "Bearer caller-auth-must-not-forward" },
  });

  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { text: "A supplied-text answer.\nUse the Gita as its source." });
  assert.equal(result.headers["Cache-Control"], "no-store");
  assert.equal(captured.url, "https://api.anthropic.com/v1/messages");
  assert.equal(captured.options.headers["x-api-key"], "server-only-secret");
  assert.equal("authorization" in captured.options.headers, false);
  assert.match(captured.body.system, /Hinduism's own tradition and texts \(the Bhagavad Gita/);
  assert.match(captured.body.system, /Never compare or rank religions/);
  assert.doesNotMatch(captured.body.system, /Injected rules/);
  assert.equal(captured.body.messages[0].content, sensitiveQuestion);
  assert.equal(JSON.stringify(result).includes("server-only-secret"), false);
  assert.equal(JSON.stringify(result).includes("provider-id-must-not-escape"), false);
});

test("supports all eight exact Door labels, including Simply Spiritual", async () => {
  process.env.ANTHROPIC_API_KEY = "test-server-key";
  const received = [];
  globalThis.fetch = async (_url, options) => {
    received.push(JSON.parse(options.body).system);
    return new Response(JSON.stringify({ content: [{ type: "text", text: "answer" }] }), { status: 200 });
  };
  try {
    for (const door of ["Christianity", "Catholicism", "Hinduism", "Islam", "Judaism", "Buddhism", "Sikhism", "Simply Spiritual"]) {
      const result = await call({ body: payload({ door }) });
      assert.equal(result.status, 200, door);
    }
    assert.equal(received.length, 8);
    assert.match(received.at(-1), /Simply Spiritual's own tradition/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("has a server-side timeout and does not log question, answer, or auth", async () => {
  process.env.ANTHROPIC_API_KEY = "test-server-key";
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const logged = [];
  const originals = [console.log, console.info, console.warn, console.error];
  [console.log, console.info, console.warn, console.error] = originals.map((fn) => (...args) => logged.push(args.join(" ")));
  globalThis.setTimeout = (callback, _duration) => { callback(); return 1; };
  globalThis.clearTimeout = () => {};
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.signal.aborted, true);
    throw new Error("provider timeout includes no user content");
  };
  try {
    const question = "timeout-private-question-31ae";
    const auth = "Bearer private-auth-9a51";
    const result = await call({ body: payload({ messages: [{ role: "user", content: question }] }), headers: { authorization: auth } });
    assert.equal(result.status, 502);
    assert.deepEqual(result.body, { error: "Guide is temporarily unavailable" });
    assert.equal(logged.length, 0);
    assert.equal(JSON.stringify(result).includes(question), false);
    assert.equal(JSON.stringify(result).includes(auth), false);
  } finally {
    [console.log, console.info, console.warn, console.error] = originals;
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
    globalThis.fetch = originalFetch;
  }
});

test("reports the honest unconfigured fallback without contacting the provider", async () => {
  delete process.env.ANTHROPIC_API_KEY;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; };
  try {
    const result = await call({ body: payload() });
    assert.equal(result.status, 503);
    assert.deepEqual(result.body, { error: "Guide is not configured" });
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey !== undefined) process.env.ANTHROPIC_API_KEY = originalKey;
  }
});

test.after(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
  else process.env.ANTHROPIC_API_KEY = originalKey;
});
