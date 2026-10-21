# FE Library — Project Charter (v2, locked 2026-10-21)

_Single source of truth. Mirror of the Project doc `claude/00-project-charter.md`. If they differ, the Project doc wins; fix this copy._

## 1. What we are building

**A library of standalone explorable chapters** on financial engineering — in the spirit of drwong.cc, Bartosz Ciechanowski, Seeing Theory and 3Blue1Brown — for engineers joining a financial engineering firm. One web page per chapter; open any chapter in any order; each self-contained. A concept map on the landing page shows relationships for navigation only. **No overall game, no XP, no streaks, no levels, no placement quiz, no spaced repetition, no unlocks.** Game-like mechanics may appear *inside* a chapter only where they teach.

**The single most important requirement is the quality of each chapter's illustration.** The job of the project is to research and find the best illustration technique for each topic, then build it. Sliders are one technique among many — not the default. Options include: parameter explorables, step-through walkthroughs, break-the-model experiments, animated derivations, side-by-side model comparisons, scroll-driven explorables, case stories, and — where no interactive form helps — highly illustrated text with strong static figures. Effort concentrates on the topics that are ideal candidates for interaction.

## 2. Audience and baseline (assume ONLY this)

- Calculus: derivatives, integrals, chain rule, partial derivatives. **Taylor series is forgotten → taught as a chapter.**
- Linear algebra: vectors, matrices, inverses, eigenvalues (mechanically).
- Probability: random variables, expectation, variance, conditional probability, independence. **Normal distribution and basic combinatorics → taught with strong illustrations.**
- Programming: can read code; comfortable with the idea of simulation. **Minimal programming tasks** — code appears only as short "this is what computes it" panels.
- Nothing about financial markets or instruments is assumed. Statistics beyond intro, time series, stochastic processes, measure theory, options are all taught from scratch.

## 3. Syllabus (locked)

**0. Foundations made interactive**
0.1 Taylor series · 0.2 Counting, the binomial and the normal (Galton board, CLT)

**A. Probability & statistics for finance**
A1 Normal vs lognormal, fat tails, skew/kurtosis · A2 Dependence: correlation, multivariate normal, Cholesky, PCA · A3 Regression and its failure modes: heteroskedasticity, multicollinearity, autocorrelation · A4 Time series: stationarity, AR/MA/ARIMA, random walk vs mean reversion, unit roots · A5 Volatility: EWMA, ARCH/GARCH, MLE fitting, forecasting and evaluation

**B. Stochastic processes & calculus**
B1 Random walks, Markov chains, Poisson process · B2 Martingales · B3 Brownian motion, GBM, quadratic variation, mean reversion · B4 Itô's lemma · B5 Risk-neutral measure, Girsanov, change of measure · B6 Feynman-Kac: PDE ↔ expectation

**C. Options**
C1 Mechanics, payoffs, bounds, put-call parity · C2 Binomial model → convergence to Black-Scholes · C3 Black-Scholes in detail: both derivations, formula, implied vol · C4 Greeks I: delta, gamma, theta, vega, rho and the PDE linking them · C5 Greeks II: vanna, volga, charm, speed, zomma, color and interrelationships

**D. Hedging & volatility**
D1 Delta hedging and P&L attribution (gamma vs theta, discrete hedging error) · D2 Implied vol, smile, skew, term structure, the surface · D3 Beyond Black-Scholes: local vol, Heston, SABR, jump diffusion

**E. Risk & simulation**
E1 VaR and Expected Shortfall: historical, parametric, Monte Carlo, backtesting · E2 Monte Carlo methods: paths, convergence, variance reduction · E3 Portfolio theory, efficient frontier, PCA on yield curves

**F. Numerical methods**
F1 Finite-difference PDE solvers · F2 Longstaff-Schwartz, calibration, automatic differentiation for Greeks

**G. Machine learning for finance**
G1 Supervised learning, regularisation, validation · G2 Unsupervised: clustering, PCA/autoencoders · G3 Time-series and volatility forecasting with ML; leakage, walk-forward testing, backtest overfitting

**H. Exotics & structured products — built LAST**
H1 Exotics: barriers, digitals, Asians, lookbacks, baskets/worst-of · H2 Structured products: BEN (expansion to confirm with sponsor), Phoenix, autocallables (single-name, multi-name/basket, worst-of), accumulator, decumulator, TARF, reverse TARF, option strip, risk reversal — each decomposed into vanillas, with the minimal FX-forward/rates background folded in.

**Out of scope:** interest-rate curve/short-rate models, credit/XVA, forwards/futures/swaps mechanics as chapters, market structure, accounting, real options, weather/insurance derivatives.

## 4. Process

**Phase R0 — illustration research (first):** catalogue illustration techniques from 3Blue1Brown's open-source animation code (entire repo, all topics, finance-relevant or not), drwong.cc, riskhub.org, Seeing Theory, setosa.io, Complexity Explorables, Immersive Math, Ciechanowski, Distill, Google PAIR, R Psychologist, ML visualisation sites, QuantEcon. Output `research/illustration-catalogue.md`: technique → what it makes visible → which of our chapters could use it.

**Phase R1 — per-chapter research note** `research/<id>.md`: the one thing the learner must come away understanding; candidate illustration techniques considered; **the chosen technique and why** (may be "illustrated text"); the best existing explanations found (sources, what they do well); formulas with notation and assumptions; worked numbers for tests (Hull/Natenberg/Shreve examples); misconceptions; a one-page storyboard. Sponsor reviews the storyboard only.

**Phase B — build** chapter by chapter, Core order 0→G, H last. Engine in TypeScript with tests against a Python answer key; Antigravity (Gemini Argon) reviews each chapter independently (`reviews/<id>.md`); sponsor judges clarity and feel.

## 5. Tooling and roles

- **Claude (this Project, top model):** research, design, build, tests, docs. Reads PDFs, websites, forum threads, papers, GitHub source directly. Cannot watch video.
- **NotebookLM:** video transcripts only, when Claude asks, with the prompt in §7. Sponsor uploads the answer here as `nlm-<id>.md`. Key-frame screenshots for the few videos where the visual is the idea.
- **Antigravity (Gemini Argon):** independent reviewer on the repo.
- **Repo:** `abhilashjadli/fe-academy` (private). Research notes, specs, code, reviews all live there. Chat history is never the only copy of anything.
- **Books available (uploaded by sponsor to the Project):** Hull OFOD 5e (2002 — theory fine, rates/credit dated), Shreve SCF II, Natenberg Option Pricing & Volatility (1994), Tsay Analysis of Financial Time Series, Glasserman Monte Carlo Methods, Gatheral The Volatility Surface, Wilmott on Quantitative Finance. Free online: ISLP, Hyndman FPP, MIT 18.S096, QuantEcon, 3Blue1Brown written lessons. Stefanica not available. Books are never committed to this repo.

## 6. Tech decisions

React + TypeScript + Vite, KaTeX, Plotly/D3 (2D), Three.js (3D), optional Manim-rendered clips. Browser-only; GitHub Pages. Visual language consistent across chapters; pedagogy varies per chapter.

## 7. NotebookLM prompt (per chapter, when requested)

> For the topic "<topic>": (1) In what order does each video introduce ideas, and what is the very first thing it shows? (2) Every analogy or picture it uses, quoted, with timestamp. (3) Every concrete numerical example, with the numbers. (4) The moment it says "the key insight is…" or equivalent, quoted. (5) Anything the videos disagree on. Quote; do not summarise.

## 8. Antigravity review prompt (per chapter)

> You are an independent quantitative-finance reviewer. Read `research/<id>.md`, `apps/web/src/chapters/<id>/`, its tests and test output. Report with reproducible inputs: wrong formulas/assumptions; sign/unit errors; normalisation errors; broken boundary cases (T→0, deep ITM/OTM, σ→0); misleading plots; claims in the text not matched by the numbers; missing prerequisites given the baseline in the charter; missing tests. "Looks correct" is not a finding — give evidence or the exact check you ran. Write your report to `reviews/<id>.md`.
