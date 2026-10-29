"""Answer key for chapter A5 (volatility: EWMA, GARCH(1,1), MLE, forecasts, Ljung-Box). numpy + scipy + statsmodels + arch. -> key-A5.json
Run with: python3 -I tests/answer-key/key_A5.py
Reference numbers quote Hull, "Options, Futures, and Other Derivatives" (10th ed.), ch. 17; page numbers follow research/r1/A5.md §6.

Conventions shared with apps/web/src/engine/volatility.ts (so recursions are exact, not approximate):
  * returns are decimals (0.01 = 1 %), mean assumed zero (Hull eq. 17.2-17.3, p. 373);
  * variance paths have length n+1: path[0] is the seed (default: mean of r², the zero-mean sample variance),
    path[i] is the variance "for" return i, path[n] is the next-day forecast after the last return;
  * log-likelihood = sum over i of (-ln v_i - u_i² / v_i) for i = 0..n-1 (Hull eq. 17.12, p. 379), v_i = path[i];
  * the term structure averages E[σ²_{n+k}] over k = 0..N-1 (today included) and annualises by ×252 (Hull eq. 17.14, p. 384).
"""
import json, os, math, warnings
import numpy as np
from scipy.optimize import minimize
from statsmodels.stats.diagnostic import acorr_ljungbox
from statsmodels.tsa.stattools import acf as sm_acf

key = {}

# ---------------------------------------------------------------- recursions (identical to the TS engine) ----
def ewma_path(r, lam, seed=None):
    r = np.asarray(r, dtype=float)
    v = np.empty(len(r) + 1)
    v[0] = float(np.mean(r * r)) if seed is None else seed
    for i in range(len(r)):
        v[i + 1] = lam * v[i] + (1 - lam) * r[i] ** 2            # Hull eq. 17.7, p. 374
    return v

def garch_path(r, omega, alpha, beta, seed=None):
    r = np.asarray(r, dtype=float)
    v = np.empty(len(r) + 1)
    v[0] = float(np.mean(r * r)) if seed is None else seed
    for i in range(len(r)):
        v[i + 1] = omega + alpha * r[i] ** 2 + beta * v[i]        # Hull eq. 17.8, p. 376
    return v

def garch_ll(r, omega, alpha, beta):
    r = np.asarray(r, dtype=float)
    v = garch_path(r, omega, alpha, beta)[:-1]
    return float(np.sum(-np.log(v) - r * r / v))                   # Hull eq. 17.12, p. 379

def garch_forecast(s2, omega, alpha, beta, h):
    VL = omega / (1 - alpha - beta)                                 # Hull eq. 17.9
    return [VL + (alpha + beta) ** k * (s2 - VL) for k in range(1, h + 1)]   # Hull eq. 17.13, p. 383

def term_structure(s2, omega, alpha, beta, days):
    VL = omega / (1 - alpha - beta)
    ab = alpha + beta
    out = []
    for N in days:
        avg = VL + (s2 - VL) * (1 - ab ** N) / (N * (1 - ab))      # (1/N) Σ_{k=0}^{N-1} E[σ²_{n+k}]
        out.append(dict(days=N, avg_variance=avg, vol_annual=math.sqrt(252 * avg)))   # Hull eq. 17.14, p. 384
    return out

def fit_garch_own(r):
    """MLE under exactly the engine's convention (seed = mean r², Hull's -ln v - u²/v). Nelder-Mead on an unconstrained
    parameterisation: omega = exp(t0), alpha = s(t1), beta = (1 - alpha) s(t2) with s the logistic, so 0 < alpha + beta < 1."""
    r = np.asarray(r, dtype=float)
    V = float(np.mean(r * r))
    def unpack(t):
        a = 1 / (1 + math.exp(-t[1])); b = (1 - a) / (1 + math.exp(-t[2]))
        return math.exp(t[0]), a, b
    def neg(t):
        return -garch_ll(r, *unpack(t))
    best = None
    for a0 in (0.05, 0.10, 0.20):
        for b0 in (0.80, 0.90, 0.95):
            if a0 + b0 >= 0.995: continue
            t0 = [math.log(V * (1 - a0 - b0)), math.log(a0 / (1 - a0)), math.log((b0 / (1 - a0)) / (1 - b0 / (1 - a0)))]
            res = minimize(neg, t0, method="Nelder-Mead", options=dict(xatol=1e-8, fatol=1e-10, maxiter=20000))
            if best is None or res.fun < best.fun: best = res
    om, al, be = unpack(best.x)
    return dict(omega=om, alpha=al, beta=be, ll=float(-best.fun))

def fit_garch_arch(r):
    """Reference fit with the arch package (returns scaled ×100 for conditioning; omega scaled back)."""
    from arch import arch_model
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        am = arch_model(np.asarray(r) * 100, mean="Zero", vol="GARCH", p=1, q=1, dist="normal", rescale=False)
        res = am.fit(disp="off")
    p = res.params
    return dict(omega=float(p["omega"]) / 1e4, alpha=float(p["alpha[1]"]), beta=float(p["beta[1]"]), ll_arch=float(res.loglikelihood))

# ---------------------------------------------------------------- 1. Hull worked examples ----
# Example 17.1 (p. 375): EWMA, λ = 0.90, σ_{n-1} = 1 %, u_{n-1} = 2 % → σ_n² = 0.00013, σ_n = 1.14 %
key["hull_17_1"] = dict(lam=0.90, sigma_prev=0.01, u_prev=0.02, sigma2=0.9 * 0.0001 + 0.1 * 0.0004, sigma_text=0.0114)
# acadifi check: λ = 0.94, σ² = 0.000324, u = -2.3 % → 0.000337 (1.835 %)
key["ewma_acadifi"] = dict(lam=0.94, sigma2_prev=0.000324, u_prev=-0.023, sigma2=0.94 * 0.000324 + 0.06 * 0.023 ** 2)
# half-life ln 0.5 / ln λ (note §6): 11.20 d at 0.94, 22.76 d at 0.97; effective window 1/(1-λ) = 16.7
key["ewma_half_life"] = [dict(lam=l, half_life=math.log(0.5) / math.log(l), window=1 / (1 - l)) for l in (0.94, 0.97, 0.90)]
# Example 17.2 (pp. 376-377): ω = 0.000002, α = 0.13, β = 0.86 → γ = 0.01, V_L = 0.0002 (1.4 %/day); σ_{n-1} = 1.6 %, u = 1 % → 0.00023516, 1.53 %
key["hull_17_2"] = dict(omega=0.000002, alpha=0.13, beta=0.86, gamma=0.01, VL=0.000002 / 0.01, VL_vol_text=0.014,
                        sigma_prev=0.016, u_prev=0.01, sigma2=0.000002 + 0.13 * 0.0001 + 0.86 * 0.000256, sigma_text=0.0153)
# O'Connell check: ω = 0.000002, α = 0.08, β = 0.90, σ² = 0.0004, r = -3 % → 0.000434 (2.08 %); V_L = 0.0001; half-life ln 0.5 / ln 0.98 = 34.3 d
key["garch_oconnell"] = dict(omega=0.000002, alpha=0.08, beta=0.90, sigma2_prev=0.0004, u_prev=-0.03,
                             sigma2=0.000002 + 0.08 * 0.0009 + 0.90 * 0.0004, VL=0.0001, half_life=math.log(0.5) / math.log(0.98))
# Tsay eq. 3.18 (p. 118): unconditional variance from the coefficients (book prints 0.00314 — rounding; engine uses the coefficients)
key["tsay_3_18"] = dict(omega=0.000086, alpha=0.1216, beta=0.8511, VL=0.000086 / (1 - 0.8511 - 0.1216))
# Hull Table 17.1 (p. 380): per-day likelihood term -ln v - u²/v on the listed (u, v) rows
rows = [(3, -0.004242, 0.00004355, 9.6283), (4, 0.009037, 0.00004198, 8.1329), (5, 0.002687, 0.00004455, 9.8568),
        (6, 0.011101, 0.00004220, 7.1529), (2421, 0.003374, 0.00007626, 9.3321), (2422, -0.017309, 0.00007092, 5.3294),
        (2423, 0.000144, 0.00008417, 9.3824)]
key["hull_table_17_1"] = [dict(day=d, u=u, v=v, term=-math.log(v) - u * u / v, term_text=t) for d, u, v, t in rows]
# Hull yen MLE optimum (p. 380): ω = 0.00000176, α = 0.0626, β = 0.8976, Σ = 22,063.5763; V_L = 0.00004422, 0.665 %/day
key["hull_yen_optimum"] = dict(omega=0.00000176, alpha=0.0626, beta=0.8976, ll_text=22063.5763, VL=0.00000176 / (1 - 0.0626 - 0.8976),
                               VL_text=0.00004422, vol_daily_text=0.00665)
# Forecast (p. 383): α+β = 0.9602, V_L = 0.00004422, σ_n² = 0.00006 → k = 10: 0.00005473 (0.74 %); k = 100: 0.00004449 (0.67 %)
VL, ab, s2 = 0.00004422, 0.9602, 0.00006
om = VL * (1 - ab); al = 0.0626; be = ab - al
f = garch_forecast(s2, om, al, be, 100)
key["hull_forecast"] = dict(omega=om, alpha=al, beta=be, sigma2_now=s2, h1=f[0], h10=f[9], h100=f[99], h10_text=0.00005473, h100_text=0.00004449,
                            vol10_text=0.0074, vol100_text=0.0067)
# Term structure Table 17.3 (p. 384): 10/30/50/100/500 d → 12.03/11.61/11.35/11.01/10.65 %; 10-day average variance 0.00005745
ts = term_structure(s2, om, al, be, [10, 30, 50, 100, 500])
key["hull_table_17_3"] = dict(rows=ts, vol_text=[0.1203, 0.1161, 0.1135, 0.1101, 0.1065], avg10_text=0.00005745)
# Table 17.4 (p. 385): instantaneous vol 12.30 → 13.30 % (daily variance 0.00007016): 10-day average 0.00006597 → 12.89 %;
# increases 0.86/0.64/0.48/0.28/0.06 % across the five maturities
s2_up = 0.00007016
ts_up = term_structure(s2_up, om, al, be, [10, 30, 50, 100, 500])
key["hull_table_17_4"] = dict(sigma2_up=s2_up, rows=ts_up, avg10_text=0.00006597, vol10_text=0.1289,
                              increase=[u["vol_annual"] - b["vol_annual"] for u, b in zip(ts_up, ts)], increase_text=[0.0086, 0.0064, 0.0048, 0.0028, 0.0006])

# ---------------------------------------------------------------- 2. A simulated GARCH(1,1) series with known parameters ----
rng = np.random.default_rng(17)
T = 2000
om_t, al_t, be_t = 0.000002, 0.08, 0.90
VL_t = om_t / (1 - al_t - be_t)
z = rng.standard_normal(T)
r = np.empty(T); v = VL_t
for t in range(T):
    r[t] = math.sqrt(v) * z[t]
    v = om_t + al_t * r[t] ** 2 + be_t * v
r = r.round(8)
ew = ewma_path(r, 0.94)
gp = garch_path(r, om_t, al_t, be_t)
own = fit_garch_own(r)
key["sim"] = dict(seed=17, T=T, omega=om_t, alpha=al_t, beta=be_t, returns=r.tolist(),
                  ewma_lambda=0.94, ewma_seed=float(np.mean(r * r)), ewma_first10=ew[:10].tolist(), ewma_last=float(ew[-1]),
                  garch_first10=gp[:10].tolist(), garch_last=float(gp[-1]),
                  ll_true=garch_ll(r, om_t, al_t, be_t), VL=VL_t, VL_vol_daily=math.sqrt(VL_t), VL_vol_annual=math.sqrt(252 * VL_t),
                  forecast=dict(sigma2_now=float(gp[-1]), h1=garch_forecast(gp[-1], om_t, al_t, be_t, 1)[0],
                                h10=garch_forecast(gp[-1], om_t, al_t, be_t, 10)[9], h100=garch_forecast(gp[-1], om_t, al_t, be_t, 100)[99]),
                  term_structure=term_structure(gp[-1], om_t, al_t, be_t, [10, 30, 50, 100, 500]),
                  fit_own=own, fit_arch=fit_garch_arch(r))
# realised variance (Hull eq. 17.3, p. 373): trailing 25-day equal-weight average of r² ending at i inclusive
w = 25
rv = np.convolve(r * r, np.ones(w) / w, mode="valid")
key["sim"]["realised25"] = dict(window=w, first=float(rv[0]), last=float(rv[-1]), at100=float(rv[100 - w + 1]))

# ---------------------------------------------------------------- 3. Real NIFTY 50 returns ----
data = os.path.join(os.path.dirname(__file__), "..", "..", "apps", "web", "src", "data", "nifty50-long.json")
nifty = np.asarray([row["r"] for row in json.load(open(data))["returns"]], dtype=float)   # rows are {d, r}, r rounded to 6 dp
n = len(nifty)
own_n = fit_garch_own(nifty)
arch_n = fit_garch_arch(nifty)
ll_at_arch = garch_ll(nifty, arch_n["omega"], arch_n["alpha"], arch_n["beta"])
lb_r = acorr_ljungbox(nifty, lags=[20], return_df=True)
lb_r2 = acorr_ljungbox(nifty ** 2, lags=[20], return_df=True)
gpn = garch_path(nifty, own_n["omega"], own_n["alpha"], own_n["beta"])
std = nifty / np.sqrt(gpn[:-1])
lb_std2 = acorr_ljungbox(std ** 2, lags=[20], return_df=True)
VLn = own_n["omega"] / (1 - own_n["alpha"] - own_n["beta"])
key["nifty"] = dict(n=n, sd_daily=float(np.std(nifty, ddof=1)), mean_sq=float(np.mean(nifty ** 2)),
                    fit_own=own_n, fit_arch=arch_n, ll_at_arch_params=ll_at_arch,
                    VL=VLn, VL_vol_daily=math.sqrt(VLn), VL_vol_annual=math.sqrt(252 * VLn), half_life=math.log(0.5) / math.log(own_n["alpha"] + own_n["beta"]),
                    ljung_box_r=dict(lags=20, stat=float(lb_r["lb_stat"].iloc[0]), p=float(lb_r["lb_pvalue"].iloc[0])),
                    ljung_box_r2=dict(lags=20, stat=float(lb_r2["lb_stat"].iloc[0]), p=float(lb_r2["lb_pvalue"].iloc[0])),
                    ljung_box_std2=dict(lags=20, stat=float(lb_std2["lb_stat"].iloc[0]), p=float(lb_std2["lb_pvalue"].iloc[0])),
                    acf_r=[float(x) for x in sm_acf(nifty, nlags=5, fft=False)[1:]],
                    acf_r2=[float(x) for x in sm_acf(nifty ** 2, nlags=5, fft=False)[1:]],
                    ewma94_last=float(ewma_path(nifty, 0.94)[-1]), ewma94_max=float(ewma_path(nifty, 0.94).max()),
                    garch_last=float(gpn[-1]), garch_max=float(gpn.max()),
                    realised250_last=float(np.mean(nifty[-250:] ** 2)))

out = os.path.join(os.path.dirname(__file__), "..", "..", "apps", "web", "src", "engine", "__fixtures__", "key-A5.json")
json.dump(key, open(out, "w"))
print("wrote", os.path.normpath(out))
print("sim fit own", own, "arch", key["sim"]["fit_arch"], "ll_true", key["sim"]["ll_true"])
print("nifty fit own", own_n, "arch", arch_n, "ll at arch", ll_at_arch)
print("nifty VL vol annual", key["nifty"]["VL_vol_annual"], "LB r", key["nifty"]["ljung_box_r"], "LB r2", key["nifty"]["ljung_box_r2"], "LB std2", key["nifty"]["ljung_box_std2"])
print("acf r", key["nifty"]["acf_r"], "acf r2", key["nifty"]["acf_r2"])
print("table 17.4 increase", key["hull_table_17_4"]["increase"])
