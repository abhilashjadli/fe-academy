"""B4 clip 1 — "The square that would not vanish" (~22 s).

Beats (captions live in the chapter's Clip component, times below):
 0.0  A square of side x. Nudge the side by a little: two strips and a tiny corner.
 4.0  Now the side jitters: a coin decides. Heads grows it, tails shrinks it.
 8.5  Tails removes the strips — but the corner is a square: it is added either way.
13.0  Flip after flip: the strips wander around zero. The corners only climb.
18.0  Smaller steps, more of them: the strips stay random; the corners still add up to the time that passed.

Render:  THEME=light manim render -qh --format mp4 b4_square.py JitterySquare
         THEME=dark  manim render -qh --format mp4 b4_square.py JitterySquare
"""
import numpy as np
from manim import *
from fe_theme import *

apply_theme()

SEED = 7


class JitterySquare(Scene):
    def construct(self):
        rng = np.random.default_rng(SEED)
        X0 = 3.0
        scale = 0.9  # scene units per side unit

        # --- the square, left of centre
        origin = LEFT * 4.2 + DOWN * 2.0
        square = Square(side_length=X0 * scale, color=INK, stroke_width=3, fill_color=GHOST, fill_opacity=0.15)
        square.move_to(origin + RIGHT * X0 * scale / 2 + UP * X0 * scale / 2)
        xlabel = MathTex("x", font_size=40).next_to(square, DOWN, buff=0.2)
        self.play(Create(square), FadeIn(xlabel), run_time=1.0)

        def strips_and_corner(x, dx, added=True):
            w = abs(dx) * scale
            s = x * scale
            col = APPROX if added else TRUTH
            right = Rectangle(width=w, height=s, stroke_width=2, stroke_color=col, fill_color=col, fill_opacity=0.5 if added else 0.0)
            top = Rectangle(width=s, height=w, stroke_width=2, stroke_color=col, fill_color=col, fill_opacity=0.5 if added else 0.0)
            corner = Square(side_length=w, stroke_width=2, stroke_color=TRUTH, fill_color=TRUTH, fill_opacity=0.85)
            base = origin + (RIGHT * (x if added else x - abs(dx)) * scale)
            right.move_to(origin + RIGHT * ((x if added else x - abs(dx)) * scale + w / 2) + UP * s / 2)
            top.move_to(origin + RIGHT * s / 2 + UP * ((x if added else x - abs(dx)) * scale + w / 2))
            corner.move_to(origin + RIGHT * ((x if added else x - abs(dx)) * scale + w / 2) + UP * ((x if added else x - abs(dx)) * scale + w / 2))
            if not added:
                for r in (right, top):
                    r.set_stroke(opacity=1.0)
                    r.set_style(stroke_width=2)
                right.set_dash = None
            return VGroup(right, top, corner)

        # Beat 1: a deterministic nudge
        nudge = strips_and_corner(X0, 0.35, added=True)
        lbl_strips = Text("two strips", font_size=26, color=APPROX).next_to(nudge[0], RIGHT, buff=0.25)
        lbl_corner = Text("a corner", font_size=26, color=TRUTH).next_to(nudge[2], UR, buff=0.1)
        self.play(FadeIn(nudge[0]), FadeIn(nudge[1]), run_time=0.8)
        self.play(FadeIn(nudge[2]), FadeIn(lbl_strips), FadeIn(lbl_corner), run_time=0.8)
        sticker = Text("safe to ignore", font_size=22, color=ERROR).rotate(0.25).next_to(nudge[2], UP, buff=0.45).shift(LEFT * 0.6)
        self.play(FadeIn(sticker), run_time=0.6)
        self.wait(0.8)

        # Beat 2: a coin
        self.play(FadeOut(nudge), FadeOut(lbl_strips), FadeOut(lbl_corner), run_time=0.5)
        coin = Circle(radius=0.38, color=INK, stroke_width=3, fill_color=APPROX, fill_opacity=0.9).move_to(RIGHT * 4.3 + UP * 2.6)
        coin_t = Text("H", font_size=30, color=INK).move_to(coin)
        coin_lbl = Text("heads: grow · tails: shrink", font_size=24, color=INK).next_to(coin, DOWN, buff=0.15)
        self.play(FadeIn(coin), FadeIn(coin_t), FadeIn(coin_lbl), run_time=0.8)

        # dials, right of centre
        dial_x = RIGHT * 4.3
        strips_axis = NumberLine(x_range=[-8, 8, 4], length=4.5, color=GHOST, include_numbers=True, font_size=26, label_direction=DOWN, decimal_number_config={"color": INK, "num_decimal_places": 0}).move_to(dial_x + DOWN * 0.6)
        corners_axis = NumberLine(x_range=[0, 2, 0.5], length=4.5, color=GHOST, include_numbers=True, font_size=26, label_direction=DOWN, decimal_number_config={"color": INK, "num_decimal_places": 1}).move_to(dial_x + DOWN * 2.6)
        strips_lbl = Text("strips so far", font_size=24, color=APPROX).next_to(strips_axis, UP, buff=0.15)
        corners_lbl = Text("corners so far", font_size=24, color=TRUTH).next_to(corners_axis, UP, buff=0.15)
        s_tracker, c_tracker, t_tracker = ValueTracker(0.0), ValueTracker(0.0), ValueTracker(0.0)
        s_dot = always_redraw(lambda: Dot(strips_axis.n2p(max(-8, min(8, s_tracker.get_value()))), color=APPROX, radius=0.1))
        c_dot = always_redraw(lambda: Dot(corners_axis.n2p(min(2, c_tracker.get_value())), color=TRUTH, radius=0.1))
        t_mark = always_redraw(lambda: Line(corners_axis.n2p(min(2, t_tracker.get_value())) + DOWN * 0.18, corners_axis.n2p(min(2, t_tracker.get_value())) + UP * 0.18, color=INK, stroke_width=2))
        t_lbl = always_redraw(lambda: Text("time", font_size=18, color=INK).next_to(t_mark, DOWN, buff=0.05))
        self.play(FadeIn(strips_axis), FadeIn(corners_axis), FadeIn(strips_lbl), FadeIn(corners_lbl), run_time=0.8)
        self.add(s_dot, c_dot, t_mark, t_lbl)

        x = X0
        dt = 0.04
        cur = None

        def flip(x, dt, run_time=0.5, show=True):
            heads = rng.random() < 0.5
            dx = np.sqrt(dt) if heads else -np.sqrt(dt)
            g = strips_and_corner(x, dx, added=heads)
            if not heads:
                g[0].set_stroke(color=TRUTH)
                g[1].set_stroke(color=TRUTH)
            s_tracker.set_value(s_tracker.get_value() + 2 * x * dx)
            c_tracker.set_value(c_tracker.get_value() + dx * dx)
            t_tracker.set_value(t_tracker.get_value() + dt)
            return heads, x + dx, g

        # Beat 2/3: two slow flips, showing the geometry
        heads, x, g = flip(x, dt, 0.8)
        coin_t.become(Text("H" if heads else "T", font_size=30, color=INK).move_to(coin))
        self.play(FadeIn(g), run_time=0.8)
        self.wait(1.2)
        self.play(FadeOut(g), run_time=0.3)
        heads2, x, g2 = flip(x, dt, 0.8)
        # force the second flip to be tails for the story if the first was heads (and vice versa)
        coin_t.become(Text("H" if heads2 else "T", font_size=30, color=INK).move_to(coin))
        self.play(FadeIn(g2), run_time=0.8)
        note = Text("tails: strips removed — corner still added", font_size=22, color=INK).next_to(coin_lbl, DOWN, buff=0.3)
        self.play(FadeIn(note), run_time=0.5)
        self.wait(1.5)
        self.play(FadeOut(g2), FadeOut(note), run_time=0.3)

        # Beat 4: twenty fast flips
        for i in range(18):
            heads, x, g = flip(x, dt)
            coin_t.become(Text("H" if heads else "T", font_size=30, color=INK).move_to(coin))
            sq = Square(side_length=max(0.5, x * scale), color=INK, stroke_width=3, fill_color=GHOST, fill_opacity=0.15)
            sq.move_to(origin + RIGHT * x * scale / 2 + UP * x * scale / 2)
            self.play(Transform(square, sq), FadeIn(g), run_time=0.18)
            self.remove(g)
        self.wait(0.8)

        # Beat 5: smaller steps
        self.play(FadeOut(sticker), run_time=0.3)
        cross = Cross(sticker, stroke_color=ERROR, stroke_width=4)
        self.add(sticker)
        self.play(Create(cross), run_time=0.5)
        small = Text("now the steps are four times smaller", font_size=24, color=INK).next_to(coin_lbl, DOWN, buff=0.3)
        self.play(FadeIn(small), run_time=0.4)
        dt = 0.01
        for i in range(80):
            heads, x, g = flip(x, dt)
            if i % 3 == 0:
                coin_t.become(Text("H" if heads else "T", font_size=30, color=INK).move_to(coin))
            sq = Square(side_length=max(0.5, x * scale), color=INK, stroke_width=3, fill_color=GHOST, fill_opacity=0.15)
            sq.move_to(origin + RIGHT * x * scale / 2 + UP * x * scale / 2)
            self.play(Transform(square, sq), run_time=0.06)
        self.wait(1.2)
