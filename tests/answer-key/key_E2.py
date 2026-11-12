"""Answer key for chapter E2 (Monte Carlo). numpy + scipy only.
-> apps/web/src/engine/__fixtures__/key-E2.json

The site's generator (engine/random.ts: mulberry32 + Box-Muller) is ported here bit-for-bit, so every seeded experiment the page runs is
reproduced exactly by the key; reference values that need many more draws use numpy with a fixed seed and are stored with their standard
errors. Exact quantities (correlations, antithetic ratios, the geometric Asian) are computed by quadrature, not simulation.

Conventions: the chain F 22,603, K 22,600, r 6.5 %, T 11/365, sigma 15.853 % (C3); terminal index S = F exp(-s^2 T/2 + s sqrt(T) Z);
discounted payoff per draw; SE = sample sd / sqrt(n) (ddof 1). Antithetic ratio = Var(f)/2 divided by Var((f(Z) + f(-Z))/2) — the variance of n
independent draws against n/2 mirrored pairs at equal cost. Control variate with X = S_T (E X = F): Y - b (X - F), b = Cov/Var.
"""
import json, math, os
import numpy as np
from scipy.stats import norm
from scipy.integrate import quad

here = os.path.dirname(os.path.abspath(__file__))
web = os.path.join(here, "..", "..", "apps", "web", "src")
kd1 = json.load(open(os.path.join(web, "engine", "__fixtures__", "key-D1.json")))
nifty = json.load(open(os.path.join(web, "data", "nifty50-long.json")))

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


def normal_sample(nxt):
    u1 = max(nxt(), 1e-12)
    u2 = nxt()
    return math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)


def normals(seed, n):
    nxt = mulberry32(seed)
    return np.array([normal_sample(nxt) for _ in range(n)])


F, K, R, T, SIG = 22603.0, 22600.0, 0.065, 11 / 365, kd1["realised"]["sold"]
D = math.exp(-R * T)
ST = SIG * math.sqrt(T)


def b76(F_, K_, T_, s, call=True):
    st = s * math.sqrt(T_)
    d1 = (math.log(F_ / K_) + 0.5 * st * st) / st
    d2 = d1 - st
    Dd = math.exp(-R * T_)
    return Dd * ((F_ * norm.cdf(d1) - K_ * norm.cdf(d2)) if call else (K_ * norm.cdf(-d2) - F_ * norm.cdf(-d1)))


def terminal(z):
    return F * np.exp(-0.5 * ST * ST + ST * z)


def call_pay(z):
    return D * np.maximum(terminal(z) - K, 0)


def straddle_pay(z):
    return D * np.abs(terminal(z) - K)


# ---- exact quantities by quadrature
def E(fn):
    return quad(lambda z: fn(z) * norm.pdf(z), -12, 12, limit=400)[0]


true_call = b76(F, K, T, SIG)
m1 = E(lambda z: float(call_pay(z)))
m2 = E(lambda z: float(call_pay(z)) ** 2)
var_call = m2 - m1 * m1
sd_call = math.sqrt(var_call)
pair = E(lambda z: 0.25 * (float(call_pay(z)) + float(call_pay(-z))) ** 2) - m1 * m1
anti_call = (var_call / 2) / pair
s1 = E(lambda z: float(straddle_pay(z)))
s2 = E(lambda z: float(straddle_pay(z)) ** 2)
var_str = s2 - s1 * s1
pair_s = E(lambda z: 0.25 * (float(straddle_pay(z)) + float(straddle_pay(-z))) ** 2) - s1 * s1
anti_str = (var_str / 2) / pair_s
# control variate with S_T
ex = E(lambda z: float(terminal(z)))
vx = E(lambda z: float(terminal(z)) ** 2) - ex * ex
cxy = E(lambda z: float(terminal(z)) * float(call_pay(z))) - ex * m1
rho_cv = cxy / math.sqrt(vx * var_call)
exact = dict(call=true_call, mean_payoff=m1, sd_payoff=sd_call, se_2000=sd_call / math.sqrt(2000), anti_ratio_call=anti_call,
             straddle_mean=s1, anti_ratio_straddle=anti_str, cv_rho=rho_cv, cv_rho2=rho_cv ** 2, cv_b=cxy / vx, cv_band_2000=sd_call * math.sqrt(1 - rho_cv ** 2) / math.sqrt(2000))


def rho_table(S0, s, r, Tt, Ks):
    out = []
    st = s * math.sqrt(Tt)
    for Kk in Ks:
        S = lambda z: S0 * math.exp((r - 0.5 * s * s) * Tt + st * z)
        f = lambda z: math.exp(-r * Tt) * max(S(z) - Kk, 0)
        ex_ = E(S)
        vx_ = E(lambda z: S(z) ** 2) - ex_ ** 2
        ef = E(f)
        vf = E(lambda z: f(z) ** 2) - ef ** 2
        c = E(lambda z: S(z) * f(z)) - ex_ * ef
        out.append(dict(K=Kk, rho=c / math.sqrt(vx_ * vf), rho2=c * c / (vx_ * vf)))
    return out


glasserman41 = dict(S0=50, sigma=0.3, r=0.05, T=0.25, rows=rho_table(50, 0.3, 0.05, 0.25, [40, 45, 50, 55, 60, 65, 70]),
                    book_rho=[0.995, 0.968, 0.895, 0.768, 0.604, 0.433, 0.286])
chain_rho = rho_table(F, SIG, 0.0, T, [22000, 22250, 22500, 22600, 22700, 23050, 23300])  # forward form: r = 0 in the drift, discount outside
# (the discount factor scales the payoff and leaves the correlation unchanged)

# ---- seeded experiments the page runs (exact in TS)
def experiment(seed, n):
    z = normals(seed, n)
    y = call_pay(z)
    return dict(seed=seed, n=n, price=float(y.mean()), se=float(y.std(ddof=1) / math.sqrt(n)))


rerolls = [experiment(s, 2000) for s in range(1, 21)]
inside = sum(1 for e in rerolls if abs(e["price"] - true_call) <= 1.96 * e["se"])
ladder = [experiment(1, n) for n in (100, 300, 1000, 3000, 10000, 30000, 100000)]
# log-log slope of |error| is noisy per run; store the SE ladder (deterministic law) and the realised errors
logn = np.log([e["n"] for e in ladder])
logse = np.log([e["se"] for e in ladder])
slope = float(np.polyfit(logn, logse, 1)[0])
# antithetic and control at seed 1, n = 2000 (1000 pairs for the antithetic)
z = normals(1, 2000)
y = call_pay(z)
zp = z[:1000]
ya = 0.5 * (call_pay(zp) + call_pay(-zp))
sa = straddle_pay(z)
sa_pair = 0.5 * (straddle_pay(zp) + straddle_pay(-zp))
x = terminal(z)
b = float(np.cov(x, y, ddof=1)[0, 1] / x.var(ddof=1))
ycv = y - b * (x - F)
seeded = dict(
    plain=dict(price=float(y.mean()), se=float(y.std(ddof=1) / math.sqrt(2000))),
    antithetic=dict(price=float(ya.mean()), se=float(ya.std(ddof=1) / math.sqrt(1000)), ratio=float((y.var(ddof=1) / 2) / ya.var(ddof=1))),
    straddle=dict(price=float(sa.mean()), se=float(sa.std(ddof=1) / math.sqrt(2000)), anti_se=float(sa_pair.std(ddof=1) / math.sqrt(1000)),
                  ratio=float((sa.var(ddof=1) / 2) / sa_pair.var(ddof=1))),
    control=dict(b=b, price=float(ycv.mean()), se=float(ycv.std(ddof=1) / math.sqrt(2000)), rho=float(np.corrcoef(x, y)[0, 1])),
    first_normals=normals(1, 5).tolist(),
)

# ---- the Asian what-if on the real dates
closes = {x["d"]: x["c"] for x in nifty["rows"]}
fix_dates = ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-11-02", "2026-11-03"]
import datetime as dt

d0 = dt.date(2026, 10, 23)
tt = np.array([(dt.date.fromisoformat(d) - d0).days for d in fix_dates]) / 365
dts = np.diff(np.concatenate([[0.0], tt]))
nfix = len(tt)
real_closes = [closes[d] for d in fix_dates]
real_avg = float(np.mean(real_closes))
# geometric closed form: ln G ~ N(ln F - s^2 tbar / 2, s^2 sum_ij min(ti,tj)/n^2)
tbar = float(tt.mean())
vG = SIG * SIG * sum(min(a, c) for a in tt for c in tt) / nfix ** 2
muG = math.log(F) - 0.5 * SIG * SIG * tbar
dG = (muG - math.log(K)) / math.sqrt(vG)
geo_closed = D * (math.exp(muG + 0.5 * vG) * norm.cdf(dG + math.sqrt(vG)) - K * norm.cdf(dG))


def asian_paths(Z):  # Z: (N, nfix) normals -> arithmetic and geometric averages
    inc = -0.5 * SIG * SIG * dts + SIG * np.sqrt(dts) * Z
    P = F * np.exp(np.cumsum(inc, axis=1))
    return P.mean(1), np.exp(np.log(P).mean(1)), P


rng_np = np.random.default_rng(0)
Zbig = rng_np.standard_normal((1_000_000, nfix))
A, G, _ = asian_paths(Zbig)
pa, pg = D * np.maximum(A - K, 0), D * np.maximum(G - K, 0)
bcv = float(np.cov(pa, pg)[0, 1] / pg.var())
pcv = pa - bcv * (pg - geo_closed)
Za = -Zbig[:500000]
A2, _, _ = asian_paths(Za)
pa2 = D * np.maximum(A2 - K, 0)
anti_pairs = 0.5 * (pa[:500000] + pa2)
reference = dict(arith=float(pa.mean()), arith_se=float(pa.std(ddof=1) / 1000), geo_mc=float(pg.mean()), geo_closed=geo_closed,
                 cv=float(pcv.mean()), cv_se=float(pcv.std(ddof=1) / 1000), cv_ratio=float(pa.var() / pcv.var()),
                 anti_ratio=float((pa.var() / 2) / anti_pairs.var()), N=1_000_000)
# seeded small run (TS reproduces exactly): 2,000 paths, normals drawn path by path in fixing order
zs = normals(2, 2000 * nfix).reshape(2000, nfix)
As, Gs, Ps = asian_paths(zs)
pas, pgs = D * np.maximum(As - K, 0), D * np.maximum(Gs - K, 0)
bs_ = float(np.cov(pas, pgs, ddof=1)[0, 1] / pgs.var(ddof=1))
pcs = pas - bs_ * (pgs - geo_closed)
asian = dict(fix_dates=fix_dates, t=tt.tolist(), real_closes=real_closes, real_avg=real_avg, real_payoff=max(real_avg - K, 0), K=K,
             european=true_call, geo_closed=geo_closed, vG=vG, muG=muG, reference=reference,
             seeded=dict(seed=2, n=2000, arith=float(pas.mean()), arith_se=float(pas.std(ddof=1) / math.sqrt(2000)), geo=float(pgs.mean()),
                         b=bs_, cv=float(pcs.mean()), cv_se=float(pcs.std(ddof=1) / math.sqrt(2000)), ratio=float(pas.var(ddof=1) / pcs.var(ddof=1)),
                         first_path=Ps[0].tolist(), endpoint_sd=float(Ps[:, -1].std(ddof=1)), average_sd=float(As.std(ddof=1))))

# ---- Hull §18.7 checks
hull = dict(stratified4=[float(norm.ppf((i + 0.5) / 4)) for i in range(4)], twelve_uniform=dict(var=1.0, kurtosis=3 - 1.2 / 12, p_abs_gt6=0.0, normal_p_abs_gt6=float(2 * norm.sf(6))),
            se_rule="omega/sqrt(M): quadruple the trials to halve the error")

# ---- Monte Carlo VaR on Raj's book, two correlated risks (index, implied vol) — the vol series is a labelled stand-in
sig_day = float(np.std([x["r"] for x in nifty["returns"]]))
vol_rel_sd, rho_iv = 0.06, -0.6  # stand-in until India VIX closes arrive: daily relative move of the IV, its correlation with the index
N_SHORT, H = 6500, 3292
C0 = b76(F, K, T, SIG)


def book_pnl(x, dv, h):
    F1 = F * np.exp(x)
    s1 = SIG * (1 + dv)
    opt = np.array([b76(f, K, T - 1 / 365, s) for f, s in zip(F1, s1)])
    return h * (F1 - F) - N_SHORT * (opt - C0)


def mc_var(seed, n, rho, h=H, vol_moves=True):
    z = normals(seed, 2 * n).reshape(n, 2)
    x = sig_day * z[:, 0]
    dv = vol_rel_sd * (rho * z[:, 0] + math.sqrt(1 - rho * rho) * z[:, 1]) if vol_moves else np.zeros(n)
    p = book_pnl(x, dv, h)
    loss = np.sort(-p)[::-1]
    k = int(math.ceil(0.01 * n))
    # bootstrap band of the quantile
    bs = np.random.default_rng(seed)
    qs = [np.sort(-bs.choice(p, n))[::-1][k - 1] for _ in range(400)]
    return dict(seed=seed, n=n, rho=rho, h=h, vol_moves=vol_moves, var99=float(loss[k - 1]), es99=float(loss[:k].mean()), boot_sd=float(np.std(qs)), boot_rel=float(np.std(qs) / loss[k - 1]),
                first_pnl=p[:3].tolist())


mcvar = dict(sig_day=sig_day, vol_rel_sd=vol_rel_sd, rho=rho_iv, stand_in=True, short=N_SHORT, hedge=H,
             corr=mc_var(7, 5000, rho_iv), indep=mc_var(7, 5000, 0.0), frozen=mc_var(7, 5000, 0.0, H, False),
             grid=[mc_var(7, 5000, rho, h) for h in (H, 0) for rho in (-0.6, 0.0, 0.6)],
             lesson="an 11-day at-the-money book is a gamma book: its vega is small, so the index-vol correlation moves its VaR by a few percent; the unhedged short call feels the sign of the correlation (vol falls when the index rises)",
             quantile_se_rule="sqrt(p(1-p)/n)/f(q): the tail is where the draws are thin")

key = dict(chain=dict(F=F, K=K, r=R, T=T, sigma=SIG), exact=exact, glasserman41=glasserman41, chain_rho=chain_rho, rerolls=rerolls, inside_95=inside,
           ladder=ladder, ladder_slope=slope, seeded=seeded, asian=asian, hull=hull, mcvar=mcvar,
           pi=dict(p=math.pi / 4, se_10k=4 * math.sqrt(math.pi / 4 * (1 - math.pi / 4) / 10000), se_1m=4 * math.sqrt(math.pi / 4 * (1 - math.pi / 4) / 1e6)))
with open(os.path.join(web, "engine", "__fixtures__", "key-E2.json"), "w") as f:
    json.dump(key, f, indent=1, default=float)

print("exact:", {k: round(v, 4) for k, v in exact.items()})
print("rerolls:", [round(e["price"], 1) for e in rerolls], "inside", inside, "/ 20")
print("ladder:", [(e["n"], round(e["price"], 2), round(e["se"], 2)) for e in ladder], "slope", round(slope, 3))
print("seeded:", {k: v for k, v in seeded.items() if k != "first_normals"})
print("asian ref:", reference, "\nasian seeded:", {k: v for k, v in asian["seeded"].items() if k != "first_path"})
print("mcvar:", mcvar["corr"], mcvar["indep"])
print("T4.1:", [round(r_["rho"], 3) for r_ in glasserman41["rows"]], "chain:", [(r_["K"], round(r_["rho2"], 3)) for r_ in chain_rho])
