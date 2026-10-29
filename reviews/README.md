# reviews/

Independent reviews of built chapters. Two sources:

1. **Claude-side fresh-eyes reviews** (this folder, dated): `pattern-review.md`, `B4-review.md`, `A3-review.md`, `fresher-critique.md` (in research/style). Each compares against outside resources actually opened and lists ranked changes; `fix-plan-<date>.md` records what was acted on.
2. **Sponsor-run Antigravity review** (Claude Opus 4.6 in Antigravity, since Gemini Argon is not on the sponsor's Antigravity plan). Output lands here as `<id>.md` and `summary.md`. The prompt to paste is below; run it after `git pull` so it reviews the current pages.

## The Antigravity prompt

```
You are an independent quantitative-finance and pedagogy reviewer for an explorable-chapters
library aimed at freshers (engineers with calculus and basic probability, no finance).

Read, in this order: docs/charter.md (especially §2, the baseline knowledge to assume),
CLAUDE.md, research/style/style-guide-draft.md, and the reviews already in reviews/
(do not repeat them; confirm, contradict, or add to them).

Then review the built chapters, one at a time — the list is the `built: true` entries in
apps/web/src/syllabus.ts; each has research/r1/<id>.md or research/<id>*.md, a storyboard in
research/storyboards/<id>.md where one exists, and code in apps/web/src/chapters/<id>-*/ —
with the engines in apps/web/src/engine/, their tests, and the Python answer keys in
tests/answer-key/. Run the tests yourself: cd apps/web && npm install && npx vitest run.
Run each Python key with python3 -I.

Report, with reproducible inputs and the exact check you ran:
1. Wrong formulas or assumptions; sign, unit or normalisation errors.
2. Broken boundary cases (sigma -> 0, T -> 0, rho -> +/-1, nu -> 2, n -> 1, phi -> 1) in the
   engines or figures.
3. Claims in the chapter text not matched by the numbers the engine produces (recompute them).
4. Misleading plots: axes, scales, labels, or a simulated series presented as real.
5. Anything that assumes knowledge beyond charter §2.
6. Missing tests, with the test you would add.
7. Pedagogy: for each chapter, the single figure you would cut and the single change that
   would most help a fresher, judged by "easy to understand first, interesting second,
   interactive third".
"Looks correct" is not a finding. Rank findings by severity. Write one file per chapter,
reviews/<id>.md, and a one-page reviews/summary.md. Do not modify any file outside reviews/.
```
