"""Answer key for chapter G1 (supervised learning, regularisation, validation). numpy only.
-> apps/web/src/engine/__fixtures__/key-G1.json

Everything runs on the repo's real NIFTY record (apps/web/src/data/nifty50-long.json).

Conventions:
- Figure 0: ordinary least squares polynomial of degree d through the last 60 closes before 2026-10-06 (10 Jul - 5 Oct 2026), on the
  standardised day index x = (i - mean)/sd, i = 0..59 (so the normal equations stay well conditioned to degree 15), evaluated on the
  20 trading days that followed (6 Oct - 3 Nov 2026). Solved by numpy lstsq on the Vandermonde matrix (the TS engine solves the same
  normal equations by Cholesky with a tiny ridge of 1e-12 for degree >= 12; agreement is asserted to 1e-6 relative on the readings).
- Figures 1-3: y_t = |r_t| in percent; inputs = the previous k values of the same series, newest first. Training rows t = 60..1999 of the
  return record (1 Apr 2016 - 30 Jan 2024, 1,940 rows), test rows t = 2000..2682 (31 Jan 2024 - 3 Nov 2026, 683 rows). The intercept is
  never penalised. Errors are mean squared errors; the page shows them as "% better than guessing the training mean" = 1 - MSE/MSE_mean
  where MSE_mean is the error of predicting the training-set mean on the set in question.
- Ridge: beta = (X'X + lam I)^-1 X'y with I[0,0] = 0. Lambda grid is log-spaced.
- Cross-validation: five contiguous blocks of the training rows (np.array_split), pooled squared error over the held-out blocks.
- EWMA benchmark (A5/E1): sigma^2_t = 0.94 sigma^2_{t-1} + 0.06 r^2_{t-1}, seeded with the variance of the first 60 returns; the |r|
  forecast is sqrt(2/pi) sigma (the mean absolute value of a normal).
- Tsay Example 4.7 numbers are copied from the book (Analysis of Financial Time Series 2e, §4.1.7), textbook, labelled.
"""
import json, math, os
import numpy as np

here = os.path.dirname(os.path.abspath(__file__))
web = os.path.join(here, "..", "..", "apps", "web", "src")
rec = json.load(open(os.path.join(web, "data", "nifty50-long.json")))
closes = np.array([row["c"] for row in rec["rows"]], float)
cdates = [row["d"] for row in rec["rows"]]
rets = np.array([row["r"] for row in rec["returns"]], float)
rdates = [row["d"] for row in rec["returns"]]
n = len(rets)

# ---------------------------------------------------------------- Figure 0: fit the index
WIN, AHEAD = 60, 20
end = len(closes) - AHEAD
seg = closes[end - WIN:end]
fut = closes[end:end + AHEAD]
xi = np.arange(WIN, dtype=float)
xm, xs = xi.mean(), xi.std()
z = (xi - xm) / xs
za = (np.arange(WIN, WIN + AHEAD) - xm) / xs


def polyfit(deg):
    V = np.vander(z, deg + 1, increasing=True)
    coef, *_ = np.linalg.lstsq(V, seg, rcond=None)
    fit = V @ coef
    ext = np.vander(za, deg + 1, increasing=True) @ coef
    return coef, fit, ext


degrees = list(range(1, 16))
fig0_rows = []
for d in degrees:
    coef, fit, ext = polyfit(d)
    fig0_rows.append(dict(
        degree=d,
        coef=coef.tolist(),
        rmse_in=float(np.sqrt(np.mean((fit - seg) ** 2))),
        rmse_out=float(np.sqrt(np.mean((ext - fut) ** 2))),
        day20=float(ext[-1]),
        fit=fit.tolist(),
        ext=ext.tolist(),
    ))
fig0 = dict(
    window=dict(start=cdates[end - WIN], end=cdates[end - 1], n=WIN),
    ahead=dict(start=cdates[end], end=cdates[end + AHEAD - 1], n=AHEAD, last_close=float(fut[-1])),
    closes=seg.tolist(), future=fut.tolist(), x_mean=float(xm), x_sd=float(xs),
    rows=fig0_rows,
)

# ---------------------------------------------------------------- Figures 1-3: tomorrow's move size
a = np.abs(rets) * 100.0
K = 60
TR0, TR1, TE0, TE1 = K, 2000, 2000, n


def design(k, lo, hi):
    X = np.array([a[t - k:t][::-1] for t in range(lo, hi)])
    return X, a[lo:hi]


Xtr, ytr = design(K, TR0, TR1)
Xte, yte = design(K, TE0, TE1)


def ridge(X, y, lam=0.0):
    X1 = np.column_stack([np.ones(len(X)), X])
    P = np.eye(X1.shape[1]) * lam
    P[0, 0] = 0.0
    return np.linalg.solve(X1.T @ X1 + P, X1.T @ y)


def mse(X, y, b):
    return float(np.mean((y - (b[0] + X @ b[1:])) ** 2))


mean_tr = float(ytr.mean())
mse_mean_train = float(np.mean((ytr - mean_tr) ** 2))
mse_mean_test = float(np.mean((yte - mean_tr) ** 2))

# EWMA benchmark
s2 = np.zeros(n)
s2[0] = rets[:60].var()
for t in range(1, n):
    s2[t] = 0.94 * s2[t - 1] + 0.06 * rets[t - 1] ** 2
ewma_pred = math.sqrt(2 / math.pi) * np.sqrt(s2) * 100.0
ewma_test = float(np.mean((yte - ewma_pred[TE0:TE1]) ** 2))
ewma_train = float(np.mean((ytr - ewma_pred[TR0:TR1]) ** 2))

ks = list(range(1, K + 1))


def k_curve(Xa, ya, Xb, yb):
    out = []
    for k in ks:
        b = ridge(Xa[:, :k], ya)
        out.append(dict(k=k, train=mse(Xa[:, :k], ya, b), test=mse(Xb[:, :k], yb, b)))
    return out


full = k_curve(Xtr, ytr, Xte, yte)
Xs, ys = design(K, TR1 - 250, TR1)
mean_s = float(ys.mean())
small = k_curve(Xs, ys, Xte, yte)
best_k_full = min(full, key=lambda r: r["test"])["k"]
fig1 = dict(
    train=dict(start=rdates[TR0], end=rdates[TR1 - 1], n=TR1 - TR0, mean=mean_tr, mse_mean=mse_mean_train),
    test=dict(start=rdates[TE0], end=rdates[TE1 - 1], n=TE1 - TE0, mse_mean=mse_mean_test),
    small=dict(start=rdates[TR1 - 250], end=rdates[TR1 - 1], n=250, mean=mean_s,
               mse_mean_train=float(np.mean((ys - mean_s) ** 2)), mse_mean_test=float(np.mean((yte - mean_s) ** 2))),
    ewma=dict(lam=0.94, train=ewma_train, test=ewma_test),
    full=full, small_curve=small, best_k_full=best_k_full,
    best_k_small=min(small, key=lambda r: r["test"])["k"],
    coef_best=ridge(Xtr[:, :best_k_full], ytr).tolist(),
)

# Figure 2: ridge on 60 lags
lams = [0.0] + [10 ** (e / 4) for e in range(0, 21)]  # 0, 1 .. 1e5 in quarter decades
fig2_rows = []
for lam in lams:
    b = ridge(Xtr, ytr, lam)
    bs = ridge(Xs, ys, lam)
    fig2_rows.append(dict(lam=lam, train=mse(Xtr, ytr, b), test=mse(Xte, yte, b), coef=b.tolist(),
                          negatives=int((b[1:] < 0).sum()), sum_abs=float(np.abs(b[1:]).sum()),
                          small_train=mse(Xs, ys, bs), small_test=mse(Xte, yte, bs)))
named = {}
for lam in [0.0, 10.0, 100.0, 1000.0, 10000.0, 100000.0]:
    b = ridge(Xtr, ytr, lam)
    named[str(int(lam))] = dict(train=mse(Xtr, ytr, b), test=mse(Xte, yte, b), negatives=int((b[1:] < 0).sum()),
                                sum_abs=float(np.abs(b[1:]).sum()), coef=b.tolist())
fig2 = dict(lams=lams, rows=fig2_rows, named=named, best_lam=min(fig2_rows, key=lambda r: r["test"])["lam"])

# Figure 3: five contiguous folds
FOLDS = 5
parts = np.array_split(np.arange(len(ytr)), FOLDS)
fold_ranges = [dict(start=rdates[TR0 + p[0]], end=rdates[TR0 + p[-1]], n=int(len(p))) for p in parts]


def cv(X, y, lam=0.0):
    tot = 0.0
    per = []
    for p in parts:
        m = np.ones(len(y), bool)
        m[p] = False
        b = ridge(X[m], y[m], lam)
        e = float(np.sum((y[p] - (b[0] + X[p] @ b[1:])) ** 2))
        per.append(e / len(p))
        tot += e
    return tot / len(y), per


cv_mean = sum(float(np.sum((ytr[p] - ytr[np.setdiff1d(np.arange(len(ytr)), p)].mean()) ** 2)) for p in parts) / len(ytr)
cv_k = []
for k in ks:
    pooled, per = cv(Xtr[:, :k], ytr)
    cv_k.append(dict(k=k, cv=pooled, per_fold=per))
cv_lam = []
for lam in lams:
    pooled, per = cv(Xtr, ytr, lam)
    cv_lam.append(dict(lam=lam, cv=pooled, per_fold=per))
best_cv_k = min(cv_k, key=lambda r: r["cv"])["k"]
best_cv_lam = min(cv_lam, key=lambda r: r["cv"])["lam"]
test_at_cv_lam = mse(Xte, yte, ridge(Xtr, ytr, best_cv_lam))
fig3 = dict(
    folds=fold_ranges, cv_mean=cv_mean, cv_k=cv_k, cv_lam=cv_lam,
    best_cv_k=best_cv_k, best_cv_lam=best_cv_lam, test_at_cv_lam=test_at_cv_lam,
    test_at_lam0=mse(Xte, yte, ridge(Xtr, ytr, 0.0)), best_test_lam=fig2["best_lam"],
    per_fold_k10=next(r for r in cv_k if r["k"] == 10)["per_fold"],
    tsay=dict(source="Tsay, Analysis of Financial Time Series 2e, Example 4.7 (IBM monthly returns 1926-1997 train, 1998-99 test)",
              resid_se_network=6.56, resid_se_ar1=6.61, msfe_mean=91.85, msfe_ar1=91.70, msfe_network=91.74,
              msfe_network_range=[89.46, 93.65], direction_success=0.58),
)

key = dict(fig0=fig0, fig1=fig1, fig2=fig2, fig3=fig3,
           meta=dict(record=rec["source"], n_returns=int(n), K=K))
with open(os.path.join(web, "engine", "__fixtures__", "key-G1.json"), "w") as f:
    json.dump(key, f, indent=1, default=float)

print("fig0", [(r["degree"], round(r["rmse_in"]), round(r["rmse_out"]), round(r["day20"])) for r in fig0_rows if r["degree"] in (1, 5, 15)])
print("fig1 best k", best_k_full, "test", round(full[best_k_full - 1]["test"], 4), "mean", round(mse_mean_test, 4), "ewma", round(ewma_test, 4), "k60", round(full[-1]["test"], 4))
print("fig2", {k: (round(v["test"], 4), v["negatives"]) for k, v in named.items()}, "best lam", fig2["best_lam"])
print("fig3 best cv k", best_cv_k, "best cv lam", best_cv_lam, "test there", round(test_at_cv_lam, 4), "per fold k10", [round(x, 3) for x in fig3["per_fold_k10"]])
