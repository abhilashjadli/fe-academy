"""B4 clip 2 — "The race" (~18 s): every term is a tile whose area is its size; halve the step and watch who survives.

Beats:
 0.0  Four tiles, four terms. The bar is the ordinary first-order term, Δt. The others are the leftovers.
 4.0  Halve the step. The bar halves. Δt² quarters. Δt·ΔW shrinks by nearly three.
 9.0  The (ΔW)² tile halves — the same rate as the bar. Halve again, and again: it keeps pace.
14.0  Everything that shrank faster than the bar is gone. Two tiles remain, and one of them is a square.

Render: THEME=light manim render -qh --format mp4 b4_tiles.py TileRace
"""
import numpy as np
from manim import *
from fe_theme import *

apply_theme()


class TileRace(Scene):
    def construct(self):
        # Term sizes at dt (expected areas), b = 1 for the picture
        def areas(dt):
            return {"dt": dt, "dt2": dt * dt, "dtdW": dt * np.sqrt(2 * dt / np.pi), "dW2": dt}

        dt0 = 0.5
        S = 5.0  # scene units per unit area (so dt=0.5 → 2.5 u² tile)
        names = ["dt", "dt2", "dtdW", "dW2"]
        labels = {"dt": r"a\,\Delta t", "dt2": r"a^2\Delta t^2", "dtdW": r"2ab\,\Delta t\,\Delta W", "dW2": r"b^2(\Delta W)^2"}
        cols = {"dt": APPROX, "dt2": GHOST, "dtdW": GHOST, "dW2": TRUTH}
        xs = {"dt": -4.8, "dt2": -1.6, "dtdW": 1.6, "dW2": 4.8}
        base_y = -1.6

        def tile(name, dt):
            a = areas(dt)[name] * S
            if name == "dt":  # a bar: fixed width 0.8, height = area/0.8
                w, h = 0.8, a / 0.8
            elif name == "dW2":  # a square
                w = h = np.sqrt(a)
            elif name == "dt2":
                w = h = np.sqrt(a)
            else:  # mixed: rectangle 2:1
                h = np.sqrt(a / 2)
                w = 2 * h
            r = Rectangle(width=max(w, 0.02), height=max(h, 0.02), stroke_color=cols[name], stroke_width=2.5, fill_color=cols[name], fill_opacity=0.55)
            r.move_to(RIGHT * xs[name] + UP * (base_y + h / 2))
            return r

        title = Text("Halve the step. Who survives?", font_size=34).to_edge(UP, buff=0.4)
        self.play(FadeIn(title), run_time=0.6)
        tiles = {n: tile(n, dt0) for n in names}
        labs = {n: MathTex(labels[n], font_size=34, color=cols[n] if n != "dt2" and n != "dtdW" else INK).next_to(RIGHT * xs[n] + UP * base_y, DOWN, buff=0.3) for n in names}
        ground = Line(LEFT * 6.4 + UP * base_y, RIGHT * 6.4 + UP * base_y, color=GHOST, stroke_width=2)
        self.play(Create(ground), run_time=0.4)
        for n in names:
            self.play(GrowFromEdge(tiles[n], DOWN), FadeIn(labs[n]), run_time=0.5)
        sub = Text("the bar is the ordinary term; the rest are leftovers", font_size=24, color=INK).next_to(title, DOWN, buff=0.2)
        self.play(FadeIn(sub), run_time=0.5)
        self.wait(1.2)

        # halvings
        counter = Text("Δt = 0.5", font_size=28, color=INK).to_corner(UR, buff=0.5)
        self.play(FadeIn(counter), run_time=0.3)
        dt = dt0
        ratio_texts = {}
        for k in range(4):
            new_dt = dt / 2
            new_tiles = {n: tile(n, new_dt) for n in names}
            r = {n: areas(dt)[n] / areas(new_dt)[n] for n in names}
            self.play(
                *[Transform(tiles[n], new_tiles[n]) for n in names],
                Transform(counter, Text(f"Δt = {new_dt:g}", font_size=28, color=INK).to_corner(UR, buff=0.5)),
                run_time=1.1,
            )
            for n in names:
                t = Text(f"÷{r[n]:.1f}", font_size=24, color=cols[n] if n in ("dt", "dW2") else INK).next_to(labs[n], DOWN, buff=0.12)
                if n in ratio_texts:
                    self.remove(ratio_texts[n])
                ratio_texts[n] = t
                self.add(t)
            if k == 0:
                self.play(FadeOut(sub), run_time=0.2)
                sub = Text("the bar halves · Δt² quarters · Δt·ΔW shrinks by 2.8", font_size=24, color=INK).next_to(title, DOWN, buff=0.2)
                self.play(FadeIn(sub), run_time=0.4)
                self.wait(1.4)
            if k == 1:
                self.play(FadeOut(sub), run_time=0.2)
                sub = Text("(ΔW)² halves — the same rate as the bar", font_size=24, color=TRUTH).next_to(title, DOWN, buff=0.2)
                self.play(FadeIn(sub), run_time=0.4)
                self.wait(1.0)
            dt = new_dt
            self.wait(0.4)

        # stickers on the dead tiles
        self.play(FadeOut(sub), run_time=0.2)
        sub = Text("faster than the bar → gone. Two tiles remain, and one is a square.", font_size=24, color=INK).next_to(title, DOWN, buff=0.2)
        self.play(FadeIn(sub), run_time=0.4)
        for n in ("dt2", "dtdW"):
            st = Text("safe to ignore", font_size=20, color=ERROR).rotate(0.2).move_to(RIGHT * xs[n] + UP * (base_y + 0.9))
            self.play(FadeIn(st), tiles[n].animate.set_opacity(0.12), labs[n].animate.set_opacity(0.3), ratio_texts[n].animate.set_opacity(0.3), run_time=0.5)
        keep = MathTex(r"b^2(\Delta W)^2 \approx b^2\,\Delta t\ \text{ on average}", font_size=34, color=TRUTH).move_to(RIGHT * 3.2 + UP * 1.2)
        self.play(Write(keep), run_time=1.0)
        self.wait(1.6)
