import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await b.newContext({ viewport: { width: 1000, height: 900 } });
const p = await ctx.newPage();
const errors = [];
p.on("console", (m) => { if (m.type() === "error" || m.type() === "assert") errors.push(m.text()); });
p.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
await p.goto("http://localhost:4230/fe-academy/#/E1"); await p.waitForSelector("figure.figure"); await p.waitForTimeout(1500);
const figs = p.locator("figure.figure:visible"); const n = await figs.count(); console.log("figures", n);
for (let i = 0; i < n; i++) { const f = figs.nth(i); await f.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await f.screenshot({ path: `/home/claude/e1-f${i}.png` }); }
// F0: bet, then scrubber at 1
let f = figs.nth(0); await f.getByRole("button", { name: "₹2.5 lakh" }).click(); await p.waitForTimeout(2500); await f.screenshot({ path: "/home/claude/e1-f0-bet.png" });
await f.locator("input[type=range]").first().fill("1"); await f.getByRole("button", { name: "the bell" }).click(); await p.waitForTimeout(400);
// hover a tail bar: the leftmost bar
const cv = f.locator("canvas"); const bb = await cv.boundingBox(); await p.mouse.move(bb.x + 12, bb.y + bb.height * 0.8); await p.waitForTimeout(300);
await f.screenshot({ path: "/home/claude/e1-f0-sorted.png" });
// F1: each fence
f = figs.nth(1);
for (const [k, name] of [["normal", "a bell, 500-day width"], ["ewma", "a bell, EWMA 0.94"]]) { await f.getByRole("button", { name }).click(); await p.waitForTimeout(400); await f.screenshot({ path: `/home/claude/e1-f1-${k}.png` }); }
// F2: step 3 with dial moved
f = figs.nth(2); await f.getByRole("button", { name: "Forward" }).click(); await p.waitForTimeout(200); await f.screenshot({ path: "/home/claude/e1-f2-step2.png" });
await f.getByRole("button", { name: "Forward" }).click(); await p.waitForTimeout(200); await f.screenshot({ path: "/home/claude/e1-f2-step3.png" });
await f.locator("input[type=range]").first().fill("3"); await p.waitForTimeout(400); await f.screenshot({ path: "/home/claude/e1-f2-step3-dial.png" });
// phone
const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
await m.goto("http://localhost:4230/fe-academy/#/E1"); await m.waitForSelector("figure.figure"); await m.waitForTimeout(1500);
await m.screenshot({ path: "/home/claude/e1-phone.png", fullPage: true });
const sw = await m.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); console.log("phone scrollWidth/clientWidth", sw);
// dark theme: F0 sorted + F2
const d = await (await b.newContext({ viewport: { width: 1000, height: 900 } })).newPage();
await d.addInitScript(() => localStorage.setItem("fe-theme", "dark"));
await d.goto("http://localhost:4230/fe-academy/#/E1"); await d.waitForSelector("figure.figure"); await d.waitForTimeout(1500);
let df = d.locator("figure.figure:visible").nth(0); await df.getByRole("button", { name: "₹5 lakh" }).click(); await d.waitForTimeout(2500); await df.getByRole("button", { name: "the bell" }).click(); await d.waitForTimeout(300);
await df.screenshot({ path: "/home/claude/e1-f0-dark.png" });
df = d.locator("figure.figure:visible").nth(3); await df.scrollIntoViewIfNeeded(); await df.screenshot({ path: "/home/claude/e1-f3-dark.png" });
console.log("errors", errors);
await b.close();
