"""Answer key for chapter B1 (random walks, Markov chains, Poisson). numpy only. -> key-B1.json
Run with: python3 -I tests/answer-key/key_B1.py

Reference values: QuantEcon "Markov Chains I" (two-state and Hamilton chains), Shreve §3.2 (walk), Shreve §11.2 (Poisson);
research/r1/B1.md §6.
"""
import json, os, math
import numpy as np

key = {}
rng = np.random.default_rng(20261029)


def stationary(P):
    """Solve psi P = psi, sum psi = 1 by linear algebra (works for periodic chains too)."""
    P = np.asarray(P, dtype=float)
    k = P.shape[0]
    A = np.vstack([(P.T - np.eye(k))[:-1], np.ones(k)])
    b = np.zeros(k); b[-1] = 1.0
    return np.linalg.solve(A, b)


def n_step(P, psi0, n):
    return np.asarray(psi0, dtype=float) @ np.linalg.matrix_power(np.asarray(P, dtype=float), n)


def simulate(P, n, start, rng):
    P = np.asarray(P, dtype=float)
    cum = np.cumsum(P, axis=1)
    out = np.empty(n + 1, dtype=np.int64); out[0] = start
    u = rng.random(n)
    x = start
    for t in range(n):
        x = int(np.searchsorted(cum[x], u[t], side="right"))
        x = min(x, P.shape[0] - 1)
        out[t + 1] = x
    return out


def run_lengths(states):
    s = np.asarray(states)
    change = np.flatnonzero(np.diff(s) != 0)
    starts = np.concatenate([[0], change + 1])
    ends = np.concatenate([change + 1, [len(s)]])
    return ends - starts


def fit(states, k, laplace=0.0):
    s = np.asarray(states)
    C = np.zeros((k, k))
    np.add.at(C, (s[:-1], s[1:]), 1)
    P = (C + laplace) / (C + laplace).sum(axis=1, keepdims=True)
    return C, P


# 1. QuantEcon two-state chain
P_qe = [[0.4, 0.6], [0.2, 0.8]]
psi = [n_step(P_qe, [1, 0], t).tolist() for t in range(0, 6)]
ev = sorted(np.linalg.eigvals(np.array(P_qe)).real, reverse=True)
walk = simulate(P_qe, 1_000_000, 1, rng)  # a start drawn from psi_0 = (0.1, 0.9) would almost surely be 1
key["qe"] = dict(P=P_qe, stationary=stationary(P_qe).tolist(), psi_from_0=psi, eigenvalues=[float(v) for v in ev],
                 mc_steps=1_000_000, mc_frac_state0=float((walk == 0).mean()))

# 2. Sticky chain: psi_t(R) from R = 1/2 + 1/2 * 0.8^t
P_sticky = [[0.9, 0.1], [0.1, 0.9]]
ts = [1, 2, 3, 5, 10, 20]
key["sticky"] = dict(P=P_sticky, stationary=stationary(P_sticky).tolist(), t=ts,
                     psiR=[float(n_step(P_sticky, [0, 1], t)[1]) for t in ts],
                     psiR_closed=[0.5 + 0.5 * 0.8 ** t for t in ts],
                     mean_run_closed=1 / (1 - 0.9), coin_mean_run=2.0,
                     expected_holding=[1 / (1 - P_sticky[i][i]) for i in range(2)])
sticky_walk = simulate(P_sticky, 100_000, 0, rng)
coin_walk = (rng.random(100_001) < 0.5).astype(int)
key["sticky"]["mc_mean_run"] = float(run_lengths(sticky_walk).mean())
key["sticky"]["mc_coin_mean_run"] = float(run_lengths(coin_walk).mean())

# 3. Hamilton's business-cycle chain (QuantEcon)
P_h = [[0.971, 0.029, 0.0], [0.145, 0.778, 0.077], [0.0, 0.508, 0.492]]
evh = sorted(np.linalg.eigvals(np.array(P_h)).real, reverse=True)
key["hamilton"] = dict(P=P_h, stationary=stationary(P_h).tolist(), eigenvalues=[float(v) for v in evh],
                       P6_row0=np.linalg.matrix_power(np.array(P_h), 6)[0].tolist(),
                       psi_from_each_corner_t30=[n_step(P_h, e, 30).tolist() for e in np.eye(3)])

# 4. Periodic chain: never converges, time-average does
P_per = [[0.0, 1.0], [1.0, 0.0]]
key["periodic"] = dict(P=P_per, stationary=stationary(P_per).tolist(), psi_from_0=[n_step(P_per, [1, 0], t).tolist() for t in range(6)],
                       time_average_t1000=float(np.mean([n_step(P_per, [1, 0], t)[0] for t in range(1000)])))

# 5. Fitting a chain from a strip (three weather states, fixed short strip + a long simulated strip)
strip = [0, 0, 0, 1, 1, 0, 0, 2, 1, 1, 0, 0, 0, 0, 1, 2, 2, 1, 0, 0]
C, Pf = fit(strip, 3)
_, Pl = fit(strip, 3, laplace=1.0)
key["fit_small"] = dict(states=strip, counts=C.tolist(), P=Pf.tolist(), P_laplace1=Pl.tolist(),
                        mean_run=float(run_lengths(strip).mean()), n_runs=int(len(run_lengths(strip))))
P_w = [[0.7, 0.25, 0.05], [0.3, 0.5, 0.2], [0.1, 0.5, 0.4]]
long_strip = simulate(P_w, 200_000, 0, rng)
_, Pfl = fit(long_strip, 3)
key["fit_long"] = dict(P_true=P_w, P_fit=Pfl.tolist(), max_abs_err=float(np.abs(Pfl - np.array(P_w)).max()),
                       stationary=stationary(P_w).tolist(), mc_fraction=[float((long_strip == i).mean()) for i in range(3)])

# 6. Simple random walk (Shreve §3.2)
key["walk"] = dict(p_M10_eq_2=math.comb(10, 6) / 2 ** 10, p_M10_eq_0=math.comb(10, 5) / 2 ** 10,
                   sd_M100=10.0, sd_M400=20.0,
                   p_abs_M100_le_10=sum(math.comb(100, k) for k in range(45, 56)) / 2 ** 100,
                   shreve_3_2_11=math.comb(25, 13) / 2 ** 25, hull_sd_5y=math.sqrt(5))
# Memory toggle: P(repeat last step) = p; Var(M_t)/t -> (1 + (2p-1)) / (1 - (2p-1)) = 3 at p = 0.75. Measured ratio over 10,000 walkers.
def memory_walk(p, walkers, steps, rng):
    steps_arr = np.empty((walkers, steps), dtype=np.int8)
    steps_arr[:, 0] = rng.choice([-1, 1], walkers)
    u = rng.random((walkers, steps))
    for t in range(1, steps):
        flip = u[:, t] >= p
        steps_arr[:, t] = np.where(flip, -steps_arr[:, t - 1], steps_arr[:, t - 1])
    return np.cumsum(steps_arr, axis=1, dtype=np.int64)
M = memory_walk(0.75, 10_000, 400, rng)
M0 = np.cumsum(rng.choice([-1, 1], (10_000, 400)).astype(np.int64), axis=1)
key["memory"] = dict(p=0.75, ratio_formula=3.0,
                     mc_ratio={str(t): float((M[:, t - 1] ** 2).mean() / t) for t in (100, 200, 400)},
                     mc_ratio_no_memory={str(t): float((M0[:, t - 1] ** 2).mean() / t) for t in (100, 200, 400)})

# 7. Poisson at lambda = 6 per hour (Shreve §11.2)
lam = 6.0
pmf = [math.exp(-lam) * lam ** k / math.factorial(k) for k in range(13)]
key["poisson"] = dict(lam=lam, pmf_1h=pmf, cdf_1h=np.cumsum(pmf).tolist(),
                      p_none_10min=math.exp(-1), p_none_20min=math.exp(-2), p_none_30min=math.exp(-3),
                      p_at_least_2_in_10min=1 - 2 * math.exp(-1), mean_gap_min=60 / lam,
                      waiting_paradox_observed_gap_min=2 * 60 / lam, mean_wait_min=60 / lam, timetabled_wait_min=30 / lam)
# Monte Carlo: 10,000 simulated hours — fraction with exactly 6 arrivals; mean gap; mean wait of a random arrival over 1,000 drops
gaps = rng.exponential(1 / lam, 10_000 * 12)
times = np.cumsum(gaps)
times = times[times < 10_000]
counts = np.bincount(times.astype(int), minlength=10_000)
key["poisson"]["mc_hours"] = 10_000
key["poisson"]["mc_frac_exactly_6"] = float((counts == 6).mean())
key["poisson"]["mc_mean_gap_min"] = float(np.diff(times).mean() * 60)
drops = rng.random(1000) * 2.0  # two-hour line
ev = np.cumsum(rng.exponential(1 / lam, 60)); ev = ev[ev < 2.0]
idx = np.searchsorted(ev, drops)
waits = np.where(idx < len(ev), ev[np.minimum(idx, len(ev) - 1)] - drops, np.nan)
key["poisson"]["mc_mean_wait_min_single_timeline"] = float(np.nanmean(waits) * 60)
# many timelines: drop one inspector per fresh 2-hour timeline, 1,000 times (the figure's readout)
w = []
for _ in range(1000):
    ev = np.cumsum(rng.exponential(1 / lam, 60))
    d = rng.random() * 1.0
    w.append(ev[np.searchsorted(ev, d)] - d)
key["poisson"]["mc_mean_wait_min_1000_drops"] = float(np.mean(w) * 60)
key["poisson"]["superposition"] = dict(rates=[6, 4], combined=10)

out = os.path.join(os.path.dirname(__file__), "..", "..", "apps", "web", "src", "engine", "__fixtures__", "key-B1.json")
json.dump(key, open(out, "w"))
print("wrote", os.path.normpath(out))
print("qe stationary", key["qe"]["stationary"], "mc", key["qe"]["mc_frac_state0"])
print("sticky psiR", key["sticky"]["psiR"], "mc runs", key["sticky"]["mc_mean_run"], key["sticky"]["mc_coin_mean_run"])
print("hamilton", key["hamilton"]["stationary"], key["hamilton"]["eigenvalues"], key["hamilton"]["P6_row0"])
print("walk", key["walk"])
print("memory", key["memory"])
print("poisson pmf", [round(v, 4) for v in pmf], "mc6", key["poisson"]["mc_frac_exactly_6"], "gap", key["poisson"]["mc_mean_gap_min"],
      "wait", key["poisson"]["mc_mean_wait_min_1000_drops"])
