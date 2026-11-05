# Decisions log

One line per decision, newest first. Product decisions in the charter are not repeated here.

- 2026-10-22 — **Animation + voice machinery** added for all chapters: `ui/Timeline` (scrubbable segments with synced captions, speed, part buttons) and `ui/narration` (browser speech synthesis read-aloud, one global toggle remembered per browser; the timeline holds a segment's last frame until its narration ends). A studio voice (recorded audio) can replace speech synthesis behind the same `speak/stop/speaking` interface later.
- 2026-10-22 — **Story-led openings are allowed in track A onward** (A1 opens on two savers), consistent with the foundations rule: finance *objects* (balances, returns) may carry a chapter, finance *jargon* arrives after the mathematics.
- 2026-10-22 — Bug fixed in `ui/Plot`: clip-path ids were shared across plots on a page; now unique per plot (`useId`). Labels get a surface-coloured halo.

- 2026-10-21 — **House style (sponsor, after playing 0.1 v2): inline-live figures are the default feel; step-through where a derivation or algorithm needs it. No ceiling on form** — animation, narrated clips, built-up relatable examples and anything else are welcome when they teach the idea best.

- 2026-10-21 — **Foundations chapters (track 0, and the maths-only parts of A and B) are taught as mathematics.** No market framing in the opening or the body; the finance connection goes in a short, collapsed "Where you will meet this again" note at the end. (Sponsor review of 0.1 v1: the market opening made a refresher carry two unknowns at once.)
- 2026-10-21 — **Dark mode gets its own text tokens** (`--truth-text`, `--approx-text`, `--error-text`): curve colours stay validated for marks, text wearing a role colour is lighter. (Sponsor: blue text on the dark figure surface was hard to read.)
- 2026-10-21 — **Hosting**: repo made public by the sponsor so GitHub Pages works on the free plan; builds are also published as private Claude artifact links for review. Private hosting alternative if ever needed: Cloudflare Pages (free, supports private repos) or GitHub Pro.
- 2026-10-21 — **Stack as built**: Vite + React + TypeScript, D3 scales/shapes in hand-written SVG (no Plotly — full control, small), KaTeX with a `\tok{role}{…}` macro for colour-locked symbols, self-hosted fonts (Newsreader + IBM Plex Sans), Vitest against Python answer-key fixtures, Playwright screenshots for visual checks.

## 2026-10-23 — Research sprint complete; build paused for discussion
- Sprint output: `research/style/{engagement,modes,fresher-critique,manim-feasibility,style-guide-draft}.md`, `research/r1/A3…D2.md` (16 notes), `clips/` (Manim recipe + theme + test scene). Discussion pack: `docs/discussion-pack-2026-10-23.md` (mirrored in the Project docs).
- Pending sponsor decisions S1–S9 and the per-chapter picks; no chapter is built until its storyboard is approved.
- Manim Community 0.22 confirmed working in the workspace (both themes from one script via `THEME=dark`); clips are an allowed mode.
- Recorded: A1 and A2 are v1; their v2 list is `style-guide-draft.md` §7.

## 2026-10-23 — Sponsor answers to the discussion pack
- Charter §2 amended: **lightness** — pages must not feel heavy; maths serves the picture, derivations collapsible; "would a tired fresher keep reading" is the first test.
- S1–S9 accepted, with the caveat that S1/S2 are guidance, not hard rules: use whatever procedure suits the topic.
- Per chapter: A3 real rates (FRED GS1/GS3 if simpler), comic OK; A4 bowl, DF (simplest); A5 whichever is easier; B1 try 3-state, real rain data; B2 casino kept; B3 comic first then zoom; **B4 is the showcase — both the square and the tiles, most interactive, best chapter of the series (reviewer's favourite topic, may be the demo)**; B5 simpler; B6 clip OK; C1 simpler; C2 as recommended; **C3 very important — maximally interactive, easy, addictive**; C4 3-D surface, one running example; D1, D2 simpler.
- Data received: NIFTY 50 daily, 23-Oct-2025 → 23-Oct-2026 (`data/nifty/`, 248 days, ann. vol 13.9 %, worst day −3.3 %); NSE NIFTY option chain screenshot 23-Oct-2026 (`data/option-chain/`, strikes 22,250–23,050 with call/put IVs — a real smile slice). Vol-surface page (tradingalgo) is JS-only and blocked from the workspace; term sheet to follow; Tsay file unavailable.
- Antigravity: Gemini Argon not available on the sponsor's plan there. Reviewer model in Antigravity = Claude Opus 4.6 (Thinking); optionally a second pass of `reviews/summary.md` through Gemini Argon in the Gemini app.
- Order of work accepted: style sprint → A1/A2 v2 → A3 onward with storyboard approval.

## 2026-10-28 — B4 storyboard approved; v2 chapters live
- B4 storyboard v1 approved: bet opener (puzzle in collapsed panel), coin flips throughout, break-it fan is enough money, and — sponsor's amendment — Manim clips IN ADDITION to the pressable figures (a "watch" beat before each of the two main figures).
- 0.1, 0.2, A1, A2 v2 (lightness passes) deployed. GitHub Pages had been switched off since 23 Oct; sponsor re-enabled Source = GitHub Actions on 28 Oct.
- 2026-10-28: Chapter B4 built from the approved storyboard (8 figures incl. two Manim clips) and deployed; NIFTY 2016–2026 series complete (2,679 returns, no gaps).
- 2026-10-28: A3 storyboard approved (Bank Nifty artefact; Twins one panel; one 15-s clip for the residuals-in-time beat).
- 2026-10-28: Chapter A3 built and deployed (bank index simulated until the NIFTY BANK file arrives; series.ts switches).
- 2026-10-29: Three reviews (pattern, B4 vs world, A3 vs world) → `reviews/`. Fix pass applied to B4 and A3; style guide amended (items 11–16): closing sections optional, clips inside figures, characters earn their place, "real" means all of it, ≤2 controls/≤3 readouts, three new arc shapes. A4 will use the game-as-spine arc.
- 2026-10-29 (evening): storyboards approved as drafted (all "my pick"s): **B5** (70 %, exact quantiles for the 2,000 dots, keep the range toggle), **B6** (trinomial grid, clip in price, keep the step-too-far toggle), **C1** (bounds as thin lines + collapsed Hull tables, one strike 22,600 on the shelf, free-typed put in the break-it), **C2** (typed guess + dial, mini board for F0–F3 and the full Galton component in F4, sawtooth observe-only). Build order: C1, C2, B5, B6. A4, A5, B1, B2, B3 still awaiting review.

## 2026-11-04
- B5 and B6 built and pushed (routes `#/B5`, `#/B6`). All storyboard decisions for B5, B6, C1, C2 were approved as the author's picks (see the storyboards' "Decisions" sections). Built set now: 0.1, 0.2, A1, A2, A3, B4, B5, B6, C1, C2.
- Clip posters are cut at a moment when no caption is mid-transform (B6 poster was garbled at t≈0.5 s; now t = 2.6 s). Rule for `clips/README.md`: pick the poster time by eye.
- Next in the queue while A4/A5/B1/B2/B3 await review: storyboard C3 (showcase level — "very interactive, easy and addictive"), then C4 (3-D), C5, D1, D2.
- C3 storyboard drafted (`research/storyboards/C3.md`, Project doc 13), awaiting sign-off. Finding while drafting: NSE's printed IV column on the 23 Oct chain is reproduced exactly (rms ₹0.04 over 34 prices) by spot Black–Scholes with S = 22,600, r = 10 %, T = 11 days → expiry Tue 3 Nov 2026. That settles C1's open data ask (spot ≈ 22,600, expiry 3 Nov) and gives C3 its last figure: calls and puts carry different printed IVs (≈ 13.7 % vs 18.1 %) only because NSE feeds the model a 10 % forward (22,668); at the chain's own forward (22,603) both collapse to ≈ 15.9 %.
- C4 storyboard drafted (`research/storyboards/C4.md`, Project doc 14): same real row as C3, Raj short 100 lots, the real Fri→Mon day (22,600 → 22,753, three days of theta), 3-D surface built from C3's curve. Awaiting sign-off.
- B4 residuals from the 29 Oct review closed: F3 drops its 0.1 reprise (now 5 steps, one control); F5 reports the simulated ÷ true ratio with a ± band (two standard errors) and colours it by whether the gap exceeds the band.
- D1 storyboard drafted (`research/storyboards/D1.md`, Project doc 15): Raj's real position hedged daily on the real closes to the 3 Nov expiry; four figures. **Data ask:** NIFTY closes 29 Oct, 30 Oct, 2 Nov, 3 Nov 2026 and the 3 Nov settlement print.
- Storyboards now awaiting review: A4, A5, B1, B2, B3, C3, C4, D1 (Project docs 04–08, 13–15).
- 2026-11-04 (evening): **C3, C4, D1 storyboards approved as drafted** (all "my pick"s): C3 — real NIFTY row throughout, Raj's four panels with one tick button, five rounds then Newton, Figure 5 kept; C4 — real row with Raj short 100 lots, Three.js surface built by stacking (heat-map fallback), the one real Fri→Mon day, theta per calendar day; D1 — the real week on the real position, wobble dial in Figure 3, "which vol" as two collapsed paragraphs. Build order: C3, C4, D1. D2 storyboard drafted (Project doc 16), awaiting review along with A4, A5, B1, B2, B3.
- 2026-11-04 (21:24): **D2 storyboard approved as drafted** (fat-tail record kept, raw negative butterflies shown, textbook surface until a second NIFTY expiry arrives, sticky rules as two sentences). Build order after C3/C4/D1: D2. Awaiting review: A4, A5, B1, B2, B3.

## 2026-11-05
- C3 and C4 built and pushed (`#/C3`, `#/C4`). Built set: 0.1, 0.2, A1, A2, A3, B4, B5, B6, C1, C2, C3, C4. Known rough edges logged for a later polish pass: C4 F2's "along time" camera shows the far wall grid through the surface; F2's stack→WebGL swap has no cross-fade; the heat-map fallback is coded but not screenshot-verified (headless Chromium had WebGL).
- C3 figure numbers corrected against the engine: share above 22,600 at 30 % is 49.1 % (not 48.1 %); Raj's ±100 panel cancels to ₹3.20 (the bend), his tick moves are ±90–280 points so the hedged line stays flat at the dial's own 15.9 %.
- Independent review of C1/C2/B5/B6 (`reviews/C1-C2-B5-B6-review.md`): correctness items being fixed; three storyboard-changing items put to the sponsor (C2 opening board, B6 clip on the 42-stock, C1 F3 tip-to-tail).
- Review fix pass on C1/C2/B5/B6 landed (items 1, 2, 4, 5, 7, 8, 11 and the small ones of `reviews/C1-C2-B5-B6-review.md`): no lock inside the spread (and the real 361.95 print is outside the quoted spread — the no-lock rule covers it explicitly); B5's ticket named as the right to buy at 21 and the wide board's payoff of 2 said out loud; result cards "right" only at 0.633 ± 0.01; B6 standfirst prints 4.76 ± 0.05; C2 F3 reads the tree; B6 F1 tick uses the drawn ±1 SE band; label collisions; comma ticks ≥ 10,000. Open for the sponsor: items 3 (C2's opening board), 6 (C1 F3 tip-to-tail), B6 clip on the 42-stock; deferred polish: items 9, 10, 12.
- D1 built and pushed (`#/D1`): the real week so far (three closes) then a labelled simulated tail until the 29 Oct–3 Nov closes arrive; the result card stays provisional until then. Data ask stands: NIFTY closes 29, 30 Oct, 2, 3 Nov 2026 (+ the 3 Nov settlement).
