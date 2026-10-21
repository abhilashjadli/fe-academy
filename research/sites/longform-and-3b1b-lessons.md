# Long-form explorables and 3Blue1Brown written lessons — audit

_Phase R0. Read 2026-10-21 via WebFetch. We extract structure and pedagogy; we do not copy text, code or design. Sources that could not be rendered (JS-only pages) were read from their public GitHub sources or the `3b1b/captions` transcripts, noted per item._

Charter references: syllabus ids 0.1–H2 (`docs/charter.md` §3). Catalogue entries follow `research/README.md`.

---

## Part 1 — Long-form explorables

### 1. Bartosz Ciechanowski (ciechanow.ski)

Articles read fully: **Mechanical Watch** (2022), **GPS** (2022), **Sound** (2022), **Lights and Shadows** (2020). Archive has 22 articles; the modern ones (2019–2024) are all 5,000–8,000 words with 15–55 interactive figures.

#### Mechanical Watch
- ~6,500 words, **16 interactive figures** (plus a global pause-all-animations toggle). Sections: Power → Gears → Escapement → Balance → Mainplate → Click → Motion works → Date → Keyless works → Automatic winding → The size of it all → Further reading → Final words.
- Interaction kinds: drag-to-rotate the 3D object (every figure), one slider per figure that is either *time-speed* ("slow the motion down"), *a physical parameter* (teeth ratio, spring stiffness, moment of inertia), or *reveal* (peel away layers), plus two-button "push the pallet fork" figures.
- Opening: one paragraph of context, then the full assembled watch you can drag; the article then **disassembles** it one component at a time and reassembles.
- Text-to-figure cadence: 2–4 short paragraphs → one figure → 1–2 paragraphs reading the figure ("Notice that…") → next. The sentence immediately before a figure is always an instruction or a claim the figure proves ("Unfortunately, that won't really work.", "We can control the rate of this periodic motion by adjusting two parameters.").
- The **naive-first** device: a watch with just a mainspring and a hand is built and shown to spin uncontrolled (figure 4) *before* the escapement is introduced as the fix.
- Equations: **none displayed**. Three inline arithmetic facts (40 × 60 = 2400 revolutions, gear ratio ≈ 343:1, 28,800 beats/hour). All quantitative content is carried by the figures.
- Ending: no recap; a reflective paragraph comparing to quartz, then a support line.
- A reader who only plays with the figures still learns: each figure is captioned by the preceding sentence, and the sliders are labelled with physical names, so the cause→effect of each component is self-evident.

#### GPS
- ~7,500 words, **38 interactive figures** — the densest of the four. Section order: Simple positioning → Time of flight → "Do you hear me?" → "Do I hear you?" → Leveling up (3D) → Orbits → GPS orbits → Keplerian elements → Time (relativity) → Signal propagation → Navigation message → GPS signals → Final words.
- Structural core is a **ladder of failing solutions**: tape measures ("not how any GPS works") → drones with stopwatches ("a bit ridiculous") → the user emits sound and landmarks listen (works, but "has a fatal flaw" when many users) → flip it: landmarks emit, user listens → but clocks are unsynchronised → clock bias as an unknown, needing one more emitter → then 3D needs one more again. Each failure is **shown in a figure before the fix is named**.
- Interaction kinds: drag a figurine on a map while circles/spheres update; a **"clock bias" slider that the reader must tune until three circles meet at one point** (the reader solves the system by hand before the equation is shown); sliders for altitude, inclination, number of satellites; time scrubbers for orbits; a correlation slider the reader slides until the replica PRN code aligns (reader performs the receiver's job).
- Equations: 8, in 5 blocks (s = v·t; F = GmM/r²; Kepler's third law; c; the 4-equation pseudorange system). Pattern: **figure first, equation after**, and the pseudorange system is explicitly introduced as "the formal version of the sphere-resizing you just did by hand", with the remark that the mechanics matter less than the concept.
- Ending: reflective, lists the enabling technologies; no summary bullet list.

#### Sound
- ~6,500 words, **~53 interactive figures** (several are keyboard-driven: press keys to hear and see waveforms). Sections: Air → Making sounds → Pure tones → Masses and springs → Pressure waves → Final words.
- Progression: particles → pressure → a single "pop" → repeated pops = pitch → waveform shapes → superposition (each key has its own plot and a sum plot) → sine as the primitive (rotating circle traces it) → beats from close frequencies → **Fourier decomposition as the inverse of synthesis** (draw a waveform; 64 sines approximate it; bottom panel is amplitude-vs-harmonic bars; slider adds sines one at a time; square wave shows Gibbs ripple) → live microphone spectrum → coupled oscillators → normal modes with per-mode amplitude sliders → strings → radiation, decibels, Doppler, interference, reverb.
- Equations: 4 displayed (p ∝ 1/r, SPL formula, one worked SPL number, I ∝ 1/r²); the SPL formula is followed by a calculator figure where the reader changes pressure and reads dB.
- Techniques worth stealing: *synthesis before analysis* (build complex from simple, then decompose); *"draw your own input"* figures; *same scene, new parameter* (the plate-in-tube figure is reused 5 times with one new control each).

#### Lights and Shadows
- ~5,000 words, **~35 demos**, ~15 with explicit controls. Sections: Power → Position → Angles → Radians → Solid angles → Surface vision → Radiance → Reflections → Shadow → Color → Bounces → Sphere of light.
- The clearest example of his **picture → words → formula** sequence. Inverse-square law: (1) ray demo with distance slider, red dots mark rays that miss the patch; (2) tiny-source sphere with radius slider, intersection density visibly thins; (3) prose: sphere area grows as r²; (4) A = 4πr²; (5) E = P/A ∼ 1/r², named, with the caveat "exact only for infinitesimal sources" which sets up the next section. Cosine law: (1) ray demo where tilting makes rays miss; (2) side view with normal and light-direction arrows; (3) prose naming irradiance; (4) E = P cos α / A; (5) sphere demo showing cosine shading on a curved surface (formula → consequence figure).
- Five displayed equations in total, each preceded by the figure that makes it obvious and followed by one figure that shows a consequence.
- Prompts: "Notice that…" is the most common; "you can also try…" appears a handful of times for off-script experiments.

#### Ciechanowski — cross-article observations
- **One slider per figure** is the norm; two sliders is the maximum. Multi-parameter playgrounds appear only at the end of a section.
- Every figure animates by default (time runs) and the slider usually scrubs time or slows it. Complexity is controlled by *pausing/slowing*, not by adding controls.
- Scale is always set on a human reference (a hand, a person, the full watch) and there is a late section that *re-establishes real scale* after the reader has lived in a magnified world.
- Equations are rare (0–8 per article), always after the figure, often with a "you don't need this" disclaimer; worked numbers are inline, 1–3 per article.
- Article arc: hook (one paragraph) → full object shown → disassemble to first principle → rebuild one component at a time, each with a naive version that fails → assembled object again → scale/limits → reflective close, no recap.

### 2. Red Blob Games (Amit Patel)

#### Introduction to A*
- ~2,300 words, **11 interactives** + 1 static. Opens with the finished thing (drag start/goal, A* finds path) before any definition.
- Progression modifies the *previous code block* each step: BFS frontier → came_from breadcrumbs → early exit → movement costs (Dijkstra) → greedy heuristic → A*. Figures: play/step animations of the frontier, drag the goal and watch arrows, **side-by-side panels running two or three algorithms on the same map**, "open a hole in the wall and see which algorithm notices".
- Code is Python-like pseudocode; no equations. Figure before code in early sections; code then figure in later ones once the reader can predict.
- Same maps reused across figures so comparisons are fair. Ends with a "which algorithm when" decision guide — practical, not a recap.

#### Probability and Games: Damage Rolls
- ~2,200 words, **12 figures**, all histograms (x = damage value, y = frequency). Opening is a design problem (RPG damage), not a question.
- Sequence: 1 die uniform → NdS notation → **sum of dice narrows and peaks** (2d6, 3d4, 4d3, 6d2 selectable) → constant shifts move the histogram → variance falls with more dice → side note: this approaches the normal (Box–Muller mentioned) → asymmetry (max of two, drop-lowest, reroll, crit hits) changes skew and tails → a design **playground** with all parameters → inverse problem: **draw the histogram you want, get the code** (weighted lookup table).
- Code rather than formulas; no closed-form probabilities. The lesson "number of rolls controls variance, offset/die size controls scale, asymmetry rules control skew" is a direct analogue of "mean/variance/skew/kurtosis as controllable knobs" for A1.

#### Hexagonal Grids
- ~5,500 words, ~20 interactives. Reference-style: hover-to-highlight, click-to-toggle walls, a picker for grid type that switches the code shown. Each section is question → diagram → derivation → pseudocode. Notable: no global coordinate toggle; instead one recommendation ("store axial, compute the third") and convert-apply-convert-back everywhere — a clean model for "pick one canonical representation, show conversions".

#### Curved Paths
- ~3,000 words, 12 SVG figures; drag endpoints/control points. Opening is a side-by-side (arc vs Bézier). The same road segment is reused for length/offset/distance diagrams so the reader compares operations on identical geometry. Formulas inline in prose; prose sets up each figure.

### 3. explorabl.es (index read from `-data/explorables.csv`, 180 entries)

Five picked for relevance; techniques recorded.

1. **The Kelly criterion: how to size bets** (Paul Butler) — ~2,200 words. Opens with a **playable game**: 60/40 coin, $25 bankroll, slider sets bet, goal $250, with the real-experiment hook ("you'd beat 79% of participants"). Sequence: play → expected-value strategy shown to ruin you → compare strategies by P(one beats other) → slot-machine example (no "best" exists) → simplifying assumptions → write wealth as function of fraction ℓ and win share → **median as criterion**, plotted vs ℓ with a probability slider → "autobet" game lets reader test the optimum → recap → formula ℓ = 2(p − ½) named Kelly only now → appendix derivation. Game mechanic carries the quantitative lesson: the reader *experiences variance* and ruin before the median argument. Direct template for B2 (martingales/betting), E1 (risk of ruin), D1 (P&L distribution).
2. **The Taxi-cab Problem** (Gal Green) — ~800 words, 8 min. Bayes via Tversky–Kahneman cabs. Guided sequence with sliders and buttons: set cab mix → place accident → run once / run 100× and tally → witness-accuracy slider → recreate original numbers → "Scary Math Box" (formula hidden behind a click, stated as a count ratio, Bayes never named) → simulate 100× and compare to the formula. **Simulation-then-formula-then-simulation-check.** Technique for A-level conditional probability and for every "estimate vs truth" chapter (E1 backtesting).
3. **Rock 'n Poll** — ~900 words, step-through with "beenhere" markers. Population of 1M (each dot = 1,000 people) with known election result → survey one person at a time (lazy button batches) → 100 → 1,000 → **8 polls of 1,000 run simultaneously** → the 64 results compared to truth; margin of error emerges from the spread. Promise: "not a single statistical formula." Template for the sampling-distribution idea in 0.2, A3 (coefficient sampling variability) and E1 (backtest noise).
4. **Entropy Explained, With Sheep** (Aatish Bhatia) — ~3,000 words. Puzzle opening (reversed ice-melting GIF looks wrong). Sheep on plots = energy packets on atoms: **drag sheep to find all 10 arrangements yourself** → click to reveal the missed ones → buttons scale sheep and plots so the count explodes → two farms exchanging sheep with a live histogram that peaks → scale-up controls sharpen the histogram and shrink the odds of extremes. The formula S = k log W **never appears** (log mentioned in one parenthetical). Combinatorics made physical: this is the 0.2 (counting → binomial → normal) chapter in another costume.
5. **Parable of the Polygons** (Hart & Case) — ~900 words. One rule ("move if < ⅓ of my neighbours are like me"), first applied **by hand** (drag shapes until everyone is happy — "harmless, right?"), then automated with a segregation-over-time graph, then a **bias slider**, then two fixed thresholds compared (33% vs 50%), then "lower the bias — does it un-segregate?" (no: path dependence), then a second rule (demand a minimum of diversity) that fixes it, then a sandbox. Ends with three one-line lessons. The pattern *manual → automatic → parameter → twist → sandbox* is the cleanest Markov/agent simulation arc we found (B1).

Also catalogued as relevant: Going Critical (Simler; contagion threshold, JS-only, not readable here), Kernel Density Estimation (Mathisonian), Birthday Paradox (Pudding), Science Isn't Broken (p-hacking; direct ancestor for G3 backtest overfitting), Exploring Histograms (bin-width interactive), Seeing Theory, Immersive Math, Complexity Explorables (separate audits).

### 4. Nicky Case (ncase.me) — read from GitHub sources (`ncase/trust`, `ncase/simulating`)

**The Evolution of Trust** (~3,200 words of script, ~30 min). Sections, one new variable each: (1) one game — the reader chooses cooperate/cheat and sees payoff numbers (+2/+2, 0/0, +3/−1) and why cheat dominates; (2) repeated game — play 3–7 rounds against 5 named strategies, unknown last round; (3) one tournament — **reader bets on the winner** before 10×10 matches run; (4) repeated tournament — play/eliminate/reproduce cycles on a population (15/5/5 start), bet again; (5) distrust — slider for rounds per match and the mutual-cooperation payoff (+2 → +1); (6) mistakes — three new strategies, 5% noise, then a noise slider 0–50% with stated bands (0% copycat, 1–9% copykitten, 10–49% always-cheat, 50% nobody); (7) sandbox with every lever; (8) conclusion = three conditions for trust. **Predict-then-run** is the core mechanic: every run is preceded by a bet, so the reader's wrong intuition is the hook for the explanation. Numbers are in the payoff tiles and the population bar, never in prose formulas. A game mechanic *can* carry a quantitative lesson when (a) the payoff numbers are visible on the pieces, (b) the reader commits a prediction, (c) each level changes exactly one parameter.

**Simulating the World (in Emoji)** (~2,100 words). Forest → add lightning (predict first: "what if you increased tree growth?") → reader kills trees to build firebreaks → add a second species; each sim introduces one rule and names the feedback loop it creates (reinforcing/balancing). Ends with a make-your-own editor. Teaches "model = rules you can inspect", emergence explicitly named.

**LOOPY**: nodes + signed arrows, click a node to inject a pulse and watch propagation. The page's rationale: raw code is too inaccessible, drag-and-drop too shallow; learning by messing around. A LOOPY-style diagram is a candidate for the Greeks-interrelationship chapter (C5: vanna, volga, charm as arrows between delta/vega/time) and for D1 (gamma ↔ theta loop).

### 5. explained.ai (Parr & Howard)

**How to explain gradient boosting** (3 parts + FAQ). Sequencing rule stated: regression first; L2 loss first because it is the easy case; **the same tiny dataset (5 apartments: sqft 750–950, rent 1160–2000)** reused across both loss articles so the comparison is apples-to-apples; L1 article is motivated by a visible failure of L2 (outlier chasing); only part 3 generalises to "gradient descent in function space". Within L2: toy additive function (30 + x + sin x) → golf analogy (strokes toward the hole; residual = vector from current prediction to target; learning rate = tapping softly) → **table of residuals at each stage** + figure of residual arrows from the mean + stumps overlaid on residuals → composite model → MSE-vs-stages curve for several learning rates → pseudocode last. Equations appear early but only the recurrence F_m = F_{m−1} + Δ_m; the loss definition waits until after the worked example.

**Beware default random forest importances** (~6,500 words). Pedagogy = **break the model**: add a pure-noise column and state the expected result ("should rank last") *before* showing the default method rank it above real features. Then permutation importance (shuffle a column, measure the drop) and drop-column (the ground truth) are each validated on the same noise column. Collinearity is studied by *duplicating* a column and watching importance split 50/50, then adding noise to the duplicate to see it shift gradually. Code-forward, almost no equations. Template for G1/G3: "validate the diagnostic on a known-bad input first".

**Matrix calculus for deep learning** (~10,000 words). Scalar rules as a review table → partials → Jacobian (with a boxed shape table) → element-wise ops and the diagonal condition → three chain rules in increasing generality, each shown to reduce to the previous → running single-neuron example assembled at the end → notation table and cheat sheet. Every vector result is checked by reducing to the scalar case. For us: F2 (AD for Greeks) and G1 — the "shape table" and "reduce the general rule to the scalar case you trust" devices.

---

## Chapter anatomy patterns (distilled)

**Length and cadence.** Ciechanowski: 5–8k words, 15–55 figures, i.e. one figure per 150–250 words. Red Blob: 2–3k words, ~1 figure per 200 words. Case/Butler/Green: under 3k words, one figure per section, long dwell time per figure. The text-to-figure ratio is remarkably constant at **2–4 short paragraphs per figure**; nobody writes more than ~300 words without something the reader can touch.

**Opening (first screen).** Three working patterns: (a) the finished object, draggable, with one sentence of hook (Watch, A*, Sound keyboard); (b) a puzzle whose answer the reader will get wrong (Taxi-cab 80%, Entropy reversed GIF, Trust's Christmas truce, Bayes' Steve); (c) a playable game with a score (Kelly). All three put something interactive within the first 150 words. None opens with definitions or a syllabus.

**Build order.** Naive version first, shown failing in a figure, then the fix (Watch without escapement; GPS tape measures → drones → sound; Polygons manual → automatic; L2 → L1). Each section adds exactly one component, one rule or one parameter. The sandbox with all parameters comes last, never first.

**Figure design.** One slider per figure; the slider is a *named physical quantity* or *time*. The same scene is reused with one more control each time so the reader never re-learns the picture. Side-by-side panels for comparisons on identical inputs (A*, Curved paths, L2/L1). "Notice that…" after the figure; "you can also try…" for optional detours.

**How equations enter.** Picture → words → formula → consequence-figure. Formula is named only after the reader has done the operation by hand (GPS clock bias, Kelly median, Bayes counts). Count of displayed equations per piece: 0–8. Worked numbers: 1–3 per piece, always on the same example the figures show. A "you don't need the symbols" disclaimer is common and does not reduce rigour because the figure *is* the argument.

**Predict-then-run.** Trust, Simulating, Taxi-cab, RF importances all ask the reader to commit (a bet, a guess, "what should happen?") before the run. This is the single cheapest technique and the most reliable hook.

**Scale re-establishment.** After a long stretch in a magnified or idealised world, one figure resets to real scale (Watch's size section; Sound's SPL calculator; Rock 'n Poll's 1M population).

**Ending.** No bullet recap in Ciechanowski/Red Blob; a reflective paragraph and a reading list. Case and Butler end with 3–6 one-line lessons. Red Blob adds a practical "which to use when". For our chapters: 3 one-line takeaways + "what computes it" code panel + reading list.

### Catalogue entries (README format)

### Disassemble-then-rebuild
- Source: ciechanow.ski/mechanical-watch, /gps
- Topic illustrated there: a complete machine shown first, then each component built from scratch with a naive version that fails
- What moves / what the viewer does: drags the assembled object; later figures isolate one part with one slider each; the naive figure visibly misbehaves
- What it makes visible that text cannot: *why* each component exists (the failure it fixes)
- Our chapters that could use it: C3 (show the BS price surface first, then rebuild: payoff → discounting → lognormal → expectation); C2 (one-step tree fails to match smile → multi-step → continuum); H2 (show the autocallable payoff, then decompose into digitals, barriers, zero-coupon); D3 (BS fails on smile → local vol → Heston)
- Notes on execution: the "failing naive version" must fail *in the figure*, not in prose; keep the final assembled figure identical to the opening one so the reader sees the loop close.

### Reader-solves-the-system-by-hand slider
- Source: ciechanow.ski/gps (clock-bias slider; PRN correlation slider)
- Topic illustrated there: finding the unknown clock bias by tuning until three circles meet; finding the code offset by sliding a replica until correlation spikes
- What moves / what the viewer does: drags one slider; several geometric objects move together; a visible "snap" when the solution is found
- What it makes visible that text cannot: that the equation is just the formalisation of an operation the reader already performed
- Our chapters that could use it: C3 (implied vol: slide σ until the model price matches the market price — the "snap" is price equality); A5 (MLE: slide ω, α, β until the likelihood peaks); F2 (calibration: tune Heston params until the smile fits); B5 (slide the drift adjustment until the discounted price becomes a martingale, i.e. the drift of the plotted expectation becomes flat)
- Notes on execution: show the residual/mismatch as a visible quantity (gap between curves, a bar), so the reader has something to minimise; then present the root-finder/optimiser as "what the computer does instead of your hand".

### Synthesis-then-decomposition (draw the input)
- Source: ciechanow.ski/sound (keys sum into a waveform; draw a waveform and watch 64 sines fit it; square wave shows Gibbs ripple)
- Topic illustrated there: superposition and Fourier decomposition
- What moves / what the viewer does: builds a shape by adding primitives, then draws an arbitrary shape and watches the decomposition appear term by term with a slider
- What it makes visible that text cannot: that decomposition is the inverse of a construction the reader already did; convergence behaviour at discontinuities
- Our chapters that could use it: A2 (PCA: build a yield-curve move from level/slope/curvature, then draw a curve move and watch it decompose); H2 (draw a target payoff, watch it decompose into vanillas/digitals — the static-replication picture); E3 (PCA on yield curves); B6 (Fourier-style separation of variables sets up the heat-equation ↔ BS link)
- Notes on execution: the drawn-input figure is the most memorable; precompute the basis so decomposition is instant; show the residual.

### Dice-sum histogram ladder
- Source: redblobgames.com/articles/probability/damage-rolls
- Topic illustrated there: sums of dice narrowing toward a bell; shifts, variance, skew and tails as design knobs
- What moves / what the viewer does: picks NdS combinations; shifts an offset; applies asymmetry rules (max/min/reroll/crit) and sees skew and tail change; draws the histogram they want and gets the sampling code
- What it makes visible that text cannot: mean, variance, skew and tails as *independent* controls on a shape
- Our chapters that could use it: 0.2 (CLT by dice before Galton); A1 (skew and kurtosis as "asymmetry rules" on a base distribution; draw a fat-tailed histogram and see what generator produces it); E2 (inverse-transform sampling from a drawn distribution)
- Notes on execution: keep axes fixed across all variants so narrowing and shifting are visible; use the *same* die throughout.

### Side-by-side algorithms on one map
- Source: redblobgames.com/pathfinding/a-star/introduction (BFS vs Dijkstra vs A*), explained.ai gradient boosting (L2 vs L1 on the same 5 rents)
- Topic illustrated there: how algorithms differ on identical inputs
- What moves / what the viewer does: drags the goal / edits the map and both panels update together
- What it makes visible that text cannot: the difference between methods is the *only* thing that changes
- Our chapters that could use it: E1 (historical vs parametric vs MC VaR on the same return series, same window slider); D3 (BS vs local vol vs Heston fitted to the same smile, drag the strike); F1 (explicit vs implicit vs Crank–Nicolson on the same grid, drag dt past the stability limit); E2 (plain MC vs antithetic vs control variate, same seed, same path count); C2 (binomial with n steps vs BS, drag n)
- Notes on execution: shared state across panels; a single control. Make the *disagreement* the thing to notice.

### Predict-then-run (bet before the simulation)
- Source: ncase.me/trust (bet on the tournament winner), ncase/simulating ("what if you increased tree growth?"), explained.ai rf-importance ("the random column should rank last")
- Topic illustrated there: game-theory tournaments; cellular automata; feature importance
- What moves / what the viewer does: commits a prediction (click a candidate, type a number, drag a guess line), then runs
- What it makes visible that text cannot: the reader's own misconception, which the text then addresses
- Our chapters that could use it: A4 ("is this series a random walk or mean-reverting?" — guess, then run the unit-root test); D1 (predict the sign of the hedged P&L when realised vol > implied, then run); C4 (guess which Greek is largest ATM near expiry, then plot); G3 (draw where the backtest Sharpe will land out of sample, then reveal); E1 (predict how many VaR breaches in 250 days, then backtest)
- Notes on execution: the "You Draw It" variant (NYT) — reader sketches the curve, truth is overlaid — is strongest for time series.

### Manual → automatic → parameter → twist → sandbox
- Source: ncase.me/polygons
- Topic illustrated there: Schelling segregation
- What moves / what the viewer does: moves agents by hand first, then presses run, then drags one threshold slider, then sees a rule change, then a free sandbox
- What it makes visible that text cannot: that the aggregate behaviour is produced by a rule the reader personally executed
- Our chapters that could use it: B1 (Markov chain: move the token by hand following the transition matrix, then automate, then change one transition probability, then show the stationary distribution emerge); B1 Poisson process (place events by hand, then automate); E2 (generate a path by hand with dice before Monte Carlo)
- Notes on execution: the manual stage must be short (6–10 moves); the automatic stage needs a time-series readout (segregation %, occupancy histogram) so the reader sees convergence.

### Simulation → formula → simulation check
- Source: galgreen.com/TaxiCabProblem; explore.paulbutler.org/bet; Rock 'n Poll
- Topic illustrated there: Bayes; Kelly; sampling error
- What moves / what the viewer does: runs the random experiment 1× then 100×, tallies, reads off the ratio; the formula is revealed behind a click and is shown to match the tally; the reader runs again to confirm
- What it makes visible that text cannot: that the formula is a shortcut for counting, and that the sample estimate wobbles around it
- Our chapters that could use it: 0.2 (binomial probabilities by tally first); C2 (risk-neutral probability q: run the one-step tree many times, tally, compare to (e^{rΔt} − d)/(u − d)); E1 (VaR: count breaches, compare to 1%); E2 (MC error ∝ 1/√N shown by repeating the run); B5 (expected discounted payoff under P vs Q — tally both)
- Notes on execution: show the running estimate as a line converging on the formula's value, with the ±1/√N band.

### Game with a bankroll
- Source: explore.paulbutler.org/bet
- Topic illustrated there: Kelly bet sizing; variance and ruin experienced
- What moves / what the viewer does: sets a bet fraction with a slider, plays rounds, watches the bankroll; then an "autobet" variant sweeps the fraction
- What it makes visible that text cannot: the difference between expected value and median growth, felt rather than stated
- Our chapters that could use it: B2 (martingale: fair game bankroll; doubling strategy and why it fails with a bounded bankroll); D1 (delta-hedge P&L as a game: choose rehedge frequency, watch P&L variance); E1 (ruin vs VaR); E3 (leverage and geometric growth)
- Notes on execution: must have a reset and a goal; show the median path and a fan of percentiles behind the reader's own path.

### Scale re-establishment figure
- Source: ciechanow.ski/mechanical-watch ("The size of it all"); /sound (SPL calculator)
- Topic illustrated there: returning from a magnified model to real units
- What moves / what the viewer does: a magnification slider from model scale to real scale
- What it makes visible that text cannot: how small the effect actually is in real units
- Our chapters that could use it: C4/C5 (Greeks in dollars for a real 1,000-contract position, not per-unit); D1 (hedging error in basis points of notional); A1 (a 5-sigma day in real index points); B3 (quadratic variation in daily returns at 1-minute vs daily sampling)
- Notes on execution: one figure near the end of the chapter; keep the model figure's colours so the mapping is obvious.

### Break-the-model with a known-bad input
- Source: explained.ai/rf-importance (noise column; duplicated column; noisy duplicate)
- Topic illustrated there: validating feature-importance methods
- What moves / what the viewer does: adds a noise feature or a duplicate, re-runs, sees whether the diagnostic catches it
- What it makes visible that text cannot: which diagnostics can be trusted
- Our chapters that could use it: A3 (add a collinear regressor, watch coefficients and standard errors explode; add heteroskedastic noise, watch OLS SEs lie); G1/G3 (add a leaked future feature, watch validation score jump — leakage detection); E1 (feed a fat-tailed series to a parametric VaR and count breaches); A5 (feed GARCH a constant-vol series)
- Notes on execution: state the expected result before running; keep the "correct" diagnostic in a second panel.

### Draw-your-own (You Draw It)
- Source: NYT You Draw It (via explorabl.es); redblobgames damage-rolls (draw a histogram); ciechanow.ski/sound (draw a waveform)
- Topic illustrated there: trend guessing; target distributions; arbitrary waveforms
- What moves / what the viewer does: sketches a curve or bars with the mouse; the system responds (overlays truth, generates a sampler, decomposes)
- What it makes visible that text cannot: the reader's prior, then the gap to reality
- Our chapters that could use it: D2 (draw a smile; see the implied density and whether it is arbitrage-free); H1 (draw a payoff; see its vanilla decomposition); A4 (draw next 50 points of a series; overlay a random-walk fan); C1 (draw a payoff, get the portfolio of calls/puts)
- Notes on execution: constrain the drawing (monotone, bounded) so every sketch is valid; always overlay a reference.

### Shape table / reduce-to-the-scalar-case
- Source: explained.ai/matrix-calculus
- Topic illustrated there: Jacobian dimensions; vector chain rule reduced to the scalar one
- What moves / what the viewer does: reads a boxed table; follows a general result reduced to a 1-D case already trusted
- What it makes visible that text cannot: that the general rule is the familiar rule with bookkeeping
- Our chapters that could use it: B4 (Itô's lemma for a function of (t, X): show the 1-D Taylor expansion the reader already knows, then the one extra term); A2 (Cholesky: 2×2 by hand, then the general shape); F2 (AD: scalar chain rule → the tape)
- Notes on execution: static figure plus a two-column "scalar case / vector case" layout.

---

## Part 2 — 3Blue1Brown written lessons

Written lesson pages exist for the calculus and linear-algebra series and Bayes; CLT, convolutions, Gaussian integral, Gaussian+Gaussian and the binomial video have no written body on the site (video only), so those were read from the `3b1b/captions` transcripts. There is **no 3Blue1Brown lesson on random walks, Brownian motion or finance**; the closest material is the Galton board opening of the CLT lesson, the convolution series, and the binomial/beta "probability of probabilities" series.

### Taylor series (Essence of Calculus ch. 11) → feeds 0.1, B4

Pedagogical sequence:
1. Question: "Taylor series are extremely useful in engineering and math, but what are they?" Motivating case: pendulum energy involves 1 − cos θ; replacing cos θ with 1 − θ²/2 made the problem easy.
2. Picture: cos x overlaid with 1 − x²/2 — near 0 they are indistinguishable.
3. Idea: find c₀ + c₁x + c₂x² that hugs cos x at 0. Match value → c₀ = 1; match slope → c₁ = 0; match curvature → c₂ = −½. Each figure shows the polynomial changing as one coefficient changes.
4. Check with a number: cos(0.1) = 0.995004…, polynomial gives 0.995.
5. Add c₃ (= 0) and c₄ (= 1/24): factorials appear because repeated power-rule differentiation multiplies 1·2·3·…; key observation: **each derivative at 0 is controlled by exactly one coefficient** (figure labels c₀…c₂ with the derivative each controls).
6. Generalise: the n-th coefficient is f⁽ⁿ⁾(0)/n!. Only now the general formula, then centred at a with (x − a)ⁿ; stated principle: "derivative information at one point gives approximation information in a neighbourhood".
7. e^x: all derivatives 1 → 1 + x + x²/2! + …; partial sums at x = 1 approach 2.71828.
8. Convergence: ln x around 1 converges only on (0, 2); partial sums bounce outside; radius of convergence defined.
9. Ends: the takeaway sentence, pointers to error bounds.

Single key picture: the polynomial graph morphing as one coefficient at a time is tuned to match cos x at 0.

For 0.1: this *is* the chapter's spine. Our illustration: a "match the derivatives one at a time" figure with the coefficient being tuned highlighted, a numeric readout at x = 0.1, and a second figure where the centre a is dragged and the polynomial follows. The second-order term is then reused in B4 (Itô: the (dX)² term is the c₂ term that does not vanish).

### The paradox of the derivative (ch. 2) → feeds 0.1, B3, B4

1. Question: "instantaneous rate of change" is self-contradictory — change needs two moments.
2. Picture: car from A to B, distance-vs-time graph s(t); velocity graph beside it; steep = fast.
3. Worked snapshots: 30 m at 4 s, 50 m at 5 s → 20 m/s. Then dt = 0.01: the ratio ds/dt at t = 3 as rise over run between two close points.
4. Notation introduced here: "d" signals the *intent* to shrink dt; the derivative is what the ratio approaches, not its value at any dt.
5. Algebra on t³: at t = 2 the ratio is 3(2)² + 3(2)dt + dt² → 12; general 3t².
6. Resolution: the derivative is the slope of the tangent, "the best constant approximation of the rate of change near a point"; t = 0 case discussed.

Key picture: secant lines on s(t) collapsing to a tangent as dt shrinks, with the dt value printed.

For us: B3 needs the opposite lesson — for Brownian paths the secant slope does **not** settle as dt → 0 (it blows up like 1/√dt), while (ΔX)² summed does settle (quadratic variation). The same figure with a Brownian path instead of t³ and the same printed dt is the whole point of B3; B4 then runs the Taylor expansion with that fact.

### Integration and the fundamental theorem (ch. 8) → feeds B3, B6, F1

1. Question: what is integration, why is it the opposite of differentiation?
2. Picture: passenger sees only the speedometer; v(t) = t(8 − t); constant velocity → distance = rectangle area.
3. Approximate with rectangles of width dt (dt = 0.25, first rectangle 7 × 0.25 = 1.75 m); refine.
4. Integral sign introduced as "the sum, with dt → 0", explicitly not Σ.
5. Let the upper bound T vary → area function; a thin sliver shows its derivative is v(T).
6. Antiderivative 4t² − ⅓t³, +C issue, lower bound fixes C; FTC stated in words; total 85.33 m.
7. Signed area for negative velocity.

Key picture: the sliver dA ≈ v(T)·dT on the area-so-far graph.

For us: the "vary the upper limit and watch the area function grow" figure is the model for the Itô integral in B3 and for Feynman–Kac in B6 (the expectation as a function of the start point is the solution of a PDE). F1 inherits the rectangles-refine picture for discretisation error.

### Higher order derivatives (ch. 10 footnote) → feeds 0.1, B4, C4

1. Question: what is the second derivative?
2. Picture: f, f′, f″ plotted together; curvature sign; the difference-of-differences construction: two steps of size dx, changes df₁ and df₂, d(df) ∝ (dx)² — with dx = 0.01, d(df) ~ 0.0001.
3. Notation d²f/dx² explained from the nested fraction.
4. Physical: distance → velocity → acceleration (pushed into the seat) → jerk; exercise s(t) = t⁴ − 4t³ + 6t².

Key picture: two adjacent dx steps with df₁ ≠ df₂ and their difference labelled.

For us: C4's gamma is exactly "the difference of two deltas"; this two-step figure, with S instead of x and the option price instead of f, is a direct gamma illustration and is also the discrete second difference that appears in F1's finite-difference stencil and in the heat-equation lesson below.

### What is e / exponential derivatives (ch. 5) → feeds 0.1, B3 (GBM), C1 (discounting)

1. Question: derivative of aˣ; why is eˣ its own derivative?
2. Picture: population mass doubling daily, 2ᵗ; the growth over each day equals the mass at the start of the day.
3. Algebra: 2^{t+dt} = 2ᵗ·2^{dt}; factor 2ᵗ; the leftover (2^{dt} − 1)/dt approaches 0.6931… — "a peculiar constant" (reader plugs a tiny dt into a calculator).
4. Other bases: 3 → 1.0986, 8 → 2.079 = 3 × 0.6931.
5. e defined as the base where the constant is 1: slope of eᵗ equals its height.
6. Horizontal scaling: 2ᵗ = e^{0.6931 t}; constant named ln 2; general a^t = e^{(ln a) t}.
7. Ending: anything whose rate is proportional to itself (population, cooling, money) is naturally written e^{ct} with c the proportionality constant.

Key picture: tangent slope on eᵗ equal to the height at the point of tangency, with the comparison bases 2 and 3 having slope ≠ height.

For us: this is the compounding story for C1 (continuous discounting) and the deterministic half of GBM in B3 (dS = μS dt before the noise is added). The "slope equals height" figure with a draggable point is reusable verbatim.

### Central limit theorem (2023; transcript) → feeds 0.2, A1, E2

1. Opening: "This is a Galton board." Individual bounces unpredictable; the pile is predictable; same curve in heights and prime-factor counts.
2. Picture: simplified board, ±1 per row, five rows; final position = sum of five steps; ghost balls build bucket counts; Pascal's triangle.
3. Dice simulations: a skewed weighted die; histograms of sums of 2, 5, 10, 15 dice side by side; 2 dice still skewed, 15 is a hump. A die weighted to 1 and 6 also becomes a bell.
4. Spiky simulated histograms → compute exactly: diagonals of the 6×6 outcome grid; for unfair dice multiply and sum (convolution as a "weighted counting game").
5. Mean and variance: mean of sum = n·μ; variances add; sd grows as √n. Fair die: μ = 3.5, σ² = 2.92, σ ≈ 1.71.
6. Rescale: subtract mean, divide by sd → shapes converge to one universal curve.
7. Formula built in layers: e^{−x²} → add σ → note base is arbitrary → normalise (raw area √π) → 1/√(2π)·e^{−x²/2}.
8. Formal statement after the standardised sum and after noting **area, not height, is probability**.
9. Worked example: 100 fair dice: mean 350, sd 17.1, 95% in ≈ 316–384. 68–95–99.7 rule.
10. Three assumptions, each tested on the Galton board (which violates independence and identical distribution) and on dice; finite variance needed.
11. Ending: next video explains why *this* function and why π.

Key picture: the row of histograms (2, 5, 10, 15, 50 dice) first drifting and widening, then snapping onto one curve after standardisation.

For 0.2: the chapter arc should be Galton board → dice (weighted, so the reader sees a non-symmetric start) → the 6×6 grid diagonal count (this is where "counting" enters — binomial coefficients as diagonal lengths) → mean/sd growth → standardise → the universal curve → the 100-dice worked numbers. The three-assumptions-tested-on-the-board figure gives A1 its "when the CLT fails" story (fat tails = infinite variance; dependence = volatility clustering).

### Convolutions — adding random variables (2023; transcript) → feeds 0.2, A1, A2, E2

1. Question: sum of two independent normals with different σ — what distribution, and *why*?
2. Picture 1: two weighted dice, 6×6 product grid like a multiplication table; each sum is an anti-diagonal total.
3. Picture 2: flip one distribution and slide it; each overlap position is a dot product → the same diagonal sums. Named convolution, discrete formula Σ p_X(x)p_Y(s − x).
4. Continuous: sums → integrals, mass → density; integrand f(x)g(s − x) with the reflected, shifted g plotted as s changes. Integral formula appears only here, followed by a figure unpacking each piece.
5. Picture 3: joint density f(x)g(y) as a 3D surface; a diagonal slice x + y = s; its area (÷√2) is the convolution value.
6. Uniform + uniform → wedge on [−1, 1]; three uniforms → bell-ish; repeated convolution = smoothing; bell as the fixed point; link to CLT.
7. Two normals deferred to the next video.

Key picture: the diagonal slice through the 3D joint-density bump.

For us: 0.2 gets the grid-diagonal count; A2 gets the joint-density surface (and its elliptical contours when correlation is added — the one change that turns this picture into the bivariate normal); E2 gets "repeated convolution = sum of many shocks". Our illustration for A2: the same 3D bump with a correlation slider that shears it, and the diagonal slice that becomes the portfolio return.

### Gaussian + Gaussian = Gaussian (2023; transcript) and Why π is in the normal (2023; transcript) → feed 0.2, A1, A2

Sequence (combined): strip the Gaussian to e^{−x²} → direct route (complete the square) is symbol-heavy → the 3D bump e^{−(x²+y²)} is **rotationally symmetric** (unique to Gaussians) → rotate the diagonal slice to a slice parallel to an axis at distance s/√2 → area ∝ e^{−s²/2} → sum of two N(0, σ²) is N(0, 2σ²). Separately: volume of the bump by cylindrical shells = π; by slices = c² → c = √π; Herschel–Maxwell: radial symmetry + independence of coordinates forces f(x) = e^{cx²}. CLT proof sketched as two steps: (i) repeated convolution of any finite-variance law converges to *some* fixed shape; (ii) the Gaussian is a fixed point, hence it is that shape.

Key picture: the rotationally symmetric bump with a slice rotated from the diagonal to the axis.

For us: the "normal is the fixed point of adding" one-liner is the cleanest justification for using it in A1 and the cleanest statement of *why not* when tails are fat (no finite variance → the fixed point is a stable law). A2's independence ⇔ product ⇔ radial symmetry is the picture behind "uncorrelated normals are independent", which is the subtle point engineers get wrong.

### Bayes' theorem (2019; written) → feeds A-level conditional probability, G1 (Bayesian regularisation framing), E1 backtesting intuition

1. Opening: Steve, "meek and tidy" — librarian or farmer?
2. Base rate: 20 farmers per librarian; **picture 200 farmers and 10 librarians** as people icons.
3. Count who fits: 40% of librarians (4), 10% of farmers (20); posterior 4/24 ≈ 16.7%. Formula appears only after this count, by cancelling the 210.
4. Area picture: unit square, H is a strip of width P(H); evidence shades part of each strip; posterior = shaded H over all shaded. The restriction "falls unevenly" — that is the update.
5. Framing: evidence updates, it does not determine; frequency phrasing cut error from 85% to 0% in the Linda study.
6. Ending: draw the square, don't memorise the formula.

Key picture: the unit square with the H strip, shaded by evidence.

### Binomial distributions — probabilities of probabilities (2020; transcript) → feeds 0.2, A5 (MLE), G1

1. Question: three sellers — 100% of 10, 96% of 50, 93% of 200 — which to buy from?
2. Model: each seller has a hidden success rate S; ratings are noisy evidence. Simulation with S = 0.95: about 60% of 10-review batches are 10/10.
3. Forward question first: P(data | S). Simulation: 50 reviews, S = 0.95, 48 positive → ≈ 26.1%.
4. Formula appears **after the simulation agrees**: C(50,48)=1225 × 0.95⁴⁸ × 0.05² ≈ 0.261.
5. Plot P(data | S) as a function of S: peaks at 0.96, ~1/1000 at S = 0.8, zero at S = 1; 480/500 gives the same peak, narrower.
6. Peak is not the answer; the centre of mass is closer. Laplace's rule (add one success, one failure): 11/12 = 91.7%, 49/52 = 94.2%, 187/202 = 92.6% → seller 2.
7. Ends: need Bayes and densities to get P(S | data) → Beta.

Key picture: the likelihood curve over S, with the bar chart of outcomes for one fixed S beside it — the same binomial read along two different axes.

For us: 0.2 gets "binomial as a bar chart for fixed p"; A5 gets "the same expression read as a likelihood in the parameter" — the switch of axes *is* MLE, and the narrowing with more data is the standard error. The "peak vs centre of mass" distinction is the shrinkage/regularisation seed for G1.

### Eigenvectors and eigenvalues (2016; transcript) → feeds A2 (PCA), E3

1. Opening: confusion comes from shaky prerequisites (transformations, determinants, change of basis).
2. Picture: matrix [[3,1],[0,2]]; most vectors are knocked off their span; the x-axis vectors are only stretched (×3); the line through (−1, 1) stretched ×2.
3. Definitions; negative and fractional eigenvalues; 3D rotation axis as an eigenvector with eigenvalue 1.
4. Av = λv written only after the geometry; rewrite λv = λIv; (A − λI)v = 0; nonzero v needs the matrix to squish space → det = 0 — **"turn the knob λ until space collapses to a line"**.
5. Worked: (3 − λ)(2 − λ) = 0 → 2, 3; solve for λ = 2.
6. Cases: 90° rotation (λ² + 1, none real); shear (one eigenvalue, one line); scale-by-2 (every vector).
7. Eigenbasis: diagonal matrix, powers easy (100th power).

Key picture: the grid transforming with the two invariant lines highlighted and every other vector visibly rotating off its line.

For us: A2/E3 PCA = "find the directions a covariance matrix only stretches". Our illustration: a cloud of 2-asset returns, the covariance ellipse, the two axes that the covariance transformation only stretches; drag the correlation and watch the axes rotate. The "knob λ until collapse" figure explains why eigenvalues are roots.

### Dot products and duality (2016; transcript) → feeds A2, E3, G1

1. Numeric definition; (1,2)·(3,4) = 11.
2. Picture: projection of w onto v's line times |v|; sign; zero when perpendicular; symmetry via mirror image.
3. Linear maps to the number line keep evenly spaced dots evenly spaced; a 1×2 matrix is a tipped-over vector.
4. Diagonal number line with unit vector û: by symmetry the matrix entries are û's coordinates → projecting = dotting with û; scale by |v|.
5. Duality: every linear map to ℝ is "dot with some vector".

Key picture: the diagonal number line embedded in the plane with û at 1, and the projection of î, ĵ onto it.

For us: portfolio return = w·r is the projection picture; a factor loading is "dot with the factor direction"; a linear regression coefficient vector is a dual object. Direct reuse for E3 (portfolio as projection onto a direction) and G1 (linear model as a projection).

### Change of basis (2016; transcript) → feeds A2 (Cholesky, PCA coordinates), B5 (change of measure, by analogy)

1. Opening: Jennifer's grid; "space has no intrinsic grid"; b₁ = (2,1), b₂ = (−1,1).
2. Translate: her (−1, 2) = −b₁ + 2b₂ = our (−4, 1); the matrix with her basis vectors as columns translates her → us; its inverse translates back; our (3,2) = her (5/3, 1/3).
3. Transformations in her language: translate → transform → translate back; A⁻¹MA, "mathematical empathy".
4. Sets up eigenbasis.

Key picture: the same arrow drawn on two overlaid grids with two different coordinate labels.

For us: A2's Cholesky is exactly a change of basis from independent to correlated coordinates (L maps the unit-variance grid to the sheared grid); PCA coordinates are the eigenbasis. B5: Girsanov is "the same path, two probability labels" — not a change of basis, but the "same object, two descriptions, translate-transform-translate-back" rhythm (and the "empathy" framing) is the right template for explaining why prices are computed in one world and realised in another.

### Differential equations, a tourist's guide (2019; transcript) → feeds B3 (mean reversion), A4, F1

1. Why ODEs: change is easier to describe than state; gravity y″ = −g, integrate twice.
2. Pendulum θ″ = −(g/L) sin θ − μθ′; the small-angle period formula is only an approximation.
3. **Phase space**: state = (θ, θ′), a point; the derivative of the state depends only on the state → a vector field; trajectories follow arrows; damping gives an inward spiral; fixed points.
4. Numerical: Euler steps; Δt = 0.5 too coarse, 0.01 used; 1,000 steps to t = 10 (code shown).
5. Chaos: three-body, 18-dimensional phase space, sensitivity to initial conditions.
6. Analogy: a relationship whose affection obeys the same equations → same spiral.

Key picture: the phase plane with arrows and one trajectory spiralling in.

For us: the (level, change) phase plane and the "step the state forward with dt" code panel are the entry to the Ornstein–Uhlenbeck / mean-reversion story in B3 and to AR(1) in A4 (deterministic pull plus noise); the Euler step is the Euler–Maruyama step of E2 and the time-stepping of F1.

### But what is a PDE? — heat equation (2019; transcript) → feeds B6, F1, C4

1. Setup: plate with a temperature at every point; two rods touching; T(x, t); the 3D surface over (x, t) and its time slices (= an animation of the graph).
2. Partial derivatives as slopes of the surface in two directions.
3. Heat equation stated *first* (∂T/∂t ∝ ∂²T/∂x²), then "where does this come from?"
4. Discrete derivation: three neighbours T₁, T₂, T₃; T₂ moves toward the average of its neighbours; rewrite as δT₂ − δT₁, a difference of differences, sign cases; shrink the step → second derivative; "where there's curvature in space, there's change in time".
5. PDE = infinitely many coupled ODEs, each depending on its neighbours; Laplacian in 2D/3D as "compare to the average of all neighbours".

Key picture: three neighbouring points on the rod with the middle one pulled toward the neighbours' average.

For us: this discrete-neighbours picture is the finite-difference stencil of F1 *and* the intuition for gamma/theta in C4 (the BS PDE says: time decay is proportional to the curvature of the price in S — "where there is gamma, there is theta"). B6 uses the "stated first, derived second" ordering, which worked here because the statement is one line.

### Solving the heat equation / Fourier series (2019; transcripts) → feeds B6, A2/E3 (decomposition), H2 (static replication)

1. Sine waves as solutions: each point's rate of change is proportional to its own value → sin(x)·e^{−αt}; doubling frequency quadruples decay (ω²).
2. Linearity: sums of solutions are solutions; "dials" mix waves into a custom start; high frequencies die first, the profile smooths.
3. Boundary conditions: zero slope at the ends; cosine instead of sine; allowed frequencies nπ/L (harmonics).
4. Step function (two rods at ±1) as an infinite sum of odd cosines with coefficients 4/π × (1, −1/3, 1/5, …).
5. Rotating vectors: a function as a 2D drawing; each term a vector rotating at frequency n with complex coefficient cₙ; **to find cₙ, multiply by e^{−2πint} so that one vector stands still, then average** — the averaging kills every other term.

Key picture: dials on a bank of sine waves whose sum is the initial profile, each decaying at its own rate.

For us: B6's Feynman–Kac can borrow the "exponential-in-time times a shape-in-space" separation, with the BS PDE transformed to the heat equation. The "multiply so one term stands still, then average" trick is the clearest explanation of projection onto a basis we found — it is how we should explain PCA scores (A2/E3) and the vanilla-decomposition integral of a payoff (H2, Carr–Madan).

---

## Top 15 ideas for our chapters

1. **Open with the finished object, draggable, within 150 words** (Watch, A*). C3 opens with the BS price surface; H2 opens with the autocallable payoff; B3 opens with a Brownian path the reader can re-seed.
2. **Naive version fails in a figure before the fix is named** (Watch, GPS). C2: a one-period tree that cannot price a smile; D1: hedge once and watch P&L scatter; A3: OLS on a heteroskedastic series with confidence bands that are visibly wrong.
3. **One slider per figure, same scene reused with one new control each time** (Ciechanowski throughout). Applies to every parameter explorable we build; the multi-slider playground comes only at the chapter's end.
4. **Reader solves it by hand, then the formula is revealed as "what you just did"** (GPS clock bias, Kelly median). C3 implied vol; A5 MLE; F2 calibration; B5 drift adjustment.
5. **Predict-then-run, with the prediction recorded** (Trust, Simulating, RF importances). Use in A4, D1, C4, E1, G3; the "You Draw It" variant for time series.
6. **Simulation → formula → simulation check, with the running estimate converging inside a ±1/√N band** (Taxi-cab, Rock 'n Poll). 0.2, C2 (risk-neutral q), E1, E2, B5.
7. **Manual → automatic → parameter → twist → sandbox** (Polygons). B1 Markov chains and Poisson processes; E2 path generation.
8. **Dice-sum ladder with fixed axes**; mean/variance/skew/tails as independent knobs (Damage Rolls, 3B1B CLT). 0.2 and A1 share one base figure: a weighted die whose sums are histogrammed for n = 1, 2, 5, 15, 50, then standardised.
9. **The 6×6 outcome grid with anti-diagonals, then the 3D joint-density bump with a diagonal slice** (3B1B convolutions). 0.2 counting → A2 bivariate normal (add a correlation slider that shears the bump) → portfolio return as the slice.
10. **Secant-to-tangent figure with dt printed, run on t³ and then on a Brownian path** (3B1B derivative paradox). B3's quadratic variation is the failure of that figure to converge; B4's extra term is the c₂ term of 0.1's Taylor figure.
11. **Difference-of-differences / three-neighbours figure** (3B1B higher-order derivatives, heat equation). Gamma in C4, the stencil in F1, "curvature in S drives change in t" as the one-line reading of the BS PDE.
12. **Likelihood as the binomial bar chart read along the parameter axis** (3B1B binomial). A5 MLE and standard errors; G1 shrinkage via "peak vs centre of mass".
13. **Phase plane with arrows and an Euler-step code panel** (3B1B tourist's guide). B3 mean reversion, A4 AR(1), E2 Euler–Maruyama, F1 time stepping — one shared figure component.
14. **Multiply so one term stands still, then average** (3B1B Fourier). The explanation of projection onto a basis for PCA scores (A2/E3) and for payoff decomposition into vanillas (H1/H2).
15. **Scale re-establishment near the end** (Watch, Sound). Every options chapter ends with the Greeks/hedging error of a real 1,000-contract position in currency, and every probability chapter with a real index move in points.

Secondary: side-by-side algorithm panels on one input (E1 VaR methods, D3 models, F1 schemes, E2 variance reduction); break-the-model with a known-bad input (A3, G1/G3, E1, A5); draw-your-own payoff/smile/histogram (C1, D2, H1); LOOPY-style loop diagram for C5 Greek interrelationships and the gamma–theta loop in D1; the "same object, two descriptions" rhythm of change-of-basis for B5; end chapters with 3 one-line lessons, a "what computes it" panel and a reading list rather than a recap.
