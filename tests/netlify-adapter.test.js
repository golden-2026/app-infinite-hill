import assert from "node:assert/strict";
import test from "node:test";
import { adaptVercelHandler } from "../netlify/_shared/vercel-adapter.js";
import { handler as commerceHandler } from "../netlify/functions/commerce.js";
import { handler as stripeWebhookHandler } from "../netlify/functions/stripe-webhook.js";

function decode(result) {
  return Buffer.from(result.body, result.isBase64Encoded ? "base64" : "utf8");
}

test("adapter forwards method, URL, headers, and request bytes to the Vercel handler", async () => {
  const payload = Buffer.from([0, 255, 1, 128, 42]);
  const handler = adaptVercelHandler(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    assert.equal(req.method, "PUT");
    assert.equal(req.url, "/api/state?userId=local_abc");
    assert.equal(req.headers.authorization, "Bearer token");
    assert.deepEqual(Buffer.concat(chunks), payload);
    res.statusCode = 202;
    res.setHeader("X-Adapter", "ok");
    res.end(Buffer.from([0, 254, 2]));
  });

  const result = await handler({
    httpMethod: "PUT",
    rawUrl: "https://example.net/api/state?userId=local_abc",
    headers: { Authorization: "Bearer token" },
    body: payload.toString("base64"),
    isBase64Encoded: true,
  });

  assert.equal(result.statusCode, 202);
  assert.equal(result.headers["X-Adapter"], "ok");
  assert.equal(result.isBase64Encoded, true);
  assert.deepEqual(decode(result), Buffer.from([0, 254, 2]));
});

test("guide adapter preserves handler status and response headers", async () => {
  const handler = adaptVercelHandler(async (_req, res) => {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method not allowed");
  });
  const result = await handler({ httpMethod: "GET", path: "/api/guide" });

  assert.equal(result.statusCode, 405);
  assert.equal(result.headers.Allow, "POST");
  assert.equal(decode(result).toString(), "Method not allowed");
});

test("adapter converts handler exceptions into a bounded 500 response", async () => {
  const result = await adaptVercelHandler(async () => { throw new Error("private detail"); })({ httpMethod: "GET" });
  assert.equal(result.statusCode, 500);
  assert.deepEqual(JSON.parse(decode(result).toString()), { error: "Internal server error" });
});

test("commerce Netlify function exposes provider state without fabricating checkout", async () => {
  const result = await commerceHandler({ httpMethod: "GET", path: "/api/commerce", headers: {} });
  assert.equal(result.statusCode, 200);
  const body = JSON.parse(decode(result).toString());
  assert.equal(body.provider, "stripe");
  assert.ok(["configured", "provider_not_configured"].includes(body.state));
  assert.equal(body.checkoutUrl, undefined);
});

test("Stripe webhook Netlify adapter preserves the HTTP method and bounded response", async () => {
  const result = await stripeWebhookHandler({ httpMethod: "GET", path: "/.netlify/functions/stripe-webhook", headers: {} });
  assert.equal(result.statusCode, 405);
  assert.equal(result.headers.Allow, "POST");
  const body = JSON.parse(decode(result).toString("utf8"));
  assert.equal(body.errorCode, "method_not_allowed");
});
