"""Answer key for chapter E1 (Value at Risk and Expected Shortfall). numpy + scipy only.
-> apps/web/src/engine/__fixtures__/key-E1.json

Conventions (stated on the page):
- P&L of ₹1 crore long NIFTY on day t = 1e7 (e^{r_t} - 1), r_t the daily log return from data/nifty50-long.json.
- Historical VaR at level p on n P&Ls: the k-th worst loss with k = ceil(p n) (n = 2,683, p = 1 % -> the 27th worst). ES = mean of the k worst.
- Parametric: mean zero, VaR = z_p sigma with sigma the population sd (ddof 0); ES = sigma phi(z_p)/p.
- Backtest: rolling window of W = 500 days strictly before the day; three fences — historical (k = 5), normal with the window's sd, normal
  with an EWMA(0.94) variance started at the first window's variance and updated after every day. An exception is loss > fence.
- Kupiec POF: LR = -2 ln[(1-p)^{T-x} p^x] + 2 ln[(1-x/T)^{T-x} (x/T)^x] ~ chi2(1).
- Raj's book (D1): short 6,500 of the 22,600 call (Black-76 on F = 22,603, r = 6.5 %, T = 11/365, sigma = key-D1 sold vol), long h futures
  (h = 3,292 by default, the D1 ledger's first trade rounded). One-day P&L under a log move x: the futures move F(e^x - 1) times h, the
  option repriced at F e^x with T - 1/365. Full revaluation uses the 2,683 real daily moves as the scenario set. The delta-gamma model
  uses a normal x with the record's daily sd and the quadratic P = a x + b x^2 (a = (h - 6500 Delta) F, b = -6500 Gamma F^2 / 2 + a / 2,
  from d F = F (e^x - 1) ~ F (x + x^2/2)) solved exactly for its 1 % quantile.
"""
import json, math, os
import numpy as np
from scipy.stats import norm, binom, chi2
from scipy.optimize import brentq

here = os.path.dirname(os.path.abspath(__file__))
web = os.path.join(here, "..", "..", "apps", "web", "src")
nifty = json.load(open(os.path.join(web, "data", "nifty50-long.json")))
kd1 = json.load(open(os.path.join(web, "engine", "__fixtures__", "key-D1.json")))

V = 1e7
dates = [x["d"] for x in nifty["returns"]]
r = np.array([x["r"] for x in nifty["returns"]], float)
pnl = V * (np.exp(r) - 1.0)
loss = -pnl
n = len(r)
Z99, Z95 = norm.ppf(0.99), norm.ppf(0.95)


def hist_var(losses, p):
    k = int(math.ceil(p * len(losses)))
    s = np.sort(losses)[::-1]
    return float(s[k - 1]), float(s[:k].mean()), k


v99, es99, k99 = hist_var(loss, 0.01)
v95, es95, k95 = hist_var(loss, 0.05)
sd = float(pnl.std())
worst = np.argsort(loss)[::-1][:5]
record = dict(
    n=n, first=dates[0], last=dates[-1], notional=V, k99=k99, k95=k95,
    hist_var99=v99, hist_es99=es99, hist_var95=v95, hist_es95=es95,
    sd=sd, mean=float(pnl.mean()),
    param_var99=Z99 * sd, param_var95=Z95 * sd, param_es99=sd * norm.pdf(Z99) / 0.01, param_es95=sd * norm.pdf(Z95) / 0.05,
    worst=[dict(date=dates[i], loss=float(loss[i])) for i in worst],
    beyond_bell_99=int((loss > Z99 * sd).sum()),  # days past the bell's 1 % line
    beyond_hist_99=k99,
)
# 10-day overlapping
l10 = -V * (np.exp(np.convolve(r, np.ones(10), "valid")) - 1)
record["hist_var99_10d"] = hist_var(l10, 0.01)[0]
record["sqrt10_hist"] = math.sqrt(10) * v99
record["sqrt10_param"] = math.sqrt(10) * Z99 * sd

# ---- backtest
W = 500
T = n - W
hist_f, norm_f, ewma_f = np.zeros(T), np.zeros(T), np.zeros(T)
lam = 0.94
var_e = float(pnl[:W].var())
for i, t in enumerate(range(W, n)):
    win = loss[t - W:t]
    hist_f[i] = np.sort(win)[::-1][int(math.ceil(0.01 * W)) - 1]
    norm_f[i] = Z99 * pnl[t - W:t].std()
    ewma_f[i] = Z99 * math.sqrt(var_e)
    var_e = lam * var_e + (1 - lam) * pnl[t] ** 2
test_loss = loss[W:]
test_dates = dates[W:]


def kupiec(x, T, p=0.01):
    if x == 0:
        return float(-2 * T * math.log(1 - p))
    return float(-2 * ((T - x) * math.log(1 - p) + x * math.log(p)) + 2 * ((T - x) * math.log(1 - x / T) + x * math.log(x / T)))


def bt(fence, name):
    exc = test_loss > fence
    x = int(exc.sum())
    return dict(name=name, exceptions=x, dates=[d for d, e in zip(test_dates, exc) if e],
                p_at_least=float(1 - binom.cdf(x - 1, T, 0.01)), kupiec_lr=kupiec(x, T), kupiec_p=float(1 - chi2.cdf(kupiec(x, T), 1)))


backtest = dict(window=W, T=T, expected=0.01 * T, kupiec_crit=float(chi2.ppf(0.95, 1)),
                historical=bt(hist_f, "historical"), normal=bt(norm_f, "normal, 500-day sd"), ewma=bt(ewma_f, "normal, EWMA 0.94"),
                basel=dict(green=[0, 4], yellow=[5, 9], red=10))
# March 2020 inset + ghost day
i23 = test_dates.index("2020-03-23")
backtest["march2020"] = dict(fence_on_20mar=float(hist_f[i23]), loss_23mar=float(test_loss[i23]), ratio=float(test_loss[i23] / hist_f[i23]),
                             exceptions_in_month=sum(1 for d in backtest["historical"]["dates"] if d.startswith("2020-03")),
                             expected_in_month=0.01 * sum(1 for d in test_dates if d.startswith("2020-03")))
# ghost: the window sheds the Feb-Mar 2020 cluster day by day; the fence on the last day that still holds 28 Feb 2020 against the first
# day that holds none of the cluster's exception days (the last of them, 23 Mar 2020, has left)
i_first = next(i for i, t in enumerate(range(W, n)) if dates[t - W] > "2020-02-28") - 1
i_last = next(i for i, t in enumerate(range(W, n)) if dates[t - W] > "2020-03-23")
backtest["ghost"] = dict(start=test_dates[i_first], end=test_dates[i_last], before=float(hist_f[i_first]), after=float(hist_f[i_last]),
                         drop=float(1 - hist_f[i_last] / hist_f[i_first]), days_between=i_last - i_first,
                         note="nothing happened in the market between these dates; the 2020 cluster fell out of the 500-day window")
fences = dict(dates=test_dates, loss=test_loss.tolist(), historical=hist_f.tolist(), normal=norm_f.tolist(), ewma=ewma_f.tolist())

# ---- Raj's book
F0, K, rr, T0 = 22603.0, 22600.0, 0.065, 11 / 365
sigma = kd1["realised"]["sold"]
N_SHORT, H = 6500, 3292
sig_d = float(r.std())


def b76(F, K, T, s):
    st = s * math.sqrt(T)
    d1 = (math.log(F / K) + 0.5 * st * st) / st
    d2 = d1 - st
    return math.exp(-rr * T) * (F * norm.cdf(d1) - K * norm.cdf(d2))


def greeks(F, K, T, s):
    st = s * math.sqrt(T)
    d1 = (math.log(F / K) + 0.5 * st * st) / st
    D = math.exp(-rr * T)
    return D * norm.cdf(d1), D * norm.pdf(d1) / (F * st)


C0 = b76(F0, K, T0, sigma)
delta, gamma = greeks(F0, K, T0, sigma)
theta_day = (b76(F0, K, T0 - 1 / 365, sigma) - C0) * (-N_SHORT)  # positive for the short


def book_pnl(x, h):
    F1 = F0 * np.exp(x)
    opt = np.array([b76(f, K, T0 - 1 / 365, sigma) for f in np.atleast_1d(F1)])
    return h * (F1 - F0) - N_SHORT * (opt - C0)


def linear_var(h):
    return Z99 * abs(h - N_SHORT * delta) * F0 * sig_d


def quad_var(h, p=0.01):
    """exact 1 % quantile of P = a x + b x^2, x ~ N(0, sig_d^2) (no theta)."""
    a = (h - N_SHORT * delta) * F0
    b = -0.5 * N_SHORT * gamma * F0 ** 2 + 0.5 * a
    s = sig_d

    def cdf(q):  # P(a x + b x^2 <= q)
        if abs(b) < 1e-12:
            return norm.cdf(q / (a * s)) if a > 0 else 1 - norm.cdf(q / (a * s))
        disc = a * a + 4 * b * q
        if disc < 0:
            return 1.0 if b < 0 else 0.0
        x1, x2 = sorted([(-a - math.sqrt(disc)) / (2 * b), (-a + math.sqrt(disc)) / (2 * b)])
        inside = norm.cdf(x2 / s) - norm.cdf(x1 / s)
        return inside if b > 0 else 1 - inside

    lo, hi = -5e6, 5e5
    return -brentq(lambda q: cdf(q) - p, lo, hi)


full = book_pnl(r, H)
fv99, fes99, _ = hist_var(-full, 0.01)
fv95, _, _ = hist_var(-full, 0.05)
dg = dict(mu=0.0, sd=0.0, skew=0.0)
# Cornish-Fisher on the delta-gamma P&L (moments of a x + b x^2 under the normal)
a = (H - N_SHORT * delta) * F0
b = -0.5 * N_SHORT * gamma * F0 ** 2 + 0.5 * a
s2 = sig_d ** 2
mu = b * s2
var = a * a * s2 + 2 * b * b * s2 * s2
m3 = 6 * a * a * b * s2 ** 2 + 8 * b ** 3 * s2 ** 3
skew = m3 / var ** 1.5
zp = -Z99  # the 1 % quantile of the standard normal, negative
w = zp + (zp ** 2 - 1) / 6 * skew  # Cornish-Fisher (Hull 16B)
cf_var = -(mu + w * math.sqrt(var))
hedge_grid = [0, 500, 1000, 1500, 2000, 2500, 3000, 3292, 3500, 4000, 4500, 5000, 5500, 6000, 6500]
dial = [dict(h=h, linear=linear_var(h), full=hist_var(-book_pnl(r, h), 0.01)[0], quad=quad_var(h)) for h in hedge_grid]
raj = dict(F=F0, K=K, r=rr, T=T0, sigma=sigma, short=N_SHORT, hedge=H, call=C0, delta=delta, gamma=gamma, book_delta=H - N_SHORT * delta,
           sig_day=sig_d, theta_day=theta_day, linear_var99=linear_var(H), full_var99=fv99, full_es99=fes99, full_var95=fv95,
           full_best=float(full.max()), quad_var99=quad_var(H),
           cornish_fisher=dict(mu=mu, sd=math.sqrt(var), skew=skew, w=w, var99=cf_var),
           upside_bound=a * a / (2 * abs(2 * b)) if b < 0 else None, dial=dial)

# ---- book checks
ZH = 2.33  # Hull rounds the 99 % quantile to 2.33 throughout Ch. 16
hull = dict(
    z=ZH,
    msft=dict(sd=200000.0, var1=ZH * 200000, var10=ZH * 200000 * math.sqrt(10), book_var1=466000, book_var10=1473621),
    att=dict(sd=50000.0, var1=ZH * 50000, var10=ZH * 50000 * math.sqrt(10), book_var10=368405),
    both=dict(sd=math.sqrt(200000 ** 2 + 50000 ** 2 + 2 * 0.3 * 200000 * 50000), book_var10=1622657, book_benefit=219369),
    ex16_1=dict(sd=math.sqrt((1000 * 120 * 0.02) ** 2 + (20000 * 30 * 0.01) ** 2 + 2 * 0.3 * 1000 * 120 * 0.02 * 20000 * 30 * 0.01), book_var=26193),
    ex16_2=dict(mu=-0.2, sd=2.2, skew=-0.4, normal=-0.2 - 2.33 * 2.2, book_normal=-5.326,
                cf=-0.2 + 2.2 * (-2.33 + (2.33 ** 2 - 1) / 6 * (-0.4)), book_cf=-5.976),
)
hull["both"]["var10"] = ZH * hull["both"]["sd"] * math.sqrt(10)
hull["both"]["benefit"] = hull["msft"]["var10"] + hull["att"]["var10"] - hull["both"]["var10"]
hull["ex16_1"]["var"] = 1.65 * math.sqrt(5) * hull["ex16_1"]["sd"]
wilmott = dict(table19_1={"0.99": norm.ppf(0.99), "0.98": norm.ppf(0.98), "0.97": norm.ppf(0.97), "0.96": norm.ppf(0.96), "0.95": norm.ppf(0.95), "0.90": norm.ppf(0.90)},
               book=[2.326342, 2.053748, 1.88079, 1.750686, 1.644853, 1.281551])
tsay = dict(sigma2=0.000336, q05=-1.6449 * math.sqrt(0.000336), q01=-2.3262 * math.sqrt(0.000336),
            var05=1e7 * 1.6449 * math.sqrt(0.000336), var01=1e7 * 2.3262 * math.sqrt(0.000336), book=[302500, 426500])
subadd = dict(p=0.04, each_var95=0.0, joint_p_ge_100=1 - 0.96 ** 2, joint_var95=100.0,
              each_es95=100 * 0.04 / 0.05, joint_es95=(200 * 0.04 ** 2 + 100 * (0.05 - 0.04 ** 2)) / 0.05)  # the worst 5 %: all of the 0.16 % double losses, then single ones

key = dict(record=record, backtest=backtest, fences=fences, raj=raj, hull=hull, wilmott=wilmott, tsay=tsay, subadditivity=subadd)
with open(os.path.join(web, "engine", "__fixtures__", "key-E1.json"), "w") as f:
    json.dump(key, f, indent=1, default=float)

print(f"record n {n}: hist VaR99 {v99:,.0f} ES {es99:,.0f} | param {Z99*sd:,.0f} | VaR95 {v95:,.0f}")
print(f"backtest T {T}: hist {backtest['historical']['exceptions']} normal {backtest['normal']['exceptions']} ewma {backtest['ewma']['exceptions']} (exp {0.01*T:.1f}); kupiec {backtest['historical']['kupiec_lr']:.2f}")
print("march:", backtest["march2020"], "\nghost:", backtest["ghost"])
print(f"raj: linear {linear_var(H):,.0f} full {fv99:,.0f} quad {quad_var(H):,.0f} CF {cf_var:,.0f} theta/day {theta_day:,.0f} best {full.max():,.0f}")
print("dial:", [(d["h"], round(d["linear"]), round(d["full"]), round(d["quad"])) for d in dial])
print("hull both", hull["both"]["var10"], hull["both"]["benefit"], "ex16.1", hull["ex16_1"]["var"], "cf", hull["ex16_2"]["cf"])
