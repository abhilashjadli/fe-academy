# Audit: interactive maths/statistics teaching sites

_Phase R0. Eight sites, every reachable explorable page fetched (WebFetch). Purpose: extract pedagogy and interaction ideas for our chapters (charter §3). We record what the learner does, what responds, what becomes visible that text cannot show, and weaknesses. No code or design is copied._

**Fetch caveats.** Several pages are client-rendered and the scrape returned only captions/labels (setosa OLS and Pi; MLU-Explain ROC/precision-recall/neural-networks bodies; some PAIR widgets). For MLU-Explain I read the open-source Svelte components instead. Where a behaviour is from prior knowledge of the page rather than the fetch, it is marked *(known)*.

Verdict scale: **strong** = the interaction itself carries the insight; **ok** = useful but the text would do most of the work; **weak** = decoration or a control that does not teach.

---

## 1. Seeing Theory (seeing-theory.brown.edu)

Six chapters × three sections. Layout: one long scrolling page per chapter; each section = short text block, then a widget with instruction line, then a readout table. Widgets are "run the simulation" style (buttons: one trial / 100 trials) with a few draggable priors. Archived; no longer maintained.

| Page → section | Concept | What learner does | What responds | Verdict |
|---|---|---|---|---|
| Basic Prob → Chance Events | Probability as long-run frequency | Drag "true probability" bars; click Flip / Flip 100 | Observed-frequency bars converge on the true bars | **strong** — the gap between empirical and true closes visibly as n grows |
| Basic Prob → Expectation | E[X] as long-run average | Drag die-face probability bars; Roll / Roll 100 | Running sample mean line converges to E[X] | **strong** — a line visibly settling on a horizontal target |
| Basic Prob → Variance | Var as mean squared deviation | Toggle cards in/out of a 10-card deck; Draw / Draw 100 | Running average of squared deviations (green) approaches true variance (blue) | ok — same convergence trick a third time |
| Compound → Set Theory | Set algebra | Build an expression (A ∩ B′…) with buttons, Submit; drag/resize Venn circles | The region is shaded | ok — nice but closed-form, no surprise |
| Compound → Counting | Permutations vs combinations | Pick bag size; click a cell of the P(n,r)/C(n,r) table | All arrangements for that cell are drawn as marbles | **strong** — the number becomes a *picture of the enumerated set* |
| Compound → Conditional Probability | Conditioning shrinks the sample space | Click tabs A/B/C ("Universe" vs conditioned) | Only outcomes inside the conditioning event remain | ok — adapted from setosa; the balls version (below) is better |
| Distributions → Random Variables | RV = map outcomes → ℝ | Drag-select regions of a hexagonal sample space, type a value, Submit; Sample | Empirical distribution of *your own* RV builds up | **strong** — learner builds the RV; "random variable is a function" becomes literal |
| Distributions → Discrete/Continuous | PMF/PDF vs CDF | Dropdown (13 distributions), parameter fields, slider on x | PMF/PDF in yellow, CDF accumulating in orange as the slider moves | ok — a catalogue; the slider-sweeps-x-while-CDF-fills trick is the useful bit |
| Distributions → CLT | Sample mean → normal | Set Beta(α,β) source, sample size, #draws; Sample; "Theoretical" checkbox | Histogram of sample means stacks up; theoretical curve overlays | **strong** — the learner picks a wildly skewed source and still gets a bell |
| Frequentist → Point Estimation | Estimator, consistency | Drop 100 / 1000 points in a square | m, n, π̂ = 4m/n update | ok — Monte Carlo π; readout only, no error-vs-n plot |
| Frequentist → Confidence Interval | Coverage is a property of the procedure | Choose distribution, n, 1−α; Start/Stop sampling | Intervals stream down; those missing the true mean are coloured | **strong** — the 90% becomes a tally you watched |
| Frequentist → Bootstrap | Resampling to get SE | Sample once; Resample / Resample 100 | Distribution of resampled means builds up beside the original sample | **strong** — makes "resample with replacement" concrete |
| Bayesian → Bayes' Theorem | Base-rate effect | Drag prior bar and two accuracy distributions; Test one / Test remaining; Sort | Patients fall into a 2×2 tally; posterior table fills | **strong** — the Sort button reorders the dots so P(D\|+) is a visible fraction |
| Bayesian → Likelihood | L(θ\|x) = P(x\|θ) | Pick distribution, n; Sample; drag purple θ slider | Likelihood curve traced as θ moves; density slides under the fixed data | **strong** — the data are fixed and the *model* moves; the key MLE intuition |
| Bayesian → Prior to Posterior | Sequential updating | Set true p (hidden), α, β; Flip / Flip 10 | Beta posterior redraws after each flip and becomes the new prior | **strong** — posterior visibly narrows and drifts to the truth |
| Regression → OLS | Least squares | Pick Anscombe I–IV; drag points; click table columns | Line and SSE/β table update; column explanation pops | **strong** — Anscombe + dragging shows one outlier's leverage |
| Regression → Correlation | r | Tick species; click a cell of the 4×4 correlation matrix | Scatter for that pair | ok |
| Regression → ANOVA | Between vs within variance | Pick dataset; drag points | F and p update live | ok — p-value changes but *why* is not shown |

**Weaknesses.** Every widget is the same shape (button → accumulate → readout), so the site teaches "simulate and watch converge" and little else; no scroll narrative, so the text and widget are loosely coupled; readouts are tables, not annotated plots; nothing is ever framed as "predict before you press".

## 2. Explained Visually (setosa.io/ev)

Nine single-column essays; figures sit inline between paragraphs and most are *continuously* live (drag, hover) rather than button-driven.

| Page | Concept | What learner does | What responds | Verdict |
|---|---|---|---|---|
| Markov Chains | Transition matrix ↔ diagram | Watch a token hop between states; speed control; edit matrix text in the playground (rows must sum to 1, else turns red) | Diagram arrows thicken with probability; the state sequence streams out as a string | **strong** — the "sticky" R/S weather sequence vs coin-flip sequence shows what P(stay)=0.9 *looks like* in a sample path |
| Eigenvectors & Eigenvalues | Av ∥ v | Edit columns of A; drag v; press Forward (Fibonacci amoebas); drag circles (NY/CA migration); drag A's columns until the trajectory spirals | Av drawn with v; eigenspace lines; repeated application v, Av, A²v converging to the dominant eigenline; eigenvalues plotted in the complex plane | **strong** — "drag v until Av lines up" is a *game*; the Markov migration figure shows λ=1 as the steady state |
| PCA | Principal axes = directions of variance | Drag 2D points; rotate a 3D cloud; "show PCA" button | PC axes re-orient; second panel shows the data in PC coordinates; 17-D UK diet table collapses to 1-D then 2-D | **strong** — projection onto PC1 shown side-by-side with the original cloud; the 17-D example earns the technique |
| OLS *(known)* | Minimise sum of squared residuals | Drag points; drag the line's endpoints | Literal squares drawn on each residual; their total area; the OLS line snaps when you release | **strong** — "squared error" becomes area |
| Conditional probability | P(B\|A) | Drag the red and blue shelves (widths = P(A), P(B)); balls rain down | Counts of A-only, B-only, both, neither; "perspective" toggle isolates the balls that hit A, so P(B\|A) is read off the reduced set | **strong** — the Seeing-Theory tab version is a copy of this; the falling balls make conditioning a *filter* |
| Sine and Cosine | Unit circle → waves | Play; drag a point (Cartesian ↔ polar) | Rotating triangle traces sin and cos curves; (x,y) and (r,θ) readouts | ok — standard |
| Exponentiation | Linear vs exponential growth | Rate control, Restart; virus example | Step count and total; population saturates | weak — a counter |
| Image Kernels | Convolution | Hover a pixel; pick/edit a 3×3 kernel; upload image | The 3×3 neighbourhood × kernel sum shown for that pixel; whole image re-filtered | **strong** — hover-to-see-the-arithmetic |
| Pi *(known)* | π as a ratio | Drag circle size | Circumference unrolls along a ruler, always 3.14 diameters | ok |

**Weaknesses.** Short on text, so a learner without background gets a toy not an explanation; no "try to break it" prompts; no numbers worked by hand beside the figure.

## 3. Complexity Explorables (complexity-explorables.org)

49 explorables, all agent/lattice/particle simulations. Fixed template: intro → "Press Play and keep on reading" → *This is how it works* (model rules with equations) → *Observe this / Try this* → references → related. Controls: Play/Reset, 3–8 sliders, a few toggles. The display is the simulation only; no companion statistics plot in most. Full list (taglines from the index): Prisoner's Kaleidoscope, Horde of the Flies (Vicsek), Spin Wheels, The walking head, Eigenartig, Swårmalätørs, Come Together, Clustershuck, Thrilling Milling Schelling Herings, Repliselmut, T. Schelling plays Go, Janus Bunch, Nah dah dah (Life), Berlin 8:00 a.m. (phantom jams), Jujujajáki networks, Prime Time, I sing well-tempered (Ising), **Anomalous Itinerary (Lévy flights)**, Hopfed Turingles, **Albert & Carl Friedrich (random walks / CLT)**, Critically Inflammatory (forest fire), Dr. Fibryll & Mr. Glyde, Facebooked Flu Shots, The Blob, Stranger Things, I herd you!, Scott's World, Yo Kohonen!, Echo Chambers, **Kelp!!! (stochastic CA)**, **Surfing a Gene Pool (neutral drift)**, Knitworks, If you ask your XY, Ride my Kuramotocycle, Maggots in the Wiggle Room, A Patchwork Darwinge, Into the Dark, Barista's Secret (percolation), Lotka Martini, Double Trouble, Critical HexSIRSize, Flock'n Roll, Hokus Fractus, **Particularly Stuck (DLA)**, Cycledelic, Kick it like Chirikov, Epidemonic (SIRS), Keith Haring's Mexican Hat, Weeds & Trees. **There is no explicit Langevin/SDE or Brownian-motion-with-drift explorable**; the stochastic-process content is the four bolded ones plus the epidemic/percolation models.

| Page | Concept | What learner does | What responds | Verdict |
|---|---|---|---|---|
| Albert & Carl Friedrich | Random walks → diffusion; geometric CLT | Play/Back; pick 1/5/25 paths per walk type (NWSE lattice, ring, triangular, Gaussian steps); toggle paths | Walkers of four step-distributions run side by side; view auto-zooms out with time; insets show each step distribution | **strong** — as the view zooms out the four microscopically different walks become indistinguishable: CLT *as a picture*; √N growth seen because zoom-out slows down |
| Anomalous Itinerary | Lévy flights, infinite-variance steps | Set exponent μ, #walks; Play; toggle path / visited "dust" / current position | Clusters of short hops punctuated by rare long jumps; fractal dust for μ<2; ordinary diffusion for μ>2 | **strong** — the same figure as above with one slider turning CLT off; superdiffusion n^{1/μ} vs √n visible |
| Particularly Stuck | Diffusion-limited aggregation | Sliders attraction, twist, twist-mix, wiggle, speed | Fractal cluster grows from a nucleus | ok — pretty, finance-irrelevant |
| Kelp!!! | Stochastic 1-D cellular automaton | 8 sliders = P(on \| neighbourhood); presets; density; "start with a dot" | Space–time diagram grows upward; sliders at 0/1 give deterministic rules | ok — the "8 sliders = the whole rule table" idea is a clean way to expose a transition kernel |
| Surfing a Gene Pool | Neutral drift at an expanding front | Strains 2/3; capacity, reproduction, diffusion sliders | Mixed drop grows into uniform sectors | ok — randomness alone creating structure |
| Epidemonic / I herd you / Critical HexSIRSize | SIRS / SIS with thresholds | Transmission, recovery, waning sliders; sub-populations; vaccine uptake | Coloured agents; quasi-equilibrium or extinction | ok — threshold behaviour visible; no time-series panel |
| Critically Inflammatory / Barista's Secret | Forest fire SOC / percolation | Growth, lightning, ignition sliders | Scale-free fire sizes; percolating cluster | ok — "no characteristic scale" is stated not measured |
| Berlin 8:00 a.m. | Phantom jams from heterogeneity | Speed variability slider; passing toggles; Play | Cars on a ring road; speedometer shows mean speed collapsing; jams persist after variability is reset to 0 | **strong** — hysteresis demonstrated by a "turn it back and see it stay broken" step |
| Horde of the Flies / Flock'n Roll | Vicsek phase transition | Speed, wiggle, radius sliders; colour by heading | Sudden onset of order | ok — order parameter not plotted, so "transition" is seen not measured |
| Stranger Things | Strange attractors of 2-D maps | Map selector, 2–4 parameter sliders | 200k iterates drawn | ok |

**Weaknesses.** Simulation only — almost never a companion plot (histogram, order parameter, MSD vs t), so quantitative claims ("grows like √N", "scale-free") are asserted in the text; sliders have no units or ranges stated; "Things to try" is prose, not a guided sequence.

## 4. Immersive Linear Algebra (immersivemath.com/ila)

Ten textbook chapters; every figure is live and sits in the text flow with a numbered caption. Two interaction grammars coexist: **(a)** *Backward / Reset / Forward* step-through constructions (the figure is a proof in frames); **(b)** *drag-the-vector* explorables with live readouts. 3-D figures rotate with right-drag. Several chapters open with a motivating "application" figure (ray tracer, image compression, eigenfaces).

| Page → figure | Concept | What learner does | What responds | Verdict |
|---|---|---|---|---|
| Ch2 2.5 / 2.8 | Vector addition / subtraction | Drag tips; Forward | v translated to tip of u, parallelogram completed; −v then u−v | ok — step-through geometry |
| Ch2 2.7 / 2.12 | Scaling, distributivity | Drag v, slider k | kv flips at k<0; similar triangles | ok |
| Ch2 2.17 | What a coordinate system is | Forward | Map grid morphs: standard → flipped → unequal → rotated → arbitrary e₁,e₂ | **strong** — the same map, five bases |
| Ch2 2.22 | Same point, different bases | Drag basis vectors and P | Coordinates of P update; nearly parallel basis → huge coordinates | **strong** — ill-conditioning *felt* through the hand |
| Ch3 3.8 | Dot product and angle | Drag u, v | \|u\|, \|v\|, cos, u·v readouts; sign flips at π/2 | **strong** — "pay attention to the sign" |
| Ch3 3.16 | Signed distance to a line | Drag S, n, P | e(P) readout, ± half-planes | ok |
| Ch3 3.19 | Projection onto a plane | Forward; drag P | v = P−S, projection onto n, subtraction, Q | ok |
| Ch6 6.1 | Matrix acts on data | Type a 3×3 matrix | Every pixel's RGB vector is multiplied; image recolours | **strong** — a matrix as a *filter on a dataset*, not a grid of numbers |
| Ch6 6.2 | Matrix columns = where basis vectors land | Drag columns; "create the identity" | Columns are the arrows | **strong** — core mental model for Cholesky/PCA |
| Ch6 6.3–6.5 | Rotation / scale / shear | Sliders φ, f_x, f_y, s | Rectangle transformed, grey original kept | ok |
| Ch7 7.2 / 7.3 | det = signed area / volume | Drag columns; rotate 3-D | Parallelogram green (+) or red (−); "make det 0 without zero vectors" | **strong** — the sign becomes orientation; zero det = coplanar seen by rotating |
| Ch7 7.4 | Column operation keeps det | λ slider | Parallelogram shears, overlapping area purple, area constant | **strong** — proof as animation |
| Ch7 7.5 | det(A⁻¹) = 1/det(A) | Drag columns of A | Inverse's parallelogram shrinks as A's grows | ok |
| Ch9 9.2 | Why transforms compress | Drag a 4×4 window over an image | Pixel block and its transform side by side | ok |
| Ch9 9.5–9.7 | Mapping: input arrow → output arrow; building a matrix from F(e₁), F(e₂) | Drag red x | Blue y = F(x) follows | ok |
| Ch10 10.1 | Eigenfaces | Drag a point in (x₁,x₂) | Mean face + weighted eigenfaces | **strong** — PCA coordinates as a face you can steer |
| Ch10 10.3 / 10.5 | Eigenvector hunt | Drag v until F(v) ∥ v; readout of \|F(v)\|/\|v\| | Blue output swings around red input | **strong** — a game with a readout that becomes λ at the win state |
| Ch10 10.4 | Max/min elongation | Rotate unit input with slider; Forward | Ellipse of outputs traced | **strong** — the ellipse *is* the SVD/eigen picture |

**Weaknesses.** No "wrong-answer" states or challenges beyond caption suggestions; no numbers from an applied domain; the step-through figures replace the proof but do not let the learner *do* the step; dense notation; page load is heavy.

## 5. R Psychologist (rpsychologist.com)

Eleven stand-alone "dashboard" apps: a settings column (sliders) + one large chart + readouts + an "about" text *below*. Interaction is continuous (slider / drag) and immediate; nothing is scroll-driven.

| Page | Concept | What learner does | What responds | Verdict |
|---|---|---|---|---|
| Confidence Intervals | Coverage | ± sample size, ± speed, Pause | Intervals stream vertically; misses coloured; running % captured | **strong** — the classic; note "narrow interval can still miss" |
| p-values | p is a sampling property | n; Draw +1/+50/+500; **p Hack** button; click a sample for severity; drag the highlighted sample | Sample-mean dots pile up under the sampling distribution; Type-I, power, effect-size (sim), effect-size (pub. bias) readouts | **strong** — the p-hack button is a *break-the-rules* control with a visible cost in the readouts |
| Maximum Likelihood | MLE, score, Fisher info, LRT/Wald/score | Drag μ, σ² sliders; New Sample; choose gradient ascent vs Newton, +1 iteration; n and μ₀ sliders; test selector | Fitted density over fixed data with per-point log-density contributions summed; log-likelihood curve; contour surface with optimiser path; score curve; LRT as the vertical gap between two horizontal lines | **strong** — the single best MLE explainer; the "+1 iteration" button turns optimisation into a step-through |
| Cohen's d | Effect size in five languages | d slider; settings (SD, CER, means) | Two normals, shaded overlap; U3, % overlap, P(superiority), NNT | **strong** — one number re-expressed five ways on the same drawing |
| NHST / power | α, β, power | d, n, α sliders; one/two-tailed; "solve for" | H₀ and Hₐ sampling distributions with shaded α, β, power regions | **strong** — the canonical two-bells picture, live |
| Bayesian inference | Prior × data → posterior; Bayes factor | d, n, prior SD sliders | Prior and posterior curves; black/red dots at δ=0 whose height ratio is the Savage–Dickey BF; HDI, p, CI side by side | **strong** — BF *drawn* as two heights |
| Correlation | What r looks like | r slider; drag/add/delete points; toggles for regression line, residuals, ellipses, slope chart; load CSV | Cloud, ellipses, Venn of shared variance, regression equation | **strong** — Cholesky used under the hood to hit a target r; one dragged outlier swings r |
| Equivalence testing | Superiority / non-inferiority / equivalence | Drag the CI; d, n, Δ sliders | Three hypothesis panels light up pass/fail | ok — decision rules made visible |
| p-value distribution | p ~ U(0,1) under H₀ | d, n sliders; interval selector; log-x toggle | Density of p piles toward 0 as power grows; proportion in selected interval | ok |
| t-distribution | t vs normal | df slider | Overlaid curves | weak |
| PowerLMM | Longitudinal power | Many inputs | Power curves | n/a (specialist) |

**Weaknesses.** Dashboards, not narratives: the explanation is a wall below the tool and the sliders have no suggested order; readouts to two decimals invite "it's a calculator" use; no simulated-data story (all parametric except p-values/CI).

## 6. MLU-Explain (mlu-explain.github.io)

Fourteen Svelte articles. Standard structure: title → intro → a **scrollytelling block** (sticky chart on one side, 3–5 text steps on the other, IntersectionObserver at 70 % visibility advances the chart) → one or more **free-play widgets** with buttons/sliders → maths → conclusion. Mobile disables pointer events on the steps.

| Page | Concept | What learner does | What responds | Verdict |
|---|---|---|---|---|
| Linear Regression | Fit, residuals, prediction, GD vs closed form | Scroll 4 steps; drag sqft slider; drag β₀, β₁ sliders into a bad fit, then "1 / 25 / 100 steps"; New Data | Step 0 flat mean line → step 1 residual segments appear → step 2 line snaps to OLS → step 3 prediction annotation; GD widget: top chart line moves, bottom chart error-vs-iteration | **strong** — "make it wrong by hand, then let the algorithm fix it" |
| Logistic Regression | Why not a line; sigmoid; threshold | Scroll: points → S-curve → decision boundary → try-it; temperature slider and threshold slider (0–1) | Prediction text flips rainy/sunny | ok — tabs (binary/continuous/multivariate) extend it |
| Bias–Variance | Decomposition | Scroll through simple vs complex fits across resampled datasets; "Randomize Train Data", smoothness control (LOESS); K slider + hover (KNN) | Top: many fits on fresh samples; bottom: per-point error split into bias and variance bars; KNN decision regions roughen/smooth | **strong** — many-fits-overlaid *is* variance; the hover shows which K neighbours vote |
| Cross-Validation | K-fold | K slider 2–12 | One panel per fold: train/val/test bar + a line fit to that fold's train, "Val MSE: x"; "Estimated Test MSE" averaged below | **strong** — fits visibly vary more at low K; test set never moves |
| Train/Test/Validation | Why three sets | Click feature set (none/weight/fluffiness/both); **drag the cats and dogs** | Decision boundary refits; validation table updates | **strong** — dragging data into the test region shows leakage |
| ROC & AUC | Threshold sweep → curve | Scroll: threshold sweeps right automatically, ROC points accumulate, then the curve is left for you to drag | Beeswarm of scores splits at the threshold; TPR/FPR point appears on the ROC panel | **strong** — a curve *built* point by point in front of you |
| Precision & Recall *(known)* | Confusion matrix trade-off | Drag threshold | Precision, recall, F1 bars | ok |
| Decision Tree | Entropy, information gain, instability | Add/Remove buttons on a bubble; drag a split line on Diameter; "perturb 5 %" button | Entropy readout; IG curve traced with the peak at 0.45; a *set* of very different trees | **strong** — the perturbation button is a one-click fragility demo |
| Random Forest | Majority vote, bagging | Two sliders (trees, per-tree accuracy); click test points; hover a tree | Condorcet accuracy; per-tree votes and the majority; feature importances | ok |
| Double Descent | Interpolation threshold | Scroll through models; slider for #features; GIF of the gap between points | Fit and MAE; spike at the threshold then fall | ok |
| Neural Networks *(known)* | Layers, activations | Playground-style: choose data, layers; train | Decision surface | ok |
| Reinforcement Learning | Bandit, grid world, ε | "Select 5 / 10 actions"; ε slider; "Run 25 / 150 episodes", "Current route", "Optimal" | Q-values per arm/cell; robot path | ok |
| Equality of Odds | Group thresholds | Tabs; per-group threshold | TPR/FPR per group, ROC per group | ok |

**Weaknesses.** Scrolly steps sometimes have stale text (button says 25, text says 10; prose says k=4, code draws 6); figures reset on re-scroll; the free-play widgets are *after* the explanation, so the learner never predicts first.

## 7. Distill (distill.pub)

| Article | Concept | What learner does | What responds | Verdict |
|---|---|---|---|---|
| Why Momentum Really Works | Momentum GD on a quadratic | Hero: α and β sliders; per-eigencomponent step-size slider; drag a point on the (α, β) convergence-rate map *(known)*; β on the damped-oscillator phase plot; iteration slider on the Laplacian "colorization" example *(known)* | Iterates on contours; three decaying components for λ=0.01, 0.1, 1 with the optimal step size; the map colours regions monotone / ripples / oscillate / diverge and the chosen point's iterates play beside it; velocity-vs-position spiral | **strong** — one figure (the α–β map) *is* the theorem; the eigen-decomposition figure shows why one step size cannot serve all curvatures |
| A Visual Exploration of Gaussian Processes | GP = conditioning a big Gaussian | Drag handles on a bivariate normal (marginal vs conditional); drag a 2-D sample and see it become two function values; kernel gallery sliders over a 25×25 covariance heatmap; click the plot to draw a prior sample (old ones fade); click points to make them observations; hover the covariance matrix; tick boxes to combine kernels | Mean and band update; covariance banding widens with length-scale; band pinches to zero at observations | **strong** — "a function is a point in a high-dimensional Gaussian" made draggable; click-to-observe is the clearest conditioning demo anywhere |
| Exploring Bayesian Optimization | Surrogate + acquisition | Mostly GIF sequences with ε = 0.075 / 0.3 / 3; slider over iterations on the SVM hyperparameter surface | Posterior tightens; next query marked | ok — parameter *sweep as a sequence of figures with one sentence each* is the reusable pattern |
| Feature Visualization | Optimising inputs | Static grids; hover *(known)* on the layer/neuron atlas | Image per neuron | weak for us — gallery, not explorable |
| Visualizing memorization in RNNs | Which past inputs matter | Hover a character; click inline links that jump the figure to a timestep; remove letters | Past characters shade green by gradient connectivity; suggestions update | **strong** — *inline text links that drive the figure* ("click 'initially'") is a presentation pattern worth copying |

**Weaknesses.** Long; figures assume the reader already knows the maths; no step-through for derivations; Momentum's hero figure has no suggested settings so most readers never find the oscillatory regime.

## 8. Google PAIR Explorables (pair.withgoogle.com/explorables)

Fifteen single-column essays, figure inline after the sentence that introduces it. Signature moves: a *grid of little people/items* that re-sorts; a draggable threshold; "try X and notice Y" sentences; appendices with the fuller tool.

| Page | Concept | What learner does | What responds | Verdict |
|---|---|---|---|---|
| Are Model Predictions Probabilities? (calibration) | Scores ≠ probabilities; calibration; drift | Drag a threshold; drag *several* thresholds to form buckets; change rain frequency | Days re-sorted into buckets; empirical rain rate per bucket vs score; calibration breaks when base rate shifts | **strong** — calibration = "bucket then count" with your own buckets |
| Confidently Incorrect → Humble Ensembles | OOD confidence | Draw a digit; click through morphing images; add models; drag a blue point to the lower right | Confidence stays high on a shoe; ensemble band widens far from data | **strong** — drag-a-point-away-from-the-data shows where models disagree |
| Why Some Models Leak Data | Memorisation = leakage | Drag soccer players; change one salary | Prediction map reveals player positions; regression slope swings for the atypical hire, barely for a typical one | **strong** — flexible vs 2-line model side by side; leverage of atypical points |
| Measuring Fairness | Precision/recall by group | Slider: aggressiveness; separate sliders per age group; drag accuracy and base rate | Grid of people re-coloured; two metrics align, third cannot | **strong** — impossibility theorem as "you cannot make all three line up" |
| Hidden Bias | Proxies | Scroll; (GIF reveals) | Predictions by gender shift as variables are added | ok |
| Datasets Have Worldviews | Labels encode choices | Choose labelling scheme; Run Classifier | Error distribution regroups | ok |
| Do ML Models Memorize or Generalize? (grokking) | Memorise → generalise | Mouse over the training curve; click through runs | Weight heatmap at that step; neurons snap to a circle in cos/sin | **strong** — scrub-a-training-curve-to-see-the-weights |
| Measuring Diversity | Mean vs max difference | Click shapes to hit targets; drag target slider | Rankings re-sort with histograms | ok |
| Can a Model Be Private and Fair? | DP noise vs accuracy | Increase noise; drag points; clip gradients; click a model | Two boundaries overlap more; accuracy gap for rotated digits | ok |
| Federated Learning | Aggregation, DP | Click messages; drag shared random numbers; run a round; exclude outliers; DP slider; playground sweep | Masked values change, sum does not; global heat-map; accuracy dips after merge | ok |
| Collecting Sensitive Information | Randomised response | Flip coins; Flip 200 times | Reported vs true rate; error distribution | ok — same accumulate pattern as Seeing Theory |
| Searching for Unintended Biases with Saliency | Spurious features | Mouse-over occludes a patch; hover thumbnails / scatter dots | Prediction flips when the watermark corner is covered | ok |
| What Have Language Models Learned? | Token probabilities | Click a word; type a sentence; compare two names | Fill-in lists, difference scatter | ok |
| Patchscopes / SAE | Interpretability | Hover indices; choose layers | Descriptions per layer | weak for us |

**Weaknesses.** Interactions are often a single slider in an essay otherwise read like prose; little maths; figures are unlabeled (no axes) by design, which would not survive a quant audience.

---

## Catalogue entries (distinct techniques)

### Run-and-accumulate convergence (1 / 100 / 1000 trials)
- Source: seeing-theory.brown.edu/basic-probability (Expectation, Variance), /frequentist-inference (CI, Bootstrap); pair.withgoogle.com/explorables/anonymization
- Topic illustrated there: LLN, running mean → E[X]; CI coverage; bootstrap SE
- What moves / what the viewer does: presses "one trial" a few times, then "100", then "1000"; a running statistic or a histogram accumulates; a horizontal target line or theoretical curve is overlaid
- What it makes visible that text cannot: *the rate* at which noise shrinks — the first ten presses jump, the hundredth barely moves; and that a single draw says nothing
- Our chapters that could use it: 0.2 (binomial → normal), E2 (MC convergence 1/√N with a log–log error panel added), E1 (backtesting: count VaR breaches as days stream), B2 (martingale: running average of a fair game), C2 (binomial tree price vs number of steps)
- Notes on execution: always pair the accumulation with a *second* panel of error vs n on log axes — the sites never do and so the √N law stays a sentence; seed the RNG so "Reset" reproduces.

### Drag the true distribution, watch the empirical catch up
- Source: seeing-theory.brown.edu/basic-probability (Chance Events, draggable "true probability" bars); /bayesian-inference (drag prior and accuracy bars)
- Topic illustrated there: frequency vs probability; base-rate fallacy
- What moves: learner drags the *generator's* parameters, then samples; the sampled bars fill toward the dragged ones
- What it makes visible: the two-layer world of model vs data; that the data never equal the model
- Our chapters: A1 (drag skew/kurtosis of the generator, sample returns, compare histograms), A5 (drag σ_t path; see the squared-return series), E1 (drag tail weight and watch VaR breaches)
- Notes: keep "true" and "observed" in two fixed colours across the whole chapter.

### Pick a skewed source, stack sample means, overlay the theoretical normal
- Source: seeing-theory.brown.edu/probability-distributions (CLT: Beta(α,β) source, sample-size and #draws controls, "Theoretical" checkbox)
- Topic: CLT
- What moves: source shape sliders; each press drops a batch of sample means into a histogram; a checkbox overlays N(μ, σ²/n)
- What it makes visible: that the *source* can be anything and the *means* still go normal, and that n controls the width
- Our chapters: 0.2 (core), A1 (why daily returns are not normal even though CLT exists — show that a Lévy/heavy-tail source *fails* to converge: pair with the Anomalous Itinerary idea), E2 (standard error of an MC estimate)
- Notes: let the learner set sample size to 1 first, so they see the source itself; then 2, 5, 30.

### Geometric CLT: four different random walks, auto zoom-out until indistinguishable
- Source: complexity-explorables.org/explorables/albert-and-carl-friedrich
- Topic: random walk → diffusion
- What moves: 1/5/25 walkers per step-distribution (lattice, ring, triangular, Gaussian) run simultaneously; the viewport zooms out with time; inset shows each step law
- What it makes visible: micro-structure washes out; the zoom-out speed *is* √t scaling
- Our chapters: B1 (random walk), B3 (Brownian motion as the scaling limit; add a 1-D version with the time axis horizontal so the zoom-out becomes the Donsker picture), 0.2
- Notes: add the one thing the original lacks — a side panel of mean squared displacement vs t on log–log with slope 1.

### One slider that switches the CLT off (Lévy exponent μ)
- Source: complexity-explorables.org/explorables/anomalous-itinerary
- Topic: Lévy flights, infinite variance, superdiffusion
- What moves: μ slider; toggle path / visited-dust; the same walker display as above
- What it makes visible: rare huge jumps dominating displacement; fractal dust; μ>2 restores ordinary diffusion
- Our chapters: A1 (fat tails: "what if returns had infinite variance?"), D3 (jump diffusion: Merton jumps as a walk with two step laws), E1 (why historical VaR underestimates after a quiet window)
- Notes: show the step-length histogram on log–log beside the walk so "power law" is a straight line, not a word.

### Build your own random variable on the sample space
- Source: seeing-theory.brown.edu/probability-distributions (Random Variables)
- Topic: RV as a function Ω → ℝ
- What moves: drag-select regions of a sample space, type the value they map to, Submit; then Sample to see the induced distribution
- What it makes visible: the distribution is *induced* by the map, not primitive
- Our chapters: C1 (payoff as a function of the terminal-price sample space: paint regions of S_T and assign payoff; the histogram of payoffs appears), B5 (change of measure: same map, different weights on Ω), H1 (digital/barrier payoffs painted on path space)
- Notes: for options, make the sample space the S_T axis coloured by probability density; the learner paints the payoff.

### Enumerate the count: click a cell of the P(n,r)/C(n,r) table and see every arrangement drawn
- Source: seeing-theory.brown.edu/compound-probability (Counting)
- Topic: permutations vs combinations
- What moves: click a cell → all arrangements drawn as marbles
- What it makes visible: the number is a *set of pictures*; C < P because orderings collapse
- Our chapters: 0.2 (binomial coefficient as paths through a lattice: click C(n,k) and every up/down path with k ups lights up on the tree), C2 (binomial tree node count = C(n,k))
- Notes: cap at n ≈ 6; beyond that, show a sample of paths plus the count.

### Conditioning as a filter: balls rain through shelves
- Source: setosa.io/ev/conditional-probability (origin), seeing-theory compound probability tabs
- Topic: P(B|A) = P(A∩B)/P(A)
- What moves: drag the shelf widths (P(A), P(B)); balls fall; a "perspective" toggle hides every ball that missed A
- What it makes visible: conditioning throws away balls and renormalises what is left
- Our chapters: B1 (Markov property: condition on today's state, the future's histogram is the same whatever the past), B2 (martingale: E[X_{t+1} | F_t] as the mean of the balls that pass today's filter), E1 (ES = mean of the balls beyond the VaR shelf), H1 (barrier: discard paths that touched)
- Notes: render the discarded balls as faint ghosts, not removed — the renormalisation is then obvious.

### Drag a data point; the fitted line, residual squares and coefficient table update
- Source: setosa.io/ev/ordinary-least-squares-regression; seeing-theory regression (Anscombe I–IV + drag); rpsychologist.com/correlation (drag/add/delete, ellipses); pair.withgoogle.com/explorables/data-leak (slope swings for the atypical hire)
- Topic: OLS, leverage, correlation
- What moves: drag points; squares on residuals resize; line re-fits; r, β, SSE readouts; preset Anscombe quartet
- What it makes visible: squared error as area; one high-leverage point steering the fit; same r, different pictures
- Our chapters: A3 (core: add presets for heteroskedastic, collinear and autocorrelated clouds so dragging shows *why* each breaks OLS; show the two regression lines x-on-y and y-on-x), A2 (correlation as ellipse tilt), G1 (regularisation: drag a point and watch ridge vs OLS move differently), A5 (QQ-plot: drag a tail point)
- Notes: draw the residual squares — setosa's single best trick; keep the Anscombe-style presets as one-click "stories".

### Edit the matrix, watch the chain run; sticky vs coin-flip sample paths
- Source: setosa.io/ev/markov-chains; setosa.io/ev/eigenvectors-and-eigenvalues (NY/CA migration to steady state)
- Topic: transition matrix, stationarity, λ=1
- What moves: edit the matrix as text (rows must sum to 1, else red); a token hops; the emitted state string streams; drag migration fractions and starting populations and hover to run to steady state
- What it makes visible: what P(stay)=0.9 *looks like* as a sequence (runs); the steady state is independent of the start
- Our chapters: B1 (core), A4 (regime switching / mean reversion as a two-state chain; AR(1) as the continuous analogue), A5 (volatility regimes), D3 (Heston's vol-of-vol as the speed of state changes)
- Notes: show two sample sequences one above the other (sticky vs independent) *before* any matrix; validation in red is a good "the model must be a probability" lesson.

### Drag v until Av is parallel: the eigenvector game, plus the ellipse of outputs
- Source: immersivemath.com/ila/ch10 (10.3, 10.4, 10.5); setosa.io/ev/eigenvectors-and-eigenvalues (drag v; drag A's columns until the trajectory spirals; repeated application v, Av, A²v)
- Topic: eigenvectors, dominant eigenvalue, complex eigenvalues
- What moves: drag the input arrow; the output arrow swings; readout |Av|/|v| becomes λ when aligned; slider rotates a unit input and traces the output ellipse; press Forward to iterate A
- What it makes visible: eigenvectors are the *directions that do not turn*; the ellipse's axes are the eigen/singular directions; iteration collapses onto the dominant eigenline
- Our chapters: A2 (PCA: the covariance ellipse's axes; drag the point cloud and watch the ellipse), E3 (PCA on yield curves: level/slope/curvature as the three ellipsoid axes), G2, A4 (AR(p) stability: eigenvalues inside the unit circle; drag coefficients until the trajectory spirals or explodes)
- Notes: pair the ellipse figure with the covariance *matrix* heatmap so numbers and picture coexist.

### Matrix columns are where the basis lands; apply the matrix to a whole dataset
- Source: immersivemath.com/ila/ch06 (6.1 recolour an image by a 3×3 matrix; 6.2 drag the columns), ch07 (7.2/7.3 determinant as signed area/volume; 7.4 shear keeps area), ch02 (2.22 same point in two bases, near-parallel basis → huge coordinates)
- Topic: matrix as transformation; det; change of basis; conditioning
- What moves: type a matrix and every pixel/point is transformed; drag column arrows; parallelogram turns red when orientation flips; slider shears
- What it makes visible: a matrix is a verb; det=0 means the columns fell into a plane; ill-conditioning is felt as coordinates exploding
- Our chapters: A2 (Cholesky: drag the two columns of L and watch an independent N(0,I) cloud become a correlated cloud — the single best way to teach Cholesky; det = area scaling = |Σ|^{1/2}), A3 (multicollinearity = near-parallel columns; coefficients explode exactly as in 2.22), E3 (change of basis to PCs), F1 (tridiagonal solve as a matrix acting on the grid vector)
- Notes: for Cholesky, show the *same* 500 points before and after; animate the morph.

### PCA by dragging points: axes re-orient; projected coordinates in a second panel; 3-D rotate then "show PCA"
- Source: setosa.io/ev/principal-component-analysis; immersivemath ch10 10.1 (eigenfaces: drag a point in PC space and see the reconstructed face)
- Topic: PCA
- What moves: drag points; rotate 3-D cloud; a button snaps the view to the PC frame; the 17-D table collapses
- What it makes visible: PC1 is the long axis; dropping PC3 loses little; a point in PC space *is* a reconstructed object
- Our chapters: A2, E3 (yield curve: drag a point in (PC1,PC2,PC3) space and see the reconstructed curve — the eigenfaces trick with curves), G2 (autoencoder as nonlinear PCA, same figure)
- Notes: the "steer a point in loading space, see the reconstruction" figure is the one to build for yield curves.

### Fix the data, slide the parameter: likelihood traced live; +1 optimiser step
- Source: seeing-theory.brown.edu/bayesian-inference (Likelihood: purple θ slider); rpsychologist.com/likelihood (μ, σ² sliders; per-point log-density contributions summed; contour surface; gradient ascent vs Newton +1 iteration; n slider narrows the peak = Fisher information; LRT as a vertical gap)
- Topic: MLE, score, information, LRT
- What moves: drag θ; the density slides under fixed data; each data point's log-density bar updates and the sum is the likelihood; press +1 to take one optimiser step on the contour map
- What it makes visible: likelihood is a function of the *parameter*, data fixed; the optimiser is a walk on a surface; more data → sharper peak
- Our chapters: A5 (GARCH fitting: slide ω, α, β and watch the implied σ_t path lie over |r_t|, with the log-likelihood as a sum of per-day bars; +1 BFGS step on the (α,β) contour; show the flat ridge that makes GARCH fitting hard), A4 (AR(1) φ by MLE), C3 (implied vol = root finding on a 1-D "likelihood": slide σ until model price = market price), F2 (calibration as the same picture over Heston parameters), G1
- Notes: per-point contribution bars are the key; without them "sum of log-likelihoods" stays abstract.

### Posterior becomes next prior: flip, redraw, repeat
- Source: seeing-theory bayesian-inference (Prior to Posterior); rpsychologist.com/d3/bayes (Savage–Dickey: BF as the ratio of two heights at δ=0)
- Topic: sequential Bayesian updating; Bayes factor
- What moves: Flip / Flip 10; the Beta curve narrows and drifts to the hidden truth
- What it makes visible: learning as a shrinking curve; the prior matters less as data grow
- Our chapters: A5 (EWMA as recursive updating: each day's r² nudges σ²; the λ slider is the "prior weight"), G3 (online learning), B5 (change of measure as re-weighting the same curve)
- Notes: hide the true parameter and reveal it on demand.

### Stream of confidence intervals with misses coloured
- Source: rpsychologist.com/d3/CI; seeing-theory frequentist-inference
- Topic: coverage
- What moves: intervals stream, running % captured
- What it makes visible: coverage is a property of the *procedure*; narrow intervals still miss
- Our chapters: E1 (VaR backtesting: each day's 99 % VaR as an interval, breaches coloured, running breach rate vs 1 %; Kupiec test as the tally), E2 (MC confidence bands around a price estimate), A5 (volatility forecast intervals and their realised coverage)
- Notes: this *is* the VaR backtest picture; just rotate it to time-on-x.

### Drag the threshold; the confusion matrix and the ROC point move; sweep to build the curve
- Source: mlu-explain.github.io/roc-auc (scroll sweeps the threshold, ROC points accumulate); /precision-recall; pair.withgoogle.com/explorables/measuring-fairness (per-group thresholds; three metrics cannot all align); /uncertainty-calibration (drag several thresholds to form buckets)
- Topic: classification thresholds, calibration
- What moves: drag a threshold line through a beeswarm of scores; counts in a 2×2 update; a point moves along the ROC; multiple thresholds make buckets with empirical rates
- What it makes visible: a curve is a *parametrised family of decisions*; calibration = bucket and count
- Our chapters: E1 (VaR as a threshold on the P&L beeswarm; ES as the mean beyond it), G1/G3 (classifier evaluation; calibration of a volatility-regime model), D2 (strike as a threshold on S_T: digital price = fraction beyond; the smile as the mismatch between model and bucket rates)
- Notes: the automatic sweep *then* hand-over-to-the-user sequence (ROC page) is a good pattern.

### Make it wrong by hand, then let the algorithm fix it (β sliders + "1 / 25 / 100 steps")
- Source: mlu-explain.github.io/linear-regression (GradientDescent component); rpsychologist likelihood (+1 iteration)
- Topic: gradient descent
- What moves: drag β₀, β₁ to a bad fit; press steps; top panel line moves, bottom panel error-vs-iteration
- What it makes visible: optimisation as a sequence of improving pictures; the loss curve as a diary of the top panel
- Our chapters: F2 (calibration: drag Heston parameters to a bad smile fit, press "10 LM steps"; AD for Greeks), A5 (GARCH), C3 (implied vol by Newton: press a step, see the tangent), F1 (iterative PDE solvers), G1
- Notes: always show both panels; keep the step counter visible.

### Many fits on resampled data, overlaid (variance as a cloud of curves)
- Source: mlu-explain.github.io/bias-variance ("Randomize Train Data", LOESS smoothness; KNN K slider with hover-to-show-neighbours); /cross-validation (one panel per fold with its own fit and Val MSE; K slider 2–12); /decision-tree ("perturb 5 %" → a set of different trees)
- Topic: bias–variance, CV, instability
- What moves: press randomize; a new fit is added to the overlay; the error bar splits into bias and variance; K slider changes fold count and the fits per panel
- What it makes visible: variance is the *spread of fits*, not a number; low K → fits disagree
- Our chapters: G1 (core), G3 (walk-forward: folds that move in time, never shuffled — show the leakage version beside it), A5 (GARCH parameter instability across rolling windows), E1 (historical VaR window sensitivity), D1 (hedging P&L distribution across many simulated paths — the "cloud of outcomes")
- Notes: fade older fits; the per-fold grid (CV page) beats a single animated figure for this.

### Drag data across the train/test line; the boundary refits
- Source: mlu-explain.github.io/train-test-validation (drag the cats and dogs); pair.withgoogle.com/explorables/data-leak (soccer prediction map reveals player positions)
- Topic: leakage, memorisation
- What moves: drag a labelled point from test into train; the model refits; the validation table changes
- What it makes visible: a model that memorises *contains* its data; a point moved into training flips its own prediction
- Our chapters: G3 (leakage and backtest overfitting: drag tomorrow's return into the feature window and watch Sharpe jump), G1 (regularisation as the two-line model vs the patchwork model)
- Notes: a one-click "leak the future" button with a before/after Sharpe is the finance version.

### Click to add an observation; the GP band pinches to zero there
- Source: distill.pub/2019/visual-exploration-gaussian-processes (click to observe; hover the covariance matrix; kernel sliders over the 25×25 heatmap; drag a 2-D sample → two function values)
- Topic: conditioning a multivariate Gaussian; kernels
- What moves: click → point becomes an observation; mean and band update; hover a matrix cell to see that pair's covariance; draw prior samples with a click, old ones fade
- What it makes visible: a function as one draw from a big Gaussian; conditioning as slicing; covariance as the heatmap's banding
- Our chapters: A2 (multivariate normal: drag the ellipse, see marginal vs conditional — the first GP figure is exactly A2's conditional-normal lesson), B3 (Brownian bridge: click to pin a point on a path and watch the band pinch — the Brownian motion covariance min(s,t) as the heatmap), E2 (Brownian bridge for variance reduction / barrier correction), D2 (vol surface interpolation as a GP), F2 (calibration as regression)
- Notes: the covariance-heatmap-with-hover beside the function plot is the pairing to copy for B3.

### The (α, β) map: one figure that *is* the theorem; eigencomponents decay at different rates
- Source: distill.pub/2017/momentum (convergence-rate map over step size × momentum; three components λ = 0.01, 0.1, 1 under one step size)
- Topic: momentum GD, conditioning
- What moves: drag a point on the map; its iterates play beside; slide the step size and watch the three decays
- What it makes visible: regions of monotone / oscillatory / divergent behaviour; that one step size cannot suit all curvatures
- Our chapters: F1 (explicit FD stability: the (Δt/Δx²) map coloured stable/unstable with the solution playing beside — the von Neumann condition as a picture), F2 (optimiser choice for calibration), A4 (AR(2) stability triangle: drag (φ₁, φ₂) and see the impulse response monotone/oscillatory/explosive)
- Notes: the "drag a point on a parameter map, see the dynamics beside" is a general pattern for every stability condition in the syllabus.

### Scrub the training curve to see the model's internals at that step
- Source: pair.withgoogle.com/explorables/grokking (mouse over the accuracy curve; weight heatmap updates; neurons snap to a circle); distill memorization-in-rnns (hover a character)
- Topic: training dynamics
- What moves: hover x on a curve; a second panel shows state at that x
- What it makes visible: a time series of *pictures*, not of numbers
- Our chapters: D1 (hover a point on the cumulative hedging P&L and see the position, delta, gamma and the price path at that date), A5 (hover the σ_t forecast series and see the day's GARCH update), C2 (hover the convergence curve of the binomial price and see the tree at that n), B4 (hover a path and see the local Itô expansion), E2 (hover an MC convergence curve, see the paths so far)
- Notes: cheap to build, very high value; make it the default affordance on every time-series plot in our chapters.

### Parameter sweep as a sequence of small figures with one sentence each (ε = 0.075 / 0.3 / 3)
- Source: distill.pub/2020/bayesian-optimization
- Topic: exploration vs exploitation
- What moves: nothing; three stills (or GIFs) at three parameter values, each with a one-line caption
- What it makes visible: the *trend* across a parameter without a slider; the reader cannot miss the interesting values
- Our chapters: D2 (smile at three vol-of-vol values), D3 (Heston paths at ρ = −0.7 / 0 / +0.7), C4 (gamma at three maturities), A1 (kurtosis 3 / 6 / 30), H2 (autocall at three barrier levels)
- Notes: use this *instead of* a slider whenever only three values matter; put the slider in an appendix.

### Inline text links that drive the figure
- Source: distill.pub/2019/memorization-in-rnns ("click 'initially'" jumps the figure to that timestep); setosa eigenvectors (hover over the animation)
- Topic: any
- What moves: clicking a word in the prose sets the figure's state; a reset link restores it
- What it makes visible: text and figure are one object; the author can point at a specific state
- Our chapters: all; especially B4 (click "second-order term" and the figure zooms into the (dW)² tile), C4 (click "at the money" and the Greek surface's cursor moves there), H2 (click each vanilla in the decomposition and it lights up in the payoff diagram)
- Notes: works with scroll or without; a good alternative to scrollytelling for a quant audience that reads non-linearly.

### Break-the-rules button (p-hack / perturb 5 % / turn variability back to zero)
- Source: rpsychologist.com/pvalue (p Hack); mlu-explain decision-tree (perturb); complexity-explorables berlin-8-am (set variability back to 0, jams persist)
- Topic: fragility, hysteresis, bad practice
- What moves: one button does the wrong thing; readouts show the cost
- What it makes visible: consequences of a practice, not its definition; hysteresis (the system does not return when you undo)
- Our chapters: G3 (p-hack the backtest: "try 20 strategies" button, best Sharpe vs honest Sharpe), D1 (hedge "only when delta moves 10 %" vs daily), E1 (shrink the VaR window), D3 (jump: turn jumps on then off, the smile stays if calibrated to the jumpy data), A4 (unit root: nudge φ from 0.99 to 1.0)
- Notes: label the button honestly ("Cheat"); keep the honest number on screen.

### Model-vs-model side by side on the same data (flexible patchwork vs two straight lines; single model vs ensemble)
- Source: pair.withgoogle.com/explorables/data-leak; /uncertainty-ood (ensemble band widens away from data; drag a point to the lower right)
- Topic: overfitting, epistemic uncertainty
- What moves: toggle or add models; drag a data point far away
- What it makes visible: disagreement grows where data are absent
- Our chapters: D3 (BS vs local vol vs Heston vs SABR on the same smile, then extrapolate to a strike with no quotes: the models fan out), D2 (surface interpolation vs extrapolation), E1 (historical vs parametric vs MC VaR on the same P&L), C2 (binomial vs BS on the same option as n grows)
- Notes: identical axes, identical data, colours fixed per model.

### Eight sliders = the whole transition kernel
- Source: complexity-explorables.org/explorables/kelp
- Topic: stochastic cellular automaton
- What moves: one slider per neighbourhood configuration sets P(on); setting them to 0/1 recovers deterministic rules
- What it makes visible: a stochastic rule is a table of probabilities; determinism is the corner case
- Our chapters: B1 (Markov chain as a table of sliders, with the deterministic corner), C2 (binomial tree: p slider with u, d; risk-neutral p as the special value where the tree is a martingale)
- Notes: limit to ≤ 4 states or it becomes a spreadsheet.

### Step-through construction (Backward / Reset / Forward) in place of a proof
- Source: immersivemath.com/ila ch2 2.17, ch3 3.19, ch7 7.4, ch10 10.4; mlu-explain scrolly steps (same thing driven by scroll)
- Topic: geometric derivations
- What moves: each Forward adds one construction line or morphs one thing; captions change
- What it makes visible: the *order* of a derivation; the learner can go back one frame
- Our chapters: 0.1 (Taylor: add one term per Forward and watch the polynomial hug the curve further), B4 (Itô: expand f(X+dX) one term per step, kill the o(dt) tiles), C1 (put-call parity: build the two portfolios leg by leg), C3 (BS derivation: hedge, cancel dW, set drift to r, one step each), B6 (Feynman–Kac both directions), H2 (decompose an autocall into vanillas, one leg per step)
- Notes: buttons beat scroll for derivations — the learner needs to stop and reread; keep a frame counter "step 3 of 7".

### Dashboard: sliders + one chart + readouts in five languages
- Source: rpsychologist.com/cohend (d → overlap, U3, P(superiority), NNT); /d3/NHST
- Topic: effect size; power
- What moves: one slider; many readouts and one annotated picture update together
- What it makes visible: one number means several things at once
- Our chapters: C4 (σ or T slider → delta, gamma, theta, vega readouts plus the payoff/price curves: one slider, five Greeks), A1 (kurtosis slider → tail probability, VaR, ES, "1-in-N-years" readouts), D2 (implied vol ↔ price ↔ breakeven move)
- Notes: good for *reference* panels inside a chapter; not a chapter's main figure.

### Agent simulation with Play/Reset and a "turn it back" experiment
- Source: complexity-explorables.org (all), especially berlin-8-am and i-herd-you (critical threshold)
- Topic: emergent dynamics, thresholds, hysteresis
- What moves: Play; sliders; the display is the agents themselves
- What it makes visible: collective behaviour from local rules; critical points
- Our chapters: E3 / A2 (correlation in a crisis: agents that copy neighbours produce a correlation that jumps at a threshold), D1 (many hedgers at the same barrier as agents — gamma squeeze), B1 (Poisson process: arrivals as agents)
- Notes: always add a measured panel (order parameter, mean, histogram) or the claim stays qualitative.

---

## Presentation patterns

**Scroll-driven (MLU-Explain scrolly blocks, some Distill).** Sticky figure on one side, text steps on the other; each step mutates the figure when ~70 % visible. Strengths: the author controls order; text and figure are tightly coupled; works well for a 3–5-step build-up (flat line → residuals → fitted line → prediction). Weaknesses seen: stale text vs code; figures reset when scrolling back; interaction inside a step is awkward (MLU disables pointer events on mobile); quant readers skim and lose the state. **Use for:** 3–6 step narrative openers; never for the whole chapter.

**Inline figures in a single column, continuously live (setosa, Immersive Math, PAIR, Distill).** Figure sits after the sentence that introduces it; the learner drags any time. Strengths: non-linear reading; the figure is also a reference tool. Weaknesses: without a suggested action the learner wiggles a slider and moves on; Immersive Math's captions ("try to make det zero without zero-length vectors") are the fix — every figure needs one *challenge sentence*.

**Button-driven step-through (Immersive Math Backward/Reset/Forward; MLU "1/25/100 steps"; rpsychologist "+1 iteration").** Best for derivations and algorithms. Lets the learner go back; stays put while they reread. Prefer this to scroll for Taylor, Itô, BS derivation, calibration steps.

**Dashboard / tool (rpsychologist, Seeing Theory widgets, complexity-explorables).** Controls panel + one display + readouts; explanation elsewhere. Best for *reference* use (Greeks panel, distribution explorer). Fails as teaching if it is the first thing shown: no story, no order.

**Tabs (Seeing Theory discrete/continuous; MLU logistic binary/continuous/multivariate; PAIR equality-of-odds).** Parallel variants of one figure. Good for "same picture, three models" (D3), poor for sequences.

**Text ↔ figure coupling devices.** (i) Inline links that set figure state (Distill RNN); (ii) readouts in the prose that update live (setosa `{{pOfBGivenA}}`, MLU's prediction sentence); (iii) click a table column to get its explanation (Seeing Theory regression); (iv) parameter sweep as three captioned stills (Distill BO). All four are cheap and we should use all four.

**"Run the simulation" vs continuous sliders.** Sites that *run* (Seeing Theory, complexity-explorables, PAIR coin flips) teach randomness and convergence — the learner must feel that two runs differ. Sites that *slide* (rpsychologist, Immersive Math, setosa) teach functional dependence — the picture is deterministic in the control. Mixing them badly (a slider that re-seeds the RNG on every tick) makes noise look like dependence. Rule for us: **sliders for parameters, buttons for randomness, and a fixed seed with an explicit "new sample" button** (rpsychologist does exactly this). Speed controls on animations (setosa, rpsychologist CI) matter more than they look: without one, convergence animations are either boring or unreadable.

**Companion statistics panel.** The biggest systematic gap across the simulation sites (complexity-explorables especially): the picture moves but nothing is measured. Distill and rpsychologist always have the measured curve beside the picture. Every simulation figure of ours should ship with its measured panel (histogram, error vs n on log axes, MSD vs t, breach count).

---

## Top 15 ideas for our chapters

1. **Cholesky as a drag-the-columns morph (A2).** Start with 500 i.i.d. N(0,I) points; the learner drags the two columns of L (Immersive Math 6.2 / 7.2) and watches the cloud shear into a correlated ellipse; det(L) shown as area. PCA then re-draws the ellipse axes (setosa PCA). One figure teaches correlation, Cholesky, det and PCA.
2. **Random-walk zoom-out → Brownian motion (B1 → B3).** Albert & Carl Friedrich in 1-D with time horizontal: four step laws, auto zoom-out, plus an MSD-vs-t log–log panel. A Lévy μ slider (Anomalous Itinerary) then switches the CLT off and motivates jumps (D3) and fat tails (A1).
3. **Galton board with click-a-C(n,k)-cell to light every path (0.2).** Seeing Theory's "draw every arrangement" on the binomial lattice; balls accumulate (run-and-accumulate); theoretical normal overlay with a checkbox; the same lattice becomes the binomial tree in C2.
4. **Paint-your-own payoff on the S_T sample space (C1, H1).** Seeing Theory's build-a-random-variable: the learner shades regions of the terminal-price axis and types the payoff; the induced payoff histogram and the price (= mean under the drawn density) appear. Repainting the density (B5) shows change of measure.
5. **Balls through shelves for conditioning (B1, B2, E1, H1).** Setosa's falling balls: filter paths by today's state (Markov), by touching a barrier (knock-out), by exceeding VaR (ES = mean of what passes).
6. **GARCH fitting as fixed data + sliding parameters + per-day likelihood bars + "+1 optimiser step" (A5).** Seeing Theory likelihood + rpsychologist MLE: slide (ω, α, β), σ_t path over |r_t|, log-likelihood as the sum of per-day bars, a contour map of the (α, β) ridge with the optimiser walking on it. Reuse for implied vol (C3) and Heston calibration (F2).
7. **VaR backtest as the streaming-CI figure (E1).** rpsychologist CI rotated: each day's VaR as an interval, breaches coloured, running breach rate vs 1 %, with "shrink the window" and "fatten the tails" buttons showing the breach rate drift.
8. **Hover-the-curve-to-see-the-state on every time-series figure (D1, A5, C2, E2).** PAIR grokking: hover the cumulative hedging P&L and see position, delta, gamma and the price path at that date; hover an MC convergence curve and see the paths so far.
9. **The stability map (F1, A4).** Distill momentum's (α, β) map re-cast as the explicit-FD (Δt, Δx) map coloured stable/unstable with the solution playing beside the cursor; the AR(2) (φ₁, φ₂) triangle with the impulse response beside.
10. **Click-to-pin a Brownian bridge with a covariance heatmap beside (B3, E2).** Distill GP: the Brownian covariance min(s,t) as a heatmap; clicking a time pins the path there and the band pinches; hover a matrix cell to see which pair it is.
11. **Make it wrong by hand, then "10 steps" (F2, C3, G1).** MLU gradient descent: drag Heston parameters to a bad smile fit, press 10 Levenberg–Marquardt steps, watch the smile and the error diary.
12. **Many-fits overlay for variance and walk-forward folds for leakage (G1, G3, A5).** MLU bias–variance + cross-validation: a panel per rolling window with its own GARCH fit and parameter readout; a "shuffle the folds" cheat button that leaks the future and inflates the score.
13. **Model fan-out beyond the data (D3, D2, E1).** PAIR ensembles: BS / local vol / Heston / SABR calibrated to the same quotes agree in the middle and fan out at strikes with no quotes; same pattern for three VaR methods on one P&L.
14. **Step-through derivations with Backward/Reset/Forward and a frame counter (0.1, B4, C3, B6, H2).** Immersive Math's construction figures: Taylor adds one term per step; Itô expands and kills o(dt) tiles one per step; an autocall is decomposed one vanilla per step with each leg lighting up in the payoff diagram when its name is clicked in the text.
15. **Sticky vs coin-flip sample sequences before any matrix (B1, A4, A5).** Setosa Markov: show two generated sequences one above the other, then the matrix, then let the learner edit it (rows must sum to 1, red otherwise); extend to a two-state volatility regime whose sample path of σ_t sits above a path of returns.
