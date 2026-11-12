import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await (await b.newContext({ viewport: { width: 1000, height: 900 } })).newPage();
await p.goto("http://localhost:4230/fe-academy/#/E1"); await p.waitForSelector("figure.figure"); await p.waitForTimeout(1500);
await p.screenshot({ path: "/home/claude/e1-page.png", fullPage: true });
await b.close();
