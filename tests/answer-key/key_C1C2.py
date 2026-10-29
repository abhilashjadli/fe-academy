"""Answer key for chapters C1 (options mechanics, parity) and C2 (binomial → Black–Scholes). numpy + scipy. -> key-C1C2.json
Run with: python3 -I tests/answer-key/key_C1C2.py
Sources: Hull (Options, Futures and Other Derivatives) chapters 1, 8, 9, 10, 12; Natenberg; the NSE NIFTY chain of 2026-10-23
(apps/web/public/artefacts/nse-nifty-chain-2026-10-23.png); research/r1/C1.md §6 and research/r1/C2.md §6.
"""
import json, math, os
import numpy as np
from scipy.stats import norm

key = {}


def bs(S, K, r, sigma, T):
    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    call = S * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)
    put = K * math.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
    return float(call), float(put)


# ------------------------------------------------------------------ C1: payoffs and strategies (Hull ch. 1, 9; Natenberg)
levels = [55, 60, 62, 65, 69, 70, 75, 77, 80, 90]
key["payoffs"] = dict(
    levels=levels,
    microsoft_call=dict(K=60, premium=5, profit=[max(s - 60, 0) - 5 for s in levels]),  # Hull p. 7: +10 at 75; at 62 exercise −3 vs −5
    ibm_put=dict(K=90, premium=7, profit=[max(90 - s, 0) - 7 for s in levels]),  # Hull p. 8: +8 at 75
    straddle=dict(K=70, c=4, p=3, profit=[max(s - 70, 0) + max(70 - s, 0) - 7 for s in levels], breakevens=[63, 77]),  # Hull p. 194
    bull_spread=dict(K1=30, K2=35, c1=3, c2=1, cost=2, levels=[25, 30, 32, 33, 35, 40],
                     profit=[max(s - 30, 0) - max(s - 35, 0) - 2 for s in [25, 30, 32, 33, 35, 40]]),  # Hull Ex. 9.1 p. 188
    covered_call=dict(S0=100, K=105, c=4, levels=[80, 100, 105, 110, 130],
                      profit=[(s - 100) - max(s - 105, 0) + 4 for s in [80, 100, 105, 110, 130]]),
    protective_put=dict(S0=100, K=95, p=3, levels=[80, 95, 100, 110, 130],
                        profit=[(s - 100) + max(95 - s, 0) - 3 for s in [80, 95, 100, 110, 130]]),
    forward_as_call_minus_put=dict(K=100, levels=[80, 90, 100, 110, 120], payoff=[s - 100 for s in [80, 90, 100, 110, 120]]),
    natenberg_position=dict(legs=[(1, 95, 5.50), (-3, 105, 1.15)], debit=2.05, at95=-2.05, at105=7.95, slope_above_105=-2),  # Natenberg pp. 24–25
)

# ------------------------------------------------------------------ C1: intrinsic / time value, moneyness (Natenberg pp. 6–7)
key["intrinsic"] = [
    dict(S=105, K=100, price=8.0, kind="call", intrinsic=5.0, time=3.0, moneyness="ITM"),
    dict(S=100, K=100, price=4.0, kind="call", intrinsic=0.0, time=4.0, moneyness="ATM"),
    dict(S=95, K=100, price=1.5, kind="call", intrinsic=0.0, time=1.5, moneyness="OTM"),
    dict(S=95, K=100, price=7.0, kind="put", intrinsic=5.0, time=2.0, moneyness="ITM"),
    dict(S=22600, K=22250, price=476.30, kind="call", intrinsic=350.0, time=126.30, moneyness="ITM"),
]

# ------------------------------------------------------------------ C1: bounds (Hull §8.3) and the arbitrage tables
def bounds(S, K, r, T):
    pvK = K * math.exp(-r * T)
    return dict(S=S, K=K, r=r, T=T, pvK=pvK, call_lower=max(S - pvK, 0), call_upper=S, put_lower=max(pvK - S, 0), put_upper_eu=pvK, put_upper_am=K)

key["bounds"] = dict(
    call_floor=dict(**bounds(20, 18, 0.10, 1.0), call_price=3.0, grows_to=17 * math.exp(0.10),  # Hull p. 172: 3.71; 18.79; profits 0.79 / 1.79
                    profit_above=17 * math.exp(0.10) - 18, profit_at_17=17 * math.exp(0.10) - 17, S_T_low=17),
    ex81=bounds(51, 50, 0.12, 0.5),  # 3.91
    put_floor=dict(**bounds(37, 40, 0.05, 0.5), put_price=1.0, borrowed=38.0, repay=38 * math.exp(0.025),  # Hull p. 173: 2.01; 38.96; 1.04 / 3.04
                   profit_exercise=40 - 38 * math.exp(0.025), profit_at_42=42 - 38 * math.exp(0.025), S_T_high=42),
    ex82=bounds(38, 40, 0.10, 0.25),  # 1.01
)
# American bounds, Example 8.3 p. 175: S − K ≤ C − P ≤ S − Ke^{−rT}
S, K, C, r, T = 19, 20, 1.5, 0.10, 5 / 12
key["bounds"]["ex83"] = dict(S=S, K=K, C=C, r=r, T=T, cp_lo=S - K, cp_hi=S - K * math.exp(-r * T), P_lo=C - (S - K * math.exp(-r * T)), P_hi=C - (S - K))

# ------------------------------------------------------------------ C1: put–call parity and the arbitrage ledger (Hull pp. 174–175)
def parity_ledger(S, K, r, T, c, p):
    left = c + K * math.exp(-r * T)
    right = p + S
    if right > left:  # put side rich: buy call, short put, short stock
        cash_now = -c + p + S
        grown = cash_now * math.exp(r * T)
        profit = grown - K
        side = "sell_put_side"
    else:  # call side rich: short call, buy put, buy stock, borrow the cost
        cash_now = c - p - S
        grown = cash_now * math.exp(r * T)
        profit = K + grown
        side = "sell_call_side"
    return dict(S=S, K=K, r=r, T=T, c=c, p=p, left=left, right=right, cash_now=cash_now, grown=grown, profit=profit, side=side,
                mispricing=abs(right - left) * math.exp(r * T))

key["parity"] = dict(
    hull_a=parity_ledger(31, 30, 0.10, 0.25, 3.0, 2.25),  # 32.26 vs 33.25 → 30.25 e^{0.025} = 31.02 → 1.02
    hull_b=parity_ledger(31, 30, 0.10, 0.25, 3.0, 1.0),  # 32.00 → 29 e^{0.025} = 29.73 → 0.27
    quantt=dict(S=100, K=105, r=0.045, T=0.5, c=5.24, pvK=105 * math.exp(-0.0225), p=5.24 + 105 * math.exp(-0.0225) - 100),  # p = 7.90
    fig81=dict(S=50, K=50, r=0.05, sigma=0.3, T=1, call=bs(50, 50, 0.05, 0.3, 1)[0], put=bs(50, 50, 0.05, 0.3, 1)[1]),  # 7.116 / 4.677
    natenberg_conversion=dict(F=102, K=100, c=5.10, p=2.85, synthetic=5.10 - 2.85 + 100, lock=5.10 - 2.85 + 100 - 102),  # 0.25
)
# Natenberg chain p. 13: C − P vs F − K at F = 99
nat_K = [85, 90, 95, 100, 105, 110, 115]
nat_cp = [13.95, 8.90, 3.95, -1.00, -5.95, -10.90, -15.90]
key["parity"]["natenberg_chain"] = dict(F=99, K=nat_K, c_minus_p=nat_cp, residual=[cp - (99 - k) for cp, k in zip(nat_cp, nat_K)], max_residual=0.10)

# Natenberg expected-value model pp. 40–41
prices = [80, 90, 100, 110, 120]
ev_flat = sum(0.2 * max(s - 100, 0) for s in prices)
ev_peak = sum(w * max(s - 100, 0) for w, s in zip([0.1, 0.2, 0.4, 0.2, 0.1], prices))
key["expected_value"] = dict(prices=prices, flat=dict(ev=ev_flat, pv=ev_flat / 1.02), peaked=dict(ev=ev_peak, pv=ev_peak / 1.02))

# ------------------------------------------------------------------ C1: the NSE NIFTY chain, 23 Oct 2026 (strikes 22,250 → 23,050; LTP columns)
strikes = list(range(22250, 23051, 50))
calls = [476.30, 434.40, 400.60, 368.55, 338.35, 307.75, 275.45, 249.15, 226.55, 202.00, 182.00, 158.55, 144.60, 123.00, 110.55, 94.40, 83.45]
puts = [122.45, 136.20, 148.45, 167.75, 182.60, 204.00, 223.20, 249.60, 267.25, 296.60, 325.95, 361.95, 388.90, 423.25, 451.60, 492.00, 524.50]
implied = [c - p + k for c, p, k in zip(calls, puts, strikes)]
F = 22603.0
pred_puts = [c - (F - k) for c, k in zip(calls, strikes)]
pick = [22250, 22500, 22600, 22700, 22800, 23000, 23050]
key["nse"] = dict(
    strikes=strikes, calls=calls, puts=puts, lot=65, implied_forward=implied, median=float(np.median(implied)),
    implied_min=min(implied), implied_max=max(implied), F=F,
    predicted_puts=pred_puts, max_gap=max(abs(a - b) for a, b in zip(pred_puts, puts)),
    pick=dict(strikes=pick, predicted=[pred_puts[strikes.index(k)] for k in pick], real=[puts[strikes.index(k)] for k in pick]),
    atm=dict(K=22600, call=249.15, put=249.60, breakeven=22600 + 249.15, per_lot=249.15 * 65),  # 22,849.15; ₹16,194.75
    break_it=dict(K=22800, call=158.55, put_typed=340.0, per_unit=158.55 - 340.0 + (22800 - F), per_lot=(158.55 - 340.0 + (22800 - F)) * 65,
                  check_levels=[22000, 22600, 23200]),  # +15.55; ₹1,010.75
)
# conversion ledger at the three index levels: long put, short call, long forward at F → K − F + (C − P) whatever S_T
for s in (22000, 22600, 23200):
    assert abs((max(22800 - s, 0) - max(s - 22800, 0) + (s - F)) - (22800 - F)) < 1e-9

# ------------------------------------------------------------------ C2: Hull one-step (pp. 201–205)
S0, u, d, K, r, T = 20.0, 1.1, 0.9, 21.0, 0.12, 0.25
fu, fd = max(S0 * u - K, 0), max(S0 * d - K, 0)
delta = (fu - fd) / (S0 * u - S0 * d)
port = S0 * u * delta - fu
pv = port * math.exp(-r * T)
f = S0 * delta - pv
p = (math.exp(r * T) - d) / (u - d)
mu = 0.16
q = (math.exp(mu * T) - d) / (u - d)
exp_payoff_real = q * fu + (1 - q) * fd
implied_rate = math.log(exp_payoff_real / f) / T
key["one_step"] = dict(S0=S0, u=u, d=d, K=K, r=r, T=T, fu=fu, fd=fd, delta=delta, portfolio=port, pv=pv, f=f, p=p,
                       f_rn=math.exp(-r * T) * (p * fu + (1 - p) * fd), mu=mu, q=q, expected_payoff_real=exp_payoff_real,
                       implied_rate=implied_rate, sell_at=0.70, arbitrage=0.70 - f,
                       E_ST_under_p=p * S0 * u + (1 - p) * S0 * d, S0_grown=S0 * math.exp(r * T))
# price does not depend on belief: naive "discount the real expectation at r" vs the replication price
beliefs = [0.1, 0.3, 0.5, 0.6523, 0.7041, 0.9]
key["one_step"]["beliefs"] = beliefs
key["one_step"]["naive_prices"] = [math.exp(-r * T) * (b * fu + (1 - b) * fd) for b in beliefs]
# range toggle 23/17 (B5 F1): Δ = 1/3, f = 1.168
u2, d2 = 1.15, 0.85
p2 = (math.exp(r * T) - d2) / (u2 - d2)
key["one_step"]["range_23_17"] = dict(u=u2, d=d2, delta=(2 - 0) / (23 - 17), p=p2, f=math.exp(-r * T) * p2 * 2)
# Wilmott one day (pp. 263–274)
dtw = 1 / 250
pw = 0.5 + 0.1 * math.sqrt(dtw) / (2 * 0.01 * math.sqrt(250))  # u = 1 + σ√δt with σ√δt = 0.01: p′ = ½ + r√δt/(2σ)
sig_w = 0.01 / math.sqrt(dtw)
pw = 0.5 + 0.1 * math.sqrt(dtw) / (2 * sig_w)
key["one_step"]["wilmott"] = dict(S=100, up=101, down=99, K=100, r=0.1, dt=dtw, p_prime=pw, value=(pw * 1) / (1 + 0.1 * dtw),
                                  r0=dict(delta=0.5, p=0.5, value=0.5, real_expected=0.6))

# ------------------------------------------------------------------ C2: two-step trees (pp. 206–209)
def tree(S0, K, u, d, r, dt, n, put=False, american=False):
    p = (math.exp(r * dt) - d) / (u - d)
    disc = math.exp(-r * dt)
    nodes = []
    for i in range(n, -1, -1):
        S = [S0 * u ** (i - j) * d ** j for j in range(i + 1)]
        if i == n:
            V = [max(K - s, 0) if put else max(s - K, 0) for s in S]
        else:
            V = [disc * (p * nodes[0][1][j] + (1 - p) * nodes[0][1][j + 1]) for j in range(i + 1)]
            if american:
                V = [max(v, (K - s) if put else (s - K)) for v, s in zip(V, S)]
        nodes.insert(0, (S, V))
    deltas = [[(nodes[i + 1][1][j] - nodes[i + 1][1][j + 1]) / (nodes[i + 1][0][j] - nodes[i + 1][0][j + 1]) for j in range(i + 1)] for i in range(n)]
    return dict(p=p, S=[x[0] for x in nodes], V=[x[1] for x in nodes], delta=deltas, price=nodes[0][1][0])

key["two_step"] = dict(
    call=tree(20, 21, 1.1, 0.9, 0.12, 0.25, 2),  # 3.2/0/0 → B 2.0257, A 1.2823; Δ 0.5064; 0.7273 / 0
    put=tree(50, 52, 1.2, 0.8, 0.05, 1.0, 2, put=True),  # p 0.6282; B 1.4147; C 9.4636; root 4.1923
    american_put=tree(50, 52, 1.2, 0.8, 0.05, 1.0, 2, put=True, american=True),  # C = 12; root 5.0894
    drwong=dict(call=tree(50, 51, 1.06, 0.95, 0.05, 0.25, 2)["price"], put=tree(50, 51, 1.06, 0.95, 0.05, 0.25, 2, put=True)["price"],
                american_put=tree(50, 51, 1.06, 0.95, 0.05, 0.25, 2, put=True, american=True)["price"], p=tree(50, 51, 1.06, 0.95, 0.05, 0.25, 2)["p"]),
)
# Hull's printed values (he rounds p to four places) — allow 1e-3
key["two_step"]["hull_printed"] = dict(call_B=2.0257, call_A=1.2823, put_B=1.4147, put_C=9.4636, put_root=4.1923, american_root=5.0894)
# final-node probabilities p², 2p(1−p), (1−p)² for the two-step call (B6 "three doors")
pc = key["two_step"]["call"]["p"]
key["two_step"]["call"]["terminal_probs"] = [pc ** 2, 2 * pc * (1 - pc), (1 - pc) ** 2]

# ------------------------------------------------------------------ C2: CRR and convergence (pp. 211–213; Problem 10.19; Leisen–Reimer)
def crr(S, K, r, sigma, T, n, put=False, american=False):
    dt = T / n
    u = math.exp(sigma * math.sqrt(dt))
    d = 1 / u
    p = (math.exp(r * dt) - d) / (u - d)
    disc = math.exp(-r * dt)
    ST = S * u ** np.arange(n, -1, -1) * d ** np.arange(0, n + 1)
    V = np.maximum(K - ST, 0) if put else np.maximum(ST - K, 0)
    for i in range(n, 0, -1):
        V = disc * (p * V[:-1] + (1 - p) * V[1:])
        if american:
            Si = S * u ** np.arange(i - 1, -1, -1) * d ** np.arange(0, i)
            V = np.maximum(V, (K - Si) if put else (Si - K))
    return float(V[0]), float(p), u, d

key["crr_params"] = dict(sigma=0.2, dt=0.25, u=math.exp(0.2 * 0.5), d=math.exp(-0.2 * 0.5))  # 1.1052 / 0.9048
ns = [1, 2, 3, 4, 5, 10, 11, 20, 21, 50, 51, 100, 101, 200, 500, 1000, 2000]
c_bs, p_bs = bs(100, 100, 0.05, 0.2, 1)
key["convergence"] = dict(S=100, K=100, r=0.05, sigma=0.2, T=1, bs_call=c_bs, bs_put=p_bs, n=ns, call=[crr(100, 100, 0.05, 0.2, 1, n)[0] for n in ns],
                          put=[crr(100, 100, 0.05, 0.2, 1, n, put=True)[0] for n in ns], p_at_100=crr(100, 100, 0.05, 0.2, 1, 100)[1])
key["convergence"]["avg_100_101"] = (key["convergence"]["call"][ns.index(100)] + key["convergence"]["call"][ns.index(101)]) / 2
key["convergence"]["avg_10_11"] = (key["convergence"]["call"][ns.index(10)] + key["convergence"]["call"][ns.index(11)]) / 2
key["convergence"]["avg_50_51"] = (key["convergence"]["call"][ns.index(50)] + key["convergence"]["call"][ns.index(51)]) / 2
ns2 = [5, 6, 7, 8, 10, 11, 25, 26, 50, 51, 100, 101, 500]
key["off_node"] = dict(S=100, K=110, r=0.05, sigma=0.3, T=1, bs_call=bs(100, 110, 0.05, 0.3, 1)[0], n=ns2, call=[crr(100, 110, 0.05, 0.3, 1, n)[0] for n in ns2])
key["problem_10_19"] = dict(S=40, K=40, r=0.04, sigma=0.3, T=0.5, two_step=dict(u=math.exp(0.3 * 0.5), d=math.exp(-0.3 * 0.5), p=crr(40, 40, 0.04, 0.3, 0.5, 2)[1],
                            call=crr(40, 40, 0.04, 0.3, 0.5, 2)[0]), n=[5, 50, 100, 500], call=[crr(40, 40, 0.04, 0.3, 0.5, n)[0] for n in (5, 50, 100, 500)],
                            bs_call=bs(40, 40, 0.04, 0.3, 0.5)[0])
key["leisen_reimer"] = dict(S=100, r=0.07, sigma=0.3, T=0.5, n=25, K100=crr(100, 100, 0.07, 0.3, 0.5, 25)[0], K110=crr(100, 110, 0.07, 0.3, 0.5, 25)[0],
                            true100=bs(100, 100, 0.07, 0.3, 0.5)[0], true110=bs(100, 110, 0.07, 0.3, 0.5)[0])
key["american_put"] = dict(S=100, K=100, r=0.05, sigma=0.2, T=1, n=[6, 100, 1000], price=[crr(100, 100, 0.05, 0.2, 1, n, True, True)[0] for n in (6, 100, 1000)],
                           european_100=crr(100, 100, 0.05, 0.2, 1, 100, True)[0], riskhub_100=6.0824)
key["ryanoconnell"] = dict(S=100, K=105, r=0.05, sigma=0.2, T=0.5, n=2, u=math.exp(0.2 * 0.5), d=math.exp(-0.2 * 0.5), p=crr(100, 105, 0.05, 0.2, 0.5, 2)[1],
                           call=crr(100, 105, 0.05, 0.2, 0.5, 2)[0], put=crr(100, 105, 0.05, 0.2, 0.5, 2, True)[0],
                           american_put=crr(100, 105, 0.05, 0.2, 0.5, 2, True, True)[0])
key["hull_bs"] = dict(S=42, K=40, r=0.10, sigma=0.2, T=0.5, call=bs(42, 40, 0.1, 0.2, 0.5)[0], put=bs(42, 40, 0.1, 0.2, 0.5)[1])

# hedge meter (C2 F1): holding h shares and B cash today, worth h·S_u + B e^{rT} / h·S_d + B e^{rT} at expiry
h, B = delta, -pv
key["hedge_meter"] = dict(h=h, cash=B, up=h * S0 * u + B * math.exp(r * T), down=h * S0 * d + B * math.exp(r * T), cost=h * S0 + B,
                          wrong=dict(h=0.5, cash=-pv, up=0.5 * 22 - pv * math.exp(r * T), down=0.5 * 18 - pv * math.exp(r * T)))

out = os.path.join(os.path.dirname(__file__), "..", "..", "apps", "web", "src", "engine", "__fixtures__", "key-C1C2.json")
json.dump(key, open(out, "w"))
print("wrote", os.path.normpath(out))
print("bounds", key["bounds"]["call_floor"]["call_lower"], key["bounds"]["ex81"]["call_lower"], key["bounds"]["put_floor"]["put_lower"], key["bounds"]["ex82"]["put_lower"])
print("parity", key["parity"]["hull_a"]["left"], key["parity"]["hull_a"]["right"], key["parity"]["hull_a"]["profit"], key["parity"]["hull_b"]["profit"])
print("nse median", key["nse"]["median"], "max gap", key["nse"]["max_gap"], "break", key["nse"]["break_it"])
print("one step", delta, port, pv, f, p, q, implied_rate)
print("two step", key["two_step"]["call"]["V"], key["two_step"]["put"]["price"], key["two_step"]["american_put"]["price"])
print("conv", dict(zip(ns, [round(v, 4) for v in key["convergence"]["call"]])), "avg", key["convergence"]["avg_100_101"])
print("amer", key["american_put"]["price"])
