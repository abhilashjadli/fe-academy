import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await b.newContext({ viewport: { width: 1000, height: 900 } });
const p = await ctx.newPage();
const errors = [];
p.on("console", (m) => { if (m.type() === "error" || m.type() === "assert") errors.push(m.text()); });
p.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
const O = "/home/claude/shots/";
await p.goto("http://localhost:4230/fe-academy/#/F2"); await p.waitForSelector("figure.figure"); await p.waitForTimeout(3000);
const figs = p.locator("figure.figure:visible"); const n = await figs.count(); console.log("figures", n);
for (let i = 0; i < n; i++) { const f = figs.nth(i); await f.scrollIntoViewIfNeeded(); await p.waitForTimeout(400); await f.screenshot({ path: `${O}f2-f${i}.png` }); }
// F0: bet (wait), then the four steps
let f = figs.nth(0); await f.scrollIntoViewIfNeeded();
await f.getByRole("button", { name: "wait", exact: true }).click(); await p.waitForTimeout(500); await f.screenshot({ path: O + "f2-f0-bet.png" });
for (let s = 1; s <= 3; s++) { await f.getByRole("button", { name: "Forward" }).click(); await p.waitForTimeout(400); await f.screenshot({ path: `${O}f2-f0-step${s + 1}.png` }); }
// F1: paths dial 1k, 2k, 50k; cubic
f = figs.nth(1); await f.scrollIntoViewIfNeeded();
const r1 = f.locator("input[type=range]").first();
for (const [name, idx] of [["1k", "0"], ["2k", "1"], ["10k", "3"], ["50k", "5"]]) { await r1.fill(idx); await p.waitForTimeout(idx === "5" ? 4000 : 1200); await f.screenshot({ path: `${O}f2-f1-${name}.png` }); }
await f.getByRole("button", { name: "cubic" }).click(); await p.waitForTimeout(4000); await f.screenshot({ path: O + "f2-f1-50k-cubic.png" });
// F2: default (the fit), rho 0, nu 0.5, hover a far cell
f = figs.nth(2); await f.scrollIntoViewIfNeeded();
const rr = f.locator("input[type=range]").nth(0); const rn = f.locator("input[type=range]").nth(1);
await rr.fill("18"); await p.waitForTimeout(400); await f.screenshot({ path: O + "f2-f2-rho0.png" });
await rr.fill("0"); await rn.fill("0"); await p.waitForTimeout(400); await f.screenshot({ path: O + "f2-f2-corner.png" });
{ const svg = f.locator("svg.f2-heat").first(); const bb = await svg.boundingBox(); await p.mouse.move(bb.x + bb.width * 0.55, bb.y + bb.height * 0.6); await p.waitForTimeout(400); await f.screenshot({ path: O + "f2-f2-hover.png" }); await p.mouse.move(0, 0); }
// F3: step to the end with seed F, then sigma, T; bump dial 1 and 12
f = figs.nth(3); await f.scrollIntoViewIfNeeded();
for (let s = 0; s < 5; s++) await f.getByRole("button", { name: "Forward" }).click();
await p.waitForTimeout(500); await f.screenshot({ path: O + "f2-f3-F-end.png" });
await f.locator(".seg button", { hasText: "σ" }).click(); await p.waitForTimeout(400); await f.screenshot({ path: O + "f2-f3-sigma.png" });
await f.locator(".seg button", { hasText: "T" }).click(); await p.waitForTimeout(400); await f.screenshot({ path: O + "f2-f3-T.png" });
const r3 = f.locator("input[type=range]").first();
await r3.fill("1"); await p.waitForTimeout(400); await f.screenshot({ path: O + "f2-f3-bump1.png" });
await r3.fill("12"); await p.waitForTimeout(400); await f.screenshot({ path: O + "f2-f3-bump12.png" });
// phone
const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
m.on("pageerror", (e) => errors.push("PHONE PAGEERROR " + e.message));
m.on("console", (msg) => { if (msg.type() === "error" || msg.type() === "assert") errors.push("PHONE " + msg.text()); });
await m.goto("http://localhost:4230/fe-academy/#/F2"); await m.waitForSelector("figure.figure"); await m.waitForTimeout(3000);
await m.locator("figure.figure").nth(0).getByRole("button", { name: "wait", exact: true }).click(); await m.waitForTimeout(500);
await m.locator("figure.figure").nth(0).getByRole("button", { name: "Forward" }).click(); await m.waitForTimeout(400);
const mf = m.locator("figure.figure");
for (let i = 0; i < 4; i++) { await mf.nth(i).scrollIntoViewIfNeeded(); await m.waitForTimeout(400); await mf.nth(i).screenshot({ path: `${O}f2-phone-f${i}.png` }); }
const sw = await m.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); console.log("phone scrollWidth/clientWidth", sw);
// dark theme
const d = await (await b.newContext({ viewport: { width: 1000, height: 900 } })).newPage();
await d.addInitScript(() => localStorage.setItem("fe-theme", "dark"));
await d.goto("http://localhost:4230/fe-academy/#/F2"); await d.waitForSelector("figure.figure"); await d.waitForTimeout(3000);
let df = d.locator("figure.figure:visible").nth(0); await df.getByRole("button", { name: "Forward" }).click(); await d.waitForTimeout(400); await df.screenshot({ path: O + "f2-f0-dark.png" });
df = d.locator("figure.figure:visible").nth(2); await df.scrollIntoViewIfNeeded(); await d.waitForTimeout(400); await df.screenshot({ path: O + "f2-f2-dark.png" });
df = d.locator("figure.figure:visible").nth(3); await df.scrollIntoViewIfNeeded(); await d.waitForTimeout(400); await df.screenshot({ path: O + "f2-f3-dark.png" });
console.log("errors", errors);
await b.close();
