# Decisions log

One line per decision, newest first. Product decisions in the charter are not repeated here.

- 2026-10-21 — **House style (sponsor, after playing 0.1 v2): inline-live figures are the default feel; step-through where a derivation or algorithm needs it. No ceiling on form** — animation, narrated clips, built-up relatable examples and anything else are welcome when they teach the idea best.

- 2026-10-21 — **Foundations chapters (track 0, and the maths-only parts of A and B) are taught as mathematics.** No market framing in the opening or the body; the finance connection goes in a short, collapsed "Where you will meet this again" note at the end. (Sponsor review of 0.1 v1: the market opening made a refresher carry two unknowns at once.)
- 2026-10-21 — **Dark mode gets its own text tokens** (`--truth-text`, `--approx-text`, `--error-text`): curve colours stay validated for marks, text wearing a role colour is lighter. (Sponsor: blue text on the dark figure surface was hard to read.)
- 2026-10-21 — **Hosting**: repo made public by the sponsor so GitHub Pages works on the free plan; builds are also published as private Claude artifact links for review. Private hosting alternative if ever needed: Cloudflare Pages (free, supports private repos) or GitHub Pro.
- 2026-10-21 — **Stack as built**: Vite + React + TypeScript, D3 scales/shapes in hand-written SVG (no Plotly — full control, small), KaTeX with a `\tok{role}{…}` macro for colour-locked symbols, self-hosted fonts (Newsreader + IBM Plex Sans), Vitest against Python answer-key fixtures, Playwright screenshots for visual checks.
