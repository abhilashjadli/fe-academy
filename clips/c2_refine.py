"""C2 clip — "The tree becomes the curve" (~20 s). Lives inside C2 Figure 4's "watch" tab.

Beats:
 0.0  One step: two prices tomorrow. The option is worth 10.81 — too much.
 4.0  Two, five, ten steps: more prices, and the number bounces: above, below, above …
 11.0 Fifty, a hundred, five hundred: the tree is a curve now, and the bounce has shrunk to the third decimal.
 16.0 The number it is closing in on has a closed form. That is Black–Scholes.

Numbers: CRR tree, S=K=100, r=5 %, σ=20 %, T=1, computed here with the same recursion the engine uses (checked against key-C1C2.json).
Render: THEME=light manim render -qm --format mp4 -o refine_light c2_refine.py Refine
"""
import math
import numpy as np
from manim import *
from fe_theme import *

apply_theme()

S0, K, R, SIG, T = 100.0, 100.0, 0.05, 0.20, 1.0


def crr_call(n):
    dt = T / n
    u = math.exp(SIG * math.sqrt(dt)); d = 1 / u
    p = (math.exp(R * dt) - d) / (u - d)
    disc = math.exp(-R * dt)
    v = np.array([max(S0 * u ** j * d ** (n - j) - K, 0.0) for j in range(n + 1)])
    for _ in range(n):
        v = disc * (p * v[1:] + (1 - p) * v[:-1])
    return float(v[0])


def bs_call():
    d1 = (math.log(S0 / K) + (R + 0.5 * SIG ** 2) * T) / (SIG * math.sqrt(T)); d2 = d1 - SIG * math.sqrt(T)
    N = lambda x: 0.5 * (1 + math.erf(x / math.sqrt(2)))
    return S0 * N(d1) - K * math.exp(-R * T) * N(d2)


class Refine(Scene):
    def construct(self):
        BS = bs_call()
        steps = [1, 2, 3, 5, 10, 20, 50, 100, 500]
        prices = [crr_call(n) for n in steps]

        title = Text("The tree becomes the curve", font_size=34).to_edge(UP, buff=0.35)
        self.play(FadeIn(title), run_time=0.5)

        # left: the terminal distribution of the tree as bars; right: the price vs n with the BS line
        left_origin = LEFT * 6.2 + DOWN * 2.2
        ax_r = Axes(x_range=[0, 9, 1], y_range=[10.0, 12.5, 0.5], x_length=5.2, y_length=3.6,
                    axis_config={"color": GHOST, "include_tip": False, "stroke_width": 2},
                    y_axis_config={"include_numbers": True, "font_size": 22, "decimal_number_config": {"num_decimal_places": 1, "color": INK}}).shift(RIGHT * 3.9 + DOWN * 0.6)
        xl = Text("steps: 1 · 2 · 3 · 5 · 10 · 20 · 50 · 100 · 500", font_size=20, color=INK).next_to(ax_r, DOWN, buff=0.15)
        bs_line = DashedLine(ax_r.c2p(0, BS), ax_r.c2p(9, BS), color=TRUTH, stroke_width=2.5)
        bs_lbl = Text(f"Black–Scholes {BS:.4f}", font_size=22, color=TRUTH).next_to(bs_line, UP, buff=0.08).shift(RIGHT * 1.2)
        self.play(Create(ax_r), FadeIn(xl), run_time=0.8)

        price_txt = Text("", font_size=30, color=APPROX).to_corner(UL, buff=0.6).shift(DOWN * 0.9)
        self.add(price_txt)

        def tree_bars(n):
            dt = T / n
            u = math.exp(SIG * math.sqrt(dt)); d = 1 / u
            p = (math.exp(R * dt) - d) / (u - d)
            xs = [S0 * u ** j * d ** (n - j) for j in range(n + 1)]
            probs = [math.comb(n, j) * p ** j * (1 - p) ** (n - j) for j in range(n + 1)]
            g = VGroup()
            width = 4.6; height = 3.2
            lo, hi = 40.0, 200.0
            maxp = max(probs)
            bw = max(0.03, width / (n + 1) * 0.9) if n > 8 else 0.35
            for x, pr in zip(xs, probs):
                if x < lo or x > hi:
                    continue
                h = height * pr / maxp
                bar = Rectangle(width=bw, height=max(h, 0.02), stroke_width=0.5, stroke_color=APPROX, fill_color=APPROX, fill_opacity=0.7)
                bar.move_to(left_origin + RIGHT * ((x - lo) / (hi - lo) * width) + UP * h / 2)
                g.add(bar)
            base = Line(left_origin, left_origin + RIGHT * width, color=GHOST, stroke_width=2)
            kmark = Line(left_origin + RIGHT * ((K - lo) / (hi - lo) * width), left_origin + RIGHT * ((K - lo) / (hi - lo) * width) + UP * height, color=ERROR, stroke_width=1.5)
            g.add(base, kmark)
            return g

        bars = tree_bars(1)
        lbl = Text("prices in one year", font_size=20, color=INK).next_to(left_origin + RIGHT * 2.3, DOWN, buff=0.15)
        klbl = Text("strike", font_size=18, color=ERROR).next_to(left_origin + RIGHT * ((K - 40) / 160 * 4.6) + UP * 3.2, UP, buff=0.05)
        self.play(FadeIn(bars), FadeIn(lbl), FadeIn(klbl), run_time=0.6)
        dots = VGroup()
        for i, (n, pr) in enumerate(zip(steps, prices)):
            new_bars = tree_bars(n)
            dot = Dot(ax_r.c2p(i + 0.5, pr), color=APPROX, radius=0.07)
            dots.add(dot)
            new_txt = Text(f"{n} step{'s' if n > 1 else ''}:  {pr:.4f}", font_size=30, color=APPROX).to_corner(UL, buff=0.6).shift(DOWN * 0.9)
            self.play(Transform(bars, new_bars), Transform(price_txt, new_txt), FadeIn(dot), run_time=1.0 if i < 4 else 1.4)
            if i == 3:
                note = Text("above, below, above … the bounce", font_size=22, color=INK).next_to(ax_r, UP, buff=0.1)
                self.play(FadeIn(note), run_time=0.4)
            if i == 6:
                self.play(FadeOut(note), run_time=0.2)
        self.play(Create(bs_line), FadeIn(bs_lbl), run_time=1.0)
        end = Text("the number it closes in on has a closed form", font_size=24, color=TRUTH).next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(end), run_time=0.5)
        self.wait(1.6)
