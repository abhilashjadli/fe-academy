# A2 — Dependence: correlation, Cholesky, PCA: "correlation is a shear"

_Phase R1 research note + storyboard. Status: BUILT alongside this note. Sources: catalogue §A2 (B21, B31, B35, B39, B40, B45, B46, B67); 3b1b `_2021/quick_eigen.py`, `_2019/clacks/solution1.py` `rescale_axes` (ellipse → circle), `_2018/eop/chapter1/various_intro_visuals.py` `VisualCovariance`, `_2023/convolutions2/diagonal_slices.py`; immersivemath ch06/ch10; setosa PCA & eigenvectors; QuantEcon multivariate_normal; riskhub "MC of volatility models" (ρ = 0 vs −0.7)._

## 1. The one thing the learner must come away feeling

**Correlation is a shear.** Take a round cloud of independent noise and shear it: the cloud becomes a tilted ellipse, and the tilt *is* the correlation. Cholesky is the name of that shear written as a matrix (L, with Σ = LLᵀ), and its inverse turns real data back into independent "surprises". PCA is the ellipse's own axes: rotate a line through the cloud and the direction of maximum spread is the first principal component. Second feeling: correlation summarises a cloud by one number, and one number can lie — the same ρ can hide very different tails (a t-copula crashes together far more often than a Gaussian one), and a single outlier or a curved relationship can fake or hide it.

## 2. Baseline check

Assumes vectors, matrices, matrix multiplication, eigenvalues "mechanically" (charter §2), variance and expectation. Teaches covariance, correlation, the bivariate normal picture, Cholesky, whitening, PCA as a geometric fact. A1 is referenced for "what the tails do".

## 3. Candidate techniques considered

| # | Technique | Source | Verdict |
|---|---|---|---|
| T1 | **Story**: two stalls on one street, one weather — daily takings as dots; the cloud tilts | B31/B21; new | **Use** — opening timeline with voice |
| T2 | **Cloud machine**: independent z₁, z₂ → round cloud; ρ slider shears it; ghost circle; measured ρ readout | B21, B40, `rescale_axes` | **Use** — central explorable |
| T3 | **Signed covariance rectangles** per point, positive/negative quadrants, summed | B35 `VisualCovariance` | **Use** — toggle inside T2 |
| T4 | **Cholesky as the shear, animated**: unit circle → ellipse under L; the 2×2 L by hand; the inverse un-shears real data into surprises | B40, B45 | **Use** — timeline derivation |
| T5 | **Drag a line through the cloud; variance of the projection; the max is PC1** | B46, setosa PCA | **Use** — discovery explorable |
| T6 | **Many assets**: correlation heatmap, scree bars, first-component loadings all positive = "the market" | catalogue E3 preview | **Use** (simulated six assets) |
| T7 | **Same ρ, different tails**: Gaussian vs t-copula clouds; icon grid of "both fell > 2σ" days | B31, B67 | **Use** — the honest beat |
| T8 | **Break it**: ρ = 0 but dependent (a parabola); ρ manufactured by one outlier | setosa/Anscombe | **Use** — two buttons |
| T9 | 3D joint-density bump with diagonal slice | B67 | Defer (E3/C-track) |

## 4. Chosen form

Story opening (timeline, voice), one animated derivation (Cholesky), four explorables, one break-it. Inline-live default.

## 5. Storyboard

**F0 — Two stalls, one weather (timeline, ~60 s).** A lemonade stall and an umbrella stall on the same street. Each day the weather is a number (sunny +, rainy −) and each stall has its own luck. Each day becomes a dot: x = lemonade takings, y = umbrella takings. Day by day the dots fall; by day 60 a tilted cloud; the tilt is downhill: good lemonade days are bad umbrella days. Captions name it: dependence; correlation; "the cloud has a direction". Ends: *how do we make a cloud like this on purpose, and how do we read one?*

**F1 — The cloud machine (explorable).** Two independent standard normals z₁, z₂ → round cloud (ghost). Slider ρ ∈ (−0.98, 0.98): points move to (z₁, ρz₁ + √(1−ρ²) z₂) — each point visibly slides along a line, so the *same* 400 points are reused. Readouts: measured correlation, covariance; toggle "covariance rectangles"; toggle "ellipse and its axes".

**F2 — Cholesky: the shear with a name (timeline derivation, ~55 s).** Unit circle → ellipse under L = [[1, 0], [ρ, √(1−ρ²)]]; Σ = LLᵀ worked for 2×2; then a real-looking correlated cloud and L⁻¹ un-shears it to a round cloud: "innovations" — what was not predictable from the other variable. Final caption: correlated noise is independent noise, sheared; simulation (E2) builds correlated worlds exactly this way.

**F3 — The ellipse's own axes (explorable).** The sheared cloud; a draggable line through the centre; readout: variance of the projection onto that line; a dial of angle vs variance; the maximum is PC1, the perpendicular is PC2; eigenvalues λ₁, λ₂ shown as the ellipse's semi-axes squared; "% of variance explained". Snap buttons to PC1/PC2.

**F4 — Many assets (explorable).** Six simulated assets with one market factor and two sector factors; a 6×6 correlation heatmap; "compute PCA" → scree bars (λ₁ … λ₆) and the loading vectors; PC1 loadings all the same sign = the market; a slider on market-factor strength shows PC1's share rising.

**F5 — Same ρ, different tails (comparison).** Two clouds with ρ = 0.5: Gaussian copula vs t-copula (ν = 3), 2,000 points each on identical axes; a 2σ box; counts of "both beyond −2σ" days in each; the t cloud shows the X-shaped joint tails. Caption: in a crisis, correlations "go to one" — not because ρ changed but because the Gaussian picture never described the tails.

**F6 — Break it (two buttons).** (a) A parabola: ρ ≈ 0 while y is a function of x; (b) a round cloud plus one far outlier: ρ jumps to 0.8. Readouts of ρ before/after.

**Ending** and collapsed note: E3 (portfolio variance wᵀΣw and the frontier; PCA on yield curves), E2 (Cholesky inside Monte Carlo), A3 (regression as projection on this same cloud), G2 (PCA as unsupervised learning).

## 6. Mathematics

cov, corr; bivariate normal construction y = ρx + √(1−ρ²) z; Σ = LLᵀ, 2×2 L explicit, general Cholesky recursion; eigen-decomposition of a 2×2 symmetric matrix in closed form; Jacobi eigenvalue iteration for n ≤ 10; projection variance vᵀΣv; t-copula sampling: Z ~ N(0, Σ), W ~ χ²_ν/ν, T = Z/√W.

## 7. Reference numbers (verify with numpy key)

- Σ = [[1, 0.6],[0.6, 1]]: L = [[1, 0],[0.6, 0.8]]; eigenvalues 1.6, 0.4; PC1 = (1,1)/√2.
- Σ = [[4, 2],[2, 3]]: L = [[2, 0],[1, √2]]; eigenvalues (7 ± √17)/2 = 5.5616, 1.4384.
- Six-asset example: PC1 share with market strength 1.0 ≈ (computed by key).

## 8. Misconceptions

- "ρ = 0 means independent" — F6a.
- "Correlation measures how much y moves per unit x" — no, that is the regression slope; ρ is scale-free.
- "Uncorrelated normals are independent" — true only for *jointly* normal (F5's t-copula has the same ρ with dependence in the tails).
- "PCA finds causes" — it finds directions of variance; the market factor is a reading, not a proof.
- "Cholesky is just a matrix trick" — it is the shear; every Monte Carlo of a correlated book is this picture.
