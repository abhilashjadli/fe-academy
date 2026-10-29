"""Answer key for chapters B5 (risk-neutral measure) and B6 (Feynman–Kac). numpy + scipy. -> key-B5B6.json
Run with: python3 -I tests/answer-key/key_B5B6.py
Sources: Hull pp. 201–209, 249; Shreve (5.2.4)–(5.2.5), Ex. 1.6.6, Thm 5.2.3, Thm 6.4.1/6.4.3; Wilmott pp. 171, 274, 278;
the riskhub change-of-measure blog; research/r1/B5.md §6 and research/r1/B6.md §6.
"""
import json, math, os
import numpy as np
from scipy.stats import norm

key = {}


def bs(S, K, r, sigma, T):
    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    return float(S * norm.cdf(d1) - K * math.exp(-r * T) * norm.cdf(d2)), float(K * math.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1))


# ------------------------------------------------------------------ B5: Hull's one-step tree and the finite Radon–Nikodym tilt
S0, u, d, K, r, T, mu = 20.0, 1.1, 0.9, 21.0, 0.12, 0.25, 0.16
fu, fd = 1.0, 0.0
p = (math.exp(r * T) - d) / (u - d)
q = (math.exp(mu * T) - d) / (u - d)
Zu, Zd = p / q, (1 - p) / (1 - q)
key["finite_tilt"] = dict(S0=S0, u=u, d=d, K=K, r=r, T=T, mu=mu, p=p, q=q, Z_up=Zu, Z_down=Zd, E_q_Z=q * Zu + (1 - q) * Zd,
                          f=math.exp(-r * T) * (p * fu + (1 - p) * fd), f_via_Z=math.exp(-r * T) * (q * Zu * fu + (1 - q) * Zd * fd),
                          delta=0.25, portfolio=4.5, pv=4.5 * math.exp(-r * T), implied_rate=math.log(q / (math.exp(-r * T) * p)) / T,
                          beliefs=[0.1, 0.3, 0.5, 0.7041, 0.9])
# range toggle 23/17
p2 = (math.exp(r * T) - 0.85) / 0.30
key["finite_tilt"]["range_23_17"] = dict(delta=1 / 3, p=p2, f=math.exp(-r * T) * p2 * 2)
# riskhub tree 100 → 125/80, r = 4 %, real p = 0.65
qr = (math.exp(0.04) - 0.8) / 0.45
key["riskhub_tree"] = dict(S0=100, up=125, down=80, r=0.04, K=100, p_real=0.65, q=qr, call_Q=math.exp(-0.04) * qr * 25, call_P=math.exp(-0.04) * 0.65 * 25,
                           put_Q=math.exp(-0.04) * (1 - qr) * 20, put_P=math.exp(-0.04) * 0.35 * 20)
# Wilmott 100 → 103/98: Δ = 0.6, price 1.2 (r = 0); 100 → 101/99: ½, ½
key["wilmott"] = dict(a=dict(up=103, down=98, K=100, delta=3 / 5, price=0.6 * 100 - (0.6 * 98)), b=dict(up=101, down=99, delta=0.5, price=0.5))

# ------------------------------------------------------------------ B5: continuous tilt (riskhub: S0 = 100, μ = 9 %, σ = 20 %, r = 4 %, T = 1)
S0, mu, sigma, r, T, K = 100.0, 0.09, 0.20, 0.04, 1.0, 100.0
theta = (mu - r) / sigma
c0 = math.exp(theta * (mu - 0.5 * sigma ** 2) * T / sigma - 0.5 * theta ** 2 * T)
key["continuous"] = dict(S0=S0, mu=mu, sigma=sigma, r=r, T=T, K=K, theta=theta, weight_const=c0, weight_exponent=-theta / sigma,
                         weight_at=[dict(S=s, w=c0 * (s / S0) ** (-theta / sigma)) for s in (80, 100, 125)],
                         E_P_disc=S0 * math.exp((mu - r) * T), E_Q_disc=S0,
                         P_below_80=float(norm.cdf((math.log(80 / S0) - (mu - 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T)))),
                         Q_below_80=float(norm.cdf((math.log(80 / S0) - (r - 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T)))),
                         bs_call=bs(S0, K, r, sigma, T)[0],
                         # E_P[e^{−rT}(S_T − K)+] in closed form: discounted Black–Scholes-type formula with drift μ
                         call_P_disc=float(math.exp(-r * T) * (S0 * math.exp(mu * T) * norm.cdf((math.log(S0 / K) + (mu + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T)))
                                                             - K * norm.cdf((math.log(S0 / K) + (mu - 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))))))

# 2,000 equally likely futures: exact lognormal quantiles at the midpoints (i + ½)/n
n = 2000
qs = (np.arange(n) + 0.5) / n
ST = S0 * np.exp((mu - 0.5 * sigma ** 2) * T + sigma * math.sqrt(T) * norm.ppf(qs))
logret = np.log(ST / S0)
rows = []
for th in (0.0, 0.1, 0.25, 0.4):
    w = (ST / S0) ** (-th / sigma) * math.exp(th * (mu - 0.5 * sigma ** 2) * T / sigma - 0.5 * th ** 2 * T)
    raw_sum = float(w.sum())
    w = w / w.sum()
    m = float((w * logret).sum())
    rows.append(dict(theta=th, raw_mean_weight=raw_sum / n, disc_mean=float((w * ST).sum() * math.exp(-r * T)),
                     call=float((w * np.maximum(ST - K, 0)).sum() * math.exp(-r * T)), p_below_80=float(w[ST < 80].sum()),
                     log_sd=math.sqrt(float((w * (logret - m) ** 2).sum())), log_mean=m, drift_implied=m / T + 0.5 * sigma ** 2))
key["quantiles"] = dict(n=n, first5=ST[:5].tolist(), last5=ST[-5:].tolist(), median=float(np.median(ST)), rows=rows)
# Girsanov: tilt by θ shifts the drift of S from μ to μ − σθ; the log-return sd stays σ√T
key["girsanov"] = dict(mu=mu, sigma=sigma, thetas=[0.0, 0.1, 0.25, 0.4], drifts=[mu - sigma * th for th in (0.0, 0.1, 0.25, 0.4)],
                       # a fixed Brownian path and its shift W̃ = W + θt
                       t=[0.0, 0.25, 0.5, 0.75, 1.0], W=[0.0, 0.3, -0.1, 0.25, 0.05],
                       W_tilde_025=[w + 0.25 * t for w, t in zip([0.0, 0.3, -0.1, 0.25, 0.05], [0.0, 0.25, 0.5, 0.75, 1.0])],
                       Z_T_at_W1=[math.exp(-th * 0.05 - 0.5 * th ** 2 * 1.0) for th in (0.0, 0.1, 0.25, 0.4)])

# ------------------------------------------------------------------ B6: Hull's BS example, CRR vs explicit FD in ln S, Monte Carlo
S, K, r, sigma, T = 42.0, 40.0, 0.10, 0.20, 0.5
cb, pb = bs(S, K, r, sigma, T)
d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
key["hull_bs"] = dict(S=S, K=K, r=r, sigma=sigma, T=T, d1=d1, d2=d1 - sigma * math.sqrt(T), call=cb, put=pb)


def crr(S, K, r, sigma, T, n, put=False):
    dt = T / n
    u = math.exp(sigma * math.sqrt(dt))
    d = 1 / u
    p = (math.exp(r * dt) - d) / (u - d)
    ST = S * u ** np.arange(n, -1, -1) * d ** np.arange(0, n + 1)
    V = np.maximum(K - ST, 0) if put else np.maximum(ST - K, 0)
    for _ in range(n):
        V = math.exp(-r * dt) * (p * V[:-1] + (1 - p) * V[1:])
    return float(V[0])


def fd_grid(S, K, r, sigma, T, n, put=False, forward=False):
    """Explicit FD in x = ln S on the trinomial stencil φ± = ½(δt/δx²)(σ² ± A δx), φ0 = 1 − σ²δt/δx², with δx = σ√δt (so φ0 = 0)."""
    dt = T / n
    dx = sigma * math.sqrt(dt)
    A = r - 0.5 * sigma ** 2
    phi_p = 0.5 * (dt / dx ** 2) * (sigma ** 2 + A * dx)
    phi_m = 0.5 * (dt / dx ** 2) * (sigma ** 2 - A * dx)
    phi_0 = 1 - dt * sigma ** 2 / dx ** 2
    x = math.log(S) + dx * np.arange(-n, n + 1)
    ST = np.exp(x)
    V = (ST - K) if forward else (np.maximum(K - ST, 0) if put else np.maximum(ST - K, 0))
    for _ in range(n):
        V = math.exp(-r * dt) * (phi_p * V[2:] + phi_0 * V[1:-1] + phi_m * V[:-2])
    return float(V[0]), phi_p, phi_m


ns = [1, 2, 10, 100, 500]
key["grid"] = dict(S=S, K=K, r=r, sigma=sigma, T=T, n=ns, crr_call=[crr(S, K, r, sigma, T, n) for n in ns], crr_put=[crr(S, K, r, sigma, T, n, True) for n in ns],
                   fd_n=[10, 100, 500], fd_call=[fd_grid(S, K, r, sigma, T, n)[0] for n in (10, 100, 500)],
                   fd_put=[fd_grid(S, K, r, sigma, T, n, put=True)[0] for n in (10, 100, 500)],
                   fd_forward=[fd_grid(S, K, r, sigma, T, n, forward=True)[0] for n in (10, 100, 500)], forward_exact=S - K * math.exp(-r * T),
                   p_fd_at_10=fd_grid(S, K, r, sigma, T, 10)[1], p_crr_at_10=(math.exp(r * T / 10) - math.exp(-sigma * math.sqrt(T / 10))) / (math.exp(sigma * math.sqrt(T / 10)) - math.exp(-sigma * math.sqrt(T / 10))))
# Hull two-step as the "three doors" check: 2.0257 / 1.2823
pp = (math.exp(0.03) - 0.9) / 0.2
B = math.exp(-0.03) * pp * 3.2
key["three_doors"] = dict(p=pp, B=B, A=math.exp(-0.03) * pp * B, terminal_probs=[pp ** 2, 2 * pp * (1 - pp), (1 - pp) ** 2])
# Monte Carlo under Q (numpy default_rng(1)); the note's own run (a different generator) read 4.985 ± 0.158 / 4.747 ± 0.050 / 4.771 ± 0.016
mc = []
for N in (1000, 10000, 100000):
    g = np.random.default_rng(1)
    Z = g.standard_normal(N)
    pay = math.exp(-r * T) * np.maximum(S * np.exp((r - 0.5 * sigma ** 2) * T + sigma * math.sqrt(T) * Z) - K, 0)
    mc.append(dict(N=N, mean=float(pay.mean()), se=float(pay.std(ddof=1) / math.sqrt(N))))
# population sd of the discounted payoff (the 1.58 in SE ≈ 1.58/√N), by quadrature
zz = np.linspace(-8, 8, 400001)
pdf = norm.pdf(zz)
pay = math.exp(-r * T) * np.maximum(S * np.exp((r - 0.5 * sigma ** 2) * T + sigma * math.sqrt(T) * zz) - K, 0)
m1 = np.trapezoid(pay * pdf, zz)
sd = math.sqrt(np.trapezoid((pay - m1) ** 2 * pdf, zz))
key["monte_carlo"] = dict(runs=mc, payoff_sd=sd, note_runs=[dict(N=1000, mean=4.985, se=0.158), dict(N=10000, mean=4.747, se=0.050), dict(N=100000, mean=4.771, se=0.016)],
                          one_future=dict(z=0.0, value=float(math.exp(-r * T) * max(S * math.exp((r - 0.5 * sigma ** 2) * T) - K, 0))))

# ------------------------------------------------------------------ B6: the x² heat test — u_t + ½u_xx = 0, h = x² → u = x² + (T − t)
x0, tau = 0.5, 1.0
g = np.random.default_rng(1)
X = x0 + math.sqrt(tau) * g.standard_normal(20000)
key["heat"] = dict(x=x0, tau=tau, exact=x0 ** 2 + tau, mc_mean=float((X ** 2).mean()), mc_se=float((X ** 2).std(ddof=1) / math.sqrt(20000)), mc_sd_exact=math.sqrt(2 * tau ** 2 + 4 * x0 ** 2 * tau),
                   note_mc=dict(mean=1.2512, se=0.0124))


def heat_grid(x0, tau, n, lam):
    """Explicit scheme for u_t + ½u_xx = 0 on an x-lattice centred at x0: dt = tau/n, dx chosen so that ½·dt/dx² = lam."""
    dt = tau / n
    dx = math.sqrt(0.5 * dt / lam)
    x = x0 + dx * np.arange(-n, n + 1)
    V = x ** 2
    for _ in range(n):
        V = lam * V[2:] + (1 - 2 * lam) * V[1:-1] + lam * V[:-2]
    return float(V[0]), float(np.abs(np.diff(V, 2)).max()) if len(V) > 2 else 0.0


key["heat"]["grid"] = [dict(n=n, lam=lam, value=heat_grid(x0, tau, n, lam)[0]) for n in (4, 10, 50, 200) for lam in (0.25, 0.5)]
# step too far: λ > ½ makes the middle weight negative; a kinked payoff (|x|) then oscillates
def kink_grid(n, lam):
    dt = 1.0 / n
    dx = math.sqrt(0.5 * dt / lam)
    x = dx * np.arange(-n, n + 1)
    V = np.abs(x)
    for _ in range(n // 2):  # half-way profile, so there is still a rod to look at
        V = lam * V[2:] + (1 - 2 * lam) * V[1:-1] + lam * V[:-2]
    return V
key["heat"]["unstable"] = dict(n=40, lam_ok=0.5, lam_bad=0.75, middle_weight_bad=1 - 2 * 0.75,
                               sign_changes_ok=int((np.diff(np.sign(np.diff(kink_grid(40, 0.5)))) != 0).sum()),
                               sign_changes_bad=int((np.diff(np.sign(np.diff(kink_grid(40, 0.75)))) != 0).sum()),
                               max_abs_bad=float(np.abs(kink_grid(40, 0.75)).max()), max_abs_ok=float(np.abs(kink_grid(40, 0.5)).max()),
                               profile_ok=kink_grid(40, 0.5).tolist(), profile_bad=kink_grid(40, 0.75).tolist())
# curvature arrows: second difference of the expiry hockey stick on a 7-node rod around the kink
rod = [36.0, 38.0, 40.0, 42.0, 44.0, 46.0, 48.0]
hv = [max(s - 40, 0) for s in rod]
key["curvature"] = dict(S=rod, V=hv, second_diff=[hv[i + 1] - 2 * hv[i] + hv[i - 1] for i in range(1, 6)], dx=2.0)

out = os.path.join(os.path.dirname(__file__), "..", "..", "apps", "web", "src", "engine", "__fixtures__", "key-B5B6.json")
json.dump(key, open(out, "w"))
print("wrote", os.path.normpath(out))
print("Z", Zu, Zd, key["finite_tilt"]["E_q_Z"], key["finite_tilt"]["f_via_Z"])
print("weights", key["continuous"]["weight_const"], [w["w"] for w in key["continuous"]["weight_at"]])
for row in rows: print(row)
print("grid", key["grid"]["crr_call"], key["grid"]["fd_call"], key["grid"]["fd_forward"], key["grid"]["forward_exact"])
print("mc", mc, "sd", sd)
print("heat", key["heat"]["mc_mean"], key["heat"]["mc_se"], key["heat"]["grid"][:4], key["heat"]["unstable"])
