import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
await m.goto("http://localhost:4230/fe-academy/#/E2"); await m.waitForSelector("figure.figure"); await m.waitForTimeout(2500);
const figs = m.locator("figure.figure:visible");
for (let i = 0; i < 4; i++) { const f = figs.nth(i); await f.scrollIntoViewIfNeeded(); await m.waitForTimeout(300); await f.screenshot({ path: `/home/claude/shots/ph-f${i}.png` }); }
let f = figs.nth(0); await f.getByRole("button", { name: "about 19" }).click(); await m.waitForTimeout(500); await f.screenshot({ path: "/home/claude/shots/ph-f0-bet.png" });
f = figs.nth(1); await f.getByRole("button", { name: "mirror" }).click(); await m.waitForTimeout(800); await f.screenshot({ path: "/home/claude/shots/ph-f1-mirror.png" });
f = figs.nth(2); for (let s = 0; s < 3; s++) await f.getByRole("button", { name: "Forward" }).click(); await m.waitForTimeout(400); await f.screenshot({ path: "/home/claude/shots/ph-f2-step4.png" });
await f.getByRole("button", { name: "Back" }).click(); await m.waitForTimeout(400); await f.screenshot({ path: "/home/claude/shots/ph-f2-step3.png" });
f = figs.nth(3); await f.getByRole("button", { name: "± 5 %" }).click(); await m.waitForTimeout(1500); await f.screenshot({ path: "/home/claude/shots/ph-f3.png" });
const sw = await m.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); console.log("phone", sw);
await b.close();
