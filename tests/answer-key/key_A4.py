"""Answer key for chapter A4 (time series). statsmodels + numpy. -> key-A4.json
Run with: python3 -I tests/answer-key/key_A4.py
"""
import json, os, math
import numpy as np
import statsmodels.api as sm
from statsmodels.tsa.stattools import acf as sm_acf, adfuller

key = {}
rng = np.random.default_rng(2024)

# AR(1) stationary moments — QuantEcon's check: a=0.9, b=0.1, c=0.5 (x' = a x + b + c w) → mean 1.0, var 1.316
key["stationary"] = [dict(phi=0.9, c=0.1, sigma=0.5, mean=0.1 / (1 - 0.9), variance=0.25 / (1 - 0.81)),
                     dict(phi=0.5, c=0.0, sigma=1.0, mean=0.0, variance=1 / 0.75),
                     dict(phi=0.98, c=0.0, sigma=1.0, mean=0.0, variance=1 / (1 - 0.98 ** 2))]
# theoretical ACF (Tsay Fig. 2.3): phi = 0.8 → 0.8, 0.64, 0.512 ...
key["acf_theory"] = dict(phi=0.8, acf=[0.8 ** k for k in range(1, 11)], half_life=math.log(0.5) / math.log(0.8))

# a fixed AR(1) sample and its sample ACF (statsmodels, fft=False)
e = rng.standard_normal(500); x = np.zeros(500)
for t in range(1, 500): x[t] = 0.8 * x[t-1] + e[t]
key["sample"] = dict(x=x.round(6).tolist(), acf=[float(v) for v in sm_acf(x, nlags=10, fft=False)[1:]])

# Dickey–Fuller with a constant, no lags: Δy on y_{t−1}; compare with adfuller(maxlag=0, regression='c')
def df_block(y):
    y = np.asarray(y, dtype=float)
    dy = np.diff(y); lag = y[:-1]
    m = sm.OLS(dy, sm.add_constant(lag)).fit()
    adf = adfuller(y, maxlag=0, regression="c", autolag=None)
    return dict(y=y.round(6).tolist(), gamma=float(m.params[1]), t=float(m.tvalues[1]), a=float(m.params[0]), adf_stat=float(adf[0]), crit=dict((k, float(v)) for k, v in adf[4].items()))

# mean-reverting series (φ=0.9) and a random walk, 400 points each
e = rng.standard_normal(400); mr = np.zeros(400)
for t in range(1, 400): mr[t] = 0.9 * mr[t-1] + e[t]
rw = np.cumsum(rng.standard_normal(400))
key["df_mr"] = df_block(mr)
key["df_rw"] = df_block(rw)
# a near-unit-root case the eye cannot tell: φ = 0.98, 300 points
e = rng.standard_normal(300); nr = np.zeros(300)
for t in range(1, 300): nr[t] = 0.98 * nr[t-1] + e[t]
key["df_near"] = df_block(nr)

# random-walk forecast: last value at all horizons; AR(1) forecast decays
key["forecast"] = dict(last=2.0, phi=0.8, c=0.2, h=5, ar1=[float(v) for v in (lambda: [ (lambda s: s)(0) ])()] )
v = 2.0; f = []
for _ in range(5):
    v = 0.2 + 0.8 * v; f.append(v)
key["forecast"]["ar1"] = f

out = os.path.join(os.path.dirname(__file__), "..", "..", "apps", "web", "src", "engine", "__fixtures__", "key-A4.json")
json.dump(key, open(out, "w"))
print("wrote", os.path.normpath(out))
print("DF mr t", key["df_mr"]["t"], "rw t", key["df_rw"]["t"], "near t", key["df_near"]["t"], "crit", key["df_rw"]["crit"])
