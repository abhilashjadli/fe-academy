"""Answer key for chapter E3 (the efficient frontier and PCA). numpy + scipy only.
-> apps/web/src/engine/__fixtures__/key-E3.json

Conventions: returns and risks in fractions per year; sigma_P^2 = w' S w; the minimum-variance frontier for a target return m with short
sales allowed is w = S^-1 (lambda 1 + gamma mu) with the usual A, B, C, D (Wilmott 18.3 / Merton 1972); the tangency portfolio with rate
rf is w ∝ S^-1 (mu - rf 1) scaled to sum to one; the no-short frontier is the upper envelope over a 1 %-step simplex grid. PCA: eigenpairs of
the covariance (or correlation) matrix, eigenvalues descending; sign convention: the largest-magnitude component of each vector positive
(engine/linalg.ts symEigen's rule), except where a table fixes the sign (Frye: PC1 > 0, PC2 rising with maturity, PC3 positive at the ends).
"""
import itertools, json, math, os
import numpy as np

here = os.path.dirname(os.path.abspath(__file__))
web = os.path.join(here, "..", "..", "apps", "web", "src")


def frontier_weights(mu, S, m):
    Si = np.linalg.inv(S)
    one = np.ones(len(mu))
    A = one @ Si @ one
    B = one @ Si @ mu
    C = mu @ Si @ mu
    Dd = A * C - B * B
    lam = (C - B * m) / Dd
    gam = (A * m - B) / Dd
    w = Si @ (lam * one + gam * mu)
    return w, dict(A=A, B=B, C=C, D=Dd)


def risk(w, S):
    return float(np.sqrt(w @ S @ w))


def sign_fix(v):
    m = v[np.argmax(np.abs(v))]
    return v if m >= 0 else -v


def pca(S):
    vals, vecs = np.linalg.eigh(S)
    idx = np.argsort(vals)[::-1]
    vals = vals[idx]
    vecs = vecs[:, idx]
    return vals, np.array([sign_fix(vecs[:, i]) for i in range(len(vals))])


# ---- two assets (Wilmott Figure 18.2: A 15 %/20 %, E 20 %/35 %)
A_mu, A_sd, E_mu, E_sd = 0.15, 0.20, 0.20, 0.35


def two_asset(w, rho):
    mu = w * A_mu + (1 - w) * E_mu
    var = w * w * A_sd ** 2 + 2 * w * (1 - w) * rho * A_sd * E_sd + (1 - w) ** 2 * E_sd ** 2
    return mu, math.sqrt(max(var, 0))


two = dict(A=dict(mu=A_mu, sd=A_sd), E=dict(mu=E_mu, sd=E_sd), zero_risk_weight_rho_minus1=E_sd / (A_sd + E_sd),
           rows=[dict(rho=rho, w=w, mu=two_asset(w, rho)[0], sd=two_asset(w, rho)[1]) for rho in (-1, -0.5, 0, 0.5, 1) for w in (-0.5, 0, 0.25, 0.5, 0.75, 1, 1.5)])
# minimum-variance weight for each rho
two["min_var"] = [dict(rho=rho, w=float((E_sd ** 2 - rho * A_sd * E_sd) / (A_sd ** 2 + E_sd ** 2 - 2 * rho * A_sd * E_sd))) for rho in (-1, -0.5, 0, 0.5, 0.99)]

# ---- five assets after Wilmott Figure 18.1 (returns and risks read from the figure; the correlations are ours and are labelled so)
names = ["A", "B", "C", "D", "E"]
mu5 = np.array([0.15, 0.15, 0.10, 0.10, 0.20])
sd5 = np.array([0.20, 0.30, 0.25, 0.30, 0.30])
rho5 = np.array([
    [1.00, 0.55, 0.50, 0.05, 0.60],
    [0.55, 1.00, 0.45, 0.10, 0.50],
    [0.50, 0.45, 1.00, 0.00, 0.40],
    [0.05, 0.10, 0.00, 1.00, 0.05],
    [0.60, 0.50, 0.40, 0.05, 1.00],
])
S5 = np.outer(sd5, sd5) * rho5
targets = np.round(np.arange(0.08, 0.2601, 0.005), 4)
curve = []
for m in targets:
    w, _ = frontier_weights(mu5, S5, m)
    curve.append(dict(m=float(m), sd=risk(w, S5), w=w.tolist()))
# the bet: best return at A's risk (20 %) on the unconstrained frontier -> solve sd(m) = 0.20 on the upper branch
ms = np.linspace(0.12, 0.35, 20001)
sds = np.array([risk(frontier_weights(mu5, S5, m)[0], S5) for m in ms])
i_at = int(np.argmin(np.abs(sds - 0.20) + (ms < 0.15) * 1.0))
w_at, consts = frontier_weights(mu5, S5, ms[i_at])
# no-short frontier on a 1 % simplex grid (step 0.01 over five weights: C(104,4) ~ 4.6 m points — too many; use 2 % -> C(54,4) = 316k)
step = 0.02
best = {}
k = int(round(1 / step))
pts = []
for c in itertools.combinations(range(k + 4), 4):
    parts = np.diff(np.concatenate([[-1], c, [k + 4]])) - 1
    w = parts * step
    if abs(w.sum() - 1) > 1e-9:
        continue
    m = float(w @ mu5)
    s = risk(w, S5)
    pts.append((s, m, w))
pts.sort(key=lambda t: (t[0], t[1]))
env = []
mx = -1
for s, m, w in pts:
    if m > mx + 1e-12:
        mx = m
        env.append(dict(sd=s, m=m, w=w.tolist()))
noshort_at_20 = max((p for p in env if p["sd"] <= 0.20), key=lambda p: p["m"])
rf = 0.05
Si = np.linalg.inv(S5)
wt = Si @ (mu5 - rf)
wt = wt / wt.sum()
five = dict(names=names, mu=mu5.tolist(), sd=sd5.tolist(), rho=rho5.tolist(), S=S5.tolist(), curve=curve, consts=consts,
            at_A_risk=dict(m=float(ms[i_at]), sd=risk(w_at, S5), w=w_at.tolist(), holds_D=bool(w_at[3] > 0)),
            noshort=dict(step=step, env=env[::max(1, len(env) // 60)], at_A_risk=noshort_at_20),
            tangency=dict(rf=rf, w=wt.tolist(), mu=float(wt @ mu5), sd=risk(wt, S5), sharpe=float((wt @ mu5 - rf) / risk(wt, S5))),
            global_min=dict(w=(Si @ np.ones(5) / (np.ones(5) @ Si @ np.ones(5))).tolist()))
five["global_min"]["sd"] = risk(np.array(five["global_min"]["w"]), S5)
five["global_min"]["mu"] = float(np.array(five["global_min"]["w"]) @ mu5)
# Sharpe check: every curve point's Sharpe <= tangency's
assert all((p["m"] - rf) / p["sd"] <= five["tangency"]["sharpe"] + 1e-9 for p in curve)

# ---- Wilmott Figure 18.4 (four assets, target 30 %)
mu4 = np.array([0.10, 0.15, 0.18, 0.20])
sd4 = np.array([0.20, 0.30, 0.25, 0.35])
rho4 = np.array([[1, 0.2, 0.3, 0.1], [0.2, 1, 0.05, 0.1], [0.3, 0.05, 1, 0.05], [0.1, 0.1, 0.05, 1]])
S4 = np.outer(sd4, sd4) * rho4
w4, _ = frontier_weights(mu4, S4, 0.30)
wilmott184 = dict(mu=mu4.tolist(), sd=sd4.tolist(), rho=rho4.tolist(), target=0.30, w=w4.tolist(), sd_p=risk(w4, S4),
                  book_w=[-1.46371, 0.393638, 1.334433, 0.735637], book_sd=0.456)

# ---- Hull 16.3 two-asset benefit (shared with E1)
hull163 = dict(sd1=200000.0, sd2=50000.0, rho=0.3, sd_p=math.sqrt(200000 ** 2 + 50000 ** 2 + 2 * 0.3 * 200000 * 50000), book_sd_p=220227)

# ---- PCA: Tsay Example 9.1
cov_t = np.array([[73.10, 36.48, 27.08, 16.06, 16.33], [36.48, 103.60, 48.86, 37.59, 40.72], [27.08, 48.86, 113.96, 27.96, 26.86],
                  [16.06, 37.59, 27.96, 105.56, 85.47], [16.33, 40.72, 26.86, 85.47, 109.91]])
cor_t = np.array([[1, .42, .30, .18, .18], [.42, 1, .45, .36, .38], [.30, .45, 1, .26, .24], [.18, .36, .26, 1, .79], [.18, .38, .24, .79, 1]])
vc, ec = pca(cov_t)
vr, er = pca(cor_t)
tsay = dict(names=["IBM", "HPQ", "INTC", "MER", "MWD"], cov=cov_t.tolist(), cor=cor_t.tolist(),
            cov_pca=dict(values=vc.tolist(), prop=(vc / vc.sum()).tolist(), vectors=ec.tolist(),
                         book_values=[256.16, 116.14, 64.91, 46.82, 22.11], book_e1=[0.246, 0.461, 0.409, 0.522, 0.536], book_e2=[0.327, 0.360, 0.585, -0.452, -0.467]),
            cor_pca=dict(values=vr.tolist(), prop=(vr / 5).tolist(), vectors=er.tolist(),
                         book_values=[2.456, 1.145, 0.699, 0.495, 0.205], book_e1=[0.342, 0.474, 0.387, 0.503, 0.505], book_e2=[0.525, 0.314, 0.405, -0.481, -0.481]))

# ---- Frye / Hull 16.9
tenors = ["3m", "6m", "1y", "2y", "3y", "4y", "5y", "7y", "10y", "30y"]
tenor_years = [0.25, 0.5, 1, 2, 3, 4, 5, 7, 10, 30]
pc1 = [0.21, 0.26, 0.32, 0.35, 0.36, 0.36, 0.36, 0.34, 0.31, 0.25]
pc2 = [-0.57, -0.49, -0.32, -0.10, 0.02, 0.14, 0.17, 0.27, 0.30, 0.33]
pc3 = [0.50, 0.23, -0.37, -0.38, -0.30, -0.12, -0.04, 0.15, 0.28, 0.46]
sds_f = [17.49, 6.05, 3.10, 2.17, 1.97, 1.69, 1.27, 1.24, 0.80, 0.79]
tot = sum(s * s for s in sds_f)
shares = [s * s / tot for s in sds_f]
# a reconstructed covariance from the three printed factors (the rest of the loadings are not printed): Sigma3 = sum_i sd_i^2 e_i e_i'
E3 = np.array([pc1, pc2, pc3])
Sigma3 = sum(sds_f[i] ** 2 * np.outer(E3[i], E3[i]) for i in range(3))
v3, e3 = pca(Sigma3)
book = dict(exposures=[10, 4, -8, -7, 2], tenors=["1y", "2y", "3y", "4y", "5y"])
idx = [tenors.index(t) for t in book["tenors"]]
f1 = sum(e * pc1[i] for e, i in zip(book["exposures"], idx))
f2 = sum(e * pc2[i] for e, i in zip(book["exposures"], idx))
sd_book = math.sqrt((f1 * sds_f[0]) ** 2 + (f2 * sds_f[1]) ** 2)
frye = dict(tenors=tenors, tenor_years=tenor_years, pc1=pc1, pc2=pc2, pc3=pc3, sds=sds_f, total_var=tot, shares=shares,
            cum=[sum(shares[: i + 1]) for i in range(10)], one_sd_pc1_bp=[sds_f[0] * x for x in pc1],
            sigma3_eigen=dict(values=v3[:3].tolist(), recovered_pc1=e3[0].tolist()),
            book=dict(**book, f1=f1, f2=f2, sd=sd_book, var99=2.33 * sd_book, book_f1=-0.08, book_f2=-4.40, book_sd=26.66, book_var=62.12,
                      one_factor_var=2.33 * abs(f1) * sds_f[0]))

# ---- CCIL NSS (2 Jan 2026 parameters as published; no printed spot rate to compare, so this is a formula fixture)
def nss(m, b0, b1, b2, b3, t1, t2):
    a = (1 - math.exp(-m / t1)) / (m / t1)
    c = (1 - math.exp(-m / t2)) / (m / t2)
    return b0 + (b1 + b2) * a - b2 * math.exp(-m / t1) + b3 * c - b3 * math.exp(-m / t2)


p = dict(b0=7.5358, b1=-2.1464, b2=-15.2132, b3=17.6262, t1=9.5722, t2=9.8044)
nss_fx = dict(date="2026-01-02", params=p, source="CCIL ZCYC parameters page", tenors=tenor_years, rates=[nss(m, **p) for m in tenor_years],
              short_end_limit=p["b0"] + p["b1"], long_end_limit=p["b0"])

key = dict(two=two, five=five, wilmott184=wilmott184, hull163=hull163, tsay=tsay, frye=frye, nss=nss_fx)
with open(os.path.join(web, "engine", "__fixtures__", "key-E3.json"), "w") as f:
    json.dump(key, f, indent=1, default=float)

print("five at A's risk:", five["at_A_risk"], "\nno-short at 20 %:", noshort_at_20, "\ntangency:", five["tangency"])
print("wilmott 18.4:", w4, risk(w4, S4))
print("tsay cov eig:", np.round(vc, 2), "e1", np.round(ec[0], 3), "e2", np.round(ec[1], 3))
print("frye shares:", [round(s, 4) for s in shares[:3]], "book", f1, f2, sd_book, 2.33 * sd_book, "sigma3 recovered pc1", np.round(e3[0], 2))
print("nss:", [round(x, 3) for x in nss_fx["rates"]])
