"""Answer key for chapter D3 (Three stories, one curve: local vol, Heston, Merton, SABR as a ruler). numpy + scipy. -> key-D3.json
Run with: python3 -I tests/answer-key/key_D3.py
Sources: Gatheral, The Volatility Surface (2006) ch. 1 (Dupire (1.10)), ch. 2 ((2.12)-(2.15) characteristic function), ch. 3 (Tables 3.1, 3.2,
eq. (3.21)), ch. 5 (Lewis integral (5.6), Merton series, Table 5.2), ch. 7 ((7.7) SABR beta = 1); Hagan et al. (2002) eq. (2.17a);
QuantLib's testAlanLewisReferencePrices (50-digit Heston references); metricgate's Merton example (short row only, see research/r1/D3.md §6);
quantt's SABR example; the NSE NIFTY chain of 23 Oct 2026 (key_C3C4.py `strip`) and D2's smoothed smile (key_D2.py `fit`); storyboards/D3.md.

Conventions. Forward form throughout: F is the forward for T, prices are e^{-rT} x E[(F_T - K)+] under the pricing measure, implied vols are
Black-76 against the same F and r. The Heston integral is Lewis/Gatheral (5.6): C = F - (sqrt(FK)/pi) * Int_0^inf Re[e^{-iuk} phi(u - i/2)]/(u^2 + 1/4) du,
with phi from Gatheral (2.12)-(2.15) (the branch-safe r_- form). It is evaluated on a composite 8-point Gauss-Legendre rule on [0, U] whose
panels and U depend only on the parameters, so the TypeScript engine can use the very same nodes; the rule is checked here against scipy's quad.
Merton's series is the plain mixture: price = e^{-rT} sum_n Poisson(n; lambda T) * Black76(F_n, K, sigma_n), F_n = F e^{-lambda kbar T} (1 + kbar)^n,
sigma_n^2 = sigma^2 + n sigma_J^2 / T (identical to Merton's r_n form with r_n in the discount). SABR is Hagan (2.17a).
Local vol from D2's smile uses Dupire in implied-total-variance form (Gatheral (1.10)) with w(y, t) = sigma(y)^2 t assumed flat in t, so dw/dt = sigma(y)^2:
    v_L(y, t) = sigma(y)^2 / [ 1 - y w_y / w - 1/4 (1/4 + 1/w - y^2/w^2) w_y^2 + 1/2 w_yy ],   w_y = 2 sigma sigma' t,  w_yy = 2 (sigma'^2 + sigma sigma'') t,
with sigma(y) = a + b y + c y^2 from key-D2.json. NOTE the first denominator term is linear, 1 - y w_y/w, as in Gatheral; research/r1/D3.md §6 squared it
(double-counting the y^2 w_y^2 / w^2 term), which is why its strip numbers (21.7 % at 22,000, slope -1.17) differ from this key's (19.2 %, -0.77).
The linear form is verified here against price-based Dupire, 2 C_T / (K^2 C_KK), by finite differences. Under the flat-w assumption the local
variance still depends on t through the 1/w term (the ATM slice drifts from 15.95 % at t = 0 to 15.43 % at t = T): the cloud is grown on the
surface sigma_L(S, t), read at each step's midpoint time, and that is what reprices the smile; the T-slice held constant in time misses by ~0.3 vol pt
(recorded too). The strip is painted on 21,800..23,400 and held constant beyond (stated extrapolation).
"""
import json, math, os, time
import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq, least_squares
from scipy.integrate import quad
from scipy.linalg import solve_banded

here = os.path.dirname(os.path.abspath(__file__))
fx = os.path.join(here, "..", "..", "apps", "web", "src", "engine", "__fixtures__")
c3 = json.load(open(os.path.join(fx, "key-C3C4.json")))["strip"]
d2fit = json.load(open(os.path.join(fx, "key-D2.json")))["fit"]
key = {"conventions": "forward form; prices = e^{-rT} E[(F_T-K)+]; IVs are Black-76 against the same F, r; see the docstring of key_D3.py"}

F0, r0, T0 = 22603.0, 0.065, 11 / 365
STRIKES = np.array(c3["strikes"], float)
IVS = np.concatenate([np.array(c3["call_iv"]), np.array(c3["put_iv"])])
KK = np.concatenate([STRIKES, STRIKES])
GRID = [float(x) for x in np.arange(21800, 23400 + 1, 25)]
WINGS = [22000.0, 23300.0]
SA, SB, SC = d2fit["a"], d2fit["b"], d2fit["c"]


# ------------------------------------------------------------------ Black-76 and implied vol
def b76(F, K, s, T, r=0.0, call=True):
    D = math.exp(-r * T)
    if s <= 0:
        return D * max((F - K) if call else (K - F), 0.0)
    st = s * math.sqrt(T)
    d1 = (math.log(F / K) + 0.5 * st * st) / st
    d2 = d1 - st
    return D * ((F * norm.cdf(d1) - K * norm.cdf(d2)) if call else (K * norm.cdf(-d2) - F * norm.cdf(-d1)))


def iv(price, F, K, T, r=0.0, call=True):
    return brentq(lambda s: b76(F, K, s, T, r, call) - price, 1e-6, 5.0, xtol=1e-14)


# ------------------------------------------------------------------ Heston: Gatheral (2.12)-(2.15) + Lewis (5.6)
def heston_cf(u, T, v0, kappa, theta, eta, rho):
    """phi_T(u) = E[e^{iu x_T}], x = ln(F_T/F); Gatheral's C, D with lambda = kappa, vbar = theta (r_- form, no branch issue)."""
    a = -0.5 * u * u - 0.5j * u
    b = kappa - rho * eta * 1j * u
    g = 0.5 * eta * eta
    d = np.sqrt(b * b - 4 * a * g)
    rm = (b - d) / (2 * g)
    rp = (b + d) / (2 * g)
    G = rm / rp
    e = np.exp(-d * T)
    D = rm * (1 - e) / (1 - G * e)
    C = kappa * (rm * T - 2 / (eta * eta) * np.log((1 - G * e) / (1 - G)))
    return np.exp(C * theta + D * v0)


GL8_X, GL8_W = np.polynomial.legendre.leggauss(8)


def heston_nodes(T, v0, kappa, theta, eta, rho, kmax=0.0):
    """Composite 8-point Gauss-Legendre nodes on [0, U], graded: panel widths start at 1/4 (the 1/(u^2 + 1/4) factor is sharp at the
    origin) and double up to wmax. Large-u decay of |phi(u - i/2)| is exp(-c u) with c = sqrt(1-rho^2) (v0 + kappa theta T) / eta, so
    U = max(200, 36/c) and wmax = min(10/max(1, 3|k|), max(2/c, 1)). Checked against scipy quad to ~1e-12 relative on every set in this key.
    The TypeScript engine builds the identical node set."""
    c = math.sqrt(1 - rho * rho) * (v0 + kappa * theta * T) / eta
    U = max(200.0, 36.0 / c)
    wmax = min(10.0 / max(1.0, 3.0 * abs(kmax)), max(2.0 / c, 1.0))
    edges = [0.0]
    w = 0.25
    while edges[-1] < U:
        edges.append(min(edges[-1] + w, U))
        w = min(2 * w, wmax)
    edges = np.array(edges)
    widths = np.diff(edges)
    mid = 0.5 * (edges[:-1] + edges[1:])
    u = (mid[:, None] + 0.5 * widths[:, None] * GL8_X[None, :]).ravel()
    wts = (0.5 * widths[:, None] * GL8_W[None, :]).ravel()
    return u, wts, U


def heston_phi_half(u, T, v0, kappa, theta, eta, rho):
    return heston_cf(u - 0.5j, T, v0, kappa, theta, eta, rho) / (u * u + 0.25)


def heston_call_fwd(F, K, T, v0, kappa, theta, eta, rho, method="gl"):
    """Undiscounted forward call, Lewis (5.6). method 'gl' = the engine's rule; 'quad' = scipy adaptive to infinity (the check)."""
    if eta < 1e-8:  # exact: deterministic variance path, Black-76 with the average variance
        vbar = theta + (v0 - theta) * (1 - math.exp(-kappa * T)) / (kappa * T)
        return b76(F, K, math.sqrt(vbar), T)
    k = math.log(K / F)
    if method == "quad":
        f = lambda u: float(np.real(np.exp(-1j * u * k) * heston_phi_half(u, T, v0, kappa, theta, eta, rho)))
        I = quad(f, 0, np.inf, limit=2000, epsabs=1e-14, epsrel=1e-13)[0]
    else:
        u, w, _ = heston_nodes(T, v0, kappa, theta, eta, rho, k)
        I = float(np.sum(w * np.real(np.exp(-1j * u * k) * heston_phi_half(u, T, v0, kappa, theta, eta, rho))))
    return F - math.sqrt(F * K) / math.pi * I


def heston_smile(F, Ks, T, v0, kappa, theta, eta, rho):
    """Implied vols at the strikes, sharing one set of phi evaluations (the engine's path for a smile)."""
    Ks = np.asarray(Ks, float)
    ks = np.log(Ks / F)
    if eta < 1e-8:
        vbar = theta + (v0 - theta) * (1 - math.exp(-kappa * T)) / (kappa * T)
        return np.full(len(Ks), math.sqrt(vbar))
    u, w, _ = heston_nodes(T, v0, kappa, theta, eta, rho, float(np.max(np.abs(ks))))
    ph = heston_phi_half(u, T, v0, kappa, theta, eta, rho)
    out = []
    for K, k in zip(Ks, ks):
        I = float(np.sum(w * np.real(np.exp(-1j * u * k) * ph)))
        out.append(iv(F - math.sqrt(F * K) / math.pi * I, F, K, T))
    return np.array(out)


# --- Alan Lewis references (QuantLib testAlanLewisReferencePrices)
S, r, q, T = 100.0, 0.01, 0.02, 1.0
F = S * math.exp((r - q) * T)
D = math.exp(-r * T)
lewis_ref = {80: (26.774758743998854, 7.958878113256768), 90: (20.93334900059671, 12.017966707346305), 100: (16.070154917028834, 17.05527096127011),
             110: (12.132211516709845, 23.0178258984428), 120: (9.024913483457836, 29.81102620268247)}
lp = dict(v0=0.04, kappa=4.0, theta=0.25, eta=1.0, rho=-0.5)
rows, errs = [], []
for K, (cref, pref) in lewis_ref.items():
    c_gl = D * heston_call_fwd(F, K, T, **lp)
    c_q = D * heston_call_fwd(F, K, T, **lp, method="quad")
    p_gl = c_gl - D * (F - K)
    rows.append(dict(K=K, call=c_gl, put=p_gl, call_ref=cref, put_ref=pref, call_quad=c_q, err_call=c_gl - cref, err_put=p_gl - pref))
    errs += [abs(c_gl - cref), abs(p_gl - pref)]
lewis_max_err = max(errs)
assert lewis_max_err < 1e-9, lewis_max_err
key["heston_lewis"] = dict(S=S, r=r, q=q, T=T, F=F, **lp, rows=rows, max_abs_err=lewis_max_err, U=heston_nodes(T, **lp)[2],
                           n_nodes=int(len(heston_nodes(T, **lp)[0])), source="QuantLib testAlanLewisReferencePrices (50-digit references)")

# --- the chapter's standard set
sp = dict(v0=0.04, kappa=2.0, theta=0.04, eta=0.3, rho=-0.7)
Ks = [80.0, 90.0, 100.0, 110.0, 120.0]
std_calls = [heston_call_fwd(100, K, 1, **sp) for K in Ks]
std_quad = [heston_call_fwd(100, K, 1, **sp, method="quad") for K in Ks]
std_ivs = [iv(c, 100, K, 1) for c, K in zip(std_calls, Ks)]
std_puts = [c - (100 - K) for c, K in zip(std_calls, Ks)]
sp5 = dict(sp, eta=0.5)
std5_calls = [heston_call_fwd(100, K, 1, **sp5) for K in Ks]
eta0 = heston_call_fwd(100, 100, 1, **dict(sp, eta=1e-4))
bs20 = b76(100, 100, 0.2, 1)
assert abs(eta0 - bs20) < 1e-4  # the approach is first order in eta (the rho eta skew term); at eta = 0 the pricer is Black-76 exactly
assert abs(heston_call_fwd(100, 100, 1, **dict(sp, eta=0.0)) - bs20) < 1e-12
eta_ladder = [(e, heston_call_fwd(100, 100, 1, **dict(sp, eta=e))) for e in (0.1, 0.01, 0.001, 1e-4)]
key["heston_standard"] = dict(F=100, r=0, T=1, **sp, K=Ks, calls=std_calls, puts=std_puts, iv=std_ivs, max_gl_vs_quad=float(max(abs(a - b) for a, b in zip(std_calls, std_quad))),
                              eta_0_5=dict(calls=std5_calls, iv=[iv(c, 100, K, 1) for c, K in zip(std5_calls, Ks)]),
                              eta_to_0=dict(eta=1e-4, call=eta0, bs_20pct=bs20, ladder=eta_ladder, call_at_eta_0=heston_call_fwd(100, 100, 1, **dict(sp, eta=0.0))), note="no published value; validated pricer + MC 7.64 +- 0.02 in research/r1/D3.md")

# --- Gatheral Table 3.2 fit: ATM vols and skews
g32 = dict(v0=0.0174, kappa=1.3253, theta=0.0354, eta=0.3877, rho=-0.7165)


def var_skew_fd(smile_fn, h=0.05):
    """d(sigma_BS^2)/dk at k = 0 by the central difference over +-h in log-moneyness."""
    lo, at, hi = smile_fn([math.exp(-h), 1.0, math.exp(h)])
    return float((hi * hi - lo * lo) / (2 * h)), float(at)


def heston_skew_321(T, kappa, eta, rho):
    """Gatheral (3.21): ATM variance skew ~ rho eta / (l T) * (1 - (1 - e^{-l T})/(l T)), l = kappa - rho eta / 2 (his lambda')."""
    l = kappa - 0.5 * rho * eta
    x = l * T
    return rho * eta / x * (1 - (1 - math.exp(-x)) / x)


g32_rows = []
for Tm, lab in [(1 / 12, "1m"), (0.25, "3m"), (1.0, "1y")]:
    sk, atm = var_skew_fd(lambda Kx: heston_smile(1.0, Kx, Tm, **g32))
    g32_rows.append(dict(T=Tm, label=lab, atm_vol=atm, var_skew_fd=sk, var_skew_321=heston_skew_321(Tm, g32["kappa"], g32["eta"], g32["rho"]),
                         atm_var_318=g32["theta"] + (g32["v0"] - g32["theta"]) * (1 - math.exp(-g32["kappa"] * Tm)) / (g32["kappa"] * Tm)))
key["heston_gatheral_3_2"] = dict(**g32, rows=g32_rows, note="var_skew_fd is d(sigma^2)/dk over +-5 %; (3.21) uses lambda' = kappa - rho eta/2")


# ------------------------------------------------------------------ Merton: the plain mixture series, 25 terms
NTERMS = 25


def poisson_weights(lam, T, n=NTERMS):
    x = lam * T
    w = [math.exp(-x)]
    for i in range(1, n):
        w.append(w[-1] * x / i)
    return w


def merton_call_fwd(F, K, T, sigma, lam, muJ, sJ, n=NTERMS):
    kbar = math.exp(muJ + 0.5 * sJ * sJ) - 1
    tot = 0.0
    for i, w in enumerate(poisson_weights(lam, T, n)):
        Fn = F * math.exp(-lam * kbar * T) * (1 + kbar) ** i
        sn = math.sqrt(sigma * sigma + i * sJ * sJ / T)
        tot += w * b76(Fn, K, sn, T)
    return tot


def merton_smile(F, Ks, T, sigma, lam, muJ, sJ):
    return np.array([iv(merton_call_fwd(F, K, T, sigma, lam, muJ, sJ), F, K, T) for K in Ks])


# metricgate short row: S = K = 100, r 5 %, sigma 20 %, T 0.083 (the page's literal input; 1/12 gives 2.8241), lambda 0.75, muJ -10 %, sJ 15 %
S, K, r, T = 100.0, 100.0, 0.05, 0.083
F = S * math.exp(r * T)
mg = math.exp(-r * T) * merton_call_fwd(F, K, T, 0.2, 0.75, -0.10, 0.15)
mg_bs = math.exp(-r * T) * b76(F, K, 0.2, T)
assert abs(mg - 2.8176) < 5e-5, mg
assert abs(mg_bs - 2.5066) < 5e-5, mg_bs
assert abs(math.exp(-r * T) * merton_call_fwd(F, K, T, 0.2, 0.0, -0.10, 0.15) - mg_bs) < 1e-12
key["merton_metricgate"] = dict(S=S, K=K, r=r, T=T, sigma=0.2, lam=0.75, muJ=-0.10, sJ=0.15, call=mg, bs=mg_bs, premium=mg - mg_bs, ref=dict(call=2.8176, bs=2.5066, premium=0.3110),
                                put=mg - math.exp(-r * T) * (F - K), note="T is the page's literal 0.083 (1/12 would give 2.8241); the six-month row of the same page (13.46) does not reproduce and is not used")
# Gatheral Table 5.2 'solid': sigma 0.2, lambda 0.5, alpha -0.15, delta 0.05, T 0.25, r 0, S 100
gk = [-0.2, -0.1, 0.0, 0.1, 0.2]
g52K = [100 * math.exp(k) for k in gk]
g52c = [merton_call_fwd(100, K, 0.25, 0.2, 0.5, -0.15, 0.05) for K in g52K]
key["merton_gatheral_5_2"] = dict(S=100, r=0, T=0.25, sigma=0.2, lam=0.5, muJ=-0.15, sJ=0.05, k=gk, K=g52K, calls=g52c, iv=[iv(c, 100, K, 0.25) for c, K in zip(g52c, g52K)],
                                  short_dated_var_skew_T001=var_skew_fd(lambda Kx: merton_smile(1.0, Kx, 0.01, 0.2, 0.5, -0.15, 0.05), 0.005)[0],
                                  gatheral_5_10=2 * 0.5 * (math.exp(-0.15 + 0.5 * 0.05 ** 2) - 1))
key["poisson_weights"] = {str(l): dict(lam=l, T=T0, weights=poisson_weights(l, T0, 6), p_at_least_one=1 - math.exp(-l * T0)) for l in (1.0, 5.0)}


# ------------------------------------------------------------------ SABR: Hagan (2.17a)
def sabr_vol(F, K, T, alpha, beta, rho, nu):
    lg = math.log(F / K)
    FK = (F * K) ** ((1 - beta) / 2)
    B = 1 + ((1 - beta) ** 2 / 24 * alpha * alpha / FK ** 2 + 0.25 * rho * beta * nu * alpha / FK + (2 - 3 * rho * rho) / 24 * nu * nu) * T
    if abs(lg) < 1e-12:
        return alpha / F ** (1 - beta) * B
    z = nu / alpha * FK * lg
    x = math.log((math.sqrt(1 - 2 * rho * z + z * z) + z - rho) / (1 - rho))
    A = alpha / (FK * (1 + (1 - beta) ** 2 / 24 * lg ** 2 + (1 - beta) ** 4 / 1920 * lg ** 4))
    return A * z / x * B


qK = [0.02, 0.025, 0.03, 0.035, 0.04]
qv = [sabr_vol(0.03, K, 1.0, 0.035, 0.5, -0.25, 0.45) for K in qK]
for a, b in zip(qv, [0.2652, 0.2287, 0.2047, 0.1922, 0.1888]):
    assert abs(a - b) < 5e-5, (a, b)
g77 = 0.2 * (1 + (0.25 * (-0.3) * 0.4 * 0.2 + (2 - 3 * 0.09) / 24 * 0.16) * 1)
s77 = sabr_vol(100, 100, 1, 0.2, 1.0, -0.3, 0.4)
assert abs(s77 - g77) < 1e-12
key["sabr_quantt"] = dict(F=0.03, alpha=0.035, beta=0.5, rho=-0.25, nu=0.45, T=1, K=qK, vol=qv, ref=[0.2652, 0.2287, 0.2047, 0.1922, 0.1888])
key["sabr_beta1_atm"] = dict(F=100, alpha=0.2, beta=1, rho=-0.3, nu=0.4, T=1, vol=s77, gatheral_7_7=g77)


# ------------------------------------------------------------------ the three fits to the real chain (least squares on the 34 dots, equal weights)
def rms_pts(res):
    return float(100 * math.sqrt(np.mean(np.square(res))))


def wrap_fit(name, params, curve_fn):
    curve = curve_fn(GRID)
    resid = curve_fn(KK) - IVS
    return dict(name=name, params=params, rms_vol_pts=rms_pts(resid), max_abs_vol_pts=float(100 * np.max(np.abs(resid))), grid=GRID, curve=[float(x) for x in curve],
                wing_22000=float(curve_fn(WINGS)[0]), wing_23300=float(curve_fn(WINGS)[1]), fitted_at_dots=[float(x) for x in curve_fn(KK)])


def smile_d2(Ks):
    k = np.log(np.asarray(Ks, float) / F0)
    return SA + SB * k + SC * k * k


fits = {}
fits["quadratic"] = wrap_fit("quadratic (D2)", dict(a=SA, b=SB, c=SC), smile_d2)
# SABR beta = 1
sab = lambda p: np.array([sabr_vol(F0, K, T0, p[0], 1.0, p[1], p[2]) for K in KK]) - IVS
res = least_squares(sab, [0.16, -0.3, 1.0], bounds=([0.01, -0.999, 0.01], [1, 0.999, 20]), xtol=1e-14, ftol=1e-14, gtol=1e-14)
al, rh, nu = (float(x) for x in res.x)
fits["sabr"] = wrap_fit("SABR beta = 1", dict(alpha=al, beta=1.0, rho=rh, nu=nu), lambda Ks: np.array([sabr_vol(F0, K, T0, al, 1.0, rh, nu) for K in Ks]))
# Heston, kappa fixed, theta = v0, free (v0, rho, eta)
for kap, tag in [(2.0, "heston"), (20.0, "heston_k20")]:
    fn = lambda p, kap=kap: heston_smile(F0, KK, T0, p[0], kap, p[0], p[2], p[1]) - IVS
    res = least_squares(fn, [0.025, -0.5, 2.0 if kap == 2 else 5.0], bounds=([0.005, -0.999, 0.05], [0.1, 0.999, 40]), xtol=1e-12, ftol=1e-12, gtol=1e-12)
    v0, rh, et = (float(x) for x in res.x)
    fits[tag] = wrap_fit(f"Heston kappa = {kap:g}, theta = v0", dict(v0=v0, kappa=kap, theta=v0, eta=et, rho=rh, feller_2kt=2 * kap * v0, eta_sq=et * et),
                         lambda Ks, v0=v0, kap=kap, et=et, rh=rh: heston_smile(F0, Ks, T0, v0, kap, v0, et, rh))
# Merton, lambda fixed at 1 and 5, free (sigma, muJ, sJ)
for lam, tag in [(1.0, "merton"), (5.0, "merton_l5")]:
    fn = lambda p, lam=lam: merton_smile(F0, KK, T0, p[0], lam, p[1], p[2]) - IVS
    res = least_squares(fn, [0.14, -0.05, 0.05], bounds=([0.01, -1, 0.001], [1, 1, 1]), xtol=1e-14, ftol=1e-14, gtol=1e-14)
    sg, mu, sj = (float(x) for x in res.x)
    fits[tag] = wrap_fit(f"Merton lambda = {lam:g}/yr", dict(sigma=sg, lam=lam, muJ=mu, sJ=sj, kbar=math.exp(mu + 0.5 * sj * sj) - 1),
                         lambda Ks, sg=sg, lam=lam, mu=mu, sj=sj: merton_smile(F0, Ks, T0, sg, lam, mu, sj))
for tag in ("sabr", "heston", "heston_k20", "merton", "merton_l5"):
    assert fits[tag]["rms_vol_pts"] < 0.17, (tag, fits[tag]["rms_vol_pts"])
_d = 100 * np.abs(np.array(fits["heston"]["curve"]) - np.array(fits["heston_k20"]["curve"]))
_g = np.array(GRID)
k2_vs_k20 = dict(full_grid=float(_d.max()), on_22000_23300=float(_d[(_g >= 22000) & (_g <= 23300)].max()), on_quoted_22250_23050=float(_d[(_g >= 22250) & (_g <= 23050)].max()))
assert k2_vs_k20["on_quoted_22250_23050"] < 0.02 and k2_vs_k20["full_grid"] < 0.06, k2_vs_k20
key["fits"] = fits
key["heston_kappa_unidentifiable_max_diff_vol_pts"] = k2_vs_k20
key["chain"] = dict(F=F0, r=r0, T=T0, strikes=[float(x) for x in STRIKES], call_iv=c3["call_iv"], put_iv=c3["put_iv"], n_dots=int(len(IVS)))


# ------------------------------------------------------------------ local vol from D2's smile: Dupire (1.10) with w(y,t) = sigma(y)^2 t flat in t
KLO, KHI = 21800.0, 23400.0


def local_var_at_k(y, t=T0):
    """Gatheral (1.10) with w = sigma(y)^2 t; the first denominator term is LINEAR (1 - y w_y / w). t is floored at 1e-8."""
    t = max(t, 1e-8)
    s = SA + SB * y + SC * y * y
    s1 = SB + 2 * SC * y
    s2 = 2 * SC
    w = s * s * t
    wy = 2 * s * s1 * t
    wyy = 2 * (s1 * s1 + s * s2) * t
    den = (1 - y * wy / w) - 0.25 * (0.25 + 1 / w - y * y / (w * w)) * wy * wy + 0.5 * wyy
    return s * s / den


def local_vol(K, t=T0, F=F0):
    """sigma_loc at absolute price K and time t; the map is painted from forward F0 (fixed map) and held constant outside [21,800, 23,400]."""
    Kc = min(max(K, KLO), KHI)
    return math.sqrt(local_var_at_k(math.log(Kc / F), t))


# --- the formula checked against price-based Dupire, 2 C_T / (K^2 C_KK), on the same smile (finite differences)
def _call_smile(K, t):
    return b76(F0, K, SA + SB * math.log(K / F0) + SC * math.log(K / F0) ** 2, t)


def _vl_price(K, t, hK=2.0, hT=1e-5):
    CT = (_call_smile(K, t + hT) - _call_smile(K, t - hT)) / (2 * hT)
    CKK = (_call_smile(K + hK, t) - 2 * _call_smile(K, t) + _call_smile(K - hK, t)) / hK ** 2
    return 2 * CT / (K * K * CKK)


dupire_check = [dict(K=K, t=t, formula=local_vol(K, t), price_fd=math.sqrt(_vl_price(K, t))) for K in (22000.0, 22603.0, 23300.0) for t in (T0 / 2, T0)]
assert all(abs(d["formula"] - d["price_fd"]) < 1e-5 for d in dupire_check), dupire_check

lv_grid = [local_vol(K) for K in GRID]
lv_grid_t0 = [local_vol(K, 1e-8) for K in GRID]
note_grid = [float(x) for x in np.linspace(22000, 23300, 14)]
h = 1e-3
key["local_vol"] = dict(formula="Gatheral (1.10) with w = sigma(y)^2 t, dw/dt = sigma(y)^2; den = 1 - y w_y/w - 1/4(1/4 + 1/w - y^2/w^2) w_y^2 + 1/2 w_yy; analytic w_y, w_yy",
                        F=F0, T=T0, clamp=[KLO, KHI], grid=GRID, sigma_loc=lv_grid, sigma_loc_t0=lv_grid_t0, implied=[float(x) for x in smile_d2(GRID)],
                        note_grid=note_grid, note_sigma_loc=[local_vol(K) for K in note_grid],
                        at_22000=local_vol(22000), at_22750=local_vol(22750), at_23300=local_vol(23300), min_K=float(GRID[int(np.argmin(lv_grid))]), min_sigma_loc=float(min(lv_grid)),
                        atm_t0=local_vol(F0, 1e-8), atm_T=local_vol(F0),
                        atm_slope_local=(local_vol(F0 * math.exp(h)) - local_vol(F0 * math.exp(-h))) / (2 * h), atm_slope_implied=SB, dupire_price_check=dupire_check,
                        note="strip = the T-slice sigma_L(K, T); sigma_loc_t0 = the t -> 0 slice; the cloud reads sigma_L(S, t) at each step")


# --- Dupire forward PDE (deterministic reprice): dC/dt = 1/2 sigma_loc(K,t)^2 K^2 d2C/dK2, C(K,0) = (F - K)+; Crank-Nicolson on a K grid
def local_vol_pde_smile(Fs, Ks_out, T=T0, dK=5.0, nsteps=440, Klo=15000.0, Khi=32000.0, time_dep=True):
    Kg = np.arange(Klo, Khi + dK / 2, dK)
    C = np.maximum(Fs - Kg, 0.0)
    dt = T / nsteps
    n = len(Kg)
    for i in range(nsteps):
        t = (i + 0.5) * dt if time_dep else T
        sig2 = np.array([local_vol(K, t) ** 2 for K in Kg]) * Kg * Kg
        alpha = 0.5 * sig2 * dt / (dK * dK)
        ab = np.zeros((3, n))
        ab[1, :] = 1 + alpha
        ab[0, 1:] = -0.5 * alpha[:-1]
        ab[2, :-1] = -0.5 * alpha[1:]
        ab[1, 0] = ab[1, -1] = 1.0
        ab[0, 1] = ab[2, -2] = 0.0
        rhs = C.copy()
        rhs[1:-1] = C[1:-1] + 0.5 * alpha[1:-1] * (C[2:] - 2 * C[1:-1] + C[:-2])
        rhs[0] = Fs - Kg[0]
        rhs[-1] = 0.0
        C = solve_banded((1, 1), ab, rhs)
    Ci = np.interp(Ks_out, Kg, C)
    return np.array([iv(c, Fs, K, T) for c, K in zip(Ci, Ks_out)])


CHECK_STRIKES = [float(x) for x in np.arange(22250, 23050 + 1, 50)]
pde_iv = local_vol_pde_smile(F0, CHECK_STRIKES)
pde_err = float(100 * np.max(np.abs(pde_iv - smile_d2(CHECK_STRIKES))))
pde_iv_slice = local_vol_pde_smile(F0, CHECK_STRIKES, time_dep=False)
pde_slice_err = float(100 * np.max(np.abs(pde_iv_slice - smile_d2(CHECK_STRIKES))))
assert pde_err < 0.05, pde_err


# --- Monte Carlo on the surface: 22 steps, antithetic, 200k paths (100k pairs), Euler in log price reading sigma_loc(S, t_mid) at each step
LV_KS = np.arange(KLO, KHI + 0.5, 5.0)
LV_KGRID = np.log(LV_KS / F0)


def simulate_local_vol(Fs, n_pairs, nsteps, seed, T=T0):
    rng = np.random.default_rng(seed)
    dt = T / nsteps
    sq = math.sqrt(dt)
    x = np.full(2 * n_pairs, math.log(Fs))
    for i in range(nsteps):
        t = (i + 0.5) * dt
        vgrid = np.array([local_vol(K, t) for K in LV_KS])
        z = rng.standard_normal(n_pairs)
        z = np.concatenate([z, -z])
        s = np.interp(np.clip(x - math.log(F0), LV_KGRID[0], LV_KGRID[-1]), LV_KGRID, vgrid)
        x += -0.5 * s * s * dt + s * sq * z
    return np.exp(x)


def iv_from_cloud(S_T, Fs, Ks, T=T0):
    out = []
    for K in Ks:
        if K >= Fs:
            out.append(iv(float(np.mean(np.maximum(S_T - K, 0))), Fs, K, T))
        else:
            out.append(iv(float(np.mean(np.maximum(K - S_T, 0))), Fs, K, T, call=False))
    return np.array(out)


MC_SEED = 20261110
t0 = time.time()
cloud = simulate_local_vol(F0, 100_000, 22, MC_SEED)
mc_iv = iv_from_cloud(cloud, F0, CHECK_STRIKES)
mc_err = float(100 * np.max(np.abs(mc_iv - smile_d2(CHECK_STRIKES))))
assert mc_err < 0.1, mc_err
key["local_vol_check"] = dict(strikes=CHECK_STRIKES, smile=[float(x) for x in smile_d2(CHECK_STRIKES)], pde_iv=[float(x) for x in pde_iv], pde_max_err_vol_pts=pde_err,
                              pde_T_slice_held_constant=dict(iv=[float(x) for x in pde_iv_slice], max_err_vol_pts=pde_slice_err, note="what happens if the strip at T is used at every t: ~0.3 vol pt low"),
                              mc=dict(seed=MC_SEED, n_paths=200_000, n_steps=22, antithetic=True, step_time="midpoint", iv=[float(x) for x in mc_iv], max_err_vol_pts=mc_err,
                                      terminal_mean=float(cloud.mean()), terminal_se=float(cloud.std() / math.sqrt(len(cloud))), seconds=time.time() - t0),
                              pde=dict(dK=5.0, nsteps=440, K_range=[15000.0, 32000.0], scheme="Crank-Nicolson, Dupire forward PDE in K, sigma_L(K, t) at the step midpoint"))


# ------------------------------------------------------------------ the "-5 % day" panel: forward drops to 0.95 F; smiles at the same absolute strikes, new ATM vol and slope
F1 = 0.95 * F0
hk = 0.01
PANEL_STRIKES = CHECK_STRIKES


def panel(smile_fn, Fs):
    """smile_fn(Ks) -> IVs under the story with forward Fs. ATM = IV at Fs; slope = d sigma/dk over +-1 % in k."""
    lo, at, hi = smile_fn([Fs * math.exp(-hk), Fs, Fs * math.exp(hk)])
    return dict(F=Fs, atm_vol=float(at), slope=float((hi - lo) / (2 * hk)), iv_at_strikes=[float(x) for x in smile_fn(PANEL_STRIKES)])


hp, mp = fits["heston"]["params"], fits["merton"]["params"]
stories = {
    "local_vol": (lambda Ks, Fs: local_vol_pde_smile(Fs, Ks)),
    "heston": (lambda Ks, Fs: heston_smile(Fs, Ks, T0, hp["v0"], hp["kappa"], hp["theta"], hp["eta"], hp["rho"])),
    "merton": (lambda Ks, Fs: merton_smile(Fs, Ks, T0, mp["sigma"], mp["lam"], mp["muJ"], mp["sJ"])),
}
day = {"F_before": F0, "F_after": F1, "strikes": PANEL_STRIKES, "slope_h": hk,
       "rule": {"local_vol": "sticky-local: same sigma_loc(K, t) map (Dupire forward PDE from the new forward)", "heston": "same parameters, v0 unchanged: the smile slides with the forward in log-moneyness",
                "merton": "same parameters: slides with the forward in log-moneyness"}}
for name, fn in stories.items():
    before = panel(lambda Ks: fn(Ks, F0), F0)
    after = panel(lambda Ks: fn(Ks, F1), F1)
    verdict = "flattens" if abs(after["slope"]) < 0.5 * abs(before["slope"]) else ("slides" if abs(after["slope"] - before["slope"]) < 1e-6 and abs(after["atm_vol"] - before["atm_vol"]) < 1e-6 else "moves")
    day[name] = dict(before=before, after=after, verdict=verdict)
assert day["local_vol"]["verdict"] == "flattens" and day["heston"]["verdict"] == "slides" and day["merton"]["verdict"] == "slides", {k: day[k]["verdict"] for k in stories}
key["day_minus_5pct"] = day


# ------------------------------------------------------------------ the second expiry: Gatheral Table 3.1 SPX skews vs each fitted story's predicted skew
ts_rows = []
for Tm, lab, spx in [(1 / 365, "1d", -0.0955), (1 / 12, "1m", -0.1601), (21 / 12, "21m", -0.0594)]:
    hs = var_skew_fd(lambda Kx: heston_smile(1.0, Kx, Tm, hp["v0"], hp["kappa"], hp["theta"], hp["eta"], hp["rho"]), 0.01)
    ms = var_skew_fd(lambda Kx: merton_smile(1.0, Kx, Tm, mp["sigma"], mp["lam"], mp["muJ"], mp["sJ"]), 0.01)
    ts_rows.append(dict(T=Tm, label=lab, spx_var_skew=spx, heston_var_skew=hs[0], heston_atm_vol=hs[1], heston_321=heston_skew_321(Tm, hp["kappa"], hp["eta"], hp["rho"]),
                        merton_var_skew=ms[0], merton_atm_vol=ms[1], local_vol="n/a (needs dw/dT; one expiry does not have it)"))
chain_skew = var_skew_fd(lambda Kx: heston_smile(1.0, Kx, T0, hp["v0"], hp["kappa"], hp["theta"], hp["eta"], hp["rho"]), 0.01)
key["term_structure"] = dict(source="Gatheral Table 3.1 SPX ATM variance skews (textbook stand-in until the 24 Nov NIFTY row arrives)", rows=ts_rows,
                             chain_T=T0, chain_heston_var_skew=chain_skew[0], chain_quadratic_var_skew=2 * SA * SB,
                             note="var skew = d(sigma_BS^2)/dk at k = 0 over +-1 %; Heston (3.21) uses lambda' = kappa - rho eta/2; Merton: fitted model repriced at T")

# ------------------------------------------------------------------ write
out = os.path.join(fx, "key-D3.json")
with open(out, "w") as f:
    json.dump(key, f, indent=1, default=float)
print("wrote", out)
print(f"Lewis set: max |err| = {lewis_max_err:.2e} on U = {key['heston_lewis']['U']:.0f}, {key['heston_lewis']['n_nodes']} nodes")
print("standard set calls", [round(x, 4) for x in std_calls], "IVs", [round(100 * x, 2) for x in std_ivs], "GL vs quad", f"{key['heston_standard']['max_gl_vs_quad']:.1e}")
print("Gatheral 3.2:", [(r_["label"], round(100 * r_["atm_vol"], 2), round(r_["var_skew_fd"], 4), round(r_["var_skew_321"], 4)) for r_ in g32_rows])
print(f"Merton metricgate {mg:.4f} (BS {mg_bs:.4f}); Gatheral 5.2 IVs", [round(100 * x, 2) for x in key['merton_gatheral_5_2']['iv']])
print("SABR quantt", [round(100 * x, 2) for x in qv], "beta=1 ATM", s77)
print("Poisson lam=1:", [round(w, 4) for w in key["poisson_weights"]["1.0"]["weights"][:3]], "lam=5:", [round(w, 4) for w in key["poisson_weights"]["5.0"]["weights"][:3]])
for tag in ("quadratic", "sabr", "heston", "heston_k20", "merton", "merton_l5"):
    f_ = fits[tag]
    print(f"  {f_['name']:28s} rms {f_['rms_vol_pts']:.3f}  wings {100 * f_['wing_22000']:.2f} / {100 * f_['wing_23300']:.2f}  params", {k: round(v, 4) for k, v in f_['params'].items()})
print("Heston kappa 2 vs 20 max curve diff (vol pts):", {k: round(v, 4) for k, v in k2_vs_k20.items()})
print(f"local vol: 22000 {100 * key['local_vol']['at_22000']:.2f} %, 22750 {100 * key['local_vol']['at_22750']:.2f} %, min {100 * key['local_vol']['min_sigma_loc']:.2f} % at {key['local_vol']['min_K']:.0f}, 23300 {100 * key['local_vol']['at_23300']:.2f} %; "
      f"ATM slope local {key['local_vol']['atm_slope_local']:.3f} vs implied {SB:.3f}")
print(f"local-vol reprice: PDE max err {pde_err:.3f} vol pts (T-slice held constant: {pde_slice_err:.3f}); MC (seed {MC_SEED}) max err {mc_err:.3f} vol pts, mean {cloud.mean():.1f} +- {key['local_vol_check']['mc']['terminal_se']:.1f}")
for name in stories:
    b_, a_ = day[name]["before"], day[name]["after"]
    print(f"  -5 % {name:10s}: ATM {100 * b_['atm_vol']:.2f} -> {100 * a_['atm_vol']:.2f} %, slope {b_['slope']:.3f} -> {a_['slope']:.3f}  ({day[name]['verdict']}); "
          f"IV at 22,600: {100 * b_['iv_at_strikes'][7]:.2f} -> {100 * a_['iv_at_strikes'][7]:.2f} %")
print("term structure:", [(r_["label"], r_["spx_var_skew"], round(r_["heston_var_skew"], 4), round(r_["heston_321"], 4), round(r_["merton_var_skew"], 4)) for r_ in ts_rows])
