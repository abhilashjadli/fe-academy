# Audit: interactive quantitative-finance teaching sites

_Phase R0. Audited 2026-10-21 via WebFetch (text-only; JS-rendered walkthrough text and live readouts were not visible, noted where it matters). Purpose: extract pedagogy and interaction ideas, not code or design. Verdicts are about what the tool makes the learner **see**, judged against our charter §1 ("quality of each chapter's illustration") and §2 baseline (no finance assumed)._

Sites covered: drwong.cc (15 labs), riskhub.org (8 calculators + course lessons + blog), QuantEcon (intro / python / python-advanced lectures), CME Group Education + QuikStrike, MetricGate calculators, Michael Brenndoerfer's Quantitative Finance book, elysiatools (listing only; tool blocked robots).

---

## 1. drwong.cc (Simon Wong, AFIN3029 course labs)

The most relevant site for us: single-page labs, each a parameter explorable with 2–6 linked charts, defaults close to Hull's examples (S=100, K=100, T=1, σ=20%, r=4%, q=0–1%). Consistent visual language; almost no narrative.

| Tool | Concept | Controls (defaults / ranges where given) | Outputs | What the learner discovers | Verdict |
|---|---|---|---|---|---|
| **Option Greeks Explorer** `/option-greeks` | BSM price + Δ Γ Vega Θ ρ vs each input | Call/Put; Long/Short; S, K, T, σ, r, q (no ranges shown); **"📌 Pin curves"** / Clear / Reset; **drag on any chart scrubs the parameter on that chart's x-axis** | Tiles: price, Δ, Γ, Vega (per 1% σ), Θ (per day), ρ (per 1% r). Charts: price vs S with "Value now / Payoff at expiry / Profit at expiry", dashed K, BE marker; Δ Γ Vega Θ ρ vs S; Vega vs σ; Θ vs T; ρ vs r; hover readout | How Δ steepens through K as T→0; Γ/Vega identical for call & put; short flips every sign; pinned curves show "before vs after" a single parameter change | **Strong** for interaction (pin + drag-to-scrub are excellent), **weak** on explanation: no d1/d2, no formulas, no captions, no "why" |
| **Greeks 3D Surfaces** `/option-greeks-3d` | Greek as surface over (S, T) or (S, σ) | z = Price/Δ/Γ/Vega/Θ/ρ; y-axis = T or σ; Call/Put; Long/Short; S K T σ r q sliders; rotate/tilt/auto-rotate/wireframe; **click surface to move marker**; double-click resets | 3D surface; white dot at current parameters; **dashed gold ATM ridge (S=K)**; x/y/z readouts | Γ and Θ spike along the ATM ridge as T→0; Vega decays with T; where the surfaces are flat vs violent | **OK**: the ATM ridge and the marker-linked-to-sliders are good ideas; no colour legend, no narrative, rotation gestures only |
| **Binomial Trees** `/binomial-trees` | Two-step CRR tree, Hull FFOM 9e Probs 12.12 & 12.13 | Call/Put; European/American; **Walkthrough: ‹ Back · ▶ Play · Next › · ↺ Reset · "Step N of M"**; parameters fixed: S0=$50, u=1.06, d=0.95, K=$51, r=5% (cont.), T=6 mo, "2 steps × 3 months (Δt=0.25)" | Tree with underlying price per node, option value (call) and option value (put) per node, revealed step by step | Backward induction one node at a time; difference between European and American put at the same nodes | **Strong idea, thin execution**: step-through is exactly right for a tree; but parameters are fixed, p is not visibly derived, no sliders, walkthrough text not reachable in our fetch |
| **Option Portfolio Greeks** `/option-portfolio` | Aggregated book Greeks | Market: S=100, σ=20%, r=4.0%, q=0.0%, **Chart range ±50%**; instrument table (Type option/Shares, signed Qty, K, T yr, Mult 100 or 1); + Add option / + Add shares; **10 presets**: long call, long put, covered call, protective put, bull call spread, bear put spread, long straddle, long strangle, call butterfly, iron condor; Clear all | Tiles "Portfolio at spot = 100 · aggregated"; per-row value & Greeks; P&L profile "Value now / At expiry / Spot today"; five Greek charts vs S; hover any chart → every metric at that scenario spot; "How this works" explainer with d1, d2, Greek definitions, portfolio Greek = qty × mult × Greek, share Δ = 1 | A straddle's Δ nets to ≈0 but Γ and Vega double; gap between "value now" and "at expiry" is time value; where Θ is earned vs paid | **Strong**: presets + hover-at-scenario-spot + explainer in one place. Weak: no time-decay animation (Θ only as a number), unlabeled column |
| **Option Portfolio 3D** `/option-portfolio-3d` | Portfolio P&L / Greeks over (S, time to maturity) | Same book; 11 presets incl. **calendar spread**; surface = P&L/Value/Δ/Γ/Vega/Θ/ρ; spot axis ±, time axis max T; probe dot | 3D surface; gold ridge = today's spot across time; readouts | How a calendar spread's surface changes as the short leg expires (page highlights this); legs expiring at different times via rule "remaining life = max(Tᵢ − (Tmax − τ), 0)" | **OK**: the only tool here that shows multi-expiry structure; rolling-time convention confusing |
| **Delta-Hedging P&L** `/delta-hedging` | Hedging a sold option; P&L attribution | Call/Put; S0=100, K=100, T=1.00, r=4.0%, **σimp (you sold at)=20%**, **σreal (the path)=28%**, μ=8.0%, rebalance: At expiry / Monthly / Weekly / Daily / Near-cont.; txn cost 2 bps; **Play / Pause / Step / Replay / New seed / Speed 1.0×**; MC: Run 200 / 1000 / 5000 | (1) price path with K and rebalance ticks; (2) **replicating portfolio (cash + shares) vs option liability** — overlap = hedge works; (3) **net P&L with stacked attribution bands: theta, gamma, carry, cost, residual**; (4) position & running P&L at cursor; (5) MC histogram of terminal P&L with zero line, sample mean, and **theory marker ½S²Γ₀(σ²imp − σ²real)T**. Formulas shown: path step, per-step P&L = −(L_{t+1}−L_t) + Δ_t(S_{t+1}−S_t) + B_t(e^{r dt}−1) − cost; theta = −Θ dt; gamma = −½Γ(dS)² | Short gamma loses on big moves while theta pays; realised > implied → loss on average; finer rebalancing narrows the histogram but costs accumulate; with σreal = σimp and near-continuous hedging P&L → 0 | **Strongest tool on the site.** The attribution bands along one path plus the histogram across paths is the right pair. Weak: "What just happened" panel empty; residual is a plug; MC needs a button press (unexplained) |
| **Monte Carlo Pricing** `/monte-carlo-pricing` | MC convergence + variance reduction | Call/Put; S0=100, K=100, T=1.00, σ=20%, r=4.0%, q=1.0%; **Target paths N=100k**; **Antithetic switch (Z, −Z)**; **Control-variate switch (X = e^{−rT}S_T)**; seed + Apply; Play/Reset/New seed/Speed | (1) illustrative multi-step RN paths, terminal dots green ITM / red OTM; (2) **convergence plot on log-N axis: estimate with ±1.96·SE bands for plain / antithetic / CV, flat exact BS line, each band drawn only while its switch is on**; (3) S_T histogram with lognormal density, K, mean S_T; (4) estimate-vs-exact tile; (5) **variance-reduction factor tile SE_plain/SE_current at same N**. Formulas: S_T, discounted payoff, SE, 95% CI, Y* = Y − c(X − E[X]), c = Cov/Var. Running sums in Float64 up to 1M | "100× more paths buys 10× accuracy"; toggling a VR method shrinks the band without moving the mean; E[e^{−rT}S_T] = S0 e^{−qT} as a no-arbitrage sanity check | **Strong**. Weak: fanned paths are not the paths used for the estimate (confusing); why CV works not explained; estimator symbol renders badly |
| **Efficient Frontier** `/efficient-frontier` | Markowitz | **Click anywhere on the chart to add an asset at that (σ, μ)**; ρ (all pairs) = 0.30; rf = 2.0%; + random asset; Reset | Feasible cloud; efficient upper branch; inefficient lower branch; **"frontier before last change" ghost**; CML; ◯ min-variance; ★ tangency; "Short sales allowed (analytic frontier)" | Adding a poorly-correlated asset bends the frontier left; lowering ρ pushes the bullet left; raising rf moves the tangency point up the frontier | **OK**: click-to-add-asset and the ghost frontier are two good ideas; no weights shown, no Sharpe number, no text |
| **VaR & ES** `/value-at-risk` | VaR/ES three ways + Kupiec | Position: shares qS=0, options qO=10, K=100, Topt=1.00, Call/Put; S=100, σ=25%, μ=6.0%, r=4.0%, **"include drift μ in VaR" toggle**; horizon h ∈ {1, 5, 10, 21, 63} days; α ∈ {90, 95, 97.5, 99}%; **return distribution Normal / Student-t (ν=5) / Bimodal (crash prob 3%, severity 5.0σ)**; M=20,000 scenarios; backtest T=250; seed 20240101; Run; "Backtest limit from: MC / Hist / Δ-normal / Δ-gamma"; **▶ Play reveal** | P&L histogram with shaded tail beyond VaR, Gaussian overlay, VaR & ES markers, MC/Historical toggle; method comparison table; **backtest ledger: realised P&L vs −VaR with breaches marked**; **Kupiec POF panel** (LR vs 3.841). Formulas in prose: V(s) = qS·s + qO·BS(s), σh = σ√(h/252), Δ-normal closed forms, Δ-Γ quadratic, MC revaluation at aged maturity | ES ≥ VaR always; "positive gamma caps the loss, so a long-gamma book has a thinner tail than delta-normal implies"; in bimodal case "VaR stops in the calm body just in front of the crash, while ES averages it in"; Kupiec flags too many *and* too few breaches | **Strong** conceptually (the crash-mode example is the best single VaR-vs-ES illustration found). Weak: bimodal silently overrides α; sim error at 99% with 20k not discussed; formulas garbled |
| **LSTM from Scratch** `/lstm` | Sequence model training | Task sine/composite/square/triangle; freq 3.0; trend 0.0; damp 0.00; hidden 12; L=16; lr 0.0100; speed; noise 0.020; seed 42; Start/Step/Reset; Predict/Fill/Randomise, rollout 8; **Run grad-check** | Status (epoch, train/val MSE, grad-norm clipped at 5.0, params 685, "diverged — lower the learning rate"); prediction vs target with train/val split line and AR rollout; **gate heatmaps (input/forget/output 0→1; g/c/h signed) on a fixed probe input across epochs**; loss curve lin/log; recurrent weight heatmaps U_i U_f U_g U_o every 3rd epoch | Forget gates saturate → memory; AR forecast drifts past the split; high lr diverges | **OK** for us (technique only): fixed-probe-input heatmaps and divergence warning are transferable |
| **HMM** `/hmm`, **Higher-order HMM** `/higher-order-hmm` | Baum-Welch on tiny corpora | K=5 (3 for HO), EM cap 40, speed, seed 42, ε=0.0100, corpus presets (V=28, 24 sentences), **Train / Step / Reset**; HO: order m slider 1–3 | Emission heatmap B (hover for exact p), transition heatmap A on absolute 0–1 scale, π bars, objective curve "should not decrease", top words per state, next-word bars, generated text; **HO checks m=1 reduces to first-order "to 1e-9"** | Latent states converge to word classes; identity arbitrary up to permutation (seed) | **OK**: Step-one-EM-iteration + "objective must not decrease" monitor + reduction check are good habits |
| **n-gram** `/ngram` | Counts-based LM, no training loop | n=3, k=0.1, backoff α=0.4 / interpolation, corpus presets, prefix box, temperature 1.00, length 14 | Distribution bars; **counts table showing MLE → add-k → final probability for the current context**; bigram heatmap at n=2; perplexity vs order bar chart; **backoff trace ("which order supplied the prediction")**; **"How this prediction was formed" panel** | Sparsity vs order; smoothing moves mass to unseen | **Strong technique**: the "how this number was formed" panel is exactly the intermediate-step exposure the finance tools lack |
| **Blockchain** `/blockchain` | PoW chain | Wallets, tx (with preset invalid txs: Overspend, Pay self, Zero, Negative), difficulty, mine, **edit a mined block's amount** → chain turns red; re-mine | Validator log with rejection reasons, mempool (5 tx/block), nonce/hash/hash-rate, chain view | Tampering breaks every later hash | **Strong technique**: "tamper and watch it break", and "press a button that submits a deliberately invalid input and read why it was rejected" |
| **AMM Sandbox** `/amm` | Five bonding curves | Algorithm (constant product/sum/StableSwap/weighted/concentrated), TVL, price, fee, A, weight, range (pa, pb); trade size % of reserve; oracle price + **"Arbitrage pool → oracle"**; TWAP window + **"Inject 1-block manipulation"** | Bonding curve with pre/post reserves; execution price vs size; **overlay of all five curves at same TVL/price**; spot vs TWAP; IL readout "should match pool value when fee = 0" | Depth vs slippage trade-off; TWAP resists 1-block spikes | **OK**: side-by-side-models-at-identical-inputs and "inject a shock" buttons are transferable |
| NLP course `/nlp-course/` | 15 chapters with ⚗ live experiments | — | — | — | Prose + embedded experiments; could not confirm inline placement |

**Site-level pattern.** Every lab = parameter panel left, 3–6 linked Plotly-style charts right, Hull-like defaults, an optional "How this works" footer. Playback (Play/Step/Replay/New seed/Speed) appears wherever there is a path. Nothing links tools to each other beyond "third pricing method on the site". Narrative, misconceptions, and "what to try" are absent; the learner must already know what to look for.

---

## 2. riskhub.org (calculators, Maths-for-Quants lessons, blog)

Exam-prep site (FRM/CFA). Calculators are **single-page dashboards** oriented to "get the number"; the long-form lessons and blog posts hold the pedagogy. No in-browser Python labs exist; the "break the model" content lives as **tables of wrong-vs-right numbers in prose**, not as interactive experiments.

| Tool | Concept | Controls | Outputs | What the learner discovers | Verdict |
|---|---|---|---|---|---|
| **Black-Scholes** `/calculator/black-scholas` | BSM price | Call/Put; S=$100, K=$100, T=1.00 yr, r=5.0%, σ=20.0% | Price $10.45 tagged "ATM" / "call premium"; **Intrinsic $0.00 / Time value $10.45**; **d₁ 0.3500, d₂ 0.1500**; Δ 0.6368, Γ 0.0188, Θ −0.0176/day, Vega 0.3752 per 1%, ρ 0.5323 per 1%; "Payoff & Pricing" chart (not rendered in fetch) | ATM premium is all time value; d1/d2 are numbers you can check | **Weak-OK**: shows d1/d2 (good) but no N(d1), no formula, no narrative; Greek descriptor labels misaligned |
| **Binomial Tree** `/calculator/binomial-tree` | American pricing on a lattice | call/put; S=100, K=100, σ=20%, r=5%, T=1.00, **Steps=100** | Price $6.0824 (American put), intrinsic/time split; Δ −0.4116, Γ 0.0231, Θ −2.2626, moneyness 1.0000; **6-step display tree with S and V per node, early-exercise nodes coloured**; "Price convergence 5–100 steps" chart; "Early exercise boundary" chart | Root of 6-step display tree ($5.95) ≠ 100-step headline ($6.0824) — convergence made visible by accident; nodes where V = intrinsic are exercise nodes | **OK**: convergence plot + exercise boundary are the right outputs; but u, d, p never shown, 6-vs-100 mismatch unexplained |
| **Option Greeks** `/calculator/option-greeks` | Greeks dashboard | S=100, K=100, σ=0.2, r=0.05, T=1; Put/Call; Reset | Δ 0.6701, Γ 0.0188, Θ −0.0178, Vega 0.3752, ρ 0.5510; five charts vs S with call & put curves | — | **Weak**: Δ=0.6701 is inconsistent with BS at these inputs (should be ≈0.637 — the BS page on the same site gets 0.6368); no units, no formulas. A cautionary tale for our "engine tested against a Python key" rule |
| **Value at Risk** `/calculator/value-at-risk` | Parametric / Historical / MC VaR | Portfolio value; daily μ ("decimal"); daily σ ("%"); confidence 90/95*/99/99.9%; horizon days; "Scale by √t"; Normal / Student-t (no ν input); "Calculate Parametric VaR"; cross-method comparison after ≥2 methods run | VaR, annualised VaR, z-quantile; return distribution chart; methodology panel | — | **Weak**: button-driven, empty until run, inconsistent units; the "compare methods side by side" intent is good but unrealised |
| **Interest Rate Swap** `/calculator/interest-rate-swap` | Swap NPV from bootstrapped curve | Notional $10,000,000, 5y, SOFR, fixed 4.000% | NPV −$45,956; fair fixed 3.898%; PV fixed $1,796,184 (10 coupons); PV float $1,750,228; DV01 $4,499; PV01 −$4,490; mod duration 2.620; convexity 11.41; zero curve chart; **NPV vs parallel shift chart**; "Insight" panel: pay-fixed is OTM because par < contract | Value = gap between contract and par rate | Out of scope for us; the auto-generated "insight sentence" is a transferable device |
| **Bond Pricing** `/calculator/bond-pricing` | Price, duration, convexity | Face 1000, coupon 5%, semiannual, 10y, YTM 5.25%, 30/360; presets "10Y Treasury", "Zero-Coupon 5Y" | Price 980.74; PV coupons 385.17 / principal 595.58; Macaulay 7.966, modified 7.762, convexity 73.168, DV01 0.7616; **20-row cash-flow table with discount factors and running PV**; **scenario table −200…+200 bp with duration-only, duration+convexity, exact repricing** (e.g. −200 bp exact 1,148.39, +17.094%); **formula with worked substitution C=25.00, y=5.25%, k=2, n=20** | Convexity correction matters for big shifts | Out of scope, but **the three-column "approximation vs approximation+correction vs exact" scenario table is a technique we want** (Taylor chapter, Δ-Γ P&L) |
| **EWMA Volatility** `/calculator/ewma-volatility` | RiskMetrics recursion | Paste/upload/manual returns ("parsed: 40 observations"); **λ presets 0.90 / 0.94 (RiskMetrics) / 0.97 / 0.99**; σ²₀ auto (sample var 0.00018840) / custom; annualisation 252/365/52/12; VaR confidence 95/99; **tabs: Charts · Step-by-Step · Weight Analysis · Half-Life · Comparison · Formula Library · Education** | Current σ² 0.00018450, σ 1.3583%, annualised 21.56%, **half-life 11.202 obs**, forecast σ²(t+1) 0.00017349; **Step-by-step: σ²ₜ = 0.9400 × 0.00018989 + 0.0600 × 0.00010000 = 0.00018450**; charts: returns, r², EWMA var, EWMA vol, **weight decay wₖ = (1−λ)λᵏ**, cumulative weight, **λ sensitivity**, rolling-20 vs EWMA | λ sets memory; half-life summarises it; EWMA reacts faster than a rolling window | **Strong-OK**: the one riskhub tool that exposes the arithmetic of one recursion step and plots the weights. Weak: no VaR figure actually appears; only rolling-20 as comparator; forecast not derived |
| **GARCH** `/calculator/garch-model` | MLE fit of 9 ARCH-family models | Return/price series, log/simple, frequency; **model: ARCH(q), GARCH(p,q) default, GJR, TGARCH, EGARCH, IGARCH, APARCH, FIGARCH (simplified), Component (simplified)**; mean: zero / constant / AR(1); dist: Normal / t / GED / skew-t; max iter, tolerance (Nelder-Mead with penalties for ω>0, α,β≥0, stationarity); sample "250 observations · daily" | LL 862.529, AIC −1717.058, BIC −1702.972, **persistence 0.8574, half-life 4.51, long-run var 5.979e-5, long-run vol 12.27%, current vol 11.13%**, forecast σ²(t+1) 5.266e-5, 55 iterations; **parameter table with SE / t / p / stars**: ω 8.525e-6 (p 0.1720), α₁ 0.090128 (p 0.1126), β₁ 0.767287 (p 3.1e-9 ***), μ 0.000278; charts: returns, r², conditional vol, standardised residuals, ACF/PACF of ε², QQ, **news impact curve**; tabs incl. Step-by-Step, Diagnostics, Forecast, Interpretation, Practice; export CSV/JSON/LaTeX | Persistence = α+β; half-life = ln 0.5 / ln(α+β); long-run var = ω/(1−α−β); asymmetric models bend the news-impact curve | **OK**: complete output set for A5, internally consistent (we checked the identities); but it's a black-box fit — no likelihood surface, no "watch the optimiser", no comparison of fitted vol across models on one chart |

**Lessons and blog (prose, no code, no interaction — but the best "break the model" *numbers* found anywhere):**

- *Ornstein-Uhlenbeck Processes* (`/blogs/ornstein-uhlenbeck-processes`): **Euler vs exact step table** with κ=2: Δ=0.25 → long-run sd 0.577% vs exact 0.500%; Δ=0.50 → gap factor (1−κΔ)=0, "start is forgotten in one jump"; Δ=0.75 → sd 1.000%; **Δ=1.00 → gap factor −1, path oscillates between 2% and 6% and variance grows without limit.** Rule: κΔ ≪ 1. Also: √t-scaling overstates 10y risk by 45% (slow, κ=0.10) and 213% (fast, κ=2); half-lives 6.93y / 0.347y; P(negative rate) 3.68% vs ~6×10⁻¹⁶. Leash analogy. → **B3 mean-reversion and F1/E2 discretisation: this is the storyboard for an interactive "turn the Δt knob until Euler explodes".**
- *Why dW² = dt* (`/blogs/why-dwt2-dt`): single squared increment is Z²Δt with sd ≈1.41× its mean, so the rule is about **cancellation of sums, not shrinkage of terms**; tables for n = 16…65,536 and 20,000-path n·Var[Eₙ] → 1 for H=W, → e²−1 ≈ 6.389 for H=e^W; a "peeking" (non-adapted) weight leaves a persistent error ≈0.484. → **B3 quadratic variation / B4 Itô: the "peeking weight" counter-experiment is an idea no interactive site has.**
- *Geometric Brownian Motion* (`/blogs/geometric-brownian-motion-…-234`): volatility drag μ=0.10, σ=0.40 → geometric growth ≈2%, "median path grows much more slowly than the expected value". No figure. → **B3: the median-vs-mean fan is the illustration to build.**
- *Euler-Maruyama* (`/blogs/solving-sdes-numerically-…-237`): 10 GBM paths, S0=100, μ=0.05, σ=0.2, N=252; lists pitfalls (negative prices with large Δt, instability under strong mean reversion) but never runs the comparison it suggests.
- *Real-world vs risk-neutral probability* (`/blogs/real-world-probability-vs-risk-neutral-probability`): one-period tree 100 → 125/80, p=0.65 vs q=0.53514; call 12.854 (Q) vs 15.613 (discounted P); continuous: μ=9%, r=4%, σ=20%, θ=0.25, **dQ/dP = 1.0579 × (S_T/100)^−1.25**; P(S_T<80) 7.14% under P vs 11.20% under Q; 1y 99% VaR 32.65 (P) vs 35.94 (Q); MC with 1,000,000 paths, reweighted call 9.935 vs BS 9.925. → **B5: the "state-by-state reweighting factor as a function of S_T" is the Girsanov picture to animate.**
- *Monte Carlo Simulation of Volatility Models* (course lesson): correlated vs independent shocks scatter (70 draws, sample ρ −0.70 vs ≈0) and the warning that ρ=0 produces a symmetric smile instead of skew; wrong √Δt scaling "makes simulated volatility wrong by a step-size-dependent factor". → **A2 Cholesky, D3 Heston.**
- *MC & FD pricing engine* (capstone lesson): SE vs N log-log against the 1/√N line; VR comparison at equal random-number cost; importance-sampling shift overshoot (variance rises again); benchmark-first discipline ("a price without its CI, seed and path count is meaningless"); running fictional desk (Larkspur Capital). → **E2, F1.**

---

## 3. QuantEcon (intro / python / python-advanced lectures)

Static Jupyter-book lectures: code + matplotlib figures + exercises. No sliders. Their value for us is **the choice of figure** and the **sequence of figures**, which is consistently excellent: theory → one simulation → vary the initial condition → break the assumption → exercise that re-runs with a different distribution.

| Lecture | Concept | Figures / simulations (parameters) | What the figures make visible | Verdict |
|---|---|---|---|---|
| Markov Chains I `intro/markov_chains_I` | Stochastic matrix, simulation, stationary dist. | Hamilton 3-state P = [[.971,.029,0],[.145,.778,.077],[0,.508,.492]] drawn as labelled digraph; 6-state political chain as networkx graph with **edge darkness = probability**; homemade sampler on P=[[.4,.6],[.2,.8]] from ψ₀=(0.1,0.9), ts_length 1,000,000 → mean(X==0) ≈ 0.249886 ("try changing the initial distribution"); **3D animation on the unit simplex, 20 frames, three trajectories ψᵢPᵗ from the three vertices fading to ψ\***; periodic P=[[0,1,0],[0,0,1],[1,0,0]] with four initial points **cycling around the simplex forever** | Convergence to ψ\* independent of start; periodicity as a visible orbit | **Strong** figure design: the simplex animation is the illustration for B1 |
| Markov Chains II `intro/markov_chains_II` | Irreducibility, ergodicity | Reducible chain with absorbing "poor" (P[poor,poor]=1.0); **running fraction p̂ₙ(1) vs t for X₀=0,1,2, dashed ψ\*(1), ts_length 10,000**; periodic P=[[0,1],[1,0]] over 100 steps still gives time-average 0.5 — "asymptotic stationarity is about the distribution, ergodicity is about the sample path"; 6-state deviation plot p̂ₙ(x) − ψ\*(x) over 2,500 steps; 8-state wealth chain P¹⁰ rows all ≈ (0.2025, 0.2038, 0.2074, 0.1951, 0.0929, 0.0504, 0.0393, 0.0086) | Distribution convergence vs path-average convergence are different claims and can be separated with one periodic example | **Strong**: the periodic chain is the perfect "break the assumption" case |
| Finite Markov Chains `python/finite_markov` | Same, plus | 3D convergence plot: red dots ψPᵗ from ψ=(0,0.2,0.8), 20 iterations, black dot ψ\*; period-2 and period-3 example graphs; PageRank on 14-node web graph (g ≈ 0.1607 top, a ≈ 0.0029 bottom) | Stationary dist. as a ranking | OK |
| AR(1) Processes `intro/ar1_processes` | Distribution dynamics, stationarity, ergodicity | X_{t+1} = aX_t + b + cW, a=0.9, b=0.1, c=0.5, X₀ ~ N(−3, 0.6); **sequence of marginal densities ψ₀…ψ₉ drawn as normal curves from the recursions μ_{t+1}=aμ_t+b, v_{t+1}=a²v_t+c²** (no paths simulated); 40 periods from μ₀=−3 and from μ₀=4 converge to the same ψ\* = N(1.0, 1.316) overlaid in black; ex: KDE of 2,000 one-step draws matches theoretical ψ_{t+1} | "A process has a distribution at each t that moves" — the marginal-density movie — is the cleanest picture of stationarity | **Strong**: this density-sequence figure is our A4 opener |
| LLN & CLT `intro/lln_clt_intro` | LLN, CLT, breaking LLN | Histogram of 1,000 sample means (n=1,000) from N(5,2); **violin plots of sample-mean distributions for n=1,000 / 10,000 / 100,000** (Normal and Beta(6,6)); Cauchy breaks LLN (no mean); fully-dependent sequence X_i = X_{i−1} breaks LLN; CLT: √n(X̄ₙ−μ) for Exponential(scale 2), n=250, k=1,000,000, 60 bins, N(0,σ²) overlay; ex: Beta(2,2); AR(1) α=0.8, β=0.2, σ=10 running mean converges to 1 despite dependence | What "concentrates" looks like; LLN can survive dependence but not infinite mean | Strong on sequencing; figures plain |
| Heavy tails `intro/heavy_tails` | Light vs heavy tails | 1,000,000 N(0,1) draws (min ≈ −4.75, max ≈ 4.69) vs AMZN and BTC daily returns 2015–2022; **three panels of 120 draws: N(0,2²), N(0,12²), Cauchy, same y-limits ±120**; exponential vs Pareto draws (exp(X)); **CCDF on linear then log-log axes — Pareto is a straight line**; empirical log-log CCDFs with OLS slope for firms, cities, wealth, GDP; **running sample mean of 1,000 Cauchy draws never settles**; ex: Pareto α = 1.15/1.5/1.75; tax-revenue violin: Pareto mean ≈ 1,556,640 sd ≈ 1,086,578 vs lognormal mean ≈ 2,555,714 sd ≈ 28,362 | "Same scale, different generator" side-by-side is the heavy-tail picture; log-log CCDF as the diagnostic | **Strong**: A1 should borrow the three-panel same-axis comparison and the running-mean failure |
| Kalman filter `python/kalman` | Bayesian updating of a Gaussian | Missile: prior N(μ=(0.2,−0.2), Σ=[[0.4,0.3],[0.3,0.45]]) as filled contours; signal Y=(2.3,−1.9) as a dot far from the prior; **posterior contours twisted toward the surprise (G=I, R=0.5Σ)**; predictive contours after A=diag(1.2,−0.2), Q=0.3Σ; three contour sets on one axes; ex: learning a constant θ=10 from μ₀=8, Σ₀=1 — first five predictive densities; mass outside θ±0.1 → 0 over T=600; filter vs informed competitor squared errors, A=[[.5,.4],[.6,.3]], eigenvalues 0.9, −0.1 | Prior → signal → posterior → forecast as four frames of one picture | **Strong**: the four-frame contour sequence is a reusable "Bayesian update" motif (G1, A3) |
| Multivariate normal `python/multivariate_normal` | Conditioning, Cholesky, PCA | Two regression lines on one bivariate plot (μ=[.5,1], Σ=[[1,.5],[.5,1]]: slope 0.5 vs 2.0); **IQ learning: conditional mean of θ with ±1.96σ band vs number of tests 1…50, dashed true θ ≈ 98.25** — sd falls as 1/√n; **"information as surprise": Cholesky factor → orthogonal innovations, checked to 1e-10**; math/verbal IQ: conditioning on math scores alone leaves verbal mean at 100; factor model N=10, k=2, PCA eigenvalues [5.25, 5.25, 0.25, …], first two explain 84%, reconstruction shrinks block means by 5/5.25 ≈ 0.952 | Cholesky as "turning correlated data into a sequence of surprises"; PCA approximates but is not the factor model | **Strong** for A2 (Cholesky-as-innovations idea; two-regression-lines picture) |
| Linear state space `python/linear_models` | Ensembles vs time averages | AR(4) φ=(0.5,−0.2,0,0.5), σ=0.1 or 0.2; **20 paths with black dots at y_T and a rotated histogram of those 20 dots (T=20, then T=100)**; 500,000-step path histogram with stationary normal overlay; 20 paths (cyan) + their cross-sectional average (blue) + population mean (green); **80 paths with dots at T=10, 50, 75: distributions differ from a fixed start, look alike when x₀ ~ stationary** | The difference between "distribution at time t across paths" and "one long path" | **Strong**: the fan-with-rotated-histogram is the picture for B3/E2 and for stationarity in A4 |
| ARMA `python-advanced/arma` | Time vs frequency domain | AR(1) γ(k) for φ=±0.8; spectral density f(ω)=1/(1−2φcosω+φ²); **three stacked panels γ(k) · cos(πk) · product — all positive at ω=π for φ=−0.8, cancelling at ω=π/3**; **quad plots (impulse response, log spectrum, autocovariance, one sample path) for white noise, AR(2) φ=(1.3,−0.7), AR(1) φ=0.9, seasonal AR(4) φ₄=0.8, ARMA(1,1) φ=0.98 θ=−0.7** | One model, four views, side by side; the "matched cycles" explanation of a spectral peak | **Strong**: the quad plot is the A4 model gallery |
| Asset pricing `python/markov_asset` | Price-dividend ratio on a Markov chain | 7-state Tauchen chain (ρ 0.96, σ 0.25), 80 periods, panels X, g, d, log d; v(x) vs state under risk neutrality (25 states, β=0.9); Lucas tree v(x) for γ ∈ {1.2…2.0}; consol (β=0.9, ζ=1) vs infinite-horizon call (strike 40); ex: 5-state chain, consol 753.87 → 87.57, call 603.87 → 64.31; k=5 vs k=25 option values | A price as a function on states | OK; too far from our syllabus (SDF pricing), but the "price as a curve over states" view informs C2 |
| Monte Carlo & option pricing `intro/monte_carlo` | MC estimate, stochastic vol | Loops vs vectorised (n=1,000,000: 1.16 s vs 30 ms); lognormal call μ=1.0, σ=0.1, K=1, n=10, β=0.95, M=10,000,000 ≈ 1.036985; **dynamic vol: h_{t+1} = ρh_t + νη, σ_t = e^{h_t}, defaults μ=0.0001, ρ=0.1, ν=0.001, S₀=10, h₀=0; one figure: 50 paths (log and level)**; ex: knockout at 120 | — and a real lesson by accident: M=10,000 gives 1986.27 (loop) vs 649.25 (vectorised), M=10M gives 881.12 — **sampling noise at small M is huge** | OK; noisy-estimate anecdote worth copying as a deliberate demo in E2 |

QuantEcon has **no GARCH/EWMA lecture** and no "random walk" lecture as such (random walk appears inside AR(1), LLN and linear_models).

---

## 4. CME Group Education + QuikStrike

| Tool | Concept | Controls | Outputs | Discovery | Verdict |
|---|---|---|---|---|---|
| Course "Option Greeks" (lessons: Premium & the Greeks; Delta; Gamma; Theta; Vega) | Greeks for futures options | Video (Brightcove) + one multiple-choice question per lesson + "Lesson Complete" | Two static figures ("futures are two-dimensional; options add forces"); worked example: futures 980, 1000 call priced 12, delta 40, gamma 0.50, theta 0.20, vega 0.10, vol 15% → futures to 1000 over two weeks, vol to 14%: 8 (delta) + 9 (gamma, average delta 45) − 2.8 (theta) − 0.1 (vega); Delta lesson: 1.00 call, Δ 0.50, 96 → 97.5 gives 1.75; 8 short 25-delta calls → −200 → buy 2 futures; quiz 1.50 + 0.40 × 2 = 2.30 | A P&L decomposition **in words** | **Weak**: no interactivity at all; the worked example's arithmetic does not add up (12 + 8 + 9 − 2.8 − 0.1 = 26.1, page says 18.1); delta "under 50 = OTM" ignores put sign; units switch between 0.50, 50% and "a 40 delta" |
| QuikStrike Options Calculator | Theoretical price + Greeks | Strike, type, futures price, vol, DTE, rate, **pricing model (8, incl. Black-Scholes)** | Fair value, Greeks | — | Trading utility, not a teaching tool |
| Volatility Term Structure Tool | IV by expiry | Product group, product, expiry | IV term structure now vs one week ago | Term structure moves | Reference data; an idea for D2: **"now vs a week ago" overlay** on real term structures |
| Trading Simulator / Challenge | Practice account | — | — | — | Out of scope |

Verdict for the site: nothing to copy in interaction; the only reusable item is the **Greek-by-Greek P&L walk ("8 from delta, 9 from gamma, −2.8 from theta…")** which we should do correctly and interactively in D1.

---

## 5. Other explorers found by search

| Site / tool | Concept | Controls / outputs | Verdict |
|---|---|---|---|
| **MetricGate Delta Hedging Simulation** `metricgate.com/calculator/delta-hedging` | Replicate a European call on one GBM path | S₀, K, r, q, σ, T, **rebalancing steps N**; "Load Example", Run; output sections: Step-by-Step Path, Greek Profile, Plot; formulas: GBM step, d₁ with τ = T − t, Δ = e^{−qτ}Φ(d₁), tracking error ε = V_rep,T − max(S_T − K, 0) | **OK**: one path only, no distribution, no attribution; the "step-by-step path table" is the right companion to a chart |
| **MetricGate SABR smile** `metricgate.com/docs/sabr-volatility-smile/` (+ calculator) | Hagan SABR | F, T, α, β ∈ [0,1], ρ, ν, strike grid; outputs ATM vol, smile, **rho scan ("family pivots around the ATM forward") and nu scan ("lifts both wings symmetrically")** | **OK**: parameter-scan families are the right picture for D3; prose inconsistent about calibration order |
| **MetricGate Heston docs/calculator** | Heston pricing | κ, θ, σ, ρ, v₀ (docs only reached) | Not audited in depth; same scan pattern |
| **Michael Brenndoerfer, *Quantitative Finance* book** (`mbrenndoerfer.com/writing/…`) ch. 26 Brownian motion, 31 Greeks, implied vol chapter, plus Itô, BSM PDE, binomial, MC, FD chapters | Narrative textbook with Python cells | **Not interactive**: static matplotlib figures from shown code; "Reading Level: Beginner / Intermediate / Expert / Hide All" controls glossary tooltips density; section-level reading times; quiz. Figures: 5 random-walk paths over 1,000 steps; **fan of paths against a √t envelope**; endpoint histogram vs normal; convergence panels at 10/100/1,000 steps (Δx = σ√Δt); call Δ vs S for T = 1.0 / 0.25 / 0.05; call vs put Δ "separated by exactly 1"; Γ surface S 80–120 × T 0.02–1.0; IV: BS price vs σ monotone (S=K=100, T=0.5, r=5%: $8.26 ↔ 25%); Newton tangent lines from σ₀=0.80 to 23.27% in 3 steps; Newton ≈4 iterations vs bisection ≈50 | **OK as prose**; the Newton-tangent-line figure and the √t envelope are good static figures; the "reading level" dial is a UI idea for our baseline-only audience |
| elysiatools "Option Greeks Visualizer" / "Brownian Motion & Random Walk" | "3D price surface, Greek heatmaps, live parameter controls" | Tool page blocked (robots); listing only | Not audited |
| OptionStrat "Visual Greeks" | Greeks over time / price / IV for a strategy | Premium feature, dropdown of output types | Trading tool; not audited |

---

## 6. Catalogue entries — distinct interaction techniques

### P&L attribution bands along one path, histogram across many
- Source: https://drwong.cc/delta-hedging
- Topic illustrated there: delta-hedging a sold option; theta / gamma / carry / cost / residual stacked to the net P&L line; MC histogram of terminal P&L with theory marker ½S²Γ₀(σ²imp − σ²real)T
- What moves / what the viewer does: Play / Step one rebalance / Replay / New seed; switch rebalancing frequency (expiry → monthly → weekly → daily → near-continuous); set σimp vs σreal; then Run 200/1000/5000 paths
- What it makes visible that text cannot: that gamma losses arrive in lumps on big moves while theta accrues smoothly; that the two nearly cancel when σreal = σimp; that the histogram narrows with finer hedging but its mean is set by the vol gap
- Our chapters that could use it: **D1** (core illustration) — add the "replicating portfolio vs liability" overlap chart; **C4** (Γ–Θ relation via the PDE: ½σ²S²Γ + Θ ≈ 0 shown as the two bands mirroring); **E1** (P&L ledger feeding a backtest)
- Notes on execution: show the per-step formula next to the bands; name the residual honestly (higher-order + discretisation); make "What just happened" narrate the current step (drwong leaves it empty); pair the single-path view with a one-click "run 1000 of these" so the learner moves from anecdote to distribution.

### Toggle a variance-reduction method and watch the error band shrink
- Source: https://drwong.cc/monte-carlo-pricing
- Topic illustrated there: MC convergence to Black-Scholes; antithetic and control-variate switches; ±1.96·SE bands per estimator on a log-N axis; variance-reduction factor tile
- What moves: switches add/remove a band; N streams upward; the exact price is a flat line the bands straddle
- What it makes visible: 1/√N as a shape; that VR narrows without biasing; the ratio SE_plain/SE_current as a single number
- Our chapters: **E2** (core); **F2** (same device for AD-vs-bump Greeks error); **H1** (Asian option with geometric-Asian control variate)
- Notes: keep a separate "illustrative paths" panel from the "estimator" panel and say so (drwong's confusion); show why the control variate works with a scatter of (X, Y) and the regression line.

### Step-through backward induction on a tree
- Source: https://drwong.cc/binomial-trees (Back / Play / Next / Reset, "Step N of M"); https://riskhub.org/calculator/binomial-tree (exercise nodes coloured; convergence 5–100 steps; early-exercise boundary)
- Topic: two-step CRR pricing; European vs American put
- What moves: nodes fill in from the terminal layer backward, one per step
- What it makes visible: that the option value at a node is a discounted average, not a payoff; where early exercise bites (V = intrinsic)
- Our chapters: **C2** (core: 1-step → 2-step → N-step with "Step" then "Play", then a convergence plot to BS as N grows, then the early-exercise boundary as a curve on the lattice); **F2** (Longstaff-Schwartz as the same backward walk with a regression at each layer)
- Notes: derive p on screen with the numbers (drwong hides it); let parameters be editable; show the 6-step display tree and the N-step price side by side and explain the gap (riskhub does not).

### Pin a curve, change one parameter, compare before/after
- Source: https://drwong.cc/option-greeks ("📌 Pin curves"); https://drwong.cc/efficient-frontier ("frontier before last change" ghost)
- What moves: the current curve; the pinned copy stays as a ghost
- What it makes visible: the *direction and size* of a sensitivity, which a single live curve never shows
- Our chapters: **C4/C5** (pin Δ at T=1, move T to 0.05 → the step function appears); **D2** (pin yesterday's smile); **E3** (ghost frontier when ρ changes); **A5** (pin GARCH conditional vol at one (α, β), change persistence)
- Notes: cap pins at 3 with colour legend; label each pin with the parameter value it was taken at.

### Drag on the chart to scrub the parameter on its x-axis
- Source: https://drwong.cc/option-greeks
- What moves: dragging across "Vega vs σ" changes σ for every other chart
- What it makes visible: the chart is not a picture, it is the control; cross-chart coupling
- Our chapters: **C3/C4** (drag along the price curve to move spot), **0.1** (drag the expansion point of the Taylor series), **A1** (drag the ν of a t-distribution on the tail plot)
- Notes: give a visible handle; show the current value as a vertical marker on every chart.

### Click on the plane to add a data point / asset
- Source: https://drwong.cc/efficient-frontier ("Click anywhere on the chart to add an asset at that risk & return")
- What it makes visible: the frontier as a function of the asset set; one new asset bends the bullet
- Our chapters: **E3** (core); **A3** (click to add an outlier and watch the regression line swing; click to add collinear points); **G1** (add points, watch the fit and the validation error)
- Notes: pair with a ghost of the previous frontier/line.

### Surface with a probe marker tied to the sliders, and a ridge for the special locus
- Source: https://drwong.cc/option-greeks-3d, /option-portfolio-3d (white dot; dashed gold ATM ridge S = K; click surface to move marker)
- What it makes visible: a Greek's whole landscape plus "where am I now"; the ATM ridge shows where Γ and Θ concentrate as T → 0
- Our chapters: **C4/C5** (Γ, vanna, volga surfaces with ATM ridge), **D2** (vol surface with the ATM term-structure ridge and a probe at (K, T)), **F1** (PDE solution surface over (S, t) with the exercise boundary as the ridge)
- Notes: always offer a 2D slice synchronised to the probe (surface alone hides numbers); colour legend; keyboard nudges.

### Strategy presets that populate a book, and hover-at-scenario-price readout
- Source: https://drwong.cc/option-portfolio (10 presets; hover shows every Greek at that spot)
- What it makes visible: that a structure is a sum of legs; Greeks of the sum
- Our chapters: **C1** (payoff builder with presets), **H2** (autocallable / TARF / accumulator each decomposed to vanilla legs — the preset *is* the decomposition), **D1** (hedge book)
- Notes: show the leg table and the aggregate together; let the learner delete a leg and watch the profile change.

### Three-method comparison on one distribution, with a crash-mode distribution switch
- Source: https://drwong.cc/value-at-risk (Normal / Student-t ν=5 / Bimodal with crash prob 3% and severity 5σ; Δ-normal vs Δ-Γ vs MC vs Historical table)
- What it makes visible: VaR "stops in the calm body just in front of the crash, while ES averages it in"; long gamma thins the tail relative to the Δ-normal approximation
- Our chapters: **E1** (core); **A1** (same distribution switch to show kurtosis), **D3** (jump diffusion as the "crash mode")
- Notes: keep α fixed when switching distribution (drwong silently changes it); plot the four methods' VaR as vertical lines on the same histogram.

### Backtest ledger with breach markers and a "Play reveal"
- Source: https://drwong.cc/value-at-risk (realised P&L vs −VaR over 250 days; Kupiec LR vs 3.841; "▶ Play reveal")
- What it makes visible: a breach as an event in time; the test as a count against an expectation (both too many and too few fail)
- Our chapters: **E1**; **G3** (walk-forward test revealed day by day; the same "reveal" prevents look-ahead intuitively)
- Notes: show the expected breach count (T(1−α)) next to the realised count as the reveal runs.

### Exposing one step of a recursion as a worked substitution
- Source: https://riskhub.org/calculator/ewma-volatility ("σ²ₜ = 0.9400 × 0.00018989 + 0.0600 × 0.00010000 = 0.00018450"); https://riskhub.org/calculator/bond-pricing (price formula with C=25.00, y=5.25%, k=2, n=20 substituted)
- What it makes visible: that the number on the tile came from arithmetic the learner could do
- Our chapters: **A5** (EWMA and GARCH recursion, one step at a time, with a "next step" button); **C2** (p and one node); **C3** (d₁, d₂, N(d₁) with the numbers); **0.1** (each Taylor term's numeric value); **B1** (one Markov step ψP)
- Notes: use the live inputs, not a fixed example; highlight which input each number came from.

### Weight-decay and λ-sensitivity charts for an estimator
- Source: https://riskhub.org/calculator/ewma-volatility (wₖ = (1−λ)λᵏ, cumulative weight, half-life 11.202 obs, "Lambda sensitivity" curve, EWMA vs rolling-20)
- What it makes visible: an estimator as a set of weights on the past; memory length as a half-life
- Our chapters: **A5** (core), **A4** (AR(1) impulse response as the same picture), **G3** (exponential weighting in walk-forward)
- Notes: let λ be continuous; animate the weights sliding as new data arrives.

### Approximation ladder table: first-order, second-order, exact
- Source: https://riskhub.org/calculator/bond-pricing (scenario table −200…+200 bp: duration-only, duration + convexity, exact repricing, e.g. −200 bp exact 1,148.39 = +17.094%)
- What it makes visible: where a Taylor approximation breaks and how much the next term buys
- Our chapters: **0.1** (core: f(x) ≈ 1 term, 2 terms, 3 terms vs exact, as the expansion point moves), **C4** (Δ-only vs Δ+½Γ vs full reprice of an option P&L for a range of dS), **E1** (Δ-normal vs Δ-Γ vs full revaluation VaR)
- Notes: plot the three as curves and the error as a separate panel; the table alone hides the shape.

### "Break the discretisation" knob with a visible stability threshold
- Source: https://riskhub.org/blogs/ornstein-uhlenbeck-processes (Euler gap factor (1 − κΔ) vs exact e^{−κΔ}: Δ=0.25 → sd 0.577% vs 0.500%; Δ=0.5 → start forgotten in one jump; Δ=1.0 → oscillates 2% ↔ 6%, variance explodes); the Euler-Maruyama post (negative GBM prices for large Δt)
- What it makes visible (if built as a slider; riskhub only tabulates): that a numerical scheme has a region of validity and what failure looks like
- Our chapters: **B3** (OU mean reversion: Δt slider with κΔ readout, Euler path vs exact path from the same Z's), **F1** (explicit FD scheme with Δt/Δx² past 0.5 → oscillations), **E2** (Euler GBM going negative vs log-Euler)
- Notes: drive both schemes with identical random numbers so the divergence is attributable to the scheme alone; mark the threshold on the slider.

### Same random numbers, wrong model vs right model, side by side
- Source: riskhub MC-of-volatility-models lesson (correlated vs independent shocks scatter, ρ = −0.70 vs ≈ 0; "ρ = 0 gives a symmetric smile instead of skew"); drwong AMM (five curves at identical TVL and price); QuantEcon heavy tails (N(0,2²), N(0,12²), Cauchy on identical axes)
- What it makes visible: the *consequence* of one assumption, isolated
- Our chapters: **A2** (Cholesky: draw independent Z, show scatter; apply L, show the ellipse; omit L → wrong basket price), **B3/B4** (omit the −½σ² term: the mean of simulated S_T drifts away from S₀e^{μT} as σ grows — a counter readout), **D3** (Heston ρ = 0 vs −0.7 smile), **A1** (normal vs t vs lognormal on the same axes)
- Notes: give a numeric "error" readout as well as the picture; common random numbers are the trick.

### Reweighting factor as a curve over outcomes (change of measure)
- Source: https://riskhub.org/blogs/real-world-probability-vs-risk-neutral-probability (dQ/dP = 1.0579 × (S_T/100)^−1.25; tree p=0.65 vs q=0.53514; MC reweighting reproduces BS 9.935 vs 9.925)
- What it makes visible (prose there; to be animated by us): Q is P with each outcome's weight multiplied by a known function of the outcome; the same paths, different weights
- Our chapters: **B5** (core: histogram of S_T under P, a dial for θ that tilts each bar by the Radon-Nikodym factor until the mean of e^{−rT}S_T equals S₀), **B2** (martingale check as the readout)
- Notes: keep the paths fixed; only the bar heights change; show "mean of discounted S_T" converging to S₀ as the test.

### Sequence of marginal densities as the picture of a process
- Source: https://intro.quantecon.org/ar1_processes.html (ψ₀…ψ₉ from μ_{t+1}=aμ_t+b, v_{t+1}=a²v_t+c²; from two starts to one ψ\*); https://python.quantecon.org/linear_models.html (20 paths, black dots at y_T, rotated histogram; 80 paths with dots at T=10/50/75)
- What it makes visible: a process is a moving distribution; stationarity = the distribution stops moving; the fan-with-histogram ties paths to densities
- Our chapters: **A4** (stationary vs unit root: the density sequence spreads forever for a=1), **B1/B3** (random walk and BM: variance growing linearly as a widening normal), **B2** (martingale: the mean of the density sequence stays put)
- Notes: animate t; show the fan on the left and the density at the cursor on the right; let the learner set a (0.9 vs 1.0 vs 1.05).

### Convergence on the simplex (distribution over states as a point)
- Source: https://intro.quantecon.org/markov_chains_I.html (3D unit-simplex animation, three starts fading to ψ\*; periodic chain orbiting forever)
- What it makes visible: a Markov chain's law as a point that moves; convergence as a spiral into ψ\*; periodicity as an orbit
- Our chapters: **B1** (core; 3-state regime chain with sliders on P), **A5** (regime-switching vol as the same chain)
- Notes: add the "running fraction of time in state i" plot beside it to separate distribution convergence from ergodicity (Markov Chains II does this with a periodic chain).

### Same model, four views (impulse response · spectrum · autocovariance · sample path)
- Source: https://python-advanced.quantecon.org/arma.html (quad plots for white noise, AR(2) φ=(1.3,−0.7), AR(1) 0.9, seasonal AR(4), ARMA(1,1))
- What it makes visible: that one set of coefficients implies all four pictures at once
- Our chapters: **A4** (core: sliders for φ₁, φ₂, θ₁ with the four panels updating; a "random walk" preset at φ=1 where the ACF stops decaying); **A5** (ACF of r² as the volatility-clustering fingerprint)
- Notes: skip the spectrum for our audience or make it optional; the ACF + IRF + path trio is enough.

### Bayesian update as a four-frame contour story
- Source: https://python.quantecon.org/kalman.html (prior → signal dot → twisted posterior → predictive)
- What it makes visible: updating as geometry; the surprise vector pulls and rotates the ellipse
- Our chapters: **A2** (conditional distribution of a bivariate normal: slide the conditioning value), **G1** (regularisation as a prior), **F2** (calibration as updating parameters from prices)
- Notes: keep the previous frames as faint outlines.

### Cholesky as "innovations": turning correlated draws into a sequence of surprises
- Source: https://python.quantecon.org/multivariate_normal.html (ε = C⁻¹(X − μ) checked to 1e-10; IQ learning with ±1.96σ band narrowing as 1/√n)
- What it makes visible: L is not just a trick to generate correlated numbers; L⁻¹ decorrelates
- Our chapters: **A2** (core: left panel independent Z scatter, right panel LZ scatter, slider ρ; inverse direction too), **E3** (PCA on yield curves as the rotation that decorrelates)
- Notes: draw the unit circle → ellipse transformation under L.

### Tamper with a stored value and watch the integrity check fail / submit a deliberately invalid input and read the rejection reason
- Source: https://drwong.cc/blockchain (edit a mined amount → chain red; preset buttons Overspend / Pay self / Zero / Negative with validator log)
- What it makes visible: invariants, by violating them
- Our chapters: **C1** (buttons "price the call below S − Ke^{−rT}" / "break put-call parity" → arbitrage table shows the free money), **B2** (edit one step of a martingale path's conditional mean → the "fair game" check fails), **D2** (enter an arbitrageable smile → butterfly/calendar arbitrage flags)
- Notes: the rejection message must say *which* invariant failed and show the arithmetic.

### "How this number was formed" panel
- Source: https://drwong.cc/ngram (active order, context, seen-count, supplying order, smoothing, formulas; counts table MLE → add-k → final)
- What it makes visible: provenance of a single output
- Our chapters: every chapter with a headline number — **C3** (price ← d₁, d₂, N(d₁), N(d₂)), **E1** (VaR ← σh ← σ, h), **A5** (σ²ₜ ← λ, σ²ₜ₋₁, r²ₜ₋₁)
- Notes: live, not a fixed example; one click from the tile.

### Monitor that must be monotone (and a reduction check)
- Source: https://drwong.cc/hmm (objective "should not decrease"); /higher-order-hmm (m=1 equals first-order "to 1e-9"); /lstm ("diverged — lower the learning rate")
- What it makes visible: that the learner can tell when an algorithm is broken
- Our chapters: **A5** (GARCH MLE: likelihood per iteration must rise; N→∞ check that GARCH(1,1) with α+β→1 → IGARCH), **F2** (calibration objective), **G1** (training vs validation loss)
- Notes: pair with a "Step one iteration" button.

### Reading-level dial for terminology density
- Source: https://mbrenndoerfer.com/writing/… ("Reading Level: Beginner / Intermediate / Expert / Hide All" controls glossary tooltips)
- What it makes visible: nothing new, but it lets one page serve the charter's baseline-only reader and the quant
- Our chapters: site-wide UI decision, not a chapter technique
- Notes: our equivalent could be "show the derivation" toggles per section.

---

## 7. What they do NOT do well / gaps we can fill

1. **No narrative, no "why".** drwong's labs have at most a "How this works" footer; riskhub's calculators have none; CME has video. Nobody says *what to try first* or *what you should notice*. QuantEcon has narrative but no interaction. Our chapters should open each explorable with a one-sentence prompt ("Set T to 0.05 and watch Δ become a step") and close with the observation stated.
2. **Intermediate steps hidden.** Only riskhub EWMA/bond and drwong n-gram show the arithmetic that produced the tile. drwong Greeks never shows d₁; drwong binomial never derives p; CME never shows N(d₁). Our "how this number was formed" panel fixes this everywhere.
3. **No connection between tools.** drwong's Greeks, tree and MC are "three pricing methods" but you cannot see them agree on one screen; VaR and delta-hedging share a book but not a view. We should have **cross-chapter widgets**: the same S/K/T/σ/r panel yields BS, tree(N), MC(N) and their differences (C2/C3/E2); the same path feeds the hedging P&L (D1) and the backtest (E1).
4. **No misconceptions, no counter-examples.** Only QuantEcon ("Breaking the LLN", periodic chains, Cauchy running mean) and riskhub prose (OU Euler explosion, peeking weight, ρ=0 smile) do this, and never interactively. "Break the model" belongs in nearly every chapter and is cheap to build once the engine exists.
5. **Ranges, units and defaults are undocumented.** Nearly every tool: no slider ranges shown, Vega "per 1%" vs "per 1.0", Θ per day vs per year, vol as 0.2 vs 20%. One site's Greeks page disagrees with its own BS page (Δ 0.6701 vs 0.6368). We must label units on every tile and test every engine against the Python key.
6. **Single path = anecdote, never paired with the distribution** (MetricGate hedging, riskhub Euler post, QuantEcon MC with 50 paths). drwong delta-hedging is the exception. Our rule: any path view has a "run 1,000 of these" button and the histogram appears beside it.
7. **Time is a number, not a dimension.** Θ is a tile; "value now vs at expiry" is two curves. Nobody animates the price curve collapsing onto the payoff as t → T, or Γ sharpening. We should.
8. **3D surfaces without a synchronised 2D slice or colour legend** (drwong 3D, elysiatools). We always pair.
9. **Button-driven dashboards that are empty until "Calculate"** (riskhub VaR). Everything of ours should render with defaults.
10. **Garbled math in HTML** (riskhub, drwong MC estimator symbol). KaTeX everywhere, tested.
11. **Worked examples with arithmetic errors** (CME Greeks lesson 26.1 vs 18.1; riskhub bond current yield). Our tests pin Hull/Natenberg numbers.
12. **Nothing on exotics or structured products as interactive decomposition** — nobody does H1/H2 at all beyond a knockout exercise in QuantEcon.
13. **Nothing visual on measure change, Itô's lemma, quadratic variation, Feynman-Kac.** The best material is riskhub prose (dW² = dt; P vs Q reweighting) with tables where a figure is needed. B2–B6 are wide open.

---

## 8. Top 10 ideas for our chapters

1. **D1 — Attribution bands + histogram + replicating-portfolio-vs-liability** (from drwong delta-hedging), with a narrated "what just happened" per rebalance, a Γ-vs-Θ mirror readout, and a "run 1,000" button. This is the strongest existing tool and still has obvious gaps to fill.
2. **B3 — "Turn Δt until Euler breaks"**: OU process with κΔ readout, Euler and exact paths driven by the same Z's, stability threshold marked on the slider (numbers from riskhub's OU table: Δ=0.5 forgets the start, Δ=1.0 oscillates 2% ↔ 6%). Reuse the device in F1 for the explicit-FD stability limit.
3. **B4/B3 — Omit the −½σ² term and watch the mean readout drift**: common random numbers, two fans (correct vs naive), counter "mean(S_T)/S₀e^{μT}" moving away from 1 as σ grows; plus the "dW² = dt is cancellation not shrinkage" demo with a "peeking weight" button that leaves a persistent error ≈ 0.48.
4. **B5 — Reweight, don't resimulate**: S_T histogram under P; dial θ; bars tilt by exp(−θW_T − θ²T/2) ∝ (S_T/S₀)^{−θ/σ}; readout "mean of e^{−rT}S_T" hits S₀ exactly at θ = (μ − r)/σ; call price under Q appears and matches BS.
5. **C2 — Step-through tree that derives p on screen, then "Play" to N = 200 with the price converging to BS on a log-N chart, then the early-exercise boundary drawn across the lattice; editable Hull 12.12 parameters as the test case.** Merge drwong's walkthrough with riskhub's convergence and boundary outputs.
6. **0.1 / C4 / E1 — The approximation ladder as curves, not a table**: Taylor 1-term/2-term/3-term vs exact with a draggable expansion point (0.1); Δ-only vs Δ+½Γ vs full reprice across dS (C4); Δ-normal vs Δ-Γ vs full revaluation VaR with a long-gamma book (E1, drwong's "positive gamma caps the loss").
7. **A4 — Four-view model gallery with sliders** (IRF · ACF · sample path · marginal-density movie), presets white noise / AR(1) 0.9 / AR(2) (1.3, −0.7) / random walk φ=1 / ARMA(1,1) (0.98, −0.7); the density sequence stops moving when |φ| < 1 and never does at φ = 1 (QuantEcon ar1 + arma + linear_models combined).
8. **E2 — Variance-reduction switches with per-estimator error bands on a log-N axis, plus a scatter of (control, payoff) explaining why the control variate works, plus a "noisy small-M" demo** (QuantEcon's 1986 vs 649 at M = 10,000).
9. **E1 — Distribution switch Normal / t(ν) / crash-mode with α fixed, four methods' VaR as vertical lines on one histogram, and a day-by-day backtest reveal with the Kupiec count ticking against its expectation.** Reuse the reveal in G3 for walk-forward testing.
10. **Site-wide — "How this number was formed" panel and "break it" button on every explorable**: one click from any tile shows the live substitution (riskhub EWMA style); a red button submits an invalid state (price below its bound, arbitrageable smile, non-adapted weight, ρ = 0 shocks in a skewed market) and the page shows *which invariant failed and the arithmetic* (drwong blockchain style). Add pinned ghost curves and drag-to-scrub to every parameter chart (drwong Greeks style).
