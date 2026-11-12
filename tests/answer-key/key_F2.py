"""Answer key for chapter F2 (Longstaff-Schwartz, calibration, automatic differentiation). numpy + scipy only.
-> apps/web/src/engine/__fixtures__/key-F2.json

Conventions:
- Longstaff-Schwartz as Hull 5e §20.9 / Longstaff & Schwartz (2001): regress the discounted continuation cash flow on (1, S, S^2) over the
  in-the-money paths at each exercise date (ordinary least squares), exercise where intrinsic > fitted continuation, discount realised cash
  flows to time zero and average. The eight-path example uses Hull's Table 20.1 paths and his rounding where he rounds (his a, b, c are
  printed to 3 d.p.; we store both exact and rounded).
- At scale: Hull Example 18.1's American put (S 50, K 50, r 10 %, sigma 40 %, T 5/12) on 50 exercise dates, GBM paths from the site's rng
  (mulberry32 + Box-Muller, ported bit for bit) for the seeded runs the page shows, numpy for the 200,000-path reference; truth = F1's
  converged grid 4.2839. The LSM price is a low-biased estimate (Glasserman 8.6) and is reported with its standard error.
- Calibration: SABR (beta = 1, Hagan) fitted to the real chain's 34 implied vols (D3's dots) by least squares; the objective surface over
  (rho, nu) at the fitted alpha; the valley direction; the fit's rms (key-D3: 0.160 vol pts).
- Automatic differentiation: forward mode (dual numbers) through Black-76 gives delta, vega, theta to machine precision; bump-and-revalue
  errors for h from 1e-1 to 1e-12 (the V of truncation against round-off, Glasserman §7.1); Monte Carlo pathwise delta e^{-rT} 1{S_T > K} S_T/F
  (Glasserman §7.2) against bumped Monte Carlo with and without common random numbers.
"""
import json, math, os
import numpy as np
from scipy.stats import norm

here = os.path.dirname(os.path.abspath(__file__))
web = os.path.join(here, "..", "..", "apps", "web", "src")
kd1 = json.load(open(os.path.join(web, "engine", "__fixtures__", "key-D1.json")))
kd3 = json.load(open(os.path.join(web, "engine", "__fixtures__", "key-D3.json")))
kf1 = json.load(open(os.path.join(web, "engine", "__fixtures__", "key-F1.json")))

MASK = 0xFFFFFFFF


def imul(a, b):
    return (a * b) & MASK


def mulberry32(seed):
    a = seed & MASK

    def nxt():
        nonlocal a
        a = (a + 0x6D2B79F5) & MASK
        t = a
        t = imul(t ^ (t >> 15), t | 1)
        t ^= (t + imul(t ^ (t >> 7), t | 61)) & MASK
        t &= MASK
        return ((t ^ (t >> 14)) & MASK) / 4294967296

    return nxt


def normals(seed, n):
    nxt = mulberry32(seed)
    out = np.empty(n)
    for i in range(n):
        u1 = max(nxt(), 1e-12)
        u2 = nxt()
        out[i] = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
    return out


# ------------------------------------------------------------------ 1. Hull's eight paths (Table 20.1)
paths8 = np.array([
    [1.00, 1.09, 1.08, 1.34], [1.00, 1.16, 1.26, 1.54], [1.00, 1.22, 1.07, 1.03], [1.00, 0.93, 0.97, 0.92],
    [1.00, 1.11, 1.56, 1.52], [1.00, 0.76, 0.77, 0.90], [1.00, 0.92, 0.84, 1.01], [1.00, 0.88, 1.22, 1.34]])
K8, r8 = 1.10, 0.06
D8 = math.exp(-r8)


def lsm_small(paths, K, D, record=True):
    n, m = paths.shape
    steps = m - 1
    cash = np.zeros((n, steps + 1))
    cash[:, steps] = np.maximum(K - paths[:, steps], 0)
    rounds = []
    for t in range(steps - 1, 0, -1):
        itm = np.where(K - paths[:, t] > 0)[0]
        # discounted continuation: next realised cash flow (one per path, at most one non-zero later)
        Y = np.array([sum(cash[i, s] * D ** (s - t) for s in range(t + 1, steps + 1)) for i in itm])
        X = paths[itm, t]
        A = np.vstack([np.ones_like(X), X, X * X]).T
        coef, *_ = np.linalg.lstsq(A, Y, rcond=None)
        cont = A @ coef
        ex = K - X
        exercise = ex > cont
        for k, i in enumerate(itm):
            if exercise[k]:
                cash[i, :] = 0
                cash[i, t] = ex[k]
        rounds.append(dict(t=t, paths=(itm + 1).tolist(), S=X.tolist(), Y=Y.tolist(), coef=coef.tolist(), continuation=cont.tolist(), exercise_value=ex.tolist(),
                           exercise=exercise.tolist()))
    pv = sum(cash[i, s] * D ** s for i in range(n) for s in range(1, steps + 1)) / n
    return pv, cash, rounds


pv8, cash8, rounds8 = lsm_small(paths8, K8, D8)
hull209 = dict(paths=paths8.tolist(), K=K8, r=r8, price=pv8, book_price=0.1144, immediate=K8 - 1.0, cash=cash8[:, 1:].tolist(), rounds=rounds8,
               book=dict(t2=dict(coef=[-1.070, 2.983, -1.813], continuation=[0.0369, 0.0461, 0.1176, 0.1520, 0.1565], exercise=[4, 6, 7]),
                         t1=dict(coef=[2.038, -3.335, 1.356], continuation=[0.0139, 0.1092, 0.2866, 0.1175, 0.1533], exercise=[4, 6, 7, 8])),
               european_8paths=float(np.mean(np.maximum(K8 - paths8[:, 3], 0)) * D8 ** 3))

# ------------------------------------------------------------------ 2. LSM at scale on Hull Example 18.1's put
S0, K, R, SIG, T = 50.0, 50.0, 0.10, 0.40, 5 / 12
STEPS = 50
TRUE_AM = kf1["hull"]["converged_american"]
dt = T / STEPS
Dstep = math.exp(-R * dt)


def bs_put(S, K_, r, s, T_):
    d1 = (math.log(S / K_) + (r + 0.5 * s * s) * T_) / (s * math.sqrt(T_))
    d2 = d1 - s * math.sqrt(T_)
    return K_ * math.exp(-r * T_) * norm.cdf(-d2) - S * norm.cdf(-d1)


EURO = bs_put(S0, K, R, SIG, T)


def gbm_paths(Z):
    n, m = Z.shape
    inc = (R - 0.5 * SIG * SIG) * dt + SIG * math.sqrt(dt) * Z
    return S0 * np.exp(np.cumsum(inc, axis=1))


def lsm(paths, basis="quad", antithetic=False):
    n, m = paths.shape
    V = np.maximum(K - paths[:, m - 1], 0)  # value carried back (already at date m-1)
    boundary = []
    for t in range(m - 2, -1, -1):
        V = V * Dstep
        S = paths[:, t]
        itm = K - S > 0
        if itm.sum() >= 3:
            X = S[itm]
            x = X / K
            cols = [np.ones_like(x), x, x * x] if basis == "quad" else [np.ones_like(x), x, x * x, x ** 3]
            A = np.vstack(cols).T
            coef, *_ = np.linalg.lstsq(A, V[itm], rcond=None)
            cont = A @ coef
            ex = K - X
            doit = ex > cont
            Vi = V[itm].copy()
            Vi[doit] = ex[doit]
            V[itm] = Vi
            # boundary: largest S among exercised paths
            boundary.append(float(X[doit].max()) if doit.any() else 0.0)
        else:
            boundary.append(0.0)
    V = V * Dstep  # back to time 0 from date 0? dates: t = 0 .. m-1 are the exercise dates 1..m (no exercise at time 0)
    return float(V.mean()), float(V.std(ddof=1) / math.sqrt(n)), boundary[::-1]


# paths: Z of shape (n, STEPS); date index t corresponds to time (t+1) dt; exercise allowed at every date including the last
rng = np.random.default_rng(0)
Zbig = rng.standard_normal((200000, STEPS))
ref_price, ref_se, ref_boundary = lsm(gbm_paths(Zbig))
ref_cubic = lsm(gbm_paths(Zbig), basis="cubic")[:2]
ladder = []
for n in (1000, 2000, 5000, 10000, 20000, 50000):
    p, se, _ = lsm(gbm_paths(Zbig[:n]))
    ladder.append(dict(n=n, price=p, se=se))
# seeded small run (TS reproduces exactly): seed 5, 2,000 paths, normals path by path in step order
Zs = normals(5, 2000 * STEPS).reshape(2000, STEPS)
seed_price, seed_se, seed_boundary = lsm(gbm_paths(Zs))
seed_euro = float(np.mean(np.maximum(K - gbm_paths(Zs)[:, -1], 0)) * math.exp(-R * T))
lsm_scale = dict(S0=S0, K=K, r=R, sigma=SIG, T=T, steps=STEPS, truth_grid=TRUE_AM, european_bs=EURO,
                 reference=dict(n=200000, price=ref_price, se=ref_se, cubic_price=ref_cubic[0], cubic_se=ref_cubic[1], boundary=ref_boundary),
                 ladder=ladder, seeded=dict(seed=5, n=2000, price=seed_price, se=seed_se, european_same_paths=seed_euro, boundary=seed_boundary, first_path=gbm_paths(Zs)[0].tolist()),
                 low_bias_note="LSM exercises on an estimated rule, so its mean is at or below the true price (Glasserman 8.6); the gap to the grid's 4.284 is the price of estimating the rule from the same paths")

# ------------------------------------------------------------------ 3. Calibration: SABR on the real 34 dots
ch = kd3["chain"]
F, Tc = ch["F"], ch["T"]
strikes = np.array(ch["strikes"] * 2, float)
ivs = np.array(ch["call_iv"] + ch["put_iv"], float)
fit = kd3["fits"]["sabr"]["params"]


def sabr(Fx, Kx, Tx, alpha, rho, nu, beta=1.0):
    lg = np.log(Fx / Kx)
    FK = (Fx * Kx) ** ((1 - beta) / 2)
    B = 1 + (((1 - beta) ** 2 / 24) * alpha * alpha / (FK * FK) + 0.25 * rho * beta * nu * alpha / FK + ((2 - 3 * rho * rho) / 24) * nu * nu) * Tx
    z = (nu / alpha) * FK * lg
    x = np.log((np.sqrt(1 - 2 * rho * z + z * z) + z - rho) / (1 - rho))
    with np.errstate(divide="ignore", invalid="ignore"):
        ratio = np.where(np.abs(z) < 1e-10, 1.0, z / x)
    denom = FK * (1 + ((1 - beta) ** 2 / 24) * lg ** 2 + ((1 - beta) ** 4 / 1920) * lg ** 4)
    return alpha / denom * ratio * B


def rms(alpha, rho, nu):
    return float(100 * np.sqrt(np.mean((sabr(F, strikes, Tc, alpha, rho, nu) - ivs) ** 2)))


rhos = np.linspace(-0.9, 0.3, 25)
nus = np.linspace(0.5, 5.0, 19)
surface = [[rms(fit["alpha"], rh, nu) for nu in nus] for rh in rhos]
# alpha re-fitted at each (rho, nu) by matching the ATM vol (the fast inner step desks use)
atm_iv = float(np.interp(F, ch["strikes"], ch["call_iv"]))


def alpha_for(rho, nu):
    # solve sabr ATM = atm_iv for alpha (beta 1: atm = alpha (1 + (rho nu alpha /4 + (2-3rho^2) nu^2/24) T)); fixed point
    a = atm_iv
    for _ in range(50):
        a = atm_iv / (1 + (0.25 * rho * nu * a + (2 - 3 * rho * rho) / 24 * nu * nu) * Tc)
    return a


surface_atm = [[rms(alpha_for(rh, nu), rh, nu) for nu in nus] for rh in rhos]
best = min(((surface_atm[i][j], rhos[i], nus[j]) for i in range(len(rhos)) for j in range(len(nus))))
# the valley: along the ridge, the rms stays within 0.05 vol pts of the minimum for a long stretch
within = [(float(rhos[i]), float(nus[j])) for i in range(len(rhos)) for j in range(len(nus)) if surface_atm[i][j] < best[0] + 0.05]
calib = dict(F=F, T=Tc, strikes=strikes.tolist(), ivs=ivs.tolist(), fit=fit, fit_rms=kd3["fits"]["sabr"]["rms_vol_pts"], rhos=rhos.tolist(), nus=nus.tolist(),
             surface_alpha_fixed=surface, surface_alpha_atm=surface_atm, best_on_grid=dict(rms=best[0], rho=float(best[1]), nu=float(best[2])), atm_iv=atm_iv,
             valley_points=within, valley_rho_range=[min(p[0] for p in within), max(p[0] for p in within)], valley_nu_range=[min(p[1] for p in within), max(p[1] for p in within)],
             rms_at_fit=rms(fit["alpha"], fit["rho"], fit["nu"]), rms_at_rho0=rms(alpha_for(0.0, fit["nu"]), 0.0, fit["nu"]), rms_flat=float(100 * np.sqrt(np.mean((ivs - ivs.mean()) ** 2))),
             heston_kappa_note=kd3["heston_kappa_unidentifiable_max_diff_vol_pts"])

# ------------------------------------------------------------------ 4. Automatic differentiation
Fc, Kc, rc, Tcc, sc = 22603.0, 22600.0, 0.065, 11 / 365, kd1["realised"]["sold"]


class Dual:
    __slots__ = ("v", "d")

    def __init__(self, v, d=0.0):
        self.v, self.d = float(v), float(d)

    def __add__(s, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(s.v + o.v, s.d + o.d)

    __radd__ = __add__

    def __sub__(s, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(s.v - o.v, s.d - o.d)

    def __rsub__(s, o):
        return Dual(o) - s

    def __mul__(s, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(s.v * o.v, s.v * o.d + s.d * o.v)

    __rmul__ = __mul__

    def __truediv__(s, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(s.v / o.v, (s.d * o.v - s.v * o.d) / (o.v * o.v))

    def __neg__(s):
        return Dual(-s.v, -s.d)


def dlog(x):
    return Dual(math.log(x.v), x.d / x.v)


def dsqrt(x):
    r = math.sqrt(x.v)
    return Dual(r, x.d / (2 * r))


def dexp(x):
    e = math.exp(x.v)
    return Dual(e, e * x.d)


def dcdf(x):
    return Dual(norm.cdf(x.v), norm.pdf(x.v) * x.d)


def b76_dual(F_, K_, r_, T_, s_):
    st = s_ * dsqrt(T_)
    d1 = (dlog(F_ / K_) + Dual(0.5) * st * st) / st
    d2 = d1 - st
    D = dexp(-r_ * T_)
    return D * (F_ * dcdf(d1) - K_ * dcdf(d2)), d1, d2


def b76f(F_, K_, r_, T_, s_):
    return b76_dual(Dual(F_), Dual(K_), Dual(r_), Dual(T_), Dual(s_))[0].v


price = b76f(Fc, Kc, rc, Tcc, sc)
delta = b76_dual(Dual(Fc, 1), Dual(Kc), Dual(rc), Dual(Tcc), Dual(sc))[0].d
vega = b76_dual(Dual(Fc), Dual(Kc), Dual(rc), Dual(Tcc), Dual(sc, 1))[0].d
theta = -b76_dual(Dual(Fc), Dual(Kc), Dual(rc), Dual(Tcc, 1), Dual(sc))[0].d  # per year, calendar
rho_ = b76_dual(Dual(Fc), Dual(Kc), Dual(rc, 1), Dual(Tcc), Dual(sc))[0].d
# closed forms
st = sc * math.sqrt(Tcc)
d1 = (math.log(Fc / Kc) + 0.5 * st * st) / st
Dd = math.exp(-rc * Tcc)
closed = dict(delta=Dd * norm.cdf(d1), vega=Dd * Fc * norm.pdf(d1) * math.sqrt(Tcc), theta=-(Dd * Fc * norm.pdf(d1) * sc / (2 * math.sqrt(Tcc)) - rc * price), rho=-Tcc * price)
# the tape: intermediate values and their derivatives wrt F
tape = []
Fd = Dual(Fc, 1)
lg = dlog(Fd / Dual(Kc))
tape.append(dict(node="ln(F/K)", value=lg.v, dF=lg.d))
std = Dual(sc) * dsqrt(Dual(Tcc))
d1d = (lg + Dual(0.5) * std * std) / std
tape.append(dict(node="d1", value=d1d.v, dF=d1d.d))
d2d = d1d - std
tape.append(dict(node="d2", value=d2d.v, dF=d2d.d))
N1 = dcdf(d1d)
tape.append(dict(node="N(d1)", value=N1.v, dF=N1.d))
N2 = dcdf(d2d)
tape.append(dict(node="N(d2)", value=N2.v, dF=N2.d))
pd = Dual(Dd) * (Fd * N1 - Dual(Kc) * N2)
tape.append(dict(node="price", value=pd.v, dF=pd.d))
# bump-and-revalue errors (central and forward differences) for delta
bumps = []
for e in range(1, 13):
    h = 10.0 ** (-e) * Fc  # relative bump
    fwd = (b76f(Fc + h, Kc, rc, Tcc, sc) - price) / h
    cen = (b76f(Fc + h, Kc, rc, Tcc, sc) - b76f(Fc - h, Kc, rc, Tcc, sc)) / (2 * h)
    bumps.append(dict(rel=10.0 ** (-e), h=h, forward=fwd, central=cen, err_forward=fwd - closed["delta"], err_central=cen - closed["delta"]))
# Monte Carlo delta: pathwise vs bumped, 20,000 draws (seeded, TS-exact)
z = normals(9, 20000)
STc = Fc * np.exp(-0.5 * st * st + st * z)
pay = Dd * np.maximum(STc - Kc, 0)
pathwise = Dd * (STc > Kc) * STc / Fc
h = 0.01 * Fc
ST_up = (Fc + h) * np.exp(-0.5 * st * st + st * z)
ST_dn = (Fc - h) * np.exp(-0.5 * st * st + st * z)
bump_crn = Dd * (np.maximum(ST_up - Kc, 0) - np.maximum(ST_dn - Kc, 0)) / (2 * h)
z2 = normals(10, 20000)
ST_up2 = (Fc + h) * np.exp(-0.5 * st * st + st * z2)
bump_indep = Dd * (np.maximum(ST_up2 - Kc, 0) - np.maximum(STc - Kc, 0)) / h
mc = dict(n=20000, seed=9, seed_indep=10, bump_rel=0.01,
          pathwise=dict(mean=float(pathwise.mean()), se=float(pathwise.std(ddof=1) / math.sqrt(20000))),
          bump_crn=dict(mean=float(bump_crn.mean()), se=float(bump_crn.std(ddof=1) / math.sqrt(20000))),
          bump_indep=dict(mean=float(bump_indep.mean()), se=float(bump_indep.std(ddof=1) / math.sqrt(20000))),
          digital_note="for a digital payoff 1{S_T > K} the pathwise derivative is zero almost everywhere and the estimator fails (Glasserman 7.2); vibrato / likelihood-ratio methods exist")
ad = dict(chain=dict(F=Fc, K=Kc, r=rc, T=Tcc, sigma=sc), price=price, dual=dict(delta=delta, vega=vega, theta=theta, rho=rho_), closed=closed, tape=tape, bumps=bumps, mc=mc,
          cost_note="forward mode costs one extra pass per input; reverse mode (adjoint) costs one extra pass for ALL inputs at once — Giles & Glasserman 2006")

key = dict(hull209=hull209, lsm=lsm_scale, calib=calib, ad=ad)
with open(os.path.join(web, "engine", "__fixtures__", "key-F2.json"), "w") as f:
    json.dump(key, f, indent=1, default=float)

print("8 paths:", round(pv8, 4), "book 0.1144 | rounds:", [(r_["t"], [round(c, 3) for c in r_["coef"]], [round(c, 4) for c in r_["continuation"]], [p for p, e in zip(r_["paths"], r_["exercise"]) if e]) for r_ in rounds8])
print("LSM scale: ref", ref_price, "±", ref_se, "cubic", ref_cubic, "grid", TRUE_AM, "euro", EURO, "| ladder", [(l["n"], round(l["price"], 3)) for l in ladder], "| seeded", seed_price, seed_se)
print("calib: fit rms", calib["rms_at_fit"], "best grid", calib["best_on_grid"], "valley rho", calib["valley_rho_range"], "nu", calib["valley_nu_range"], "rho0", calib["rms_at_rho0"], "flat", calib["rms_flat"])
print("AD:", ad["dual"], "\nclosed:", closed, "\nbumps:", [(b["rel"], round(b["err_forward"], 10), round(b["err_central"], 12)) for b in bumps])
print("MC delta:", mc["pathwise"], mc["bump_crn"], mc["bump_indep"])
