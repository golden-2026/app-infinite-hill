// node shoot-app-logo.mjs — the app's launch screen (before the app paints) and its /welcome splash, on the build
// served at http://127.0.0.1:5193 (node serve.mjs expo-live53 5193 --spa). Writes audit-shots/app-*.png.
import { chromium } from "playwright-core";
const B = "http://127.0.0.1:5193";
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
for (const [w, h, tag] of [[1440, 900, "desk"], [390, 844, "phone"]]) {
  // the launch screen: hold back the app bundle so the screen people see while it loads stays up
  let ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.route(/_expo\/static\/js\//, (r) => r.abort());
  let page = await ctx.newPage();
  await page.goto(B + "/welcome/you", { waitUntil: "load" }); await page.waitForTimeout(600);
  await page.screenshot({ path: `audit-shots/app-launch-welcome-you-${tag}.png` });
  await ctx.close();
  ctx = await browser.newContext({ viewport: { width: w, height: h } });
  page = await ctx.newPage();
  await page.goto(B + "/welcome", { waitUntil: "networkidle" }); await page.waitForTimeout(2500);
  await page.screenshot({ path: `audit-shots/app-welcome-logo-${tag}.png` });
  await ctx.close();
}
await browser.close();
