"""Answer key for chapter D2 (the smile, the skew, the surface). numpy + scipy. -> key-D2.json
Run with: python3 -I tests/answer-key/key_D2.py
Sources: Hull OFOD 5e ch. 15 (Example 15.1, Tables 15.2, 15.3, App. 15A); Natenberg ch. 18 (the butterfly argument); the NSE NIFTY chain
of 23 Oct 2026 (key_C1C2.py, key_C3C4.py); the NIFTY daily record in apps/web/src/data/nifty50-long.json; storyboards/D2.md.
"""
import json, math, os
import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq

here = os.path.dirname(os.path.abspath(__file__))
fx = os.path.join(here, "..", "..", "apps", "web", "src", "engine", "__fixtures__")
c1 = json.load(open(os.path.join(fx, "key-C1C2.json")))["nse"]
c3 = json.load(open(os.path.join(fx, "key-C3C4.json")))
key = {}

F, K0, r, T = 22603.0, 22600.0, 0.065, 11 / 365
D = math.exp(-r * T)
strikes = np.array(c1["strikes"], float)
calls = np.array(c1["calls"], float)
puts = np.array(c1["puts"], float)
civ = np.array(c3["strip"]["call_iv"])
piv = np.array(c3["strip"]["put_iv"])


def b76(Kx, s, call=True):
    st = s * math.sqrt(T)
    d1 = (math.log(F / Kx) + 0.5 * st * st) / st
    d2 = d1 - st
    return D * ((F * norm.cdf(d1) - Kx * norm.cdf(d2)) if call else (Kx * norm.cdf(-d2) - F * norm.cdf(-d1)))


# ------------------------------------------------------------------ the smile fit (quadratic in log-moneyness, least squares on the 34 dots)
k = np.log(strikes / F)
X = np.concatenate([k, k])
Y = np.concatenate([civ, piv])
A = np.vstack([np.ones_like(X), X, X * X]).T
coef = np.linalg.lstsq(A, Y, rcond=None)[0]
a, b, c = (float(v) for v in coef)
resid = A @ coef - Y
key["fit"] = dict(a=a, b=b, c=c, rms_vol_pts=float(100 * math.sqrt(np.mean(resid ** 2))), max_abs_vol_pts=float(100 * np.max(np.abs(resid))),
                  sigma_at_F=a, sigma_22250=a + b * math.log(22250 / F) + c * math.log(22250 / F) ** 2, sigma_23050=a + b * math.log(23050 / F) + c * math.log(23050 / F) ** 2)


def iv_fit(Kx):
    kk = math.log(Kx / F)
    return a + b * kk + c * kk * kk


def call_fit(Kx):
    return b76(Kx, iv_fit(Kx))


def put_fit(Kx):
    return b76(Kx, iv_fit(Kx), call=False)


# ------------------------------------------------------------------ raw butterflies from the screen (h = 50)
raw = []
for i in range(1, 16):
    bc = float(calls[i - 1] - 2 * calls[i] + calls[i + 1])
    bp = float(puts[i - 1] - 2 * puts[i] + puts[i + 1])
    raw.append(dict(K=float(strikes[i]), call_fly=bc, put_fly=bp, prob_per_100_call=bc / 100 / D))
key["raw_butterflies"] = dict(h=50, rows=raw, negative_calls=sum(1 for x in raw if x["call_fly"] < 0), negative_puts=sum(1 for x in raw if x["put_fly"] < 0),
                              tent_22600=dict(cost=raw[6]["call_fly"], prob_per_100=raw[6]["prob_per_100_call"]))

# ------------------------------------------------------------------ the market's density from the smoothed smile (Breeden–Litzenberger)
h = 5.0


def dens(Kx, s=None):
    f = (lambda x: call_fit(x)) if s is None else (lambda x: b76(x, s))
    return (f(Kx - h) - 2 * f(Kx) + f(Kx + h)) / h / h / D


def cdf(Kx, s=None):
    f = (lambda x: put_fit(x)) if s is None else (lambda x: b76(x, s, call=False))
    return (f(Kx + h) - f(Kx - h)) / (2 * h) / D


sflat = a
grid = list(range(21000, 24201, 50))
key["density"] = dict(h=h, flat_sigma=sflat, K=grid, smile=[dens(x) * 50 for x in grid], bell=[dens(x, sflat) * 50 for x in grid],
                      note="probability of landing within ±25 points of K")
key["density_points"] = {str(x): dict(smile=dens(x) * 50, bell=dens(x, sflat) * 50) for x in [22000, 22250, 22400, 22600, 22800, 23000, 23200]}
key["tails"] = {str(x): dict(smile=cdf(x), bell=cdf(x, sflat), put_smile=put_fit(x), put_bell=b76(x, sflat, call=False), extrapolated=bool(x < 22250 or x > 23050))
                for x in [21000, 21500, 21800, 22000, 22250, 23000, 23200]}
mass_seen = sum(dens(x) * 50 for x in range(22300, 23001, 50))
fine = np.arange(18000, 28000, 2.0)
total = float(sum(dens(x) * 2.0 for x in fine))
key["mass"] = dict(seen_22300_23000=float(mass_seen), total_18000_28000=total, tent_22600_smile=dens(22600) * 100, tent_22600_bell=dens(22600, sflat) * 100)
# smoothed butterflies all non-negative across the quoted range
key["smoothed_nonneg"] = bool(all(dens(x) >= 0 for x in range(22000, 23201, 10)))

# ------------------------------------------------------------------ the kink dial (Figure 3): C(22,650) such that the 22,600/22,650/22,700 tent costs zero
i650 = list(strikes).index(22650)
key["kink"] = dict(K=22650, screen=float(calls[i650]), neighbours=[float(calls[i650 - 1]), float(calls[i650 + 1])], zero_at=float((calls[i650 - 1] + calls[i650 + 1]) / 2),
                   iv_at_screen=float(civ[i650]), dial_range=[215, 240])

# ------------------------------------------------------------------ the record (Figure 1): NIFTY daily log moves since 2016
data = json.load(open(os.path.join(here, "..", "..", "apps", "web", "src", "data", "nifty50-long.json")))
rs = np.array([x["r"] for x in data["returns"]], float)
m, sd = float(rs.mean()), float(rs.std(ddof=1))
tails = {}
for z in [2, 3, 4]:
    tails[str(z)] = dict(down=int((rs < m - z * sd).sum()), up=int((rs > m + z * sd).sum()), bell_each=float(len(rs) * (1 - norm.cdf(z))))
key["record"] = dict(n=int(len(rs)), mean=m, sd=sd, worst=float(rs.min()), best=float(rs.max()), first=data["returns"][0]["d"], last=data["returns"][-1]["d"], tails=tails,
                     hist_edges=[float(x) for x in np.arange(-0.06, 0.0601, 0.0025)])
key["record"]["hist_counts"] = [int(v) for v in np.histogram(np.clip(rs, -0.06 + 1e-9, 0.06 - 1e-9), bins=key["record"]["hist_edges"])[0]]

# ------------------------------------------------------------------ Hull checks
def bs(S, Kx, rr, s, TT, call=True, q=0.0):
    st = s * math.sqrt(TT)
    d1 = (math.log(S / Kx) + (rr - q + 0.5 * s * s) * TT) / st
    d2 = d1 - st
    return (S * math.exp(-q * TT) * norm.cdf(d1) - Kx * math.exp(-rr * TT) * norm.cdf(d2)) if call else (Kx * math.exp(-rr * TT) * norm.cdf(-d2) - S * math.exp(-q * TT) * norm.cdf(-d1))


iv_aud = brentq(lambda s: bs(0.60, 0.59, 0.05, s, 1.0, True, 0.10) - 0.0236, 1e-4, 3)
put_aud = 0.0236 - 0.60 * math.exp(-0.10) + 0.59 * math.exp(-0.05)
key["hull_15_1"] = dict(iv_call=iv_aud, put_by_parity=put_aud, iv_put=brentq(lambda s: bs(0.60, 0.59, 0.05, s, 1.0, False, 0.10) - put_aud, 1e-4, 3))
# Table 15.3: S = 50 jumps to 58 or 42, then σ = 20 %, r = 5 %, T = 0.25
Ks = [35, 40, 45, 50, 55, 60, 65]
mix = [0.5 * bs(58, Kx, 0.05, 0.20, 0.25) + 0.5 * bs(42, Kx, 0.05, 0.20, 0.25) for Kx in Ks]
ivs = [brentq(lambda s: bs(50, Kx, 0.05, s, 0.25) - p, 1e-4, 3) for Kx, p in zip(Ks, mix)]
dens_153 = {str(Kx): math.exp(0.05 * 0.25) * (mix[i - 1] - 2 * mix[i] + mix[i + 1]) / 25 for i, Kx in enumerate(Ks) if 0 < i < 6}
key["hull_15_3"] = dict(K=Ks, calls=mix, iv=ivs, book_iv=[30.95, 35.46, 39.94, 41.48, 39.27, 35.66, 32.50], density_h5=dens_153)
key["hull_15_2"] = dict(strikes=[0.90, 0.95, 1.00, 1.05, 1.10], maturities=["1m", "3m", "6m", "1y", "2y", "5y"], T=[1 / 12, 0.25, 0.5, 1, 2, 5],
                        vols=[[14.2, 13.0, 12.0, 13.1, 14.5], [14.0, 13.0, 12.0, 13.1, 14.2], [14.1, 13.3, 12.5, 13.4, 14.3], [14.7, 14.0, 13.5, 14.0, 14.8], [15.0, 14.4, 14.0, 14.5, 15.1], [14.8, 14.6, 14.4, 14.7, 15.0]],
                        interp_9m_105=13.7, forward_var_1m_3m_atm=(0.12 ** 2 * 0.25 - 0.12 ** 2 / 12) / (0.25 - 1 / 12))

out = os.path.join(fx, "key-D2.json")
with open(out, "w") as f:
    json.dump(key, f, indent=1, default=float)
print("wrote", out)
print("fit", key["fit"], "\nneg raw", key["raw_butterflies"]["negative_calls"], "mass", key["mass"], "\nkink zero at", key["kink"]["zero_at"], "\ntails", key["record"]["tails"], "\nhull 15.1", key["hull_15_1"])
