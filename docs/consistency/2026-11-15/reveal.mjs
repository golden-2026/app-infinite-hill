import { chromium } from "file:///C:/Users/shset/code/golden-app/atlas/node_modules/playwright-core/index.mjs";
const OUT = "C:/Users/shset/AppData/Local/Temp/claude/b7a33f8c5f710ca7/a620df6c-f8a6-408f-8012-5fb621146125/scratchpad/cr/app/";
const U = "http://localhost:5183/hill-app-doors.html";
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--mute-audio"] });
const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
for (const lang of ["en", "es"]) {
  const q = "?done=lost-son" + (lang === "es" ? "&lang=es" : "");
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  await p.goto(U, { waitUntil: "domcontentloaded" });
  await p.evaluate((s) => { localStorage.clear(); localStorage.setItem("ih-hill-doors", JSON.stringify(s)); }, { home: "olive", done: { light: true, abram: true }, stamps: ["olive"], streak: 2, log: { [y]: ["light", "abram"] }, lang });
  await p.goto(U + q, { waitUntil: "networkidle" }); await p.waitForTimeout(3000);
  await p.evaluate(() => document.getElementById("edGo")?.click()); await p.waitForTimeout(2500);
  await p.evaluate(() => { const l = document.querySelector("#wspList"); const c = l && l.querySelector("button, [role=button], [role=checkbox], label, li, div"); c && c.click(); }); await p.waitForTimeout(500);
  await p.evaluate(() => document.getElementById("wspDone")?.click()); await p.waitForTimeout(3500);
  await p.screenshot({ path: OUT + `chr-6-reveal-${lang}.png` });
  console.log(lang, await p.evaluate(() => [...document.querySelectorAll(".layer.on")].map((l) => l.id + ": " + l.innerText.replace(/\s+/g, " ").slice(0, 400)).join(" | ")));
  await p.evaluate(() => document.getElementById("rvGo")?.click()); await p.waitForTimeout(2500);
  await p.screenshot({ path: OUT + `chr-7-card-${lang}.png` });
  console.log(lang, await p.evaluate(() => [...document.querySelectorAll(".layer.on")].map((l) => l.id + ": " + l.innerText.replace(/\s+/g, " ").slice(0, 300)).join(" | ")));
  await p.close();
}
await b.close();
