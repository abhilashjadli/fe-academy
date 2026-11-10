"""Answer key for chapter C5 (Greeks II: vanna, charm, volga, speed, zomma, color, veta). numpy + scipy. -> key-C5.json
Run with: python3 -I tests/answer-key/key_C5.py
Sources: Wilmott ch. 7 (speed); Natenberg ch. 6 p. 106–110 (delta vs vol / time, the "40 deltas short" story); Haug's
formula collection for the cross-partials (each verified here against central finite differences of the price);
research/r1/C5.md §6; storyboards/C5.md. Chapter convention: forward form (Black-76) on the real NSE chain, charm in
CALENDAR time (an out-of-the-money call's delta decays → charm negative). Textbook rows are spot Black–Scholes with q = 0.
"""
import json, math, os
import numpy as np
from scipy.stats import norm

here = os.path.dirname(os.path.abspath(__file__))
fx = os.path.join(here, "..", "..", "apps", "web", "src", "engine", "__fixtures__")
c3 = json.load(open(os.path.join(fx, "key-C3C4.json")))
key = {}


# ------------------------------------------------------------------ spot form, q = 0 (textbook rows)
def bs_all(S, K, r, s, T, call=True):
    st = s * math.sqrt(T)
    d1 = (math.log(S / K) + (r + 0.5 * s * s) * T) / st
    d2 = d1 - st
    nd1 = norm.pdf(d1)
    D = math.exp(-r * T)
    price = S * norm.cdf(d1) - K * D * norm.cdf(d2) if call else K * D * norm.cdf(-d2) - S * norm.cdf(-d1)
    delta = norm.cdf(d1) if call else norm.cdf(d1) - 1
    gamma = nd1 / (S * st)
    vega = S * math.sqrt(T) * nd1
    theta = -S * nd1 * s / (2 * math.sqrt(T)) - (r * K * D * norm.cdf(d2) if call else -r * K * D * norm.cdf(-d2))
    vanna = -nd1 * d2 / s
    volga = vega * d1 * d2 / s
    # charm, calendar time: dDelta/dt = -dDelta/dtau
    charm = -nd1 * (2 * r * T - d2 * st) / (2 * T * st)  # dDelta/dt (calendar) = -dDelta/dtau, q = 0; same for a put
    speed = -(gamma / S) * (1 + d1 / st)
    zomma = gamma * (d1 * d2 - 1) / s
    color = nd1 / (2 * S * T * st) * (1 + (2 * r * T - d2 * st) * d1 / st)  # dGamma/dt (calendar) = -dGamma/dtau
    veta = -S * nd1 * math.sqrt(T) * (r * d1 / st - (1 + d1 * d2) / (2 * T))  # dVega/dtau (q = 0): positive here — vega grows with time left
    return dict(d1=d1, d2=d2, price=price, delta=delta, gamma=gamma, vega=vega, theta_yr=theta, vanna=vanna, volga=volga, charm=charm, speed=speed, zomma=zomma, color=color, veta=veta)


def price_spot(S, K, r, s, T, call=True):
    return bs_all(S, K, r, s, T, call)["price"]


def fd_check(S, K, r, s, T):
    """central finite differences of the price (and of delta/gamma/vega) for every higher Greek"""
    h, hs, ht = 1e-3 * S, 1e-4, 1e-5
    delta = lambda S_, s_, T_: bs_all(S_, K, r, s_, T_)["delta"]
    gamma = lambda S_, s_, T_: bs_all(S_, K, r, s_, T_)["gamma"]
    vega = lambda S_, s_, T_: bs_all(S_, K, r, s_, T_)["vega"]
    return dict(
        vanna_dDelta_dsigma=(delta(S, s + hs, T) - delta(S, s - hs, T)) / (2 * hs),
        vanna_dVega_dS=(vega(S + h, s, T) - vega(S - h, s, T)) / (2 * h),
        volga=(vega(S, s + hs, T) - vega(S, s - hs, T)) / (2 * hs),
        charm_calendar=-(delta(S, s, T + ht) - delta(S, s, T - ht)) / (2 * ht),
        speed=(gamma(S + h, s, T) - gamma(S - h, s, T)) / (2 * h),
        zomma=(gamma(S, s + hs, T) - gamma(S, s - hs, T)) / (2 * hs),
        color_calendar=-(gamma(S, s, T + ht) - gamma(S, s, T - ht)) / (2 * ht),
        veta_dtau=(vega(S, s, T + ht) - vega(S, s, T - ht)) / (2 * ht),
    )


rows = {
    "riskhub": dict(S=100, K=100, r=0.05, sigma=0.20, T=1.0),
    "hull_49": dict(S=49, K=50, r=0.05, sigma=0.20, T=20 / 52),
}
key["textbook"] = {}
for name, p in rows.items():
    g = bs_all(p["S"], p["K"], p["r"], p["sigma"], p["T"])
    f = fd_check(p["S"], p["K"], p["r"], p["sigma"], p["T"])
    for a, b in [("vanna", "vanna_dDelta_dsigma"), ("vanna", "vanna_dVega_dS"), ("volga", "volga"), ("charm", "charm_calendar"), ("speed", "speed"), ("zomma", "zomma"), ("color", "color_calendar"), ("veta", "veta_dtau")]:
        assert abs(g[a] - f[b]) < 1e-5 * max(1, abs(g[a])), (name, a, g[a], f[b])
    key["textbook"][name] = dict(inputs=p, **g, fd=f)
# note §6 printed values
assert abs(key["textbook"]["riskhub"]["vanna"] + 0.2814) < 5e-4
assert abs(key["textbook"]["riskhub"]["volga"] - 9.850) < 5e-3
assert abs(key["textbook"]["riskhub"]["charm"] + 0.06567) < 1e-4
assert abs(key["textbook"]["riskhub"]["speed"] + 0.000516) < 1e-5
assert abs(key["textbook"]["riskhub"]["zomma"] + 0.08889) < 1e-4
assert abs(key["textbook"]["riskhub"]["color"] - 0.01053) < 1e-4  # calendar time: ATM gamma GROWS as expiry nears (the note quoted the ∂/∂τ sign)
assert abs(key["textbook"]["riskhub"]["veta"] - 16.464) < 5e-3
assert abs(key["textbook"]["hull_49"]["vanna"] - 0.1391) < 5e-4
assert abs(key["textbook"]["hull_49"]["volga"] + 0.2291) < 5e-4
assert abs(key["textbook"]["hull_49"]["charm"] + 0.1968) < 5e-4

# sign-map rows (note §6): S = 100, r = 5 %, σ = 20 %
key["sign_rows"] = dict(
    T1={str(K): dict(vanna=bs_all(100, K, 0.05, 0.2, 1.0)["vanna"], volga=bs_all(100, K, 0.05, 0.2, 1.0)["volga"], charm=bs_all(100, K, 0.05, 0.2, 1.0)["charm"]) for K in [90, 100, 105, 110, 120]},
    T005={str(K): dict(vanna=bs_all(100, K, 0.05, 0.2, 0.05)["vanna"], charm=bs_all(100, K, 0.05, 0.2, 0.05)["charm"]) for K in [95, 100, 105]},
)
assert key["sign_rows"]["T1"]["105"]["volga"] < 0 < key["sign_rows"]["T1"]["100"]["volga"]
# Natenberg's hook: K = 110, 60 days, r = 0: delta 0.25 at σ = 0.318 → 0.317 at 0.418
key["natenberg"] = dict(delta_low=bs_all(100, 110, 0.0, 0.318, 60 / 365)["delta"], delta_high=bs_all(100, 110, 0.0, 0.418, 60 / 365)["delta"])


# ------------------------------------------------------------------ forward form (the chapter): Black-76, each strike at its chain-implied vol
def b76_all(F, K, r, s, T, call=True):
    st = s * math.sqrt(T)
    d1 = (math.log(F / K) + 0.5 * st * st) / st
    d2 = d1 - st
    nd1 = norm.pdf(d1)
    D = math.exp(-r * T)
    price = D * (F * norm.cdf(d1) - K * norm.cdf(d2)) if call else D * (K * norm.cdf(-d2) - F * norm.cdf(-d1))
    delta = D * norm.cdf(d1) if call else -D * norm.cdf(-d1)
    gamma = D * nd1 / (F * st)
    vega = D * F * math.sqrt(T) * nd1
    vanna = -D * nd1 * d2 / s
    volga = vega * d1 * d2 / s
    # charm (calendar): d/dt of D N(d1); d1 depends on t through tau = T - t
    # dDelta/dtau = -r D N(d1) + D nd1 * d(d1)/dtau ; d(d1)/dtau = (0.5 s^2 tau - ln(F/K)... ) use: d(d1)/dtau = -d2/(2 tau) [forward form]
    dd1_dtau = -d2 / (2 * T)
    charm = -(-r * D * norm.cdf(d1) + D * nd1 * dd1_dtau) if call else -(r * D * norm.cdf(-d1) + D * nd1 * dd1_dtau)
    speed = -(gamma / F) * (1 + d1 / st)
    zomma = gamma * (d1 * d2 - 1) / s
    return dict(d1=d1, d2=d2, price=price, delta=delta, gamma=gamma, vega=vega, vanna=vanna, volga=volga, charm=charm, speed=speed, zomma=zomma)


F, r, T, lot = 22603.0, 0.065, 11 / 365, 65
strip = dict(zip(c3["strip"]["strikes"], c3["strip"]["call_iv"]))
# finite-difference check of the forward-form charm and vanna
for K in [22250, 22600, 23050]:
    s = strip[K]
    g = b76_all(F, K, r, s, T)
    ht, hs = 1e-6, 1e-5
    fd_charm = -(b76_all(F, K, r, s, T + ht)["delta"] - b76_all(F, K, r, s, T - ht)["delta"]) / (2 * ht)
    fd_vanna = (b76_all(F, K, r, s + hs, T)["delta"] - b76_all(F, K, r, s - hs, T)["delta"]) / (2 * hs)
    assert abs(g["charm"] - fd_charm) < 1e-4 * max(1, abs(fd_charm)), (K, g["charm"], fd_charm)
    assert abs(g["vanna"] - fd_vanna) < 1e-6 * max(1, abs(fd_vanna))

rounds = []
for K, lots, vol_bump, days_later, label in [(23050, 4, 0.10, None, "round1_otm_vol_up"), (22250, 4, 0.10, None, "round2_itm_vol_up"), (23050, 4, None, 7, "round3_otm_week")]:
    s = strip[K]
    g0 = b76_all(F, K, r, s, T)
    g1 = b76_all(F, K, r, s + vol_bump, T) if vol_bump else b76_all(F, K, r, s, (11 - days_later) / 365)
    units = lots * lot
    rounds.append(dict(label=label, K=K, iv=s, lots=lots, units=units, delta0=g0["delta"], delta1=g1["delta"], hedge_units=units * g0["delta"],
                       book_delta_after=-units * g1["delta"] + units * g0["delta"], vanna=g0["vanna"], charm=g0["charm"], volga=g0["volga"]))
key["rounds"] = rounds
key["atm_control"] = dict(K=22600, delta0=b76_all(F, 22600, r, strip[22600], T)["delta"], delta_vol_up=b76_all(F, 22600, r, strip[22600] + 0.10, T)["delta"],
                          delta_week=b76_all(F, 22600, r, strip[22600], 4 / 365)["delta"], vanna=b76_all(F, 22600, r, strip[22600], T)["vanna"])
# curves for the side panels: delta vs vol and delta vs days for the three strikes
vols = [round(0.05 + 0.01 * i, 2) for i in range(36)]
days = [1, 2, 3, 4, 5, 7, 9, 11, 15, 20, 30, 45, 60]
key["curves"] = {str(K): dict(delta_vs_vol=[b76_all(F, K, r, v, T)["delta"] for v in vols], delta_vs_days=[b76_all(F, K, r, strip[K], d / 365)["delta"] for d in days]) for K in [22250, 22600, 23050]}
key["curves"]["vols"] = vols
key["curves"]["days"] = days
# the poster planes: strike × days at the row's ATM vol
sig = strip[22600]
Ks = list(range(21800, 23401, 50))
Ds = [1, 2, 3, 5, 7, 11, 15, 20, 30, 45, 60]
planes = {g: [[b76_all(F, K, r, sig, d / 365)[g] for K in Ks] for d in Ds] for g in ["vanna", "charm", "volga", "speed", "zomma"]}
planes["color"] = []
for d in Ds:
    row = []
    for K in Ks:
        ht = 1e-6
        row.append(-(b76_all(F, K, r, sig, d / 365 + ht)["gamma"] - b76_all(F, K, r, sig, d / 365 - ht)["gamma"]) / (2 * ht))
    planes["color"].append(row)
key["planes"] = dict(strikes=Ks, days=Ds, sigma=sig, **planes)
key["plane_values_11d"] = {g: {str(K): b76_all(F, K, r, sig, T)[g] for K in [22250, 22600, 23050]} for g in ["vanna", "charm", "volga"]}
# the desk grid: Raj short 6,500 units of the 22,600 call hedged at Friday's slope
g0 = b76_all(F, 22600, r, sig, T)
units = -6500
hedge = -units * g0["delta"]
grid = []
for s in [0.12, sig, 0.20]:
    row = []
    for m in [-0.02, -0.01, 0.0, 0.01, 0.02]:
        Fx = F * (1 + m)
        v = b76_all(Fx, 22600, r, s, T)["price"]
        row.append(units * (v - g0["price"]) + hedge * (Fx - F))
    grid.append(row)
key["grid"] = dict(vols=[0.12, sig, 0.20], moves=[-0.02, -0.01, 0.0, 0.01, 0.02], pnl=grid, units=units, hedge_units=hedge)
assert abs(grid[1][2]) < 1e-6

out = os.path.join(fx, "key-C5.json")
json.dump(key, open(out, "w"), indent=1, default=float)
print("wrote", out)
for rd in rounds:
    print(rd["label"], round(rd["delta0"], 3), "->", round(rd["delta1"], 3), "book", round(rd["book_delta_after"], 1))
print("grid lakh", [[round(x / 1e5, 2) for x in row] for row in grid])
print("11d plane values", {g: {K: round(v, 3) for K, v in d.items()} for g, d in key["plane_values_11d"].items()})
