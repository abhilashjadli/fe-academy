"""Answer key for A2 (covariance, Cholesky, eigen, PCA). numpy. -> key-A2.json"""
import json, os, numpy as np
key = {}
mats = {"rho06": [[1, 0.6], [0.6, 1]], "s4223": [[4, 2], [2, 3]],
        "three": [[2.0, 0.5, 0.3], [0.5, 1.5, -0.4], [0.3, -0.4, 1.0]]}
key["matrices"] = []
for name, S in mats.items():
    S = np.array(S, float)
    L = np.linalg.cholesky(S)
    w, V = np.linalg.eigh(S)
    order = np.argsort(w)[::-1]
    w, V = w[order], V[:, order]
    vecs = []
    for j in range(V.shape[1]):
        v = V[:, j]
        m = v[np.argmax(np.abs(v))]
        vecs.append((v if m >= 0 else -v).tolist())
    key["matrices"].append(dict(name=name, S=S.tolist(), L=L.tolist(), Linv=np.linalg.inv(L).tolist(), eigvals=w.tolist(), eigvecs=vecs,
                                proj_var_1_1=float(np.array([1, 1]) @ S[:2, :2] @ np.array([1, 1]) / 2) if S.shape[0] == 2 else None))
# sample covariance/correlation of a fixed small dataset (population, divide by n)
X = np.array([[1.0, 2.0], [2.0, 1.5], [3.0, 3.5], [4.0, 3.0], [5.0, 6.0], [6.0, 5.5]])
C = np.cov(X.T, bias=True)
key["sample"] = dict(X=X.tolist(), cov=C.tolist(), corr=float(np.corrcoef(X.T)[0, 1]))
# six-asset factor model: PC1 share
rng = np.random.default_rng(7)
n = 4000
mkt = rng.standard_normal(n); s1 = rng.standard_normal(n); s2 = rng.standard_normal(n)
beta = np.array([1.0, 0.9, 1.1, 0.8, 1.2, 1.0]); sec = np.array([1, 1, 1, 0, 0, 0]); sec2 = 1 - sec
E = rng.standard_normal((n, 6))
R = np.outer(mkt, beta) * 1.0 + np.outer(s1, sec) * 0.6 + np.outer(s2, sec2) * 0.6 + E * 0.8
Ccorr = np.corrcoef(R.T)
w, V = np.linalg.eigh(Ccorr)
key["six"] = dict(pc1_share=float(np.sort(w)[::-1][0] / w.sum()), corr=Ccorr.tolist())
out = os.path.join(os.path.dirname(__file__), "..", "..", "apps", "web", "src", "engine", "__fixtures__", "key-A2.json")
json.dump(key, open(out, "w"))
print("wrote", os.path.normpath(out), "pc1 share", key["six"]["pc1_share"])
