"""Answer key for the real NIFTY surface on 23 Oct 2026 (D2 Figure 4, D3 Figure 4). numpy + scipy.
-> apps/web/src/engine/__fixtures__/key-surface.json  (everything, for the engine tests)
-> apps/web/src/data/nifty-surface-2026-10-23.json    (the slice the two figures read)

Source: NSE F&O bhavcopy for 23 Oct 2026 (fo231026.zip: op231026.csv + fo231026.csv), trimmed to the NIFTY 2026 contracts
with strikes 21,000-24,500 in data/nifty-fo-2026-10-23.csv. The bhavcopy is the close of the day; the running chain in
C1-D3 is a screenshot taken during the session, so the 3 Nov row here differs a little from the chain's own numbers
(22,600 call 239.85 at the close against 249.15 on the screen, implied vol 15.9 % against 15.85 %). Same conventions as
key_D2.py: Black-76 on the forward, r = 6.5 % continuous, T in calendar days / 365, the forward of each expiry implied
from put-call parity at the strikes nearest the index (C1's convention, not the futures close), and the smile of each
expiry fitted as a quadratic in log-moneyness to the call and put implied vols at the strikes 22,250-23,050 that traded
on both sides. The at-the-money variance skew d(sigma^2)/dk at k = 0 is 2ab for the quadratic a + b k + c k^2, which is
also what a +-1 % finite difference gives to three decimals.
"""
import csv, datetime, json, math, os, re
import numpy as np
from scipy.stats import norm

here = os.path.dirname(os.path.abspath(__file__))
fx = os.path.join(here, "..", "..", "apps", "web", "src", "engine", "__fixtures__")
data_out = os.path.join(here, "..", "..", "apps", "web", "src", "data")

DAY0 = datetime.date(2026, 10, 23)
SPOT = 22600.0
R = 0.065
PAT = re.compile(r"^(OPTIDXNIFTY|FUTIDXNIFTY)(\d{2}-[A-Z]{3}-\d{4})(CE|PE)?(\d+(?:\.\d+)?)?$")
GRID = [22250, 22500, 22600, 22700, 23050]  # D2's featured strikes
FIT_LO, FIT_HI = 22250, 23050  # D2's fitted band
EXPIRIES = ["27-OCT-2026", "03-NOV-2026", "23-NOV-2026", "29-DEC-2026"]  # weekly, the chain, monthly, quarterly
LABELS = {"27-OCT-2026": "27 Oct", "03-NOV-2026": "3 Nov", "23-NOV-2026": "23 Nov", "29-DEC-2026": "29 Dec"}


def b76(F, K, T, s, call=True):
    st = s * math.sqrt(T)
    d1 = (math.log(F / K) + 0.5 * st * st) / st
    d2 = d1 - st
    D = math.exp(-R * T)
    return D * ((F * norm.cdf(d1) - K * norm.cdf(d2)) if call else (K * norm.cdf(-d2) - F * norm.cdf(-d1)))


def iv(price, F, K, T, call=True):
    lo, hi = 1e-4, 3.0
    for _ in range(100):
        m = 0.5 * (lo + hi)
        if b76(F, K, T, m, call) < price:
            lo = m
        else:
            hi = m
    return 0.5 * (lo + hi)


chain, futures = {}, {}
with open(os.path.join(here, "data", "nifty-fo-2026-10-23.csv")) as f:
    for r in csv.DictReader(f):
        m = PAT.match(r["CONTRACT_D"])
        kind, exp, cp, k = m.groups()
        if kind == "FUTIDXNIFTY":
            futures[exp] = float(r["SETTLEMENT"])
            continue
        if float(r["TRADED_QUA"]) <= 0:
            continue  # settlement of an untraded contract is a theoretical price
        chain.setdefault(exp, {}).setdefault(int(float(k)), {})[cp] = dict(settle=float(r["SETTLEMENT"]), oi=int(float(r["OI_NO_CON"])), qty=float(r["TRADED_QUA"]))

key = dict(source="NSE F&O bhavcopy, close of 23 Oct 2026", spot=SPOT, r=R, futures=futures, expiries={})
for exp in EXPIRIES:
    days = (datetime.datetime.strptime(exp, "%d-%b-%Y").date() - DAY0).days
    T = days / 365
    D = math.exp(-R * T)
    both = {k: v for k, v in chain[exp].items() if "CE" in v and "PE" in v}
    # forward: parity at the strikes within 1 % of the index, median (one stale pair cannot move it)
    near = sorted(k for k in both if abs(k / SPOT - 1) < 0.01)
    Fs = sorted(k + (both[k]["CE"]["settle"] - both[k]["PE"]["settle"]) / D for k in near)
    F = float(Fs[len(Fs) // 2])
    strikes = sorted(k for k in both if FIT_LO <= k <= FIT_HI)
    civ = np.array([iv(both[k]["CE"]["settle"], F, k, T, True) for k in strikes])
    piv = np.array([iv(both[k]["PE"]["settle"], F, k, T, False) for k in strikes])
    kk = np.log(np.array(strikes, float) / F)
    X = np.concatenate([kk, kk])
    A = np.vstack([np.ones_like(X), X, X * X]).T
    Y = np.concatenate([civ, piv])
    a, b, c = (float(v) for v in np.linalg.lstsq(A, Y, rcond=None)[0])
    resid = A @ np.array([a, b, c]) - Y
    h = 0.01
    s_up, s_dn = a + b * h + c * h * h, a - b * h + c * h * h
    otm = [float(piv[i] if k < F else civ[i]) for i, k in enumerate(strikes)]
    grid_vol = [otm[strikes.index(k)] for k in GRID]
    key["expiries"][exp] = dict(
        label=LABELS[exp], days=days, T=T, forward=F, parity_strikes=near, futures_settle=futures.get(exp),
        strikes=strikes, call_settle=[both[k]["CE"]["settle"] for k in strikes], put_settle=[both[k]["PE"]["settle"] for k in strikes],
        call_iv=civ.tolist(), put_iv=piv.tolist(), otm_iv=otm,
        fit=dict(a=a, b=b, c=c, rms_vol_pts=float(100 * math.sqrt(np.mean(resid ** 2))), max_abs_vol_pts=float(100 * np.max(np.abs(resid)))),
        atm_vol=a, var_skew=2 * a * b, var_skew_fd_1pct=(s_up * s_up - s_dn * s_dn) / (2 * h),
        grid_strikes=GRID, grid_vol=grid_vol,
    )

# forward variance between the chain and the monthly, at the money (D2 Figure 4's line: variances add, not vols)
e1, e2 = key["expiries"]["03-NOV-2026"], key["expiries"]["23-NOV-2026"]
key["forward_var_3nov_23nov"] = dict(
    T1=e1["T"], T2=e2["T"], v1=e1["atm_vol"], v2=e2["atm_vol"],
    forward_vol=math.sqrt((e2["atm_vol"] ** 2 * e2["T"] - e1["atm_vol"] ** 2 * e1["T"]) / (e2["T"] - e1["T"])),
)

with open(os.path.join(fx, "key-surface.json"), "w") as f:
    json.dump(key, f, indent=1, default=float)

# the slice the figures read (D2 F4Surface real block, D3 F4Together second-expiry rows)
slim = dict(
    source="NSE NIFTY, close of 23 Oct 2026 (bhavcopy): 27 Oct and 3 Nov weeklies, 23 Nov monthly, 29 Dec quarterly",
    spot=SPOT,
    expiries=[dict(label=e["label"], days=e["days"], T=e["T"], F=e["forward"], atmVol=e["atm_vol"], varSkew=e["var_skew"], gridVol=e["grid_vol"]) for e in key["expiries"].values()],
    gridStrikes=GRID,
)
with open(os.path.join(data_out, "nifty-surface-2026-10-23.json"), "w") as f:
    json.dump(slim, f, indent=1, default=float)

for exp, e in key["expiries"].items():
    print(f"{e['label']:7s} {e['days']:3d} d  F {e['forward']:9.1f} (fut {e['futures_settle']})  n {len(e['strikes'])}  atm {100 * e['atm_vol']:.2f} %  "
          f"var skew {e['var_skew']:.4f} (fd {e['var_skew_fd_1pct']:.4f})  fit rms {e['fit']['rms_vol_pts']:.2f} pts  grid {[round(100 * v, 1) for v in e['grid_vol']]}")
print("forward vol 3 Nov -> 23 Nov:", round(100 * key["forward_var_3nov_23nov"]["forward_vol"], 2), "%")
