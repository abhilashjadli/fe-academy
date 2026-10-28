"""A3 clip — "The leftovers, in time order" (~15 s).

Beats:
 0.0  The fit says "certain": R² high, the ± tiny. A green badge.
 3.0  Now draw the leftovers in the order they happened.
 9.0  They stay on one side for months at a time. The formula assumed a fresh coin every day.
13.0  The badge turns amber. Same line; the how-sure was a lie.

Render: THEME=light manim render -qm --format mp4 a3_residuals.py Leftovers
Data: clips/data/a3_residuals.json (exported from the app's series + engine).
"""
import json
import numpy as np
from manim import *
from fe_theme import *

apply_theme()
D = json.load(open("data/a3_residuals.json"))


class Leftovers(Scene):
    def construct(self):
        res = np.array(D["resid"], dtype=float)
        n = len(res)
        lim = float(np.max(np.abs(res))) * 1.05
        title = Text("The leftovers, in time order", font_size=34).to_edge(UP, buff=0.35)
        self.play(FadeIn(title), run_time=0.5)

        # badge
        badge = RoundedRectangle(corner_radius=0.15, width=4.6, height=1.1, stroke_color=TRUTH, fill_color=TRUTH, fill_opacity=0.12).to_corner(UR, buff=0.5).shift(DOWN * 0.9)
        btxt = VGroup(
            Text("CERTAIN", font_size=26, color=TRUTH, weight=BOLD),
            Text(f"R² = {D['r2']:.2f}   ± {2*D['se']:.3f}", font_size=22, color=INK),
        ).arrange(DOWN, buff=0.08).move_to(badge)
        self.play(FadeIn(badge), FadeIn(btxt), run_time=0.6)
        self.wait(1.6)

        ax = Axes(x_range=[0, n, 500], y_range=[-lim, lim, lim / 2], x_length=11.5, y_length=4.2,
                  axis_config={"color": GHOST, "include_tip": False, "stroke_width": 2, "include_numbers": False}).shift(DOWN * 0.9)
        zero = Line(ax.c2p(0, 0), ax.c2p(n, 0), color=GHOST, stroke_width=1.5)
        xl = Text("2016 → 2026, one point per trading day", font_size=20, color=INK).next_to(ax, DOWN, buff=0.15)
        yl = Text("leftover", font_size=20, color=INK).next_to(ax, LEFT, buff=0.1).rotate(PI / 2)
        self.play(Create(ax), Create(zero), FadeIn(xl), FadeIn(yl), run_time=0.8)

        pts = [ax.c2p(i, res[i]) for i in range(n)]
        path = VMobject(stroke_color=ERROR, stroke_width=2.2)
        path.set_points_as_corners(pts)
        self.play(Create(path), run_time=6.0, rate_func=linear)

        # shade long runs above/below
        note = Text("months on one side of the line", font_size=24, color=ERROR).next_to(ax, UP, buff=0.1).shift(LEFT * 2.5)
        self.play(FadeIn(note), run_time=0.5)
        self.wait(1.5)

        # badge turns amber
        badge2 = badge.copy().set_stroke(APPROX).set_fill(APPROX, opacity=0.14)
        btxt2 = VGroup(
            Text("NOT SO SURE", font_size=26, color=APPROX, weight=BOLD),
            Text(f"honest ± {2*D['seHAC']:.3f}  (×{D['seHAC']/D['se']:.1f})", font_size=22, color=INK),
        ).arrange(DOWN, buff=0.08).move_to(badge)
        self.play(Transform(badge, badge2), Transform(btxt, btxt2), run_time=0.8)
        sub = Text("same line — the how-sure was a lie", font_size=24, color=INK).next_to(title, DOWN, buff=0.15)
        self.play(FadeIn(sub), run_time=0.5)
        self.wait(1.5)
