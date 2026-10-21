"""Answer key for chapter 0.1 (Taylor) and shared engine functions.
Independent Python implementation. Run: python3 -I tests/answer-key/key_0_1.py
Writes apps/web/src/engine/__fixtures__/key-0.1.json consumed by Vitest."""
import json, math, os
from statistics import NormalDist
from math import comb

N = NormalDist()

def bs_call(S, K, r, s, T):
    d1 = (math.log(S / K) + (r + 0.5 * s * s) * T) / (s * math.sqrt(T))
    d2 = d1 - s * math.sqrt(T)
    price = S * N.cdf(d1) - K * math.exp(-r * T) * N.cdf(d2)
    delta = N.cdf(d1)
    gamma = N.pdf(d1) / (S * s * math.sqrt(T))
    speed = -gamma / S * (1 + d1 / (s * math.sqrt(T)))
    return dict(d1=d1, d2=d2, price=price, delta=delta, gamma=gamma, speed=speed)

# nth derivatives at a
def dcos(n, a):
    return [math.cos, lambda x: -math.sin(x), lambda x: -math.cos(x), math.sin][n % 4](a)
def dexp(n, a):
    return math.exp(a)
def dln(n, a):
    return math.log(a) if n == 0 else (-1) ** (n - 1) * math.factorial(n - 1) / a ** n
def dsqrt1p(n, a):  # (1+x)^(1/2)
    c = 1.0
    for k in range(n):
        c *= (0.5 - k)
    return c * (1 + a) ** (0.5 - n)

FUNCS = {"cos": dcos, "exp": dexp, "ln": dln, "sqrt1p": dsqrt1p}

def taylor(fn, n, a, x):
    return sum(FUNCS[fn](k, a) / math.factorial(k) * (x - a) ** k for k in range(n + 1))

key = {}
key["normal"] = [dict(x=x, pdf=N.pdf(x), cdf=N.cdf(x)) for x in (-3, -1.5, -0.35, 0, 0.15, 0.35, 1, 2.5, 6)]
key["bs"] = [dict(S=S, K=K, r=r, sigma=s, T=T, **bs_call(S, K, r, s, T))
             for (S, K, r, s, T) in [(100, 100, .05, .2, 1), (110, 100, .05, .2, 1), (42, 40, .10, .2, .5), (70, 100, .05, .2, 1), (100, 100, .05, .2, 0.02)]]
key["taylor"] = []
for fn, a, xs, ns in [("cos", 0, [0.1, 1, 2.5], [0, 2, 4, 8]), ("exp", 0, [1, -2], [0, 1, 2, 5, 10]),
                      ("ln", 1, [1.5, 0.5, 1.99], [1, 2, 5, 10, 20]), ("sqrt1p", 0, [0.5, -0.5], [1, 2, 5, 10]),
                      ("cos", 1.2, [1.5, 0.3], [1, 2, 3, 6])]:
    for x in xs:
        for n in ns:
            key["taylor"].append(dict(fn=fn, a=a, x=x, n=n, value=taylor(fn, n, a, x)))
key["exp_partial_sums_at_1"] = [sum(1 / math.factorial(k) for k in range(n + 1)) for n in range(10)]
key["ln_partial_sums"] = {str(x): [taylor("ln", n, 1, x) for n in range(1, 13)] for x in (1.5, 2.5)}
key["bs_ladder"] = []
b = bs_call(100, 100, .05, .2, 1)
for dS in (-30, -10, -1, 1, 5, 10, 20, 30):
    exact = bs_call(100 + dS, 100, .05, .2, 1)["price"] - b["price"]
    key["bs_ladder"].append(dict(dS=dS, first=b["delta"] * dS, second=b["delta"] * dS + 0.5 * b["gamma"] * dS ** 2,
                                 third=b["delta"] * dS + 0.5 * b["gamma"] * dS ** 2 + b["speed"] * dS ** 3 / 6, exact=exact))
# chapter 0.2 seeds (used later)
key["binomial"] = dict(c5=[comb(5, k) for k in range(6)], p100_ge60=sum(comb(100, k) for k in range(60, 101)) / 2 ** 100,
                       die_var=35 / 12, dice100_sd=math.sqrt(100 * 35 / 12))
out = os.path.join(os.path.dirname(__file__), "..", "..", "apps", "web", "src", "engine", "__fixtures__", "key-0.1.json")
json.dump(key, open(out, "w"), indent=1)
print("wrote", os.path.normpath(out), len(key["taylor"]), "taylor cases")
