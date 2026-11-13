import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await (await b.newContext({ viewport: { width: 1000, height: 900 } })).newPage();
const errors = []; p.on("pageerror", (e) => errors.push(e.message));
await p.goto("http://localhost:4230/fe-academy/#/F2"); await p.waitForSelector("figure.figure"); await p.waitForTimeout(2500);
for (const d of await p.locator("details").all()) await d.evaluate((e) => (e.open = true));
await p.screenshot({ path: "/home/claude/shots/f2-page.png", fullPage: true });
console.log("errors", errors); await b.close();
