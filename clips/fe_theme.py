"""House theme for Manim clips — the same tokens as apps/web/src/styles/tokens.css.

Usage:
    from fe_theme import *          # colours, FE_TEX, apply_theme()
    apply_theme("light")            # or "dark"; sets background + text defaults
"""
import os
from manim import MathTex, Text, TexTemplate, config

THEMES = {
    "light": dict(surface="#f4f6f8", ink="#1b2430", truth="#2f5bea", approx="#b86e00", error="#c8325f", ghost="#9aa5b1"),
    "dark": dict(surface="#161b22", ink="#e6ebf2", truth="#5f80f5", approx="#bf841c", error="#e6617f", ghost="#5c6775"),
}

_theme = THEMES[os.environ.get("THEME", "light")]
SURFACE = _theme["surface"]
INK = _theme["ink"]
TRUTH = _theme["truth"]
APPROX = _theme["approx"]
ERROR = _theme["error"]
GHOST = _theme["ghost"]

# Minimal LaTeX preamble: Manim's default needs dsfont, absent on the workspace's TeX Live.
FE_TEX = TexTemplate(
    preamble=r"""
\usepackage[english]{babel}
\usepackage{amsmath}
\usepackage{amssymb}
\usepackage{xcolor}
"""
)


def apply_theme(name: str | None = None) -> None:
    """Set the background, TeX template and default text colours for a scene."""
    global _theme, SURFACE, INK, TRUTH, APPROX, ERROR, GHOST
    if name:
        _theme = THEMES[name]
        SURFACE, INK, TRUTH, APPROX, ERROR, GHOST = (
            _theme["surface"], _theme["ink"], _theme["truth"], _theme["approx"], _theme["error"], _theme["ghost"],
        )
    config.background_color = SURFACE
    config.tex_template = FE_TEX
    Text.set_default(color=INK, font="IBM Plex Sans")
    MathTex.set_default(color=INK)
