# A3 — Regression and its failure modes · independent review (2026-10-29)

_Read: charter §2 (incl. lightness amendment) and §3; `research/r1/A3.md`; `research/storyboards/A3.md`; `Chapter.tsx` and all eight figure files; `clips/a3_residuals.py`; 14 screenshots (light/dark, 1100 and 390 px). Thirteen outside pages opened (§4; statquest.org refused the fetch, so StatQuest is judged from published lecture notes on it, flagged). Nothing outside `reviews/` was touched._

## 1. Coverage against the syllabus and the note

**Taught, and taught well.** The note's one sentence — "every 'how sure' number under it is a lie" — holds from standfirst to conclusion. All four failures are present with a fix each: White; Newey–West / difference; drop-or-combine / VIF; difference / "R² > DW". Robust SEs are *shown* as three t-ratios on one slope (F3 step 6 — Tsay p. 87 reproduced). Durbin–Watson is a habit, not a formula. The hedge ratio has stakes. No free resource I opened does all this on one page.

**"Why OLS" is present but thin.** F1: "the line is the one that makes the shaded squares as small as possible in total — that is all 'least squares' means"; F6 lets you drag against the squares. Enough for a fresher. Missing: why squares, and the projection one-liner (leftovers sum to zero, uncorrelated with x) that note §6 said "Panel 1 draws". It doesn't.

**R² is never explained.** F0 opens with "read the score, R²" as if known. The charter assumes nothing beyond intro probability. StatQuest's SS(mean) vs SS(fit) is one sentence and one picture; the chapter has neither, so the opening bet is partly blind.

**t and "the textbook test" are used, not taught.** "|t|" appears in F0, F3 ("t = slope / SE"), F4 ("pass the textbook test (|t| > 2)"). Neither "2" nor the link to 0.2's normal band is ever stated. One collapsed panel — SE is the spread of the slope you'd get from a fresh sample; ±2 SE is 0.2's 95 % band; |t| > 2 means "the band excludes zero" — closes the gap for the whole chapter.

**Absent:** endogeneity (note §6 scheduled "one panel … deferred to G1" — not even the sentence); in-sample vs out-of-sample; outliers, leverage, curvature (Anscombe II–IV) — the *first* failures a fresher meets. **Over-weighted:** spurious regression gets F0, F2 panel 4, three rounds of F4 and F5's "wander" — half the page; heteroskedasticity gets one panel whose numbers don't land and one toggle whose fan is invisible (§2).

**A contradiction a fresher will trip on.** Standfirst: "The slope is usually fine." F3 step 5: "the slope itself moves, because a hedge on levels is a hedge on the trend" (0.77 → 1.37). Step 6, one click later: "The slope never changed." Conclusion: "none of them changes the line much." For the Drunks and a drifting beta the slope is the wrong number, and the chapter says so and unsays it on consecutive steps.

## 2. Figure by figure

**F0 — two coin piles (game + bet).** Right hook, right mode. But the storyboard promised "Pure noise gives R² = 0.8 within a few tries", and the chapter's own `rateOver` prints "over 0.8 one in 54" at 50 days — the note's "71 %" was the *t-test* rate, not P(R² > 0.8). So screenshot F0-3 shows **"You called it"** beside a best R² of 0.36. A fresher learns the page's verdicts are unreliable. Re-ask the bet as "will the textbook test call it real (|t| > 2)?" — 70–98 %, and the real shock. Illustrative without caption: yes. Better elsewhere: Tyler Vigen (https://www.tylervigen.com/spurious-correlations) gets the laugh first, then the reason ("non-independent observations … naive p-value overstates significance"); we have the reason and not the laugh.

**F1 — the honest fit (static).** The setosa squares (https://setosa.io/ev/ordinary-least-squares-regression/); they read without caption. The screenshot shows the formula clipped at "how-sure ≈ ±" — the known duplicate-block bug, re-check after the fix. The "flat band of noise" is nine dots at 360×200: not yet a band. Better elsewhere: Seeing Theory (https://seeing-theory.brown.edu/regression-analysis/index.html) opens on **Anscombe's quartet** with draggable points — "same line, four different clouds" in one gesture, the ideal opener for a chapter titled "the line is half the answer". We have it nowhere.

**F2 — the four liars (comic).** Right mode; the panel *numbers* betray it. Funnel: "Your ± 0.31 is really ± 0.33" — 6 % is rounding, not a lie, because the fan is symmetric about the centre (`0.3 + 2.2·|v − 5.5|`), where White ≈ naive. Jim Frost's cone (https://statisticsbyjim.com/regression/heteroscedasticity-regression/) fans one way; the storyboard's own line was "±2 while the right-hand points scatter ±10". One-sided fan → 2–3×. Echo is the best panel on the page ("You counted 200 fresh coins; you had about 11") — the effective-sample-size sentence beats every outside source. Twins: the Analysis Factor circles (https://theanalysisfactor.com/multicollinearity-explained-visually), but the text reads "the credit is 0 to me and 2 to my twin, each ± 10" — the storyboard promised "+50 / −49", which lands; 0 and 2 read as mild disagreement. Drunks: the code hunts for a seed with R² > 0.8 and says so ("pair number N that we tried") — honest. Without captions, Funnel and Echo work; Twins and Drunks don't (circles say "overlap", a tilted cloud is just a tilted cloud).

**3a — the clip.** The right thing to animate; clean beats. But "2016 → 2026, one point per trading day" sits over a simulated series and the clip carries no label — it is a video, so the label must be baked into the render. It also duplicates F3 step 3 within one scroll; the storyboard wanted the clip "followed by the pressable version", not the same drawing twice.

**F3 — the hedge that drifted (step-through + bet).** Judged first on what it will be with the real NIFTY BANK file: the strongest figure, closest to Concept A. Drag, bet, watch, ACF, "use daily changes", three t-ratios — six steps is the most a fresher will take, and the StepThrough pane carries it. Real data will supply the two things that matter: leftovers on one side of zero for months (any two Indian indices over 2016–2026 do this) and a changes-slope that differs from the levels-slope. What it will *not* supply is the tidy "beta drifts 1.6 → 1.1" that `series.ts` builds in (`beta = 1.6 − 0.5·i/n`); captions must not promise a direction, and step 5's "a hedge on levels is a hedge on the trend" must be re-checked against the real numbers. Engine needs nothing new.

Until then it is mislabelled. The prompt opens "**Real artefact:** NIFTY 50 … against a bank index (simulated)": "Real" is the first word, the parenthesis the last, and the prose says "Here is one from the desk". The storyboard's own data-ask required "two simulated series labelled as such". When `pair.real` is false the prompt should begin "**Half real:** NIFTY 50 is the NSE file; the bank index is a stand-in we simulated with a drifting beta, so the leftovers wander by construction. The real NIFTY BANK replaces it when it arrives" — same words in the prose and on the clip's title card.

Data-independent faults: the residual axis is in index points (±4,000) while the bet is a slope ± (0.01 / 0.05 / 0.2) — two scales, no sentence joining them. The "honest" ± is Newey–West with **L = 4** on ~2,500 days whose leftovers "remember for months"; the page admits the result is "generous", yet the bet is *scored* against it. Tsay's rule gives L ≈ 8; for a unit-root residual no L suffices — the real lesson is "difference", so score against the changes regression. The closing tiles show White's t (151.6) *above* textbook (147.6): "lets the leftovers fan out" yielding *more* confidence contradicts the caption beside it.

**F4 — fool it, then catch it (game).** Round 2's waffle ("98 in every 100 coin-pile pairs of 2,000 days pass the textbook test") is the best frame on the page — the r-bloggers table (https://www.r-bloggers.com/2019/06/spurious-correlations-and-random-walks/) turned into a picture, and better than the source. Round 3's red "R² > DW → suspect" is the Estima/metricgate rule made visible. Round 4's "noisy" class (real, low R², t still > 2) pre-empts "regression is useless" as the note asked. Faults: round 4, the payoff, is two Segmented clicks deep; the "fooled N %" readout and the waffle say the same thing.

**F5 — the detective's card (break-it).** Good copy; wrong plot. The lower panel is residuals **in index order** for an i.i.d.-x cloud, so with "fan" on the fan is invisible (F5-2: flat band, White 0.09 vs naive 0.07). A fan only shows as residual-vs-x. The Twins get numbers ("0.88 on x and −0.06 on its twin, standard errors 0.63 and 0.63") and no picture. Four toggles, "new cloud" and seven readouts is "three sliders" in a different coat.

**F6 — sandbox.** Draggable setosa; good. But "honest SE (Newey–West)" on **twelve cross-sectional points** is meaningless, and in both screenshots it is *smaller* than naive (0.04 vs 0.14; 0.16 vs 0.22) while the caption promises "the honest SE leaves the naive one behind". It contradicts itself on first load. Drop the readout.

## 3. Immersion and simplicity — the fresher test

I would stop **at F3 step 4**: after a bet, a static, four panels, a clip and three steps, the reader meets twenty bars labelled "memory of the leftovers" with an unexplained dashed 2/√n line. The full page is 8,200 px tall at 1100 wide and ~7,800 words of source — about four times B4, for a topic the charter ranks below B4.

It is a template. B4: "bet → comic → explorable → step-through → guess+ledger → break-it". A3: "game → static → comic → clip → step-through → game → break-it → sandbox", the same four closers ("So what is …?", "Use it yourself", "Where it is used, every day", "The conclusion"), the same Ada/Mel beats ("Pictures are easy to make up. Show me one that happened" / "So more data fixes it"). The tell: two games (F0, F4), two draggable scatters (F3 step 2, F6), two drawings of one residual series (clip, F3 step 3).

Heavy where it should be light: "White", "Newey–West", "HAC", "Durbin–Watson", "VIF", "lag", "ACF", "log-returns" all appear before being introduced (the formula panel is collapsed — fine). Thin where it should be solid: R², SE, t. After F2 a tired fresher keeps reading; after F3, I think not.

## 4. Comparison table

| Resource (opened) | Its best move | Ours | Verdict |
|---|---|---|---|
| setosa.io OLS (shell only; body is JS) | Squares on each residual; drag a point, the line snaps | F1 still; F6 draggable | **Have it** |
| Seeing Theory, Regression | Opens on Anscombe's quartet, drag points on each | Nothing | **Miss** — cheapest "same line, different data" |
| Anscombe's quartet (Wikipedia) | Identical slope/R²: linear, curve, outlier, leverage | No curve, outlier or leverage anywhere | **Miss** — the failures a fresher meets first |
| Datasaurus Dozen (Autodesk) | Same stats, a dinosaur: "never trust summary statistics alone" | F0 says it in words, time-series only | **Partial** |
| Tyler Vigen | Laugh first; then "non-independent observations" | One line in F2 | **Miss the laugh**, have the reason |
| Statistics By Jim, heteroskedasticity | One-sided cone; "p-values smaller than they should be"; a fix changes the picture | F2 symmetric fan (0.31 vs 0.33); F5 fan invisible | **Miss** — our numbers refute our caption |
| Statistics By Jim, multicollinearity | VIF > 5; "does not influence the predictions"; centering fix | VIF readout; "the fit is perfect"; no fix shown | **Have it**, thinner |
| Analysis Factor, overlapping shapes | Shared slice "can't be attributed to either predictor alone" | F2 circles, "the sliver that differs decides everything" | **Have it**, equal |
| r-bloggers, random walks | Table n = 50…2,000: % significant 71 → 97 | F4 waffle + slider | **Beat it** |
| Wikipedia, Newey–West | L = 0 recovers White; a lag rule | L = 4 fixed, admitted "generous" | **Have the formula, miss the rule** |
| StatQuest (via notes; site refused) | Worst line is the mean; SS(mean) vs SS(fit); "how much of the variation … can be explained"; then p *because* R² fails at n = 2 | R² and \|t\| > 2 used, never explained | **Miss** — makes two of our bets blind |
| metricgate Granger–Newbold | "if R² exceeds DW, treat the regression with suspicion"; R²-vs-DW scatter of 200 pairs with *your* point as a red diamond; remedy: unit-root → cointegration → difference only if none | Same rule as a badge; difference as sole remedy; round 4 "real" pairs are noise-around-A, not cointegrated walks | **Have the rule**, miss the scatter and the caveat |
| Residual Plot Analyzer (MicroSim) | Random / curved / fan side by side; Quiz Mode hides the pattern and asks you to name it | No curve; no "name the pattern" | **Miss** — cheaper than ten pairs and *is* the habit |
| Time-Series Lab ch. 17 "Fake Regression Generator" | n, drift, levels/differences, seed; β, R², t, DW together | F4 round 3, same plus plots | **Beat it** |

Net: on time-series failures the chapter is at or above the best free pages; on "what regression is" and cross-sectional failures it is below Seeing Theory and Anscombe.

## 5. Ten changes, ranked by impact

1. **Fix the F0 bet so the verdict matches the screen.** Bet on "will the textbook test call it real (|t| > 2)?"; or show "one in 54" *before* the bet.
2. **Resolve the slope contradiction.** One message — "fine under a fan or an echo; *wrong* when both series wander" — in standfirst, step 6 and conclusion. Delete "The slope never changed."
3. **Add Anscombe's quartet as F1b**, draggable (Seeing Theory): outlier, leverage, curvature in one still.
4. **One collapsed panel on R², SE, ±2, t** with StatQuest's SS(mean) vs SS(fit) picture.
5. **Make the Funnel lie**: one-sided fan, ratio 2–3×, "±2 vs ±10"; in F5 plot residual-vs-x when "fan" is on.
6. **Relabel F3, the prose and the clip "Half real" until NIFTY BANK arrives**; describe the drift as "by construction"; re-check step 5 against the real file.
7. **Score F3's bet against the changes regression**, use Tsay's lag rule for the tile, keep the admission that HAC can't rescue a unit-root residual.
8. **Cut duplicates**: clip *or* step 3; F6's HAC readout; "fooled %" *or* the waffle. Five figures, not eight.
9. **Promote F4 round 4** to the top of its figure; give the Twins a picture in F5 (two coefficient bars swinging across re-seeds).
10. **Twins get +50/−49**; add the endogeneity sentence the note scheduled.

## 6. Verdict

The chapter picks the right hook, the right body mode and the right spine, and on spurious regression it beats every free page I opened — the waffle of "98 in 100 pairs pass the test" is the best single frame here. But it is not yet trustworthy: F0 congratulates a reader for a number the screen never showed; the Funnel's own numbers (0.31 vs 0.33) refute its caption; the sandbox's "honest" SE comes out *smaller* than naive; the slope is "usually fine" in paragraph one and doubles in Figure 3; and a simulated series is introduced as "Real artefact" and "one from the desk". It leans on R², SE and t without teaching them, has no outlier, curve or leverage case, and runs B4's skeleton at four times B4's length. Fix the five number-vs-caption mismatches, relabel the data, add Anscombe and a four-line R²/t panel, cut the duplicates, and this becomes the best page on the topic I know of. As it stands a tired fresher stops at Figure 3 step 4, half-convinced and wrongly reassured.
