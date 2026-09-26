import { Readable } from "node:stream";

function requestUrl(event) {
  if (event.rawUrl) {
    const url = new URL(event.rawUrl);
    return `${url.pathname}${url.search}`;
  }
  const path = event.path || "/";
  const params = new URLSearchParams(event.queryStringParameters || {});
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

function requestHeaders(event) {
  const headers = {};
  for (const [name, value] of Object.entries(event.headers || {})) {
    if (value != null) headers[name.toLowerCase()] = Array.isArray(value) ? value.join(", ") : String(value);
  }
  for (const [name, values] of Object.entries(event.multiValueHeaders || {})) {
    if (values?.length) headers[name.toLowerCase()] = values.join(", ");
  }
  return headers;
}

function requestBytes(event) {
  if (!event.body) return Buffer.alloc(0);
  return event.isBase64Encoded
    ? Buffer.from(event.body, "base64")
    : Buffer.from(event.body, "utf8");
}

function createVercelResponse() {
  const headers = new Map();
  const chunks = [];
  const response = {
    statusCode: 200,
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), { name: String(name), value });
      return this;
    },
    getHeader(name) {
      return headers.get(String(name).toLowerCase())?.value;
    },
    removeHeader(name) {
      headers.delete(String(name).toLowerCase());
    },
    write(chunk, encoding, callback) {
      if (typeof encoding === "function") callback = encoding;
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof encoding === "string" ? encoding : "utf8"));
      if (callback) callback();
      return true;
    },
    end(chunk, encoding, callback) {
      if (typeof chunk === "function") callback = chunk;
      else if (chunk != null) this.write(chunk, encoding);
      this.writableEnded = true;
      if (callback) callback();
      return this;
    },
  };

  return {
    response,
    toNetlifyResponse() {
      const bytes = Buffer.concat(chunks);
      const outputHeaders = Object.fromEntries(
        [...headers.values()].map(({ name, value }) => [name, Array.isArray(value) ? value.join(", ") : String(value)]),
      );
      return {
        statusCode: response.statusCode,
        headers: outputHeaders,
        body: bytes.toString("base64"),
        isBase64Encoded: true,
      };
    },
  };
}

/** Adapt a Vercel Node request/response handler to a Netlify Functions handler. */
export function adaptVercelHandler(vercelHandler) {
  return async (event) => {
    const bytes = requestBytes(event);
    const req = Readable.from(bytes.length ? [bytes] : []);
    req.method = event.httpMethod || event.method || "GET";
    req.url = requestUrl(event);
    req.headers = requestHeaders(event);
    req.query = Object.fromEntries(new URL(req.url, "http://localhost").searchParams.entries());
    const capture = createVercelResponse();

    try {
      await vercelHandler(req, capture.response);
    } catch {
      capture.response.statusCode = 500;
      capture.response.setHeader("Content-Type", "application/json; charset=utf-8");
      capture.response.end(JSON.stringify({ error: "Internal server error" }));
    }

    return capture.toNetlifyResponse();
  };
}
