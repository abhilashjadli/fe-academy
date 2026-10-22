# A1 — Normal vs lognormal, fat tails: "adding slides, multiplying stretches"

_Phase R1 research note + storyboard. Status: BUILT alongside this note (sponsor asked to proceed; redirect welcome). Sources: catalogue §A1 (B15, B19, B20, B48, B54, B61, B87, B89); 3b1b `_2017/efvgt.py` `ExponentsAsHomomorphism`, `_2020/covid.py` `RescaleToLogarithmic`, `_2023/clt/main.py` `InfiniteVariance`; QuantEcon heavy_tails; riskhub's −½σ² "omit the drift correction" lab; Hull OFOD 5e §12.1–12.3 (lognormal property, distribution of the rate of return); Tsay ch. 1 (returns, their moments)._

## 1. The one thing the learner must come away feeling

**Additive noise slides; multiplicative noise stretches.** A quantity that gains or loses a *fixed amount* each step ends up on a bell (0.2). A quantity that gains or loses a *percentage* each step ends up skewed — it cannot go below zero and it has a long right tail — and taking its logarithm turns that skew back into a bell. That is the lognormal, and it is why finance works in log-returns. Second feeling: the bell is only the fixed point of adding when no single step can dominate. Real daily returns have steps that *can* dominate; their tails are fat, and "a 5σ day" under the bell happens every few years, not once in the age of the universe.

Secondary: the volatility drag — the typical (median) outcome of multiplicative growth is below its average outcome by about ½σ² per step; mean ≠ median ≠ mode for the lognormal; skew and kurtosis as the numbers that say "how far from the bell"; the Student-t as the simplest fat-tailed family; the 1-in-N-years reading of a tail probability.

## 2. Baseline check

Assumes 0.2's content is available but not required (a two-line recap of "sum of steps → bell" is inside F0). Assumes logarithms and e (calculus baseline). No finance assumed: "a saver's balance" is the object; the words "return" and "price" enter only after the mathematics is in place.

## 3. Candidate illustration techniques considered

| # | Technique | Source | Verdict |
|---|---|---|---|
| T1 | **Story race**: two savers over a year, paths fanning out, histograms forming on the right — as a scrubbable timeline with captions and voice | B48 slide-vs-stretch; B20 sampling; new Timeline component | **Use** — opening, the story the chapter hangs on |
| T2 | **Log-axis morph**: the skewed histogram's axis stretches to log scale and the skew vanishes | B15 (`covid.py` `RescaleToLogarithmic`) | **Use** — the central move |
| T3 | **Product → sum animated derivation**: (1+r₁)(1+r₂)… → log → Σ log(1+rᵢ) → Taylor (link to 0.1) → the −½r² drag | B83 symbol build-up; riskhub drift lab | **Use** — timeline animation |
| T4 | **Lognormal explorable**: μ, σ sliders; mean/median/mode markers; ghost normal with the same mean and sd | B33/B83 | **Use** |
| T5 | **Same-axes comparison** normal vs Student-t (ν slider), linear and log density; "1-in-N-years" readout for a k-σ day | B54, B87, B89 | **Use** |
| T6 | **CLT stalls**: sums of a heavy-tailed step; standardised histogram never settles; running sd jumps | B19/B20 (`InfiniteVariance`) | **Use** — break-it beat (true infinite variance via simulation, unlike 0.2's finite stand-in) |
| T7 | **Real data**: daily log-returns of an index as a histogram with the bell and a t fitted; count of ≥4σ days vs the bell's prediction | B89 | **Use when data arrives** — simulated stand-in until the sponsor uploads a CSV |
| T8 | Log–log survival function with slope −α | B15 | Defer to A5/E1 (too technical for a first pass) |
| T9 | Running Cauchy mean never settling | B19 | Fold into T6 as a readout |

## 4. Chosen form and why

**Story-led, with one animated derivation and three explorables.** The "which world are you in" content wants comparison, and comparison wants a story with two characters the reader can keep apart. The timeline component makes the opening and the derivation move; voice is optional. Inline-live elsewhere.

## 5. Storyboard

**F0 — Ada and Mel's year (timeline animation, ~70 s, 6 captions, voice optional).** Two savers start with 100. Every day a fair coin. Ada: +1 or −1. Mel: +1 % or −1 %. Top panel: 150 paths each, drawn day by day over 250 days, Ada in blue, Mel in amber, same axes. Right edge: the end-of-year histograms grow. Captions: (1) the rule; (2) day 20: indistinguishable; (3) day 120: Mel's cloud leans — the winners pull away, the losers compress; (4) day 250: Ada's bell vs Mel's lean; Mel never goes below zero; (5) "Mel's average is 100, but her typical year ends below it"; (6) the question of the chapter: why does adding give a bell and multiplying give a lean — and how do we get the bell back? Scrubber, play/pause, speed, voice toggle.

**F1 — The log move (explorable).** Mel's end-of-year histogram on a linear axis; a slider *axis warp* from linear to logarithmic morphs the axis: the skew drains out and the bars become a bell. Toggle "Ada" to see hers stays a bell on linear and *gains* a lean on log. Readouts: skewness of each. Caption: *log turns stretch into slide.* Step-size slider (0.2 %–3 %) shows the lean growing with the step.

**F2 — Why multiplying becomes adding (timeline derivation, ~60 s).** 100 · (1+r₁) · (1+r₂) · … · (1+r₂₅₀). Take log: log 100 + Σ log(1+rᵢ) — a *sum* of 250 small random things — 0.2 says that is a bell. So log(Mel) is normal: Mel is **lognormal**. Then Taylor (0.1): log(1+r) = r − r²/2 + … so Σ log(1+rᵢ) ≈ Σ rᵢ − ½ Σ rᵢ² — the second term is always negative: every wobble costs. With ±1 %: expected log-growth per day = −½·(0.01)² = −0.00005; over 250 days −0.0125 → median 100·e^−0.0125 = 98.76 while the mean stays 100. **Volatility drag**, with the numbers.

**F3 — The lognormal (explorable).** Density of e^X with X ~ N(μ, σ²); sliders μ (−0.5…0.5) and σ (0.02…1); markers for mode e^{μ−σ²}, median e^μ, mean e^{μ+σ²/2}; ghost normal with the same mean and sd; readout of skewness. At σ = 0.02 the two curves coincide (small steps: the worlds agree); at σ = 0.5 they do not.

**F4 — Does the world agree? (comparison).** Histogram of daily log-returns (real index data when supplied; until then a labelled simulated t-series), bell with the same mean and sd overlaid, and a Student-t fitted; linear and *log-density* views; readouts: kurtosis, count of |z| ≥ 4 days observed vs the bell's expectation. The log-density view is where the bell visibly fails: its tails fall as a parabola, the data's as straight lines.

**F5 — How fat is fat? (explorable).** Normal vs Student-t with ν slider (1.5…30), same axes, linear and log density; a draggable "k-σ day" marker with the readout *under the bell this happens once in N years; under this t once in M years* (252 days a year). Kurtosis readout (∞ for ν ≤ 4). The 1987 line: −20σ under the bell.

**F6 — Break it: when adding stops making a bell.** Sums of n steps from a t with ν = 1.5 (infinite variance): histograms for n = 1, 10, 100 standardised by the *sample* sd — they never collapse to one curve, and the running sd of the sum keeps jumping as n grows. Side by side with ν = 5 (finite variance), which does collapse. Caption: *the bell needs a finite spread; a fat-enough tail denies it.*

**Ending.** One paragraph; collapsed "where you will meet this again": B3 (Mel in continuous time is geometric Brownian motion), C3 (Black-Scholes lives in Mel's world and assumes the bell for log-returns), E1 (VaR under fat tails), A5 (volatility clustering as the other way the bell fails).

## 6. Mathematics (engine and tests)

- Lognormal: X ~ N(μ, σ²), Y = e^X: pdf f(y) = 1/(yσ√2π) exp(−(ln y − μ)²/2σ²); mean e^{μ+σ²/2}; median e^μ; mode e^{μ−σ²}; variance (e^{σ²}−1)e^{2μ+σ²}; skewness (e^{σ²}+2)√(e^{σ²}−1).
- Student-t pdf: Γ((ν+1)/2)/(√(νπ)Γ(ν/2)) (1+x²/ν)^{−(ν+1)/2}; variance ν/(ν−2) for ν > 2; excess kurtosis 6/(ν−4) for ν > 4; scale so the sd matches the normal's for comparison when ν > 2.
- Sample skewness and kurtosis (standard moment estimators).
- Coin-step world: ±1 % multiplicative, 250 steps: median factor (0.99·1.01)^{125} = 0.9999^{125} = 0.98758; mean factor 1.
- 1-in-N-years for a k-σ day: N = 1/(252 · 2 · (1 − F(k))) two-sided.

## 7. Reference numbers (to verify with the Python key)

- (0.9999)^125 = 0.987577; log = −0.0125006.
- Normal: P(|Z| ≥ 4) = 6.334e−5 → one day in 15,787 → once in 62.6 years; P(|Z| ≥ 5) = 5.733e−7 → once in 6,920 years; P(|Z| ≥ 20) ≈ 5.5e−89.
- Student-t ν = 4 (scaled to unit sd, scale = 1/√2): P(|X| ≥ 4 sd) — compute in key.
- Lognormal μ = 0, σ = 0.5: mean 1.1331, median 1, mode 0.7788, skewness 1.7502.

## 8. Misconceptions

- "Returns are symmetric so prices are symmetric" — no: symmetric *percentage* steps give a skewed price.
- "The average outcome is the typical outcome" — not for multiplicative growth (drag).
- "A 5σ event is impossible" — under the bell, once in 7,000 years; in daily index data, several per decade.
- "Fat tails = high volatility" — no: same sd, different tail shape (F5 keeps sd fixed).
- "More data will make the CLT work" — not if the variance is infinite (F6).

## 9. Data request

Daily closes of NIFTY 50 and/or S&P 500, as long a history as available, CSV with date and close. The chapter ships with a simulated stand-in labelled as such; the figure swaps to the real series when the file is placed at `apps/web/src/data/<index>.json` (date, close).

## 10. Open questions for the sponsor

1. Names: Ada and Mel (add / multiply) — keep, or local names?
2. Index for F4: NIFTY 50 (home market) or S&P 500 (longer history)? Both can be offered as a toggle.
