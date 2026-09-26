// Client error reports (P0 "crash visibility"). Accepts only a fixed, content-free shape and writes one
// structured line to the function log. Never accepts user text, door, lesson content or identifiers.
const MAX_BODY = 2048;
const KINDS = new Set(["error", "unhandledrejection"]);
const clip = (v, n) => (typeof v === "string" ? v.replace(/[\r\n]+/g, " ").slice(0, n) : undefined);

export default async function log(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end();
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) {
      res.statusCode = 413;
      return res.end();
    }
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  let body;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    res.statusCode = 400;
    return res.end();
  }
  if (!body || !KINDS.has(body.kind)) {
    res.statusCode = 400;
    return res.end();
  }
  console.log(JSON.stringify({
    at: "client-error",
    kind: body.kind,
    message: clip(body.message, 200),
    file: clip(body.file, 120),
    line: Number.isInteger(body.line) ? body.line : undefined,
    build: clip(body.build, 40),
  }));
  res.statusCode = 204;
  return res.end();
}
