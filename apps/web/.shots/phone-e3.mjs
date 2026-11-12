import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
const O = "/home/claude/shots/";
await m.goto("http://localhost:4230/fe-academy/#/E3"); await m.waitForSelector("figure.figure"); await m.waitForTimeout(2500);
const figs = m.locator("figure.figure");
await figs.nth(0).getByRole("button", { name: "yes, by a little" }).click(); await m.waitForTimeout(2500);
for (let i = 0; i < 3; i++) { await figs.nth(i).scrollIntoViewIfNeeded(); await m.waitForTimeout(300); await figs.nth(i).screenshot({ path: `${O}e3-phone-f${i}.png` }); }
const sw = await m.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); console.log("phone", sw);
await b.close();
