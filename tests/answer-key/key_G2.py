"""Answer key for chapter G2 (unsupervised: clustering, PCA, autoencoders). numpy only.
-> apps/web/src/engine/__fixtures__/key-G2.json

All on the repo's real NIFTY record. Conventions (the TS engine engine/unsupervised.ts mirrors these exactly):
- Days t = 20..n-1 of the return record. x_t = 100 r_t (today's move, %), y_t = 100 sqrt(252 mean(r^2 over t-20..t-1)) (trailing realised vol, % a year).
  Standardised features: (x - mean)/sd per axis over all days (population sd).
- k-means (Lloyd): centres start at k distinct days chosen with mulberry32(seed): i = floor(u * n), redraw on repeat. Assign by squared
  Euclidean distance (ties to the lower index); recentre; stop when every centre moved < 1e-9 in both coordinates, or after 200 rounds.
  "rounds" counts assignment passes including the final unchanged one. Within-pile spread = sum of squared distances to own centre.
- Silhouette: mean over days of (b - a)/max(a, b), a = mean distance to own pile (excluding self), b = min over other piles of the mean distance.
- PCA: rows X_t = (a_{t-20}, ..., a_{t-1}) with a = 100|r| (oldest first), t = 20..n-1; centred by the column means; covariance with 1/n;
  eigen-decomposition; sign convention: PC1 has positive mean loading, PC2 is positive on the oldest day, PC3 positive on the middle day (index 9).
- Autoencoder 20 -> h -> 20: W1 (20 x h) then W2 (h x 20) filled row-major from mulberry32 normals (Box-Muller as engine/random.ts) times 0.1;
  biases zero; full-batch gradient descent on mean squared error over all entries; loss recorded before each update.
"""
import json, math, os
import numpy as np

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


here = os.path.dirname(os.path.abspath(__file__))
web = os.path.join(here, "..", "..", "apps", "web", "src")
rec = json.load(open(os.path.join(web, "data", "nifty50-long.json")))
rets = np.array([row["r"] for row in rec["returns"]], float)
rdates = [row["d"] for row in rec["returns"]]
n = len(rets)
W = 20

# ---------------------------------------------------------------- features
x = 100.0 * rets[W:]
y = np.array([100.0 * math.sqrt(252.0 * np.mean(rets[t - W:t] ** 2)) for t in range(W, n)])
P = np.column_stack([x, y])
days = rdates[W:]
N = len(P)
mu, sd = P.mean(0), P.std(0)
Ps = (P - mu) / sd


def kmeans(Q, k, seed, max_rounds=200):
    nxt = mulberry32(seed)
    idx = []
    while len(idx) < k:
        i = int(math.floor(nxt() * len(Q)))
        if i not in idx:
            idx.append(i)
    C = Q[idx].copy()
    rounds = 0
    while True:
        rounds += 1
        D = ((Q[:, None, :] - C[None, :, :]) ** 2).sum(2)
        lab = D.argmin(1)
        spread = float(D[np.arange(len(Q)), lab].sum())
        newC = np.array([Q[lab == j].mean(0) if (lab == j).any() else C[j] for j in range(k)])
        moved = float(np.abs(newC - C).max())
        if moved < 1e-9 or rounds >= max_rounds:
            C = newC
            break
        C = newC
    # final assignment with the settled centres
    D = ((Q[:, None, :] - C[None, :, :]) ** 2).sum(2)
    lab = D.argmin(1)
    spread = float(D[np.arange(len(Q)), lab].sum())
    return dict(init=idx, centres=C.tolist(), labels=lab.tolist(), sizes=[int((lab == j).sum()) for j in range(k)],
                spread=spread, rounds=rounds)


def kmeans_trace(Q, k, seed, max_rounds=200):
    """Every round's centres and pile sizes, for the step-through."""
    nxt = mulberry32(seed)
    idx = []
    while len(idx) < k:
        i = int(math.floor(nxt() * len(Q)))
        if i not in idx:
            idx.append(i)
    C = Q[idx].copy()
    trace = []
    for r in range(max_rounds):
        D = ((Q[:, None, :] - C[None, :, :]) ** 2).sum(2)
        lab = D.argmin(1)
        spread = float(D[np.arange(len(Q)), lab].sum())
        trace.append(dict(round=r + 1, centres=C.tolist(), sizes=[int((lab == j).sum()) for j in range(k)], spread=spread))
        newC = np.array([Q[lab == j].mean(0) if (lab == j).any() else C[j] for j in range(k)])
        if float(np.abs(newC - C).max()) < 1e-9:
            break
        C = newC
    return trace


def silhouette(Q, lab, k):
    D = np.sqrt(((Q[:, None, :] - Q[None, :, :]) ** 2).sum(2))
    s = np.zeros(len(Q))
    for i in range(len(Q)):
        own = lab == lab[i]
        a = D[i, own].sum() / max(1, own.sum() - 1)
        b = min(D[i, lab == j].mean() for j in range(k) if j != lab[i] and (lab == j).any())
        s[i] = (b - a) / max(a, b) if max(a, b) > 0 else 0.0
    return float(s.mean())


def describe(run, Q):
    out = []
    lab = np.array(run["labels"])
    for j in range(len(run["centres"])):
        m = lab == j
        ds = [days[i] for i in np.where(m)[0]]
        out.append(dict(size=int(m.sum()), centre=run["centres"][j], mean_move=float(x[m].mean()), mean_vol=float(y[m].mean()),
                        first=ds[0], last=ds[-1], months=sorted(set(d[:7] for d in ds)) if m.sum() <= 60 else None))
    return out


SEED = 1
fig0 = dict(
    features=dict(start=days[0], end=days[-1], n=N, x_mean=float(mu[0]), y_mean=float(mu[1]), x_sd=float(sd[0]), y_sd=float(sd[1])),
    points=[[round(float(a), 4), round(float(b), 3)] for a, b in P],
    days=days,
    raw={str(k): dict(**kmeans(P, k, SEED), piles=None) for k in (2, 3, 4)},
    standardised={str(k): dict(**kmeans(Ps, k, SEED), piles=None) for k in (2, 3, 4)},
    trace_raw_k2=kmeans_trace(P, 2, SEED),
    trace_raw_k3=kmeans_trace(P, 3, SEED),
)
for mode, Q in (("raw", P), ("standardised", Ps)):
    for k in ("2", "3", "4"):
        fig0[mode][k]["piles"] = describe(fig0[mode][k], Q)

# Figure 1: how many piles
seeds = [1, 2, 3]
fig1_rows = []
for k in range(1, 8):
    per_seed = []
    for s in seeds:
        if k == 1:
            c = P.mean(0)
            per_seed.append(dict(seed=s, spread=float(((P - c) ** 2).sum()), rounds=1, silhouette=None))
        else:
            run = kmeans(P, k, s)
            per_seed.append(dict(seed=s, spread=run["spread"], rounds=run["rounds"], silhouette=silhouette(P, np.array(run["labels"]), k)))
    best = min(per_seed, key=lambda r: r["spread"])
    fig1_rows.append(dict(k=k, per_seed=per_seed, best_spread=best["spread"], best_silhouette=best["silhouette"]))
fig1 = dict(seeds=seeds, rows=fig1_rows)

# Figure 2: PCA of 20-day windows of move sizes
a = 100.0 * np.abs(rets)
X = np.array([a[t - W:t] for t in range(W, n)])
colmean = X.mean(0)
Xc = X - colmean
S = Xc.T @ Xc / len(Xc)
vals, vecs = np.linalg.eigh(S)
order = vals.argsort()[::-1]
vals, vecs = vals[order], vecs[:, order]
# sign conventions
if vecs[:, 0].mean() < 0:
    vecs[:, 0] *= -1
if vecs[0, 1] < 0:
    vecs[:, 1] *= -1
if vecs[9, 2] < 0:
    vecs[:, 2] *= -1
for j in range(3, W):
    if vecs[np.abs(vecs[:, j]).argmax(), j] < 0:
        vecs[:, j] *= -1
share = vals / vals.sum()
recon = []
for k in range(0, W + 1):
    Vk = vecs[:, :k]
    R = (Xc @ Vk) @ Vk.T
    recon.append(float(np.mean((R - Xc) ** 2)))
Z = Xc @ vecs
i1, i2max, i2min = int(Z[:, 0].argmax()), int(Z[:, 1].argmax()), int(Z[:, 1].argmin())
# a calm window: the one with the smallest PC1 score
icalm = int(Z[:, 0].argmin())


def window(i):
    return dict(index=i, ends=rdates[W + i - 1], values=X[i].tolist(), scores=Z[i, :3].tolist(),
                recon={str(k): (colmean + (Z[i, :k] @ vecs[:, :k].T)).tolist() for k in (1, 2, 3, 5, 10, 20)})


fig2 = dict(
    W=W, n_windows=int(len(X)), colmean=colmean.tolist(), total_variance=float(np.mean(Xc ** 2)),
    eigenvalues=vals.tolist(), share=share.tolist(), cumulative=np.cumsum(share).tolist(),
    loadings=[vecs[:, j].tolist() for j in range(W)],
    recon_mse=recon,
    windows=dict(pc1_max=window(i1), pc2_max=window(i2max), pc2_min=window(i2min), calm=window(icalm)),
    tsay=dict(source="Tsay, Analysis of Financial Time Series 2e, Example 9.3 (IBM, HPQ, INTC, MER, MWD monthly 1990-99, correlation matrix)",
              lambda1=2.456, share1=2.456 / 5, e1=[0.342, 0.474, 0.387, 0.503, 0.505], lambda2=1.145),
)

# Figure 3: autoencoder 20 -> 2 -> 20
LOG_AT = [0, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 3000]


def train(h, act, lr, epochs, seed=1):
    nxt = mulberry32(seed)
    p = W
    W1 = np.array([[0.1 * normal_sample(nxt) for _ in range(h)] for _ in range(p)])
    W2 = np.array([[0.1 * normal_sample(nxt) for _ in range(p)] for _ in range(h)])
    b1 = np.zeros(h)
    b2 = np.zeros(p)
    log = {}
    loss = None
    for e in range(epochs + 1):
        Hpre = Xc @ W1 + b1
        H = np.tanh(Hpre) if act == "tanh" else Hpre
        Y = H @ W2 + b2
        E = Y - Xc
        loss = float(np.mean(E ** 2))
        if e in LOG_AT:
            log[str(e)] = dict(loss=loss, hidden_pc2min=H[i2min].tolist(), recon_pc2min=(colmean + Y[i2min]).tolist())
        if e == epochs:
            break
        G = 2.0 * E / E.size
        gW2 = H.T @ G
        gb2 = G.sum(0)
        gH = G @ W2.T
        if act == "tanh":
            gH = gH * (1 - H ** 2)
        gW1 = Xc.T @ gH
        gb1 = gH.sum(0)
        W1 -= lr * gW1
        b1 -= lr * gb1
        W2 -= lr * gW2
        b2 -= lr * gb2
    return dict(h=h, act=act, lr=lr, epochs=epochs, seed=seed, log=log, final_loss=loss)


linear = train(2, "linear", 0.2, 3000)
tanh = train(2, "tanh", 0.5, 3000)
fig3 = dict(log_at=LOG_AT, linear=linear, tanh=tanh, pca2_floor=recon[2], pca1_floor=recon[1], total_variance=float(np.mean(Xc ** 2)))

key = dict(fig0=fig0, fig1=fig1, fig2=fig2, fig3=fig3, meta=dict(record=rec["source"], n_returns=int(n), W=W, seed=SEED))
with open(os.path.join(web, "engine", "__fixtures__", "key-G2.json"), "w") as f:
    json.dump(key, f, separators=(",", ":"), default=float)

print("fig0 raw", {k: (v["sizes"], v["rounds"], round(v["spread"])) for k, v in fig0["raw"].items()})
print("fig0 std", {k: (v["sizes"], v["rounds"], round(v["spread"])) for k, v in fig0["standardised"].items()})
print("small pile", [p for p in fig0["raw"]["2"]["piles"] if p["size"] < 100])
print("fig1", [(r["k"], round(r["best_spread"]), None if r["best_silhouette"] is None else round(r["best_silhouette"], 3)) for r in fig1_rows])
print("fig2 share", np.round(100 * share[:4], 1), "recon", [round(v, 4) for v in recon[:4]], "ends", fig2["windows"]["pc2_min"]["ends"], fig2["windows"]["pc2_max"]["ends"], fig2["windows"]["calm"]["ends"])
print("fig3 linear", {k: round(v["loss"], 4) for k, v in linear["log"].items()}, "tanh", {k: round(v["loss"], 4) for k, v in tanh["log"].items()}, "floor", round(recon[2], 4))
