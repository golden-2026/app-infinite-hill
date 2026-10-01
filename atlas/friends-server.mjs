// Local stand-in for the deployed site: the static export (SPA fallback) plus /api/friends (api/friends.js), /api/pulse
// (api/pulse.js), /api/circles (api/circles.js) and /api/waitlist (api/waitlist.js; on only with INVITE_ONLY=on), each with its in-memory Map store. For walking two friends (or a
// circle) in several browser contexts. Nothing is logged.
// Run: node atlas/friends-server.mjs [dir=expo-streak] [port=5198]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import friends from "../api/friends.js";
import pulse from "../api/pulse.js";
import circles from "../api/circles.js";
import waitlist from "../api/waitlist.js";

const [dir = "expo-streak", port = "5198"] = process.argv.slice(2);
const root = join(fileURLToPath(new URL(".", import.meta.url)), dir);
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".ico": "image/x-icon", ".svg": "image/svg+xml", ".ttf": "font/ttf", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json", ".mp3": "audio/mpeg", ".webp": "image/webp" };

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/api/friends") return friends(req, res);
  if (url.pathname === "/api/pulse") return pulse(req, res);
  if (url.pathname === "/api/circles") return circles(req, res);
  if (url.pathname === "/api/waitlist") return waitlist(req, res); // launch switch: INVITE_ONLY=on in this terminal
  const path = normalize(decodeURIComponent(url.pathname)).replace(/^([\\/])+/, "") || "index.html";
  try {
    const body = await readFile(join(root, path));
    res.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream" }).end(body);
  } catch {
    if (!extname(path)) res.writeHead(200, { "Content-Type": types[".html"] }).end(await readFile(join(root, "index.html")));
    else res.writeHead(404).end("not found");
  }
}).listen(Number(port), "127.0.0.1", () => console.log(`friends + ${dir} on http://127.0.0.1:${port}/`));
