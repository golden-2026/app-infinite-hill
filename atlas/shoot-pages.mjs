// node shoot-pages.mjs outdir path1 path2 ... — screenshot website paths (desktop 1440 + phone 390) the way Netlify
// serves them: apps/app/public behind a fake origin, with the rewrites from public/_redirects (/ -> site.html,
// /about -> about.html, /es/about -> about-es.html). Add "@top" to a path for the first screen only, not the full page.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const PUB = "C:/Users/shset/code/golden-app/apps/app/public/";
const ORIGIN = "http://ih.test";
const rules = fs.readFileSync(PUB + "_redirects", "utf8").split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#")).map((l) => l.trim().split(/\s+/));
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml" };
function resolve(p) {
  for (const [from, to] of rules) {
    if (from === p) return to;
    if (from === "/*") { if (!fs.existsSync(PUB + p.slice(1)) || p === "/") return to; }
  }
  return p;
}
const [out, ...paths] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
for (const [w, h, tag] of [[1440, 900, "desk"], [390, 844, "phone"]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.route(ORIGIN + "/**", (r) => {
    const u = new URL(r.request().url());
    const f = resolve(decodeURIComponent(u.pathname));
    const file = PUB + f.replace(/^\//, "");
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) return r.fulfill({ status: 404, body: "not found: " + f });
    r.fulfill({ status: 200, path: file, contentType: TYPES[path.extname(file)] || "application/octet-stream" });
  });
  const page = await ctx.newPage();
  for (const raw of paths) {
    const top = raw.endsWith("@top");
    const p = raw.replace(/@top$/, "");
    await page.goto(ORIGIN + p, { waitUntil: "load" });
    await page.waitForTimeout(900);
    const name = (p.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-") || "home") + (top ? "-top" : "");
    await page.screenshot({ path: `${out}/${name}-${tag}.png`, fullPage: !top });
    console.log(tag, p, "->", page.url().replace(ORIGIN, ""));
  }
  await ctx.close();
}
await browser.close();
