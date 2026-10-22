# Manim feasibility — can we render clips in this workspace? (2026-10-22)

**Verdict: yes, cheaply.** Manim Community 0.22 installs in ~2 minutes, renders a 12-second
720p30 clip in 13 s (1080p60 would be roughly 4× that), LaTeX works with a trimmed preamble, and
one script renders both themes. The sponsor's "rendering clips is not a problem" is confirmed on
our side too. Recipe and house rules live in `clips/README.md`; the theme module in
`clips/fe_theme.py`; the test scene in `clips/taylor_tangent.py`.

## What was tested

| Step | Result |
|---|---|
| `pip install manim` on the system Python | fails twice: ManimPango needs `pangocairo` headers; `srt` fails to build under the Debian-patched system setuptools |
| apt `libpango1.0-dev libcairo2-dev pkg-config dvisvgm` | installs (apt works through the proxy; the docker.com repo 403s, harmless) |
| venv + fresh setuptools + `manim==0.22.0` | installs cleanly; pins recorded in `clips/README.md` |
| `MathTex` with the default preamble | fails: `dsfont.sty` missing from the image's TeX Live |
| `MathTex` with a minimal preamble (`amsmath, amssymb, xcolor, babel`) | works; `\Delta`, `\Gamma`, `\tfrac`, coloured sub-expressions all fine |
| `Text` with `font="IBM Plex Sans"` | falls back silently to DejaVu Sans (fonts not installed system-wide); fix = copy the fontsource TTFs + `fc-cache` before final renders |
| `ValueTracker` + `always_redraw` (tangent and quadratic sliding along a curve) | works, smooth |
| Output | `-qm` 1280×720@30: 259 KB mp4 for 11.9 s; VP9 webm at crf 34: 221 KB. `-ql` 854×480@15: 7 s render |
| Dark theme | `THEME=dark` env var selects the dark tokens in `fe_theme.py`; renders correctly (surface #161b22, ink #e6ebf2) |

Frames from the test (light and dark) are in the scratchpad and were inspected: the curve, tangent
(approx orange) and quadratic (error red) read correctly against both surfaces, the formula colours
match the role tokens, and nothing is clipped.

## How a clip would sit in a chapter

1. The chapter's `research/r1/<ID>.md` §5 picks "clip" as the mode for one idea (not the whole chapter).
2. The storyboard (5–8 beats) becomes a scene with one `self.play` group per beat and a caption per
   beat; the captions double as the `.vtt` track and as the narration text, so voice-on reads the
   same words the viewer sees.
3. Render light + dark, mp4 + webm, poster png. Commit to `apps/web/public/clips/<chapter>/`.
   Budget: ≤ 1 MB per clip per theme; a chapter has at most two clips.
4. A `Clip` React component (to build in the style sprint): `<video>` with poster, play/pause,
   a scrubber, caption overlay from the `.vtt`, a "step" mode that jumps to beat boundaries
   (so a clip can be read like a step-through), `prefers-reduced-motion` → poster + captions only.
   Voice: when the global voice toggle is on, the clip pauses at each beat until the narration
   of that caption ends — the same hold rule the Timeline component uses.

## Where clips earn their place (from the catalogue and the R1 notes so far)

Clips are for ideas that are **continuous transformations a reader should watch, not steer**:
the binomial tree refining into the Black–Scholes curve (C2), a random walk's time-scaling (B2),
the implied density emerging from the smile as the second difference of prices (D2), a delta-hedge
following one price path with the hedge ratio as a dial (D1), the Galton board tipping into the
lattice (0.2 F10 — already done as canvas, keep it). They are *not* for anything the reader should
try first (then an explorable or a game), for procedures with decisions (then a step-through), or
for a single still relationship (then an icon grid or illustrated text).

## Costs and risks

- Build cost per clip: 1–3 hours for a scene of 5–8 beats including caption writing and both
  themes; the engine numbers must come from the Python answer key, so clip scripts import the
  same formulas (`tests/answer-key/`) rather than re-deriving them.
- Page weight: two themes × two codecs ≈ 1 MB per clip; acceptable for ≤ 2 clips per chapter,
  lazy-loaded.
- Risk: a clip is passive. Each clip needs a "now you" moment right after it (a guess, a knob, a
  bet) or it drifts into lecture-video territory the sponsor wants to avoid.
- 3Blue1Brown's own library (`manimgl`) is not what we use; the community edition is API-compatible
  enough that the catalogue's scene references (`_2019/diffyq`, `_2017/eoc`) are usable as storyboards,
  not as code.
