import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await b.newContext({ viewport: { width: 1000, height: 900 } });
const p = await ctx.newPage();
const errors = [];
p.on("console", (m) => { if (m.type() === "error" || m.type() === "assert") errors.push(m.text()); });
p.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
const O = "/home/claude/shots/";
await p.addInitScript(() => localStorage.removeItem("fe-bet:g1-f0"));
await p.goto("http://localhost:4230/fe-academy/#/G1"); await p.waitForSelector("figure.figure"); await p.waitForTimeout(2500);
const figs = p.locator("figure.figure:visible"); const n = await figs.count(); console.log("figures", n);
for (let i = 0; i < n; i++) { const f = figs.nth(i); await f.scrollIntoViewIfNeeded(); await p.waitForTimeout(400); await f.screenshot({ path: `${O}g1-f${i}.png` }); }
// F0: degree 1/5/15 without reveal, bet (15th), then with reveal
let f = figs.nth(0); await f.scrollIntoViewIfNeeded();
const r0 = f.locator("input[type=range]").first();
for (const d of ["1", "5", "15"]) { await r0.fill(d); await p.waitForTimeout(400); await f.screenshot({ path: `${O}g1-f0-d${d}.png` }); }
await f.getByRole("button", { name: /15th-degree/ }).click(); await p.waitForTimeout(600); await f.screenshot({ path: O + "g1-f0-bet.png" });
await f.getByRole("button", { name: /reveal the 20 days/ }).click(); await p.waitForTimeout(400);
for (const d of ["15", "5", "1", "8", "12"]) { await r0.fill(d); await p.waitForTimeout(400); await f.screenshot({ path: `${O}g1-f0-d${d}-reveal.png` }); }
// F1: k 4 and 60 on both training sets
f = figs.nth(1); await f.scrollIntoViewIfNeeded();
const r1 = f.locator("input[type=range]").first();
await r1.fill("4"); await p.waitForTimeout(400); await f.screenshot({ path: O + "g1-f1-k4-full.png" });
await r1.fill("60"); await p.waitForTimeout(400); await f.screenshot({ path: O + "g1-f1-k60-full.png" });
await f.locator(".seg button", { hasText: "last 250" }).click(); await p.waitForTimeout(400); await f.screenshot({ path: O + "g1-f1-k60-small.png" });
await r1.fill("4"); await p.waitForTimeout(400); await f.screenshot({ path: O + "g1-f1-k4-small.png" });
await r1.fill("1"); await p.waitForTimeout(400); await f.screenshot({ path: O + "g1-f1-k1-small.png" });
// F2: λ 0 / 1,000 / 100,000 (indices 0, 13, 21) and 1,778 (14)
f = figs.nth(2); await f.scrollIntoViewIfNeeded();
const r2 = f.locator("input[type=range]").first();
for (const [name, idx] of [["0", "0"], ["1000", "13"], ["1778", "14"], ["100000", "21"]]) { await r2.fill(idx); await p.waitForTimeout(400); await f.screenshot({ path: `${O}g1-f2-lam${name}.png` }); }
// F3: all four steps
f = figs.nth(3); await f.scrollIntoViewIfNeeded(); await f.screenshot({ path: O + "g1-f3-step1.png" });
for (let s = 2; s <= 4; s++) { await f.getByRole("button", { name: "Forward" }).click(); await p.waitForTimeout(400); await f.screenshot({ path: `${O}g1-f3-step${s}.png` }); }
// whole page, for the prose
await p.screenshot({ path: O + "g1-page.png", fullPage: true });
// phone
const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
m.on("pageerror", (e) => errors.push("PHONE PAGEERROR " + e.message));
m.on("console", (msg) => { if (msg.type() === "error" || msg.type() === "assert") errors.push("PHONE " + msg.text()); });
await m.goto("http://localhost:4230/fe-academy/#/G1"); await m.waitForSelector("figure.figure"); await m.waitForTimeout(2500);
const mf = m.locator("figure.figure");
await mf.nth(0).locator("input[type=range]").first().fill("15"); await mf.nth(0).getByRole("button", { name: /reveal the 20 days/ }).click(); await m.waitForTimeout(400);
await mf.nth(3).getByRole("button", { name: "Forward" }).click(); await m.waitForTimeout(400);
for (let i = 0; i < 4; i++) { await mf.nth(i).scrollIntoViewIfNeeded(); await m.waitForTimeout(400); await mf.nth(i).screenshot({ path: `${O}g1-phone-f${i}.png` }); }
const sw = await m.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); console.log("phone scrollWidth/clientWidth", sw);
// dark theme
const d = await (await b.newContext({ viewport: { width: 1000, height: 900 } })).newPage();
d.on("pageerror", (e) => errors.push("DARK PAGEERROR " + e.message));
await d.addInitScript(() => localStorage.setItem("fe-theme", "dark"));
await d.goto("http://localhost:4230/fe-academy/#/G1"); await d.waitForSelector("figure.figure"); await d.waitForTimeout(2500);
let df = d.locator("figure.figure:visible").nth(0); await df.locator("input[type=range]").first().fill("15"); await df.getByRole("button", { name: /reveal the 20 days/ }).click(); await d.waitForTimeout(400); await df.screenshot({ path: O + "g1-f0-dark.png" });
df = d.locator("figure.figure:visible").nth(2); await df.scrollIntoViewIfNeeded(); await d.waitForTimeout(400); await df.screenshot({ path: O + "g1-f2-dark.png" });
df = d.locator("figure.figure:visible").nth(3); await df.scrollIntoViewIfNeeded(); await df.getByRole("button", { name: "Forward" }).click(); await d.waitForTimeout(400); await df.screenshot({ path: O + "g1-f3-dark.png" });
console.log("errors", errors);
await b.close();
