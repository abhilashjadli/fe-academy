"""B6 clip — "The payoff melts" (~15 s). Lives inside B6 Figure 1's right panel as its "watch" tab.

The option's value V(S, t) along a rod of prices S, run BACKWARDS from expiry: the kink of the payoff melts
like heat along a rod. Arrows show the curvature term ½σ²S²V_SS pushing each point toward the average of its
neighbours — scaled by S², so the right end of the rod moves faster (the approved "in price" choice).

Beats:
 0.0  At expiry the value is the payoff: a kink at the strike.
 3.0  Step one day backwards. Each point moves toward the average of its two neighbours — faster where the rod bends.
 8.0  The arrows are longer on the right: the same wobble is bigger in rupees when the price is higher.
 12.0 A year of steps backwards: the kink has melted into today's smooth curve. That curve is the option price.

Render: THEME=light manim render -qm --format mp4 -o heatrod_light b6_heatrod.py HeatRod
"""
import math
import numpy as np
from manim import *
from fe_theme import *

apply_theme()

K, R, SIG, T = 100.0, 0.05, 0.20, 1.0
S = np.linspace(40, 180, 71)  # the rod
dS = S[1] - S[0]


def step_back(V, dt):
    """Explicit finite-difference step of the Black–Scholes PDE backwards in time (stable for this dt)."""
    Vn = V.copy()
    for i in range(1, len(S) - 1):
        Vss = (V[i + 1] - 2 * V[i] + V[i - 1]) / dS ** 2
        Vs = (V[i + 1] - V[i - 1]) / (2 * dS)
        Vn[i] = V[i] + dt * (0.5 * SIG ** 2 * S[i] ** 2 * Vss + R * S[i] * Vs - R * V[i])
    Vn[0] = 0.0
    Vn[-1] = S[-1] - K * math.exp(-R * dt) if True else Vn[-1]
    return Vn


class HeatRod(Scene):
    def construct(self):
        title = Text("The payoff melts", font_size=34).to_edge(UP, buff=0.35)
        self.play(FadeIn(title), run_time=0.5)
        ax = Axes(x_range=[40, 180, 20], y_range=[0, 90, 30], x_length=10.5, y_length=4.2,
                  axis_config={"color": GHOST, "include_tip": False, "stroke_width": 2},
                  x_axis_config={"include_numbers": True, "font_size": 22, "decimal_number_config": {"num_decimal_places": 0, "color": INK}}).shift(DOWN * 0.8)
        xl = Text("price of the stock, S", font_size=20, color=INK).next_to(ax, DOWN, buff=0.1)
        yl = Text("option value", font_size=20, color=INK).rotate(PI / 2).next_to(ax, LEFT, buff=0.05)
        self.play(Create(ax), FadeIn(xl), FadeIn(yl), run_time=0.8)

        V = np.maximum(S - K, 0.0)
        curve = ax.plot_line_graph(S, V, line_color=ERROR, add_vertex_dots=False, stroke_width=4)
        lbl = Text("at expiry: the payoff, with a kink at the strike", font_size=22, color=ERROR).next_to(title, DOWN, buff=0.12)
        self.play(Create(curve), FadeIn(lbl), run_time=1.0)
        self.wait(0.8)

        # one day back, with arrows at a few points
        dt = T / 250
        SUB = 4  # four sub-steps per day keeps the explicit scheme stable (λ ≈ 0.16 at S = 180)
        V1 = V
        for _ in range(SUB):
            V1 = step_back(V1, dt / SUB)
        arrows = VGroup()
        for i in range(6, len(S) - 6, 8):
            Vss = (V[i + 1] - 2 * V[i] + V[i - 1]) / dS ** 2
            push = 0.5 * SIG ** 2 * S[i] ** 2 * Vss * dt * 40  # exaggerated for visibility
            if abs(push) < 0.05:
                continue
            a = Arrow(ax.c2p(S[i], V[i]), ax.c2p(S[i], V[i] + push), buff=0, color=TRUTH, stroke_width=3, max_tip_length_to_length_ratio=0.3)
            arrows.add(a)
        self.play(Transform(lbl, Text("one day back: each point moves toward the average of its neighbours", font_size=22, color=INK).next_to(title, DOWN, buff=0.12)), FadeIn(arrows), run_time=1.0)
        self.wait(1.6)
        self.play(Transform(lbl, Text("longer arrows on the right: the same wobble is bigger in rupees at a higher price", font_size=22, color=TRUTH).next_to(title, DOWN, buff=0.12)), run_time=0.6)
        self.wait(1.8)
        self.play(FadeOut(arrows), run_time=0.3)

        # a year back, animated in chunks
        cur = V.copy()
        days = 250
        chunks = 25
        for c in range(chunks):
            for _ in range(days // chunks * SUB):
                cur = step_back(cur, dt / SUB)
            new = ax.plot_line_graph(S, cur, line_color=TRUTH if c == chunks - 1 else APPROX, add_vertex_dots=False, stroke_width=4)
            self.play(Transform(curve, new), run_time=0.16)
        self.play(Transform(lbl, Text("a year back: the kink has melted into today's smooth curve — the option's price", font_size=22, color=TRUTH).next_to(title, DOWN, buff=0.12)), run_time=0.6)
        atm = Dot(ax.c2p(100, float(np.interp(100, S, cur))), color=INK, radius=0.07)
        atxt = Text(f"at S = 100: {float(np.interp(100, S, cur)):.2f}", font_size=22, color=INK).next_to(atm, UR, buff=0.1)
        self.play(FadeIn(atm), FadeIn(atxt), run_time=0.5)
        self.wait(1.6)
