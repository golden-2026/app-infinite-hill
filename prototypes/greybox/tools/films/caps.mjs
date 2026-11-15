// caps.mjs <edit.json>: renders each card's caption to a transparent 720x1280 PNG (Anton, one lime word) via headless Chrome
import { spawn } from "node:child_process";
import fs from "node:fs";
const edit = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const dir = new URL("./caps/", import.meta.url); fs.mkdirSync(dir, { recursive: true });
const port = 9800 + Math.floor(Math.random() * 100);
const ch = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new", "--remote-debugging-port=" + port, "--user-data-dir=" + process.env.TEMP + "/caps-" + port, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let tabs; for (let i = 0; i < 40; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (tabs.length) break; } catch {} await sleep(250); }
const ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = {}; ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend[d.id]) { pend[d.id](d.result); delete pend[d.id]; } };
const cdp = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
await cdp("Emulation.setDeviceMetricsOverride", { width: 360, height: 640, deviceScaleFactor: 2, mobile: false });
await cdp("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const html = (c) => `<!doctype html><html><head><link href="https://fonts.googleapis.com/css2?family=Anton&family=Manrope:wght@800&display=swap" rel="stylesheet"><style>
html,body{margin:0;background:transparent;width:360px;height:640px;overflow:hidden}
.c{position:absolute;left:20px;right:16px;${c.pos === "mid" ? "top:50%;transform:translateY(-50%);text-align:center;left:16px" : c.pos === "top" ? "top:70px" : "bottom:70px"};font:${c.size || 50}px/${c.ink ? 1.08 : 0.92} Anton,Impact,sans-serif;text-transform:uppercase;color:${c.ink ? "#0A0A0A" : "#F4F1EA"};text-shadow:${c.ink ? "none" : "0 2px 18px rgba(0,0,0,.55),0 0 2px rgba(0,0,0,.5)"};letter-spacing:-.005em}
.y{color:${c.ink ? "#0A0A0A;background:#0A0A0A;color:#EEFF6A;padding:0 .08em" : "#EEFF6A"}}
.s{font:800 14px/1.3 Manrope,sans-serif;text-transform:none;margin-top:10px;opacity:.9}
</style></head><body><div class="c">${c.text.split(/(\*[^*]+\*)/).map((p) => (p.startsWith("*") ? `<span class="y">${esc(p.slice(1, -1))}</span>` : esc(p))).join("")}${c.sub ? `<div class="s">${esc(c.sub)}</div>` : ""}</div></body></html>`;
await cdp("Page.enable");
for (const [k, c] of edit.cards.entries()) {
  const f = new URL(`cap-${String(k).padStart(2, "0")}.png`, dir);
  if (!c.text) { fs.rmSync(f, { force: true }); continue; }
  await cdp("Page.navigate", { url: "data:text/html;base64," + Buffer.from(html(c)).toString("base64") }); await sleep(900);
  const shot = await cdp("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(f, Buffer.from(shot.data, "base64"));
}
ws.close(); ch.kill(); console.log("caps done", edit.cards.length); process.exit(0);
