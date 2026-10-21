"""Answer key for chapter 0.2 (counting, binomial, normal). Independent Python.
Run: python3 -I tests/answer-key/key_0_2.py -> apps/web/src/engine/__fixtures__/key-0.2.json"""
import json, math, os
from math import comb
from statistics import NormalDist
from fractions import Fraction
N = NormalDist()

def conv(a, b):
    out = [0.0] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        for j, y in enumerate(b):
            out[i + j] += x * y
    return out

def sum_of(p, n):
    acc = [1.0]
    for _ in range(n):
        acc = conv(acc, p)
    return acc

key = {}
key["pascal"] = {str(n): [comb(n, k) for k in range(n + 1)] for n in (0, 1, 5, 10, 12, 30)}
key["choose"] = [dict(n=n, k=k, v=comb(n, k)) for n, k in [(5, 2), (10, 3), (30, 15), (100, 50), (12, 0), (12, 12), (7, 9)]]
key["binomial"] = []
for n, p in [(5, 0.5), (10, 0.3), (100, 0.5), (50, 0.95)]:
    pmf = [comb(n, k) * p ** k * (1 - p) ** (n - k) for k in range(n + 1)]
    key["binomial"].append(dict(n=n, p=p, pmf=pmf, mean=n * p, var=n * p * (1 - p)))
fair = [1 / 6] * 6
skew = [w / 21 for w in (6, 5, 4, 3, 2, 1)]
key["dice"] = []
for name, d in (("fair", fair), ("skew", skew)):
    for n in (1, 2, 5, 15, 50):
        s = sum_of(d, n)
        mean = sum(pr * (n + i) for i, pr in enumerate(s))
        var = sum(pr * (n + i - mean) ** 2 for i, pr in enumerate(s))
        key["dice"].append(dict(die=name, n=n, x0=n, p=s, mean=mean, var=var))
s100 = sum_of(fair, 100)
mean100 = 350.0; sd100 = math.sqrt(100 * 35 / 12)
key["dice100"] = dict(mean=mean100, sd=sd100, p_gt_400_exact=sum(pr for i, pr in enumerate(s100) if 100 + i > 400),
                      p_gt_400_normal_cc=1 - N.cdf((400.5 - mean100) / sd100),
                      band95=[mean100 - 1.959964 * sd100, mean100 + 1.959964 * sd100],
                      mass_in_band=sum(pr for i, pr in enumerate(s100) if abs(100 + i - mean100) <= 1.959964 * sd100))
key["coins100"] = dict(p_ge_60_exact=sum(comb(100, k) for k in range(60, 101)) / 2 ** 100, p_ge_60_normal_cc=1 - N.cdf((59.5 - 50) / 5))
key["rule"] = [2 * N.cdf(z) - 1 for z in (1, 2, 3)]
out = os.path.join(os.path.dirname(__file__), "..", "..", "apps", "web", "src", "engine", "__fixtures__", "key-0.2.json")
json.dump(key, open(out, "w"))
print("wrote", os.path.normpath(out))
