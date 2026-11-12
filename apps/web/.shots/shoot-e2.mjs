import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await b.newContext({ viewport: { width: 1000, height: 900 } });
const p = await ctx.newPage();
const errors = [];
p.on("console", (m) => { if (m.type() === "error" || m.type() === "assert") errors.push(m.text()); });
p.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
const O = "/home/claude/shots/";
await p.goto("http://localhost:4230/fe-academy/#/E2"); await p.waitForSelector("figure.figure"); await p.waitForTimeout(2500);
const figs = p.locator("figure.figure:visible"); const n = await figs.count(); console.log("figures", n);
for (let i = 0; i < n; i++) { const f = figs.nth(i); await f.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await f.screenshot({ path: `${O}e2-f${i}.png` }); }
// F0: bet, then re-roll twice
let f = figs.nth(0); await f.getByRole("button", { name: "about 19" }).click(); await p.waitForTimeout(600); await f.screenshot({ path: O + "e2-f0-bet.png" });
await f.getByRole("button", { name: /re-roll/ }).click(); await p.waitForTimeout(300); await f.screenshot({ path: O + "e2-f0-seed2.png" });
// F1: each toggle, and the dial at 100 and 100,000
f = figs.nth(1); await f.scrollIntoViewIfNeeded();
await f.getByRole("button", { name: "mirror" }).click(); await p.waitForTimeout(800); await f.screenshot({ path: O + "e2-f1-mirror.png" });
await f.getByRole("button", { name: "control" }).click(); await p.waitForTimeout(800); await f.screenshot({ path: O + "e2-f1-control.png" });
await f.locator("input[type=range]").first().fill("0"); await p.waitForTimeout(800); await f.screenshot({ path: O + "e2-f1-control-100.png" });
await f.locator("input[type=range]").first().fill("7"); await p.waitForTimeout(1500); await f.screenshot({ path: O + "e2-f1-control-100k.png" });
await f.getByRole("button", { name: "plain" }).click(); await p.waitForTimeout(300); await f.screenshot({ path: O + "e2-f1-plain-100k.png" });
// F2: steps 2–5
f = figs.nth(2); await f.scrollIntoViewIfNeeded();
for (let s = 2; s <= 5; s++) { await f.getByRole("button", { name: "Forward" }).click(); await p.waitForTimeout(400); await f.screenshot({ path: `${O}e2-f2-step${s}.png` }); }
// F3: guess, then each correlation, then unhedged
f = figs.nth(3); await f.scrollIntoViewIfNeeded();
await f.getByRole("button", { name: "± 5 %" }).click(); await p.waitForTimeout(1500); await f.screenshot({ path: O + "e2-f3-guess.png" });
for (const [k, name] of [["0", "0"], ["p06", "+0.6"]]) { await f.locator(".seg button", { hasText: name }).first().click(); await p.waitForTimeout(1500); await f.screenshot({ path: `${O}e2-f3-rho-${k}.png` }); }
await f.getByRole("button", { name: /hedged \(3,292/ }).click(); await p.waitForTimeout(1500); await f.screenshot({ path: O + "e2-f3-unhedged.png" });
// phone
const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
m.on("pageerror", (e) => errors.push("PHONE PAGEERROR " + e.message));
await m.goto("http://localhost:4230/fe-academy/#/E2"); await m.waitForSelector("figure.figure"); await m.waitForTimeout(2500);
await m.screenshot({ path: O + "e2-phone.png", fullPage: true });
const sw = await m.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); console.log("phone scrollWidth/clientWidth", sw);
// dark theme: F0 after bet + F3
const d = await (await b.newContext({ viewport: { width: 1000, height: 900 } })).newPage();
await d.addInitScript(() => localStorage.setItem("fe-theme", "dark"));
await d.goto("http://localhost:4230/fe-academy/#/E2"); await d.waitForSelector("figure.figure"); await d.waitForTimeout(2500);
let df = d.locator("figure.figure:visible").nth(0); await df.getByRole("button", { name: "about 10" }).click(); await d.waitForTimeout(600); await df.screenshot({ path: O + "e2-f0-dark.png" });
df = d.locator("figure.figure:visible").nth(2); await df.scrollIntoViewIfNeeded(); for (let s = 0; s < 2; s++) await df.getByRole("button", { name: "Forward" }).click(); await d.waitForTimeout(400); await df.screenshot({ path: O + "e2-f2-dark.png" });
console.log("errors", errors);
await b.close();
