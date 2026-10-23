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
