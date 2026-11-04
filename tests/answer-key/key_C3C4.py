"""Answer key for chapters C3 (Black–Scholes in detail) and C4 (Greeks I). numpy + scipy. -> key-C3C4.json
Run with: python3 -I tests/answer-key/key_C3C4.py
Sources: Hull OFOD 5e ch. 12 (Ex. 12.7, §12.11), ch. 14 (§14.1, Tables 14.1–14.4, App. 14A); Wilmott ch. 5, 7;
Natenberg ch. 4, 6; the NSE NIFTY chain screenshot of 23 Oct 2026 (transcribed in key_C1C2.py, IV columns
transcribed here); research/r1/C3.md §6, research/r1/C4.md §6; storyboards C3.md, C4.md.

The running example of both chapters is the real row: NIFTY 22,600 call 249.15 / put 249.60, forward 22,603
(C1's median implied forward), 11 days to the Tue 3 Nov 2026 expiry, discounting at 6.5 %. Greeks are in the
forward (Black-76) form: V = e^{-rT}[F N(d1) - K N(d2)], d1 = (ln(F/K) + ½σ²T)/(σ√T).
"""
import json, math, os
import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq

key = {}
SQ2PI = math.sqrt(2 * math.pi)


def b76(F, K, r, s, T, call=True):
    st = s * math.sqrt(T)
    d1 = (math.log(F / K) + 0.5 * st * st) / st
    d2 = d1 - st
    D = math.exp(-r * T)
    if call:
        return D * (F * norm.cdf(d1) - K * norm.cdf(d2))
    return D * (K * norm.cdf(-d2) - F * norm.cdf(-d1))


def b76_greeks(F, K, r, s, T, call=True):
    st = s * math.sqrt(T)
    d1 = (math.log(F / K) + 0.5 * st * st) / st
    d2 = d1 - st
    D = math.exp(-r * T)
    V = b76(F, K, r, s, T, call)
    delta = D * norm.cdf(d1) if call else -D * norm.cdf(-d1)
    gamma = D * norm.pdf(d1) / (F * st)
    vega = D * F * math.sqrt(T) * norm.pdf(d1)
    theta = -D * F * norm.pdf(d1) * s / (2 * math.sqrt(T)) + r * V  # dV/dt per year (t = calendar time)
    rho = -T * V
    return dict(price=V, d1=d1, d2=d2, Nd1=float(norm.cdf(d1)), Nd2=float(norm.cdf(d2)), delta=delta, gamma=gamma,
                vega=vega, vega_per_pt=vega / 100, theta_yr=theta, theta_day=theta / 365, rho=rho, rho_per_pt=rho / 100,
                pde_lhs=theta + 0.5 * s * s * F * F * gamma, pde_rhs=r * V)


def bs(S, K, r, s, T, call=True, q=0.0):
    """Spot form with a continuous yield q (q = 0 is Hull's eq. 12.20)."""
    st = s * math.sqrt(T)
    d1 = (math.log(S / K) + (r - q + 0.5 * s * s) * T) / st
    d2 = d1 - st
    if call:
        return S * math.exp(-q * T) * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)
    return K * math.exp(-r * T) * norm.cdf(-d2) - S * math.exp(-q * T) * norm.cdf(-d1)


def bs_greeks(S, K, r, s, T, call=True):
    st = s * math.sqrt(T)
    d1 = (math.log(S / K) + (r + 0.5 * s * s) * T) / st
    d2 = d1 - st
    V = bs(S, K, r, s, T, call)
    delta = norm.cdf(d1) if call else norm.cdf(d1) - 1
    gamma = norm.pdf(d1) / (S * st)
    vega = S * math.sqrt(T) * norm.pdf(d1)
    if call:
        theta = -S * norm.pdf(d1) * s / (2 * math.sqrt(T)) - r * K * math.exp(-r * T) * norm.cdf(d2)
        rho = K * T * math.exp(-r * T) * norm.cdf(d2)
    else:
        theta = -S * norm.pdf(d1) * s / (2 * math.sqrt(T)) + r * K * math.exp(-r * T) * norm.cdf(-d2)
        rho = -K * T * math.exp(-r * T) * norm.cdf(-d2)
    return dict(price=V, d1=d1, d2=d2, delta=delta, gamma=gamma, vega=vega, theta_yr=theta, theta_day=theta / 365, rho=rho,
                pde_lhs=theta + r * S * delta + 0.5 * s * s * S * S * gamma, pde_rhs=r * V)


def iv_b76(price, F, K, r, T, call=True):
    return float(brentq(lambda s: b76(F, K, r, s, T, call) - price, 1e-4, 5.0, xtol=1e-12))


def iv_bs(price, S, K, r, T, call=True):
    return float(brentq(lambda s: bs(S, K, r, s, T, call) - price, 1e-4, 5.0, xtol=1e-12))


def newton_path(price, F, K, r, T, s0, call=True, n=6):
    out = [s0]
    s = s0
    for _ in range(n):
        g = b76_greeks(F, K, r, s, T, call)
        s = s - (g["price"] - price) / g["vega"]
        out.append(s)
    return out


def bisection_path(price, F, K, r, T, lo, hi, call=True, n=8):
    out = []
    for _ in range(n):
        m = 0.5 * (lo + hi)
        p = b76(F, K, r, m, T, call)
        out.append(dict(sigma=m, price=p))
        if p < price:
            lo = m
        else:
            hi = m
    return out


# ------------------------------------------------------------------ the real row (C1's chain)
here = os.path.dirname(os.path.abspath(__file__))
c1 = json.load(open(os.path.join(here, "..", "..", "apps", "web", "src", "engine", "__fixtures__", "key-C1C2.json")))["nse"]
strikes, calls, puts = c1["strikes"], c1["calls"], c1["puts"]
civ_nse = [13.11, 12.84, 13.12, 13.37, 13.61, 13.69, 13.54, 13.66, 13.89, 13.89, 14.05, 13.89, 14.23, 13.95, 14.19, 14.06, 14.21]
piv_nse = [18.28, 18.21, 17.94, 18.09, 17.84, 17.95, 17.82, 18.06, 17.66, 17.91, 18.07, 18.57, 18.41, 18.65, 18.40, 18.89, 18.76]
F, K, r, T, lot = 22603.0, 22600.0, 0.065, 11 / 365, 65
row = dict(F=F, K=K, r=r, T=T, days=11, lot=lot, call=249.15, put=249.60, expiry="2026-11-03", spot_recovered=22600.0)
key["row"] = row

# C3 F0/F4: implied vol of the row and the dial's ruler
siv = iv_b76(249.15, F, K, r, T)
g = b76_greeks(F, K, r, siv, T)
key["atm"] = dict(iv=siv, **g, discount=math.exp(-r * T), F_Nd1=F * g["Nd1"], K_Nd2=K * g["Nd2"], undiscounted=F * g["Nd1"] - K * g["Nd2"],
                  price_vs_sigma={str(s): b76(F, K, r, s, T) for s in [0.05, 0.10, 0.15, 0.16, 0.20, 0.25, 0.30, 0.40]},
                  rupees_per_vol_pt=(b76(F, K, r, 0.20, T) - b76(F, K, r, 0.10, T)) / 10,
                  share_above_16=float(norm.cdf((math.log(F / K) - 0.5 * 0.16 ** 2 * T) / (0.16 * math.sqrt(T)))),
                  share_above_30=float(norm.cdf((math.log(F / K) - 0.5 * 0.30 ** 2 * T) / (0.30 * math.sqrt(T)))),
                  sigma_to_zero=math.exp(-r * T) * max(F - K, 0.0), put_iv=iv_b76(249.60, F, K, r, T, call=False))

# C3 F1: the cloud — 2,000 equally likely futures (quantiles of the lognormal centred on the forward)
n = 2000
ps = (np.arange(n) + 0.5) / n
z = norm.ppf(ps)
cloud = F * np.exp(-0.5 * siv * siv * T + siv * math.sqrt(T) * z)
lit = cloud > K
key["cloud"] = dict(n=n, sigma=siv, mean=float(cloud.mean()), share_lit=float(lit.mean()),
                    avg_lit_payoff=float((cloud[lit] - K).mean()), price=float(math.exp(-r * T) * np.maximum(cloud - K, 0).mean()),
                    price_exact=g["price"], first5=[float(x) for x in cloud[:5]], last5=[float(x) for x in cloud[-5:]],
                    one_sd_band=[F * math.exp(-siv * math.sqrt(T)), F * math.exp(siv * math.sqrt(T))])

# C3 F4: rounds and the full strip from the market forward
rounds = [(22250, True), (22500, True), (22600, True), (22800, True), (23050, True), (22600, False)]
key["rounds"] = []
for k_, is_call in rounds:
    i = strikes.index(k_)
    p = calls[i] if is_call else puts[i]
    key["rounds"].append(dict(K=k_, kind="call" if is_call else "put", price=p, iv=iv_b76(p, F, k_, r, T, is_call)))
key["strip"] = dict(strikes=strikes, call_iv=[iv_b76(calls[i], F, strikes[i], r, T) for i in range(17)],
                    put_iv=[iv_b76(puts[i], F, strikes[i], r, T, False) for i in range(17)])
key["newton"] = dict(start=0.30, path=newton_path(249.15, F, K, r, T, 0.30), vega_at_start=b76_greeks(F, K, r, 0.30, T)["vega"])
# Newton from 30 % on every row: steps to 1e-6
steps = []
for i in range(17):
    for is_call, p in [(True, calls[i]), (False, puts[i])]:
        path = newton_path(p, F, strikes[i], r, T, 0.30, is_call, n=10)
        target = iv_b76(p, F, strikes[i], r, T, is_call)
        steps.append(next(j for j, s in enumerate(path) if abs(s - target) < 1e-6))
key["newton"]["max_steps_all_rows"] = max(steps)
key["bisection"] = bisection_path(249.15, F, K, r, T, 0.10, 0.30)

# C3 F5: NSE's own IV column decoded — spot Black–Scholes with S = 22,600, r = 10 %, T = 11 days
S_nse, r_nse = 22600.0, 0.10
repro_c = [bs(S_nse, strikes[i], r_nse, civ_nse[i] / 100, T, True) for i in range(17)]
repro_p = [bs(S_nse, strikes[i], r_nse, piv_nse[i] / 100, T, False) for i in range(17)]
rms = math.sqrt(sum((a - b) ** 2 for a, b in zip(repro_c + repro_p, calls + puts)) / 34)
key["nse_iv"] = dict(call_iv_printed=civ_nse, put_iv_printed=piv_nse, S=S_nse, r=r_nse, T=T, reproduced_calls=repro_c, reproduced_puts=repro_p,
                     rms=rms, nse_forward=S_nse * math.exp(r_nse * T),
                     fed_forward={str(Ff): dict(call_iv=iv_b76(249.15, Ff, K, r, T), put_iv=iv_b76(249.60, Ff, K, r, T, False))
                                  for Ff in [22550, 22600, 22603, 22650, 22668, 22700]})
# the forward at which call IV = put IV at 22,600
key["nse_iv"]["forward_where_equal"] = float(brentq(lambda Ff: iv_b76(249.15, Ff, K, r, T) - iv_b76(249.60, Ff, K, r, T, False), 22500, 22700))

# ------------------------------------------------------------------ Hull checks (C3 collapsed panel, C4 tests)
key["hull_12_7"] = dict(S=42, K=40, r=0.10, sigma=0.20, T=0.5, **{k: v for k, v in bs_greeks(42, 40, 0.10, 0.20, 0.5).items()},
                        put=bs(42, 40, 0.10, 0.20, 0.5, False), Ke_rT=40 * math.exp(-0.05))
key["hull_12_11"] = dict(c=1.875, S=21, K=20, r=0.10, T=0.25, iv=iv_bs(1.875, 21, 20, 0.10, 0.25),
                         at_20=bs(21, 20, 0.10, 0.20, 0.25), at_30=bs(21, 20, 0.10, 0.30, 0.25), at_25=bs(21, 20, 0.10, 0.25, 0.25))
key["brenndoerfer"] = dict(iv=iv_bs(5.50, 100, 105, 0.05, 0.5), atm_25=bs(100, 100, 0.05, 0.25, 0.5))
key["hull_14_1"] = dict(S=49, K=50, r=0.05, sigma=0.20, T=20 / 52, **bs_greeks(49, 50, 0.05, 0.20, 20 / 52), shares=100000)
key["riskhub"] = dict(**bs_greeks(100, 100, 0.05, 0.20, 1.0))
g100 = key["riskhub"]
key["riskhub"]["one_day"] = dict(dS=2, dt=1 / 365, delta_term=g100["delta"] * 2, gamma_term=0.5 * g100["gamma"] * 4, theta_term=g100["theta_yr"] / 365,
                                 taylor=g100["delta"] * 2 + 0.5 * g100["gamma"] * 4 + g100["theta_yr"] / 365,
                                 exact=bs(102, 100, 0.05, 0.20, 1 - 1 / 365) - g100["price"])
key["hull_tables"] = dict(stop_loss=dict(dt_weeks=[5, 4, 2, 1, 0.5, 0.25], performance=[1.02, 0.93, 0.82, 0.77, 0.76, 0.76]),
                          delta_hedge=dict(dt_weeks=[5, 4, 2, 1, 0.5, 0.25], performance=[0.43, 0.39, 0.26, 0.19, 0.14, 0.09]),
                          cost_itm_path=263300, cost_otm_path=256600, premium=300000, value=240000)

# ------------------------------------------------------------------ C4: the risk line and the surface on the real row
pos = -100 * lot
key["risk_line"] = dict(units=pos, premium=-pos * g["price"], delta_units=pos * g["delta"], gamma_per_100=pos * 0.5 * g["gamma"] * 100 ** 2,
                        theta_day=pos * g["theta_day"], vega_per_pt=pos * g["vega_per_pt"], rho_per_pt=pos * g["rho_per_pt"],
                        gamma_per_lot_per_100=g["gamma"] * lot * 100)
days_list = [11, 8, 5, 3, 1, 0.25, 1 / 24]
key["ridge"] = {str(d): b76_greeks(F, K, r, siv, d / 365) for d in days_list}
key["slices"] = {}
for d in [11, 5, 1, 1 / 24]:
    key["slices"][str(d)] = {str(Fx): dict(price=b76(Fx, K, r, siv, d / 365), delta=b76_greeks(Fx, K, r, siv, d / 365)["delta"],
                                            gamma=b76_greeks(Fx, K, r, siv, d / 365)["gamma"]) for Fx in [22300, 22500, 22600, 22700, 22900]}
# the real day: Fri 23 Oct 22,600 -> Mon 26 Oct 22,753.2 (closes from nifty50-long.json), three calendar days
dS, dd = 22753.2 - 22600.0, 3
exact = b76(F + dS, K, r, siv, (11 - dd) / 365) - g["price"]
key["real_day"] = dict(from_close=22600.0, to_close=22753.2, dS=dS, days=dd, delta_term=g["delta"] * dS, gamma_term=0.5 * g["gamma"] * dS * dS,
                       theta_term=g["theta_day"] * dd, taylor=g["delta"] * dS + 0.5 * g["gamma"] * dS * dS + g["theta_day"] * dd, exact=exact,
                       position_pnl=pos * exact)
key["break_even"] = dict(move=math.sqrt(-2 * g["theta_day"] / g["gamma"]), one_sigma_day=siv * F * math.sqrt(1 / 365),
                         bars={str(m): dict(bend=0.5 * g["gamma"] * m * m, clock=g["theta_day"]) for m in [0, 50, 100, 187, 250, 300]})
key["vega_inflate"] = {str(s): b76(F, K, r, s, T) for s in [0.10, siv, 0.25]}
# identities for the tests
rng = np.random.default_rng(7)
key["pde_random"] = []
for _ in range(50):
    Fx, Tx, sx = float(rng.uniform(18000, 27000)), float(rng.uniform(0.01, 1.5)), float(rng.uniform(0.08, 0.5))
    gc = b76_greeks(Fx, K, r, sx, Tx, True)
    gp = b76_greeks(Fx, K, r, sx, Tx, False)
    key["pde_random"].append(dict(F=Fx, T=Tx, sigma=sx, call=gc, put=gp))

out = os.path.join(here, "..", "..", "apps", "web", "src", "engine", "__fixtures__", "key-C3C4.json")
with open(out, "w") as f:
    json.dump(key, f, indent=1, default=float)
print("wrote", out)
print("atm iv", siv, "rms nse", rms, "forward where equal", key["nse_iv"]["forward_where_equal"], "real day", key["real_day"]["exact"],
      "newton max steps", key["newton"]["max_steps_all_rows"])
