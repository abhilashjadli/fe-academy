import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await b.newContext({ viewport: { width: 1000, height: 900 } });
const p = await ctx.newPage();
const errors = [];
p.on("console", (m) => { if (m.type() === "error" || m.type() === "assert") errors.push(m.text()); });
p.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
const O = "/home/claude/shots/";
await p.goto("http://localhost:4230/fe-academy/#/F1"); await p.waitForSelector("figure.figure"); await p.waitForTimeout(2500);
const figs = p.locator("figure.figure:visible"); const n = await figs.count(); console.log("figures", n);
for (let i = 0; i < n; i++) { const f = figs.nth(i); await f.scrollIntoViewIfNeeded(); await p.waitForTimeout(300); await f.screenshot({ path: `${O}f1-f${i}.png` }); }
// F0: bet, then days 0, 1, 11, formula on; hover a dot
let f = figs.nth(0); await f.scrollIntoViewIfNeeded();
await f.getByRole("button", { name: "rounds off" }).click(); await p.waitForTimeout(500); await f.screenshot({ path: O + "f1-f0-bet-day1.png" });
const r0 = f.locator("input[type=range]").first();
await r0.fill("0"); await p.waitForTimeout(300); await f.screenshot({ path: O + "f1-f0-day0.png" });
await r0.fill("11"); await p.waitForTimeout(300); await f.screenshot({ path: O + "f1-f0-day11.png" });
await f.getByRole("button", { name: "the formula" }).click(); await p.waitForTimeout(300); await f.screenshot({ path: O + "f1-f0-day11-formula.png" });
{ const svg = f.locator("svg.plot").first(); const bb = await svg.boundingBox(); await p.mouse.move(bb.x + bb.width * 0.52, bb.y + bb.height * 0.5); await p.waitForTimeout(300); await f.screenshot({ path: O + "f1-f0-hover.png" }); await p.mouse.move(0, 0); }
// F1: 0.1, 0.25, 1 day on both grids
f = figs.nth(1); await f.scrollIntoViewIfNeeded();
const r1 = f.locator("input[type=range]").first();
for (const [name, idx] of [["0.1", "0"], ["0.25", "6"], ["0.3", "7"], ["1", "11"]]) { await r1.fill(idx); await p.waitForTimeout(500); await f.screenshot({ path: `${O}f1-f1-g100-${name}.png` }); }
await f.getByRole("button", { name: "50", exact: true }).click(); await p.waitForTimeout(400);
for (const [name, idx] of [["0.1", "0"], ["0.25", "6"], ["1", "11"]]) { await r1.fill(idx); await p.waitForTimeout(500); await f.screenshot({ path: `${O}f1-f1-g50-${name}.png` }); }
// F2: each scheme at M = 100 and 800
f = figs.nth(2); await f.scrollIntoViewIfNeeded();
const r2 = f.locator("input[type=range]").first();
for (const s of ["explicit", "implicit", "Crank–Nicolson"]) {
  await f.locator(".seg button", { hasText: s }).first().click(); await p.waitForTimeout(800);
  await r2.fill("2"); await p.waitForTimeout(500); await f.screenshot({ path: `${O}f1-f2-${s.slice(0, 3)}-100.png` });
  await r2.fill("5"); await p.waitForTimeout(500); await f.screenshot({ path: `${O}f1-f2-${s.slice(0, 3)}-800.png` });
}
// F3: both toggles with a hovered cell
f = figs.nth(3); await f.scrollIntoViewIfNeeded();
{ const svg = f.locator("svg.f1-grid").first(); const bb = await svg.boundingBox(); await p.mouse.move(bb.x + bb.width * 0.45, bb.y + bb.height * 0.62); await p.waitForTimeout(300); await f.screenshot({ path: O + "f1-f3-american-hover.png" }); }
await f.getByRole("button", { name: "European" }).click(); await p.waitForTimeout(300);
{ const svg = f.locator("svg.f1-grid").first(); const bb = await svg.boundingBox(); await p.mouse.move(bb.x + bb.width * 0.45, bb.y + bb.height * 0.62); await p.waitForTimeout(300); await f.screenshot({ path: O + "f1-f3-european-hover.png" }); }
{ const svg = f.locator("svg.f1-grid").nth(1); const bb = await svg.boundingBox(); await p.mouse.move(bb.x + bb.width * 0.3, bb.y + bb.height * 0.4); await p.waitForTimeout(300); await f.screenshot({ path: O + "f1-f3-inset-hover.png" }); }
// phone
const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
m.on("pageerror", (e) => errors.push("PHONE PAGEERROR " + e.message));
await m.goto("http://localhost:4230/fe-academy/#/F1"); await m.waitForSelector("figure.figure"); await m.waitForTimeout(2500);
await m.locator("figure.figure").nth(0).getByRole("button", { name: "rounds off" }).click(); await m.waitForTimeout(500);
await m.screenshot({ path: O + "f1-phone.png", fullPage: true });
const sw = await m.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); console.log("phone scrollWidth/clientWidth", sw);
// dark theme: F0 after bet at day 11 + F1 at 1 day + F3
const d = await (await b.newContext({ viewport: { width: 1000, height: 900 } })).newPage();
await d.addInitScript(() => localStorage.setItem("fe-theme", "dark"));
await d.goto("http://localhost:4230/fe-academy/#/F1"); await d.waitForSelector("figure.figure"); await d.waitForTimeout(2500);
let df = d.locator("figure.figure:visible").nth(0); await df.getByRole("button", { name: "slides up" }).click(); await d.waitForTimeout(400); await df.locator("input[type=range]").first().fill("11"); await d.waitForTimeout(400); await df.screenshot({ path: O + "f1-f0-dark.png" });
df = d.locator("figure.figure:visible").nth(1); await df.scrollIntoViewIfNeeded(); await df.locator("input[type=range]").first().fill("11"); await d.waitForTimeout(600); await df.screenshot({ path: O + "f1-f1-dark.png" });
df = d.locator("figure.figure:visible").nth(3); await df.scrollIntoViewIfNeeded(); await d.waitForTimeout(400); await df.screenshot({ path: O + "f1-f3-dark.png" });
console.log("errors", errors);
await b.close();
