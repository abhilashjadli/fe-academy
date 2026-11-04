"""Answer key for chapter D1 (delta hedging and P&L attribution). numpy + scipy. -> key-D1.json
Run with: python3 -I tests/answer-key/key_D1.py
Sources: Hull OFOD 5e ch. 14 (§14.1, Tables 14.2–14.4); Wilmott ch. 12 (eq. 12.1) and ch. 47 (§47.4); Natenberg ch. 5 (Fig. 5-1);
Kamal–Derman 1999; research/r1/D1.md §6; storyboards/D1.md.

Running example: Raj short 100 lots (6,500 units) of the NIFTY 22,600 call sold at 249.15 on Fri 23 Oct 2026 (forward 22,603,
σ_sold = 15.853 %, r = 6.5 %, expiry Tue 3 Nov), hedged once a day on the real closes in apps/web/src/data/nifty50-long.json.
Forward basis: F = close × 22,603/22,600 (the carry ratio of the screenshot day, held constant). Days left counted in calendar days.
"""
import json, math, os
import numpy as np
from scipy.stats import norm

here = os.path.dirname(os.path.abspath(__file__))
key = {}

K, R, SIG, LOT, UNITS = 22600.0, 0.065, 0.15852787426376824, 65, -6500
CARRY = 22603.0 / 22600.0
EXPIRY = np.datetime64("2026-11-03")


def greeks(F, T, s=SIG):
    if T <= 0:
        V = max(F - K, 0.0)
        return dict(price=V, delta=1.0 if F > K else 0.0, gamma=0.0, theta_yr=0.0)
    D = math.exp(-R * T)
    st = s * math.sqrt(T)
    d1 = (math.log(F / K) + 0.5 * st * st) / st
    d2 = d1 - st
    V = D * (F * norm.cdf(d1) - K * norm.cdf(d2))
    return dict(price=V, delta=D * norm.cdf(d1), gamma=D * norm.pdf(d1) / (F * st), theta_yr=-D * F * norm.pdf(d1) * s / (2 * math.sqrt(T)) + R * V)


# ------------------------------------------------------------------ the real week (as far as the data goes)
data = json.load(open(os.path.join(here, "..", "..", "apps", "web", "src", "data", "nifty50-long.json")))
rows = [r for r in data["rows"] if "2026-10-23" <= r["d"] <= "2026-11-03"]
ledger = []
hedge_units = 0.0
cash = 0.0
prev = None
for r in rows:
    d = np.datetime64(r["d"])
    days_left = int((EXPIRY - d) / np.timedelta64(1, "D"))
    F = r["c"] * CARRY
    g = greeks(F, days_left / 365)
    row = dict(date=r["d"], close=r["c"], F=F, days_left=days_left, value=g["price"], delta=g["delta"], gamma=g["gamma"], theta_day=g["theta_yr"] / 365)
    target = -UNITS * g["delta"]  # index units to hold long against the short calls
    if prev is None:
        cash = -UNITS * g["price"]  # premium in; the hedge is index futures: no cash outlay, daily variation margin
        row.update(trade_units=target, trade_lots=target / LOT, narration="sold 100 lots; bought the slope in index", dS=0.0, dt_days=0,
                   clock=0.0, bend=0.0, slope=0.0, exact_day=0.0, pnl_day=0.0)
    else:
        dS = F - prev["F"]
        dt_days = prev["days_left"] - days_left
        cash *= math.exp(R * dt_days / 365)
        # mark-to-market before re-hedging
        pnl_day = UNITS * (g["price"] - prev["value"]) + hedge_units * dS
        trade = target - hedge_units
        cash += hedge_units * dS  # variation margin on the hedge held since yesterday
        row.update(trade_units=trade, trade_lots=trade / LOT, dS=dS, dt_days=dt_days,
                   slope=UNITS * prev["delta"] * dS + hedge_units * dS,  # ≈ 0 by construction
                   bend=UNITS * 0.5 * prev["gamma"] * dS * dS, clock=UNITS * prev["theta_day"] * dt_days,
                   exact_day=pnl_day, pnl_day=pnl_day,
                   narration=("rose" if dS > 0 else "fell") + f" {abs(dS):.0f}; slope {prev['delta']:.3f} → {g['delta']:.3f}; " + ("bought" if trade > 0 else "sold") + f" {abs(trade) / LOT:.1f} lots after the move")
    hedge_units = target
    row.update(hedge_units=hedge_units, cash=cash, book=cash + UNITS * g["price"])
    ledger.append(row)
    prev = row
key["ledger"] = ledger
key["ledger_totals"] = dict(clock=sum(x["clock"] for x in ledger), bend=sum(x["bend"] for x in ledger), exact=sum(x["exact_day"] for x in ledger),
                           days_covered=len(ledger) - 1, last_date=ledger[-1]["date"], complete=ledger[-1]["days_left"] == 0)
moves = [math.log(rows[i]["c"] / rows[i - 1]["c"]) for i in range(1, len(rows))]
key["realised"] = dict(moves=moves, realised_vol=math.sqrt(sum(m * m for m in moves) / len(moves) * 252), sold=SIG)
g0 = greeks(22603.0, 11 / 365)
key["position"] = dict(units=UNITS, premium=-UNITS * g0["price"], delta_units=-UNITS * g0["delta"], theta_day=UNITS * g0["theta_yr"] / 365,
                       bend_per_100=UNITS * 0.5 * g0["gamma"] * 1e4, break_even_move=math.sqrt(-2 * g0["theta_yr"] / 365 / g0["gamma"]))

# ------------------------------------------------------------------ Figure 2: the referee's card — daily edge vs realised wobble
key["edge_vs_realised"] = {str(s): dict(per_day=UNITS * 0.5 * g0["gamma"] * 22603.0 ** 2 * (s * s - SIG * SIG) / 365) for s in [0.05, 0.10, 0.1585, 0.20, 0.25, 0.30]}


# ------------------------------------------------------------------ Figure 3: the week run many times
def simulate(n_paths, steps_per_day, sigma_real, days=11, seed=11, F0=22603.0, mu=0.0, units=UNITS, sold=SIG, trading_days=None):
    """Hedge a short call once per `1/steps_per_day` days on a lognormal path; return final P&L per path (rupees, whole position)."""
    rng = np.random.default_rng(seed)
    n_steps = int(round(days * steps_per_day))
    dt = days / 365 / n_steps
    F = np.full(n_paths, F0)
    T = days / 365
    g = greeks_vec(F, T, sold)
    hedge = -units * g["delta"]
    cash = -units * g["price"]  # premium; the hedge is futures (variation margin), so it needs no cash
    for i in range(n_steps):
        z = rng.standard_normal(n_paths)
        F_new = F * np.exp((mu - 0.5 * sigma_real ** 2) * dt + sigma_real * math.sqrt(dt) * z)
        T -= dt
        cash = cash * math.exp(R * dt) + hedge * (F_new - F)
        F = F_new
        g = greeks_vec(F, max(T, 0.0), sold)
        hedge = -units * g["delta"] if T > 1e-12 else -units * (F > K)
    payoff = np.maximum(F - K, 0.0)
    return cash + units * payoff


def greeks_vec(F, T, s):
    if T <= 1e-12:
        return dict(price=np.maximum(F - K, 0.0), delta=(F > K).astype(float))
    D = math.exp(-R * T)
    st = s * math.sqrt(T)
    d1 = (np.log(F / K) + 0.5 * st * st) / st
    d2 = d1 - st
    return dict(price=D * (F * norm.cdf(d1) - K * norm.cdf(d2)), delta=D * norm.cdf(d1))


premium = -UNITS * g0["price"]
hist = {}
for label, spd in [("expiry_only", 1 / 11), ("daily", 1.0), ("four_a_day", 4.0)]:
    out = {}
    for s in [0.10, SIG, 0.20, 0.25]:
        p = simulate(4000, spd, s)
        out[f"{s:.4f}"] = dict(mean=float(p.mean()), sd=float(p.std(ddof=1)), mean_over_premium=float(p.mean() / premium), sd_over_premium=float(p.std(ddof=1) / premium),
                               se=float(p.std(ddof=1) / math.sqrt(len(p))), q05=float(np.quantile(p, 0.05)), q95=float(np.quantile(p, 0.95)))
    hist[label] = out
key["histogram"] = hist
key["histogram_notes"] = dict(premium=premium, paths=4000, seed=11,
                              wilmott_marker={f"{s:.4f}": UNITS * (greeks(22603.0, 11 / 365, s)["price"] - g0["price"]) for s in [0.10, 0.20, 0.25]})

# ------------------------------------------------------------------ Hull's bank, Table 14.4 (sd of hedging cost ÷ price) — tests
S0h, Kh, rh, sh, Th, muh = 49.0, 50.0, 0.05, 0.20, 20 / 52, 0.13


def hull_perf(dt_weeks, n_paths=20000, seed=3):
    rng = np.random.default_rng(seed)
    n_steps = int(round(20 / dt_weeks))
    dt = Th / n_steps
    S = np.full(n_paths, S0h)
    T = Th
    st = sh * math.sqrt(T)
    d1 = (np.log(S / Kh) + (rh + 0.5 * sh * sh) * T) / st
    delta = norm.cdf(d1)
    cost = delta * S
    shares = delta
    for i in range(n_steps):
        S = S * np.exp((muh - 0.5 * sh * sh) * dt + sh * math.sqrt(dt) * rng.standard_normal(n_paths))
        T -= dt
        cost = cost * math.exp(rh * dt)
        if T > 1e-12:
            st = sh * math.sqrt(T)
            d1 = (np.log(S / Kh) + (rh + 0.5 * sh * sh) * T) / st
            delta = norm.cdf(d1)
        else:
            delta = (S > Kh).astype(float)
        cost += (delta - shares) * S
        shares = delta
    cost -= Kh * shares  # strike received when exercised
    pv = cost * math.exp(-rh * Th)
    return float(pv.std(ddof=1) / (bs_price(S0h, Kh, rh, sh, Th) * 1.0)), float(pv.mean())


def bs_price(S, Kx, r, s, T):
    st = s * math.sqrt(T)
    d1 = (math.log(S / Kx) + (r + 0.5 * s * s) * T) / st
    return S * norm.cdf(d1) - Kx * math.exp(-r * T) * norm.cdf(d1 - st)


key["hull"] = dict(price=bs_price(S0h, Kh, rh, sh, Th), value_100k=1e5 * bs_price(S0h, Kh, rh, sh, Th), delta0=float(norm.cdf((math.log(S0h / Kh) + (rh + 0.5 * sh * sh) * Th) / (sh * math.sqrt(Th)))),
                   table_14_4_book=dict(dt_weeks=[5, 4, 2, 1, 0.5, 0.25], perf=[0.43, 0.39, 0.26, 0.19, 0.14, 0.09]),
                   table_14_4_sim={str(w): dict(perf=hull_perf(w)[0], mean_cost=hull_perf(w)[1]) for w in [5, 4, 2, 1, 0.5, 0.25]},
                   cost_itm=263300, cost_otm=256600, premium=300000)
# Kamal–Derman rule of thumb on the 1-year ATM case
vega = 100 * math.sqrt(1.0) * norm.pdf((math.log(1) + (0.05 + 0.02) * 1) / 0.2)
key["rule_of_thumb"] = dict(vega=vega, sd_formula={str(n): math.sqrt(math.pi / 4) * vega * 0.20 / math.sqrt(n) for n in [4, 12, 52, 252, 1000]},
                            sd_sim_note="research/r1/D1.md §6: 3.04 / 1.84 / 0.91 / 0.42 / 0.21")
key["natenberg_ledger"] = dict(parts=[-138.83, 205.27, -4.99, 1.36], total=-138.83 + 205.27 - 4.99 + 1.36, model=63.00)

out = os.path.join(here, "..", "..", "apps", "web", "src", "engine", "__fixtures__", "key-D1.json")
with open(out, "w") as f:
    json.dump(key, f, indent=1, default=float)
print("wrote", out)
print("ledger rows", len(ledger), "complete", key["ledger_totals"]["complete"], "clock", round(key["ledger_totals"]["clock"]), "bend", round(key["ledger_totals"]["bend"]),
      "exact", round(key["ledger_totals"]["exact"]), "realised", round(100 * key["realised"]["realised_vol"], 1))
print("hist daily @sold", hist["daily"][f"{SIG:.4f}"], "\nhull sim", key["hull"]["table_14_4_sim"])
