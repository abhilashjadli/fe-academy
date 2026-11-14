import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await b.newContext({ viewport: { width: 1000, height: 900 } });
const p = await ctx.newPage();
const errors = [];
p.on("console", (m) => { if (m.type() === "error" || m.type() === "assert") errors.push(m.text()); });
p.on("pageerror", (e) => errors.push("PAGEERROR " + e.message));
const O = "/home/claude/shots/";
await p.addInitScript(() => localStorage.removeItem("fe-bet:g2-f0"));
const t0 = Date.now();
await p.goto("http://localhost:4230/fe-academy/#/G2"); await p.waitForSelector("figure.figure");
console.log("first figure after ms", Date.now() - t0);
await p.waitForTimeout(2500);
const figs = p.locator("figure.figure:visible"); const n = await figs.count(); console.log("figures", n);
for (let i = 0; i < n; i++) { const f = figs.nth(i); await f.scrollIntoViewIfNeeded(); await p.waitForTimeout(400); await f.screenshot({ path: `${O}g2-f${i}.png` }); }
// F0: bet, then each step at k 2, k 3, standardised k 3
let f = figs.nth(0); await f.scrollIntoViewIfNeeded();
await f.getByRole("button", { name: /about 300/ }).click(); await p.waitForTimeout(500); await f.screenshot({ path: O + "g2-f0-bet.png" });
const fwd = () => f.getByRole("button", { name: "Forward" }).click();
const reset = () => f.getByRole("button", { name: "Reset" }).click();
for (let s = 1; s <= 5; s++) { if (s > 1) await fwd(); await p.waitForTimeout(400); await f.screenshot({ path: `${O}g2-f0-k2-step${s}.png` }); }
await f.locator(".seg button", { hasText: /^3$/ }).click(); await reset(); await p.waitForTimeout(300);
for (let s = 1; s <= 5; s++) { if (s > 1) await fwd(); await p.waitForTimeout(400); await f.screenshot({ path: `${O}g2-f0-k3-step${s}.png` }); }
await f.getByRole("button", { name: /same units/ }).click(); await p.waitForTimeout(500); await f.screenshot({ path: O + "g2-f0-std-k3-step5.png" });
await reset(); await p.waitForTimeout(300); await f.screenshot({ path: O + "g2-f0-std-k3-step1.png" });
await fwd(); await p.waitForTimeout(300); await f.screenshot({ path: O + "g2-f0-std-k3-step2.png" });
await f.locator(".seg button", { hasText: /^4$/ }).click(); for (let s = 0; s < 3; s++) await fwd(); await p.waitForTimeout(400); await f.screenshot({ path: O + "g2-f0-std-k4-step5.png" });
await f.getByRole("button", { name: /same units/ }).click(); await p.waitForTimeout(400); await f.screenshot({ path: O + "g2-f0-raw-k4-step5.png" });
// F1: k 2 / 4 / 7 and the seeds
f = figs.nth(1); await f.scrollIntoViewIfNeeded();
const r1 = f.locator("input[type=range]").first();
for (const k of ["1", "2", "4", "7"]) { await r1.fill(k); await p.waitForTimeout(400); await f.screenshot({ path: `${O}g2-f1-k${k}.png` }); }
await r1.fill("4"); await f.locator(".seg button", { hasText: "seed 2" }).click(); await p.waitForTimeout(400); await f.screenshot({ path: O + "g2-f1-k4-seed2.png" });
await f.locator(".seg button", { hasText: "seed 3" }).click(); await p.waitForTimeout(400); await f.screenshot({ path: O + "g2-f1-k4-seed3.png" });
// F2: 1 / 2 / 10 components for both windows
f = figs.nth(2); await f.scrollIntoViewIfNeeded();
const r2 = f.locator("input[type=range]").first();
for (const k of ["1", "2", "10", "20"]) { await r2.fill(k); await p.waitForTimeout(400); await f.screenshot({ path: `${O}g2-f2-k${k}-mar.png` }); }
await f.locator(".seg button", { hasText: /calmest/ }).click();
for (const k of ["1", "2", "10"]) { await r2.fill(k); await p.waitForTimeout(400); await f.screenshot({ path: `${O}g2-f2-k${k}-calm.png` }); }
// F3: each step, then tanh
f = figs.nth(3); await f.scrollIntoViewIfNeeded(); await p.waitForTimeout(2000);
for (let s = 1; s <= 5; s++) { if (s > 1) await fwd(); await p.waitForTimeout(400); await f.screenshot({ path: `${O}g2-f3-lin-step${s}.png` }); }
await f.getByRole("button", { name: /tanh/ }).click(); await p.waitForTimeout(2000); await f.screenshot({ path: O + "g2-f3-tanh-step5.png" });
await reset(); await p.waitForTimeout(300); await f.screenshot({ path: O + "g2-f3-tanh-step1.png" });
await fwd(); await fwd(); await p.waitForTimeout(300); await f.screenshot({ path: O + "g2-f3-tanh-step3.png" });
// whole page
await p.screenshot({ path: O + "g2-page.png", fullPage: true });
// phone
const m = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
m.on("pageerror", (e) => errors.push("PHONE PAGEERROR " + e.message));
m.on("console", (msg) => { if (msg.type() === "error" || msg.type() === "assert") errors.push("PHONE " + msg.text()); });
await m.goto("http://localhost:4230/fe-academy/#/G2"); await m.waitForSelector("figure.figure"); await m.waitForTimeout(2500);
const mf = m.locator("figure.figure");
for (let s = 0; s < 4; s++) await mf.nth(0).getByRole("button", { name: "Forward" }).click();
await mf.nth(3).getByRole("button", { name: "Forward" }).click(); await mf.nth(3).getByRole("button", { name: "Forward" }).click(); await m.waitForTimeout(400);
for (let i = 0; i < 4; i++) { await mf.nth(i).scrollIntoViewIfNeeded(); await m.waitForTimeout(400); await mf.nth(i).screenshot({ path: `${O}g2-phone-f${i}.png` }); }
const sw = await m.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]); console.log("phone scrollWidth/clientWidth", sw);
// dark theme
const d = await (await b.newContext({ viewport: { width: 1000, height: 900 } })).newPage();
d.on("pageerror", (e) => errors.push("DARK PAGEERROR " + e.message));
await d.addInitScript(() => localStorage.setItem("fe-theme", "dark"));
await d.goto("http://localhost:4230/fe-academy/#/G2"); await d.waitForSelector("figure.figure"); await d.waitForTimeout(2500);
let df = d.locator("figure.figure:visible").nth(0); for (let s = 0; s < 4; s++) await df.getByRole("button", { name: "Forward" }).click(); await d.waitForTimeout(400); await df.screenshot({ path: O + "g2-f0-dark.png" });
df = d.locator("figure.figure:visible").nth(3); await df.scrollIntoViewIfNeeded(); for (let s = 0; s < 4; s++) await df.getByRole("button", { name: "Forward" }).click(); await d.waitForTimeout(400); await df.screenshot({ path: O + "g2-f3-dark.png" });
console.log("errors", errors);
await b.close();
