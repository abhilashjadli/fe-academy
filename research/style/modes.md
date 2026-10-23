# Illustration modes — the vocabulary of ways to show a mathematical idea

_Written 2026-10-23 for the style sprint. Companion to `research/illustration-catalogue.md` (89 techniques, B1–B89), `research/style/fresher-critique.md` (why the built chapters feel flat) and `research/style/manim-feasibility.md` (clips are cheap). The sponsor's complaint — "same sliders everywhere, one style, are we even contemplating which illustration style suits each topic?" — is a vocabulary problem: the catalogue lists *techniques* (what moves) but not *modes* (what kind of thing the figure is). This file names the modes, says which kind of idea each suits, and gives every chapter a non-slider suggestion. The R1 note for a chapter must now name its modes from this list, with a reason, before any code._

**How this relates to the catalogue.** Every B-entry is a technique inside one or more modes. A chapter picks modes first (this file, Part B rubric), then techniques (catalogue Part B), then storyboards. The mapping is in the table at the end of Part A.

**What the critique says the modes must fix.** Ranked causes of flatness in the four built chapters: (1) register, (2) every figure is the same frame — thirty-two figures, one shape, (3) no stakes or reward after a commitment, (4) abstract axes and dropped characters, (5) no real-world artefacts, (6) pages that load empty, (7) no faces, (8) no humour, (9) machine numbers. Modes 1, 2, 3, 6, 7, 8, 15 and 18 below exist largely to answer (2)–(8). The rule that follows from the critique: **at least one figure per chapter is not a `<Plot>` in a box, and no two consecutive figures are the same mode.**

---

## Part A — The modes

Each entry: definition · idea-kinds it suits (relationship / procedure / derivation / count-or-probability / feeling-for-randomness / definition / warning-or-failure / real-world object) · exemplars · how it looks in our system (Newsreader prose, Plex UI, truth-blue / approx-amber / error-rose / ghost-grey roles, `Figure` with prompt → body → observe) · build cost and component · fresher-confusion risk.

### 1. Icon / unit grids

**Definition.** A count drawn as countable things: 100 people, 1,000 days, 24 librarians-and-farmers, 4,680 weeks. Probability is the fraction of icons coloured; conditioning is dimming the rest; a rare event is one square in a wall of squares.

**Suits.** Count-or-probability above all; definition (VaR *is* the boundary between the grey and the red days); warning (one square in 10,000 is still a square). Not relationships.

**Exemplars.**
- 3Blue1Brown, *Bayes' theorem* lesson — https://www.3blue1brown.com/lessons/bayes-theorem — 210 little people, 200 farmers and 10 librarians; filter by "meek and tidy", recount 4 vs 20, the fraction 4/24 *is* the posterior; "I'd actually encourage you not to memorize the formula, but instead to draw out this diagram." Then the same idea as areas in a unit square.
- RealRisk (Winton Centre, Spiegelhalter) — https://realrisk.wintoncentre.uk/ — converts a relative risk into "around 13 in every 100 women"; the frequency-out-of-100 wording is what lay readers retain. Companion: epijim's waffle-chart post https://epijim.uk/posts/2021/waffle/index.html (300 icons; warns that icon arrays are poor for *comparing* small differences — use bars for that).
- Wait But Why "Life in Weeks" (reconstructed at https://weekplan.net/mini-tools/life-in-weeks/) — 52 squares per row, 90 rows; a rare thing is made real by making the denominator visible.
- Research caution: Judgment and Decision Making 2022 (https://dlab.sauder.ubc.ca/sjdm/journal/21/210615/jdm210615.html) — randomly scattered icons are *perceived* as a larger share than grouped ones; grouped arrays read like numbers. So: group when you want an exact count, scatter when you want "this could be any day".

**In our system.** A full-width SVG grid of small rounded squares or line-drawn person glyphs in `--ink-3`, with the counted subset in a role colour; a count readout in words ("13 of every 100"); click a square to see "that day" (date, return). A `ghost` state for "removed by conditioning", never deleted (catalogue B31).

**Cost / component.** Low. `IconGrid` (n, columns, colour function, hover/click handler, animated recolour).

**Fresher risk.** Low. The one failure is icons too small to count (cap at ~1,000 visible; past that, show one "1,000 block" tile and a counter).

### 2. Comic strip / sequential panels

**Definition.** Three to six panels, read in order, where each panel carries one step of an argument and the drawings — not the prose — are the derivation. Panels may be static or each panel may hold a tiny live figure.

**Suits.** Derivation (short ones, ≤ 6 steps), warning-or-failure (the panel where it goes wrong is a punchline), procedure. Not a feeling-for-randomness (one strip cannot show 1,000 runs).

**Exemplars.**
- Gonick & Smith, *The Cartoon Guide to Statistics*; reviewed with three other stats comics at CHANCE — https://chance.amstat.org/?p=9185 — the reviewer's finding is the design rule: Gonick works because it is "continuous prose with sketches alongside"; the *Cartoon Introduction to Statistics* fails because "most sentences are spread across many panels", a "dilution". Panels carry pictures; prose carries sentences.
- xkcd 1132, *Frequentists vs. Bayesians* — https://explainxkcd.com/1132 — three panels: the detector that lies on double-six, the p < 0.05 verdict, "Bet you $50 it hasn't". A base-rate argument in 40 words because the absurd case makes the flaw obvious.
- *Logicomix* (AMS Notices review, https://people.cs.umass.edu/~immerman/cs513/LogicomixReviewAMSnotices.pdf) — type theory taught in eleven panels of a caste society shaving each other; "the form becomes its substance". Risk noted there: vivid scenes that never happened are remembered as fact — our panels must not draw a market event that did not occur.

**In our system.** A `Comic` row: 3–6 panels at fixed aspect, hand-drawn-looking SVG (single stroke weight, `--ink`, one role colour per panel), a caption line under each in Plex, speech bubbles in Newsreader italic. Panels may be revealed one at a time (click) so the strip doubles as a step-through. Example from the critique: A1 Figure 2 (log turns a product into a sum, the ½r² tax) as four panels of Ada and Mel.

**Cost / component.** Medium (the drawing is the cost, not the code). `Comic`, `Panel`, `Bubble`; a small library of reusable avatars (see mode 3).

**Fresher risk.** Medium: a joke that assumes the concept (xkcd) teaches nothing to someone who lacks it. Panels must be readable *without* the gag.

### 3. Drawn characters with dialogue

**Definition.** Two or three named characters with faces who hold positions — one voices the misconception, one the correction, one the market. The argument is a conversation.

**Suits.** Warning-or-failure (the wrong belief gets a face), definition (a term is introduced by someone who needs it), the hard middle of a chapter (critique cause 4: characters dropped after figure 2).

**Exemplars.**
- Derek Muller's PhD (Veritasium), summarised at https://thejournal.com/articles/2015/05/05/watching-videos-does-not-necessarily-lead-to-learning.aspx — a clear expository video left scores unchanged (≈6/26) and *raised* confidence in wrong ideas; a video where a student character states the misconception and a tutor corrects it nearly doubled scores (≈12/26), and viewers called it "confusing" while working harder. This is the strongest evidence in this file: **the misconception must be spoken by someone before it is corrected.**
- *The Manga Guide to Statistics* (Takahashi), CHANCE review above — a full story carries hypothesis testing; works for self-study because exercises sit between the manga; fails where "much of the book is story rather than statistics". Ratio rule: the character speaks one sentence per idea, not a scene.
- McElreath, *Statistical Rethinking* ch. 2 (notes at https://bookdown.org/pbaumgartner/sr2-notes/02-small-and-large-worlds.html) — the "garden of forking data": "Bayesian inference is really just counting and comparing of possibilities"; the bag of four marbles and the tree of paths. A metaphor with a voice ("the golem") carried across a whole book.
- Nicky Case, *The Evolution of Trust* — https://ncase.me/trust/ — strategies are characters with faces (Copycat, Cheater, Grudger); the reader plays against them before the theory. (Page body is JS-rendered; structure confirmed from the catalogue's longform audit and https://stefy.substack.com/i/140164241/why-is-it-effective-for-learning: hook → play → explanation → sandbox.)

**In our system.** One line-drawn avatar per character (24 px, reused as the legend swatch in every figure they appear in — critique change 8), a speech line in Newsreader italic beside the figure, never more than two bubbles per beat. Characters already exist: Ada and Mel (A1), the two stalls (A2), Priya and Raj (B5 hook in `engagement.md`). The "wrong" character wears `--error`.

**Cost / component.** Low-medium. `Avatar` set (8–10 faces), `Says` (avatar + bubble). The writing discipline is the cost.

**Fresher risk.** Low if the wrong character is clearly wrong by the end of the figure; medium if the dialogue is cute without a decision.

### 4. Symbol-into-picture (formula ↔ figure binding)

**Definition.** Every symbol in a formula has a colour, and that colour is a part of the picture; tokens fly from the picture into the formula as it is assembled, or clicking a term lights its region. The formula is the last arrival and names something already seen.

**Suits.** Derivation, definition (what N(d₁) *is*), relationship (which term dominates where). This is the house mode for every formula-bearing chapter (catalogue B83, B84).

**Exemplars.**
- 3Blue1Brown Bayes lesson (above): count labels replace into the fraction; the 210 cancels; "Both sides tell you to look at all the cases where the evidence is true."
- Byrne's *Euclid* (1847), Rougeux's reproduction — https://www.c82.net/euclid/ , about page https://www.c82.net/euclid/about — colour replaces letter labels entirely: the proof *is* the coloured shapes; Rougeux added clickable shapes that identify what a step refers to and linked cross-references "(B. 1. pr. 28)". The purest form of the mode, static.
- Mathigon probability course — https://mathigon.org/course/probability/introduction — the Pascal–Fermat argument shown as outcome diagrams HHH/HHT/HTH/HTT building to the ¾–¼ split, with gated reveal ("To reveal more content, you have to complete all the activities and exercises above") and inline choice blanks ("impossible / certain").
- Bret Victor, *Explorable Explanations* — https://worrydream.com/ExplorableExplanations/ — reactive documents (Tangle): numbers in the prose are the controls; "the author must expose the model behind the argument."

**In our system.** Already partly built: `M` with `\tok{role}{...}` colour tokens, `eq-live`/`eq-dim` classes. Missing: the *flight* (a copy of the picture part animating into the formula slot) and click-a-term-to-highlight. Rule: decide the colour per symbol once per chapter (A2 §Keep of B83).

**Cost / component.** Medium. `TokenFlight` (FLIP animation from an SVG node to a KaTeX span), `TermLink` (hover/click a term ↔ region). Low once built.

**Fresher risk.** Low; this is the mode that *reduces* formula fear. Risk only when more than four colours are in play.

### 5. Physical / mechanical simulations

**Definition.** A thing with mass, pegs, springs, drops, balls — a believable physical object whose behaviour the reader already trusts — simulated in a canvas, so the maths is read off the object.

**Suits.** Feeling-for-randomness (the Galton board), relationship (a spring's restoring force → mean reversion), real-world object. Not derivations.

**Exemplars.**
- PhET *Plinko Probability* — https://transum.org/Maths/Activity/PhET/Plinko_Probability.asp (hosted PhET sim) — Galton board with a bias control and histogram; "individual random events can collectively produce a predictable pattern."
- IFA's desktop Galton board — https://www.ifa.com/galtonboard — 4,280 beads through 105 pegs in two seconds "like tossing 59,920 coins"; one golden bead marks a single trial that can land far from the mean; printed bell and Pascal overlay; explicitly used to teach market-return randomness.
- Ciechanowski, *Mechanical Watch* — https://ciechanow.ski/mechanical-watch/ — ~60 figures, each with one slider or drag, one object disassembled and rebuilt; figure 3 is a mass on a coil spring you can pull ("move the mass… watch it bounce") before torsion springs are introduced.
- Complexity Explorables — https://www.complexity-explorables.org/about — one system per explorable, D3, "as few words as possible"; the catalogue's warning stands: simulation without a measured companion panel asserts rather than shows.

**In our system.** A full-bleed `canvas` (the 0.2 Galton board and A1 `PathsStage` are the only two non-Plot bodies we have — the critique names them as the ones that work), with the measured panel beside it (histogram, running sd). Physical palette: pegs and balls in `--ink`, the counted outcome in a role colour.

**Cost / component.** Medium-high per object (each is a bespoke canvas); reuse across chapters is the saving (the Galton board serves 0.2, B1, C2, E2).

**Fresher risk.** Low for the physics; medium for the mapping ("a peg is a coin toss" must be said once in words inside the picture).

### 6. Games and challenges with a score

**Definition.** The reader makes repeated decisions against a rule, keeps a score or a bankroll, and the invariant the chapter teaches is what the score measures. Game only where the score *is* the lesson (engagement principle 13).

**Suits.** Warning-or-failure (ruin), relationship (bet size → growth), feeling-for-randomness (a streak that means nothing). Never for definitions.

**Exemplars.**
- Paul Butler, *The Kelly Criterion* — https://explore.paulbutler.org/bet/ — 60/40 coin, $25, a bet-size slider; play first, then the median-vs-bet-size chart, then an "autobet" fraction slider, then the formula 2(p − ½) confirms what the hands already found. Built on Haghani & Dewey's real-money experiment (https://arxiv.org/pdf/1701.01427): 61 finance students and professionals, 28 % went bust on a coin they were told was biased, only 21 % reached the cap.
- *Guess the Correlation* (Omar Wagih, 2016) — https://en.wikipedia.org/wiki/Guess_the_Correlation — three lives; within 0.05 earns a life and five points; 2 million guesses used to find which plot features make people over- or underestimate ρ. A perception skill trained by scoring.
- Nicky Case, *The Evolution of Trust* — https://ncase.me/trust/ — tournament scores decide which character survives; the sandbox comes last.

**In our system.** `Game` wrapper: a round counter, a bankroll or score tile in human units ("₹ left", "days survived"), a strategy picker, and a **result card** after the final round ("You said 6. Bucket 6 won. 70 % of people choose the middle; here is why") — the missing reward the critique names (cause 3). Fixed seed; "play again, new coin".

**Cost / component.** Medium. `Game`, `Bankroll`, `ResultCard`; the engine is usually tiny.

**Fresher risk.** Medium: a game with a strategy the reader cannot articulate afterwards teaches a feeling, not a fact. Each game ends with the one sentence it was built to make true.

### 7. Guess-then-reveal / predict-then-run

**Definition.** The reader commits — a number typed, a line drawn, a bucket clicked, a bet placed — before the figure shows the truth. The gap between the guess and the truth is the hook; the comparison with other readers is the reward.

**Suits.** Everything with a surprising answer: count-or-probability, relationship, warning. Opening beat of nearly every chapter.

**Exemplars.**
- NYT "You Draw It" (described at https://flowingdata.com/2019/07/12/make-charts-that-ask-readers-to-predict-the-line): draw the trend, then the data appears, then other readers' traces; "forced readers to test their own beliefs against reality". Authoring tool *They Draw It* (Northwestern MU Collective) https://mucollective.northwestern.edu/theydrawit ; Flourish "Draw the line" https://flourish.studio/blog/draw-the-line-chart/ .
- The Pudding, *Birthday Paradox* — https://pudding.cool/2018/04/birthday-paradox/ — enter your birthday, "bet" how many people are needed, watch groups of 23 built from real readers fail once then converge on 50.7 %.
- Muller's dialogue result (mode 3) is the same mechanism: a prediction the reader holds has to be made explicit before it can be replaced.

**In our system.** `Bet` (click a region / type a number / drag a line) that locks, then `Reveal` (the truth draws in over 600 ms with the guess ghosted) and `ResultCard`. Already have three bets (0.1 F1, 0.2 F0, 0.2 F8); none has a result card. "You Draw It" needs a constrained `DrawIt` (monotone or bounded) with a reference overlay (catalogue B88).

**Cost / component.** Low for click/type bets; medium for DrawIt.

**Fresher risk.** Low. The risk is embarrassment; the result card must say what fraction of people guess the same.

### 8. Annotated real artefacts

**Definition.** A real thing from the firm or the market — an option chain, a term sheet, a risk-report line, a dated price chart, a correlation matrix of real tickers — shown as itself, with hotspot callouts that name each part and a route through it.

**Suits.** Real-world object (by definition), definition (what "open interest" or "95 % 1-day VaR" is), the first 150 words of any chapter (critique change 1: "open with the firm").

**Exemplars.**
- Stock Rover, *How to Read an Option Chain* — https://www.stockrover.com/blog/how-to-read-an-option-chain/ — three screenshots of a real FB chain, calls left / puts right / strike column centre, ITM shading explained; failure modes to avoid: captions minimal so annotations live in body text, an *inaccurate* OI definition, no IV column. Our artefacts are checked against the engine.
- moomoo, *How to read an options chain* — https://www.moomoo.com/ca/learn/how-to-read-an-options-chain — NVDA screenshot with bullets per column (bid/ask, volume, OI, change); decodes the contract symbol "XXX 250317 500C"; Greeks explained from both buyer's and seller's side; one Greek bullet has the sign convention wrong — again, our numbers come from the key.
- Tufte, *Visual Explanations* (summary https://www.antoinebuteau.com/lessons-from-edward-tufte.md): the Challenger lesson — the needed display was O-ring damage against temperature for *all* flights; "labels and explanation with the visual evidence rather than in a separate key."

**In our system.** `Artefact`: an image or a rebuilt HTML table in a thin `--rule` frame with a date stamp and source line, numbered hotspots (Plex, `--accent`) that open a 20-word callout; a "walk me through it" step mode that visits the hotspots in order. Real data: dated NSE/CBOE chains, published term sheets, index histories with the three famous days labelled (critique change 6).

**Cost / component.** Low-medium (data sourcing and licensing is the cost). `Artefact`, `Hotspot`.

**Fresher risk.** Low — this is what they came for. Risk: a stale artefact (2016 FB ticker) reads as fake; every artefact carries its date.

### 9. Scrubbable animation / captioned in-browser video

**Definition.** A continuous transformation the reader watches and can scrub, pause and step; captions change at beats; optional voice. Not a parameter explorable: time is the only control.

**Suits.** Relationship that unfolds in time (t → T), a procedure with no decisions, continuum limits. Not derivations with decisions (critique: A1 F2 and A2 F2 are derivations wrongly delivered "at speech speed" — those move to StepThrough).

**Exemplars.**
- Ciechanowski (all articles): every figure animates continuously, one slider scrubs it, a global pause exists; "In the demonstration below…" then "Notice…".
- Distill, *Why Momentum Really Works* — https://distill.pub/2017/momentum/ — α and β scrubbed in the header; the damped-oscillator phase plot over 150 iterations; captions in italics under the figure with controls inline.
- Our `Timeline` (A1 F0: Ada and Mel's year, 160 paths, histogram stacking at the end) — the critique names it the right mode for F0 and the wrong one for F2.

**In our system.** `Timeline` exists; needs beat markers on the scrubber, a "step" button that jumps to the next beat, and a non-empty first frame (critique cause 6: pages load empty — the poster frame must be the finished object).

**Cost / component.** Low (exists).

**Fresher risk.** Medium: six numbers in one spoken breath (A1 F2 segment 5). Rule: one number per caption.

### 10. Rendered clips (Manim)

**Definition.** A pre-rendered 10–40 s video with a `.vtt` caption track, poster frame, scrubber and beat-step; for transformations too heavy or too choreographed for live code.

**Suits.** Continuum limits (tree → curve), morphs between representations, 3D camera moves; anything the reader should *watch, not steer* (`manim-feasibility.md`).

**Exemplars.**
- 3Blue1Brown lessons (e.g. https://www.3blue1brown.com/lessons/clt — body is JS-rendered, structure taken from the catalogue's 3b1b audits): clips between paragraphs; the brick-wall and dice-sum animations (`_2023/clt/main.py`).
- Primer, *Simulating Natural Selection* (https://www.kottke.org/19/07/simulating-natural-selection , https://flowingdata.com/2019/07/31/natural-selection-simulation/) — blobs with size/speed/sense traits, three ingredients (food, random mutation, reproduction); the chart of trait distributions runs beside the 3D scene. Agent-based clips give a feeling for randomness that a histogram cannot.
- Datasaurus Dozen — https://www.research.autodesk.com/publications/same-stats-different-graphs/ — points morph from dinosaur to star to lines while mean, sd and ρ stay fixed to two decimals; "never trust summary statistics alone."

**In our system.** `Clip` as specified in `manim-feasibility.md` (light + dark renders, ≤ 1 MB, ≤ 2 per chapter, `prefers-reduced-motion` → poster + captions). Theme module exists.

**Cost / component.** Medium (1–3 h per clip). `Clip` component to build.

**Fresher risk.** Medium: passive. Every clip is followed within one screen by a "now you" beat (guess, knob, bet).

### 11. Scroll-driven stories

**Definition.** A sticky figure beside 3–6 short text steps; scrolling mutates the figure. Used only as an opener or a short build-up, never a whole chapter (catalogue A2.11; quant readers read non-linearly).

**Suits.** A short procedure (flat line → residuals → fit → prediction), a story opener with a reveal.

**Exemplars.**
- The Pudding *Birthday Paradox* (above): hook → personal reveal → bet → 23 → live trials → "pairs grow quadratically".
- ONS digital blog, *What makes for a good scrollytelling article?* — https://digitalblog.ons.gov.uk/2021/05/24/what-makes-for-a-good-scrollytelling-article — works for "complex concepts" because text and chart are tied; "each step makes only one point"; text "short and precise".
- MLU-Explain regression scrolly (catalogue B86): steps mutate at 70 % visibility; known failures are stale text and figures resetting on re-scroll.

**In our system.** `Scrolly`: sticky `Figure` body, right-hand step cards (≤ 40 words each, Newsreader), step index visible, a "skip" link, pointer events off inside steps on mobile.

**Cost / component.** Medium. `Scrolly`.

**Fresher risk.** Medium on phones; low on desktop. Cap at six steps.

### 12. Before/after, side-by-side and small multiples

**Definition.** Two or more figures with identical axes and colours, differing in one thing: two models on the same random numbers; the same cloud before and after a shear; six parameter values as six stills.

**Suits.** Relationship across a parameter (when only three values matter, three stills beat a slider — catalogue A2.18), warning (model fan-out beyond the data), comparison of methods.

**Exemplars.**
- Anscombe's quartet and the Datasaurus Dozen (above): same statistics, four/twelve pictures.
- Tufte, *Envisioning Information*: "Repeated graphics on a common design let readers compare patterns across categories or over time" without changing visual context.
- Immersive Math figure 3.15 (https://immersivemath.com/ila/ch03_dotproduct/ch03.html): the same parameterised line stepped 1-D → 2-D → 3-D with a caption per state.

**In our system.** `Multiples`: a grid of `Plot`s with a shared scale, a shared caption strip, one highlighted panel, ghost of the "before" under the "after"; common random numbers enforced by passing one seed (catalogue B54). A `Compare` variant with a vertical split and one shared control.

**Cost / component.** Low (composition of existing `Plot`).

**Fresher risk.** High when the panels are postage stamps with machine readouts (A1 F6: "six histograms, `kurtosis 1809.1`, I do not know what I am looking at"). Rule: ≤ 4 panels, one sentence per panel inside the panel, human units.

### 13. Tables you can click and live-substitution calculators

**Definition.** A table whose cells are controls: click a column for its meaning, click a number to see the arithmetic that produced it, with the formula re-rendered with the live values substituted ("how this number was formed").

**Suits.** Procedure (a recursion), definition (what each column is), credibility (engagement principle 14: real numbers that reconcile).

**Exemplars.**
- riskhub EWMA volatility — https://riskhub.org/calculator/ewma-volatility — a "Substitution (t = 40)" block: 0.9400 × 0.00018989 + 0.0600 × 0.00010000 = 0.00018450 → 1.3583 %; weight-decay curve and half-life (11.2 obs at λ = 0.94) beside the table.
- Immersive Math — figure 3.16's e(P) readout updates as P is dragged; captions double as exercises ("place P on the dashed line"); the Aperiodical review (https://aperiodical.com/2020/06/review-immersive-linear-algebra/) notes "little active mathematical engagement" where proofs are given rather than asked — the table must ask.
- Seeing Theory regression (https://seeing-theory.brown.edu/): click a table column to get its explanation (catalogue B84).

**In our system.** `LiveTable`: rows are observations or tree nodes, a selected cell lights, and a `M` block under the table shows the recursion with the cell's numbers in role colours; a "next row" button advances the recursion. Numbers in human precision (critique cause 9: "0.93 not 9.29e-1").

**Cost / component.** Low-medium. `LiveTable`, `Substitution`.

**Fresher risk.** Low; the classic reference mode. Risk is a dashboard shown first with no story (catalogue B87 Keep).

### 14. Metaphor machines (one scene reused across a chapter)

**Definition.** One exact metaphor — a shear press, a Galton board, an axis warp, two savers — built once as a scene and reused in every figure with one more control each time, so the chapter has a single body and the reader never re-learns a picture.

**Suits.** Relationship (the metaphor *is* the relationship: "the shear is correlation"), continuity across a whole chapter. The critique's "metaphors that are exact, not decorative" are all of this kind.

**Exemplars.**
- Ciechanowski, *Sound* / *Mechanical Watch*: the plate-in-tube figure reused five times with one new control each; the watch rebuilt part by part until the closing figure equals the opening one (catalogue B8).
- Nicky Case, *Parable of the Polygons* / *Trust*: the same board, manual → automatic → one parameter → sandbox (catalogue B9).
- 3Blue1Brown linear algebra: the same grid sheared in every video of the series; the unit vectors tracked.

**In our system.** A chapter-level stage component (A1's `PathsStage`, A2's shear cloud, 0.2's board) imported by every figure; each figure adds exactly one control or one overlay; the story's characters and axes survive (critique cause 4: "A1 F3 is 'the curve she ends on' with a 'y' axis and no Mel" — the lognormal curve must be laid over *Mel's* bars).

**Cost / component.** Medium up front, then cheap. Pattern, not a component: `chapters/<id>/Stage.tsx`.

**Fresher risk.** Low. Risk is the metaphor silently changing meaning mid-chapter (0.2 F9's "wild face" left the board for a histogram — the critique's example).

### 15. Illustrated static text

**Definition.** A strong, labelled, colour-coded diagram with callouts inside the picture, no interaction, with prose that reads it. The honest choice when nothing moves that matters.

**Suits.** Definition, a relationship that is a *shape* (sign regions of vanna/volga), a reference card (payoff conventions), proofs by colour.

**Exemplars.**
- Byrne's *Euclid* (above) — colour as labelling; one of the first books in detailed colour; the proof is read off the figure.
- Tufte: data-ink; layering and separation ("contextual marks can recede while data remains visually prominent"); words, numbers and pictures "as different forms of evidence" under the same tests.
- Hull's own figures (payoff diagrams, the binomial tree with numbers in nodes) — the house figures of the field, which freshers will meet in the firm's own decks.

**In our system.** A `Static` figure: SVG with the same role palette, labels set in Plex *inside* the drawing (engagement principle 9: "words inside the picture"), a one-line caption; no control strip (dropping the grey strip is itself a visual relief — critique cause 2).

**Cost / component.** Low-medium (drawing time). `Static`, `Callout`.

**Fresher risk.** Low. Risk is a figure that could have been a sentence.

### 16. Sound / sonification

**Definition.** Data mapped to pitch, loudness or event clicks so the ear hears what the eye misses: clustering, periodicity, a random walk's memory.

**Suits.** Feeling-for-randomness only: white vs brown noise, Poisson clicks vs clustered clicks, vol clustering as loudness. Never a definition or a derivation.

**Exemplars.**
- Physics of Risk, *Colors of Noise* — https://rf.mokslasplius.lt/colors-of-noise/ — brown noise is "an integral (or sum in discrete case) of the white noise", spectral density 1/f²; the analogies (a piano played at random vs a cat walking along the keys) are already a lesson in random walk vs white noise. Any browser can synthesise both with four lines of WebAudio.
- TwoTone (https://github.com/datavized/twotone , overview at https://astrobites.org/2021/06/17/getting-started-in-sonification/) — CSV → pitch per value, tempo, instrument; no code; used by newsrooms for time series.
- Hermann, Hansen & Ritter, *Sonification of Markov-chain Monte Carlo simulations* (2001; the archive at noah.nrw was JS-gated and could not be read) — listed as the academic precedent for hearing mixing; not verified here.

**In our system.** `Sonify`: a play button on a `Plot` that plays the series as clicks (events) or as a tone whose pitch follows the value; a visible playhead; always muted by default and always with the visual equivalent. One figure in B1 (Poisson clicks vs clustered clicks), one in B3 (white → brown), one in A5 (returns as clicks with loudness = |r|).

**Cost / component.** Low (WebAudio). `Sonify`.

**Fresher risk.** Low but the payoff is narrow; a novelty if used more than once per chapter.

### 17. Physical-world analogies filmed or photographed

**Definition.** A photograph or short film of a real coin, die, desktop Galton board, or a hand drawing on paper, used as the opening image or the scale-re-establishment figure.

**Suits.** Feeling-for-randomness (a real die is more trusted than a seeded generator), scale, a warm opener.

**Exemplars.**
- IFA desktop Galton board (above): the golden bead as "one trial".
- Numberphile-style props (brown paper, physical dice) — the genre; Primer's blobs are the animated equivalent.
- Haghani & Dewey's coin experiment (above): the *photograph* of the real-money result sheet is the artefact that makes the Kelly game credible.

**In our system.** A photo in the `Artefact` frame with a date line; or a 5-second looped `Clip` of real dice. Licensing: shoot our own.

**Cost / component.** Low. Reuses `Artefact` / `Clip`.

**Fresher risk.** None; low payoff beyond the opener.

### Modes found during research that were not on the list

### 18. The ledger (worked example with real numbers, row by row)

A table that *accrues*: day, price, delta, hedge trade, cash, P&L — one row per click, the running total visible, the final number reconciling to the formula (catalogue B77, B28). Hull's worked tables and riskhub's substitution block are the sources; the CME worked P&L that "sums to 26.1 but says 18.1" is the warning. Suits procedure and credibility (engagement 14). Cost low: `Ledger` = `LiveTable` with an "add a row" button. Fresher risk low; it is the mode that turns "P&L attribution" into arithmetic they can check.

### 19. Reader-as-data (crowd participation)

The Pudding's birthday piece makes the reader's own birthday one of the trials and shows the distribution of *all readers'* guesses. Suits count-or-probability and the result card ("70 % of people choose the middle"). Needs the `db` capability (artifact database) or a static snapshot of guesses; cost medium; privacy: store only the guess. Risk: empty until there are readers — seed with 200 synthetic-but-labelled guesses.

### 20. Representation morph (one object, two coordinate systems)

The Galton board tipping into the lattice (0.2 F10), the histogram's axis warping into log scale (A1 F1), the Datasaurus. Suits the moment a chapter says "this is the same thing as that". Best as a `Clip` or a 1.5 s `Timeline`, not a figure of its own (the critique: 0.2 F10 is "a flourish that belongs as the last beat of Figure 0"). Cost low with Manim.

### 21. Reference card (one canonical representation)

Red Blob Games' hexagon page: one representation, every convention converted to it (catalogue B86). Suits C1's payoff conventions, D2's strike/delta/log-moneyness, H2's product zoo. A `Static` with a `Segmented` control to switch conventions. Cost low. Risk: a card shown before the idea reads as a syllabus.

### Subsumption: catalogue techniques → modes

| Mode | Catalogue entries it contains |
|---|---|
| 1 Icon grid | B6 (enumerate every case), B30, B31, B36, B38 |
| 2 Comic / 3 Characters | B8 (naive version fails first, as panels), B60 (the bet as dialogue), B86 (challenge sentence) |
| 4 Symbol-into-picture | B2, B83, B84, B87 (reading-level toggle) |
| 5 Physical sim | B18, B19, B21, B22, B26, B69, B73 |
| 6 Game | B29, B56, B82 (instruments on a path as score) |
| 7 Guess-then-reveal | B60, B88, B9 (manual before automatic) |
| 8 Artefact | B89 (scale re-establishment), B64 (Anscombe presets on real data) |
| 9 Scrubbable | B10, B12, B14, B16, B17, B65, B85 |
| 10 Clip | B1, B13, B23, B47, B48, B67, B68, B72 |
| 11 Scrolly | B86 (opener rule only) |
| 12 Multiples / compare | B25, B53, B54, B58, B59, B61, B62, B63 |
| 13 Live table | B3, B5, B7, B81, B87 |
| 14 Metaphor machine | B8, B9, B40, B45, B49, B66, B70, B76, B78 |
| 15 Static | B49, B50, B51, B80 (approximation ladder as stills) |
| 18 Ledger | B27, B28, B77 |
| Step-through (existing) | B4, B11, B34, B37, B74, B79, B55, B57 |
| Slider explorable (existing) | B15, B20, B33, B35, B39, B41–B46, B71, B75 |

---

## Part B — Rubric: kind of idea → mode

| Kind of idea | First choice | Second choice | Never | Why |
|---|---|---|---|---|
| **A relationship** (y changes with x; a parameter shapes a curve) | Metaphor machine with one control (14) or small multiples of three values (12) | Slider explorable, one slider, named quantity | A dashboard of readouts; a derivation step-through | A relationship is felt by *moving* one thing and watching another; three captioned stills beat a slider when only three values matter (A2.18); a formula before the move is a lecture |
| **A procedure** (an algorithm, a recursion, backward induction) | StepThrough with Back/Forward, one decision per step, controls that lock (0.1 F2 — "the best teaching device on the site") | Ledger / live table (13, 18) | Narrated Timeline or clip ("wait, say that again" has no button); a game | Procedures have order and decisions; the reader must be able to go back one frame |
| **A derivation** (why this formula) | Symbol-into-picture (4) inside a StepThrough; each step adds one symbol *and* one knob | Comic strip of ≤ 6 panels (2), characters voicing the wrong step (3) | Timeline at speech speed; a slider on the finished formula | A1 F2 and A2 F2 failed exactly here; 0.2 F6 was "correct, careful, and inert" because nothing could be wiggled |
| **A count or a probability** | Icon grid (1), grouped for exact counts | Guess-then-reveal with a result card (7); reader-as-data (19) | A density curve with "y" on the axis; a slider on p | Counts are things; "13 in every 100" is retained, "0.13" is not |
| **A feeling for randomness** | Physical simulation with a measured companion panel (5); speed ramp 1 → 100 → 10,000 | Sonification (16) as one beat; agent-based clip (10) | Static text; a single path with no "run 1,000" | One path is an anecdote (A1.5); the ear hears clustering the eye reads as noise |
| **A definition** (what a Greek, a column, a term is) | Annotated artefact (8) — the real thing with the term pointed at | Illustrated static text (15); reference card (21) | A game; a slider | A definition is a *naming*; name it on the object it lives on, dated |
| **A warning or failure** (the model breaks, the backtest lies) | Break-it button in the chapter's own metaphor machine, with the honest number kept on screen (A2.15) | Comic / character who makes the mistake (2, 3); game whose score goes to ruin (6) | A paragraph; a footnote | Muller: the misconception must be voiced then broken *in a figure*; the critique's "every chapter ends by breaking the model" is the one thing to keep |
| **A real-world object** (a chain, a term sheet, a risk report, a crash) | Annotated artefact (8), opening the chapter | Ledger built from the artefact's numbers (18); scale re-establishment photo (17) | A synthetic stand-in labelled as real (A1 F4) | "Not one real price chart… the one figure that claims real data is simulated" — the largest trust break in the critique |
| **The same thing in two forms** | Representation morph as a clip or a short Timeline beat (20) | Side-by-side with a shared control (12) | A separate figure for the morph | A morph is a sentence, not a chapter |
| **A chapter opener** | Guess-then-reveal (7) on an artefact (8) or a physical object (5) | Scrolly of ≤ 6 steps (11); a game's first round (6) | Definitions; a sandbox; an empty plot with a Play button | Something must move because the reader moved it within 30 seconds, and the first frame is never empty |

Two house rules that fall out of the rubric: **no two consecutive figures share a mode**, and **every chapter has at least one figure from modes 1, 2/3, 8 or 15** (the four that are not plots in boxes).

---

## Part C — One non-slider mode per chapter

- **0.1 Taylor series** — Restore the Figure-0 bet ("the market moves +14; which guess would you trade on?") with a result card; make the "zoom until straight" of F7 a full-bleed continuous zoom clip (10) and send log–log to a details box. (7 + 10)
- **0.2 Counting, binomial, normal** — Keep the board (5); make F3 a counting game that will not reveal until all ten pairs are found (6); the heavy tail shown *on the board* as one peg in a hundred that flings sideways (14, not a histogram). (5 + 6)
- **A1 Normal vs lognormal, fat tails** — F2 as a four-panel comic of Ada and Mel with faces (2 + 3: product → log → sum → the ½r² tax); F4 as a dated real index histogram with 1987, 2008 and 2020 labelled (8). (2 + 8)
- **A2 Dependence, Cholesky, PCA** — F4 as an annotated *real* correlation matrix of six dated tickers, read by a step-through that lights the all-positive block, then banks-vs-tech, then reveals PC1 (8 + step-through); a which-corner-fills bet before F5 (7). (8 + 7)
- **A3 Regression and failure modes** — Anscombe / Datasaurus small multiples with the same coefficient table under each (12); the spurious-regression warning as a comic: the intern reports R² = 0.9 between two random walks, the senior asks for the differences (2). (12 + 2)
- **A4 Time series, random walk vs mean reversion** — "You Draw It": draw the next 50 days, then the random-walk fan overlays (7); a ten-round game "which of these two series has a season to return to?" with a score and the test that would have answered it (6). (7 + 6)
- **A5 Volatility, EWMA, GARCH** — Sonification: daily returns as clicks with loudness = |r| — clustering is audible before it is plotted (16); the EWMA recursion as a live-substitution ledger from riskhub's pattern, one row per click (18). (16 + 18)
- **B1 Random walks, Markov chains, Poisson** — Rain on a windscreen as a physical sim with the count histogram (5); the Markov chain executed by hand, token hopping on a drawn board, before automation (14 manual → automatic); Poisson vs clustered arrivals as Geiger clicks (16). (5 + 16)
- **B2 Martingales** — A fair-game casino table drawn as a comic strip (2) with a croupier character; then a "try to beat it" game: pick doubling, stop-when-ahead, or bet-on-streaks, and watch the expected-wealth tile refuse to move while the bankroll histogram across 1,000 players appears (6). (2 + 6)
- **B3 Brownian motion, GBM, quadratic variation** — A zoom that never straightens as a scrubbable clip beside a smooth curve that does (10 + 12); hear white noise become brown noise when summed (16); quadratic variation as an odometer instrument riding the path (14). (10 + 16)
- **B4 Itô's lemma** — The nudged square as a StepThrough with locking tiles: the dx·dt and dt² tiles die, the (dW)² tile survives (4, inside step-through); two accountant characters, one who only tracks first-order terms and gets the wrong P&L (3). (4 + 3)
- **B5 Risk-neutral measure, Girsanov** — Priya and Raj with faces and dialogue (3); the change of measure as an icon grid of 100 terminal outcomes whose icons fatten or thin under the dial while the count under each payoff region is read out (1). (3 + 1)
- **B6 Feynman–Kac** — A two-panel rendered clip on one clock: heat spreading along a rod on the left, particles diffusing from the same point on the right, the same number read both ways at the end (10 + 12). (10)
- **C1 Mechanics, payoffs, parity** — An annotated real option chain (dated Nifty or SPX screenshot) with hotspots walked in order (8); put-call parity as a ledger built leg by leg, two portfolios side by side, same final column (18 + 12); a payoff reference card (21). (8 + 18)
- **C2 Binomial → Black–Scholes** — The magic-trick bet: pick any p, the price tile does not move (7); the tree refining 1 → 2 → 5 → 50 → curve as a clip (10); the 2ⁿ paths as an icon grid regrouped by number of ups (1). (7 + 10)
- **C3 Black–Scholes in detail** — Symbol-into-picture: S·N(d₁) and K·e^{−rT}·N(d₂) fly from two shaded areas into the formula (4); the derivation as a StepThrough with one decision per step (hedge, cancel dW, set drift to r); a scale-re-establishment ledger of one real 1,000-lot trade in currency (18). (4 + 18)
- **C4 Greeks I** — One real risk-report line for a position (delta, gamma, theta, vega in currency) as the opening artefact (8); the price curve as a hill with three instruments clipped to it — a slope meter, a curvature meter, a clock — reused in every figure (14). (8 + 14)
- **C5 Greeks II** — Illustrated static text: Byrne-style colour-coded sign-region maps of vanna, volga, charm over moneyness × time, as four small multiples with the sign written inside each region (15 + 12). The catalogue already flagged this chapter as illustrated text. (15)
- **D1 Delta hedging and P&L** — The 30-day hedging game: choose units per click, P&L tile at the end, result card against the gamma-vs-theta answer (6 + 7); the attribution as an accruing ledger with a histogram across 1,000 replays (18). (6 + 18)
- **D2 Implied vol, smile, surface** — The challenge: find the one σ that fits eleven real prices (fails) (7); an annotated real vol-surface screen with hotspots on skew, term structure and the ATM line (8); scrub the surface through 2007–09 (9). (7 + 8)
- **D3 Beyond Black–Scholes** — Three model-builders as characters, each fixing one failure the previous one left (3); model fan-out beyond the data as small multiples on common random numbers (12). (3 + 12)
- **E1 VaR and expected shortfall** — 1,000 trading days as an icon grid; the worst 10 turn rose; VaR is the boundary, ES is the average of the rose squares, said in words (1); the Viniar "25-sigma" opener as an artefact with a bell whose 25σ mark never arrives on screen (8). (1 + 8)
- **E2 Monte Carlo** — Real dice rolled on camera for the first ten paths (17), then the generator; a bet on how many paths are needed for ±1 in the price, with the running-total column freezing digits (7 + 13); variance-reduction switches as before/after (12). (17 + 7)
- **E3 Portfolio theory, PCA on curves** — "You Draw It" the frontier before it is drawn (7); 100 coins to spread across five assets as an icon grid that becomes the weight vector (1); the yield curve through dated years as small multiples before PCA names level, slope, curvature (12 + 8). (7 + 1)
- **F1 Finite-difference solvers** — The explicit stencil as a kernel sliding along the price grid, one time layer per click, as a StepThrough with the three numbers substituted live (13); the stability blow-up as predict-then-run — "will this step size explode? bet" — then the clip of it exploding (7 + 10). (13 + 7)
- **F2 Longstaff–Schwartz, calibration, AD** — Regression at one time slice as a table you can click: each row a path, click to see whether it is in the money and what the fitted continuation value is (13); automatic differentiation as a computational graph with wiggles flowing along edges, rendered as a clip (10). (13 + 10)
- **G1 Supervised learning, regularisation** — Drag data across the train/test line (existing B63) plus a ten-round game "which of these two fits will do better out of sample?" with a score (6); the overfitting intern as a character whose in-sample R² is always higher (3). (6 + 3)
- **G2 Clustering, PCA, autoencoders** — A physical sim: six real tickers as masses on springs whose tensions are correlations; release and watch them snap into clusters, then into a tree (5 + 14); the autoencoder bottleneck as before/after reconstructions in small multiples (12). (5 + 12)
- **G3 ML for time series, leakage, backtest overfitting** — The "peek at the future" button inside an honest backtest ledger: the cheated Sharpe beside the honest one, the row where the leak entered highlighted (18 + break-it); a comic of how the leak got in (the scaler fitted on the whole sample) (2). (18 + 2)
- **H1 Exotics** — Paint your own payoff on path space: draw a barrier, drop paths, watch rollouts colour by outcome after the fact (7 + B24); a comic of the barrier being hit at 15:59 (2); the vanilla decomposition as a reference card (21). (7 + 2)
- **H2 Structured products** — An annotated real autocallable term sheet (public PDF) with hotspots on coupon, barrier, observation dates and worst-of (8); the decomposition as a ledger where each vanilla is added as a row and lights its piece of the payoff diagram (18 + 4); knock-out scenarios per observation date as an icon grid (1). (8 + 18)

---

## Part D — Sources opened

Read in full or to the stated prompt, 2026-10-22/23:

- 3Blue1Brown, Bayes' theorem lesson — https://www.3blue1brown.com/lessons/bayes-theorem ; CLT lesson https://www.3blue1brown.com/lessons/clt (JS-rendered; only metadata returned) ; Substack CLT post https://3blue1brown.substack.com/p/but-what-is-the-central-limit-theorem (embed only)
- RealRisk, Winton Centre — https://realrisk.wintoncentre.uk/ ; epijim waffle charts — https://epijim.uk/posts/2021/waffle/index.html ; JDM 2022 icon-array experiment — https://dlab.sauder.ubc.ca/sjdm/journal/21/210615/jdm210615.html ; Life in Weeks (weekplan reconstruction) — https://weekplan.net/mini-tools/life-in-weeks/
- CHANCE, "A Brief Review of All Comic Books Teaching Statistics" — https://chance.amstat.org/?p=9185 ; explain xkcd 1132 — https://explainxkcd.com/1132 ; Logicomix AMS Notices review — https://people.cs.umass.edu/~immerman/cs513/LogicomixReviewAMSnotices.pdf
- Muller's PhD findings (THE Journal) — https://thejournal.com/articles/2015/05/05/watching-videos-does-not-necessarily-lead-to-learning.aspx ; Statistical Rethinking ch. 2 notes — https://bookdown.org/pbaumgartner/sr2-notes/02-small-and-large-worlds.html ; Dr Nic videos review (Cochrane S4BE) — https://s4be.cochrane.org/blog/2014/05/19/resource-review-statistics-learning-centre-videos/ (no character detail found) ; Evolution of Trust — https://ncase.me/trust/ (JS-rendered; body not returned) and https://stefy.substack.com/i/140164241/why-is-it-effective-for-learning
- Byrne's Euclid — https://www.c82.net/euclid/about ; Mathigon whitepaper — https://static.mathigon.org/whitepaper.pdf ; Mathigon probability intro — https://mathigon.org/course/probability/introduction ; Bret Victor, Explorable Explanations — https://worrydream.com/ExplorableExplanations/
- PhET Plinko (Transum host page) — https://transum.org/Maths/Activity/PhET/Plinko_Probability.asp ; IFA Galton board — https://www.ifa.com/galtonboard ; Ciechanowski Mechanical Watch — https://ciechanow.ski/mechanical-watch/ ; Complexity Explorables about — https://www.complexity-explorables.org/about
- Paul Butler, Kelly — https://explore.paulbutler.org/bet/ ; Haghani & Dewey biased-coin experiment — https://arxiv.org/pdf/1701.01427 ; Guess the Correlation — https://en.wikipedia.org/wiki/Guess_the_Correlation
- You Draw It (FlowingData) — https://flowingdata.com/2019/07/12/make-charts-that-ask-readers-to-predict-the-line ; They Draw It — https://mucollective.northwestern.edu/theydrawit ; The Pudding birthday paradox — https://pudding.cool/2018/04/birthday-paradox/ ; ONS scrollytelling — https://digitalblog.ons.gov.uk/2021/05/24/what-makes-for-a-good-scrollytelling-article
- Option chain explainers: Stock Rover — https://www.stockrover.com/blog/how-to-read-an-option-chain/ ; moomoo — https://www.moomoo.com/ca/learn/how-to-read-an-options-chain ; CNBC/Khan "Reading options quotes" — https://www.cnbc.com/2011/06/03/reading-options-quotes-cnbc-explains.html (video, text only) ; Bankrate link resolved to an index page, discarded
- Distill, Momentum — https://distill.pub/2017/momentum/ ; Datasaurus Dozen — https://www.research.autodesk.com/publications/same-stats-different-graphs/ ; Tufte summary — https://www.antoinebuteau.com/lessons-from-edward-tufte.md ; Immersive Math ch. 3 — https://immersivemath.com/ila/ch03_dotproduct/ch03.html ; Aperiodical review — https://aperiodical.com/2020/06/review-immersive-linear-algebra/ ; Seeing Theory index — https://seeing-theory.brown.edu/
- Primer natural selection — https://www.kottke.org/19/07/simulating-natural-selection , https://flowingdata.com/2019/07/31/natural-selection-simulation/ (video not watchable; rules taken from the posts)
- Sonification: Colors of Noise — https://rf.mokslasplius.lt/colors-of-noise/ ; astrobites sonification guide — https://astrobites.org/2021/06/17/getting-started-in-sonification/ ; TwoTone — https://github.com/datavized/twotone ; riskhub EWMA — https://riskhub.org/calculator/ewma-volatility

**Blocked or unreadable (report, not retry):** worrydream.com/ScientificCommunicationAsSequentialArt and worrydream.com/KillMath (permission not granted in time — the Explorable Explanations page did load and stands in for Victor's argument); noah.nrw Hermann MCMC-sonification archive (JS gate); loudnumbers.net (session limit); Investopedia and OIC option-chain pages (not reached; Stock Rover and moomoo used instead); Khan's stick-figure finance videos (video only).

Internal files read: `docs/charter.md`; `research/illustration-catalogue.md` (Parts A, B headings in full, B83–B89, Part D); `research/style/fresher-critique.md`; `research/style/engagement.md` (headings, Part C hooks, Part D); `research/style/manim-feasibility.md`; `apps/web/src/chapters/A1-lognormal/figures/{F0Story,F2Derive,F4World}.tsx`; `apps/web/src/ui/*`; `apps/web/src/styles/tokens.css`.
