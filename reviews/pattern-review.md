# Pattern review — sameness and right-mode audit, six built chapters

_2026-10-29. Read: charter §2–4, `style-guide-draft.md`, `modes.md` Parts B–C, every `Chapter.tsx` and figure file for 0.1, 0.2, A1, A2, A3, B4, and the light screenshots. Blunt by request. Nothing outside `reviews/` touched._

## 1. Chapter × figure → mode

| Ch. | F0 | F1 | F2 | F3 | F4 | F5 | F6+ | Ending |
|---|---|---|---|---|---|---|---|---|
| **0.1** | **bet** (car) | sandbox → **step-through**, locking knobs | step-through (derivative table) | explorable (3 controls) | explorable (2 controls) | scrub zoom | — | paragraph + pull |
| **0.2** | **bet** on **physical sim** | step-through | click-explorable | **game** (find all ten) | explorable (4 controls) | physical sim (draw a die) | F6 step-through · F7 number-**bet** · F8 **break-it** on board · F9 **icon grid**, real | paragraph + pull |
| **A1** | **bet** + timeline | explorable (axis warp) | **comic** + **ledger** | *(folded)* | **artefact**, real | **bet** + explorable | F6 **break-it** | paragraph + pull |
| **A2** | timeline, no bet | explorable | step-through (+hidden timeline) | **bet** + drag | step-through, *simulated* matrix | **bet** + compare | F6 **break-it** (3 presets) | paragraph + next problem |
| **A3** | **bet** + **game** | **static** | **comic** (4 liars) | 3a **clip** · step-through + **bet**, half-simulated "artefact" | **game**, 3 rounds in tabs | **break-it** dashboard + card | F6 sandbox | So-what → cards → conclusion → pull |
| **B4** | **bet**, table reveal | **comic** (Ada/Mel) | 2a **clip** · metaphor machine | 3a **clip** · step-through, locking tiles | **bet** + **ledger** | **break-it** fan | F6 live substitution | So-what → Use → cards → F4 → F5 → conclusion → pull |

Arcs:

- **0.1** bet → sandbox/step-through → step-through → explorable → explorable → scrub → paragraph + pull
- **0.2** bet-on-sim → step-through → click → game → explorable → sim → step-through → bet → break-it → icon grid → paragraph + pull
- **A1** bet+timeline → explorable → comic+ledger → artefact → bet+explorable → break-it → paragraph + pull
- **A2** timeline → explorable → step-through → bet+drag → step-through → bet+compare → break-it → paragraph + next problem
- **A3** bet+game → static → comic → **clip → step-through+bet** → game → break-it → **So-what → sandbox → 3 cards → conclusion → "next thing that goes wrong"**
- **B4** bet → comic → **clip → explorable → clip → step-through** → **So-what → apply → 3 cards** → bet+ledger → break-it → **conclusion → "next thing that goes wrong"**

## 2. Sameness diagnosis

**A3 and B4 are one skeleton with the nouns swapped.** Both have: an opening bet; a Mel-is-wrong exchange; a comic with faces; a "Watch first (N seconds)" clip followed by its pressable twin; a six-step StepThrough; a break-it; the four closing sections; bold "The one sentence to say to a desk head tomorrow:"; a boxed "**The next thing that goes wrong.**" with one arrow; a footnote of avatars ("Ada keeps the squares. Mel keeps first-order books." / "Ada looks at the leftovers. Mel trusts the badge."); even the "Figure 2a / 3a" numbering. The first four chapters differ from each other — 0.2 and A1 have shapes of their own — which makes the A3/B4 convergence look like what it is: the latest two were built to the checklist, not to the topic.

*House style a reader will enjoy recognising:* the bet with a result card as opener (5 of 6; "You called it." / "Not this time — and the reason is the lesson." is a good voice); the break-it closer inside the chapter's own picture; faces as legend swatches *inside* figures (A1 F1 axes, A3 F5's card); "Assumes… That is all."; one cross-chapter number that reconciles (B4 F4's ledger landing on A1's 98.76) — recognisable because it is true, not because it is a slot.

*Template a reader will feel as mechanical:*

- **Interstitial `Says` lines.** B4: "Fine, the squares add. But each one is nothing." / "So I just write dW² = dt and move on?" / "Fine. Show me the money in a number." A3: "Pictures are easy to make up. Show me one that happened." / "So more data fixes it. Give me two thousand days." Mel is smug and wrong every time; after two the reader learns "whatever Mel says is wrong" and stops holding the belief — which kills the Muller mechanism. In A3 the pair deletes with no loss; the footnote roles were retrofitted.
- **"Watch first (22 seconds). Then you get the coin." / "Watch first (19 seconds)…" / "Watch first (15 seconds)…"** Three clips, one formula, each a passive duplicate of the figure beneath it (B4 2a's beats are F2's captions; 3a's tiles are F3's tiles; A3 3a's amber badge is F3 step 3). "The same thing in two forms" made into two figures — the rubric's Never — and it reads as "Manim works, so every chapter gets two".
- **The four closing sections** (§6.11). In B4 they fall in the *middle*: "So what is Itô's lemma? … That is the whole result" precedes the money figure F4 and the break-it F5, so the page declares itself finished and runs two more figures. A3's "Use it yourself" is a 12-point drag sandbox whose Newey–West SE is meaningless at n = 12; it fills the slot. The three cards are the banned chapter-id list, uncollapsed and boxed: "(A2's PCA is how you find out; G1 is what to do about it)".
- **"The one sentence to say to a desk head tomorrow:"** identical bold in A3 and B4. A3's is good ("the t-stat is 40 if you trust the leftovers and 10 if you don't — I looked, and I don't"). B4's is a formula in the closing paragraph: "the drift of the log is μ minus half sigma squared, and that half is not a convention" — and "not a convention" is lifted from 0.1 F1 ("That ½ is not a convention; it is the 2 from differentiating x² twice").
- **Comics that are typography.** B4 F1 panel 2 is "+1 − 1 = 0" in 26-pt orange; A1 F2 panel 1 is "+1 % − 1 % = 0". A panel that is a formula in a box is a caption with a border; the only drawn panel in B4 F1 is the pile of squares.

## 3. Right-mode audit

Best mode, no change: 0.1 F0, F1 act 2, F5; 0.2 F0, F1, F2, F5, F7, F8, F9; A1 F0, F2, F4, F6; A2 F1, F2, F3, F5; A3 F0, F1, F2, F4 round 4; B4 F2, F3, F4, F6.

Where a different mode would teach better:

| Figure | Now | Better | Why |
|---|---|---|---|
| **B4 F0** | bet → 5-row table | bet → F2's "corners" meter drawn as Δt shrinks (clip, or stills at 4 / 64 / 1024 steps) | A limit is a picture of a total settling; `0.21 1.09 1.20 0.95 0.99` makes the reader infer it. The reveal is weaker than the bet. |
| **B4 2a, 3a; A3 3a** | clip twins | delete, or make the clip step 0 of the StepThrough | Near-duplicates (rule 10); chosen for tooling. |
| **B4 F1** | 4 panels, 3 typographic | 2 drawn panels feeding F2 | Panels carry pictures, prose carries sentences. |
| **0.1 F2** | 7-step StepThrough of a table | static: the 5×5 table, diagonal lit, "4·3·2·1 = 4!" written on it | No decision, no picture; seven clicks to watch exponents fall. |
| **0.1 F3, F4; 0.2 F4** | 3–4 controls | small multiples of three values (n = 1, 2, 4; x = 1.5, 2, 2.5; n = 10, 30, 100) | Rubric first choice when three values matter. 0.2 F4 is that chapter's one slider-default figure. |
| **A1 F5** | bet + 2 sliders + toggle on a density | bet + icon grid of years ("once in 63 years": 63 squares, one rose; under the t, 1 in 1) | "A density curve with y on the axis" is the Never for a probability. |
| **A2 F0** | 50-s timeline, no commitment | a bet first ("On Lemonade's best day, is Umbrella's good or bad?") | Opener rule: a guess within 30 s. |
| **A2 F4** | step-through on "six made-up stocks… real tickers to follow" | same on six real tickers | Synthetic stand-in; mode right, object wrong. |
| **A2 F6** | segmented, 3 presets | three captioned stills with ρ inside each | Nothing is explored; the control is a page-turner. |
| **A3 F3** | 6 steps: drag + bet + leftovers + ACF + differencing + verdict | split into (a) artefact + bet + leftovers in order, (b) "same question on changes" | Three ideas in one figure. And the prompt says "**Real artefact**: NIFTY 50 … against a bank index (simulated)" — `series.ts` generates it with `beta = 1.6 − 0.5·i/n`, so the "discovery" that the leftovers wander was typed in. A1 F4's trust break, again. |
| **A3 F4** | three rounds in tabs | rounds 2+3 as one figure; the 10-pair game as its own | A game needs its own frame and visible score. |
| **A3 F5** | 4 toggles, button, 7 readouts | the detective's card *is* the figure; one toggle lights one line and one readout | "A dashboard of readouts" — the Never. `slope 0.97 R² 0.64 naive SE 0.05 White SE 0.04 Newey–West SE 0.03 Durbin–Watson 2.05` is "I do not know what I am looking at". |
| **A3 F6** | 12-point sandbox | cut, or "use it on a real pair" | Exists for §6.11; its own observe admits the slope barely moves. |
| **0.1 F1 act 1** | free 3-slider sandbox first | fold into act 2 as step 0 | A sandbox before the idea. |

## 4. Immersion

**Grab:** 0.1 (the bet options contain the arithmetic, so choosing *is* the first computation); 0.2 (click a bucket, drop, nothing to read); A1's standfirst ("Bet 1 % of your money on a fair coin every day for a year. The coin is fair — so why do you usually end the year poorer?") — the best sentence in the library; A3's coin piles with a re-roll. B4's title and standfirst grab ("why does it make every simulated stock in the world slightly too expensive?") and then the first thing on screen is a table.

**Don't:** A2. Four-sentence standfirst ending on a claim ("At the firm, every risk number… starts here"), then a 50-second narrated scatter with nothing to commit to.

**Load-bearing vs decoration.** Load-bearing: Ada/Mel in A1 (they *are* add vs multiply; the ledger is Mel's own books); the four liars in A3 (each a failure mode, face reused as legend in F2 and F5). Half: Ada/Mel in B4 F1 (two accountants is a real frame), then decoration in every interstitial. Decoration: Ada/Mel in A3 throughout; Lemonade/Umbrella in A2 after F0 — F2's axes are "x (was z₁)", F3–F6 contain no stall. Critique cause 4 reproduced in the chapter written to fix it.

**Still textbook:** A2 F2's hidden timeline — "The second becomes rho times the first plus the square root of one minus rho squared times the second" — the speech-speed derivation the critique killed, kept under "watch it instead". 0.2 F3: "In general, n(n−1)…(n−k+1) ordered picks over the k! orders of one set:". B4 F3's footnote: "a = 0.1, b = 0.3; f′ and ½f″ set to 1 so a tile's area is its increment". A3 F2's Echo reciting an effective-sample-size sum. Bug for a ticket: A3 F1 renders `how-sure ≈ ±` cut off (three `M` blocks in `F1Honest.tsx`, the first duplicating the other two).

## 5. Coverage

| Ch. | Must leave with | Effort went to | Verdict |
|---|---|---|---|
| 0.1 | Value + slope·step + ½ bend·step²; the error is the first term dropped | F1 knobs, F2 factorials (~380 lines); the error budget F5 is last and small | Mostly right; F2 over-invests in k!, which a desk never uses; "halve the step, 4× better" is what delta-gamma P&L rests on |
| 0.2 | A sum of many small independent things is a bell; the days that matter aren't | Seven figures to the bell, two on exceptions; F9 is the one they'll remember | Right, but ten figures; F3 and F6 cost most for least finance payoff |
| A1 | Multiplying leans; typical < average; real tails are fat | F4 real NIFTY, F2 ledger | Right — best-aligned chapter |
| A2 | Correlation is a shear of the middle; it says nothing about the corner | F2 Cholesky is the largest file (400 lines); the corner is one figure | Misaligned: a fresher calls `cholesky()`; the desk head cares about the corner |
| A3 | Believe the slope, audit the how-sure, plot the leftovers in order | F3 + F4 (630 lines) both on one liar; Funnel and Twins get a panel each | Right for the title; really "spurious regression" in a four-liars coat |
| B4 | Jitter squared is as big as the step; the ½ bend·wobble² toll | F2 + F3 (777 lines) mechanism; F4 + F5 (150) money — yet the page says "The mechanism is not the lesson; the use is" | Money figures are good; the ordering buries them |

## 6. Recommendations

### (a) Five rules to add or remove

1. **REMOVE §6.11 as a mandate.** The four closing sections are optional; a chapter may end on its break-it figure plus two sentences (0.2 and A1 do, and are not weaker). Keep one obligation: after the mechanism, one plain paragraph "So what is X?", one formula at most. "Use it yourself" only when the use is a *different object* from earlier figures (B4 F6 yes; A3 F6 no). "Where it is used" is three sentences, not three cards, naming at most one later chapter.
2. **ADD: a clip never duplicates the figure that follows it.** A clip is the opener's reveal, step 0 of a StepThrough, or a morph beat. "Watch first (N seconds)" is retired.
3. **ADD: characters earn their place per chapter.** Ada and Mel appear only where add-vs-multiply or first-vs-second order *is* the content. Interstitial `Says` lines are banned unless the line states a belief the reader could hold *and the next figure breaks it*. Mel is right at least once in the library. A face is a legend swatch inside a figure, not a mascot between figures.
4. **ADD: the reveal is a picture, and "real" means all of it.** A result card sits under a drawing, never under a table or a sentence alone. "Real" or "artefact" appears only when every series is real; otherwise "simulated" is in the first three words, and the lesson a figure reveals is never a parameter the author typed in.
5. **ADD: ≤ 2 controls and ≤ 3 readouts per figure; no two chapters share a closing label.** A3 F5 and 0.2 F4 are the counter-examples. "The one sentence to say to a desk head" and "The next thing that goes wrong" are phrasings, not fields: each chapter writes its own last line and its own pull, and neither contains a formula.

### (b) Three arc shapes that are not the A3/B4 skeleton

**1. Artefact-first, take it apart, rebuild it.** Open on a real, dated object with numbered hotspots and no bet — the reader *reads* it. Each figure explains one hotspot with the smallest device (a ledger row, one still, one knob). The last figure rebuilds the object from the engine over the original; the gap is the honest number. *artefact → hotspot walk → ledger → one-knob explorable → rebuild & compare → one paragraph.* No characters. Suits **C1** (a dated NIFTY option chain, parity rebuilt leg by leg), **C4** (one risk-report line in rupees), **D2** (a real vol surface), **H2** (a public autocallable term sheet).

**2. Game as spine.** One game played in rounds across the page; each figure is the next round with one new rule; theory appears only as the sentence the last round made true; the final round is where the edge appears or the bankroll histogram over 1,000 players refuses to move. *round 1 by hand → round 2, one new rule → ledger of one round → round 3, strategy picker → histogram over 1,000 players → the sentence.* Suits **B2** (doubling, stop-when-ahead, bet-on-streaks; the expected-wealth tile never moves), **D1** (the 30-day hedging game), **A4** (ten series, "which one comes home?", then the test that would have told you).

**3. Two pictures, one clock.** A split screen on a single scrubber — the same thing in two representations — with three or four illustrated stills between scrubs, one knob late, one break where the step is pushed too far. No bets, no characters. *clip pair on one clock → three captioned stills → scrub with one knob → break (it explodes) → one paragraph.* Suits **B6** (heat along a rod beside particles from the same point), **B3** (a zoom that never straightens beside one that does; white summed into brown, with the sonify beat), **C2** (tree refining to a curve beside a price tile that ignores p), **F1** (the stencil beside the surface; the unstable step as the break).

For **C5**, take modes.md Part C literally: illustrated static text, four sign-region maps, no controls. One chapter with no slider, no bet and no character is what stops the others feeling like a template.
