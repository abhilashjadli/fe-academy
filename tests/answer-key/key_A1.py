"""Answer key for chapter A1 (lognormal, Student-t, tails). Uses scipy. -> key-A1.json"""
import json, os, math
import numpy as np
from scipy import stats, special
key = {}
key["lognormal"] = []
for mu, s in [(0, 0.5), (0.1, 0.2), (-0.3, 1.0), (0, 0.02)]:
    d = stats.lognorm(s=s, scale=math.exp(mu))
    key["lognormal"].append(dict(mu=mu, sigma=s, mean=d.mean(), median=d.median(), mode=math.exp(mu - s * s), var=d.var(),
                                 skew=float(d.stats(moments="s")), pdf=[[y, d.pdf(y)] for y in (0.2, 0.5, 1, 1.5, 3)], cdf=[[y, d.cdf(y)] for y in (0.5, 1, 2)]))
key["t"] = []
for nu in [1.5, 2.5, 3, 4, 5, 10, 30]:
    d = stats.t(nu)
    key["t"].append(dict(nu=nu, pdf=[[x, d.pdf(x)] for x in (0, 0.5, 1, 2, 4, 8)], cdf=[[x, d.cdf(x)] for x in (-3, -1, 0, 1.5, 4)],
                         var=(nu / (nu - 2) if nu > 2 else None)))
key["betainc"] = [dict(a=a, b=b, x=x, v=float(special.betainc(a, b, x))) for a, b, x in [(2, 0.5, 0.3), (0.75, 0.5, 0.9), (5, 5, 0.5), (1.5, 2.5, 0.1)]]
key["lngamma"] = [dict(z=z, v=float(special.gammaln(z))) for z in (0.5, 1, 1.5, 2.75, 10, 50.5)]
key["tails"] = {}
for k in (2, 3, 4, 5, 6):
    pn = 2 * stats.norm.sf(k)
    key["tails"][str(k)] = dict(normal=pn, normal_years=1 / (252 * pn))
    for nu in (3, 4, 5, 10):
        c = math.sqrt((nu - 2) / nu)  # scale so sd = 1
        pt = 2 * stats.t(nu).sf(k / c)
        key["tails"][str(k)][f"t{nu}"] = pt
        key["tails"][str(k)][f"t{nu}_years"] = 1 / (252 * pt)
key["drag"] = dict(median_factor=0.9999 ** 125, log_median=125 * math.log(0.9999), mean_factor=1.0)
# sample moments of a fixed array
xs = np.array([1.0, 2.0, 2.0, 3.0, 7.0, -1.0, 0.5, 2.5])
m = xs.mean(); sd = xs.std()
key["moments"] = dict(xs=xs.tolist(), mean=m, sd=sd, skew=float(stats.skew(xs)), kurt=float(stats.kurtosis(xs, fisher=False)))
out = os.path.join(os.path.dirname(__file__), "..", "..", "apps", "web", "src", "engine", "__fixtures__", "key-A1.json")
json.dump(key, open(out, "w"))
print("wrote", os.path.normpath(out))
