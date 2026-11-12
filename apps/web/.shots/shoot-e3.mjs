import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await b.newContext({ viewport: { width: 1000, height: 900 } });
const p = await ctx.newPage();
const errors = [];
p.on("console", (m) => { if (m.type() === "error" || m.type() === "assert") errors.push(m.text()); });
p.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
const O = "/home/claude/shots/";
await p.goto("http://localhost:4230/fe-academy/#/E3"); await p.waitForSelector("figure.figure"); await p.waitForTimeout(2500);
const figs = p.locator("figure.figure:visible"); const n = await figs.count(); console.log("figures", n);
for (let i = 0; i < n; i++) { const f = figs.nth(i); await f.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await f.screenshot({ path: `${O}e3-f${i}.png` }); }
// F0: dials moved, then the bet
let f = figs.nth(0); await f.scrollIntoViewIfNeeded();
await f.locator("input[type=range]").nth(0).fill("1.3"); await p.waitForTimeout(300); await f.screenshot({ path: O + "e3-f0-w130.png" });
await f.locator("input[type=range]").nth(1).fill("-1"); await p.waitForTimeout(300); await f.screenshot({ path: O + "e3-f0-rho-1.png" });
await f.locator("input[type=range]").nth(1).fill("1"); await f.locator("input[type=range]").nth(0).fill("0.6"); await p.waitForTimeout(300); await f.screenshot({ path: O + "e3-f0-rho1.png" });
await f.getByRole("button", { name: "no — A dominates them all" }).click(); await p.waitForTimeout(2500); await f.screenshot({ path: O + "e3-f0-bet.png" });
await f.locator("input[type=range]").nth(0).fill("-0.3"); await p.waitForTimeout(300); await f.screenshot({ path: O + "e3-f0-bet-w-30.png" });
// F1: three angles and two ρ values
f = figs.nth(1); await f.scrollIntoViewIfNeeded();
await f.locator("input[type=range]").nth(0).fill("35"); await p.waitForTimeout(300); await f.screenshot({ path: O + "e3-f1-a35.png" });
await f.locator("input[type=range]").nth(0).fill("125"); await p.waitForTimeout(300); await f.screenshot({ path: O + "e3-f1-a125.png" });
await f.locator("input[type=range]").nth(1).fill("0.95"); await f.locator("input[type=range]").nth(0).fill("45"); await p.waitForTimeout(300); await f.screenshot({ path: O + "e3-f1-rho095.png" });
await f.locator("input[type=range]").nth(1).fill("-0.6"); await p.waitForTimeout(300); await f.screenshot({ path: O + "e3-f1-rho-06.png" });
// F2: k = 1 (default), k = 3, k = 10
f = figs.nth(2); await f.scrollIntoViewIfNeeded();
await f.locator("input[type=range]").nth(0).fill("3"); await p.waitForTimeout(300); await f.screenshot({ path: O + "e3-f2-k3.png" });
await f.locator("input[type=range]").nth(0).fill("10"); await p.waitForTimeout(300); await f.screenshot({ path: O + "e3-f2-k10.png" });
await f.locator("input[type=range]").nth(0).fill("2"); await p.waitForTimeout(300); await f.screenshot({ path: O + "e3-f2-k2.png" });
// phone
const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
m.on("pageerror", (e) => errors.push("PHONE PAGEERROR " + e.message));
await m.goto("http://localhost:4230/fe-academy/#/E3"); await m.waitForSelector("figure.figure"); await m.waitForTimeout(2500);
await m.locator("figure.figure").nth(0).getByRole("button", { name: "yes, by a little" }).click(); await m.waitForTimeout(2500);
await m.screenshot({ path: O + "e3-phone.png", fullPage: true });
const sw = await m.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); console.log("phone scrollWidth/clientWidth", sw);
// dark theme: F0 after bet, F1, F2
const d = await (await b.newContext({ viewport: { width: 1000, height: 900 } })).newPage();
await d.addInitScript(() => localStorage.setItem("fe-theme", "dark"));
await d.goto("http://localhost:4230/fe-academy/#/E3"); await d.waitForSelector("figure.figure"); await d.waitForTimeout(2500);
let df = d.locator("figure.figure:visible").nth(0); await df.getByRole("button", { name: "yes, by a lot" }).click(); await d.waitForTimeout(2500); await df.screenshot({ path: O + "e3-f0-dark.png" });
df = d.locator("figure.figure:visible").nth(1); await df.scrollIntoViewIfNeeded(); await df.screenshot({ path: O + "e3-f1-dark.png" });
df = d.locator("figure.figure:visible").nth(2); await df.scrollIntoViewIfNeeded(); await df.screenshot({ path: O + "e3-f2-dark.png" });
console.log("errors", errors);
await b.close();
