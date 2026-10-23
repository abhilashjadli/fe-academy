"""Answer key for chapter B4 (Itô): quadratic variation, telescoping identity, GBM moments, Hull/Shreve numbers. -> key-B4.json
Run with: python3 -I tests/answer-key/key_B4.py
"""
import json, os, math
import numpy as np

key = {}
rng = np.random.default_rng(20261023)

# Quadratic variation: E Σ(dW)² = T, sd = T·sqrt(2/n). Monte Carlo check over 20,000 paths for n in (16, 256, 4096).
key["qv"] = []
for n in (16, 256, 4096):
    T = 1.0
    dW = rng.standard_normal((20000, n)) * math.sqrt(T / n)
    q = (dW ** 2).sum(axis=1)
    key["qv"].append(dict(n=n, T=T, mean=float(q.mean()), sd=float(q.std()), sd_formula=T * math.sqrt(2 / n)))

# Telescoping identity on a fixed path (exact): W_T² − 2ΣW dW = Σ(dW)²
W = np.concatenate([[0.0], np.cumsum(np.array([0.3, -0.1, 0.25, -0.4, 0.05, 0.2, -0.15, 0.1]))])
d = np.diff(W)
key["telescope"] = dict(W=W.tolist(), WT2=float(W[-1] ** 2), twoSumWdW=float(2 * (W[:-1] * d).sum()), sumDW2=float((d ** 2).sum()),
                        peeking=float((W[1:] * d).sum()))
assert abs(W[-1] ** 2 - 2 * (W[:-1] * d).sum() - (d ** 2).sum()) < 1e-12

# GBM moments (Hull 11.17; note §6): S0=100, mu=10%, sigma=40%, T=1 → mean 110.52, median 102.02
cases = []
for S0, mu, sigma, T in [(100, 0.10, 0.40, 1.0), (100, 0.10, 0.20, 1.0), (100, 0.15, 0.30, 0.5), (42, 0.10, 0.20, 0.5)]:
    cases.append(dict(S0=S0, mu=mu, sigma=sigma, T=T, mean=S0 * math.exp(mu * T), median=S0 * math.exp((mu - 0.5 * sigma ** 2) * T),
                      log_drift=mu - 0.5 * sigma ** 2, overstatement=math.exp(0.5 * sigma ** 2 * T)))
key["gbm"] = cases

# Monte Carlo: forgetting the −½σ² term overstates the mean by e^{½σ²T} (common random numbers)
key["bug"] = []
for sigma in (0.2, 0.4):
    Z = rng.standard_normal(200000)
    S0, mu, T = 100, 0.10, 1.0
    good = S0 * np.exp((mu - 0.5 * sigma ** 2) * T + sigma * math.sqrt(T) * Z)
    bad = S0 * np.exp(mu * T + sigma * math.sqrt(T) * Z)
    key["bug"].append(dict(sigma=sigma, ratio_good=float(good.mean() / (S0 * math.exp(mu * T))), ratio_bad=float(bad.mean() / (S0 * math.exp(mu * T))),
                           factor=math.exp(0.5 * sigma ** 2 * T)))

# Itô drift/diffusion for named functions (Hull Problem 11.15 style), X with a=0.1, b=0.3 at x=2, t irrelevant
a, b, x = 0.1, 0.3, 2.0
key["ito"] = dict(a=a, b=b, x=x,
                  x2=dict(drift=a * 2 * x + 0.5 * b * b * 2, diff=b * 2 * x),
                  lnx=dict(drift=a / x + 0.5 * b * b * (-1 / x ** 2), diff=b / x),
                  expx=dict(drift=a * math.exp(x) + 0.5 * b * b * math.exp(x), diff=b * math.exp(x)),
                  sqrtx=dict(drift=a * 0.5 / math.sqrt(x) + 0.5 * b * b * (-0.25 * x ** -1.5), diff=b * 0.5 / math.sqrt(x)))

# A1's number is B4's number: 100·e^{−½·0.01²·250} = 98.76 (Shreve p. 93 route) — recorded for the margin note
key["mel"] = dict(median=100 * math.exp(-0.5 * 0.01 ** 2 * 250), exact_pairs=100 * 0.9999 ** 125)

out = os.path.join(os.path.dirname(__file__), "..", "..", "apps", "web", "src", "engine", "__fixtures__", "key-B4.json")
json.dump(key, open(out, "w"))
print("wrote", os.path.normpath(out))
print("gbm", cases[0]["mean"], cases[0]["median"], "bug", key["bug"])
