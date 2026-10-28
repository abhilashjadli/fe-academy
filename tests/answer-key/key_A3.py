"""Answer key for chapter A3 (regression and its failure modes). statsmodels + numpy. -> key-A3.json
Run with: python3 -I tests/answer-key/key_A3.py
"""
import json, os, math
import numpy as np
import statsmodels.api as sm
from statsmodels.stats.stattools import durbin_watson
from statsmodels.tsa.stattools import acf as sm_acf
from statsmodels.stats.outliers_influence import variance_inflation_factor

key = {}
rng = np.random.default_rng(42)

def fit_block(x, y, lags=4):
    X = sm.add_constant(x)
    m = sm.OLS(y, X).fit()
    hc = sm.OLS(y, X).fit(cov_type="HC0")
    hac = sm.OLS(y, X).fit(cov_type="HAC", cov_kwds={"maxlags": lags, "use_correction": False})
    return dict(x=list(map(float, x)), y=list(map(float, y)), slope=float(m.params[1]), intercept=float(m.params[0]), r2=float(m.rsquared),
                se=float(m.bse[1]), seHC=float(hc.bse[1]), seHAC=float(hac.bse[1]), dw=float(durbin_watson(m.resid)),
                acf=[float(v) for v in sm_acf(m.resid, nlags=5, fft=False)[1:]], resid_first5=[float(v) for v in m.resid[:5]])

# 1. An honest fit (small, fixed)
x = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], dtype=float)
y = np.array([2.1, 3.9, 6.2, 7.8, 10.1, 12.2, 13.8, 16.1, 18.0, 20.2])
key["honest"] = fit_block(x, y, lags=2)

# 2. Funnel (heteroskedastic): naive SE understates; HC closer to truth
n = 200
xf = np.linspace(1, 10, n)
yf = 1 + 2 * xf + rng.standard_normal(n) * xf
key["funnel"] = fit_block(xf, yf)

# 3. Echo (autocorrelated residuals): AR(1) φ = 0.9 errors
e = np.zeros(n);
for t in range(1, n): e[t] = 0.9 * e[t-1] + rng.standard_normal()
ye = 1 + 2 * xf + e
key["echo"] = fit_block(xf, ye)

# 4. Twins (multicollinearity): x2 = x1 + tiny noise
x1 = rng.standard_normal(100); x2 = x1 + 0.01 * rng.standard_normal(100)
yt = 1 + x1 + x2 + 0.5 * rng.standard_normal(100)
X = sm.add_constant(np.column_stack([x1, x2])); mt = sm.OLS(yt, X).fit()
key["twins"] = dict(x1=x1.tolist(), x2=x2.tolist(), y=yt.tolist(), coef=[float(v) for v in mt.params], se=[float(v) for v in mt.bse], r2=float(mt.rsquared),
                    vif=float(variance_inflation_factor(X, 1)))

# 5. Drunks: two independent random walks, spurious regression facts (10,000 trials, 50 and 500 steps)
key["drunks"] = []
for steps in (50, 500):
    r2s, ts = [], []
    for _ in range(4000):
        a = np.cumsum(rng.choice([-1, 1], steps)); b = np.cumsum(rng.choice([-1, 1], steps))
        m = sm.OLS(b, sm.add_constant(a)).fit()
        r2s.append(m.rsquared); ts.append(abs(m.tvalues[1]))
    r2s, ts = np.array(r2s), np.array(ts)
    key["drunks"].append(dict(steps=steps, median_r2=float(np.median(r2s)), p_r2_over_half=float((r2s > 0.5).mean()), p_t_over_2=float((ts > 2).mean()),
                              median_t=float(np.median(ts))))
# one fixed pair for the figure's seed check
a = np.cumsum(np.array([1,-1,1,1,1,-1,1,1,-1,1,1,1,-1,1,1,-1,-1,1,1,1,1,-1,1,1,1,1,-1,1,1,1]))
b = np.cumsum(np.array([-1,-1,1,-1,-1,1,-1,-1,-1,1,-1,-1,-1,-1,1,-1,-1,-1,-1,-1,1,-1,-1,-1,-1,-1,1,-1,-1,-1]))
mp = sm.OLS(b, sm.add_constant(a)).fit()
md = sm.OLS(np.diff(b), sm.add_constant(np.diff(a))).fit()
key["drunks_fixed"] = dict(a=a.tolist(), b=b.tolist(), r2=float(mp.rsquared), t=float(mp.tvalues[1]), dw=float(durbin_watson(mp.resid)), r2_diff=float(md.rsquared))

out = os.path.join(os.path.dirname(__file__), "..", "..", "apps", "web", "src", "engine", "__fixtures__", "key-A3.json")
json.dump(key, open(out, "w"))
print("wrote", os.path.normpath(out))
print("echo se/HC/HAC", key["echo"]["se"], key["echo"]["seHC"], key["echo"]["seHAC"], "dw", key["echo"]["dw"])
print("drunks", key["drunks"], "fixed", key["drunks_fixed"]["r2"], key["drunks_fixed"]["dw"], key["drunks_fixed"]["r2_diff"])
