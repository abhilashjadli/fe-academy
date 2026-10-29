"""Answer key for chapter B3 (Brownian motion, GBM, quadratic variation, mean reversion / OU). -> key-B3.json
Run with: python3 -I tests/answer-key/key_B3.py
Reference numbers from research/r1/B3.md §6: Hull Ex. 11.1–11.3, Table 11.1, Problem 11.16; Shreve §3.2 (scaled walk) and
Thm 3.4.3 (quadratic variation), Ex. 4.4.10 (OU); riskhub's OU/Euler table. Nothing here duplicates key_B4.py.
"""
import json, os, math
import numpy as np
from scipy.stats import norm, chi2, binom

key = {}
rng = np.random.default_rng(20261029)
HERE = os.path.dirname(os.path.abspath(__file__))

# --- Shreve 3.2.11 (pp. 88–89): scaled random walk W^(100)(0.25) = M_25/10. P{= 0.1} = P{M_25 = 1} = C(25,13)/2^25.
n, t, x = 100, 0.25, 0.1
steps = int(round(n * t))                 # 25 coin tosses
heads = (steps + x * math.sqrt(n)) / 2    # 13 heads
p = binom.pmf(int(round(heads)), steps, 0.5)
assert abs(p - 0.154981) < 5e-7, p
bar = p / (2 / math.sqrt(n))              # bar width 2/√n = 0.2 → height 0.7749
peak = 1 / math.sqrt(2 * math.pi * t)     # N(0, 0.25) density at 0 = 2/√(2π) = 0.7979
key["shreve"] = dict(n=n, t=t, x=x, steps=steps, heads=int(round(heads)), prob=float(p), bar_height=float(bar), normal_peak=float(peak),
                     qv_at_1_37=float(int(math.floor(n * 1.37)) * (1 / n)),  # [W^(100), W^(100)](1.37) = 137 · (1/√100)² = 1.37 (p. 87)
                     page="Shreve pp. 87–89")

# --- Hull examples (Options, Futures and Other Derivatives, ch. 11 in the edition cited in the note)
key["hull"] = dict(
    ex11_1=dict(T=5, sd=math.sqrt(5), page="p. 221"),                                  # sd of a Wiener process after 5 years = √5 = 2.236
    ex11_2=dict(x0=50, a=20, b=30,                                                      # dx = 20 dt + 30 dz from 50
                one_year=dict(mean=50 + 20 * 1, sd=30 * math.sqrt(1)),                 # N(70, 30)
                six_months=dict(mean=50 + 20 * 0.5, sd=30 * math.sqrt(0.5)), page="pp. 220–221"),  # mean 60, sd 21.21
    ex11_3=dict(S=100, mu=0.15, sigma=0.30, dt=0.0192,                                  # one week, Hull's rounded δt
                drift=0.15 * 100 * 0.0192, diffusion=0.30 * 100 * math.sqrt(0.0192), page="p. 224"),  # 0.288 + 4.157ε
    table11_1=dict(S0=20, mu=0.14, sigma=0.20, dt=0.01,
                   eps=[0.52, 1.44, -0.86, 1.46, -0.69, -0.74, 0.21, -1.10, 0.73, 1.16], page="pp. 224–225"),
    prob11_16=dict(S0=50, mu=0.12, sigma=0.30, T=2, K=80, page="Problem 11.16"),
)
S = 20.0
path = []
for e in key["hull"]["table11_1"]["eps"]:
    S = S + 0.14 * S * 0.01 + 0.20 * S * math.sqrt(0.01) * e
    path.append(S)
key["hull"]["table11_1"]["path"] = path                     # 20.236, 20.847, 20.518, 21.146, 20.883, 20.604, 20.719, 20.292, 20.617, 21.124
assert abs(path[0] - 20.236) < 5e-4 and abs(path[-1] - 21.124) < 5e-4, path
p16 = key["hull"]["prob11_16"]
m = math.log(p16["S0"]) + (p16["mu"] - 0.5 * p16["sigma"] ** 2) * p16["T"]
s = p16["sigma"] * math.sqrt(p16["T"])
z = (math.log(p16["K"]) - m) / s
p16.update(z=z, prob_above=float(1 - norm.cdf(z)))           # z = 0.754, P = 0.2253
assert abs(p16["prob_above"] - 0.2253) < 5e-4

# --- Quadratic variation sd √(2/n)·T and the χ²₁ ledger (Shreve Thm 3.4.3; riskhub)
key["qv"] = dict(T=1.0, n=[16, 256, 4096, 65536], sd=[math.sqrt(2 / k) for k in (16, 256, 4096, 65536)],
                 ratio_below_1=float(chi2.cdf(1, 1)), ratio_median=float(chi2.median(1)))   # 0.683, 0.455

# --- Odometer Σ|ΔW| grows like √n: E = n·√(2Δt/π) = √(2nT/π); speedometer rms |ΔW|/Δt = 1/√Δt (Hull p. 219)
odo = []
for k in (16, 256, 4096, 65536):
    dt = 1.0 / k
    dW = rng.standard_normal((2000, k)) * math.sqrt(dt)
    first = np.abs(dW).sum(axis=1)
    odo.append(dict(n=k, dt=dt, expected=k * math.sqrt(2 * dt / math.pi), mc_mean=float(first.mean()), mc_sd=float(first.std()),
                    speedometer_rms=1 / math.sqrt(dt), speedometer_mean=math.sqrt(2 / math.pi) / math.sqrt(dt)))
key["odometer"] = odo

# --- Brownian bridge: midpoint of an interval of length dt given both ends ~ N(mean of ends, dt/4)
key["bridge"] = dict(dt=0.5, midpoint_var=0.5 / 4, note="W(m) | W(l), W(r) ~ N((W(l)+W(r))/2, (r−l)/4)")

# --- GBM: Hull/Shreve numbers for the fan (S0 = 100, μ = 10 %, σ = 40 %)
key["gbm"] = [dict(S0=100, mu=0.10, sigma=0.40, t=t, mean=100 * math.exp(0.10 * t), median=100 * math.exp((0.10 - 0.08) * t),
                   mode=100 * math.exp((0.10 - 0.24) * t), page="Shreve 4.4.28 p. 148; Hull 11.18–11.19") for t in (1, 10)]

# --- OU / Vasicek dX = κ(θ − X)dt + σ dW  (Shreve Ex. 4.4.10 pp. 150–151; riskhub). θ = 4 %, σ = 1 %.
theta, sigma = 0.04, 0.01
key["ou"] = dict(theta=theta, sigma=sigma, cases=[], euler=[], euler_deterministic=[])
for kappa in (0.1, 0.5, 2.0, 10.0):
    key["ou"]["cases"].append(dict(kappa=kappa, half_life=math.log(2) / kappa, stationary_sd=sigma / math.sqrt(2 * kappa),
                                   mean_from_6pct=dict(t1=theta + (0.06 - theta) * math.exp(-kappa * 1), t10=theta + (0.06 - theta) * math.exp(-kappa * 10)),
                                   var_t1=sigma ** 2 / (2 * kappa) * (1 - math.exp(-2 * kappa))))
# Euler stationary sd at κ = 2: X−θ is multiplied by (1 − κΔ) each step, plus σ√Δ Z → var = σ²Δ / (1 − (1−κΔ)²), ∞ when |1−κΔ| ≥ 1
kappa = 2.0
for dt in (0.10, 0.25, 0.50, 0.75, 1.00, 1.10):
    g = 1 - kappa * dt
    sd = sigma * math.sqrt(dt / (1 - g * g)) if abs(g) < 1 else None
    key["ou"]["euler"].append(dict(kappa=kappa, dt=dt, gap_factor=g, stationary_sd=sd, exact_stationary_sd=sigma / math.sqrt(2 * kappa),
                                   exact_step_factor=math.exp(-kappa * dt), stable=abs(g) < 1))
# Deterministic part (σ = 0) from x0 = 6 %: exact deviation decays e^{−κkΔ}; Euler deviation is (1 − κΔ)^k — the blow-up table for Δ = 0.5/1.0/1.1
for dt in (0.5, 1.0, 1.1):
    ks = list(range(0, 9))
    key["ou"]["euler_deterministic"].append(dict(kappa=kappa, dt=dt, x0=0.06, k=ks,
                                                 exact=[theta + 0.02 * math.exp(-kappa * dt * k) for k in ks],
                                                 euler=[theta + 0.02 * (1 - kappa * dt) ** k for k in ks]))
# Monte Carlo: exact-discretised OU reaches the stationary sd; Euler at Δ = 0.5 sits at 0.707 %
Z = rng.standard_normal((4000, 400))
X = np.full(4000, theta)
dt = 0.5
for j in range(400):
    X = X + kappa * (theta - X) * dt + sigma * math.sqrt(dt) * Z[:, j]
key["ou"]["euler_mc_sd_dt_0_5"] = float(X.std())
X = np.full(4000, theta)
a, b = math.exp(-kappa * dt), sigma * math.sqrt((1 - math.exp(-2 * kappa * dt)) / (2 * kappa))
for j in range(400):
    X = theta + (X - theta) * a + b * Z[:, j]
key["ou"]["exact_mc_sd_dt_0_5"] = float(X.std())

# --- Which can you measure: sd of the drift estimate over T years = σ/√T; sd of the vol estimate ≈ σ/√(2n)
key["measure"] = dict(sigma=0.20, T=10, n=2500, drift_sd=0.20 / math.sqrt(10), vol_sd=0.20 / math.sqrt(2 * 2500))

# --- Real NIFTY 50: realised vol (Shreve 3.4.16: σ² ≈ (1/T)Σ(log-return)², T in years, 252 trading days) over the whole file and over 2020
data = json.load(open(os.path.join(HERE, "..", "..", "apps", "web", "src", "data", "nifty50-long.json")))
r_all = np.array([q["r"] for q in data["returns"]])
r_2020 = np.array([q["r"] for q in data["returns"] if q["d"].startswith("2020")])
closes = np.array([q["c"] for q in data["rows"]])
lr = np.diff(np.log(closes))
def rv(r):
    return float(math.sqrt(252 * (r ** 2).mean()))
key["nifty"] = dict(days_per_year=252, n_all=int(len(r_all)), n_2020=int(len(r_2020)),
                    rv_all=rv(r_all), rv_2020=rv(r_2020), rv_all_from_prices=rv(lr),
                    sd_daily_all=float(r_all.std(ddof=1)), sd_ann_all=float(r_all.std(ddof=1) * math.sqrt(252)),
                    sd_ann_2020=float(r_2020.std(ddof=1) * math.sqrt(252)),
                    drift_ann_all=float(r_all.mean() * 252), drift_ann_2020=float(r_2020.mean() * 252),
                    first_window_252=rv(lr[:252]), last_window_252=rv(lr[-252:]))

out = os.path.join(HERE, "..", "..", "apps", "web", "src", "engine", "__fixtures__", "key-B3.json")
json.dump(key, open(out, "w"))
print("wrote", os.path.normpath(out))
print("shreve", key["shreve"]["prob"], key["shreve"]["bar_height"], key["shreve"]["normal_peak"])
print("hull 11.16", p16["z"], p16["prob_above"], "table", [round(v, 3) for v in path])
print("odometer", [(o["n"], round(o["expected"], 2), round(o["mc_mean"], 2)) for o in odo])
print("ou euler", [(e["dt"], e["stationary_sd"]) for e in key["ou"]["euler"]], key["ou"]["euler_mc_sd_dt_0_5"], key["ou"]["exact_mc_sd_dt_0_5"])
print("measure", key["measure"])
print("nifty", key["nifty"])
