"""Manim feasibility test for the FE Library.

Renders a 12-second clip in the library's light theme colours:
a smooth curve, its tangent line, and the quadratic (Taylor) fit growing
out of the tangent, with LaTeX labels. Tests: Cairo/Pango text, LaTeX
(MathTex), ValueTracker animation, always_redraw, ffmpeg output.
"""
from manim import *
import numpy as np

from fe_theme import *  # noqa: F401,F403 — SURFACE, INK, TRUTH, APPROX, ERROR, GHOST, FE_TEX

apply_theme()


class TaylorTangent(Scene):
    def construct(self):
        ax = Axes(
            x_range=[-2.5, 2.5, 1],
            y_range=[-1.5, 2.0, 1],
            x_length=8,
            y_length=4.5,
            axis_config={"color": GHOST, "include_tip": False, "stroke_width": 2},
        ).shift(DOWN * 0.3)

        f = lambda x: np.cos(x) + 0.6 * x
        truth = ax.plot(f, color=TRUTH, stroke_width=5)

        a = ValueTracker(0.0)
        fp = lambda x: -np.sin(x) + 0.6
        fpp = lambda x: -np.cos(x)

        tangent = always_redraw(
            lambda: ax.plot(
                lambda x: f(a.get_value()) + fp(a.get_value()) * (x - a.get_value()),
                x_range=[a.get_value() - 1.6, a.get_value() + 1.6],
                color=APPROX,
                stroke_width=4,
            )
        )
        quad = always_redraw(
            lambda: ax.plot(
                lambda x: f(a.get_value())
                + fp(a.get_value()) * (x - a.get_value())
                + 0.5 * fpp(a.get_value()) * (x - a.get_value()) ** 2,
                x_range=[a.get_value() - 1.6, a.get_value() + 1.6],
                color=ERROR,
                stroke_width=3,
            )
        )
        dot = always_redraw(lambda: Dot(ax.c2p(a.get_value(), f(a.get_value())), color=INK, radius=0.07))

        title = Text("The slope, then the bend", font_size=36).to_edge(UP)
        eq = MathTex(
            r"V(S+\delta S) \approx V(S)",
            r"+ \Delta\,\delta S",
            r"+ \tfrac12 \Gamma\,\delta S^2",
            font_size=40,
        ).next_to(title, DOWN, buff=0.3)
        eq[1].set_color(APPROX)
        eq[2].set_color(ERROR)

        self.play(FadeIn(title), Create(ax), run_time=1.5)
        self.play(Create(truth), run_time=1.5)
        self.add(dot)
        self.play(Write(eq[0]), run_time=0.8)
        self.play(Create(tangent), Write(eq[1]), run_time=1.2)
        self.play(Create(quad), Write(eq[2]), run_time=1.2)
        self.play(a.animate.set_value(1.6), run_time=2.5, rate_func=smooth)
        self.play(a.animate.set_value(-1.4), run_time=2.5, rate_func=smooth)
        self.wait(0.7)
