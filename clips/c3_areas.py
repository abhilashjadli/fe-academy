"""C3 clip — "Two areas, one price" (~20 s). Lives inside C3 Figure 2's "watch" tab.

The cloud of 2,000 equally likely futures of the NIFTY 22,600 row (forward 22,603, 11 days, 15.85 % wobble) drawn as a
lognormal hill on a price axis; the formula grows out of the picture, one piece at a time (3Blue1Brown's
CreateFormulaFromDiagram move): each symbol keeps the colour of the piece of the picture it came from.

Beats:
 0.0  The futures above the strike: the share of the hill right of the line is N(d2).
 5.0  The strike, times that share: what you would pay, weighted by how often you pay it.
 10.0 The same futures, each weighted by its own price: the price-weighted area is F·N(d1) — one unit, not a probability.
 15.0 Subtract, shrink by eleven days of interest: 249.15. Two areas, one price.

Numbers: key-C3C4.json atm (N(d1) 0.5074, N(d2) 0.4964, F·N(d1) 11,469, K·N(d2) 11,219, undiscounted 249.64, price 249.15).
Render: THEME=light manim render -qm --format mp4 -o areas_light c3_areas.py Areas
"""
import math
import numpy as np
from manim import *
from fe_theme import *

apply_theme()

F, K, R, SIG, T = 22603.0, 22600.0, 0.065, 0.15852787, 11 / 365
ST = SIG * math.sqrt(T)
D = math.exp(-R * T)


def N(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))


d1 = (math.log(F / K) + 0.5 * ST * ST) / ST
d2 = d1 - ST
Nd1, Nd2 = N(d1), N(d2)


def dens(s):
    """lognormal density of S_T with mean F"""
    z = (math.log(s / F) + 0.5 * ST * ST) / ST
    return math.exp(-0.5 * z * z) / (s * ST * math.sqrt(2 * math.pi))


class Areas(Scene):
    def construct(self):
        title = Text("Two areas, one price", font_size=34).to_edge(UP, buff=0.35)
        self.play(FadeIn(title), run_time=0.5)
        lo, hi = 20800, 24400
        ax = Axes(x_range=[lo, hi, 400], y_range=[0, 0.00075, 0.00075], x_length=7.2, y_length=3.4,
                  axis_config={"color": GHOST, "include_tip": False, "stroke_width": 2},
                  x_axis_config={"include_numbers": True, "font_size": 20, "decimal_number_config": {"num_decimal_places": 0, "group_with_commas": False, "color": INK}}).shift(LEFT * 2.6 + DOWN * 1.1)
        xl = Text("the index in eleven days", font_size=20, color=INK).next_to(ax, DOWN, buff=0.1)
        hill = ax.plot(dens, x_range=[lo, hi], color=INK, stroke_width=3)
        self.play(Create(ax), FadeIn(xl), Create(hill), run_time=1.0)
        strike = DashedLine(ax.c2p(K, 0), ax.c2p(K, 0.00072), color=ERROR, stroke_width=2.5)
        klbl = Text("strike 22,600", font_size=20, color=ERROR).next_to(strike, UP, buff=0.05)
        self.play(Create(strike), FadeIn(klbl), run_time=0.5)

        # the formula area on the right, assembled piece by piece
        fx = RIGHT * 3.7
        lbl = Text("", font_size=22).next_to(title, DOWN, buff=0.12)
        self.add(lbl)

        # beat 1: the share right of the line -> N(d2)
        right = ax.get_area(hill, x_range=[K, hi], color=APPROX, opacity=0.45)
        self.play(Transform(lbl, Text("the futures above the strike: this share of the hill is N(d₂)", font_size=22, color=APPROX).next_to(title, DOWN, buff=0.12)), FadeIn(right), run_time=0.8)
        nd2 = MathTex(r"N(d_2)", "=", f"{Nd2:.3f}", font_size=40).move_to(fx + UP * 1.2)
        nd2[0].set_color(APPROX)
        ghost = right.copy()
        self.play(ReplacementTransform(ghost, nd2), run_time=1.2)
        self.wait(2.0)

        # beat 2: K × N(d2)
        self.play(Transform(lbl, Text("the strike you would pay, times how often you pay it", font_size=22, color=ERROR).next_to(title, DOWN, buff=0.12)), run_time=0.5)
        kn = MathTex(r"K\,N(d_2)", "=", f"{K * Nd2:,.0f}".replace(",", "{,}"), font_size=40).move_to(fx + UP * 0.3)
        kn[0][0].set_color(ERROR)
        kn[0][1:].set_color(APPROX)
        kcopy = klbl.copy()
        self.play(ReplacementTransform(kcopy, kn), run_time=1.0)
        self.wait(2.8)

        # beat 3: the price-weighted area -> F N(d1)
        self.play(Transform(lbl, Text("the same futures, each weighted by its own price: F · N(d₁), one unit", font_size=22, color=TRUTH).next_to(title, DOWN, buff=0.12)), run_time=0.5)
        wdens = lambda s: dens(s) * s / F
        whill = ax.plot(wdens, x_range=[lo, hi], color=TRUTH, stroke_width=2.5)
        wright = ax.get_area(whill, x_range=[K, hi], color=TRUTH, opacity=0.35)
        self.play(FadeOut(right), Create(whill), FadeIn(wright), run_time=0.8)
        fn = MathTex(r"F\,N(d_1)", "=", f"{F * Nd1:,.0f}".replace(",", "{,}"), font_size=40).move_to(fx + DOWN * 0.6)
        fn[0].set_color(TRUTH)
        wcopy = wright.copy()
        self.play(ReplacementTransform(wcopy, fn), run_time=1.2)
        self.wait(2.3)

        # beat 4: subtract, discount
        self.play(Transform(lbl, Text("subtract, and shrink by eleven days of interest", font_size=22, color=INK).next_to(title, DOWN, buff=0.12)), run_time=0.5)
        diff = MathTex((f"{F * Nd1:,.0f} - {K * Nd2:,.0f} = {F * Nd1 - K * Nd2:.2f}").replace(",", "{,}"), font_size=34).move_to(fx + DOWN * 1.5)
        self.play(FadeIn(diff), run_time=0.6)
        self.wait(0.6)
        final = MathTex(r"c = e^{-rT}\big[", r"F\,N(d_1)", "-", r"K\,N(d_2)", r"\big] = ", f"{D * (F * Nd1 - K * Nd2):.2f}", font_size=32).move_to(fx + DOWN * 2.4)
        final[1].set_color(TRUTH)
        final[3][0].set_color(ERROR)
        final[3][1:].set_color(APPROX)
        final[5].set_color(INK)
        self.play(Write(final), run_time=1.2)
        self.play(Transform(lbl, Text("two areas and a discount — the price on the screen", font_size=22, color=INK).next_to(title, DOWN, buff=0.12)), run_time=0.5)
        self.wait(1.8)
