"""Answer key for chapter F1 (finite-difference solvers). numpy + scipy only.
-> apps/web/src/engine/__fixtures__/key-F1.json

Two stencils, both as the books write them:
- Forward form (the site's convention, the real call): V_t + 1/2 s^2 F^2 V_FF - r V = 0 on a grid F in [Flo, Fhi], boundaries V(Flo) = 0 and
  V(Fhi) = e^{-r tau}(Fhi - K); a_j = 1/2 s^2 F_j^2 / dF^2; L V = a_j (V_{j-1} - 2 V_j + V_{j+1}) - r V_j; explicit V+ = V + dt L V; implicit
  (I - dt L) V+ = V; Crank-Nicolson (I - dt L/2) V+ = (I + dt L/2) V; Rannacher = the first time step replaced by two implicit half-steps.
- Hull's spot-grid stencil (Example 18.1): equations 18.25 (implicit) and 18.32 (explicit) exactly, S = j dS, j = 0..M, with his boundaries
  f(0) = K, f(Smax) = 0 for the put, and the American projection max(f, K - S) after each step. Crank-Nicolson on the same grid averages them.
- Wilmott's explicit loop (Tables 77.1/77.2): his code verbatim — central differences, V(0) decays at r, zero gamma at Smax, dt = 0.9/(vol^2 NAS^2).
"""
import json, math, os
import numpy as np
from scipy.stats import norm

here = os.path.dirname(os.path.abspath(__file__))
web = os.path.join(here, "..", "..", "apps", "web", "src")
kd1 = json.load(open(os.path.join(web, "engine", "__fixtures__", "key-D1.json")))

F0, K, R, T = 22603.0, 22600.0, 0.065, 11 / 365
SIG = kd1["realised"]["sold"]
FLO, FHI = 18000.0, 28000.0


def b76(F, K_, T_, s, call=True, r=R):
    st = s * math.sqrt(T_)
    d1 = (np.log(F / K_) + 0.5 * st * st) / st
    d2 = d1 - st
    D = math.exp(-r * T_)
    return D * ((F * norm.cdf(d1) - K_ * norm.cdf(d2)) if call else (K_ * norm.cdf(-d2) - F * norm.cdf(-d1)))


TRUE = float(b76(F0, K, T, SIG))


def thomas(a, b, c, d):
    """solve tridiagonal: a sub, b diag, c super, d rhs (a[0], c[-1] unused)"""
    n = len(d)
    cp = np.zeros(n)
    dp = np.zeros(n)
    cp[0] = c[0] / b[0]
    dp[0] = d[0] / b[0]
    for i in range(1, n):
        m = b[i] - a[i] * cp[i - 1]
        cp[i] = c[i] / m if i < n - 1 else 0.0
        dp[i] = (d[i] - a[i] * dp[i - 1]) / m
    x = np.zeros(n)
    x[-1] = dp[-1]
    for i in range(n - 2, -1, -1):
        x[i] = dp[i] - cp[i] * x[i + 1]
    return x


def solve_forward(M, N, scheme, rannacher=0, keep=None, call=True):
    """scheme: 'explicit' | 'implicit' | 'cn'. Returns value at F0 (linear interpolation), the final row, and optional snapshots."""
    dF = (FHI - FLO) / M
    dt = T / N
    Fg = FLO + np.arange(M + 1) * dF
    V = np.maximum(Fg - K, 0.0) if call else np.maximum(K - Fg, 0.0)
    a = 0.5 * SIG * SIG * Fg * Fg / dF / dF
    lo, di, up = a.copy(), -(2 * a + R), a.copy()
    snaps = {}

    def bc(tau):  # in the forward form a forward contract is worth e^{-r tau}(F - K): the deep-in boundary is the discounted intrinsic
        if call:
            return 0.0, math.exp(-R * tau) * (FHI - K)
        return math.exp(-R * tau) * (K - FLO), 0.0

    def step(V, th, h, tau):
        if th == 0:
            Vn = V
            W = V.copy()
            W[1:M] = Vn[1:M] + h * (lo[1:M] * Vn[0:M - 1] + di[1:M] * Vn[1:M] + up[1:M] * Vn[2:M + 1])
            W[0], W[M] = bc(tau)
            return W
        A_sub = np.concatenate([[0.0], -th * h * lo[1:M], [0.0]])
        A_dia = np.concatenate([[1.0], 1 - th * h * di[1:M], [1.0]])
        A_sup = np.concatenate([[0.0], -th * h * up[1:M], [0.0]])
        rhs = V.copy()
        rhs[1:M] = V[1:M] + (1 - th) * h * (lo[1:M] * V[0:M - 1] + di[1:M] * V[1:M] + up[1:M] * V[2:M + 1])
        rhs[0], rhs[M] = bc(tau)
        return thomas(A_sub, A_dia, A_sup, rhs)

    th = {"explicit": 0.0, "implicit": 1.0, "cn": 0.5}[scheme]
    tau = 0.0
    n = 0
    for _ in range(rannacher):
        tau += dt / 2
        V = step(V, 1.0, dt / 2, tau)
        tau += dt / 2
        V = step(V, 1.0, dt / 2, tau)
        n += 1
    for k in range(n, N):
        tau += dt
        V = step(V, th, dt, tau)
        if keep and (k + 1) in keep:
            snaps[k + 1] = V.copy()
    x = (F0 - FLO) / dF
    i = int(x)
    v = float(V[i] + (x - i) * (V[i + 1] - V[i]))
    return v, V, Fg, snaps


# ---- Figure 0: the converged rod, 101 dots, snapshots at each day (CN on M = 800, N = 88 with Rannacher; downsampled to the 101 dots)
M0, N0 = 800, 88
v0, V0, Fg0, snaps0 = solve_forward(M0, N0, "cn", rannacher=1, keep=set(range(8, 89, 8)))
dots = Fg0[::8]
rod = dict(F=dots.tolist(), days=[0] + [k / 8 for k in sorted(snaps0)], rows=[np.maximum(dots - K, 0).tolist()] + [snaps0[k][::8].tolist() for k in sorted(snaps0)],
           value_at_F0=v0, truth=TRUE, formula_row=b76(dots, K, T, SIG).tolist())
# neighbour rule for the dot nearest F0 at 11 days: pull = a (V- + V+ - 2V) - rV per year, with a on the 101-dot spacing
dF101 = dots[1] - dots[0]
j = int(round((F0 - FLO) / dF101))
Vrow = np.array(rod["rows"][-1])
a101 = 0.5 * SIG * SIG * dots[j] ** 2 / dF101 ** 2
rod["rule_example"] = dict(j=j, F=float(dots[j]), V=float(Vrow[j]), Vm=float(Vrow[j - 1]), Vp=float(Vrow[j + 1]), avg=float(0.5 * (Vrow[j - 1] + Vrow[j + 1])),
                           weight=float(a101), pull_per_year=float(a101 * (Vrow[j - 1] + Vrow[j + 1] - 2 * Vrow[j]) - R * Vrow[j]))

# ---- Figure 1: explicit scheme, the step dial
def explicit_dial(M):
    dF = (FHI - FLO) / M
    limit = dF * dF / (SIG * SIG * FHI * FHI)
    rows = []
    for days in (0.1, 0.125, 0.15, 0.175, 0.185, 0.2, 0.25, 0.3, 0.4, 0.5, 0.75, 1.0):
        N = max(1, int(round(11 / days)))
        v, V, Fg, _ = solve_forward(M, N, "explicit")
        rows.append(dict(step_days=days, N=N, price=v, max_abs=float(np.max(np.abs(V))), stable=(T / N) <= limit * (1 + 1e-9)))
    # the three weights at the top node for a given step: down = up = a dt, stay = 1 - 2 a dt - r dt
    a_top = 0.5 * SIG * SIG * FHI * FHI / dF / dF
    return dict(M=M, dF=dF, limit_years=limit, limit_days=limit * 365, min_steps=math.ceil(T / limit), a_top=a_top, rows=rows,
                weights_at=[dict(step_days=d, down=a_top * d / 365, stay=1 - 2 * a_top * d / 365 - R * d / 365) for d in (0.1, 0.185, 0.25, 0.5, 1.0)])


dial = dict(grid100=explicit_dial(100), grid50=explicit_dial(50))

# ---- Figure 2: the three schemes against grid points, and the two error slopes
def ladder(scheme):
    out = []
    for M in (25, 50, 100, 200, 400, 800):
        if scheme == "explicit":
            dF = (FHI - FLO) / M
            N = math.ceil(T / (dF * dF / (SIG * SIG * FHI * FHI))) + 1
        else:
            N = max(11, M // 9)
        v, _, _, _ = solve_forward(M, N, scheme, rannacher=1 if scheme == "cn" else 0)
        out.append(dict(M=M, N=N, price=v, error=v - TRUE))
    return out


schemes = {s: ladder(s) for s in ("explicit", "implicit", "cn")}
err_dF = {s: [dict(M=M, error=abs(solve_forward(M, 400, s, rannacher=1 if s == "cn" else 0)[0] - TRUE)) for M in (50, 100, 200, 400)] for s in ("implicit", "cn")}
err_dF["explicit"] = [dict(M=M, error=abs(solve_forward(M, max(400, math.ceil(T / ((10000 / M) ** 2 / (SIG * SIG * FHI * FHI))) + 1), "explicit")[0] - TRUE)) for M in (50, 100, 200, 400)]
err_dt = dict(
    implicit=[dict(N=N, error=solve_forward(800, N, "implicit")[0] - TRUE) for N in (2, 4, 8, 16, 32)],
    cn=[dict(N=N, error=solve_forward(800, N, "cn")[0] - TRUE) for N in (2, 4, 8, 16, 32)],
    cn_rannacher=[dict(N=N, error=solve_forward(800, N, "cn", rannacher=1)[0] - TRUE) for N in (2, 4, 8, 16, 32)],
)


def slope(pairs, key):
    x = np.log([p[key] for p in pairs])
    y = np.log([abs(p["error"]) for p in pairs])
    return float(np.polyfit(x, y, 1)[0])


slopes = dict(dF={s: slope(err_dF[s], "M") for s in err_dF}, dt={s: slope(err_dt[s], "N") for s in err_dt})
# put-call parity on the grid at M 400, N 44 (CN + Rannacher)
vc, Vc, Fg, _ = solve_forward(400, 44, "cn", rannacher=1, call=True)
vp, Vp, _, _ = solve_forward(400, 44, "cn", rannacher=1, call=False)
_dev = np.abs((Vc - Vp) - math.exp(-R * T) * (Fg - K))
parity = dict(max_abs=float(_dev.max()), at_F=float(Fg[int(np.argmax(_dev))]), interior_max_abs=float(_dev[20:-20].max()), call=vc, put=vp, true_put=float(b76(F0, K, T, SIG, False)))

# ---- Figure 3: Hull Example 18.1 on Hull's stencil
HS0, HK, HR, HSIG, HT, HSMAX, HM, HN = 50.0, 50.0, 0.10, 0.40, 5 / 12, 100.0, 20, 10


def hull_grid(scheme, american, M=HM, N=HN, Smax=HSMAX):
    dS = Smax / M
    dt = HT / N
    j = np.arange(M + 1)
    S = j * dS
    V = np.maximum(HK - S, 0.0)
    grid = [V.copy()]  # index 0 = expiry
    boundary = []
    for n in range(N):
        Vn = V.copy()
        if scheme == "explicit":
            A = (1 / (1 + HR * dt)) * (-0.5 * HR * j * dt + 0.5 * HSIG * HSIG * j * j * dt)
            B = (1 / (1 + HR * dt)) * (1 - HSIG * HSIG * j * j * dt)
            C = (1 / (1 + HR * dt)) * (0.5 * HR * j * dt + 0.5 * HSIG * HSIG * j * j * dt)
            V[1:M] = A[1:M] * Vn[0:M - 1] + B[1:M] * Vn[1:M] + C[1:M] * Vn[2:M + 1]
        else:
            th = 1.0 if scheme == "implicit" else 0.5
            lo = 0.5 * (HSIG * HSIG * j * j - HR * j)
            di = -(HSIG * HSIG * j * j + HR)
            up = 0.5 * (HSIG * HSIG * j * j + HR * j)
            sub = np.concatenate([[0.0], -th * dt * lo[1:M], [0.0]])
            dia = np.concatenate([[1.0], 1 - th * dt * di[1:M], [1.0]])
            sup = np.concatenate([[0.0], -th * dt * up[1:M], [0.0]])
            rhs = Vn.copy()
            rhs[1:M] = Vn[1:M] + (1 - th) * dt * (lo[1:M] * Vn[0:M - 1] + di[1:M] * Vn[1:M] + up[1:M] * Vn[2:M + 1])
            rhs[0] = HK
            rhs[M] = 0.0
            V = thomas(sub, dia, sup, rhs)
        V[0] = HK
        V[M] = 0.0
        if american:
            ex = HK - S
            V = np.maximum(V, ex)
            # boundary: highest S where exercise binds (value equals payoff within 1e-9), for the staircase
            binds = np.where(np.isclose(V, ex, atol=1e-9) & (ex > 0))[0]
            boundary.append(float(S[binds.max()]) if len(binds) else 0.0)
        grid.append(V.copy())
    return dict(S=S.tolist(), months=[5 * (1 - n / N) for n in range(N + 1)][::-1], grid=[g.tolist() for g in grid[::-1]], at_S0=float(grid[-1][M // 2]), boundary=boundary[::-1])


hull = dict(
    params=dict(S0=HS0, K=HK, r=HR, sigma=HSIG, T=HT, Smax=HSMAX, M=HM, N=HN),
    bs_european=float(b76(HS0 * math.exp(HR * HT), HK, HT, HSIG, False, r=HR)),  # Black-Scholes put via the forward form
    implicit_american=hull_grid("implicit", True), implicit_european=hull_grid("implicit", False),
    explicit_american=hull_grid("explicit", True), explicit_european=hull_grid("explicit", False),
    cn_american=hull_grid("cn", True)["at_S0"], cn_european=hull_grid("cn", False)["at_S0"],
    book=dict(implicit_american=4.07, implicit_european=3.91, bs=4.08, control_variate=4.24, explicit_american=4.26, table18_2_top_left=[0.06, -0.11, 0.28, -0.13]),
    negative_weight_from_j=int(np.argmax(1 - HSIG * HSIG * np.arange(HM + 1) ** 2 * (HT / HN) < 0)),
    converged_american=hull_grid("cn", True, M=400, N=3200)["at_S0"],
)
hull["control_variate"] = hull["implicit_american"]["at_S0"] + hull["bs_european"] - hull["implicit_european"]["at_S0"]
hull["explicit_top_left"] = [hull["explicit_american"]["grid"][0][jj] for jj in (19, 18, 17, 16)]  # S = 95, 90, 85, 80 at 5 months

# ---- Wilmott Tables 77.1 / 77.2
def wilmott(call, vol=0.2, r=0.05, E=100.0, Tt=1.0, NAS=20):
    dS = 2 * E / NAS
    dt = 0.9 / vol / vol / NAS / NAS
    NTS = int(Tt / dt) + 1
    dt = Tt / NTS
    S = np.arange(NAS + 1) * dS
    q = 1 if call else -1
    V = np.maximum(q * (S - E), 0.0)
    for k in range(NTS):
        Vn = V.copy()
        for i in range(1, NAS):
            D = (Vn[i + 1] - Vn[i - 1]) / 2 / dS
            G = (Vn[i + 1] - 2 * Vn[i] + Vn[i - 1]) / dS / dS
            Th = -0.5 * vol * vol * S[i] ** 2 * G - r * S[i] * D + r * Vn[i]
            V[i] = Vn[i] - dt * Th
        V[0] = Vn[0] * (1 - r * dt)
        V[NAS] = 2 * V[NAS - 1] - V[NAS - 2]
    return dict(NTS=NTS, S=S[6:15].tolist(), values=V[6:15].tolist())


wil = dict(call=wilmott(True), put=wilmott(False),
           book_call=[0.066, 0.430, 1.754, 4.899, 10.255, 17.523, 26.089, 35.402, 45.095], book_put=[35.182, 25.546, 16.871, 10.015, 5.372, 2.639, 1.205, 0.518, 0.211])

# the two mistakes the chapter admits: a wide grid, and the wrong deep-in boundary
def wide_grid_error(M=100, N=44):
    global FLO, FHI
    lo, hi = FLO, FHI
    FLO, FHI = 0.0, 45200.0
    v, _, _, _ = solve_forward(M, N, "cn", rannacher=1)
    FLO, FHI = lo, hi
    return v - TRUE


def wrong_boundary_parity(M=400, N=44):
    dF = (FHI - FLO) / M
    Fg = FLO + np.arange(M + 1) * dF
    out = {}
    for call in (True, False):
        V = np.maximum(Fg - K, 0.0) if call else np.maximum(K - Fg, 0.0)
        a = 0.5 * SIG * SIG * Fg * Fg / dF / dF
        lo, di, up = a, -(2 * a + R), a
        dt = T / N
        tau = 0.0
        for _ in range(N):
            tau += dt
            sub = np.concatenate([[0.0], -0.5 * dt * lo[1:M], [0.0]])
            dia = np.concatenate([[1.0], 1 - 0.5 * dt * di[1:M], [1.0]])
            sup = np.concatenate([[0.0], -0.5 * dt * up[1:M], [0.0]])
            rhs = V.copy()
            rhs[1:M] = V[1:M] + 0.5 * dt * (lo[1:M] * V[0:M - 1] + di[1:M] * V[1:M] + up[1:M] * V[2:M + 1])
            rhs[0], rhs[M] = (0.0, FHI - K * math.exp(-R * tau)) if call else (K * math.exp(-R * tau) - FLO, 0.0)  # the WRONG boundary
            V = thomas(sub, dia, sup, rhs)
        out["call" if call else "put"] = V
    dev = np.abs((out["call"] - out["put"]) - math.exp(-R * T) * (Fg - K))
    return dict(max_abs=float(dev.max()), at_F=float(Fg[int(np.argmax(dev))]))


mistakes = dict(wide_grid=dict(Flo=0.0, Fhi=45200.0, M=100, N=44, error=wide_grid_error()), wrong_boundary=wrong_boundary_parity())

key = dict(mistakes=mistakes, chain=dict(F=F0, K=K, r=R, T=T, sigma=SIG, Flo=FLO, Fhi=FHI, truth=TRUE), rod=rod, dial=dial, schemes=schemes, err_dF=err_dF, err_dt=err_dt, slopes=slopes,
           parity=parity, hull=hull, wilmott=wil,
           wide_grid_note=dict(sd_points=float(F0 * SIG * math.sqrt(T)), nodes_per_sd_wide=float(F0 * SIG * math.sqrt(T) / (45200 / 100)), nodes_per_sd_here=float(F0 * SIG * math.sqrt(T) / 100)))
with open(os.path.join(web, "engine", "__fixtures__", "key-F1.json"), "w") as f:
    json.dump(key, f, indent=1, default=float)

print("truth", TRUE, "rod value", v0, "rule", rod["rule_example"])
print("dial100:", [(r_["step_days"], round(r_["price"], 2) if abs(r_["price"]) < 1e6 else f"{r_['price']:.2e}", r_["stable"]) for r_ in dial["grid100"]["rows"]], "limit d", dial["grid100"]["limit_days"], "| 50:", dial["grid50"]["limit_days"])
print("schemes:", {s: [(x["M"], round(x["price"], 3)) for x in v] for s, v in schemes.items()})
print("slopes:", slopes, "\nparity:", parity)
print("hull:", hull["implicit_american"]["at_S0"], hull["implicit_european"]["at_S0"], hull["bs_european"], hull["control_variate"], hull["explicit_american"]["at_S0"], hull["explicit_top_left"], "cn", hull["cn_american"], "conv", hull["converged_american"], "neg j", hull["negative_weight_from_j"], "boundary", hull["implicit_american"]["boundary"])
print("wilmott:", [round(x, 3) for x in wil["call"]["values"]], [round(x, 3) for x in wil["put"]["values"]])
