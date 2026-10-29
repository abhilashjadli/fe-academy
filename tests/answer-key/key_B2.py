"""Answer key for chapter B2 (martingales, stopping times, gambler's ruin). numpy only. -> key-B2.json
Run with: python3 -I tests/answer-key/key_B2.py

Reference values: Shreve Figs 8.2.2-8.2.3 (discounted tree, non-stopping time rho), Shreve 2.3.4-7 (conditional forecasts),
gambler's ruin K/N and K(N-K); Monte Carlo (fixed seeds) for the quit-when-ahead and doubling strategies; research/r1/B2.md §6.
"""
import json, os, math
import numpy as np

key = {}
rng = np.random.default_rng(20261029)

# 1. Shreve's discounted tree: S0=4, u=2, d=1/2, r=1/4 -> p~ = 1/2; discounted values 4; 6.40, 1.60; 10.24, 2.56, 0.64
S0, u, d, r = 4.0, 2.0, 0.5, 0.25
pt = (1 + r - d) / (u - d)
levels = []
for n in range(3):
    levels.append([S0 * u ** j * d ** (n - j) / (1 + r) ** n for j in range(n, -1, -1)])  # j heads, most heads first
for n in range(2):
    for i in range(len(levels[n])):
        assert abs(levels[n][i] - (pt * levels[n + 1][i] + (1 - pt) * levels[n + 1][i + 1])) < 1e-12
# non-stopping time rho (Fig 8.2.3): rho = 0 if w1 = H; rho = 1 on TH; rho = 2 on TT  ->  E M_{2 ^ rho} = 1/4 (4 + 4 + 1.60 + 0.64) = 2.56
rho_values = {"HH": levels[0][0], "HT": levels[0][0], "TH": levels[1][1], "TT": levels[2][2]}
key["tree"] = dict(S0=S0, u=u, d=d, r=r, p_tilde=pt, levels=levels, rho_stopped_mean=float(np.mean(list(rho_values.values()))),
                   rho_stopped_values=rho_values, undiscounted=[[S0 * u ** j * d ** (n - j) for j in range(n, -1, -1)] for n in range(3)])

# 2. Diary forecasts of S_3 with p = q = 1/2 (undiscounted): E[S_3 | first n tosses]
p = 0.5
S3 = [S0 * u ** j * d ** (3 - j) for j in range(3, -1, -1)]  # HHH, HHT.., per heads count 3,2,1,0
def forecast(n):
    out = []
    for h in range(n, -1, -1):  # h heads among the first n
        m = 3 - n
        e = sum(math.comb(m, k) * p ** k * (1 - p) ** (m - k) * S0 * u ** (h + k) * d ** (3 - h - k) for k in range(m + 1))
        out.append(e)
    return out
key["diary"] = dict(p=p, S3_by_heads=S3, forecasts=[forecast(n) for n in range(4)], growth=1 + p * (u - 1) - (1 - p) * (1 - d))
assert abs(key["diary"]["forecasts"][0][0] - 4 * 1.25 ** 3) < 1e-12
# Exercise 2.2 measures: P~ = 1/4 each; P = (4/9, 2/9, 2/9, 1/9) with p = 2/3
key["measures"] = dict(p_tilde=[0.25] * 4, p=[(2 / 3) ** 2, 2 / 9, 2 / 9, 1 / 9])

# 3. Gambler's ruin from K to N: P(reach N) = K/N, E[T] = K(N-K)
key["ruin"] = [dict(K=K, N=N, p_win=K / N, duration=K * (N - K)) for K, N in [(1, 10), (50, 100), (20, 25), (5, 10)]]

# 4. Fair coin, unit bets, T tosses: spread sqrt(T)
key["spread"] = dict(T=200, sd=math.sqrt(200))

# 5. Quit when up by 1 (fair +-1, start 0), horizon T: P(reach +1 within T) ~ 1 - 1/sqrt(pi T / 2); mean 0; mean loss given miss
def quit_up_by_1(T, runs, rng, chunk=20_000):
    hit = 0; final_sum = 0.0; miss_sum = 0.0; miss_n = 0; worst = 0; final_all = []
    for start in range(0, runs, chunk):
        m = min(chunk, runs - start)
        steps = rng.choice(np.array([-1, 1], dtype=np.int8), (m, T))
        W = np.cumsum(steps, axis=1, dtype=np.int32)
        reached = (W >= 1).any(axis=1)
        final = np.where(reached, 1, W[:, -1])
        hit += int(reached.sum()); final_sum += float(final.sum())
        miss_sum += float(final[~reached].sum()); miss_n += int((~reached).sum())
        worst = min(worst, int(final.min()))
        final_all.append(final)
    final_all = np.concatenate(final_all)
    return dict(T=T, runs=runs, p_hit=hit / runs, p_hit_formula=1 - 1 / math.sqrt(math.pi * T / 2), mean=final_sum / runs,
                sd=float(final_all.std()), mean_loss_given_miss=miss_sum / max(miss_n, 1), worst=worst)
key["quit_up_1"] = [quit_up_by_1(100, 200_000, rng), quit_up_by_1(1000, 200_000, rng)]

# 6. Two-sided quit: up b or down a. P(hit +b first) = a / (a + b); mean 0. b = 5, a = 20.
def two_sided(a, b, runs, T, rng):
    steps = rng.choice(np.array([-1, 1], dtype=np.int8), (runs, T))
    W = np.cumsum(steps, axis=1, dtype=np.int32)
    up = np.argmax(W >= b, axis=1); up_any = (W >= b).any(axis=1); up = np.where(up_any, up, T + 1)
    dn = np.argmax(W <= -a, axis=1); dn_any = (W <= -a).any(axis=1); dn = np.where(dn_any, dn, T + 1)
    final = np.where(up < dn, b, np.where(dn < up, -a, W[:, -1]))
    unresolved = int((~up_any & ~dn_any).sum())
    return dict(a=a, b=b, runs=runs, T=T, p_up_first=float((up < dn).mean()), p_up_formula=a / (a + b), mean=float(final.mean()),
                duration_formula=a * b, mean_duration=float(np.minimum(np.minimum(up, dn), T).mean()), unresolved=unresolved)
key["two_sided"] = two_sided(20, 5, 100_000, 2000, rng)

# 7. Doubling (martingale system) with k doublings allowed: bankroll 2^k - 1; P(ruin per cycle) = 2^-k; mean profit per cycle 0 exactly.
def doubling(k, cycles, players, rng, p=0.5):
    bankroll = 2 ** k - 1
    # each cycle: geometric number of losses before first win; ruin if losses >= k
    losses = rng.geometric(p, (players, cycles)) - 1  # number of failures before the first success
    profit = np.where(losses >= k, -bankroll, 1)
    total = profit.sum(axis=1)
    return dict(k=k, bankroll=bankroll, cycles=cycles, players=players, p=p, p_ruin_cycle=(1 - p) ** k,
                mean_cycle_formula=(1 - (1 - p) ** k) * 1 - (1 - p) ** k * bankroll,
                p_at_least_one_ruin_formula=1 - (1 - (1 - p) ** k) ** cycles,
                mean=float(total.mean()), sd=float(total.std()), median=float(np.median(total)), p_ahead=float((total > 0).mean()),
                p_at_least_one_ruin=float((losses >= k).any(axis=1).mean()))
key["doubling_k5"] = doubling(5, 100, 200_000, rng)
key["doubling_k10"] = dict(k=10, bankroll=1023, cycles=700, p_at_least_one_streak=1 - (1 - 2 ** -10) ** 700)
# European roulette p = 18/37
pr = 18 / 37
key["roulette"] = dict(p=pr, unit_bet_mean_per_toss=2 * pr - 1, k10_mean_per_cycle=(1 - (1 - pr) ** 10) - (1 - pr) ** 10 * 1023,
                       k10_p_streak=(1 - pr) ** 10)

# 8. The meter: mean final wealth over n = 10,000 players, T = 200, for several bounded strategies (vectorised replays)
def meter_fixed(n, T, rng, stake=1):
    W = (rng.choice(np.array([-1, 1], dtype=np.int8), (n, T)) * stake).sum(axis=1)
    return dict(name="fixedBet", mean=float(W.mean()), sd=float(W.std()), se=float(W.std() / math.sqrt(n)))
key["meter"] = dict(n=10_000, T=200, strategies=[meter_fixed(10_000, 200, rng)])
# the peek cheat: betting with knowledge of the next toss wins +1 per peeked toss
key["peek"] = dict(mean_gain_per_toss=1.0, tosses=200, mean_gain=200.0)

out = os.path.join(os.path.dirname(__file__), "..", "..", "apps", "web", "src", "engine", "__fixtures__", "key-B2.json")
json.dump(key, open(out, "w"))
print("wrote", os.path.normpath(out))
print("tree", key["tree"]["levels"], "rho", key["tree"]["rho_stopped_mean"])
print("diary", key["diary"]["forecasts"])
print("quit_up_1", [(q["T"], round(q["p_hit"], 4), round(q["p_hit_formula"], 4), round(q["mean"], 3), round(q["mean_loss_given_miss"], 1), q["worst"]) for q in key["quit_up_1"]])
print("two_sided", key["two_sided"])
print("doubling k=5", {k: v for k, v in key["doubling_k5"].items() if k in ("mean", "median", "p_ahead", "p_at_least_one_ruin", "p_at_least_one_ruin_formula")})
print("roulette", key["roulette"], "k10", key["doubling_k10"])
print("meter", key["meter"])
