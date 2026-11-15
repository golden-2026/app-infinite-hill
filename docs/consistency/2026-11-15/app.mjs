// consistency review 2026-11-15: real app screens at 390x844 for comparison with website images and film frames
import { chromium } from "file:///C:/Users/shset/code/golden-app/atlas/node_modules/playwright-core/index.mjs";
const OUT = "C:/Users/shset/AppData/Local/Temp/claude/b7a33f8c5f710ca7/a620df6c-f8a6-408f-8012-5fb621146125/scratchpad/cr/app/";
const U = "http://localhost:5183/hill-app-doors.html";
const b = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--mute-audio"] });
const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
const txt = {};
async function page(state, q = "") {
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  await p.goto(U + q, { waitUntil: "domcontentloaded" });
  await p.evaluate((s) => { localStorage.clear(); if (s) localStorage.setItem("ih-hill-doors", JSON.stringify(s)); }, state);
  await p.goto(U + q, { waitUntil: "networkidle" }); await p.waitForTimeout(2000);
  return p;
}
const closeLayers = (p) => p.evaluate(() => document.querySelectorAll(".layer.on").forEach((l) => l.classList.remove("on")));
const shot = async (p, n) => { await p.screenshot({ path: OUT + n + ".png" }); txt[n] = await p.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 1500)); };
const step = async (name, fn) => { try { await fn(); } catch (e) { console.log("FAIL", name, e.message.split("\n")[0]); } };

for (const lang of ["en", "es"]) {
  const q = lang === "es" ? "?lang=es" : "";
  // Christianity: the mood question
  await step("chr-ask-" + lang, async () => {
    const p = await page({ home: "olive", done: { light: 1 }, stamps: ["olive"], streak: 1, log: {}, bridgeOffered: "x", lang }, q);
    await closeLayers(p); await shot(p, `chr-1-ask-${lang}`);
    const opt = lang === "es" ? "me enojé con alguien que quiero" : "i'm angry at someone i love";
    await p.getByText(opt).first().click(); await p.waitForTimeout(2200); await shot(p, `chr-2-picked-${lang}`);
    await p.close();
  });
  // Christianity: reveal + card after the lost son
  await step("chr-reveal-" + lang, async () => {
    const p = await page({ home: "olive", done: { light: true, abram: true }, stamps: ["olive"], streak: 2, log: { [y]: ["light", "abram"] }, lang }, "?done=lost-son" + (lang === "es" ? "&lang=es" : ""));
    await p.waitForTimeout(1500); await shot(p, `chr-3-done-${lang}`);
    await p.evaluate(() => document.getElementById("edGo")?.click()); await p.waitForTimeout(3000); await shot(p, `chr-4-reveal-${lang}`);
    await p.evaluate(() => document.getElementById("rvGo")?.click()); await p.waitForTimeout(2200); await shot(p, `chr-5-card-${lang}`);
    await p.close();
  });
  // my own religion: what i live by
  await step("own-" + lang, async () => {
    const d = "2026-11-10", P = (f, line, kind, tag, src) => ({ id: f, f, line, kind, t: "", tag, src, date: d });
    const creed = [P("buddhism/1", "i am the owner of my actions.", "belief", "Buddhism", "the Anguttara Nikaya"), P("islam/1", "you never start alone.", "belief", "Islam", "the Qur'an 27:30"), P("christianity/3", "never too old to start again.", "belief", "Christianity", "John 3:3")];
    const bplayed = {}; creed.forEach((c) => (bplayed[c.f] = d));
    const p = await page({ home: "wild", path: "build", done: {}, stamps: ["wild"], streak: 3, log: { [y]: ["b:x"] }, creed, bplayed, lang }, q);
    await closeLayers(p); await shot(p, `own-1-today-${lang}`);
    await p.evaluate(() => { const c = document.getElementById("creed") || document.getElementById("lbCards"); c && c.scrollIntoView({ block: "start" }); }); await p.waitForTimeout(800); await shot(p, `own-2-livesby-${lang}`);
    await p.close();
  });
  // guide + you tabs
  await step("tabs-" + lang, async () => {
    const p = await page({ home: "olive", done: { light: 1 }, stamps: ["olive"], streak: 7, log: {}, bridgeOffered: "x", lang }, q);
    await closeLayers(p);
    await p.click('button[data-tab="guide"]'); await p.waitForTimeout(1500); await shot(p, `tab-guide-${lang}`);
    await p.click('button[data-tab="you"]'); await p.waitForTimeout(1500); await shot(p, `tab-you-${lang}`);
    await p.click('button[data-tab="together"]'); await p.waitForTimeout(1500); await shot(p, `tab-together-${lang}`);
    await p.close();
  });
}
// first run: no state at all
await step("fresh", async () => { const p = await page(null); await shot(p, "fresh-1"); await p.close(); });
// Hindu day 1 mood question
await step("hin", async () => { const p = await page({ home: "marigold", done: {}, stamps: ["marigold"], streak: 1, log: {}, bridgeOffered: "x" }); await closeLayers(p); await shot(p, "hin-1-ask"); await p.close(); });
const fs = await import("node:fs"); fs.writeFileSync(OUT + "text.json", JSON.stringify(txt, null, 1));
await b.close(); console.log("done");
